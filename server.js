/**
 * SwingVision — local YouTube clip helper server
 * ------------------------------------------------
 * Browsers cannot pull raw video frames out of an embedded YouTube player
 * (YouTube blocks canvas/pixel access from iframes for copyright reasons).
 * This tiny local server lets the SwingVision website ask for a specific
 * timestamp range of a YouTube video, downloads + trims *just that clip*
 * using yt-dlp + ffmpeg, and serves it back as a normal video file that
 * the site's existing pose-extraction pipeline can read directly.
 *
 * Everything happens on your own machine. Nothing is uploaded anywhere.
 *
 * SETUP (one time):
 *   1. Install Node.js (https://nodejs.org)
 *   2. Install yt-dlp:   https://github.com/yt-dlp/yt-dlp#installation
 *        macOS (brew):   brew install yt-dlp ffmpeg
 *        Windows:        winget install yt-dlp.yt-dlp   (and ffmpeg separately, or `winget install ffmpeg`)
 *        Linux:          sudo apt install yt-dlp ffmpeg   (or pip install yt-dlp)
 *   3. In this folder:   npm install
 *
 * RUN:
 *   npm start
 *   -> starts on http://localhost:8787
 *
 * Then open index.html in your browser (the page talks to this server
 * automatically when you paste a YouTube link).
 *
 * IMPORTANT — please respect YouTube's Terms of Service and copyright law.
 * Only fetch clips you have the right to use (e.g. your own uploads, or
 * content whose license/permissions allow this kind of personal, local
 * analysis use). This tool is intended for grabbing short reference clips
 * for your own private swing-training practice.
 */

const express = require("express");
const cors = require("cors");
const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8787;
const app = express();
app.use(cors());

// Serve the SwingVision site itself (index.html, manifest, icons, service
// worker) so you can run everything from one place with `npm start`.
// Note: camera access, PWA install, and phone motion sensors all require a
// "secure context" — that means https://, or http://localhost on the same
// machine. Opening this over a plain http://<lan-ip> address from another
// device (like your phone) will NOT be treated as secure by the browser.
// See README.md for simple options to serve this over HTTPS on your network.
app.use(express.static(__dirname));

function toSeconds(t) {
  // accepts "SS", "MM:SS", or "HH:MM:SS"
  const parts = String(t).split(":").map(Number);
  if (parts.some(isNaN)) return NaN;
  let secs = 0;
  for (const p of parts) secs = secs * 60 + p;
  return secs;
}

function fmt(secs) {
  secs = Math.max(0, Math.floor(secs));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function checkBinary(bin) {
  return new Promise((resolve) => {
    execFile(bin, ["--version"], (err) => resolve(!err));
  });
}

app.get("/health", async (req, res) => {
  const [ytdlp, ffmpeg] = await Promise.all([
    checkBinary("yt-dlp"),
    checkBinary("ffmpeg"),
  ]);
  res.json({ ok: ytdlp && ffmpeg, ytdlp, ffmpeg });
});

app.get("/clip", async (req, res) => {
  const { url, start, end } = req.query;
  if (!url || !start || !end) {
    return res.status(400).json({ error: "Missing url, start, or end query params." });
  }
  let startSec = toSeconds(start);
  let endSec = toSeconds(end);
  if (isNaN(startSec) || isNaN(endSec) || endSec <= startSec) {
    return res.status(400).json({ error: "Invalid start/end. Use SS, MM:SS or HH:MM:SS, with end after start." });
  }
  if (endSec - startSec > 30) {
    // keep clips short — this is for a single reference gesture, not a full video download
    endSec = startSec + 30;
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "swingvision-"));
  const outTemplate = path.join(workDir, "clip.%(ext)s");
  const section = `*${fmt(startSec)}-${fmt(endSec)}`;

  const args = [
    "--download-sections", section,
    "--force-keyframes-at-cuts",
    "-f", "bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b",
    "--merge-output-format", "mp4",
    "-o", outTemplate,
    "--no-playlist",
    url,
  ];

  console.log("[swingvision] fetching:", url, section);
  execFile("yt-dlp", args, { timeout: 120000 }, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr || err.message);
      cleanup(workDir);
      return res.status(500).json({
        error: "yt-dlp failed. Check that yt-dlp and ffmpeg are installed and the URL is valid/accessible.",
        detail: stderr ? stderr.slice(-800) : err.message,
      });
    }
    const files = fs.readdirSync(workDir).filter((f) => f.startsWith("clip."));
    if (!files.length) {
      cleanup(workDir);
      return res.status(500).json({ error: "Clip was not produced. Try a shorter or different range." });
    }
    const outPath = path.join(workDir, files[0]);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `inline; filename="clip.mp4"`);
    const stream = fs.createReadStream(outPath);
    stream.pipe(res);
    stream.on("close", () => cleanup(workDir));
    stream.on("error", () => cleanup(workDir));
  });
});

function cleanup(dir) {
  fs.rm(dir, { recursive: true, force: true }, () => {});
}

/* ------------------------------------------------------------------ */
/* WebSocket pairing + relay: lets the desktop page discover phones on */
/* the same network (both talking to this same server) and pair with  */
/* one to receive its motion-sensor stream ("phone as club sensor").   */
/* ------------------------------------------------------------------ */

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// clientId -> { ws, role: 'phone'|'desktop', name, pairedWith: clientId|null }
const clients = new Map();

function makeId() {
  return crypto.randomBytes(6).toString("hex");
}

function send(ws, msg) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function phoneList() {
  return [...clients.values()]
    .filter((c) => c.role === "phone")
    .map((c) => ({ id: c.id, name: c.name, paired: !!c.pairedWith }));
}

function broadcastDeviceListToDesktops() {
  const list = phoneList();
  for (const c of clients.values()) {
    if (c.role === "desktop") send(c.ws, { type: "device-list", devices: list });
  }
}

wss.on("connection", (ws) => {
  const id = makeId();
  let entry = null;

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === "hello") {
      entry = { id, ws, role: msg.role, name: msg.name || (msg.role === "phone" ? "iPhone" : "Desktop"), pairedWith: null };
      clients.set(id, entry);
      send(ws, { type: "welcome", id });
      if (entry.role === "desktop") {
        send(ws, { type: "device-list", devices: phoneList() });
      } else {
        broadcastDeviceListToDesktops();
      }
      console.log(`[swingvision] ${entry.role} connected: ${entry.name} (${id})`);
      return;
    }

    if (!entry) return; // must say hello first

    if (msg.type === "pair-request" && entry.role === "desktop") {
      const target = clients.get(msg.phoneId);
      if (!target || target.role !== "phone") {
        send(ws, { type: "pair-failed", reason: "Device not found — it may have disconnected." });
        return;
      }
      // unpair any previous partners
      if (entry.pairedWith) { const prev = clients.get(entry.pairedWith); if (prev) prev.pairedWith = null; }
      if (target.pairedWith) { const prev = clients.get(target.pairedWith); if (prev) prev.pairedWith = null; }
      entry.pairedWith = target.id;
      target.pairedWith = entry.id;
      send(entry.ws, { type: "paired", peerId: target.id, peerName: target.name, role: "desktop" });
      send(target.ws, { type: "paired", peerId: entry.id, peerName: entry.name, role: "phone" });
      broadcastDeviceListToDesktops();
      console.log(`[swingvision] paired desktop(${entry.name}) <-> phone(${target.name})`);
      return;
    }

    if (msg.type === "unpair") {
      const peer = entry.pairedWith ? clients.get(entry.pairedWith) : null;
      if (peer) { peer.pairedWith = null; send(peer.ws, { type: "unpaired" }); }
      entry.pairedWith = null;
      broadcastDeviceListToDesktops();
      return;
    }

    if (msg.type === "motion" && entry.role === "phone" && entry.pairedWith) {
      const peer = clients.get(entry.pairedWith);
      if (peer) send(peer.ws, { type: "motion", data: msg.data, t: msg.t });
      return;
    }

    if (msg.type === "control" && entry.role === "desktop" && entry.pairedWith) {
      // e.g. {type:'control', action:'record-start'|'record-stop'}
      const peer = clients.get(entry.pairedWith);
      if (peer) send(peer.ws, { type: "control", action: msg.action });
      return;
    }
  });

  ws.on("close", () => {
    if (!entry) return;
    clients.delete(id);
    if (entry.pairedWith) {
      const peer = clients.get(entry.pairedWith);
      if (peer) { peer.pairedWith = null; send(peer.ws, { type: "unpaired" }); }
    }
    broadcastDeviceListToDesktops();
    console.log(`[swingvision] ${entry.role} disconnected: ${entry.name} (${id})`);
  });
});

server.listen(PORT, () => {
  console.log(`SwingVision server running at http://localhost:${PORT}`);
  console.log(`Desktop app:      http://localhost:${PORT}/index.html`);
  console.log(`Phone companion:  http://localhost:${PORT}/phone.html  (open this on your phone, same WiFi)`);
});

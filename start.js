/**
 * SwingVision one-click launcher.
 * ---------------------------------------------------------------
 * Starts the local server AND an ngrok HTTPS tunnel together, then
 * prints a QR code you scan with your iPhone's camera to jump
 * straight to the Club Sensor page — no addresses to type.
 *
 * Run with:  npm run go
 * (requires the one-time setup in README.md: Node, ngrok installed
 * and authenticated with `ngrok config add-authtoken <token>`)
 */
const { spawn, exec } = require("child_process");
const http = require("http");

const PORT = process.env.PORT || 8787;

console.log("\nStarting SwingVision...\n");

// 1) start the app + websocket pairing server (server.js calls server.listen itself)
require("./server.js");

// 2) start an ngrok tunnel pointing at the same port
const ngrok = spawn("ngrok", ["http", String(PORT), "--log=stdout"], {
  stdio: ["ignore", "ignore", "ignore"],
});

ngrok.on("error", () => {
  console.error(
    "\nCouldn't start ngrok. Make sure it's installed (`brew install ngrok`) " +
    "and you've run `ngrok config add-authtoken <your token>` once — see README.md.\n"
  );
});

function fetchTunnelUrl(retriesLeft) {
  http
    .get("http://127.0.0.1:4040/api/tunnels", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const tunnel = (json.tunnels || []).find((t) => t.public_url.startsWith("https://"));
          if (tunnel) {
            announce(tunnel.public_url);
          } else if (retriesLeft > 0) {
            setTimeout(() => fetchTunnelUrl(retriesLeft - 1), 800);
          } else {
            console.error("\nCouldn't detect the ngrok tunnel URL. Check for ngrok errors (try running `ngrok http 8787` by itself to see them).\n");
          }
        } catch {
          if (retriesLeft > 0) setTimeout(() => fetchTunnelUrl(retriesLeft - 1), 800);
        }
      });
    })
    .on("error", () => {
      if (retriesLeft > 0) setTimeout(() => fetchTunnelUrl(retriesLeft - 1), 800);
      else console.error("\nCouldn't reach ngrok's local API — is it installed correctly?\n");
    });
}

function announce(publicUrl) {
  const desktopUrl = `http://localhost:${PORT}/index.html`;
  const phoneUrl = `${publicUrl}/phone.html`;

  console.log("=================================================");
  console.log("  SwingVision is ready");
  console.log("=================================================");
  console.log(`  On this computer:  ${desktopUrl}  (opening automatically)`);
  console.log(`  On your iPhone:    scan the QR code below with your Camera app\n`);

  try {
    require("qrcode-terminal").generate(phoneUrl, { small: true });
  } catch {
    console.log(`  (Couldn't render a QR code — just open this link instead: ${phoneUrl})`);
  }

  console.log(`\n  Phone link: ${phoneUrl}`);
  console.log("\n  Both pages will connect automatically. Just enter the 4-digit");
  console.log("  code shown on your phone into the box on the computer to pair.");
  console.log("\n  Keep this window open while you use SwingVision.");
  console.log("=================================================\n");

  exec(`open "${desktopUrl}"`, () => {}); // best-effort auto-open on macOS
}

setTimeout(() => fetchTunnelUrl(20), 1000);

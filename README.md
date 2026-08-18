# SwingVision — AI Golf Pose Trainer

## Just want the website?
Open `index.html` in your browser and allow camera access. Live skeleton tracking, the
Swing/Putting/Chip standard poses, match scoring, and "upload your own gesture" all work
with no setup — everything runs client-side.

## The easy way to use the phone / Club Sensor feature (recommended)
Once the one-time setup below is done, everyday use is just:

1. Make sure your Mac and iPhone are on the same WiFi.
2. Double-click `start.command` in this folder (or run `npm run go` in Terminal). It
   starts the server and an HTTPS tunnel together and opens the site on your Mac
   automatically.
3. On the Mac page, under **Club Sensor**, click **Connect** — a QR code pops up.
4. On your iPhone, open the **Camera app** (not Safari) and point it at the QR code on
   screen. Tap the notification banner that appears — it opens Safari and pairs
   automatically, no code to type.
5. Tap **Enable Motion Sensors** on the phone once (accept the permission prompt) and
   you'll see live accelerometer/rotation numbers on both screens.

If scanning isn't convenient, each side also shows its own 4-digit code, so you can type
either one into the other device manually instead — both ways work.

**One-time setup before that works:**
1. Install [Node.js](https://nodejs.org).
2. Install `ngrok`: `brew install ngrok` (macOS) — then sign up free at
   [ngrok.com](https://ngrok.com), grab your authtoken from the dashboard, and run
   `ngrok config add-authtoken <your token>` once in Terminal.
3. In this folder, run `npm install`.

After that, step 2 above (double-clicking `start.command`) is all you ever need to do —
no more typing addresses or copying links by hand. Each run gets a fresh QR code since
the free ngrok link changes every time you start it.

*(First time double-clicking `start.command`: macOS may show a security warning since it
wasn't downloaded from the App Store. Right-click it and choose "Open" instead of
double-clicking, just that first time.)*

## Manual / advanced version (if you'd rather not use start.command)
1. Run `npm start` in this folder (starts the site + pairing server on port 8787).
2. In a second Terminal tab, run `ngrok http 8787` and copy the `https://...ngrok-free.app`
   address it prints.
3. On your Mac, open `http://localhost:8787/index.html` — the Club Sensor box connects
   automatically in the background.
4. Click **Connect** to pop up the QR code, and scan it with your iPhone's Camera app
   (it needs to be on the ngrok/HTTPS address for motion sensors to work — the QR
   already encodes the right link). This pairs automatically.
   — Or skip the QR entirely: open `https://<your-ngrok-address>/phone.html` directly on
   the phone, then type the 4-digit code it shows into the Mac's "enter a code manually"
   box and tap **Pair**.
5. On the phone, tap **Enable Motion Sensors** and accept the permission prompt.

**Note:** motion sensor access on iOS requires HTTPS — that's what the ngrok tunnel is
for. Camera access on the Mac works fine over plain `http://localhost`.

## Want to pull reference clips from YouTube?
Browsers are blocked from reading raw video frames out of an embedded YouTube player
(that's a YouTube/copyright restriction, not something a website can work around). This
folder includes a small local helper (part of the same server) that downloads and trims
just the clip you ask for using `yt-dlp` + `ffmpeg`, then hands it to the website exactly
like an uploaded video file.

**Extra one-time setup for this feature:**
- macOS: `brew install yt-dlp ffmpeg`
- Windows: `winget install yt-dlp.yt-dlp` and `winget install ffmpeg`
- Linux: `sudo apt install yt-dlp ffmpeg` (or `pip install yt-dlp`)

**To use it:** with the server running (`start.command` or `npm start`), open the site,
go to "Standard Gesture" → "or pull a clip from YouTube," paste a link (e.g.
`https://www.youtube.com/watch?v=FEsy9_W5uXE`), set a short start/end timestamp (a few
seconds is plenty), and click **Fetch Clip**. It becomes your custom standard for
whichever shot type tab (Swing/Putting/Chip) is currently selected.

**Please only fetch clips you have the rights to use** — respect YouTube's Terms of
Service and copyright law for anything you pull in.

## Installing SwingVision as an app (PWA)
SwingVision is a Progressive Web App — you can add it to your home screen / dock and it
opens full-screen, without a browser address bar, just like a native app.

- **Desktop Chrome/Edge:** click the **"＋ Install App"** button top-right.
- **Android Chrome:** tap **"＋ Install App"**, confirm.
- **iPhone/iPad (Safari):** tap the **Share** icon, then **"Add to Home Screen"** (Safari
  requires this manual step instead of an automatic prompt).

Install and camera access both require HTTPS on another device — the ngrok tunnel from
the Club Sensor setup above covers that, or deploy the folder to a free static host like
Netlify/Vercel/GitHub Pages for a permanent `https://` link (note: a static host can't
run `server.js`, so Club Sensor pairing still needs your Mac running `start.command`
locally either way).

## Files
- `index.html` — the website (camera, skeleton tracking, scoring, advice, standard gestures, club sensor pairing)
- `phone.html` — the phone companion page (auto-connects, shows pairing code, streams motion sensor data)
- `server.js` — local server: serves the site, the WebSocket pairing/relay, and the YouTube-clip helper
- `start.js` / `start.command` — one-click launcher (server + ngrok tunnel + QR code together)
- `package.json` — dependencies and npm scripts (`npm start`, `npm run go`)

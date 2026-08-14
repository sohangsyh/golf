# SwingVision — AI Golf Pose Trainer

## Just want the website?
Open `index.html` in your browser and allow camera access. Live skeleton tracking, the
Swing/Putting/Chip standard poses, match scoring, and "upload your own gesture" all work
with no setup — everything runs client-side.

## Installing it as an app (PWA)
SwingVision is a Progressive Web App — you can add it to your home screen / dock and it
opens full-screen, without a browser address bar, just like a native app. No App Store
needed.

- **Desktop Chrome/Edge:** open the site, click the **"＋ Install App"** button in the
  top-right (or the install icon in the address bar).
- **Android Chrome:** open the site, tap **"＋ Install App"**, confirm.
- **iPhone/iPad (Safari):** open the site in Safari, tap the **Share** icon in the
  toolbar, then **"Add to Home Screen"**. (Safari doesn't support the automatic install
  prompt other browsers use, so this manual step is how Apple requires it — the app icon
  and full-screen behavior are identical once added.)

**Important — HTTPS is required for camera + install to work on another device.**
Browsers only allow camera access, motion sensors, and PWA installation on a "secure
context": that's `https://` addresses, or `http://localhost` when you're on the exact
same machine. If you open `index.html` directly as a local file or from `http://<your
computer's LAN IP>:8787` on your *phone*, some of this may be blocked.

Easiest ways to get real HTTPS for testing on your phone:
- **Quickest:** deploy this folder as a static site to a free host like
  [Netlify](https://netlify.com), [Vercel](https://vercel.com), or GitHub Pages — drag
  the folder in, you get an `https://` URL instantly, and the site (including install)
  works on any device. (The optional YouTube-clip helper server still runs locally on
  your computer and is called from the page automatically.)
- **Fully local:** use a tool like [`mkcert`](https://github.com/FiloSottile/mkcert) to
  generate a locally-trusted certificate for your computer's IP, or a tunnel like
  [`ngrok`](https://ngrok.com) (`ngrok http 8787`) to get a temporary `https://` URL that
  forwards to your local server.

On your own computer, `http://localhost:8787` already works fine for camera + install
without any of this — the HTTPS step only matters once you want your *phone* to open the
site over your home network.

## Want to pull reference clips from YouTube?
Browsers are blocked from reading raw video frames out of an embedded YouTube player
(that's a YouTube/copyright restriction, not something a website can work around). To
support "paste a YouTube link + timestamp" for a reference gesture, this folder includes
a small local helper server that downloads and trims just that clip using `yt-dlp` +
`ffmpeg`, then hands it to the website exactly like an uploaded video file.

**One-time setup:**
1. Install [Node.js](https://nodejs.org)
2. Install `yt-dlp` and `ffmpeg`:
   - macOS: `brew install yt-dlp ffmpeg`
   - Windows: `winget install yt-dlp.yt-dlp` and `winget install ffmpeg`
   - Linux: `sudo apt install yt-dlp ffmpeg` (or `pip install yt-dlp`)
3. In this folder, run: `npm install`

**Every time you want to use YouTube clips:**
1. Run: `npm start` (starts a server at `http://localhost:8787`)
2. Open `index.html` in your browser
3. Under "Standard Gesture" → "or pull a clip from YouTube", paste a link (e.g.
   `https://www.youtube.com/watch?v=FEsy9_W5uXE`), set a start time (`10:30`) and end
   time (`10:34`) — keep clips short, a few seconds is plenty for one swing position —
   and click **Fetch Clip**.
4. SwingVision downloads just that few-second range, extracts the skeleton from it, and
   sets it as your custom standard for the currently selected shot type (Swing/Putting/Chip).

If you don't run the local server, the YouTube box will simply tell you it can't connect —
everything else on the site keeps working normally.

**Please only fetch clips you have the rights to use.** This tool downloads short,
personal-use reference clips for private swing practice — respect YouTube's Terms of
Service and copyright law for anything you pull in.

## Using your phone as a club sensor
Your iPhone's accelerometer/gyroscope can stream swing speed/tempo/rotation data to the
main app over your WiFi, no cables or Bluetooth needed (Safari on iOS doesn't support
Web Bluetooth — see below for why WiFi is the path that actually works).

1. Make sure `npm start` is running on your computer (this now runs both the site and a
   small WebSocket pairing server, on the same port 8787).
2. On your computer, open the main app and find the **"Club Sensor"** box under the
   Standard Gesture panel. Click **Connect**.
3. On your phone (same WiFi), open the **Club Sensor** companion page:
   `http://<your-computer's-LAN-IP>:8787/phone.html` — or, if you set up an HTTPS tunnel
   for camera/install support (see above), the same tunnel's `/phone.html` path, e.g.
   `https://random-name.ngrok-free.app/phone.html`.
4. On the phone page, give it a name and tap **Connect**.
5. Back on your computer, the phone will now appear in the device list — click **Pair**.
6. On the phone, tap **Enable Motion Sensors** (this triggers iOS's permission prompt —
   accept it). You'll see live accelerometer/rotation numbers on both the phone and the
   computer, confirming the link is working.

That live pairing + raw sensor readout is the first step — turning that stream into full
swing-speed/tempo/plane metrics tied to your pose-matching score is a next step once
you've confirmed the connection works reliably for you.

**Note:** motion sensor access on iOS requires a secure context (HTTPS), same as camera
access — see the HTTPS section above if "Enable Motion Sensors" doesn't prompt you.

## Files
- `index.html` — the website (camera, skeleton tracking, scoring, advice, standard gestures, club sensor pairing)
- `phone.html` — the phone companion page (connects + streams motion sensor data)
- `server.js` / `package.json` — local helper: YouTube-clip fetching + WebSocket pairing/relay between phone and desktop

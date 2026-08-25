# SwingVision — AI Golf Pose Trainer

A fully static website — camera skeleton tracking, standard-gesture matching
(Swing / Putting / Chip Shot, built-in or your own uploaded video), and a phone
"Club Sensor" that streams your iPhone's accelerometer/gyroscope over the internet
via Supabase Realtime. No server to run, no Terminal, no ngrok.

## Just want the camera / pose-matching part?
Open `index.html` in any browser and allow camera access. Live skeleton tracking,
the Swing/Putting/Chip standard poses, match scoring, and "upload your own gesture"
all work immediately — nothing to configure.

## Setting up the Club Sensor (phone pairing) — one-time, ~5 minutes
Club Sensor pairs your iPhone to the site over the internet using
[Supabase](https://supabase.com)'s free Realtime service (a hosted pub/sub — think of
it as a mailbox in the cloud that both devices check). You need your own free Supabase
project; nothing to install, no code to write.

1. Go to [supabase.com](https://supabase.com), sign up free, and create a new project
   (pick any name/region/password — you won't need the password for this).
2. Once it's created, go to **Project Settings → API**. You'll see two values:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public** key (a long string starting with `eyJ...` — this one is safe to
     use in browser code, it's meant to be public)
3. Open `supabase-config.js` in this folder and paste both values in:
   ```js
   window.SWINGVISION_SUPABASE_URL = "https://abcdefgh.supabase.co";
   window.SWINGVISION_SUPABASE_ANON_KEY = "eyJ...";
   ```
4. Save, and upload everything (including the edited `supabase-config.js`) to GitHub
   Pages (or wherever you're hosting the site).

That's it — no database tables, no server code to deploy. Realtime Broadcast works
out of the box on any channel name.

## Using Club Sensor day to day
1. On your computer, open the site and click **Connect** under Club Sensor — a QR
   code pops up.
2. On your iPhone, open the **Camera app** (not Safari) and point it at the QR code.
   Tap the notification banner that appears.
3. That's it — pairing happens automatically, no code to type. Tap **Enable Motion
   Sensors** on the phone once (accept the permission prompt) and you'll see live
   accelerometer/rotation numbers on both screens.

## Taking a swing
Stand in the dashed box shown on the camera view, holding your club (or your
phone, if that's standing in for one) with both hands. Hold still for about a
second and SwingVision counts down 3-2-1-GO! and starts recording automatically
— no need to click Record yourself, though the button's still there if you'd
rather trigger it manually.

While recording, a gold swing path is drawn live over your skeleton and baked
into a downloadable video of the swing. Use the **Swing Path** button to turn
that overlay on or off.

After the swing, alongside the pose-matching score you'll see estimated Swing
Speed, Club Speed, Club Path, Attack Angle, and Face Angle. Speed and Face Angle
come from your phone's Club Sensor (connect it first for those to show); Club
Path and Attack Angle come from the camera. All of these are rough, illustrative
estimates useful for comparing one swing to the next at home — not numbers from
a calibrated launch monitor. Impact Location isn't shown, since measuring where
on the clubface you struck the ball needs a sensor mounted on the club itself,
which nothing here provides.

Your phone and computer don't even need to be on the same WiFi — both just need an
internet connection, since pairing now happens through Supabase's servers rather than
a local network connection.

**Note:** motion sensor access on iOS requires HTTPS. If you're hosting on GitHub
Pages (or Netlify/Vercel), that's automatic. If you ever test from a plain `http://`
address, "Enable Motion Sensors" won't prompt you — that's Apple's restriction, not a
bug here.

## Installing SwingVision as an app (PWA)
SwingVision is a Progressive Web App — add it to your home screen / dock and it opens
full-screen, without a browser address bar, just like a native app.

- **Desktop Chrome/Edge:** click **"＋ Install App"** top-right.
- **Android Chrome:** tap **"＋ Install App"**, confirm.
- **iPhone/iPad (Safari):** tap the **Share** icon, then **"Add to Home Screen"**.

## Files
- `index.html` — the main site (camera, skeleton tracking, scoring, advice, standard
  gestures, Club Sensor QR pairing)
- `phone.html` — the Club Sensor companion page (opens via the scanned QR link,
  auto-pairs, streams motion sensor data)
- `supabase-config.js` — your Supabase project URL + anon key (edit this, see setup above)
- `manifest.json` / `service-worker.js` / icon files — PWA install support

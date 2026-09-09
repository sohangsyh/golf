# SwingVision — AI Golf Pose Trainer

A fully static website — camera skeleton tracking, standard-gesture matching
(Swing / Putting / Chip Shot, built-in or your own uploaded video), and a phone
"Club Sensor" that streams your iPhone's accelerometer/gyroscope over the internet
via Supabase Realtime. No server to run, no Terminal, no ngrok.

## Just want the camera / pose-matching part?
Open `index.html` in any browser and allow camera access. Live skeleton tracking,
the Swing/Putting/Chip standard poses, match scoring, and "upload your own gesture"
all work immediately — nothing to configure.

The Swing/Putting/Chip reference poses shown in the right panel are extracted
from the bundled `standard-swing.mp4` / `standard-putting.mp4` / `standard-chip.mp4`
clips — the same pose-detection pipeline used for "upload your own gesture" runs
on these automatically the first time the pose model finishes loading (takes a
few seconds per clip). To change what "standard" looks like, just replace those
three video files with your own and re-upload — no code changes needed.

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
Once your phone connects as a Club Sensor, the camera turns on automatically.
Stand in the small dashed box in the middle of the camera view, holding your
club (or your phone, if that's standing in for one) with both hands. Hold still
for about a second and SwingVision counts down 3-2-1-GO! and starts recording
— no need to click Record yourself, though the button's still there if you'd
rather trigger it manually.

Recording stops on its own once it detects the swing has happened and your
hands have settled again (or after 6 seconds either way, as a fallback) — no
need to click Stop either. While recording, a red swing path is drawn live
over your skeleton and baked into a downloadable video of the swing. Use the
**Swing Path** button to turn that overlay on or off.

When your phone is connected as a Club Sensor, the path is traced from the
phone's own accelerometer/gyroscope data (the same stream used for the speed
metrics) rather than just the camera — so its shape reflects the club's
actual motion, anchored to where your hands are on screen at address. The
Club Sensor starts capturing the moment the 3-2-1 countdown begins (not just
once recording starts at "GO!"), so nothing about the swing gets missed. If
no phone is connected, the path falls back to tracking your hands with the
camera alone.

Pose tracking uses MediaPipe's "heavy" model (swapped in from "lite") for
noticeably more accurate, stable skeleton tracking — it's a bigger download
and a bit slower per frame, but worth it for swing analysis. The camera also
now watches for more than one person in frame and always keeps whichever one
is standing closest to the middle — where the address zone is — so someone
walking past in the background can't hijack the skeleton.

When the swing is done, a results popup appears, laid out in three parts: your
match score at the top, an animated skeleton comparison on the left, coaching
advice on the right, and all the numeric swing metrics along the bottom. The
comparison plays your full recorded swing motion on a loop — every frame,
not just a handful of snapshots — with your skeleton in gold over the
reference skeleton in green, and a label showing roughly which part of the
swing (address→top, top→impact, impact→finish) is playing. The reference
skeleton is time-warped phase by phase to stay locked to the same moment of
the swing as you (address together, top together, impact together, finish
together), even though your tempo and the reference video's tempo aren't
identical — so the two always read as doing the same movement, not just two
clips playing side by side at their own independent speeds. Address/top/
impact/finish are auto-detected from your wrist trajectory (smoothed a
little first, so a single jittery frame can't get mistaken for the top of
your swing) — the same detection is used everywhere it matters, so the
phases you see highlighted, the phases scored, and the phases the comparison
syncs to are always the same four moments.

Once your swing finishes and the results popup is open, standing back in the
address zone (which is normal — that's where you just were) won't silently
start a new countdown and yank the popup away — auto-recording only re-arms
once you've closed the results. This is also now covered for the brief gap
right after a swing, before the popup has actually appeared — a leftover
timer from before your swing could previously fire again in that gap,
instantly starting a phantom countdown that wiped the swing path and hid the
results the moment they showed up. Fixed at the source.

The address box you hold your hands in is now sized to exactly match the
**Enable Camera** button (measured from the real rendered button, so it
stays exact if you ever restyle it) and sits a bit lower on screen than
before, roughly where your hands fall at address.

The Club Sensor swing path also used to lag noticeably behind your actual
motion — its underlying math (turning acceleration into a position) was
tuned with time constants slower than a golf swing itself, so the path was
always trailing behind by close to a second. Sped that up considerably.

## Left-Handed / Right-Handed

The bundled reference clips demonstrate a swing toward screen-right, which
is the natural orientation for a left-handed player to copy directly. Next
to the Video/Skeleton toggles under the Standard Gesture panel there's now a
**Left-Handed / Right-Handed** button — switch it to Right-Handed and the
reference clip (and its skeleton overlay, together) flips to show a swing
toward screen-left instead, so a right-handed player has a natural direction
to copy rather than having to mentally mirror it. Your choice is remembered
for next time.

The results comparison automatically follows whichever mode is selected: it
checks which screen-direction your hands actually travel on the backswing
versus the reference's (now-possibly-mirrored) direction, and flips your
skeleton and swing path to match if needed — so the comparison always reads
as the same movement, whichever handedness mode you're in.

## Results layout and the swing path

The swing path in the results popup now grows in step with the phase-locked
comparison animation instead of appearing all at once — it's split by
address→top, top→impact, and impact→finish (using each point's actual
recording timestamp) and revealed in that same sequence as the skeletons
play through those phases, so the path and the "ADDRESS → TOP" / "TOP →
IMPACT" / "IMPACT → FINISH" label above it are always showing the same
moment of the swing.

Coaching notes, the metric bars, and the download link now live in a
right-hand column next to the skeleton comparison (instead of stacked below
everything), so the popup needs far less scrolling — the skeleton view stays
in place while that column scrolls independently if there's a lot to show.

The results comparison also now shows your swing path (in red, same as the
live view) laid over the skeletons, and auto-corrects a left/right mismatch:
the live camera view is always shown mirrored (a selfie view, so it feels
natural while swinging), but depending on how a given reference clip was
originally filmed, its own left/right isn't guaranteed to line up with that.
SwingVision checks the shoulder orientation of both skeletons at address and
flips yours if needed, so the two always overlay as the same movement
instead of looking like a mirror-image, opposite-handed swing.

The **Record** button now says which shot it'll record and compare against —
**Record Swing**, **Record Putting**, or **Record Chip Shot** — matching
whichever tab (Swing / Putting / Chip Shot) is currently selected above the
Standard Gesture panel.

Alongside the pose-matching score you'll see estimated Swing Speed, Club Speed,
Club Path, Attack Angle, and Face Angle. Speed and Face Angle come from your
phone's Club Sensor (connect it first for those to show); Club Path and Attack
Angle come from the camera. All of these are rough, illustrative estimates
useful for comparing one swing to the next at home — not numbers from a
calibrated launch monitor. Impact Location isn't shown, since measuring where
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

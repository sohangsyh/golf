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

Hold the phone with both hands directly in front of you at address, facing
the camera, tilted roughly 45° toward the ground — that's also what the
camera uses to confirm you're in position before it starts the countdown.
Because the phone travels with your two hands for the whole swing, the red
swing path is simply your tracked hand position from the camera — it's
guaranteed to always line up with your hands, live and in the results,
since it's the same measurement rather than a separate estimate. (An
earlier version tried deriving the path's shape from the phone's
accelerometer instead — double-integrating raw acceleration into a
position — but that drifts almost immediately without a full orientation
sensor, which is what caused the path to visibly lag or detach from your
hands. Tracking the hands directly avoids that problem entirely.) The Club
Sensor still starts capturing the moment the 3-2-1 countdown begins (not
just once recording starts at "GO!"), so nothing about the swing is missed
for the speed/angle metrics below, which do still use the phone's own data.

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

The results popup is laid out as three columns side by side, in that order:
your match score and the animated skeleton comparison (plus the Download
Swing Video button, right underneath it) on the left; coaching notes and the
swing-metrics numbers in the middle; and the Phase-by-Phase Match bars on
their own on the right, laid out two-across instead of one long list so
that column fits without its own scrollbar too. The popup itself is sized
for that (up to 1360px wide), so the whole thing fits a normal landscape
screen without needing to scroll.

The swing path — live on the camera and in the results comparison alike —
is your tracked hand position, full stop. See "How the swing path works"
below for why that replaced trying to derive it from the phone's
accelerometer. In the results popup specifically, it grows in step with the
phase-locked comparison animation instead of appearing all at once —
split by address→top, top→impact, and impact→finish, revealed in that same
sequence as the skeletons play through those phases, so the path and the
"ADDRESS → TOP" / "TOP → IMPACT" / "IMPACT → FINISH" label above it always
show the same moment of the swing. It's built directly from your recorded
skeleton (the same interpolated wrist position used to draw your hands,
resampled at fine steps from address up through the current instant), so it
can never disagree with where your hands actually are on screen.

Both skeletons in the comparison are drawn in a fixed, address-anchored
frame instead of being re-centered on the current pose every single frame —
that keeps the path and the skeletons always agreeing on where the body
actually is as it moves through the swing (previously the skeleton would
snap back to a re-centered stance every frame while the path, which was
already fixed, showed the real, un-stabilized motion — the two would drift
apart from each other during the swing). Playback is also now interpolated
between the real recorded frames bracketing each instant instead of
snapping to whichever one is nearest in time, since the pose model can't
sample every screen refresh — that stair-step hold-then-jump was what read
as "laggy" even though the underlying capture hadn't changed.

"Address" — the anchor the whole comparison times itself from — is now the
first real sign of takeaway motion, not just the first recorded frame.
Recording starts the instant the 3-2-1 countdown hits GO!, but players
routinely pause at address for a beat before actually starting the
backswing; treating that idle standing-still time as part of the
address→top phase used to throw off the tempo match against the reference.
Each phase (address→top, top→impact, impact→finish) is still time-warped
independently to line up with the reference's own phases regardless of how
much faster or slower you swing than the reference clip — fixing where
"address" really starts is what makes that warp land on the actual swing
instead of partly on idle time beforehand.

The comparison also auto-corrects a left/right mismatch: the live camera
view is always shown mirrored (a selfie view, so it feels natural while
swinging), but depending on how a given reference clip was originally
filmed, its own left/right isn't guaranteed to line up with that.
SwingVision checks which way your hands actually travel on the backswing
versus the reference's, and flips your skeleton and swing path to match if
needed, so the two always read as the same movement.

The live camera view's own skeleton is more stable now too: it tracks the
same detected person continuously frame to frame instead of just picking
whoever's closest to center fresh every frame (which could flip between two
overlapping detections), and holds the last good pose for a frame or two
when a detection briefly comes back low-confidence (a fast swing blurring
the arms, a wrist crossing in front of the body) instead of snapping to a
noisy guess.

The **Record** button now says which shot it'll record and compare against —
**Record Swing**, **Record Putting**, or **Record Chip Shot** — matching
whichever tab (Swing / Putting / Chip Shot) is currently selected above the
Standard Gesture panel.

## How the swing path works

Hold the phone with both hands at address, facing the camera, tilted
roughly 45° toward the ground — the camera confirms you're standing that
way (both hands together, in the address box) before it'll start the
countdown. Because the phone travels with your two hands for the entire
swing, its position and your tracked hand position are, for this app's
purposes, the same thing — so the red swing path is simply drawn from your
tracked hands, live and in the results, guaranteeing it always lines up
with them exactly, everywhere it's shown.

An earlier version instead tried to derive the path's shape from the
phone's own accelerometer — double-integrating raw acceleration
(accel → velocity → position) to estimate motion, anchored once at address.
That's the standard technique for this kind of sensor, but it has a
well-known limitation: without a full orientation sensor (a compass/
magnetometer, which phone motion APIs don't expose for this), the
double-integrated position drifts almost immediately, so what was drawn
was closer to a generic scaled swoosh near the hands than an actual path
through them — which is exactly why it could visibly detach from your two
hands holding the phone, or lag behind your real motion. Tracking the
hands directly sidesteps that limitation entirely, at the cost of not
capturing club-head extension beyond the hands (which no version of this
app has ever measured — a full 3D club-head trace needs a sensor mounted
on the club itself, not held in the hands).

The phone's accelerometer and gyroscope still matter — just for the
numbers a 2D camera genuinely can't measure on its own (see below), not
for the path's shape or position.

## Swing metrics

Alongside the pose-matching score you'll see estimated Swing Speed, Club
Speed, Club Path, and Attack Angle — all four now computed the same way:
from your tracked swing path around impact, converted from on-screen
(normalized) distance into a real-world speed using an assumed adult
shoulder width (~0.40m) as the scale reference, since the camera has no
other way to know real-world distance. These work whether or not a phone
is connected, and reflect the actual swing you made rather than a generic
formula. Face Angle is the one number that still needs the phone's
gyroscope — a 2D camera can't see the clubface twisting toward or away
from the target line — so it only shows once a Club Sensor is connected
and streaming. All of these are rough, illustrative estimates useful for
comparing one swing to the next at home — not numbers from a calibrated
launch monitor. Impact Location isn't shown, since measuring where on the
clubface you struck the ball needs a sensor mounted on the club itself,
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

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Site assets

All site artwork, the book GLB, font, and favicon live in `src/assets`.
Components import explicit asset URLs; CSS uses relative `url(...)` references.
Vite emits assets with content hashes and applies the configured deployment base.
The initial loader includes every file in `src/assets`; keep unused artwork outside this directory.
Removed eleven unreferenced legacy images and SVGs, eliminating 10,964,369 bytes from the asset set.
Keep unused artwork outside `src/assets` so blanket asset preloading does not download it.
After replacing assets, rebuild for deployment. For a subdirectory deployment, use
`npm run build -- --base=/omori/` and serve the site at that base path.

The gameplay background and three OMORI transition frames use lossless WebP with
their original dimensions and alpha preserved. Encoded with `cwebp -lossless -m 6 -exact`,
the four files total 9,114,192 bytes instead of 14,919,922 bytes (38.9% smaller).
Browser canvas comparisons of the PNG and WebP versions found identical decoded RGBA pixels.

## Section music

Tracks live in `src/music` and are imported as Vite asset URLs. Start enables sound
and begins WHITE SPACE with the descent; navbar Home restarts it. The loop stops
when door entry begins, fading out over 300ms within the 400ms camera animation.
The black dialogue has talking clips but no background music; the OMORI frame sequence is silent.
Tulip loops from the photobook reveal through gameplay, news, and the footer.
`src/music/SE_snap.ogg` plays once at the start of the photobook reveal shake,
including when the reveal is replayed after reversing the intro.
Reversing into the dialogue stops Tulip; returning to the hero restarts WHITE SPACE.
WHITE SPACE fades in over 600ms; Tulip fades in over 1500ms and out over 600ms. Fade-out finishes before pausing and
clearing the source; interrupted transitions continue from the current volume.
After the outgoing fade completes, only the current dialogue's talking clip remains.
If the browser blocks audible autoplay, the next pointer/key interaction retries;
the visible Enable music button also starts playback. Other failures show Retry music.
At each screen, run `(await import('/src/music/music-check.js')).checkMusic(phase)`
with `phase` set to `white-space`, `silent`, or `tulip` to check actual playback.
The fixed bottom-right speaker button is available on every screen. It toggles a
vertical 0–100% music slider; 0% mutes, and the selected level remains across track
changes without overriding transition fades. Arrow keys adjust volume; Escape
closes the slider and returns focus to the button. The setting lasts for this page visit.

`src/music/Talking (Text Box) OMORI SFX.mp3` contains five talking sequences.
`chatbox-1.wav` through `chatbox-5.wav` are sample-exact PCM slices in source order,
with surrounding gaps trimmed and internal timing preserved. Their durations are
0.718s, 1.043s, 1.290s, 1.064s, and 1.589s. The four dialogues use clips 2–5,
respectively. Text reveals at a constant rate over 1.043s, 1.290s, 1.064s, and
1.589s using a monotonic clock. All four clips are included in initial asset
preloading. The steady typing timer starts when playback begins, then remains
independent of subsequent audio buffering or internal gaps. If playback fails,
the text still reveals and the error is logged.
Skipping, reversing, or leaving a message stops its sound. Reduced-motion users
get instant text without the talking clip. The per-letter sound remains canceled.

## Initial loading reveal

The percentage tracks completed asset loads (not transferred bytes): all images, animated
previews, fonts, and the photobook GLB load before 100%. Images are decoded and the OMORI
font is ready before completion. Failed loads show a retry button instead of revealing
an incomplete page. Scrolling stays locked until the reveal finishes.

At 100%, a Start button appears and the view waits. Clicking Start enables music,
then the view moves down to the existing hero
over 3s with a gentler peak speed. The lightbulb wire fades in over 3s and fades toward its
upper end. The entire wire starts below the loading viewport and enters from the
bottom with the camera movement, rather than appearing in place at 100%.
Reduced-motion users skip the camera movement. The existing door/White Space
scroll sequence starts only after loading finishes.

Door entry starts as soon as scrolling reaches one hero-stage height, matching
the fully-open door frame. It does not wait for scrolling to stop or require
another wheel gesture; touch and keyboard scrolling use the same threshold.
Scrolling is locked during the zoom, then the About dialogue receives focus.
Run `src/sections/HeroSection/door-check.mjs` with a browser page on the ready
hero to verify scroll-only entry and the dialogue handoff.

Every page load or refresh runs the asset preload and waits for Start, including
when assets are already cached. Navbar OMORI replays the downward intro in place,
without reloading, a counter, or another Start button. Backward navigation from
the dialogue reverses the door zoom over 400ms before unlocking hero scrolling;
continued upward scrolling closes the door frames without replaying the loader.
Run `src/sections/Navbar/home-check.mjs` after navigation appears to verify replay.

The loader downloads every audio file in `src/music` (including snap, soundtrack
tracks, and all talking clips) and includes them in progress. Start is unavailable
until these downloads finish; download failure uses the existing loading error.
Preloading bytes does not bypass browser autoplay restrictions.

With network throttling enabled, run this while the loading counter is visible:
`(await import('/src/sections/HeroSection/loading-check.js')).checkLoading()`.
Click Start once the check reaches 100% to complete the loading/reveal check.

## Character photobook

Polaroids enlarge by 3% on pointer hover and ease back on mouse-out, alongside the existing sway. Reduced-motion users get the same scale feedback without interpolation.

Printed description/profile textures use the GPU's maximum supported anisotropic filtering. The deployment GLB stores native 590×780 pixel lettering and a cover capped at 1024px, reducing decoded book textures from 210.2 MiB to 31.7 MiB. Embedded textures use core PNG rather than requiring `EXT_texture_webp`; Polaroid pixels, geometry, and animations are preserved.
Regenerate the portable GLB with `uv run --with pillow characters/book/optimize_book.py` after exporting. A missing gameplay background no longer blocks the intro or book; the exported green back cover remains visible until the background loads. GPU context loss shows the existing reload message and disables page controls; restoration re-enables the loaded book. Run `src/sections/CharactersSection/book-deployment-check.mjs` with a browser page showing the book to check context loss and recovery.

Selected photos share a responsive 650px-wide, 75svh-tall display area, independent
of source resolution. The modal backdrop darkens the page by 28% and blurs it by
4px; the selected photo stays sharp.

Hero and Basil selected photos load directly from
`src/assets/kel-and-hero/{hero,basil}{1,2,3}.png`, matching each card's index.
Replacing these files and rebuilding updates the modal without re-exporting the GLB. Other
selected photos and all 3D card textures still use the embedded model artwork.

Run the interaction check with `node src/sections/CharactersSection/book-interaction.test.mjs`.

## Photobook back-cover background

The character book renderer replaces `Print_green_screen` with a depth-writing,
screen-aligned background window using
`src/assets/gameplay-news-section/gameplay-news-bg.webp`. It uses horizontally
centered, top-aligned `cover` sizing relative to `.characters-stage`, so tilting the book changes the
window outline without moving the background. Underlying book pages remain
occluded; the GLB itself retains its original green material.

After the seven page turns, an additional viewport of scrolling moves the closed
back cover toward the camera until it fills the viewport. The same canvas remains
pinned behind the transparent `.gameplay-news-section` as its future content
scrolls over it. There is no replacement background image or repeated copy.
The destination's minimum height follows the full image aspect ratio. Once the
zoom completes, scrolling moves down the image instead of repeating a viewport
crop. The shared parent grows with future content. Scrolling backward restores the book; reduced-motion users skip
the zoom at the end of that scroll phase.

## Gameplay previews

The four gameplay cards use animated WebP assets in `src/assets/gameplay-news-section`.
Idle cards show extracted `*-still.webp` first frames in grayscale. Fine-pointer hover
mounts the matching color loop; leaving the card, scrolling it off-screen, or hiding
the tab removes playback. Touch and reduced-motion users retain static previews.
Both stills and loops fill the fixed media frame with `object-fit: cover`, preserving
their aspect ratio and cropping excess edges without changing card height.
Fight Your Fears and Solve Mysteries use `*-cropped.webp` loops to remove baked-in
black padding, with matching cropped stills. Work Together uses its original framing.
Regenerate each still after replacing its loop with
`webpmux -get frame 1 input.webp -o input-still.webp`.
On the gameplay screen, run
`(await import('/src/sections/GameplayNewsSection/gameplay-check.js')).checkGameplay()`
to verify frame coverage, color state, and genuinely static idle assets.

## News carousel

The desktop news card is centered at 68% of the section width. At 640px and below,
it retains its stacked layout and 72px side gutters for navigation arrows.
The mobile news paragraph fills the content width; the desktop-only `36ch` cap does not apply.
The two slides display `news1.webp` (Fanart Announcement) and `news2.webp`
(Japanese release) from `src/assets/gameplay-news-section`, filling the photo frame
with aspect-ratio-preserving cropping.

Navigation uses 60px chatbox hands with 64px by 72px click targets, mirrored for previous news.
They match the dialogue's 850ms alternating ±7px horizontal bounce, pause off-screen,
and remain still with reduced motion. The wind
artwork overlaps the card's bottom-right corner, capped at 112px wide (80px on mobile). Pointer clicks spin it
six revolutions clockwise for next and counterclockwise for previous over 2.4s,
starting fast and easing to a stop. Repeated clicks retain the current orientation.
Keyboard navigation and reduced-motion preferences change news without spinning.
With the news screen open and motion enabled, run
`(await import('/src/sections/GameplayNewsSection/chime-check.js')).checkChime()`
in the browser console to check placement, direction, interruption, and settling.

## About dialogue

The chatbox opens with “OMORI is a psychological horror RPG about friendship,
memory, and the things we try to forget.” before the existing three messages.
Typing starts with the dialogue sound, without an additional fixed startup pause.
The final message uses the same steady reveal rate, without an extra ellipsis pause.

Forward scrolling cannot skip the pinned dialogue or frame sequence. Backward
wheel gestures, downward touch swipes, and ArrowUp/PageUp/Home step backward:
the six frame steps (three images repeated twice, 300ms per frame, 1.8s total),
final dialogue, earlier messages, then the hero without replaying loading.
At the top of the photobook, backward input returns to the last frame; normal
backward scrolling elsewhere in the photobook is unchanged. Reversing frames
pauses playback; click the frame or press Enter/Space to resume. Dialogue clicks
retain their existing reveal/advance behavior. Backward dialogue input retracts
the visible text at 15ms per letter before showing the previous message; clicking
during retraction resumes typing. Reduced-motion users reverse immediately.
Frame reversal needs only 20px of wheel/swipe travel and allows a wheel step every
200ms. Dialogue gestures retain the 40px threshold and 400ms wheel pacing.
Each swipe reverses one step; continuous wheel input needs no idle gap.

Run `src/sections/AboutSection/reverse-check.mjs` with a browser page on the ready
hero to verify pinning, reverse steps, playback pause/resume, and hero/book handoffs.

## Footer

The footer follows the news carousel and uses the supplied artwork in
`src/assets/footer`. `omori-wordmark.png` is the transparent wordmark extracted
from the supplied footer reference. Navigation links target the existing page
sections; Home restarts the opening sequence and the Steam badge opens the game
store page. Below 640px, branding, navigation, and character artwork stack.
On mobile, the torn paper background scales to the viewport width rather than
the stacked content height; white continues below the artwork so the wordmark
and links remain on paper.
The footer is the final scroll boundary; root overscroll is disabled to prevent
browser bounce from exposing space beyond it.

## Main navigation

The compact white navbar is available everywhere after the hero. It initially shows
over the chatbox until the first dialogue click, then follows navigation intent.
It is at most 600px wide and 64px tall (56px tall on mobile), with Character,
Gameplay, News, and Download links around the centered OMORI wordmark. Download
jumps to the footer, where the Steam download badge remains available. News links
land on a viewport-height stage with the carousel centered vertically. Gameplay
starts 12vw before the end of the book transition viewport (96px on mobile).
Gameplay anchor links use negative scroll margins to land 80px above the viewport
top on desktop and 40px above it on mobile; this intentionally crops that much
of the first row rather than merely changing its document position.
Gameplay cards stack in one column at viewport widths of 640px or less; wider
screens retain the staggered two-column layout.
Scrolling down hides it; upward wheel, touch, keyboard, or scrolling reveals it,
including scroll-locked dialogue and frame screens. Moving the mouse within 80px
of the top also reveals it. Hover-only reveals dismiss when the mouse leaves the
top region and navbar; upward-scroll reveals remain until downward movement.
A 6px movement threshold prevents scroll jitter.
Reveal takes 480ms and hide takes 420ms. Keyboard focus keeps navigation visible;
reduced-motion users get immediate visibility changes without sliding.

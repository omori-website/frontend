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
The initial loader includes every file in `src/assets`, including otherwise unused artwork.
After replacing assets, rebuild for deployment. For a subdirectory deployment, use
`npm run build -- --base=/omori/` and serve the site at that base path.

## Initial loading reveal

The percentage tracks completed asset loads (not transferred bytes): all images, animated
previews, fonts, and the photobook GLB load before 100%. Images are decoded and the OMORI
font is ready before completion. Failed loads show a retry button instead of revealing
an incomplete page. Scrolling stays locked until the reveal finishes.

At 100%, the counter holds for 400ms, then the view moves down to the existing hero
over 3s with a gentler peak speed. The lightbulb wire fades in over 3s and fades toward its
upper end. The entire wire starts below the loading viewport and enters from the
bottom with the camera movement, rather than appearing in place at 100%.
Reduced-motion users skip the camera movement. The existing door/White Space
scroll sequence starts only after loading finishes.

With network throttling enabled, run this while the loading counter is visible:
`(await import('/src/sections/HeroSection/loading-check.js')).checkLoading()`.

## Character photobook

Polaroids enlarge by 3% on pointer hover and ease back on mouse-out, alongside the existing sway. Reduced-motion users get the same scale feedback without interpolation.

Printed description/profile textures use the GPU's maximum supported anisotropic filtering to reduce text softening when pages tilt. The book assets contain rebuilt pixel lettering with consistent baselines, 30px body line spacing, and exact 3x enlargement; portraits, geometry, and page animation are preserved.

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
`src/assets/gameplay-news-section/gameplay-news-bg.png`. It uses horizontally
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
The final message retains its slower opening ellipsis.

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

The compact white navbar appears after the opening dialogue and character reveal.
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
Scrolling down hides it; scrolling up or returning to the top shows it. A 6px
movement threshold prevents jitter. Keyboard focus keeps navigation visible;
reduced-motion users get immediate visibility changes without sliding.

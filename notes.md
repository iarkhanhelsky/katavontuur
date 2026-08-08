# Development notes

## 2026-08-08 — Title screen checkpoint

- Reframed the project as **Nine Lives, One Heist**, a moonlit Halloween cat-burglary platformer.
- Replaced the prototype layout with a responsive 16:9 game shell and a polished title screen.
- Added clear keyboard and touch-ready UI affordances, HUD structure, toast messaging, and an end-screen shell.
- Removed the new page's dependency on the incomplete Phaser module chain; the upcoming game runtime will live in `js/heist-game.js` and use the Canvas API so static hosting works without a CDN.
- Added a tiny animated-canvas bootstrap so the title checkpoint is lively and every referenced file resolves before the full runtime lands.
- Preserved the existing prototype JavaScript changes in the working tree for later reference.

## 2026-08-08 — Playable heist

- Built a standalone Canvas 2D platformer runtime with a handcrafted 7,480px route through cemetery, courtyard, manor roofs, and moon vault.
- Added responsive keyboard and multitouch controls, acceleration, variable jump height, coyote time, jump buffering, pounce/dash movement, checkpoints, lives, and camera smoothing.
- Added 21 placed treasures plus a three-piece secret cache, three environment palettes, hazards, raccoon guards with flashlights, bats, particles, synthesized sound effects, and an unlockable tiny ghost accomplice.
- Added a clear win condition (collect 10 treasures and reach the vault), defeat/restart flow, evolving objectives, contextual messages, and a hidden pounce-through pumpkin cache.
- Generated and integrated `assets/backgrounds/heist-manor.webp`, a moonlit storybook manor panorama, as the parallax background. The original built-in ImageGen prompt targeted a premium gouache-style, playful-spooky 16:9 scene with a dark low-detail gameplay area and no characters or UI.
- Reused the animated cat art for the title-screen moon silhouette and moved the title layer onto the same generated manor art for a coherent first impression.
- Added a dedicated portrait-phone layout: full-viewport shell, undistorted centered playfield, safe-area-aware HUD, and large touch controls anchored below the action.
- Rebuilt the manifest and service worker around relative static paths, the new title, current game assets, and an offline-first app shell; documented the finished controls and no-build local workflow in the README.

## 2026-08-08 — QA and final polish

- Verified title and gameplay renders in the in-app browser at 1280×720 desktop, 390×844 portrait phone, 844×390 landscape phone, and an 800×450 touch-control breakpoint.
- Confirmed the browser console remains free of warnings/errors and the local static server returns every runtime, sprite, generated background, manifest, icon, and service-worker request without 404s.
- Checked the handcrafted platform sequence against the movement envelope so the main route remains traversable without requiring the optional pounce shortcut.
- Bumped the game cache version, preserved unrelated same-origin browser caches during service-worker upgrades, and added persistent unique-guard knockout tracking for the getaway summary.

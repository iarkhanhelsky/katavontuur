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

## 2026-08-08 — Sprite and texture art pass

- Generated a new storybook-gouache raccoon night guard with a brass flashlight, extracted it from a flat green key, and integrated it with subtle walk bob and stun tilt while preserving the lightweight code-drawn fallback.
- Generated four cohesive heist collectibles—wrapped candy, cat coin, lavender gem, and moon medallion—then chroma-extracted, cleaned, and repacked them into deterministic equal-width atlas cells.
- Generated a cool aubergine cobblestone texture, constructed a mirrored seamless 512px tile from it, and layered it over every platform family with restrained per-surface opacity so collision edges remain obvious.
- Tuned the in-game texture blend after visual QA so cobbles remain visible on dark platform sides while the bright collision lip stays clean and untextured.
- Removed the old procedural brick grid whenever the painted texture is available, eliminating visual competition and letting the irregular stone surface read clearly.
- Compressed all three project-bound assets to alpha-capable or opaque WebP and added them to the offline app shell under cache version `v6`.

## 2026-08-08 — Halloween scenery pass

- Generated and chroma-extracted two scale-matched scenery atlases: a tall sheet with a crooked charm tree and Victorian lamp post, plus a compact sheet with a glowing cat-faced pumpkin and crescent-paw gravestone.
- Repacked every prop into exact equal-width atlas cells and compressed the transparent sheets to WebP for deterministic Canvas cropping and lightweight delivery.
- Added six non-colliding trees across the route in a dedicated behind-platform render pass, plus a few extra pumpkins and gravestones to strengthen the cemetery-to-manor progression.
- Replaced procedural lamps, pumpkins, and gravestones with the illustrated assets while retaining the original draw paths as load-safe fallbacks.
- Added ambient lamp and pumpkin glows, a subtle secret-cache pulse, and an opening-area pumpkin so every refreshed prop family appears early; cached the new assets in offline shell version `v8`.

## 2026-08-08 — Flying creatures and hazards pass

- Generated and chroma-extracted a mischievous moonlit bat, a friendly cat-eared sheet ghost, a crooked blue-black pine, and a five-point iron spike strip in the established storybook-gouache style.
- Repacked the artwork into two deterministic, equal-cell transparent WebP atlases: `flying-atlas.webp` and `pine-spikes.webp`.
- Replaced procedural bats and the unlockable ghost companion with illustrated sprites, adding restrained squash-and-stretch motion while retaining load-safe Canvas fallbacks.
- Placed five non-colliding pines across the cemetery, rooftop, manor, and vault sections to add depth without obscuring the playable route.
- Applied the illustrated spike rail to every spike collision zone and changed the opening gap from abstract thorns to a clearly readable iron hazard.
- Added both atlases to offline shell cache version `v9` and checked their transparency, crop boundaries, and dark-background readability before integration.
- Verified the live pass at 1280×720 and 390×844: all new assets returned 200, the spike rail stayed readable at both scales, and the pine layer preserved clear platforms and touch controls.

## 2026-08-08 — Pine replacement correction

- Replaced all six remaining legacy crooked-tree scenery placements with the illustrated pine atlas instead of layering the new pines beside them.
- Alternated the pine silhouettes with horizontal mirroring and varied scales so the repeated sprite feels like a woodland rather than a row of clones.
- Bumped the offline shell to `v10` so previews immediately receive the corrected scenery layout.
- Re-verified the opening scene after activating the new service worker; no legacy foreground tree sprites remain, while the distant painted cemetery silhouettes stay part of the background panorama.

## 2026-08-08 — Background silhouette correction

- Identified the reported tree as the old code-drawn world backdrop: a translucent rectangle-and-triangle silhouette behind the opening sign, not the illustrated scenery or painted panorama.
- Removed that entire procedural silhouette layer so its geometric trunks and triangular crowns no longer show through the level artwork.
- Restored the six illustrated crooked-tree placements and kept the five newer pine placements, preserving both scenery families as requested.
- Bumped the offline shell to `v11` so the corrected background and mixed woodland arrive together in previews.
- Verified the opening scene on a fresh uncached origin: the malformed silhouette is gone, while both the crooked tree and nearby pine render behind the route correctly.

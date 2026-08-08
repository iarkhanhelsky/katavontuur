# Development notes

## 2026-08-08 — Title screen checkpoint

- Reframed the project as **Nine Lives, One Heist**, a moonlit Halloween cat-burglary platformer.
- Replaced the prototype layout with a responsive 16:9 game shell and a polished title screen.
- Added clear keyboard and touch-ready UI affordances, HUD structure, toast messaging, and an end-screen shell.
- Removed the new page's dependency on the incomplete Phaser module chain; the upcoming game runtime will live in `js/heist-game.js` and use the Canvas API so static hosting works without a CDN.
- Added a tiny animated-canvas bootstrap so the title checkpoint is lively and every referenced file resolves before the full runtime lands.
- Preserved the existing prototype JavaScript changes in the working tree for later reference.

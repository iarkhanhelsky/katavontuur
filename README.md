# Nine Lives, One Heist

A polished, mobile-friendly Halloween cat-burglar platformer for the browser. Sneak across a moonlit cemetery and manor, steal at least ten treasures, pounce past raccoon guards, discover the hidden snack cache, and escape through the moon vault.

## Play locally

The project has no build step or package dependencies. Serve the repository as static files:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Controls

- Move: `A` / `D` or arrow keys
- Jump: `W`, up arrow, or space
- Pounce: `Shift` or `K`
- Phones and tablets: on-screen multitouch controls appear automatically

The game supports portrait and landscape layouts, although landscape provides the largest play view. It can also be installed as an offline-capable PWA.

## Technical notes

- Vanilla Canvas 2D and browser APIs; no CDN runtime is required.
- A fixed 1280×720 internal playfield keeps physics deterministic while CSS scales the presentation responsively.
- Artwork combines the project’s animated cat sheets with a generated storybook manor panorama and lightweight code-rendered scenery, foes, loot, and effects.

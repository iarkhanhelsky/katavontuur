# Cat Platformer Prototype

A casual HTML5 platformer game prototype built with Phaser.js featuring a controllable cat character with sprite-based animations.

## Features

- Cat character with idle, walk, and jump animations
- Keyboard controls (Arrow keys or WASD)
- Automatic animation switching based on input state
- Physics-based movement with gravity and ground collision

## Running the Game

Due to browser CORS restrictions, you cannot open `index.html` directly with the `file://` protocol. You need to run a local web server.

### Option 1: Python Server (Recommended)

```bash
python3 server.py
```

Then open `http://localhost:8000/index.html` in your browser.

### Option 2: Python Simple Server

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html` in your browser.

### Option 3: Node.js http-server

```bash
npx http-server -p 8000
```

Then open `http://localhost:8000/index.html` in your browser.

## Controls

- **Left Arrow / A**: Move left
- **Right Arrow / D**: Move right
- **Space / Up Arrow / W**: Jump

## Assets

All sprite sheets are located in `assets/animations/cat/`:
- `Idle-Stand-01-Sheet.png` - 8 frames (32x32 each)
- `Walk-01-HeadHigh-Sheet.png` - 32 frames (32x32 each)
- `Jump-01-Sheet.png` - 5 frames (32x32 each)

## Technical Details

- **Framework**: Phaser.js 3.80.1
- **Physics**: Arcade Physics
- **Canvas Size**: 800x600
- **Animation Frame Rate**: 10-12 fps

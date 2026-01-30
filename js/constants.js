// Game Constants and Configuration

// Input delay
const IDLE_DELAY = 150; // milliseconds

// Infinite world generation constants
const GENERATION_DISTANCE = 400; // Generate platforms this far ahead
const MAX_RETAINED_COLS = 1000; // Keep this many columns (cells) when cleaning up; only remove columns left of (rightmost - MAX_RETAINED_COLS)
const MAX_WORLD_WIDTH = 100000; // Very large world bounds

// Starting position and safe zone (kept clear of obstacles and decorations)
const CAT_START_X = 100; // World X where the cat spawns
const START_ZONE_COLS = 5; // Number of columns (from 0) kept as flat ground with no obstacles

// Cat animation configuration - switch between 'cat' and 'cat2'
const CAT_TYPE = 'cat2'; // Change this to 'cat' or 'cat2' to switch animations

// Cat animation configurations
const CAT_CONFIGS = {
    'cat': {
        frameWidth: 32,
        frameHeight: 32,
        scale: 1,
        animations: {
            idle: { frames: 8, frameRate: 10, path: 'Idle-Stand-01-Sheet.png' },
            walk: { frames: 32, frameRate: 12, path: 'Walk-01-HeadHigh-Sheet.png' },
            jump: { frames: 5, frameRate: 10, path: 'Jump-01-Sheet.png' }
        }
    },
    'cat2': {
        frameWidth: 64,
        frameHeight: 64,
        scale: 1.5,
        animations: {
            idle: { frames: 7, frameRate: 8, path: 'idle.png' },
            walk: { frames: 7, frameRate: 24, path: 'walk.png' },
            jump: { frames: 7, frameRate: 8, path: 'jump.png' },
            run: { frames: 7, frameRate: 24, path: 'run.png' }
        }
    }
};

// World dimensions
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
// Scale background to fit canvas height (600px)
const BG_SCALE = CANVAS_HEIGHT / 1143; // Scale factor to fit height
const WORLD_WIDTH = 2000 * BG_SCALE; // Scaled world width
const WORLD_HEIGHT = CANVAS_HEIGHT; // World height matches canvas
const TILE_SIZE = 128 * BG_SCALE; // Scale tiles to match world

// Platforming constraints expressed in grid tiles.
// These are tuned to the cat's current jump strength and tile size so that
// generated geometry is always traversable for the player.
const MAX_UP_STEP_TILES = 2;   // Max tiles the cat can comfortably climb up
const MAX_DOWN_STEP_TILES = 3; // Max tiles the cat can safely drop down
const MAX_GAP_TILES = 2;       // Max horizontal gap (in tiles) the cat can clear

// Layer depths for rendering order (bottom to top)
const DEPTH_BACKGROUND = 0;
const DEPTH_TILES = 10;
const DEPTH_DECORATIONS = 20;
const DEPTH_PLAYER = 30;
const DEPTH_OBJECTS = 40;
const DEPTH_UI = 100;
const DEPTH_GAME_OVER = 200;
const DEPTH_DEBUG = 1000;


// Main game setup and Phaser configuration

// Global variables (shared across modules)
let cat;
let cursors;
let wasd;
let lastInputTime = 0;
let platforms;
let decorativeObjects;
let coins;
let score = 0;
let scoreText;
let currentAnimation = '';
let firstUpdate = true;
let gameScene = null; // Store reference to the scene for reloading

// Debug variables
let debugMode = false;

// Mobile joystick variables
let joystickActive = false;
let joystickX = 0;
let joystickY = 0;
let joystickBaseX = 0;
let joystickBaseY = 0;
let joystickRadius = 0;
let jumpButtonPressed = false;
let activeTouchId = null;

// Infinite world generation variables
let lastGeneratedX = 0;

// Tile adjacency system
let tileAnalyzer;
let tileConfig;
let tileRules;
let tileGrid = new Map(); // Track placed tiles: key = "x,y" -> { tileKey, sprite }
let allTileKeys = ['tile-4']; // All available tile keys
let compatibilityMatrixLoaded = false;
let tileMap = null; // Tile categorization map

// Preload function - loads all assets
function preload() {
    // Load cat animations based on CAT_TYPE
    loadCatAnimations(this);
    
    // Load coin sprite sheet
    this.load.spritesheet('coin', 'assets/animations/coin/coins.png', {
        frameWidth: 40,
        frameHeight: 44
    });
    
    // Load background image
    this.load.image('background', 'assets/world/BG.png');
    
    // Load all tile images (16 tiles)
    for (let i = 1; i <= 16; i++) {
        this.load.image(`tile-${i}`, `assets/world/Tiles/Tile (${i}).png`);
    }
    
    // Load bone tile images (4 bones)
    for (let i = 1; i <= 4; i++) {
        this.load.image(`bone-${i}`, `assets/world/Tiles/Bones (${i}).png`);
    }
    
    // Load decorative object images
    this.load.image('tree', 'assets/world/Objects/Tree.png');
    this.load.image('bush-1', 'assets/world/Objects/Bush (1).png');
    this.load.image('bush-2', 'assets/world/Objects/Bush (2).png');
    this.load.image('crate', 'assets/world/Objects/Crate.png');
    this.load.image('dead-bush', 'assets/world/Objects/DeadBush.png');
    this.load.image('arrow-sign', 'assets/world/Objects/ArrowSign.png');
    this.load.image('sign', 'assets/world/Objects/Sign.png');
    this.load.image('skeleton', 'assets/world/Objects/Skeleton.png');
    this.load.image('tombstone-1', 'assets/world/Objects/TombStone (1).png');
    this.load.image('tombstone-2', 'assets/world/Objects/TombStone (2).png');
    
    // Load tile compatibility matrix (if it exists)
    // Note: Phaser will fail silently if file doesn't exist, which is fine
    this.load.json('tile-compatibility-matrix', 'assets/tile-compatibility-matrix.json');
    this.load.json('tile-map', 'assets/tile-map.json');
}

// Create function - sets up the game scene
function create() {
    // Store scene reference for reloading
    gameScene = this;
    
    // Reset global state variables
    lastGeneratedX = 0;
    tileGrid.clear();
    firstUpdate = true;
    currentAnimation = '';
    joystickActive = false;
    joystickX = 0;
    joystickY = 0;
    jumpButtonPressed = false;
    activeTouchId = null;
    
    // Set up keyboard input first (before any early returns)
    cursors = this.input.keyboard.createCursorKeys();
    wasd = this.input.keyboard.addKeys('SPACE');
    
    // Initialize mobile joystick
    initializeMobileJoystick(this);
    
    // Initialize last input time
    lastInputTime = Date.now();
    
    // Display background image - scale to fit canvas height (600px)
    // Background is static (fixed to camera, not world)
    const bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
    bg.setScale(BG_SCALE);
    // Make background fixed to camera (doesn't scroll)
    bg.setScrollFactor(0);
    // Ensure background renders behind all world elements
    bg.setDepth(DEPTH_BACKGROUND);
    
    // Set world bounds to be very large for infinite generation
    this.physics.world.setBounds(0, 0, MAX_WORLD_WIDTH, WORLD_HEIGHT);
    
    // Create platforms static group (must be created before cat for collision)
    platforms = this.physics.add.staticGroup();
    
    // Create decorative objects group (non-physics)
    decorativeObjects = this.add.group();
    
    // Create coins physics group
    coins = this.physics.add.group();
    
    // Initialize tile system
    initializeTileSystem(this);
    
    
    // Initialize world generation - create initial platforms (MUST happen before cat creation)
    lastGeneratedX = 0;
    console.log('Generating initial world chunk...');
    console.log(`TILE_SIZE: ${TILE_SIZE}, BG_SCALE: ${BG_SCALE}, WORLD_HEIGHT: ${WORLD_HEIGHT}`);
    generateWorldChunk(this, 0, CANVAS_WIDTH * 2);
    console.log(`World generation complete. Platforms created: ${platforms.children.entries.length}`);
    if (platforms.children.entries.length > 0) {
        const firstTile = platforms.children.entries[0];
        console.log(`First tile: position (${firstTile.x}, ${firstTile.y}), body: (${firstTile.body ? `${firstTile.body.width}x${firstTile.body.height}` : 'none'})`);
    }
    
    // Create cat
    createCat(this);
    
    // Configure camera to follow cat (if cat was created)
    this.cameras.main.setBounds(0, 0, MAX_WORLD_WIDTH, WORLD_HEIGHT);
    if (cat) {
        this.cameras.main.startFollow(cat, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(100, 100);
    }
    
    // Create score display
    createScoreDisplay(this);
    
    // Create cat animations (this will also calculate bounding boxes)
    createCatAnimations(this);
    
    // Coin animation: asset provides 4-step spin; play forward then backward (yoyo) for a full spin loop
    const coinTexture = this.textures.get('coin');
    if (coinTexture && coinTexture.frameTotal >= 4) {
        this.anims.create({
            key: 'coin-spin',
            frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1, // loop forever
            yoyo: true  // repeat steps in reverse for continuous spin
        });
    }
    
    // Set initial frame - don't play animation yet
    if (cat) {
        cat.setFrame(0);
    }
    currentAnimation = '';
}


// Update function - handles game loop
function update() {
    // Ensure cursors and wasd are initialized
    if (!cursors || !wasd) {
        return;
    }
    
    // Ensure cat exists
    if (!cat) {
        return;
    }
        
    // Infinite world generation - generate ahead of cat
    const catX = cat.x;
    if (catX > lastGeneratedX - GENERATION_DISTANCE) {
        const newChunkStart = lastGeneratedX;
        const newChunkEnd = lastGeneratedX + GENERATION_DISTANCE * 2;
        generateWorldChunk(this, newChunkStart, newChunkEnd);
        lastGeneratedX = newChunkEnd;
    }
    
    // Clean up old platforms and objects behind the cat
    cleanupWorld(catX);
        
    // Start idle animation on first update frame
    if (firstUpdate) {
        firstUpdate = false;
        if (cat && this.anims.exists('idle')) {
            const idleAnim = this.anims.get('idle');
            if (idleAnim && idleAnim.frames && idleAnim.frames.length > 0) {
                cat.anims.play('idle', true);
                currentAnimation = 'idle';
                // Update body size for initial animation
                updateCatBodySize(this, 'idle');
            }
        }
    }
    
    const currentTime = Date.now();
    let leftPressed = false;
    let rightPressed = false;
    let jumpPressed = false;
    let inputDetected = false;
    
    // Check for joystick input (mobile)
    if (joystickActive) {
        const joystickThreshold = 0.3; // Dead zone threshold
        const normalizedX = joystickX / joystickRadius;
        
        if (normalizedX < -joystickThreshold) {
            leftPressed = true;
            inputDetected = true;
        } else if (normalizedX > joystickThreshold) {
            rightPressed = true;
            inputDetected = true;
        }
    }
    
    // Check for jump button (mobile)
    if (jumpButtonPressed) {
        jumpPressed = true;
        inputDetected = true;
    }
    
    // Check for input (cursors and WASD - keyboard)
    if (cursors.left.isDown || (wasd.A && wasd.A.isDown)) {
        leftPressed = true;
        inputDetected = true;
    }
    
    if (cursors.right.isDown || (wasd.D && wasd.D.isDown)) {
        rightPressed = true;
        inputDetected = true;
    }
    
    if (cursors.up.isDown || cursors.space.isDown || (wasd.W && wasd.W.isDown) || (wasd.SPACE && wasd.SPACE.isDown)) {
        jumpPressed = true;
        inputDetected = true;
    }
    
    // Update last input time if any input detected
    if (inputDetected) {
        lastInputTime = currentTime;
    }
    
    // Movement logic
    const moveSpeed = 160;
    
    if (leftPressed) {
        cat.body.setVelocityX(-moveSpeed);
    } else if (rightPressed) {
        cat.body.setVelocityX(moveSpeed);
    } else {
        cat.body.setVelocityX(0);
    }
    
    // Jump logic - only jump if on ground
    if (jumpPressed && cat.body.touching.down) {
        cat.body.setVelocityY(-500); // Increased jump velocity for higher jumps
    }
    
    // Animation state management
    const isGrounded = cat.body.touching.down;
    const timeSinceLastInput = currentTime - lastInputTime;
    const shouldBeIdle = timeSinceLastInput > IDLE_DELAY && !leftPressed && !rightPressed;
    
    let targetAnimation = currentAnimation;
    
    // Determine target animation based on state
    if (!isGrounded) {
        // In air - play jump animation
        targetAnimation = 'jump';
    } else if (leftPressed || rightPressed) {
        // Moving - play walk animation
        targetAnimation = 'walk';
    } else if (shouldBeIdle) {
        // No input for delay period - play idle
        targetAnimation = 'idle';
    }
    
    // Switch animation if different from current
    if (targetAnimation !== currentAnimation && this.anims.exists(targetAnimation)) {
        const anim = this.anims.get(targetAnimation);
        if (anim && anim.frames && anim.frames.length > 0) {
            try {
                cat.anims.play(targetAnimation, true);
                currentAnimation = targetAnimation;
                // Update body size based on new animation's bounding box
                updateCatBodySize(this, targetAnimation);
            } catch (error) {
                console.error('Error playing animation:', targetAnimation, error);
            }
        }
    }
    
    // Sprite flipping based on movement direction
    if (leftPressed) {
        cat.setFlipX(true);
    } else if (rightPressed) {
        cat.setFlipX(false);
    }
    // Note: We keep the last flip direction when idle/jumping
}

// Main game config
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false // Debug rendering handled manually
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Start the game
const game = new Phaser.Game(config);

// Initialize reload button (called after DOM is ready)
initializeReloadButton();

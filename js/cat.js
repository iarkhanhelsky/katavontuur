// Cat sprite and animation management

// Update cat body size based on current animation
// Uses sprite frame size as bounding box
function updateCatBodySize(scene, animationKey) {
    if (!cat || !cat.body) return;
    
    const config = CAT_CONFIGS[CAT_TYPE];
    // Use UNSCALED frame dimensions - Phaser applies sprite scale automatically
    const frameWidth = config.frameWidth;
    const frameHeight = config.frameHeight;
    
    // Use full frame size as bounding box (unscaled - Phaser handles scaling)
    cat.body.setSize(frameWidth, frameHeight);
    cat.body.drawRect(0, 0, frameWidth, frameHeight);
    cat.body.setOffset(0, 0);
    // Do NOT call updateFromGameObject() - it would overwrite our manual body size settings
}

// Cached body/bounds info per cat type (derived from sprite transparency)
let CAT_BODY_CONFIGS = {};

// Compute the tightest non-transparent bounds for the current CAT_TYPE
// by scanning all frames of all animations once and caching the result.
function computeCatBodyConfig(scene) {
    const typeConfig = CAT_CONFIGS[CAT_TYPE];
    if (!typeConfig) {
        console.warn(`computeCatBodyConfig: No CAT_CONFIGS entry for type ${CAT_TYPE}`);
        return null;
    }

    // Return cached result if available
    if (CAT_BODY_CONFIGS[CAT_TYPE]) {
        return CAT_BODY_CONFIGS[CAT_TYPE];
    }

    const frameWidth = typeConfig.frameWidth;
    const frameHeight = typeConfig.frameHeight;

    let minX = frameWidth;
    let minY = frameHeight;
    let maxX = -1;
    let maxY = -1;
    let anyOpaquePixel = false;

    // Scan all animations and frames for this cat type
    for (const [animKey, animConfig] of Object.entries(typeConfig.animations)) {
        const textureKey = `cat-${animKey}`;

        if (!scene.textures.exists(textureKey)) {
            console.warn(`computeCatBodyConfig: texture ${textureKey} not loaded; skipping`);
            continue;
        }

        for (let frameIndex = 0; frameIndex < animConfig.frames; frameIndex++) {
            for (let y = 0; y < frameHeight; y++) {
                for (let x = 0; x < frameWidth; x++) {
                    const color = scene.textures.getPixel(x, y, textureKey, frameIndex);
                    if (color && color.alpha > 0) {
                        anyOpaquePixel = true;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
        }
    }

    let bounds;

    if (!anyOpaquePixel) {
        console.warn('computeCatBodyConfig: No non-transparent pixels found for cat textures; using full frame as body');
        bounds = {
            offsetX: 0,
            offsetY: 0,
            width: frameWidth,
            height: frameHeight,
            frameWidth,
            frameHeight
        };
    } else {
        bounds = {
            offsetX: minX,
            offsetY: minY,
            width: (maxX - minX + 1),
            height: (maxY - minY + 1),
            frameWidth,
            frameHeight
        };
    }

    const topBorder = bounds.offsetY;
    const leftBorder = bounds.offsetX;
    const rightBorder = bounds.frameWidth - (bounds.offsetX + bounds.width);
    const bottomBorder = bounds.frameHeight - (bounds.offsetY + bounds.height);

    // Log for debugging and to understand transparent border size
    console.log('[CatBody] Computed sprite bounds for', CAT_TYPE, {
        frameWidth: bounds.frameWidth,
        frameHeight: bounds.frameHeight,
        offsetX: bounds.offsetX,
        offsetY: bounds.offsetY,
        width: bounds.width,
        height: bounds.height,
        transparentBorder: {
            top: topBorder,
            right: rightBorder,
            bottom: bottomBorder,
            left: leftBorder
        }
    });

    CAT_BODY_CONFIGS[CAT_TYPE] = bounds;
    return bounds;
}

// Override: update cat body size based on current animation
// Uses detected non-transparent bounds as the physics body box
function updateCatBodySize(scene, animationKey) {
    if (!cat || !cat.body) return;

    const typeConfig = CAT_CONFIGS[CAT_TYPE];
    if (!typeConfig) return;

    const bounds = computeCatBodyConfig(scene);

    if (bounds) {
        // Use UNSCALED bounds - Phaser applies sprite scale automatically
        cat.body.setSize(bounds.width, bounds.height);
        cat.body.setOffset(bounds.offsetX, bounds.offsetY);

        // If a custom debug drawer is wired to drawRect, update it as well
        if (typeof cat.body.drawRect === 'function') {
            cat.body.drawRect(0, 0, bounds.width, bounds.height);
        }
    } else {
        // Fallback: use full frame size
        const frameWidth = typeConfig.frameWidth;
        const frameHeight = typeConfig.frameHeight;
        cat.body.setSize(frameWidth, frameHeight);
        cat.body.setOffset(0, 0);
        if (typeof cat.body.drawRect === 'function') {
            cat.body.drawRect(0, 0, frameWidth, frameHeight);
        }
    }

    // Do NOT call updateFromGameObject() - it would overwrite our manual body size settings
}

// Load cat animations based on CAT_TYPE
function loadCatAnimations(scene) {
    const config = CAT_CONFIGS[CAT_TYPE];
    const basePath = `assets/animations/${CAT_TYPE}/`;
    
    // Load all animation sprite sheets
    for (const [animKey, animConfig] of Object.entries(config.animations)) {
        const textureKey = `cat-${animKey}`;
        scene.load.spritesheet(textureKey, basePath + animConfig.path, {
            frameWidth: config.frameWidth,
            frameHeight: config.frameHeight
        });
    }
}

// Create cat animations based on CAT_TYPE
function createCatAnimations(scene) {
    const config = CAT_CONFIGS[CAT_TYPE];
    
    // Helper function to check if textures are ready
    const checkAndCreateAnimations = () => {
        let allTexturesReady = true;
        for (const [animKey, animConfig] of Object.entries(config.animations)) {
            const textureKey = `cat-${animKey}`;
            const texture = scene.textures.get(textureKey);
            if (!texture || !texture.source || !texture.source[0] || !texture.source[0].image) {
                allTexturesReady = false;
                break;
            }
        }
        
        if (!allTexturesReady) {
            // Retry after a short delay
            scene.time.delayedCall(100, checkAndCreateAnimations);
            return;
        }
        
        // All textures are ready, create animations
        for (const [animKey, animConfig] of Object.entries(config.animations)) {
            const textureKey = `cat-${animKey}`;
            const texture = scene.textures.get(textureKey);
            
            if (!texture) {
                console.warn(`Texture ${textureKey} not found`);
                continue;
            }
            
            // Create animation
            if (texture.frameTotal >= animConfig.frames) {
                scene.anims.create({
                    key: animKey,
                    frames: scene.anims.generateFrameNumbers(textureKey, { 
                        start: 0, 
                        end: animConfig.frames - 1 
                    }),
                    frameRate: animConfig.frameRate,
                    repeat: -1 // loop forever
                });
            }
        }
        
        // Update body size for initial animation
        if (cat && cat.body) {
            updateCatBodySize(scene, 'idle');
        }
    };
    
    // Start checking after a short delay
    scene.time.delayedCall(100, checkAndCreateAnimations);
}

// Create cat sprite and set up physics
function createCat(scene) {
    // Check if cat textures loaded successfully before creating cat
    const idleTextureKey = `cat-idle`;
    if (!scene.textures.exists(idleTextureKey)) {
        console.error(`Failed to load ${idleTextureKey} texture - cat will not be created`);
        return;
    }
    
    // Create cat sprite using idle sprite sheet as base
    // Position cat on ground level so its physics body (feet) rests on top of the ground tile.
    // Ground tile top is at WORLD_HEIGHT - TILE_SIZE
    const config = CAT_CONFIGS[CAT_TYPE];
    const groundTileTop = WORLD_HEIGHT - TILE_SIZE;

    // Use detected non-transparent bounds to determine where the feet are inside the frame
    const bounds = computeCatBodyConfig(scene);
    const frameHeight = config.frameHeight;
    const scale = config.scale;

    // If bounds detection failed, fall back to using the full frame
    const bodyOffsetY = bounds ? bounds.offsetY : 0;
    const bodyHeight = bounds ? bounds.height : frameHeight;

    // With origin at center (0.5, 0.5), sprite.y is the center of the full frame.
    // Body bottom in world coords = sprite.y - frameHeight*scale/2 + bodyOffsetY*scale + bodyHeight*scale
    // Solve for sprite.y so that body bottom equals groundTileTop.
    const catStartY = groundTileTop + (frameHeight * scale) / 2 - (bodyOffsetY + bodyHeight) * scale;
    
    cat = scene.physics.add.sprite(100, catStartY, 'cat-idle');
    
    // Scale cat based on configuration
    cat.setScale(config.scale);
    // Ensure player renders above tiles and decorations but below objects and UI
    cat.setDepth(DEPTH_PLAYER);
    
    // Enable physics properties
    cat.setCollideWorldBounds(false); // Camera will handle bounds
    cat.setBounce(0);
    cat.body.setGravityY(300);
    
    // Set initial body size using detected bounds (unscaled dimensions)
    // Phaser's body.setSize() takes dimensions in the sprite's local coordinate system,
    // which then gets scaled by the sprite's scale factor automatically.
    const initialBodyWidth = bounds ? bounds.width : config.frameWidth;
    const initialBodyHeight = bodyHeight;
    
    cat.body.setSize(initialBodyWidth, initialBodyHeight);
    cat.body.setOffset(bounds ? bounds.offsetX : 0, bodyOffsetY);
    
    // Ensure body is active and collides properly
    cat.body.setImmovable(false);
    cat.body.setCollideWorldBounds(false);
    
    // Do NOT call updateFromGameObject() - it would overwrite our manual body size settings
    
    // Debug: Log body setup
    console.log(`Cat created:`);
    console.log(`  Position: (${cat.x}, ${cat.y})`);
    console.log(`  Body size: ${initialBodyWidth}x${initialBodyHeight}`);
    console.log(`  Body position: (${cat.body.x}, ${cat.body.y})`);
    console.log(`  Body bounds: x=${cat.body.x}, y=${cat.body.y}, w=${cat.body.width}, h=${cat.body.height}`);
    console.log(`  Ground tile top: ${groundTileTop}, cat body bottom is at: ${cat.body.y + cat.body.height}`);
    
    // Set collision between cat and platforms
    // Use a callback to ensure collision is working
    scene.physics.add.collider(cat, platforms, null, null, scene);
    console.log(`Collision set up between cat and ${platforms.children.entries.length} platforms`);
    
    // Verify collision is working by checking if cat can detect platforms
    scene.time.delayedCall(100, () => {
        if (cat && cat.body) {
            console.log(`Cat collision check - body active: ${cat.body.enable}, touching down: ${cat.body.touching.down}`);
            console.log(`Cat body: x=${cat.body.x.toFixed(1)}, y=${cat.body.y.toFixed(1)}, w=${cat.body.width.toFixed(1)}, h=${cat.body.height.toFixed(1)}`);
            if (platforms.children.entries.length > 0) {
                const firstPlatform = platforms.children.entries[0];
                if (firstPlatform.body) {
                    console.log(`First platform body: x=${firstPlatform.body.x.toFixed(1)}, y=${firstPlatform.body.y.toFixed(1)}, w=${firstPlatform.body.width.toFixed(1)}, h=${firstPlatform.body.height.toFixed(1)}`);
                }
            }
        }
    });
    
    // Set up overlap detection for coin collection
    scene.physics.add.overlap(cat, coins, collectCoin, null, scene);
   
    
    // Set initial frame - don't play animation yet
    cat.setFrame(0);
}

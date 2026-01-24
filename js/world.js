// World generation and tile system

// Initialize tile adjacency system
async function initializeTileSystem(scene) {
    // Build list of all tile keys (excluding bones - they are decorative overlays only)
    allTileKeys = ['tile-4'];
    // for (let i = 1; i <= 16; i++) {
    //     allTileKeys.push(`tile-${i}`);
    // }
    // // Bones are not included in allTileKeys - they are decorative overlays only
    
    // // Initialize tile system components
    // tileAnalyzer = new TileAnalyzer(scene);
    // tileConfig = new TileConfig();
    // tileRules = new TileRules(tileAnalyzer, tileConfig);
    
    // // Try to load pre-computed compatibility matrix
    // try {
    //     if (scene.cache.json.exists('tile-compatibility-matrix')) {
    //         const matrixData = scene.cache.json.get('tile-compatibility-matrix');
    //         if (matrixData && Object.keys(matrixData).length > 0) {
    //             tileRules.loadMatrix(matrixData);
    //             compatibilityMatrixLoaded = true;
    //             console.log('Loaded tile compatibility matrix from asset');
    //         }
    //     }
    // } catch (e) {
    //     console.log('Compatibility matrix not found, will generate on first use');
    // }
    
    // // Load tile categorization map
    // try {
    //     if (scene.cache.json.exists('tile-map')) {
    //         const mapData = scene.cache.json.get('tile-map');
    //         if (mapData && mapData.tiles) {
    //             tileMap = mapData.tiles;
    //             console.log('Loaded tile categorization map');
    //             console.log(`Categories: ${Object.keys(mapData.summary.category_counts).join(', ')}`);
    //         }
    //     }
    // } catch (e) {
    //     console.log('Tile map not found, categorization will not be used');
    // }
    
    // // If matrix not loaded, generate it asynchronously
    // if (!compatibilityMatrixLoaded) {
    //     console.log('Compatibility matrix not found, will generate on first use');
    // }
}


// Get grid key from world coordinates
function getGridKey(x, y) {
    const gridX = Math.floor(x / TILE_SIZE);
    const gridY = Math.floor(y / TILE_SIZE);
    return `${gridX},${gridY}`;
}

// Get tile at grid position
function getTileAtGrid(gridX, gridY) {
    const key = `${gridX},${gridY}`;
    return tileGrid.get(key);
}

// Get compatible tile for a position
function getCompatibleTile() {
    return `tile-2`;
}

// Coin collection handler
function collectCoin(cat, coin) {
    // Increment score
    score++;
    // Update score display
    if (scoreText) {
        scoreText.setText('Score: ' + score);
    }
    // Remove coin
    coin.destroy();
}

// Generate a chunk of the world
function generateWorldChunk(scene, startX, endX) {
    const groundY = WORLD_HEIGHT - TILE_SIZE / 2; // Center Y for ground tiles
    const groundTop = WORLD_HEIGHT - TILE_SIZE; // Top of ground platform
    
    // Generate ground tiles with adjacency rules
    for (let x = startX; x < endX; x += TILE_SIZE) {
        const gridX = Math.floor(x / TILE_SIZE);
        const gridY = Math.floor(groundY / TILE_SIZE);
        
        // Get compatible tile based on adjacent tiles
        const tileKey = getCompatibleTile(gridX, gridY, true);
        
        // Verify tile texture exists before creating
        if (!scene.textures.exists(tileKey)) {
            console.error(`Tile texture ${tileKey} does not exist! Skipping tile at ${x}`);
            continue;
        }
        
        try {
            const tile = platforms.create(x + TILE_SIZE / 2, groundY, tileKey);
            if (!tile) {
                console.error(`Failed to create tile ${tileKey} at position ${x + TILE_SIZE / 2}, ${groundY}`);
                continue;
            }
            tile.setScale(BG_SCALE);
            // For static bodies, body size should be in world units (not scaled)
            // Since tile is scaled by BG_SCALE, the body size should be the original tile size
            const tileBodyWidth = TILE_SIZE / BG_SCALE;
            const tileBodyHeight = TILE_SIZE / BG_SCALE;
            tile.setSize(tileBodyWidth, tileBodyHeight);
            // Ensure tiles render above background but below decorations, player, and objects
            tile.setDepth(DEPTH_TILES);
            
            // Ensure tile body is properly configured
            // Note: Static bodies are already immovable, no need to call setImmovable
            if (tile.body) {
                tile.body.updateFromGameObject();
                // #region agent log
                if (x < 200) { fetch('http://127.0.0.1:7242/ingest/5befa2a4-a6cf-4657-9b30-533cfeea233c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'world.js:tile-create',message:'Ground tile body created',data:{tileX:x+TILE_SIZE/2,tileY:groundY,bodyX:tile.body.x,bodyY:tile.body.y,bodyW:tile.body.width,bodyH:tile.body.height,spriteW:tile.width,spriteH:tile.height,scale:BG_SCALE,TILE_SIZE:TILE_SIZE},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,E'})}).catch(()=>{}); }
                // #endregion
            } else {
                console.error(`Tile ${tileKey} at ${x} has no physics body!`);
            }
        
            // Track tile in grid
            const gridKey = getGridKey(x + TILE_SIZE / 2, groundY);
            tileGrid.set(gridKey, { tileKey: tileKey, sprite: tile, gridX: gridX, gridY: gridY });
        } catch (error) {
            console.error(`Error creating tile ${tileKey} at ${x}:`, error);
        }
        
        // Add bones on top of ground tiles with 25% probability
        if (Math.random() < 0.25) {
            const boneIndex = Math.floor(Math.random() * 4) + 1; // Random bone 1-4
            const boneKey = `bone-${boneIndex}`;
            const boneY = groundTop; // Position at top of ground tile
            const bone = scene.add.image(x + TILE_SIZE / 2, boneY, boneKey);
            bone.setScale(BG_SCALE);
            bone.setScrollFactor(1); // Scroll with world
            // Decorative bones render above tiles but below player and objects
            bone.setDepth(DEPTH_DECORATIONS);
            decorativeObjects.add(bone);
        }
        
        // Add coins above ground tiles with 15% probability
        if (Math.random() < 0.15) {
            const coinY = groundTop - 50; // Position above ground
            const coin = coins.create(x + TILE_SIZE / 2, coinY, 'coin');
            coin.setScale(BG_SCALE);
            coin.setScrollFactor(1); // Scroll with world
            // Coins are objects rendered above player and decorations
            coin.setDepth(DEPTH_OBJECTS);
            // Set coin body size (smaller than sprite for easier collection)
            coin.body.setSize(30 * BG_SCALE, 30 * BG_SCALE);
            // Make coin immovable and disable gravity so it doesn't fall
            coin.body.setImmovable(true);
            coin.body.setAllowGravity(false);
            // Play coin animation
            if (scene.anims.exists('coin-spin')) {
                coin.anims.play('coin-spin', true);
            }
        }
    }
    
    // Generate floating platforms (procedurally)
    // Generate platforms every 200-400 pixels
    for (let x = startX; x < endX; x += Math.random() * 200 + 200) {
        // 30% chance to generate a platform at this position
        if (Math.random() < 0.3) {
            const platformWidth = Math.floor(Math.random() * 3) + 2; // 2-4 tiles wide
            const platformHeight = Math.random() * 200 + 100; // 100-300px above ground
            
            for (let i = 0; i < platformWidth; i++) {
                const tileX = x + (i * TILE_SIZE) + TILE_SIZE / 2;
                const tileY = (groundTop - platformHeight) + TILE_SIZE / 2;
                const gridX = Math.floor(tileX / TILE_SIZE);
                const gridY = Math.floor(tileY / TILE_SIZE);
                
                // Get compatible tile based on adjacent tiles (horizontal only for platforms)
                const tileKey = getCompatibleTile(gridX, gridY, false);
                
                const tile = platforms.create(tileX, tileY, tileKey);
                tile.setScale(BG_SCALE);
                tile.setSize(TILE_SIZE / BG_SCALE, TILE_SIZE / BG_SCALE);
                // Ensure tile body is properly configured
                // Note: Static bodies are already immovable, no need to call setImmovable
                if (tile.body) {
                    tile.body.updateFromGameObject();
                }
                // Floating platforms use the same tile layer depth
                tile.setDepth(DEPTH_TILES);
                
                // Track tile in grid
                const gridKey = getGridKey(tileX, tileY);
                tileGrid.set(gridKey, { tileKey: tileKey, sprite: tile, gridX: gridX, gridY: gridY });
            }
            
            // Occasionally add decorative objects on platforms
            if (Math.random() < 0.2) {
                const objX = x + (platformWidth * TILE_SIZE / 2);
                const objY = groundTop - platformHeight;
                const objType = Math.random() < 0.5 ? 'crate' : 'sign';
                const obj = scene.add.image(objX, objY, objType);
                obj.setScale(BG_SCALE);
                obj.setScrollFactor(1); // Scroll with world
                // Platform decorations render above tiles but below player and objects
                obj.setDepth(DEPTH_DECORATIONS);
                decorativeObjects.add(obj);
            }
            
            // Add coins on platforms with 20% probability
            if (Math.random() < 0.2) {
                const coinX = x + (platformWidth * TILE_SIZE / 2);
                const coinY = (groundTop - platformHeight) - 50; // Position above platform
                const coin = coins.create(coinX, coinY, 'coin');
                coin.setScale(BG_SCALE);
                coin.setScrollFactor(1); // Scroll with world
                // Coins on platforms share the same object layer depth
                coin.setDepth(DEPTH_OBJECTS);
                // Set coin body size (smaller than sprite for easier collection)
                coin.body.setSize(30 * BG_SCALE, 30 * BG_SCALE);
                // Make coin immovable and disable gravity so it doesn't fall
                coin.body.setImmovable(true);
                coin.body.setAllowGravity(false);
                // Play coin animation
                if (scene.anims.exists('coin-spin')) {
                    coin.anims.play('coin-spin', true);
                }
            }
        }
    }
    
    // Occasionally add decorative objects on ground
    for (let x = startX; x < endX; x += Math.random() * 300 + 200) {
        if (Math.random() < 0.15) {
            const objTypes = ['bush-1', 'bush-2', 'dead-bush', 'tombstone-1', 'tombstone-2', 'skeleton'];
            const objType = objTypes[Math.floor(Math.random() * objTypes.length)];
            const obj = scene.add.image(x, groundTop - (objType === 'tree' ? 120 : 40), objType);
            obj.setScale(BG_SCALE);
            obj.setScrollFactor(1); // Scroll with world
            // Ground decorations render above tiles but below player and objects
            obj.setDepth(DEPTH_DECORATIONS);
            decorativeObjects.add(obj);
        }
    }
}

// Clean up old platforms and objects
function cleanupWorld(catX) {
    const cleanupX = catX - CLEANUP_DISTANCE;
    
    // Remove platforms behind the cat
    platforms.children.entries.forEach(tile => {
        if (tile.x < cleanupX) {
            // Remove from grid tracking
            const gridKey = getGridKey(tile.x, tile.y);
            tileGrid.delete(gridKey);
            
            platforms.remove(tile, true, true);
        }
    });
    
    // Remove decorative objects behind the cat
    decorativeObjects.children.entries.forEach(obj => {
        if (obj.x < cleanupX) {
            decorativeObjects.remove(obj, true, true);
        }
    });
    
    // Remove coins behind the cat
    coins.children.entries.forEach(coin => {
        if (coin.x < cleanupX) {
            coins.remove(coin, true, true);
        }
    });
}

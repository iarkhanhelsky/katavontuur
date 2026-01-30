// World generation and tile system

// Grid and column tracking for the infinite world
let surfaceByCol = new Map();   // col -> main walkable surface row (or null for gaps)
let columnStates = new Map();   // col -> { surfaceRow, features: FeatureType[] }

// Feature types for columnStates entries
const FeatureType = {
    GROUND: 'GROUND',
    PLATFORM: 'PLATFORM',
    GAP: 'GAP',
    PIT: 'PIT',
    STAIR_UP: 'STAIR_UP',
    STAIR_DOWN: 'STAIR_DOWN'
};

// Ground row info (computed once tiles/world are configured)
let DEFAULT_GROUND_ROW = null;
let MAX_ROW_INDEX = null;

// Initialize tile adjacency system and grid bookkeeping
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

    // Initialize grid-derived constants and clear column state
    if (DEFAULT_GROUND_ROW === null) {
        // Default ground row is based on the original groundY used for tiles
        DEFAULT_GROUND_ROW = worldYToRow(WORLD_HEIGHT - TILE_SIZE / 2);
        MAX_ROW_INDEX = DEFAULT_GROUND_ROW;
    }
    surfaceByCol.clear();
    columnStates.clear();
}


// Get grid key from world coordinates
function getGridKey(x, y) {
    const gridX = Math.floor(x / TILE_SIZE);
    const gridY = Math.floor(y / TILE_SIZE);
    return `${gridX},${gridY}`;
}

// Basic world/grid coordinate helpers
function worldXToCol(x) {
    return Math.floor(x / TILE_SIZE);
}

function worldYToRow(y) {
    return Math.floor(y / TILE_SIZE);
}

function colToWorldX(col) {
    return col * TILE_SIZE + TILE_SIZE / 2;
}

function rowToWorldY(row) {
    return row * TILE_SIZE + TILE_SIZE / 2;
}

function getCellKey(col, row) {
    return `${col},${row}`;
}

// Get tile at grid position
function getTileAtGrid(gridX, gridY) {
    const key = `${gridX},${gridY}`;
    return tileGrid.get(key);
}

// Grid occupancy helpers (solid tiles only)
function isCellFree(col, row) {
    return !tileGrid.has(getCellKey(col, row));
}

function setCell(col, row, tileKey, sprite) {
    const key = getCellKey(col, row);
    tileGrid.set(key, { tileKey, sprite, gridX: col, gridY: row });
}

function getTileAtCell(col, row) {
    return tileGrid.get(getCellKey(col, row));
}

// Column/surface helpers
function setSurfaceRow(col, row) {
    surfaceByCol.set(col, row);
}

function getSurfaceRow(col) {
    return surfaceByCol.get(col);
}

function getOrDefaultSurfaceRow(col) {
    const row = surfaceByCol.get(col);
    if (row === undefined || row === null) {
        return DEFAULT_GROUND_ROW;
    }
    return row;
}

function setColumnState(col, surfaceRow, features) {
    columnStates.set(col, {
        surfaceRow: surfaceRow,
        features: features || []
    });
}

function getColumnState(col) {
    return columnStates.get(col);
}

function clampRow(row) {
    if (row === null || row === undefined) {
        row = DEFAULT_GROUND_ROW;
    }
    if (row < 0) return 0;
    if (MAX_ROW_INDEX !== null && row > MAX_ROW_INDEX) {
        return MAX_ROW_INDEX;
    }
    return row;
}

// Tile placement helpers (all solid tiles go through these)
function placeGroundTile(scene, col, row) {
    row = clampRow(row);
    if (!isCellFree(col, row)) {
        return getTileAtCell(col, row)?.sprite || null;
    }

    const x = colToWorldX(col);
    const y = rowToWorldY(row);
    const tileKey = getCompatibleTile(col, row, true);

    if (!scene.textures.exists(tileKey)) {
        console.error(`Tile texture ${tileKey} does not exist! Skipping tile at col=${col}, row=${row}`);
        return null;
    }

    try {
        const tile = platforms.create(x, y, tileKey);
        if (!tile) {
            console.error(`Failed to create tile ${tileKey} at position ${x}, ${y}`);
            return null;
        }
        tile.setScale(BG_SCALE);
        const tileBodyWidth = TILE_SIZE / BG_SCALE;
        const tileBodyHeight = TILE_SIZE / BG_SCALE;
        tile.setSize(tileBodyWidth, tileBodyHeight);
        tile.setDepth(DEPTH_TILES);

        if (tile.body) {
            tile.body.updateFromGameObject();
        } else {
            console.error(`Tile ${tileKey} at col=${col}, row=${row} has no physics body!`);
        }

        setCell(col, row, tileKey, tile);
        return tile;
    } catch (error) {
        console.error(`Error creating tile ${tileKey} at col=${col}, row=${row}:`, error);
        return null;
    }
}

function placePlatformTile(scene, col, row) {
    // For now platforms share the same implementation as ground tiles.
    return placeGroundTile(scene, col, row);
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

// Column pattern definitions for path generation
const COLUMN_PATTERNS = [
    {
        name: 'flat',
        width: 1,
        build(prevSurfaceRow, startCol) {
            const baseRow = clampRow(prevSurfaceRow);
            return [
                {
                    col: startCol,
                    surfaceRow: baseRow,
                    features: [FeatureType.GROUND]
                }
            ];
        }
    },
    {
        // Two-column staircase going up by 1 row
        name: 'stairsUp2',
        width: 2,
        build(prevSurfaceRow, startCol) {
            const row0 = clampRow(prevSurfaceRow);
            const row1 = row0 - 1;
            if (row1 < 0) return null;
            return [
                {
                    col: startCol,
                    surfaceRow: row0,
                    features: [FeatureType.GROUND, FeatureType.STAIR_UP]
                },
                {
                    col: startCol + 1,
                    surfaceRow: row1,
                    features: [FeatureType.GROUND, FeatureType.STAIR_UP]
                }
            ];
        }
    },
    {
        // Two-column staircase going down by 1 row
        name: 'stairsDown2',
        width: 2,
        build(prevSurfaceRow, startCol) {
            const row0 = clampRow(prevSurfaceRow);
            const row1 = row0 + 1;
            if (MAX_ROW_INDEX !== null && row1 > MAX_ROW_INDEX) return null;
            // Respect max down step
            if (row1 - row0 > MAX_DOWN_STEP_TILES) return null;
            return [
                {
                    col: startCol,
                    surfaceRow: row0,
                    features: [FeatureType.GROUND, FeatureType.STAIR_DOWN]
                },
                {
                    col: startCol + 1,
                    surfaceRow: row1,
                    features: [FeatureType.GROUND, FeatureType.STAIR_DOWN]
                }
            ];
        }
    },
    {
        // Single-tile gap with landing at same height
        name: 'gap1',
        width: 2,
        build(prevSurfaceRow, startCol) {
            if (MAX_GAP_TILES < 1) return null;
            const row = clampRow(prevSurfaceRow);
            return [
                {
                    col: startCol,
                    surfaceRow: null,
                    features: [FeatureType.GAP]
                },
                {
                    col: startCol + 1,
                    surfaceRow: row,
                    features: [FeatureType.GROUND]
                }
            ];
        }
    },
    {
        // Two-tile gap with landing at same height
        name: 'gap2',
        width: 3,
        build(prevSurfaceRow, startCol) {
            if (MAX_GAP_TILES < 2) return null;
            const row = clampRow(prevSurfaceRow);
            return [
                {
                    col: startCol,
                    surfaceRow: null,
                    features: [FeatureType.GAP]
                },
                {
                    col: startCol + 1,
                    surfaceRow: null,
                    features: [FeatureType.GAP]
                },
                {
                    col: startCol + 2,
                    surfaceRow: row,
                    features: [FeatureType.GROUND]
                }
            ];
        }
    }
];

function pickPattern(prevSurfaceRow, startCol, endCol) {
    const availablePatterns = COLUMN_PATTERNS.filter(p => startCol + p.width <= endCol);
    if (availablePatterns.length === 0) {
        return null;
    }

    // Try a few random patterns, fall back to flat if needed
    for (let attempt = 0; attempt < 8; attempt++) {
        const pattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
        const cols = pattern.build(prevSurfaceRow, startCol);
        if (!cols) continue;
        return { pattern, columns: cols };
    }

    // Fallback: force flat pattern if possible
    const flat = availablePatterns.find(p => p.name === 'flat');
    if (flat) {
        const cols = flat.build(prevSurfaceRow, startCol);
        if (cols) {
            return { pattern: flat, columns: cols };
        }
    }
    return null;
}

// Generate logical column states for a range (no sprites yet)
function generateColumnStates(startCol, endCol) {
    const states = new Map();
    let col = startCol;
    let prevSurfaceRow = getOrDefaultSurfaceRow(startCol - 1);

    while (col < endCol) {
        // Start zone: always use flat ground so the player spawn is clear of gaps/stairs
        const inStartZone = col < START_ZONE_COLS;
        const flatPattern = COLUMN_PATTERNS.find(p => p.name === 'flat');
        const picked = inStartZone && flatPattern
            ? { pattern: flatPattern, columns: flatPattern.build(prevSurfaceRow, col) }
            : pickPattern(prevSurfaceRow, col, endCol);
        if (!picked) {
            break;
        }

        const { pattern, columns } = picked;
        let lastSurfaceRow = prevSurfaceRow;

        for (const entry of columns) {
            const c = entry.col;
            const surfaceRow = entry.surfaceRow;
            const features = entry.features || [];

            states.set(c, {
                surfaceRow: surfaceRow,
                features: features
            });

            if (surfaceRow !== null && surfaceRow !== undefined) {
                lastSurfaceRow = surfaceRow;
            }
        }

        prevSurfaceRow = lastSurfaceRow;
        col += pattern.width;
    }

    return states;
}

// Simple reachability check: ensure there is at least one walkable
// surface near the end of the chunk and that no unsupported vertical
// jumps are required between consecutive walkable columns.
function isChunkReachable(states, startCol, endCol) {
    // Find first walkable column in this range
    let entryCol = null;
    for (let c = startCol; c < endCol; c++) {
        const state = states.get(c);
        if (state && state.surfaceRow !== null && state.surfaceRow !== undefined) {
            entryCol = c;
            break;
        }
    }
    if (entryCol === null) return false;

    const targetCol = endCol - 1;
    const visited = new Set();
    const queue = [entryCol];
    visited.add(entryCol);

    while (queue.length > 0) {
        const col = queue.shift();
        const state = states.get(col);
        if (!state || state.surfaceRow === null || state.surfaceRow === undefined) {
            continue;
        }
        const row = state.surfaceRow;

        if (col >= targetCol - 2) {
            return true;
        }

        // Direct neighbor (col + 1)
        const directCol = col + 1;
        if (directCol < endCol && !visited.has(directCol)) {
            const neighbor = states.get(directCol);
            if (neighbor && neighbor.surfaceRow !== null && neighbor.surfaceRow !== undefined) {
                const dRow = neighbor.surfaceRow - row;
                const allowedUp = dRow <= 0 && Math.abs(dRow) <= MAX_UP_STEP_TILES;
                const allowedDown = dRow >= 0 && dRow <= MAX_DOWN_STEP_TILES;
                if (allowedUp || allowedDown) {
                    visited.add(directCol);
                    queue.push(directCol);
                }
            }
        }

        // Gap jumps up to MAX_GAP_TILES
        for (let gapTiles = 1; gapTiles <= MAX_GAP_TILES; gapTiles++) {
            const landingCol = col + gapTiles + 1;
            if (landingCol >= endCol) break;

            let onlyGapsBetween = true;
            for (let g = 1; g <= gapTiles; g++) {
                const midState = states.get(col + g);
                if (!midState || !midState.features || midState.features.indexOf(FeatureType.GAP) === -1) {
                    onlyGapsBetween = false;
                    break;
                }
            }
            if (!onlyGapsBetween) continue;

            const landingState = states.get(landingCol);
            if (!landingState || landingState.surfaceRow === null || landingState.surfaceRow === undefined) {
                continue;
            }

            const dRow = landingState.surfaceRow - row;
            const allowedUp = dRow <= 0 && Math.abs(dRow) <= MAX_UP_STEP_TILES;
            const allowedDown = dRow >= 0 && dRow <= MAX_DOWN_STEP_TILES;
            if (!(allowedUp || allowedDown)) continue;

            if (!visited.has(landingCol)) {
                visited.add(landingCol);
                queue.push(landingCol);
            }
        }
    }

    return false;
}

// Materialize column states into actual tiles and update global maps
function materializeColumns(scene, states, startCol, endCol) {
    for (let col = startCol; col < endCol; col++) {
        const state = states.get(col);
        if (!state) continue;

        const surfaceRow = state.surfaceRow;
        const features = state.features || [];

        if (surfaceRow !== null && surfaceRow !== undefined && features.indexOf(FeatureType.GROUND) !== -1) {
            placeGroundTile(scene, col, surfaceRow);
        }

        setSurfaceRow(col, surfaceRow);
        setColumnState(col, surfaceRow, features);
    }
}

// Decorations and coins based on column states
function populateGroundDecorations(scene, startCol, endCol) {
    for (let col = startCol; col < endCol; col++) {
        // Keep start zone clear of obstacles
        if (col < START_ZONE_COLS) continue;

        const state = getColumnState(col);
        if (!state || state.surfaceRow === null || state.surfaceRow === undefined) continue;

        // 25% chance to place bones on ground
        if (Math.random() < 0.25) {
            const boneIndex = Math.floor(Math.random() * 4) + 1;
            const boneKey = `bone-${boneIndex}`;
            const centerX = colToWorldX(col);
            const centerY = rowToWorldY(state.surfaceRow);
            const topY = centerY - TILE_SIZE / 2;

            const bone = scene.add.image(centerX, topY, boneKey);
            bone.setScale(BG_SCALE);
            bone.setScrollFactor(1);
            bone.setDepth(DEPTH_DECORATIONS);
            decorativeObjects.add(bone);
        }
    }
}

function populateCoins(scene, startCol, endCol) {
    for (let col = startCol; col < endCol; col++) {
        // Keep start zone clear of objects
        if (col < START_ZONE_COLS) continue;

        const state = getColumnState(col);
        if (!state || state.surfaceRow === null || state.surfaceRow === undefined) continue;

        if (Math.random() < 0.15) {
            const centerX = colToWorldX(col);
            const centerY = rowToWorldY(state.surfaceRow);
            const topY = centerY - TILE_SIZE / 2;
            const coinY = topY - 50;

            const coin = coins.create(centerX, coinY, 'coin');
            coin.setScale(BG_SCALE);
            coin.setScrollFactor(1);
            coin.setDepth(DEPTH_OBJECTS);
            coin.body.setSize(30 * BG_SCALE, 30 * BG_SCALE);
            coin.body.setImmovable(true);
            coin.body.setAllowGravity(false);
            if (scene.anims.exists('coin-spin')) {
                coin.anims.play('coin-spin', true);
            }
        }
    }
}

// Generate a chunk of the world using column-based patterns
function generateWorldChunk(scene, startX, endX) {
    const startCol = worldXToCol(startX);
    const endCol = worldXToCol(endX);

    if (startCol >= endCol) {
        return;
    }

    // Generate logical states and ensure they form a traversable path
    let states = null;
    const MAX_ATTEMPTS = 3;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        states = generateColumnStates(startCol, endCol);
        if (isChunkReachable(states, startCol, endCol)) {
            break;
        }
    }

    if (!states) return;

    materializeColumns(scene, states, startCol, endCol);
    populateGroundDecorations(scene, startCol, endCol);
    populateCoins(scene, startCol, endCol);
}

// Clean up old platforms and objects
function cleanupWorld(catX) {
    const cleanupX = catX - CLEANUP_DISTANCE;
    const cleanupCol = worldXToCol(cleanupX);
    
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

    // Remove column state that is fully behind the cleanup column
    surfaceByCol.forEach((row, col) => {
        if (col < cleanupCol) {
            surfaceByCol.delete(col);
        }
    });
    columnStates.forEach((state, col) => {
        if (col < cleanupCol) {
            columnStates.delete(col);
        }
    });
}

// Debug helpers for visualizing grid and surfaces

function drawWorldDebug(scene) {
    if (!debugMode) return;
    if (!scene || !scene.add || !scene.children) return;

    // Remove existing debug graphics if any
    if (scene.worldDebugGraphics) {
        scene.worldDebugGraphics.clear();
        scene.worldDebugGraphics.destroy();
        scene.worldDebugGraphics = null;
    }

    const graphics = scene.add.graphics();
    graphics.setDepth(DEPTH_DEBUG);
    graphics.lineStyle(1, 0x00ff00, 0.3);

    // Draw vertical grid lines
    const cols = Math.ceil(MAX_WORLD_WIDTH / TILE_SIZE);
    for (let c = 0; c < cols; c++) {
        const x = colToWorldX(c);
        graphics.lineBetween(x, 0, x, WORLD_HEIGHT);
    }

    // Draw surface rows
    surfaceByCol.forEach((row, col) => {
        if (row === null || row === undefined) return;
        const centerX = colToWorldX(col);
        const centerY = rowToWorldY(row);
        const topY = centerY - TILE_SIZE / 2;
        const bottomY = centerY + TILE_SIZE / 2;

        // Highlight the main surface cell
        graphics.strokeRect(
            centerX - TILE_SIZE / 2,
            topY,
            TILE_SIZE,
            TILE_SIZE
        );

        // Small marker at the walkable top
        graphics.lineBetween(
            centerX - TILE_SIZE / 2,
            topY,
            centerX + TILE_SIZE / 2,
            topY
        );
    });

    scene.worldDebugGraphics = graphics;
}


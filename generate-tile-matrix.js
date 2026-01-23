/**
 * Standalone script to generate tile compatibility matrix
 * Run this once to generate assets/tile-compatibility-matrix.json
 * 
 * Usage: Run this in browser console after game loads, or create a separate HTML page
 */

async function generateTileMatrix() {
    // This would be run in the context of a Phaser scene
    // For now, this is a template that shows the structure
    
    console.log('This script should be run in the browser console after the game loads.');
    console.log('It will analyze all tiles and generate a compatibility matrix.');
    
    // Example usage:
    /*
    const analyzer = new TileAnalyzer(scene);
    const config = new TileConfig();
    const rules = new TileRules(analyzer, config);
    
    const tileKeys = [];
    for (let i = 1; i <= 16; i++) {
        tileKeys.push(`tile-${i}`);
    }
    for (let i = 1; i <= 4; i++) {
        tileKeys.push(`bone-${i}`);
    }
    
    const matrix = await rules.generateCompatibilityMatrix(tileKeys);
    
    // Save to file (would need to download or copy from console)
    const json = rules.exportMatrix();
    console.log('Compatibility Matrix:');
    console.log(json);
    
    // Copy this JSON to assets/tile-compatibility-matrix.json
    */
}

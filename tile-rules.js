/**
 * Tile Rules Engine - Calculates adjacency rules based on edge compatibility
 * Generates and manages compatibility matrix for tile connections
 */

class TileRules {
    constructor(tileAnalyzer, tileConfig) {
        this.analyzer = tileAnalyzer;
        this.config = tileConfig;
        this.compatibilityMatrix = {}; // Pre-computed compatibility matrix
    }

    /**
     * Generate compatibility matrix for all tiles
     * This should be run once and saved as an asset
     */
    async generateCompatibilityMatrix(tileKeys) {
        console.log('Generating compatibility matrix...');
        const matrix = {};

        // Analyze all tiles first
        const analyses = await this.analyzer.analyzeAllTiles(tileKeys);

        // For each tile pair, check compatibility on each edge
        for (const tileKey1 of tileKeys) {
            if (!matrix[tileKey1]) {
                matrix[tileKey1] = {};
            }

            const analysis1 = analyses[tileKey1];
            if (!analysis1) continue;

            for (const tileKey2 of tileKeys) {
                if (!matrix[tileKey1][tileKey2]) {
                    matrix[tileKey1][tileKey2] = {};
                }

                const analysis2 = analyses[tileKey2];
                if (!analysis2) continue;

                // Check compatibility for each edge pair
                // Right edge of tile1 connects to left edge of tile2
                const rightLeft = this.checkEdgeCompatibility(
                    analysis1.edges.right,
                    analysis2.edges.left,
                    tileKey1, 'right', tileKey2, 'left'
                );

                // Bottom edge of tile1 connects to top edge of tile2
                const bottomTop = this.checkEdgeCompatibility(
                    analysis1.edges.bottom,
                    analysis2.edges.top,
                    tileKey1, 'bottom', tileKey2, 'top'
                );

                // Left edge of tile1 connects to right edge of tile2
                const leftRight = this.checkEdgeCompatibility(
                    analysis1.edges.left,
                    analysis2.edges.right,
                    tileKey1, 'left', tileKey2, 'right'
                );

                // Top edge of tile1 connects to bottom edge of tile2
                const topBottom = this.checkEdgeCompatibility(
                    analysis1.edges.top,
                    analysis2.edges.bottom,
                    tileKey1, 'top', tileKey2, 'bottom'
                );

                matrix[tileKey1][tileKey2] = {
                    right: rightLeft,  // tile1's right -> tile2's left
                    bottom: bottomTop, // tile1's bottom -> tile2's top
                    left: leftRight,   // tile1's left -> tile2's right
                    top: topBottom     // tile1's top -> tile2's bottom
                };
            }
        }

        this.compatibilityMatrix = matrix;
        return matrix;
    }

    /**
     * Check if two edges are compatible
     */
    checkEdgeCompatibility(edge1, edge2, tileKey1, edgeName1, tileKey2, edgeName2) {
        // Check manual override first
        const compatible = this.config.isCompatible(tileKey1, edgeName1, tileKey2, edgeName2);
        if (compatible !== true) {
            return compatible; // Return explicit override value
        }

        // Calculate compatibility score
        if (!edge1 || !edge2 || !edge1.signature || !edge2.signature) {
            return true; // Default to compatible if no data
        }

        const score = this.analyzer.compareEdges(edge1, edge2);
        const threshold = this.config.getThreshold();
        
        // Additional check: if shapes are incompatible, reject even if score is high
        if (edge1.shape && edge2.shape) {
            // Jagged edges should only connect to jagged edges
            if ((edge1.shape === 'jagged' && edge2.shape !== 'jagged') ||
                (edge1.shape !== 'jagged' && edge2.shape === 'jagged')) {
                return {
                    compatible: false,
                    score: score,
                    reason: 'shape_mismatch'
                };
            }
        }
        
        return {
            compatible: score >= threshold,
            score: score
        };
    }

    /**
     * Get compatible tiles for a given tile and direction
     * @param {string} tileKey - The tile to find compatible neighbors for
     * @param {string} direction - 'left', 'right', 'top', or 'bottom'
     * @returns {Array<string>} Array of compatible tile keys
     */
    getCompatibleTiles(tileKey, direction) {
        if (!this.compatibilityMatrix[tileKey]) {
            return []; // No data for this tile
        }

        const compatible = [];
        const threshold = this.config.getThreshold();

        for (const otherTileKey in this.compatibilityMatrix[tileKey]) {
            const compatibility = this.compatibilityMatrix[tileKey][otherTileKey][direction];
            
            // Handle both boolean and object formats
            let isCompatible = false;
            if (typeof compatibility === 'boolean') {
                isCompatible = compatibility;
            } else if (compatibility && typeof compatibility === 'object') {
                isCompatible = compatibility.compatible !== false;
            }

            if (isCompatible) {
                compatible.push(otherTileKey);
            }
        }

        return compatible;
    }

    /**
     * Check if two tiles are compatible in a specific direction
     */
    areCompatible(tileKey1, direction, tileKey2) {
        if (!this.compatibilityMatrix[tileKey1] || !this.compatibilityMatrix[tileKey1][tileKey2]) {
            return true; // Default to compatible if no data
        }

        const compatibility = this.compatibilityMatrix[tileKey1][tileKey2][direction];
        
        if (typeof compatibility === 'boolean') {
            return compatibility;
        } else if (compatibility && typeof compatibility === 'object') {
            return compatibility.compatible !== false;
        }

        return true;
    }

    /**
     * Load compatibility matrix from JSON
     */
    loadMatrix(matrixData) {
        this.compatibilityMatrix = matrixData;
    }

    /**
     * Get the full compatibility matrix (for saving)
     */
    getMatrix() {
        return this.compatibilityMatrix;
    }

    /**
     * Export matrix to JSON format
     */
    exportMatrix() {
        return JSON.stringify(this.compatibilityMatrix, null, 2);
    }
}

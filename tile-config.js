/**
 * Tile Configuration - Stores tile metadata and supports manual overrides
 */

class TileConfig {
    constructor() {
        this.tileMetadata = {};
        this.manualOverrides = {};
        this.compatibilityThreshold = 0.4; // Increased for better matching (0-1)
    }

    /**
     * Store tile analysis results
     */
    setTileMetadata(tileKey, analysis) {
        this.tileMetadata[tileKey] = analysis;
    }

    /**
     * Get tile metadata
     */
    getTileMetadata(tileKey) {
        return this.tileMetadata[tileKey] || null;
    }

    /**
     * Set manual override for edge type
     */
    setEdgeTypeOverride(tileKey, edge, type) {
        if (!this.manualOverrides[tileKey]) {
            this.manualOverrides[tileKey] = {};
        }
        if (!this.manualOverrides[tileKey].edges) {
            this.manualOverrides[tileKey].edges = {};
        }
        this.manualOverrides[tileKey].edges[edge] = type;
    }

    /**
     * Set manual compatibility override
     */
    setCompatibilityOverride(tileKey1, edge1, tileKey2, edge2, compatible) {
        const key = `${tileKey1}_${edge1}_${tileKey2}_${edge2}`;
        const reverseKey = `${tileKey2}_${edge2}_${tileKey1}_${edge1}`;
        
        if (!this.manualOverrides.compatibility) {
            this.manualOverrides.compatibility = {};
        }
        
        this.manualOverrides.compatibility[key] = compatible;
        this.manualOverrides.compatibility[reverseKey] = compatible; // Symmetric
    }

    /**
     * Get edge type (with override support)
     */
    getEdgeType(tileKey, edge) {
        // Check manual override first
        if (this.manualOverrides[tileKey]?.edges?.[edge]) {
            return this.manualOverrides[tileKey].edges[edge];
        }

        // Return from metadata
        const metadata = this.tileMetadata[tileKey];
        if (metadata?.edges?.[edge]) {
            return metadata.edges[edge].type || null;
        }

        return null;
    }

    /**
     * Check if two edges are compatible (with override support)
     */
    isCompatible(tileKey1, edge1, tileKey2, edge2) {
        // Check manual override first
        const key = `${tileKey1}_${edge1}_${tileKey2}_${edge2}`;
        if (this.manualOverrides.compatibility?.[key] !== undefined) {
            return this.manualOverrides.compatibility[key];
        }

        // Default to true if no rules (fallback behavior)
        return true;
    }

    /**
     * Get all tiles
     */
    getAllTileKeys() {
        return Object.keys(this.tileMetadata);
    }

    /**
     * Export configuration (for saving)
     */
    exportConfig() {
        return {
            metadata: this.tileMetadata,
            overrides: this.manualOverrides,
            threshold: this.compatibilityThreshold
        };
    }

    /**
     * Import configuration (for loading)
     */
    importConfig(config) {
        if (config.metadata) {
            this.tileMetadata = config.metadata;
        }
        if (config.overrides) {
            this.manualOverrides = config.overrides;
        }
        if (config.threshold !== undefined) {
            this.compatibilityThreshold = config.threshold;
        }
    }

    /**
     * Set compatibility threshold
     */
    setThreshold(threshold) {
        this.compatibilityThreshold = Math.max(0, Math.min(1, threshold));
    }

    /**
     * Get compatibility threshold
     */
    getThreshold() {
        return this.compatibilityThreshold;
    }
}

/**
 * Tile Analyzer - Analyzes tile images to extract edge color signatures
 * Uses color-based detection to determine which tiles can connect
 */

class TileAnalyzer {
    constructor(scene) {
        this.scene = scene;
        this.analysisCache = {};
        this.sampleSize = 30; // Increased: Number of pixels to sample from each edge
        this.edgeProfileDepth = 5; // Pixels to sample perpendicular to edge for shape detection
    }

    /**
     * Analyze a tile image and extract edge color signatures
     * @param {string} tileKey - The texture key (e.g., 'tile-1')
     * @returns {Promise<Object>} Analysis result with edge data
     */
    async analyzeTile(tileKey) {
        // Check cache first
        if (this.analysisCache[tileKey]) {
            return this.analysisCache[tileKey];
        }

        const texture = this.scene.textures.get(tileKey);
        if (!texture) {
            console.warn(`Texture not found: ${tileKey}`);
            return null;
        }

        const source = texture.getSourceImage();
        if (!source) {
            console.warn(`Source image not found for: ${tileKey}`);
            return null;
        }

        // Create a temporary canvas to read pixel data
        const canvas = document.createElement('canvas');
        canvas.width = source.width || texture.width;
        canvas.height = source.height || texture.height;
        const ctx = canvas.getContext('2d');
        
        // Draw the image to canvas
        ctx.drawImage(source, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Analyze edges
        const edges = {
            top: this.analyzeEdge(data, canvas.width, canvas.height, 'top'),
            right: this.analyzeEdge(data, canvas.width, canvas.height, 'right'),
            bottom: this.analyzeEdge(data, canvas.width, canvas.height, 'bottom'),
            left: this.analyzeEdge(data, canvas.width, canvas.height, 'left')
        };

        const result = {
            id: tileKey,
            edges: edges,
            width: canvas.width,
            height: canvas.height
        };

        // Cache the result
        this.analysisCache[tileKey] = result;
        return result;
    }

    /**
     * Analyze a specific edge of the tile
     * @param {Uint8ClampedArray} data - Image pixel data
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @param {string} edge - 'top', 'right', 'bottom', or 'left'
     * @returns {Object} Edge analysis with colors, shape, and signature
     */
    analyzeEdge(data, width, height, edge) {
        const pixels = [];
        const edgeProfile = []; // Profile for shape detection
        const sampleSize = Math.min(this.sampleSize, Math.max(width, height));

        for (let i = 0; i < sampleSize; i++) {
            let x, y;
            const t = i / (sampleSize - 1); // 0 to 1

            switch (edge) {
                case 'top':
                    x = Math.floor(t * (width - 1));
                    y = 0;
                    break;
                case 'bottom':
                    x = Math.floor(t * (width - 1));
                    y = height - 1;
                    break;
                case 'left':
                    x = 0;
                    y = Math.floor(t * (height - 1));
                    break;
                case 'right':
                    x = width - 1;
                    y = Math.floor(t * (height - 1));
                    break;
            }

            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];

            // Only include non-transparent pixels
            if (a > 128) {
                pixels.push({ r, g, b, x, y });
            }

            // Sample edge profile (perpendicular to edge) for shape detection
            const profilePoints = this.sampleEdgeProfile(data, width, height, x, y, edge);
            edgeProfile.push(profilePoints);
        }

        if (pixels.length === 0) {
            return { 
                colors: [], 
                averageColor: { r: 0, g: 0, b: 0 }, 
                signature: null,
                shape: 'unknown',
                shapeProfile: null
            };
        }

        // Calculate average color
        const avgR = pixels.reduce((sum, p) => sum + p.r, 0) / pixels.length;
        const avgG = pixels.reduce((sum, p) => sum + p.g, 0) / pixels.length;
        const avgB = pixels.reduce((sum, p) => sum + p.b, 0) / pixels.length;

        // Calculate color variance (for pattern detection)
        const variance = this.calculateVariance(pixels, { r: avgR, g: avgG, b: avgB });

        // Get dominant colors
        const dominantColors = this.getDominantColors(pixels, 3);

        // Analyze edge shape
        const shapeAnalysis = this.analyzeEdgeShape(edgeProfile, edge);

        return {
            colors: pixels,
            averageColor: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) },
            variance: variance,
            dominantColors: dominantColors,
            signature: this.createColorSignature({ r: avgR, g: avgG, b: avgB }),
            shape: shapeAnalysis.type,
            shapeProfile: shapeAnalysis.profile,
            roughness: shapeAnalysis.roughness,
            edgeType: shapeAnalysis.edgeType
        };
    }

    /**
     * Sample pixels perpendicular to the edge to detect shape
     */
    sampleEdgeProfile(data, width, height, edgeX, edgeY, edge) {
        const profile = [];
        const depth = Math.min(this.edgeProfileDepth, Math.min(width, height) / 2);

        for (let d = 0; d < depth; d++) {
            let x, y;
            switch (edge) {
                case 'top':
                    x = edgeX;
                    y = Math.min(edgeY + d, height - 1);
                    break;
                case 'bottom':
                    x = edgeX;
                    y = Math.max(edgeY - d, 0);
                    break;
                case 'left':
                    x = Math.min(edgeX + d, width - 1);
                    y = edgeY;
                    break;
                case 'right':
                    x = Math.max(edgeX - d, 0);
                    y = edgeY;
                    break;
            }

            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];

            if (a > 128) {
                profile.push({ r, g, b, d });
            } else {
                profile.push(null); // Transparent
            }
        }

        return profile;
    }

    /**
     * Analyze edge shape from profile data
     */
    analyzeEdgeShape(edgeProfile, edge) {
        if (!edgeProfile || edgeProfile.length === 0) {
            return { type: 'unknown', profile: null, roughness: 0, edgeType: 'flat' };
        }

        // Calculate edge roughness (variation in edge position)
        const edgePositions = [];
        for (const profile of edgeProfile) {
            if (!profile || profile.length === 0) continue;
            
            // Find first non-transparent pixel (edge position)
            let edgePos = 0;
            for (let i = 0; i < profile.length; i++) {
                if (profile[i] !== null) {
                    edgePos = i;
                    break;
                }
            }
            edgePositions.push(edgePos);
        }

        // Calculate roughness (standard deviation of edge positions)
        if (edgePositions.length === 0) {
            return { type: 'smooth', profile: edgeProfile, roughness: 0, edgeType: 'flat' };
        }

        const avgPos = edgePositions.reduce((a, b) => a + b, 0) / edgePositions.length;
        const variance = edgePositions.reduce((sum, pos) => sum + Math.pow(pos - avgPos, 2), 0) / edgePositions.length;
        const roughness = Math.sqrt(variance);

        // Classify edge type
        let edgeType = 'flat';
        let type = 'smooth';

        if (roughness > 1.5) {
            type = 'jagged';
            edgeType = 'irregular';
        } else if (roughness > 0.5) {
            type = 'rough';
            edgeType = 'textured';
        } else {
            type = 'smooth';
            edgeType = 'flat';
        }

        // Check if edge is consistently at the boundary (flat) or varies (jagged)
        const maxVariation = Math.max(...edgePositions) - Math.min(...edgePositions);
        if (maxVariation > 2) {
            type = 'jagged';
            edgeType = 'irregular';
        }

        return {
            type: type,
            profile: edgeProfile,
            roughness: roughness,
            edgeType: edgeType,
            edgePositions: edgePositions
        };
    }

    /**
     * Calculate color variance
     */
    calculateVariance(pixels, average) {
        let sumSquaredDiff = 0;
        for (const pixel of pixels) {
            const diffR = pixel.r - average.r;
            const diffG = pixel.g - average.g;
            const diffB = pixel.b - average.b;
            sumSquaredDiff += diffR * diffR + diffG * diffG + diffB * diffB;
        }
        return sumSquaredDiff / pixels.length;
    }

    /**
     * Get dominant colors using simple k-means-like clustering
     */
    getDominantColors(pixels, k = 3) {
        if (pixels.length === 0) return [];
        if (pixels.length <= k) return pixels;

        // Simple approach: divide color space into buckets
        const buckets = {};
        const bucketSize = 32; // Quantize to reduce color space

        for (const pixel of pixels) {
            const key = `${Math.floor(pixel.r / bucketSize)}_${Math.floor(pixel.g / bucketSize)}_${Math.floor(pixel.b / bucketSize)}`;
            if (!buckets[key]) {
                buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
            }
            buckets[key].r += pixel.r;
            buckets[key].g += pixel.g;
            buckets[key].b += pixel.b;
            buckets[key].count++;
        }

        // Get top k buckets by count
        const sorted = Object.values(buckets)
            .map(bucket => ({
                r: Math.round(bucket.r / bucket.count),
                g: Math.round(bucket.g / bucket.count),
                b: Math.round(bucket.b / bucket.count),
                count: bucket.count
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, k);

        return sorted;
    }

    /**
     * Create a color signature for quick comparison
     */
    createColorSignature(color) {
        // Quantize to reduce precision for matching
        const quantize = (val) => Math.floor(val / 16) * 16;
        return {
            r: quantize(color.r),
            g: quantize(color.g),
            b: quantize(color.b)
        };
    }

    /**
     * Calculate color distance between two colors (Euclidean distance in RGB space)
     */
    colorDistance(color1, color2) {
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    /**
     * Compare two edges and return compatibility score (0-1, higher is more compatible)
     */
    compareEdges(edge1, edge2) {
        if (!edge1.signature || !edge2.signature) {
            return 0.5; // Default compatibility if signatures missing
        }

        // Shape compatibility is critical - jagged edges should match jagged edges
        let shapeScore = 1.0;
        if (edge1.shape && edge2.shape) {
            // Perfect match: same shape type
            if (edge1.shape === edge2.shape) {
                shapeScore = 1.0;
            }
            // Good match: both rough or both smooth
            else if ((edge1.shape === 'rough' || edge1.shape === 'smooth') && 
                     (edge2.shape === 'rough' || edge2.shape === 'smooth')) {
                shapeScore = 0.8;
            }
            // Poor match: jagged vs smooth (should not connect)
            else if ((edge1.shape === 'jagged' && edge2.shape === 'smooth') ||
                     (edge1.shape === 'smooth' && edge2.shape === 'jagged')) {
                shapeScore = 0.2; // Very low compatibility
            }
            // Medium match: rough can connect to either
            else {
                shapeScore = 0.6;
            }
        }

        // Color compatibility
        const distance = this.colorDistance(edge1.signature, edge2.signature);
        const maxDistance = Math.sqrt(255 * 255 * 3);
        const colorSimilarity = 1 - (distance / maxDistance);

        // Dominant color matching
        let dominantMatch = 0;
        if (edge1.dominantColors && edge2.dominantColors && edge1.dominantColors.length > 0 && edge2.dominantColors.length > 0) {
            let matches = 0;
            for (const c1 of edge1.dominantColors.slice(0, 2)) {
                for (const c2 of edge2.dominantColors.slice(0, 2)) {
                    const dist = this.colorDistance(c1, c2);
                    if (dist < 50) {
                        matches++;
                    }
                }
            }
            dominantMatch = matches / Math.max(edge1.dominantColors.length, edge2.dominantColors.length);
        }

        // Roughness similarity (edges with similar roughness connect better)
        let roughnessScore = 1.0;
        if (edge1.roughness !== undefined && edge2.roughness !== undefined) {
            const roughnessDiff = Math.abs(edge1.roughness - edge2.roughness);
            roughnessScore = Math.max(0, 1 - (roughnessDiff / 3)); // Normalize to 0-1
        }

        // Weighted combination: shape is most important, then color, then roughness
        const finalScore = shapeScore * 0.5 + colorSimilarity * 0.3 + dominantMatch * 0.1 + roughnessScore * 0.1;
        
        return Math.max(0, Math.min(1, finalScore));
    }

    /**
     * Analyze all tiles
     */
    async analyzeAllTiles(tileKeys) {
        const results = {};
        for (const tileKey of tileKeys) {
            try {
                const analysis = await this.analyzeTile(tileKey);
                if (analysis) {
                    results[tileKey] = analysis;
                }
            } catch (error) {
                console.error(`Error analyzing ${tileKey}:`, error);
            }
        }
        return results;
    }
}

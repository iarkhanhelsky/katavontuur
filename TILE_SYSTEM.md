# Tile Adjacency System

This system analyzes tile images to determine which tiles can connect to each other based on edge color compatibility, ensuring visually coherent tile placement during world generation.

## Overview

The tile adjacency system consists of three main components:

1. **Tile Analyzer** (`tile-analyzer.js`) - Analyzes tile images to extract edge color signatures
2. **Tile Config** (`tile-config.js`) - Stores tile metadata and supports manual overrides
3. **Tile Rules** (`tile-rules.js`) - Calculates adjacency rules and manages compatibility matrix

## Setup

### 1. Generate Compatibility Matrix

The compatibility matrix is pre-computed to avoid analyzing tiles on every game load. To generate it:

1. Open `generate-matrix.html` in your browser
2. Click "Generate Matrix"
3. Wait for the analysis to complete (may take a few moments)
4. Click "Download JSON" to save the file
5. Save the downloaded file as `assets/tile-compatibility-matrix.json`

Alternatively, you can copy the JSON from the output and manually create the file.

**Important**: After updating the tile analyzer (e.g., adding shape detection), you must regenerate the compatibility matrix for the improvements to take effect. Delete the old matrix file and generate a new one.

### 2. Integration

The system is already integrated into `index.html`. It will:
- Automatically load the compatibility matrix if `assets/tile-compatibility-matrix.json` exists
- Generate the matrix on first run if the file doesn't exist (slower, but works)
- Use adjacency rules to select compatible tiles during world generation

## How It Works

### Tile Analysis

For each tile image, the system:
1. Samples pixels from each edge (top, right, bottom, left) - **30 samples per edge**
2. Analyzes edge shape by sampling perpendicular to the edge (detects jagged vs smooth)
3. Calculates average color and dominant colors
4. Creates a color signature for quick comparison
5. Classifies edge type: smooth, rough, or jagged

### Compatibility Calculation

Two tiles are considered compatible if:
- **Shape matching**: Jagged edges only connect to jagged edges, smooth to smooth
- **Color matching**: Their connecting edges have similar color signatures
- **Roughness matching**: Edges with similar roughness connect better
- The compatibility score exceeds the threshold (default: 0.4)
- Manual overrides allow the connection

**Scoring weights:**
- Shape compatibility: 50% (most important)
- Color similarity: 30%
- Dominant color match: 10%
- Roughness similarity: 10%

### World Generation

When placing a new tile:
1. Check adjacent tiles (left, right, top, bottom)
2. Filter candidate tiles based on compatibility rules
3. Select randomly from compatible tiles
4. Fall back to random selection if no compatible tiles found

## Configuration

### Compatibility Threshold

The default threshold is 0.4 (40% similarity). You can adjust this in `tile-config.js`:

```javascript
tileConfig.setThreshold(0.5); // Higher = more strict matching (0.0 - 1.0)
```

**Note**: The threshold was increased from 0.3 to 0.4 to improve matching quality. Lower values allow more connections but may create visual inconsistencies.

### Manual Overrides

You can manually override edge types or compatibility:

```javascript
// Set edge type
tileConfig.setEdgeTypeOverride('tile-1', 'right', 'grass');

// Force compatibility
tileConfig.setCompatibilityOverride('tile-1', 'right', 'tile-2', 'left', true);

// Block compatibility
tileConfig.setCompatibilityOverride('tile-1', 'right', 'tile-3', 'left', false);
```

## File Structure

```
├── tile-analyzer.js          # Tile image analysis
├── tile-config.js            # Configuration and metadata
├── tile-rules.js             # Adjacency rules engine
├── generate-matrix.html      # Matrix generation utility
└── assets/
    └── tile-compatibility-matrix.json  # Pre-computed matrix (generated)
```

## Performance

- **With pre-computed matrix**: Fast, loads instantly
- **Without matrix**: Slower first load (analyzes all tiles), then fast
- **Matrix generation**: Takes 5-10 seconds for 20 tiles

## Debugging

Enable debug mode in the game to see:
- Compatibility matrix generation logs
- Tile selection decisions
- Edge analysis results

The system falls back gracefully if:
- Matrix file is missing (generates on first run)
- Analysis fails (uses random selection)
- No compatible tiles found (uses random selection)

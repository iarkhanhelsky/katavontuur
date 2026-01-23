#!/usr/bin/env python3
"""
Generate tile compatibility matrix based on edge analysis rules.

Requirements:
    pip install Pillow numpy

Rules:
1. If bottom edge has transparent pixels - nothing can be underneath
2. Top surface is only grass - only green/grass edges can be on top
3. If tile is darker brown then it should be below another tile with straight brown edge of same shade

Usage: python3 generate-matrix-rules.py
Output: assets/tile-compatibility-matrix.json
"""

import json
import os
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: PIL/Pillow is required. Install with: pip install Pillow")
    exit(1)

try:
    import numpy as np
except ImportError:
    print("Error: numpy is required. Install with: pip install numpy")
    exit(1)

# Configuration
TILES_DIR = "assets/world/Tiles"
OUTPUT_FILE = "assets/tile-compatibility-matrix.json"
EDGE_SAMPLE_SIZE = 30  # Number of pixels to sample from each edge
TRANSPARENCY_THRESHOLD = 128  # Alpha threshold for transparency
GREEN_THRESHOLD = 0.3  # Minimum green component ratio to be considered "green"
BROWN_SIMILARITY_THRESHOLD = 30  # Color distance threshold for brown matching

def is_green_color(r, g, b):
    """Check if a color is a shade of green"""
    # Green should be the dominant color component
    total = r + g + b
    if total == 0:
        return False
    green_ratio = g / total
    # Green should be stronger than red and blue
    return green_ratio > GREEN_THRESHOLD and g > r and g > b

def is_brown_color(r, g, b):
    """Check if a color is a shade of brown"""
    # Brown is typically a dark orange/red-yellow
    # It has moderate red, moderate green, low blue
    # And is generally darker
    brightness = (r + g + b) / 3
    if brightness < 50:  # Too dark, might be black
        return False
    if brightness > 200:  # Too light, might be beige/cream
        return False
    
    # Brown has red and green components, but less blue
    red_green_avg = (r + g) / 2
    if b > red_green_avg * 0.7:  # Too much blue
        return False
    
    # Red should be higher than green, but not too much
    if r > g * 1.5 and r > b * 1.5:
        return True
    
    return False

def get_brown_shade(r, g, b):
    """Get a normalized brown shade value for comparison"""
    # Normalize to a single value representing brown shade
    # Darker browns have lower values
    brightness = (r + g + b) / 3
    # Also consider the red-green balance
    brownness = (r * 0.5 + g * 0.3) / (b + 1)
    return brightness * brownness

def color_distance(r1, g1, b1, r2, g2, b2):
    """Calculate Euclidean distance between two colors"""
    return np.sqrt((r1 - r2)**2 + (g1 - g2)**2 + (b1 - b2)**2)

def analyze_edge(image, edge, sample_size=EDGE_SAMPLE_SIZE):
    """
    Analyze an edge of the tile image.
    Returns a dict with edge properties.
    """
    width, height = image.size
    pixels = []
    transparent_count = 0
    green_pixels = []
    brown_pixels = []
    
    # Sample pixels along the edge
    for i in range(sample_size):
        t = i / (sample_size - 1) if sample_size > 1 else 0
        
        if edge == 'top':
            x = int(t * (width - 1))
            y = 0
        elif edge == 'bottom':
            x = int(t * (width - 1))
            y = height - 1
        elif edge == 'left':
            x = 0
            y = int(t * (height - 1))
        elif edge == 'right':
            x = width - 1
            y = int(t * (height - 1))
        else:
            continue
        
        # Get pixel color
        pixel = image.getpixel((x, y))
        if len(pixel) == 4:  # RGBA
            r, g, b, a = pixel
        else:  # RGB
            r, g, b = pixel
            a = 255
        
        pixels.append((r, g, b, a))
        
        # Check transparency
        if a < TRANSPARENCY_THRESHOLD:
            transparent_count += 1
        
        # Check for green
        if a >= TRANSPARENCY_THRESHOLD and is_green_color(r, g, b):
            green_pixels.append((r, g, b))
        
        # Check for brown
        if a >= TRANSPARENCY_THRESHOLD and is_brown_color(r, g, b):
            brown_pixels.append((r, g, b))
    
    # Calculate properties
    has_transparency = transparent_count > (sample_size * 0.1)  # More than 10% transparent
    has_green = len(green_pixels) > (sample_size * 0.2)  # More than 20% green
    has_brown = len(brown_pixels) > (sample_size * 0.2)  # More than 20% brown
    
    # Calculate average brown shade if present
    avg_brown_shade = None
    if brown_pixels:
        avg_r = sum(p[0] for p in brown_pixels) / len(brown_pixels)
        avg_g = sum(p[1] for p in brown_pixels) / len(brown_pixels)
        avg_b = sum(p[2] for p in brown_pixels) / len(brown_pixels)
        avg_brown_shade = get_brown_shade(avg_r, avg_g, avg_b)
    
    return {
        'has_transparency': has_transparency,
        'has_green': has_green,
        'has_brown': has_brown,
        'brown_shade': avg_brown_shade,
        'transparent_ratio': transparent_count / sample_size if sample_size > 0 else 0
    }

def analyze_tile(tile_path):
    """Analyze a single tile and return edge information"""
    try:
        image = Image.open(tile_path).convert('RGBA')
        edges = {}
        for edge in ['top', 'right', 'bottom', 'left']:
            edges[edge] = analyze_edge(image, edge)
        return edges
    except Exception as e:
        print(f"Error analyzing {tile_path}: {e}")
        return None

def check_compatibility(tile1_edges, tile2_edges, tile1_edge, tile2_edge):
    """
    Check if two specific edges are compatible.
    tile1_edge and tile2_edge are the edge names ('top', 'right', 'bottom', 'left')
    
    Rules:
    1. If bottom edge has transparent pixels - nothing can be underneath
    2. Top surface is only grass - only green/grass edges can be on top
    3. If tile is darker brown then it should be below another tile with straight brown edge of same shade
    """
    edge1_data = tile1_edges[tile1_edge]
    edge2_data = tile2_edges[tile2_edge]
    
    # Rule 1: If bottom edge has transparent pixels - nothing can be underneath
    # If tile1's bottom edge is transparent, nothing can be placed below it
    # Connection: tile1.bottom -> tile2.top means tile2 is below tile1
    if tile1_edge == 'bottom' and edge1_data['has_transparency']:
        return False
    
    # If tile2's bottom edge is transparent, nothing can be placed below it
    # Connection: tile2.bottom -> tile1.top means tile1 is below tile2
    if tile2_edge == 'bottom' and edge2_data['has_transparency']:
        return False
    
    # Rule 2: Top surface is only grass - only green/grass edges can be on top
    # Connection: tile1.top -> tile2.bottom means tile2 is above tile1
    # So tile1.top must be green for tile2 to be above it
    if tile1_edge == 'top' and not edge1_data['has_green']:
        return False
    
    # Connection: tile1.bottom -> tile2.top means tile1 is below tile2
    # So tile2.top must be green for tile1 to be below it
    if tile2_edge == 'top' and not edge2_data['has_green']:
        return False
    
    # Rule 3: Brown shade matching
    # "If tile is darker brown then it should be below another tile with straight brown edge of same shade"
    # This means: darker brown tiles should be positioned below lighter brown tiles
    # They connect via brown edges, and shades should be similar
    if edge1_data['has_brown'] and edge2_data['has_brown']:
        shade1 = edge1_data['brown_shade']
        shade2 = edge2_data['brown_shade']
        if shade1 is not None and shade2 is not None:
            shade_diff = abs(shade1 - shade2)
            
            # If shades are similar enough, allow connection
            if shade_diff <= BROWN_SIMILARITY_THRESHOLD:
                return True
            
            # If shades are different, enforce vertical ordering
            # Darker brown (lower shade value) should be below lighter brown
            if shade1 < shade2:
                # shade1 is darker, should be below shade2
                # So shade1's top edge connects to shade2's bottom edge
                if tile1_edge == 'top' and tile2_edge == 'bottom':
                    return True
                # Horizontal connections are OK if shades are not too different
                if tile1_edge in ['left', 'right'] or tile2_edge in ['left', 'right']:
                    return shade_diff < BROWN_SIMILARITY_THRESHOLD * 3
                return False
            elif shade2 < shade1:
                # shade2 is darker, should be below shade1
                # So shade2's top edge connects to shade1's bottom edge
                if tile2_edge == 'top' and tile1_edge == 'bottom':
                    return True
                # Horizontal connections are OK if shades are not too different
                if tile1_edge in ['left', 'right'] or tile2_edge in ['left', 'right']:
                    return shade_diff < BROWN_SIMILARITY_THRESHOLD * 3
                return False
    
    return True

def generate_matrix():
    """Generate the compatibility matrix for all tiles"""
    tiles_dir = Path(TILES_DIR)
    if not tiles_dir.exists():
        print(f"Error: Tiles directory not found: {TILES_DIR}")
        return None
    
    # Get all tile files
    tile_files = {}
    for i in range(1, 17):
        tile_path = tiles_dir / f"Tile ({i}).png"
        if tile_path.exists():
            tile_files[f"tile-{i}"] = tile_path
    
    for i in range(1, 5):
        tile_path = tiles_dir / f"Bones ({i}).png"
        if tile_path.exists():
            tile_files[f"bone-{i}"] = tile_path
    
    print(f"Found {len(tile_files)} tiles to analyze")
    
    # Analyze all tiles
    tile_analyses = {}
    for tile_key, tile_path in tile_files.items():
        print(f"Analyzing {tile_key}...")
        edges = analyze_tile(tile_path)
        if edges:
            tile_analyses[tile_key] = edges
            # Print edge properties for debugging
            for edge_name, edge_data in edges.items():
                props = []
                if edge_data['has_transparency']:
                    props.append(f"transparent({edge_data['transparent_ratio']:.2f})")
                if edge_data['has_green']:
                    props.append("green")
                if edge_data['has_brown']:
                    props.append(f"brown(shade={edge_data['brown_shade']:.1f})" if edge_data['brown_shade'] else "brown")
                if props:
                    print(f"  {edge_name}: {', '.join(props)}")
    
    # Generate compatibility matrix
    print("\nGenerating compatibility matrix...")
    matrix = {}
    
    for tile1_key, tile1_edges in tile_analyses.items():
        matrix[tile1_key] = {}
        for tile2_key, tile2_edges in tile_analyses.items():
            matrix[tile1_key][tile2_key] = {}
            
            # Check compatibility for each direction
            # Directions: right, bottom, left, top
            # These represent: tile1's right connects to tile2's left, etc.
            directions = {
                'right': ('right', 'left'),   # tile1.right -> tile2.left
                'bottom': ('bottom', 'top'),  # tile1.bottom -> tile2.top
                'left': ('left', 'right'),    # tile1.left -> tile2.right
                'top': ('top', 'bottom')      # tile1.top -> tile2.bottom
            }
            
            for direction, (edge1, edge2) in directions.items():
                compatible = check_compatibility(
                    tile1_edges, tile2_edges, edge1, edge2
                )
                matrix[tile1_key][tile2_key][direction] = {
                    'compatible': compatible,
                    'score': 1.0 if compatible else 0.0
                }
    
    return matrix

def main():
    """Main function"""
    print("Tile Compatibility Matrix Generator (Rule-Based)")
    print("=" * 60)
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Generate matrix
    matrix = generate_matrix()
    
    if matrix is None:
        print("Error: Failed to generate matrix")
        return 1
    
    # Save to file
    output_path = Path(OUTPUT_FILE)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(matrix, f, indent=2)
    
    print(f"\n✓ Matrix saved to {OUTPUT_FILE}")
    
    # Print statistics
    total_combinations = 0
    compatible_combinations = 0
    for tile1 in matrix:
        for tile2 in matrix[tile1]:
            for direction in matrix[tile1][tile2]:
                total_combinations += 1
                if matrix[tile1][tile2][direction]['compatible']:
                    compatible_combinations += 1
    
    print(f"Total combinations: {total_combinations}")
    print(f"Compatible: {compatible_combinations} ({compatible_combinations/total_combinations*100:.1f}%)")
    print(f"Incompatible: {total_combinations - compatible_combinations} ({(total_combinations-compatible_combinations)/total_combinations*100:.1f}%)")
    
    return 0

if __name__ == "__main__":
    exit(main())

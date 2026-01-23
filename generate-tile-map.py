#!/usr/bin/env python3
"""
Generate tile categorization map based on edge analysis.

Categorizes tiles into:
- Solid Ground: Middle part of a platform
- Corners: Top-left, top-right, bottom-left, bottom-right corners
- Edges: Top edge, bottom edge, left edge, right edge
- Background/Decoration: Non-colliding scenery

Requirements:
    pip install Pillow numpy

Usage: python3 generate-tile-map.py
Output: assets/tile-map.json
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
OUTPUT_FILE = "assets/tile-map.json"
EDGE_SAMPLE_SIZE = 30
TRANSPARENCY_THRESHOLD = 128
GREEN_THRESHOLD = 0.3
BROWN_SIMILARITY_THRESHOLD = 30

def is_green_color(r, g, b):
    """Check if a color is a shade of green"""
    total = r + g + b
    if total == 0:
        return False
    green_ratio = g / total
    return green_ratio > GREEN_THRESHOLD and g > r and g > b

def is_brown_color(r, g, b):
    """Check if a color is a shade of brown"""
    brightness = (r + g + b) / 3
    if brightness < 50 or brightness > 200:
        return False
    
    red_green_avg = (r + g) / 2
    if b > red_green_avg * 0.7:
        return False
    
    if r > g * 1.5 and r > b * 1.5:
        return True
    
    return False

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
    has_transparency = transparent_count > (sample_size * 0.1)
    has_green = len(green_pixels) > (sample_size * 0.2)
    has_brown = len(brown_pixels) > (sample_size * 0.2)
    transparent_ratio = transparent_count / sample_size if sample_size > 0 else 0
    
    return {
        'has_transparency': has_transparency,
        'has_green': has_green,
        'has_brown': has_brown,
        'transparent_ratio': transparent_ratio,
        'solid_ratio': 1.0 - transparent_ratio
    }

def analyze_tile(tile_path):
    """Analyze a single tile and return edge information"""
    try:
        image = Image.open(tile_path).convert('RGBA')
        edges = {}
        for edge in ['top', 'right', 'bottom', 'left']:
            edges[edge] = analyze_edge(image, edge)
        
        # Check overall transparency (for background/decoration detection)
        width, height = image.size
        total_pixels = width * height
        transparent_pixels = 0
        for y in range(height):
            for x in range(width):
                pixel = image.getpixel((x, y))
                if len(pixel) == 4 and pixel[3] < TRANSPARENCY_THRESHOLD:
                    transparent_pixels += 1
        
        overall_transparency_ratio = transparent_pixels / total_pixels if total_pixels > 0 else 0
        
        return {
            'edges': edges,
            'overall_transparency_ratio': overall_transparency_ratio,
            'width': width,
            'height': height
        }
    except Exception as e:
        print(f"Error analyzing {tile_path}: {e}")
        return None

def categorize_tile(tile_key, tile_analysis):
    """
    Categorize a tile based on its edge properties.
    
    Categories:
    - Solid Ground: Middle part of a platform (all edges solid, no special features)
    - Corners: Top-left, top-right, bottom-left, bottom-right corners
    - Edges: Top edge, bottom edge, left edge, right edge
    - Background/Decoration: Non-colliding scenery (high transparency)
    """
    if not tile_analysis:
        return None
    
    edges = tile_analysis['edges']
    overall_transparency = tile_analysis['overall_transparency_ratio']
    
    # Background/Decoration: High overall transparency indicates non-colliding scenery
    if overall_transparency > 0.3:
        return {
            'category': 'Background/Decoration',
            'subcategory': None,
            'reason': f'High transparency ({overall_transparency:.2%})'
        }
    
    # Analyze each edge
    top = edges['top']
    right = edges['right']
    bottom = edges['bottom']
    left = edges['left']
    
    # Check for corner patterns
    # Corner tiles typically have two adjacent edges with special features (green grass, transparency, etc.)
    # and two solid edges
    
    # Top-left corner: top and left have special features, right and bottom are solid
    if (top['has_green'] or top['has_transparency']) and \
       (left['has_green'] or left['has_transparency']) and \
       right['solid_ratio'] > 0.8 and bottom['solid_ratio'] > 0.8:
        return {
            'category': 'Corners',
            'subcategory': 'top-left',
            'reason': 'Top and left edges have special features, right and bottom are solid'
        }
    
    # Top-right corner: top and right have special features, left and bottom are solid
    if (top['has_green'] or top['has_transparency']) and \
       (right['has_green'] or right['has_transparency']) and \
       left['solid_ratio'] > 0.8 and bottom['solid_ratio'] > 0.8:
        return {
            'category': 'Corners',
            'subcategory': 'top-right',
            'reason': 'Top and right edges have special features, left and bottom are solid'
        }
    
    # Bottom-left corner: bottom and left have special features, top and right are solid
    if (bottom['has_green'] or bottom['has_transparency']) and \
       (left['has_green'] or left['has_transparency']) and \
       top['solid_ratio'] > 0.8 and right['solid_ratio'] > 0.8:
        return {
            'category': 'Corners',
            'subcategory': 'bottom-left',
            'reason': 'Bottom and left edges have special features, top and right are solid'
        }
    
    # Bottom-right corner: bottom and right have special features, top and left are solid
    if (bottom['has_green'] or bottom['has_transparency']) and \
       (right['has_green'] or right['has_transparency']) and \
       top['solid_ratio'] > 0.8 and left['solid_ratio'] > 0.8:
        return {
            'category': 'Corners',
            'subcategory': 'bottom-right',
            'reason': 'Bottom and right edges have special features, top and left are solid'
        }
    
    # Edge tiles: One edge has special features (transparency or non-grass), others are solid
    # Note: Top edge with green grass is common for solid ground too, so we check for transparency
    # or if only one edge has special features while others are clearly solid
    
    # Top edge (has transparency or special non-grass feature, not just green)
    if (top['has_transparency'] or (top['has_green'] and not (right['has_green'] or left['has_green'] or bottom['has_green']))) and \
       right['solid_ratio'] > 0.8 and bottom['solid_ratio'] > 0.8 and left['solid_ratio'] > 0.8:
        return {
            'category': 'Edges',
            'subcategory': 'top',
            'reason': 'Top edge has special features, other edges are solid'
        }
    
    # Bottom edge
    if (bottom['has_transparency'] or bottom['has_green']) and \
       top['solid_ratio'] > 0.8 and right['solid_ratio'] > 0.8 and left['solid_ratio'] > 0.8:
        return {
            'category': 'Edges',
            'subcategory': 'bottom',
            'reason': 'Bottom edge has special features, other edges are solid'
        }
    
    # Left edge
    if (left['has_transparency'] or left['has_green']) and \
       top['solid_ratio'] > 0.8 and right['solid_ratio'] > 0.8 and bottom['solid_ratio'] > 0.8:
        return {
            'category': 'Edges',
            'subcategory': 'left',
            'reason': 'Left edge has special features, other edges are solid'
        }
    
    # Right edge
    if (right['has_transparency'] or right['has_green']) and \
       top['solid_ratio'] > 0.8 and bottom['solid_ratio'] > 0.8 and left['solid_ratio'] > 0.8:
        return {
            'category': 'Edges',
            'subcategory': 'right',
            'reason': 'Right edge has special features, other edges are solid'
        }
    
    # Solid Ground: All edges are solid
    # This includes tiles with grass on top (common for platform surfaces)
    # but all edges are connectable (no transparency, all solid)
    if all(edge['solid_ratio'] > 0.8 for edge in edges.values()):
        # Even if top has green (grass), if all edges are solid, it's solid ground
        return {
            'category': 'Solid Ground',
            'subcategory': None,
            'reason': 'All edges are solid (may have grass surface on top)'
        }
    
    # Default: If we can't categorize, mark as Solid Ground
    return {
        'category': 'Solid Ground',
        'subcategory': None,
        'reason': 'Default categorization - all edges appear solid'
    }

def generate_tile_map():
    """Generate the tile categorization map for all tiles"""
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
    
    # Analyze and categorize all tiles
    tile_map = {}
    category_counts = {
        'Solid Ground': 0,
        'Corners': 0,
        'Edges': 0,
        'Background/Decoration': 0
    }
    
    for tile_key, tile_path in tile_files.items():
        print(f"Analyzing {tile_key}...")
        tile_analysis = analyze_tile(tile_path)
        if tile_analysis:
            categorization = categorize_tile(tile_key, tile_analysis)
            if categorization:
                tile_map[tile_key] = {
                    'category': categorization['category'],
                    'subcategory': categorization['subcategory'],
                    'reason': categorization['reason'],
                    'edge_properties': {
                        'top': {
                            'has_green': tile_analysis['edges']['top']['has_green'],
                            'has_transparency': tile_analysis['edges']['top']['has_transparency'],
                            'solid_ratio': tile_analysis['edges']['top']['solid_ratio']
                        },
                        'right': {
                            'has_green': tile_analysis['edges']['right']['has_green'],
                            'has_transparency': tile_analysis['edges']['right']['has_transparency'],
                            'solid_ratio': tile_analysis['edges']['right']['solid_ratio']
                        },
                        'bottom': {
                            'has_green': tile_analysis['edges']['bottom']['has_green'],
                            'has_transparency': tile_analysis['edges']['bottom']['has_transparency'],
                            'solid_ratio': tile_analysis['edges']['bottom']['solid_ratio']
                        },
                        'left': {
                            'has_green': tile_analysis['edges']['left']['has_green'],
                            'has_transparency': tile_analysis['edges']['left']['has_transparency'],
                            'solid_ratio': tile_analysis['edges']['left']['solid_ratio']
                        }
                    },
                    'overall_transparency': tile_analysis['overall_transparency_ratio']
                }
                
                # Count by category
                category = categorization['category']
                category_counts[category] = category_counts.get(category, 0) + 1
                
                print(f"  → {categorization['category']}" + 
                      (f" ({categorization['subcategory']})" if categorization['subcategory'] else ""))
                print(f"    {categorization['reason']}")
    
    return tile_map, category_counts

def main():
    """Main function"""
    print("Tile Categorization Map Generator")
    print("=" * 60)
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Generate tile map
    tile_map, category_counts = generate_tile_map()
    
    if tile_map is None:
        print("Error: Failed to generate tile map")
        return 1
    
    # Save to file
    output_path = Path(OUTPUT_FILE)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    output_data = {
        'tiles': tile_map,
        'summary': {
            'total_tiles': len(tile_map),
            'category_counts': category_counts
        }
    }
    
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"\n✓ Tile map saved to {OUTPUT_FILE}")
    
    # Print summary
    print("\nCategorization Summary:")
    print("-" * 60)
    for category, count in category_counts.items():
        percentage = (count / len(tile_map) * 100) if tile_map else 0
        print(f"  {category}: {count} ({percentage:.1f}%)")
    
    # Print tiles by category
    print("\nTiles by Category:")
    print("-" * 60)
    categories = {}
    for tile_key, tile_data in tile_map.items():
        category = tile_data['category']
        subcategory = tile_data.get('subcategory')
        if category not in categories:
            categories[category] = {}
        if subcategory:
            if subcategory not in categories[category]:
                categories[category][subcategory] = []
            categories[category][subcategory].append(tile_key)
        else:
            if 'none' not in categories[category]:
                categories[category]['none'] = []
            categories[category]['none'].append(tile_key)
    
    for category, subcats in sorted(categories.items()):
        print(f"\n{category}:")
        for subcat, tiles in sorted(subcats.items()):
            if subcat == 'none':
                print(f"  - {', '.join(sorted(tiles))}")
            else:
                print(f"  - {subcat}: {', '.join(sorted(tiles))}")
    
    return 0

if __name__ == "__main__":
    exit(main())

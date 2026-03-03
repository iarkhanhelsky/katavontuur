#!/usr/bin/env python3
"""
Draw a 7×5 grid overlay on a spritesheet image:
- Lighter lines along frame boundaries
- Distinct crosses at frame corners/edges (grid intersections)

Usage:
  python scripts/draw_grid_overlay.py [image_path] [--output path]
  
Example:
  python scripts/draw_grid_overlay.py assets/animations/cat3/spritesheet.png
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Requires Pillow: pip install Pillow", file=sys.stderr)
    sys.exit(1)


# Grid layout: 7 columns × 5 rows
COLS = 7
ROWS = 5

# Line styling
GRID_LINE_COLOR = (255, 255, 255, 120)   # light semi-transparent white
GRID_LINE_WIDTH = 1

CROSS_COLOR = (255, 60, 60, 255)         # distinct red
CROSS_SIZE = 8                            # half-length of each cross arm in pixels
CROSS_LINE_WIDTH = 2


def draw_cross(draw: ImageDraw.ImageDraw, cx: int, cy: int) -> None:
    """Draw a + cross centered at (cx, cy)."""
    s = CROSS_SIZE
    # horizontal arm
    draw.line([(cx - s, cy), (cx + s, cy)], fill=CROSS_COLOR, width=CROSS_LINE_WIDTH)
    # vertical arm
    draw.line([(cx, cy - s), (cx, cy + s)], fill=CROSS_COLOR, width=CROSS_LINE_WIDTH)


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    default_input = root / "assets" / "animations" / "spritesheet.png"

    parser = argparse.ArgumentParser(description="Draw 7×5 grid overlay on spritesheet")
    parser.add_argument(
        "image",
        nargs="?",
        type=Path,
        default=default_input,
        help=f"Input image path (default: {default_input})",
    )
    parser.add_argument(
        "-o", "--output",
        type=Path,
        default=None,
        help="Output path (default: input path with _grid suffix before extension)",
    )
    args = parser.parse_args()

    src = args.image if args.image.is_absolute() else root / args.image
    if not src.exists():
        print(f"Error: image not found: {src}", file=sys.stderr)
        sys.exit(1)

    if args.output is not None:
        out = args.output if args.output.is_absolute() else root / args.output
    else:
        out = src.parent / f"{src.stem}_grid{src.suffix}"

    img = Image.open(src).convert("RGBA")
    w, h = img.size

    # Ensure we have an alpha channel for overlay
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    cell_w = w / COLS
    cell_h = h / ROWS

    # --- Lighter grid lines (frame boundaries) ---
    for i in range(COLS + 1):
        x = round(i * cell_w)
        draw.line([(x, 0), (x, h)], fill=GRID_LINE_COLOR, width=GRID_LINE_WIDTH)
    for j in range(ROWS + 1):
        y = round(j * cell_h)
        draw.line([(0, y), (w, y)], fill=GRID_LINE_COLOR, width=GRID_LINE_WIDTH)

    # --- Distinct crosses at each grid intersection ---
    for i in range(COLS + 1):
        for j in range(ROWS + 1):
            cx = round(i * cell_w)
            cy = round(j * cell_h)
            draw_cross(draw, cx, cy)

    # Composite overlay onto original
    result = Image.alpha_composite(img, overlay)
    result.save(out, "PNG")
    print(f"Saved: {out}")


if __name__ == "__main__":
    main()

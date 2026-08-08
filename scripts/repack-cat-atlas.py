#!/usr/bin/env python3
"""Normalize the generated cat sheet into exact, anchored animation cells."""

from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/animations/cat3/spritesheet.png"
OUTPUT = ROOT / "assets/animations/cat4"
CELL = 192
ANCHOR_X = 104
FOOT_Y = 178
ALPHA_THRESHOLD = 12

ANIMATIONS = {
    "idle": (0, 174, 7),
    "walk": (174, 348, 7),
    "run": (348, 522, 7),
    "jump": (522, 694, 7),
    "attack": (694, 864, 3),
}


def largest_component(mask: Image.Image) -> Image.Image:
    width, height = mask.size
    pixels = mask.load()
    seen = bytearray(width * height)
    largest: list[tuple[int, int]] = []

    for y in range(height):
        for x in range(width):
            index = y * width + x
            if seen[index] or not pixels[x, y]:
                continue
            seen[index] = 1
            queue = deque([(x, y)])
            component: list[tuple[int, int]] = []
            while queue:
                px, py = queue.popleft()
                component.append((px, py))
                for ny in range(max(0, py - 1), min(height, py + 2)):
                    for nx in range(max(0, px - 1), min(width, px + 2)):
                        neighbor = ny * width + nx
                        if not seen[neighbor] and pixels[nx, ny]:
                            seen[neighbor] = 1
                            queue.append((nx, ny))
            if len(component) > len(largest):
                largest = component

    selected = Image.new("L", mask.size)
    selected_pixels = selected.load()
    for x, y in largest:
        selected_pixels[x, y] = 255
    return selected


def normalize_frame(frame: Image.Image) -> tuple[Image.Image, dict[str, int]]:
    alpha = frame.getchannel("A")
    threshold = alpha.point(lambda value: 255 if value > ALPHA_THRESHOLD else 0)
    component = largest_component(threshold)
    # Recover the antialiased fringe surrounding the selected opaque component.
    component = component.filter(ImageFilter.MaxFilter(5))
    cleaned_alpha = Image.new("L", frame.size)
    cleaned_alpha.paste(alpha, mask=component)

    cleaned = frame.copy()
    cleaned.putalpha(cleaned_alpha)
    bbox = cleaned_alpha.getbbox()
    if bbox is None:
        raise ValueError("Frame contains no connected character artwork")

    left, top, right, bottom = bbox
    component_pixels = cleaned_alpha.load()
    core_start = left + int((right - left) * 0.38)
    weighted_x = 0
    total_alpha = 0
    for y in range(top, bottom):
        for x in range(core_start, right):
            weight = component_pixels[x, y]
            weighted_x += x * weight
            total_alpha += weight
    core_x = round(weighted_x / total_alpha) if total_alpha else round((left + right) / 2)

    offset_x = ANCHOR_X - core_x
    offset_y = FOOT_Y - bottom
    normalized = Image.new("RGBA", (CELL, CELL))
    normalized.alpha_composite(cleaned, (offset_x, offset_y))
    return normalized, {
        "source_left": left,
        "source_top": top,
        "source_right": right,
        "source_bottom": bottom,
        "core_x": core_x,
        "offset_x": offset_x,
        "offset_y": offset_y,
    }


def main() -> None:
    sheet = Image.open(SOURCE).convert("RGBA")
    OUTPUT.mkdir(parents=True, exist_ok=True)

    for name, (row_top, row_bottom, frame_count) in ANIMATIONS.items():
        atlas = Image.new("RGBA", (CELL * frame_count, CELL))
        for index in range(frame_count):
            left = round(index * sheet.width / 7)
            right = round((index + 1) * sheet.width / 7)
            source_frame = sheet.crop((left, row_top, right, row_bottom))
            frame, metrics = normalize_frame(source_frame)
            atlas.alpha_composite(frame, (index * CELL, 0))
            print(f"{name}[{index}] source={right-left}x{row_bottom-row_top} {metrics}")
        atlas.save(OUTPUT / f"{name}.png", optimize=True)


if __name__ == "__main__":
    main()

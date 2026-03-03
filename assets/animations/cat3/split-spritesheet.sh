#!/usr/bin/env bash
# Split cat3 spritesheet (7x5 grid) into row animations.
# Rows 1–4: frame height 174px. Row 5: frame height 170px + 2px top/bottom.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SPRITESHEET="${1:-spritesheet.png}"
if [[ ! -f "$SPRITESHEET" ]]; then
  echo "Error: spritesheet not found: $SPRITESHEET" >&2
  exit 1
fi

# Full width; row heights: 174 for rows 1–4, 170 for row 5 then +2 top/bottom
W=1216
H_ROW=174
H_ATTACK=170

magick "$SPRITESHEET" -crop "${W}x${H_ROW}+0+0"     idle.png
magick "$SPRITESHEET" -crop "${W}x${H_ROW}+0+174"   walk.png
magick "$SPRITESHEET" -crop "${W}x${H_ROW}+0+348"  run.png
magick "$SPRITESHEET" -crop "${W}x${H_ROW}+0+522"  jump.png
# Row 5: 170px strip from bottom, then add 2px top and 2px bottom
magick "$SPRITESHEET" -crop "${W}x${H_ATTACK}+0+694" -background none -splice 0x2+0+0 -splice 0x2+0+172 attack.png

echo "Split complete: idle.png walk.png run.png jump.png attack.png"

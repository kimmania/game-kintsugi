#!/usr/bin/env python3
"""Generate PWA icons from a generated base image."""
import os
import sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "icons")


def draw_kintsugi_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (26, 24, 20, 255))
    draw = ImageDraw.Draw(img)
    pad = size // 10
    cx, cy = size // 2, size // 2
    r = (size - 2 * pad) // 2
    # Outer bowl
    draw.ellipse([pad, pad, size - pad, size - pad], fill=(60, 58, 54, 255), outline=(30, 28, 24, 255), width=2)
    # Glaze fragments
    wedge_colors = [
        (127, 176, 105),
        (59, 91, 166),
        (184, 92, 56),
        (232, 220, 197),
    ]
    for i, col in enumerate(wedge_colors):
        start = 90 + i * 75
        end = start + 70
        draw.pieslice(
            [pad + 6, pad + 6, size - pad - 6, size - pad - 6],
            start=start,
            end=end,
            fill=col,
            outline=(90, 88, 84, 255),
            width=1,
        )
    # Gold seams
    for i in range(4):
        angle = math.radians(90 + i * 75 + 35)
        x1 = cx + int(r * 0.35 * math.cos(angle))
        y1 = cy - int(r * 0.35 * math.sin(angle))
        x2 = cx + int(r * 0.85 * math.cos(angle))
        y2 = cy - int(r * 0.85 * math.sin(angle))
        draw.line([(x1, y1), (x2, y2)], fill=(212, 175, 55, 255), width=max(2, size // 40))
    # Center gold pool
    draw.ellipse([cx - size // 12, cy - size // 12, cx + size // 12, cy + size // 12], fill=(212, 175, 55, 255))
    return img


import math


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    sizes = {
        "icon-512.png": 512,
        "icon-192.png": 192,
        "apple-touch-icon.png": 180,
        "maskable-512.png": 512,
    }
    base = draw_kintsugi_icon(1024)
    for name, sz in sizes.items():
        resized = base.resize((sz, sz), Image.Resampling.LANCZOS)
        if name == "maskable-512.png":
            # Add safe zone background
            padded = Image.new("RGBA", (sz, sz), (26, 24, 20, 255))
            inset = sz // 12
            fg = resized.resize((sz - 2 * inset, sz - 2 * inset), Image.Resampling.LANCZOS)
            padded.paste(fg, (inset, inset), fg)
            resized = padded
        resized.save(os.path.join(OUT_DIR, name))
        print(f"Saved {name}", file=sys.stderr)


if __name__ == "__main__":
    main()

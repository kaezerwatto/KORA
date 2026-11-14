#!/usr/bin/env python3
"""Generate KORA's original two-language conversation mark as Chrome PNG icons."""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src/icons"
CANVAS = 1024


def rounded_polygon(draw: ImageDraw.ImageDraw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def build_icon() -> Image.Image:
    image = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    # Use almost the full canvas: Chrome renders extension marks inside a
    # fixed-size slot, so internal padding must stay small for visual presence.
    draw.rounded_rectangle((8, 8, 1016, 1016), radius=240, fill="#0B0F14")
    draw.rounded_rectangle((22, 22, 1002, 1002), radius=226, outline="#26313A", width=10)

    # First voice: an open, light speech card.
    rounded_polygon(draw, (96, 142, 720, 544), 120, "#F5F2E9")
    draw.polygon([(170, 510), (172, 690), (350, 536)], fill="#F5F2E9")
    draw.rounded_rectangle((225, 280, 600, 318), radius=19, fill="#0B0F14")
    draw.rounded_rectangle((225, 372, 510, 410), radius=19, fill="#0B0F14")

    # Second voice: Adamawa Fulfulde answer, offset and visibly connected.
    rounded_polygon(draw, (292, 430, 932, 838), 120, "#16B891")
    draw.polygon([(750, 800), (830, 952), (650, 824)], fill="#16B891")
    draw.rounded_rectangle((435, 574, 810, 612), radius=19, fill="#071B17")
    draw.rounded_rectangle((435, 666, 720, 704), radius=19, fill="#071B17")

    # The overlap forms a subtle bridge between both languages.
    draw.rounded_rectangle((348, 408, 630, 452), radius=22, fill="#E9B949")
    return image


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    master = build_icon()
    for size in (16, 32, 48, 128):
        resized = master.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(OUTPUT / f"icon-{size}.png", optimize=True)
    print(f"Generated KORA icons in {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

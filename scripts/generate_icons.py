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

    # Keep the dark tile large in Chrome while leaving a calm safety margin
    # between the speech mark and the outer contour.
    draw.rounded_rectangle((2, 2, 1022, 1022), radius=226, fill="#0B0F14")
    draw.rounded_rectangle((16, 16, 1008, 1008), radius=214, outline="#26313A", width=12)

    # First voice: an open, light speech card.
    rounded_polygon(draw, (82, 118, 742, 552), 118, "#F5F2E9")
    draw.polygon([(142, 515), (150, 690), (330, 540)], fill="#F5F2E9")
    draw.rounded_rectangle((200, 263, 610, 307), radius=22, fill="#0B1720")
    draw.rounded_rectangle((200, 360, 510, 404), radius=22, fill="#0B1720")

    # Second voice: Adamawa Fulfulde answer, offset and visibly connected.
    rounded_polygon(draw, (270, 390, 942, 838), 124, "#16B891")
    draw.polygon([(742, 800), (838, 944), (640, 826)], fill="#16B891")
    draw.rounded_rectangle((410, 546, 812, 592), radius=23, fill="#071B17")
    draw.rounded_rectangle((410, 646, 716, 692), radius=23, fill="#071B17")

    # The overlap forms a subtle bridge between both languages.
    draw.rounded_rectangle((325, 358, 635, 406), radius=24, fill="#F5B942")
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

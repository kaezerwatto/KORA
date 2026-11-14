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

    draw.rounded_rectangle((32, 32, 992, 992), radius=232, fill="#0B0F14")
    draw.rounded_rectangle((46, 46, 978, 978), radius=218, outline="#26313A", width=10)

    # First voice: an open, light speech card.
    rounded_polygon(draw, (174, 192, 690, 536), 112, "#F5F2E9")
    draw.polygon([(250, 500), (250, 648), (394, 526)], fill="#F5F2E9")
    draw.rounded_rectangle((286, 310, 566, 342), radius=16, fill="#0B0F14")
    draw.rounded_rectangle((286, 386, 494, 418), radius=16, fill="#0B0F14")

    # Second voice: Adamawa Fulfulde answer, offset and visibly connected.
    rounded_polygon(draw, (370, 488, 850, 794), 104, "#16B891")
    draw.polygon([(728, 760), (778, 872), (622, 784)], fill="#16B891")
    draw.rounded_rectangle((488, 590, 734, 622), radius=16, fill="#071B17")
    draw.rounded_rectangle((488, 666, 658, 698), radius=16, fill="#071B17")

    # The overlap forms a subtle bridge between both languages.
    draw.rounded_rectangle((420, 470, 604, 510), radius=20, fill="#E9B949")
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

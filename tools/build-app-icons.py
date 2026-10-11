"""Rasterize the portal's existing two-circle favicon for home-screen use."""
from pathlib import Path
from PIL import Image, ImageDraw

assets = Path(__file__).resolve().parents[1] / "dist" / "assets"
for size in (180, 192, 512):
    scale = size * 4 / 64
    image = Image.new("RGB", (size * 4, size * 4), "#071b30")
    draw = ImageDraw.Draw(image)
    # Centered strokes matching index.html's existing SVG. Both circles fit
    # inside the central 80% maskable safe area, with an opaque background.
    for cx, cy, radius, width, color in (
        (32, 32, 20, 5, "#099b98"),
        (34, 28, 11, 4, "#ffffff"),
    ):
        radius += width / 2
        box = tuple(round(value * scale) for value in (
            cx - radius, cy - radius, cx + radius, cy + radius
        ))
        draw.ellipse(box, outline=color, width=round(width * scale))
    image.resize((size, size), Image.Resampling.LANCZOS).save(
        assets / f"app-icon-{size}.png", optimize=True
    )

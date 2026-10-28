"""Use the supplied approved symbol for app/favicons (manual 2022, pp 7–8).

The wordmark PNG stays byte-identical. Extracting the unchanged symbol is
expressly permitted for an app. No redrawing, recoloring or distortion.
A 44% symbol width reserves >= the scaled f-height around all sides and
fits inside the central maskable safe circle.
"""
from pathlib import Path
from PIL import Image

assets = Path(__file__).resolve().parents[1] / 'dist' / 'assets'
source = Image.open(assets / 'brand' / 'logo-white.png').convert('RGBA')
assert source.size == (1170, 199)
symbol = source.crop((0, 0, 230, 184))
for size in (32, 180, 192, 512):
    width = round(size * .44)
    height = round(width * 184 / 230)
    mark = symbol.resize((width, height), Image.Resampling.LANCZOS)
    image = Image.new('RGBA', (size, size), '#013c57')
    image.alpha_composite(mark, ((size-width)//2, (size-height)//2))
    target = assets / 'brand' / 'favicon-32.png' if size == 32 else assets / f'app-icon-{size}.png'
    image.convert('RGB').save(target, optimize=True)

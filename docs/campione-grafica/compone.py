"""Campione grafico di revisione: ritagli alpha veri e scena telefonica.

Usa soltanto le tavole sorgente generate; non tocca gli asset del gioco.
Richiede Pillow e NumPy. Eseguire dalla cartella docs/campione-grafica/.
"""
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageOps

HERE = Path(__file__).resolve().parent
SOURCE = Image.open(HERE / 'sorgente-oggetti.png').convert('RGBA')
GROUND = Image.open(HERE / 'sorgente-terreno.png').convert('RGB')
DATA = np.asarray(SOURCE)
SOLID = DATA[:, :, 3] >= 220
H, W = SOLID.shape
SEEN = np.zeros_like(SOLID)
components = []
for y, x in zip(*np.nonzero(SOLID)):
    if SEEN[y, x]:
        continue
    queue = deque([(int(y), int(x))])
    SEEN[y, x] = True
    coords = []
    x0 = x1 = int(x)
    y0 = y1 = int(y)
    while queue:
        yy, xx = queue.popleft()
        coords.append((yy, xx))
        x0, x1 = min(x0, xx), max(x1, xx)
        y0, y1 = min(y0, yy), max(y1, yy)
        for ny, nx in ((yy - 1, xx), (yy + 1, xx), (yy, xx - 1), (yy, xx + 1)):
            if 0 <= ny < H and 0 <= nx < W and SOLID[ny, nx] and not SEEN[ny, nx]:
                SEEN[ny, nx] = True
                queue.append((ny, nx))
    if len(coords) >= 1000:
        components.append((x0, y0, x1, y1, coords))

upper = sorted((c for c in components if c[1] < 405), key=lambda c: c[0])
people = sorted((c for c in components if 405 <= c[1] < 660), key=lambda c: c[0])
lower = sorted((c for c in components if c[1] >= 660), key=lambda c: c[0])
assert (len(upper), len(people), len(lower)) == (4, 5, 4), (len(upper), len(people), len(lower))
names = ['casa', 'granaio', 'bottega', 'palizzata',
         'raccoglitore', 'contadino', 'costruttore', 'portatore', 'guardia',
         'pecora', 'razziatore', 'albero', 'pietra-bacche']
ordered = upper + people + lower
cuts = HERE / 'ritagli'
cuts.mkdir(exist_ok=True)
sprites = {}
for name, (x0, y0, x1, y1, coords) in zip(names, ordered):
    pad = 5
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(W - 1, x1 + pad), min(H - 1, y1 + pad)
    crop = DATA[y0:y1 + 1, x0:x1 + 1].copy()
    mask = np.zeros(crop.shape[:2], dtype=np.uint8)
    for yy, xx in coords:
        mask[yy - y0, xx - x0] = 255
    crop[:, :, 3] = mask
    sprite = Image.fromarray(crop, 'RGBA')
    sprite.save(cuts / (name + '.png'), optimize=True)
    assert sprite.getchannel('A').getextrema() == (0, 255)
    assert not np.any(mask[0]) and not np.any(mask[-1]) and not np.any(mask[:, 0]) and not np.any(mask[:, -1])
    sprites[name] = sprite

# Logical 195x390 art pixels, presented at 390x780 with nearest neighbour.
LW, LH = 195, 390
terrain = ImageOps.fit(GROUND, (LW, LH), method=Image.Resampling.BOX)
terrain = ImageEnhance.Contrast(ImageEnhance.Brightness(terrain).enhance(.81)).enhance(.82)
scene = terrain.convert('RGBA')

def place(name, cx, cy, width, back_shadow=True):
    sprite = sprites[name]
    height = max(1, round(sprite.height * width / sprite.width))
    art = sprite.resize((width, height), Image.Resampling.NEAREST)
    if back_shadow:
        overlay = Image.new('RGBA', scene.size)
        draw = ImageDraw.Draw(overlay)
        radius = max(5, width // 3)
        draw.ellipse((cx - radius, cy + height // 4, cx + radius, cy + height // 4 + 5), fill=(16, 26, 14, 75))
        scene.alpha_composite(overlay)
    scene.alpha_composite(art, (cx - width // 2, cy - height // 2))

# One village; all coordinates are in the same scene, not isolated previews.
for item in [
    ('casa', 56, 78, 55), ('granaio', 143, 80, 58),
    ('albero', 25, 155, 39), ('bottega', 57, 205, 64),
    ('palizzata', 149, 207, 54), ('pietra-bacche', 164, 367, 45),
    ('pecora', 36, 303, 23),
    ('raccoglitore', 97, 144, 23), ('costruttore', 105, 219, 24),
    ('portatore', 78, 292, 22), ('guardia', 147, 281, 26),
    ('contadino', 116, 348, 23), ('razziatore', 168, 327, 28),
]:
    place(*item)
scene.convert('RGB').resize((390, 780), Image.Resampling.NEAREST).save(HERE / 'scena-telefono.png', optimize=True)

# A separate inspection board lets Simone judge silhouettes at readable phone size.
board = Image.new('RGB', (390, 520), (36, 43, 33))
d = ImageDraw.Draw(board)
labels = ['Casa', 'Granaio', 'Bottega', 'Palizzata', 'Raccoglitore', 'Contadino',
          'Costruttore', 'Portatore', 'Guardia', 'Pecora', 'Razziatore', 'Albero', 'Pietra e bacche']
for i, (name, label) in enumerate(zip(names, labels)):
    col, row = i % 4, i // 4
    x, y = col * 97, row * 130
    d.rectangle((x + 2, y + 2, x + 94, y + 126), fill=(54, 65, 46), outline=(123, 110, 70))
    sp = sprites[name]
    target_w = 58 if row == 0 else 40
    scale = min(target_w / sp.width, 82 / sp.height)
    sp = sp.resize((max(1, round(sp.width * scale)), max(1, round(sp.height * scale))), Image.Resampling.NEAREST)
    board.paste(sp, (x + 48 - sp.width // 2, y + 9 + (84 - sp.height) // 2), sp)
    d.text((x + 5, y + 100), label, fill=(237, 227, 193))
board.save(HERE / 'tavola-ritagli.png', optimize=True)
print(f'{len(sprites)} ritagli RGBA; scena 390x780; tavola 390x520')

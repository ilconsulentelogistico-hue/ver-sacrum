"""Deriva asset P16 dalle tavole approvate di Ver Sacrum.

Eseguire dalla cartella del repository. Gli originali sono conservati in docs/.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / 'docs/grafica-completa/sorgenti'
SAMPLE = ROOT / 'docs/campione-grafica/ritagli'
ASSETS = ROOT / 'assets/p16'


def solid_cut(image):
    image = image.convert('RGBA')
    a = np.asarray(image.getchannel('A'))
    mask = Image.fromarray(np.where(a >= 220, 255, 0).astype('uint8'))
    box = mask.getbbox()
    if not box:
        raise ValueError('Cella senza soggetto')
    out = image.crop(box)
    out.putalpha(mask.crop(box))
    return out


def grid(name, columns, rows):
    image = Image.open(SOURCES / name).convert('RGBA')
    result = []
    for row in range(rows):
        for col in range(columns):
            box = (round(col * image.width / columns), round(row * image.height / rows),
                   round((col + 1) * image.width / columns), round((row + 1) * image.height / rows))
            result.append(solid_cut(image.crop(box)))
    return result


def sample(name):
    return solid_cut(Image.open(SAMPLE / (name + '.png')))


def sprite(source, size, padding=2, tint=None):
    w, h = size
    source = solid_cut(source)
    factor = min((w - padding * 2) / source.width, (h - padding * 2) / source.height)
    sw, sh = max(1, round(source.width * factor)), max(1, round(source.height * factor))
    small = source.resize((sw, sh), Image.Resampling.BOX)
    alpha = small.getchannel('A').point(lambda v: 255 if v >= 130 else 0)
    rgb = small.convert('RGB').quantize(colors=48, dither=Image.Dither.NONE).convert('RGB')
    if tint:
        rgb = Image.blend(rgb, Image.new('RGB', rgb.size, tint), .18)
    small = rgb.convert('RGBA')
    small.putalpha(alpha)
    canvas = Image.new('RGBA', size)
    x, y = (w - sw) // 2, (h - sh) // 2
    canvas.alpha_composite(small, (x, y))
    # Chiude la silhouette con un bordo scuro di un art-pixel, senza alone.
    shape = canvas.getchannel('A')
    edge = shape.filter(ImageFilter.MaxFilter(3))
    outline = Image.new('RGBA', size, (37, 29, 20, 0))
    outline.putalpha(Image.fromarray(np.where((np.asarray(edge) > 0) &
                                             (np.asarray(shape) == 0), 255, 0).astype('uint8')))
    outline.alpha_composite(canvas)
    return outline


def save(image, relative):
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)
    return path


buildings = grid('edifici.png', 3, 3)
people = grid('persone.png', 3, 2)
artisans = grid('artigiani.png', 2, 2)
animals = grid('animali.png', 4, 2)
resources = grid('risorse.png', 4, 2)

building_sources = {
    'house': sample('casa'), 'warehouse': sample('granaio'),
    'sawmill': sample('bottega'), 'tower': buildings[0],
    'mill': buildings[1], 'kiln': buildings[2], 'loom': buildings[3],
    'foundry': buildings[4], 'press': buildings[5], 'bakery': buildings[6],
    'market': buildings[7], 'pen': buildings[8],
}
for name, source in building_sources.items():
    size = (64, 64) if name not in ('tower', 'pen') else (64, 68)
    save(sprite(source, size), f'assets/p16/buildings/building_{name}_p16.png')

# Totem centrale: legno/pietra dello stesso set, visto dall'alto.
totem = Image.new('RGBA', (32, 32))
d = ImageDraw.Draw(totem)
d.ellipse((3, 4, 28, 29), fill='#7d6548', outline='#251d17', width=2)
d.ellipse((7, 8, 24, 25), fill='#a58a58', outline='#4a3323', width=2)
d.rectangle((13, 4, 18, 23), fill='#774523', outline='#291b13', width=1)
d.ellipse((11, 2, 20, 10), fill='#c39a54', outline='#291b13', width=1)
save(totem, 'assets/p16/buildings/building_base_p16.png')

profession_sources = {
    'libero': people[0], 'taglialegna': sample('raccoglitore'),
    'minatore': people[1], 'contadino': sample('contadino'),
    'costruttore': sample('costruttore'), 'trasportatore': sample('portatore'),
    'mugnaio': people[2], 'fornaio': people[3],
    'allevatore': people[4], 'mobilitato': sample('guardia'),
    'ceramista': artisans[0], 'tessitore': artisans[1],
    'fonditore': artisans[2], 'torchiatore': artisans[3],
}
for name, source in profession_sources.items():
    save(sprite(source, (42, 42)), f'assets/p16/professions/{name}.png')
# Quattro tuniche per i fondatori: una persona mantiene lo stesso colore per ID.
free = np.asarray(sprite(people[0], (42, 42))).copy()
for index, tint in enumerate(((112, 77, 51), (73, 91, 65), (73, 95, 111)), 1):
    colors = free.copy()
    for y in range(6, 32):
        for x in range(5, 37):
            r, g, b, a = (int(v) for v in colors[y, x])
            if a and r > 105 and g > 94 and b > 66 and r - g < 55 and g - b < 58:
                light = max(.60, min(1.55, (r + g + b) / 470))
                colors[y, x, :3] = [min(255, round(c * light)) for c in tint]
    save(Image.fromarray(colors, 'RGBA'), f'assets/p16/professions/libero-var{index}.png')
save(sprite(sample('razziatore'), (32, 36)), 'assets/p16/units/unit_raider_p16.png')

animal_names = ('sheep', 'goat', 'cow', 'wolf')
for i, name in enumerate(animal_names):
    size = (32, 28) if name != 'cow' else (36, 31)
    for state, source in [('alive', animals[i]), ('dead', animals[i + 4])]:
        save(sprite(source, size), f'assets/p16/animals-nuovi/{name}_{state}.png')
    # Ossa stilizzate con contorno scuro: uno scheletro deve leggersi a 20 px.
    bones = Image.new('RGBA', size)
    d = ImageDraw.Draw(bones)
    cx, cy = size[0] // 2, size[1] // 2
    dark, ivory, shade = '#332a22', '#e2d3aa', '#ab9878'
    d.line((cx - 9, cy + 5, cx + 9, cy - 3), fill=dark, width=5)
    d.line((cx - 9, cy + 5, cx + 9, cy - 3), fill=ivory, width=2)
    d.ellipse((cx - 13, cy + 1, cx - 6, cy + 8), fill=ivory, outline=dark, width=1)
    d.point((cx - 11, cy + 4), fill=dark)
    if name in ('goat', 'cow'):
        for hx in (cx - 12, cx - 7):
            d.line((hx, cy + 1, hx - 1, cy - (4 if name == 'goat' else 2)), fill=dark, width=3)
            d.line((hx, cy + 1, hx - 1, cy - (4 if name == 'goat' else 2)), fill=ivory, width=1)
    elif name == 'wolf':
        d.polygon(((cx - 13, cy + 3), (cx - 15, cy + 5), (cx - 12, cy + 7)), fill=ivory)
        d.line((cx - 11, cy + 1, cx - 10, cy - 2), fill=dark, width=2)
    for dx in (-3, 1, 5):
        y = cy + 2 - dx // 2
        d.line((cx + dx - 1, y - 5, cx + dx + 2, y + 5), fill=dark, width=3)
        d.line((cx + dx, y - 4, cx + dx + 1, y + 4), fill=shade, width=1)
    for x1, y1, x2, y2 in ((cx - 5, cy + 5, cx - 9, cy + 10),
                           (cx + 5, cy + 2, cx + 11, cy + 8),
                           (cx + 6, cy - 4, cx + 11, cy - 8)):
        d.line((x1, y1, x2, y2), fill=dark, width=4)
        d.line((x1, y1, x2, y2), fill=ivory, width=2)
    save(bones, f'assets/p16/animals-nuovi/{name}_skeleton.png')
    if name in ('sheep', 'wolf'):
        save(sprite(animals[i], size), f'assets/p16/animals/animal_{name}_p16.png')


def diminished(source, size, scale, dark=False):
    base = sprite(source, size)
    if dark:
        pixels = np.asarray(base).copy()
        solid = pixels[:, :, 3] > 0
        pixels[solid, :3] = (pixels[solid, :3].astype(float) * .58 +
                              np.array([77, 64, 43]) * .42).astype('uint8')
        base = Image.fromarray(pixels, 'RGBA')
    if scale == 1:
        return base
    sw, sh = max(4, round(size[0] * scale)), max(4, round(size[1] * scale))
    small = base.resize((sw, sh), Image.Resampling.NEAREST)
    out = Image.new('RGBA', size)
    out.alpha_composite(small, ((size[0] - sw) // 2, (size[1] - sh) // 2))
    return out


resource_base = {'forest': resources[0], 'berries': resources[1], 'stone': resources[2],
                 'ore': resources[3], 'clay': resources[4], 'copper': resources[5],
                 'tin': resources[6]}
for kind, source in resource_base.items():
    if kind in ('forest', 'berries'):
        for state, scale in [('full', 1), ('medium', .82), ('low', .60), ('empty', .36)]:
            save(diminished(source, (40, 40), scale, state == 'empty'),
                 f'assets/p16/resources-nuovi/{kind}_{state}_hex.png')
    elif kind in ('stone', 'ore'):
        for direction in ('up', 'down'):
            for state, scale in [('full', 1), ('low', .62)]:
                tile = diminished(source, (34, 34), scale, state == 'low')
                if direction == 'down':
                    tile = ImageOps.mirror(tile)
                save(tile, f'assets/p16/resources-nuovi/{kind}_{direction}_{state}_tri.png')
    else:
        for state, scale in [('full', 1), ('low', .62)]:
            save(diminished(source, (34, 34), scale, state == 'low'),
                 f'assets/p16/resources-nuovi/{kind}_{state}_hex.png')
# Orientamento e luci leggere diversi evitano filari identici di alberi.
for kind in ('forest', 'berries'):
    for state in ('full', 'medium'):
        base = Image.open(ROOT / f'assets/p16/resources-nuovi/{kind}_{state}_hex.png').convert('RGBA')
        save(ImageEnhance.Brightness(ImageOps.mirror(base)).enhance(.90),
             f'assets/p16/resources-nuovi/{kind}_{state}_hex_v1.png')
        save(ImageEnhance.Brightness(base.rotate(90, resample=Image.Resampling.NEAREST)).enhance(1.10),
             f'assets/p16/resources-nuovi/{kind}_{state}_hex_v2.png')
save(sprite(resources[7], (34, 30)), 'assets/p16/resources-nuovi/cut_logs.png')

# Marcatura della selezione in ambra, leggibile sul fondo scuro e chiaro.
ring = Image.new('RGBA', (32, 32))
d = ImageDraw.Draw(ring)
d.ellipse((1, 1, 30, 30), outline='#2a2219', width=3)
d.ellipse((3, 3, 28, 28), outline='#e8bf6b', width=2)
for x, y in ((16, 3), (28, 16), (16, 28), (3, 16)):
    d.ellipse((x - 2, y - 2, x + 2, y + 2), fill='#f1d38a', outline='#302419')
save(ring, 'assets/p16/ui/ui_selection_marker_p16.png')
for name, source in [('food', resources[1]), ('wood', resources[7]),
                     ('stone', resources[2]), ('iron', resources[3])]:
    save(sprite(source, (16, 16), padding=2), f'assets/p16/ui/icon_{name}.png')
# Tavola di controllo per la revisione visiva di Simone.
preview_files = ([ROOT / f'assets/p16/buildings/building_{name}_p16.png' for name in building_sources] +
                 [ROOT / 'assets/p16/buildings/building_base_p16.png'] +
                 sorted((ROOT / 'assets/p16/professions').glob('*.png')) +
                 sorted((ROOT / 'assets/p16/animals-nuovi').glob('*.png')) +
                 sorted((ROOT / 'assets/p16/resources-nuovi').glob('*.png')) +
                 sorted((ROOT / 'assets/p16/ui').glob('icon_*.png')) +
                 [ROOT / 'assets/p16/ui/ui_selection_marker_p16.png',
                  ROOT / 'assets/p16/units/unit_raider_p16.png'])
assert len(preview_files) == 79
columns, cell_w, cell_h = 8, 106, 116
rows = (len(preview_files) + columns - 1) // columns
preview = Image.new('RGB', (columns * cell_w, rows * cell_h), (32, 39, 29))
d = ImageDraw.Draw(preview)
for i, path in enumerate(preview_files):
    x, y = (i % columns) * cell_w, (i // columns) * cell_h
    d.rectangle((x + 2, y + 2, x + cell_w - 3, y + cell_h - 3),
                fill=(69, 78, 53), outline=(142, 119, 75), width=1)
    art = Image.open(path).convert('RGBA')
    factor = min(82 / art.width, 82 / art.height)
    art = art.resize((max(1, round(art.width * factor)),
                      max(1, round(art.height * factor))), Image.Resampling.NEAREST)
    preview.paste(art, (x + (cell_w - art.width) // 2,
                        y + 5 + (84 - art.height) // 2), art)
    label = path.stem.replace('building_', '').replace('_p16', '').replace('_hex', '').replace('_tri', '')
    d.text((x + 5, y + 91), label[:17], fill=(244, 226, 184))
preview.save(ROOT / 'docs/grafica-completa/controllo-atlanti.png', optimize=True)
print('P16 nuovi: 13 edifici, 17 varianti mestieri, 12 stati animali, 31 stati risorse, 5 UI')

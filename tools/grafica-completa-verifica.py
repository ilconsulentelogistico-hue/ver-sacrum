"""Verifica autonoma degli asset della grafica completa di Ver Sacrum."""
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
groups = {
    'mestieri': sorted((ROOT / 'assets/p16/professions').glob('*.png')),
    'animali': sorted((ROOT / 'assets/p16/animals-nuovi').glob('*.png')),
    'risorse': sorted((ROOT / 'assets/p16/resources-nuovi').glob('*.png')),
    'edifici': [ROOT / f'assets/p16/buildings/building_{name}_p16.png' for name in
                ('base', 'sawmill', 'bakery', 'market', 'pen', 'warehouse', 'tower',
                 'mill', 'kiln', 'loom', 'foundry', 'press', 'house')],
    'UI': [ROOT / f'assets/p16/ui/icon_{name}.png' for name in
           ('food', 'wood', 'stone', 'iron')] +
          [ROOT / 'assets/p16/ui/ui_selection_marker_p16.png'],
    'razzia': [ROOT / 'assets/p16/units/unit_raider_p16.png'],
}
assert {name: len(files) for name, files in groups.items()} == {
    'mestieri': 17, 'animali': 12, 'risorse': 31, 'edifici': 13, 'UI': 5, 'razzia': 1}
sw = (ROOT / 'sw.js').read_text()
total = 0
for group, paths in groups.items():
    for path in paths:
        assert path.is_file(), path
        with Image.open(path) as opened:
            opened.load()
            assert opened.format == 'PNG', path
            image = opened.convert('RGBA')
        alpha = image.getchannel('A')
        assert alpha.getextrema() == (0, 255), path
        assert alpha.getbbox(), path
        assert alpha.crop((0, 0, image.width, 1)).getbbox() is None, path
        assert alpha.crop((0, image.height - 1, image.width, image.height)).getbbox() is None, path
        assert alpha.crop((0, 0, 1, image.height)).getbbox() is None, path
        assert alpha.crop((image.width - 1, 0, image.width, image.height)).getbbox() is None, path
        assert './' + str(path.relative_to(ROOT)) in sw, (group, path)
        total += path.stat().st_size
for i in range(1, 4):
    base = Image.open(ROOT / 'assets/p16/professions/libero.png').convert('RGBA')
    variant = Image.open(ROOT / f'assets/p16/professions/libero-var{i}.png').convert('RGBA')
    assert base.getchannel('A').tobytes() == variant.getchannel('A').tobytes()
    assert ImageChops.difference(base.convert('RGB'), variant.convert('RGB')).getbbox(), i
assert Image.open(ROOT / 'assets/p16/buildings/building_warehouse_p16.png').size == (64, 64)
print('OK: 79 PNG attivi, alpha e margini validi, varianti distinte, magazzino leggibile, cache completa;')
print(f'    totale PNG attivi {total:,} byte ({total / 1024:.1f} KiB)')

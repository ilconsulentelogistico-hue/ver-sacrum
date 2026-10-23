"""Controlli meccanici sul solo campione grafico (nessun asset di gioco)."""
from pathlib import Path
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parent
files=sorted((root/'ritagli').glob('*.png'))
assert len(files)==13,len(files)
source=Image.open(root/'sorgente-oggetti.png')
assert source.mode=='RGBA'
assert source.getchannel('A').getextrema()[0]==0
for path in files:
    image=Image.open(path).convert('RGBA')
    alpha=np.asarray(image.getchannel('A'))
    assert np.any(alpha==255),path.name
    assert set(np.unique(alpha)).issubset({0,255}),path.name
    assert not alpha[0].any() and not alpha[-1].any() and not alpha[:,0].any() and not alpha[:,-1].any(),path.name
    assert (alpha==0).sum()>image.width*2,path.name
    print(path.name, image.size, 'solid',int((alpha==255).sum()))
assert Image.open(root/'scena-telefono.png').size==(390,780)
assert Image.open(root/'tavola-ritagli.png').size==(390,520)
repo=root.parent.parent
for name in ('index.html','asset-render.js','sw.js'):
    assert 'campione-grafica' not in (repo/name).read_text(),name
print('OK: 13 cutout RGBA reali, margini trasparenti, scena 390x780, nessuna integrazione runtime')

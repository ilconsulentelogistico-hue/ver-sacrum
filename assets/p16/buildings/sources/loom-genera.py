from pathlib import Path
from PIL import Image, ImageDraw

out=Path(__file__).resolve().parents[1]/"building_loom_p16.png"
im=Image.new("RGBA",(48,48),(0,0,0,0));d=ImageDraw.Draw(im)
d.ellipse((4,37,44,45),fill=(26,25,23,70))
# Four legs and the dark timber frame viewed slightly from above.
for x in (7,36):
    d.rectangle((x,25,x+5,39),fill="#342b25")
    d.rectangle((x+1,26,x+3,37),fill="#765037")
d.rectangle((6,10,42,35),fill="#2e2926")
d.rectangle((9,13,39,32),fill="#a06b42")
d.rectangle((12,16,36,29),fill="#46392e")
# Parallel warp threads, cream and muted grey, kept within the frame.
for x in range(14,36,3):
    d.line((x,16,x,28),fill="#d3c0a0" if x%2 else "#a99e85",width=1)
# A partly woven red-brown textile band and its pale edging.
d.rectangle((13,22,36,27),fill="#8f4b3f")
d.line((13,22,36,22),fill="#d6a579",width=1)
d.line((13,26,36,26),fill="#623a35",width=1)
for x in (17,23,29,35):d.point((x,24),fill="#e0bb91")
# Cross bars, carved pegs and a small shuttle.
d.rectangle((5,9,43,14),fill="#342b25")
d.rectangle((7,10,41,12),fill="#bb8755")
d.rectangle((6,30,42,35),fill="#342b25")
d.rectangle((8,31,40,33),fill="#bb8755")
d.rectangle((4,18,9,27),fill="#3c3028")
d.rectangle((39,18,44,27),fill="#3c3028")
d.rectangle((21,18,30,20),fill="#68452f")
d.rectangle((24,18,27,19),fill="#d7aa70")
for x in (10,36):d.rectangle((x,6,x+2,10),fill="#4a352a")
im.save(out,optimize=True)
print(out)

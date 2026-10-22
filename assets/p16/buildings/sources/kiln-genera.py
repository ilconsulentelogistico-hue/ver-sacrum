from pathlib import Path
from PIL import Image, ImageDraw

out = Path(__file__).resolve().parents[1] / "building_kiln_p16.png"
im = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
# Short ground shadow and sandstone foundation.
d.ellipse((5, 36, 43, 44), fill=(31, 29, 26, 85))
d.polygon([(5, 30), (13, 26), (39, 26), (44, 32), (40, 39), (8, 39)], fill="#302a27")
d.polygon([(7, 29), (14, 25), (38, 25), (42, 31), (39, 36), (9, 36)], fill="#7b6b58")
d.line([(8, 33), (39, 33)], fill="#c0a983", width=2)
# Brick side walls and lit top surface.
d.polygon([(9, 16), (18, 10), (35, 12), (40, 18), (40, 31), (35, 35), (13, 35), (9, 30)], fill="#382b29")
d.polygon([(11, 18), (19, 12), (34, 14), (38, 20), (38, 29), (34, 32), (13, 32), (11, 28)], fill="#905343")
d.polygon([(11, 18), (19, 12), (34, 14), (38, 20), (31, 24), (18, 23)], fill="#b66e50")
d.polygon([(16, 17), (21, 14), (32, 16), (35, 20), (30, 22), (19, 21)], fill="#d08d62")
# Chimney, thick dark rim and individual bricks.
d.rectangle((31, 4, 38, 16), fill="#342c2b")
d.rectangle((32, 6, 36, 15), fill="#9d5947")
d.rectangle((30, 3, 39, 6), fill="#3c302e")
d.line([(32, 9), (36, 9)], fill="#bd7958")
d.line([(32, 12), (36, 12)], fill="#744337")
d.line([(11, 22), (16, 22)], fill="#6d3e36")
d.line([(33, 26), (38, 26)], fill="#6d3e36")
# Front aperture with ember core and dark arch.
d.rectangle((18, 23, 31, 33), fill="#302928")
d.rectangle((20, 26, 29, 31), fill="#6c352c")
d.rectangle((22, 27, 27, 30), fill="#e39a4a")
d.rectangle((24, 27, 25, 29), fill="#f0c46e")
d.line([(18, 23), (31, 23)], fill="#d99c6b", width=2)
# Two recognizable finished pots at the front edge.
for x in (11, 34):
    d.rectangle((x, 32, x+4, 36), fill="#3b2c29")
    d.rectangle((x+1, 33, x+3, 35), fill="#b67150")
    d.line([(x, 32), (x+4, 32)], fill="#dc9b6a")
im.save(out, optimize=True)
print(out)

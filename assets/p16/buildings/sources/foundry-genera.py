from pathlib import Path
from PIL import Image, ImageDraw

out=Path(__file__).resolve().parents[1]/'building_foundry_p16.png'
im=Image.new('RGBA',(48,48),(0,0,0,0));d=ImageDraw.Draw(im)
# Ground shadow, stone plinth and iron furnace body, viewed obliquely from above.
d.ellipse((4,36,45,45),fill=(25,27,26,85))
d.polygon([(5,31),(11,27),(39,27),(44,31),(41,39),(8,39)],fill='#2c2b2a')
d.polygon([(7,30),(12,27),(38,27),(42,31),(39,36),(9,36)],fill='#716f68')
d.line([(9,32),(39,32)],fill='#aaa69a',width=2)
d.polygon([(9,17),(17,11),(34,12),(40,19),(40,30),(35,34),(13,34),(9,29)],fill='#272c2f')
d.polygon([(11,18),(18,13),(33,14),(38,20),(38,29),(34,31),(13,31),(11,28)],fill='#555f60')
d.polygon([(11,18),(18,13),(33,14),(38,20),(31,23),(18,22)],fill='#879191')
d.polygon([(15,17),(20,14),(31,16),(35,20),(30,21),(19,20)],fill='#aeb2aa')
# Tall flue and ember aperture.
d.rectangle((32,3,39,18),fill='#252a2d');d.rectangle((33,5,37,16),fill='#626a68')
d.rectangle((31,3,40,6),fill='#252a2d');d.line([(33,9),(37,9)],fill='#a0a79f')
d.rectangle((17,23,32,33),fill='#202327');d.rectangle((19,25,30,31),fill='#5b3327')
d.rectangle((21,26,28,29),fill='#c16d32');d.rectangle((23,26,26,28),fill='#f0bd67')
d.line([(17,23),(32,23)],fill='#c4aa7e',width=2)
# Copper/tin charge and two bronze ingots on the lower ledge.
d.polygon([(8,31),(13,29),(17,31),(16,35),(10,35)],fill='#343034')
d.polygon([(10,31),(13,30),(16,31),(15,33),(11,33)],fill='#b37b54')
d.rectangle((32,33,38,36),fill='#28292a');d.rectangle((33,33,37,35),fill='#c39556')
d.line([(34,33),(36,33)],fill='#e2bd74')
im.save(out,optimize=True)
print(out)

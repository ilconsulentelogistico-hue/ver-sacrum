from pathlib import Path
from PIL import Image, ImageDraw
out=Path(__file__).resolve().parents[1]/'building_press_p16.png'
im=Image.new('RGBA',(48,48),(0,0,0,0));d=ImageDraw.Draw(im)
d.ellipse((3,37,45,46),fill=(24,25,22,75))
# Low stone tray, seen from above, with a short front wall.
d.polygon([(5,24),(11,18),(36,18),(43,24),(40,36),(8,36)],fill='#292b29')
d.polygon([(7,24),(12,19),(35,19),(41,24),(38,33),(10,33)],fill='#827d6b')
d.polygon([(10,24),(14,21),(33,21),(38,24),(35,29),(13,29)],fill='#3f3934')
d.line([(8,33),(40,33)],fill='#b1a48a',width=2)
d.line([(10,36),(38,36)],fill='#4a4035',width=2)
# Pressed must/oil surface inside the trough.
d.polygon([(14,23),(19,22),(32,22),(36,25),(32,28),(16,28)],fill='#6b4b37')
d.line([(17,23),(31,23)],fill='#98734a',width=1)
# Timber uprights and screw crossbar.
for x in (8,35):
 d.rectangle((x,11,x+5,34),fill='#2b2520')
 d.rectangle((x+1,12,x+3,31),fill='#8c603b')
 d.line((x+1,13,x+3,13),fill='#c09059')
d.rectangle((7,10,41,15),fill='#2b2520')
d.rectangle((9,11,39,13),fill='#a77648')
d.rectangle((21,6,27,25),fill='#322920')
d.rectangle((22,7,26,23),fill='#aa794b')
for y in (9,13,17,21):d.line((22,y,26,y-1),fill='#d1a06a')
d.rectangle((16,5,32,8),fill='#332920')
d.rectangle((18,5,30,6),fill='#be8a53')
# Fruit crates at both sides: dark grapes and green olives.
for x,fruits in ((2,['#6d4755','#8b5967','#a97883']),(38,['#59684b','#788558','#a7a873'])):
 d.rectangle((x,27,x+8,36),fill='#2e2924')
 d.rectangle((x+1,28,x+7,34),fill='#a37145')
 d.rectangle((x+2,29,x+6,33),fill='#493a30')
 for dx,dy,c in ((2,1,fruits[1]),(5,1,fruits[0]),(3,3,fruits[2]),(6,4,fruits[1])):d.point((x+dx,28+dy),fill=c)
 d.line((x+1,35,x+7,35),fill='#d0a072')
im.save(out,optimize=True)
print(out)

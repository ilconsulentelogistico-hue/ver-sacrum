# Inventario asset approvati P16

Fonte verificata: cartella Drive `Terra Italica / Assets P16`, 22 settembre 2026. Standard: griglia P16, master PNG alla risoluzione nativa, scala runtime nearest-neighbor, trasparenza per gli sprite. Le preview e le tavole grandi non sono master di gioco.

## Integrati in BUILD 54

| File Drive | ID Drive | Dimensioni | Uso e ancoraggio |
| --- | --- | ---: | --- |
| `building_windmill_p16_v01.png` | `1e2JOCQV4zu3Rz7CWZxI34eT5sgYBKW7K` | 32×38 RGBA | `mill`, centro sul tile, visualizzato 64×76 con smoothing disattivato |
| `ui_selection_marker_p16_v01.png` | `142mP8IUG7WhDKbROAP-_fNgX9jWOy5su` | 16×16 RGBA | marker centrato sull’entità, scala proporzionale al raggio di selezione |

Entrambi sono file singoli trasparenti, non tavole riepilogative. Il renderer mantiene il fallback procedurale se un PNG non è disponibile.

## Mappatura verificata

| Cartella Drive | Entità implementate | Esito |
| --- | --- | --- |
| `01_terrain` | sea, beach, river, grass, forest, scrub, plain, mountain, marsh | Master 16×16 validi, non importati: il terreno procedurale P16 resta vincolante. |
| `02_units` | human, raider | I file v02 correnti sono 495×495: non corrispondono ai master 12×16 del manifest, quindi non sostituiscono gli sprite runtime. |
| `03_animals` | sheep, wolf | File correnti esclusi finché non coincidono con i master 14×10 dichiarati. |
| `04_buildings` | base, house, warehouse, mill, bakery, farm, pen, market, palisade, tower, enemy camp | Integrato soltanto il mulino nativo 32×38. Watermill, gate e strutture non implementate non vengono introdotti implicitamente. Le immagini grandi non sono usate come sprite. |
| `05_resources` | wood, food, stone, iron | I v02 correnti sono immagini grandi (esempi verificati fino a 320+ px), non master 12×10/16×22: esclusi. Gold, cart, haystack, campfire e well non hanno un’entità corrispondente. |
| `06_ui` | selezione singola e multipla | Marker 16×16 integrato. |

## Regole preservate

- Nessun PNG sostituisce il terreno procedurale.
- `imageSmoothingEnabled=false`; nessun ridimensionamento del file master su disco.
- Gli asset senza entità implementata non creano nuove meccaniche.
- Paperdoll e Skill restano viste separate; nessun asset modifica identità, inventari o salvataggi.

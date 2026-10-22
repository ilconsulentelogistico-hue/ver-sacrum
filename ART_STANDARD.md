# Terra Italica — P16 visual standard

P16 is the canonical art grammar for Terra Italica.

- One terrain tile is conceptually **16 × 16 art-pixels**.
- One art-pixel is the smallest allowed graphic detail.
- Terrain, units, animals, buildings, props and effects must respect the same grid density.
- Rendering uses nearest-neighbour / no image smoothing.
- Terrain noise is deterministic: it never flickers from frame to frame.
- Terrain contrast stays low so gameplay entities remain visually dominant.
- Each biome uses a restrained base tone plus light, dark and accent variations.
- Macro-noise is organised in 4 × 4 art-pixel regions; sparse accents sit on the 16 × 16 grid.
- Water uses short horizontal P16 marks; rock uses compact angular clusters; soil and vegetation use sparse grain.
- Roads use chunky on-grid shapes rather than antialiased strokes.

## Directional unit standard

Units and animals do **not** require walk-cycle animation frames for the base implementation and do not require eight separate directional files.

Each subject uses a clean top-down PNG with a stable centre anchor. Hostile raiders follow their movement vector and rotate the PNG to the nearest of eight compass directions:

- `N` = up
- `NE` = upper-right
- `E` = right
- `SE` = lower-right
- `S` = down
- `SW` = lower-left
- `W` = left
- `NW` = upper-left

The raider source PNG is authored facing `S` (down). Rotation is quantised in 45° steps; when stationary the raider keeps its last valid facing. Residents use one PNG per visible profession (plus stable tunic variants for a free resident) and mirror left/right rather than rotate; animals likewise mirror. This keeps their overhead silhouettes, tools, skin and clothing readable on a small phone screen. Scale, centre point and footprint remain stable while moving.

## Engine mapping

The current gameplay engine still uses its existing logical tile size. P16 is an **art-space standard**, intentionally decoupled from gameplay coordinates while controls and simulation are still evolving.

The current production PNG pipeline uses small native transparent assets and nearest-neighbour rendering. Terrain remains procedural/noise-based and is not replaced by terrain PNG tiles.

The intended long-term presentation target remains a 32 px render tile at 1× presentation scale, i.e. 2 screen pixels per art-pixel, with integer-scale presentation wherever practical.

## Grafica BUILD 173 (PROVVISORIA)

Dopo il campione approvato da Simone, `tools/grafica-completa-genera.py` deriva 79 PNG attivi da tavole sorgente con alpha autentico. Mestieri, animali, edifici, risorse e piccole icone UI ora condividono la stessa palette. Terreno, colture e palizzate conservano il disegno procedurale per mantenere stati e raccordi; le loro tinte sono state uniformate. Resta da giudicare la resa sul Redmi fisico.

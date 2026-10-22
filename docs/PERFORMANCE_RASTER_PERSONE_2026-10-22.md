# Disegno delle persone sulla mappa sperimentale — 22/10/2026

Il profilo sul browser Chromium del server ha identificato il disegno ripetuto dei token SVG come costo dominante con 300 abitanti vicini: circa 6.072 chiamate a `drawHuman` in 22 fotogrammi, per circa 3,56 secondi complessivi. Terreno e risorse occupavano molto meno. Il gioco ora prepara una sola copia raster 42×42 in memoria per coppia professione/fazione, dopo il caricamento del relativo SVG, e la riusa nei fotogrammi seguenti. Se non è disponibile una canvas, resta il disegno SVG precedente. La geometria del mondo, la simulazione e i salvataggi non cambiano.

Banco di confronto sequenziale, medesimo seed 123456, mappa sperimentale 2048×2048, 300 abitanti (286 sintetici e prevalentemente fermi vicino al villaggio), viewport mobile emulato 390×844. Quattro secondi e mezzo da fermo, poi scorrimento di quattro secondi e mezzo. Baseline commit `9f16e67` in worktree isolato; nuova versione sul ramo `codex/map-2048-profile`. Ogni browser aveva profilo isolato e nessun altro benchmark avviato in parallelo.

| Misura | Baseline | Copia raster |
| --- | ---: | ---: |
| FPS mediano fermo | 4,8 | 60,6 |
| Frame p95 fermo | 234,8 ms | 27,1 ms |
| Disegno p95 fermo | 189,3 ms | 5,3 ms |
| FPS mediano scorrendo | 5,3 | 60,2 |
| Frame p95 scorrendo | 233,4 ms | 27,0 ms |
| Disegno p95 scorrendo | 196,6 ms | 3,4 ms |

Dati grezzi, script e screenshot in `Rtsmobile-ricerca/prove-raster-2048-300/`. Una seconda esecuzione della nuova versione ha dato p95 di 23,1 ms da fermo e 26,5 ms scorrendo; le oscillazioni del server condiviso restano presenti. L’immagine mostra i personaggi sul posto e nessun errore JavaScript è stato rilevato. Questa non è una prova sul Redmi Note 10: 2048 rimane sperimentale e non è ancora la dimensione massima promessa.

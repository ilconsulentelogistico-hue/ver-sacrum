# Audit finale della filiera del Torchio

Ramo locale cumulativo dopo le tappe Torchio, priorità vino/olio, trasporti fisici, scorta comunitaria e prove lunghe. Audit statico riproducibile nella ricerca (`audit-press-chain-static-2026-10-22.py` e JSON): 143 file JavaScript controllati con `node --check`, nessun errore; 180 ID HTML senza duplicati; 41 riferimenti locali da `index.html` e 106 file nella cache offline presenti; 1 JSON valido; versione service worker 204 uguale alla cache 204.

Browser mobile simulato 393×873 su mappa 512: Torchio visibile come pixel art, pannello leggibile, abitante in trasporto, nessun errore JavaScript o 404 dei file del gioco; solo favicon 404. Screenshot `/home/ubuntu/codex-gh-lavoro/ver-sacrum-filiera-mobile-finale.png`. La sovraimpressione `?perf=1` misura un browser della EC2 condivisa, non il Redmi Note 10.

Suite completa `node --test tests/*.cjs`: primo giro 356/357 per una fixture senza seme fisso in `tests/occupation-rebellion.cjs`; fissato `conquered(123456)` solo per quel caso, test mirato 4/4 e secondo giro completo 357/357, zero errori. Nessuna modifica al motore nella tappa di audit. Il limite massimo della mappa resta una decisione basata su prova fisica del Redmi Note 10, non su questi controlli desktop/server.

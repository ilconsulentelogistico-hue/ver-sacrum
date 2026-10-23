# Ver Sacrum — terreno a blocchi, prima fondazione (21/10/2026)

Questa modifica lascia la partita a **88×88 tile**. Il terreno non è più un array completo conservato da `World`: `makeTile(x,y)` ricrea il tassello dalle coordinate e dal seed, `loadChunk(cx,cy)` conserva blocchi 8×8 e la cache elimina quelli meno usati oltre 128 blocchi. Il limite di 128 copre la vista mobile e il PC 1280×720 anche con zoom lontano; 20 blocchi facevano rigenerare terreno a ogni frame e rallentavano molto il disegno. `world.tiles` resta un iteratore compatibile con i test e con il vecchio codice che percorre la mappa, ma non è un array di tasselli in memoria.

Le proprietà modificabili (`road`, `biome`, `z`, `nearWater`) registrano solo la differenza dal terreno naturale in `tileChanges`. Il formato di salvataggio resta v5: `roads` conserva le strade come prima; il nuovo campo opzionale `terrainChanges` conserva le altre modifiche. Un salvataggio v5 precedente, con cache da 20 blocchi e senza `terrainChanges`, resta caricabile. Le risorse, le persone e gli edifici mantengono gli ID e lo stato del salvataggio; l'ecologia delle risorse esegue ancora una scansione iniziale dell'88×88 e mantiene tutti i nodi risorsa in memoria. Questa parte richiede l'indice spaziale e la generazione a domanda della prossima consegna prima di ampliare la mappa.

## Prove

- Hash SHA-256 di terreno e catalogo risorse per seed `123456` identici alla base `e3fc51a`, riportati nel test `world-chunks.cjs`.
- Strada, bioma, quota e acqua modificati: uguali dopo svuotamento cache, salvataggio e ricaricamento.
- Vecchio salvataggio v5 senza `terrainChanges`, con `maxCached=20`: caricato; patch non valida: respinta lasciando intatta la partita corrente.
- Suite completa: **41 prove passate, 0 fallite** (`Rtsmobile-ricerca/world-chunks-tests-2026-10-21/`). Nel browser PC e telefono emulato: zero errori e 404, salvataggio/ricaricamento riusciti; JSON e screenshot in `Rtsmobile-ricerca/world-chunks-final-2026-10-21/`. Il telefono reale di Simone resta la misura decisiva per la massima mappa.

Nel profilo telefono emulato sul server, con seed `123456`, gli FPS mediani sono stati 16,4 da fermo e 5,7 durante lo scorrimento. La precedente baseline aveva 14,6 e 5,9: le differenze sono troppo piccole rispetto al rumore del server, quindi non dimostrano né un guadagno né una perdita sullo smartphone. Il disegno resta il collo di bottiglia durante lo scorrimento.

La cache più ampia serve a evitare lavoro ripetuto durante il disegno, ma sulla mappa attuale può contenere fino a tutti i 121 blocchi. Il vantaggio di memoria resta quindi architetturale e si manifesterà su mondi più grandi **solo dopo** che anche risorse, simulazione e percorsi smetteranno di scansire l'intero mondo. Non aumentare `WORLD_SIZE` in questa consegna.

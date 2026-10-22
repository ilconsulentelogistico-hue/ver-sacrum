# Profilo della folla nella vista densa, 22/10/2026

Chromium headless su SP-SERVER, viewport mobile 393×873/DPR 2,75, seme 123456, mappa 512 con 51.356 nodi di risorsa generati e camera sulla stessa zona densa. Script e dati in `Rtsmobile-ricerca/audit-dense-render-2026-10-22/`. I tempi includono strumenti di misura per ogni `drawHuman`, quindi valgono soprattutto per confrontare i tre scenari nello stesso run. Non sono FPS del Redmi Note 10.

| Persone totali | Visibili circa | Frame mediano | Frame p95 | Disegno p95 | Update p95 | Attesa browser p95 | Chiamate drawHuman/6 s |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 100 | 20,2 ms | 31,1 ms | 3,9 ms | 1,7 ms | 26,3 ms | 23.994 |
| 300 | 300 | 30,4 ms | 44,8 ms | 5,4 ms | 4,2 ms | 36,0 ms | 53.482 |
| 300 | 100 | 21,0 ms | 34,3 ms | 3,6 ms | 3,6 ms | 29,1 ms | 23.048 |

A 300 persone totali ma circa 100 visibili il frame torna vicino alla prova con 100 persone totali: la quantità di personaggi disegnati conta. Anche l'attesa del browser resta ampia e variabile; non possiamo attribuire tutto a una singola funzione JavaScript. La cache risorse ha 12 quadri pronti e zero nuovi quadri durante ogni finestra misurata, perciò la ricostruzione delle risorse non spiega questa differenza. Nessun errore JavaScript. Il vecchio stress senza wrapper misurava p95 38 ms con 300, confermando che la strumentazione e il carico della macchina influenzano il valore assoluto.

Decisione tecnica: nessun limite di popolazione o dimensione mappa deciso da questo profilo. Prossima prova mirata: valutare se un percorso di disegno più leggero per persone ferme e non selezionate riduce davvero il p95 con 300 visibili, senza nascondere personaggi; mantenere una sola modifica alla volta e confrontare sulla stessa scena. Poi ripetere sul Redmi Note 10 reale prima di scegliere il massimo della mappa.

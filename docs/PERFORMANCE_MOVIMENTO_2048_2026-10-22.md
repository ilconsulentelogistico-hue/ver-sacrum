# Profilo browser: mappa 2048, 300 persone, 54 in cammino

Fixture riproducibile nel dossier `Rtsmobile-ricerca/prove-raster-2048-300/ver-sacrum-moving-profile.cjs`: seed 123456, viewport mobile 390×844, 300 abitanti concentrati presso il centro, 54 con percorso reale e scorrimento oscillante entro 3×2 celle dal centro. Il gioco resta attivo; nessun errore JavaScript. Screenshot e JSON della prova nella stessa cartella. La scena è volutamente più affollata del gioco normale, ma i percorsi sono brevi e non misurano molti calcoli di rotta contemporanei.

| Fase | FPS mediano | Fotogramma p95 | Update p95 | Disegno p95 | Oltre 50 ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Fermo, 300 persone | 60,2 | 22,4 ms | 5,4 ms | 3,7 ms | 0 |
| Scorrimento, 54 in cammino | 60,6 | 25,1 ms | 7,6 ms | 3,6 ms | 2 |

Il raster dei personaggi ha tolto il collo di bottiglia principale del disegno. Il tempo di aggiornamento cresce con il movimento; l'eventuale prossimo profilo dovrà includere molte persone che ricalcolano rotte e lavori reali. Queste misure sono Chromium sul server condiviso, **non** Redmi Note 10: la mappa 2048 resta sperimentale e non è ancora la dimensione predefinita.

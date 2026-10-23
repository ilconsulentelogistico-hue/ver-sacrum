# Mappe grandi: misura nel browser mobile simulato

Xiaomi dichiara per il Redmi Note 10 uno schermo da 2400×1080 pixel e 6,43 pollici ([specifiche ufficiali](https://www.mi.com/global/product/redmi-note-10/specs/)). La prova usa Chromium sul server EC2 con finestra mobile 393×873 CSS pixel, densità 2,75, seme `123456`, sei secondi per vista (avvio e villaggio neutrale), e `?perf=1`. Il secondo passaggio rallenta artificialmente la CPU di 2 volte; non equivale a un Redmi Note 10. Niente service worker nella misura per evitare vecchi file. Dati grezzi e schermate in `Rtsmobile-ricerca/audit-browser-mobile/`.

| Lato mappa | Vista | FPS mediano normale | frame p95 normale | FPS mediano CPU ×2 | heap JS normale |
|---:|---|---:|---:|---:|---:|
| 88 | avvio | 50,3 | 29,0 ms | 23,0 | 8,3 MiB |
| 88 | neutrale | 50,3 | 43,7 ms | 20,8 | 12,3 MiB |
| 256 | avvio | 50,0 | 48,4 ms | 24,3 | 18,4 MiB |
| 256 | neutrale | 37,5 | 42,3 ms | 18,9 | 14,8 MiB |
| 512 | avvio | 52,4 | 31,3 ms | 30,9 | 11,5 MiB |
| 512 | neutrale | 51,8 | 34,0 ms | 25,4 | 9,8 MiB |

La mappa 512 risulta talvolta più fluida della 256 perché il mondo viene caricato a blocchi e le viste non hanno la stessa densità di risorse. Questi numeri non dimostrano che 512 sia la dimensione massima adatta al telefono. In particolare il caso 256 vicino al neutrale scende a 18,9 FPS nello stress ×2; anche la mappa 88 scende sotto 25. Il tempo d'attesa/schedulazione del browser pesa più dell'aggiornamento della simulazione in molte righe. L'unico 404 è la favicon implicita; nessun errore JavaScript.

## Prova da fare sul Redmi Note 10

Aprire tre URL del gioco aggiornato, aggiungendo `?worldSize=88&perf=1`, `?worldSize=256&perf=1`, `?worldSize=512&perf=1` (per 88 si può usare solo `?perf=1`). Attendere almeno 20 secondi per ogni mappa, guardare sia il luogo iniziale sia un villaggio neutrale, poi fare uno screenshot dell'indicatore FPS in ciascuna vista. Ripetere dopo aver giocato finché ci sono almeno 30 persone e molte merci, e dopo aver scoperto aree lontane. Obiettivo provvisorio: almeno 30 FPS mediani, frame p95 intorno a 33 ms o meno, nessun congelamento visibile e nessun crash. Decidere la dimensione predefinita solo con questi dati fisici; oggi resta 88.

Le versioni degli script modificati in `index.html`, della registrazione in `boot.js` e della cache in `sw.js` sono state incrementate. Prova online senza `?perf=1`: la cache `terra-italica-v180` si installa e non compaiono errori JavaScript.

Verifica finale: suite completa 300/300, nessun errore.

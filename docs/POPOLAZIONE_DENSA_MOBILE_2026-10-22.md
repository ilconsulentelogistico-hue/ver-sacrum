# Popolazione densa nel browser mobile simulato

22/10/2026, seed 123456, Chromium sul server, viewport 393×873 e DPR 2,75. Mappe 256 e 512 completamente esplorate, rispettivamente 13.534 e 51.356 risorse caricate; camera sulla zona più densa. Persone aggiunte artificialmente e ferme nella vista, senza fauna, razziatori né salvataggio automatico. Ogni misura dura circa 6,5 secondi. Dati grezzi, script, screenshot e profilo CPU sono in `Rtsmobile-ricerca/audit-population-dense/`.

| Mappa | Persone | Camera | Frame p95 | FPS mediano | Update p95 | Disegno p95 | UI p95 | Heap JS |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 256 | 14 | ferma | 20,1 ms | 59,9 | 1,0 ms | 2,0 ms | 0,9 ms | 14,0 MiB |
| 256 | 100 | ferma | 27,2 ms | 49,0 | 1,6 ms | 3,5 ms | 1,8 ms | 32,4 MiB |
| 256 | 300 | ferma | 39,9 ms | 35,1 | 4,4 ms | 4,9 ms | 4,1 ms | 33,1 MiB |
| 256 | 300 | movimento | 37,2 ms | 38,0 | 4,3 ms | 4,6 ms | 4,2 ms | 11,5 MiB |
| 512 | 14 | ferma | 25,0 ms | 59,9 | 1,1 ms | 1,4 ms | 0,9 ms | 30,6 MiB |
| 512 | 100 | ferma | 28,0 ms | 51,3 | 1,9 ms | 2,3 ms | 1,7 ms | 28,3 MiB |
| 512 | 300 | ferma | 38,0 ms | 35,7 | 3,7 ms | 4,1 ms | 4,1 ms | 24,3 MiB |
| 512 | 300 | movimento | 37,0 ms | 40,0 | 3,8 ms | 5,0 ms | 4,3 ms | 19,1 MiB |

Nessun errore JavaScript nelle otto prove. Il criterio provvisorio del piano è frame p95 circa 33 ms: 100 persone lo rispettano; 300 no. Il numero di persone visibili pesa più della dimensione 256/512 in questo campione. La differenza del tempo di frame non è spiegata interamente dai tempi JavaScript misurati; il profilo contiene soprattutto campioni nativi `program` e non permette di attribuirla con certezza a una singola funzione. Non introduciamo una correzione arbitraria. Queste cifre non misurano il telefono fisico e non autorizzano a scegliere ora la dimensione massima predefinita: resta 88.

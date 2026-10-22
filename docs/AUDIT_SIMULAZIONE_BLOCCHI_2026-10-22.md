# Audit della simulazione a blocchi, 22/10/2026

Comando riproducibile: `nice -n 15 node --expose-gc tools/audit-block-simulation.cjs /percorso/report.json`. Seme 123456, mappe 256/512/1024, 100 o 300 persone, 120 frame di riscaldamento e 360 frame misurati da 16 ms simulati. Persone aggiunte lontano dalla camera, passive; carovane, combattimento e rendering esclusi. Il tool misura `updateLiving` vero e verifica dopo save/load che identità, numero di persone e blocchi di risorse già caricati restino presenti. Report integrale in `Rtsmobile-ricerca/prova-blocchi-2026-10-22.json`.

| Mappa | Persone | Mediana updateLiving | p95 | Picco | Blocchi prima/dopo load | Heap dopo GC |
|---:|---:|---:|---:|---:|---:|---:|
| 256 | 100 | 0,245 ms | 0,524 ms | 4,977 ms | 68/68 | 10,2 MB |
| 256 | 300 | 0,528 ms | 0,958 ms | 9,674 ms | 68/76 | 15,2 MB |
| 512 | 100 | 0,292 ms | 0,589 ms | 15,215 ms | 82/87 | 19,9 MB |
| 512 | 300 | 0,694 ms | 2,605 ms | 14,968 ms | 82/94 | 25,2 MB |
| 1024 | 100 | 0,392 ms | 2,566 ms | 13,032 ms | 81/85 | 28,7 MB |
| 1024 | 300 | 0,802 ms | 2,498 ms | 7,536 ms | 81/93 | 32,9 MB |

I blocchi già caricati sopravvivono al reload; alcuni blocchi vicini agli attori vengono aggiunti durante il caricamento, quindi non è corretto esigere un conteggio identico. Nessun ID duplicato. Il tempo simulato resta nell'accumulo degli attori lontani, come verificano i test `simulation-blocks.cjs`; questo benchmark non misura la precisione dei mestieri o la crescita giornaliera.

Conclusione limitata: sulla EC2 il nucleo di simulazione passiva non è da solo il collo di bottiglia dei frame oltre 33 ms visti nel precedente stress browser con 300 persone. È un'inferenza, non una profilazione del telefono. Prossima tappa: profilare nel browser il tempo di disegno degli attori e delle risorse nelle viste dense, poi intervenire sul componente realmente costoso. Il limite massimo della mappa richiede ancora la prova fisica sul Redmi Note 10 di Simone.

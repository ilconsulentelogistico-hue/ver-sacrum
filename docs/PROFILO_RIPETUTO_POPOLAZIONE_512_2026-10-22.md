# Popolazione densa: misura ripetuta dopo il caricamento

Prova nel Chrome headless della macchina condivisa, simulazione telefono 393×851 DPR 2, mappa 512, seme 123456, `?perf=1`, 2,5 s di riscaldamento e 4 s di campioni per caso, due giri. Dati e script riproducibile: `Rtsmobile-ricerca/audit-mobile-crowd-repeat-2026-10-22/`. Nessun errore JavaScript nei 8 casi. Gli abitanti aggiunti sono sintetici e mobilitati; la prova non rappresenta 300 lavoratori con attività reali.

| Abitanti | Posizione | Mediana frame, due giri | P95 frame, due giri | P95 disegno |
|---|---|---:|---:|---:|
| 100 | vicini | 16,9 / 31,7 ms | 23,1 / 56,2 ms | 2,2 / 8,9 ms |
| 300 | vicini | 24,8 / 28,9 ms | 34,4 / 43,2 ms | 4,1 / 5,9 ms |
| 100 | lontani | 16,7 / 16,7 ms | 23,5 / 20,1 ms | 1,4 / 1,7 ms |
| 300 | lontani | 16,7 / 16,8 ms | 20,4 / 22,4 ms | 1,5 / 1,8 ms |

Con 300 persone vicine il disegno p95 cresce rispetto alle stesse 300 lontane; `update` p95 è 4,3–5,0 ms contro 2,9–4,1 ms. L'attesa del browser e il carico di altri processi incidono: perfino 100 vicini oscillano molto fra giri. I picchi delle misure immediatamente dopo l'apertura erano più alti; per confronti futuri scartare il caricamento e conservare più ripetizioni. Il target indicativo di 30 FPS (33 ms per frame) non è garantito in questa scena densa. Questo NON è il Redmi Note 10, quindi nessuna decisione sulla mappa massima o sul limite di popolazione deriva da questi numeri.

Prossimo intervento autonomo: cercare il costo del disegno di molti abitanti vicini e provare una riduzione mirata che mantenga leggibilità/selezione; confrontare A/B nella stessa scena e scartare se non migliora. La prova fisica sul telefono resta necessaria.

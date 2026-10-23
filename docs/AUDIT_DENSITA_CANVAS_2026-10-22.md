# Densità del canvas nella folla, 22/10/2026

Il gioco limita già `devicePixelRatio` a 2 in `Game.resize`, anche se il viewport di prova dichiara 2,75. Su Chromium headless SP-SERVER, nella stessa vista 512×512 con 300 persone e 51.356 risorse generate, abbiamo forzato in sequenza la densità interna 2 → 1,5 → 1 → 2, sei secondi per valore, senza cambiare il codice del gioco. Lo script e il JSON sono in `Rtsmobile-ricerca/audit-canvas-dpr-2026-10-22/`.

| DPR canvas | Pixel canvas | Frame mediano | Frame p95 | Attesa browser p95 |
|---:|---:|---:|---:|---:|
| 2, prima | 786×1222 | 29,7 ms | 38,4 ms | 31,9 ms |
| 1,5 | 589×917 | 21,2 ms | 34,1 ms | 25,9 ms |
| 1 | 393×611 | 16,6 ms | 22,4 ms | 15,8 ms |
| 2, ritorno | 786×1222 | 33,4 ms | 46,8 ms | 40,0 ms |

La differenza suggerisce un costo legato ai pixel/composizione, ma il ritorno a DPR 2 oscilla di 8,4 ms p95 rispetto al primo passaggio: la macchina condivisa rende il valore assoluto instabile. DPR 1 perde definizione; lo screenshot DPR 1,5 è nell'area di lavoro Codex. Nessun errore JavaScript e nessun cambio alla grafica consegnata. La scelta di ridurre la densità in gioco resta sospesa fino alla prova fisica sul Redmi Note 10, usando `?perf=1` e una scena di folla reale. La mappa massima non va dedotta da questo solo esperimento.

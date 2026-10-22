# Esperimento: disegno diretto degli sprite senza rotazione

Su `asset-render.js` abbiamo provato a sostituire `translate`/`rotate(0)`/`scale(1)` con `drawImage` diretto quando angolo e specchio sono neutri. La scena di confronto è quella del profilo precedente: mappa 512, 51.356 risorse, viewport 393×873/DPR 2,75, seme 123456, 300 persone nella vista. Dati del prototipo in `Rtsmobile-ricerca/audit-dense-render-2026-10-22/fastpath-report.json`; base in `report.json`.

| Misura | Base | Prototipo |
|---|---:|---:|
| Frame p95, 300 visibili | 44,8 ms | 45,4 ms |
| Disegno p95 | 5,4 ms | 5,7 ms |
| `drawHuman` totale / chiamate | 437,7 ms / 53.482 | 412,4 ms / 54.340 |

Il costo medio per singola chiamata scende leggermente, ma il frame complessivo non migliora in modo affidabile. I run non sono sincronizzati e SP-SERVER è condiviso; anche l'attesa browser oscilla. Il prototipo è stato tolto: `asset-render.js` rimane identico alla base. Nessuna modifica visiva consegnata. Il prossimo esperimento misurerà il canvas a densità di pixel diverse nella stessa scena prima di considerare un adattamento, senza fissare ancora un limite di mappa per il Redmi Note 10.

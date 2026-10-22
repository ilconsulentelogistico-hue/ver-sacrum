# Raccoglitori attivi in quattro zone della mappa

Strumento riproducibile: `node --expose-gc tools/audit-remote-workers.cjs report.json`. Usa seed 123456; su mappe 512 e 1024 colloca 100/300 persone totali, con 95/295 nuovi raccoglitori quando il lavoro è attivo. I quattro gruppi stanno in blocchi distanti dalla camera e fra loro. Ogni lavoratore ha una fonte di legna dedicata, così si verifica la conservazione della risorsa senza contesa artificiale. Riscaldamento 60 frame, misura 360 frame da 16 ms. Misura `updateLiving` in Node su SP-SERVER: NON misura FPS, disegno o Redmi Note 10.

| Mappa | Persone | Stato | Mediana updateLiving | P95 updateLiving | Legna raccolta |
|---:|---:|---|---:|---:|---:|
| 512 | 100 | fermi | 0,338 ms | 0,481 ms | — |
| 512 | 100 | 95 al lavoro | 0,355 ms | 0,938 ms | 1.140 |
| 512 | 300 | fermi | 0,619 ms | 1,491 ms | — |
| 512 | 300 | 295 al lavoro | 0,713 ms | 1,308 ms | 3.540 |
| 1024 | 100 | fermi | 0,358 ms | 0,650 ms | — |
| 1024 | 100 | 95 al lavoro | 0,445 ms | 1,472 ms | 1.140 |
| 1024 | 300 | fermi | 0,716 ms | 1,236 ms | — |
| 1024 | 300 | 295 al lavoro | 0,665 ms | 1,640 ms | 3.540 |

Ogni scenario ha verificato ID unici, quantità totale legna prima/dopo la raccolta, incarichi e risorse dopo save/load, e blocchi caricati. Il p95 talvolta è più basso con più lavoro per oscillazione della macchina condivisa: non va letto come un miglioramento causato dal lavoro. Lo scenario copre raccolta locale; non comprende 300 percorsi lunghi, mercati, case e produzione simultanei. Non determina la mappa massima. I dati completi sono in `Rtsmobile-ricerca/audit-remote-workers-2026-10-22/report.json`.

Passo successivo: un caso con trasporti fra blocchi lontani, inventario e save/load durante il viaggio; poi prova browser/telefono di una scena che lo rappresenti.

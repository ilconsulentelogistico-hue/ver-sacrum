# Corrieri su percorsi lunghi, anche dopo il caricamento

`node tools/audit-remote-hauls.cjs report.json` crea quattro coppie di magazzini in zone lontane della mappa, a 20–28 caselle l’una dall’altra. Prima di collocarli genera i blocchi delle risorse e controlla lo spazio con le regole del gioco. Assegna 20 o 60 corrieri, verifica che siano tutti in viaggio con merce, salva e ricarica, poi aspetta la consegna completa. La somma di scorte e carichi resta 1.200 unità in ogni scenario; consegne 310–908 unità secondo il numero e la capacità personale. I dati completi sono in `Rtsmobile-ricerca/audit-remote-hauls-2026-10-22/report.json`.

| Mappa | Corrieri | P95 `updateLiving` Node | Tutti in viaggio al save | Consegna dopo load |
|---:|---:|---:|---|---|
| 512 | 20 | 2,200 ms | sì | sì |
| 512 | 60 | 5,778 ms | sì | sì |
| 1024 | 20 | 2,335 ms | sì | sì |
| 1024 | 60 | 6,812 ms | sì | sì |

La prova ha scoperto un errore nel load: i corrieri possono attraversarsi in movimento, ma la normalizzazione separava anche quelli sovrapposti nel salvataggio, spostandone talvolta uno su un terreno senza uscita e svuotando il percorso. Ora un corriere con incarico e percorso validi conserva la posizione durante il viaggio; chi è fermo continua a essere separato. Il test `tests/haul-load-overlap.cjs` controlla due corrieri sovrapposti e il percorso dopo il reload. La correzione è limitata ai trasportatori in fase di viaggio, su cella percorribile.

Questi sono tempi di simulazione Node su SP-SERVER, non FPS del Redmi Note 10. La prova usa magazzini e legna, non l’intera economia con carovane, mercato e produzione contemporanei. Il limite massimo della mappa resta da decidere dopo misura sul telefono.

Prova browser mobile simulato 393×851 DPR 2: due trasportatori sovrapposti su 512 conservano posizione, percorso (23 passi) e carico (5 ciascuno) dopo save/load; zero errori JavaScript. Script nella ricerca `audit-remote-hauls-2026-10-22/browser-check.cjs`.

Durante la suite un test storico dei lavoratori della fabbrica, costruito su un mondo casuale, ha fallito una volta perché il percorso variava col terreno; il setup ora usa il seme fisso 123456. Il test mirato passa 7/7.

Verifica finale mirata dopo le correzioni: 11/11 test superati (`actor-separation`, `haul-load-overlap`, `factory-workers`, `physical-press-market`), quattro scenari di trasporto superati e browser mobile simulato positivo. Il giro generale è stato interrotto dopo 298 test superati e un fallimento della vecchia aspettativa sul vino, poi corretta e verificata nel gruppo mirato; il precedente giro completo sulla base era 357/357. Non si dichiara verde la suite completa su questo commit.

# Audit dei neutrali su mappe sperimentali 256 e 512

**Data:** 22/10/2026. Nessuna regola di gioco è stata modificata in questa tappa. Prova riproducibile in `Rtsmobile-ricerca/audit-neutrali-mappe-grandi/`: `prova.cjs` (seed 123456, 600 giorni, tre dimensioni), `profile.cjs` e `profile-512.cjs` (450 giorni, attribuzione dei giorni lenti). Razziatori e fauna esclusi; le persone iniziali del giocatore sono nutrite nella fixture per non chiudere la partita. L’autosalvataggio periodico è escluso dalla misura di simulazione; il salvataggio finale è misurato a parte. Tempi raccolti una volta sul server condiviso, quindi sono indizi di costo e non una certificazione del Redmi Note 10.

| Lato mappa | Distanza tra basi agricole | Tempo 600 aggiornamenti | Giorno peggiore | Giorni >200 ms | Blocchi risorse caricati al giorno 600 | Salvataggio |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 88 | 82 caselle | 2,82 s | 148 ms | 0 | risorse iniziali complete | 1,31 MB |
| 256 | 319 caselle | 24,81 s | 4,15 s | 31 | 143 su 1024 | 98 KB |
| 512 | 681 caselle | 22,59 s | 4,32 s | 28 | 189 su 4096 | 104 KB |

Le tre partite sono ancora attive al giorno 600 e i due villaggi agricoli hanno sei persone ciascuno. Le risorse lontane restano per lo più non generate e i salvataggi delle mappe grandi rimangono compatti. Il dato di memoria JavaScript nel singolo processo di prova arriva a circa 50 MB nella mappa 256 e 82 MB nella 512 al giorno 600; non include Chromium o la memoria del telefono.

## Origine dei blocchi

1. **Passeggiata nel campo.** `actor-collisions.js`, `farmWander()`, sceglie a caso una casella del campo percorribile in sé, ma isolata dalla posizione del contadino. Nel seed 123456/256 il lavoratore prova per esempio da `(5.5, 7.5)` a `(5, 5)`: `findPath()` espande tutte le 5.000 caselle consentite e impiega circa 0,4–0,5 s. Quando il percorso fallisce, il timer della passeggiata non viene riarmato, perciò il tentativo ricompare. `simulation-blocks.js` riduce la frequenza solo di persone lontane inattive senza compito e di pecore passive; questo contadino assegnato al campo continua a essere aggiornato normalmente anche a camera lontana.
2. **Carovane fra estremi della mappa.** Su mappe oltre 128 caselle, `neutralMarketRoute()` lascia intenzionalmente il lavoro al percorso standard: la ricerca a caselle del ramo precedente è limitata ai mondi ordinari. `assignNeutralTradeCaravans()` e `pathToBuilding()` provano più porte; ogni tentativo può raggiungere 5.000 espansioni. Nel profilo 256 il giorno 390 costa 3,57 s, di cui 3,49 s nella scelta commerciale; nel profilo 512 il giorno 420 costa 4,33 s, di cui 3,84 s nella scelta commerciale. Alcuni mercanti non partono perché nessun percorso viene completato entro il budget; al giorno 600 le partenze sono 0/1 rispettivamente per i due villaggi su entrambe le mappe.

## Sequenza di correzione

Prima correggere `farmWander()`: scegliere soltanto caselle raggiungibili con una ricerca locale economica e riarmare il timer anche se nessuna è disponibile. Provare 256 e 512 ripetendo i giorni che oggi costano oltre 200 ms.

Poi separare la pianificazione commerciale di lunga distanza dal singolo aggiornamento: ricerca incrementale o gerarchica tra zone, con budget per frame/giorno, conservazione del percorso e annullamento sicuro se cambia il mondo. Riprofilare 600 giorni e verificare scambio, ritorno, salvataggio e merci fisiche. Non estendere semplicemente il limite A* oltre 5.000: farebbe crescere il blocco. Solo dopo queste due correzioni ha senso valutare un numero massimo di caselle su smartphone fisico.

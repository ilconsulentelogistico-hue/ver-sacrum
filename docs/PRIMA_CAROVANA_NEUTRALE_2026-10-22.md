# Prima carovana neutrale autonoma

Il Clan del Guado invia un solo mercante verso la Lega delle Colline, dopo che il villaggio ha almeno cinque abitanti. La persona parte da una casa propria, con ID, domicilio e competenze conservati. I primi quattro posti della filiera (campo, mulino, raccolta, forno) restano occupati: non vengono interrotti per commerciare.

La partenza avviene solo a un controllo ogni 30 giorni, se il mercato del Guado possiede almeno 30 cereali, quello delle Colline almeno 12 orzi, la strada è percorribile, la casa ha un’uscita raggiungibile e un residente senza incarichi è disponibile. Il preventivo cerca 2 orzi in cambio di 2–8 cereali rispettando il prezzo corrente e la capienza personale. La stessa carovana del giocatore prende la merce nel mercato, percorre la mappa, rivede l’accordo all’arrivo e riporta il risultato. Il mercato salva `neutralTradeSent` per impedire partenze duplicate.

La regola è volutamente limitata a un viaggio iniziale fra due villaggi agricoli. Una minaccia può fermare temporaneamente il mercante; se il baratto diventa impossibile all’arrivo, riporta l’offerta. La persona rimane nel mondo presso il mercato al termine del viaggio. Le rotte ripetute, i villaggi non agricoli e la scelta di altri prodotti appartengono alla tappa successiva.

Test mirato: seed 123456, nessuna partenza con quattro persone al giorno 320; partenza dopo crescita, ID e incarichi essenziali conservati; salvataggio/ripresa in viaggio; rientro, zero carico residuo, quantità globali di cereali e orzo invariate, esperienza in Scambio aumentata. La prova completa della suite è registrata in `ESITO_NEUTRAL_FIRST_CARAVAN_2026-10-22.md` nella cartella ricerca.

Prova lunga autonoma, seed 123456 con il gruppo del giocatore alimentato soltanto per evitare la fine della partita inattiva: prima partenza intorno al giorno 420, baratto concluso intorno al 570 (`traded=true`), ritorno entro il 690 con 2 orzi depositati al Guado. Nei giorni seguenti il mercato può consumare o trasferire quell’orzo: la scorta al giorno 900 da sola non indica l’esito dello scambio. Traccia in `audit-scambi-neutrali/risultato-900.json`.

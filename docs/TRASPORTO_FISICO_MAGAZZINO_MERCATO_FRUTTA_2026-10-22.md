# Uva e olive: magazzino → mercato con un abitante

Nei magazzini del giocatore, l’esportazione automatica di **uva e olive** verso un mercato collegato richiede ora una persona libera. La merce resta nel magazzino finché non viene prelevata, viaggia nel carico personale e compare al mercato soltanto alla consegna. Il carico rispetta la capienza dell’abitante, il tetto di 12 unità per aggiornamento, la scorta da trattenere e lo spazio del mercato. Un secondo incarico uguale non parte mentre il primo è in viaggio. Link chiuso prima del prelievo: prenotazione annullata, scorta intatta. Il carico a metà rotta sopravvive al salvataggio.

Gli altri beni e i mercati neutrali restano al comportamento precedente. Per uva/olive del giocatore, ora campo→magazzino→mercato→Torchio richiede trasportatori reali su tutti e tre i tratti. I prodotti in uscita dal Torchio sono ancora spostati automaticamente senza viaggio; prossima tappa.

Test `tests/physical-warehouse-market-fruit.cjs`: 2/2. Suite economica mirata: 40/40, zero errori. Suite completa sulla base immediata: 343/343, zero errori.

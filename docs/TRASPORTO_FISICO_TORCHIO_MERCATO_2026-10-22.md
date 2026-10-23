# Vino e olio dal Torchio al mercato

La parte **commerciale** dei prodotti del Torchio del giocatore ora aspetta un abitante libero. Il prodotto rimane nel laboratorio, passa nel suo carico reale e compare nel mercato collegato solo alla consegna. Il trasporto automatico rispetta la quota comunitaria `returnDue`: quella parte resta riservata nel Torchio e non entra nel carico per il mercato. La rotta può essere salvata mentre la merce è in viaggio; un link chiuso prima del prelievo annulla la prenotazione. Se non c’è addetto o spazio, il prodotto aspetta.

La quota comunitaria Torchio→magazzino è ancora trasferita istantaneamente; sarà il prossimo segmento. La modifica riguarda soltanto vino/olio del Torchio del giocatore, lasciando altre fabbriche e villaggi neutrali invariati.

Test `tests/physical-press-market.cjs`: 2/2, con 5 vino di cui 3 riservati, viaggio di 2 vino e reload. Gruppo economico mirato: 45/45, zero errori. Suite completa della base precedente: 343/343.

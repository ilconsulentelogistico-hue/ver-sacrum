# Riconciliazione dopo una rivolta

Dopo una rivolta, un dono di cibo riuscito aumenta di 4/100 la fiducia di ciascun abitante originario vivo, quanto l\x27aumento della lealtà politica già previsto dal gioco. La stessa richiesta ripetuta con identico ID di transazione non consuma altro cibo e non aumenta di nuovo la fiducia. La scheda Diplomazia mostra «Ribellata · [relazione attuale]» e la fiducia media degli abitanti.

Una nuova adesione pacifica richiede, oltre alle condizioni politiche esistenti, fiducia media personale almeno 60/100 e 60 giorni di stabilità. Le comunità mai ribellate seguono le regole precedenti. Nel test, 27 doni portano le persone a fiducia 100, poi il villaggio aderisce dopo 60 giorni; stesse identità, stesso inventario e fiducia nel salvataggio. La quantità di cibo per i doni segue il costo già esistente (5 per richiesta). La tappa non automatizza doni né adesione: il giocatore sceglie ogni azione.

Test in `tests/rebel-reconciliation.cjs`.

Riferimento consultato nel codice locale: `7kaa/src/OTOWN.cpp`, aggiornamento della lealtà e controllo di ribellione. Il legame dono→fiducia individuale e la soglia 60 sono regole proprie di Ver Sacrum, allineate al costo e al bonus del dono già presenti in `politics.js`.

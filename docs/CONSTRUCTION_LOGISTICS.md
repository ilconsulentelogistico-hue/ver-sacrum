# Cantieri e riparazioni — Build 42

I costi restano parametri di prototipo, ma non vengono più sottratti all'apertura del cantiere. Il cantiere possiede un inventario locale: il trasporto prenota la merce all'origine, il prelievo la sposta nel carico personale e soltanto la consegna la rende utilizzabile. Il lavoro resta fermo finché ogni materiale richiesto non è fisicamente presente; all'avvio effettivo i materiali sono consumati una sola volta.

Gli edifici danneggiati richiedono pietra consegnata nel loro inventario e un abitante presente. La riparazione costa provvisoriamente `0,04` pietra per punto salute, arrotondata per completare il lavoro. Un tocco contestuale sull'edificio danneggiato assegna gli abitanti selezionati.

Annullare prima del prelievo rilascia la prenotazione. Dopo il prelievo la merce rimane nel carico. La morte del portatore o la distruzione di un edificio scaricano le merci fisiche sul terreno; i salvataggi conservano inventari di cantiere, lavori, carichi e contabilità frazionaria delle riparazioni.

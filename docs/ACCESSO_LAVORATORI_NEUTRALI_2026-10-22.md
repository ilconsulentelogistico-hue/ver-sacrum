# Accesso dei lavoratori neutrali alle strutture iniziali

La scansione precedente dei seed 1–30 aveva trovato tre lavoratori non assegnati: 8/15/22. Il rientro con percorso vuoto era il sintomo visibile. La causa primaria era la regola di `community.js` che impediva a qualunque neutrale di entrare in casa, anche nella propria. Dopo un incarico non raggiungibile, la persona restava fuori indefinitamente.

Ora ogni abitante può entrare soltanto in una casa dello stesso proprietario; i comandi dell’interfaccia del giocatore continuano a selezionare solo persone del giocatore. Quando il villaggio assegna il contadino o il mugnaio, sceglie una porta libera con un percorso effettivo verso la struttura, invece della prima porta disponibile. I due residenti destinati a campo e mulino restano riservati a quei lavori finché entrambi hanno un lavoratore; la raccolta di cibo e materiali usa prima il terzo abitante libero. Identità, domicilio e competenze restano quelli della stessa persona.

Ripetizione dello script identico: prima 3 problemi su 60 villaggi agricoli, dopo 0 su 60. Nei seed 8, 15 e 22 contadino e mugnaio sono assegnati all’avvio e conservano gli stessi ID e salute 100 dopo 40 giorni senza incursioni/fauna. Test specifici verificano anche che un neutrale non possa entrare nella casa di un’altra fazione. Script e JSON prima/dopo in `Rtsmobile-ricerca/infrastrutture-neutrali-30seed/`.

La scansione dopo la correzione impiega 32,36 s per 30 nuovi mondi sul server; quella prima della correzione impiegava circa 18,4 s. Il costo aggiuntivo è concentrato nella scelta iniziale delle uscite e va tenuto presente nella futura prova sul Redmi Note 10. Non misura gli FPS durante il gioco.

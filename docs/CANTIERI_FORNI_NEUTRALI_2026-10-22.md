# Cantieri dei forni neutrali

Il forno dei due villaggi agricoli compare solo dopo il quarto abitante, quando il loro magazzino possiede almeno 16 legni e 16 pietre raccolti da nodi reali. L’edificio nasce come cantiere, non operativo; il costo passa una sola volta dal magazzino all’inventario del cantiere. La stessa persona esce dalla casa, raggiunge il cantiere, lavora e guadagna esperienza in Costruzione. Il ciclo edilizio consuma i materiali una sola volta. Solo dopo il completamento la persona diventa fornaio, conserva ID, domicilio e competenze precedenti; farina e pane usano le ricette esistenti. Se il forno viene distrutto, non viene ricreato gratuitamente.

La conoscenza dei forni è una tradizione iniziale dei due villaggi con mulino e resta nella loro base (`neutralKnowledge`), separata dai saperi tribali del giocatore. Non viene conferita automaticamente ai singoli: il costruttore guadagna esperienza lavorando. Il terzo villaggio non riceve questa tradizione o un forno.

Seed 123456, 280 giorni senza incursioni/fauna: al giorno 200 i due forni sono in cantiere; al giorno 240 sono completi e hanno un fornaio ciascuno; al giorno 280 sono presenti 10 pani di grano e 18 pani d’orzo nelle rispettive scorte. I test sommano nodi, edifici e borse e aggiungono solo i 16+16 materiali effettivamente consumati dal cantiere: i totali tornano identici a prima. Reload e distruzione controllati.

Limite ancora aperto: il costo passa direttamente dal magazzino al cantiere, come già avviene per le costruzioni del giocatore; non c’è un viaggio di trasporto. Anche campo e mulino dei nuovi villaggi nascono completi come infrastruttura iniziale.

Prova Chromium mobile 390×844 ai giorni 210 e 260: avanzamento visibile, materiali già consumati descritti correttamente, poi fornaio 1/1 e pane disponibile; zero errori pagina. Screenshot e script in `Rtsmobile-ricerca/browser-cantiere-forno/`.

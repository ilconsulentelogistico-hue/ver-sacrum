# Risorse

## Argilla naturale (prova del 22/10)

Otto depositi finiti e separati si aggiungono alla mappa normale 88×88 vicino a suolo umido; i 2.611 nodi precedenti del seed di prova mantengono layout e quantità. Le mappe sperimentali producono depositi rari in blocchi deterministici, solo quando la zona viene caricata. Ogni unità raccolta entra nel carico della persona, occupa spazio, si può depositare, salvare e barattare; la raccolta usa l’abilità di estrazione della pietra. I depositi non ricrescono. Il mercato assegna un prezzo base provvisorio di 2. I vecchi salvataggi con mercati senza la voce argilla ricevono domanda neutra 1 al caricamento. La cottura in ceramica è la tappa successiva: oggi l’argilla è già una merce fisica scambiabile, ma non ha ancora uso edilizio o artigianale.

## Filiera ceramica (prova del 22/10)

La fornace ceramica è un edificio costruibile dopo aver acquisito il sapere «Forni in muratura». Costo di cantiere: 20 legna e 12 pietra. Un lotto usa 4 argilla e 2 legna fisicamente presenti nella fornace, richiede un ceramista nutrito sul posto e 12 secondi base di lavoro, poi crea 2 ceramiche. Senza uno dei materiali, lavoratore o spazio, il lotto non parte. La competenza personale Ceramica nasce a livello 1, cresce solo al completamento e accelera i lotti come gli altri mestieri; resta alla persona se cambia lavoro. Prodotto e materia prima sono beni separati, depositabili, trasportabili e commerciabili. Il prezzo base provvisorio della ceramica è 7.

Riferimento di codice letto prima di implementare: `Rtsmobile-ricerca/7kaa/src/OF_FACT.cpp`, funzioni `FirmFactory::input_raw` e `FirmFactory::manufacture`, per il modello di scorte di input/output e trasferimento fisico fra edifici collegati. Ricetta, tempi e valori sono scelte di Ver Sacrum, senza codice copiato.

## Lana dalle pecore (prova del 22/10)

Ogni pecora domestica viva assegnata a un recinto dà una unità di lana ogni 30 giorni **effettivamente lavorati** con allevatore presente e foraggio locale. Il latte giornaliero continua con le sue quantità e il resto frazionario; la lana non richiede un secondo foraggio nello stesso giorno. Se lo spazio del recinto non basta per latte e lana insieme, non si consuma foraggio e il contatore dei giorni non avanza. La lana occupa spazio, sopravvive ai salvataggi e si può scambiare sul mercato, con prezzo base provvisorio 4. La filiera tessile è una tappa futura.

## Tessuto al telaio (prova del 22/10)

Il telaio è costruibile con il sapere iniziale d’insediamento e costa 18 legna e 6 pietra. La ricetta prende 4 lana dal suo inventario, occupa un tessitore nutrito per 10 secondi base e deposita 2 tessuti nello stesso edificio. Lana, lotto e tessuto sono quantità fisiche; senza merce, lavoratore o spazio non nasce prodotto. Tessuto e lana hanno prezzi base provvisori 6 e 4. La fibra grezza resta nel recinto finché trasporto o mercato non la portano al telaio.

## Dal tessuto all’oggetto personale (22/10)

La scheda Personaggio consuma 2 tessuti già consegnati in un deposito raggiungibile e crea una tunica unica nella borsa dell’abitante, se c’è spazio. Non è una conversione automatica né un trasferimento a distanza.

## Rame naturale (prova del 22/10)

Quattro piccoli affioramenti finiti di rame si aggiungono alla mappa normale 88×88 su terreno roccioso. I nodi precedenti conservano quantità e posizioni. Nelle mappe sperimentali il rame nasce in modo raro, deterministico e solo nei blocchi esplorati. Ogni unità raccolta entra nel carico della persona, usa l’abilità di estrazione della pietra, occupa spazio in un deposito e può essere barattata (prezzo base provvisorio 6). I vecchi mercati ricevono domanda neutra per il rame. I vecchi salvataggi mantengono la mappa naturale già registrata: la nuova distribuzione vale nelle nuove partite. La fusione e gli usi del rame sono tappe successive.

## Stagno naturale (prova del 22/10)

Tre affioramenti finiti di stagno si aggiungono alla mappa normale, separati dai nodi precedenti. Nelle mappe grandi sono più rari del rame e generati solo nei blocchi caricati. Lo stagno si estrae con l’abilità già usata per pietra e minerali, entra nel carico fisico, si deposita, si salva e si baratta; prezzo base provvisorio 9. I mercati dei vecchi salvataggi ricevono domanda neutra. La distribuzione sulla mappa normale è valida per nuove partite; la filiera bronzo non è ancora presente.

## Fonderia del bronzo (prova del 22/10)

La fonderia richiede il sapere «Forni in muratura» e un cantiere da 24 legna e 18 pietra. Un fonditore nutrito consuma 4 rame, 1 stagno e 2 legna presenti nell’edificio, lavora 16 secondi base e produce 4 bronzi nel suo inventario locale. Il lotto non parte senza input o lavoratore. La competenza personale Metallurgia parte da livello 1, cresce soltanto al completamento e accelera i lotti. Il bronzo si può trasportare e barattare; prezzo base provvisorio 13. Nessuna arma o utensile nasce automaticamente: saranno oggetti individuali in una tappa successiva.

## Dal bronzo all’ascia (22/10)

Due bronzi e una legna presenti nella fonderia possono diventare un’ascia individuale nella borsa di un abitante vicino. Il costo viene sottratto una volta sola dopo tutti i controlli; l’oggetto ha ID proprio. Per lasciarne abbastanza in fonderia, si può regolare la quota di ritorno al magazzino nei collegamenti.

## Effetto dell’ascia di bronzo (22/10)

Con l’ascia equipaggiata nella mano, il lavoro su un nodo di legna richiede il 15% di tempo in meno per unità. La quantità del nodo diminuisce sempre di una unità per azione, senza produzione extra. Pietra, rame, stagno e altre risorse non ricevono il bonus. La fame continua ad applicare il proprio rallentamento.

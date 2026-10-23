# Ver Sacrum — economia comunitaria, build 69

Il totem (`base`, ID conservato per i salvataggi) identifica l’insediamento. È rinominabile dal pannello Insediamento. Non dà alloggi e non conserva materiali. I nuovi esuli iniziano con un magazzino collegato per conservare le scorte iniziali; nei salvataggi precedenti le scorte della Casa comune vengono trasferite una sola volta a un magazzino vicino, senza perdita né duplicazione.

## Collegamenti

Compatibilità entro 12 tile, stessa fazione: totem–magazzino, magazzino–mercato, mercato–villaggio, mercato–fabbrica, villaggio–fabbrica. I collegamenti appaiono selezionando una struttura e si aprono/chiudono in Mondo → Insediamento o nella scheda della struttura. I trasferimenti locali sono automatici, non richiedono carovane. I vecchi ordini di trasporto manuale rimangono disponibili.

Per ogni merce sul collegamento magazzino–mercato: importazione attiva/disattiva, minimo da ricostituire, esportazione attiva/disattiva, scorta da trattenere. Il minimo non può superare la scorta trattenuta. Il magazzino protegge inoltre una razione per abitante quando esporta cibo. Prenotazioni dei trasportatori e capacità degli inventari sono rispettate.

Solo i magazzini con collegamento aperto a un totem rendono disponibili materiali da costruzione. Aprire un cantiere assegna fisicamente i materiali al suo inventario una sola volta; il costruttore li consuma una sola volta. Le merci sul mercato non finanziano direttamente costruzioni. Una torre ora richiede anche 6 tavole.

## Popolazione e alimentazione

Un villaggio ha 5 posti; la rappresentazione quadrata mostra da zero a otto casette in proporzione agli abitanti domiciliati. L’artigiano conserva identità e letto quando esce per lavorare. Una persona non esiste contemporaneamente come residente e come nuova unità.

Una razione copre 30 giorni, indipendentemente dal mestiere. Gli artigiani mangiano dalla struttura produttiva/mercato collegato; i domiciliati dal villaggio/mercato; gli esuli e i lavoratori senza domicilio dai magazzini comunitari. La stessa persona non paga una razione aggiuntiva al cambio mestiere. Una lavorazione si ferma quando non esiste un lavoratore presente con copertura alimentare.

Crescita: almeno due domiciliati, letto libero, persone nutrite, mercato collegato e riserva alimentare. Dopo 150 giorni favorevoli vengono consumate 18 razioni per accogliere una nuova identità. La carenza interrompe il progresso. Questi valori sono parametri provvisori di bilanciamento, non una scala storica.

## Trasformazione

Mulino, forno e nuova falegnameria ricevono input dal mercato. Le strutture reclutano automaticamente residenti dei villaggi collegati fino al numero desiderato (0–8); rimane possibile assegnare manualmente un abitante.

Falegnameria: 10 legname → 8 tavole, 10 secondi di lavoro. Il cibo è contabilizzato per persona, non nuovamente nella ricetta. Quota comunitaria predefinita 75%, configurabile 0–100%: 6 tavole al magazzino, 2 al mercato. Quote frazionarie vengono accumulate; inventari pieni o collegamenti chiusi trattengono i prodotti senza duplicarli. L’importazione del collegamento deve essere abilitata per il ritorno comunitario.

## Baratto

Nessun denaro, salario o tassa. Il pannello Scambi sceglie persona, mercato di origine, merce/quantità offerta, mercato di altra comunità, merce/quantità richiesta. Valore relativo indicativo da scorte e domanda, senza risorsa monetaria.

La carovana preleva al mercato di origine, viaggia, rivaluta lo scambio all’arrivo e torna per depositare. Se la controparte rifiuta o esaurisce le merci, riporta l’offerta. Origine piena: attende con il carico; origine distrutta: conserva il carico sulla persona. Merci e fase di viaggio persistono nei salvataggi. Le vecchie carovane monetarie vengono fermate conservando il carico.

## Risorse e verifiche

Conservati token, esagoni e triangoli della build 68. Aggiunta azione Radi al suolo con abitante entro 2 tile: permanente, nessuna ricrescita. Anche uno spot vuoto è selezionabile. Merci cadute non diventano risorse rigenerabili.

Le prove automatiche coprono inventari, razioni, produzione, migrazione, quote, carovane e salvataggi. Le vecchie prove di denaro e crescita dalla Casa comune sono state aggiornate alle nuove regole. Verifica visiva su dispositivo reale ancora da svolgere: il download di Chromium nel workspace non è riuscito.

## Build 70 — villaggi di 4 × 4 tile

Ogni villaggio riserva 16 tile, disegnati e selezionabili su tutta la superficie, anche nella minimappa. Il territorio del villaggio rimane attraversabile. Nuovi cantieri non possono sovrapporsi; i 16 tile devono essere edificabili e dentro la mappa. Ingressi e uscite sono sul perimetro; collegamenti misurati dal bordo. Popolazione e costi invariati.

I vecchi villaggi che si sovrappongono a strutture vicine sono ricollocati nella più vicina area libera edificabile, mantenendo ID, abitanti e scorte; la migrazione avviene una sola volta.

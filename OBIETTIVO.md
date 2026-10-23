# OBIETTIVO — Ver Sacrum / Terra Italica

> **Questo file è la bussola del progetto.**
> Descrive ciò che il gioco deve diventare e le intenzioni di design già approvate.
> Non è un changelog, non fotografa soltanto la build corrente e non sostituisce le specifiche tecniche nei file `docs/`.

**Ultimo aggiornamento:** 21 ottobre 2026.

---

## 1. Visione

Ver Sacrum / Terra Italica deve diventare un **RTS gestionale sandbox mobile-first ambientato nell'Italia preromana**, con visuale ortogonale dall'alto.

Il centro del gioco non è produrre unità astratte e mandarle in battaglia. Il centro è **far vivere una comunità**:

- le persone esistono come individui persistenti;
- lavorano, imparano, trasportano, costruiscono, coltivano, combattono e abitano il territorio;
- merci e risorse devono avere una presenza fisica e una provenienza leggibile;
- villaggio, economia, agricoltura, allevamento, commercio, politica e guerra devono appartenere alla stessa simulazione.

La regola generale è:

> **quando un processo può essere mostrato nel mondo, preferire il processo fisico alla scorciatoia astratta.**

Se una struttura viene costruita, qualcuno deve lavorarci.
Se una risorsa viene raccolta, qualcuno deve raggiungerla.
Se una merce viene prodotta, deve poter essere immagazzinata e trasportata.
Se un abitante cambia attività, il cambiamento deve essere leggibile nel mondo.

---

## 2. Riferimenti di design

I riferimenti servono a trasferire principi, non a copiare giochi.

### La formula

Ver Sacrum deve essere pensato come un **mix intenzionale** di:

- **Ultima Online** per il rapporto con il singolo abitante: identità persistente, skill separate, crescita attraverso l'uso, inventario ed equipaggiamento/paperdoll;
- **Seven Kingdoms: Ancient Adversaries** per il rapporto con il villaggio: popolazione, lavoro, mobilitazione, comunità neutrali, influenza e rapporti fra fazioni;
- **Caravaneer** per il rapporto con l'economia: merci reali, carico, capacità, trasporto, distanze, convenienza delle rotte e commercio fra economie locali;
- **Mindustry** per il rapporto con i flussi: input/output chiari, catene produttive leggibili, automazione e immediatezza dei sistemi soprattutto su mobile.

In una frase:

> **Ultima Online nel singolo + Seven Kingdoms nella comunità + Caravaneer nell'economia + Mindustry nella leggibilità dei flussi, dentro un RTS sandbox preromano mobile-first.**

Il risultato però deve avere una propria identità. Non bisogna sommare meccanicamente quattro giochi: ogni riferimento va filtrato attraverso ambientazione, simulazione e scala di Ver Sacrum.

### Cosa prendere e cosa non prendere

- **Ultima Online**: prendere profondità individuale e skill; non MMO, magia o struttura online.
- **Seven Kingdoms**: prendere comunità, residenti, fazioni e influenza; non copiare interfaccia o regole 1:1.
- **Caravaneer**: prendere logica economica e fisicità delle merci; non il combattimento a turni.
- **Mindustry**: prendere chiarezza di produzione e collegamenti; non nastri industriali, estetica sci-fi o torrette automatiche come centro del gioco.

Non sono obiettivi: MMO, magia, nastri industriali, torrette futuristiche o una copia fedele dei sistemi dei giochi citati.

---

## 3. Pilastri non negoziabili

### 3.1 Persone, non pedine anonime

Ogni abitante deve mantenere una propria identità:

- nome/ID persistente;
- salute;
- statistiche;
- inventario;
- skill;
- attività e stato;
- eventuale equipaggiamento;
- appartenenza alla comunità/fazione.

Gli abitanti devono poter specializzarsi attraverso il lavoro.

**Paperdoll/equipaggiamento** e **skill** devono restare due viste concettualmente separate dello stesso individuo.

Gli abitanti non devono sparire o teletrasportarsi lontano per risolvere sovrapposizioni o collisioni. Meglio una piccola imperfezione visiva che spezzare la continuità della persona.

---

### 3.2 Il villaggio è una comunità

Il villaggio non deve diventare soltanto un edificio che aumenta un numero.

Obiettivo:

- residenti reali e persistenti;
- capacità abitativa;
- lavoro;
- consumo;
- crescita;
- uscita/ingresso degli stessi individui;
- sviluppo della comunità;
- rapporto con mercati, altri villaggi e fazioni.

Il footprint mobile del villaggio è **4 × 4 tile**.

La rappresentazione visiva può arrivare a più case nel footprint; non confondere il numero di case decorative con la capienza effettiva dei residenti.

---

### 3.3 Economia fisica e locale

Evitare, quando possibile, accrediti globali invisibili.

La direzione finale è:

**produzione → inventario locale → trasporto → deposito / edificio successivo → utilizzo**

Esempi:

- legna raccolta → portatore → deposito;
- raccolto → deposito/catena produttiva;
- grano/orzo → lavorazioni alimentari;
- uva → futura filiera del vino;
- olive → futura filiera dell'olio;
- materiali → cantiere;
- merci → mercato/carovana.

I magazzini, i collegamenti tra edifici e le politiche di trasferimento devono rendere leggibile il flusso economico.

#### Insediamento, totem e scambio

- Il **totem è la struttura zero**: identifica l’insediamento e stabilisce a quale comunità appartiene la città. Per ora è un segnaposto identitario; le sue funzioni centrali future restano da progettare.
- I magazzini collegati al totem custodiscono le scorte comunitarie utilizzabili per costruire. Il giocatore deve poter configurare i collegamenti e le regole di trasferimento tra magazzini, mercati e strutture produttive.
- L’economia iniziale non usa denaro: gli scambi avvengono attraverso merci e carovane. Il mercato riceve le eccedenze destinate allo scambio e inoltra materie prime alle strutture di trasformazione; i prodotti lavorati possono tornare ai magazzini comunitari secondo quote configurabili.
- Il cibo sostiene la crescita della popolazione e la disponibilità di lavoratori per produzione e trasformazione. Va trattato come necessità concreta e incentivo al lavoro; tasse e salari monetari restano fuori finché non saranno progettati esplicitamente.

---

### 3.4 Agricoltura legata al territorio

Le colture non devono essere una produzione automatica scollegata dal mondo.

Principi:

- il giocatore **sceglie la coltura prima di piazzare il campo** e vede nel fantasma l’ingombro corrispondente;
- dimensioni approvate: **grano 2 × 2 tile** e **olivo 3 × 3 tile**; le altre misure restano nella specifica agricola e possono essere bilanciate;
- grano, orzo, vite e olivo hanno tempi, numero di lavoratori e rese differenti;
- crescita e resa dipendono da terreno, acqua, stagione e skill;
- il lavoro deve richiedere la presenza fisica degli abitanti;
- i contadini possono camminare sul campo e riposizionarsi mentre lavorano;
- **il campo è la costruzione attraversabile**;
- i raccolti devono diventare merci fisiche/locali, non semplicemente punti globali.

Per numeri aggiornati e formule consultare `docs/CROPS_AND_SEASONS.md` e il codice corrente: i valori di bilanciamento possono evolvere senza cambiare questo obiettivo.

---

### 3.5 Risorse naturali leggibili

Le risorse devono essere parte del territorio.

Direzione approvata:

- boschi e risorse rinnovabili rappresentati come aree/hex;
- pietra e ferro rappresentati come formazioni triangolari/vene leggibili;
- quantità molto più abbondanti rispetto alle prime build;
- stati visivi pieno → medio → basso → vuoto;
- ricrescita lenta dove sensato;
- possibilità di esaurire/radere una risorsa;
- un raccoglitore che termina uno spot deve poter continuare su uno spot vicino dello stesso tipo senza perdere il flusso di lavoro.

#### Grammatica delle forme sul terreno

- abitanti e animali: token circolari;
- strutture fisse: ingombri quadrati;
- giacimenti non rinnovabili come pietra e ferro: celle triangolari che compongono rilievi estesi e concentrati;
- risorse rinnovabili: gruppi di celle incastrate, con forma esagonale o pentagonale (**scelta visiva ancora da definire**).

La forma deve rendere riconoscibile la categoria e il comportamento della risorsa senza suggerire un’altezza o una tridimensionalità non presente nel gameplay.

---

## 4. Costruzioni

### 4.1 Regola generale di piazzamento

La costruzione deve avere due momenti distinti:

1. **piazzamento del fantasma**;
2. **conferma esplicita ✓ oppure annullamento ✕**.

Finché il giocatore non conferma:

- non deve partire il lavoro;
- non deve essere consumato definitivamente il cantiere;
- il giocatore deve poter annullare con chiarezza.

Il cantiere reale deve poi essere costruito da abitanti fisicamente presenti.

La UI non deve far "saltare", ricentrare o apparentemente ricaricare il quadro quando si seleziona/deseleziona o si conferma una costruzione.

---

### 4.2 Palizzate — intenzione attuale

La palizzata è una **costruzione lineare**, non una serie di edifici indipendenti percepiti dal giocatore.

Interazione:

- si seleziona Palizzata;
- si trascina sui tile;
- trascinamento prevalentemente orizzontale → linea orizzontale;
- trascinamento prevalentemente verticale → linea verticale;
- si vede il fantasma dell'intera linea;
- ✓ conferma, ✕ annulla.

Lavoro:

- una linea confermata è **una sola commessa**;
- il costruttore deve completare l'intera linea;
- durante la costruzione deve **spostarsi fisicamente accanto alla sezione su cui sta lavorando**;
- non deve terminare il task dopo il primo tratto.

Visuale placeholder approvata:

- ogni tile della palizzata usa una griglia concettuale **5 × 5**;
- ogni log occupa una cella da **1/25 di tile**;
- i log sono **tondi**;
- un tratto diritto è una striscia centrale di log;
- gli estremi liberi sono agglomerati più robusti **3 × 3**;
- una palizzata orizzontale e una verticale adiacenti devono unirsi visivamente;
- in un angolo non devono sovrapporsi due terminali 3 × 3;
- l'angolo deve diventare **un unico nodo condiviso**, idealmente 4 × 4, distribuito in modo coerente tra i due tile;
- i tratti devono rientrare quanto basta nel tile per allinearsi al nodo senza gobbe o duplicazioni.

Il placeholder è provvisorio: in seguito potrà essere sostituito da asset migliori senza cambiare la logica di rete.

---

## 5. Movimento, collisioni e lavoro fisico

Il gioco deve far percepire che gli abitanti stanno realmente svolgendo il lavoro.

Principi:

- raccoglitori vicini alla risorsa;
- costruttori vicini al tratto/edificio;
- contadini sul campo;
- trasportatori che percorrono la tratta;
- animali e abitanti non devono rimanere sovrapposti stabilmente;
- gli abitanti in movimento possono attraversarsi se necessario per evitare ingorghi artificiali;
- le soluzioni alle collisioni non devono teletrasportare gli NPC;
- dopo una deviazione un NPC deve poter tornare coerentemente alla propria area/routine.

Il pathfinding deve servire la simulazione, non combatterla.

---

## 6. Fazioni, neutrali e società

La partita deve evolvere verso un mondo abitato da più comunità, non una mappa con il solo giocatore.

Obiettivi:

- fazioni distinguibili;
- villaggi/neutrali con attività proprie;
- economie locali;
- rapporti e influenza;
- commercio e convenienza;
- conflitto come possibile esito, non come unico scopo della partita.

Il colore di fazione deve essere leggibile anche sui token umani senza alterarne l'identità grafica.

---

## 7. Combattimento

Il combattimento appartiene al gioco, ma non deve fagocitare il gestionale.

Direzione:

- abitanti mobilitabili;
- equipaggiamento e skill rilevanti;
- difese come palizzate e torri;
- minacce e conflitti integrati nel mondo;
- raid non devono essere l'unico motore della partita.

Le incursioni possono restare disattivate/de-enfatizzate mentre si consolida la simulazione economica e sociale.

---

## 8. Esperienza mobile

Il progetto è **mobile-first**, non un desktop rimpicciolito.

Obiettivi UX:

- touch leggibile;
- pan e pinch naturali;
- selezione singola e multipla;
- gruppi;
- selezione oltre il bordo dello schermo con auto-scroll;
- minimappa utile;
- pannello contestuale inferiore;
- comandi grandi abbastanza da usare con il pollice;
- nessun refresh/flash/ricentramento non richiesto;
- costruzione con ghost e conferma;
- stato della selezione sempre comprensibile.

Nel burger menu esiste/può esistere anche uno strumento di servizio **Forza BUILD** per recuperare rapidamente l'ultima versione pubblicata senza toccare il salvataggio.

---

## 9. Direzione artistica

Prima di produrre asset leggere `ART_STANDARD.md`.

Principi fondamentali:

- visuale realmente top-down/aerea;
- niente prospettiva 3/4 se non esplicitamente approvata;
- ambientazione antica/preromana;
- niente elementi moderni;
- leggibilità prima del dettaglio;
- coerenza di scala tra unità, animali, edifici e risorse;
- evitare "capoccioni" o proporzioni caricaturali non volute;
- token e segni di fazione leggibili anche a zoom mobile;
- nessun raster incorporato dentro file SVG spacciato per vettoriale;
- quando si modifica un asset esistente, preferire modificare **la geometria/il colore interno dell'asset** invece di sovrapporre correzioni esterne dal renderer.

Per i token/asset già esistenti, usare sempre gli esempi approvati nella repo come riferimento prima di generare uno stile nuovo.

---

## 10. Priorità di sviluppo

Ordine indicativo, non backlog rigido:

1. **Stabilità mobile e regressioni**
   - caricamento corretto della build;
   - salvataggi compatibili;
   - UI senza refresh indesiderati;
   - pathfinding/collisioni affidabili.

2. **Costruzione e lavoro fisico**
   - ghost/✓/✕;
   - cantieri;
   - palizzate;
   - costruttori che si muovono realmente lungo il lavoro.

3. **Abitanti e routine**
   - lavori persistenti;
   - movimento credibile;
   - separazione;
   - ritorno alle aree di attività.

4. **Villaggio e popolazione**
   - residenti;
   - capacità;
   - crescita;
   - lavoro e bisogni.

5. **Agricoltura e filiere**
   - quattro colture;
   - merci locali;
   - trasformazioni;
   - trasporto e depositi.

6. **Economia, mercati e carovane**
   - inventari locali;
   - scambi;
   - differenze fra insediamenti.

7. **Fazioni, neutrali e politica**
   - comunità autonome;
   - influenza;
   - diplomazia/conflitto.

8. **Combattimento più profondo**
   - dopo che la simulazione civile regge.

---

## 11. Regole per chi sviluppa

### Prima di implementare

1. Leggere questo file.
2. Leggere `DESIGN.md`.
3. Leggere la specifica di dettaglio pertinente in `docs/`.
4. Per grafica leggere `ART_STANDARD.md`.
5. Verificare il comportamento reale della build corrente: README e handoff storici possono contenere informazioni superate.

### Durante lo sviluppo

- Non trasformare una scorciatoia tecnica in una nuova regola di design.
- Non rimuovere sistemi già approvati solo perché sono difficili da integrare.
- Preferire modifiche piccole, verificabili e compatibili col salvataggio.
- Evitare duplicazioni di logica e override stratificati quando è possibile correggere il sistema alla fonte.
- Testare sempre il caso mobile/touch.
- Quando una funzione coinvolge un abitante, verificare anche dove si trova fisicamente quell'abitante.
- Non dichiarare una funzione completata soltanto perché il codice esiste: provarne il flusso.

### Commit e deploy

Preferire **commit atomici** per una singola intenzione completa.

GitHub Pages deve pubblicare l'ultimo `main`, non una build intermedia. Evitare sequenze di micro-commit che lasciano per alcuni minuti HTML, cache e JavaScript su versioni differenti.

---

## 12. Gerarchia delle fonti

In caso di conflitto:

1. **ultima decisione esplicita approvata dall'utente**;
2. **questo file `OBIETTIVO.md`** per l'intenzione generale;
3. specifica tecnica aggiornata in `docs/`;
4. codice corrente, se il comportamento è già confermato come corretto;
5. documenti storici / README vecchi.

Il fatto che una funzione esista nel codice non significa automaticamente che rappresenti l'obiettivo finale.

---

## 13. Documenti utili

- `DESIGN.md` — principi generali di progetto.
- `ART_STANDARD.md` — grammatica visiva.
- `docs/HANDOFF_MOBILE.md` — handoff ampio, contiene anche parti storiche.
- `docs/AUDIT_HANDOFF_BUILD80.md` — audit mobile.
- `docs/CROPS_AND_SEASONS.md` — agricoltura.
- `docs/SETTLEMENT_ECONOMY.md` — economia dell'insediamento.
- `docs/PEOPLE_MODEL.md` — modello degli abitanti.
- `docs/POPULATION.md` e `docs/RESIDENTS.md` — popolazione e residenti.
- `docs/CONSTRUCTION_KNOWLEDGE.md` — sapere edilizio.
- `docs/CONSTRUCTION_LOGISTICS.md` — materiali/cantieri.
- `docs/GOODS_AND_RECIPES.md` — merci e trasformazioni.
- `docs/MARKETS.md` — mercati.
- `docs/CHARACTER.md`, `docs/EQUIPMENT.md`, `docs/SKILLS.md` — individuo.

---

## 14. Raccolta idee

Questa sezione è pensata per diventare il punto di raccolta delle nuove intenzioni.

Formato consigliato:

- **[IDEA]** proposta non ancora approvata;
- **[APPROVATA]** intenzione confermata, da progettare/sviluppare;
- **[IN CORSO]** qualcuno la sta implementando;
- **[DA TESTARE]** implementata ma non ancora verificata nel gioco;
- **[FATTA]** verificata e coerente con l'obiettivo.

### Idee / obiettivi aperti

- **[APPROVATA]** Consolidare le palizzate come rete lineare con raccordi/angoli coerenti e costruzione fisica sezione per sezione.
- **[APPROVATA]** Eliminare ogni refresh/ricentramento visivo non richiesto quando si seleziona, deseleziona o costruisce.
- **[APPROVATA]** Rendere le routine degli abitanti più persistenti e credibili.
- **[APPROVATA]** Espandere le filiere agricole fino a prodotti trasformati reali.
- **[APPROVATA]** Rendere villaggi, mercati e fazioni parti vive della simulazione.
- **[APPROVATA]** Far crescere la profondità individuale di abitanti, skill ed equipaggiamento senza sacrificare la gestione RTS.
- **[APPROVATA]** Usare il totem come identificatore iniziale dell’insediamento e rendere configurabili i flussi tra magazzini comunitari, mercati e strutture produttive.
- **[APPROVATA]** Costruire i campi scegliendo prima la coltura; grano 2 × 2 tile e olivo 3 × 3 tile.
- **[DA DECIDERE]** Scegliere se le risorse rinnovabili useranno celle esagonali o pentagonali.

---

## 15. Una frase per orientare le decisioni

> **Ver Sacrum deve sembrare una comunità antica che vive sul territorio, non un foglio di numeri con unità che si spostano sopra.**

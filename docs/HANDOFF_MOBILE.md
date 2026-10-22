# Ver Sacrum - Handoff Funzionale e Tecnico Mobile

**Stato verificato del mobile:** [Audit build 80, lacune e priorità](AUDIT_HANDOFF_BUILD80.md). Consultarlo per distinguere il comportamento attuale dal desktop storico descritto sotto.


## Aggiornamento mobile vincolante — 4 ottobre 2026, build 80

Il documento storico sotto descrive il desktop del 16 settembre. Per agricoltura e attraversabilità nella versione mobile prevalgono queste regole:

- **Solo il campo è attraversabile.** Il recinto e tutte le altre strutture bloccano il movimento anche da incomplete.
- Grano: **2 × 2 tile, massimo 2 contadini, 10 giorni base, resa base 20**.
- Orzo: **1 × 1 tile, massimo 2 contadini, 10 giorni base, resa base 20**.
- Vite: **2 × 2 tile, massimo 8 contadini, 30 giorni base, resa base 80 uva**.
- Olivo: **3 × 3 tile, massimo 8 contadini, 40 giorni base, resa base 100 olive**.
- Ogni nuovo campo costa **10 legno**. Selezionarlo per cambiare coltura nella UI inferiore; il cambio è consentito tra i cicli e controlla spazio libero e lavoratori.
- Raccolti e merci restano locali; un inventario pieno trattiene il raccolto maturo senza perdite. Non copiare il vecchio accredito globale di `food` descritto nella sezione desktop.

Guida completa, filiere disponibili, salvataggi e limiti: [Colture e stagioni mobile](CROPS_AND_SEASONS.md). Codice mobile: `agriculture.js`, `logistics.js`, `collisions.js` e `village-footprint.js`. La guida è anche nella scheda del campo in gioco.

---


Data: 16 settembre 2026. Destinatario: sviluppatore o agente della versione mobile.
Base esaminata: progetto desktop locale Godot, non il codice della versione mobile.
Questo documento descrive tutte le principali funzioni di gioco e i loro collegamenti;
non e un elenco di ogni metodo interno. Distingue implementazione, requisiti e proposte.

## 1. Il progetto in breve

Ver Sacrum e un RTS gestionale in ambientazione preromana, con visuale ortogonale
dall'alto. Il giocatore guida una comunita fatta di persone persistenti: raccoglie,
costruisce, coltiva, difende, sviluppa competenze e commercia con altri insediamenti.
La direzione finale unisce gestione del singolo e gestione del villaggio, con merci
fisicamente prodotte e trasportate. Non e soltanto un RTS di addestramento e combattimento.

Esiste una partita desktop giocabile, ma NON tutti i pilastri del progetto sono completi.
Il porting mobile deve conservarne la profondita, non soltanto miniaturizzare la UI.

### Riferimenti vincolanti indicati dall'utente

| Riferimento | Cosa trasferire in Ver Sacrum | Cosa non assumere |
| --- | --- | --- |
| Ultima Online | Gestione individuale, paperdoll, elenco skill separato, specializzazione attraverso l'uso | Non richiede MMO, magia o copia integrale delle abilita |
| Seven Kingdoms: Ancient Adversaries | Villaggio come comunita; popolazione, lavoro e mobilitazione; neutrali e influenza politica | Il villaggio attuale non e ancora questo sistema |
| Caravaneer | Commercio fra economie locali, merci, carico, trasporti e convenienza dei viaggi | Non richiede combattimento a turni |
| Mindustry | Inventari per edificio, input/output, trasformazioni e trasporto al centro o alla fabbrica successiva | Non richiede nastri industriali o ambientazione futuristica |

**Requisito esplicito:** paperdoll ed elenco skill devono essere due viste separate
del medesimo abitante. Non sostituirle con una sola riga di statistiche nella barra RTS.

## 2. Stato delle funzioni

Legenda: **Presente** = esiste nel codice desktop; **Parziale** = base esistente ma
non equivalente al modello richiesto; **Da fare** = requisito non implementato.
Presente non significa certificato su Android/iOS o bilanciato in ogni scenario.

| Sistema | Stato | Comportamento corrente |
| --- | --- | --- |
| Nuova partita, precaricamento, pausa | Presente | Prepara l'area iniziale prima di far avanzare il gioco |
| Mondo grande, terreno e risorse a chunk | Presente | Generazione deterministica e caricamento limitato |
| Camera, zoom, minimappa | Presente desktop | Mouse/tastiera, non interazione touch dedicata |
| Selezione singola, multipla, gruppi e inattivi | Presente desktop | Gruppi persistenti e richiamo camera |
| Movimento e ordini contestuali | Presente | Percorsi locali incrementali, ostacoli e separazione |
| Raccolta, caccia, carico e consegna | Presente | Trasporto dell'abitante verso depositi |
| Costruzione e riparazione | Presente | Costi, lavoro, competenze e occupazione del terreno |
| Agricoltura e stagioni | Parziale | Quattro colture; raccolto convertito in cibo generico |
| Recinti e prodotti animali | Parziale | Produzione astratta in funzione dei lavoratori |
| Villaggi, residenti ed espansione | Parziale | Identita conservata; crescita a timer, non demografia completa |
| Skill e conoscenze edilizie | Parziale | XP/livelli e sapere personale/tribale, non sistema UO completo |
| Paperdoll ed equipaggiamento individuale | Da fare | Nessuna UI paperdoll completa |
| Finestra skill individuale separata | Da fare | La modalita Skill della barra non soddisfa il requisito |
| Neutrali, fazioni e AI economica | Parziale | Insediamenti e attivita semplici; influenza politica incompleta |
| Mercati, prezzi e rotte | Parziale | Economia presente, ma scambi collegati alla scorta globale |
| Filiera locale edificio A -> B -> centro | Da fare | Metadati dei depositi presenti; inoltro non implementato |
| Combattimento, raid, vedette | Presente | AI semplice e obiettivo militare della partita corrente |
| Vittoria e sconfitta | Presente | Distruzione campi/predoni; perdita popolazione o depositi |
| Salvataggio/caricamento | Presente desktop | JSON versione 3, scrittura temporanea e sostituzione |
| Gestione sospensione e ripresa mobile | Da verificare/implementare | La pausa desktop non basta a garantirla |
| Export mobile e test su dispositivo | Non verificati | Nessuna certificazione mobile in questo handoff |

## 3. Flusso della partita attuale

1. Menu iniziale -> nuova partita -> preparazione terreno e risorse -> simulazione.
2. Selezionare abitanti; raccogliere legno/cibo/pietra; consegnare ai depositi.
3. Costruire alloggi e villaggi, seminare campi, assegnare lavoratori e organizzare difese.
4. Espandere la popolazione, migliorare competenze e accedere ad altre costruzioni.
5. Raggiungere mercati propri o commerciabili; avviare scambi e rotte.
6. Difendersi dai raid e distruggere i campi ostili e i predoni rimanenti.
7. Salvare/riprendere; il risultato della partita apre il relativo menu.

L'obiettivo militare e quello della slice corrente: non e stato stabilito che debba
essere l'unica modalita definitiva della versione mobile.

## 4. Mondo, camera e selezione

Mappa logica di 4096 x 4096 tile, tile di 8 unita, chunk di 64 x 64 tile. Il mondo
non viene costruito tutto come nodi. Acqua, sabbia, erba, foresta, colline e montagne
contribuiscono a percorribilita, risorse, fertilita e contesto economico.

La camera desktop supporta movimento, trascinamento, zoom e ritorno al deposito
principale. La minimappa rappresenta entita e camera, non una costosa immagine
completa del terreno; permette di centrare la vista e modificare la scala.

Selezione: singolo abitante, rettangolo, aggiunta/rimozione dalla selezione, gruppi
1-9, selezione dell'inattivo successivo o di tutti gli inattivi. Il doppio richiamo
del gruppo centra la camera. I gruppi si salvano attraverso gli ID delle unita.

## 5. Abitanti, ordini e competenze

Ogni unita ha identita stabile, proprietario, salute, posizione, stato operativo,
carico, bersagli di lavoro e skill. Gli ordini includono movimento, raccolta/caccia,
consegna, costruzione, riparazione, lavoro agricolo, ingresso nel villaggio,
commercio, attacco e Stop. Un nuovo ordine contestuale interrompe la rotta commerciale.

L'ordine contestuale sceglie in base al bersaglio: nemico -> attacco; mercato
commerciabile -> scambio; edificio proprio danneggiato -> riparazione; campo/recinto
-> lavoro; villaggio -> ingresso; cantiere -> costruzione se competente; deposito
con carico -> consegna; risorsa -> raccolta; terreno libero -> movimento.
Questa priorita va resa comprensibile su touch, specialmente quando piu azioni sono valide.

Skill correnti: Esplorazione, Raccolta, Caccia, Coltivazione, Logistica, Costruzione,
Mischia. Livelli interi fino a 100, XP e moltiplicatori. Non ci sono ancora cap
complessivo, lock individuali e controlli di difficolta equivalenti a UO.

Il sapere edilizio e distinto dalle skill: conoscenze personali e tribali limitano
quali edifici un costruttore puo realizzare. Costruzione sblocca conoscenze a soglie
definite nella configurazione. Non eliminare questa distinzione nel porting.

### Gestione individuale richiesta

- Paperdoll: proposta di figura equipaggiabile con identita e slot; il dettaglio
  degli slot va definito, non e ancora una regola approvata o implementata.
- Skill: finestra distinta con abilita del personaggio e relativa progressione;
  cap e controlli crescita/blocco/riduzione appartengono al modello da completare.
- Entrambe devono mantenere un riferimento esplicito allo stesso ID personale.
- Equipaggiamento, carico da trasportare e scorte di villaggio sono concetti diversi.
- Cambiare selezione, entrare nel villaggio o salvare non deve perdere l'identita.

## 6. Risorse, raccolta e logistica

Raccolta con quantita esauribili, capacita di trasporto e deposito in punti
raggiungibili sul bordo dell'edificio. L'abitante puo proseguire su una risorsa
vicina e consegnare il residuo quando cambia materiale. La fauna si muove e fugge;
puo essere cacciata. Non esiste ancora un sistema completo di addomesticamento.

Le risorse fuori schermo usano snapshot e chiavi persistenti: allontanare la camera
non deve rigenerare una quantita gia raccolta. Le risorse bersaglio di lavoro
sono protette dallo scaricamento mentre servono alle unita.

Catalogo economico: legno, cibo, pietra, grano, vino, olio, ferro; carni ovine,
bovine, asinine, di pollo, suine, selvatiche e caprine; lana, zoccoli, pelle, ossa,
corna, piume, setole, zanne; latte vaccino/ovino/caprino, uova e letame.
La presenza nel catalogo NON garantisce una filiera fisica dedicata.

### Regola finale richiesta, ancora da realizzare

Ogni edificio produttivo possiede inventario locale. Gli input devono arrivare
fisicamente; la ricetta li consuma e crea output locali. Il trasporto puo portare
gli output al centro o direttamente a un altro produttore. Solo le scorte arrivate
nel luogo previsto sono spendibili per quella funzione.

Esempio proposto, non implementato: grano -> mulino -> farina -> forno -> pane.
Senza farina il forno si ferma; con uscita piena il mulino si ferma. Prenotare un
carico non equivale a consegnarlo. Un carico in viaggio non puo esistere anche nel
deposito di partenza. Annullamento, morte del portatore e salvataggio devono
rilasciare o ripristinare coerentemente le prenotazioni.

## 7. Costruzioni

Costi correnti in legno/cibo/pietra; valori di prototipo, non bilanciamento finale.

| ID salvato | Nome | Ingombro tile | Costo L/C/P | Funzione |
| --- | --- | --- | --- | --- |
| hearth | Magazzino principale | 5 x 5 | Iniziale | Deposito centrale; nome interno storico |
| village | Villaggio | 10 x 10 iniziali | 115/45/25 | Residenti, generazione abitanti, espansione |
| hut | Capanna | 3 x 3 | 40/0/0 | Aumenta capienza di 4 |
| storehouse | Magazzino | 4 x 4 | 65/0/25 | Punto di ricezione risorse |
| palisade | Palizzata | 1 x 3 | 12/0/0 | Ostacolo e difesa |
| farm | Recinto | 4 x 4 | 35/0/0 | Lavoro di allevamento astratto, fino a 3 lavoratori |
| watchtower | Vedetta | 2 x 2 | 75/0/45 | Attacco automatico a distanza |
| market | Mercato | 5 x 4 | 85/20/20 | Accesso all'economia commerciale |
| enemy_camp | Campo ostile | 5 x 5 | Non acquistabile | Obiettivo e generatore di raid |

Piazzamento con anteprima, controllo terreno/occupazione/costo e lavoro di
costruzione. Gli edifici bloccano normalmente il percorso anche da incompleti;
nel mobile solo il campo è attraversabile, mentre il recinto è un ostacolo. Riparazione e salute degli edifici sono presenti.
Non rinominare `hearth` o `farm` nei salvataggi senza una migrazione esplicita.

## 8. Agricoltura, allevamento e tempo

Campi distinti dagli edifici e attraversabili:

| Coltura | Lato in tile | Lavoratori massimi | Crescita base in giorni | Resa base |
| --- | --- | --- | --- | --- |
| Grano | 1 | 2 | 10 | 20 |
| Orzo | 1 | 2 | 10 | 20 |
| Vite | 2 | 8 | 30 | 80 |
| Olivo | 2 | 8 | 40 | 100 |

Ogni impianto costa attualmente 10 legno. Crescita e resa dipendono dal lavoro,
dal terreno, dalla prossimita all'acqua, dalla stagione e dalla skill agricola.
Dopo il raccolto la crescita riparte; i lavoratori consegnano e possono tornare al campo.

**Limiti importanti:** `_harvest_crop` assegna oggi `food` a tutte le colture.
La quota trasportata e limitata dalla capacita individuale senza un magazzino di
raccolto per l'eccedenza; in assenza di deposito c'e un accredito diretto alle scorte.
Questi comportamenti vanno sostituiti, non presi a modello per le filiere fisiche.

I recinti producono latte, uova e letame secondo il numero di lavoratori; lana
e piume hanno cadenze aggiuntive. Gli output entrano direttamente nella scorta
globale. Non e una simulazione completa di animali posseduti, riproduzione e foraggio.

Calendario attuale: un secondo reale per giorno, 30 giorni per mese, 12 mesi per
anno. Il consumo alimentare e invece gestito da un timer separato di 26 secondi.
Tempi e rapporto con le stagioni richiedono bilanciamento per sessioni mobile.

## 9. Villaggi e popolazione

I residenti entrano nel villaggio conservando ID e skill; il nodo viene nascosto,
non distrutto. L'uscita ripristina la stessa persona sulla mappa in un punto libero.
Il comando di uscita corrente libera un residente, non offre ancora un roster completo.

Addestramento corrente: paga 35 cibo e genera un abitante se esistono villaggio
completato e capienza. Crescita automatica: timer base di 56 secondi accelerato
dal numero di residenti. Il villaggio puo espandere l'impronta su un lato libero,
pagando 7 legno e 2 cibo per nuova tile; la capienza viene ricalcolata dall'area.
L'espansione corrente sceglie automaticamente un villaggio vicino all'origine:
su mobile deve essere chiaro quale insediamento si sta modificando.

**Da raggiungere, modello Seven Kingdoms:** popolazione residente, occupati,
disponibili e mobilitati; reclutamento come trasferimento di persone; lealta,
resistenza, influenza e rapporti con i regni. Case visibili come insediamento e
non semplice produttore di unita. Non confondere la capienza delle case con
popolazione effettiva o domanda di consumi.

## 10. Neutrali, fazioni e combattimento

La configurazione prevede tre insediamenti neutrali e due fazioni commerciali:
Clan del Guado e Lega delle Colline. Hanno proprietari, edifici, abitanti e scorte;
l'AI economica assegna attivita semplici. Esistono stati diplomatici usati per
ostilita e commercio, ma non un sistema completo di trattati, persuasione o guerre.

Combattimento: salute, mischia, attacchi a edifici dal perimetro, auto-difesa degli
abitanti inattivi, predoni e torri. Tre campi ostili sono gli obiettivi iniziali.
Configurazione raid: attesa iniziale 130 secondi, intervallo 95 secondi e limite
di nemici per campo. Non sono presenti tattiche e formazioni militari avanzate.

Vittoria corrente: nessun campo ostile e nessun nemico rimanente. Sconfitta:
nessun abitante oppure nessun deposito del giocatore. Il menu risultato ferma
la simulazione. Non sostituire questa verifica con la sola costante RAIDERS_TO_WIN.

## 11. Mercati e carovane

`CaravanEconomy` contiene merci con prezzo base/ingombro, inventari e denaro dei
mercati, scorte desiderate, domanda, ricette astratte, prezzi di acquisto/vendita,
prezzi conosciuti, carico commerciale e suggerimenti di rotta.
Il contesto geografico influenza l'offerta; il collegamento ai villaggi influenza
la domanda. Attualmente questa usa anche la capienza dei villaggi come proxy,
non una demografia completa. Mercati e scorte degli insediamenti sono persistenti.

Il mercante selezionato si sposta realmente verso il mercato. All'arrivo lo
scambio automatico usa `trade_with_stockpile`: vende/preleva direttamente dalle
scorte globali del giocatore e accredita li gli acquisti. La capacita limita la
transazione ma NON rappresenta un carico fisico completo con viaggio di ritorno.
Non confondere il `cargo` del modello economico con il carico indipendente di
ogni abitante. Il refactoring dovra unificare questi concetti senza duplicare merci.

La rotta corrente sceglie mercati commerciabili vicini, esclude quello appena
visitato, registra tappe e puo essere fermata. Non e un pianificatore ottimale di
profitto/percorso; la vicinanza geometrica non garantisce la raggiungibilita.

### Esperienza mobile proposta per il commercio

Inventario della carovana, inventario del mercato e proposta di scambio distinti;
quantita selezionabili; denaro e carico risultante prima della conferma; motivi
chiari quando scorte, capacita o liquidita non bastano. Equipaggiamento e riserve
di viaggio non vanno venduti automaticamente. La conferma applica lo scambio
una sola volta, anche con doppio tap o ripresa dell'app.

Mostrare rotta, destinazione, merci assegnate, capacita libera e costi stimati.
L'esatta formula dei prezzi di Caravaneer non e stata ricostruita. Il primo gioco
e stato trovato su Newgrounds/Ruffle, ma non e stato verificato uno scambio
giocato. Dettagli documentali di Caravaneer 2 non vanno attribuiti automaticamente al primo.

## 12. Interfaccia e controlli mobile

La UI desktop comprende HUD, minimappa, barra contestuale, modalita Costruisci/Skill,
menu principale/pausa e risultati. Alcuni pulsanti Raccogli/Coltiva/Attacca della
barra mostrano oggi istruzioni per il clic destro: NON sono modalita touch operative.

Proposta di interazione, da validare sul dispositivo:

| Funzione | Adattamento touch |
| --- | --- |
| Selezionare/ispezionare | Tap sull'entita, evidenza visiva e scheda contestuale |
| Spostare camera | Trascinamento in modalita navigazione |
| Zoom | Pinch con limiti; non deve impartire ordini |
| Selezione multipla | Modalita esplicita con rettangolo e aggiunta/rimozione |
| Dare ordine | Pulsante azione + tap bersaglio, oppure conferma contestuale |
| Costruire | Anteprima trascinabile con conferma e annullamento separati |
| Gruppi | Icone di gruppo con gestione da menu, non tastiera richiesta |
| Inattivi/Casa/Stop | Comandi sempre raggiungibili |
| Paperdoll/Skill | Due viste separate; su telefono a piena altezza o pannelli dedicati |
| Informazioni dei tooltip | Tap informativo; mai dipendere dal passaggio del mouse |
| Pausa/salva/carica | Menu touch; nessuna dipendenza da F5/F9/Esc |

Non usare lo stesso trascinamento ambiguamente per camera, selezione e ordine.
Separare tap da trascinamento con soglie coerenti; consumare gli eventi UI prima
che raggiungano la mappa. Un secondo dito o la chiusura di un pannello non deve
emettere un ordine involontario. Ampliare l'area selezionabile dei piccoli sprite
senza cambiarne necessariamente la grafica. Gestire entita sovrapposte con scelta esplicita.

Supportare telefono/tablet e testare entrambe le orientazioni; adattare il layout
invece di comprimere la barra desktop. Rispettare safe area e dimensioni del testo.
I pannelli coprenti devono lasciare chiaro se la simulazione continua o e in pausa.
La politica di pausa durante gestione individuale/commercio e da definire.

## 13. Architettura e punti d'ingresso

Percorsi relativi alla cartella del progetto; i nomi sono quelli del codice attuale.

| File | Responsabilita / funzioni da conoscere |
| --- | --- |
| project.godot, scenes/main.tscn | Configurazione e scena iniziale |
| scripts/world/world_root.gd | Coordinamento mondo, camera, UI, precaricamento e menu |
| scripts/world/world_config.gd | Definizioni, costi, colture, risorse, limiti e parametri |
| scripts/world/terrain_generator.gd | Terreno deterministico, fertilita e rese geografiche |
| scripts/world/tile_chunk.gd | Generazione incrementale e disegno dei chunk |
| scripts/camera/camera_controller.gd | Camera desktop; punto di adattamento touch |
| scripts/simulation/unit_manager.gd | Comandi, economia, insediamenti, streaming, AI e salvataggi |
| scripts/simulation/villager.gd | Stati e ordini dell'unita, movimento, lavoro, salute e carico |
| scripts/simulation/skill_set.gd | XP, livelli, moltiplicatori e serializzazione skill |
| scripts/simulation/building.gd | Edifici, lavoro, salute, depositi e residenti |
| scripts/simulation/crop_plot.gd | Campi, crescita e lavoratori |
| scripts/simulation/resource_node.gd | Risorse, fauna e raccolta |
| scripts/simulation/caravan_economy.gd | Inventari commerciali, prezzi, industrie astratte e transazioni |
| scripts/simulation/pathfinder.gd | A* locale incrementale |
| scripts/ui/command_bar.gd | Pulsanti, disponibilita e contesto della selezione |
| scripts/ui/game_menu.gd | Menu iniziale, pausa e risultati |
| scripts/ui/minimap_panel.gd | Navigazione e rappresentazione sintetica delle entita |
| scripts/ui/debug_hud.gd | Stato, prestazioni e diagnostica |

Punti principali in UnitManager: `issue_ui_command`, `_issue_context_command`,
`get_command_state`, `enter_village`, `_release_village_resident`, `_run_trade_route`,
`_harvest_crop`, `_update_livestock_lifecycle`, `save_game`, `load_game`.

Non trasferire tutto il grande UnitManager in una schermata mobile. Separare
progressivamente input/UI dal dominio tramite comandi con ID unita, target e
quantita; fare validazione nella simulazione. Se il mobile usa un altro motore,
questi sono contratti comportamentali, non un obbligo di usare GDScript.

## 14. Dati e salvataggi

Formato desktop JSON v3: tempo/calendario, scorte, sapere tribale, insediamenti,
scorte per proprietario, diplomazia, economia commerciale, camera, timer, gruppi,
rotte, edifici, campi, unita proprie/neutrali/nemiche, risorse e snapshot di streaming.
Ordini e residenti vengono ricostruiti usando ID e riferimenti stabili.
Percorso desktop: `user://ver_sacrum_save.json`. Il percorso fisico cambia su mobile.

Scrittura a file temporaneo, flush e rename; validazione prima di svuotare lo stato
attuale. Non promettere compatibilita diretta con il nuovo modello di inventari:
servono nuova versione e migrazione testata, conservando i salvataggi originali.

Su mobile aggiungere salvataggio ai checkpoint e alla sospensione quando possibile,
gestione della perdita del processo, pausa al background e ripresa senza delta
temporale enorme. L'avanzamento offline NON e un requisito approvato: non introdurlo
implicitamente usando il tempo trascorso mentre l'app era chiusa.

Per il nuovo modello servono ID di insediamenti/edifici/inventari/trasporti,
prenotazioni persistenti, ricette in corso e collegamenti ai personaggi. La chiusura
di una finestra non deve possedere o distruggere dati del dominio.

## 15. Prestazioni e validazione

Configurazione attuale: Godot 4.6, renderer Compatibility, viewport interno
1280 x 720 e filtro nearest. Il flag renderer mobile non prova l'esistenza di
un export pronto. Il motore mobile e i requisiti di pubblicazione vanno verificati
nel progetto di destinazione; non sono oggetto di questo documento.

Conservare streaming, cache limitate, griglia spaziale, percorsi accodati con budget,
generazione a passi e timer economici. Non allocare l'intera mappa o un nodo per
ogni oggetto di magazzino. Preferire record leggeri per residenti non visibili;
la popolazione fuori schermo deve continuare a esistere senza richiedere il rendering.

Proposta di profili: 30 FPS stabili come base da misurare su dispositivo economico,
60 opzionali dove sostenibili; verificare consumo, temperatura e memoria in sessioni
prolungate. Non ridurre la correttezza economica per mantenere la frequenza grafica.

Ultime misure desktop documentate, NON rieseguite per questo handoff:
Celeron N4000/UHD 600, iniziale mediana 16,672 ms e p95 17,077 ms; stress di
229 unita mediana 21,322 ms e p95 53,384 ms. Esistono picchi; nessuna promessa
di 60 FPS su tutti i dispositivi. La memoria statica Godot non equivale alla RAM totale.

Suite esistente: `tools/run_checks.ps1`, regressioni statiche, `crop_smoke.gd`,
`gameplay_regression.gd` (27 controlli documentati nell'ultima esecuzione).
`visual_playtest.gd` verifica renderer/layout e produce `output/performance.json`.
Nessun nuovo collaudo runtime e stato eseguito durante la stesura del handoff.

### Accettazione del porting

- Partita completa da touch senza mouse/tastiera: selezione, lavoro, costruzione,
  commercio, combattimento, vittoria/sconfitta, salvataggio e ripresa.
- Tap sulla UI, pinch e trascinamento non impartiscono ordini accidentali.
- Identita, skill, equipaggiamento e residenti sopravvivono a entrata/uscita e reload.
- Background, blocco schermo e terminazione del processo non duplicano carichi o scambi.
- Fabbriche senza input o con output pieno si arrestano; merci in viaggio non sono spendibili due volte.
- Camera lontana e streaming non ripristinano risorse consumate o bloccano il lavoro.
- Mercato senza soldi/scorte, percorso impossibile e villaggio pieno danno esiti leggibili.
- Layout controllato su telefono piccolo, tablet, orientazioni e safe area.
- Prestazioni misurate in raccolta, costruzione, commercio e combattimento prolungati,
  includendo p95 dei frame, memoria e comportamento termico.

## 16. Ordine di lavoro consigliato

1. Portare ciclo base, comandi touch, pausa/ripresa e salvataggio mantenendo i test.
2. Introdurre inventari locali e trasporto persistente, poi una filiera completa.
3. Rifare il villaggio come popolazione organizzata e neutrali influenzabili.
4. Aggiungere paperdoll e skill separate, collegate a dati individuali persistenti.
5. Collegare mestieri/skill a ricette e difficolta; collegare mercati alle produzioni.
6. Completare carovane fisiche, proposta di scambio e bilanciamento dei viaggi.
7. Allargare contenuti soltanto dopo collaudo della filiera e delle prestazioni mobile.

Restano da concordare: piattaforme e motore mobile, compatibilita dei save desktop,
slot di equipaggiamento, cap delle skill, pausa nei pannelli e obiettivi oltre la
vittoria militare. Monetizzazione, cloud save, multiplayer e avanzamento offline
non sono richieste implicite di questo progetto.

## 17. Materiali da passare al prossimo sviluppatore

Questo documento, `RICERCA_RIFERIMENTI.md`, `ANALISI_E_COLLAUDO.md`, `GUIDA_RAPIDA.md`,
`project.godot`, `scenes/`, `scripts/`, `assets/sprites/` e `tools/` di collaudo.
Le note storiche nel README possono essere superate: prevalgono codice corrente,
chiarimenti espliciti dell'utente e documenti datati piu recenti.

I checkout in `references/` sono materiale di studio escluso da Godot, non dipendenze
runtime. 7kaa, Mindustry e ServUO hanno proprie licenze; il client UO locale non e
codice server disponibile. Non trasferire automaticamente sorgenti o asset al mobile
senza verificarne provenienza e condizioni. Anche gli asset forniti dall'utente
richiedono verifica dei diritti prima di una distribuzione pubblica.

### Brief pronto per un altro agente

> Sto sviluppando Ver Sacrum mobile, RTS gestionale preromano ortogonale. Leggi
> questo handoff e il codice di destinazione prima di modificare. Mantieni separati
> stato attuale e requisiti: UO per individuo/paperdoll/skill separate; Seven Kingdoms
> per comunita e neutrali; Caravaneer per commercio; Mindustry per inventari locali
> e filiere fisiche. Non trattare stockpile globale, raccolto generico e crescita
> a timer come modello finale. Conserva ID e salvataggi, progetta comandi touch
> senza ambiguita, testa sospensione/ripresa e misura su hardware mobile reale.
> Prima rendi completa una filiera e una partita da touch, poi amplia i contenuti.


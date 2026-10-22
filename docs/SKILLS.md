# T08 — Vista Skill separata (BUILD 39)

La vista Skill è distinta dal paperdoll Personaggio, ma legge lo stesso record
persistente dell'abitante selezionato. Mostra tutte le abilità, livello, XP corrente
e progresso verso il livello successivo; funziona anche per residenti non presenti
fisicamente sulla mappa.

Il progresso nasce soltanto dall'uso già simulato: raccolta, agricoltura,
costruzione, domesticazione e combattimento. Il passaggio di livello conserva
l'XP eccedente e può attraversare più livelli in una sola assegnazione.

Soglia (livello × 20 XP), livello massimo 20 e assenza di lock sono parametri
provvisori configurabili in `TERRA_SKILLS`, non decisioni approvate sul
bilanciamento finale. Le conoscenze edilizie restano fuori da questa vista e
saranno un dominio separato in T09.

## Catalogo ampliato (prova del 22/10)

Sei abilità personali si aggiungono alle otto iniziali: Trasporto, Molitoria, Falegnameria, Panificazione, Allevamento e Scambio. Tutte nascono al livello 1 (principiante) per rispettare la formula XP esistente. Non sostituiscono le abilità precedenti e non si azzerano al cambio di mestiere. I vecchi salvataggi ricevono le nuove voci al caricamento senza alterare livelli/XP esistenti.

L'XP nasce solo da un evento reale: merci consegnate a destinazione, lotto di produzione finito con lavoratore presente, latte prodotto al recinto, baratto riuscito al mercato. Un incarico assegnato, un lotto fermo o un baratto respinto non danno XP. I bonus di produttività delle sei abilità sono una tappa successiva: i valori di bilanciamento restano provvisori.

Riferimenti osservati prima della modifica: `Rtsmobile-ricerca/7kaa/include/OSKILL.h` e `src/OSKILL.cpp` mostrano una sola `skill_id` per persona e `get_skill(id)` che vale zero per le altre; RunUO `Server/Skills.cs` (repository pubblico) usa invece un insieme di skill indicizzate per individuo, con valori e cap propri. Ver Sacrum conserva più skill nello stesso abitante e non copia formule o codice.

## Effetti prudenti dei livelli (22/10)

Mulino, segheria e forno: il livello medio degli operatori presenti accelera il tempo residuo del lotto del 2,5% per livello sopra il primo, massimo +30%. Input e output della ricetta restano identici; senza lavoratori il lotto resta fermo. Trasporto: quando porta davvero merce, l'abitante cammina fino al 20% più veloce al livello 20; il viaggio a vuoto non riceve il bonus. La schermata Skill mostra il bonus corrente. Questi numeri sono parametri provvisori di bilanciamento, senza cap complessivo delle skill.

Allevamento: il livello medio degli operatori presenti aumenta il latte fino al 25% al livello 20. Le frazioni restano nel recinto fra i giorni e nei salvataggi; se manca spazio, il giorno non consuma foraggio né modifica il resto. Scambio: il mercante aumenta fino al 5% il valore della propria offerta nel controllo del baratto; la quantità fisica trasferita resta quella proposta. Non compare moneta e il mercato conserva le proprie scorte. I due effetti sono parametri di bilanciamento provvisori.

I cinque esuli iniziali hanno il dato persistente «Partito giovane nel Ver Sacrum» e tutte le 14 abilità al livello 1 principiante. Il dato racconta da dove partono e resta vero quando crescono; non simula ancora età biologica. I nuovi abitanti e i vecchi salvataggi non ricevono retroattivamente una storia inventata.

## Maestro di bottega (22/10)

Nella schermata Skill si può scegliere o rimuovere un maestro per un abitante. Il legame è personale e persistente. Nei lotti di mulino, segheria e forno, l'allievo riceve +50% XP solo se il maestro è presente fra i lavoratori del medesimo lotto ed è avanti di almeno due livelli nella relativa abilità. Un incarico senza produzione completata non dà XP. Il maestro non aumenta le merci create e non perde competenze insegnando. L'apprendistato in altri lavori è una tappa futura.

## Maestro nei campi e nella raccolta (22/10)

Lo stesso maestro scelto nella schermata Skill può insegnare durante un raccolto nel medesimo campo oppure mentre raccoglie la stessa risorsa naturale vicino all’allievo. Serve un vantaggio di almeno due livelli nella skill interessata e la presenza fisica al lavoro. Il bonus resta +50% XP solo quando nasce davvero la merce: a raccolto completato o a ogni unità prelevata dal nodo. La maturazione del campo e l’attesa davanti a un nodo non danno XP. Il bonus non modifica la quantità di risorsa. La logica comune vale anche per i lotti di bottega.

## Salute e razioni (prova del 22/10)

Una razione copre 30 giorni come prima. Dopo cinque giorni consecutivi senza razione, ogni giorno toglie 1 punto salute: il villaggio ha tempo per rifornirsi. Quando arriva cibo, un punto al giorno del solo danno registrato da fame viene recuperato. Ferite di combattimento non guariscono con questa regola. Giorni senza razione e danno nutrizionale sono personali, persistenti e visibili nella Comunità. Il bilanciamento è provvisorio; il cibo rimane fisico e viene consumato una sola volta.

## Fame e ritmo di raccolta (prova del 22/10)

Quando manca una razione, un abitante conserva gli ordini e può ancora raccogliere cibo, legna o altre risorse. La raccolta naturale e la crescita del campo operano al 70% del ritmo normale; quantità raccolta e XP per unità non cambiano. Il ritmo torna pieno appena una razione è disponibile. Il valore 70% è provvisorio. Le botteghe mantengono il precedente requisito di una razione attiva.

## Precedenza delle razioni scarse (prova del 22/10)

Quando le scorte non bastano per tutti, viene servito prima chi è senza razione da più giorni. A parità, precede chi aveva la copertura alimentare scaduta prima; le persone ancora coperte non ricevono una seconda razione. Ogni razione è comunque prelevata da una scorta realmente raggiungibile dalla persona. I giorni senza razione già persistenti bastano per ricostruire la precedenza dopo un caricamento.

## Riposo in casa e ferite (prova del 22/10)

Una persona residente in una casa costruita e integra recupera 0,5 punti salute al giorno se ha una razione ancora valida. Il riposo è distinto dal recupero del danno da fame; non costa una seconda razione e non funziona fuori casa, senza cibo o in un edificio distrutto. Il ritmo è provvisorio e rende possibile recuperare lentamente le ferite del combattimento.

## Riposo dei residenti (prova del 22/10)

Una casa costruita e integra permette a un residente nutrito di recuperare 0,5 salute al giorno dalle ferite ordinarie. Non viene consumata una seconda razione. Il recupero nutrizionale già esistente resta separato e viene completato prima del riposo. Fuori casa, senza cibo o in casa distrutta non si guarisce. Valore provvisorio.

## Ceramica personale (prova del 22/10)

La quindicesima abilità è Ceramica. Tutti gli abitanti, anche nei vecchi salvataggi, iniziano al livello 1 se non l’hanno già; il livello e l’XP sono personali e sopravvivono al cambio di mestiere. Il ceramista guadagna XP solo quando la fornace completa un lotto reale; con un maestro presente vale l’apprendistato già previsto. La velocità del lotto sale fino al 30% come per gli altri mestieri.

## Tessitura personale (prova del 22/10)

La sedicesima abilità è Tessitura, aggiunta a livello 1 anche alle persone dei vecchi salvataggi. Si guadagna XP solo a lotto di tessuto completato, resta cambiando mestiere e accelera il telaio fino al 30% come le altre abilità artigiane. Il maestro può aumentare l’XP se lavora nello stesso lotto ed è avanti di almeno due livelli.

## Metallurgia (22/10)

La nuova abilità personale governa la velocità dei lotti nella fonderia. Si acquisisce XP solo quando un lotto di bronzo viene completato da un fonditore effettivo; resta all’abitante se cambia mestiere. I vecchi salvataggi la inizializzano a livello 1.


## Cura personale (BUILD 137)

Il catalogo corrente contiene 19 abilità. Cura è una skill della singola persona: si sviluppa solo quando una medicazione reale termina e resta se il curante cambia mestiere. L’ordine richiede un tessuto fisico da un deposito locale raggiungibile o dal carico del curante. Recupera 6 + 0,5 × livello punti salute di ferita, una volta per giorno di gioco per paziente; il danno da fame resta distinto. Un ordine interrotto dopo il prelievo conserva il tessuto nel carico. I salvataggi precedenti senza Cura assegnano livello 1 al caricamento senza toccare le altre abilità.


## Cura dei residenti (BUILD 138)

La stessa abilità Cura tratta anche una persona registrata come residente in una casa. Il giocatore tocca la superficie completa della casa con l’ordine attivo; il curante raggiunge la porta, usa un tessuto reale e modifica soltanto la salute del residente scelto. Il residente non deve uscire e non viene duplicato. Il salvataggio durante la visita conserva identità, casa, percorso e carico.

## Curante stabile (BUILD 139)

Da Ordini → Curante stabile si assegna il servizio alla persona selezionata, vicino alla base propria più vicina (entro 18 caselle). Ogni giorno il curante cerca i feriti entro 12 caselle dalla base, dà priorità alle ferite maggiori, preleva un tessuto reale e percorre la strada fino al ferito sulla mappa o alla casa del residente. Continua dopo ogni cura finché il giocatore tocca di nuovo il comando, usa Libera oppure gli assegna un altro lavoro. Attende le consegne se manca il tessuto. La persona, la base di servizio, il carico, l'abilità Cura e l'ordine in corso restano nel salvataggio. Il curante non sostituisce altri lavoratori.

## Rientro del curante (BUILD 140)

Quando non trova una nuova cura da svolgere, il curante stabile raggiunge a piedi l’accesso della base cui è assegnato. Il rientro usa un normale percorso della mappa, può essere interrotto con Libera o un altro ordine e prosegue dopo il caricamento della partita. Una nuova ferita nel raggio lo richiama dal percorso di rientro al giorno di gioco successivo. Se il percorso è bloccato, resta dov’è e riprova alla successiva giornata di ricerca; non viene spostato all’istante.

## Allievo del curante (BUILD 141)

Il maestro scelto nella scheda Abilità può insegnare Cura: l'allievo deve essere libero sulla mappa, a non oltre 1,8 caselle quando termina una medicazione reale, e avere almeno due livelli di Cura in meno. Un solo allievo, il più vicino, ottiene 2 XP; il curante riceve i consueti 6 XP. Una cura annullata non insegna nulla. Nessuna seconda benda o persona viene creata. Il legame e gli XP rimangono nel salvataggio.

## Seguire il maestro (BUILD 142)

Un allievo cui è stato assegnato un maestro nella scheda Abilità può ricevere l’ordine **Segui maestro**. Resta un abitante separato, cammina fino a una casella vicina e aggiorna il percorso quando il maestro si muove. Il compito resta nel salvataggio e si interrompe con un secondo tocco, Libera, un nuovo ordine, un cambio di maestro o la perdita del maestro. Durante il seguito, se è entro 1,8 caselle al termine di una cura reale, può ricevere i 2 XP di Cura della BUILD 141. Non entra automaticamente in combattimento.

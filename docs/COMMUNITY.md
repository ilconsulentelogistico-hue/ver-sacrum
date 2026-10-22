# T04 — Comunità e mobilitazione (BUILD 35)

Comunità → Gestisci comunità apre un elenco nominale in pausa. Seleziona centra la
persona (anche residente); Mobilita fa uscire lo stesso record da un Distretto,
se esiste spazio, e lo rende mobilitato. Una persona impegnata va prima liberata.
Smobilita annulla il compito preservando il carico e rende disponibile la persona
nella posizione corrente. Entra la riporta fisicamente al Distretto e smobilita.

Disponibili + occupati + mobilitati = popolazione viva del giocatore. Residenti è
un conteggio separato della collocazione: include persone disponibili nei Distretti.
Un mobilitato resta tale mentre riceve ordini: la mobilitazione è un impiego esplicito,
non una deduzione dal combattimento automatico. Nessun bonus militare implicito.

`mobilized` è un booleano opzionale additivo nel formato v5, assente nei vecchi
salvataggi = false. Un residente non può essere mobilitato. ID, salute, skill e carico
restano nello stesso Unit. La chiusura dopo background non riprende la simulazione.

Verifica: `node tests/community.cjs`, nove casi in Node VM/DOM simulato;
restano da eseguire verifica browser reale e dispositivo.

## Sentinella stabile (BUILD 143, 23/10/2026)

Una persona mobilitata, sana e con morale sufficiente può ricevere **Ordini → Sentinella stabile** vicino a una propria base raggiungibile. Resta la stessa persona con il suo equipaggiamento, sorveglia un raggio di 8 caselle e affronta solo razziatori o lupi ostili vicini. Se la minaccia esce dal raggio di 10 caselle dalla base, la sentinella interrompe l'inseguimento; quando termina lo scontro torna a piedi all'accesso della base. La ricerca avviene ogni 0,75 secondi e il percorso d'inseguimento si ricalcola al massimo ogni secondo. Salute pari o inferiore a 35 o morale sotto 25 impediscono il combattimento; la persona resta assegnata ma non si sacrifica. Il servizio e il bersaglio in corso sopravvivono al salvataggio. Un secondo tocco, Libera, Smobilita o un nuovo ordine terminano il servizio. Non vengono create persone, merci o armi.

## Presidio delle torri (BUILD 144, 23/10/2026)

Le nuove torri costruite dalla comunità restano silenziose finché una persona mobilitata non le presidia. Seleziona una persona già mobilitata, apri **Ordini → Presidia torre** e tocca una torre propria completata. Una torre accetta una sentinella; questa cammina al posto e non insegue i nemici. La torre colpisce i razziatori entro 6,3 caselle solo quando la sentinella è vicina (entro 2 caselle), ha più di 35 salute e almeno 25 morale. Ogni colpo fa crescere la sua abilità Combattimento; il danno varia con l'abilità. **Libera**, un altro ordine o **Smobilita** interrompono il presidio. Il servizio e la torre restano nel salvataggio. Le torri contenute nei salvataggi precedenti continuano con la difesa automatica già esistente, così una partita avviata non perde protezione all'aggiornamento. Interfaccia **PROVVISORIO, da approvare da Simone**.

## Pietre per le torri (BUILD 145, 23/10/2026)

La torre nuova presidiata usa **una pietra della propria scorta locale per ogni colpo**. Se manca pietra, non attacca. Seleziona la torre e tocca **Rifornisci con un abitante**: una persona libera trasporta pietra dalla Casa comune o da un magazzino alla torre e mantiene la rotta per i rifornimenti successivi. Il trasportatore cammina con un carico reale, impara Trasporto e conserva incarico e merce nel salvataggio. Puoi anche impostare manualmente la rotta in **Scorte e lavori**. Se manca pietra a monte o non c'è una persona libera, l'interfaccia lo dice. Le torri dei vecchi salvataggi mantengono il comportamento precedente, senza consumare pietra. Interfaccia **PROVVISORIO, da approvare da Simone**.

## Razziatori contro le torri (BUILD 146, 23/10/2026)

Quando una **nuova** torre è davvero in funzione (sentinella presente e pietra locale), i razziatori entro 5 caselle possono cambiare bersaglio e colpirla. Raggiungono il perimetro dell'edificio; ogni colpo toglie salute. Una torre distrutta interrompe il presidio al turno successivo e lascia a terra le pietre rimaste una sola volta. La salute danneggiata e il servizio della sentinella restano nel salvataggio; la riparazione usa le normali regole di pietra locale e lavoro reale. Le torri dei vecchi salvataggi conservano anche il comportamento precedente dei razziatori. UI **PROVVISORIO, da approvare da Simone**.

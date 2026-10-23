# Ver Sacrum — BUILD 182

Gioco strategico per smartphone ambientato in un’Italia preromana immaginata con prudenza. Parti con cinque giovani, scegli dove fondare il villaggio e fai crescere persone, mestieri, economia e rapporti con le altre comunità. Puoi giocare una **Confederazione** con vittoria e sconfitta oppure una partita **sandbox**.

**Grafica e interfaccia nuove: PROVVISORIO, da approvare da Simone.**

## Avviare il gioco

Dalla scheda Dettagli di un campo, recinto o bottega completati si può **aggiungere un lavoratore**: il gioco propone una persona libera esperta del mestiere e consente di sceglierne un’altra. Il lavoratore mantiene identità e abilità. Interfaccia **PROVVISORIA, da approvare da Simone**.

BUILD 182 completa il rifacimento dell’interfaccia (Lotto D, Claude): durante una razzia restano «Mostra razziatore», un solo «Difendi» (Casa comune o magazzino minacciato), «Insegui il ladro» e «Recupera cibo a terra»; nella scheda Abilità «Impara da…» propone il maestro più utile; torri e magazzini assegnano la propria sentinella; chi vive in un Distretto può «Fai uscire» o «Arruola», e l’ordine «Entra» si chiama «Vai a vivere»; i trasporti scelgono partenza e arrivo toccando gli edifici sulla mappa; la Guida si riapre dal menu Partita, la minimappa si richiude, gli oggetti si indossano toccando la figura e la fine partita mostra un riepilogo. Interfaccia **PROVVISORIA, da approvare da Simone**.

Il [gioco su GitHub Pages](https://ilconsulentelogistico-hue.github.io/ver-sacrum/) mostra la BUILD 182 dal ramo `codex/partita-completa`, mentre la PR #1 è aperta. Dopo il merge di Simone, impostare **Settings → Pages → Deploy from a branch → `main` → `(root)`**. Il gioco è statico: non richiede una build né un server applicativo; i percorsi sono relativi.

Alla prima apertura scegli:

1. **Mappa 256×256**, consigliata per il telefono, oppure 512×512 da provare sul tuo dispositivo.
2. **Confederazione** (obiettivi, razzie, vittoria e sconfitta) oppure **sandbox** (senza scadenza e senza razzie).
3. Scegli l’animale sacro tra Lupo (Hirpus), Picchio (Picus) e Toro (Bos); per ora non dà bonus.
4. Esplora con i cinque giovani e pianta il totem dove vuoi fondare la Casa comune.
5. Segui o salta la breve guida ai primi ordini.

I salvataggi stanno nel browser del dispositivo e restano distinti per grandezza della mappa. Dopo un caricamento la partita resta in pausa: premi il pulsante **▶** nella barra in alto.

Nel menu **Gioco** trovi Costruisci, i gruppi, il prossimo abitante libero e il ritorno alla Casa comune. Tocca **Relazioni** nella barra per la diplomazia; tocca un contatore di risorse per vedere tutte le merci nei depositi e nel carico degli abitanti. Dalla Casa comune puoi aprire Costruisci e scegliere il costruttore, oppure lasciare al gioco la scelta del più esperto. Nel menu **Partita** trovi Salva, Carica, Nuovo mondo e Impostazioni. Carica e Nuovo mondo chiedono conferma; accanto a Salva vedi l’orario dell’ultimo salvataggio quando disponibile.

## Comandi essenziali

- Tocca un abitante per vederne abilità, equipaggiamento, morale, salute e scorte. Le abilità restano quando cambia lavoro.
- Tieni premuto **MOD** e tocca o trascina per selezionare più persone; senza MOD trascina la mappa. Due dita o `+` e `−` regolano lo zoom.
- Da **Ordini** scegli raccolta, movimento o altre attività e tocca il bersaglio. **Cura ferito** usa un tessuto presente in un deposito o nel carico del curante: seleziona chi cura e tocca un altro abitante ferito sulla mappa oppure qualunque punto della casa di un residente ferito. **Curante stabile** assegna quella persona alle cure automatiche dei feriti vicini alla base, usando sempre tessuto reale; un secondo tocco o **Libera** interrompe il servizio. In **Abilità** puoi scegliere quel curante come maestro di un allievo: se l’allievo è libero e vicino quando una cura finisce, apprende un po’ di Cura senza usare altro tessuto. Con **Ordini → Segui maestro** l’allievo gli resta vicino mentre si sposta; un secondo tocco o **Libera** interrompe il seguito. In **Comunità** puoi mobilitare una persona e assegnarle **Ordini → Sentinella stabile**: difende la base da razziatori e lupi vicini, poi torna al posto; un secondo tocco, **Libera** o Smobilita fermano il servizio. Da **Costruisci** scegli una struttura e tocca il terreno; tieni premuto e trascina il progetto se serve. **MOD + tocco** annulla la costruzione.
- Da **Relazioni** consulta gli altri villaggi: **Mostra sulla mappa** li centra, poi puoi commerciare, proporre patti, cercare l’adesione pacifica o mobilitare persone per il conflitto.
- Il menu **☰** contiene **Salva**, **Carica**, **Nuovo mondo**, pausa, interruttore dei suoni e **Velocità 1×/2×/4×**. La velocità accelera insieme giorni, persone e lavori e resta nel salvataggio.

Per vedere il report delle prestazioni aggiungi `?perf=1` all’indirizzo del gioco e usa **Copia report FPS**.

## Stato e verifiche

Questa build comprende risorse e merci fisiche, raccolta, agricoltura, allevamento, botteghe, mercati, carovane, villaggi autonomi, influenza, alleanze, razzie, assedi, resa, quattro fasi civili e salvataggi. Un salvataggio prodotto con la BUILD 54 è stato caricato e risalvato senza perdere persone, abilità, merci o compiti.

Se una razzia parte a 2× o 4×, la partita torna a 1× con un avviso e continua senza pausa. Il pannello Confederazione suggerisce il **Prossimo passo** in base a casa, mercato, persone, botteghe e relazioni reali: il pulsante apre la scheda o mostra il cantiere giusto. Avvisa anche delle razzie, porta con un tocco alla minaccia e raduna fino a tre abitanti reali a difesa della casa comune. Dopo lo scontro li congeda con un tocco; i residenti tornano alla loro casa.

Ultima suite completa: BUILD 182 **508/508** (Claude, 23/10/2026). Tre partite automatiche sulla mappa 256×256 con salvataggio a metà: vittoria al giorno 305, sconfitta al 464, sandbox viva al 449. Le partite automatiche coprono vittoria, sconfitta e sandbox con salvataggio a metà; vittoria, sconfitta e sandbox sono state verificate anche sulla mappa 256×256. Le prove browser in verticale e orizzontale non hanno mostrato errori JavaScript. La prova fisica sul Redmi Note 10 e la mappa 512×512 restano da fare. Con 300 persone sintetiche sul server il frame p95 ha superato la soglia ideale di 33 ms: il risultato non misura il telefono di Simone.

Per eseguire i test da una copia locale con Node.js:

```sh
node --test tests/*.cjs
```

La guida di progetto è in [OBIETTIVO.md](OBIETTIVO.md); i dettagli tecnici e gli esiti intermedi sono in [docs/](docs/). La versione zero è conservata separatamente nella cartella di ricerca del progetto.

### BUILD 144 · Torri presidiate

Una torre nuova difende il villaggio solo con una persona mobilitata assegnata tramite **Ordini → Presidia torre**. La sentinella conserva nome, abilità ed equipaggiamento; il combattimento svolto dalla torre allena la sua skill. Le torri dei vecchi salvataggi restano operative come prima. Grafica e interfaccia **PROVVISORIO, da approvare da Simone**.

### BUILD 145 · Rifornimento delle torri

Le torri nuove consumano una pietra locale per ogni colpo. **Rifornisci con un abitante** avvia un trasporto reale e ripetibile dalla Casa comune o da un magazzino; il carico e la persona restano nel salvataggio. Le vecchie torri continuano a funzionare come prima. UI **PROVVISORIO, da approvare da Simone**.

### BUILD 146 · Assalto alle torri

I razziatori vicini reagiscono alle torri nuove che stanno davvero difendendo: possono danneggiarle o distruggerle. Le pietre rimaste cadono una sola volta; la sentinella mantiene la propria identità e lascia il presidio se la torre cade. Le torri dei vecchi salvataggi conservano il comportamento storico. UI **PROVVISORIO, da approvare da Simone**.

### BUILD 147 · Provviste rubate durante le incursioni

Un razziatore entrato nel villaggio può sottrarre fino a cinque unità di cibo realmente presenti in un magazzino comunitario. Lo vedi nella sua scheda: fermalo prima che raggiunga il campo ostile per recuperare il cibo caduto a terra. Il carico e la perdita si conservano nel salvataggio. Quantità e interfaccia **PROVVISORIO, da approvare da Simone**.

### BUILD 148 · Magazzino sotto razzia

Il razziatore deve raggiungere a piedi il magazzino prima di prendere cibo. Finché è in cammino, le scorte restano al loro posto: puoi intercettarlo. Se il magazzino non è più disponibile, l'attacco prosegue senza creare merci. Percorso, bersaglio e bottino sopravvivono al salvataggio. Regola e UI **PROVVISORIO, da approvare da Simone**.

### BUILD 149 · Scorte dei campi ostili

Il cibo rubato resta nel campo in cui il razziatore riesce a tornare. Se conquisti quel campo, le provviste cadono a terra e puoi raccoglierle. Se il campo cade durante la fuga, il razziatore lascia subito il carico lungo la strada. Scorte e recupero sopravvivono al salvataggio. Regola e UI **PROVVISORIO, da approvare da Simone**.

### BUILD 150 · Magazzini esposti

Un magazzino con cibo costruito lontano dal centro può attirare un razziatore che gli passa vicino. Il razziatore deve raggiungerlo prima di sottrarre fino a cinque unità e può essere intercettato. I depositi del nucleo iniziale mantengono il percorso di razzia precedente. Regola e UI **PROVVISORIO, da approvare da Simone**.

### BUILD 151 · Difendi un magazzino lontano

Quando un razziatore punta un magazzino remoto, il pannello Confederazione mostra **Difendi magazzino** accanto alla difesa della Casa comune. Il comando manda fino a tre abitanti liberi e raggiungibili vicino al deposito; non interrompe i lavoratori e non sposta chi è troppo lontano. Dopo lo scontro puoi congedare i richiamati come prima. UI e raggio di chiamata **PROVVISORIO, da approvare da Simone**.

### BUILD 152 · Mostra il magazzino minacciato

Quando un razziatore punta un deposito remoto, **Mostra magazzino** centra l’edificio e apre la sua scheda con le scorte effettive. Il comando è disponibile anche dopo aver caricato la partita; sparisce quando il pericolo finisce. Puoi quindi decidere se inviare i difensori o dare ordini individuali. UI **PROVVISORIO, da approvare da Simone**.

### BUILD 153 · Più magazzini sotto razzia

Se due o più depositi remoti sono minacciati, **Mostra magazzino** passa dall’uno all’altro. Il pannello indica quanti sono e quale deposito riceverà **Difendi magazzino** (per esempio 2/2). Più razziatori contro lo stesso deposito vengono contati una volta. Sono sempre abitanti reali a muoversi, e puoi continuare a difendere la Casa comune separatamente. Priorità e UI **PROVVISORIO, da approvare da Simone**.

### BUILD 154 · Sentinella al magazzino

Mobilita una persona, scegli **Ordini → Presidia magazzino** e tocca un tuo deposito completato. La stessa persona lo raggiunge, affronta razziatori o lupi vicini, guadagna esperienza di Combattimento e torna al posto dopo lo scontro. Un magazzino accoglie una sentinella; il servizio, il nome e le abilità restano nel salvataggio. **Libera**, un altro ordine o la distruzione del deposito interrompono il presidio. Raggi, numero e UI **PROVVISORIO, da approvare da Simone**.


### BUILD 155 · Priorità della sentinella

La sentinella di un magazzino affronta per primo il razziatore che ha preso di mira quel deposito, anche se un altro nemico è più vicino. Quando il bersaglio cade, può affrontare le altre minacce nel raggio. La sentinella della Casa comune conserva la priorità precedente per distanza. La scelta è **PROVVISORIA, da approvare da Simone**.


### BUILD 156 · Intercettare una razzia durante uno scontro

Se una sentinella del magazzino sta già affrontando un altro nemico, controlla il deposito ogni 0,75 secondi. Quando un razziatore prende di mira proprio quel magazzino entro il raggio di difesa, la sentinella cambia bersaglio senza perdere l'incarico. Dopo lo scontro può tornare alle altre minacce. La scelta è **PROVVISORIA, da approvare da Simone**.


### BUILD 157 · Inseguire il ladro del magazzino

Se un razziatore riesce a prendere cibo, il suo carico conserva il magazzino da cui proviene. La sentinella di quel deposito continua a dargli priorità mentre fugge nel raggio di guardia, anche se un altro nemico è più vicino. Il cibo resta recuperabile se il razziatore cade; l'origine del carico resta nel salvataggio e viene cancellata quando il bottino è consegnato o disperso. La scelta è **PROVVISORIA, da approvare da Simone**.


### BUILD 158 · Seguire il ladro col cibo

Durante una partita Confederazione, il pannello degli obiettivi mostra quanto cibo stanno trasportando i razziatori ancora vivi. **Segui ladro col cibo** centra e seleziona il ladro reale sulla mappa; se sono più d’uno, il pulsante li scorre. Il comando resta utile dopo aver caricato la partita e sparisce quando non c’è più bottino in fuga. La UI è **PROVVISORIA, da approvare da Simone**.


### BUILD 159 · Intercettare il ladro col cibo

Dal pannello Confederazione, **Intercetta con un mobilitato** ordina a una persona reale già mobilitata, libera e raggiungibile entro 12 caselle di inseguire il ladro selezionato. Non interrompe lavoratori o presidi e non mobilita nessuno di nascosto. Il percorso viene aggiornato a intervalli mentre il ladro si muove; equipaggiamento, salute, morale, abilità e ordine restano nel salvataggio. Se il difensore sta già affrontando quel ladro, il comando lo segnala senza duplicare l’ordine. La UI e il raggio sono **PROVVISORI, da approvare da Simone**.

### BUILD 160 · Limite dell’inseguimento del ladro

L’ordine **Intercetta con un mobilitato** si ferma se il ladro o il difensore supera 18 caselle dal punto iniziale. Il difensore resta mobilitato sul posto e può ricevere un nuovo ordine; il gioco non cerca altri percorsi dopo il limite. I salvataggi della BUILD 159 riprendono l’inseguimento e ne fissano il punto iniziale al primo aggiornamento. Raggio e UI **PROVVISORI, da approvare da Simone**.

### BUILD 161 · Ritrova e raccogli il cibo rubato

Quando un ladro cade o un campo ostile con scorte viene distrutto, il cibo recuperabile resta una risorsa reale sul terreno. Nel pannello Confederazione, **Mostra cibo recuperato** centra i mucchi uno alla volta; **Raccogli con abitante** assegna il mucchio mostrato a una persona libera e vicina. Gli abitanti già occupati restano ai propri compiti. Posizione, quantità e incarico sopravvivono al salvataggio; la segnalazione sparisce dopo la raccolta. UI **PROVVISORIA, da approvare da Simone**.

### BUILD 162 · La persona scelta esegue l’ordine

Per scegliere chi agirà, mostra prima il ladro o il cibo, poi seleziona una persona e apri il pannello Confederazione. Se la persona è idonea, **Intercetta con un mobilitato** e **Raccogli con abitante** usano lei anche quando un’altra è più vicina. Se la persona scelta è occupata, troppo lontana o inadatta, il gioco continua a scegliere un’alternativa libera e raggiungibile. Gli ordini già in corso non vengono interrotti. UI **PROVVISORIA, da approvare da Simone**.

### BUILD 163 · Mostra il bersaglio senza perdere la persona scelta

Puoi selezionare una persona prima di **Segui ladro col cibo** o **Mostra cibo recuperato**: quando il comando centra il bersaglio, ricorda temporaneamente quella persona per **Intercetta** o **Raccogli**. Se non è più idonea, sceglie una persona libera come prima. La scelta non entra nel salvataggio e si cancella dopo l’ordine. Il pannello Confederazione ora resta scorrevole e toccabile davanti alla scheda dell’abitante anche con il telefono in orizzontale. UI **PROVVISORIA, da approvare da Simone**.

### BUILD 164 · Difendi il magazzino con la persona scelta

Seleziona un abitante prima di **Mostra magazzino**, poi usa **Difendi magazzino**: se la persona è libera, sana, abbastanza vicina e può arrivare al deposito, sarà inclusa nei tre difensori richiamati. Se nel frattempo non è idonea, il gioco raduna altri abitanti senza interrompere i suoi lavori. La scelta è temporanea e non modifica i salvataggi. UI **PROVVISORIA, da approvare da Simone**.

### BUILD 165 · Scegli chi radunare alla Casa comune

Durante una razzia, seleziona una persona e tocca **Raduna difensori** nel pannello Confederazione: se è libera, sana, vicina e può arrivare, entra nel gruppo di massimo tre richiamati. Il gioco non interrompe chi lavora e usa gli altri candidati quando la persona scelta non è idonea. UI **PROVVISORIA, da approvare da Simone**.

### BUILD 166 · Vedere tutti i razziatori

Durante una razzia, **Mostra razziatore** centra prima quello più vicino al villaggio. Toccalo ancora per vedere gli altri assalitori vivi, uno alla volta; dopo l’ultimo riparte dal primo. Quando un razziatore cade, scompare dal giro. La scelta è temporanea e dopo un caricamento riparte dal più vicino. UI **PROVVISORIA, da approvare da Simone**.

### BUILD 167 · Difensore scelto anche dopo Mostra razziatore

Durante una razzia seleziona una persona, poi usa **Mostra razziatore** per centrare o scorrere i nemici: **Raduna difensori** ricorda la persona scelta e la include se è ancora idonea. Se è occupata o non può arrivare, chiama altri abitanti senza toglierle il lavoro. La scelta è temporanea e non entra nel salvataggio. UI **PROVVISORIA, da approvare da Simone**.

### BUILD 168 · Giro stabile dei razziatori in movimento

**Mostra razziatore** ricorda quali assalitori vivi sono già stati mostrati in questo giro. Anche se si scambiano posizione mentre camminano, li mostra tutti una volta prima di ricominciare dal più vicino. Un caduto esce dal giro; la memoria della vista non modifica il salvataggio. UI **PROVVISORIA, da approvare da Simone**.

### BUILD 169 · Sconfitta quando cade la Casa comune

In Confederazione la Casa comune iniziale è essenziale: se viene distrutta, la partita termina anche se restano un magazzino o un villaggio integrato. Il messaggio di sconfitta indica la causa e copre l’intero schermo anche in orizzontale. La sandbox conserva la possibilità di continuare da un deposito rimasto operativo. Regola **PROVVISORIA, da approvare da Simone**.

### BUILD 170 · Motivo della sconfitta dopo il caricamento

Una Confederazione conclusa mantiene nel salvataggio lo stato del mondo. Quando la ricarichi, il gioco ricava di nuovo da quello stato la causa della sconfitta: perdita della Casa comune iniziale, di tutti gli abitanti o scadenza del tempo. La schermata finale continua quindi a dare il motivo preciso anche dopo aver chiuso e riaperto il gioco, senza cambiare il formato dei vecchi salvataggi. UI **PROVVISORIA, da approvare da Simone**.

### BUILD 171 · Pietra leggibile nella scelta del luogo

La schermata iniziale conta la pietra entro 20 caselle da ciascun luogo e indica chiaramente questa distanza. Sulla mappa opzionale 512×512 la vecchia vista immediata mostrava zero pietra in tutti e tre i luoghi, benché quello a sud avesse fonti utili poco più lontane. Ora puoi distinguere i luoghi prima di scegliere. La prova automatica della mappa 512 usa il luogo con più pietra e percorre vittoria, sconfitta e sandbox con save/load. UI **PROVVISORIA, da approvare da Simone**.

### BUILD 172 · Recupero dello schermo verde sul telefono

La prima installazione del service worker non ricarica più la pagina nel mezzo della scelta iniziale. La scelta e il tutorial non possono sovrascrivere un salvataggio precedente; se un vecchio salvataggio è stato scritto durante quella scelta, il file rimane disponibile ma la scelta si riapre. Il worker non conserva risposte HTTP temporaneamente errate. Durante la preparazione della mappa compare un messaggio di caricamento; se uno script non arriva o il disegno si interrompe, il gioco mostra un messaggio con il nome del file o l’errore e il pulsante **Riprova**. Se il telefono rifiuta i canvas ausiliari, la mappa torna al disegno diretto. La causa esatta vista sul Redmi fisico non è verificabile da questo server; questa versione rende il guasto visibile e affronta le cause trovate. UI **PROVVISORIA, da approvare da Simone**.

### BUILD 173 · Nuova grafica preromana per il gioco

Dopo il via libera di Simone sul [campione](docs/campione-grafica/README.md), il gioco usa [79 asset P16 nuovi](docs/grafica-completa/README.md): edifici e casette del villaggio, mestieri, animali, risorse e piccole icone dell’interfaccia. Il magazzino ora ha un PNG valido; gli abitanti liberi possono avere tuniche diverse. Terreno, campi e palizzate mantengono il disegno dinamico necessario al gioco, con colori accordati al nuovo set. Nessun cambio ai salvataggi. La grafica è **PROVVISORIA, da approvare da Simone** dopo la partita sul Redmi Note 10. Verifiche: 471/471 test, 79/79 PNG decodificati, prima visita e scene mobili senza errori JavaScript.

### BUILD 174 · Avvisi leggibili sul telefono

Sul telefono l’avviso breve degli ordini appare in basso nella mappa, sopra il pannello dei comandi. Non copre più il riepilogo Confederazione in alto. Il testo e la barra restano selezionabili perché l’avviso non intercetta i tocchi. UI **PROVVISORIA, da approvare da Simone**.

### BUILD 175 · MOD con mouse e tastiera

Su PC tieni premuto **Shift** e clicca o trascina con il sinistro, oppure usa direttamente **il tasto destro**, per selezionare abitanti e disegnare il riquadro. Clic destro durante una costruzione annulla il posizionamento. Il tasto sinistro da solo continua a dare ordini o spostare la mappa. Il menu del browser rimane disponibile fuori da mappa e minimappa. I tocchi sul telefono restano invariati.

### BUILD 176 · Annullamento costruzione chiaro

Quando annulli un progetto con il tasto destro su PC o con MOD sul telefono, compare «Costruzione annullata.» al posto della vecchia istruzione di piazzamento. Il progetto fantasma di una palizzata conserva il suo messaggio specifico.

### BUILD 177 · Bersaglio dei razziatori più leggero

Ogni razziatore cerca la persona viva più vicina nel mondo con una sola scansione, mantenendo lo stesso ordine in caso di pari distanza. Non riordina più tutte le persone a ogni aggiornamento. Nessuna regola di combattimento cambia. Nella prova isolata nel browser Redmi simulato con 300 abitanti e 12 razziatori, 2.400 scelte passano da circa 2,0 s a 0,11–0,15 s; questo misura la scelta del bersaglio, non gli FPS del gioco sul telefono fisico. Test di inseguimento e difesa superati; suite completa **473/473**, zero fallimenti.

### BUILD 178 · UI/UX Lotto A · interazione

Un tocco su un tuo abitante o edificio lo seleziona; un tocco altrove dà l’ordine al gruppo selezionato. MOD (Shift o destro su PC) aggiunge o toglie persone dalla selezione e permette il riquadro. Sul telefono MOD non annulla più per errore un cantiere; su PC il destro continua ad annullarlo. Pausa, velocità e persone libere sono nella barra; la pausa non copre la mappa. Ordini e costruzioni mostrano solo le azioni pertinenti e spiegano i requisiti mancanti. La sentinella stabile si può assegnare e togliere all’intero gruppo arruolato. Testi e UI **PROVVISORI, da approvare da Simone**.

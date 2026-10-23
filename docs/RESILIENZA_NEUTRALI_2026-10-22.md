# Resilienza dei villaggi neutrali su 1.200 giorni

La prova usa dodici mondi deterministici (seed 1, 2, 3, 4, 5, 8, 15, 22, 34, 49, 55 e 123456), 1.200 giorni ciascuno. Razziatori e fauna sono esclusi e le persone iniziali del giocatore ricevono razioni di prova, così la partita non termina mentre si osservano i neutrali. Nessun bene viene aggiunto ai neutrali dalla prova. Script e dati: `Rtsmobile-ricerca/resilienza-neutrali-1200g/`.

## Cause corrette

- Il posto di un raccoglitore poteva cadere oltre il raggio reale della risorsa, soprattutto con coordinate frazionarie. Ora il posto è nel raggio e non è già occupato da un’altra persona. Un posto impossibile annulla l’ordine invece di riprovare a ogni aggiornamento. Nel seed 55 il raccoglitore sceglieva la casella del mugnaio: senza consegne, il villaggio perdeva tutti gli abitanti tra i giorni 300 e 600. Ora al giorno 1200 ne ha sei sani.
- Il terzo abitante iniziale del seed 8 poteva comparire in una tasca di terreno separata dal magazzino. Solo al primo avvio viene collocato davanti a un ingresso libero dello stesso magazzino, conservando identità e carico.
- La ricerca di legno o pietra irraggiungibili ripeteva fino a 24 percorsi completi ogni giorno. Una sola esplorazione locale trova il primo deposito accessibile e si ferma; se non lo trova, riprova dopo 30 giorni.
- La ricerca standard poteva esaurire il proprio limite pur su una strada reale. Una ricerca a caselle fornisce ai neutrali il percorso fisico verso il proprio magazzino e, nei mondi di taglia ordinaria, fra i mercati. La carovana conserva il percorso di andata e quello di ritorno nel salvataggio, invece di ricalcolarli a ogni tappa. Nel seed 15 la consegna del cibo nei giorni 34, 67 e 100 è passata da circa 0,6–5 secondi a 10–15 ms nel profilo locale sotto carico; nel seed 8 il ritorno della carovana al giorno 507 è sceso da circa 0,4 secondi a pochi millisecondi. Questi tempi non sono misure del Redmi Note 10.
- Il pane già esistente in un magazzino o in un forno collegato non era considerato dalle razioni e dalla crescita neutrale. Il consumo sottrae il bene dall’inventario reale; per il pane riservato nel forno riduce anche la quota di restituzione. Un collegamento chiuso resta escluso. Il giocatore conserva le sue regole.

## Risultato

Al giorno 1200 i 24 villaggi dei 12 mondi hanno almeno cinque persone ciascuno, salute minima 100 e zero affamati; nessuna partita di prova termina. Si contano 55 partenze commerciali, non necessariamente 55 baratti conclusi. Quattordici villaggi hanno un fornaio attivo; gli altri vivono di raccolta e cereali. L’assenza di forno in ogni singolo villaggio non è stata diagnosticata; nel seed 55 manca legno nel magazzino al giorno 320.

Il seed 123456 è stato inoltre salvato al giorno 810 con mercati quasi saturi, ricaricato e portato al giorno 1200: ID delle persone conservati, inventari coerenti e sei persone sane in entrambi i villaggi agricoli. `load()` mette normalmente il gioco in pausa, quindi la prova riprende esplicitamente la simulazione.

La scansione non misura razzie, fauna, decisioni del giocatore o prestazioni del telefono fisico. Il Redmi Note 10 resta da provare. Le carovane su mappe oltre 128 caselle per lato usano ancora il percorso standard: il percorso a caselle di questa correzione è limitato ai mondi ordinari per non esplorare mappe enormi in un singolo aggiornamento.

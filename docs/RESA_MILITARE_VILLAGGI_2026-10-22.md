# Resa militare dei villaggi

Il Clan del Guado e la Lega delle Colline possono cedere dopo un assalto dichiarato. Il villaggio schiera fino a due difensori reali. Quando entrambi sono morti o si sono ritirati sotto 30 salute, l'assedio resta aperto per 30 giorni di gioco. Un abitante mobilitato del giocatore deve essere vivo e a non più di 2,5 caselle dalla casa comune. Selezionando la casa comune compare «Chiedi resa militare». La richiesta è esplicita e non usa le condizioni dell'adesione pacifica. Le Genti Neutrali permanenti restano escluse.

La resa trasferisce tutti gli edifici, le persone e gli animali della fazione senza creare copie. ID, skill, XP, inventari, scorte e case restano gli stessi. Il totem conserva origine e registro politico con modalità `military`; gli assalitori smettono di attaccarlo. L'azione è idempotente per ID e può essere salvata sia durante l'avvicinamento sia dopo lo scontro. Un difensore ferito che si ritira può riprendere il lavoro precedente; al momento del trasferimento eventuali compiti di combattimento ancora attivi vengono fermati.

Le soglie 30 salute, 30 giorni e 2,5 caselle sono provvisorie e da bilanciare. Manca ancora un periodo di occupazione con morale, difesa successiva e possibilità di rivolta; manca una mappa di confini politici. La vittoria generale resta legata ai campi ostili, quindi la resa non termina la partita. Test in `tests/military-surrender.cjs`.

Prova browser mobile simulato 393×873: pulsante apparso, clic riuscito, proprietario passato a 0, modalità `military`, nessun errore JavaScript. Screenshot e script in `Rtsmobile-ricerca/prove-resa-militare/`; server locale spento al termine.

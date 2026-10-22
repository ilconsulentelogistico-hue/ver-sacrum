# Audit del codice degli scambi (22/10/2026)

Fonti lette direttamente:

- 7kaa [`src/OF_MARK.cpp`](https://github.com/the3dfxdude/7kaa/blob/master/src/OF_MARK.cpp), `FirmMarket::input_goods` (righe 594–741): merci trasferite da miniera/fabbrica a mercato soltanto attraverso collegamenti attivi, con limite di scorta. `sell_goods` (777–804) consuma scorte fino alla domanda mensile. Qui l'unità di scambio è anche monetaria; Ver Sacrum conserva invece il baratto deciso da Simone.
- Port amatoriale [Caravaneer 2 revival `web/src/game/World.ts`](https://github.com/BInBilibili/caravaneer2-revival/blob/main/web/src/game/World.ts), `GameData.addKnownPrice` (~3173): prezzi noti per merce e città, con tempo dell'ultima osservazione. `npcTradeAtTown` (~3673): trasferimento di carico e scorte reali tra carovana e città; rifornimento calcolato all'arrivo. È una ricostruzione del secondo gioco, non codice originale del primo Caravaneer. La sua valuta non è un requisito per Ver Sacrum.

Confronto col progetto:

- `market.js`: `marketPrice` dipende da scorta e domanda; `barterQuote` controlla due mercati di comunità diverse, carico, capacità e disponibilità; `tradeAtMarket` sposta fisicamente le merci e attribuisce esperienza. `money` è sempre zero. Le scorte sono quindi già reali.
- `neutral.js`: la domanda dei mercati neutrali deriva ogni giorno dalla scorta locale, inclusi i magazzini collegati. Le carovane neutrali portano merci reali fra comunità.
- Il pannello commercio mostra soltanto quantità e disponibilità. Non espone il valore relativo delle offerte né una memoria dei mercati osservati. `tradeLedger` sopravvive per compatibilità con i salvataggi antichi, ma non viene alimentato dal baratto corrente; non va presentato come registro attuale.

Prossimo incremento piccolo: mostrare nel pannello il valore indicativo delle due parti del baratto, calcolato con la stessa `marketPrice` usata dalla verifica, e il rapporto tra prezzo locale della merce offerta e richiesta. Nessuna valuta, merce virtuale o modifica alle formule. Verificare che il testo si aggiorni con scorte e quantità, e resti solo indicativo perché la verifica finale avviene all'arrivo.

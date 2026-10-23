# Memoria dei mercati visitati

Quando una carovana del giocatore raggiunge il mercato e conclude un baratto, il gioco annota per le due merci trattate il valore locale, la scorta prima dello scambio e il giorno. Il pannello Commercio mostra l'ultima osservazione per le merci selezionate; una merce non trattata risulta «mai osservato». Una visita fallita o un mercante lontano non aggiorna la memoria. I dati storici sono marcati come potenzialmente superati: l'accordo continua a usare prezzi e scorte correnti al momento dell'arrivo.

La memoria vive in `observedPrices` del mercato, con al massimo una voce per tipo di merce. Entra nel salvataggio esistente v5 come campo facoltativo, così le partite precedenti restano valide. `persistence.js` valida tipo, giorno, prezzo e quantità; non è una valuta né una scorta aggiuntiva. `tests/market-observations.cjs` verifica provenienza, mancata rivelazione, rifiuti, UI e reload. La schermata usa `market.js?v=83`, `persistence.js?v=150`, cache offline 195.

Limite conosciuto: il pannello di pianificazione mostra ancora le scorte correnti dei mercati accessibili. La memoria è un registro delle visite, non un sistema completo di informazioni nascoste. Il prossimo passo richiede una decisione di design su quanto il giocatore possa sapere prima di esplorare, ma la simulazione può proseguire intanto su risorse e blocchi.

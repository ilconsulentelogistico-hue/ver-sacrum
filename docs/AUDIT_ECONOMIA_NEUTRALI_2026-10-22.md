# Audit delle economie neutrali

Fonte viva: `neutral.js` e `market.js`, 22/10/2026. Ogni fazione possiede tre persone, un magazzino e un mercato, con ID e scorte separati. La carovana del giocatore scambia merci presenti fisicamente nel mercato e verifica quantità e capacità. Salvataggio e ricaricamento conservano gli inventari.

Due problemi ancora aperti:

1. `neutralEconomyDay()` aggiunge ogni dieci giorni fino a tre unità della merce tipica e tre di cibo direttamente al magazzino, senza raccolta, lavoratore impegnato, input o viaggio. È una fonte gratuita e contraddice la regola delle merci fisiche. Va sostituita gradualmente con lavoro di persone reali su risorse finite; la rimozione secca senza alternativa può far morire i villaggi.
2. La domanda del mercato usa soltanto `market.inventory.items[good]`. Ignora le scorte del magazzino collegato: può quindi indicare scarsità mentre il villaggio possiede molte unità della stessa merce. La prima correzione sicura è calcolare la domanda sulle merci accessibili del mercato e dei magazzini collegati, rispettando i collegamenti aperti.

L'audit non cambia il gioco. Prossima tappa: correggere il segnale di domanda con test di scorte separate, poi costruire la produzione fisica neutrale in una tappa successiva. Le regole di prezzo restano provvisorie e non introducono moneta.

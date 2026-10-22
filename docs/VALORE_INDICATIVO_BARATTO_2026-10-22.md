# Valore indicativo del baratto

Il pannello Commercio mostra il valore relativo dell'offerta e della richiesta e il loro rapporto. Usa gli stessi `marketPrice` della verifica del baratto e lo stesso fattore della skill Commercio: quanto riportato è una stima nella comunità di destinazione, non denaro. Scorte e accordo vengono ricontrollati all'arrivo; il testo non blocca né completa da solo una transazione.

Il test `tests/trade-value-preview.cjs` confronta la stima con le funzioni di prezzo e skill, controlla che cambi al variare delle scorte e non mostri un numero per quantità non valide. Il foglio `market.js` passa da `?v=81` a `?v=82` in `index.html`.

Prossima tappa: memoria locale delle ultime condizioni di scambio effettivamente osservate da una carovana, evitando di rivelare automaticamente mercati non visitati. Occorre conservare solo dati di esplorazione, senza creare merci o valuta.

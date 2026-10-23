# Filiera lunga del Torchio su mappa 512

Due prove riproducibili con seed 123456: 40 uva→vino e 40 olive→olio. Un solo abitante porta tutti i carichi lungo campo→magazzino→mercato→Torchio e poi verso magazzino comunitario o mercato; un altro lavora al Torchio. Gli altri abitanti non vengono impiegati. Al frame 159 il salvataggio e la ricarica avvengono mentre un lotto è in corso **e** una merce è nel carico. Ogni 25 frame il test somma frutti nei quattro edifici, nel carico e nel lotto, più due volte i prodotti: il totale resta 40 per tutti i 3.200 aggiornamenti da 0,05 s.

Esito finale in entrambi i casi: frutti residui 0, prodotto 10 nel magazzino e 10 al mercato, carico 0, `returnDue=0`, nessun lotto pendente. La distribuzione 10+10 deriva dalla quota comunitaria del 50% impostata nella prova. Queste sono quantità virtuali verificate, non una ricostruzione storica delle rese. Tempo della prova isolata su EC2 circa 6,3 s per i due casi; non rappresenta gli FPS sul Redmi Note 10.

Test `tests/press-long-chain-512.cjs`: 2/2. Gruppo economico mirato: 55/55, zero errori. Nessuna modifica al motore in questa tappa.

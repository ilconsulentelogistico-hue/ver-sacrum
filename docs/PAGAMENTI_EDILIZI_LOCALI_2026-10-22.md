# Materiali edilizi locali

Ogni cantiere, strada e palizzata individua la casa comune del giocatore più vicina. La verifica e il pagamento usano solo i magazzini operativi collegati a quella casa comune. L'anteprima usa lo stesso criterio. Doni diplomatici senza un punto sulla mappa continuano a usare la casa comune iniziale. Il numero totale delle merci nell'interfaccia resta un riepilogo globale; non è una promessa di materiali disponibili per ogni cantiere.

Una palizzata con nuovi segmenti in due zone di finanziamento viene respinta prima di prelevare legno; il giocatore può costruirla in due tratti. Le sezioni riutilizzate come raccordo non hanno un nuovo costo. La verifica e il prelievo sono atomici per il singolo villaggio: se manca una merce locale, nessun deposito viene modificato.

La prova mirata integra il Guado a 41 caselle dalla casa iniziale: con zero legno iniziale e 20 al Guado, una spesa iniziale di 5 fallisce senza toccare il Guado; una spesa locale al Guado porta la scorta a 15. Una palizzata tra le due zone fallisce e lascia intatte entrambe le scorte. Non è ancora simulato un trasporto automatico di materiali fra villaggi: per usarli altrove serve portare fisicamente le merci in un deposito collegato al cantiere.

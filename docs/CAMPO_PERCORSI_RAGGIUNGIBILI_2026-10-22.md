# Contadini: passi raggiungibili nel campo

La prova sulla mappa 256 (seed 123456) mostrava 11 aggiornamenti oltre 200 ms nei primi 300 giorni: il contadino tentava una casella coltivabile ma isolata, e il percorso globale cercava fino a 5.000 caselle ogni volta. Se falliva, il timer restava scaduto e ripeteva il tentativo nel giorno successivo.

`farmWander()` ora percorre una volta la piccola zona del campo più otto caselle di margine, rispettando terreni, dislivelli ed edifici. Sorteggia solo destinazioni raggiungibili; ricostruisce il breve percorso dalla visita locale e riavvia sempre il timer, anche se non c'è posto. Il resto del movimento e del lavoro agricolo resta invariato. Un test crea una casella coltivabile isolata e impedisce l'uso del cercapercorsi globale.

Nel profilo di 450 giorni sulla stessa mappa, gli aggiornamenti oltre 200 ms prima del giorno 300 sono scesi da 11 a zero. Rimangono tre picchi oltre 200 ms nei giorni 330, 336 e 390, attribuiti alla ricerca delle carovane fra villaggi lontani; i valori assoluti variano con il carico del server. Il Redmi Note 10 non è stato ancora misurato fisicamente.

La prima implementazione consumava un numero casuale aggiuntivo per il timer dopo ogni passo: due test delle carovane hanno esposto il conseguente cambiamento nella sequenza simulata. Il timer dopo una partenza usa ora tre secondi fissi; il sorteggio della destinazione mantiene la sequenza precedente. I due test commerciali mirati passano di nuovo.

Verifica finale: suite completa 293/293, nessun errore.

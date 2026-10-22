# Coda dei percorsi

`Game.findPath` usa una coda minima stabile. Prima ordinava tutta la lista aperta a ogni espansione; ora inserimento ed estrazione costano al massimo un numero di confronti proporzionale al logaritmo dei candidati. Il criterio di priorità è lo stesso (`f`), e a parità di valore esce prima il candidato inserito prima. Restano invariati biomi, passi, costo delle strade, limite di 5.000 espansioni e formato del percorso.

Tre percorsi del seed 123456 sono fissati da un test che confronta tragitto completo e numero di espansioni con la versione precedente. Questo intervento elimina un collo di bottiglia della ricerca locale, ma non introduce ancora la ricerca gerarchica per viaggi su mappe molto grandi. La mappa rimane 88×88.

# Carovane e strade interrotte

Una nuova palizzata sulla strada, costruita dopo la partenza, rendeva vuoto il percorso della carovana. Su mappe grandi la ricerca ordinaria provava più percorsi globali nello stesso aggiornamento: nel seed 123456 il picco era 500 ms sulla mappa 256 e 2.254 ms sulla 512. Su 512 il mercante rinunciava al baratto dopo tre tentativi.

Quando la rotta in corso si interrompe, `updateCaravan()` usa ora la ricerca incrementale dal punto attuale al mercato: massimo 48 caselle esaminate per aggiornamento. Se non c'è strada dopo la ricerca completa, valgono ancora i tentativi e il rientro con la merce. La stessa persona continua il viaggio se trova una deviazione.

Nella prova con palizzata su una rotta già iniziata, il Guado baratta e il mercante torna in entrambi i mondi. Il peggiore aggiornamento è 72,7 ms sulla mappa 256 e 89 ms sulla 512; zero oltre 200 ms. Senza l'ostacolo, con l'economia intera attiva, il primo viaggio termina ai giorni 936 e 1444: i villaggi hanno sei persone, il mercante salute 100, la borsa vuota. Test ripetibile `tests/neutral-route-disruption.cjs`; tracce in `Rtsmobile-ricerca/audit-carovane-lunghe/`. Le misure sono sul server condiviso e vanno ripetute sul Redmi Note 10.

Verifica finale: suite completa 300/300, nessun errore.

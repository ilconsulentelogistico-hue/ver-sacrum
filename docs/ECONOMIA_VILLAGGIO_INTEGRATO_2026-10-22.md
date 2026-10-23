# Razioni locali dopo l'adesione

Una persona del villaggio integrato conserva il proprio domicilio e può prendere una razione dal mercato vicino e dai suoi magazzini o forni collegati. Chi ha una provenienza integrata ma nessun domicilio usa i magazzini collegati alla casa comune di quel villaggio. La stessa rete locale conta nel cibo disponibile per la crescita della casa. Questo evita che una persona del Guado consumi cibo dal magazzino iniziale del giocatore, lontano sulla mappa, quando ha cibo nel proprio villaggio.

Il test `tests/integrated-village-economy.cjs` verifica adesione, razione da un magazzino locale, magazzino iniziale invariato e salvataggio. Resta un limite distinto: la spesa dei materiali edilizi del giocatore (`communalStock`, `canPay`, `pay`) somma oggi tutti i magazzini di proprietà, anche distanti. Serve un passaggio successivo per associare ogni cantiere a una casa comune e a scorte raggiungibili, senza rompere i vecchi salvataggi.

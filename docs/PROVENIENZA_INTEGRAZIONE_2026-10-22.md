# Provenienza persistente dei beni integrati

Quando un villaggio 1 o 2 aderisce o si arrende, ciascun edificio e animale trasferito riceve `integrationOriginOwner` prima del passaggio a `owner=0`. Così il magazzino neutrale, privo di `settlementId`, resta riconoscibile anche dopo save/load; un magazzino costruito dal giocatore accanto al villaggio non riceve il marcatore. Gli abitanti conservano `neutralSettlementId`, ID e competenze come prima.

Nei salvataggi vecchi, `ensureOccupation` può ricostruire il marcatore solo sugli edifici del villaggio che hanno già `settlementId`. Un magazzino non marcato resta del giocatore: la sua origine non è dimostrabile senza rischiare di sottrarre beni nuovi. Gli animali non marcati seguono la stessa regola conservativa. La validazione del save accetta solo origini 1/2 e owner corrente 0 oppure la stessa origine, così la proprietà potrà tornare al villaggio durante una futura rivolta.

Questa tappa registra la provenienza; non avvia ancora la rivolta. Test in `tests/integration-provenance.cjs`.

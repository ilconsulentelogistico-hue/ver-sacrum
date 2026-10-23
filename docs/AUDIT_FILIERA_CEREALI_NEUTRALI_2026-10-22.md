# Audit della filiera dei cereali neutrali

Il codice vivo contiene già due ricette nel mulino (2 grani → 2 farine; 2 orzi → 3 farine d'orzo) e due nel forno (2 farine → 2 pani; 2 farine d'orzo → 3 pani d'orzo). `settlementTick()` sposta gli input dal mercato alla bottega, porta i prodotti al mercato e recluta un residente soltanto se la struttura è collegata e ha una razione. `updateBuilding()` richiede lavoratore fisicamente presente e nutrito; nessun lotto può concludersi senza input.

I due villaggi ora hanno campo, magazzino e mercato collegati, ma nessun mulino né forno. Hanno tre persone iniziali: una coltiva, una raccoglie cibo, una resta residente e può fare l'artigiano. Il reclutamento automatico può quindi sostenere una bottega alla volta finché la popolazione non cresce. Aggiungere mulino e forno simultaneamente farebbe attendere il secondo senza una politica di rotazione.

Sequenza prudente: prima un mulino per ciascun villaggio, con posto libero, collegamento al mercato e test della farina fisica; poi il forno con una regola esplicita per condividere l'artigiano o con popolazione cresciuta. Il cibo per il lavoro deve arrivare dal magazzino al mercato tramite la politica già presente; non aggiungere razioni artificiali.

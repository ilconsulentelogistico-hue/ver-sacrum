# T14 — Catalogo merci e ricette (BUILD 45)

Il catalogo `TERRA_GOODS` è l’unica lista ammessa per trasporti e inventari locali. Ogni bene dichiara etichetta e ingombro; gli ingombri attuali valgono provvisoriamente una unità e restano configurabili.

Le filiere disponibili sono grano → farina → pane e orzo → farina d’orzo → pane d’orzo. Ogni ricetta usa solo input presenti nell’edificio, prenota il proprio output nel batch persistente e si ferma senza ingredienti, lavoratore o capacità. Interrompere o ricaricare conserva un solo batch e non restituisce né duplica merci.

Uva, olive, latte e foraggio sono già beni catalogati e trasportabili, ma non vengono attribuite loro trasformazioni o edifici non ancora implementati.

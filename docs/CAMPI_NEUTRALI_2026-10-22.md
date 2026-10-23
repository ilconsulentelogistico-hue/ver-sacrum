# Campi reali dei villaggi neutrali

Il Clan del Guado coltiva grano e la Lega delle Colline orzo. Ogni insediamento ha un campo iniziale costruito su terreno libero entro 12 celle dal proprio magazzino. Una persona già residente esce mantenendo ID e domicilio e riceve il lavoro al campo; l'altra persona nel mondo resta disponibile per raccogliere cibo naturale. Gli insediamenti caricati da vecchi salvataggi ottengono un campo al successivo giorno simulato, senza duplicare i campi già presenti.

Rimossa l'aggiunta periodica diretta di grano e orzo. La regola esistente del campo aumenta la crescita solo con un lavoratore fisicamente presente; il raccolto appare nell'inventario del campo e passa tramite i collegamenti già esistenti al magazzino e, se previsto, al mercato. Il test controlla assenza di prodotto senza lavoratore, raccolto con lavoratore, conservazione della somma campo+magazzino+mercato dopo due trasferimenti e identità dei lavoratori dopo reload e assenza di ricostruzione gratuita se il campo viene distrutto.

Browser mobile emulato, seed 123456: entrambi i campi visibili, collegati e con lavoratore, zero errori. Screenshot e script in `Rtsmobile-ricerca/browser-campi-neutrali/`. La posizione iniziale e il numero di campi sono valori provvisori; prova su Redmi Note 10 ancora aperta. Suite completa 271/271.

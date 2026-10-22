# Agricoltura mobile — build 80

Il campo (`farm`) è l’unica costruzione attraversabile, anche durante il cantiere. Il recinto (`pen`) e tutte le altre strutture rimangono ostacoli. Attraversare un campo non autorizza a sovrapporvi costruzioni, risorse o nuovi spawn.

| Coltura | Superficie | Lavoratori massimi | Giorni base | Resa base | Merce locale |
| --- | --- | --- | --- | --- | --- |
| Grano | 2 × 2 tile | 2 | 10 | 20 | Grano |
| Orzo | 1 × 1 tile | 2 | 10 | 20 | Orzo |
| Vite | 2 × 2 tile | 8 | 30 | 80 | Uva |
| Olivo | 3 × 3 tile | 8 | 40 | 100 | Olive |

Ogni nuovo campo costa **10 legno**. Nasce a grano: selezionare il campo e scegliere la coltura nella scheda contestuale inferiore, prima dell’avvio della crescita o tra due raccolti. La conversione non addebita un secondo impianto. Le colture più grandi estendono l’impronta verso destra e in basso; il cambio viene rifiutato se mancano terreno o spazio libero. Una conversione a cereali richiede prima di riassegnare eventuali lavoratori oltre il limite di due.

Il limite comprende anche i contadini in viaggio verso il campo. Un ordine rifiutato non cancella il precedente lavoro dell’abitante. Solo i lavoratori presenti nel campo o sul suo margine contribuiscono al ciclo; senza lavoratori la crescita si ferma. Avere più contadini non moltiplica automaticamente la resa: viene usata la loro competenza agricola media.

Fertilità, prossimità all’acqua e stagione modificano crescita e resa. La competenza agricola modifica la velocità di crescita. Tempi e rese della tabella sono basi di bilanciamento, non durate o quantità garantite. Attualmente i modificatori geografici sono letti dalla tile di origine del campo.

Il raccolto nasce nell’inventario locale del campo, con capacità 240. Non diventa cibo generico e non viene accreditato alle scorte comunitarie. Se manca spazio per l’intera resa, il raccolto maturo attende: nessuna eccedenza viene eliminata e nessuna consegna viene simulata. Dopo un raccolto riuscito riparte il ciclo.

Grano e orzo possono essere trasportati al mulino e poi al forno nelle rispettive filiere. Uva e olive sono merci distinte: le trasformazioni in vino e olio non sono ancora implementate. Per renderle disponibili altrove occorre trasportare fisicamente le merci tramite la logistica esistente.

Le quattro colture hanno disegni distinti entro la propria impronta e si selezionano su tutta la superficie. La scheda inferiore mostra guida, ingombro e numero di lavoratori. Non si apre un popup separato.

## Persistenza e verifica

Il tipo di coltura salvato determina l’impronta senza duplicare dimensioni nel salvataggio. I vecchi campi a grano e olivo acquistano rispettivamente la superficie 2 × 2 e 3 × 3; la normalizzazione esistente ricolloca le strutture in conflitto preservando identità e inventari. Gli assegnamenti oltre il nuovo limite vengono interrotti al caricamento, senza eliminare abitanti.

Test Node: `tests/agriculture-mobile.cjs`, `tests/crops-seasons.cjs`, suite collisioni, animali, costruzione ed economia. Verifiche automatiche del modello e dei controlli simulati; questa modifica non costituisce una prova visiva o su dispositivo Android/iOS.

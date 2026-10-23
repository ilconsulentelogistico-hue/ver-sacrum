# T07 — Vista Personaggio (BUILD 38)

Selezionare un abitante (anche residente), poi **Mondo → Personaggio**.
La finestra mostra nome/ID, collocazione, figura P16, slot, salute, forza,
intelligenza, energia e carico. Il selettore nominale cambia esplicitamente la
persona ispezionata: una selezione sulla mappa non reindirizza un trasferimento.
La figura usa il ritratto P16 esistente; non sono ancora presenti layer grafici
dei singoli oggetti. Gli slot descrivono l'equipaggiamento effettivo.

Il selettore oggetti elenca gli oggetti personali, nelle rastrelliere accessibili
e a terra vicino alla persona. Equipaggia/Metti in borsa/Deposita utilizzano il
trasferimento atomico T06; lo stato atteso è quello mostrato. Ogni successo salva,
gli errori di quota sono visibili. Nessun trasferimento quando la persona o la
destinazione non sono più validi. Un residente non viene fatto uscire per ispezionarlo.

La finestra mette in pausa; chiudere ripristina la pausa precedente, salvo
sospensione/background, che richiede sempre ripresa esplicita. Chiudere elimina
solo i riferimenti UI, mai i dati. Skill resta una finestra distinta da implementare
in T08; non viene spacciata per una sezione del paperdoll.

Layout: testo 16 px, controlli almeno 44 px, larghezza massima 540 px, scroll
verticale, ID a capo. `tests/browser-layout.html` offre iframe con viewport
390×740, 320×640, 740×390 e 1024×768 per verifiche CSS in browser reale.
Non è emulazione touch né prova su telefono fisico. Test automatici:
`node tests/character.cjs` (8 casi), più tutte le regressioni precedenti.

# T06 — Oggetti individuali (BUILD 37)

Ogni oggetto è un record unico in `game.gear`: ID, tipo e una sola posizione
(`equipped`, `bag`, `storage`, `ground`). Le viste interrogano questo registro,
non mantengono copie dell'inventario. `transferEquipment` riceve ID della persona,
ID oggetto, posizione attesa e destinazione: valida tutto prima di modificare
l'unica posizione. Comandi obsoleti/doppio tap non spostano un oggetto già trasferito.

Scelte **provvisorie**, non requisiti attribuiti all'utente:

- Slot mano, corpo, testa; catalogo iniziale ascia, tunica, copricapo.
- Borsa di 4 oggetti e rastrelliera di 8 in Casa comune/Magazzino/Distretto.
  Sono spazi separati dal carico di merci: non aumentano la capacità di grano,
  legno ecc. e non ne duplicano il contenuto. La tunica indossata riduce di 1 il danno dei lupi e dei razziatori (prova del 22/10).
- Ogni persona iniziale di una nuova partita possiede una tunica. Nessuna
  distribuzione gratuita al caricamento di vecchi salvataggi o ai nuovi arrivi.
- Accesso alle rastrelliere entro 2 tile dal centro o dall'interno del proprio
  Distretto; recupero a terra entro 1,5 tile. Nessun trasferimento remoto o altrui.
- Uno slot occupato va liberato esplicitamente; niente scambi impliciti.

Morte/distruzione collocano gli oggetti a terra prima di rimuovere il possessore
e prima dell'autosave. I record a terra persistono; resa grafica e comandi UI
appartengono alle fasi successive. Crafting/commercio non producono ancora equipaggiamento.

Il formato v5 aggiunge `equipmentRules: 1` e `gear`. I vecchi snapshot senza entrambi
si caricano con registro vuoto, conservando il testo originale e tutte le merci.
ID duplicati, proprietari assenti, slot incompatibili o doppi e spazi ecceduti
sono rifiutati prima di sostituire la partita. Il paperdoll T07 e la vista Skill T08
restano lavori distinti; T06 è il contratto dati, non una UI già collaudata.

Test: `node tests/equipment.cjs`, più suite precedenti. Ambiente Node VM/DOM,
non browser né hardware fisico.

## Tunica cucita dal tessuto (22/10)

Dalla scheda Personaggio, un abitante accanto a un deposito proprio con almeno 2 tessuti può cucire una tunica. I due tessuti sono sottratti dal deposito selezionato solo dopo aver controllato accesso e spazio nella borsa (4 oggetti); nasce un solo oggetto con ID unico nella borsa di quella persona. L’azione riuscita dà un punto di esperienza Tessitura e si salva come gli altri oggetti. La tunica indossata ora riduce di 1 il danno dei lupi e dei razziatori; la tunica nella borsa non protegge.

## Ascia di bronzo individuale (22/10)

Un abitante vicino a una fonderia propria e operativa può forgiare un’ascia consumando 2 bronzi e 1 legna già presenti in quell’edificio. L’azione richiede spazio nella borsa, crea un ID nuovo e dà un punto XP Metallurgia; fallimenti per distanza, proprietà, materiali o capacità non consumano nulla. Dalla scheda Personaggio si può poi equipaggiare nella mano, depositare o ritirare come gli altri oggetti. L’ascia equipaggiata nella mano riduce del 15% il tempo di lavoro per ciascuna unità di legna; in borsa non dà vantaggi. La quantità estratta resta una per azione.

## Ascia in combattimento (22/10)

Un’ascia equipaggiata nella mano aggiunge 1 punto al danno di ogni colpo della persona contro lupi, razziatori e campi ostili. Un’ascia in borsa o in deposito non modifica l’attacco. Questo bonus si somma alla forza e all’abilità Combattimento preesistenti; non cambia la protezione della tunica, la fame o gli attacchi delle torri. Valore provvisorio.

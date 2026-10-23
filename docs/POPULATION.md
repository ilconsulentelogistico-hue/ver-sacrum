# Popolazione, alloggi e consumi

Regole correnti del prototipo in `population.js` e `settlement.js`, verificate il 22/10/2026:

- Il totem non aggiunge posti. Ogni casa costruita e integra dà cinque posti. I cinque fondatori iniziali esistono già; finché non costruiscono case risultano sovraffollati, senza essere cancellati.
- Una persona viva consuma una razione ogni 30 giorni di gioco. Sono razioni `food`, `milk`, `bread` e `barleyBread`; grano e farina non si mangiano direttamente. Le quantità vengono prelevate da inventari reali, escludendo merci prenotate o dovute.
- Un residente usa le scorte della sua casa e dei mercati collegati; un artigiano usa quelle della bottega e dei mercati collegati; un esule o un lavoratore senza domicilio usa i magazzini comunitari. Una scorta lontana o scollegata non diventa automaticamente cibo locale.
- Quando le razioni scarseggiano, ricevono cibo prima le persone senza razione da più giorni, poi quelle con copertura scaduta prima. Chi è già coperto non consuma di nuovo.
- Per accogliere una nuova persona servono due residenti domiciliati e nutriti, un posto libero, un mercato collegato, una riserva sufficiente e 150 giorni favorevoli consecutivi. L'accoglienza spende 18 razioni. Un requisito mancante azzera il progresso. La persona arriva come unico record già residente: è un modello di accoglienza, non una simulazione di nascita o età.
- Dopo cinque giorni consecutivi senza razione, la salute cala di un punto al giorno. Il cibo recupera un punto al giorno del solo danno da fame. In campo e nella raccolta la fame riduce il ritmo al 70%, senza impedire di cercare cibo. Le botteghe richiedono una razione valida per lavorare.
- Una persona ferita e nutrita, residente in una casa integra, recupera 0,5 salute al giorno senza una seconda razione. Fuori casa o in un edificio distrutto non recupera ferite con il riposo.

I numeri sono parametri provvisori. Identità, salute, competenze, razioni e progressi sono persistenti. Nessun avanzamento offline. Il formato di salvataggio è v5 e le migrazioni conservano i vecchi slot senza sovrascriverli durante la lettura. Per la verifica corrente vedere `tests/population.cjs`, `tests/food-health.cjs`, `tests/ration-fairness.cjs` e `tests/home-rest-healing.cjs`; la suite completa resta il controllo di regressione. Browser reale e Redmi Note 10 fisico sono ancora da collaudare.

# Simulazione autonoma dei villaggi neutrali (280 giorni)

Fixture ripetibile: seed 123456, mappa normale, tre villaggi neutrali, `g.update(0.85)` per giorno, nessuna consegna di cibo preparata. Incursioni e animali disabilitati per isolare raccolta, campo, mulino, razioni e crescita. Script e JSON completi in `Rtsmobile-ricerca/simulazione-neutrali-200g/`.

## Difetto trovato e correzione

La razione in scadenza veniva rinnovata usando il giorno precedente. La casa controllava la crescita dopo l'incremento del giorno, trovava la razione scaduta e azzerava `birthDays`; il pasto era pagato soltanto al controllo successivo. `feedPeople(forDay)` ora può usare il giorno entrante, e il ciclo giornaliero gli passa `totalDays+1` prima di valutare le case. Il metodo chiamato direttamente conserva come valore predefinito il giorno corrente. Nessuna razione gratuita: il test controlla che due pasti scalino esattamente due unità di cibo.

## Esito

Prima della correzione: al giorno 240 tutti e tre i villaggi restavano a tre persone; i contatori di crescita tornavano periodicamente a zero. Dopo la correzione: due villaggi arrivano a quattro persone entro il giorno 200, il terzo entro il giorno 260; al giorno 280 tutti hanno quattro persone e salute minima 100. Le scorte restano fisiche: la raccolta e i campi continuano, i mulini consumano cereali e producono farina. Nessun game over nella fixture. Questo non misura incursioni, fauna o prestazioni sul Redmi Note 10.

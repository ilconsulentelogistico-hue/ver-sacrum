# Browser QA — BUILD 37–38 (17 settembre 2026)

- T01: cloud Chrome, viewport 1363×936. UI seleziona Neria; Ordini → Sposta → terreno; in pausa non avanza, dopo Riprendi spostamento visibile e calendario avanzato, infine stato libero. Salva/Carica da Mondo conserva identità e riparte in pausa. Nessun errore console originato dall'app; errori metadata dell'estensione del browser separati.
- T06: 11 test oggetti; T07: 8 test vista. Tutte le suite precedenti, controlli sintattici JS e `git diff --check` passano.
- T07 browser reale BUILD 38: Mondo → Personaggio; Metti in borsa (corpo vuoto, borsa 1/4), Equipaggia (corpo Tunica, borsa 0/4); cambio nominale Neria/Aulo conserva ID oggetto distinti; deposito nella Casa comune di Aulo e ri-equipaggiamento; Carica e riapertura conservano dati.
- Layout iframe nel browser reale: 390×740, 320×640, 740×390. Il dialogo scorre verticalmente e non orizzontalmente (`scrollWidth === clientWidth`: 335, 265, 523 px). Verifica visiva 390/320; pulsante Metti in borsa raggiunto e funzionante a 320px; Chiudi funziona in orizzontale.
- Fixture: `tests/browser-layout.html?build=38`. Il documento dell'iframe usa una query di build perché la URL senza query serviva ancora BUILD 37 dalla cache dopo il deploy. Un deploy riuscito è stato distinto dalla versione effettivamente osservata.
- Non collaudati: hardware fisico, eventi touch nativi, pinch reale, safe area, consumi, temperatura, offline/PWA completa. Il paperdoll usa la figura P16 esistente e slot testuali; layer grafici degli oggetti non presenti.

Commit runtime BUILD 38: 37bb617e782328fc34cb5e65867161b14abb5af0. Pages 35251855527 riuscito. Fixture: 69209884cef27f1c51296beca4a6fb777649b9f9, Pages 35252132295 riuscito. Prossimo: T08.

# Prova browser della filiera bronzo → ascia — 22/10/2026

Tre viewport Chromium/Puppeteer su questo server: PC 1280×720, verticale 390×844, orizzontale 844×390. Ogni prova usa un profilo browser isolato e `?perf=1` per disabilitare il ricaricamento del service worker. Sono stati preparati in memoria una fonderia operativa, un fonditore e 4 rame, 1 stagno, 3 legna locali. Il ciclo ha prodotto **4 bronzi**; il pulsante Personaggio → Equipaggia → Forgia ascia ha creato **una ascia nella borsa** e lasciato **2 bronzi**. Il pulsante è diventato inattivo per mancanza di legna. Nessun errore JavaScript o 404 rilevante nelle tre prove (il browser può richiedere il solo favicon mancante).

La prova ha rivelato che il messaggio dell’azione cadeva sotto il bordo del pannello su schermi piccoli. Il clic ora lo porta nell’area visibile con `scrollIntoView({block:'nearest'})`. Dopo la correzione, il rettangolo del messaggio è dentro tutti e tre i viewport. Screenshot e script sono conservati in `Rtsmobile-ricerca/browser-bronzo/`.

Questa è una prova browser emulata, non una misura di prestazioni sul Redmi Note 10 fisico. Non certifica la taglia massima della mappa o la modalità offline della PWA.

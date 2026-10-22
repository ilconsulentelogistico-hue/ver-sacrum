# Prova reale della mappa sullo Xiaomi Redmi Note 10

**Stato:** protocollo pronto; nessuna misura sul telefono ancora eseguita. Serve una build di questo ramo accessibile dal Chrome Android del dispositivo. Non scegliere la mappa massima dalla prova EC2.

## Preparazione

1. Registrare commit/build, versione Android, browser e orientamento. Usare un indirizzo HTTPS della build di prova; aggiungere `?perf=1&worldSize=512`. Il parametro `perf=1` mostra il misuratore e disattiva il service worker per evitare una versione vecchia in cache. La mappa 512 usa uno slot di salvataggio distinto dalla mappa standard.
2. Chiudere altre app pesanti, annotare batteria iniziale e se il telefono è già caldo. Avviare un mondo nuovo e copiare il primo **report FPS** (il pulsante in alto a sinistra). Il report contiene seed e dimensioni viewport; conservare il seed per rifare la stessa mappa con **Ricomincia**.
3. Lasciare 30 secondi di avvio/riscaldamento, poi raccogliere report separati per vista ferma, scorrimento rapido, zoom lontano, villaggio in produzione e carovana in movimento. Il misuratore conserva gli ultimi 900 frame: un solo report alla fine non descrive i 30 minuti.
4. Giocare 30 minuti, salvare, chiudere la scheda, riaprire e caricare. Verificare numero persone, scorte, lotto del Torchio e carico in viaggio. Copiare report dopo il caricamento; annotare durata percepita, calore e batteria finale.
5. Ripetere in verticale e orizzontale, prima su 256 e 512 tile; provare 1024 solo se 512 supera tutti i criteri con margine. Per confronti corretti usare la stessa scena/seed o descrivere le differenze. Per i casi di folla usare `?perf=1&worldSize=512&crowd=100` o `crowd=300`; `crowdArea=far` sposta la folla lontano dalla camera. Questa prova sintetica disattiva save/load e va tenuta separata dalla prova della partita normale. Il report indica `peopleVisible` e `peopleWorking` oltre al totale.

## Criterio

Obiettivo iniziale del piano: gioco ordinario stabilmente percepito ≥30 FPS e p95 del frame intorno o sotto 33 ms sul telefono economico; nessun blocco evidente entrando in nuovi blocchi, nessuna perdita di persone/merci dopo save/load o chiusura. Il dato `frameP95Ms` riguarda solo la finestra recente di 900 frame; affiancarlo a più report e alle note di gioco. Se 512 non passa, profilare `updateP95Ms`, `drawP95Ms`, `schedulingGapP95Ms` e correggere il costo prima di aumentare la mappa. La massima dimensione è la più grande che supera tutti i casi con margine, non quella che si apre una volta.

Scheda per riportare i numeri: `Rtsmobile-ricerca/SCHEDA_REDMINOTE10_2026-10-22.md`. Nessun risultato va segnato come approvato finché la prova fisica non esiste.

Nel report, `peopleVisible` conta gli abitanti vivi nel margine usato dal disegno; `peopleWorking` conta gli abitanti vivi con incarico di raccolta, trasporto, produzione, campo, costruzione, riparazione, allevamento, carovana o addomesticamento. Sono valori del momento in cui si copia il report, mentre i tempi coprono la finestra dei frame campionati.

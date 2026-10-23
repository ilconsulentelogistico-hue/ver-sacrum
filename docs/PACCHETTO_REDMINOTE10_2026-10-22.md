# Pacchetto locale per la prova Redmi Note 10

`python3 tools/build-redmi-bundle.py /percorso/Ver-Sacrum-Redmi.zip` crea un archivio **locale**, senza upload. Include solo HTML, CSS, JavaScript, manifest e asset di gioco tracciati da Git; esclude test, documenti, sorgenti grafici e cartella `.git`. Dentro `bundle-info.json` ci sono il commit e gli SHA-256 dei file. Lo script controlla i riferimenti in `index.html` e nella cache offline, verifica ogni voce ZIP e stampa dimensioni e SHA-256 dell’archivio. I timestamp interni sono fissi: lo stesso commit produce lo stesso archivio.

Prova locale: due generazioni dello stesso commit hanno SHA-256 identico. Un archivio estratto e servito via HTTP su `localhost` si è aperto nel browser mobile simulato 393×851 DPR 2 con mappa 512 e 100 persone, senza errori JavaScript né richieste 404. Questo verifica il pacchetto, non le prestazioni del Redmi Note 10.

Per il telefono occorre servire i file estratti da un indirizzo HTTPS raggiungibile dal dispositivo. Il pacchetto non decide né attiva un hosting. Dopo aver scelto il canale di prova, copiare commit e SHA-256 nella scheda `Rtsmobile-ricerca/SCHEDA_REDMINOTE10_2026-10-22.md`, quindi seguire il protocollo delle misure. Non confondere la prova sintetica `crowd=100|300`, che disattiva i salvataggi, con la partita ordinaria di 30 minuti.

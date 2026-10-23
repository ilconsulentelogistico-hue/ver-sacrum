# Report prestazioni dal telefono

Il pannello tecnico appare solo con `?perf=1`. Ora contiene **Copia report FPS**: con un tocco copia un JSON breve con data, browser, dimensioni CSS dello schermo, densità pixel, seme del mondo, giorno di gioco, FPS mediano, tempi dei frame e memoria JS quando disponibile. Se il browser nega gli appunti, apre il testo da copiare manualmente. Non include dati di gioco privati o credenziali. Fuori dalla modalità `perf` il pulsante non esiste.

Procedura per il Redmi Note 10 dopo che la versione è accessibile sul telefono: aprire `?perf=1` per la mappa 88, poi `?worldSize=256&perf=1` e `?worldSize=512&perf=1`; aspettare almeno 20 secondi per vista, toccare il pulsante e inviare il testo copiato. Ripetere davanti a un villaggio neutrale e dopo aver portato la popolazione ad almeno 30 persone. Il report indica la durata effettiva del campionamento, per evitare confronti di prove troppo brevi. La dimensione predefinita resta 88 fino alle misure fisiche.

Prova locale: Chromium in vista mobile 393×873, mappa 256, pulsante cliccato, JSON valido con più di 20 frame e durata >2 secondi, nessun errore JS. Il normale avvio senza `perf` non mostra il pulsante; cache `terra-italica-v181` presente. Script ripetibile e screenshot in `Rtsmobile-ricerca/audit-browser-mobile/`. Per eseguire lo script sul server occorre copiarlo in `/tmp` come utente `claude-gh`, poi lanciarlo come `ubuntu` perché Puppeteer si trova in `/home/ubuntu/primebase/node_modules`; il server locale va avviato sulla porta 8769.

Verifica finale: suite completa 300/300, nessun errore.

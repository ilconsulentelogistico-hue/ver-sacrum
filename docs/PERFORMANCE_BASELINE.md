# Ver Sacrum — misure iniziali e prova telefono (21/10/2026)

Ramo di lavoro `codex/perf-baseline`, base conservata `a2419fc` in `/home/claude-gh/lavori/Rtsmobile-ricerca/versione-zero/`. Questo documento serve a scegliere la massima mappa che funzioni davvero su smartphone; i numeri del server non sono una certificazione mobile.

## Misuratore opzionale

Aprire il gioco con `?perf=1`: compare un piccolo riquadro con FPS mediano, tempo p95 tra frame e tempi p95 di aggiornamento e disegno. Senza `?perf=1`, `performance.js` termina senza cambiare i metodi del gioco. Per un rapporto completo, in una console del browser usare `window.__terraPerf.report()`; `window.__terraPerf.reset()` ricomincia la finestra di misura; `window.__terraPerf.samples()` restituisce gli ultimi 900 campioni. La memoria JS compare nel rapporto solo se il browser offre `performance.memory`.

L'intervallo fra frame include anche attesa del browser e carico del dispositivo. I tempi di `update` e `draw` misurano i rispettivi metodi, ma sotto contesa CPU possono includere pause dello scheduler. Vanno confrontati nella stessa macchina e nelle stesse condizioni.

## Prova browser ripetibile sul server

`tools/perf-smoke.cjs` avvia un server locale temporaneo, apre Chromium in un profilo nuovo, usa il seed `123456`, misura 6 secondi fermi e 8 secondi di scorrimento della camera, poi salva, genera una nuova partita e ricarica la precedente. Esegue un profilo PC 1280×720 e uno emulato 390×844 con touch; salva JSON e screenshot se `PERF_OUT` è impostato. Richiede Puppeteer disponibile tramite `PUPPETEER_MODULE` oppure tra i moduli Node e un Chromium disponibile via `CHROME_BIN` oppure Puppeteer.

Comando usato su questo server, una prova alla volta e a priorità bassa:

```sh
sudo env PUPPETEER_MODULE=/home/ubuntu/primebase/node_modules/puppeteer \
CHROME_BIN=/home/ubuntu/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome \
PERF_OUT=/home/claude-gh/lavori/Rtsmobile-ricerca/perf-baseline-2026-10-21 \
nice -n 15 node tools/perf-smoke.cjs
```

Esito finale sul ramo locale: mappa 88×88, 14 persone, 2.611 nodi risorsa. Profilo PC: FPS mediano 4,4 da fermo e 3,1 nello scorrimento; profilo telefono emulato: 14,6 e 5,9. Il tempo p95 di `draw` nello scorrimento era 292 ms su PC e 202 ms nel profilo telefono, molto maggiore di `update` (15 e 8 ms). Salva/ricarica superato in entrambi i profili; zero errori JavaScript e zero risorse mancanti. Il server aveva load average 4,56 su 4 CPU, con processi Electron attivi, e Chromium usava rendering software; quindi **questi FPS non misurano la prestazione del gioco su un telefono e non sono soglie affidabili**. Indicano solo che il disegno e le scansioni di migliaia di risorse meritano una profilazione dedicata. I dati completi e gli screenshot sono in `Rtsmobile-ricerca/perf-baseline-2026-10-21/final/`. La prova iniziale aveva segnalato un 404 generico; nella prova finale il controllo dei percorsi, esclusa la favicon opzionale, non ne ha trovati.

## Prova necessaria su smartphone reale

Simone userà uno Xiaomi Redmi Note 10; versione Android e Chrome ancora da annotare. Quando disponibili, fare una prova in Chrome su dispositivo reale, preferibilmente su una copia di test del gioco e in scheda in incognito per non alterare il salvataggio normale:

1. Annotare modello, versione Android/Chrome, carica e orientamento. Lasciare il telefono stabilizzarsi; evitare risparmio energetico e altre app pesanti durante la misura.
2. Aprire `?perf=1`, attendere un minuto senza toccare la camera e fotografare il riquadro. Ripetere dopo uno scorrimento continuo di un minuto attraverso bosco, pianura e insediamento.
3. Ripetere con persone al lavoro, almeno una carovana e una costruzione; salvare, chiudere e riaprire. Dopo 30 minuti verificare FPS, temperatura percepita, memoria/ricaricamento della scheda e correttezza delle merci.
4. Provare portrait e landscape. Registrare FPS mediano, frame p95, update/draw p95 e numero di persone/risorse. Se è disponibile DevTools remoto, salvare il rapporto JSON e un profilo CPU.

Soglia iniziale del piano: almeno 30 FPS stabili nel gioco ordinario su telefono economico (frame p95 circa 33 ms o meno), nessun blocco percepibile al cambio di zona, nessun arresto per memoria e salvataggi integri. Prima di aumentare la mappa vanno risolti i colli di bottiglia misurati. La massima dimensione verrà scelta solo dopo prove progressive 128→256→512→1024→2048, non con un numero deciso ora.

## Stabilità della versione di partenza

La prima esecuzione sequenziale della suite sulla versione zero ha dato 39 suite, 7 fallite. Cinque prove erano legate a comportamenti o versioni precedenti (costruzione con conferma, collisioni durante il moto, cache e selezione). Due hanno esposto scarti reali nel codice: le dimensioni di grano/orzo/vite non coincidevano con `OBIETTIVO.md` e `docs/CROPS_AND_SEASONS.md`; la raccolta interrompeva la ricerca dello spot vicino appena uno si esauriva. Entrambe le correzioni hanno prove mirate verdi. La suite completa sul ramo corretto è stata rieseguita in sequenza: **40 suite passate, 0 fallite**. Il registro e i log sono in `Rtsmobile-ricerca/final-tests-2026-10-21/`. Il test `performance.cjs` verifica che il misuratore resti spento senza `?perf=1` e restituisca campioni quando è acceso.

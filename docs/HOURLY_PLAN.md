# Piano operativo orario — RTS mobile

Fuso: **Europe/Rome**. Prima esecuzione pianificata: **17 settembre 2026, ore 08:00**. Poi ogni ora al minuto 00, tutti i giorni, anche la notte.

## Orari e selezione del lavoro

| Ora italiana | Operazione |
|---|---|
| 07:36–08:00 del 17/09 | Preparazione: audit T00, elenco, registro, automazione |
| 08:00 | Prima iterazione: T01, se ancora incompleto; altrimenti primo task ammissibile |
| 09:00 | Verifica il risultato precedente, completa il residuo o avanza |
| 10:00 | Stessa regola, partendo sempre dal registro aggiornato |
| 11:00–23:00 | Una nuova iterazione a ogni ora intera |
| 00:00–07:00 e giorni successivi | Prosegue lo stesso ciclo fino a completamento o blocco esterno |

Gli orari sono avvii richiesti, non garanzie di durata dell'esecuzione o consegna di una funzione ogni ora. La durata effettiva dipende dalla piattaforma e dal lavoro necessario. Una funzione può richiedere più iterazioni. Non inventare una scadenza di completamento.

## Protocollo di ogni esecuzione

1. Leggere main corrente, `docs/HANDOFF_MOBILE.md`, questo piano, `docs/WORK_STATE.json`, eventuali AGENTS.md e branch del task aperto. Il repository è la fonte persistente; lo scratch può essere perso.
2. Controllare deploy e regressioni pertinenti. Una regressione introdotta o segnalata ha priorità sulle nuove funzionalità: registrarla come Rxx con riproduzione e test.
3. Evitare sovrapposizioni: acquisire nel registro una lease con run ID, task, head osservato e scadenza UTC a +90 minuti mediante aggiornamento Git non forzato. Se esiste una lease valida, uscire senza modificare il codice. Rinnovarla durante esecuzioni lunghe. Una lease scaduta si recupera solo verificando gli ultimi commit e lo stato remoto; non sovrascrivere lavoro più recente.
4. Riprendere `in_progress` o `awaiting_deploy`. In alternativa prendere il primo task pending nell'ordine sotto con tutte le dipendenze done. T00 già concluso non va rifatto integralmente se non ci sono cambi rilevanti.
5. Implementare un incremento coerente sul branch dedicato `work/Txx-...`. Portare il lavoro avanti, non limitarsi a un rapporto. Quando una fase è terminata e resta capacità, passare subito al prossimo task ammissibile anche nella stessa esecuzione.
6. Eseguire test pertinenti e verifiche UI disponibili. Non equiparare DOM simulato a browser, emulazione a hardware o workflow riuscito a partita giocata. Non mascherare un requisito mancante con un test che lo ignora.
7. Pubblicare su main solo incrementi coerenti e verificati, con aggiornamento build/cache per modifiche runtime; preservare modifiche altrui e salvataggi. Usare fast-forward senza force o PR/merge appropriati. L'autorizzazione dell'utente copre implementazione e pubblicazione nel progetto, non aggira protezioni/approvazioni della piattaforma.
8. Conservare lavoro incompleto in commit sul branch remoto, registrare sottoattività residue esatte e comando per riprendere. Non pubblicare una build rotta per rispettare l'orologio.
9. Per done servono tutti i criteri soddisfatti, commit identificato, prove riportate e deploy riuscito per le modifiche pubblicate. Se deploy pendente: awaiting_deploy e riprenderne la verifica senza duplicare l'implementazione.
10. Aggiornare registro e diario `runs` con data, task, esito, commit, verifiche, cosa resta e blocchi; rilasciare lease. Comunicare sinteticamente risultato concreto, build, prossimo passo e limiti.

## Gestione blocchi e conclusione

- Stati ammessi: pending, in_progress, awaiting_deploy, blocked_external, done.
- Un blocco esterno viene descritto con errore/evidenza e condizione di sblocco. Procedere con il primo task indipendente disponibile; non avviare dipendenti del task bloccato.
- Non ripetere ogni ora installazioni/download già falliti nello stesso modo: registrare il fallimento e riprovare solo se cambiano le condizioni, altrimenti una verifica leggera dopo 24 ore.
- Se tutti i task disponibili dipendono da un blocco esterno, inviare un solo riepilogo operativo e mettere in pausa l'automazione. Non dichiarare il progetto completo. Il task di collaudo fisico richiede realmente hardware/evidenze.
- Quando tutti i task sono done, eseguire audit finale e disattivare l'automazione. Nessuna attività infinita di ampliamento contenuti.

## Vincoli permanenti

PWA mobile esistente; non cambiare motore, identità pubblica o repo arbitrariamente. Controlli MOD, selezione a riquadro con scroll laterale/superiore, grafica P16 e terreno procedurale restano validi. Paperdoll e Skill sono due viste dello stesso ID. Merci locali e trasportate senza duplicazioni. Conservare slot dei salvataggi originali e migrazioni testate. Nessun multiplayer, cloud save, monetizzazione o avanzamento offline implicito. I dettagli aperti (slot/cap/bilanciamento) vanno dichiarati come scelte provvisorie configurabili, non attribuiti all'utente. Non riattivare l'automazione separata degli asset che risulta sospesa.

## Elenco eseguibile e criteri

### T00 — Verifica della base pubblicata

Dipendenze: nessuna. Stato iniziale: done.

- Identificare commit/build correnti e leggere handoff e codice.
- Eseguire le quattro suite esistenti e registrare esiti e limiti.

### T01 — Avvio reale e regressioni di movimento

Dipendenze: T00. Stato iniziale: pending.

- Avviare il gioco in un browser disponibile e verificare loop, errori console, selezione, movimento e ripresa.
- Provare i comandi attraverso eventi UI e percorsi raggiungibili, oltre ai test con DOM simulato; registrare browser e viewport.

### T02 — Modello unico degli abitanti e migrazione

Dipendenze: T00. Stato iniziale: pending.

- Definire record persistenti con ID, collocazione, occupazione, salute, skill e carico senza duplicare abitanti.
- Migrare il salvataggio corrente conservando originale; verificare conteggio persone e round trip.

### T03 — Residenti e ingresso/uscita dal villaggio

Dipendenze: T02. Stato iniziale: pending.

- Ingresso e uscita conservano stesso ID, skill, salute ed eventuale carico senza duplicazioni.
- Gestire villaggio pieno, distrutto e uscita senza terreno libero con esito visibile.

### T04 — Pannello comunità e mobilitazione

Dipendenze: T03. Stato iniziale: pending.

- Mostrare residenti, occupati, disponibili e mobilitati con conteggi coerenti.
- Consentire scelta nominale e mobilitazione come trasferimento di persone, non generazione di copie.

### T05 — Popolazione, alloggi e consumi

Dipendenze: T04. Stato iniziale: pending.

- Separare capienza, popolazione effettiva e consumi; sostituire la crescita a solo timer con regole esplicite configurabili.
- Verificare carenza cibo, limite alloggi, nuova popolazione e salvataggi; documentare parametri provvisori.

### T06 — Dati individuali di equipaggiamento

Dipendenze: T02. Stato iniziale: pending.

- Separare equipaggiamento, inventario trasportato e scorte; definire ID oggetto e trasferimenti atomici.
- Documentare slot minimi come scelta provvisoria, non requisito già approvato; testare equipaggia/rimuovi/reload senza duplicare oggetti.

### T07 — Vista Personaggio e paperdoll

Dipendenze: T06. Stato iniziale: pending.

- Vista dedicata dello stesso ID selezionato con figura, equipaggiamento e statistiche leggibili su telefono.
- Cambio selezione, residente nascosto e chiusura pannello non cambiano il proprietario dei dati.

### T08 — Vista Skill separata

Dipendenze: T07. Stato iniziale: pending.

- Finestra distinta dal paperdoll con skill, livello e progresso del medesimo ID.
- Verificare progressione attraverso uso e persistenza; cap/lock non definiti restano parametri provvisori documentati.

### T09 — Conoscenze edilizie personali e tribali

Dipendenze: T08. Stato iniziale: pending.

- Tenere sapere edilizio separato dalle skill; definire sblocchi configurabili.
- Cantieri validano competenza e mostrano requisiti mancanti; sapere sopravvive a migrazione/reload.

### T10 — Lavoratori e mestieri nelle fabbriche

Dipendenze: T04, T08. Stato iniziale: pending.

- Assegnare persone a produzione: una persona non svolge due lavori contemporanei.
- Produzione dipende da lavoratori e input locali; interruzione e sostituzione non duplicano batch.

### T11 — Materiali ai cantieri e riparazioni

Dipendenze: T09, T10. Stato iniziale: pending.

- Portare materiali al cantiere fisicamente prima dell’utilizzo; prenotare non equivale a consumare.
- Riparazioni richiedono lavoro/materiali; annullamento, distruzione, morte e reload conservano o contabilizzano tutte le merci.

### T12 — Colture differenziate e stagioni

Dipendenze: T10. Stato iniziale: pending.

- Grano, orzo, vite e olivo producono beni distinti con tempi e rese configurabili.
- Il raccolto intero resta locale; terreno, acqua e stagione influiscono senza accrediti globali o eccedenze perdute.

### T13 — Allevamento con animali persistenti

Dipendenze: T12. Stato iniziale: pending.

- Collegare recinti ad animali posseduti, lavoratori e foraggio, con quantità/produzione verificabili.
- Salvare ID animali e prodotti; niente latte/uova generati dal solo numero di operai senza animali.

### T14 — Catalogo merci e altre ricette

Dipendenze: T11, T13. Stato iniziale: pending.

- Definire catalogo coerente per input/output, ingombri e prodotti richiesti dalle colture/animali.
- Testare ogni nuova ricetta con input assente, output pieno, carico interrotto e reload.

### T15 — Mercati locali e prezzi

Dipendenze: T14. Stato iniziale: pending.

- Mercati con ID, merci, denaro e prezzi locali legati a scorte/domanda documentate.
- Vendite e acquisti non leggono merci remote della Casa comune; liquidità e disponibilità sono vincoli effettivi.

### T16 — Scambio touch e carico commerciale

Dipendenze: T15, T06. Stato iniziale: pending.

- Mostrare inventario personale/carovana, mercato, quantità e saldo prima della conferma.
- Conferma idempotente: doppio tap/reload non duplica; equipaggiamento e riserve non venduti implicitamente.

### T17 — Carovane e rotte fisiche

Dipendenze: T16. Stato iniziale: pending.

- Mercante e merci raggiungono davvero il mercato e tornano; percorso raggiungibile e capacità verificati.
- Stop, minaccia, morte, mercato rimosso e ripresa app gestiti senza doppia spesa.

### T18 — Insediamenti neutrali ed economia

Dipendenze: T05, T15. Stato iniziale: pending.

- Neutrali con proprietari, popolazione e scorte separati; attività AI verificabili e persistenti.
- Consumi e domanda dipendono da popolazione reale; impedire accesso a inventari non autorizzati.

### T19 — Lealtà, influenza e diplomazia

Dipendenze: T18. Stato iniziale: pending.

- Definire e mostrare lealtà/resistenza/influenza e relazioni con effetti osservabili, parametri documentati.
- Transizioni politiche preservano ID, merci e appartenenze; testare persistenza e stati incompatibili.

### T20 — Obiettivi militari e fine partita

Dipendenze: T11, T18. Stato iniziale: pending.

- Campi ostili, predoni e difese con condizioni di vittoria: nessun campo e nessun nemico rimanente.
- Sconfitta conteggia persone residenti/mobilitate correttamente e depositi; fine partita arresta simulazione e si salva.

### T21 — Gruppi, inattivi e minimappa

Dipendenze: T04. Stato iniziale: pending.

- Gruppi persistenti per ID e selezione prossimo/tutti inattivi da touch; richiamo camera.
- Minimappa sintetica e navigabile; selezione MOD/edge-scroll e pinch non impartiscono ordini accidentali.

### T22 — Streaming del mondo e budget simulazione

Dipendenze: T17, T20, T21. Stato iniziale: pending.

- Generazione/caricamento per blocchi, cache limitate e pathfinding con budget; conservare risorse consumate fuori vista.
- Lavori, persone residenti e trasporti fuori schermo continuano senza dipendere dal rendering; salvataggio copre snapshot.

### T23 — Integrazione degli asset approvati

Dipendenze: T07, T14, T20. Stato iniziale: pending.

- Inventariare Drive Terra Italica/Assets P16 e mappare asset approvati alle entità realmente implementate.
- Verificare trasparenza, scala nativa, P16 e ancoraggi; niente tavole riepilogative usate come sprite o nuovo terreno PNG.

### T24 — Collaudo UI telefono e tablet

Dipendenze: T01, T17, T20, T21, T23. Stato iniziale: pending.

- Verificare orientazioni, safe area, testo, pannelli, tap sovrapposti e flusso intero senza mouse/tastiera.
- Registrare screenshot e risultati da browser reale/emulazione distinguendoli dai test su dispositivo fisico.

### T25 — Collaudo fisico e prestazioni

Dipendenze: T22, T24. Stato iniziale: pending.

- Su hardware reale misurare frame mediani/p95, memoria e sessioni prolungate con raccolta, guerra e commercio.
- Verificare blocco schermo, background, riapertura e perdita processo. Se hardware non disponibile: blocked_external, mai done.

### T26 — Audit finale e chiusura del piano

Dipendenze: T19, T25. Stato iniziale: pending.

- Confrontare tutte le accettazioni dell’handoff con evidenze e stato effettivo, risolvere regressioni e verificare ultimo deploy.
- Disattivare il ciclo soltanto a piano completo; se resta un blocco esterno registrarlo e segnalare ciò che serve senza dichiarare finito.


# Build 29 — prima filiera fisica e continuità mobile

## Riferimento

Il riferimento funzionale è [HANDOFF_MOBILE.md](HANDOFF_MOBILE.md), relativo al desktop Godot Ver Sacrum. Il vecchio repository Python non rappresenta la parità funzionale da raggiungere. La destinazione resta la PWA mobile esistente; il nome pubblico non viene cambiato automaticamente.

## Implementato

- Sospensione su visibilitychange/pagehide, ritorno in pausa con ripresa esplicita. Nessun avanzamento offline.
- Salvataggi mobile versione 3, slot separato da v2, scrittura temporanea e sostituzione del valore localStorage, copia precedente, validazione prima di sostituire il mondo. Ripristino all'avvio in pausa. Nessuna compatibilità dichiarata con il JSON v3 desktop.
- Persistenza di abitanti, ID, skill, carichi, ordini, razziatori, generatore casuale, calendario frazionario, selezione, inventari, ricette e trasporti. La migrazione v2 conserva il vecchio slot; i razziatori non salvati dal vecchio formato non possono essere ricostruiti.
- Inventari locali di edifici. `stock` è un alias delle sole scorte della Casa comune, non una seconda copia. HUD/costi leggono quelle scorte. I magazzini non accreditano risorse alla Casa comune a distanza.
- Campo con raccolto di grano interamente locale; crescita bloccata a maturazione quando non c'è spazio per il raccolto intero.
- Mulino: 2 grano → 2 farina in 6 secondi di simulazione. Forno: 2 farina → 2 pane in 8 secondi. Rapporti e tempi provvisori; le macchine lavorano automaticamente, senza requisito di mestiere/combustibile per ora.
- Trasporto singolo o ripetuto con abitante, origine, destinazione e merce. Prenotazioni derivate dagli ordini persistenti, prelievo e consegna soltanto all'arrivo. Annullamento conserva il carico; morte lo lascia come risorsa recuperabile. Percorsi impossibili non consegnano a distanza.
- Pannello Mondo → Filiera: inventari, assegnazione trasporti, rotte attive. Pausa durante la gestione; la chiusura ripristina lo stato precedente, salvo rientro dal background che richiede ripresa esplicita.
- Ordine Consegna e MOD sul deposito per scaricare carichi mantenuti dopo un'interruzione.

## Prova giocabile

1. Costruisci un campo, un mulino e un forno. Assegna un abitante al campo.
2. In Mondo → Filiera assegna tre abitanti a rotte ripetute: campo → mulino (grano), mulino → forno (farina), forno → Casa comune (pane).
3. Chiudi il pannello: i portatori aspettano le merci e viaggiano quando disponibili. Il pane alla Casa comune contribuisce al cibo usato dalla crescita attuale.
4. Il quinto abitante può continuare raccolta e costruzione. Per spostare risorse da un magazzino alla Casa comune usa lo stesso pannello.
5. Libera interrompe una rotta; se c'è merce in viaggio usa Consegna. Le risorse prenotate non possono finanziare contemporaneamente una costruzione.

## Limiti espliciti / lavoro successivo

Non è il porting completo: villaggi demografici, neutrali politici, paperdoll e skill separate, conoscenze edilizie, commercio/carovane e vittoria desktop restano da implementare. Costi di costruzione e crescita restano addebitati al centro; il trasporto materiali al cantiere non è ancora simulato. Ingredienti e output condividono la capacità totale dell'edificio. Gli edifici distrutti perdono le proprie scorte. Mulino e forno usano simboli procedurali provvisori, non nuovi asset approvati.

Il salvataggio può fallire se il browser nega lo storage o esaurisce la quota. Le terminazioni forzate recuperano l'ultimo checkpoint riuscito: nessun browser garantisce l'evento di sospensione prima di un kill. Il backup può rappresentare un checkpoint precedente e viene segnalato quando usato.

## Verifica

`node tests/controls.cjs` e `node tests/simulation.cjs`: regressioni eseguite con DOM/canvas simulati. La filiera completa conserva la quantità di merce attraverso magazzini, carichi e ricette in corso. Queste verifiche non certificano prestazioni, temperatura, usabilità o touch su hardware Android/iOS reale.

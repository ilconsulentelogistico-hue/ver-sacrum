# Ver Sacrum — audit dell’handoff rispetto alla build 80

Data: 4 ottobre 2026. Codice esaminato: `2758735824d59b24284552e30830d49b3d5c9d7b` (`main`, build 80). Confronto con `HANDOFF_MOBILE.md`, comprese le successive decisioni dell’utente. Questo audit non introduce nuove regole di gioco e non certifica Android/iOS.

**Esito: il porting funzionale è avanzato, ma non completo.** Le priorità sono coerenza dei trasporti, sostenibilità delle filiere e verifica mobile. Politica, equipaggiamento e allevamento non sono assenti: esistono già basi operative. La presenza di un metodo o il superamento di un test non certificano da soli un flusso completo su dispositivo.

## Decisioni successive che prevalgono sul vecchio desktop

- Totem segnaposto della città; materiali comunitari disponibili nei magazzini collegati.
- Economia di baratto senza denaro; tasse e salari rimandati. I riferimenti desktop alla liquidità non sono requisiti da ripristinare.
- Incursioni disattivate per richiesta dell’utente: non è una mancanza del porting.
- Villaggio 4 × 4 tile, fino a 16 casette grafiche; non il villaggio desktop 10 × 10.
- Solo il campo è attraversabile, anche da incompleto; recinto e altri edifici sono solidi.
- Grano 2 × 2, orzo 1 × 1, vite 2 × 2, olivo 3 × 3. Limiti attuali: 2/2/8/8 lavoratori.
- Gestione nella UI contestuale inferiore; Personaggio e Skill restano due viste dello stesso abitante, senza richiedere due popup.

## Confronto dei sistemi

“Presente” indica implementazione identificata nel mobile; “parziale” indica uno scarto concreto rispetto all’obiettivo; “non verificato” riguarda evidenze mancanti. “Da definire” distingue le proposte dell’handoff dalle regole approvate.

| Ambito dell’handoff | Stato mobile | Evidenza e residuo |
| --- | --- | --- |
| Partita, pausa, calendario | Presente | `game.js`, `boot.js`, `persistence.js`. Tempi di gioco ancora di prototipo. |
| Mondo grande a chunk | Parziale | `WORLD_SIZE=88`, tutte le tile generate e conservate; `streaming.js` gestisce cache di chunk 8 × 8, massimo 20. Non equivale al mondo desktop 4096 × 4096 o a uno streaming completo della simulazione. |
| Camera, zoom, minimappa | Presente, collaudo mobile da completare | `touch-modifier.js`, `groups-minimap.js`, renderer di `game.js`. Nessuna nuova prova visiva su telefono in questo audit. |
| Selezione, gruppi, inattivi, ordini | Presente | Gruppi per ID, selezione e ordini touch; verifiche simulate disponibili. Rimane il collaudo dell’intero flusso esclusivamente touch. |
| Raccolta e risorse | Presente | `resources.js`, `logistics.js`: quantità, continuazione vicina, carico e consegna; stati degli spot, ricrescita e rimozione. La scala del mondo resta quella mobile. |
| Collisioni e piazzamento | Presente | `collisions.js`, `village-footprint.js`, `agriculture.js`: ingombri, margini, controllo risorse/attori e campi attraversabili. Percorsi congestionati e nuove impronte richiedono prove di partita. |
| Inventari e trasporto manuale | Presente | `logistics.js`: `assignHaul`, prenotazioni, prelievo, carico e consegna. Gli inventari locali non implicano però che ogni trasferimento automatico sia fisico. |
| Rete logistica completamente fisica | **Parziale, priorità alta** | `settlement.js:moveLinkedGoods` sottrae e aggiunge direttamente fra edifici, senza portatore o tempo di viaggio. Usata da magazzini/mercati, input e output delle fabbriche e quote comunitarie. |
| Costruzione e riparazione | Parziale rispetto alla consegna fisica integrale | Costi, competenze e lavoro esistono. L’ultimo wrapper `settlement.js:placeBuild` trasferisce immediatamente tutti i materiali comunitari al cantiere; non aspetta un trasportatore. La spendibilità comunitaria è conforme alla decisione sul totem, il viaggio dei materiali resta astratto. |
| Agricoltura | Presente per le quattro colture | Ingombri e staffing aggiornati; raccolto locale e attesa a inventario pieno. `agriculture.js`, `logistics.js`. Il prelievo dal campo richiede la logistica manuale: manca l’automazione di raccolta/ritiro integrata nei collegamenti. |
| Filiere alimentari | Presenti per i cereali, incomplete nel catalogo | Grano → farina → pane, orzo → farina d’orzo → pane d’orzo; ricette con input/output locali. Uva → vino e olive → olio assenti. L’aggiunta di ricette/edifici richiede parametri di progetto espliciti. |
| Legname lavorato | Presente | Falegnameria, 10 legno → 8 tavole; quota comunitaria e artigiani alimentati. Trasporto automatico della quota ancora istantaneo. |
| Allevamento | Parziale | `livestock.js`: pecore identificate, recinto, allevatore presente, consumo locale di foraggio, latte locale. Non mancano alimentazione e dipendenza dagli animali; mancano riproduzione e filiere complete per specie/prodotti. |
| Sostenibilità del foraggio | **Mancante** | Bene catalogato e scorta iniziale del Clan del Guado; nessuna ricetta/coltura di produzione rinnovabile nel codice esaminato. Il consumo può esaurire l’offerta disponibile. |
| Villaggi, residenti, occupati | Parziale | Identità, ingresso/uscita, mobilitazione, domicilio conservato dagli artigiani, crescita con razioni e mercato presenti. Capienza ancora 5 persone per villaggio, mentre il disegno mostra fino a 16 casette: non 16 alloggi dichiarati. Nessuna demografia biologica completa. |
| Domanda e distribuzione del cibo | Parziale | Razioni per persona e stop delle fabbriche senza lavoratori nutriti; crescita condizionata. Il mercato neutrale usa domanda derivata dalle scorte, non un modello completo di consumi per popolazione. |
| Paperdoll e oggetti | Presente come base | `equipment.js`, `character.js`, `contextual-ui.js`: registro unico, mano/corpo/testa, borsa distinta dal carico, trasferimenti e persistenza. Mancano filiera di fabbricazione degli oggetti e bonus applicati; grafica/equipaggiamento da perfezionare. Slot finali erano una proposta, non un requisito desktop già fissato. |
| Skill separate | Presente come base, modello UO parziale | `skills.js` e `TERRA_SKILLS`: XP attraverso l’uso, massimo 20. Mancano cap complessivo, lock crescita/blocco/riduzione e difficoltà per abilità. Non ripristinare automaticamente il massimo desktop 100 senza bilanciamento. |
| Sapere edilizio | Presente | `construction-knowledge.js`: conoscenze personali/tribali e controlli del costruttore, distinte dalle skill. |
| Fazioni e politica | Parziale, già implementata | `politics.js`: lealtà, resistenza, influenza, doni/pressioni, relazioni e restrizioni commerciali. Mancano un sistema completo di acquisizione politica dei villaggi e trattati/guerre articolati. Non è corretto classificare le tre statistiche come assenti. |
| Economia delle altre comunità | Parziale | `neutral.js:neutralEconomyDay` accredita prodotti periodicamente in base alla popolazione, senza filiere fisiche equivalenti al giocatore. Economia locale persistente, ma produzione ancora astratta. |
| Baratto e carovane | Presente per singolo viaggio | `market.js`, `caravan.js`: carico reale, viaggio, rivalutazione all’arrivo, ritorno, spazio, minacce e salvataggio. Manca un pianificatore di itinerari ripetuti con più tappe; l’ordine si conclude allo scarico. |
| Combattimento e risultati | Presente, incursioni sospese per scelta | `war.js`: campi, attacco, condizioni di fine partita. Tattiche/formazioni avanzate non erano implementate neppure nel desktop. |
| Salvataggio e migrazione | Presente nel browser | `persistence.js`: schema v5, validazione, slot temporaneo, backup e migrazioni mobile. Non è un importatore del JSON Godot v3; `localStorage` non equivale al flush/rename di un file nativo. |
| Background e ripresa | Presente nel codice, hardware non verificato | `visibilitychange`, `pagehide/pageshow`, `suspend`, ripresa in pausa e assenza di avanzamento offline. Non è corretto dire che mancano gli handler; manca la verifica di blocco schermo/perdita processo sul dispositivo. |
| UI telefono/tablet | Parziale come accettazione | Pannello contestuale, safe area e gesture implementati. Le verifiche storiche di build precedenti non certificano la build 80 su entrambe le orientazioni. |
| Prestazioni ed export | Non verificato per i requisiti finali | PWA/browser pubblicato su Pages; nessuna misura corrente di p95, RAM, temperatura o sessioni prolungate su hardware. Nessuna certificazione di pacchetti nativi Android/iOS. |

## Priorità operative e criteri di completamento

1. **Trasporto fisico della rete interna.** Sostituire i trasferimenti istantanei con incarichi e prenotazioni per portatori, riusando la logistica esistente. Completato quando chiusura di un link, strada bloccata, morte, annullamento e reload non duplicano né anticipano merci, e una fabbrica senza consegna resta ferma. Mantenere il requisito: solo i magazzini collegati finanziano la costruzione. Separare questa regola dal tempo di consegna al cantiere.
2. **Ciclo alimentare autosufficiente.** Automatizzare il ritiro dai campi e definire una fonte rinnovabile di foraggio. Provare campo → mulino → forno → alimentazione → crescita in una partita con riserve iniziali esaurite. Servono lavoratori, tempi e merci reali in ogni passaggio.
3. **Completare le colture da trasformazione.** Introdurre uva/vino e olive/olio con ricette, edifici, capacità e destinazione del consumo coerenti. Sono nuovi contenuti; non improvvisare valori come se fossero già approvati nell’handoff.
4. **Villaggio ed economie neutrali.** Decidere la relazione tra casette visibili e posti; rendere i neutrali produttori tramite lavoro e filiere, poi approfondire influenza e integrazione politica.
5. **Specializzazione individuale.** Definire cap e lock delle skill, effetti e produzione dell’equipaggiamento. Conservare sempre un’identità unica e viste distinte.
6. **Collaudo mobile e scala.** Durante le fasi precedenti provare un telefono reale; prima di allargare la mappa misurare frame/memoria. Validare orientazioni, background, processo terminato, offline e ripresa. Il mondo 4096 × 4096 richiede un intervento architetturale, non la sola modifica di una costante.

Vino/olio e politica avanzata non devono precedere la verifica del circuito cereali/cibo. Tasse, salari, multiplayer, cloud save e avanzamento offline restano fuori dal perimetro approvato.

## Verifica e limiti

Ispezione del codice effettivamente caricato, inclusi i wrapper finali che sostituiscono comportamenti precedenti. Non si è usato il solo registro storico `WORK_STATE.json`, fermo principalmente alle build 54–69, come prova di completamento della build 80.

Eseguite tutte le **36 suite Node** disponibili: **34 superate alla prima esecuzione, 2 con anomalie**.

- `debug.cjs`: il caso relativo agli anelli di selezione cerca di costruire un campo a coordinate fisse (42,42). Con l’impronta attuale il piazzamento è rifiutato perché occupato; il test non verifica l’avvenuta costruzione prima di controllare la selezione. Fallimento riprodotto. Occorre aggiornare il setup e aggiungere la precondizione di piazzamento riuscito; questo esito non dimostra da solo un bug della selezione.
- `animal-obstacles.cjs`: fallita una volta l’asserzione sulla distanza finale percorsa; riesecuzione isolata superata. Il controllo usa una passeggiata casuale e la distanza netta dall’origine, quindi va reso riproducibile e distinto dalla distanza effettivamente percorsa. Nessuna collisione segnalata in quell’esecuzione; non si dichiara risolta l’instabilità.

I test delle colture, del piazzamento, delle collisioni generali, delle filiere, delle carovane e dei salvataggi sono passati nell’esecuzione complessiva. Non si dichiara la suite interamente verde. Non sono stati modificati codice runtime o test per nascondere gli esiti dell’audit.

Nessun test visuale o su dispositivo fisico svolto in questo audit.

# Indice spaziale delle risorse

Le risorse restano oggetti persistenti con gli stessi ID e quantità del salvataggio. `World.resourcesInBounds` interroga bucket di 8×8 tile e conserva l'ordine originale delle risorse. `World.resourceById` evita la ricerca lineare dei bersagli di lavoro durante lo streaming. Disegno, selezione, ricerca del primo insediamento e continuazione della raccolta usano l'indice.

L'indice non entra nel salvataggio: si ricostruisce dalla lista dopo una partita nuova o caricata. Un'aggiunta alla lista o la sua sostituzione viene rilevata al prossimo accesso. `normalizeResourceSpawns` invalida esplicitamente l'indice quando sposta una risorsa. Una futura funzione che cambi le coordinate di una risorsa dovrà chiamare `world.invalidateResourceIndex()`.

La rigenerazione quotidiana continua a visitare tutte le risorse una volta per giorno di gioco. La mappa resta 88×88; l'indice non prova ancora una taglia maggiore su smartphone fisico.

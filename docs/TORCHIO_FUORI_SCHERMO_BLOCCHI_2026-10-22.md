# Torchio lontano dalla camera, mappa 512

Test riproducibile `tests/press-remote-chunks.cjs`: seed 123456, mappa sperimentale 512×512, camera vicino alla base; Torchio nella casella 399,5 e addetto a 400,3, cioè su due blocchi 8×8 diversi. Entrambi sono lontani dai blocchi attivi della vista. Si avvia il lotto di 4 uva→2 vino, si salva mentre è in lavorazione, si ricarica e si eseguono 300 aggiornamenti da 0,05 s. Il risultato è un solo lotto completo, nessuna uva o vino inventati, mestiere e priorità conservati.

Il test mirato passa 1/1. La suite completa della base immediata (`codex/press-recipe-priority`) è 337/337, zero errori; qui non cambia il codice del gioco. La prova fisica sul Redmi Note 10 resta necessaria per stabilire la taglia massima della mappa: questo test controlla la correttezza della simulazione, non gli FPS del telefono.

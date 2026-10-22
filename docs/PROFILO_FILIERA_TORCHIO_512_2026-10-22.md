# Browser mobile e costo CPU della filiera su 512

Prova browser simulato 393×873: nel collegamento magazzino↔mercato, il controllo **Vendi anche vino/olio della comunità** compare per il vino, parte disattivato e la scelta viene salvata. Screenshot `/home/ubuntu/codex-gh-lavoro/ver-sacrum-riserva-mobile.png`. Nessun errore JavaScript; solo 404 della favicon mancante. La sovraimpressione `?perf=1` dello screenshot è diagnostica, non la grafica normale del gioco.

Profilo riproducibile `audit-press-population-512.cjs` nella ricerca: seed 123456, mappa 512, campo con 4 uva, tre tratte di trasporto e lotto `grapes-wine` avviato. 360 frame di riscaldamento + 360 misurati a `dt=0,016`, con 100 e 300 persone totali. Mediana di `update` 0,294/0,612 ms, p95 1,259/1,091 ms; mediana del solo `updateLiving` 0,222/0,508 ms. La differenza dei p95 mostra oscillazione del server condiviso: non usarli come FPS. Questa misura Node esclude disegno, touch, browser e temperatura del Redmi Note 10.

Durante l’audit con 40 uva e un solo trasportatore, i segmenti a monte ricevono incarichi prima del mercato→Torchio: la produzione aspetta anche quando il mercato ha già abbastanza uva. Il comportamento richiede una prova mirata di priorità; non si deduce dai numeri CPU. La massima mappa per smartphone resta aperta fino alla prova fisica.

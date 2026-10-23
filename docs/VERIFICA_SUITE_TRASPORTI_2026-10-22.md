# Verifica generale dopo la correzione dei trasportatori

Ramo locale `codex/remote-haul-suite-gate`, base `a52f762`. Suite completa eseguita con `nice -n 15 node --test --test-concurrency=6 tests/*.cjs`: **358/358 test superati, 0 falliti**, durata 588.865 ms sul server condiviso. Comprende il nuovo test di sovrapposizione al reload, le prove di fabbrica con seme fisso e la conservazione del vino del Torchio mentre la quota comunitaria viaggia in parallelo.

Il test di rotte remote su 512/1024 e la prova browser mobile simulata sono registrati nella tappa precedente. La suite prova logica e compatibilità, non FPS né qualità touch sullo Xiaomi Redmi Note 10. Nessuna nuova funzione in questa tappa; il massimo della mappa resta aperto fino alla prova fisica.

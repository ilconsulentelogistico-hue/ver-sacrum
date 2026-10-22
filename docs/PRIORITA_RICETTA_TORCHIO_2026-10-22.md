# Priorità di produzione del Torchio

Nel pannello **Collegamenti e produzione** del Torchio il giocatore può scegliere **Automatica (prima uva)**, **Vino** o **Olio**. La scelta vale per i lotti successivi e resta nel salvataggio dell’edificio. Un lotto già avviato finisce con gli ingredienti già prelevati. Se manca la materia prima preferita, il Torchio usa l’altra ricetta disponibile; non crea né duplica merci. La priorità non si applica agli altri laboratori.

I vecchi salvataggi senza `preferredRecipeId` mantengono l’ordine precedente. La validazione rifiuta ID di ricetta sconosciuti e non cambia il formato v5. `tests/press-recipe-priority.cjs` copre ordine, ripiego, continuità del lotto e salvataggio. Una prova nel browser mobile simulato 393×873 mostra il selettore Olio e l’impostazione applicata; screenshot `/home/ubuntu/codex-gh-lavoro/ver-sacrum-torchio-priorita.png`. L’unico 404 della prova è la favicon mancante.

Suite completa: 337/337, zero errori. `node --check` dei moduli toccati e `git diff --check` positivi.

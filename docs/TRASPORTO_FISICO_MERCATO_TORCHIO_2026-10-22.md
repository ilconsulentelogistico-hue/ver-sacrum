# Mercato → Torchio: ingredienti trasportati

Per il **Torchio del giocatore**, il rifornimento automatico dal mercato collegato ora assegna un abitante libero già esistente. Il carico viene prelevato fisicamente, attraversa la mappa e arriva nel deposito del Torchio. Fino all’arrivo, la ricetta non dispone dell’ingrediente. Il trasporto è limitato alla scorta prevista per due lotti della ricetta, senza riempire il Torchio con tutte le merci del mercato. La scelta Vino/Olio resta valida: entrambe le materie prime possono arrivare, poi la priorità decide quale lotto iniziare. Una seconda consegna dello stesso ingrediente non viene avviata mentre la prima è in viaggio.

La funzione `assignHaul` accetta un limite opzionale `autoMax` solo per i collegamenti automatici, validato nel salvataggio e inoltrato anche dal wrapper dei villaggi neutrali. I trasporti manuali mantengono il comportamento precedente. Se manca un abitante libero o il link si chiude prima del prelievo, l’input resta al mercato. I mercati neutrali e le altre fabbriche non cambiano in questa tappa. I tratti magazzino→mercato e Torchio→destinazione sono ancora istantanei.

Test `tests/physical-market-press.cjs`: 2/2, compresi limite di 8 uva, carico reale, salvataggio durante il viaggio, mancanza di addetto e link chiuso. Suite completa: 343/343, zero errori; sintassi e `git diff --check` positivi.

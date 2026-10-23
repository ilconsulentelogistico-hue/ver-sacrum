# Priorità delle consegne al Torchio

Quando un solo abitante trasporta una scorta abbondante, l’ordine precedente di `settlementTick()` gli assegnava ripetutamente i viaggi a monte: campo→magazzino prima, magazzino→mercato poi, e solo alla fine mercato→Torchio. Con 40 uva nel campo il Torchio poteva aspettare pur avendo uva già al mercato.

Ora un breve controllo preliminare, limitato ai **Torchi del giocatore**, usa prima la merce già presente nel mercato; se manca, porta quella già nel magazzino al mercato; altrimenti lascia che il normale collegamento campo→magazzino inizi. La ricetta preferita dal giocatore determina quale frutto viene spedito per primo se entrambi sono pronti. Tutti gli spostamenti continuano a usare `assignHaul`, persona, carico, percorso e prenotazioni esistenti. Gli altri laboratori e villaggi neutrali conservano il loro ordine.

Test `tests/press-haul-fairness.cjs`: 2/2. Con un solo trasportatore e 40 uva, i primi tre incarichi effettivi sono campo→magazzino, magazzino→mercato, mercato→Torchio; il primo lotto parte mentre il campo contiene ancora uva. Quantità totali conservate includendo ingredienti del lotto in corso. Se preferito Olio, la prima consegna dal mercato porta olive. Gruppo economico mirato: 53/53, zero errori.

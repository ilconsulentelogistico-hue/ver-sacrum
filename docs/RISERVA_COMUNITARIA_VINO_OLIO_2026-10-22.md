# Vino e olio comunitari nel magazzino

Il magazzino del giocatore ora trattiene vino e olio per impostazione predefinita. Il vecchio flag **Esporta eccedenze** resta valido per le altre merci; per vino e olio serve anche la scelta esplicita **Vendi anche vino/olio della comunità** nel collegamento magazzino↔mercato. Il controllo compare solo per queste due merci e questo tipo di collegamento. Una volta attivato, valgono ancora la scorta minima, il limite per aggiornamento e la capacità del mercato.

La nuova proprietà facoltativa `sellCommunal` parte assente e viene interpretata come `false`: anche i vecchi salvataggi con `export:true` trattengono la quota, senza alterare il formato v5. Valori malformati sono rifiutati dalla validazione. La prova integrata su mappa 512 è stata aggiornata e passa senza soglia manuale.

Test `tests/community-wine-oil-reserve.cjs`: 2/2, compresi vecchio save, scelta esplicita, visibilità del controllo e valore non valido. Gruppo economico mirato: 51/51, zero errori. Suite completa precedente: 343/343.

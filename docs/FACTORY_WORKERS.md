# Lavoratori e mestieri — Build 41

Mulino e forno richiedono una persona assegnata e fisicamente presente. Il mestiere
è salvato nell'ordine persistente della stessa persona (production con ID della
fabbrica e professione); non viene creata una copia del residente.

Riassegnare la persona annulla il lavoro precedente e la rimuove dal vecchio
edificio. Input e output restano negli inventari locali. Un batch già iniziato
conserva input, quantità e tempo residuo quando il lavoratore viene interrotto;
un sostituto riprende lo stesso batch, che può produrre l'output una sola volta.

La schermata **Filiera** consente di scegliere per nome abitante e fabbrica. I
tempi ricetta attuali restano parametri provvisori configurabili.

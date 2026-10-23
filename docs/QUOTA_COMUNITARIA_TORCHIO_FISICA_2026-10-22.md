# Quota comunitaria del Torchio: consegna fisica

La quota di vino e olio destinata alla comunità (`returnDue`) ora parte dal Torchio del giocatore su un abitante libero. Il magazzino è ammissibile solo attraverso un mercato collegato sia al Torchio sia al magazzino e riconosciuto come deposito comunitario. Il carico viaggia fisicamente dal Torchio al magazzino; i collegamenti intermedi controllano l’autorizzazione della rotta. L’importo dovuto resta registrato durante il viaggio e scende **solo della quantità davvero consegnata**. Se manca un addetto, lo spazio o il collegamento, il prodotto e la quota restano al Torchio.

La rotta usa i campi persistenti `autoVia` e `autoDue` del trasporto automatico. In caso di link chiuso prima del prelievo, l’incarico viene annullato senza spendere merce né ridurre la quota. Il carico a metà viaggio e la quota sono conservati dal salvataggio. Il trasportatore percorre la via più breve fra Torchio e magazzino; il mercato è il nodo logico che abilita la consegna, non una fermata obbligatoria.

Test `tests/physical-press-community.cjs`: 2/2 (3 vino dovuti, save/load in viaggio, consegna unica e link intermedio chiuso). Gruppo economico mirato: 47/47, zero errori. Suite completa precedente: 343/343.

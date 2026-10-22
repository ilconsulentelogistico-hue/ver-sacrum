# Audit: perché ai neutrali manca un fornaio

Su seed 123456, ogni villaggio inizia con tre persone: una in campo, una alla raccolta, una al mulino. La regola di crescita richiede due persone con domicilio, razioni attive, mercato collegato e almeno 18 razioni di riserva per accogliere una nuova identità dopo 150 giorni favorevoli. I lavoratori fuori casa mantengono `homeVillageId`, quindi i due artigiani contano ancora come domiciliati.

Due ostacoli verificati nel codice vivo:

1. Il Clan del Guado ha casa a (14,5; 4,5) e mercato a (15,5; 23,5) dopo la normalizzazione: il collegamento da 12 celle è chiuso. Il requisito del mercato per la crescita non può riuscire. La casa è stata spostata lontano perché la zona vicina è piena di nodi naturali; un insediamento preesistente deve riservare terreno edificato e registrare l'eventuale clearing, conservando ID e residenti.
2. La politica alimentare standard trattiene 30 unità nel magazzino. Gli stock iniziali neutrali sono 18–28: il mercato riceve zero cibo finché un raccoglitore non supera la soglia. Le persone collegate a casa o bottega cercano razioni nel mercato, quindi possono restare senza cibo mentre il magazzino ne contiene. Serve una quota alimentare fisicamente trasferita al mercato, con riserva per la comunità.

Correggere i due collegamenti in tappe distinte, poi verificare una crescita reale prima di aggiungere un forno. Nessun codice di gioco cambiato nell'audit.

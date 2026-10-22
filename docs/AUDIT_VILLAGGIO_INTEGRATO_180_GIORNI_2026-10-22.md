# Villaggio integrato: 180 giorni e salvataggio

Seed 123456, partenza con villaggi neutrali. Il Clan del Guado ha tre persone sane al giorno 120: un contadino, un mugnaio e una persona in raccolta; il magazzino locale ha 23 cibo. Prima della correzione, l'adesione annullava tutti e tre i lavori. Dopo 90 giorni le persone erano ferme; il caricamento creava di nuovo tre persone e tre edifici della vecchia fazione perché cercava solo un totem con proprietario neutrale.

Ora l'adesione conserva i lavori locali e i loro elenchi di personale. Solo una carovana in corso viene fermata, con il carico che rimane alla persona. Il caricamento riconosce la casa comune integrata tramite `integratedFromOwner` e non rigenera la fazione. Dopo altri 180 giorni, con un salvataggio al giorno 210: tre persone originali, tutte sane e non affamate; contadino e mugnaio ancora al lavoro; nessun edificio del vecchio proprietario; magazzino locale con 24 cibo e 3 grano al giorno 300. Test automatico `tests/integrated-village-long.cjs`. Fauna ostile e incursioni escluse in questa prova, per isolare la continuità dell'economia.

L'adesione non introduce un governatore automatico: il giocatore può assegnare nuovi lavori, mentre quelli già attivi proseguono. La crescita e la difesa richiedono altre verifiche con minacce attive.

# 180 giorni dopo la rivolta

Prova con economia, movimento e razioni attivi dal giorno 180 al 360, salvataggio e caricamento al giorno 270. Per isolare il villaggio si tengono alimentati gli abitanti del giocatore e si disattivano nuove incursioni; quelli ribellati consumano le proprie scorte reali. Al giorno 360 i tre abitanti originari sono vivi e nutriti, contadino e mugnaio lavorano ancora. Con seme 123456, il grano iniziale 18 viene consumato dal mulino e diventa 166 farine mentre il cibo locale passa da 24 a 55; nessun ID perduto. Stock identico immediatamente prima e dopo il caricamento.

Una seconda resa militare al giorno 360 conserva identità, edifici e scorte, cancella l\x27etichetta storica di rivolta e ricomincia l\x27assestamento. Se la fiducia resta a zero, un nuovo preavviso comincia al giorno 450 e la comunità si ribella di nuovo al giorno 540; ancora nessun duplicato e save valido. Il test usa il seme fisso 123456 e verifica la somma grano+farina, perché il mulino consuma il grano prodotto. In `tests/post-rebellion-long.cjs`.

La prova riguarda il ciclo economia/occupazione della fazione 1 in una partita simulata; non sostituisce una verifica lunga sul Redmi Note 10 fisico.

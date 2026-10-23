# Uscite degli alloggi prima della rivolta

Il passaggio di proprietà è rinviato se anche un solo residente che deve cambiare casa non trova un\x27uscita libera. Prima di muovere qualcuno, `rebellion.js` prenota una casella d\x27uscita distinta per ciascun residente incompatibile, usando le porte già calcolate dal gioco e le stesse regole di spazio libero. Solo dopo la prenotazione completa chiama il rilascio delle persone e cambia fazione.

Nel caso con un abitante del giocatore nella casa ribelle e un abitante originario in una casa del giocatore, bloccare le uscite della seconda casa lascia entrambi ancora residenti: nessun trasferimento parziale e salvataggio valido. Sbloccando le uscite, la stessa rivolta procede. Test in `tests/occupation-rebellion.cjs`. La prova usa il seme fisso 123456.

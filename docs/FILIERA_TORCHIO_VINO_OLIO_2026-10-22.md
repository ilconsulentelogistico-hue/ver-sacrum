# Filiera del Torchio: vino e olio

Le colture Vite e Olivo già presenti ora possono alimentare un **Torchio** da 80 unità di scorta. Il Torchio è costruibile con 18 legno e 8 pietra dopo il sapere base d'insediamento. Con un addetto presente e nutrito, trasforma 4 uva in 2 vino oppure 4 olive in 2 olio in 12 secondi nominali; se entrambi gli input sono disponibili, esegue prima l'uva e poi le olive. Quantità, tempi e costi sono parametri provvisori di gameplay. Non attribuiscono una tecnologia uniforme a Umbri, Sanniti e Irpini.

Il lavoro usa `RECIPES` e `updateBuilding` comuni alle altre fabbriche: preleva merci reali dalla scorta locale quando parte un lotto, prenota il volume dell'output, si ferma senza addetto e produce una sola volta alla fine. La nuova skill personale **Spremitura** cresce al termine dei lotti e migliora la velocità come le altre competenze artigianali; resta alla persona dopo il cambio lavoro. Vino e olio sono merci depositabili, trasportabili e barattabili, con prezzo indicativo; per ora non sono razioni né cure.

Vecchi salvataggi v5: nuova skill al livello 1, domanda di vino/olio a 1 nei mercati già esistenti, nessuna merce inventata. La validazione accetta il mestiere «torchiatore» e i due nuovi tipi di merce. L'asset `building_press_p16.png` (48×48 RGBA) è generato da `sources/press-genera.py`, con tinozza in pietra, trave in legno e cassette di uva/olive, nello stile dei piccoli edifici esistenti. Cache offline 196.

Verifica: `tests/press-wine-oil.cjs` controlla due lotti fisici, assenza di input/addetto, XP, reload, vecchi salvataggi e PNG. Browser mobile simulato 393×873: immagine e pulsante caricati, zero errori JS; screenshot nell'area Codex. La suite completa passa 333/333, zero errori.

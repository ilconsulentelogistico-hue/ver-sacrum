# Cache grafica del terreno P16

Il disegno P16 originale resta l'unica sorgente dei colori e dei dettagli. Ogni blocco di terreno viene disegnato una volta su una piccola tela di 8×8 tile, poi riutilizzato durante lo scorrimento. Gli sprite di risorse, persone, animali ed edifici continuano ad essere disegnati a ogni frame sopra il terreno.

La cache conserva al massimo 128 immagini, circa 28 MiB di pixel non compressi se tutte sono complete. Strade, biomi e quote modificati invalidano il rispettivo blocco. Una partita nuova o caricata usa un nuovo mondo e una nuova cache. Allo zoom ravvicinato oltre 1,55 il gioco usa il disegno per tile, perché la griglia diagnostica deve mantenere la sua larghezza originale. Senza supporto per tele ausiliarie resta il disegno precedente.

`terrainPictureStats()` espone il numero di immagini, costruzioni e riusi per verifiche. La mappa resta 88×88; la cache riduce il lavoro ripetuto del disegno ma non rende da sola pronta una mappa grande né sostituisce la prova fisica sul Redmi Note 10.

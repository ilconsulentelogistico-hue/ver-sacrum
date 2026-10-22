# Rotte neutrali sulle mappe grandi

Sulle mappe fino a 128 caselle resta la ricerca già usata dal gioco. Sulle mappe 256 e 512, le carovane neutrali preparano la rotta tra i mercati con una ricerca a priorità guidata dalla distanza, massimo 48 caselle per giorno simulato. Il calcolo resta in memoria, è riutilizzato, e riparte dopo un caricamento; nel salvataggio rimangono solo le rotte delle carovane effettivamente partite. Prima della partenza il percorso viene ricontrollato contro il terreno e gli edifici attuali. La persona, il carico e il baratto restano fisici.

Seed 123456: pianificazione Guado→Colline su 256 caselle in 37 blocchi, 1.750 caselle visitate e percorso di 498 passi; su 512 in 81 blocchi, 3.860 caselle e 1.076 passi. Picco del singolo blocco nella prova isolata: 18,29 ms e 20,49 ms sul server condiviso. Su 600 giorni con due villaggi agricoli, picco dell'aggiornamento 82,19 ms (256) e 180 ms (512); nessuno oltre 200 ms, contro 31 e 28 prima della correzione. Al giorno 600 parte almeno una carovana per ciascun villaggio agricolo su entrambe le mappe. I valori assoluti non equivalgono a FPS misurati sul Redmi Note 10.

Limiti: la ricerca può impiegare più giorni di gioco e usa una rotta valida, non necessariamente la più corta. Un ostacolo costruito dopo la partenza usa ancora la gestione ordinaria delle carovane; da verificare in una tappa separata. Le partenze al giorno 600 non dimostrano ancora arrivo, ritorno o conservazione delle merci su itinerari molto lunghi.

Verifica finale: suite completa 296/296, nessun errore.

# Audit: percorso delle merci del Torchio

Nello stato attuale `settlementTick()` chiama `moveLinkedGoods()` per campo→magazzino, magazzino→mercato, mercato→Torchio e Torchio→magazzino/mercato. Il metodo sottrae subito dalla scorta di origine e aggiunge subito a destinazione, senza persona, tempo o capienza del carico. I collegamenti entro 12 tile regolano l’accesso ma non misurano il viaggio. Non è un difetto di conservazione delle scorte; è una scorciatoia di simulazione.

Riproduzione sul seed 123456: quattro edifici completi del giocatore, in fila sulle caselle x=50..53 (campo Uva, magazzino, mercato, Torchio); 4 uva nel campo, 0 altrove. Dopo **un solo** `settlementTick()`, le scorte diventano `[0,0,0,4]`, con tutti e tre i collegamenti aperti. Nessun abitante ha trasportato l’uva. Il passaggio Torchio→magazzino usa la stessa primitiva. La logistica manuale `assignHaul` è già fisica; il limite riguarda la logistica automatica dei collegamenti.

Prima correzione consigliata: consegne automatiche con trasportatori esistenti, carico reale, prenotazione e arrivo verificato, senza spawn gratuito. Procedere per un segmento alla volta e non cambiare le regole del baratto. Il confronto sullo Xiaomi Redmi Note 10 resta aperto per la taglia massima della mappa.

# Razioni fisiche nei mercati neutrali

All'inizio della partita e poi ogni giorno, un mercato neutrale collegato riceve cibo dal proprio magazzino fino a tre razioni per abitante; il magazzino conserva almeno due razioni per abitante. Il trasferimento usa `moveLinkedGoods`, quindi scala davvero il magazzino e riempie il mercato, rispettando quantità disponibili e capacità. Se le scorte sono sotto riserva o il collegamento è chiuso, il mercato non riceve nulla.

Seed 123456: i tre villaggi passano da (24,18,28) unità tutte in magazzino a 9 nei rispettivi mercati e (15,9,19) nei magazzini; i totali restano (24,18,28). Un mugnaio nutrito può così lavorare. Test con mercato vuoto, magazzino sotto riserva, rifornimento ripetuto e assenza di duplicazioni. Browser mobile emulato: quantità coerenti, zero errori. Script in `Rtsmobile-ricerca/browser-razioni-neutrali/`.

La casa del Clan del Guado può ancora essere scollegata dal mercato su certi seed: il suo collegamento resta la prossima tappa. Il movimento di razioni fra strutture collegate usa la logistica locale automatica già adottata dal gioco. Suite completa 274/274; Redmi fisico non ancora misurato.

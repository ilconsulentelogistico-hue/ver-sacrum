# Trasporto dei materiali al forno neutrale

Il cantiere nasce vuoto. La quarta persona del villaggio esce dalla casa, preleva legno e pietra dal proprio magazzino, li porta nella borsa fino al sito e ripete i viaggi fino a 16+16 materiali. Ogni prelievo è limitato alla quantità ancora richiesta: una borsa capiente non consegna materiale in eccesso. Solo quando `siteReady` trova entrambe le scorte nel cantiere, la stessa persona riceve il lavoro di costruzione. Completato il forno, diventa fornaio mantenendo ID, domicilio ed esperienza in Trasporto e Costruzione.

Il luogo del forno viene scelto vicino al magazzino fra le posizioni collegate al mercato e alla casa e raggiungibili dal residente e dal deposito. Questo evita di far percorrere quattro viaggi lungo il perimetro del villaggio quando esiste un sito più vicino. Le merci restano sempre in un nodo, magazzino, borsa o cantiere; dopo i lavori soltanto il costo 16 legni + 16 pietre per forno è consumato.

Seed 123456 senza incursioni/fauna: secondo villaggio sito al giorno 190, materiali completi al 210, forno al 226, fornaio al 227. Primo villaggio sito al 197, materiali completi al 266, forno al 282, fornaio al 283. Al giorno 320 entrambi hanno pane e quattro persone sane. Il test controlla che l’ID del trasportatore al giorno 200 sia quello del fornaio finale, l’esperienza acquisita, la conservazione delle risorse al netto dei costi, salvataggio e distruzione. Chromium mobile 390×844 ai giorni 210 e 320: zero errori; screenshot in `Rtsmobile-ricerca/browser-trasporto-forno/`.

Campo e mulino dei villaggi nuovi restano infrastrutture iniziali complete. Il loro trattamento è la prossima valutazione separata, perché bloccare il mulino significherebbe fermare la crescita e il forno.

Durante la suite è emerso un test di guarigione non deterministico: la sua fixture usava il seed corrente, perciò in alcuni mondi la casa non aveva uscita. Il test ora usa il seed fisso 321; la regola di guarigione non è stata modificata.

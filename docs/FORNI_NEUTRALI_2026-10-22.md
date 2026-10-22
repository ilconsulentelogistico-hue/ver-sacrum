# Forni dei villaggi neutrali

I due villaggi con campi e mulino ottengono un forno solo dopo avere almeno quattro persone e un residente libero nella casa. Il forno viene collocato su terreno valido, raggiungibile e collegato sia al mercato sia alla casa. La persona esce fisicamente dal villaggio, conserva identità e domicilio, raggiunge il forno e assume il mestiere di fornaio. Se il forno viene distrutto non ricompare gratis. Il terzo villaggio non ha ancora questa filiera.

Le ricette esistenti consumano 2 farine di grano per 2 pani o 2 farine d’orzo per 3 pani. La logistica collega mulino → mercato → forno; il pane torna ai depositi attraverso le stesse regole fisiche. Servono lavoratore presente e razionato, input, spazio e tempo di lavorazione. L’edificio è ancora assegnato come infrastruttura iniziale dell’IA senza costo di costruzione: costruzione neutrale con materiali e muratore è una tappa distinta.

Prova autonoma seed 123456, 260 giorni senza incursioni/fauna: al giorno 180 nessun forno, al 260 i villaggi 1 e 2 hanno quattro persone, un fornaio ciascuno e rispettivamente pane di grano e d’orzo nelle scorte. Identità, link, reload e distruzione controllati in `tests/neutral-settlements.cjs`.

Prova Chromium mobile 390×844: scheda del forno del Clan del Guado con artigiani 1/1, farina 4, lotto da 2 pani in lavorazione, zero errori pagina. Screenshot e script in `Rtsmobile-ricerca/browser-forni-neutrali/`.

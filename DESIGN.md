# Terra Italica — principi di progetto

Questa codebase nasce da zero per smartphone e non eredita il rendering isometrico del progetto PC `rts`.

## Identità
- RTS sandbox ambientato nell'Italia preromana, non arena tower-defense.
- Il territorio è un sistema: bioma, fertilità, acqua, rilievo e stagioni modificano le decisioni.
- Le persone sono individui con statistiche, abilità, inventario, salute e compiti persistenti.
- Le risorse sono fisiche: raccolta, carico, viaggio verso un deposito, scarico e ritorno al lavoro.
- Agricoltura, domesticazione, costruzione, popolazione e guerra appartengono alla stessa simulazione.
- Mindustry è un riferimento per leggibilità dei flussi, automazione e immediatezza touch, non per l'ambientazione o per nastri/torrette industriali.

## Vertical slice implementata
- mappa procedurale 88×88 con mare, costa, fiume, prateria, bosco, macchia, pianura, Appennino e palude;
- cinque abitanti iniziali con forza, intelligenza, salute, capacità di carico e skill;
- legna, cibo, pietra e ferro come nodi esauribili;
- raccolta e deposito fisici con ritorno automatico al lavoro;
- sentieri, magazzino, distretto, campo, palizzata e torre;
- cantieri realizzati da un abitante e progressione della skill costruzione;
- calendario dal 1000 a.C., stagioni e resa agricola legata a fertilità/acqua/periodo dell'anno;
- pecore, lupi, domesticazione e comportamento difensivo degli abitanti;
- incursioni periodiche, combattimento, fortificazioni e game over;
- crescita della popolazione tramite distretti e disponibilità alimentare;
- salvataggio locale, autosave, caricamento, pinch zoom, pan e layout portrait/landscape;
- PWA e deploy statico su GitHub Pages.

## Regola per le prossime iterazioni
Ogni nuovo sistema deve integrarsi con la simulazione esistente. Evitare scorciatoie astratte quando è possibile mostrare un processo nel mondo: se il cibo viene prodotto, qualcuno deve raccoglierlo e trasportarlo; se una struttura nasce, qualcuno deve costruirla; se una comunità cresce, deve esserci capacità abitativa e cibo.

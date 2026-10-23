# Audit dei costi edilizi dei villaggi neutrali

Fonte viva: `neutral.js`, `game.js`, `settlement.js`, `construction-knowledge.js`; verifica sul seed 123456. I tre nuclei iniziali (totem, casa, mercato) sono l’avvio della partita. In seguito l’IA crea campi, mulini e forni con `new Building(..., true)`: il terreno viene controllato, ma legno, pietra, sapere e lavoro di costruzione non sono pagati. La produzione dentro campo, mulino e forno invece usa risorse e persone reali.

| Edificio | Costo standard | Situazione neutrale attuale |
|---|---:|---|
| Campo | 10 legno | creato completo all’avvio |
| Mulino | 20 legno + 12 pietra | creato completo all’avvio nei villaggi agricoli |
| Forno | 16 legno + 16 pietra | creato completo dopo il quarto abitante |

Al giorno iniziale del seed 123456 i magazzini neutrali hanno rispettivamente: Clan del Guado nessun legno/pietra; Lega delle Colline 12 pietre e nessun legno; Genti Neutrali 10 legni e nessuna pietra. Entro 16 celle dai primi due magazzini esistono nodi naturali di legno e pietra. Al giorno 260 il clan e la lega hanno quattro persone: due lavorano in campo e mulino, una è spesso impegnata nella raccolta del cibo, la quarta è il fornaio. Per rendere fisica la costruzione, la quarta persona deve prima procurare i materiali e lavorare al cantiere, poi passare al forno.

Il cantiere del giocatore richiede `requiredMaterials`, li consuma una sola volta tramite `consumeSiteMaterials`, e un costruttore aumenta l’avanzamento. Il comando ordinario assegna l’intero costo dal magazzino al cantiere all’apertura: le quantità sono conservate ma il trasporto non ha ancora un portatore. Il sapere `fornace` richiede Costruzione 4; un nuovo abitante neutrale parte da 1 e la conoscenza tribale attuale è globale, non separata per fazione. Un semplice addebito del costo bloccherebbe entrambi i forni; occorrono raccolta con persona identificata, costo locale atomico, cantiere e una regola esplicita del sapere neutrale.

Sequenza prudente: 1) far raccogliere legno e pietra da un neutrale libero senza sottrarlo alla raccolta alimentare; 2) usare quelle scorte per un cantiere neutrale reale con un costruttore che conserva ID; 3) farlo diventare fornaio solo a lavori conclusi; 4) considerare separatamente i campi e mulini iniziali e il problema del trasporto fisico dei materiali.

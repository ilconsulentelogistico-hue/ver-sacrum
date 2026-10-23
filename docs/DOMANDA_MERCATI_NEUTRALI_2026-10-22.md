# Domanda dei mercati neutrali

La domanda giornaliera di una merce considera le quantità disponibili nel mercato e nei magazzini della stessa comunità che sono collegati al mercato e al totem. Le prenotazioni già impegnate non contano. Chiudere il collegamento esclude il magazzino dal calcolo. La formula provvisoria resta `clamp(1,5 − scorta/60, 0,5, 3)`.

Il calcolo cambia il segnale di domanda, non sposta merci e non crea scorte. Il baratto richiede ancora che la merce richiesta sia fisicamente nel mercato di arrivo. La produzione periodica gratuita dei neutrali resta un problema separato, identificato nell'audit precedente.

Test dedicato: 60 grani nel magazzino, zero al mercato, domanda 0,5; collegamento chiuso, domanda 1,5; inventari invariati. Suite completa 266/266. Nessuna prova su Redmi fisico.

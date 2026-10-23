# Riserva alimentare per la crescita neutrale

Il rifornimento fisico del mercato mira ora almeno alla soglia richiesta dalla regola di accoglienza: 18 razioni per la nuova persona, più la copertura degli abitanti già domiciliati e una unità di margine. Il magazzino conserva due razioni per abitante. Se manca merce, il mercato riceve solo quanto esiste e la crescita resta bloccata. Il trasferimento usa lo stesso `moveLinkedGoods` della logistica locale.

Nel test, il mercato del Clan del Guado riceve cibo consegnato come fixture al magazzino: la somma degli inventari non cambia col trasferimento. Dopo 149 giorni favorevoli non compare nessuno; al 150° una sola nuova persona con ID entra nel villaggio e 18 razioni spariscono dagli inventari. Reload conserva ID e popolazione. La prova browser usa la stessa consegna controllata: popolazione 3→4, cibo totale 31→13, casa collegata, zero errori. Screenshot e script in `Rtsmobile-ricerca/browser-crescita-neutrali/`.

Questa verifica dimostra la regola di crescita con cibo realmente contabilizzato. Non dimostra ancora che un raccoglitore autonomo sostenga 150 giorni consecutivi in una partita completa; quella è la prossima prova. Suite completa 276/276; telefono Redmi non ancora misurato.

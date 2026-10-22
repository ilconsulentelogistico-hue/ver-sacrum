# Simulazione vicina e lontana

Il blocco visibile dalla camera e un margine di un blocco sono aggiornati a ogni frame. Fuori da quest'area gli abitanti inattivi e le pecore non assegnate ricevono un aggiornamento ogni 0,25 secondi di tempo di gioco. Il tempo trascorso viene accumulato sul singolo attore e salvato; quando la camera si avvicina, il residuo viene applicato subito. Pausa e caricamento non consumano né duplicano quel tempo. Se nel frattempo un abitante riceve un ordine, il tempo inattivo non viene attribuito al nuovo lavoro; il vecchio recupero del tempo di attesa riguarda solo il suo cooldown.

Lavoratori, persone con ordini, pecore che sono obiettivo di un ordine, lupi, razziatori ed edifici restano a frequenza piena. Anche un abitante inattivo torna alla frequenza piena se una minaccia arriva entro 5 tile. Questo limita il cambio di comportamento ai soli attori passivi lontani. I test controllano il tempo accumulato, gli obiettivi, la produzione, la pausa e la ripresa dal salvataggio.

Le ricerche di collisione delle risorse ora leggono i bucket locali, e `findById` usa la mappa ID delle risorse. La generazione e rigenerazione delle risorse restano globali: sono operazioni di avvio e di giorno, non per frame. La mappa resta 88×88 e la frequenza lontana non sostituisce una futura simulazione economica ad eventi per grandi civiltà.

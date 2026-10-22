# Mulini dei villaggi neutrali

Il Clan del Guado e la Lega delle Colline hanno ciascuno un mulino iniziale su terreno libero entro 12 celle dal mercato. Il mulino usa le ricette esistenti e richiede un mugnaio reale: un residente esce dal villaggio conservando ID e domicilio. Se il mercato non ha cibo o cereale, la bottega aspetta; non riceve input artificiali. Un mulino distrutto non ricompare gratuitamente; i salvataggi conservano struttura e lavoratore.

Prova con seed 123456: il mercato consegna cereali al mulino, il lavoratore nutrito e presente avvia il lotto. Grano 2 → farina 2; orzo 2 → farina d'orzo 3. Senza lavoratore al mulino il lotto non parte. Il test somma gli inventari di tutti gli edifici del villaggio prima e dopo il trasferimento per verificare che non si duplichino merci. Test mirati 13/13; suite completa 273/273.

Browser mobile emulato: entrambi i mulini visibili, collegati ai mercati, con mugnaio assegnato; zero errori. Screenshot e script in `Rtsmobile-ricerca/browser-mulini-neutrali/`. Il forno resta per la tappa successiva; prima serve una regola per condividere i lavoratori o attendere la crescita della popolazione.

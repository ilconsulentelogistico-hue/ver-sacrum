# Disegno delle risorse nelle viste dense

Con seed 123456 e viewport mobile 393×873, ho caricato tutti i blocchi risorse delle mappe sperimentali, poi cercato la vista con più nodi nel rettangolo visibile. Sulla 256 sono 232 nodi in 13×20 tile (13.534 in tutta la mappa); sulla 512 sono 239 (51.356 in tutta la mappa). Questo è uno stress di disegno e memoria, non il normale avvio a blocchi.

Prima della modifica, sulla 256 il disegno delle risorse nella vista densa costava 6,6–7,1 ms al p95 in due ripetizioni; con immagini da 16×16 tile invece di 8×8 è sceso a 1,7–2,8 ms. La cache mantiene massimo 24 immagini grandi, circa 26 MiB di pixel grezzi nel caso peggiore. Il test verifica che due vecchi blocchi adiacenti condividano una sola immagine e che la cache resti entro il limite. I frame complessivi migliorano nelle prove, ma i tempi del server condiviso oscillano; la misura del solo disegno delle risorse è il confronto più utile.

Sulla 512 l'ingrandimento delle immagini non ha mostrato un vantaggio stabile e in una prova ha causato un picco. Qui restano le immagini da 8×8 tile e il limite precedente di 64; il test ne fissa il comportamento. La prova finale della vista densa 512 ha disegno risorse p95 1,9 ms e frame p95 33,5 ms, valori da verificare sul Redmi Note 10 fisico. Lo schermo del telefono e la presenza di 100/300 persone restano i criteri per scegliere la dimensione massima.

Script, risultati di più ripetizioni e screenshot in `Rtsmobile-ricerca/audit-resource-dense/`.

Verifica finale: suite completa 302/302, nessun errore.

# Scatto da ordine verso destinazione impossibile

Nel profilo 2048/300, uno dei 12 obiettivi era in mare. `findPath` esplorava tutte le 5000 celle consentite e occupava 89–106 ms. La traccia per chiamata mostra 5000 espansioni per quella destinazione, contro 30–50 per i percorsi validi vicini. L'analisi separata di preriscaldamento tile/JIT non riproduce lo scatto: il costo era una ricerca impossibile, non la generazione della mappa.

`findPath` ora verifica subito che la cella finale sia transitabile e non esclusa dal vincolo opzionale. Se è impossibile, restituisce percorso vuoto e registra zero espansioni. La stessa fixture dà 12,1 ms per il primo gruppo di 12 ordini invece di 89–106 ms; la destinazione in mare passa da 5000 a 0 espansioni. Test dedicato con destinazione bloccata e verifica degli hash dei tre percorsi validi già consolidati.

La misura è Chromium su server condiviso; la mappa 2048 resta sperimentale finché non è provata sul Redmi Note 10. Dati grezzi e script in `Rtsmobile-ricerca/prove-raster-2048-300/`.

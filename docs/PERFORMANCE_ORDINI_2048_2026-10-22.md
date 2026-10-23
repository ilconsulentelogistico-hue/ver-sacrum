# Profilo degli ordini sulla mappa 2048

Fixture in `Rtsmobile-ricerca/prove-raster-2048-300/ver-sacrum-repath-profile.cjs`: seed 123456, viewport 390×844, 300 abitanti vicino al centro, 54 in movimento; durante lo scorrimento locale vengono calcolati 12 nuovi percorsi ogni 500 ms per otto volte. È uno stress artificiale degli ordini, non una stima della frequenza normale di gioco.

Due esecuzioni Chromium sul server: 59,9–61,3 FPS mediani, fotogramma p95 30,2–30,6 ms, 2 fotogrammi oltre 50 ms per esecuzione; nessun errore JS. Il primo gruppo di 12 percorsi richiede 89–103 ms, i successivi 5–14 ms. Il primo picco può causare uno scatto percepibile; occorre misurarlo sul Redmi Note 10 prima di chiamare stabile la mappa 2048. La prova non è una misura fisica né include 300 lavori autonomi.

Script, due JSON e screenshot sono nel dossier di ricerca. Il percorso attuale ha già un limite di 5000 espansioni; non lo riduciamo senza verificare raggiungibilità e correttezza degli ordini. Prossimo passo tecnico: misurare il primo gruppo per distinguere compilazione JIT, streaming dei blocchi e ricerca del percorso, poi intervenire sul costo accertato.

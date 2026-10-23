# Prova di carico ripetibile della popolazione

Aprire in browser `?perf=1&worldSize=512&crowd=100` oppure `?perf=1&worldSize=512&crowd=300`. Aggiungere `&crowdArea=far` per tenere gli abitanti sintetici lontani dalla camera; senza il parametro stanno vicino al villaggio iniziale. Il seme è sempre 123456, anche dopo «nuovo mondo». Il campo `stressFixture` nel report `Copia report FPS` identifica numero, area e natura sintetica. La prova mantiene attivo il misuratore `?perf=1`.

I salvataggi e il caricamento della prova sono disattivati. Un salvataggio locale preesistente resta intatto; per la partita normale basta togliere `perf=1`. Con `crowd=300` senza `perf=1` non compare alcuna folla artificiale. Le persone aggiunte sono mobilitate e nutrite, quindi questa prova isola soprattutto il costo della loro presenza e del disegno; non rappresenta 300 lavoratori con incarichi reali.

Prova browser in emulazione mobile Chrome, 393×851 DPR 2, mappa 512, circa 2 secondi per caso: 100 vicini, mediana frame 31,5 ms e p95 105,6 ms; 300 vicini, mediana 48,2 e p95 132; 300 lontani, mediana 41,5 e p95 79,4. Campioni brevi, con creazione della mappa e oscillazioni del processo: usare questi numeri solo per confermare che la scena densa merita la prova fisica. Nessuna misura dello Xiaomi Redmi Note 10. Nessun errore JavaScript nei quattro casi. Un valore sentinella già nel salvataggio è rimasto identico dopo reload, save e nuovo mondo della prova.

Suite completa: 357/357; `node --check` e `git diff --check` positivi.

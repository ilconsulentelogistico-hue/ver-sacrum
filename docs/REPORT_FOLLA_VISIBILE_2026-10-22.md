# Come leggere il report prestazioni della popolazione

Con `?perf=1`, il report ora include `peopleVisible` e `peopleWorking` oltre a `people`. Il primo conta gli abitanti vivi che entrano nel margine visibile usato dal disegno; il secondo conta gli abitanti vivi con un incarico produttivo o logistico. `people` resta la popolazione totale. I valori sono istantanei al momento della copia; `frameP95Ms` descrive fino a 900 frame precedenti. Il misuratore senza `perf=1` resta spento.

Prova browser mobile simulato 393×851 DPR 2, mappa 512, fixture da 300 persone: vicino alla camera `peopleVisible=291`, lontano `peopleVisible=5`; `peopleWorking=4` in entrambi, perché i quattro abitanti iniziali mantengono i loro lavori e quelli sintetici sono mobilitati. Nessun errore JavaScript. Test modulo `performance.cjs` 3/3, script di verifica nella ricerca `audit-perf-visible-workers-2026-10-22/browser-check.cjs`.

Il report aiuta a confrontare scene equivalenti sul Redmi Note 10, ma nessuna misura su quel telefono è ancora stata raccolta. La mappa massima resta aperta.

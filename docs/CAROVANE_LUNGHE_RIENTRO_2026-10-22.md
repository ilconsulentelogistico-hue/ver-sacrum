# Carovane neutrali: viaggio completo su mappe grandi

Prova autonoma con seed 123456, mappe 256 e 512, fino alla prima carovana del Guado. Incursioni, fauna e autosalvataggio periodico disattivati; i mercati e le persone crescono con la simulazione normale. Poi è stata aggiornata soltanto la persona mercante, per separare la conservazione dello scambio dalla produzione quotidiana degli altri abitanti.

| Mappa | Giorno partenza | Aggiornamenti del mercante | Salvataggio a metà andata | Baratto | Rientro | Cibo nei due mercati + borsa | Cereale nei due mercati + borsa |
|---|---:|---:|---|---|---|---:|---:|
| 256 | 415 | 1.036 | riuscito | riuscito | riuscito | 219 → 219 | 49 → 49 |
| 512 | 412 | 2.053 | riuscito | riuscito | riuscito | 187 → 187 | 49 → 49 |

In entrambi i casi la borsa finale è vuota, la persona è la stessa e guadagna un punto esperienza in commercio. Il test ripetibile `tests/neutral-long-caravan.cjs` verifica anche l'orzo e il percorso dopo reload. La traccia con fasi e posizioni è in `Rtsmobile-ricerca/audit-carovane-lunghe/risultati.ndjson`.

Limite: questa prova isola il mercante dopo la partenza. Va ancora osservato il viaggio completo mentre scorre tutta l'economia e con un ostacolo costruito lungo la rotta. Il Redmi Note 10 reale resta da misurare.

Verifica finale: suite completa 298/298, nessun errore.

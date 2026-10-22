# T03 — Residenti, build 34

Un abitante resta sempre lo stesso record in `Game.units`. Entrando in un Distretto
cambia soltanto `location` da `world` a `resident`, con l'ID del Distretto. Salute,
skill, XP e carico rimangono sulla persona. L'ID compare una sola volta nell'elenco
`residents` dell'edificio; il validatore rifiuta collegamenti mancanti o duplicati.

Il comando touch **Entra** richiede un Distretto operativo, capienza (5) e un punto
raggiungibile. I residenti non vengono disegnati, selezionati a riquadro, attaccati
o proposti come trasportatori. Restano consultabili nell'elenco persone. Selezionando
il Distretto si può far uscire nominalmente ogni residente. Se non esiste terreno
libero, l'uscita non modifica lo stato e mostra il motivo.

Quando un Distretto è distrutto, il gioco prova a evacuare ogni residente mantenendo
identità e carico. Se il terreno è completamente bloccato, il rudere e il collegamento
restano persistenti finché un'uscita è possibile: nessuna persona viene persa o
duplicata.

Il salvataggio v5 usa `terra-italica-save-v5`; gli slot v4, v3 e v2 restano intatti.
La migrazione v4 crea elenchi residenti vuoti perché quel formato non supportava
ancora l'ingresso nei Distretti.

Verifica automatica: 7 regressioni residenti, 6 persone persistenti, 17 simulazioni,
controlli, debug e selezione con scorrimento. Ambiente Node VM/DOM simulato; il test
browser reale T01 resta separato e bloccato dall'assenza dell'eseguibile Chromium.

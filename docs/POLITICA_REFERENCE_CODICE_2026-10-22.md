# Influenza e integrazione: confronto sul codice

Fonte letta direttamente: `Rtsmobile-ricerca/7kaa/src/OTOWN.cpp`, funzioni `Town::update_target_resistance` (righe 1438-1505), `Town::update_resistance` (1545-1593), `Town::surrender` (1801-1831) e `Town::set_nation` (713-820). Confronto con `politics.js`, `neutral.js`, `tests/politics.cjs` del progetto. Le righe indicate appartengono alla copia locale della reference verificata il 22/10/2026.

In 7kaa un campo collegato e presidiato esercita influenza continua sul villaggio indipendente. L'influenza determina una resistenza obiettivo; la resistenza reale scende gradualmente e, quando arriva a zero, il villaggio si arrende. Il cambio di nazione aggiorna proprietario e rete del villaggio. È una lettura del codice, non una replica delle sue formule.

Nel gioco attuale dono e pressione cambiano subito tre valori, ma un'alleanza non dà accesso all'integrazione: i residenti e le strutture conservano sempre il vecchio proprietario. Mancano un processo graduale e una scelta esplicita di adesione. Il prossimo incremento dovrebbe far maturare l'adesione in modo osservabile, richiedere benessere/consenso e un legame concreto con la comunità del giocatore, quindi trasferire persone e beni senza duplicarli né azzerare le skill. L'azione militare deve restare un processo distinto. I test dovranno verificare proprietà, identità, inventari, skill e salvataggio.

Non assumere che il modello razziale/nazionale di 7kaa si adatti all'ambientazione preromana o all'idea di abitanti RPG: qui ogni persona rimane identificabile e con competenze permanenti.

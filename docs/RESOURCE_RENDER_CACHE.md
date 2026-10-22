# Cache grafica delle risorse

La mappa può mostrare centinaia di alberi, arbusti e triangoli di minerale. Gli SVG già approvati vengono composti una volta su tele trasparenti per blocco 8×8, con un bordo di 20 px che evita di tagliare le icone ai confini. Le tele vengono poi disegnate fra il terreno e gli edifici, nello stesso ordine generale della scena.

La cache conserva al massimo 64 blocchi, circa 20 MiB di pixel non compressi. Per ogni blocco visibile confronta ID, posizione, tipo, quantità e stato delle risorse: raccolta, esaurimento, ricrescita e nuove risorse ricompongono solo il blocco interessato. Al cambio mondo la cache riparte vuota. Finché gli SVG non sono pronti, oppure se mancano tele ausiliarie o i blocchi visibili superano la capacità, resta il disegno per risorsa precedente.

`resourcePictureStats()` espone costruzioni, riusi e numero di blocchi. La mappa giocabile resta 88×88; la cache agisce solo sul disegno, senza cambiare quantità o salvataggi.

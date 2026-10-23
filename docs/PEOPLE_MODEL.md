# T02 — Persistent people, build 33

`Game.units` is the authoritative population collection. Each Unit is a person,
not a disposable rendering entity. ID, health, skills, XP and inventory remain
on this one record. No parallel population or cargo copy is introduced.

`owner` is currently 0 (player). `location` is `{kind:'world', settlementId:null}`.
Only this location is supported in T02. Resident transitions and their simulation,
rendering, selection and combat filtering belong to T03; do not enable a resident
location until those consumers are implemented. Neutral ownership belongs to T18.

`occupation` derives from the current task type (or `idle`), not the transient
movement state. It is serialized for validation, but reconstructed as a getter
on load so cancelling/changing an order cannot leave a stale second assignment.

Save version 4 uses `terra-italica-save-v4`. Version 3 and version 2 slots remain
byte-for-byte untouched. Version 3 migration preserves IDs, orders, RNG and cargo;
the pre-existing version 2 import first builds a version 3 snapshot. Invalid
records are rejected before replacing the live world. A valid v3 backup may be
imported if its primary is corrupt. Startup prefers v4 and always resumes paused.

Validation: `node tests/people.cjs` (6 cases), `node tests/simulation.cjs` (17 cases),
`node tests/controls.cjs`, `node tests/debug.cjs`, `node tests/selection-scroll.cjs`.
These are Node VM/DOM simulations, not browser or hardware certification.
T01 remains blocked: installed Playwright has no Chromium executable; previously
failed browser downloads were not repeated without changed conditions.

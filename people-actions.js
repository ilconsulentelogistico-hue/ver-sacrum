// UI/UX redesign, lot D (Claude, 23/10/2026): «Impara da…» proposes the best master for
// the job a person does, towers and warehouses assign their own sentinel, a resident's
// card offers «Fai uscire» and «Arruola», and transports pick their ends on the map.
(() => {
  'use strict';
  const node = id => (typeof document !== 'undefined' ? document.getElementById(id) : null);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const CRAFT = {mill:'milling', sawmill:'carpentry', bakery:'baking', kiln:'pottery', loom:'weaving', foundry:'metallurgy', press:'pressing'};
  const MENTOR_GAP = 2; // grantMentoredWorkXp helps only a master two levels ahead.

  // The skill of what the person is doing now, or null when idle.
  Game.prototype.currentJobSkill = function(u) {
    const t = u?.task;
    if (!t) return null;
    if (t.type === 'gather') {
      const r = this.world.resources.find(n => n.id === t.target);
      return !r ? null : ['clay', 'copper', 'tin'].includes(r.type) ? 'stone' : Object.hasOwn(u.skills, r.type) ? r.type : 'food';
    }
    const b = this.buildings.find(x => x.id === t.target);
    if (t.type === 'farm') return 'farming';
    if (t.type === 'production') return CRAFT[b?.type] || null;
    if (t.type === 'livestock') return 'herding';
    if (t.type === 'build') return 'construction';
    if (t.type === 'haul') return 'transport';
    if (t.type === 'caravan') return 'trading';
    if (t.type === 'attack') return 'combat';
    if (t.type === 'tame') return 'taming';
    return null;
  };
  // Best master: in the current job if someone is two levels ahead, otherwise the largest gap.
  Game.prototype.bestMentorFor = function(u) {
    if (!u) return null;
    const others = this.units.filter(p => p !== u && p.owner === u.owner && p.health > 0);
    const labels = window.TERRA_SKILLS.labels, job = this.currentJobSkill(u);
    let best = null;
    for (const skill of Object.keys(labels)) for (const m of others) {
      const gap = (m.skills[skill] ?? 1) - (u.skills[skill] ?? 1);
      if (gap < MENTOR_GAP) continue;
      const score = gap + (skill === job ? 100 : 0);
      if (!best || score > best.score) best = {mentor:m, skill, gap, score, label:labels[skill], level:m.skills[skill], own:u.skills[skill] ?? 1, job:skill === job};
    }
    return best;
  };
  Game.prototype.learnFromBest = function(personId) {
    const u = this.units.find(p => p.id === personId && p.owner === 0 && p.health > 0);
    const best = this.bestMentorFor(u);
    if (!best) return 'Nessuno è almeno due livelli più bravo di lui in un mestiere.';
    const error = this.setWorkshopMentor(u.id, best.mentor.id);
    if (error) return error;
    // For healing the apprentice must stay beside the master; for the other crafts they work together.
    if (best.skill === 'healing' && u.location?.kind === 'world' && !u.mobilized && u.task?.type !== 'follow-mentor') this.toggleFollowMentor?.(u);
    return null;
  };
  const renderSkills = Game.prototype.renderSkills;
  Game.prototype.renderSkills = function(...args) {
    const result = renderSkills.apply(this, args);
    const u = this.units.find(p => p.id === this.skillsPersonId && p.owner === 0 && p.health > 0);
    const hint = node('skillsSuggestion'), button = node('learnFromBest');
    if (!u || !hint || !button) return result;
    const best = this.bestMentorFor(u), current = this.units.find(p => p.id === u.mentorId);
    if (!best) {
      hint.textContent = current ? `Maestro attuale: ${current.name}. Nessuno è più bravo di due livelli in un altro mestiere.` : 'Nessuno è almeno due livelli più bravo di lui: per ora impara lavorando.';
      button.hidden = true;
    } else {
      const same = current === best.mentor;
      hint.textContent = `${best.job ? 'Nel lavoro che sta facendo' : 'Il maestro più utile'}: ${best.mentor.name}, ${best.label.toLowerCase()} ${best.level} (lui ${best.own}).${same ? ' È già il suo maestro.' : ''}`;
      button.hidden = same;
      button.textContent = `Impara da ${best.mentor.name}`;
    }
    return result;
  };

  // --- Towers and warehouses pick their own sentinel among nearby enlisted people.
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  Game.prototype.sentinelCandidates = function(post) {
    return this.units.filter(u => u.owner === 0 && u.health > 35 && (u.morale ?? 70) >= 25 && u.mobilized && u.location?.kind === 'world' && !u.guardDuty && distance(u, post) <= 18)
      .sort((a, b) => distance(a, post) - distance(b, post));
  };
  Game.prototype.assignSentinelTo = function(postId) {
    const post = this.buildings.find(b => b.id === postId && b.owner === 0 && b.alive && b.built && ['tower', 'warehouse'].includes(b.type));
    if (!post) return {ok:false, error:'Seleziona una tua torre o un tuo magazzino completato.'};
    if (this.units.some(u => u.guardDuty && u.guardPostId === post.id)) return {ok:false, error:'Questo posto ha già una sentinella.'};
    const assign = post.type === 'tower' ? this.assignTowerGuard : this.assignWarehouseGuard;
    let last = 'Nessuna persona arruolata libera entro 18 caselle: arruolane una dalla Casa comune.';
    for (const u of this.sentinelCandidates(post)) {
      const error = assign.call(this, u, post);
      if (!error) { this.updateUI(); return {ok:true, person:u}; }
      last = error;
    }
    this.message(last);
    return {ok:false, error:last};
  };
  const selectionHTML = Game.prototype.selectionHTML;
  Game.prototype.selectionHTML = function(e) {
    let html = selectionHTML.call(this, e);
    if (e instanceof Building && e.owner === 0 && e.alive && e.built && ['tower', 'warehouse'].includes(e.type)) {
      const guard = this.units.find(u => u.guardDuty && u.guardPostId === e.id && u.health > 0);
      html += guard ? `<p>Sentinella: ${esc(guard.name)}.</p>`
        : this.sentinelCandidates(e).length ? `<button type="button" data-assign-sentinel="${esc(e.id)}">Assegna sentinella</button>`
        : `<p>Nessuna sentinella. Serve una persona arruolata libera entro 18 caselle.</p>`;
    }
    return html;
  };

  // --- A person's card: leave the district as a civilian, or enlist.
  const personHTML = Game.prototype.selectionHTML;
  Game.prototype.selectionHTML = function(e) {
    let html = personHTML.call(this, e);
    if (e instanceof Unit && e.owner === 0 && e.health > 0 && !this.rtsSelectedUnits?.().slice(1).length) {
      const b = (action, label) => `<button type="button" data-person-action="${action}" data-id="${esc(e.id)}">${label}</button>`;
      if (e.mobilized) html += b('demobilize', 'Congeda');
      else if (!e.task && e.location.kind === 'resident') html += b('exit', 'Fai uscire') + b('mobilize', 'Arruola');
      else if (!e.task) html += b('mobilize', 'Arruola');
    }
    return html;
  };
  Game.prototype.personAction = function(action, id) {
    const done = action === 'exit' ? this.exitHomePerson(id) : action === 'mobilize' ? this.mobilizePerson(id) : action === 'demobilize' ? this.demobilizePerson(id) : false;
    if (done) {
      const u = this.units.find(p => p.id === id);
      if (u?.location.kind === 'world') { this.selected = u; this.groupSelection = [u]; for (const p of this.units) p.selected = p === u; this.lastSelectedUnit = u; }
      this.save(true);
    }
    this.updateUI();
    return done;
  };

  // --- Transports: touch the start and the end on the map instead of reading two lists.
  Game.prototype.startRoutePick = function(which) {
    if (!['source', 'destination'].includes(which)) return false;
    this.routePick = which; this.orderMode = null; this.buildMode = null; this.syncModeButtons?.();
    this.message(which === 'source' ? 'Tocca sulla mappa l’edificio da cui prelevare.' : 'Tocca sulla mappa l’edificio a cui consegnare.');
    return true;
  };
  Game.prototype.pickRouteAt = function(pos) {
    const which = this.routePick;
    if (!which) return false;
    this.routePick = null;
    const b = this.nearestAt(this.buildings, pos, 1.3, x => x.owner === 0 && x.alive && x.built && x.inventory);
    if (!b) { this.message('Lì non c’è un tuo edificio con scorte. Riprova da «Scegli sulla mappa».'); return true; }
    const select = node(which === 'source' ? 'sourceSelect' : 'destinationSelect');
    if (select) select.value = b.id;
    this.routePickResult = {which, id:b.id};
    this.message(`${which === 'source' ? 'Partenza' : 'Arrivo'}: ${BUILD_LABEL[b.type]} (${Math.floor(b.x)}, ${Math.floor(b.y)}). Scegli la merce e tocca «Assegna trasporto».`);
    return true;
  };
  for (const method of ['rtsLeftTap', 'rtsContextTap']) {
    const tap = Game.prototype[method];
    if (!tap) continue;
    // Keep every argument: rtsLeftTap's third one says the tap is a MOD (additive) tap.
    Game.prototype[method] = function(sx, sy, ...rest) {
      if (!this.routePick) return tap.call(this, sx, sy, ...rest);
      const w = this.screenToWorld(sx, sy);
      return this.pickRouteAt({x:w.x / TILE, y:w.y / TILE});
    };
  }
  const renderLogistics = Game.prototype.renderLogistics;
  Game.prototype.renderLogistics = function(...args) {
    const result = renderLogistics.apply(this, args);
    const source = node('pickSource'), dest = node('pickDestination');
    if (source) source.hidden = !!node('sourceSelect')?.disabled;
    if (dest) dest.hidden = false;
    return result;
  };

  // --- Construction sites and Districts reached by the action tap (action-tap.js).
  const label = b => BUILD_LABEL[b.type] || b.type;
  Game.prototype.sendToSite = function(group, site) {
    const sent = group.filter(u => this.assignBuild(u, site));
    if (sent.length) this.message(sent.length > 1 ? `${sent.length} abitanti vanno al cantiere: ${label(site)}.` : `${sent[0].name} va al cantiere: ${label(site)}.`);
    return sent.length;
  };
  Game.prototype.moveInGroup = function(group, house) {
    const free = Math.max(0, 5 - this.villagePeople(house).length);
    if (!free) { this.message('Distretto pieno: non ci sono posti liberi.'); return 0; }
    const sent = group.slice(0, free).filter(u => { this.assignEnter(u, house); return u.task?.type === 'enter' && u.task.target === house.id || u.location.kind === 'resident'; });
    if (sent.length > 1) this.message(`${sent.length} abitanti vanno a vivere nel Distretto.`);
    return sent.length;
  };
  // The order now says that it was taken: the person walks to the door, then leaves the map.
  const assignEnter = Game.prototype.assignEnter;
  Game.prototype.assignEnter = function(u, b, ...rest) {
    const result = assignEnter.call(this, u, b, ...rest);
    if (u?.owner === 0 && u.task?.type === 'enter' && u.task.target === b?.id) this.message(`${u.name} va a vivere nel Distretto: quando arriva lascia la mappa.`);
    return result;
  };
  const orderHelp = Game.prototype.orderHelp;
  Game.prototype.orderHelp = function(o) { return o === 'enter' ? 'Tocca il Distretto dove andrà a vivere.' : orderHelp.call(this, o); };
  const siteHTML = Game.prototype.selectionHTML;
  Game.prototype.selectionHTML = function(e) {
    let html = siteHTML.call(this, e);
    if (e instanceof Building && e.owner === 0 && e.alive && !e.built) {
      const builders = this.units.filter(u => u.health > 0 && u.task?.type === 'build' && u.task.target === e.id);
      html += builders.length ? `<p>Al lavoro: ${builders.map(u => esc(u.name)).join(', ')}.</p>` : '<p>Nessuno ci lavora: seleziona un abitante e tocca il cantiere.</p>';
    }
    return html;
  };

  const initUI = Game.prototype.initUI;
  Game.prototype.initUI = function() {
    initUI.call(this);
    const learn = node('learnFromBest');
    if (learn) learn.onclick = () => {
      const error = this.learnFromBest(this.skillsPersonId), status = node('skillsStatus');
      if (status) status.textContent = error || 'Maestro aggiornato.';
      if (!error) this.save(true);
      this.renderSkills();
    };
    const card = node('selectionCard');
    if (card) card.addEventListener?.('click', event => {
      const button = event.target.closest?.('[data-assign-sentinel]');
      if (button) this.assignSentinelTo(button.dataset.assignSentinel);
      const person = event.target.closest?.('[data-person-action]');
      if (person) this.personAction(person.dataset.personAction, person.dataset.id);
    });
    const pickSource = node('pickSource'), pickDestination = node('pickDestination');
    if (pickSource) pickSource.onclick = () => this.startRoutePick('source');
    if (pickDestination) pickDestination.onclick = () => this.startRoutePick('destination');
  };
})();

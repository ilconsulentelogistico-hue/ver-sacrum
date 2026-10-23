// UI/UX redesign, lot D (Claude, 23/10/2026): «Impara da…» proposes the best master for
// the job a person does, and towers and warehouses assign their own sentinel.
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
    });
  };
})();

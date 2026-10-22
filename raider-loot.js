// Camp raiders can steal a bounded amount of real food and carry it home.
(() => {
  'use strict';
  const dropRecoveredFood=(game,x,y,amount)=>{
    const food=new ResourceNode('food',x,y,amount);
    food.recoveredLoot=true;
    game.world.resources.push(food);
    return food;
  };
  const oldUpdate = Game.prototype.updateRaider;
  Game.prototype.updateRaider = function(r, dt) {
    if (r.health <= 0) return;
    if (r.lootFood > 0) {
      const camp = this.warCamps?.find(c => c.id === r.campId);
      if (!camp || camp.health <= 0) {
        dropRecoveredFood(this,r.x,r.y,r.lootFood);
        r.lootFood = 0;
        r.lootStoreId = null;
        r.path = [];
        r.repath = 0;
        return oldUpdate.call(this, r, dt);
      }
      if (dist(r, camp) <= 1.5) {
        camp.stolenFood = (camp.stolenFood || 0) + r.lootFood;
        r.escapedWithLoot = true;
        r.lootStoreId = null;
        r.health = 0;
        this.message(`Un razziatore è fuggito con ${r.lootFood} cibo.`);
        return;
      }
      r.repath -= dt;
      if (!r.path?.length && r.repath <= 0) {
        r.path = this.pathToBuilding(r, camp) || [];
        r.repath = r.path.length ? 2 : 8;
      }
      if (r.path?.length) this.followPath(r, dt, r.speed);
      return;
    }
    if (r.raidStoreId) {
      const store = this.buildings.find(b => b.id === r.raidStoreId && b.alive && b.built && b.owner === 0 && b.type === 'warehouse');
      if (!store || this.available(store, 'food') <= 0) {
        r.raidStoreId = null;
        r.path = [];
        return oldUpdate.call(this, r, dt);
      }
      if (this.buildingDistance(r, store) <= 1.15) {
        const amount = Math.min(5, Math.max(0, this.available(store, 'food')));
        if (amount > 0) {
          store.inventory.items.food -= amount;
          r.lootFood = amount;
          r.lootStoreId = store.id;
          this.message(`Magazzino saccheggiato: sottratti ${amount} cibo. Fermalo prima che fugga.`);
        }
        r.raidStoreId = null;
        r.path = [];
        r.repath = 0;
        return;
      }
      if (!r.path?.length && r.repath <= 0) {
        const path = this.pathToBuilding(r, store);
        if (!path?.length) { r.raidStoreId = null; return oldUpdate.call(this, r, dt); }
        r.path = path;
        r.repath = 2;
      }
      r.repath -= dt;
      if (r.path?.length) this.followPath(r, dt, r.speed);
      return;
    }
    const base = this.buildings.find(b => b.type === 'base' && b.owner === 0 && b.alive);
    // A remote store met on the march can be raided before the village center.
    if (r.campId && base && dist(r, base) > 4) {
      const exposed = this.buildings.filter(b => b.type === 'warehouse' && b.owner === 0 && b.alive && b.built &&
          this.available(b, 'food') > 0 && dist(b, base) > 6 && this.buildingDistance(r, b) <= 2.5)
        .sort((a, b) => dist(r, a) - dist(r, b))
        .find(b => this.buildingDistance(r, b) <= 1.15 || this.pathToBuilding(r, b)?.length);
      if (exposed) {
        r.raidStoreId = exposed.id;
        r.path = [];
        r.repath = 0;
        this.message('Un razziatore ha individuato un magazzino esposto.');
        return;
      }
    }
    const oldHealth = base?.health;
    oldUpdate.call(this, r, dt);
    if (!base || !r.campId || !this.warCamps?.some(c => c.id === r.campId) ||
        !(base.health < oldHealth) || r.health <= 0) return;
    if (this.buildingDistance(r, base) > 1.15) return;
    const store = this.communalStores(0, base).filter(b => this.available(b, 'food') > 0)
      .sort((a, b) => dist(r, a) - dist(r, b))
      .find(b => this.pathToBuilding(r, b)?.length || this.buildingDistance(r, b) <= 1.15);
    if (!store) return;
    r.raidStoreId = store.id;
    r.path = [];
    r.repath = 0;
    this.message('Razzia al villaggio: un razziatore punta al magazzino.');
  };
  const oldRecover = Game.prototype.recoverDeadCargo;
  Game.prototype.recoverDeadCargo = function() {
    oldRecover.call(this);
    for (const r of this.raiders) if (r.health <= 0 && r.lootFood > 0 && !r.escapedWithLoot) {
      dropRecoveredFood(this,r.x,r.y,r.lootFood);
      r.lootFood = 0;
      r.lootStoreId = null;
    }
    for (const camp of this.warCamps || []) if (camp.health <= 0 && !camp.stolenFoodRecovered && camp.stolenFood > 0) {
      dropRecoveredFood(this,camp.x,camp.y,camp.stolenFood);
      camp.stolenFood = 0;
      camp.stolenFoodRecovered = true;
      this.message('Campo ostile conquistato: cibo rubato recuperabile a terra.');
    }
  };
  const oldSelection = Game.prototype.selectionHTML;
  Game.prototype.selectionHTML = function(e) {
    const html = oldSelection.call(this, e);
    if (e?.type === 'enemy_camp' && e.stolenFood > 0) return html + `<p>Scorta rubata: ${e.stolenFood} cibo. Distruggi il campo per recuperarla.</p>`;
    return e instanceof Raider && e.lootFood > 0 ? html + `<p>Trasporta ${e.lootFood} cibo rubato: fermalo per recuperarlo.</p>` : e instanceof Raider && e.raidStoreId ? html + '<p>Punta al magazzino: fermalo prima del prelievo.</p>' : html;
  };
})();

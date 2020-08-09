const expect = require('chai').expect;
const ECS = require('../src/index');
const {
  EntityRef,
  EntitySet,
  EntityObject,
} = ECS;

class Health extends ECS.Component {
  static properties = {
    max: 25,
    hp: 25,
    armor: 0
  };
}

describe('express components', () => {

  const ecs = new ECS.World();

  ecs.registerComponent(Health);

  it('create entity', () => {

    const S1 = class System extends ECS.System {}
    const s1 = new S1(ecs);

    ecs.createEntity({
      components: [
        {
          type: 'Health',
          key: 'Health',
          hp: 10
        }
      ]
    });

    const results = s1.createQuery({ all: ['Health'] }).execute();

    expect(results.size).to.equal(1);
  });

  it('create 2nd entity', () => {

    ecs.createEntityComponents({
      Health: { hp: 10 }
    });

    const results = ecs.createQuery().fromAll('Health').execute();

    expect(results.size).to.equal(2);
  });

  it('entity refs', () => {

    class Storage extends ECS.Component {
      static properties = {
        name: 'inventory',
        size: 20,
        items: EntitySet
      };
    }

    class EquipmentSlot extends ECS.Component {
      static properties = {
        name: 'finger',
        slot: EntityRef,
        effects: []
      };
    }

    class Food extends ECS.Component {
      static properties = {
        rot: 300,
        restore: 2
      };
    }

    ecs.registerComponent(Storage);
    ecs.registerComponent(EquipmentSlot);
    ecs.registerComponent(Food);

    const food = ecs.createEntity({
      id: 'sandwich10', // to exersize custom id
      components: [
        {
          type: 'Food',
          key: 'Food'
        }
      ]
    });

    const entity = ecs.createEntityComponents({
      pockets: { type: 'Storage', size: 4 },
      backpack: { type: 'Storage', size: 25 },
      pants: { type: 'EquipmentSlot' },
      shirt: { type: 'EquipmentSlot' },
      Health: {
        hp: 10,
        max: 10
      }
    });


    entity.c.pockets.items.add(food);
    expect(entity.c.pockets.items.has(food)).to.be.true;

    const entityObj = entity.getObject(false);
    delete entityObj.id;
    const eJson = JSON.stringify(entityObj);
    const entityDef = JSON.parse(eJson);

    const entity2 = ecs.createEntity(entityDef);

    expect(entity.c.pockets.items.has(food)).to.be.true;
    expect(entity2.c.pockets.items.has(food)).to.be.true;

    ecs.removeEntity(food);

    expect(entity.c.pockets.items.has(food)).to.be.false;
    expect(entity2.c.pockets.items.has(food)).to.be.false;

    expect(ecs.getEntity(food.id)).to.be.undefined;
    ecs.removeEntity(entity.id);

    expect(ecs.getEntity(entity.id)).to.be.undefined;

  });

  it('init and destroy component', () => {

    let hit = false;

    const ecs = new ECS.World();

    class Test extends ECS.Component {
      static properties = {
        x: null,
        y: 0
      };

      preDestroy() {
        this.x = null;
        hit = true;
      }

      init() {
        this.y++;
      }

    }
    ecs.registerComponent(Test);

    const entity = ecs.createEntityComponents({
      Test: {
      }
    });


    expect(entity.c.Test.y).to.equal(1);
    expect(hit).to.equal(false);

    entity.removeComponent(entity.c.Test);
    expect(hit).to.equal(true);

  });

  it('system subscriptions', () => {

    let changes = [];
    let changes2 = [];
    let effectExt = null;
    /* $lab:coverage:off$ */
    class System extends ECS.System {

      constructor(world) {

        super(world);
        this.world.subscribe(this, 'EquipmentSlot');
      }

      update(tick) {

        super.update()
        changes = this.changes;
        for (const change of this.changes) {
          const parent = this.world.getEntity(change.entity);
          if (change.op === 'addRef') {
            const value = this.world.getEntity(change.target);
            if (value.has('Wearable')) {
              const components = [];
              for (const effectDef of value.c.Wearable.effects) {
                const component = parent.addComponent(effectDef);
                components.push(component);
              }
              if (components.length > 0) {
                const effect = parent.addComponent({
                  type: 'EquipmentEffect',
                  equipment: value.id
                });
                for (const c of components) {
                  effect.effects.push(c.id);
                  effectExt = c;
                }
              }
            }
          } else if (change.op === 'deleteRef') {
            for (const effect of parent.getComponents('EquipmentEffect')) {
              if (effect.equipment === change.target) {
                for (const compid of effect.effects) {
                  const comp = this.world.getComponent(compid);
                  parent.removeComponent(comp);
                }
                parent.removeComponent(effect);
              }
            }
          }
        }
      }
    }

    class System2 extends ECS.System {

      constructor(world) {

        super(world);
        //this.world.subscribe(this, 'EquipmentSlot');
      }

      update(tick) {

        changes2 = this.changes;
      }
    }
    System2.subscriptions = ['EquipmentSlot'];
    /* $lab:coverage:on */

    class EquipmentEffect extends ECS.Component {
      static properties = {
        equipment: '',
        effects: []
      };
    }

    class Wearable extends ECS.Component {
      static properties = {
        name: 'ring',
        effects: [
          { type: 'Burning' }
        ]
      };
    }

    class Burning extends ECS.Component {};

    ecs.registerComponent(EquipmentEffect);
    ecs.registerComponent(Wearable);
    ecs.registerComponent(Burning);

    const system = new System(ecs);
    //const system2 = new System2(ecs);

    ecs.registerSystem('equipment', system);
    ecs.registerSystem('equipment', System2);

    ecs.runSystems('equipment');

    const entity = ecs.createEntityComponents({
      pockets: { type: 'Storage', size: 4 },
      backpack: { type: 'Storage', size: 25 },
      pants: { type: 'EquipmentSlot' },
      shirt: { type: 'EquipmentSlot' },
      Health: {
        hp: 10,
        max: 10
      }
    });

    const pants = ecs.createEntityComponents({
      Wearable: { name: 'Nice Pants',
        effects: [
          { type: 'Burning' }
        ]
      }
    });

    ecs.runSystems('equipment');
    expect(changes.length).to.equal(2);

    entity.c.pants.slot = pants;

    ecs.runSystems('equipment');

    expect(entity.getComponents('EquipmentEffect')).to.exist;
    const eEffects = new Set([...entity.getComponents('EquipmentEffect')][0].effects);

    expect(eEffects.has(effectExt.id)).to.be.true;
    expect(entity.getComponents('Burning')).to.exist;
    expect(changes.length).to.equal(1);
    expect(changes[0].op).to.equal('addRef');
    expect(changes[0].target).to.equal(pants.id);

    //entity.EquipmentSlot.pants.slot = null;
    pants.destroy();
    ecs.runSystems('equipment');

    ecs.runSystems('asdf'); //code path for non-existant system
    expect(changes2.length).to.be.greaterThan(0);
    expect(changes.length).to.be.greaterThan(0);
    expect(changes[0].target).to.equal(pants.id);
    expect(entity.getComponents('EquipmentEffect')).to.not.exist;
    expect(entity.getComponents('Burning')).to.not.exist;

  });

});

describe('system queries', () => {

  const ecs = new ECS.World();

  it('add and remove forbidden component', () => {

    class Tile extends ECS.Component {
      static properties = {
        x: 0,
        y: 0,
        level: 0
      };
    }

    class Hidden extends ECS.Component {}

    ecs.registerComponent(Tile);
    ecs.registerComponent(Hidden);

    class TileSystem extends ECS.System {

      init() {

        this.lastResults = [];
        this.query = this.world.createQuery({
          all: ['Tile'],
          not: ['Hidden'],
          persist: true });
      }

      update(tick) {

        this.lastResults = this.query.execute();
      }
    }

    const tileSystem = new TileSystem(ecs);
    ecs.registerSystem('map', tileSystem);

    ecs.runSystems('map');

    expect(tileSystem.lastResults.size).to.equal(0);

    const tile1 = ecs.createEntityComponents({
      Tile: {
        x: 10,
        y: 0,
        level: 0
      }
    });

    const tile2 = ecs.createEntityComponents({
      Tile: {
        x: 11,
        y: 0,
        level: 0
      },
      Hidden: {}
    });

    ecs.tick()

    ecs.runSystems('map');

    expect(tileSystem.lastResults.size).to.equal(1);
    expect(tileSystem.lastResults.has(tile1)).to.be.true;

    tile2.removeComponent(tile2.c.Hidden);
    ecs.tick();

    ecs.runSystems('map');

    expect(tileSystem.lastResults.size).to.equal(2);
    expect(tileSystem.lastResults.has(tile1)).to.be.true;
    expect(tileSystem.lastResults.has(tile1)).to.be.true;

    tile1.addComponent({ type: 'Hidden' });
    ecs.updateIndexes(tile1);

    ecs.runSystems('map');

    expect(tileSystem.lastResults.size).to.equal(1);
    expect(tileSystem.lastResults.has(tile2)).to.be.true;


  });

  it('multiple has and hasnt', () => {

    class Billboard extends ECS.Component {};
    class Sprite extends ECS.Component {};
    ecs.registerComponent(Billboard);
    ecs.registerComponent(Sprite);

    const tile1 = ecs.createEntityComponents({
      Tile: {},
      Billboard: {},
      Sprite: {},
      Hidden: {}
    });

    const tile2 = ecs.createEntityComponents({
      Tile: {},
      Billboard: {},
    });

    const tile3 = ecs.createEntityComponents({
      Tile: {},
      Billboard: {},
      Sprite: {}
    });

    const tile4 = ecs.createEntityComponents({
      Tile: {},
    });

    const tile5 = ecs.createEntityComponents({
      Billboard: {},
    });

    const result = ecs.createQuery()
      .fromAll('Tile', 'Billboard')
      .not('Sprite', 'Hidden')
      .execute();

    const resultSet = new Set([...result]);

    expect(resultSet.has(tile1)).to.be.false;
    expect(resultSet.has(tile2)).to.be.true;
    expect(resultSet.has(tile3)).to.be.false;
    expect(resultSet.has(tile4)).to.be.false;
    expect(resultSet.has(tile5)).to.be.false;

  });

  it('tags', () => {

    const ecs = new ECS.World();
    class Tile extends ECS.Component {};
    class Sprite extends ECS.Component {};

    ecs.registerComponent(Tile);
    ecs.registerComponent(Sprite);
    ecs.registerTags('Billboard', 'Hidden');

    const tile1 = ecs.createEntityComponents({
      tags: ['Billboard', 'Hidden'],
      Tile: {}
    });

    const tile2 = ecs.createEntityComponents({
      tags: ['Billboard'],
      Tile: {}
    });

    const tile3 = ecs.createEntityComponents({
      tags: ['Billboard'],
      Sprite: {}
    });

    const tile4 = ecs.createEntityComponents({
      Tile: {},
    });

    const tile5 = ecs.createEntityComponents({
      tags: ['Billboard']
    });

    const q1 = ecs.createQuery({
      all: ['Tile', 'Billboard'],
      not: ['Sprite', 'Hidden'],
    }).persist();
    const result = q1.execute();

    const resultSet = new Set([...result]);

    expect(resultSet.has(tile1)).to.be.false;
    expect(resultSet.has(tile2)).to.be.true;
    expect(tile2.has('Sprite')).to.be.false;
    expect(resultSet.has(tile3)).to.be.false;
    expect(resultSet.has(tile4)).to.be.false;
    expect(resultSet.has(tile5)).to.be.false;

    const result3 = ecs.getEntities('Hidden');

    expect(result3.has(tile1)).to.be.true;
    expect(result3.has(tile2)).to.be.false;
    expect(result3.has(tile3)).to.be.false;
    expect(result3.has(tile4)).to.be.false;
    expect(result3.has(tile5)).to.be.false;

    tile4.addTag('Billboard');
    tile2.removeTag('Hidden');
    tile1.removeTag('Hidden');
    tile3.addComponent({ type: 'Tile' });
    tile3.addTag('Hidden');
    tile1.removeTag('Billboard');
    tile4.addTag('Hidden');

    const result2 = q1.results;

    expect(tile4.has('Billboard')).to.be.true;
    expect(tile3.has('Tile')).to.be.true;
    expect(result2.has(tile1)).to.be.false;
    expect(result2.has(tile2)).to.be.true;
    expect(result2.has(tile3)).to.be.false;
    expect(result2.has(tile4)).to.be.false;
    expect(result2.has(tile5)).to.be.false;

  });

  it('filter by updatedValues', () => {

    const ecs = new ECS.World();
    class Comp1 extends ECS.Component {
      static properties = {
        greeting: 'hi'
      };
    }
    ecs.registerComponent(Comp1);

    ecs.tick();

    const entity1 = ecs.createEntityComponents({
      Comp1: {}
    });

    const entity2 = ecs.createEntityComponents({
      Comp1: {
        greeting: 'hullo'
      }
    });

    ecs.tick();
    const ticks = ecs.currentTick;
    const testQ = ecs.createQuery().fromAll('Comp1').persist();
    const results1 = testQ.execute();
    expect(results1.has(entity1)).to.be.true;
    expect(results1.has(entity2)).to.be.true;
  });

  it('filter by updatedComponents', () => {

    const ecs = new ECS.World();
    class Comp1 extends ECS.Component {
      static properties = {
        greeting: 'hi'
      };
    }
    class Comp2 extends ECS.Component {}
    ecs.registerComponent(Comp1);
    ecs.registerComponent(Comp2);

    ecs.tick();

    const entity1 = ecs.createEntityComponents({
      Comp1: {}
    });

    const entity2 = ecs.createEntityComponents({
      Comp1: {
        greeting: 'hullo'
      }
    });

    ecs.tick();
    const ticks = ecs.currentTick;
    const testQ = ecs.createQuery().fromAll('Comp1').persist();
    const results1 = testQ.execute();
    expect(results1.has(entity1)).to.be.true;
    expect(results1.has(entity2)).to.be.true;

    const comp1 = entity1.c.Comp1;
    comp1.greeting = 'Gutten Tag';
    entity2.addComponent({ type: 'Comp2' });

    const results2 = testQ.execute({ updatedComponents: ticks });
    expect(results2.has(entity1)).to.be.false;
    expect(results2.has(entity2)).to.be.true;

  });

  it('destroyed entity should be cleared', () => {

    const ecs = new ECS.World();
    class Comp1 extends ECS.Component {}
    ecs.registerComponent(Comp1);

    const entity1 = ecs.createEntityComponents({
      Comp1: {}
    });

    const query = ecs.createQuery().fromAll('Comp1').persist();
    const results1 = query.execute();
    expect(results1.has(entity1)).to.be.true;

    entity1.destroy();

    ecs.tick();

    const results2 = query.execute();
    expect(results2.has(entity1)).to.be.false;

  });
});


describe('entity & component refs', () => {

  const ecs = new ECS.World();

  class BeltSlots extends ECS.Component {
    static properties = {
      slots: EntityObject,
    };
  }
  class Potion extends ECS.Component {}

  ecs.registerComponent(BeltSlots);
  ecs.registerComponent(Potion);

  it('Entity Object', () => {

    const belt = ecs.createEntityComponents({
      BeltSlots: {}
    });

    const slots = ['a', 'b', 'c'];
    const potions = [];
    const beltslots = belt.c.BeltSlots;
    for (const slot of slots) {
      const potion = ecs.createEntityComponents({
        Potion: {}
      });
      beltslots.slots[slot] =  potion;
      potions.push(potion);
    }

    const potionf = ecs.createEntityComponents({
      Potion: {}
    });

    //expect(beltslots.slots[Symbol.iterator]).to.not.exist;

    expect(beltslots.slots.a).to.equal(potions[0]);
    expect(beltslots.slots.b).to.equal(potions[1]);
    expect(beltslots.slots.c).to.equal(potions[2]);

    potions[1].destroy();
    expect(beltslots.slots.b).to.not.exist;

    delete beltslots.slots.c;
    expect(beltslots.slots.c).to.not.exist;

    //assign again
    beltslots.slots['a'] = potions[0];

    //asign by id
    beltslots.slots.a = potionf.id;
    expect(beltslots.slots.a).to.equal(potionf);

    delete beltslots.slots.d;
  });

  it('Entity Set', () => {

    class BeltSlots2 extends ECS.Component {
      static properties = {
        slots: EntitySet,
      };
    }
    ecs.registerComponent(BeltSlots2);

    const belt = ecs.createEntityComponents({
      BeltSlots2: {}
    });

    const slots = ['a', 'b', 'c'];
    const potions = [];
    const beltSlots2 = belt.c.BeltSlots2;
    for (const slot of slots) {
      const potion = ecs.createEntityComponents({
        Potion: {}
      });
      beltSlots2.slots.add(potion);
      potions.push(potion);
    }

    expect(beltSlots2.slots[Symbol.iterator]).to.exist;

    expect(beltSlots2.slots).instanceof(Set);
    expect(beltSlots2.slots.has(potions[0])).to.be.true;
    expect(beltSlots2.slots.has(potions[1])).to.be.true;
    expect(beltSlots2.slots.has(potions[2])).to.be.true;

    const withValues = ecs.createEntityComponents({
      BeltSlots: { slots: { a: potions[0].id, b: potions[2], d: null }}
    });

    expect(withValues.c.BeltSlots.slots.a).to.equal(potions[0]);
    expect(withValues.c.BeltSlots.slots.b).to.equal(potions[2]);

    withValues.c.BeltSlots.slots.c = potions[1].id;
    expect(withValues.c.BeltSlots.slots.c).to.equal(potions[1]);

    withValues.c.BeltSlots.slots.c = null;
    expect(withValues.c.BeltSlots.slots.c).to.equal(undefined);
    withValues.c.BeltSlots.slots.c = potions[1];
    expect(withValues.c.BeltSlots.slots.c).to.equal(potions[1]);


  });

  class Crying extends ECS.Component {}
  class Angry extends ECS.Component {}
  ecs.registerComponent(Crying);
  ecs.registerComponent(Angry);

  it('Assign entity ref by id', () => {

    class Ref extends ECS.Component {
      static properties = {
        other: EntityRef
      };
    }
    ecs.registerComponent(Ref);

    const entity = ecs.createEntityComponents({
      Crying: {}
    });

    const entity2 = ecs.createEntityComponents({
      Ref: { other: entity.id }
    });

    expect(entity2.c.Ref.other).to.equal(entity);
  });

  it('Reassign same entity ref', () => {

    const entity = ecs.createEntityComponents({
      Crying: {}
    });

    const entity2 = ecs.createEntityComponents({
      Ref: { other: entity.id }
    });

    const ref2 = entity2.c.Ref;
    ref2.other = entity;

    expect(ref2.other).to.equal(entity);
  });

});

describe('entity restore', () => {

  it('restore mapped object', () => {

    const ecs = new ECS.World();
    ecs.registerTags('Potion');

    class EquipmentSlot extends ECS.Component {
      static properties = {
        name: 'finger',
        slot: EntityRef
      };
    }
    ecs.registerComponent(EquipmentSlot);


    const potion1 = ecs.createEntityComponents({
      tags: ['Potion']
    });
    const potion2 = ecs.createEntityComponents({
      tags: ['Potion']
    });

    const entity = ecs.createEntityComponents({
      'main': { slot: potion1, type: 'EquipmentSlot' },
      'secondary': { slot: potion2, type: 'EquipmentSlot' }
    });

    expect(entity.c.main.slot).to.equal(potion1);
    expect(entity.c.secondary.slot).to.equal(potion2);
    expect(potion1).to.not.equal(potion2);
  });

  it('restore unmapped object', () => {

    const ecs = new ECS.World();
    ecs.registerTags('Potion');

    class EquipmentSlot extends ECS.Component {
      static properties = {
        name: 'finger',
        slot: EntityRef
      };
    }
    ecs.registerComponent(EquipmentSlot);


    const potion1 = ecs.createEntityComponents({
      tags: ['Potion']
    });
    const potion2 = ecs.createEntityComponents({
      tags: ['Potion']
    });
    const potion3 = ecs.createEntityComponents({
      tags: ['Potion']
    });

    const entity = ecs.createEntityComponents({
      slot1: { type: 'EquipmentSlot', name: 'slot1', slot: potion1 },
      slot2: { type: 'EquipmentSlot', name: 'slot2', slot: potion2 }
    });
    entity.addComponent({
      type: 'EquipmentSlot',
      key: 'slot3',
      name: 'slot3',
      slot: potion3
    });


    expect(entity.c.slot1.slot).to.equal(potion1);
    expect(entity.c.slot1.name).to.equal('slot1');
    expect(entity.c.slot2.slot).to.equal(potion2);
    expect(entity.c.slot2.name).to.equal('slot2');
    expect(entity.c.slot3.slot).to.equal(potion3);
    expect(entity.c.slot3.name).to.equal('slot3');
  });

  it('Unregistered component throws', () => {

    const ecs = new ECS.World();
    ecs.registerComponent(class Potion extends ECS.Component {});

    const badName = () => {
      const entity = ecs.createEntityComponents({
        Posion: {} //misspelled
      });
    };
    expect(badName).to.throw();
  });

  it('Unassigned field is not set', () => {

    const ecs = new ECS.World();
    class Potion extends ECS.Component {};
    ecs.registerComponent(Potion);
    const entity = ecs.createEntityComponents({ Potion: { x: 37 } });
    expect(entity.c.Potion.x).to.be.undefined;
  });

  it('removeComponentByName many', () => {

    const ecs = new ECS.World();
    ecs.registerComponent(class NPC extends ECS.Component {});
    ecs.registerComponent(class Other extends ECS.Component {});
    ecs.registerComponent(class Armor extends ECS.Component {
      static properties = { 'amount': 5 };
    });

    const entity = ecs.createEntityComponents({
      NPC: {},
    });
    entity.addComponent({ type: 'Armor', amount: 10 });
    entity.addComponent({ type: 'Armor', amount: 30 });

    const entity2 = ecs.createEntityComponents({
      Other: {},
    });

    expect(entity.has('NPC')).to.be.true;
    expect(entity.has('Armor')).to.be.true;
    const armors = entity.getComponents('Armor');
    expect(armors.size).to.equal(2);
    expect([...armors][0].amount).to.equal(10);
    expect([...armors][1].amount).to.equal(30);

    entity.removeComponent([...armors][0]);
    const armors2 = entity.getComponents('Armor');
    expect(armors2.size).to.equal(1);

    const others = entity2.getComponents('Other');
    expect(others.size).to.equal(1);
    const removed = entity2.removeComponent([...others][0]);

    const removed2 = entity2.removeComponent('nonexistant');

    expect(removed).to.be.true;
    expect(removed2).to.be.false;

  });

  it('EntitySet', () => {

    const ecs = new ECS.World();
    class SetInventory extends ECS.Component {
      static properties = {
        slots: EntitySet
      };
    }
    class Bottle extends ECS.Component {}
    class ThrowAway extends ECS.Component {
      static properties = {
        a: 1,
      };
      static serialize = false;
    }
    ecs.registerComponent(SetInventory);
    ecs.registerComponent(Bottle);
    ecs.registerComponent(ThrowAway);

    const container = ecs.createEntityComponents({
      SetInventory: {},
      ThrowAway: {}
    });

    const bottle1 = ecs.createEntityComponents({
      Bottle: {}
    });
    const bottle2 = ecs.createEntityComponents({
      Bottle: {}
    });
    const bottle3 = ecs.createEntityComponents({
      Bottle: {}
    });

    const setInv = container.c.SetInventory;
    setInv.slots.add(bottle1);
    setInv.slots.add(bottle2);

    expect(setInv.slots.has(bottle1.id)).to.be.true;
    expect(setInv.slots.has(bottle2)).to.be.true;
    expect(setInv.slots.has(bottle3)).to.be.false;

    const def = container.getObject(false);
    const defS = JSON.stringify(def);
    const def2 = JSON.parse(defS);
    delete def2.id;

    const container2 = ecs.createEntity(def2);
    const setInv2 = container2.c.SetInventory;
    expect(setInv2.slots.has(bottle1)).to.be.true;
    expect(setInv2.slots.has(bottle2)).to.be.true;
    expect(setInv2.slots.has(bottle3)).to.be.false;
    expect(container2.c.ThrowAway).to.be.undefined;

    let idx = 0;
    for (const entity of setInv2.slots) {
      if (idx === 0) {
        expect(entity).to.equal(bottle1);
      } else if (idx === 1) {
        expect(entity).to.equal(bottle2);
      }
      idx++;
    }
    expect(idx).to.equal(2);

    expect(setInv2.slots.has(bottle1)).to.be.true;
    bottle1.destroy();
    expect(setInv2.slots.has(bottle1)).to.be.false;
    expect(setInv2.slots.has(bottle2)).to.be.true;
    setInv2.slots.delete(bottle2.id);
    expect(setInv2.slots.has(bottle2)).to.be.false;

    expect(setInv.slots.has(bottle1)).to.be.false;
    expect(setInv.slots.has(bottle2)).to.be.true;

    setInv.slots.clear()
    expect(setInv.slots.has(bottle2)).to.be.false;

    const bottle4 = ecs.createEntityComponents({
      Bottle: {}
    });

    const bottle5 = ecs.createEntityComponents({
      Bottle: {}
    });

    const withValues = ecs.createEntityComponents({
      SetInventory: {
        slots: [bottle4, bottle5.id]
      }
    });

    expect(withValues.c.SetInventory.slots.has(bottle4)).to.be.true;
    expect(withValues.c.SetInventory.slots.has(bottle5)).to.be.true;

    withValues.c.SetInventory.slots._reset();
    expect(withValues.c.SetInventory.slots.has(bottle4)).to.be.true;
    expect(withValues.c.SetInventory.slots.has(bottle5)).to.be.true;


  });

});

describe('exporting and restoring', () => {

  it('get object and stringify component', () => {

    const ecs = new ECS.World();
    class AI extends ECS.Component {
      static properties = {
        order: 'sun'
      };
    }
    ecs.registerComponent(AI);

    const entity = ecs.createEntityComponents({
      moon: { type: 'AI', order: 'moon' },
      jupiter: { type: 'AI', order: 'jupiter' },
    });

    const moon = entity.c.moon;
    const obj = moon.getObject();

    expect(obj.type).to.equal('AI');
    expect(obj.id).to.equal(moon.id);
  });

  it('getObject on entity', () => {

    const ecs = new ECS.World();
    class EquipmentSlot extends ECS.Component {
      static properties = {
        name: 'ring',
        slot: EntityRef
      };
    }
    class Bottle extends ECS.Component {}
    class AI extends ECS.Component {}
    class Effect extends ECS.Component {
      static properties = {
        name: 'fire'
      };
    }
    ecs.registerComponent(EquipmentSlot);
    ecs.registerComponent(Bottle);
    ecs.registerComponent(AI);
    ecs.registerComponent(Effect);

    const bottle = ecs.createEntityComponents({ Bottle: {} });
    let npc = ecs.createEntityComponents({
      ring: { type: 'EquipmentSlot', slot: bottle },
      AI: {}
    });
    npc.addComponent({ type: 'Effect', name: 'wet' });
    npc.addComponent({ type: 'Effect', name: 'annoyed' });

    const old = npc.getObject();

    expect(old.c.ring.slot).to.equal(bottle.id);

    npc.destroy();
    npc = undefined;

    npc = ecs.createEntity(old);

    const old2 = npc.getObject();

    const ring = npc.c.ring;
    expect(ring.slot).to.equal(bottle);
    const effect = npc.getComponents('Effect');
    expect(effect.size).to.equal(2);
    expect([...effect][0].name).to.equal('wet');
    expect([...effect][1].name).to.equal('annoyed');
  });

  it('property skipping', () => {

    const ecs = new ECS.World();
    class Effect extends ECS.Component {
      static properties = {
        name: 'fire',
        started: ''
      };
    }
    class AI extends ECS.Component {
      static properties = {
        name: 'thingy'
      };
    }
    ecs.registerComponent(Effect);
    ecs.registerComponent(AI);

    class Liquid extends ECS.Component {}
    ecs.registerComponent(Liquid);

    const entity = ecs.createEntityComponents({
      Effect: {
        name: 'fire',
        started: Date.now()
      },
      AI: {},
      Liquid: {}
    });

    const old = entity.getObject();

    const entity2 = ecs.createEntity(old);

    expect(old.AI).to.not.exist;
    //expect(old.Effect.started).to.not.exist;
    expect(old.c.Effect.name).to.equal('fire');
    expect(old.c.Liquid).to.exist;
    expect(entity2.c.Liquid).to.exist;

    entity2.c.Liquid.key = 'OtherLiquid';
    expect(entity2.c.Liquid).to.not.exist;
    expect(entity2.c.OtherLiquid).to.exist;

    entity2.c.OtherLiquid.key = undefined;
    expect(entity2.c.OtherLiquid).to.not.exist;
    expect(entity2.c.Liquid).to.not.exist;
  });

});

describe('advanced queries', () => {
  it('from and reverse queries', () => {

    const ecs = new ECS.World();

    ecs.registerTags('A', 'B', 'C');

    const entity1 = ecs.createEntityComponents({
      tags: ['A']
    });
    const entity2 = ecs.createEntityComponents({
      tags: ['B']
    });

    const entity3 = ecs.createEntityComponents({
      tags: ['B', 'C']
    });

    const entity4 = ecs.createEntityComponents({
      tags: ['B', 'C', 'A']
    });

    const q = ecs.createQuery({ from: [entity1, entity2, entity3] });
    const r = q.execute();

    expect(r.has(entity1)).to.be.true;
    expect(r.has(entity2)).to.be.true;
    expect(r.has(entity3)).to.be.true;

    class Person extends ECS.Component {
      static properties = {
        name: 'Bill'
      };
    }
    class Item extends ECS.Component {
      static properties = {
        name: 'knife'
      };
    }
    class InInventory extends ECS.Component {
      static properties = {
        person: EntityRef
      };
    }

    ecs.registerComponent(Person);
    ecs.registerComponent(Item);
    ecs.registerComponent(InInventory);

    const e4 = ecs.createEntityComponents({
      Person: {
        name: 'Bob'
      }
    });

    const e5 = ecs.createEntityComponents({
      Item: {
        name: 'plate'
      },
      InInventory: {
        person: e4
      }
    });

    const q2 = ecs.createQuery({ reverse: { entity: e4, type: 'InInventory'}, persist: true } );
    const r2 = q2.execute();

    expect(r2.size).to.equal(1);
    expect(r2.has(e5)).to.be.true;

    const q3 = ecs.createQuery({ any: ['B', 'C'], persist: true });
    const r3 = q3.execute();

    const q4 = ecs.createQuery({ all: ['B', 'C'], persist: true });
    const r3b = q4.execute();

    expect(r3.size).to.equal(3);
    expect(r3.has(entity2)).to.be.true;
    expect(r3.has(entity3)).to.be.true;
    expect(r3b.size).to.equal(2);
    expect(r3b.has(entity3)).to.be.true;
    expect(r3b.has(entity4)).to.be.true;

    e5.addTag('A');
    ecs.tick();

    entity2.removeTag('B');
    e5.removeComponent('InInventory');

    ecs.tick();
    const r4 = q3.execute();
    expect(r3.size).to.equal(2);
    expect(r3.has(entity2)).to.be.false;
    expect(r3.has(entity3)).to.be.true;

    const q2r2 = q2.execute();
    expect(q2r2.size).to.equal(0);

    const r5 = q4.execute();
    expect(r5.size).to.equal(2);

    expect(r3.has(entity1)).to.be.false;
    entity1.addTag('B');
    ecs.tick();

    const r6 = q3.execute();
    expect(r6.has(entity1)).to.be.true;
    const r7 = q2.execute();

    expect(r7.has(e5)).to.be.false;

  });

  it('track added and removed', () => {

    const ecs = new ECS.World();
    class S1 extends ECS.System {};
    class S2 extends ECS.System {};

    const s1 = ecs.registerSystem('group1', S1);
    const s2 = ecs.registerSystem('group2', S2);

    ecs.registerTags('A', 'B', 'C');

    const e1 = ecs.createEntity({
      tags: ['A']
    });
    const e2 = ecs.createEntity({
      tags: ['B']
    });
    const e3 = ecs.createEntity({
      tags: ['C']
    });
    const e4 = ecs.createEntity({
      tags: ['A', 'B']
    });
    const e5 = ecs.createEntity({
      tags: ['A', 'C']
    });
    const e6 = ecs.createEntity({
      tags: ['C', 'B']
    });
    const e7 = ecs.createEntity({
      tags: ['A', 'B', 'C']
    });

    const q1 = s1.createQuery({
      trackAdded: true,
    }).fromAll('A', 'C').persist();

    const r1 = q1.execute();

    expect(r1.has(e5)).to.be.true;
    expect(r1.has(e6)).to.be.false;
    expect(r1.has(e7)).to.be.true;
    expect(q1.added.size).to.be.equal(2);
    expect(q1.removed.size).to.be.equal(0);
    expect(q1.added.has(e5)).to.be.true;
    expect(q1.added.has(e6)).to.be.false;
    expect(q1.added.has(e7)).to.be.true;

    ecs.runSystems('group1');
    ecs.tick();

    expect(q1.added.size).to.be.equal(0);
    expect(q1.removed.size).to.be.equal(0);

    e5.removeTag('C');
    e1.addTag('C');

    ecs.tick();

    expect(r1.has(e5)).to.be.false;
    expect(r1.has(e7)).to.be.true;
    expect(r1.has(e1)).to.be.true;
    expect(q1.added.has(e1)).to.be.true;
    expect(q1.added.size).to.be.equal(1);
    expect(q1.removed.size).to.be.equal(0);

    const q2 = s2.createQuery({
      trackRemoved: true,
    }).fromAll('A', 'C').persist();

    const r2 = q2.execute();

    expect(r2.has(e1)).to.be.true;
    expect(r2.has(e6)).to.be.false;
    expect(r2.has(e5)).to.be.false;
    expect(r2.has(e7)).to.be.true;
    expect(q2.added.size).to.be.equal(0);
    expect(q2.removed.size).to.be.equal(0);

    ecs.tick();

    expect(q2.added.size).to.be.equal(0);
    expect(q2.removed.size).to.be.equal(0);

    e7.removeTag('A');
    e3.addTag('A');

    ecs.tick();

    expect(q2.added.size).to.be.equal(0);
    expect(q2.removed.size).to.be.equal(1);
    expect(r2.has(e3)).to.be.true;
    expect(r2.has(e7)).to.be.false;
    expect(q2.removed.has(e7)).to.be.true;

    ecs.runSystems('group1');
    expect(q1.added.size).to.be.equal(0);
    expect(q1.removed.size).to.be.equal(0);

    ecs.runSystems('group2');
    expect(q2.added.size).to.be.equal(0);
    expect(q2.removed.size).to.be.equal(0);

  });
});

describe('serialize and deserialize', () => {

  it('maintain refs across worlds', () => {

    const worldA = new ECS.World();

    class Inventory extends ECS.Component {
      static properties = {
        main: EntitySet
      };
    }
    worldA.registerComponent(Inventory);

    worldA.registerTags('Bottle', 'Item', 'NPC');

    const npc = worldA.createEntity({
      id: 'npc1',
      tags: ['NPC'],
      c: {
        Inventory: {}
      }
    });

    const bottle = worldA.createEntity({
      tags: ['Item', 'Bottle']
    });

    npc.c.Inventory.main.add(bottle);

    const entities1 = worldA.getObject();

    const worldB = new ECS.World();

    class Inventory2 extends ECS.Component {
      static properties = {
        main: EntitySet
      };
    }
    Object.defineProperty(Inventory2, 'name', { value: 'Inventory' });
    worldB.registerComponent(Inventory2);

    worldB.registerTags('Bottle', 'Item', 'NPC');

    worldB.createEntities(entities1);

    const q1 = worldB.createQuery().fromAll('NPC');
    const r1 = [...q1.execute()];
    const npc2 = r1[0]
    const bottle2 = [...npc2.c.Inventory.main][0];

    expect(npc.id).to.equal(npc2.id);
    expect(bottle.id).to.equal(bottle2.id);
    expect(bottle2.tags.size).to.equal(2);

    const worldC = new ECS.World();

    worldC.copyTypes(worldA, ['Inventory', 'Bottle', 'Item', 'NPC']);

    worldC.createEntities(entities1.reverse());

    const npc3 = worldC.entities.get('npc1');
    const bottle3 = [...npc3.c.Inventory.main][0];

    expect(npc.id).to.equal(npc3.id);
    expect(bottle.id).to.equal(bottle3.id);
    expect(bottle3.tags.size).to.equal(2);
  });
});

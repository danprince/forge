import { ChangeHP, Damage, Heal, Slide } from "./actions";
import { Container, Storage } from "./components";
import { Bar, Gold, Ore, Straight, SwordBlade, SwordHandle, SwordTip } from "./crafting";
import { randomElement, sleep } from "./engine";
import { createCoinEmitter, createSmokeEmitter, createSparkEmitter } from "./fx";
import { AnimatedSprite, Direction, DIRECTIONS, directionToRotation, GameObject, Material, Sprite, Tags } from "./game";

export {
  Automaton,
  Assembler,
  Redirector,
  Waiter,
  Emptier,
  Filter,
} from "./automata";

export class Furnace extends GameObject {
  name = "Furnace";
  description = "Turns ores into bars";
  sprite = new Sprite("furnace");

  canBeMoved() {
    return true;
  }

  isOutputClear(material: Material, direction: Direction): boolean {
    let cell = game.getCellInDirection(this.x, this.y, direction);
    let output = this.createOutput(material);
    return (
      cell != null &&
      output != null &&
      cell.canAccept(output, direction)
    );
  }

  createOutput(material: Material): Material | undefined {
    return Material.createByRarity({
      component: Bar,
      element: material.element,
    });
  }

  canAccept(object: GameObject, direction: Direction): object is Material {
    return (
      object instanceof Material &&
      object.component === Ore &&
      this.isOutputClear(object, direction)
    );
  }

  //canConsume(object: GameObject, direction: Direction): object is Material {
  //  return (
  //    object instanceof Material &&
  //    object.component === Ore
  //  );
  //}

  //onConsume(ore: Material, direction: Direction): void {
  //  game.removeObject(ore);
  //  let bar = this.createOutput(ore);

  //  if (bar) {
  //    game.addObject(bar, this.x, this.y);
  //    game.addAction(new Slide(this, direction));
  //  }

  //  this.emitSmoke();
  //}

  onAccept(ore: Material, direction: Direction): void {
    let bar = this.createOutput(ore);
    game.removeObject(ore);

    if (bar) {
      game.addObject(bar, this.x, this.y);
      game.addAction(new Slide(bar, direction));
    }

    this.emitSmoke();
  }

  private async emitSmoke() {
    let [ex, ey] = ui.gridToGlobal(this.x + 0.4, this.y - 0.1);
    let emitter = createSmokeEmitter(ex, ey);
    emitter.start();
    await sleep(500);
    return emitter.stopThenRemove();
  }
}

export class Anvil extends GameObject {
  name = "Anvil";
  description = "Turns bars into parts";
  sprite = new Sprite("anvil");

  canBeMoved() {
    return true;
  }

  isOutputClear(material: Material, direction: Direction): boolean {
    let cell = game.getCellInDirection(this.x, this.y, direction);
    let output = this.createOutput(material);
    return (
      cell != null &&
      output != null &&
      cell.canAccept(output, direction)
    );
  }

  createOutput(material: Material): Material | undefined {
    return Material.createByRarity({
      component: [SwordTip, SwordBlade, SwordHandle],
      element: material.element,
      set: [Straight],
    }) || Material.createByRarity({
      component: [SwordTip, SwordBlade, SwordHandle],
      element: material.element,
    });
  }

  canAccept(object: GameObject, direction: Direction): object is Material {
    return (
      object instanceof Material &&
      object.component === Bar &&
      this.isOutputClear(object, direction)
    );
  }

  //canConsume(object: GameObject, direction: Direction): object is Material {
  //  return (
  //    object instanceof Material &&
  //    object.component === Bar
  //  );
  //}

  //onConsume(bar: Material, direction: Direction): void {
  //  let output = this.createOutput(bar);
  //  game.removeObject(bar);

  //  if (output) {
  //    if (output.canBeRotated()) {
  //      output.rotation = directionToRotation(direction);
  //    }

  //    game.addObject(output, this.x, this.y);
  //    game.addAction(new Slide(this, direction));
  //  }

  //  this.emitSparks();
  //}

  onAccept(bar: Material, direction: Direction): void {
    game.removeObject(bar);

    let output = this.createOutput(bar);

    if (output) {
      if (output.canBeRotated()) {
        output.rotation = directionToRotation(direction);
      }

      game.addObject(output, this.x, this.y);
      game.addAction(new Slide(output, direction));
    }

    this.emitSparks();
  }

  private async emitSparks() {
    let [ex, ey] = ui.gridToGlobal(this.x + 0.5, this.y + 0.5);
    let emitter = createSparkEmitter(ex, ey);
    emitter.burst(20);
    await sleep(200);
    emitter.burst(10);
    return emitter.stopThenRemove();
  }
}

export class Mule extends GameObject {
  name = "Mule";
  description = "Sells items at trade price";

  sprite = new AnimatedSprite({
    "idle": {
      speed: 400,
      loop: true,
      frames: ["mule_idle_1", "mule_idle_2"],
    },
  }, "idle");

  canBeMoved(): boolean {
    return true;
  }

  canAccept(object: GameObject): object is Material {
    return object instanceof Material;
  }

  canConsume(object: GameObject): object is Material {
    return object instanceof Material;
  }

  onAccept(object: Material): void {
    this.sell(object);
  }

  onConsume(object: Material, direction: Direction): void {
    this.sell(object);
    game.addAction(new Slide(this, direction));
  }

  sell(object: Material) {
    game.removeObject(object);
    // TODO: Use better calculation
    let coins = 5;
    game.coins += coins;
    this.flashOfGold(coins);
  }

  private flashOfGold(coins: number) {
    let [ex, ey] = ui.gridToGlobal(this.x + 0.5, this.y + 0.5);
    let fx = createCoinEmitter(ex, ey, 0, 0);
    fx.burst(coins);
    return fx.stopThenRemove();
  }
}

export class Goblin extends GameObject {
  name = "Goblin";
  description = "Steals items";
  hp = { current: 1, max: 1 };
  tags = [Tags.Goblin];

  sprite = new AnimatedSprite({
    "idle": {
      speed: 400,
      loop: true,
      frames: ["goblin_runt_idle_1", "goblin_runt_idle_2"],
    },
  }, "idle");

  canAccept(object: GameObject): object is Material {
    return object instanceof Material;
  }

  onAccept(object: Material): void {
    game.removeObject(object);
    this.puffOfSmoke();
  }

  private puffOfSmoke() {
    let [ex, ey] = ui.gridToGlobal(this.x + 0.5, this.y + 0.5);
    let fx = createSmokeEmitter(ex, ey);
    fx.initialAngleSpread = Math.PI * 2;
    fx.floorLevel = -Infinity;
    fx.initialSpeed = 20;
    fx.initialLife = 400;
    fx.initialLifeSpread = 100;
    fx.gravity = 0;
    fx.burst(20);
    return fx.stopThenRemove();
  }
}

export class GoblinBrute extends GameObject {
  name = "Brute";
  description = "Steals objects";
  hp = { current: 1, max: 3 };
  tags = [Tags.Goblin];

  sprite = new AnimatedSprite({
    "idle": {
      speed: 400,
      loop: true,
      frames: ["goblin_brute_idle_1", "goblin_brute_idle_2"],
    },
  }, "idle");

  canAccept(object: GameObject): object is GameObject {
    return (
      !(object instanceof Material) &&
      !object.tags.includes(Tags.Dwarf) &&
      !object.tags.includes(Tags.Goblin)
    );
  }

  onAccept(object: Material): void {
    game.removeObject(object);
    this.puffOfSmoke();
  }

  private puffOfSmoke() {
    let [ex, ey] = ui.gridToGlobal(this.x + 0.5, this.y + 0.5);
    let fx = createSmokeEmitter(ex, ey);
    fx.initialAngleSpread = Math.PI * 2;
    fx.floorLevel = -Infinity;
    fx.initialSpeed = 20;
    fx.initialLife = 400;
    fx.initialLifeSpread = 100;
    fx.gravity = 0;
    fx.burst(20);
    return fx.stopThenRemove();
  }
}

export class GoblinLooter extends GameObject {
  name = "Looter";
  description = "Looks rich";
  hp = { current: 1, max: 1 };
  tags = [Tags.Goblin];

  sprite = new AnimatedSprite({
    "idle": {
      speed: 400,
      loop: true,
      frames: ["goblin_looter_idle_1", "goblin_looter_idle_2"],
    },
  }, "idle");
}

export class GoblinShaman extends GameObject {
  name = "Shaman";
  description = "Creates totems";
  hp = { current: 1, max: 1 };
  tags = [Tags.Goblin];

  sprite = new AnimatedSprite({
    "idle": {
      speed: 400,
      loop: true,
      frames: ["goblin_shaman_idle_1", "goblin_shaman_idle_2"],
    },
  }, "idle");

  speed = 3_000;
  timer = 0;
  totemChance = 0.1;

  update(dt: number) {
    this.timer -= dt;

    if (this.timer <= 0) {
      this.timer = this.speed;
      if (Math.random() < this.totemChance) {
        this.spawnTotem();
        this.runAway();
      }
    }
  }

  spawnTotem() {
    game.addObject(new GoblinTotem(), this.x, this.y);
  }

  runAway() {
    let directions = DIRECTIONS.filter(direction => {
      let cell = game.getCellInDirection(this.x, this.y, direction);
      return cell?.isEmpty();
    });

    if (directions.length > 0) {
      let direction = randomElement(directions)
      game.addAction(new Slide(this, direction));
    }
  }
}

export class GoblinTotem extends GameObject {
  name = "Totem";
  description = "Heals goblins";
  hp = { current: 1, max: 1 };
  sprite = new Sprite("goblin_totem");
  speed = 5_000;
  timer = this.speed;

  update(dt: number) {
    this.timer -= dt;

    if (this.timer <= 0) {
      this.timer = this.speed;
      this.heal();
    }
  }

  heal() {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let x = this.x + i;
        let y = this.y + j;
        let cell = game.getCell(x, y);
        if (cell == null) continue;
        for (let object of cell.objects) {
          if (object.hp && object.tags.includes(Tags.Goblin)) {
            game.addAction(new Heal(object, 1));
          }
        }
      }
    }
  }
}

export class Healer extends GameObject {
  name = "Healer";
  description = "Heals dwarves";
  speed = 5_000;
  timer = this.speed;

  sprite = new AnimatedSprite({
    "idle": {
      speed: 400,
      loop: true,
      frames: ["dwarf_healer_idle_1", "dwarf_healer_idle_2"],
    },
    "heal": {
      speed: 500,
      "frames": ["dwarf_healer_heal"],
    },
  }, "idle");

  update(dt: number) {
    this.timer -= dt;

    if (this.timer <= 0) {
      this.timer = this.speed;
      this.heal();
    }
  }

  heal() {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let x = this.x + i;
        let y = this.y + j;
        let cell = game.getCell(x, y);
        if (cell == null) continue;
        this.sprite.setAnimation("heal")
          .then(() => this.sprite.setAnimation("idle"));

        for (let object of cell.objects) {
          if (object.hp && object.tags.includes(Tags.Dwarf)) {
            game.addAction(new Heal(object, 1));
          }
        }
      }
    }
  }
}

export class Warrior extends GameObject {
  name = "Warrior";
  description = "Kills goblins";
  hp = { current: 3, max: 3 };
  tags = [Tags.Dwarf];

  sprite = new AnimatedSprite({
    "idle": {
      speed: 400,
      loop: true,
      frames: ["dwarf_warrior_idle_1", "dwarf_warrior_idle_2"],
    },
    "attack": {
      speed: 75,
      frames: ["dwarf_warrior_attack_1", "dwarf_warrior_attack_2", "dwarf_warrior_attack_3"],
    },
  }, "idle");

  canBeMoved(): boolean {
    return true;
  }

  canAccept(object: GameObject): object is Material {
    return (
      object instanceof Material &&
      object.component === Bar
    );
  }

  onAccept(object: GameObject): void {
    game.removeObject(object);
    game.addAction(new ChangeHP(this, +1));
  }

  onBump(object: GameObject): void {
    if (object.tags.includes(Tags.Goblin)) {
      this.sprite.setAnimation("attack").then(() => {
        this.sprite.setAnimation("idle");
      });
      game.addAction(new Damage(this, object, 1));
      game.addAction(new Damage(object, this, 1));
    }
  }
}

export class Bucket extends GameObject {
  name = "Bucket";
  sprite = new Sprite("bucket");

  canBeMoved(): boolean {
    return true;
  }

  onBump(object: GameObject, direction: Direction): void {
    if (object.canBeMoved()) {
      game.addAction(new Slide(object, direction));
    }
  }
}

export class Bank extends GameObject implements Storage {
  name = "Banks";
  description = "Invests gold bars";
  timer = 0;
  speed = 10_000;
  emitter = createCoinEmitter(0, 0, 0, 0);

  container = new Container<Material>({
    capacity: 16,
    rule: (object: GameObject): object is Material => {
      return (
        object instanceof Material &&
        object.element === Gold &&
        object.component === Bar
      );
    }
  })

  sprite = new Sprite("bank");

  canBeMoved(): boolean {
    return true;
  }

  canAccept(object: GameObject): object is Material {
    return this.container.canStore(object);
  }

  onAccept(object: GameObject, direction: Direction): void {
    if (this.container.canStore(object)) {
      game.removeObject(object);
      this.container.push(object);
    }
  }

  update(dt: number) {
    this.timer += dt;
    if (this.timer >= this.speed) {
      this.timer = 0;
      let coins = this.container.objects.length;
      game.coins += coins;
      this.emitter.x = this.sprite.x;
      this.emitter.y = this.sprite.y;
      this.emitter.burst(coins);
    }
  }
}

export class Whetstone extends GameObject {
  name = "Whetstone";
  description = "Refines sword blades";

  sprite = new AnimatedSprite({
    idle: {
      loop: true,
      speed: 100,
      frames: ["whetstone_1", "whetstone_2", "whetstone_3"],
    },
  }, "idle");

  canBeMoved() {
    return true;
  }

  isOutputClear(material: Material, direction: Direction): boolean {
    let cell = game.getCellInDirection(this.x, this.y, direction);
    let output = this.createOutput(material);
    return (
      cell != null &&
      output != null &&
      cell.canAccept(output, direction)
    );
  }

  createOutput(material: Material): Material | undefined {
    return Material.createByRarity({
      component: material.component,
      element: material.element,
    });
  }

  canAccept(object: GameObject, direction: Direction): object is Material {
    return (
      object instanceof Material &&
      [SwordTip, SwordBlade].includes(object.component) &&
      this.isOutputClear(object, direction)
    );
  }

  onAccept(part: Material, direction: Direction): void {
    let newPart = this.createOutput(part);
    game.removeObject(part);

    if (newPart) {
      newPart.rotation = part.rotation;
      game.addObject(newPart, this.x, this.y);
      game.addAction(new Slide(newPart, direction));
    }

    this.emitSmoke();
  }

  private async emitSmoke() {
    let [ex, ey] = ui.gridToGlobal(this.x + 0.4, this.y - 0.1);
    let emitter = createSmokeEmitter(ex, ey);
    emitter.start();
    await sleep(500);
    return emitter.stopThenRemove();
  }
}

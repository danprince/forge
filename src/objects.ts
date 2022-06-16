import { swipe } from "./actions";
import { Bar, Ore, SwordBlade, SwordHandle, SwordTip } from "./crafting";
import { sleep } from "./engine";
import { createBloodEmitter, createSmokeEmitter, createSparkEmitter } from "./fx";
import { Direction, Game, GameObject, Material, Sprite } from "./game";

export class Furnace extends GameObject<Material> {
  constructor() {
    super(new Sprite("furnace"));
  }

  canAccept(object: GameObject): object is Material {
    return (
      object instanceof Material &&
      object.component === Ore
    );
  }

  onAccept(ore: Material, direction: Direction): void {
    game.removeObject(ore);

    let bar = Material.createByRarity({
      component: Bar,
      element: ore.element,
    });

    if (bar) {
      game.addObject(bar, this.x, this.y);
      swipe(bar, direction);
    }

    this.emitSmoke();
  }

  private async emitSmoke() {
    let [ex, ey] = ui.viewport.gridToGlobal(this.x + 0.4, this.y - 0.1);
    let emitter = createSmokeEmitter(ex, ey);
    emitter.start();
    await sleep(500);
    return emitter.stopThenRemove();
  }
}

export class Anvil extends GameObject<Material> {
  constructor() {
    super(new Sprite("anvil"));
  }

  canAccept(object: GameObject): object is Material {
    return (
      object instanceof Material &&
      object.component === Bar
    );
  }

  onAccept(bar: Material, direction: Direction): void {
    game.removeObject(bar);

    let output = Material.createByRarity({
      component: [SwordTip, SwordBlade, SwordHandle],
      element: bar.element,
    });

    if (output) {
      game.addObject(output, this.x, this.y);
      swipe(output, direction);
    }

    this.emitSparks();
  }

  private async emitSparks() {
    let [ex, ey] = ui.viewport.gridToGlobal(this.x + 0.5, this.y + 0.5);
    let emitter = createSparkEmitter(ex, ey);
    emitter.burst(20);
    await sleep(200);
    emitter.burst(10);
    return emitter.stopThenRemove();
  }
}

export class Mule extends GameObject<Material> {
  constructor() {
    super(new Sprite("pack_mule"));
  }

  canBeMoved(): boolean {
    return true;
  }

  canAccept(object: GameObject): object is Material {
    return object instanceof Material;
  }

  onAccept(object: Material): void {
    game.removeObject(object);
    // TODO: Use better calculation
    game.coins += 5;
  }
}

export class Goblin extends GameObject<Material> {
  constructor() {
    super(new Sprite("goblin"));
  }

  canAccept(object: GameObject): object is Material {
    return object instanceof Material;
  }

  onAccept(object: Material): void {
    game.removeObject(object);
    this.puffOfSmoke();
  }

  private puffOfSmoke() {
    let [ex, ey] = ui.viewport.gridToGlobal(this.x + 0.5, this.y + 0.5);
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

export class Warrior extends GameObject<Material> {
  constructor() {
    super(new Sprite("warrior"));
  }

  canBeMoved(): boolean {
    return true;
  }

  onBump(object: GameObject): void {
    if (object instanceof Goblin) {
      game.removeObject(object);
      let [dx, dy] = ui.viewport.gridToGlobal(object.x + 0.5, object.y + 0.5);
      let fx = createBloodEmitter(dx, dy);
      fx.burst(30);
      fx.stopThenRemove();
    }
  }
}


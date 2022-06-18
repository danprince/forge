import { Damage, Slide } from "./actions";
import { Bar, Ore, SwordBlade, SwordHandle, SwordTip } from "./crafting";
import { sleep } from "./engine";
import { createCoinEmitter, createSmokeEmitter, createSparkEmitter } from "./fx";
import { AnimatedSprite, Direction, directionToRotation, GameObject, Hitpoints, Material, Sprite } from "./game";

export class Furnace extends GameObject {
  name = "Furnace";
  description = "Turns ores into bars";
  sprite = new Sprite("furnace");

  isOutputClear(direction: Direction): boolean {
    let cell = game.getCellInDirection(this.x, this.y, direction);
    return cell != null && cell.isEmpty();
  }

  canAccept(object: GameObject, direction: Direction): object is Material {
    return (
      object instanceof Material &&
      object.component === Ore &&
      this.isOutputClear(direction)
    );
  }

  onAccept(ore: Material, direction: Direction): void {
    game.removeObject(ore);

    let bar = Material.createByRarity({
      component: Bar,
      element: ore.element,
    });

    if (bar) {
      if (bar.canBeRotated()) {
        bar.rotation = directionToRotation(direction);
      }

      game.addObject(bar, this.x, this.y);
      game.addAction(new Slide(bar, direction));
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

export class Anvil extends GameObject {
  name = "Anvil";
  description = "Turns bars into parts";
  sprite = new Sprite("anvil");

  isOutputClear(direction: Direction): boolean {
    let cell = game.getCellInDirection(this.x, this.y, direction);
    return cell != null && cell.isEmpty();
  }

  canAccept(object: GameObject, direction: Direction): object is Material {
    return (
      object instanceof Material &&
      object.component === Bar &&
      this.isOutputClear(direction)
    );
  }

  onAccept(bar: Material, direction: Direction): void {
    game.removeObject(bar);

    let output = Material.createByRarity({
      component: [SwordTip, SwordBlade, SwordHandle],
      element: bar.element,
    });

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
    let [ex, ey] = ui.viewport.gridToGlobal(this.x + 0.5, this.y + 0.5);
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
      frames: ["pack_mule", "pack_mule_2"],
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
    let [ex, ey] = ui.viewport.gridToGlobal(this.x + 0.5, this.y + 0.5);
    let fx = createCoinEmitter(ex, ey, 0, 0);
    fx.burst(coins);
    return fx.stopThenRemove();
  }
}

export class Goblin extends GameObject {
  name = "Goblin";
  description = "Steals items";
  hp = { current: 1, max: 1 };

  sprite = new AnimatedSprite({
    "idle": {
      speed: 400,
      loop: true,
      frames: ["goblin", "goblin_2"],
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

export class Warrior extends GameObject {
  name = "Warrior";
  description = "Kills goblins";
  hp = { current: 3, max: 3 };

  sprite = new AnimatedSprite({
    "idle": {
      speed: 400,
      loop: true,
      frames: ["warrior", "warrior_2"],
    },
    "attack": {
      speed: 75,
      frames: ["warrior_attack_1", "warrior_attack_2", "warrior_attack_3"],
    },
  }, "idle");

  canBeMoved(): boolean {
    return true;
  }

  onBump(object: GameObject): void {
    if (object instanceof Goblin) {
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

import { Ore } from "./crafting";
import { assert, sleep, tween } from "./engine";
import { createBloodEmitter, createHealthEmitter } from "./fx";
import { Action, Direction, directionToVector, GameObject, Material } from "./game";
import { Goblin } from "./objects";

export class Rotate extends Action {
  constructor(readonly object: GameObject) {
    super();
  }

  async run() {
    this.object.rotation += 1;
    let angle = this.object.rotation / 4 * Math.PI * 2;
    await tween(this.object.sprite, { rotation: angle }, 100);
  }
}

export class Slide extends Action {
  constructor(readonly object: GameObject, readonly direction: Direction) {
    super();
  }

  async run() {
    let { object, direction } = this;

    let [dstX, dstY] = game.findPath(object, direction);
    let [srcX, srcY] = ui.localToGrid(object.sprite.x, object.sprite.y);

    // Calculate duration from speed in tiles per second
    let speed = 30;
    let distance = Math.hypot(srcX - dstX, srcY - dstY);
    let duration = distance / speed * 1000;

    // Calculate the final position for the sprite (local coordinate space)
    let [lx1, ly1] = ui.gridToLocal(dstX, dstY);

    // Move the object behind the scenes
    game.moveObject(object, dstX, dstY);

    // Tween the sprite to the destination
    await tween(object.sprite, { x: lx1, y: ly1 }, duration);

    // Check whether we'll be accepted/consume any objects at the destination
    let targets = game.getObjects(dstX, dstY);

    for (let target of targets) {
      if (object.canConsume(target, direction)) {
        object.onConsume(target, direction);
        break;
      }
    }

    for (let target of targets) {
      if (target.canAccept(object, direction)) {
        target.onAccept(object, direction);
        break;
      }
    }

    // Check whether we'll bump any objects
    let [dx, dy] = directionToVector(direction);
    let bumpTargets = game.getObjects(dstX + dx, dstY + dy);

    for (let target of bumpTargets) {
      object.onBump(target, direction);
    }
  }
}

export class SpawnOre extends Action {
  private speed = 10_000;
  private elapsed = 0;
  goblinChance = 0.1;

  // We'll control calling "run" ourselves for this action.
  start() {}

  update(dt: number) {
    this.elapsed += dt;
    if (this.elapsed >= this.speed) {
      this.elapsed = 0;
      this.run();
    }
  }

  async run() {
    let object: GameObject | undefined = Material.createByRarity({ component: [Ore] });
    let cells = this.getPotentialCells();
    let cell = cells[Math.floor(Math.random() * cells.length)];

    if (game.event == null && Math.random() <= this.goblinChance) {
      object = new Goblin();
    }

    if (object && cell) {
      let direction: Direction =
        cell.x === 0 ? "east" :
        cell.y === 0 ? "south" :
        cell.x > 0 ? "west" :
        cell.y > 0 ? "north" :
        "north";

      game.addObject(object, cell.x, cell.y);
      game.addAction(new Slide(object, direction));
    }
  }

  getPotentialCells() {
    return game.cells.filter(cell => {
      return cell.objects.length === 0 && (
        cell.x === 0 ||
        cell.y === 0 ||
        cell.x === game.columns - 1 ||
        cell.y === game.rows - 1
      );
    });
  }
}

export class Damage extends Action {
  constructor(
    readonly dealer: GameObject,
    readonly target: GameObject,
    readonly amount: number
  ) {
    super();
  }

  run() {
    game.addAction(new ChangeHP(this.target, -this.amount));
  }
}

export class ChangeHP extends Action {
  constructor(
    readonly target: GameObject,
    readonly amount: number,
  ) {
    super();
  }

  run() {
    let { target, amount } = this;
    assert(target.hp, "Damage target does not have HP");
    target.hp.current += amount;
    target.hp.current = Math.min(target.hp.current, target.hp.max);
    target.hp.current = Math.max(0, target.hp.current);
    if (target.hp.current === 0) {
      game.addAction(new Death(target));
    }
  }
}

export class Death extends Action {
  constructor(
    readonly target: GameObject,
  ) {
    super();
  }

  run() {
    let { target } = this;
    game.removeObject(target);
    let [dx, dy] = ui.gridToGlobal(target.x + 0.5, target.y + 0.5);
    let fx = createBloodEmitter(dx, dy);
    fx.burst(30);
    fx.stopThenRemove();
  }
}

export class Heal extends Action {
  constructor(
    readonly target: GameObject,
    readonly amount: number
  ) {
    super();
  }

  async run() {
    let { target } = this;
    let [dx, dy] = ui.gridToGlobal(target.x, target.y);
    let emitter = createHealthEmitter(dx, dy);
    emitter.w = target.sprite.w;
    emitter.h = target.sprite.h;
    emitter.start();
    await sleep(300);
    emitter.stopThenRemove();
    game.addAction(new ChangeHP(this.target, this.amount));
  }
}

import { Slide } from "./actions";
import { Container, Storage } from "./components";
import { Gold, Bar } from "./crafting";
import { createSparkEmitter } from "./fx";
import { AnimatedSprite, Direction, GameObject, Material, Sprite } from "./game";

/**
 * The logic interface is required for any object that has behaviour for
 * an automaton that is currently in the same cell.
 */
export interface Logic {
  logic(automaton: Automaton): void;
}

export function hasLogic(object: GameObject): object is GameObject & Logic {
  return "logic" in object;
}

export class Automaton extends GameObject implements Storage {
  name = "Automaton";

  container = new Container<Material>({
    capacity: 8,
    rule(object, stored): object is Material {
      return object instanceof Material && stored? object.isEqual(stored) : true;
    },
  });

  sprite = new AnimatedSprite({
    idle: {
      loop: true,
      speed: 400,
      frames: ["automaton_idle_1", "automaton_idle_2"],
    },
  }, "idle");

  canBeMoved() {
    return true;
  }

  emitter = createSparkEmitter(0, 0);
  speed = 800;
  timer = 0;

  update(dt: number) {
    this.timer += dt;

    if (this.timer >= this.speed) {
      this.timer = 0;
      let [gx, gy] = ui.gridToGlobal(this.x + 0.5, this.y + 0.5);
      this.emitter.x = gx;
      this.emitter.y = gy;
      this.emitter.burst(2);
    }
  }

  canAccept(object: GameObject, direction: Direction): object is Material {
    return (
      object instanceof Material &&
      this.container.canStore(object)
    );
  }

  onAccept(object: Material, direction: Direction): void {
    game.removeObject(object);
    this.container.push(object);
  }

  logicUpdate() {
    let cell = game.getCell(this.x, this.y)!;

    for (let object of cell.objects) {
      if (hasLogic(object)) {
        object.logic(this);
      }
    }
  }
}

export class Redirector extends GameObject implements Logic {
  name = "Redirector";
  description = "Redirect automatons";
  sprite = new Sprite("logic_redirector");

  canBeMoved(): boolean {
    return true;
  }

  canAccept(object: GameObject): object is Automaton {
    return object instanceof Automaton;
  }

  canBeRotated(): boolean {
    return true;
  }

  logic(automaton: Automaton) {
    game.addAction(new Slide(automaton, this.direction));
  }
}

export class Waiter extends GameObject implements Logic {
  name = "Waiter";
  description = "Automatons wait until full";
  sprite = new Sprite("logic_waiter");

  canBeMoved(): boolean {
    return true;
  }

  canBeRotated() {
    return true;
  }

  canAccept(object: GameObject): object is Automaton {
    return object instanceof Automaton;
  }

  logic(automaton: Automaton) {
    if (automaton.container.isFull()) {
      game.addAction(new Slide(automaton, this.direction));
    }
  }
}

export class Emptier extends GameObject implements Logic {
  name = "Emptier";
  description = "Automatons empty";
  sprite = new Sprite("logic_emptier");
  exitDirection: Direction = "north";

  canBeMoved(): boolean {
    return true;
  }

  canBeRotated() {
    return true;
  }

  canAccept(object: GameObject): object is Automaton {
    return object instanceof Automaton;
  }

  onAccept(object: GameObject, direction: Direction): void {
    this.exitDirection = direction;
  }

  canOutput(output: GameObject): boolean {
    let cell = game.getCellInDirection(this.x, this.y, this.direction);
    return cell != null && cell.canAccept(output, this.direction);
  }

  logic(automaton: Automaton) {
    if (automaton.container.isEmpty()) {
      game.addAction(new Slide(automaton, this.exitDirection));
      return;
    }

    let material = automaton.container.peek()!;

    if (this.canOutput(material)) {
      automaton.container.pop()!;
      game.addObject(material, this.x, this.y);
      game.addAction(new Slide(material, this.direction));
    }
  }
}

export class Filter extends GameObject implements Logic {
  name = "Filter";
  description = "Filter automatons";
  sprite = new Sprite("logic_filter");
  component = Bar;
  element = Gold;

  canBeMoved(): boolean {
    return true;
  }

  canAccept(object: GameObject): object is Automaton {
    return object instanceof Automaton;
  }

  matches(material: Material) {
    return (
      material.element === this.element &&
      material.component === this.component
    );
  }

  logic(automaton: Automaton) {
    if (
      automaton.container.isEmpty() ||
      !this.matches(automaton.container.peek()!)
    ) {
      game.addAction(new Slide(automaton, "west"));
    } else {
      game.addAction(new Slide(automaton, "east"));
    }
  }
}

export class Assembler extends GameObject implements Storage {
  name = "Assembler";
  description = "Creates automatons from gold bars";
  outputDirection: Direction = "north";

  container = new Container<Material>({
    capacity: 10,
    rule: (object: GameObject): object is Material => {
      return (
        object instanceof Material &&
        object.element === Gold &&
        object.component === Bar
      );
    }
  })

  sprite = new AnimatedSprite({
    idle: {
      loop: true,
      speed: 100,
      frames: ["assembler_1", "assembler_2", "assembler_3"],
    },
  }, "idle");

  canBeMoved(): boolean {
    return true;
  }

  canAccept(object: GameObject): object is Material {
    return this.container.canStore(object);
  }

  onAccept(object: GameObject, direction: Direction): void {
    if (this.container.canStore(object)) {
      this.outputDirection = direction;
      game.removeObject(object);
      this.container.push(object);
    }
  }

  private getOutputCell() {
    return game.getCellInDirection(this.x, this.y, this.outputDirection);
  }

  update() {
    if (this.container.isFull()) {
      let automaton = new Automaton();
      let cell = this.getOutputCell();
      if (cell?.canAccept(automaton, this.outputDirection)) {
        this.container.empty();
        game.addObject(automaton, this.x, this.y);
        game.addAction(new Slide(automaton, this.outputDirection));
      }
    }
  }
}

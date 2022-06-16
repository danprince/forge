import { SpriteId } from "./engine";

export type Direction = "north" | "east" | "south" | "west";

let vectorsByDirection: Record<Direction, [x: number, y: number]> = {
  "north": [0, -1],
  "east": [1, 0],
  "south": [0, 1],
  "west": [-1, 0],
};

export function directionToVector(direction: Direction): [x: number, y: number] {
  return vectorsByDirection[direction];
}

export function directionToRadians(direction: Direction): number {
  switch (direction) {
    case "north": return 0;
    case "east": return Math.PI * 0.5;
    case "south": return Math.PI;
    case "west": return Math.PI * 1.5;
  }
}

export class Cell {
  x: number;
  y: number;
  objects: GameObject[] = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(object: GameObject) {
    this.objects.push(object);
  }

  remove(object: GameObject) {
    this.objects.splice(this.objects.indexOf(object), 1);
  }
}

export class Sprite {
  name: SpriteId;
  x = 0;
  y = 0;
  rotation = 0;

  constructor(name: SpriteId) {
    this.name = name;
  }
}

export class GameObject<Accept extends GameObject<any> = GameObject<any>> {
  sprite: Sprite;
  x: number = 0;
  y: number = 0;
  rotation: number = 0;

  constructor(sprite: Sprite) {
    this.sprite = sprite;
  }

  get direction(): Direction {
    switch (this.rotation % 4) {
      case 0: return "north";
      case 1: return "east";
      case 2: return "south";
      case 3: return "west";
      default: throw new Error("Invalid rotation");
    }
  }

  canBeRotated(): boolean {
    return false;
  }

  canBeMoved(): boolean {
    return false;
  }

  sync() {
    let [x, y] = ui.viewport.gridToLocal(this.x, this.y);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.rotation = (this.rotation % 4) / 4 * (Math.PI * 2);
  }

  canAccept(object: GameObject, direction: Direction): object is Accept {
    return false;
  }

  onAccept(object: Accept, direction: Direction) {}
  onBump(object: GameObject, direction: Direction) {}

  update(dt: number) {}
}


export enum Symmetry {
  None = "none",
  TwoWay = "two-way",
  FourWay = "four-way",
}

export class Element {
  constructor(
    readonly name: string,
    readonly rarity: number = 1,
  ) {}
}

export class Component {
  constructor(
    readonly name: string,
    readonly moves: boolean = false,
    readonly rotates: boolean = false,
    readonly symmetry: Symmetry = Symmetry.None,
    readonly rarity: number = 1,
  ) {}
}

export class SetBonus {
  constructor(
    readonly name: string,
    readonly rarity: number = 1,
  ) {}
}

export interface Query {
  element?: Element | Element[];
  component?: Component | Component[];
  set?: SetBonus | SetBonus[];
}

export class Variant {
  static registry: Variant[] = [];

  constructor(
    readonly element: Element,
    readonly component: Component,
    readonly spriteId: SpriteId,
    readonly set?: SetBonus,
  ) {
    Variant.registry.push(this);
  }

  get rarity() {
    return this.element.rarity * this.component.rarity * (this.set?.rarity ?? 1);
  }

  static query({
    element = [],
    component = [],
    set = [],
  }: Query): Variant[] {
    return this.registry.filter(material => {
      let elements = Array.isArray(element) ? element : [element];
      let components = Array.isArray(component) ? component : [component];
      let sets = Array.isArray(set) ? set : [set];

      return (
        (elements.length === 0 || elements.includes(material.element)) &&
        (components.length === 0 || components.includes(material.component)) &&
        (sets.length === 0 || material.set && sets.includes(material.set))
      );
    });
  }

  static findByRarity(q: Query): Variant | undefined {
    let bag: Variant[] = [];

    for (let variant of Variant.query(q)) {
      for (let i = 0; i < variant.rarity; i++) {
        bag.push(variant);
      }
    }

    return bag[Math.floor(Math.random() * bag.length)];
  }
}

export class Material extends GameObject {
  constructor(
    readonly element: Element,
    readonly component: Component,
    readonly spriteId: SpriteId,
    readonly set?: SetBonus,
  ) {
    super(new Sprite(spriteId));
  }

  static createByRarity(query: Query = {}): Material | undefined {
    let variant = Variant.findByRarity(query);
    return variant && Material.from(variant);
  }

  static from(variant: Variant): Material {
    return new Material(
      variant.element,
      variant.component,
      variant.spriteId,
      variant.set
    );
  }

  canBeMoved(): boolean {
    return this.component.moves;
  }

  canBeRotated(): boolean {
    return this.component.rotates;
  }

  name() {
    if (this.set) {
      return `${this.set.name} ${this.component.name}`;
    } else {
      return `${this.element.name} ${this.component.name}`;
    }
  }
}

let flip: Record<Direction, Direction> = {
  "north": "south",
  "east": "west",
  "south": "north",
  "west": "east",
};

let vectors: Record<Direction, [x: number, y: number]> = {
  "north": [0, -1],
  "east": [1, 0],
  "south": [0, 1],
  "west": [-1, 0],
};

export class CraftingStream {
  outputs: Material[] = [];
  cells: Cell[] = [];
  private x: number;
  private y: number;
  private direction: Direction;

  constructor(x: number, y: number, direction: Direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
  }

  peek() {
    let material = game.getMaterial(this.x, this.y);

    if (
      material &&
      material.component.symmetry === Symmetry.None &&
      material.direction !== this.direction
    ) return;

    if (
      material &&
      material.component.symmetry === Symmetry.TwoWay &&
      material.direction !== this.direction &&
      material.direction !== flip[this.direction]
    ) return;

    return material;
  }

  take() {
    let material = this.peek();
    let cell = game.getCell(this.x, this.y);
    if (cell) this.cells.push(cell);
    if (material) this.outputs.push(material);
    let [dx, dy] = vectors[this.direction];
    this.x += dx;
    this.y += dy;
    return material;
  }
}

export abstract class Combinator {
  /**
   * Returns true if the combinator was able to operate on the given
   * crafting stream and false if it failed.
   */
  abstract process(input: CraftingStream): boolean;
}

export class One extends Combinator {
  constructor(readonly component: Component) {
    super();
  }

  process(inputs: CraftingStream): boolean {
    let input = inputs.peek();

    if (input?.component === this.component) {
      inputs.take();
      return true;
    } else {
      return false;
    }
  }
}

export class ZeroOrMore extends Combinator {
  constructor(readonly component: Component) {
    super();
  }

  process(inputs: CraftingStream): boolean {
    while (true) {
      let input = inputs.peek();

      if (input?.component === this.component) {
        inputs.take();
      } else {
        break;
      }
    }

    return true;
  }
}

export class Recipe {
  constructor(
    readonly rules: Combinator[],
    readonly onSuccess: (materials: Material[], cells: Cell[]) => void,
  ) {

  }

  attemptToCraft(x: number, y: number) {
    let material = game.getMaterial(x, y);

    switch (material?.component.symmetry) {
      case Symmetry.None: return (
        this.attemptToCraftInDirection(x, y, material.direction)
      );

      case Symmetry.TwoWay: return (
        this.attemptToCraftInDirection(x, y, material.direction) ||
        this.attemptToCraftInDirection(x, y, flip[material.direction])
      );

      case Symmetry.FourWay: return (
        this.attemptToCraftInDirection(x, y, "north") ||
        this.attemptToCraftInDirection(x, y, "east") ||
        this.attemptToCraftInDirection(x, y, "south") ||
        this.attemptToCraftInDirection(x, y, "west")
      );

      default: return false;
    }
  }

  attemptToCraftInDirection(x: number, y: number, direction: Direction): boolean {
    let stream = new CraftingStream(x, y, direction);

    for (let rule of this.rules) {
      let ok = rule.process(stream);
      if (ok === false) return false;
    }

    for (let material of stream.outputs) {
      game.removeObject(material);
    }

    this.onSuccess(stream.outputs, stream.cells);

    return true;
  }
}

export class Game {
  cells: Cell[] = [];
  coins: number = 0;
  swords: number = 0;
  recipes: Recipe[] = [];

  constructor(readonly columns: number, readonly rows: number) {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        this.cells[x + y * this.columns] = new Cell(x, y);
      }
    }
  }

  addRecipe(recipe: Recipe) {
    this.recipes.push(recipe);
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.columns && y < this.rows;
  }

  findPath(object: GameObject, direction: Direction): [x: number, y: number] {
    let [dx, dy] = directionToVector(direction);
    let { x, y } = object;
    let maxPathLength = Math.max(this.columns, this.rows);

    for (let i = 0; i < maxPathLength; i++) {
      let cell = this.getCell(x + dx, y + dy);
      if (!cell) break;
      let clear = cell.objects.length === 0;

      let accepted = !clear && cell.objects
        .some(target => target.canAccept(object, direction));

      if (clear || accepted) {
        x += dx;
        y += dy;
      }

      if (accepted) break;
    }

    return [x, y];
  }

  hasClearPath(x0: number, y0: number, x1: number, y1: number): boolean {
    let dx = x1 - x0;
    let dy = y1 - y0;

    let distance = Math.abs(dx + dy);
    let sx = Math.sign(dx);
    let sy = Math.sign(dy);

    // Start i from 1 to skip the starting cell.
    for (let i = 1; i <= distance; i++) {
      let x = x0 + i * sx;
      let y = y0 + i * sy;
      let cell = this.getCell(x, y);

      if (cell == null || cell.objects.length > 0) {
        return false;
      }
    }

    return true;
  }

  getCell(x: number, y: number): Cell | undefined {
    if (this.inBounds(x, y)) {
      return this.cells[x + y * this.columns];
    } else {
      return undefined;
    }
  }

  getObjects(x: number, y: number): GameObject[] {
    let cell = this.getCell(x, y);
    return cell ? cell.objects : [];
  }

  getObject(x: number, y: number): GameObject | undefined {
    return this.getObjects(x, y)[0];
  }

  getMaterial(x: number, y: number): Material | undefined {
    return this
      .getObjects(x, y)
      .find(object => object instanceof Material) as Material;
  }

  addObject(object: GameObject, x = object.x, y = object.y) {
    this.getCell(x, y)!.add(object);
    object.x = x;
    object.y = y;
    object.sync();
  }

  removeObject(object: GameObject) {
    this.getCell(object.x, object.y)!.remove(object);
  }

  moveObject(object: GameObject, x: number, y: number) {
    let src = this.getCell(object.x, object.y)!;
    let dst = this.getCell(x, y)!;
    src.remove(object);
    dst.add(object);
    object.x = x;
    object.y = y;
  }

  update(dt: number) {
    for (let cell of this.cells) {
      for (let object of cell.objects) {
        object.update(dt);
      }
    }
  }

  craftingCheck() {
    for (let cell of this.cells) {
      for (let recipe of this.recipes) {
        if (cell.objects.length > 0) {
          recipe.attemptToCraft(cell.x, cell.y);
        }
      }
    }
  }
}
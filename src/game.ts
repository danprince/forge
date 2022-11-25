import { atlas, randomElement, SpriteId } from "./engine";

export type Direction = "north" | "east" | "south" | "west";
export type Constructor<T> = { new(...args: any[]): T };
export const DIRECTIONS: readonly Direction[] = ["north", "east", "south", "west"];

let vectorsByDirection: Record<Direction, [x: number, y: number]> = {
  "north": [0, -1],
  "east": [1, 0],
  "south": [0, 1],
  "west": [-1, 0],
};

export function directionToVector(direction: Direction): [x: number, y: number] {
  return vectorsByDirection[direction];
}

export function directionToRotation(direction: Direction): number {
  switch (direction) {
    case "north": return 0;
    case "east": return 1;
    case "south": return 2;
    case "west": return 3;
  }
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

  isEmpty() {
    return this.objects.length === 0;
  }

  canAccept(object: GameObject, direction: Direction) {
    return (
      this.isEmpty() ||
      this.objects.some(target => target.canAccept(object, direction))
    );
  }
}

export interface Animation {
  speed: number;
  loop?: boolean;
  frames: SpriteId[];
}

export class Sprite {
  name: SpriteId;
  x = 0;
  y = 0;
  w = 0;
  h = 0;
  rotation = 0;

  constructor(
    name: SpriteId,
  ) {
    this.name = name;
    this.w = atlas[name].w;
    this.h = atlas[name].h;
  }

  update(dt: number) {}
}

export class AnimatedSprite<Animations extends Record<string, Animation> = any> extends Sprite {
  private animations: Animations;
  private currentAnimation: keyof Animations;
  private timeToNextFrame: number = 0;
  private frameIndex: number = 0;
  private _resolve = () => {};

  constructor(
    animations: Animations,
    initialAnimation: keyof Animations,
  ) {
    super(animations[initialAnimation].frames[0]);
    this.animations = animations;
    this.currentAnimation = initialAnimation;
    this.setAnimation(this.currentAnimation);
  }

  setAnimation(name: keyof Animations) {
    this.currentAnimation = name;
    this.timeToNextFrame = this.animations[name].speed;
    this.frameIndex = 0;
    this.name = this.animations[name].frames[0];
    return new Promise<void>(resolve => this._resolve = resolve);
  }

  update(dt: number) {
    this.timeToNextFrame -= dt;

    if (this.timeToNextFrame <= 0) {
      let animation = this.animations[this.currentAnimation];
      this.timeToNextFrame = animation.speed;
      this.frameIndex += 1;

      if (animation.loop) {
        this.frameIndex = this.frameIndex % animation.frames.length;
      } else if (this.frameIndex === animation.frames.length) {
        return this._resolve();
      }

      this.name = animation.frames[this.frameIndex];
    }
  }
}

export interface Hitpoints {
  current: number;
  max: number;
}

export enum Tags {
  Dwarf = "dwarf",
  Goblin = "goblin"
}

export class GameObject {
  sprite: Sprite = undefined!;
  x: number = 0;
  y: number = 0;
  rotation: number = 0;
  name: string = "";
  description: string = "";
  hp?: Hitpoints;
  tags: Tags[] = [];

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
    let [x, y] = ui.gridToLocal(this.x, this.y);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.rotation = (this.rotation % 4) / 4 * (Math.PI * 2);
  }

  canAccept(object: GameObject, direction: Direction): object is GameObject {
    return false;
  }

  canConsume(object: GameObject, direction: Direction): object is GameObject {
    return false;
  }

  onAccept(object: GameObject, direction: Direction) {}
  onConsume(object: GameObject, direction: Direction) {}
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
    super();
    this.sprite = new Sprite(spriteId);

    if (this.set) {
      this.name = `${this.set.name} ${this.component.name}`;
    } else {
      this.name =  `${this.element.name} ${this.component.name}`;
    }
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

  static of(element: Element, component: Component) {
    let variants = Variant.query({ element, component });
    return this.from(variants[0]);
  }

  isEqual(material: Material): boolean {
    return (
      this.component === material.component &&
      this.element === material.element &&
      this.set === material.set
    );
  }

  canBeMoved(): boolean {
    return this.component.moves;
  }

  canBeRotated(): boolean {
    return this.component.rotates;
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

export abstract class Action {
  abstract run(): void | Promise<void>;
  done = false;

  start(): void {
    Promise.resolve(this.run()).then(() => this.done = true);
  }

  end() {}

  update(dt: number) {}
}

export interface Cost {
  coins: number;
  swords: number;
}

export interface ShopItem {
  sprite: SpriteId;
  cost: Cost;
  create(): GameObject;
  locked: boolean;
  _reference: GameObject;
}

export class Shop {
  items: ShopItem[] = [];

  /**
   * Shorthand for addItem that tabulates better when adding lots of items.
   */
  add(sprite: SpriteId, coins: number, swords: number, create: () => GameObject) {
    this.addItem({
      sprite,
      cost: { coins, swords },
      create,
      // Items are unlocked by default for testing purposes
      locked: false,
      _reference: create(),
    });
  }

  unlock(itemType: Constructor<GameObject>) {
    let item = this.items.find(item => item._reference instanceof itemType);
    item!.locked = false;
  }

  unlockByCondition(predicate: (object: GameObject) => boolean) {
    let item = this.items.find(item => predicate(item._reference));
    item!.locked = false;
  }

  addItem(item: ShopItem) {
    this.items.push(item);
  }

  canAfford(item: ShopItem) {
    return (
      game.coins >= item.cost.coins &&
      game.swords >= item.cost.swords
    );
  }

  buy(item: ShopItem) {
    game.coins -= item.cost.coins;
    game.swords -= item.cost.swords;
  }
}

export abstract class Upgrade {
  abstract readonly sprite: SpriteId;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract requires: Constructor<Upgrade>[];
  onAction(action: Action) {}
  apply() {}
}

export abstract class Event {
  abstract name: string;
  start() {}
  stop() {}
  update(dt: number) {}
}

declare global {
  const game: Game;
}

export class Game {
  cells: Cell[] = [];
  coins: number = 0;
  swords: number = 0;
  recipes: Recipe[] = [];
  actions: Action[] = [];
  shop = new Shop();

  modifiers = {
    warriorBaseHealth: 2,
    damageReductionChance: 0,
    unlockedElements: [] as Element[],
    baseTradePriceMultiplier: 0,
    baseShopDiscount: 0,
    anvilCraftSwordChance: 0,
    baseSetBonusMultiplier: 0,
  };

  upgrades: Upgrade[] = [];
  nextUpgradeCost: number = 100;
  private upgradePool: Upgrade[] = [];

  event: Event | undefined;
  nextEventTime: number = 100;
  eventTimer: number = 0;
  private eventPool: Constructor<Event>[] = [];

  logicUpdateTimer: number = 0;
  logicUpdateSpeed: number = 1_000;

  constructor(readonly columns: number, readonly rows: number) {
    (window as any).game = this;

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        this.cells[x + y * this.columns] = new Cell(x, y);
      }
    }
  }

  addUpgradeToPool(upgrade: Upgrade) {
    this.upgradePool.push(upgrade);
  }

  getAvailableUpgrades() {
    return this.upgradePool.filter(upgrade => {
      // Unlock all upgrades for testing purposes
      return true;
      //return upgrade.requires.every(requirement => {
      //  return this.upgrades.some(upgrade => upgrade instanceof requirement);
      //});
    });
  }

  addEventToPool(eventType: Constructor<Event>) {
    this.eventPool.push(eventType);
  }

  changeEventTimer(amount: number) {
    // Ignore event timer during events
    if (this.event) return;

    this.eventTimer += amount;

    if (this.eventTimer >= this.nextEventTime) {
      let constructor = randomElement(this.eventPool);
      let event = new constructor();
      this.startEvent(event);
    }
  }

  startEvent(event: Event) {
    this.event = event;
    this.eventTimer = 0;
    this.event.start();
  }

  stopEvent() {
    this.event?.stop();
    this.event = undefined;
  }

  addUpgrade(upgrade: Upgrade) {
    this.upgradePool.splice(this.upgradePool.indexOf(upgrade), 1);
    this.upgrades.push(upgrade);
    upgrade.apply();
  }

  addEventAction(action: Action) {
    this.changeEventTimer(1);
    this.addAction(action);
  }

  addAction(action: Action) {
    for (let upgrade of this.upgrades) {
      upgrade.onAction(action);
    }

    this.actions.push(action);
    action.start();
  }

  removeAction(action: Action) {
    this.actions.splice(this.actions.indexOf(action), 1);
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

      let consumes = !clear && cell.objects
        .some(target => object.canConsume(target, direction));

      if (clear || accepted || consumes) {
        x += dx;
        y += dy;
      }

      if (accepted || consumes) break;
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

  getCellInDirection(x: number, y: number, direction: Direction): Cell | undefined {
    let [dx, dy] = directionToVector(direction);
    return this.getCell(x + dx, y + dy);
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
    if (this.event) {
      this.event.update(dt);
    }

    for (let action of this.actions) {
      action.update(dt);

      if (action.done) {
        this.craftingCheck();
        this.removeAction(action);
      }
    }

    for (let cell of this.cells) {
      for (let object of cell.objects) {
        object.update(dt);
        object.sprite.update(dt);
      }
    }

    this.logicUpdateTimer += dt;

    if (this.logicUpdateTimer >= this.logicUpdateSpeed) {
      this.logicUpdateTimer = 0;

      // TODO: Problem with cell-by-cell updates is we can update a single
      // entity multiple times. This set tracks which ones were already
      // updated this cycle.
      let updated = new Set<GameObject>();

      for (let cell of this.cells) {
        for (let object of cell.objects) {
          if ("logicUpdate" in object && !updated.has(object)) {
            // @ts-ignore
            object.logicUpdate();
            updated.add(object);
          }
        }
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

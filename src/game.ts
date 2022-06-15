import { SpriteId } from "./engine";

export type Direction = "north" | "east" | "south" | "west";

export class Cell {
  x: number;
  y: number;
  objects: Set<GameObject> = new Set();

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
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

export class GameObject {
  sprite: Sprite;
  x: number = 0;
  y: number = 0;
  direction: Direction = "north";

  constructor(sprite: Sprite) {
    this.sprite = sprite;
  }

  update(dt: number) {

  }
}

export class Game {
  cells: Cell[] = [];

  constructor(readonly columns: number, readonly rows: number) {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        this.cells[x + y * this.columns] = new Cell(x, y);
      }
    }
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.columns && y < this.rows;
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
    return cell ? Array.from(cell.objects) : [];
  }

  getObject(x: number, y: number): GameObject | undefined {
    return this.getObjects(x, y)[0];
  }

  addObject(x: number, y: number, object: GameObject) {
    let cell = this.getCell(x, y)!;
    object.x = x;
    object.y = y;
    cell.objects.add(object);
  }

  removeObject(object: GameObject) {
    let cell = this.getCell(object.x, object.y)!;
    cell.objects.delete(object);
  }

  update(dt: number) {
    for (let cell of this.cells) {
      for (let object of cell.objects) {
        object.update(dt);
      }
    }
  }
}

declare global {
  let game: Game;
  interface Window {
    game: Game;
  }
}

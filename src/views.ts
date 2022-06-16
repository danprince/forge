import { panel, scroll, TextLine } from "./components";
import { align, atlas, over, pointer, print, resize, restore, save, screen, spr, SpriteId, sprr, translate, View } from "./engine";

export abstract class Handler {
  start() {}
  stop() {}
  update(): void {};
}

export class UI extends View {
  viewport: ViewportView;
  shop: ShopView;
  handlers: Handler[] = [];

  constructor(width: number, height: number) {
    super();
    resize(width, height);
    this.w = width;
    this.h = height;
    this.viewport = new ViewportView();
    this.shop = new ShopView();
    this.shop.h = this.viewport.h;
    this.shop.x = this.viewport.x - this.shop.w - 5;
    this.shop.y = this.viewport.y;
  }

  private currentHandler(): Handler | undefined {
    return this.handlers[this.handlers.length - 1];
  }

  pushHandler(handler: Handler) {
    this.currentHandler()?.stop();
    this.handlers.push(handler);
    handler.start();
  }

  popHandler(handler: Handler) {
    this.currentHandler()?.stop();
    this.handlers.pop();
    this.currentHandler()?.start();
  }

  update(dt: number): void {
    this.currentHandler()?.update();
  }

  render() {
    this.viewport._render();
    this.shop._render();
  }

  pointerToGridExact(): [x: number, y: number] {
    return ui.viewport.globalToGrid(pointer.x, pointer.y);
  }

  pointerToGrid(): [x: number, y: number] {
    let [x, y] = ui.viewport.globalToGrid(pointer.x, pointer.y);
    return [Math.floor(x), Math.floor(y)];
  }
}

export class ViewportView extends View {
  tileSize = 15;

  constructor() {
    super();
    let [w, h] = screen();
    this.w = game.columns * this.tileSize;
    this.h = game.rows * this.tileSize;
    this.x = Math.floor(w / 2 - this.w / 2);
    this.y = Math.floor(h / 2 - this.h / 2);
  }

  render() {
    let ts = this.tileSize;

    for (let y = 0; y < game.rows; y++) {
      for (let x = 0; x < game.columns; x++) {
        let check = x % 2 ? y % 2 : !(y % 2);
        spr(check ? "tile_1" : "tile_2", x * ts, y * ts);
      }
    }

    panel("panel_frame_brown", -2, -2, this.w + 4, this.h + 4);

    for (let y = 0; y < game.rows; y++) {
      for (let x = 0; x < game.columns; x++) {
        let objects = game.getObjects(x, y);

        for (let object of objects) {
          sprr(
            object.sprite.name,
            object.sprite.x | 0,
            object.sprite.y | 0,
            object.sprite.rotation,
          );
        }
      }
    }
  }

  localToGrid(x: number, y: number): [x: number, y: number] {
    return [x / this.tileSize, y / this.tileSize];
  }

  gridToLocal(x: number, y: number): [x: number, y: number] {
    return [x * this.tileSize, y * this.tileSize];
  }

  globalToGrid(x: number, y: number) {
    return this.localToGrid(x - this.x, y - this.y);
  }

  gridToGlobal(x: number, y: number) {
    let [lx, ly] = this.gridToLocal(x, y);
    return [lx + this.x, ly + this.y];
  }
}

export class ShopView extends View {
  grid = new ShopGridView(3, 5);

  constructor() {
    super();
    this.w = this.grid.w - 1;
  }

  render() {
    panel("panel_frame_brown", -2, -2, this.w + 4, this.h + 4);

    save();
    let w = Math.floor(this.w / 2);
    let h = 12;
    this.currency(0, 0, w, h, "icon_coins", game.coins, ["Coins"]);
    translate(w + 1, 0);
    this.currency(0, 0, w, h, "icon_sword", game.swords, ["Swords"]);
    restore();

    this.grid.y = 13;
    this.grid._render();
  }

  currency(
    x: number,
    y: number,
    w: number,
    h: number,
    icon: SpriteId,
    amount: number,
    tooltipLines: TextLine[]
  ) {
    save();
    translate(x, y);
    let hover = panel("panel_grey", 0, 0, w, h);
    spr(icon, 2, 2);
    align("right");
    print(amount.toString(), w - 2, 3, "white", "black");
    restore();
    if (hover) {
      scroll(x, y - h, tooltipLines);
    }
  }
}

export class ShopGridView extends View {
  private cellWidth = atlas["slot_frame"].w + 1;
  private cellHeight = atlas["slot_frame"].h + 1;

  rows: number;
  columns: number;

  constructor(columns: number, rows: number) {
    super();
    this.rows = rows;
    this.columns = columns;
    this.w = columns * this.cellWidth;
    this.h = rows * this.cellHeight;
  }

  render() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        this.slot(x, y);
      }
    }
  }

  slot(x: number, y: number, disabled = false) {
    let dw = this.cellWidth;
    let dh = this.cellHeight;
    let dx = x * dw;
    let dy = y * dh;
    let hover = over(dx, dy, dw, dh);
    let active = hover && pointer.down;
    spr(disabled ? "slot_frame" : active ? "slot_frame_active" : hover ? "slot_frame_hover" : "slot_frame", dx, dy);
  }
}

import { panel, scroll, TextLine, tooltip } from "./components";
import { align, atlas, local, opacity, over, pointer, print, resize, restore, save, screen, spr, SpriteId, sprr, translate, View } from "./engine";
import { GameObject, ShopItem } from "./game";

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
    game.update(dt);
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

    let [px, py] = ui.pointerToGrid();
    let object = game.getObject(px, py);

    if (object) {
      let msg = [
        `${object.name}:`,
        object.description,
        object.canBeRotated() && `\x03 to \x01`,
        object.canBeMoved() && `\x04 to \x02`,
      ].filter(x => x).join(" ");

      tooltip(this.w / 2, this.h + 2, [["#7b7471", msg]], "center");
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

// TODO: The shop shouldn't really be responsible for this. Once
// we're into placement then we should be overriding the default
// handler and rendering from somewhere else.

export interface Placement {
  object: GameObject;
  offsetX: number;
  offsetY: number;
  canPlace(x: number, y: number): boolean;
  onPlaced(): void;
  onCanceled(): void;
}

export class ShopView extends View {
  grid = new ShopGridView(3, 5);
  placement: Placement | undefined;

  constructor() {
    super();
    this.w = this.grid.w - 1;

    this.grid.onPickupItem = (item, offsetX, offsetY) => {
      if (this.placement != null) return;
      if (!game.shop.canAfford(item)) return;

      this.placement = {
        object: item.create(),
        offsetX,
        offsetY,
        canPlace() {
          return game.shop.canAfford(item);
        },
        onPlaced() {
          game.shop.buy(item);
        },
        onCanceled() {

        },
      };
    };
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
    this.renderPlacement();
  }

  renderPlacement() {
    if (!this.placement) return;
    let { object, offsetX, offsetY } = this.placement;

    let [gridX, gridY] = ui.pointerToGrid();
    let [x, y] = local(pointer.x - offsetX, pointer.y - offsetY);

    if (pointer.released) {
      let cell = game.getCell(gridX, gridY);

      if (cell?.isEmpty() && this.placement.canPlace(gridX, gridY)) {
        game.addObject(object, gridX, gridY);
        this.placement.onPlaced();
      } else {
        this.placement.onCanceled();
      }

      this.placement = undefined;
      return;
    }

    if (game.inBounds(gridX, gridY)) {
      // Snap to grid
      let [globalX, globalY] = ui.viewport.gridToGlobal(gridX, gridY);
      let [localX, localY] = local(globalX, globalY);
      save();
      opacity(0.5);
      spr(this.placement.object.sprite.name, localX, localY);
      restore();
    } else {
      spr(this.placement.object.sprite.name, x, y);
    }
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
      tooltip(x, y - h, tooltipLines);
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

  // Parent view should swap this out.
  onPickupItem(
    item: ShopItem,
    offsetX: number,
    offsetY: number,
  ) {}

  render() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        let i = x + y * this.columns;
        let item = game.shop.items[i];

        if (item) {
          this.slot(x, y, item);
        }
      }
    }
  }

  slot(x: number, y: number, item: ShopItem) {
    let pad = 2;
    let dw = this.cellWidth;
    let dh = this.cellHeight;
    let dx = x * dw;
    let dy = y * dh;
    let hover = over(dx, dy, dw, dh);
    let active = hover && pointer.down;
    let disabled = !game.shop.canAfford(item);
    let localSpriteX = dx + pad;
    let localSpriteY = dy + pad;

    save();
    spr(disabled ? "slot_frame" : active ? "slot_frame_active" : hover ? "slot_frame_hover" : "slot_frame", dx, dy);
    if (disabled) opacity(0.5);
    spr(item.sprite, localSpriteX, localSpriteY);
    restore();

    if (hover) {
      let costs: string[] = [];
      if (item.cost.coins) costs.push(`\x06${item.cost.coins}`);
      if (item.cost.swords) costs.push(`\x07${item.cost.swords}`);

      tooltip(dx + dw, dy, [
        [disabled ? "#931200" : "white", item._reference.name],
        item._reference.description,
        [disabled ? "#931200" : "#ff9e19", costs.join(" ")],
      ]);
    }

    if (hover && pointer.pressed) {
      let [localPointerX, localPointerY] = local(pointer.x, pointer.y);
      let offsetX = localPointerX - localSpriteX;
      let offsetY = localPointerY - localSpriteY;
      this.onPickupItem(item, offsetX, offsetY);
    }
  }
}

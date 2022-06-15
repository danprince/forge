import { panel, tooltip } from "./components";
import { align, over, pointer, print, restore, save, screen, spr, translate } from "./engine";
import { View } from "./ui";

export class GameView extends View {
  viewport = new ViewportView();
  shop = new ShopView();

  constructor() {
    super();
    this.shop.h = this.viewport.h;
    this.shop.x = this.viewport.x - this.shop.w - 5;
    this.shop.y = this.viewport.y;
  }

  render() {
    this.viewport._render();
    this.shop._render();
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

    let width = Math.floor(this.w / 2);
    let height = 12;
    save();
    align("right");

    {
      let hover = panel("panel_grey", 0, 0, width, height);
      spr("icon_coins", 2, 2);
      print("32", width - 2, 3, "white", "black");

      if (hover) {
        tooltip(width, 0, ["Coins"]);
      }
    }

    translate(width + 1, 0);

    {
      let hover = panel("panel_grey", 0, 0, width, height);
      spr("icon_sword", 2, 2);
      print("1", width - 2, 3, "white", "black");
      if (hover) {
        tooltip(width, 0, ["Swords"]);
      }
    }

    restore();

    this.grid.y = 13;
    this.grid._render();
  }
}

export class ShopGridView extends View {
  private cellSize = 20;

  rows: number;
  columns: number;

  constructor(columns: number, rows: number) {
    super();
    this.rows = rows;
    this.columns = columns;
    this.w = columns * this.cellSize;
    this.h = rows * this.cellSize;
  }

  render() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        this.slot(x, y, true);
      }
    }
  }

  slot(x: number, y: number, disabled = false) {
    let dw = this.cellSize;
    let dh = this.cellSize;
    let dx = x * dw;
    let dy = y * dh;
    let hover = over(dx, dy, dw, dh);
    let active = hover && pointer.down;
    spr(disabled ? "slot_frame" : active ? "slot_frame_active" : hover ? "slot_frame_hover" : "slot_frame", dx, dy);
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
  }
}

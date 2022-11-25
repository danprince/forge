import { Rotate, Slide } from "./actions";
import { hasStorage } from "./components";
import { spr, sprr, save, translate, restore, over, align, rectfill, SpriteId, pointer, opacity, global, print, released, local } from "./engine";
import { Direction, GameObject, ShopItem, Upgrade } from "./game";
import { Panel, State, UIEvent, View } from "./ui";
import { panel, tooltip } from "./widgets";

let SlideEvent = new UIEvent("slide");
let RotateEvent = new UIEvent("rotate");
let InspectEvent = new UIEvent("inspect");
let ShopDragEvent = new UIEvent("shop/drag");
let ShopDropEvent = new UIEvent("shop/drop");

let DefaultState: State = new Set([
  SlideEvent,
  RotateEvent,
  InspectEvent,
  ShopDragEvent,
]);

let ShopDragState: State = new Set([
  ShopDropEvent
]);

export class GameView implements View {
  viewport = new ViewportPanel(ui.layout.viewport);
  sidebar = new SidebarPanel(ui.layout.shop);
  upgrades = new UpgradePanel(ui.layout.upgrades);

  onEnter() {
    ui.pushState(DefaultState);
  }

  render() {
    this.viewport.render();
    this.sidebar.render();
    this.upgrades.render();
  }
}

interface GridActionState {
  time: number;
  object: GameObject;
  origin: { x: number, y: number };
  offset: { x: number, y: number };
}

export class ViewportPanel extends Panel {
  state: GridActionState | undefined;

  renderPanel() {
    let ts = ui.tileSize;

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
          this.renderObject(object);
        }
      }
    }

    let [px, py] = ui.pointerToGrid();
    let object = game.getObject(px, py);

    if (object && ui.isAllowed(InspectEvent)) {
      tooltip(
        this.w / 2 | 0,
        this.h + 2,
        [
          object.description && ["#fff", object.description],
          object.canBeRotated() && ["#666", "\x03Tap to rotate"],
          object.canBeMoved() && ["#666", "\x04Drag to move"],
        ],
        "center"
      );
    }

    this.handleGridActions();
  }

  renderObject(object: GameObject) {
    sprr(
      object.sprite.name,
      object.sprite.x | 0,
      object.sprite.y | 0,
      object.sprite.rotation,
    );

    if (object.hp && object.hp.max > 1) {
      save();
      translate(object.sprite.x, object.sprite.y);
      translate(object.sprite.w / 2 | 0, object.sprite.h);
      translate(-object.hp.max * 2, -2);
      for (let i = 0; i < object.hp.max; i++) {
        let empty = i >= object.hp.current;
        spr(empty ? "shield_pip_empty" : "shield_pip_full", i * 4, 0);
      }
      restore();
    }

    if (ui.isAllowed(InspectEvent) && hasStorage(object)) {
      let { container } = object;
      let item = container.peek();
      if (item == null) return;
      let { w, h } = item.sprite;
      let { x, y } = object.sprite;
      let hover = over(x, y, w, h);
      if (hover) {
        save();
        translate(object.sprite.x, object.sprite.y - h);
        panel("panel_black", 0, 0, w, h);
        spr(item.sprite.name, 0, 0);
        align("right");
        let full = container.isFull();
        let color = full ? "red" : "white";
        print(`${container.objects.length}`, w, h - 6, color, "black");
        restore();
      }
    }
  }

  handleGridActions() {
    let [x, y] = ui.pointerToGridExact();
    let gx = Math.floor(x);
    let gy = Math.floor(y);

    if (pointer.pressed) {
      let object = game.getObject(gx, gy);

      if (object && (object.canBeRotated() || object.canBeMoved())) {
        this.state = {
          origin: { x, y },
          offset: { x: x - gx, y: y - gy },
          time: Date.now(),
          object,
        };
      }
    }

    else if (released("Escape") && this.state) {
      this.state.object.sync();
      this.state = undefined;
    }

    else if (pointer.released && this.state) {
      let { origin, object } = this.state;

      // Reset current action
      this.state = undefined;

      let canMove = object.canBeMoved() && ui.isAllowed(SlideEvent);
      let canRotate = object.canBeRotated() && ui.isAllowed(RotateEvent);
      let isMouseOverObject = gx === object.x && gy === object.y;

      if (canRotate && !canMove && isMouseOverObject) {
        game.changeEventTimer(1);
        game.addAction(new Rotate(object));
        return;
      }

      let deltaX = x - origin.x;
      let deltaY = y - origin.y;
      let distance = Math.hypot(deltaX, deltaY);
      let threshold = 0.25; // TODO: threshold increase with duration
      let direction: Direction = Math.abs(deltaX) > Math.abs(deltaY)
        ? deltaX < 0 ? "west" : "east"
        : deltaY < 0 ? "north" : "south";

      if (canMove && distance > threshold) {
        game.changeEventTimer(1);
        game.addAction(new Slide(object, direction));
        return;
      }

      if (canRotate && isMouseOverObject) {
        game.changeEventTimer(1);
        game.addAction(new Rotate(object));
        return;
      }

      // We can't do anything, so just sync the object back
      object.sync();
    }

    else if (this.state?.object.canBeMoved()) {
      let { object, offset, origin } = this.state;

      // Find the dominant movement axis
      let dx = x - origin.x;
      let dy = y - origin.y;
      let sx = Math.abs(dx) > 2 * Math.abs(dy) ? 1 : 0;
      let sy = Math.abs(dy) > 2 * Math.abs(dx) ? 1 : 0;

      // Find target tile on dominant axis
      let tx = origin.x + dx * sx;
      let ty = origin.y + dy * sy;

      let clear = game.hasClearPath(
        object.x,
        object.y,
        Math.floor(tx),
        Math.floor(ty),
      );

      if (clear) {
        // Move the sprite to that tile
        let ox = tx - offset.x;
        let oy = ty - offset.y;
        let [lx, ly] = ui.gridToLocal(ox, oy);
        object.sprite.x = lx;
        object.sprite.y = ly;
      }
    }
  }
}

export class SidebarPanel extends Panel {
  shop: ShopPanel;
  raidTimer: RaidTimerPanel;
  currency: CurrencyPanel;

  constructor({ x = 0, y = 0, w = 0, h = 0}) {
    super({ x, y, w, h });
    this.currency = new CurrencyPanel();
    this.shop = new ShopPanel();
    this.raidTimer = new RaidTimerPanel();
    this.currency.w = this.w - 1;
    this.currency.x = 0;
    this.currency.y = this.y + 1;
    this.raidTimer.w = this.w + 3;
    this.raidTimer.y = this.h - this.raidTimer.h + 4;
    this.raidTimer.x = -2;
    this.shop.h = this.h - this.raidTimer.h - this.currency.h - 4;
    this.shop.w = this.w - 1;
    this.shop.x = 0;
    this.shop.y = this.y + this.currency.h + 4;
  }

  renderPanel(): void {
    this.currency.render();
    this.shop.render();
    this.raidTimer.render();
  }
}

export class RaidTimerPanel extends Panel {
  h = 13;

  renderPanel() {
    let value = game.event ? 1 : game.eventTimer / game.nextEventTime;
    panel("panel_frame_brown", 0, 0, this.w, this.h);
    align("center");
    rectfill(2, 2, this.w - 4, this.h - 4, "#3b3531");
    panel("progress_purple", 2, 2, (this.w - 4) * value, this.h - 4);

    if (game.event) {
      print(game.event.name, this.w / 2, 4, "white", "black");
    } else {
      print("Next raid...", this.w / 2, 4, "white", "black");
    }
  }
}

export class CurrencyPanel extends Panel {
  h = 12;

  renderPanel() {
    panel("panel_frame_brown", -2, -2, this.w + 4, this.h + 4);
    save();
    let w = Math.floor(this.w / 2);
    this.currency(0, 0, w, this.h, "icon_coins", game.coins);
    translate(w + 1, 0);
    this.currency(0, 0, w, this.h, "icon_sword", game.swords);
    restore();
  }

  currency(
    x: number,
    y: number,
    w: number,
    h: number,
    icon: SpriteId,
    amount: number,
  ) {
    save();
    translate(x, y);
    panel("panel_grey", 0, 0, w, h);
    spr(icon, 2, 2);
    align("right");
    print(amount.toString(), w - 2, 3, "white", "black");
    restore();
  }
}

export interface GridPlacement {
  object: GameObject;
  item: ShopItem;
  offsetX: number;
  offsetY: number;
}

export class ShopPanel extends Panel {
  private cellWidth = 20;
  private cellHeight = 20;
  private placement: GridPlacement | undefined;

  renderPanel() {
    panel("panel_frame_brown", -2, -2, this.w + 4, this.h + 4);
    this.renderGrid(3, 6);
    this.renderPlacement();
  }

  renderPlacement() {
    if (this.placement == null) return;
    let { placement } = this;
    let [gridX, gridY] = ui.pointerToGrid();

    if (game.inBounds(gridX, gridY)) {
      // Snap to grid
      let [globalX, globalY] = ui.gridToGlobal(gridX, gridY);
      let [localX, localY] = local(globalX, globalY);
      save();
      opacity(0.5);
      spr(placement.object.sprite.name, localX, localY);
      restore();
    } else {
      let [localX, localY] = local(pointer.x, pointer.y);
      let x = localX - placement.offsetX;
      let y = localY - placement.offsetY;
      spr(placement.object.sprite.name, x, y);
    }

    if (released("Escape")) {
      this.placement = undefined;
    } else if (pointer.released) {
      this.onReleaseItem(gridX, gridY);
    }
  }

  renderGrid(columns: number, rows: number) {
    let unlockedItems = game.shop.items.filter(item => !item.locked);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        let i = x + y * columns;
        let item = unlockedItems[i];

        if (item && !item.locked) {
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
    panel(disabled ? "panel_grey_round" : active ? "panel_grey_round_active" : hover ? "panel_grey_round_hover" : "panel_grey_round", dx, dy, this.cellWidth - 1, this.cellHeight - 1);
    if (disabled) opacity(0.5);
    spr(item.sprite, localSpriteX, localSpriteY);
    restore();

    if (hover && ui.isAllowed(InspectEvent)) {
      let costs: string[] = [];
      if (item.cost.coins) costs.push(`\x06${item.cost.coins}`);
      if (item.cost.swords) costs.push(`\x07${item.cost.swords}`);

      tooltip(dx + dw, dy, [
        [disabled ? "#931200" : "white", item._reference.name],
        item._reference.description && ["#aaa", item._reference.description],
        [disabled ? "#931200" : "#ff9e19", costs.join(" ")],
      ]);
    }

    if (hover && pointer.pressed && ui.isAllowed(ShopDragEvent)) {
      let [spriteX, spriteY] = global(localSpriteX, localSpriteY);
      let offsetX = pointer.x - spriteX;
      let offsetY = pointer.y - spriteY;

      if (game.shop.canAfford(item)) {
        this.onPickupItem(item, offsetX, offsetY);
      }
    }
  }

  private onPickupItem(item: ShopItem, offsetX: number, offsetY: number) {
    ui.pushState(ShopDragState);

    this.placement = {
      object: item.create(),
      item,
      offsetX,
      offsetY,
    };
  }

  private onReleaseItem(gridX: number, gridY: number) {
    let placement = this.placement!;

    if (
      ui.isAllowed(ShopDropEvent) &&
      this.canPlace(gridX, gridY, placement.item)
    ) {
      game.shop.buy(placement.item);
      game.addObject(placement.object, gridX, gridY);
    }

    this.placement = undefined;
    ui.popState(ShopDragState);
  }

  private canPlace(x: number, y: number, item: ShopItem) {
    let cell = game.getCell(x, y);

    return (
      cell?.isEmpty() &&
      game.shop.canAfford(item)
    );
  }
}

export class UpgradePanel extends Panel {
  private cellWidth = 20;
  private cellHeight = 20;

  renderPanel() {
    panel("panel_frame_brown", -2, -2, this.w + 4, this.h + 4);
    this.renderGrid(3, 6);
  }

  renderGrid(columns: number, rows: number) {
    let upgrades = game.getAvailableUpgrades();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        let i = x + y * columns;
        let upgrade = upgrades[i];
        if (upgrade) {
          this.slot(x, y, upgrade);
        }
      }
    }
  }

  slot(x: number, y: number, upgrade: Upgrade) {
    let dw = this.cellWidth;
    let dh = this.cellHeight;
    let dx = x * dw;
    let dy = y * dh;
    let hover = over(dx, dy, dw, dh);

    //panel(hover ? "panel_grey_round_hover" : "panel_grey_round", dx, dy, this.cellWidth - 1, this.cellHeight - 1);
    spr("upgrade_frame", dx, dy);
    spr(upgrade.sprite, dx, dy);

    if (hover && ui.isAllowed(InspectEvent)) {
      tooltip(dx - 4, dy, [
        ["white", upgrade.name],
        ["#aaa", upgrade.description],
      ], "right");
    }
  }
}

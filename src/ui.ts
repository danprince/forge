import { atlas, pointer, resize, restore, save, translate } from "./engine";
import { Action } from "./game";

declare global {
  const ui: UI;
}

export class UIEvent {
  constructor(readonly name: string) {}
}

export type State = Set<UIEvent>;

export interface View {
  render(): void;
  onEnter?(): void;
  onExit?(): void;
  onAction?(action: Action): void | boolean;
}

export abstract class Panel {
  x: number = 0;
  y: number = 0;
  w: number = 0;
  h: number = 0;

  constructor({ x = 0, y = 0, w = 0, h = 0 } = {}) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  render() {
    save();
    translate(this.x, this.y);
    this.renderPanel();
    restore();
  }

  protected abstract renderPanel(): void;
}

export class UI {
  readonly layout = {
    viewport: { x: 0, y: 0, w: 0, h: 0 },
    shop: { x: 0, y: 0, w: 0, h: 0 },
    dialogue: { x: 0, y: 0, w: 0, h: 0 },
    upgrades: { x: 0, y: 0, w: 0, h: 0 },
  };

  tileSize = atlas["tile_1"].w;
  view: View | undefined;

  private states: State[] = [];
  private state: State = new Set();

  constructor(width: number, height: number) {
    (window as any).ui = this;
    resize(width, height);

    let { layout } = this;
    layout.viewport.w = game.columns * this.tileSize;
    layout.viewport.h = game.rows * this.tileSize;
    layout.viewport.x = Math.floor(width / 2 - layout.viewport.w / 2);
    layout.viewport.y = 3;

    layout.shop.w = 60;
    layout.shop.h = layout.viewport.h;
    layout.shop.x = layout.viewport.x - layout.shop.w - 4;
    layout.shop.y = layout.viewport.y - 2;

    layout.upgrades.w = 60;
    layout.upgrades.h = layout.viewport.h;
    layout.upgrades.x = layout.viewport.x + layout.viewport.w + 5;
    layout.upgrades.y = layout.viewport.y;

    layout.dialogue.w = layout.viewport.w;
    layout.dialogue.x = layout.viewport.x;
    layout.dialogue.y = layout.viewport.y + layout.viewport.h;
  }

  open(view: View) {
    this.view?.onExit?.();
    this.view = view;
    this.view.onEnter?.();
  }

  isAllowed(event: UIEvent): boolean {
    return this.state.has(event);
  }

  pushState(state: State) {
    this.states.push(this.state);
    this.state = state;
  }

  popState(state?: State) {
    if (state && this.state !== state) {
      this.states.splice(this.states.indexOf(state), 1);
    }

    if (this.states.length > 0) {
      this.state = this.states.pop()!;
    }
  }

  update = (dt: number) => {
    game.update(dt);
    this.view?.render();
  }

  pointerToGridExact(): [x: number, y: number] {
    return ui.globalToGrid(pointer.x, pointer.y);
  }

  pointerToGrid(): [x: number, y: number] {
    let [x, y] = ui.globalToGrid(pointer.x, pointer.y);
    return [Math.floor(x), Math.floor(y)];
  }

  localToGrid(x: number, y: number): [x: number, y: number] {
    return [x / this.tileSize, y / this.tileSize];
  }

  gridToLocal(x: number, y: number): [x: number, y: number] {
    return [x * this.tileSize, y * this.tileSize];
  }

  globalToGrid(x: number, y: number) {
    return this.localToGrid(x - this.layout.viewport.x, y - this.layout.viewport.y);
  }

  gridToGlobal(x: number, y: number) {
    let [lx, ly] = this.gridToLocal(x, y);
    return [lx + this.layout.viewport.x, ly + this.layout.viewport.y];
  }
}

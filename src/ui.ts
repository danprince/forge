import { clear, init, loop, pointer, restore, save, translate } from "./engine";
import { emitters } from "./fx";

let _root: View;
let _renderAboveQueue: Array<() => void> = [];

/**
 * Defer a callback until after the main rendering pass has finished.
 * Useful for rendering stuff above everything else (e.g. tooltips).
 */
export function renderAbove(callback: () => void) {
  _renderAboveQueue.push(callback);
}

function _update(dt: number) {
  game.update(dt);

  for (let emitter of emitters) {
    emitter._update(dt);
  }

  clear();

  if (_root) {
    _root._render();
  }

  let callbacks = _renderAboveQueue;
  _renderAboveQueue = [];

  for (let callback of callbacks) {
    callback();
  }

  // Reset frame state for pointer
  pointer.pressed = pointer.released = false;
}

export async function start(root: View) {
  await init();
  _root = root;
  loop(_update);
}

export class View {
  x: number = 0;
  y: number = 0;
  w: number = 0;
  h: number = 0;

  _render() {
    save();
    translate(this.x, this.y);
    this.render();
    restore();
  }

  render() {}
}

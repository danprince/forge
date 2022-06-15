import spritesheetSrc from "./assets/spritesheet.png";
import fontImageSrc from "./assets/font.png";
import atlas from "./assets/spritesheet.json";

export { atlas };

export let canvas = document.createElement("canvas");
export let ctx = canvas.getContext("2d")!;

export let spritesheet = new Image();
spritesheet.src = spritesheetSrc;

export let fontImage = new Image();
fontImage.src = fontImageSrc;

export type SpriteId = keyof typeof atlas;
export type TextAlign = "left" | "center" | "right";
export type Fill = string | CanvasPattern;

interface DrawState {
  color: Fill;
  cursorX: number;
  cursorY: number;
  translateX: number;
  translateY: number;
  textShadowColor: Fill;
  textAlign: TextAlign;
}

interface Pointer {
  x: number;
  y: number;
  down: boolean;
  pressed: boolean;
  released: boolean;
}

let _width = 100;
let _height = 100;

let _stack: DrawState[] = [];

let _state: DrawState = {
  color: "black",
  cursorX: 0,
  cursorY: 0,
  translateX: 0,
  translateY: 0,
  textShadowColor: "",
  textAlign: "left",
};

/**
 * The current state of the mouse/pointer in canvas coordinates.
 */
export let pointer: Pointer = {
  x: 0,
  y: 0,
  down: false,
  pressed: false,
  released: false,
};

/**
 * Returns the current size of the canvas.
 */
export function screen() {
  return [_width, _height];
}

/**
 * Push the current draw state onto the stack and create a new one.
 */
export function save() {
  ctx.save();
  _stack.push(_state);
  _state = { ..._state };
}

/**
 * Discard the current draw state and restore the one from the top of
 * the stack.
 */
export function restore() {
  ctx.restore();
  if (_stack.length) {
    _state = _stack.pop()!;
  }
}

/**
 * Set the text shadow color.
 */
export function shadow(col: Fill) {
  _state.textShadowColor = col;
}

/**
 * Set the text alignment.
 */
export function align(val: DrawState["textAlign"]) {
  _state.textAlign = val;
}

/**
 * Set the text cursor position.
 */
export function cursor(x: number, y: number) {
  _state.cursorX = x;
  _state.cursorY = y;
}

/**
 * Set the current color.
 */
export function color(col: Fill) {
  _state.color = col;
}

/**
 * Convert coordinates relative to the current transform into absolute
 * canvas coordinates.
 */
export function absolute(x: number, y: number): [x: number, y: number] {
  return [x + _state.translateX, y + _state.translateY];
}

/**
 * Clear the canvas and reset the text cursor.
 */
export function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  _state.cursorX = _state.cursorY = 0;
}

/**
 * Create a pattern from a sprite in the spritesheet.
 */
export function ptrn(name: SpriteId) {
  let { x: sx, y: sy, w, h } = atlas[name];
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d")!;
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(spritesheet, sx, sy, w, h, 0, 0, w, h);
  return ctx.createPattern(canvas, "repeat")!;
}

/**
 * Draw a sprite from the spritesheet.
 */
export function spr(name: SpriteId, x: number, y: number) {
  let { w, h, x: sx, y: sy } = atlas[name];
  ctx.drawImage(spritesheet, sx, sy, w, h, x, y, w, h);
}

/**
 * Draw a sprite from the spritesheet with a rotation around its center.
 */
export function sprr(name: SpriteId, x: number, y: number, r: number) {
  let { w, h, x: sx, y: sy } = atlas[name];
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(r);
  ctx.drawImage(spritesheet, sx, sy, w, h, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/**
 * Draw a slice from the spritesheet with full control over source and
 * destination coords.
 */
export function sspr(
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  ctx.drawImage(spritesheet, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * Check whether the pointer is currently over a given rectangle.
 */
export function over(x: number, y: number, w: number, h: number): boolean {
  let px = pointer.x - _state.translateX;
  let py = pointer.y - _state.translateY;
  return x <= px && y <= py && px < x + w && py < y + h;
}

/**
 * Translate all subsequent calls in the current draw state.
 */
export function translate(x: number, y: number) {
  ctx.translate(x, y);
  _state.translateX += x;
  _state.translateY += y;
}

/**
 * Set the current opacity.
 */
export function opacity(value: number) {
  ctx.globalAlpha = value;
}

/**
 * Stroke a rectangle.
 */
export function rect(x: number, y: number, w: number, h: number, col = _state.color) {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  ctx.restore();
}

/**
 * Fill a rectangle.
 */
export function rectfill(x: number, y: number, w: number, h: number, col = _state.color) {
  ctx.save();
  ctx.fillStyle = col;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

let _cache = new Map<Fill, HTMLCanvasElement>();

function _tint(col: Fill): HTMLCanvasElement {
  if (!_cache.has(col)) {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d")!;
    canvas.width = fontImage.width;
    canvas.height = fontImage.height;
    ctx.drawImage(fontImage, 0, 0);
    ctx.fillStyle = col;
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    _cache.set(col, canvas);
  }

  return _cache.get(col)!;
}

/**
 * Print a string of text. No automatic wrapping but newlines are respected.
 * @param text The text to print
 * @param x The x coordinate to start (defaults to current text cursor)
 * @param y The y coordinate to start (defaults to current text cursor)
 * @param col The text color (defaults to current color)
 * @param shadow The text shadow color (defaults to current shadow)
 */
export function print(text: string, x = _state.cursorX, y = _state.cursorY, col = _state.color, shadow = _state.textShadowColor) {
  if (_state.textAlign === "center") {
    let [w] = measure(text);
    x -= Math.floor(w / 2);
  }

  if (_state.textAlign === "right") {
    x -= measure(text)[0];
  }

  let _x = x;
  let _y = y;
  let img = _tint(col);
  let imgShadow = _tint(shadow);

  let w = 5;
  let h = 6;

  for (let i = 0; i < text.length; i++) {
    let ch = text[i];

    if (ch === "\n") {
      _x = x;
      _y += h;
      continue;
    }

    let code = ch.charCodeAt(0);
    let gx = code % 16;
    let gy = code / 16 | 0;
    let sx = gx * w;
    let sy = gy * h;
    let dx = _x;
    let dy = _y;

    if (shadow) {
      ctx.drawImage(imgShadow, sx, sy, w, h, dx + 1, dy + 1, w, h);
      ctx.drawImage(imgShadow, sx, sy, w, h, dx, dy + 1, w, h);
      ctx.drawImage(imgShadow, sx, sy, w, h, dx + 1, dy, w, h);
    }

    ctx.drawImage(img, sx, sy, w, h, dx, dy, w, h);
    _x += w;
  }

  _state.cursorX = x;
  _state.cursorY = _y + h;

  return _x;
}

/**
 * Measure the size of a piece of text and return the required width/height.
 */
export function measure(text: string): [w: number, h: number] {
  let w = 0;
  let h = 1;
  let l = 0;

  for (let i = 0; i < text.length; i++) {
    let ch = text[i];
    if (ch === "\n") {
      w = Math.max(w, l);
      h += 1;
      l = 0;
    } else {
      l += 1;
    }
  }

  w = Math.max(w, l);
  return [w * 5, h * 6];
}

/**
 * Resize the canvas and rescale everything to fill browser's viewport.
 * 
 * @param w Width in pixels
 * @param h Height in pixels
 */
export function resize(w: number, h: number) {
  let scaleX = window.innerWidth / w;
  let scaleY = window.innerHeight / h;
  let scale = Math.min(scaleX, scaleY);
  _width = canvas.width = w;
  _height = canvas.height = h;
  canvas.style.width = `${w * scale}px`;
  canvas.style.height = `${h * scale}px`;
  canvas.style.imageRendering = "pixelated";
  ctx.imageSmoothingEnabled = false;
}

function _pointermove(event: PointerEvent) {
  let rect = canvas.getBoundingClientRect();
  let scaleX = canvas.width / rect.width;
  let scaleY = canvas.height / rect.height;
  pointer.x = Math.floor((event.clientX - rect.x) * scaleX);
  pointer.y = Math.floor((event.clientY - rect.y) * scaleY);
}

function _pointerup(event: PointerEvent) {
  pointer.down = false;
  pointer.released = true;
}

function _pointerdown(event: PointerEvent) {
  pointer.down = true;
  pointer.pressed = true;
}

function _resize(event: UIEvent) {
  resize(_width, _height);
}

/**
 * Start an animation loop and call `callback` every iteration with the
 * number of milliseconds since the last call.
 */
export function loop(callback: (dt: number) => void) {
  let lastTickTime = 0;

  function loop(time: number) {
    requestAnimationFrame(loop);
    lastTickTime = lastTickTime || time;
    let dt = time - lastTickTime;
    lastTickTime = time;
    callback(dt);
  }

  requestAnimationFrame(loop);
}

/**
 * Wait for the spritesheet/font to load.
 */
function _load() {
  return Promise.all([
    new Promise(resolve => fontImage.onload = resolve),
    new Promise(resolve => spritesheet.onload = resolve),
  ]);
}

/**
 * Wait for assets to load and setup the DOM.
 */
export async function init() {
  await _load();
  window.addEventListener("pointermove", _pointermove);
  window.addEventListener("pointerup", _pointerup);
  window.addEventListener("pointerdown", _pointerdown);
  window.addEventListener("resize", _resize);
  document.body.appendChild(canvas);
}

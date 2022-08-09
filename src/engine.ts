/**
 * ---------------------- Helpers -------------------------
 */

export function assert(cond: any, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

export function random(n: number): number {
  return Math.random() * n;
}

export function randomElement<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export function shuffled<T>(array: T[]): T[] {
  array = [...array];

  for (let i = array.length - 1; i > 0; i--) {
    let n = Math.floor(Math.random() * i + 1);
    [array[n], array[i]] = [array[i], array[n]];
  }

  return array;
}

/**
 * ---------------------- Window -------------------------
 */

let _width = 320;
let _height = 180;

/**
 * Returns the current size of the canvas.
 */
export function screen() {
  return [_width, _height];
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
  let scale = Math.min(scaleX, scaleY, 3);
  _width = canvas.width = w;
  _height = canvas.height = h;
  canvas.style.width = `${w * scale}px`;
  canvas.style.height = `${h * scale}px`;
  canvas.style.imageRendering = "pixelated";
  ctx.imageSmoothingEnabled = false;
}

/**
 * ---------------------- Graphics -------------------------
 */

import spritesheetSrc from "./assets/spritesheet.png";
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
 * Set the current color.
 */
export function color(col: Fill) {
  _state.color = col;
}

/**
 * Set the text cursor position.
 */
export function cursor(x: number, y: number) {
  _state.cursorX = x;
  _state.cursorY = y;
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
 * Convert local coordinates to global coordinates.
 */
export function global(x: number, y: number): [x: number, y: number] {
  return [x + _state.translateX, y + _state.translateY];
}

/**
 * Convert global coordinates to local coordinates.
 */
export function local(x: number, y: number): [x: number, y: number] {
  return [x - _state.translateX, y - _state.translateY];
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

/**
 * ---------------------- Text -------------------------
 */

import fontImageSrc from "./assets/font.png";
import kerning from "./assets/kerning.json";

const GLYPH_WIDTH = 5;
const GLYPH_HEIGHT = 6;
const LINE_SPACING = 1;

/**
 * Measure the size of a piece of text and return the required width/height.
 */
export function measure(text: string): [w: number, h: number] {
  let gw = GLYPH_WIDTH;
  let lh = GLYPH_HEIGHT + LINE_SPACING;
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
      let k = kerning[ch as keyof typeof kerning] || 0;
      l += gw + k;
    }
  }

  w = Math.max(w, l);
  return [w, h * lh];
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
  x |= 0;
  y |= 0;

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

  let ls = LINE_SPACING;
  let h = GLYPH_HEIGHT;
  let w = GLYPH_WIDTH;

  for (let i = 0; i < text.length; i++) {
    let ch = text[i];

    if (ch === "\n") {
      _x = x;
      _y += h + ls;
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
      ctx.drawImage(imgShadow, sx, sy, w, h, dx, dy + 1, w, h);
      ctx.drawImage(imgShadow, sx, sy, w, h, dx + 1, dy, w, h);
    }

    // Glyphs below 32 are already colored
    let _img = code < 32 ? fontImage : img;
    ctx.drawImage(_img, sx, sy, w, h, dx, dy, w, h);
    _x += w + (kerning[ch as keyof typeof kerning] || 0);
  }

  _state.cursorX = x;
  _state.cursorY = _y + h + ls;

  return _x;
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
 * ---------------------- Input -------------------------
 */

/**
 * The current state of the mouse/pointer in canvas coordinates.
 */
export let pointer = {
  x: 0,
  y: 0,
  down: false,
  pressed: false,
  released: false,
};

export let keyboard = {
  pressed: new Set<string>(),
  released: new Set<string>(),
  down: new Set<string>(),
};

export let pressed = (key: string) => keyboard.pressed.has(key);
export let released = (key: string) => keyboard.released.has(key);
export let down = (key: string) => keyboard.down.has(key);

/**
 * Check whether the pointer is currently over a given rectangle.
 */
export function over(x: number, y: number, w: number, h: number): boolean {
  let px = pointer.x - _state.translateX;
  let py = pointer.y - _state.translateY;
  return x <= px && y <= py && px < x + w && py < y + h;
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

function _keydown(event: KeyboardEvent) {
  keyboard.down.add(event.key);
  keyboard.pressed.add(event.key);
}

function _keyup(event: KeyboardEvent) {
  keyboard.down.delete(event.key);
  keyboard.released.add(event.key);
}

function _resize(event: UIEvent) {
  resize(_width, _height);
}

/**
 * ---------------------- Particles -------------------------
 */

interface Particle {
  variant: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  floor: number;
}

let _pool: Particle[] = [];
let emitters: Emitter[] = [];

function spreadRandom(n: number, spread: number): number {
  return n + (Math.random() * spread) - (spread / 2);
}

function createParticle(): Particle {
  if (_pool.length > 0) {
    return _pool.pop()!;
  } else {
    return {
      variant: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      ttl: 0,
      floor: -Infinity,
    };
  }
}

export class Emitter {
  x: number;
  y: number;
  w: number = 0;
  h: number = 0;
  active = false;
  particles = new Set<Particle>();

  private clock: number = 0;
  private _resolve = () => {};

  variants: SpriteId[][];
  frequency: number;
  initialSpeed: number;
  initialSpeedSpread: number;
  initialAngle: number;
  initialAngleSpread: number;
  initialLife: number;
  initialLifeSpread: number;
  floorLevel: number;
  floorLevelSpread: number;
  floorFriction: number;
  airFriction: number;
  bounciness: number;
  gravity: number;

  constructor(x: number, y: number, settings: Partial<Emitter> = {}) {
    this.x = x;
    this.y = y;
    this.variants = [];
    this.frequency = 1;
    this.initialSpeed = 1;
    this.initialSpeedSpread = 0;
    this.initialAngle = 0;
    this.initialAngleSpread = 0;
    this.initialLife = 1000;
    this.initialLifeSpread = 0;
    this.floorLevel = -Infinity;
    this.floorLevelSpread = 0;
    this.floorFriction = 0;
    this.airFriction = 0;
    this.bounciness = 0;
    this.gravity = 0;

    Object.assign(this, settings);
    emitters.push(this);
  }

  remove() {
    emitters.splice(emitters.indexOf(this), 1);
  }

  start() {
    this.active = true;
  }

  stop() {
    this.active = false;
    return new Promise<void>(resolve => this._resolve = resolve);
  }

  stopThenRemove() {
    return this.stop().then(() => this.remove());
  }

  // Override to add emitter specific behaviours
  update() {}

  _update(dt: number) {
    this.update();

    let step = dt / 1000;

    if (this.active) {
      this.clock += this.frequency;

      while (this.clock >= 1) {
        this.clock -= 1;
        this.emit();
      }
    }

    for (let p of this.particles) {
      p.ttl -= dt;

      if (p.ttl <= 0) {
        this.particles.delete(p);
        _pool.push(p);
        continue;
      }

      p.x += p.vx * step;
      p.y += p.vy * step;
      p.vy += this.gravity * step;

      if (p.y >= p.floor && p.vy > 0) {
        p.y = p.floor;
        p.vx *= 1 - this.floorFriction;
        p.vy *= -this.bounciness;
      }
    }

    if (this.particles.size === 0) {
      this._resolve();
    }
  }

  emit() {
    let angle = spreadRandom(this.initialAngle, this.initialAngleSpread);
    let speed = spreadRandom(this.initialSpeed, this.initialSpeedSpread);
    angle -= Math.PI / 2;

    let p = createParticle();
    p.life = p.ttl = spreadRandom(this.initialLife, this.initialLifeSpread);
    p.x = this.x + Math.random() * this.w;
    p.y = this.y + Math.random() * this.h;
    p.vx = speed * Math.cos(angle);
    p.vy = speed * Math.sin(angle);
    p.variant = Math.floor(Math.random() * this.variants.length);
    p.floor = p.y - spreadRandom(this.floorLevel, this.floorLevelSpread);
    this.particles.add(p);
  }

  burst(amount: number) {
    for (let i = 0; i < amount; i++) {
      this.emit();
    }
  }

  render() {
    save();
    for (let p of this.particles) {
      let progress = (p.life - p.ttl) / p.life;
      let sprites = this.variants[p.variant];
      let step = Math.floor(progress * sprites.length);
      let sprite = sprites[step];
      spr(sprite, Math.round(p.x), Math.round(p.y));
    }
    restore();
  }
}

/**
 * ---------------------- Tweens -------------------------
 */

type TweenableProps<T extends Record<string, any>> = {
  [K in keyof T as T[K] extends number ? K : never]: T[K]
}

type Easing = (t: number) => number;

interface Tween {
  duration: number;
  elapsed: number;
  object: any;
  startValues: any;
  endValues: any;
  easing: Easing;
  done(): void;
}

let _tweens: Tween[] = [];

export let linear: Easing = t => t;

export let easeInOutCirc: Easing = t => {
  if (t < 0.5) {
    return 0.5 * (1 - Math.sqrt(1 - 4 * (t * t)));
  } else {
    return 0.5 * (Math.sqrt(-((2 * t) - 3) * ((2 * t) - 1)) + 1);
  }
};

export function tween<T extends Record<string, any>>(
  object: T,
  endValues: Partial<TweenableProps<T>>,
  duration: number,
  easing: Easing = linear,
) {
  type Values = typeof endValues;
  type Key = keyof Values;
  let startValues: Values = {};

  for (let key of Object.keys(endValues) as Key[]) {
    startValues[key] = object[key];
  }

  return new Promise<void>(resolve => {
    _tweens.push({
      duration,
      elapsed: 0,
      object,
      startValues,
      endValues,
      easing,
      done: resolve,
    });
  });
}

function _updateTweens(dt: number) {
  for (let tween of _tweens) {
    tween.elapsed += dt;

    let _t = Math.min(1, tween.elapsed / tween.duration);
    let t = tween.easing(_t);
    let keys = Object.keys(tween.startValues);

    for (let k of keys) {
      let v0 = tween.startValues[k];
      let v1 = tween.endValues[k];
      tween.object[k] = v0 + (v1 - v0) * t;
    }
  }

  _tweens = _tweens.filter(t => {
    let done = t.elapsed >= t.duration;
    if (done) t.done();
    return !done;
  });
}

/**
 * ---------------------- Lifecycle -------------------------
 */

let _updateRoot: (dt: number) => void;
let _renderAboveQueue: Array<() => void> = [];

/**
 * Defer a callback until after the main rendering pass has finished.
 * Useful for rendering stuff above everything else (e.g. tooltips).
 */
export function renderAbove(callback: () => void) {
  _renderAboveQueue.push(callback);
}

/**
 * Start an animation loop and call `callback` every iteration with the
 * number of milliseconds since the last call.
 */
function _loop(callback: (dt: number) => void) {
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

function _update(dt: number) {
  clear();

  if (_updateRoot) {
    _updateRoot(dt);
  }

  let callbacks = _renderAboveQueue;
  _renderAboveQueue = [];

  for (let callback of callbacks) {
    callback();
  }

  for (let emitter of emitters) {
    emitter._update(dt);
    emitter.render();
  }

  _updateTweens(dt);

  // Reset frame state for pointer
  pointer.pressed = pointer.released = false;

  // Reset frame state for keyboard
  keyboard.pressed.clear();
  keyboard.released.clear();
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
export async function init(update: (dt: number) => void) {
  await _load();
  _updateRoot = update;
  _loop(_update);
  window.addEventListener("keydown", _keydown);
  window.addEventListener("keyup", _keyup);
  window.addEventListener("pointermove", _pointermove);
  window.addEventListener("pointerup", _pointerup);
  window.addEventListener("pointerdown", _pointerdown);
  window.addEventListener("resize", _resize);
  document.body.appendChild(canvas);
}

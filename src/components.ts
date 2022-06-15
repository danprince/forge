import { atlas, measure, over, pointer, print, restore, save, shadow, SpriteId, sspr } from "./engine";

/**
 * Draws a panel from a 9-slice sprite, where each slice is 3x3.
 */
export function panel(sprite: SpriteId, x: number, y: number, w: number, h: number) {
  let bounds = atlas[sprite];
  w = Math.max(w, 6);
  h = Math.max(h, 6);

  let x0 = x;
  let y0 = y;
  let x1 = x + w;
  let y1 = y + h;
  let $ = 3;
  let $$ = $ + $;
  let { x: sx, y: sy } = bounds;

  // Horizontals
  sspr(sx + $, sy, $, $, x0 + $, y0, x1 - x0 - $$, $);
  sspr(sx + $, sy + $$, $, $, x0 + $, y1 - $, x1 - x0 - $$, $);

  // Verticals
  sspr(sx, sy + $, $, $, x0, y0 + $, $, y1 - y0 - $$);
  sspr(sx + $$, sy + $, $, $, x1 - $, y0 + $, $, y1 - y0 - $$);

  // Corners
  sspr(sx, sy, $, $, x0, y0, $, $);
  sspr(sx + $$, sy, $, $, x1 - $, y0, $, $);
  sspr(sx, sy + $$, $, $, x0, y1 - $, $, $);
  sspr(sx + $$, sy + $$, $, $, x1 - $, y1 - $, $, $);

  // Center
  sspr(sx + $, sy + $, $, $, x0 + $, y0 + $, x1 - x0 - $$, y1 - y0 - $$);

  return over(x, y, w, h);
}

export function button(text: string, x: number, y: number): boolean {
  let [w, h] = measure(text);
  let hover = over(x, y, w + 4, h + 4);
  let down = pointer.down;
  let spr: SpriteId = (hover && !down) ? "panel_grey_active" : "panel_grey";

  save();
  panel(spr, x, y, w + 4, h + 4);
  shadow("black");
  print(text, x + 2, y + 2, "white");
  restore();

  return hover && pointer.released;
}
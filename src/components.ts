import { local, align, atlas, color, cursor, Fill, measure, over, pointer, print, rect, rectfill, restore, save, shadow, SpriteId, sspr, global, renderAbove } from "./engine";

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

export type TextLine = string | [color: Fill, text: string];

export function measureLines(lines: TextLine[]): [w: number, h: number] {
  let height = 0;
  let width = 0;

  for (let line of lines) {
    let [w, h] = measure(typeof line === "string" ? line : line[1]);
    width = Math.max(width, w);
    height += h;
  }

  return [width, height];
}

export function tooltip(x: number, y: number, lines: TextLine[]) {
  let padding = 2;
  let [w, h] = measureLines(lines);
  h += padding * 1;
  w += padding * 1;
  [x, y] = global(x, y);

  renderAbove(() => {
    save();
    align("left");
    rectfill(x, y, w, h, "rgba(0, 0, 0, 0.8)");
    rect(x, y, w, h, "#ccc");
    cursor(x + padding, y + padding);
    for (let line of lines) {
      let fill = typeof line === "string" ? "white" : line[0];
      let text = typeof line === "string" ? line : line[1];
      color(fill);
      print(text);
    }
    restore();
  });
}

export function scroll(x: number, y: number, lines: TextLine[]) {
  let px = 3;
  let py = 2;
  let [w, h] = measureLines(lines);
  h += px * 2 - 2;
  w += py * 2;
  [x, y] = global(x, y);

  renderAbove(() => {
    save();
    align("left");
    panel("panel_scroll", x, y, w + 1, h);
    cursor(x + px, y + py);
    for (let line of lines) {
      let fill = typeof line === "string" ? "#584336" : line[0];
      let text = typeof line === "string" ? line : line[1];
      color(fill);
      print(text);
    }
    restore();
  });
}

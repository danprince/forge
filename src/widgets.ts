import { align, atlas, color, cursor, Fill, measure, over, pointer, print, rectfill, restore, save, SpriteId, sspr, global, renderAbove, TextAlign, translate, spr } from "./engine";

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

type MaybeTextLine = TextLine | false | undefined | null;

export function tooltip(x: number, y: number, maybeLines: MaybeTextLine[], _align: TextAlign = "left") {
  let lines = maybeLines.filter(line => line) as TextLine[];
  let padding = 3;
  let [w, h] = measureLines(lines);
  h += padding * 1;
  w += padding * 1;
  [x, y] = global(x, y);

  if (_align === "center") x -= w / 2 | 0;
  if (_align === "right") x -= w;

  renderAbove(() => {
    save();
    align("left");
    panel("panel_black", x, y, w + padding, h + padding - 2);
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

export function scroll(x: number, y: number, maybeLines: MaybeTextLine[]) {
  let lines = maybeLines.filter(line => line) as TextLine[];
  let px = 4;
  let py = 4;
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

export function progress(x: number, y: number, w: number, h: number, value: number, fg: Fill, bg: Fill) {
  rectfill(x, y, w, h, bg);
  rectfill(x, y, w * Math.min(value, 1) | 0, h, fg);
}

export function button(x: number, y: number, text: string, _align: TextAlign = "left"): boolean {
  let p = 3;
  let [width, height] = measure(text);
  let btnWidth = width + p * 2;
  let btnHeight = height + p * 2;
  let textX = x + p;
  let textY = y + p;

  if (_align === "center") {
    textX = x;
    x -= (btnWidth / 2 | 0);
  }

  if (_align === "right") {
    textX = x;
    x -= btnWidth;
  }

  let hover = over(x, y, btnWidth, btnHeight);
  let press = hover && pointer.down;

  if (press) {
    y += 1;
    btnHeight -= 1;
  }

  save();
  panel(press ? "btn_active" : hover ? "btn_hover" : "btn", x, y, btnWidth, btnHeight);
  align(_align);
  print(text, textX, textY, "white", "black");
  restore();

  return hover && pointer.released;
}

export function dialogue(characterSprite: SpriteId, side: "left" | "right", lines: TextLine[]) {
  let [textWidth, textHeight] = measureLines(lines);
  let { x, y, w } = ui.layout.dialogue;

  save();
  translate(x, y);

  let portrait = atlas[characterSprite];
  let padding = 4;
  let bubbleWidth = textWidth + padding * 2;
  let bubbleHeight = textHeight + padding * 2 - 1;
  let bubbleX = side === "left"
    ? portrait.w - 6
    : w - bubbleWidth - portrait.w + 8;
  let bubbleY = -bubbleHeight;
  let backdropHeight = bubbleHeight + 2;
  let backdropWidth = w;
  let backdropColor = "rgba(0, 0, 0, 0.5)";
  let portraitX = side === "left" ? 0 : backdropWidth - portrait.w;
  let portraitY = -portrait.h;
  let bubbleArrowX = side == "left" ? bubbleX - 2 : bubbleX + bubbleWidth - 1;
  let bubbleArrowY = -11;

  rectfill(0, -backdropHeight, backdropWidth, backdropHeight, backdropColor);
  spr(characterSprite, portraitX, portraitY);
  panel("panel_white", bubbleX, bubbleY, bubbleWidth, bubbleHeight);
  spr(`speech_bubble_arrow_${side}`, bubbleArrowX, bubbleArrowY);
  cursor(bubbleX + padding, bubbleY + padding);

  for (let line of lines) {
    let fill = typeof line === "string" ? "#584336" : line[0];
    let text = typeof line === "string" ? line : line[1];
    color(fill);
    print(text)
  }
  restore();
}
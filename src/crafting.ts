import { createCoinEmitter } from "./fx";
import { Component, Element, Material, One, Recipe, SetBonus, Symmetry, Variant, ZeroOrMore } from "./game";

// Elements                   Name     Rarity
export let Iron = new Element("Iron",  3);
export let Gold = new Element("Gold",  1);


//Components                           Name        Moves  Rotates  Symmetry           Rarity
export let Ore         = new Component("Ore",      true,  false,   Symmetry.FourWay,  1);
export let Bar         = new Component("Bar",      true,  false,   Symmetry.FourWay,  1);
export let SwordTip    = new Component("Tip",      true,  true,    Symmetry.None,     1);
export let SwordHandle = new Component("Handle",   true,  true,    Symmetry.None,     1);
export let SwordBlade  = new Component("Blade",    true,  true,    Symmetry.TwoWay,   2);

// Set Bonus                          Name           Rarity
export let Straight    = new SetBonus("Straight",     5);
export let Broad       = new SetBonus("Broad",        5);
export let Chipped     = new SetBonus("Chipped",      5);
export let Executioner = new SetBonus("Executioner",  3);
export let Spiked      = new SetBonus("Spiked",       3);
export let Flamberge   = new SetBonus("Flamberge",    2);
export let Engraved    = new SetBonus("Engraved",     2);
export let Serrated    = new SetBonus("Serrated",     1);
export let Ceremonial  = new SetBonus("Ceremonial",   1);
export let Waved       = new SetBonus("Waved",        1);

new Variant(Iron, Ore, "ore_iron");
new Variant(Gold, Ore, "ore_gold");

new Variant(Iron, Bar, "bar_iron");
new Variant(Gold, Bar, "bar_gold");

new Variant(Iron, SwordTip, "tip_1", Straight);
new Variant(Iron, SwordTip, "tip_2", Broad);
new Variant(Iron, SwordTip, "tip_3", Executioner);
new Variant(Iron, SwordTip, "tip_4", Spiked);
new Variant(Iron, SwordTip, "tip_5", Flamberge);
new Variant(Iron, SwordTip, "tip_6", Engraved);
new Variant(Iron, SwordTip, "tip_7", Chipped);
new Variant(Iron, SwordTip, "tip_8", Serrated);
new Variant(Iron, SwordTip, "tip_9", Ceremonial);
new Variant(Iron, SwordTip, "tip_10", Waved);

new Variant(Iron, SwordBlade, "blade_1", Straight);
new Variant(Iron, SwordBlade, "blade_2", Broad);
new Variant(Iron, SwordBlade, "blade_3", Executioner);
new Variant(Iron, SwordBlade, "blade_4", Spiked);
new Variant(Iron, SwordBlade, "blade_5", Flamberge);
new Variant(Iron, SwordBlade, "blade_6", Engraved);
new Variant(Iron, SwordBlade, "blade_7", Chipped);
new Variant(Iron, SwordBlade, "blade_8", Serrated);
new Variant(Iron, SwordBlade, "blade_9", Ceremonial);
new Variant(Iron, SwordBlade, "blade_10", Waved);

new Variant(Iron, SwordHandle, "handle_iron_1");
new Variant(Iron, SwordHandle, "handle_iron_2");
new Variant(Iron, SwordHandle, "handle_iron_3");
new Variant(Iron, SwordHandle, "handle_iron_4");
new Variant(Iron, SwordHandle, "handle_iron_5");
new Variant(Gold, SwordHandle, "handle_gold_1");
new Variant(Gold, SwordHandle, "handle_gold_2");
new Variant(Gold, SwordHandle, "handle_gold_3");
new Variant(Gold, SwordHandle, "handle_gold_4");
new Variant(Gold, SwordHandle, "handle_gold_5");

export let Sword = new Recipe([
  new One(SwordHandle),
  new ZeroOrMore(SwordBlade),
  new One(SwordTip),
], (materials, cells) => {
  // TODO: Helper to get bounding rect from cells
  let x0 = Math.min(...cells.map(c => c.x)) + 0.5;
  let x1 = Math.max(...cells.map(c => c.x)) + 0.5;
  let y0 = Math.min(...cells.map(c => c.y)) + 0.5;
  let y1 = Math.max(...cells.map(c => c.y)) + 0.5;
  let [dx0, dy0] = ui.gridToGlobal(x0, y0);
  let [dx1, dy1] = ui.gridToGlobal(x1, y1);
  let dw = dx1 - dx0;
  let dh = dy1 - dy0;

  let score = getSwordScore(materials);
  let coins = calculateReward(score);

  game.swords += 1;
  game.coins += coins;

  let fx = createCoinEmitter(dx0, dy0, dw, dh);
  fx.burst(coins);
  fx.stop().then(() => fx.remove());
});

export type ScoreItem = [
  name: string,
  modifier: "+" | "*",
  value: number,
];

export function getSwordScore(parts: Material[]): ScoreItem[] {
  let items: ScoreItem[] = [];
  let tip = parts.find(part => part.component === SwordTip)!;
  let blade = parts.filter(part => part.component === SwordBlade);

  let baseValuePerPart = 5;
  let fullSetMultiplier = 1;

  let size = parts.length;
  items.push([`Size ${size} sword`, "+", size * baseValuePerPart]);

  if (size >= 5) {
    items.push(["Really bloody long", "+", 50]);
  }

  if (size > 2 && tip.set && blade.every(part => part.set === tip.set)) {
    items.push([`Set: ${tip.set.name}`, "*", fullSetMultiplier]);
  }

  return items;
}

export function calculateReward(items: ScoreItem[]) {
  let base = 0;
  let multiplier = 0;

  for (let [, op, value] of items) {
    if (op === "+") base += value
    if (op === "*") multiplier += value
  }

  return Math.floor(base + base * multiplier);
}

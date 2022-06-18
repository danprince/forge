import "./style.css";
import { Game, Material } from "./game";
import { UI } from "./views";
import { init, shuffled } from "./engine";
import { Bar, Gold, Iron, Ore, Sword } from "./crafting";
import { SwipeAndRotateHandler } from "./handlers";
import { Anvil, Bucket, Furnace, Goblin, GoblinBrute, GoblinLooter, GoblinShaman, GoblinTotem, Mule, Warrior } from "./objects";
import "./crafting";
import { SpawnOre } from "./actions";
import { GoblinRaid } from "./events";

declare global {
  const game: Game;
  const ui: UI;
}

(window as any).game = new Game(10, 10);
(window as any).ui = new UI(320, 180);

game.addRecipe(Sword);
game.addAction(new SpawnOre());
game.addEventToPool(GoblinRaid);

//            Sprite           Coins  Swords   Create
game.shop.add("pack_mule",     50,     0,      () => new Mule());
game.shop.add("furnace",       20,     0,      () => new Furnace());
game.shop.add("anvil",         20,     0,      () => new Anvil());
game.shop.add("warrior",       10,     1,      () => new Warrior());
game.shop.add("goblin",         0,     0,      () => new Goblin());
game.shop.add("shaman_1",       0,     0,      () => new GoblinShaman());
game.shop.add("brute_1",        0,     0,      () => new GoblinBrute());
game.shop.add("looter_1",       0,     0,      () => new GoblinLooter());
game.shop.add("goblin_totem",   0,     0,      () => new GoblinTotem());
game.shop.add("bar_gold",       0,     0,      () => Material.of(Gold, Bar)!);
game.shop.add("bar_iron",       0,     0,      () => Material.of(Iron, Bar)!);
game.shop.add("ore_gold",       0,     0,      () => Material.of(Gold, Ore)!);
game.shop.add("ore_iron",       0,     0,      () => Material.of(Iron, Ore)!);

let cells = shuffled(game.cells);

for (let i = 0; i < 2; i++) {
  let cell = cells.pop();
  if (cell) game.addObject(new Furnace(), cell.x, cell.y);
}

for (let i = 0; i < 2; i++) {
  let cell = cells.pop();
  if (cell) game.addObject(new Anvil(), cell.x, cell.y);
}

for (let i = 0; i < 1; i++) {
  let cell = cells.pop();
  if (cell) game.addObject(new Mule(), cell.x, cell.y);
}

for (let i = 0; i < 4; i++) {
  let cell = cells.pop();
  if (cell) game.addObject(new Bucket(), cell.x, cell.y);
}

for (let i = 0; i < 20; i++) {
  let cell = cells.pop();
  let ore = Material.createByRarity({ component: Ore });
  if (cell && ore) game.addObject(ore, cell.x, cell.y);
}

game.swords = 3;
game.coins = 195;

ui.pushHandler(new SwipeAndRotateHandler);
init(ui);

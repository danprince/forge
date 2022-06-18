import "./style.css";
import { Game, Material } from "./game";
import { UI } from "./views";
import { init, shuffled } from "./engine";
import { Ore, Sword } from "./crafting";
import { SwipeAndRotateHandler } from "./handlers";
import { Anvil, Bucket, Furnace, Mule, Warrior } from "./objects";
import "./crafting";
import { SpawnOre } from "./actions";

declare global {
  const game: Game;
  const ui: UI;
}

(window as any).game = new Game(10, 10);
(window as any).ui = new UI(320, 180);

game.addRecipe(Sword);
game.addAction(new SpawnOre());

//            Sprite           Coins  Swords   Create
game.shop.add("pack_mule",     50,     0,      () => new Mule());
game.shop.add("furnace",       20,     0,      () => new Furnace());
game.shop.add("anvil",         20,     0,      () => new Anvil());
game.shop.add("warrior",       10,     1,      () => new Warrior());

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

game.coins = 195;

ui.pushHandler(new SwipeAndRotateHandler);
init(ui);

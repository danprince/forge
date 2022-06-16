import "./style.css";
import { Game, Material } from "./game";
import { UI } from "./views";
import { init, resize } from "./engine";
import { Bar, Gold, Iron, Ore, Sword } from "./crafting";
import { SwipeAndRotateHandler } from "./handlers";
import { Anvil, Furnace, Goblin, Mule, Warrior } from "./objects";
import "./crafting";
import { SpawnOre } from "./actions";

declare global {
  const game: Game;
  const ui: UI;
}

(window as any).game = new Game(10, 10);
(window as any).ui = new UI(300, 300);

game.addRecipe(Sword);
game.addAction(new SpawnOre());

game.addObject(new Material(Iron, Ore, "ore_iron"), 2, 5);
game.addObject(new Furnace(), 5, 5);
game.addObject(new Mule(), 1, 1);
game.addObject(new Anvil(), 8, 5);
game.addObject(new Goblin(), 2, 2);
game.addObject(new Warrior(), 2, 0);

ui.pushHandler(new SwipeAndRotateHandler);
init(ui);

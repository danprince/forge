import "./style.css";
import { Game, GameObject, Sprite } from "./game";
import { start } from "./ui";
import { GameView } from "./views";
import { resize } from "./engine";

window.game = new Game(10, 10);

let go = new GameObject(
  new Sprite("goblin")
);
game.addObject(0, 0, go);

resize(300, 300);
start(new GameView);



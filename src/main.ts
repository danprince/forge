import "./style.css";
import { Game } from "./game";
import { start } from "./ui";
import { GameView } from "./views";
import { resize } from "./engine";

window.game = new Game(10, 10);

resize(300, 300);
start(new GameView);



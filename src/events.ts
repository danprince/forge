import { Slide } from "./actions";
import { randomElement, shuffled } from "./engine";
import { Direction, Event } from "./game";
import { Goblin, GoblinBrute, GoblinLooter, GoblinShaman } from "./objects";

export class GoblinRaid extends Event {
  getSpawnCells() {
    return game.cells.filter(cell => {
      return cell.objects.length === 0 && (
        cell.x === 0 ||
        cell.y === 0 ||
        cell.x === game.columns - 1 ||
        cell.y === game.rows - 1
      );
    });
  }

  start() {
    let cells = this.getSpawnCells();
    cells = shuffled(cells);

    for (let i = 0; i < 10; i++) {
      let cell = cells.pop();
      let object = new (randomElement([Goblin, GoblinBrute, GoblinLooter, GoblinShaman]));
      if (cell == null) break;

      let direction: Direction =
        cell.x === 0 ? "east" :
        cell.y === 0 ? "south" :
        cell.x > 0 ? "west" :
        cell.y > 0 ? "north" :
        "north";

      game.addObject(object, cell.x, cell.y);
      game.addAction(new Slide(object, direction));
    }
  }
}

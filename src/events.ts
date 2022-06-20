import { Slide } from "./actions";
import { randomElement, shuffled } from "./engine";
import { Direction, Event } from "./game";
import { Goblin, GoblinBrute, GoblinLooter, GoblinShaman, GoblinTotem } from "./objects";

const GOBLIN_TYPES = [Goblin, GoblinBrute, GoblinLooter, GoblinShaman];

export class GoblinRaid extends Event {
  name = "Goblin Raid";
  goblins: InstanceType<typeof GOBLIN_TYPES[number]>[] = [];

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
    let count = randomElement([3, 5, 7]);
    cells = shuffled(cells);

    for (let i = 0; i < count; i++) {
      let cell = cells.pop();
      let object = new (randomElement(GOBLIN_TYPES));
      if (cell == null) break;

      let direction: Direction =
        cell.x === 0 ? "east" :
        cell.y === 0 ? "south" :
        cell.x > 0 ? "west" :
        cell.y > 0 ? "north" :
        "north";

      game.addObject(object, cell.x, cell.y);
      game.addAction(new Slide(object, direction));
      this.goblins.push(object);
    }
  }

  stop() {
    let upgrade = randomElement(game.getAvailableUpgrades());

    if (upgrade) {
      game.addUpgrade(upgrade);
    }

    for (let cell of game.cells) {
      for (let object of cell.objects) {
        if (object instanceof GoblinTotem) {
          game.removeObject(object);
        }
      }
    }
  }

  update(dt: number): void {
    if (this.goblins.every(goblin => goblin.hp.current === 0)) {
      game.stopEvent();
    }
  }
}

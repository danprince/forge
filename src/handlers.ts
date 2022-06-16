import { Rotate, Slide } from "./actions";
import { pointer } from "./engine";
import { Direction, GameObject } from "./game";
import { Handler } from "./views";

interface Action {
  time: number;
  object: GameObject;
  origin: { x: number, y: number };
  offset: { x: number, y: number };
}

export class SwipeAndRotateHandler extends Handler {
  private action: Action | undefined;

  update() {
    let [x, y] = ui.pointerToGridExact();
    let gx = Math.floor(x);
    let gy = Math.floor(y);

    if (pointer.pressed) {
      let object = game.getObject(gx, gy);

      if (object && (object.canBeRotated() || object.canBeMoved())) {
        this.action = {
          origin: { x, y },
          offset: { x: x - gx, y: y - gy },
          time: Date.now(),
          object,
        };
      }
    }

    else if (pointer.released && this.action) {
      let { origin, object } = this.action;

      // Reset current action
      this.action = undefined;

      let canMove = object.canBeMoved();
      let canRotate = object.canBeRotated();
      let isMouseOverObject = gx === object.x && gy === object.y;

      if (canRotate && !canMove && isMouseOverObject) {
        return game.addAction(new Rotate(object));
      }

      let deltaX = x - origin.x;
      let deltaY = y - origin.y;
      let distance = Math.hypot(deltaX, deltaY);
      let threshold = 0.25; // TODO: threshold increase with duration
      let direction: Direction = Math.abs(deltaX) > Math.abs(deltaY)
        ? deltaX < 0 ? "west" : "east"
        : deltaY < 0 ? "north" : "south";

      if (canMove && distance > threshold) {
        return game.addAction(new Slide(object, direction));
      }

      if (canRotate && isMouseOverObject) {
        return game.addAction(new Rotate(object));
      }

      // We can't do anything, so just sync the object back
      object.sync();
    }

    else if (this.action) {
      let { object, offset, origin } = this.action;

      // Find the dominant movement axis
      let dx = x - origin.x;
      let dy = y - origin.y;
      let sx = Math.abs(dx) > 2 * Math.abs(dy) ? 1 : 0;
      let sy = Math.abs(dy) > 2 * Math.abs(dx) ? 1 : 0;

      // Find target tile on dominant axis
      let tx = origin.x + dx * sx;
      let ty = origin.y + dy * sy;

      let clear = game.hasClearPath(
        object.x,
        object.y,
        Math.floor(tx),
        Math.floor(ty),
      );

      if (clear) {
        // Move the sprite to that tile
        let ox = tx - offset.x;
        let oy = ty - offset.y;
        let [lx, ly] = ui.viewport.gridToLocal(ox, oy);
        object.sprite.x = lx;
        object.sprite.y = ly;
      }
    }

    return;
  }
}
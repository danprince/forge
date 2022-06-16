import { tween } from "./engine";
import { createSparkEmitter } from "./fx";
import { Direction, directionToRadians, directionToVector, GameObject } from "./game";

export async function rotate(object: GameObject) {
  object.rotation += 1;
  let angle = object.rotation / 4 * Math.PI * 2;
  await tween(object.sprite, { rotation: angle }, 100);
  game.craftingCheck();
}

export async function swipe(object: GameObject, direction: Direction) {
  let [dstX, dstY] = game.findPath(object, direction);

  // Convert the current visual position of the object back into grid
  // coordinates.
  let [srcX, srcY] = ui.viewport.localToGrid(object.sprite.x, object.sprite.y);

  // Calculate duration from speed in tiles per second
  let speed = 30;
  let distance = Math.hypot(srcX - dstX, srcY - dstY);
  let duration = distance / speed * 1000;

  // Calculate the final position for the sprite (local coordinate space)
  let [lx1, ly1] = ui.viewport.gridToLocal(dstX, dstY);

  // Calculate the start and end coordinates for the emitter (global space)
  let [ex0, ey0] = ui.viewport.gridToGlobal(srcX + 0.5, srcY + 0.5);
  let [ex1, ey1] = ui.viewport.gridToGlobal(dstX + 0.5, dstY + 0.5);

  // Move the object behind the scenes
  game.moveObject(object, dstX, dstY);

  // Then do all the fancy stuff to get it moved to the destination
  let emitter = createSparkEmitter(ex0, ey0);
  emitter.initialAngle = directionToRadians(direction);
  emitter.gravity = 0;
  emitter.frequency = 1;
  //emitter.start();

  await Promise.all([
    tween(emitter, { x: ex1, y: ey1 }, duration),
    tween(object.sprite, { x: lx1, y: ly1 }, duration),
  ]);

  emitter.stopThenRemove();

  // Check whether we'll be accepted by any objects at the destination
  let targets = game.getObjects(dstX, dstY);

  for (let target of targets) {
    if (target.canAccept(object, direction)) {
      target.onAccept(object, direction);
      break;
    }
  }

  // Check whether we'll bump any objects
  let [dx, dy] = directionToVector(direction);
  let bumpTargets = game.getObjects(dstX + dx, dstY + dy);

  for (let target of bumpTargets) {
    object.onBump(target, direction);
  }

  // And finally do a crafting check
  game.craftingCheck();
}

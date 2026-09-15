import type { Point } from "@/types";

export function createLeash(radius: number) {
  let position: Point | null = null;

  function follow(target: Point): Point {
    if (!position) {
      position = target;
      return position;
    }

    const dx = target.x - position.x;
    const dy = target.y - position.y;
    const distance = Math.hypot(dx, dy);

    if (distance > radius) {
      const pull = (distance - radius) / distance;
      position = { x: position.x + dx * pull, y: position.y + dy * pull };
    }
    return position;
  }

  function reset() {
    position = null;
  }

  return { follow, reset };
}

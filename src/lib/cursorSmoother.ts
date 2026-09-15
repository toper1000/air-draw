import type { Point } from "@/types";
import { createOneEuroFilter } from "@/lib/oneEuroFilter";
import { createLeash } from "@/lib/leash";

const REFERENCE_WIDTH = 1920;

export function createCursorSmoother() {
  const filter = createOneEuroFilter({
    minCutoff: 0.1,
    beta: 0.02,
    speedCutoff: 0.5,
  });
  const leash = createLeash(8);

  function smooth(point: Point, time: number): Point {
    const scale = window.innerWidth / REFERENCE_WIDTH;
    const smoothed = leash.follow(
      filter.filter({ x: point.x / scale, y: point.y / scale }, time),
    );
    return { x: smoothed.x * scale, y: smoothed.y * scale };
  }

  function reset() {
    filter.reset();
    leash.reset();
  }

  return { smooth, reset };
}

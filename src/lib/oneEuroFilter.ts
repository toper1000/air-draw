import type { Point } from "@/types";

function getAlpha(cutoff: number, dt: number) {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}

export function createOneEuroFilter({
  minCutoff,
  beta,
  speedCutoff,
}: {
  minCutoff: number;
  beta: number;
  speedCutoff: number;
}) {
  let prevPoint: Point | null = null;
  let smoothed: Point | null = null;
  let prevTime = 0;
  let velocity = { x: 0, y: 0 };

  function filter(point: Point, time: number): Point {
    if (!prevPoint || !smoothed) {
      prevPoint = point;
      smoothed = point;
      prevTime = time;
      return point;
    }

    const dt = (time - prevTime) / 1000;
    if (dt <= 0) return smoothed;
    prevTime = time;

    const speedAlpha = getAlpha(speedCutoff, dt);
    velocity = {
      x: velocity.x + speedAlpha * ((point.x - prevPoint.x) / dt - velocity.x),
      y: velocity.y + speedAlpha * ((point.y - prevPoint.y) / dt - velocity.y),
    };
    prevPoint = point;
    const speed = Math.hypot(velocity.x, velocity.y);

    const alpha = getAlpha(minCutoff + beta * speed, dt);
    smoothed = {
      x: smoothed.x + alpha * (point.x - smoothed.x),
      y: smoothed.y + alpha * (point.y - smoothed.y),
    };
    return smoothed;
  }

  function reset() {
    prevPoint = null;
    smoothed = null;
    velocity = { x: 0, y: 0 };
  }

  return { filter, reset };
}

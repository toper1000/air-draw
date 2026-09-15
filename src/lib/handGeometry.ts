import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { Point } from "@/types";

const PEN_THUMB_WEIGHT = 0.5;

function distance(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  width: number,
  height: number,
) {
  return Math.hypot(
    (a.x - b.x) * width,
    (a.y - b.y) * height,
    (a.z - b.z) * width,
  );
}

export function getHandSize(
  hand: NormalizedLandmark[],
  width: number,
  height: number,
) {
  return Math.max(
    distance(hand[5], hand[17], width, height),
    0.64 * distance(hand[0], hand[9], width, height),
  );
}

export function getPinchRatio(
  hand: NormalizedLandmark[],
  width: number,
  height: number,
) {
  return distance(hand[4], hand[8], width, height) / getHandSize(hand, width, height);
}

export function getPenPoint(hand: NormalizedLandmark[]): Point {
  return {
    x: hand[8].x + PEN_THUMB_WEIGHT * (hand[4].x - hand[8].x),
    y: hand[8].y + PEN_THUMB_WEIGHT * (hand[4].y - hand[8].y),
  };
}

export function getPalmPoint(hand: NormalizedLandmark[]): Point {
  const palm = [0, 5, 9, 13, 17].map((index) => hand[index]);
  return {
    x: palm.reduce((sum, landmark) => sum + landmark.x, 0) / palm.length,
    y: palm.reduce((sum, landmark) => sum + landmark.y, 0) / palm.length,
  };
}

export function getThumbTuck(
  hand: NormalizedLandmark[],
  width: number,
  height: number,
) {
  const ringAndPinky = [13, 14, 15, 16, 17, 18, 19, 20];
  const closest = Math.min(
    ...ringAndPinky.map((index) => distance(hand[4], hand[index], width, height)),
  );
  return closest / getHandSize(hand, width, height);
}

const FINGER_JOINTS = {
  index: [6, 8],
  middle: [10, 12],
  ring: [14, 16],
  pinky: [18, 20],
};

export function getFingerExtension(
  hand: NormalizedLandmark[],
  finger: keyof typeof FINGER_JOINTS,
  width: number,
  height: number,
) {
  const [middleJoint, tip] = FINGER_JOINTS[finger];
  return (
    distance(hand[0], hand[tip], width, height) /
    distance(hand[0], hand[middleJoint], width, height)
  );
}

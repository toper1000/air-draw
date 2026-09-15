import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import {
  getFingerExtension,
  getPinchRatio,
  getThumbTuck,
} from "@/lib/handGeometry";
import { PINCH_OFF } from "@/lib/pinchDetector";

const STRAIGHT = 1.15;
const CURLED = 1.0;
const THUMB_TUCKED = 0.6;

const MENU_HOLD_MS = 500;
const MENU_GAP_MS = 150;

export function isVictoryPose(
  hand: NormalizedLandmark[],
  width: number,
  height: number,
) {
  return (
    getFingerExtension(hand, "index", width, height) > STRAIGHT &&
    getFingerExtension(hand, "middle", width, height) > STRAIGHT &&
    getFingerExtension(hand, "ring", width, height) < CURLED &&
    getFingerExtension(hand, "pinky", width, height) < CURLED &&
    getThumbTuck(hand, width, height) < THUMB_TUCKED &&
    getPinchRatio(hand, width, height) > PINCH_OFF
  );
}

export function createMenuGestureDetector() {
  let holdStart: number | null = null;
  let lastPoseTime = -Infinity;

  function update(isPose: boolean, time: number) {
    if (!isPose) return;
    if (holdStart === null || time - lastPoseTime > MENU_GAP_MS) {
      holdStart = time;
    }
    lastPoseTime = time;
  }

  function getProgress(time: number) {
    if (holdStart === null || time - lastPoseTime > MENU_GAP_MS) return 0;
    return Math.min((lastPoseTime - holdStart) / MENU_HOLD_MS, 1);
  }

  function reset() {
    holdStart = null;
  }

  return { update, getProgress, reset };
}

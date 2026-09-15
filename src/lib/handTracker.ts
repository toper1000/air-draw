import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { HandState, Point } from "@/types";
import {
  getHandSize,
  getPalmPoint,
  getPenPoint,
  getPinchRatio,
} from "@/lib/handGeometry";
import { createPinchDetector } from "@/lib/pinchDetector";
import { createCursorSmoother } from "@/lib/cursorSmoother";
import { createMenuGestureDetector, isVictoryPose } from "@/lib/menuGesture";

const HAND_LOST_MS = 250;

const MAX_SPEED = 30;
const NEW_TRACK_SPEED = 45;

function toScreen(point: Point): Point {
  return {
    x: (1 - point.x) * window.innerWidth,
    y: point.y * window.innerHeight,
  };
}

export function createHandTracker() {
  const pinchDetector = createPinchDetector();
  const gestureDetector = createMenuGestureDetector();
  const cursorSmoother = createCursorSmoother();
  const palmSmoother = createCursorSmoother();

  let penPoint: Point | null = null;
  let palmPoint: Point | null = null;
  let penPointTime = 0;
  let lastSeenTime = -Infinity;
  let isPinching = false;
  let trackId = 0;
  let skippedLastFrame = false;

  function forgetHandIfLost(time: number) {
    if (penPoint && time - lastSeenTime > HAND_LOST_MS) {
      penPoint = null;
      palmPoint = null;
      isPinching = false;
      gestureDetector.reset();
    }
  }

  function addCameraFrame(
    hand: NormalizedLandmark[] | undefined,
    videoWidth: number,
    videoHeight: number,
    time: number,
  ) {
    forgetHandIfLost(time);
    if (!hand) return;

    const point = getPenPoint(hand);
    let isNewTrack = penPoint === null;

    if (penPoint) {
      const distance =
        Math.hypot(
          (point.x - penPoint.x) * videoWidth,
          (point.y - penPoint.y) * videoHeight,
        ) / getHandSize(hand, videoWidth, videoHeight);
      const seconds = Math.max(time - penPointTime, 1) / 1000;
      const speed = distance / seconds;

      if (speed > MAX_SPEED && !skippedLastFrame) {
        skippedLastFrame = true;
        lastSeenTime = time;
        return;
      }
      if (speed > NEW_TRACK_SPEED) isNewTrack = true;
    }
    skippedLastFrame = false;

    if (isNewTrack) {
      trackId++;
      cursorSmoother.reset();
      palmSmoother.reset();
      pinchDetector.reset();
      gestureDetector.reset();
    }

    penPoint = point;
    palmPoint = getPalmPoint(hand);
    penPointTime = time;
    lastSeenTime = time;
    isPinching = pinchDetector.update(
      getPinchRatio(hand, videoWidth, videoHeight),
    );
    gestureDetector.update(isVictoryPose(hand, videoWidth, videoHeight), time);
  }

  function getHandState(time: number): HandState | null {
    forgetHandIfLost(time);
    if (!penPoint || !palmPoint) return null;

    const gestureProgress = gestureDetector.getProgress(time);

    return {
      cursorCoords: cursorSmoother.smooth(toScreen(penPoint), time),
      palmCoords: palmSmoother.smooth(toScreen(palmPoint), time),
      isPinching: isPinching,
      trackId: trackId,
      gestureProgress: gestureProgress,
      gesture: gestureProgress >= 1 ? "menu" : "none",
    };
  }

  function getIsPinching() {
    return isPinching;
  }

  function getGestureProgress(time: number) {
    return gestureDetector.getProgress(time);
  }

  return { addCameraFrame, getHandState, getIsPinching, getGestureProgress };
}

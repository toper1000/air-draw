import type { HandState, MenuOption, MenuState, Point } from "@/types";

export const MENU_COLORS = [
  "#111111",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];
export const DEFAULT_COLOR = MENU_COLORS[1];

export const LINE_WIDTHS = [3, 5, 9, 15, 24, 40];
export const DEFAULT_LINE_WIDTH = LINE_WIDTHS[1];

export const MENU_RADIUS = 220;
export const COLOR_RING_RADIUS = 100;
export const WIDTH_RING_RADIUS = 180;
export const SWATCH_RADIUS = 28;
export const CENTER_RADIUS = 34;

const WIDTH_ARC_STEP_DEG = 30;

export function getOptionAngle(option: MenuOption) {
  if (option.kind === "color") {
    return option.index * (360 / MENU_COLORS.length);
  }
  const middleIndex = (LINE_WIDTHS.length - 1) / 2;
  return (option.index - middleIndex) * WIDTH_ARC_STEP_DEG;
}

const RING_ENTER_PX = 60;
const RING_EXIT_PX = 45;
export const RING_BORDER_PX = 140;
const RING_BORDER_STICKINESS_PX = 10;
const OUTER_LIMIT_PX = 270;
const ANGLE_STICKINESS_DEG = 8;

const RELEASE_MS = 150;
const REARM_MS = 300;
const HAND_GONE_MS = 1500;
const EDGE_MARGIN_PX = MENU_RADIUS + 10;

export function createInitialMenuState(): MenuState {
  return {
    phase: "closed",
    color: DEFAULT_COLOR,
    lineWidth: DEFAULT_LINE_WIDTH,
    center: { x: 0, y: 0 },
    pointer: { x: 0, y: 0 },
    hovered: null,
    canOpen: true,
  };
}

function clampToScreen(point: Point): Point {
  const clamp = (value: number, max: number) =>
    Math.min(Math.max(value, EDGE_MARGIN_PX), max - EDGE_MARGIN_PX);
  return {
    x: clamp(point.x, window.innerWidth),
    y: clamp(point.y, window.innerHeight),
  };
}

function angleDifference(a: number, b: number) {
  const difference = Math.abs(a - b) % 360;
  return difference > 180 ? 360 - difference : difference;
}

function getHoveredOption(
  pointer: Point,
  center: Point,
  previous: MenuOption | null,
): MenuOption | null {
  const dx = pointer.x - center.x;
  const dy = pointer.y - center.y;
  const distance = Math.hypot(dx, dy);

  if (distance > OUTER_LIMIT_PX) return null;
  if (distance < (previous === null ? RING_ENTER_PX : RING_EXIT_PX)) return null;

  let border = RING_BORDER_PX;
  if (previous?.kind === "color") border += RING_BORDER_STICKINESS_PX;
  if (previous?.kind === "width") border -= RING_BORDER_STICKINESS_PX;
  const kind = distance < border ? "color" : "width";

  const angle = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  const sliceAngle =
    kind === "color" ? 360 / MENU_COLORS.length : WIDTH_ARC_STEP_DEG;

  if (
    previous?.kind === kind &&
    angleDifference(angle, getOptionAngle(previous)) <=
      sliceAngle / 2 + ANGLE_STICKINESS_DEG
  ) {
    return previous;
  }

  if (kind === "color") {
    return { kind: kind, index: Math.round(angle / sliceAngle) % MENU_COLORS.length };
  }
  const signedAngle = angle > 180 ? angle - 360 : angle;
  if (Math.abs(signedAngle) > 90) return null;
  const middleIndex = (LINE_WIDTHS.length - 1) / 2;
  const index = Math.round(signedAngle / WIDTH_ARC_STEP_DEG + middleIndex);
  return {
    kind: kind,
    index: Math.min(Math.max(index, 0), LINE_WIDTHS.length - 1),
  };
}

export function createWheelMenu(start: { color: string; lineWidth: number }) {
  let phase: MenuState["phase"] = "closed";
  let color = start.color;
  let lineWidth = start.lineWidth;
  let center: Point = { x: 0, y: 0 };
  let pointer: Point = { x: 0, y: 0 };
  let hovered: MenuOption | null = null;

  let anchorOffset: Point = { x: 0, y: 0 };
  let anchoredTrackId = -1;
  let handMissingSince: number | null = null;
  let releasedSince: number | null = null;
  let canOpen = true;
  let noGestureSince: number | null = null;
  let wasPinching = false;

  function anchorPointer(hand: HandState) {
    anchorOffset = {
      x: center.x - hand.palmCoords.x,
      y: center.y - hand.palmCoords.y,
    };
    anchoredTrackId = hand.trackId;
    pointer = center;
    hovered = null;
  }

  function startWaitingForRelease() {
    phase = "waitingForRelease";
    releasedSince = null;
  }

  function update(hand: HandState | null, now: number): MenuState {
    if (phase === "closed") {
      if (!canOpen) {
        if (!hand || hand.gestureProgress === 0) {
          noGestureSince ??= now;
          if (now - noGestureSince >= REARM_MS) canOpen = true;
        } else {
          noGestureSince = null;
        }
      }

      if (canOpen && hand && hand.gesture === "menu" && !hand.isPinching) {
        center = clampToScreen(hand.cursorCoords);
        anchorPointer(hand);
        handMissingSince = null;
        canOpen = false;
        noGestureSince = null;
        phase = "open";
      }
    } else if (phase === "open") {
      if (!hand) {
        handMissingSince ??= now;
        if (now - handMissingSince >= HAND_GONE_MS) startWaitingForRelease();
      } else {
        handMissingSince = null;
        if (hand.trackId !== anchoredTrackId) anchorPointer(hand);

        pointer = {
          x: hand.palmCoords.x + anchorOffset.x,
          y: hand.palmCoords.y + anchorOffset.y,
        };
        const option = getHoveredOption(pointer, center, hovered);
        if (option?.kind !== hovered?.kind || option?.index !== hovered?.index) {
          hovered = option;
        }

        if (hand.isPinching && !wasPinching) {
          if (hovered?.kind === "color") color = MENU_COLORS[hovered.index];
          if (hovered?.kind === "width") lineWidth = LINE_WIDTHS[hovered.index];
          startWaitingForRelease();
        }
      }
    } else {
      if (!hand || !hand.isPinching) {
        releasedSince ??= now;
        if (now - releasedSince >= RELEASE_MS) phase = "closed";
      } else {
        releasedSince = null;
      }
    }

    wasPinching = hand?.isPinching ?? false;
    return { phase, color, lineWidth, center, pointer, hovered, canOpen };
  }

  return { update };
}

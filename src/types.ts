export type Point = { x: number; y: number };

export type HandState = {
  cursorCoords: Point;
  palmCoords: Point;
  isPinching: boolean;
  trackId: number;
  gestureProgress: number;
  gesture: "none" | "menu";
};

export type MenuOption = { kind: "color" | "width"; index: number };

export type MenuState = {
  phase: "closed" | "open" | "waitingForRelease";
  color: string;
  lineWidth: number;
  center: Point;
  pointer: Point;
  hovered: MenuOption | null;
  canOpen: boolean;
};

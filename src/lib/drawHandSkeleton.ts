import {
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

const BONE_COLOR = "rgba(160, 160, 160, 0.9)";
const BONE_WIDTH = 2;
const JOINT_COLOR = "#404040";
const JOINT_OUTLINE_COLOR = "white";
const JOINT_RADIUS = 3;

const GLOW_SIZE = 10;
const PINCH_COLOR = "#86efac";
const PINCH_JOINTS = [1, 2, 3, 4, 5, 6, 7, 8];
const MENU_POSE_COLOR = "#7dd3fc";
const MENU_POSE_JOINTS = [5, 6, 7, 8, 9, 10, 11, 12];

export function drawHandSkeleton(
  canvas: HTMLCanvasElement,
  hand: NormalizedLandmark[] | undefined,
  isPinching: boolean,
  isMenuPose: boolean,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const bitmapWidth = Math.round(width * pixelRatio);
  const bitmapHeight = Math.round(height * pixelRatio);
  if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
    canvas.width = bitmapWidth;
    canvas.height = bitmapHeight;
  }
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  if (!hand) return;

  const x = (landmark: NormalizedLandmark) => landmark.x * width;
  const y = (landmark: NormalizedLandmark) => landmark.y * height;

  ctx.beginPath();
  for (const { start, end } of HandLandmarker.HAND_CONNECTIONS) {
    ctx.moveTo(x(hand[start]), y(hand[start]));
    ctx.lineTo(x(hand[end]), y(hand[end]));
  }
  ctx.lineWidth = BONE_WIDTH;
  ctx.strokeStyle = BONE_COLOR;
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = JOINT_OUTLINE_COLOR;
  hand.forEach((landmark, index) => {
    let glowColor: string | null = null;
    if (isPinching && PINCH_JOINTS.includes(index)) glowColor = PINCH_COLOR;
    else if (isMenuPose && MENU_POSE_JOINTS.includes(index)) glowColor = MENU_POSE_COLOR;

    ctx.beginPath();
    ctx.arc(x(landmark), y(landmark), JOINT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = glowColor ?? JOINT_COLOR;
    ctx.shadowColor = glowColor ?? "transparent";
    ctx.shadowBlur = glowColor ? GLOW_SIZE * pixelRatio : 0;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
  });
}

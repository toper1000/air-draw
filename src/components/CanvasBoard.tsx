"use client";

import { useEffect, useRef } from "react";
import type { HandState, MenuState, Point } from "@/types";

const MIN_SEGMENT_PX = 2;
const RESUME_MS = 110;
const RESUME_PX = 150;

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export default function CanvasBoard({
  handState,
  menuState,
}: {
  handState: React.RefObject<HandState | null>;
  menuState: React.RefObject<MenuState>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const ctx: CanvasRenderingContext2D = context;

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * pixelRatio);
    canvas.height = Math.round(window.innerHeight * pixelRatio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(pixelRatio, pixelRatio);
    ctx.lineCap = "round";

    let loopId: number | undefined;
    let isDrawing = false;
    let strokeTrackId = -1;
    let lastPoint: Point | null = null;
    let lastMidPoint: Point | null = null;
    let releaseTime = -Infinity;

    function startStroke(point: Point, color: string, lineWidth: number) {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.arc(point.x, point.y, lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      lastPoint = point;
      lastMidPoint = point;
    }

    function addPoint(point: Point) {
      if (!lastPoint || !lastMidPoint) return;
      if (distance(point, lastPoint) < MIN_SEGMENT_PX) return;

      const midPoint = {
        x: (lastPoint.x + point.x) / 2,
        y: (lastPoint.y + point.y) / 2,
      };
      ctx.beginPath();
      ctx.moveTo(lastMidPoint.x, lastMidPoint.y);
      ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midPoint.x, midPoint.y);
      ctx.stroke();
      lastPoint = point;
      lastMidPoint = midPoint;
    }

    function finishStroke() {
      if (!lastPoint || !lastMidPoint) return;
      ctx.beginPath();
      ctx.moveTo(lastMidPoint.x, lastMidPoint.y);
      ctx.lineTo(lastPoint.x, lastPoint.y);
      ctx.stroke();
      lastMidPoint = lastPoint;
    }

    function draw(now: number) {
      const hand = handState.current;
      const menu = menuState.current;

      if (hand && hand.isPinching && menu.phase === "closed") {
        if (!isDrawing) {
          const canResume =
            lastPoint !== null &&
            hand.trackId === strokeTrackId &&
            now - releaseTime < RESUME_MS &&
            distance(hand.cursorCoords, lastPoint) < RESUME_PX;

          if (!canResume) {
            startStroke(hand.cursorCoords, menu.color, menu.lineWidth);
          }
          strokeTrackId = hand.trackId;
          isDrawing = true;
        }
        addPoint(hand.cursorCoords);
      } else if (isDrawing) {
        finishStroke();
        releaseTime = now;
        isDrawing = false;
      }

      loopId = requestAnimationFrame(draw);
    }
    loopId = requestAnimationFrame(draw);

    return () => {
      if (loopId) cancelAnimationFrame(loopId);
    };
  }, [handState, menuState]);

  return <canvas ref={canvasRef} className="bg-gray-100"></canvas>;
}

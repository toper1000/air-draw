"use client";

import { useEffect, useRef } from "react";
import type { Coords } from "@/types";

export default function CanvasBoard({
  coordinates,
}: {
  coordinates: React.RefObject<Coords | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "red";
      }
    }

    let loopId: number | undefined;
    let isDrawing = false;
    let prevX: number;
    let prevY: number;
    const alpha = 0.4;

    function draw() {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        if (coordinates.current) {
          if (!isDrawing) {
            ctx.beginPath();
            ctx.moveTo(coordinates.current.x, coordinates.current.y);
            prevX = coordinates.current.x;
            prevY = coordinates.current.y;
            isDrawing = true;
          } else {
            const smoothedX = prevX + alpha * (coordinates.current.x - prevX);
            const smoothedY = prevY + alpha * (coordinates.current.y - prevY);
            const midPointX = (prevX + smoothedX) / 2;
            const midPointY = (prevY + smoothedY) / 2;
            ctx.quadraticCurveTo(prevX, prevY, midPointX, midPointY);
            ctx.stroke();
            prevX = smoothedX;
            prevY = smoothedY;
          }
        } else {
          if (isDrawing) {
            isDrawing = false;
          }
        }
      }
      loopId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      if (loopId) cancelAnimationFrame(loopId);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="bg-gray-100 cursor-crosshair"></canvas>
  );
}

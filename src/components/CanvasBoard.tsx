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

    function tick() {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        if (coordinates.current) {
          if (!isDrawing) {
            ctx.beginPath();
            ctx.moveTo(coordinates.current.x, coordinates.current.y);
            isDrawing = true;
          }
          ctx.lineTo(coordinates.current.x, coordinates.current.y);
          ctx.stroke();
        } else {
          if (isDrawing) {
            isDrawing = false;
          }
        }
      }
      loopId = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      if (loopId) cancelAnimationFrame(loopId);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="bg-gray-100 cursor-crosshair"></canvas>
  );
}

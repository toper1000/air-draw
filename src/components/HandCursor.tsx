"use client";

import { useEffect, useRef } from "react";
import type { HandState, MenuState } from "@/types";

const CURSOR_SIZE = 60;
const CENTER = CURSOR_SIZE / 2;
const CROSS_PATH = `M${CENTER} ${CENTER - 12}V${CENTER + 12}M${CENTER - 12} ${CENTER}H${CENTER + 12}`;

const RING_RADIUS = 18;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const RING_MIN_PROGRESS = 0.2;
const OUTLINE_MIN_WIDTH = 9;

export default function HandCursor({
  handState,
  menuState,
}: {
  handState: React.RefObject<HandState | null>;
  menuState: React.RefObject<MenuState>;
}) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGGElement>(null);
  const outlineRef = useRef<SVGGElement>(null);
  const colorDotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let loopId: number | undefined;

    function update() {
      const cursor = cursorRef.current;
      const ring = ringRef.current;
      const outline = outlineRef.current;
      const colorDot = colorDotRef.current;
      const hand = handState.current;
      const menu = menuState.current;

      if (cursor && ring && outline && colorDot) {
        if (hand) {
          const { x, y } =
            menu.phase === "open" ? menu.pointer : hand.cursorCoords;
          cursor.style.transform = `translate(${x - CENTER}px, ${y - CENTER}px)`;
          cursor.hidden = false;

          const progress = hand.gestureProgress;
          const showRing =
            menu.phase === "closed" &&
            menu.canOpen &&
            progress >= RING_MIN_PROGRESS &&
            progress < 1;
          ring.style.visibility = showRing ? "visible" : "hidden";
          for (const circle of ring.children) {
            circle.setAttribute(
              "stroke-dashoffset",
              String(RING_LENGTH * (1 - progress)),
            );
          }

          const showOutline =
            menu.phase === "closed" &&
            menu.lineWidth >= OUTLINE_MIN_WIDTH &&
            !showRing;
          outline.style.visibility = showOutline ? "visible" : "hidden";
          for (const circle of outline.children) {
            circle.setAttribute("r", String(menu.lineWidth / 2));
          }

          colorDot.setAttribute("fill", menu.color);
        } else {
          cursor.hidden = true;
        }
      }
      loopId = requestAnimationFrame(update);
    }
    update();

    return () => {
      if (loopId) cancelAnimationFrame(loopId);
    };
  }, [handState, menuState]);

  return (
    <div
      ref={cursorRef}
      hidden
      className="fixed top-0 left-0 z-60 pointer-events-none"
    >
      <svg
        width={CURSOR_SIZE}
        height={CURSOR_SIZE}
        viewBox={`0 0 ${CURSOR_SIZE} ${CURSOR_SIZE}`}
      >
        <path d={CROSS_PATH} stroke="white" strokeWidth={4} />
        <path d={CROSS_PATH} stroke="black" strokeWidth={2} />

        <g ref={outlineRef} fill="none" style={{ visibility: "hidden" }}>
          <circle cx={CENTER} cy={CENTER} stroke="white" strokeWidth={3} />
          <circle cx={CENTER} cy={CENTER} stroke="#171717" strokeWidth={1.5} />
        </g>

        <g
          ref={ringRef}
          fill="none"
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          style={{ visibility: "hidden" }}
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            stroke="white"
            strokeWidth={5}
            strokeDasharray={RING_LENGTH}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            stroke="#171717"
            strokeWidth={3}
            strokeDasharray={RING_LENGTH}
          />
        </g>

        <circle
          ref={colorDotRef}
          cx={CENTER + 21}
          cy={CENTER + 21}
          r={6}
          stroke="white"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}

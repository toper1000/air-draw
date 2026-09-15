"use client";

import { useEffect, useState } from "react";
import type { HandState, MenuOption, MenuState } from "@/types";
import {
  CENTER_RADIUS,
  COLOR_RING_RADIUS,
  LINE_WIDTHS,
  MENU_COLORS,
  MENU_RADIUS,
  RING_BORDER_PX,
  SWATCH_RADIUS,
  WIDTH_RING_RADIUS,
  createInitialMenuState,
  createWheelMenu,
  getOptionAngle,
} from "@/lib/wheelMenu";

function getOptionPosition(option: MenuOption) {
  const ringRadius =
    option.kind === "color" ? COLOR_RING_RADIUS : WIDTH_RING_RADIUS;
  const angle = (getOptionAngle(option) * Math.PI) / 180;
  return {
    left: Math.round(MENU_RADIUS + ringRadius * Math.sin(angle) - SWATCH_RADIUS),
    top: Math.round(MENU_RADIUS - ringRadius * Math.cos(angle) - SWATCH_RADIUS),
    width: SWATCH_RADIUS * 2,
    height: SWATCH_RADIUS * 2,
  };
}

export default function WheelMenu({
  handState,
  menuState,
}: {
  handState: React.RefObject<HandState | null>;
  menuState: React.RefObject<MenuState>;
}) {
  const [view, setView] = useState<MenuState>(createInitialMenuState);

  useEffect(() => {
    const menu = createWheelMenu(menuState.current);
    let shown: MenuState | null = null;
    let loopId: number | undefined;

    function update(now: number) {
      const next = menu.update(handState.current, now);
      menuState.current = next;

      if (
        !shown ||
        next.phase !== shown.phase ||
        next.hovered !== shown.hovered ||
        next.color !== shown.color ||
        next.lineWidth !== shown.lineWidth
      ) {
        shown = next;
        setView(next);
      }
      loopId = requestAnimationFrame(update);
    }
    loopId = requestAnimationFrame(update);

    return () => {
      if (loopId) cancelAnimationFrame(loopId);
    };
  }, [handState, menuState]);

  const isOpen = view.phase === "open";
  const hovered = view.hovered;
  const previewColor =
    hovered?.kind === "color" ? MENU_COLORS[hovered.index] : view.color;
  const previewWidth =
    hovered?.kind === "width" ? LINE_WIDTHS[hovered.index] : view.lineWidth;

  return (
    <>
      <div
        className={`fixed z-55 pointer-events-none transition duration-150 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
        style={{
          left: view.center.x - MENU_RADIUS,
          top: view.center.y - MENU_RADIUS,
          width: MENU_RADIUS * 2,
          height: MENU_RADIUS * 2,
        }}
      >
        <div className="absolute inset-0 rounded-full bg-white/85 shadow-xl"></div>
        <div
          className="absolute rounded-full border border-neutral-200"
          style={{
            left: MENU_RADIUS - RING_BORDER_PX,
            top: MENU_RADIUS - RING_BORDER_PX,
            width: RING_BORDER_PX * 2,
            height: RING_BORDER_PX * 2,
          }}
        ></div>

        {MENU_COLORS.map((color, index) => {
          const isHovered = hovered?.kind === "color" && hovered.index === index;
          return (
            <div
              key={color}
              className={`absolute flex items-center justify-center rounded-full border-3 border-white shadow transition duration-75 ${
                isHovered ? "scale-125 ring-3 ring-neutral-800" : ""
              }`}
              style={{
                ...getOptionPosition({ kind: "color", index: index }),
                backgroundColor: color,
              }}
            >
              {color === view.color && (
                <div className="size-1.5 rounded-full bg-white"></div>
              )}
            </div>
          );
        })}

        {LINE_WIDTHS.map((lineWidth, index) => {
          const isHovered = hovered?.kind === "width" && hovered.index === index;
          return (
            <div
              key={lineWidth}
              className={`absolute flex items-center justify-center rounded-full border-3 bg-neutral-100 shadow ${
                lineWidth === view.lineWidth ? "border-neutral-400" : "border-white"
              } ${isHovered ? "ring-3 ring-neutral-800" : ""}`}
              style={getOptionPosition({ kind: "width", index: index })}
            >
              <div
                className="rounded-full"
                style={{
                  width: lineWidth,
                  height: lineWidth,
                  backgroundColor: view.color,
                }}
              ></div>
            </div>
          );
        })}

        <div
          className={`absolute flex items-center justify-center rounded-full border-2 bg-white ${
            hovered === null
              ? "border-dashed border-neutral-500"
              : "border-solid border-neutral-800"
          }`}
          style={{
            left: MENU_RADIUS - CENTER_RADIUS,
            top: MENU_RADIUS - CENTER_RADIUS,
            width: CENTER_RADIUS * 2,
            height: CENTER_RADIUS * 2,
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: previewWidth,
              height: previewWidth,
              backgroundColor: previewColor,
            }}
          ></div>
        </div>
      </div>

      <p className="fixed bottom-4 left-1/2 -translate-x-1/2 z-55 pointer-events-none text-sm text-neutral-500">
        {isOpen
          ? "Move your hand a little for a color, further up for a line width, and pinch. Pinch in the middle to cancel."
          : "Hold ✌️ to change the color or line width"}
      </p>
    </>
  );
}

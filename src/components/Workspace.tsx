"use client";

import Webcam from "./Webcam";
import CanvasBoard from "./CanvasBoard";
import HandCursor from "./HandCursor";
import WheelMenu from "./WheelMenu";
import { useRef } from "react";
import type { HandState, MenuState } from "@/types";
import { createInitialMenuState } from "@/lib/wheelMenu";

export default function Workspace() {
  const handState = useRef<HandState | null>(null);
  const menuState = useRef<MenuState>(createInitialMenuState());

  return (
    <main className="w-full h-screen overflow-hidden">
      <Webcam handState={handState} />
      <WheelMenu handState={handState} menuState={menuState} />
      <CanvasBoard handState={handState} menuState={menuState} />
      <HandCursor handState={handState} menuState={menuState} />
    </main>
  );
}

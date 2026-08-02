"use client";

import Webcam from "./Webcam";
import CanvasBoard from "./CanvasBoard";
import { useRef } from "react";
import type { HandState } from "@/types";

export default function Workspace() {
  const handState = useRef<HandState | null>(null);

  return (
    <main className="w-full h-screen overflow-hidden">
      <Webcam handState={handState} />
      <CanvasBoard handState={handState} />
    </main>
  );
}

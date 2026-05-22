"use client";

import Webcam from "./Webcam";
import CanvasBoard from "./CanvasBoard";
import { useRef } from "react";
import type { Coords } from "@/types";

export default function Workspace() {
  const coordinates = useRef<Coords | null>(null);

  return (
    <main className="w-full h-screen overflow-hidden">
      <Webcam coordinates={coordinates} />
      <CanvasBoard coordinates={coordinates} />
    </main>
  );
}

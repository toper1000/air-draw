"use client";

import { useRef, useEffect } from "react";
import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { Coords } from "@/types";

export default function Webcam({
  coordinates,
}: {
  coordinates: React.RefObject<Coords | null>;
}) {
  const cameraRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    let model: HandLandmarker | undefined;

    async function createModel() {
      try {
        const fileset = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
        );
        model = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
        if (cancelled) {
          model?.close();
          return;
        }
      } catch (e) {
        console.log(e);
      }
    }
    createModel();

    let stream: MediaStream | null = null;

    async function getStream() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (cancelled) {
          stream?.getTracks().forEach((track) => track.stop());
          return;
        }

        if (cameraRef.current) {
          cameraRef.current.srcObject = stream;
        }
      } catch (e) {
        console.error(e);
      }
    }
    getStream();

    let loopId: number | undefined;
    let result: HandLandmarkerResult | undefined;
    function tick() {
      if (cameraRef.current && cameraRef.current.readyState >= 2 && model) {
        result = model.detectForVideo(cameraRef.current, performance.now());

        if (result.landmarks.length > 0) {
          coordinates.current = {
            x: (1 - result.landmarks[0][8].x) * window.innerWidth,
            y: result.landmarks[0][8].y * window.innerHeight,
          };
        } else {
          coordinates.current = null;
        }
      }
      loopId = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      if (loopId) cancelAnimationFrame(loopId);
      model?.close();
    };
  }, []);

  return (
    <video
      autoPlay
      playsInline
      ref={cameraRef}
      className="w-[300px] fixed top-0 right-0 z-50 scale-x-[-1]"
    ></video>
  );
}

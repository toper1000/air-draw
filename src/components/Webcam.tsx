"use client";

import { useRef, useEffect } from "react";
import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { HandState } from "@/types";

export default function Webcam({
  handState,
}: {
  handState: React.RefObject<HandState | null>;
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
    let isPinching = false;
    let smoothedRatio: number | null = null;
    const alpha = 0.05;

    //let counter = 0;
    //let avaragePinched = 0;
    function tick() {
      if (cameraRef.current && cameraRef.current.readyState >= 2 && model) {
        result = model.detectForVideo(cameraRef.current, performance.now());

        if (result.landmarks.length > 0) {
          const PINCH_ON = 0.6;
          const PINCH_OFF = 0.75;

          const indexFingerMcpX = result.landmarks[0][5].x;
          const indexFingerMcpY = result.landmarks[0][5].y;

          const pinkyMcpX = result.landmarks[0][17].x;
          const pinkyMcpY = result.landmarks[0][17].y;

          const indexTipX = result.landmarks[0][8].x;
          const indexTipY = result.landmarks[0][8].y;

          const thumbTipX = result.landmarks[0][4].x;
          const thumbTipY = result.landmarks[0][4].y;

          const distMcps = Math.sqrt(
            (indexFingerMcpX - pinkyMcpX) ** 2 +
              (indexFingerMcpY - pinkyMcpY) ** 2,
          );

          const distTips = Math.sqrt(
            (indexTipX - thumbTipX) ** 2 + (indexTipY - thumbTipY) ** 2,
          );

          const ratio = distTips / distMcps;
          if (smoothedRatio !== null)
            smoothedRatio = smoothedRatio + alpha * (ratio - smoothedRatio);
          else smoothedRatio = ratio;

          if (smoothedRatio < PINCH_ON) {
            isPinching = true;
          } else if (smoothedRatio > PINCH_OFF) {
            isPinching = false;
          }
          //console.log(ratio);
          if (smoothedRatio > 0.75) {
            console.log(smoothedRatio);
          } /*
          avaragePinched += ratio;
          if (counter >= 20) {
            //console.log(ratio);
            //console.log(avaragePinched / 501);
            avaragePinched = 0;
            counter = -1;
          }
          counter++;*/

          handState.current = {
            indexTipCoords: {
              x: (1 - indexTipX) * window.innerWidth,
              y: indexTipY * window.innerHeight,
            },
            isPinching: isPinching,
            gesture: "none",
          };
        } else {
          handState.current = null;
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

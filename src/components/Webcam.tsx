"use client";

import { useRef, useEffect, useState } from "react";
import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import type { CameraStatus, HandState, TrackingStatus } from "@/types";
import { createHandTracker } from "@/lib/handTracker";
import { drawHandSkeleton } from "@/lib/drawHandSkeleton";
import LoadingScreen from "./LoadingScreen";

const SKELETON_HOLD_MS = 100;

export default function Webcam({
  handState,
}: {
  handState: React.RefObject<HandState | null>;
}) {
  const cameraRef = useRef<HTMLVideoElement>(null);
  const skeletonRef = useRef<HTMLCanvasElement>(null);
  const [trackingStatus, setTrackingStatus] =
    useState<TrackingStatus>("loading");
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("starting");

  useEffect(() => {
    let cancelled = false;
    let isTracking = false;
    let hasFailed = false;
    let model: HandLandmarker | undefined;
    let stream: MediaStream | null = null;
    const video = cameraRef.current;
    const skeletonCanvas = skeletonRef.current;

    function stopCamera() {
      stream?.getTracks().forEach((track) => track.stop());
    }

    function onTrackingError(error: unknown) {
      console.error(error);
      if (cancelled || isTracking) return;
      hasFailed = true;
      stopCamera();
      setTrackingStatus("failed");
    }

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
          minHandPresenceConfidence: 0.4,
        });
        if (cancelled) {
          model?.close();
          return;
        }
      } catch (e) {
        onTrackingError(e);
      }
    }
    createModel();

    async function getStream() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 60 },
          },
          audio: false,
        });

        if (cancelled || hasFailed) {
          stopCamera();
          return;
        }

        if (video) {
          video.srcObject = stream;
        }
        setCameraStatus("ready");
      } catch (e) {
        console.error(e);
        if (cancelled) return;
        const isBlocked =
          e instanceof DOMException && e.name === "NotAllowedError";
        setCameraStatus(isBlocked ? "blocked" : "failed");
      }
    }
    getStream();

    const tracker = createHandTracker();

    let frameCallbackId: number | undefined;
    let lastHand: NormalizedLandmark[] | undefined;
    let lastHandTime = -Infinity;
    function onCameraFrame(now: number) {
      if (cancelled || !video) return;
      if (model) {
        let result: HandLandmarkerResult;
        try {
          result = model.detectForVideo(video, now);
        } catch (e) {
          onTrackingError(e);
          return;
        }
        if (!isTracking) {
          isTracking = true;
          setTrackingStatus("ready");
        }
        const hand = result.landmarks[0];
        tracker.addCameraFrame(hand, video.videoWidth, video.videoHeight, now);

        if (hand) {
          lastHand = hand;
          lastHandTime = now;
        }
        if (skeletonCanvas) {
          drawHandSkeleton(
            skeletonCanvas,
            now - lastHandTime <= SKELETON_HOLD_MS ? lastHand : undefined,
            tracker.getIsPinching(),
            tracker.getGestureProgress(now) > 0,
          );
        }
      }
      frameCallbackId = video.requestVideoFrameCallback(onCameraFrame);
    }
    if (video) {
      frameCallbackId = video.requestVideoFrameCallback(onCameraFrame);
    }

    let loopId: number | undefined;
    function tick(now: number) {
      handState.current = tracker.getHandState(now);
      loopId = requestAnimationFrame(tick);
    }
    loopId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      stopCamera();
      if (loopId) cancelAnimationFrame(loopId);
      if (video && frameCallbackId !== undefined) {
        video.cancelVideoFrameCallback(frameCallbackId);
      }
      model?.close();
    };
  }, [handState]);

  return (
    <>
      <div className="w-[300px] fixed top-0 right-0 z-50 scale-x-[-1]">
        <video autoPlay playsInline ref={cameraRef} className="w-full"></video>
        <canvas
          ref={skeletonRef}
          className="absolute inset-0 w-full h-full"
        ></canvas>
      </div>
      <LoadingScreen tracking={trackingStatus} camera={cameraStatus} />
    </>
  );
}

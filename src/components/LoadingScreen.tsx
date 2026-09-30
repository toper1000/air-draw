"use client";

import type { CameraStatus, TrackingStatus } from "@/types";

function getError(tracking: TrackingStatus, camera: CameraStatus) {
  if (camera === "blocked") {
    return {
      title: "Camera access is blocked",
      text: "Allow the camera using the icon in the address bar, then reload the page. If it's already allowed, turn on camera access for your browser in your device's privacy settings.",
    };
  }
  if (camera === "failed") {
    return {
      title: "Couldn't turn on the camera",
      text: "Make sure a webcam is connected and no other app is using it, then reload the page.",
    };
  }
  if (tracking === "failed") {
    return {
      title: "Couldn't start hand tracking",
      text: "Check your internet connection and reload the page. If that doesn't help, try another browser or device.",
    };
  }
  return null;
}

function Step({ isDone, label }: { isDone: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3 text-neutral-800">
      {isDone ? (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-green-600">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-3.5"
            fill="none"
            stroke="white"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 10.5l3.5 3.5 6.5-8" />
          </svg>
        </span>
      ) : (
        <span className="size-5 shrink-0 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-800"></span>
      )}
      {label}
    </li>
  );
}

export default function LoadingScreen({
  tracking,
  camera,
}: {
  tracking: TrackingStatus;
  camera: CameraStatus;
}) {
  const error = getError(tracking, camera);
  const isReady = tracking === "ready";

  return (
    <div
      className={`fixed inset-0 z-70 flex overflow-y-auto bg-gray-100 px-4 transition-[opacity,visibility] duration-500 ${
        isReady ? "invisible opacity-0" : ""
      }`}
    >
      <div className="m-auto flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
            AirDraw
          </h1>
          <p className="mt-2 text-neutral-600">Pinch 🤏 to draw in the air</p>
        </div>

        {error ? (
          <div
            role="alert"
            className="w-full rounded-2xl bg-white p-6 shadow-sm"
          >
            <p className="font-semibold text-neutral-900">{error.title}</p>
            <p className="mt-2 text-sm text-neutral-500">{error.text}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 cursor-pointer rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Reload page
            </button>
          </div>
        ) : (
          <>
            <ul className="w-full space-y-3 rounded-2xl bg-white p-5 text-left shadow-sm">
              <Step isDone={camera === "ready"} label="Turning on the camera" />
              <Step isDone={isReady} label="Loading hand tracking" />
            </ul>
            <p className="text-sm text-neutral-600">
              Allow camera access when your browser asks.
              <br />
              The video never leaves your device.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

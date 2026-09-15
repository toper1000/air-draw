const PINCH_ON = 0.6;
export const PINCH_OFF = 0.8;

const FRAMES_TO_CHANGE = 2;

export function createPinchDetector() {
  let isPinching = false;
  let framesWantingChange = 0;

  function update(pinchRatio: number) {
    const wantsChange = isPinching
      ? pinchRatio > PINCH_OFF
      : pinchRatio < PINCH_ON;
    framesWantingChange = wantsChange ? framesWantingChange + 1 : 0;

    if (framesWantingChange >= FRAMES_TO_CHANGE) {
      isPinching = !isPinching;
      framesWantingChange = 0;
    }
    return isPinching;
  }

  function reset() {
    isPinching = false;
    framesWantingChange = 0;
  }

  return { update, reset };
}

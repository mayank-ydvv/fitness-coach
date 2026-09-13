/** Dropped-frame ratio and the >20% re-record verdict (spec §7's honesty
 * requirement: "if more than 20% of frames were dropped, say so and offer
 * a re-record rather than reporting a score"). */
export function droppedFrameRatio(totalFrames: number, gapFrames: number): number {
  if (totalFrames === 0) return 0;
  return gapFrames / totalFrames;
}

export function shouldOfferRerecord(totalFrames: number, gapFrames: number): boolean {
  return droppedFrameRatio(totalFrames, gapFrames) > 0.2;
}

export function estimatePPG(
  peaks: number[],
  durationMs: number,
): number | null {
  if (durationMs < 20000 || peaks.length < 12) return null;
  const intervals = peaks.slice(1).map((value, i) => value - peaks[i]);
  const mean =
    intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  const variance =
    intervals.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    intervals.length;
  if (
    mean <= 0 ||
    Math.sqrt(variance) / mean > 0.18 ||
    intervals.some((v) => v < 250 || v > 2000)
  )
    return null;
  const bpm = Math.round(60000 / mean);
  return bpm >= 30 && bpm <= 220 ? bpm : null;
}

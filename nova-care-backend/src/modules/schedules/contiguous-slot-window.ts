export type TimedSlot = { startTime: Date; endTime: Date };

/** Select enough uninterrupted real slots for the requested service duration. */
export function contiguousSlotWindow<T extends TimedSlot>(slots: T[], durationMinutes: number): T[] {
  if (!slots.length || !Number.isFinite(durationMinutes) || durationMinutes <= 0) return [];
  const selected: T[] = [];
  let coveredMs = 0;
  for (const slot of slots) {
    if (selected.length && selected[selected.length - 1].endTime.getTime() !== slot.startTime.getTime()) return [];
    const lengthMs = slot.endTime.getTime() - slot.startTime.getTime();
    if (lengthMs <= 0) return [];
    selected.push(slot);
    coveredMs += lengthMs;
    if (coveredMs >= durationMinutes * 60_000) return selected;
  }
  return [];
}

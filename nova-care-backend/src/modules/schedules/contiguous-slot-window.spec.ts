import { contiguousSlotWindow } from './contiguous-slot-window';

const at = (hour: number, minute: number) => new Date(Date.UTC(2026, 9, 2, hour - 7, minute));
const slot = (sh: number, sm: number, eh: number, em: number) => ({ startTime: at(sh, sm), endTime: at(eh, em) });

describe('contiguousSlotWindow', () => {
  it('uses two 30-minute slots for a 60-minute service', () => {
    const slots = [slot(15, 30, 16, 0), slot(16, 0, 16, 30)];
    expect(contiguousSlotWindow(slots, 60)).toEqual(slots);
  });
  it('uses four 15-minute slots for a 60-minute service', () => {
    const slots = [slot(15, 30, 15, 45), slot(15, 45, 16, 0), slot(16, 0, 16, 15), slot(16, 15, 16, 30)];
    expect(contiguousSlotWindow(slots, 60)).toEqual(slots);
  });
  it('rejects a gap', () => expect(contiguousSlotWindow([slot(15, 30, 16, 0), slot(16, 15, 16, 45)], 60)).toEqual([]));
});

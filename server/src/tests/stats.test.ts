import { describe, it, expect } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import {
  aggregateDayStats,
  localDateString,
  localDayInterval,
  overlapMinutes,
  percentDelta,
  staffDayStats,
  workingWindow,
} from '../lib/stats';

const timezone = 'America/New_York';
const at = (iso: string) => fromZonedTime(`2026-07-01T${iso}:00`, timezone);

// 2026-07-01 is a Wednesday (weekday 3).
const WEDNESDAY = '2026-07-01';
const nineToFive = [{ weekday: 3, start: '09:00', end: '17:00' }];

describe('overlapMinutes', () => {
  it('returns the shared duration of two intervals', () => {
    expect(
      overlapMinutes(
        { startAt: at('09:00'), endAt: at('12:00') },
        { startAt: at('11:00'), endAt: at('14:00') }
      )
    ).toBe(60);
  });

  it('returns 0 for disjoint intervals', () => {
    expect(
      overlapMinutes(
        { startAt: at('09:00'), endAt: at('10:00') },
        { startAt: at('11:00'), endAt: at('12:00') }
      )
    ).toBe(0);
  });

  it('returns 0 when intervals merely touch at an edge', () => {
    expect(
      overlapMinutes(
        { startAt: at('09:00'), endAt: at('10:00') },
        { startAt: at('10:00'), endAt: at('11:00') }
      )
    ).toBe(0);
  });

  it('handles full containment', () => {
    expect(
      overlapMinutes(
        { startAt: at('09:00'), endAt: at('17:00') },
        { startAt: at('10:00'), endAt: at('10:30') }
      )
    ).toBe(30);
  });
});

describe('workingWindow', () => {
  it('resolves the shift for a working weekday', () => {
    const window = workingWindow(nineToFive, WEDNESDAY, timezone);
    expect(window).not.toBeNull();
    expect(window!.startAt.toISOString()).toBe(at('09:00').toISOString());
    expect(window!.endAt.toISOString()).toBe(at('17:00').toISOString());
  });

  it('returns null on a day the staff member does not work', () => {
    // 2026-07-02 is a Thursday; only Wednesday is configured.
    expect(workingWindow(nineToFive, '2026-07-02', timezone)).toBeNull();
  });
});

describe('staffDayStats', () => {
  it('reports a full free shift when nothing is booked', () => {
    const stats = staffDayStats({
      workingHours: nineToFive,
      date: WEDNESDAY,
      timezone,
      bookings: [],
      timeOff: [],
    });

    expect(stats.workingMinutes).toBe(480);
    expect(stats.bookedMinutes).toBe(0);
    expect(stats.utilisationPct).toBe(0);
    expect(stats.bookingCount).toBe(0);
  });

  it('counts booked minutes and derives utilisation', () => {
    const stats = staffDayStats({
      workingHours: nineToFive,
      date: WEDNESDAY,
      timezone,
      bookings: [
        { startAt: at('09:00'), endAt: at('10:00') },
        { startAt: at('13:00'), endAt: at('14:00') },
      ],
      timeOff: [],
    });

    expect(stats.bookedMinutes).toBe(120);
    expect(stats.utilisationPct).toBe(25); // 120 / 480
    expect(stats.bookingCount).toBe(2);
  });

  it('deducts time-off from working minutes', () => {
    const stats = staffDayStats({
      workingHours: nineToFive,
      date: WEDNESDAY,
      timezone,
      bookings: [],
      timeOff: [{ startAt: at('12:00'), endAt: at('14:00') }],
    });

    expect(stats.workingMinutes).toBe(360); // 480 - 120
  });

  it('clips a booking that overruns closing time so utilisation cannot exceed 100%', () => {
    const stats = staffDayStats({
      workingHours: nineToFive,
      date: WEDNESDAY,
      timezone,
      // Runs two hours past the 17:00 close.
      bookings: [{ startAt: at('16:00'), endAt: at('19:00') }],
      timeOff: [],
    });

    expect(stats.bookedMinutes).toBe(60); // only 16:00-17:00 counts
    expect(stats.utilisationPct).toBeLessThanOrEqual(100);
  });

  it('ignores bookings that fall entirely outside the shift', () => {
    const stats = staffDayStats({
      workingHours: nineToFive,
      date: WEDNESDAY,
      timezone,
      bookings: [{ startAt: at('19:00'), endAt: at('20:00') }],
      timeOff: [],
    });

    expect(stats.bookedMinutes).toBe(0);
    expect(stats.bookingCount).toBe(0);
  });

  it('measures free minutes as remaining capacity when `now` is mid-shift', () => {
    const stats = staffDayStats({
      workingHours: nineToFive,
      date: WEDNESDAY,
      timezone,
      bookings: [],
      timeOff: [],
      now: at('15:00'),
    });

    // 15:00 -> 17:00 is all that is still sellable.
    expect(stats.freeMinutes).toBe(120);
    // ...but the shift itself is still a full 8 hours.
    expect(stats.workingMinutes).toBe(480);
  });

  it('reports no free capacity once the shift has ended', () => {
    const stats = staffDayStats({
      workingHours: nineToFive,
      date: WEDNESDAY,
      timezone,
      bookings: [],
      timeOff: [],
      now: at('22:00'),
    });

    expect(stats.freeMinutes).toBe(0);
  });

  it('returns zeroes on a non-working day', () => {
    const stats = staffDayStats({
      workingHours: nineToFive,
      date: '2026-07-02', // Thursday
      timezone,
      bookings: [{ startAt: at('09:00'), endAt: at('10:00') }],
      timeOff: [],
    });

    expect(stats.workingMinutes).toBe(0);
    expect(stats.bookedMinutes).toBe(0);
    expect(stats.utilisationPct).toBe(0);
  });
});

describe('aggregateDayStats', () => {
  it('recomputes the percentage from summed totals rather than averaging', () => {
    const busy = { workingMinutes: 480, bookedMinutes: 480, freeMinutes: 0, utilisationPct: 100, bookingCount: 8 };
    const idle = { workingMinutes: 480, bookedMinutes: 0, freeMinutes: 480, utilisationPct: 0, bookingCount: 0 };

    const total = aggregateDayStats([busy, idle]);

    expect(total.workingMinutes).toBe(960);
    expect(total.bookedMinutes).toBe(480);
    expect(total.utilisationPct).toBe(50);
    expect(total.bookingCount).toBe(8);
  });

  it('does not divide by zero when nobody is working', () => {
    expect(aggregateDayStats([]).utilisationPct).toBe(0);
  });
});

describe('percentDelta', () => {
  it('computes a normal percentage change', () => {
    expect(percentDelta(12, 10)).toBe(20);
    expect(percentDelta(8, 10)).toBe(-20);
  });

  it('returns 0 when both sides are zero', () => {
    expect(percentDelta(0, 0)).toBe(0);
  });

  it('returns null for growth from zero rather than reporting Infinity', () => {
    expect(percentDelta(5, 0)).toBeNull();
  });
});

describe('timezone helpers', () => {
  it('derives the local calendar date from an instant', () => {
    // 03:00 UTC on Jul 2 is still Jul 1 in New York.
    const instant = new Date('2026-07-02T03:00:00Z');
    expect(localDateString(instant, timezone)).toBe('2026-07-01');
  });

  it('spans a full local day', () => {
    const { startAt, endAt } = localDayInterval(WEDNESDAY, timezone);
    expect(startAt.toISOString()).toBe(at('00:00').toISOString());
    expect(endAt.getTime() - startAt.getTime()).toBeGreaterThan(23 * 60 * 60 * 1000);
  });
});

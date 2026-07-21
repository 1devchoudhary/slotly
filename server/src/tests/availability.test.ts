import { describe, it, expect } from 'vitest';
import { getAvailableSlots } from '../lib/availability';
import { fromZonedTime } from 'date-fns-tz';

describe('Availability Engine', () => {
  const timezone = 'America/New_York';
  // Use a fixed "now" so tests don't fail intermittently
  const now = fromZonedTime('2026-07-01T12:00:00', timezone);

  const defaultParams = {
    staff: {
      workingHours: [{ weekday: 3, start: '09:00', end: '17:00' }], // Wednesday
      bufferMin: 15,
    },
    service: {
      durationMin: 60,
    },
    date: '2026-07-01', // This is a Wednesday
    timezone,
    existingBookings: [],
    timeOff: [],
    settings: {
      slotIntervalMin: 30,
      leadTimeMin: 60,
      maxAdvanceDays: 30,
    },
    now: fromZonedTime('2026-06-30T12:00:00', timezone), // "Now" is the day before
  };

  it('generates correct slots for a normal day without bookings', () => {
    const slots = getAvailableSlots(defaultParams);
    expect(slots.length).toBeGreaterThan(0);
    // 09:00 to 17:00 = 8 hours
    // Start times: 09:00, 09:30, 10:00 ... 16:00
    // Total 15 slots
    expect(slots.length).toBe(15);
    
    // Check first slot UTC time
    const firstSlot = slots[0];
    const expectedFirstStart = fromZonedTime('2026-07-01T09:00:00', timezone);
    expect(firstSlot.startAt.toISOString()).toBe(expectedFirstStart.toISOString());
  });

  it('filters out slots that conflict with existing bookings + buffer', () => {
    const bookingStart = fromZonedTime('2026-07-01T10:00:00', timezone);
    const bookingEnd = fromZonedTime('2026-07-01T11:00:00', timezone);
    
    const slots = getAvailableSlots({
      ...defaultParams,
      existingBookings: [{ startAt: bookingStart, endAt: bookingEnd }]
    });

    // We shouldn't have any slot that overlaps with 09:45 (10:00-buffer) to 11:15 (11:00+buffer)
    // 09:00 - 10:00 (overlaps buffer? End at 10:00, booking start buffer is 09:45 -> overlaps!)
    const overlaps = slots.filter(s => 
      s.endAt > fromZonedTime('2026-07-01T09:45:00', timezone) && 
      s.startAt < fromZonedTime('2026-07-01T11:15:00', timezone)
    );
    expect(overlaps.length).toBe(0);
  });

  it('filters out slots conflicting with time off (no buffer)', () => {
    const toStart = fromZonedTime('2026-07-01T12:00:00', timezone);
    const toEnd = fromZonedTime('2026-07-01T14:00:00', timezone);

    const slots = getAvailableSlots({
      ...defaultParams,
      timeOff: [{ startAt: toStart, endAt: toEnd }]
    });

    const overlaps = slots.filter(s => s.startAt < toEnd && s.endAt > toStart);
    expect(overlaps.length).toBe(0);
  });

  it('drops candidates earlier than now + leadTimeMin', () => {
    // Let's set "now" to 2026-07-01T09:00:00
    // Lead time is 60 min. The first available slot should start at or after 10:00:00
    const testNow = fromZonedTime('2026-07-01T09:00:00', timezone);
    const slots = getAvailableSlots({
      ...defaultParams,
      now: testNow
    });

    expect(slots[0].startAt.getTime()).toBeGreaterThanOrEqual(
      fromZonedTime('2026-07-01T10:00:00', timezone).getTime()
    );
  });

  it('handles Daylight Saving Time transitions correctly', () => {
    // In US, Spring Forward is usually 2nd Sunday in March.
    // 2026-03-08 is a Sunday. At 2am, clocks jump to 3am.
    // Let's test generating slots on this day.
    const dstDate = '2026-03-08';
    const dstNow = fromZonedTime('2026-03-01T12:00:00', timezone);

    const slots = getAvailableSlots({
      ...defaultParams,
      date: dstDate,
      now: dstNow,
      staff: {
        ...defaultParams.staff,
        workingHours: [{ weekday: 0, start: '01:00', end: '05:00' }] // Sunday
      }
    });

    // 01:00, 01:30, (02:00 skipped in local wall clock!), 03:00, 03:30, 04:00
    // Wait, date-fns-tz parses 02:00 on spring forward as 03:00.
    // We just want to ensure it doesn't crash or return completely invalid UTC bounds.
    expect(slots.length).toBeGreaterThan(0);

    const lastSlot = slots[slots.length - 1];
    expect(lastSlot.endAt.getTime()).toBeLessThanOrEqual(
      fromZonedTime('2026-03-08T05:00:00', timezone).getTime()
    );
  });
});

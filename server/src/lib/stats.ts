import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { getDay } from 'date-fns';

export interface WorkingHour {
  weekday: number; // 0-6
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

export interface Interval {
  startAt: Date;
  endAt: Date;
}

const MS_PER_MIN = 60_000;

/**
 * Minutes shared by two intervals. Zero when they don't touch.
 * Kept pure and exported because every other figure on the dashboard is built
 * from it — booked time, time-off deductions, per-day utilisation.
 */
export function overlapMinutes(a: Interval, b: Interval): number {
  const start = Math.max(a.startAt.getTime(), b.startAt.getTime());
  const end = Math.min(a.endAt.getTime(), b.endAt.getTime());
  return end <= start ? 0 : (end - start) / MS_PER_MIN;
}

/** The staff member's shift on `date`, as a UTC interval. Null on a day off. */
export function workingWindow(
  workingHours: WorkingHour[],
  date: string,
  timezone: string
): Interval | null {
  const dayStartUtc = fromZonedTime(`${date}T00:00:00`, timezone);
  const weekday = getDay(toZonedTime(dayStartUtc, timezone));

  const shift = workingHours.find((wh) => wh.weekday === weekday);
  if (!shift) return null;

  return {
    startAt: fromZonedTime(`${date}T${shift.start}:00`, timezone),
    endAt: fromZonedTime(`${date}T${shift.end}:00`, timezone),
  };
}

export interface DayStats {
  /** Total shift length in minutes, after time-off is deducted. */
  workingMinutes: number;
  /** Minutes consumed by confirmed bookings inside the shift. */
  bookedMinutes: number;
  /** Shift minutes still sellable. Never negative. */
  freeMinutes: number;
  /** bookedMinutes / workingMinutes, 0-100, rounded. */
  utilisationPct: number;
  bookingCount: number;
}

const EMPTY_DAY: DayStats = {
  workingMinutes: 0,
  bookedMinutes: 0,
  freeMinutes: 0,
  utilisationPct: 0,
  bookingCount: 0,
};

/**
 * Utilisation for one staff member on one local date.
 *
 * Only the portion of a booking that falls inside the shift counts, so an
 * appointment running past closing time can't push utilisation above 100%.
 * `now` trims the window for today so "free minutes" means *remaining*
 * capacity rather than capacity that has already elapsed.
 */
export function staffDayStats(params: {
  workingHours: WorkingHour[];
  date: string;
  timezone: string;
  bookings: Interval[];
  timeOff: Interval[];
  now?: Date;
}): DayStats {
  const { workingHours, date, timezone, bookings, timeOff, now } = params;

  const shift = workingWindow(workingHours, date, timezone);
  if (!shift) return { ...EMPTY_DAY };

  const shiftMinutes = overlapMinutes(shift, shift);
  const timeOffMinutes = timeOff.reduce((sum, off) => sum + overlapMinutes(shift, off), 0);
  const workingMinutes = Math.max(0, shiftMinutes - timeOffMinutes);

  const bookedMinutes = bookings.reduce((sum, b) => sum + overlapMinutes(shift, b), 0);

  // Remaining capacity: ignore the part of the shift already in the past.
  let remainingShift = shift;
  if (now && now > shift.startAt) {
    remainingShift = { startAt: now < shift.endAt ? now : shift.endAt, endAt: shift.endAt };
  }
  const remainingMinutes = overlapMinutes(remainingShift, remainingShift);
  const remainingBooked = bookings.reduce(
    (sum, b) => sum + overlapMinutes(remainingShift, b),
    0
  );
  const remainingTimeOff = timeOff.reduce(
    (sum, off) => sum + overlapMinutes(remainingShift, off),
    0
  );

  const freeMinutes = Math.max(0, remainingMinutes - remainingBooked - remainingTimeOff);

  return {
    workingMinutes,
    bookedMinutes,
    freeMinutes,
    utilisationPct:
      workingMinutes === 0 ? 0 : Math.round((bookedMinutes / workingMinutes) * 100),
    bookingCount: bookings.filter((b) => overlapMinutes(shift, b) > 0).length,
  };
}

/** Sum day stats across staff, recomputing the percentage from the totals. */
export function aggregateDayStats(days: DayStats[]): DayStats {
  const total = days.reduce<DayStats>(
    (acc, d) => ({
      workingMinutes: acc.workingMinutes + d.workingMinutes,
      bookedMinutes: acc.bookedMinutes + d.bookedMinutes,
      freeMinutes: acc.freeMinutes + d.freeMinutes,
      utilisationPct: 0,
      bookingCount: acc.bookingCount + d.bookingCount,
    }),
    { ...EMPTY_DAY }
  );

  total.utilisationPct =
    total.workingMinutes === 0
      ? 0
      : Math.round((total.bookedMinutes / total.workingMinutes) * 100);

  return total;
}

/** Percentage change from `previous` to `current`, guarding divide-by-zero. */
export function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/** "YYYY-MM-DD" for an instant, in the business timezone. */
export function localDateString(instant: Date, timezone: string): string {
  const local = toZonedTime(instant, timezone);
  const yyyy = local.getFullYear();
  const mm = String(local.getMonth() + 1).padStart(2, '0');
  const dd = String(local.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** The UTC interval covering a whole local calendar day. */
export function localDayInterval(date: string, timezone: string): Interval {
  return {
    startAt: fromZonedTime(`${date}T00:00:00`, timezone),
    endAt: fromZonedTime(`${date}T23:59:59.999`, timezone),
  };
}

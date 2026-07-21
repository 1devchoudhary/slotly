import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { getDay, addMinutes, isBefore, isAfter, addDays } from 'date-fns';

export interface WorkingHour {
  weekday: number; // 0-6
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

export interface AvailabilityParams {
  staff: {
    workingHours: WorkingHour[];
    bufferMin: number;
  };
  service: {
    durationMin: number;
  };
  date: string; // "YYYY-MM-DD"
  timezone: string;
  existingBookings: {
    startAt: Date;
    endAt: Date;
  }[];
  timeOff: {
    startAt: Date;
    endAt: Date;
  }[];
  settings: {
    slotIntervalMin: number;
    leadTimeMin: number;
    maxAdvanceDays: number;
  };
  now?: Date; // For predictable testing
}

export const getAvailableSlots = (params: AvailabilityParams): { startAt: Date; endAt: Date }[] => {
  const { staff, service, date, timezone, existingBookings, timeOff, settings, now = new Date() } = params;

  const localDayStart = fromZonedTime(`${date}T00:00:00`, timezone);
  const weekday = getDay(toZonedTime(localDayStart, timezone));

  const workingDay = staff.workingHours.find(wh => wh.weekday === weekday);
  if (!workingDay) return [];

  const workStartLocal = `${date}T${workingDay.start}:00`;
  const workEndLocal = `${date}T${workingDay.end}:00`;

  const workStartUTC = fromZonedTime(workStartLocal, timezone);
  const workEndUTC = fromZonedTime(workEndLocal, timezone);

  const availableSlots: { startAt: Date; endAt: Date }[] = [];
  const minAdvanceTime = addMinutes(now, settings.leadTimeMin);
  const maxAdvanceTime = addDays(now, settings.maxAdvanceDays);

  let currentCandidateStart = workStartUTC;

  while (isBefore(currentCandidateStart, workEndUTC)) {
    const currentCandidateEnd = addMinutes(currentCandidateStart, service.durationMin);

    if (isAfter(currentCandidateEnd, workEndUTC)) {
      break; // Doesn't fit in working hours
    }

    let isValid = true;

    // Lead time and max advance days
    if (isBefore(currentCandidateStart, minAdvanceTime) || isAfter(currentCandidateStart, maxAdvanceTime)) {
      isValid = false;
    }

    // Existing bookings + buffer
    if (isValid) {
      for (const booking of existingBookings) {
        const expandedStart = addMinutes(booking.startAt, -staff.bufferMin);
        const expandedEnd = addMinutes(booking.endAt, staff.bufferMin);

        // Overlap check
        if (isBefore(currentCandidateStart, expandedEnd) && isAfter(currentCandidateEnd, expandedStart)) {
          isValid = false;
          break;
        }
      }
    }

    // Time off
    if (isValid) {
      for (const to of timeOff) {
        if (isBefore(currentCandidateStart, to.endAt) && isAfter(currentCandidateEnd, to.startAt)) {
          isValid = false;
          break;
        }
      }
    }

    if (isValid) {
      availableSlots.push({
        startAt: currentCandidateStart,
        endAt: currentCandidateEnd
      });
    }

    currentCandidateStart = addMinutes(currentCandidateStart, settings.slotIntervalMin);
  }

  return availableSlots;
};

import { Response } from 'express';
import { z } from 'zod';
import { subDays, addDays } from 'date-fns';
import { Booking } from '../models/Booking';
import { Staff } from '../models/Staff';
import { Settings, ISettings } from '../models/Settings';
import { TimeOff } from '../models/TimeOff';
import { AuthRequest } from '../middleware/auth';
import {
  aggregateDayStats,
  localDateString,
  localDayInterval,
  percentDelta,
  staffDayStats,
} from '../lib/stats';

const DEFAULT_SETTINGS = {
  businessName: 'Slotly Demo',
  timezone: 'America/New_York',
  slotIntervalMin: 15,
  leadTimeMin: 120,
  maxAdvanceDays: 30,
};

async function resolveSettings(): Promise<ISettings> {
  const existing = await Settings.findOne();
  return existing ?? (new Settings(DEFAULT_SETTINGS) as ISettings);
}

/* ------------------------------------------------------------------ *
 * GET /api/admin/bookings
 * ------------------------------------------------------------------ */

const listQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['confirmed', 'cancelled', 'completed']).optional(),
  staffId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const listBookings = async (req: AuthRequest, res: Response) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const settings = await resolveSettings();

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.staffId) filter.staffId = query.staffId;

    if (query.from || query.to) {
      const from = query.from ?? query.to!;
      const to = query.to ?? query.from!;
      filter.startAt = {
        $gte: localDayInterval(from, settings.timezone).startAt,
        $lte: localDayInterval(to, settings.timezone).endAt,
      };
    }

    // Staff may only see their own column of the calendar; admins see everything.
    if (req.user?.role === 'staff') {
      const self = await Staff.findOne({ userId: req.user._id });
      if (self) filter.staffId = self._id;
    }

    const bookings = await Booking.find(filter)
      .sort({ startAt: 1 })
      .limit(query.limit)
      .populate('serviceId', 'name durationMin priceCents color')
      .populate({ path: 'staffId', populate: { path: 'userId', select: 'name' } })
      .lean();

    res.json({ bookings, timezone: settings.timezone });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: 'Failed to list bookings' });
  }
};

/* ------------------------------------------------------------------ *
 * GET /api/admin/stats
 * ------------------------------------------------------------------ */

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await resolveSettings();
    const tz = settings.timezone;
    const now = new Date();

    const today = localDateString(now, tz);
    const yesterday = localDateString(subDays(now, 1), tz);

    // One window wide enough for the 7-day chart and the 7-day lookahead.
    const windowStart = localDayInterval(localDateString(subDays(now, 7), tz), tz).startAt;
    const windowEnd = localDayInterval(localDateString(addDays(now, 7), tz), tz).endAt;

    const [activeStaff, bookingsInWindow, timeOffInWindow] = await Promise.all([
      Staff.find({ isActive: true }).populate('userId', 'name').lean(),
      Booking.find({ startAt: { $gte: windowStart, $lte: windowEnd } })
        .populate('serviceId', 'name priceCents')
        .lean(),
      TimeOff.find({ endAt: { $gte: windowStart }, startAt: { $lte: windowEnd } }).lean(),
    ]);

    // A completed appointment still consumed the chair — only a cancellation
    // gives the time back. Utilisation history would be empty otherwise.
    const active = bookingsInWindow.filter((b) => b.status !== 'cancelled');

    const bookingsFor = (staffId: string, dayStart: Date, dayEnd: Date) =>
      active.filter(
        (b) =>
          String(b.staffId) === staffId && b.startAt < dayEnd && b.endAt > dayStart
      );

    const timeOffFor = (staffId: string) =>
      timeOffInWindow.filter((t) => String(t.staffId) === staffId);

    /* ---- Per-day utilisation across the last 7 days ---- */
    const week = Array.from({ length: 7 }, (_, i) => {
      const date = localDateString(subDays(now, 6 - i), tz);
      const { startAt, endAt } = localDayInterval(date, tz);

      const perStaff = activeStaff.map((staff) =>
        staffDayStats({
          workingHours: staff.workingHours,
          date,
          timezone: tz,
          bookings: bookingsFor(String(staff._id), startAt, endAt),
          timeOff: timeOffFor(String(staff._id)),
        })
      );

      const totals = aggregateDayStats(perStaff);

      // Same-day slices so every sparkline on the dashboard is backed by a
      // real series rather than a decorative curve.
      const onDay = active.filter((b) => b.startAt >= startAt && b.startAt <= endAt);

      return {
        date,
        utilisationPct: totals.utilisationPct,
        bookings: totals.bookingCount,
        revenueCents: onDay.reduce(
          (sum, b) => sum + ((b.serviceId as any)?.priceCents ?? 0),
          0
        ),
        assistantBookings: onDay.filter((b) => (b.source ?? 'web') === 'assistant').length,
      };
    });

    /* ---- Today, with remaining capacity measured from `now` ---- */
    const todayWindow = localDayInterval(today, tz);
    const todayPerStaff = activeStaff.map((staff) => ({
      staff,
      stats: staffDayStats({
        workingHours: staff.workingHours,
        date: today,
        timezone: tz,
        bookings: bookingsFor(String(staff._id), todayWindow.startAt, todayWindow.endAt),
        timeOff: timeOffFor(String(staff._id)),
        now,
      }),
    }));
    const todayTotals = aggregateDayStats(todayPerStaff.map((s) => s.stats));

    const yesterdayWindow = localDayInterval(yesterday, tz);
    const yesterdayTotals = aggregateDayStats(
      activeStaff.map((staff) =>
        staffDayStats({
          workingHours: staff.workingHours,
          date: yesterday,
          timezone: tz,
          bookings: bookingsFor(
            String(staff._id),
            yesterdayWindow.startAt,
            yesterdayWindow.endAt
          ),
          timeOff: timeOffFor(String(staff._id)),
        })
      )
    );

    /* ---- Money ---- */
    const revenueIn = (from: Date, to: Date) =>
      active
        .filter((b) => b.startAt >= from && b.startAt <= to)
        .reduce((sum, b) => sum + ((b.serviceId as any)?.priceCents ?? 0), 0);

    const revenueTodayCents = revenueIn(todayWindow.startAt, todayWindow.endAt);
    const revenueYesterdayCents = revenueIn(
      yesterdayWindow.startAt,
      yesterdayWindow.endAt
    );

    /* ---- Attribution: genuinely counted, because the assistant tags its own writes ---- */
    const last7Start = localDayInterval(localDateString(subDays(now, 6), tz), tz).startAt;
    const recent = active.filter((b) => b.startAt >= last7Start && b.startAt <= windowEnd);
    const sources = recent.reduce(
      (acc, b) => {
        const key = (b.source ?? 'web') as 'assistant' | 'web' | 'phone';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      { assistant: 0, web: 0, phone: 0 }
    );
    const sourceTotal = sources.assistant + sources.web + sources.phone;

    const upcoming7d = active.filter(
      (b) => b.startAt >= now && b.startAt <= windowEnd
    ).length;

    res.json({
      timezone: tz,
      generatedAt: now.toISOString(),
      today: {
        date: today,
        bookings: todayTotals.bookingCount,
        freeHours: Math.round((todayTotals.freeMinutes / 60) * 10) / 10,
        revenueCents: revenueTodayCents,
        utilisationPct: todayTotals.utilisationPct,
      },
      deltas: {
        bookingsPct: percentDelta(todayTotals.bookingCount, yesterdayTotals.bookingCount),
        revenuePct: percentDelta(revenueTodayCents, revenueYesterdayCents),
        utilisationPct: percentDelta(
          todayTotals.utilisationPct,
          yesterdayTotals.utilisationPct
        ),
      },
      upcoming7d,
      week,
      staffUtilisation: todayPerStaff
        .map(({ staff, stats }) => ({
          staffId: String(staff._id),
          name: (staff.userId as any)?.name ?? 'Team member',
          utilisationPct: stats.utilisationPct,
          bookedMinutes: stats.bookedMinutes,
          workingMinutes: stats.workingMinutes,
        }))
        .sort((a, b) => b.utilisationPct - a.utilisationPct),
      sources: {
        ...sources,
        assistantSharePct:
          sourceTotal === 0 ? 0 : Math.round((sources.assistant / sourceTotal) * 100),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute stats' });
  }
};

/* ------------------------------------------------------------------ *
 * PATCH /api/admin/bookings/:id
 * ------------------------------------------------------------------ */

const updateSchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'completed']),
});

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = updateSchema.parse(req.body);
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Staff can only touch their own appointments.
    if (req.user?.role === 'staff') {
      const self = await Staff.findOne({ userId: req.user._id });
      if (!self || String(self._id) !== String(booking.staffId)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

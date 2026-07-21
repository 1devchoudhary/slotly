import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { seedDemoData } from '../lib/demoData';

/**
 * Restores the public demo to a known-good state.
 *
 * A demo anyone can click will drift — bookings pile up, someone cancels the
 * whole day. Resetting nightly keeps the portfolio link presentable.
 *
 * Guarded three ways: DEMO_MODE must be on, CRON_SECRET must be configured,
 * and the caller must present it. Vercel Cron sends it automatically as
 * `Authorization: Bearer $CRON_SECRET`.
 */
export const resetDemo = async (req: Request, res: Response) => {
  if (process.env.DEMO_MODE !== 'true') {
    return res.status(403).json({ error: 'Reset is only available in demo mode' });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'CRON_SECRET is not configured' });
  }

  const presented =
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ??
    (typeof req.query.secret === 'string' ? req.query.secret : '');

  // Constant-time compare so the secret can't be probed byte by byte.
  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  const authorised =
    a.length === b.length && require('crypto').timingSafeEqual(a, b);

  if (!authorised) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  try {
    await mongoose.connection.db?.dropDatabase();
    const summary = await seedDemoData();
    res.json({ ok: true, resetAt: new Date().toISOString(), ...summary });
  } catch (error) {
    res.status(500).json({ error: 'Reset failed', detail: (error as Error).message });
  }
};

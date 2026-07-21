import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { fromZonedTime } from 'date-fns-tz';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

import app from '../app';
import { User } from '../models/User';
import { Staff } from '../models/Staff';
import { Service } from '../models/Service';
import { Booking } from '../models/Booking';
import { Settings } from '../models/Settings';

let mongo: MongoMemoryServer;

const TZ = 'America/New_York';

/** Today in the business timezone, so the "today" assertions never straddle midnight. */
function todayLocal(): string {
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone: TZ }));
  const yyyy = local.getFullYear();
  const mm = String(local.getMonth() + 1).padStart(2, '0');
  const dd = String(local.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function localWeekday(date: string): number {
  return new Date(`${date}T12:00:00`).getDay();
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Staff.deleteMany({}),
    Service.deleteMany({}),
    Booking.deleteMany({}),
    Settings.deleteMany({}),
  ]);
});

/** Minimal but complete fixture: settings, a service, an admin, and one staff member. */
async function seed() {
  await Settings.create({
    businessName: 'Test Clinic',
    timezone: TZ,
    slotIntervalMin: 30,
    leadTimeMin: 60,
    maxAdvanceDays: 30,
  });

  const passwordHash = await bcrypt.hash('demo1234', 10);

  const [adminUser, staffUser, otherStaffUser] = await User.create([
    { name: 'Ada Admin', email: 'admin@slotly.demo', passwordHash, role: 'admin' },
    { name: 'Sam Staff', email: 'staff@slotly.demo', passwordHash, role: 'staff' },
    { name: 'Otto Other', email: 'other@slotly.demo', passwordHash, role: 'staff' },
  ]);

  const service = await Service.create({
    name: 'Cleaning',
    description: 'Standard clean',
    durationMin: 60,
    priceCents: 8900,
    color: '#6366f1',
    isActive: true,
  });

  const date = todayLocal();
  const weekday = localWeekday(date);

  const [staff, otherStaff] = await Staff.create([
    {
      userId: staffUser._id,
      serviceIds: [service._id],
      workingHours: [{ weekday, start: '09:00', end: '17:00' }],
      bufferMin: 0,
      isActive: true,
    },
    {
      userId: otherStaffUser._id,
      serviceIds: [service._id],
      workingHours: [{ weekday, start: '09:00', end: '17:00' }],
      bufferMin: 0,
      isActive: true,
    },
  ]);

  return { adminUser, staffUser, service, staff, otherStaff, date };
}

async function bookingAt(
  opts: {
    staffId: mongoose.Types.ObjectId;
    serviceId: mongoose.Types.ObjectId;
    date: string;
    time: string;
    durationMin?: number;
    source?: 'assistant' | 'web' | 'phone';
    status?: 'confirmed' | 'cancelled' | 'completed';
    name?: string;
  }
) {
  const startAt = fromZonedTime(`${opts.date}T${opts.time}:00`, TZ);
  const endAt = new Date(startAt.getTime() + (opts.durationMin ?? 60) * 60_000);

  return Booking.create({
    serviceId: opts.serviceId,
    staffId: opts.staffId,
    customer: {
      name: opts.name ?? 'Pat Patient',
      email: 'pat@example.com',
      phone: '5550000000',
    },
    startAt,
    endAt,
    status: opts.status ?? 'confirmed',
    source: opts.source ?? 'web',
    manageToken: crypto.randomBytes(16).toString('hex'),
  });
}

async function tokenFor(email: string) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'demo1234' });
  return res.body.token as string;
}

/* ------------------------------------------------------------------ */

describe('auth', () => {
  it('issues a token for valid credentials', async () => {
    await seed();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@slotly.demo', password: 'demo1234' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('admin@slotly.demo');
  });

  it('never returns the password hash', async () => {
    await seed();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@slotly.demo', password: 'demo1234' });

    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects a wrong password', async () => {
    await seed();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@slotly.demo', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('resolves the current user from a token', async () => {
    await seed();
    const token = await tokenFor('admin@slotly.demo');
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
  });
});

describe('admin route protection', () => {
  it('rejects unauthenticated access to stats', async () => {
    await seed();
    expect((await request(app).get('/api/admin/stats')).status).toBe(401);
  });

  it('rejects unauthenticated access to bookings', async () => {
    await seed();
    expect((await request(app).get('/api/admin/bookings')).status).toBe(401);
  });

  it('rejects a garbage token', async () => {
    await seed();
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(401);
  });

  it('forbids a customer even with a valid token', async () => {
    await seed();
    const passwordHash = await bcrypt.hash('demo1234', 10);
    await User.create({
      name: 'Cus Tomer',
      email: 'customer@slotly.demo',
      passwordHash,
      role: 'customer',
    });

    const token = await tokenFor('customer@slotly.demo');
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/stats', () => {
  it('counts today\'s confirmed bookings and revenue', async () => {
    const { staff, service, date } = await seed();
    await bookingAt({ staffId: staff._id, serviceId: service._id, date, time: '09:00' });
    await bookingAt({ staffId: staff._id, serviceId: service._id, date, time: '11:00' });

    const token = await tokenFor('admin@slotly.demo');
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.today.bookings).toBe(2);
    expect(res.body.today.revenueCents).toBe(17800); // 2 x 8900
  });

  it('excludes cancelled bookings from the figures', async () => {
    const { staff, service, date } = await seed();
    await bookingAt({ staffId: staff._id, serviceId: service._id, date, time: '09:00' });
    await bookingAt({
      staffId: staff._id,
      serviceId: service._id,
      date,
      time: '11:00',
      status: 'cancelled',
    });

    const token = await tokenFor('admin@slotly.demo');
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.today.bookings).toBe(1);
    expect(res.body.today.revenueCents).toBe(8900);
  });

  it('still counts completed appointments — the chair was occupied', async () => {
    const { staff, service, date } = await seed();
    await bookingAt({
      staffId: staff._id, serviceId: service._id, date, time: '09:00', status: 'completed',
    });

    const token = await tokenFor('admin@slotly.demo');
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.today.bookings).toBe(1);
    expect(res.body.today.revenueCents).toBe(8900);
  });

  it('attributes bookings to the assistant that created them', async () => {
    const { staff, service, date } = await seed();
    await bookingAt({ staffId: staff._id, serviceId: service._id, date, time: '09:00', source: 'assistant' });
    await bookingAt({ staffId: staff._id, serviceId: service._id, date, time: '11:00', source: 'assistant' });
    await bookingAt({ staffId: staff._id, serviceId: service._id, date, time: '13:00', source: 'web' });
    await bookingAt({ staffId: staff._id, serviceId: service._id, date, time: '15:00', source: 'phone' });

    const token = await tokenFor('admin@slotly.demo');
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.sources.assistant).toBe(2);
    expect(res.body.sources.web).toBe(1);
    expect(res.body.sources.phone).toBe(1);
    expect(res.body.sources.assistantSharePct).toBe(50);
  });

  it('computes utilisation across the whole active team', async () => {
    const { staff, service, date } = await seed();
    // Two staff x 8h = 960 working minutes. One 60-minute booking => 6%.
    await bookingAt({ staffId: staff._id, serviceId: service._id, date, time: '09:00' });

    const token = await tokenFor('admin@slotly.demo');
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.today.utilisationPct).toBe(6); // round(60/960 * 100)
    expect(res.body.staffUtilisation).toHaveLength(2);
    expect(res.body.staffUtilisation[0].utilisationPct).toBe(13); // round(60/480*100)
  });

  it('returns a 7-point week series', async () => {
    await seed();
    const token = await tokenFor('admin@slotly.demo');
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.week).toHaveLength(7);
    for (const day of res.body.week) {
      expect(day).toHaveProperty('utilisationPct');
      expect(day).toHaveProperty('revenueCents');
      expect(day).toHaveProperty('assistantBookings');
    }
  });

  it('survives an empty database without dividing by zero', async () => {
    await seed();
    const token = await tokenFor('admin@slotly.demo');
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.today.bookings).toBe(0);
    expect(res.body.today.utilisationPct).toBe(0);
    expect(res.body.sources.assistantSharePct).toBe(0);
  });
});

describe('GET /api/admin/bookings', () => {
  it('returns bookings with service and staff populated', async () => {
    const { staff, service, date } = await seed();
    await bookingAt({ staffId: staff._id, serviceId: service._id, date, time: '09:00' });

    const token = await tokenFor('admin@slotly.demo');
    const res = await request(app)
      .get(`/api/admin/bookings?from=${date}&to=${date}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.bookings).toHaveLength(1);
    expect(res.body.bookings[0].serviceId.name).toBe('Cleaning');
    expect(res.body.bookings[0].staffId.userId.name).toBe('Sam Staff');
  });

  it('filters by status', async () => {
    const { staff, service, date } = await seed();
    await bookingAt({ staffId: staff._id, serviceId: service._id, date, time: '09:00' });
    await bookingAt({
      staffId: staff._id, serviceId: service._id, date, time: '11:00', status: 'cancelled',
    });

    const token = await tokenFor('admin@slotly.demo');
    const res = await request(app)
      .get(`/api/admin/bookings?status=cancelled`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.bookings).toHaveLength(1);
    expect(res.body.bookings[0].status).toBe('cancelled');
  });

  it('scopes a staff user to their own appointments only', async () => {
    const { staff, otherStaff, service, date } = await seed();
    await bookingAt({ staffId: staff._id, serviceId: service._id, date, time: '09:00', name: 'Mine' });
    await bookingAt({ staffId: otherStaff._id, serviceId: service._id, date, time: '10:00', name: 'Theirs' });

    const staffToken = await tokenFor('staff@slotly.demo');
    const staffRes = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(staffRes.body.bookings).toHaveLength(1);
    expect(staffRes.body.bookings[0].customer.name).toBe('Mine');

    // The admin still sees everything.
    const adminToken = await tokenFor('admin@slotly.demo');
    const adminRes = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminRes.body.bookings).toHaveLength(2);
  });

  it('rejects a malformed date filter', async () => {
    await seed();
    const token = await tokenFor('admin@slotly.demo');
    const res = await request(app)
      .get('/api/admin/bookings?from=not-a-date')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('POST /api/assistant/chat', () => {
  const ORIGINAL_KEY = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = ORIGINAL_KEY;
  });

  it('degrades politely when no API key is configured', async () => {
    delete process.env.GEMINI_API_KEY;

    const res = await request(app)
      .post('/api/assistant/chat')
      .send({ messages: [{ role: 'user', content: 'Hi' }] });

    // Never a 500 — the rest of the product works without an LLM key.
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(false);
    expect(typeof res.body.reply).toBe('string');
  });

  it('rejects a request with no messages', async () => {
    process.env.GEMINI_API_KEY = 'test-key';

    const res = await request(app).post('/api/assistant/chat').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/cron/reset', () => {
  const ORIGINAL = { demo: process.env.DEMO_MODE, secret: process.env.CRON_SECRET };

  afterEach(() => {
    process.env.DEMO_MODE = ORIGINAL.demo;
    process.env.CRON_SECRET = ORIGINAL.secret;
  });

  it('refuses when demo mode is off', async () => {
    await seed();
    process.env.DEMO_MODE = 'false';
    process.env.CRON_SECRET = 'topsecret';

    const res = await request(app)
      .get('/api/cron/reset')
      .set('Authorization', 'Bearer topsecret');

    expect(res.status).toBe(403);
  });

  it('refuses without the secret', async () => {
    await seed();
    process.env.DEMO_MODE = 'true';
    process.env.CRON_SECRET = 'topsecret';

    expect((await request(app).get('/api/cron/reset')).status).toBe(401);
  });

  it('refuses a wrong secret', async () => {
    await seed();
    process.env.DEMO_MODE = 'true';
    process.env.CRON_SECRET = 'topsecret';

    const res = await request(app)
      .get('/api/cron/reset')
      .set('Authorization', 'Bearer wrongsecret');

    expect(res.status).toBe(401);
  });

  it('reseeds the database when authorised', async () => {
    const { staff, service, date } = await seed();
    await bookingAt({ staffId: staff._id, serviceId: service._id, date, time: '09:00' });

    process.env.DEMO_MODE = 'true';
    process.env.CRON_SECRET = 'topsecret';

    const res = await request(app)
      .get('/api/cron/reset')
      .set('Authorization', 'Bearer topsecret');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.bookings).toBeGreaterThan(0);

    // The demo fixture replaced the test fixture.
    const users = await User.find({});
    expect(users.some((u) => u.email === 'admin@slotly.demo')).toBe(true);
  });
});

describe('PATCH /api/admin/bookings/:id', () => {
  it('lets an admin cancel a booking', async () => {
    const { staff, service, date } = await seed();
    const booking = await bookingAt({
      staffId: staff._id, serviceId: service._id, date, time: '09:00',
    });

    const token = await tokenFor('admin@slotly.demo');
    const res = await request(app)
      .patch(`/api/admin/bookings/${booking._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  it("forbids a staff member from touching someone else's booking", async () => {
    const { otherStaff, service, date } = await seed();
    const booking = await bookingAt({
      staffId: otherStaff._id, serviceId: service._id, date, time: '09:00',
    });

    const token = await tokenFor('staff@slotly.demo');
    const res = await request(app)
      .patch(`/api/admin/bookings/${booking._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'cancelled' });

    expect(res.status).toBe(403);
  });

  it('rejects an invalid status value', async () => {
    const { staff, service, date } = await seed();
    const booking = await bookingAt({
      staffId: staff._id, serviceId: service._id, date, time: '09:00',
    });

    const token = await tokenFor('admin@slotly.demo');
    const res = await request(app)
      .patch(`/api/admin/bookings/${booking._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'exploded' });

    expect(res.status).toBe(400);
  });
});

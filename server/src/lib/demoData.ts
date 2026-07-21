import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { addDays, getDay } from 'date-fns';
import { User } from '../models/User';
import { Service } from '../models/Service';
import { Staff } from '../models/Staff';
import { Booking, type BookingSource } from '../models/Booking';
import { TimeOff } from '../models/TimeOff';
import { Settings } from '../models/Settings';

const TIMEZONE = 'America/New_York';

const FIRST_NAMES = [
  'Amara', 'Daniel', 'Priya', 'Tomás', 'Helen', 'Marcus', 'Yuki', 'Noor',
  'Elena', 'Jonah', 'Rosa', 'Idris', 'Mei', 'Caleb', 'Fatima', 'Owen',
];
const LAST_NAMES = [
  'Ellis', 'Okafor', 'Raman', 'Vega', 'Zhao', 'Hale', 'Tanaka', 'Haddad',
  'Petrova', 'Byrne', 'Delgado', 'Camara', 'Lin', 'Foster', 'Aziz', 'Wright',
];

/** Deterministic pseudo-random so the demo looks identical on every reseed. */
function seededInt(seed: string, max: number): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % max;
}

function localDateString(instant: Date, timezone: string): string {
  const local = toZonedTime(instant, timezone);
  return [
    local.getFullYear(),
    String(local.getMonth() + 1).padStart(2, '0'),
    String(local.getDate()).padStart(2, '0'),
  ].join('-');
}

function addMinutesToClock(clock: string, minutes: number): string {
  const [h, m] = clock.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Populates a *connected* database with a coherent demo clinic.
 *
 * Bookings are spread across the previous and next seven days and placed inside
 * each staff member's real working hours, so the dashboard's utilisation maths
 * has something honest to chew on — including today, which is what anyone
 * screenshotting the portfolio will actually look at.
 */
export async function seedDemoData() {
  await Settings.create({
    businessName: 'Northside Dental',
    timezone: TIMEZONE,
    slotIntervalMin: 15,
    leadTimeMin: 120,
    maxAdvanceDays: 30,
  });

  const passwordHash = await bcrypt.hash('demo1234', 12);

  const [, staffUser1, staffUser2, staffUser3] = await User.create([
    { name: 'Admin User', email: 'admin@slotly.demo', passwordHash, role: 'admin' },
    { name: 'Dr. Sarah Rao', email: 'staff@slotly.demo', passwordHash, role: 'staff' },
    { name: 'Dr. John Miller', email: 'john@slotly.demo', passwordHash, role: 'staff' },
    { name: 'Dr. Emily Chen', email: 'emily@slotly.demo', passwordHash, role: 'staff' },
  ]);

  const services = await Service.insertMany([
    { name: 'Routine Checkup', description: 'Standard cleaning and checkup', durationMin: 45, priceCents: 15000, color: '#3b82f6' },
    { name: 'Teeth Whitening', description: 'Professional laser whitening', durationMin: 60, priceCents: 30000, color: '#10b981' },
    { name: 'Cavity Filling', description: 'Composite filling for one cavity', durationMin: 45, priceCents: 20000, color: '#f59e0b' },
    { name: 'Root Canal', description: 'Endodontic therapy', durationMin: 90, priceCents: 80000, color: '#ef4444' },
    { name: 'Consultation', description: 'Initial dental consultation', durationMin: 30, priceCents: 5000, color: '#6366f1' },
  ]);

  const allServiceIds = services.map((s) => s._id);

  const staffMembers = await Staff.create([
    {
      userId: staffUser1._id,
      bio: 'Lead dentist with 10 years of experience.',
      serviceIds: allServiceIds,
      workingHours: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, start: '09:00', end: '17:00' })),
      bufferMin: 15,
    },
    {
      userId: staffUser2._id,
      bio: 'Specialist in cosmetic dentistry.',
      serviceIds: allServiceIds,
      workingHours: [2, 3, 4, 5, 6].map((weekday) => ({ weekday, start: '10:00', end: '18:00' })),
      bufferMin: 10,
    },
    {
      userId: staffUser3._id,
      bio: 'Pediatric dental specialist.',
      serviceIds: allServiceIds,
      workingHours: [1, 2, 3].map((weekday) => ({ weekday, start: '08:00', end: '14:00' })),
      bufferMin: 10,
    },
  ]);

  // A time-off block tomorrow, so availability has a visible hole in it.
  const tomorrow = localDateString(addDays(new Date(), 1), TIMEZONE);
  await TimeOff.create({
    staffId: staffMembers[0]._id,
    startAt: fromZonedTime(`${tomorrow}T12:00:00`, TIMEZONE),
    endAt: fromZonedTime(`${tomorrow}T14:00:00`, TIMEZONE),
    reason: 'Dentist appointment (ironic)',
  });

  /* ---------------- Bookings: last 7 days through next 7 days ---------------- */

  const now = new Date();
  const bookings: Record<string, unknown>[] = [];

  for (let offset = -7; offset <= 7; offset++) {
    const date = localDateString(addDays(now, offset), TIMEZONE);
    const weekday = getDay(toZonedTime(fromZonedTime(`${date}T12:00:00`, TIMEZONE), TIMEZONE));

    staffMembers.forEach((staff, staffIndex) => {
      const shift = staff.workingHours.find((wh) => wh.weekday === weekday);
      if (!shift) return;

      // 2-4 appointments per working day, stable per (date, staff).
      const count = 2 + seededInt(`${date}-${staffIndex}-count`, 3);

      for (let i = 0; i < count; i++) {
        const seed = `${date}-${staffIndex}-${i}`;
        const service = services[seededInt(`${seed}-svc`, services.length)];

        // Space appointments 100 minutes apart from the start of the shift.
        const startClock = addMinutesToClock(shift.start, i * 100);
        if (startClock >= shift.end) break;

        const startAt = fromZonedTime(`${date}T${startClock}:00`, TIMEZONE);
        const endAt = new Date(startAt.getTime() + service.durationMin * 60_000);

        // Most bookings arrive through the assistant — that's the product's point.
        const roll = seededInt(`${seed}-src`, 10);
        const source: BookingSource = roll < 6 ? 'assistant' : roll < 9 ? 'web' : 'phone';

        // A little churn in the past so the data doesn't look synthetic.
        let status: 'confirmed' | 'cancelled' | 'completed' = 'confirmed';
        if (offset < 0) status = seededInt(`${seed}-st`, 10) < 8 ? 'completed' : 'cancelled';
        else if (seededInt(`${seed}-st`, 12) === 0) status = 'cancelled';

        const first = FIRST_NAMES[seededInt(`${seed}-fn`, FIRST_NAMES.length)];
        const last = LAST_NAMES[seededInt(`${seed}-ln`, LAST_NAMES.length)];

        bookings.push({
          serviceId: service._id,
          staffId: staff._id,
          customer: {
            name: `${first} ${last}`,
            email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
            phone: `555-01${String(seededInt(seed, 90) + 10)}`,
          },
          startAt,
          endAt,
          status,
          source,
          manageToken: crypto.randomBytes(32).toString('hex'),
        });
      }
    });
  }

  await Booking.insertMany(bookings);

  return {
    users: 4,
    services: services.length,
    staff: staffMembers.length,
    bookings: bookings.length,
  };
}

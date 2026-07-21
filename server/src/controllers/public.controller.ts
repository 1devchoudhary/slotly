import { Request, Response } from 'express';
import { z } from 'zod';
import { Service } from '../models/Service';
import { Staff } from '../models/Staff';
import { Booking } from '../models/Booking';
import { Settings } from '../models/Settings';
import { TimeOff } from '../models/TimeOff';
import { getAvailableSlots } from '../lib/availability';
import crypto from 'crypto';
import { toZonedTime } from 'date-fns-tz';

export const getServices = async (req: Request, res: Response) => {
  const services = await Service.find({ isActive: true });
  res.json(services);
};

export const getStaff = async (req: Request, res: Response) => {
  const { serviceId } = req.query;
  const filter: any = { isActive: true };
  if (serviceId) {
    filter.serviceIds = serviceId;
  }
  const staff = await Staff.find(filter).populate('userId', 'name');
  res.json(staff);
};

export const getAvailability = async (req: Request, res: Response) => {
  try {
    const { serviceId, staffId, date } = z.object({
      serviceId: z.string(),
      staffId: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    }).parse(req.query);

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({
        businessName: 'Slotly Demo',
        timezone: 'America/New_York', slotIntervalMin: 15, leadTimeMin: 120, maxAdvanceDays: 30
      });
    }

    const existingBookings = await Booking.find({
      staffId,
      status: 'confirmed',
      startAt: { $gte: new Date() }
    });

    const timeOff = await TimeOff.find({
      staffId,
      endAt: { $gte: new Date() }
    });

    const slots = getAvailableSlots({
      staff,
      service,
      date,
      timezone: settings.timezone,
      existingBookings,
      timeOff,
      settings
    });

    res.json(slots);
  } catch (error) {
    res.status(400).json({ error: 'Invalid parameters' });
  }
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      serviceId: z.string(),
      staffId: z.string(),
      startAt: z.string(),
      customer: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string()
      })
    });
    const data = schema.parse(req.body);

    const service = await Service.findById(data.serviceId);
    const staff = await Staff.findById(data.staffId);
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({
        businessName: 'Slotly Demo',
        timezone: 'America/New_York', slotIntervalMin: 15, leadTimeMin: 120, maxAdvanceDays: 30
      });
    }

    if (!service || !staff) {
      return res.status(404).json({ error: 'Service or Staff not found' });
    }

    const startAtDate = new Date(data.startAt);
    
    // Find local date in timezone to run availability check
    const localDate = toZonedTime(startAtDate, settings.timezone);
    // YYYY-MM-DD format based on local time
    const yyyy = localDate.getFullYear();
    const mm = String(localDate.getMonth() + 1).padStart(2, '0');
    const dd = String(localDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const existingBookings = await Booking.find({
      staffId: data.staffId,
      status: 'confirmed',
      startAt: { $gte: new Date() }
    });

    const timeOff = await TimeOff.find({
      staffId: data.staffId,
      endAt: { $gte: new Date() }
    });

    const slots = getAvailableSlots({
      staff,
      service,
      date: dateStr,
      timezone: settings.timezone,
      existingBookings,
      timeOff,
      settings
    });

    const isValidSlot = slots.some(s => s.startAt.getTime() === startAtDate.getTime());
    
    if (!isValidSlot) {
      return res.status(409).json({ error: 'Slot is no longer available' });
    }

    const endAt = new Date(startAtDate.getTime() + service.durationMin * 60000);
    const manageToken = crypto.randomBytes(32).toString('hex');

    const booking = await Booking.create({
      serviceId: data.serviceId,
      staffId: data.staffId,
      customer: data.customer,
      startAt: startAtDate,
      endAt,
      manageToken,
      status: 'confirmed',
      source: 'web'
    });

    res.json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBookingByToken = async (req: Request, res: Response) => {
  const { token } = req.params;
  const booking = await Booking.findOne({ manageToken: token })
    .populate('serviceId')
    .populate({ path: 'staffId', populate: { path: 'userId', select: 'name' } });
    
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
};

export const cancelBooking = async (req: Request, res: Response) => {
  const { token } = req.params;
  const booking = await Booking.findOne({ manageToken: token });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  booking.status = 'cancelled';
  await booking.save();
  res.json(booking);
};

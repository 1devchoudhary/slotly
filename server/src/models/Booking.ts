import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer {
  name: string;
  email: string;
  phone: string;
}

/** How the appointment reached us. Set by whichever surface created it. */
export type BookingSource = 'assistant' | 'web' | 'phone';

export interface IBooking extends Document {
  serviceId: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  customer: ICustomer;
  startAt: Date;
  endAt: Date;
  status: 'confirmed' | 'cancelled' | 'completed';
  source: BookingSource;
  notes?: string;
  manageToken: string;
  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' },
  source: { type: String, enum: ['assistant', 'web', 'phone'], default: 'web' },
  notes: { type: String },
  manageToken: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

bookingSchema.index({ staffId: 1, startAt: 1 });
// Dashboard reads are almost always "confirmed bookings in this date range".
bookingSchema.index({ startAt: 1, status: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

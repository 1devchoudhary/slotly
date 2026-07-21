import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeOff extends Document {
  staffId: mongoose.Types.ObjectId;
  startAt: Date;
  endAt: Date;
  reason?: string;
}

const timeOffSchema = new Schema<ITimeOff>({
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  reason: { type: String }
});

export const TimeOff = mongoose.model<ITimeOff>('TimeOff', timeOffSchema);

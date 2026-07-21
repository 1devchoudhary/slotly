import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkingHours {
  weekday: number; // 0-6
  start: string; // "09:00"
  end: string; // "17:00"
}

export interface IStaff extends Document {
  userId: mongoose.Types.ObjectId;
  bio?: string;
  serviceIds: mongoose.Types.ObjectId[];
  workingHours: IWorkingHours[];
  bufferMin: number;
  isActive: boolean;
}

const staffSchema = new Schema<IStaff>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bio: { type: String },
  serviceIds: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  workingHours: [{
    weekday: { type: Number, required: true, min: 0, max: 6 },
    start: { type: String, required: true },
    end: { type: String, required: true }
  }],
  bufferMin: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true }
});

export const Staff = mongoose.model<IStaff>('Staff', staffSchema);

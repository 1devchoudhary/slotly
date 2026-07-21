import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  businessName: string;
  timezone: string;
  slotIntervalMin: number;
  leadTimeMin: number;
  maxAdvanceDays: number;
}

const settingsSchema = new Schema<ISettings>({
  businessName: { type: String, required: true },
  timezone: { type: String, required: true },
  slotIntervalMin: { type: Number, default: 15 },
  leadTimeMin: { type: Number, required: true },
  maxAdvanceDays: { type: Number, required: true }
});

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);

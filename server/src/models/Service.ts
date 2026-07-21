import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  color: string;
  isActive: boolean;
}

const serviceSchema = new Schema<IService>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  durationMin: { type: Number, required: true },
  priceCents: { type: Number, required: true },
  color: { type: String, required: true },
  isActive: { type: Boolean, default: true }
});

export const Service = mongoose.model<IService>('Service', serviceSchema);

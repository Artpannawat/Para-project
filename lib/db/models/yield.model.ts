import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IYield extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  weight: number;
  drc_percent?: number;
  price_per_kg: number;
  type: 'CupLump' | 'Latex';
  buyer?: string;
}

const YieldSchema = new Schema<IYield>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    weight: { type: Number, required: true },
    drc_percent: { type: Number },
    price_per_kg: { type: Number, required: true },
    type: { type: String, enum: ['CupLump', 'Latex'], required: true },
    buyer: { type: String },
  },
  { timestamps: true }
);

export const Yield: Model<IYield> = mongoose.models.Yield || mongoose.model<IYield>('Yield', YieldSchema);

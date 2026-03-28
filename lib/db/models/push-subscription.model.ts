import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPushSubscription extends Document {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  lat?: number;
  lon?: number;
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    lat: { type: Number, default: 17.89 },
    lon: { type: Number, default: 101.88 },
  },
  { timestamps: true }
);

const PushSubscriptionModel: Model<IPushSubscription> =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);

export default PushSubscriptionModel;

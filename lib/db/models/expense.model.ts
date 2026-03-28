import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IExpense extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  category: string;
  amount: number;
  description?: string;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

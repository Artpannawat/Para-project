import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db/mongodb';
import { Yield } from '@/lib/db/models/yield.model';
import { Expense } from '@/lib/db/models/expense.model';
import { Wallet } from 'lucide-react';
import AccountingClientView from '@/components/accounting/AccountingClientView';

export const dynamic = 'force-dynamic';

export default async function AccountingPage() {
  const session = await getSession();

  if (!session || !session.user) {
    redirect('/login');
  }

  await dbConnect();
  
  // Fetch data
  const yields = await Yield.find({ userId: session.user.id }).sort({ date: -1 }).lean();
  const expenses = await Expense.find({ userId: session.user.id }).sort({ date: -1 }).lean();

  // Parse Mongo ObjectIds to string for safe Client prop passing
  const safeYields = yields.map((y: any) => ({
    ...y,
    _id: y._id.toString(),
    userId: y.userId.toString(),
    date: y.date.toISOString(),
    amount: y.weight * y.price_per_kg // Computed field for ease of use
  }));

  const safeExpenses = expenses.map((e: any) => ({
    ...e,
    _id: e._id.toString(),
    userId: e.userId.toString(),
    date: e.date.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-transparent pt-10 pb-12 flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Wallet className="text-emerald-500" />
            บัญชีรายรับ-รายจ่าย
          </h2>
          <p className="text-sm text-neutral-500 mt-1">บันทึกและตรวจสอบการเงินสวนยาง</p>
        </div>
      </div>
      
      <AccountingClientView initialYields={safeYields} initialExpenses={safeExpenses} />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import { Yield } from '@/lib/db/models/yield.model';
import { Expense } from '@/lib/db/models/expense.model';
import { WeatherAdviceCard } from '@/components/dashboard/WeatherAdviceCard';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session || !session.user) {
    redirect('/login');
  }

  await dbConnect();
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Get Current Month Yields (Income)
  const currentMonthYields = await Yield.find({
    userId: session.user.id,
    date: { $gte: startOfMonth },
  });
  const thisMonthIncome = currentMonthYields.reduce((sum, y) => sum + (y.weight * y.price_per_kg), 0);

  // Get Prev Month Yields (Income)
  const prevMonthYields = await Yield.find({
    userId: session.user.id,
    date: { $gte: startOfPrevMonth, $lt: startOfMonth },
  });
  const prevMonthIncome = prevMonthYields.reduce((sum, y) => sum + (y.weight * y.price_per_kg), 0);
  
  // Income % change
  let incomeChange = 0;
  if (prevMonthIncome > 0) {
    incomeChange = ((thisMonthIncome - prevMonthIncome) / prevMonthIncome) * 100;
  }

  // Get Current Month Expenses
  const currentMonthExpenses = await Expense.find({
    userId: session.user.id,
    date: { $gte: startOfMonth },
  });
  const thisMonthExpense = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      {/* Header Profile */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            สวัสดี, {session.user?.name || 'เกษตรกรคนเก่ง'} 👋
          </h2>
          <p className="text-sm text-neutral-500 font-medium">เตรียมตัวกรีดยางวันนี้</p>
        </div>
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt="Profile Picture"
            width={48}
            height={48}
            className="rounded-full shadow-lg p-0.5 bg-gradient-to-tr from-emerald-500 to-teal-400"
          />
        ) : (
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold shadow-sm">
            {session.user?.name?.charAt(0) || 'U'}
          </div>
        )}
      </div>

      {/* Weather Advice Section */}
      <section className="mb-6 animate-in slide-in-from-bottom-4 duration-500 z-10">
        <WeatherAdviceCard />
      </section>

      {/* Quick Summary Section */}
      <section className="mt-2 space-y-4 pb-20">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
            สรุปรายได้เดือนนี้
          </h3>
          {incomeChange !== 0 && (
             <span className={`font-bold text-sm px-3 py-1 rounded-full flex gap-1 items-center ${incomeChange > 0 ? 'text-emerald-500 bg-emerald-100/50 dark:bg-emerald-900/30' : 'text-rose-500 bg-rose-100/50 dark:bg-rose-900/30'}`}>
               {incomeChange > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {incomeChange > 0 ? '+' : ''}{Math.round(incomeChange)}%
             </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-3">
              <ArrowUpRight size={20} strokeWidth={3} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-sm text-neutral-500 font-semibold mb-1">รายรับ (บาท)</p>
            <p className="text-xl font-black text-neutral-800 dark:text-neutral-100 tracking-tight">
              ฿{thisMonthIncome.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-3">
              <ArrowDownRight size={20} strokeWidth={3} className="group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
            </div>
            <p className="text-sm text-neutral-500 font-semibold mb-1">รายจ่าย (บาท)</p>
            <p className="text-xl font-black text-neutral-800 dark:text-neutral-100 tracking-tight">
              ฿{thisMonthExpense.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-teal-500 to-emerald-600 border border-transparent p-5 rounded-3xl shadow-emerald-500/20 shadow-lg relative overflow-hidden col-span-2 text-white">
            <p className="text-sm font-medium mb-1 opacity-90">กำไรสุทธิเดือนนี้</p>
            <p className="text-3xl font-black tracking-tight">
              ฿{(thisMonthIncome - thisMonthExpense).toLocaleString()}
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

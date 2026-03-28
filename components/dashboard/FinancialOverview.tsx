'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function FinancialOverview() {
  const currentYear = new Date().getFullYear();
  // Fetch monthly summary for the current year
  const { data: summary, isLoading } = useSWR(`/api/accounting/summary?period=monthly&year=${currentYear}`, fetcher);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-900 p-8 rounded-[3rem] shadow-sm border border-neutral-100 dark:border-neutral-800 animate-pulse flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" />
      </div>
    );
  }

  const totalIncome = summary?.totalIncome || 0;
  const totalExpense = summary?.totalExpense || 0;
  const totalProfit = totalIncome - totalExpense;
  
  // Simple "change" logic based on last month if available in chart, or just show current status
  // For v2.2, we'll focus on real-time totals.
  
  return (
    <div className="bg-white dark:bg-neutral-900 p-7 rounded-[3rem] shadow-2xl border border-neutral-100 dark:border-neutral-800 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-[0.2em] mb-1">ผลกำไรสุทธิเดือนนี้</p>
          <p className="text-4xl font-black text-neutral-800 dark:text-neutral-100 tracking-tighter">
            ฿{totalProfit.toLocaleString()}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm ${totalProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {totalProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {totalProfit >= 0 ? 'กำไร' : 'ขาดทุน'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-6 border-t-2 border-dashed border-neutral-50 dark:border-neutral-800/10">
        <div className="flex items-center gap-4 group">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-[1.25rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <ArrowUpRight size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">รายรับรวม</p>
            <p className="font-black text-lg text-neutral-700 dark:text-neutral-200">฿{totalIncome.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 group">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-[1.25rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <ArrowDownRight size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">รายจ่ายรวม</p>
            <p className="font-black text-lg text-neutral-700 dark:text-neutral-200">฿{totalExpense.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

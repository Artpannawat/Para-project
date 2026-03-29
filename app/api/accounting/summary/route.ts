export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import { Yield } from '@/lib/db/models/yield.model';
import { Expense } from '@/lib/db/models/expense.model';

// --- ROBUST DATE PARSING HELPERS ---
function parseDateSafe(dateVal: any): { year: number | null, month: number | null, isValid: boolean } {
  if (!dateVal) return { year: null, month: null, isValid: false };

  // 1. Try standard JS Date parsing first
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() + 1, isValid: true };
  }

  // 2. If it fails (e.g., string format 'DD/MM/YYYY'), fallback to RegEx
  if (typeof dateVal === 'string') {
    // Match common Thai/Buddhist 'DD/MM/YYYY' or 'YYYY-MM-DD' patterns
    const parts = dateVal.split(/[-/]/);
    if (parts.length === 3) {
      // Guessing based on common local storage:
      // If first part is > 31, it's YYYY-MM-DD
      // If last part is > 31, it's DD/MM/YYYY
      let y, m;
      if (parseInt(parts[0]) > 31) {
        y = parseInt(parts[0]);
        m = parseInt(parts[1]);
      } else if (parseInt(parts[2]) > 31) {
        y = parseInt(parts[2]);
        m = parseInt(parts[1]);
      }
      
      if (y && m) {
        // Adjust Thai Buddhist year if needed
        if (y > 2500) y -= 543;
        return { year: y, month: m, isValid: true };
      }
    }
  }

  return { year: null, month: null, isValid: false };
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'monthly'; // 'monthly' | 'yearly'
    let year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // --- BUDDHIST SANITY CHECK ---
    if (year > 2500) year -= 543;

    await dbConnect();

    // 🚀 BULLETPROOF FETCH: Use raw find() to match the working transaction list
    const [allYields, allExpenses] = await Promise.all([
      Yield.find({ userId: user.id }).lean(),
      Expense.find({ userId: user.id }).lean(),
    ]);

    console.log("--- STARTING AGGREGATION ---");
    console.log("Raw Yields length:", allYields.length);
    console.log("Sample Yield Date value:", allYields[0]?.date);
    console.log("Raw Expenses length:", allExpenses.length);

    const startYear = period === 'yearly' ? year - 4 : year;
    const endYear = year;

    // --- JAVASCRIPT CALCULATION ENGINE ---
    const MONTHS_TH_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

    const slots = period === 'yearly'
      ? Array.from({ length: 5 }, (_, i) => ({ 
          key: startYear + i, 
          label: String(startYear + i + 543),
          income: 0,
          expense: 0
        }))
      : Array.from({ length: 12 }, (_, i) => ({ 
          key: i + 1, 
          label: MONTHS_TH_FULL[i],
          income: 0,
          expense: 0
        }));

    let totalIncome = 0;
    let totalExpense = 0;
    let unparseableCount = 0;

    // 💰 Process Yields (Income)
    allYields.forEach((y: any) => {
      const { year: yYear, month: yMonth, isValid } = parseDateSafe(y.date);
      
      if (!isValid) {
        unparseableCount++;
        return; // Skip document if date is utterly broken
      }

      // Filter logic
      if (period === 'monthly' && yYear === year) {
        const slot = slots.find(s => s.key === yMonth);
        const amount = Number(y.weight || 0) * Number(y.price_per_kg || 0);
        if (slot) slot.income += amount;
        totalIncome += amount;
      } else if (period === 'yearly' && yYear !== null && yYear >= startYear && yYear <= endYear) {
        const slot = slots.find(s => s.key === yYear);
        const amount = Number(y.weight || 0) * Number(y.price_per_kg || 0);
        if (slot) slot.income += amount;
        totalIncome += amount;
      }
    });

    // 💸 Process Expenses
    allExpenses.forEach((e: any) => {
      const { year: eYear, month: eMonth, isValid } = parseDateSafe(e.date);

      if (!isValid) {
        unparseableCount++;
        return;
      }

      // Filter logic
      if (period === 'monthly' && eYear === year) {
        const slot = slots.find(s => s.key === eMonth);
        const amount = Number(e.amount || 0);
        if (slot) slot.expense += amount;
        totalExpense += amount;
      } else if (period === 'yearly' && eYear !== null && eYear >= startYear && eYear <= endYear) {
        const slot = slots.find(s => s.key === eYear);
        const amount = Number(e.amount || 0);
        if (slot) slot.expense += amount;
        totalExpense += amount;
      }
    });

    if (unparseableCount > 0) {
      console.log(`WARNING: Skipped ${unparseableCount} documents due to completely unparseable dates.`);
    }

    // Format final chart data
    const chart = slots.map((s, index) => ({
      name: s.label,
      index: index + 1,
      income: Math.round(s.income),
      expense: Math.round(s.expense),
      profit: Math.round(s.income - s.expense)
    }));

    console.log("Final Computed Array Sample:", chart[0]);
    console.log("Total Income:", totalIncome, "Total Expense:", totalExpense);

    return NextResponse.json({
      chart,
      totalIncome: Math.round(totalIncome),
      totalExpense: Math.round(totalExpense),
      totalProfit: Math.round(totalIncome - totalExpense),
      period,
      year,
    });
  } catch (error) {
    console.error('[ACCOUNTING_SUMMARY]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

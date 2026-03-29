'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import useSWR, { mutate } from 'swr';
import {
  PlusCircle, FileText, TrendingDown, TrendingUp, X,
  Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';

type View = 'dashboard' | 'add_income' | 'add_expense' | 'edit_income' | 'edit_expense';
type Period = 'monthly' | 'yearly';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'];
const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Thai number formatter
const thb = (n: number) => `฿${Math.abs(n).toLocaleString('th-TH')}`;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-neutral-800 shadow-xl rounded-xl p-3 border border-neutral-100 dark:border-neutral-700 text-sm">
      <p className="font-bold text-neutral-700 dark:text-neutral-200 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name === 'income' ? 'รายรับ' : p.name === 'expense' ? 'รายจ่าย' : 'กำไร'}: {thb(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function AccountingClientView({
  initialYields,
  initialExpenses,
}: {
  initialYields: any[];
  initialExpenses: any[];
}) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [view, setView] = useState<View>('dashboard');
  const [period, setPeriod] = useState<Period>('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [editItem, setEditItem] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // SWR for summary chart data - conditional on session
  // Adding 'month' to the key even for yearly mode to ensure clear cache boundaries
  const { data: summary, isLoading: summaryLoading } = useSWR(
    userId ? `/api/accounting/summary?period=${period}&year=${year}&m=${month}` : null,
    fetcher,
    { revalidateOnFocus: false } // REMOVED fallbackData: null to avoid ฿0 race conditions
  );

  // DEBUGGING: Inspect the handoff from the API to the UI
  console.log("DASHBOARD_UI: Summary Data ->", summary);

  // SWR for transactions
  const { data: yields, mutate: mutateYields } = useSWR(userId ? `/api/yield?m=${month}` : null, fetcher, {
    fallbackData: initialYields,
  });
  const { data: expenses, mutate: mutateExpenses } = useSWR(userId ? `/api/expense?m=${month}` : null, fetcher, {
    fallbackData: initialExpenses,
  });

  // Calculate filtered transactions for WYSIWYG
  const filteredTransacs = useMemo(() => {
    const all = [
      ...(yields || initialYields).map((y: any) => ({
        _id: y._id,
        date: y.date,
        type: 'income' as const,
        label: `ขายยาง (${y.type === 'CupLump' ? 'ก้อนถ้วย' : 'น้ำยาง'})`,
        amount: y.weight * y.price_per_kg,
        raw: y,
      })),
      ...(expenses || initialExpenses).map((e: any) => ({
        _id: e._id,
        date: e.date,
        type: 'expense' as const,
        label: e.category,
        amount: e.amount,
        raw: e,
      })),
    ];

    return all.filter(t => {
      const d = new Date(t.date);
      const tYear = d.getFullYear();
      const tMonth = d.getMonth() + 1;
      if (period === 'monthly') {
        return tYear === year && tMonth === month;
      } else {
        // In yearly mode, we match the 5-year trend (current year - 4 to current year)
        const startYear = year - 4;
        return tYear >= startYear && tYear <= year;
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [yields, initialYields, expenses, initialExpenses, year, month, period]);

  // Current month totals from API chart data (for summary cards)
  const currentMonthTotals = useMemo(() => {
    if (period === 'yearly') return { income: summary?.totalIncome || 0, expense: summary?.totalExpense || 0, profit: summary?.totalProfit || 0 };
    
    // Robust index-based matching (1-12) instead of string matching
    const data = summary?.chart?.find((c: any) => c.index === month);
    return {
      income: data?.income || 0,
      expense: data?.expense || 0,
      profit: data?.profit || 0
    };
  }, [summary, month, period]);

  const handleExportCsv = () => {
    if (filteredTransacs.length === 0) return alert('ไม่มีข้อมูลสำหรับส่งออก');

    // UTF-8 BOM for Thai support in Excel
    const BOM = '\uFEFF';
    const headers = ['วันที่', 'รายการ', 'ประเภท', 'จำนวนเงิน (บาท)'].join(',');
    
    const rows = filteredTransacs.map(t => {
      const d = new Date(t.date);
      const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear() + 543}`;
      const typeStr = t.type === 'income' ? 'รายรับ' : 'รายจ่าย';
      return [
        `"${dateStr}"`,
        `"${t.label}"`,
        `"${typeStr}"`,
        t.amount
      ].join(',');
    });

    const csvContent = BOM + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const filename = period === 'monthly' 
      ? `Report_ParaSmart_${String(month).padStart(2, '0')}_${year + 543}.csv`
      : `Report_ParaSmart_Year_${year + 543}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = useCallback(async (id: string, type: 'income' | 'expense') => {
    if (!confirm('ยืนยันการลบรายการนี้?')) return;
    setDeleting(id);
    try {
      const endpoint = type === 'income' ? `/api/yield/${id}` : `/api/expense/${id}`;
      await fetch(endpoint, { method: 'DELETE' });
      if (type === 'income') mutateYields();
      else mutateExpenses();
      mutate(`/api/accounting/summary?period=${period}&year=${year}`);
    } finally {
      setDeleting(null);
    }
  }, [mutateYields, mutateExpenses, period, year]);

  const handleIncomeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      date: fd.get('date'),
      weight: Number(fd.get('weight')),
      drc_percent: Number(fd.get('drc_percent')) || undefined,
      price_per_kg: Number(fd.get('price_per_kg')),
      type: fd.get('type'),
      buyer: fd.get('buyer'),
    };
    const isEdit = view === 'edit_income' && editItem;
    const url = isEdit ? `/api/yield/${editItem._id}` : '/api/yield';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      mutateYields();
      mutate(`/api/accounting/summary?period=${period}&year=${year}`);
      setView('dashboard');
      setEditItem(null);
    } else alert('เกิดข้อผิดพลาด');
  };

  const handleExpenseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      date: fd.get('date'),
      category: fd.get('category'),
      amount: Number(fd.get('amount')),
      description: fd.get('description'),
    };
    const isEdit = view === 'edit_expense' && editItem;
    const url = isEdit ? `/api/expense/${editItem._id}` : '/api/expense';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      mutateExpenses();
      mutate(`/api/accounting/summary?period=${period}&year=${year}`);
      setView('dashboard');
      setEditItem(null);
    } else alert('เกิดข้อผิดพลาด');
  };

  // ---- FORMS ----
  if (view === 'add_income' || view === 'edit_income') {
    const def = editItem?.raw;
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl dark:text-neutral-100 text-emerald-600">
            {view === 'edit_income' ? '✏️ แก้ไขรายรับ' : '➕ เพิ่มรายรับ'}
          </h3>
          <button onClick={() => { setView('dashboard'); setEditItem(null); }} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full"><X size={20} /></button>
        </div>
        <form onSubmit={handleIncomeSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">วันที่ขาย</label>
            <input type="date" name="date" required defaultValue={def?.date?.split('T')[0] || new Date().toISOString().split('T')[0]} className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-neutral-300">น้ำหนัก (กก.)</label>
              <input type="number" step="0.1" name="weight" required defaultValue={def?.weight || ''} placeholder="0" className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-neutral-300">ราคา/กก. (บาท)</label>
              <input type="number" step="0.1" name="price_per_kg" required defaultValue={def?.price_per_kg || ''} placeholder="0" className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-neutral-300">เปอร์เซ็นต์น้ำยาง</label>
              <input type="number" step="0.1" name="drc_percent" defaultValue={def?.drc_percent || ''} placeholder="ตัวเลือก" className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-neutral-300">ประเภทยาง</label>
              <select name="type" required defaultValue={def?.type || 'CupLump'} className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3 dark:text-white">
                <option value="CupLump">ยางก้อนถ้วย</option>
                <option value="Latex">น้ำยางสด</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">สถานที่รับซื้อ</label>
            <input type="text" name="buyer" defaultValue={def?.buyer || ''} placeholder="ชื่อร้าน/สหกรณ์" className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3 dark:text-white" />
          </div>
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold p-4 rounded-xl shadow-lg active:scale-95 transition-all">
            {view === 'edit_income' ? 'บันทึกการแก้ไข' : 'บันทึกรายรับ'}
          </button>
        </form>
      </div>
    );
  }

  if (view === 'add_expense' || view === 'edit_expense') {
    const def = editItem?.raw;
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl dark:text-neutral-100 text-rose-500">
            {view === 'edit_expense' ? '✏️ แก้ไขรายจ่าย' : '➕ เพิ่มรายจ่าย'}
          </h3>
          <button onClick={() => { setView('dashboard'); setEditItem(null); }} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full"><X size={20} /></button>
        </div>
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">วันที่</label>
            <input type="date" name="date" required defaultValue={def?.date?.split('T')[0] || new Date().toISOString().split('T')[0]} className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-neutral-300">หมวดหมู่</label>
              <select name="category" required defaultValue={def?.category || 'ปุ๋ย/สารบำรุง'} className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3 dark:text-white">
                <option value="ปุ๋ย/สารบำรุง">ปุ๋ย/สารบำรุง</option>
                <option value="ยาปรบศัตรูพืช">กำจัดศัตรูพืช</option>
                <option value="ค่าจ้างแรงงาน">ค่าจ้างแรงงาน</option>
                <option value="อุปกรณ์กรีดยาง">อุปกรณ์กรีดยาง</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-neutral-300">จำนวนเงิน (บาท)</label>
              <input type="number" step="1" name="amount" required defaultValue={def?.amount || ''} placeholder="0" className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">รายละเอียด</label>
            <input type="text" name="description" defaultValue={def?.description || ''} placeholder="ตัวเลือก" className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3 dark:text-white" />
          </div>
          <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold p-4 rounded-xl shadow-lg active:scale-95 transition-all">
            {view === 'edit_expense' ? 'บันทึกการแก้ไข' : 'บันทึกรายจ่าย'}
          </button>
        </form>
      </div>
    );
  }

  // ---- DASHBOARD VIEW ----
  const chart = summary?.chart || [];

  return (
    <>
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button onClick={() => setView('add_income')} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/30 transition-all active:scale-95 border-b-4 border-emerald-600">
          <PlusCircle className="mb-2" />
          <span className="font-bold text-sm">เพิ่มรายรับ</span>
        </button>
        <button onClick={() => setView('add_expense')} className="bg-rose-500 hover:bg-rose-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg shadow-rose-500/30 transition-all active:scale-95 border-b-4 border-rose-600">
          <FileText className="mb-2" />
          <span className="font-bold text-sm">เพิ่มรายจ่าย</span>
        </button>
      </div>

      {/* Period Filter + Responsive Selectors */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-3 shadow-sm border border-neutral-100 dark:border-neutral-800 mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
            {(['monthly', 'yearly'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${period === p ? 'bg-white dark:bg-neutral-700 text-emerald-600 shadow-sm' : 'text-neutral-500'}`}
              >
                {p === 'monthly' ? 'รายเดือน' : 'รายปี'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Month Selector (if monthly) */}
            {period === 'monthly' && (
              <select 
                value={month} 
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl px-3 py-1.5 text-sm font-bold text-neutral-700 dark:text-neutral-200 focus:ring-2 focus:ring-emerald-500/20"
              >
                {MONTHS_TH.map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
            )}

            {/* Year Picker */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
              <button onClick={() => setYear(y => y - 1)} className="p-1 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors"><ChevronLeft size={16} /></button>
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 min-w-[50px] text-center">{year + 543}</span>
              <button onClick={() => setYear(y => y + 1)} className="p-1 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards (Dynamic based on selected month/year) */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-3 text-center border border-emerald-100 dark:border-emerald-800">
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">รายรับ</p>
          {status === 'loading' || summaryLoading ? (
            <div className="h-5 w-16 bg-emerald-200/50 dark:bg-emerald-800/50 animate-pulse mx-auto mt-1 rounded" />
          ) : (
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-300 mt-0.5">{thb(currentMonthTotals.income)}</p>
          )}
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-3 text-center border border-rose-100 dark:border-rose-800">
          <p className="text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider">รายจ่าย</p>
          {status === 'loading' || summaryLoading ? (
            <div className="h-5 w-16 bg-rose-200/50 dark:bg-rose-800/50 animate-pulse mx-auto mt-1 rounded" />
          ) : (
            <p className="text-sm font-black text-rose-600 dark:text-rose-300 mt-0.5">{thb(currentMonthTotals.expense)}</p>
          )}
        </div>
        <div className={`rounded-2xl p-3 text-center border ${currentMonthTotals.profit >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${currentMonthTotals.profit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'}`}>กำไร</p>
          {status === 'loading' || summaryLoading ? (
            <div className="h-5 w-16 bg-blue-200/50 dark:bg-blue-800/50 animate-pulse mx-auto mt-1 rounded" />
          ) : (
            <p className={`text-sm font-black mt-0.5 ${currentMonthTotals.profit >= 0 ? 'text-blue-600 dark:text-blue-300' : 'text-amber-600 dark:text-amber-300'}`}>{thb(currentMonthTotals.profit)}</p>
          )}
        </div>
      </div>

      {/* Bar Chart */}
      <section className="bg-white dark:bg-neutral-900 rounded-3xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800 mb-4">
        <h3 className="font-bold text-neutral-700 dark:text-neutral-300 mb-3 text-xs uppercase tracking-widest">
          {period === 'monthly' ? `แนวโน้มรายเดือน ปี ${year + 543}` : 'แนวโน้ม 5 ปีล่าสุด'}
        </h3>
        <div className="h-48">
          {status === 'loading' || summaryLoading ? (
            <div className="w-full h-full bg-neutral-50 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ) : chart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-[10px]" />
                <YAxis axisLine={false} tickLine={false} className="text-[10px]" tickFormatter={(v) => `฿${v >= 1000 ? Math.round(v / 1000) + 'k' : v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="income" name="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-sm text-neutral-400">ยังไม่มีข้อมูล</p>
            </div>
          )}
        </div>
      </section>

      {/* Transaction Header + Export Button */}
      <div className="flex justify-between items-end mb-3 px-1">
        <div>
          <h3 className="font-black text-lg dark:text-neutral-200">ประวัติรายการ</h3>
          {status === 'loading' || summaryLoading ? (
            <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-800 animate-pulse mt-1 rounded" />
          ) : (
            <p className="text-xs text-neutral-500 font-bold">
              {period === 'monthly' ? `${MONTHS_TH[month-1]} ${year + 543}` : `ปี ${year + 543}`}
            </p>
          )}
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 px-4 py-2 rounded-xl text-sm font-black transition-all active:scale-95 border-b-2 border-neutral-200 dark:border-neutral-900"
        >
          <Download size={18} className="text-emerald-500" />
          บันทึกรายงาน
        </button>
      </div>

      {/* Recent Transactions (Filtered) */}
      <section className="mb-8">
        <div className="space-y-2.5">
          {filteredTransacs.length > 0 ? filteredTransacs.map((t) => (
            <div key={t._id} className="flex justify-between items-center p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 gap-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-2 rounded-xl flex-shrink-0 ${t.type === 'expense' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500'}`}>
                  {t.type === 'expense' ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                </div>
                <div className="min-w-0">
                  <p className="font-bold dark:text-neutral-200 text-sm truncate">{t.label}</p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase">
                    {new Date(t.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`font-black text-sm ${t.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {t.type === 'expense' ? '-' : '+'}{thb(t.amount)}
                </span>

                {/* Edit / Delete */}
                <button
                  onClick={() => {
                    setEditItem(t);
                    setView(t.type === 'income' ? 'edit_income' : 'edit_expense');
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-emerald-500 transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(t._id, t.type)}
                  disabled={deleting === t._id}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-rose-500 transition-colors disabled:opacity-50"
                >
                  {deleting === t._id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 bg-white dark:bg-neutral-900 rounded-2xl border border-dotted border-neutral-200 dark:border-neutral-800">
              <p className="text-neutral-400 text-sm font-bold">ยังไม่มีประวัติรายการในเดือนนี้</p>
              <p className="text-xs text-neutral-500 mt-1">บันทึกรายการใหม่ได้ที่ปุ่มด้านบน</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

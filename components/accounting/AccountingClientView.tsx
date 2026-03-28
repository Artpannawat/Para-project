'use client';

import { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import {
  PlusCircle, FileText, TrendingDown, TrendingUp, X,
  Pencil, Trash2, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';

type View = 'dashboard' | 'add_income' | 'add_expense' | 'edit_income' | 'edit_expense';
type Period = 'monthly' | 'yearly';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'];

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
  const [view, setView] = useState<View>('dashboard');
  const [period, setPeriod] = useState<Period>('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [editItem, setEditItem] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // SWR for summary chart data
  const { data: summary, isLoading: summaryLoading } = useSWR(
    `/api/accounting/summary?period=${period}&year=${year}`,
    fetcher,
    { fallbackData: null, revalidateOnFocus: false }
  );

  // SWR for recent transactions (uses initial data as seed for instant display)
  const { data: yields, mutate: mutateYields } = useSWR('/api/yield', fetcher, {
    fallbackData: initialYields,
  });
  const { data: expenses, mutate: mutateExpenses } = useSWR('/api/expense', fetcher, {
    fallbackData: initialExpenses,
  });

  // Combine for recent history
  const allTransacs = [
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
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Expense breakdown for pie chart
  const expenseCategories = (expenses || initialExpenses).reduce((acc: any, e: any) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  const pieData = Object.entries(expenseCategories).map(([name, value]) => ({ name, value }));

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
  const totalIncome = summary?.totalIncome || 0;
  const totalExpense = summary?.totalExpense || 0;
  const totalProfit = summary?.totalProfit || 0;

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

      {/* Period Filter + Year Picker */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3 shadow-sm border border-neutral-100 dark:border-neutral-800 mb-4 flex items-center justify-between gap-2">
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
        {period === 'monthly' && (
          <div className="flex items-center gap-1">
            <button onClick={() => setYear(y => y - 1)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><ChevronLeft size={18} /></button>
            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 min-w-[50px] text-center">{year + 543}</span>
            <button onClick={() => setYear(y => y + 1)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><ChevronRight size={18} /></button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-3 text-center border border-emerald-100 dark:border-emerald-800">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">รายรับ</p>
          <p className="text-base font-black text-emerald-600 dark:text-emerald-300 mt-0.5">{thb(totalIncome)}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-3 text-center border border-rose-100 dark:border-rose-800">
          <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">รายจ่าย</p>
          <p className="text-base font-black text-rose-600 dark:text-rose-300 mt-0.5">{thb(totalExpense)}</p>
        </div>
        <div className={`rounded-2xl p-3 text-center border ${totalProfit >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'}`}>
          <p className={`text-xs font-medium ${totalProfit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'}`}>กำไร</p>
          <p className={`text-base font-black mt-0.5 ${totalProfit >= 0 ? 'text-blue-600 dark:text-blue-300' : 'text-amber-600 dark:text-amber-300'}`}>{thb(totalProfit)}</p>
        </div>
      </div>

      {/* Bar Chart */}
      <section className="bg-white dark:bg-neutral-900 rounded-3xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800 mb-4">
        <h3 className="font-bold text-neutral-700 dark:text-neutral-300 mb-3 text-sm">
          {period === 'monthly' ? `รายรับ-รายจ่าย ปี ${year + 543}` : 'รายรับ-รายจ่าย รายปี'}
        </h3>
        <div className="h-52">
          {summaryLoading ? (
            <div className="w-full h-full bg-neutral-50 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ) : chart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" tickFormatter={(v) => `฿${v >= 1000 ? Math.round(v / 1000) + 'k' : v}`} />
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

      {/* Expense Pie */}
      {pieData.length > 0 && (
        <section className="bg-white dark:bg-neutral-900 rounded-3xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800 mb-4 flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-neutral-700 dark:text-neutral-300 mb-2 text-sm">สัดส่วนรายจ่าย</h3>
            <ul className="text-xs space-y-1.5">
              {pieData.map((d, i) => (
                <li key={i} className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {d.name}: {thb(d.value as number)}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} formatter={(v: any) => [thb(v), '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Recent Transactions */}
      <section className="mb-8">
        <h3 className="font-bold text-lg mb-3 dark:text-neutral-200 pl-1">ประวัติล่าสุด</h3>
        <div className="space-y-2.5">
          {allTransacs.length > 0 ? allTransacs.slice(0, 20).map((t) => (
            <div key={t._id} className="flex justify-between items-center p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 gap-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-2 rounded-xl flex-shrink-0 ${t.type === 'expense' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500'}`}>
                  {t.type === 'expense' ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                </div>
                <div className="min-w-0">
                  <p className="font-bold dark:text-neutral-200 text-sm truncate">{t.label}</p>
                  <p className="text-xs text-neutral-400">{new Date(t.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
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
            <p className="text-neutral-400 text-sm text-center py-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800">
              ยังไม่มีประวัติการทำรายการ
            </p>
          )}
        </div>
      </section>
    </>
  );
}

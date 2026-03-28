'use client';

import { useState } from 'react';
import { PlusCircle, FileText, TrendingDown, TrendingUp, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

type Transaction = {
  _id: string;
  date: string;
  type: 'income' | 'expense';
  label: string;
  amount: number; // Income = weight * price, Expense = amount
};

export default function AccountingClientView({ initialYields, initialExpenses }: { initialYields: any[], initialExpenses: any[] }) {
  const [view, setView] = useState<'dashboard' | 'add_income' | 'add_expense'>('dashboard');
  
  // Combine logic for recent transactions feed
  const allTransacs: Transaction[] = [
    ...initialYields.map(y => ({ _id: y._id, date: y.date, type: 'income' as const, label: `ขายยาง (${y.type})`, amount: y.amount })),
    ...initialExpenses.map(e => ({ _id: e._id, date: e.date, type: 'expense' as const, label: e.category, amount: e.amount }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Mock Form Handlers
  const handleIncomeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      date: fd.get('date'),
      weight: Number(fd.get('weight')),
      drc_percent: Number(fd.get('drc_percent')) || null,
      price_per_kg: Number(fd.get('price_per_kg')),
      type: fd.get('type'),
      buyer: fd.get('buyer')
    };

    const res = await fetch('/api/yield', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      window.location.reload();
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกพรม');
    }
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

    const res = await fetch('/api/expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      window.location.reload();
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกรายจ่าย');
    }
  };

  // Process data for charts
  const monthlyData = initialYields.reduce((acc, y) => {
    const month = new Date(y.date).toLocaleString('th-TH', { month: 'short' });
    const existing = acc.find((val: any) => val.name === month);
    if (existing) {
      existing.income += y.amount;
    } else {
      acc.push({ name: month, income: y.amount });
    }
    return acc;
  }, [] as any[]).slice(-6).reverse(); // Last 6 months

  const expenseCategories = initialExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const pieData = Object.entries(expenseCategories).map(([name, value]) => ({ name, value }));
  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];

  if (view === 'add_income') {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800 animate-in slide-in-from-bottom-5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl dark:text-neutral-100 text-emerald-600">เพิ่มรายรับใหม่</h3>
          <button onClick={() => setView('dashboard')} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200"><X size={20} /></button>
        </div>
        <form onSubmit={handleIncomeSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">วันที่ขาย</label>
            <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-neutral-300">น้ำหนัก (กก.)</label>
              <input type="number" step="0.1" name="weight" required placeholder="0" className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-neutral-300">ราคา/กก. (บาท)</label>
              <input type="number" step="0.1" name="price_per_kg" required placeholder="0" className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-neutral-300">เปอร์เซ็นต์น้ำยาง</label>
              <input type="number" step="0.1" name="drc_percent" placeholder="ตัวเลือก" className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-neutral-300">ประเภทยาง</label>
              <select name="type" required className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3 text-neutral-800 dark:text-neutral-100" defaultValue="CupLump">
                <option value="CupLump">ยางก้อนถ้วย</option>
                <option value="Latex">น้ำยางสด</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">สถานที่รับซื้อ</label>
            <input type="text" name="buyer" placeholder="ชื่อร้าน/สหกรณ์" className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3" />
          </div>
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold p-4 rounded-xl shadow-lg mt-4 active:scale-95 transition-all">
            บันทึกรายรับ
          </button>
        </form>
      </div>
    );
  }

  if (view === 'add_expense') {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800 animate-in slide-in-from-bottom-5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl dark:text-neutral-100 text-rose-500">เพิ่มรายจ่าย</h3>
          <button onClick={() => setView('dashboard')} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200"><X size={20} /></button>
        </div>
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">วันที่</label>
            <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-neutral-300">หมวดหมู่</label>
              <select name="category" required className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3 text-neutral-800 dark:text-neutral-100">
                <option value="ปุ๋ย/สารบำรุง">ปุ๋ย/สารบำรุง</option>
                <option value="ยาปรบศัตรูพืช">กำจัดศัตรูพืช</option>
                <option value="ค่าจ้างแรงงาน">ค่าจ้างแรงงาน</option>
                <option value="อุปกรณ์กรีดยาง">อุปกรณ์กรีดยาง</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-neutral-300">จำนวนเงิน (บาท)</label>
              <input type="number" step="1" name="amount" required placeholder="0" className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">รายละเอียดเพิ่มเติม</label>
            <input type="text" name="description" placeholder="ตัวเลือก" className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-3" />
          </div>
          <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold p-4 rounded-xl shadow-lg mt-4 active:scale-95 transition-all">
            บันทึกรายจ่าย
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-8 z-10">
        <button onClick={() => setView('add_income')} className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 hover:dark:bg-emerald-700 text-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/30 transition-all active:scale-95 border-b-4 border-emerald-600 dark:border-emerald-800">
          <PlusCircle className="mb-2" />
          <span className="font-bold">เพิ่มรายรับ (ขายยาง)</span>
        </button>
        <button onClick={() => setView('add_expense')} className="bg-rose-500 dark:bg-rose-600 hover:bg-rose-600 hover:dark:bg-rose-700 text-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg shadow-rose-500/30 transition-all active:scale-95 border-b-4 border-rose-600 dark:border-rose-800">
          <FileText className="mb-2" />
          <span className="font-bold">เพิ่มรายจ่าย (สวน)</span>
        </button>
      </div>

      <section className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800 mb-6 w-full">
        <h3 className="font-bold text-neutral-800 dark:text-neutral-300 mb-4 px-1">รายรับย้อนหลัง</h3>
        <div className="h-52 w-full mt-2">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" tickFormatter={(v) => `฿${v / 1000}k`} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="income" fill="url(#colorUv)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
               <p className="text-sm text-neutral-400">ยังไม่มีข้อมูลรายรับ</p>
            </div>
          )}
        </div>
      </section>
      
      {pieData.length > 0 && (
         <section className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800 mb-6 w-full flex flex-row items-center justify-between">
           <div>
             <h3 className="font-bold text-neutral-800 dark:text-neutral-300 mb-1">สัดส่วนรายจ่าย</h3>
             <ul className="text-xs space-y-2 mt-4">
                {pieData.map((d, i) => (
                   <li key={i} className="flex items-center gap-2 text-neutral-500">
                     <span className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></span>
                     {d.name}
                   </li>
                ))}
             </ul>
           </div>
           <div className="w-32 h-32 ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                </PieChart>
              </ResponsiveContainer>
           </div>
         </section>
      )}

      <section className="mb-4">
        <h3 className="font-bold text-lg mb-3 dark:text-neutral-200 pl-1">ประวัติล่าสุด</h3>
        <div className="space-y-3 pb-8">
          {allTransacs.length > 0 ? allTransacs.map((t) => (
             <div key={t._id} className="flex justify-between items-center p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${t.type === 'expense' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500'}`}>
                    {t.type === 'expense' ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                  </div>
                  <div>
                    <p className="font-bold dark:text-neutral-200 text-sm truncate max-w-[150px]">{t.label}</p>
                    <p className="text-xs text-neutral-400">{new Date(t.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className={`font-black tracking-tight ${t.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {t.type === 'expense' ? '-' : '+'}฿{t.amount.toLocaleString()}
                </div>
             </div>
          )) : (
             <p className="text-neutral-400 text-sm text-center py-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
               ยังไม่มีประวัติการทำรายการ
             </p>
          )}
        </div>
      </section>
    </>
  );
}

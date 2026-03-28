import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import { Yield } from '@/lib/db/models/yield.model';
import { Expense } from '@/lib/db/models/expense.model';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'monthly'; // 'monthly' | 'yearly'
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    await dbConnect();

    const userId = new mongoose.Types.ObjectId(user.id);

    // Date range for the query
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const groupBy = period === 'yearly'
      ? { year: { $year: '$date' } }
      : { year: { $year: '$date' }, month: { $month: '$date' } };

    const [incomeData, expenseData] = await Promise.all([
      Yield.aggregate([
        {
          $match: {
            userId: userId,
            date: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: groupBy,
            total: { $sum: { $multiply: ['$weight', '$price_per_kg'] } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.month': 1, '_id.year': 1 } },
      ]),
      Expense.aggregate([
        {
          $match: {
            userId: userId,
            date: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: groupBy,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.month': 1, '_id.year': 1 } },
      ]),
    ]);

    // Build unified chart data
    const MONTHS_TH = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    const slots = period === 'yearly'
      ? Array.from({ length: 5 }, (_, i) => ({ key: String(year - 4 + i), label: String(year - 4 + i) }))
      : Array.from({ length: 12 }, (_, i) => ({ key: String(i + 1), label: MONTHS_TH[i + 1] }));

    const chart = slots.map(({ key, label }) => {
      const inc = incomeData.find((d) =>
        period === 'yearly' ? String(d._id.year) === key : String(d._id.month) === key
      );
      const exp = expenseData.find((d) =>
        period === 'yearly' ? String(d._id.year) === key : String(d._id.month) === key
      );
      return {
        name: label,
        income: Math.round(inc?.total || 0),
        expense: Math.round(exp?.total || 0),
        profit: Math.round((inc?.total || 0) - (exp?.total || 0)),
      };
    });

    const totalIncome = incomeData.reduce((s, d) => s + d.total, 0);
    const totalExpense = expenseData.reduce((s, d) => s + d.total, 0);

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

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import { Expense } from '@/lib/db/models/expense.model';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit');
    
    let query = Expense.find({ userId: user.id }).sort({ date: -1 });
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const expenses = await query;

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('[EXPENSE_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    await dbConnect();
    
    const body = await req.json();
    const { date, category, amount, description } = body;

    if (!date || !category || !amount) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const newExpense = await Expense.create({
      userId: user.id,
      date: new Date(date),
      category,
      amount,
      description,
    });

    return NextResponse.json(newExpense);
  } catch (error) {
    console.error('[EXPENSE_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

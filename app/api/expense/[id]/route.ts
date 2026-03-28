import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import { Expense } from '@/lib/db/models/expense.model';
import mongoose from 'mongoose';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const { id } = await params;
    const body = await req.json();

    await dbConnect();
    const record = await Expense.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), userId: user.id },
      { $set: body },
      { new: true }
    );

    if (!record) return new NextResponse('Not Found', { status: 404 });
    return NextResponse.json(record);
  } catch (error) {
    console.error('[EXPENSE_PUT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const { id } = await params;
    await dbConnect();
    const result = await Expense.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: user.id,
    });

    if (!result) return new NextResponse('Not Found', { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[EXPENSE_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

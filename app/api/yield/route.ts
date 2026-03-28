import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import { Yield } from '@/lib/db/models/yield.model';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit');
    
    let query = Yield.find({ userId: user.id }).sort({ date: -1 });
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const yields = await query;

    return NextResponse.json(yields);
  } catch (error) {
    console.error('[YIELD_GET]', error);
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
    const { date, weight, drc_percent, price_per_kg, type, buyer } = body;

    if (!date || !weight || !price_per_kg || !type) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const newYield = await Yield.create({
      userId: user.id,
      date: new Date(date),
      weight,
      drc_percent,
      price_per_kg,
      type,
      buyer,
    });

    return NextResponse.json(newYield);
  } catch (error) {
    console.error('[YIELD_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

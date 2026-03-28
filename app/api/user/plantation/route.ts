import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/user.model';

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    const { lat, lng } = await req.json();

    if (lat === undefined || lng === undefined) {
      return new NextResponse('Coordinates Required', { status: 400 });
    }

    await dbConnect();
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { plantation_lat: lat, plantation_lng: lng } },
      { new: true }
    );

    if (!updatedUser) return new NextResponse('User Not Found', { status: 404 });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('[PLANTATION_PUT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).select('plantation_lat plantation_lng');

    if (!user) return new NextResponse('User Not Found', { status: 404 });

    return NextResponse.json({
      plantation_lat: user.plantation_lat || 17.89,
      plantation_lng: user.plantation_lng || 101.88,
    });
  } catch (error) {
    console.error('[PLANTATION_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

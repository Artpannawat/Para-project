import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import PushSubscriptionModel from '@/lib/db/models/push-subscription.model';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { subscription, lat, lon } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return new NextResponse('Invalid subscription object', { status: 400 });
    }

    await dbConnect();

    // Upsert: update if endpoint exists, insert if not
    await PushSubscriptionModel.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId: user.id,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        lat: lat || 17.89,
        lon: lon || 101.88,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUSH_SUBSCRIBE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { endpoint } = await req.json();
    await dbConnect();
    await PushSubscriptionModel.deleteOne({ userId: user.id, endpoint });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUSH_UNSUBSCRIBE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

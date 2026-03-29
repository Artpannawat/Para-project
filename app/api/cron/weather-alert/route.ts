import { NextResponse } from 'next/server';
import webpush from 'web-push';
import dbConnect from '@/lib/db/mongodb';
import PushSubscriptionModel from '@/lib/db/models/push-subscription.model';

const OWM_API_KEY = process.env.OPENWEATHER_API_KEY;

webpush.setVapidDetails(
  process.env.VAPID_EMAIL as string,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

// This endpoint is called by Vercel Cron at 16:00 ICT every day
// Also used internally for testing
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(req.url);
  const isTestMode = searchParams.get('test') === 'true';

  // Allow localhost/test without auth, require secret in production
  const isLocal = req.headers.get('host')?.includes('localhost');
  if (!isLocal && !isTestMode && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!OWM_API_KEY && !isTestMode) {
    return NextResponse.json({ error: 'Missing OWM API Key' }, { status: 500 });
  }

  await dbConnect();
  const subscriptions = await PushSubscriptionModel.find({});

  if (subscriptions.length === 0) {
    return NextResponse.json({ message: 'No subscriptions found.', sent: 0 });
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    const lat = sub.lat || 17.89;
    const lon = sub.lon || 101.88;

    try {
      let title = '';
      let body = '';

      if (isTestMode) {
        // Test mode: skip weather check, send a friendly test message
        title = '🔔 ParaSmart: ทดสอบแจ้งเตือน';
        body = 'ระบบแจ้งเตือนทำงานปกติ! คุณจะได้รับแจ้งเตือนสภาพอากาศเวลา 16:00 ทุกวัน';
      } else {
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=4&appid=${OWM_API_KEY}`
        );
        if (!weatherRes.ok) continue;

        const weatherData = await weatherRes.json();
        const list = weatherData.list;
        const maxPop = Math.max(...list.map((item: any) => item.pop || 0));
        const humidity = list[0].main.humidity;
        const temp = Math.round(list[0].main.temp);

        // Only send notification if there's a meaningful alert
        if (maxPop < 0.3 && humidity < 80) continue;

        if (maxPop > 0.6 || humidity > 90) {
          title = '🛑 ParaSmart: หยุดกรีดยาง!';
          body = `โอกาสฝนตก ${Math.round(maxPop * 100)}% ความชื้น ${humidity}% อุณหภูมิ ${temp}°C\nแนะนำให้หยุดกรีดยางเพื่อรักษาเนื้อยาง`;
        } else {
          title = '⚠️ ParaSmart: แจ้งเตือนสภาพอากาศ';
          body = `โอกาสฝนตก ${Math.round(maxPop * 100)}% ความชื้น ${humidity}% อุณหภูมิ ${temp}°C\nระวังฝนระหว่างกรีดยางหรือหลังกรีด`;
        }
      }

      const pushPayload = JSON.stringify({
        title,
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        url: '/',
      });

      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        },
        pushPayload
      );

      sent++;
    } catch (err: any) {
      // If subscription is expired/invalid, remove it
      if (err?.statusCode === 410) {
        await PushSubscriptionModel.deleteOne({ _id: sub._id });
      }
      failed++;
    }
  }

  return NextResponse.json({ success: true, sent, failed });
}

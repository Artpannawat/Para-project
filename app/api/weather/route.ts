import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const OWM_API_KEY = process.env.OPENWEATHER_API_KEY; // Requires setting this in .env.local in the real run

// Default Coordinates for บ้านคกไผ่ ต.ปากชม อ.ปากชม จ.เลย
const DEFAULT_LAT = 17.89;
const DEFAULT_LON = 101.88;

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat') || DEFAULT_LAT;
    const lon = searchParams.get('lon') || DEFAULT_LON;

    if (!OWM_API_KEY) {
      // Mock Data if no API Key is provided for local dev
      return NextResponse.json({
        temp: 28,
        humidity: 65,
        pop: 0,
        advice: '✅ กรีดได้ (อากาศดีไม่มีฝน)',
        raw: null,
      });
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=4&appid=${OWM_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();

    // Look at next 12 hours (4 * 3h blocks)
    const list = data.list;
    const maxPop = Math.max(...list.map((item: any) => item.pop || 0)); // Probability of precipitation (0 to 1)
    const currentHumidity = list[0].main.humidity;

    let advice = '✅ กรีดได้';
    if (maxPop > 0.6 || currentHumidity > 90) {
      advice = '🛑 งดกรีด (ฝนตกเปียกชื้น หน้ายางเสีย)';
    } else if (maxPop > 0.3 || currentHumidity > 80) {
      advice = '⚠️ ระวังฝน (มีโอกาสฝนตกระหว่าง/หลังกรีด)';
    }

    return NextResponse.json({
      temp: list[0].main.temp,
      humidity: currentHumidity,
      pop: maxPop * 100, // convert to %
      advice,
      raw: data,
    });
  } catch (error) {
    console.error('[WEATHER_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

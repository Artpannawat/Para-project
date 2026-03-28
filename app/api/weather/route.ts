import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const OWM_API_KEY = process.env.OPENWEATHER_API_KEY;

const DEFAULT_LAT = 17.89;
const DEFAULT_LON = 101.88;

// Basic in-memory cache: { key: { data: any, expiry: number } }
const cache: Record<string, { data: any, expiry: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in ms

type IntelligenceTag = 'golden' | 'hot_warn' | 'wind_warn' | 'rain_warn' | 'normal';

function getIntelligenceTag(
  hour: number,
  temp: number,
  humidity: number,
  windKmh: number,
  pop: number
): IntelligenceTag {
  if (hour >= 1 && hour <= 4 && humidity > 80 && temp < 25) return 'golden';
  if ((hour >= 20 && hour <= 22) || temp > 28) return 'hot_warn';
  if (windKmh > 15) return 'wind_warn';
  if (pop > 0.4) return 'rain_warn';
  return 'normal';
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return new NextResponse('Unauthorized', { status: 403 });

    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat') || DEFAULT_LAT.toString();
    const lon = searchParams.get('lon') || DEFAULT_LON.toString();

    // Check Cache
    const cacheKey = `${lat}_${lon}`;
    const cachedItem = cache[cacheKey];
    if (cachedItem && Date.now() < cachedItem.expiry) {
      return NextResponse.json(cachedItem.data);
    }

    const getThaiDateLabel = (dt: Date) => {
      const today = new Date();
      const isToday = dt.getDate() === today.getDate() && dt.getMonth() === today.getMonth();
      const isTomorrow = dt.getDate() === today.getDate() + 1 && dt.getMonth() === today.getMonth();
      
      const day = dt.getDate();
      const month = dt.toLocaleDateString('th-TH', { month: 'short' });
      
      if (isToday) return 'วันนี้';
      if (isTomorrow) return 'พรุ่งนี้';
      return `${day} ${month}`;
    };

    if (!OWM_API_KEY) {
      // Mock data for dev without API key
      const mockHourly = Array.from({ length: 8 }, (_, i) => {
        const dt = new Date();
        dt.setHours(dt.getHours() + i * 3);
        const h = dt.getHours();
        return {
          time: `${String(h).padStart(2, '0')}:00`,
          dateLabel: getThaiDateLabel(dt),
          temp: 24 + Math.random() * 5,
          humidity: 75 + Math.floor(Math.random() * 20),
          windKmh: 8 + Math.random() * 10,
          pop: Math.random() * 0.3,
          icon: '01d',
          tag: h >= 1 && h <= 4 ? 'golden' : 'normal' as IntelligenceTag,
        };
      });
      return NextResponse.json({
        temp: 27, humidity: 78, pop: 10,
        advice: '✅ กรีดได้ (อากาศดีไม่มีฝน)',
        hourly: mockHourly,
      });
    }

    // Fetch 24h forecast (cnt=8 → 8×3h = 24h)
    const [forecastRes, airRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=8&appid=${OWM_API_KEY}`),
      fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}`)
    ]);

    if (!forecastRes.ok) throw new Error('Failed to fetch weather data');
    const data = await forecastRes.json();
    const airData = airRes.ok ? await airRes.json() : null;

    const list = data.list;
    const pm2_5 = airData?.list?.[0]?.components?.pm2_5 || 0;

    const hourly = list.map((item: any) => {
      const dt = new Date(item.dt * 1000);
      const hour = dt.getHours();
      const windKmh = (item.wind?.speed || 0) * 3.6;
      const pop = item.pop || 0;
      const temp = item.main.temp;
      const humidity = item.main.humidity;

      return {
        time: `${String(hour).padStart(2, '0')}:00`,
        dateLabel: getThaiDateLabel(dt),
        temp: Math.round(temp * 10) / 10,
        humidity,
        windKmh: Math.round(windKmh),
        pop: Math.round(pop * 100),
        icon: item.weather?.[0]?.icon || '01d',
        tag: getIntelligenceTag(hour, temp, humidity, windKmh, pop),
      };
    });

    // Overall 12h advice (first 4 slots)
    const first4 = list.slice(0, 4);
    const maxPop = Math.max(...first4.map((i: any) => i.pop || 0));
    const currentHumidity = list[0].main.humidity;

    let advice = '✅ กรีดได้';
    if (maxPop > 0.6 || currentHumidity > 90)
      advice = '🛑 งดกรีด (ฝนตกเปียกชื้น หน้ายางเสีย)';
    else if (maxPop > 0.3 || currentHumidity > 80)
      advice = '⚠️ ระวังฝน (มีโอกาสฝนตกระหว่าง/หลังกรีด)';

    const month = new Date().getMonth();
    const isBurningSeason = month === 2 || month === 3; // March (2) and April (3)
    const isLowHumidity = currentHumidity < 40;

    const result = {
      temp: list[0].main.temp,
      humidity: currentHumidity,
      pop: maxPop * 100,
      pm2_5,
      advice,
      hourly,
      isBurningSeason,
      isLowHumidity,
    };

    // Save to Cache
    cache[cacheKey] = {
      data: result,
      expiry: Date.now() + CACHE_TTL
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[WEATHER_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

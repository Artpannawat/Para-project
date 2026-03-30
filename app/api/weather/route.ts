import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const OWM_API_KEY = process.env.OPENWEATHER_API_KEY;

const DEFAULT_LAT = 17.89;
const DEFAULT_LON = 101.88;

// In-memory cache with 10-minute TTL
const cache: Record<string, { data: any; expiry: number }> = {};
const CACHE_TTL = 10 * 60 * 1000;

type IntelligenceTag = 'golden' | 'hot_warn' | 'wind_warn' | 'rain_warn' | 'normal';

function getIntelligenceTag(
  hour: number,
  temp: number,
  humidity: number,
  windKmh: number,
  pop: number
): IntelligenceTag {
  // 🌧️ Priority 1: RAIN — ปัจจัยวิกฤตที่สุด
  if (pop > 0.4) return 'rain_warn';

  // 🌬️ Priority 2: WIND — ลมแรงหน้ายางแห้ง
  if (windKmh > 15) return 'wind_warn';

  // 🔴 Priority 3: HOT — อุณหภูมิวิกฤตพืช (>= 28°C)
  // Hevea brasiliensis จะคายน้ำสูงและท่อน้ำยางอุดตันเร็วเมื่ออุณหภูมิเกิน 28°C
  if (temp >= 28) return 'hot_warn';

  // ✨ Priority 4: GOLDEN HOUR — ช่วงเวลาทอง (ต้องไม่ร้อนด้วย)
  if (hour >= 1 && hour <= 4 && humidity > 80 && temp < 25) return 'golden';

  return 'normal';
}

/**
 * Convert a UNIX timestamp to a Thailand (UTC+7) Date-like object.
 * Returns { hour, day, month, year } all in ICT.
 */
function toThaiTime(unixSec: number) {
  const utcMs = unixSec * 1000;
  const ictMs = utcMs + 7 * 60 * 60 * 1000; // Add 7 hours
  const d = new Date(ictMs);
  return {
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    day: d.getUTCDate(),
    month: d.getUTCMonth(), // 0-indexed
    year: d.getUTCFullYear(),
  };
}

/**
 * Get tapping-shift label for rubber tappers who work overnight.
 * No confusing วันนี้/พรุ่งนี้ midnight cutoff.
 */
function getShiftLabel(hour: number): string {
  if (hour >= 18) return 'คืนนี้';
  if (hour < 6) return 'เช้ามืด';
  return 'กลางวัน';
}

/**
 * Get current Thailand time info for "now" reference.
 */
function getNowICT() {
  const nowMs = Date.now() + 7 * 60 * 60 * 1000;
  const d = new Date(nowMs);
  return {
    day: d.getUTCDate(),
    month: d.getUTCMonth(),
  };
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

    if (!OWM_API_KEY) {
      // Mock data for dev without API key
      const nowICT = getNowICT();
      const mockHourly = Array.from({ length: 8 }, (_, i) => {
        const futureUnix = Math.floor(Date.now() / 1000) + i * 3 * 3600;
        const ict = toThaiTime(futureUnix);
        return {
          time: `${String(ict.hour).padStart(2, '0')}:00`,
          shiftLabel: getShiftLabel(ict.hour),
          temp: +(24 + Math.random() * 5).toFixed(1),
          humidity: 75 + Math.floor(Math.random() * 20),
          windKmh: +(8 + Math.random() * 10).toFixed(0),
          pop: Math.round(Math.random() * 30),
          icon: ict.hour >= 18 || ict.hour < 6 ? '01n' : '01d',
          tag: (ict.hour >= 1 && ict.hour <= 4 ? 'golden' : 'normal') as IntelligenceTag,
        };
      });
      return NextResponse.json({
        temp: 27, humidity: 78, pop: 10,
        advice: '✅ กรีดได้ (อากาศดีไม่มีฝน)',
        hourly: mockHourly,
        pm2_5: 0,
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
      const ict = toThaiTime(item.dt);
      const windKmh = (item.wind?.speed || 0) * 3.6;
      const pop = item.pop || 0;
      const temp = item.main.temp;
      const humidity = item.main.humidity;

      return {
        time: `${String(ict.hour).padStart(2, '0')}:00`,
        shiftLabel: getShiftLabel(ict.hour),
        temp: Math.round(temp * 10) / 10,
        humidity,
        windKmh: Math.round(windKmh),
        pop: Math.round(pop * 100),
        icon: item.weather?.[0]?.icon || '01d',
        tag: getIntelligenceTag(ict.hour, temp, humidity, windKmh, pop),
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

    const month = toThaiTime(Math.floor(Date.now() / 1000)).month;
    const isBurningSeason = month === 2 || month === 3; // March, April
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
      expiry: Date.now() + CACHE_TTL,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[WEATHER_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

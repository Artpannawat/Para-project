import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CloudRain, MapPin } from 'lucide-react';
import { WeatherAdviceCard } from '@/components/dashboard/WeatherAdviceCard';
import { HourlyForecastRow } from '@/components/weather/HourlyForecastRow';

export const dynamic = 'force-dynamic';

export default async function WeatherPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-transparent pt-10 pb-12 flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <CloudRain className="text-blue-500" />
          พยากรณ์อากาศ
        </h2>
        <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1">
          <MapPin size={14} /> อิงจากตำแหน่งสวนของคุณ
        </p>
      </div>

      {/* Main advice card (handles its own SWR fetch) */}
      <section className="mb-6 z-10 animate-in fade-in duration-700">
        <WeatherAdviceCard showHourly />
      </section>
    </div>
  );
}

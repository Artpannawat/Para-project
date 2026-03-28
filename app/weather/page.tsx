import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CloudRain, MapPin, Droplets, ThermometerSun, Wind } from 'lucide-react';
import { WeatherAdviceCard } from '@/components/dashboard/WeatherAdviceCard';

export default async function WeatherPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 flex flex-col pt-10 pb-24">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <CloudRain className="text-blue-500" />
            พยากรณ์อากาศ
          </h2>
          <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1">
            <MapPin size={14} /> อิงจากตำแหน่งสวนของคุณ
          </p>
        </div>
      </div>

      <section className="mb-8 z-10 animate-in fade-in duration-700">
        <WeatherAdviceCard />
      </section>

      {/* Detail Section */}
      <h3 className="font-bold text-lg mb-4 text-neutral-800 dark:text-neutral-200 pl-1">รายละเอียด</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between group hover:shadow-md transition">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Droplets size={22} />
          </div>
          <div>
            <p className="text-sm text-neutral-500 font-medium mb-1">ความชื้นสัมพัทธ์</p>
            <p className="text-2xl font-black text-neutral-800 dark:text-neutral-100">80%</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between group hover:shadow-md transition">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ThermometerSun size={22} />
          </div>
          <div>
            <p className="text-sm text-neutral-500 font-medium mb-1">อุณหภูมิ</p>
            <p className="text-2xl font-black text-neutral-800 dark:text-neutral-100">28°C</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between group hover:shadow-md transition col-span-2">
          <div className="flex justify-between items-center mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wind size={22} />
            </div>
            <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-3 py-1 rounded-full">พยากรณ์ล่วงหน้า 12 ชม.</span>
          </div>
          <div className="mt-2">
            <p className="text-sm text-neutral-500 font-medium mb-1">โอกาสฝนตกเฉลี่ย</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-neutral-800 dark:text-neutral-100">45%</p>
              <p className="text-sm text-neutral-400 mb-1">มีเมฆบางส่วน</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

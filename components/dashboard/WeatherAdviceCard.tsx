'use client';

import { useEffect, useState } from 'react';
import { CloudRain, CloudSun, AlertTriangle, Loader2, MapPin } from 'lucide-react';

export function WeatherAdviceCard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationName, setLocationName] = useState('บ้านคกไผ่ จ.เลย (ค่าเริ่มต้น)');

  useEffect(() => {
    const fetchWeather = async (url: string, name: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Network error');
        const json = await res.json();
        setData(json);
        setLocationName(name);
      } catch (err: any) {
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลอากาศ');
      } finally {
        setLoading(false);
      }
    };

    const mode = localStorage.getItem('para_location_mode');
    
    if (mode === 'gps' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          fetchWeather(`/api/weather?lat=${lat}&lon=${lon}`, 'พิกัด GPS ปัจจุบัน');
        },
        (err) => {
          // Fallback to default if GPS is denied or fails
          fetchWeather('/api/weather', 'บ้านคกไผ่ จ.เลย (ค่าเริ่มต้น)');
        },
        { timeout: 10000 }
      );
    } else {
      fetchWeather('/api/weather', 'บ้านคกไผ่ จ.เลย (ค่าเริ่มต้น)');
    }
  }, []);

  if (loading) {
    return (
      <div className="w-full h-32 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl animate-pulse flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
        <Loader2 className="animate-spin text-emerald-500 w-6 h-6" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full bg-red-50 dark:bg-red-950/30 text-rose-600 dark:text-rose-400 p-4 rounded-2xl border border-red-200 dark:border-red-900/50 text-sm flex gap-2">
        <AlertTriangle size={20} />
        <span>{error || 'ไม่สามารถโหลดข้อมูลสภาพอากาศได้'}</span>
      </div>
    );
  }

  const isGood = data.advice.includes('กรีดได้');
  const isWarning = data.advice.includes('ระวังฝน');
  const isStop = data.advice.includes('งดกรีด');

  return (
    <div className={`w-full overflow-hidden rounded-3xl shadow-lg border relative transition-all duration-300 ${isGood ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-600/20 text-white' : isWarning ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-orange-500/20 text-white' : 'bg-gradient-to-br from-rose-500 to-red-600 border-red-600/20 text-white'}`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-3xl font-black tracking-tight drop-shadow-sm mb-1">
              คำแนะนำวันนี้
            </h3>
            <div className="flex items-center gap-1.5 opacity-90 text-sm font-medium">
              <MapPin size={14} className="animate-bounce" />
              <span>{locationName}</span>
            </div>
          </div>
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
            {isGood ? <CloudSun size={32} /> : <CloudRain size={32} />}
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
          <p className="text-xl font-bold mb-3 drop-shadow-sm leading-tight">
            {data.advice}
          </p>
          <div className="flex gap-6 mt-2 text-sm font-semibold opacity-90">
            <div className="flex flex-col">
              <span className="opacity-80 text-xs">โอกาสฝนตก</span>
              <span className="text-lg">{Math.round(data.pop)}%</span>
            </div>
            <div className="flex flex-col">
              <span className="opacity-80 text-xs">ความชื้น</span>
              <span className="text-lg">{Math.round(data.humidity)}%</span>
            </div>
            <div className="flex flex-col">
              <span className="opacity-80 text-xs">อุณหภูมิ</span>
              <span className="text-lg">{Math.round(data.temp)}°C</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none" />
    </div>
  );
}

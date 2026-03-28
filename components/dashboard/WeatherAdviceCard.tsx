'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { CloudRain, CloudSun, AlertTriangle, Loader2, MapPin, Info, Droplets, Thermometer, UserRound, Zap, Wind, Navigation } from 'lucide-react';
import { HourlyForecastRow } from '@/components/weather/HourlyForecastRow';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Weather fetch failed');
  return res.json();
});

interface WeatherData {
  temp: number;
  humidity: number;
  pop: number;
  pm2_5: number;
  windKmh?: number;
  advice: string;
  hourly?: any[];
  isBurningSeason?: boolean;
  isLowHumidity?: boolean;
}

export function WeatherAdviceCard({ 
  showHourly = false,
  hideGuide = false
}: { 
  showHourly?: boolean,
  hideGuide?: boolean
}) {
  const [locationName, setLocationName] = useState('บ้านคกไผ่ จ.เลย (ค่าเริ่มต้น)');

  const { data: plantation } = useSWR('/api/user/plantation', fetcher);

  const weatherUrl = plantation?.plantation_lat && plantation?.plantation_lng
    ? `/api/weather?lat=${plantation.plantation_lat}&lon=${plantation.plantation_lng}`
    : '/api/weather';

  const { data, error, isLoading } = useSWR<WeatherData>(weatherUrl, fetcher, {
    revalidateOnFocus: false,
    onSuccess: (data) => {
      if (plantation?.plantation_lat) setLocationName('📍 สวนยางของคุณ (ปักหมุดแล้ว)');
      else setLocationName('บ้านคกไผ่ จ.เลย (ค่าเริ่มต้น)');
    }
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="h-48 bg-emerald-50 dark:bg-emerald-950/20 rounded-[2.5rem] animate-pulse border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center">
          <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-6 rounded-[2.5rem] border border-red-200 dark:border-red-900/50 text-base flex gap-3 items-center">
        <AlertTriangle size={24} />
        <span className="font-black">ไม่สามารถโหลดข้อมูลสภาพอากาศได้</span>
      </div>
    );
  }

  const pmVal = data.pm2_5;
  const isHighDust = pmVal > 37;

  const getPM25Theme = (val: number) => {
    if (val <= 15) return { color: 'text-blue-500', label: 'อากาศดีมาก', symptom: 'ไม่มีอาการ ปกติสุข', bg: 'bg-blue-50/50 dark:bg-blue-900/20' };
    if (val <= 25) return { color: 'text-emerald-500', label: 'อากาศดี', symptom: 'คัดจมูกเล็กน้อยในคนแพ้ง่าย', bg: 'bg-emerald-50/50 dark:bg-emerald-900/20' };
    if (val <= 37) return { color: 'text-yellow-500', label: 'ปานกลาง', symptom: 'เริ่มแสบจมูก ไอ ระคายตา', bg: 'bg-yellow-50/50 dark:bg-yellow-900/20' };
    if (val <= 75) return { color: 'text-orange-500', label: 'เริ่มอันตราย', symptom: 'หายใจติดขัด เจ็บคอ (ควรใส่แมสก์)', bg: 'bg-orange-50/50 dark:bg-orange-900/20' };
    return { color: 'text-red-500', label: 'อันตรายมาก', symptom: 'ไอหนัก แสบคอ (ห้ามออกนอกบ้าน)', bg: 'bg-red-50/50 dark:bg-red-900/20' };
  };

  const theme = getPM25Theme(pmVal);
  const showBurningWarning = data.isBurningSeason && data.isLowHumidity;

  const isGood = data.advice.includes('กรีดได้') || data.advice.includes('แม่นยำ');
  const isWarning = data.advice.includes('ระวัง') || data.advice.includes('เตือน');

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-1000">
      {/* High-Fidelity Agritech Advice Card */}
      <div className={`relative overflow-hidden group rounded-[2.5rem] shadow-xl border-2 transition-all duration-700 ${
        isHighDust ? 'border-rose-500/30 shadow-rose-500/10' : 'border-white/10 dark:border-white/5 shadow-emerald-500/5'
      } ${
        isGood ? 'bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950'
        : isWarning ? 'bg-gradient-to-br from-amber-700 via-orange-800 to-rose-950'
        : 'bg-gradient-to-br from-rose-800 via-red-950 to-neutral-950'
      } text-white`}>
        
        {/* Glassmorphic Overlay Content */}
        <div className="p-7 space-y-6 relative z-10">
          
          {/* Header & Location Section */}
          <div className="flex justify-between items-center">
            <div className="space-y-1.5">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] opacity-70">คำแนะนำวันนี้</h3>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-emerald-400" strokeWidth={2.5} />
                <span className="text-base font-black tracking-tight">{locationName}</span>
              </div>
            </div>
            <div className="bg-white/10 p-3.5 rounded-[1.5rem] backdrop-blur-3xl border border-white/20 shadow-inner">
              {isGood ? <Zap size={20} className="text-yellow-400 fill-yellow-400" /> : <AlertTriangle size={20} className="text-rose-400" />}
            </div>
          </div>

          {/* Unified Advice Title (Large & Legible) */}
          <div className="py-2">
            <h2 className="text-3xl font-black leading-[1.3] drop-shadow-lg tracking-tight">
              {data.advice}
            </h2>
          </div>

          {/* Detailed Data Summary (Legible & Balanced) */}
          <div className="grid grid-cols-2 gap-3">
             {/* Rain Chance */}
             <div className="bg-white/5 p-4 rounded-3xl border border-white/10 flex items-center gap-4">
                <CloudRain size={20} className="text-blue-300 flex-shrink-0" strokeWidth={2.5} />
                <div>
                  <p className="text-xs font-black uppercase opacity-60 tracking-wider">โอกาสฝนตก</p>
                  <p className="text-xl font-black">{Math.round(data.pop)}%</p>
                </div>
             </div>
             {/* Humidity */}
             <div className="bg-white/5 p-4 rounded-3xl border border-white/10 flex items-center gap-4">
                <Droplets size={20} className="text-cyan-300 flex-shrink-0" strokeWidth={2.5} />
                <div>
                  <p className="text-xs font-black uppercase opacity-60 tracking-wider">ความชื้น</p>
                  <p className="text-xl font-black">{Math.round(data.humidity)}%</p>
                </div>
             </div>
             {/* Temperature */}
             <div className="bg-white/5 p-4 rounded-3xl border border-white/10 flex items-center gap-4">
                <Thermometer size={20} className="text-amber-300 flex-shrink-0" strokeWidth={2.5} />
                <div>
                  <p className="text-xs font-black uppercase opacity-60 tracking-wider">อุณหภูมิ</p>
                  <p className="text-xl font-black">{Math.round(data.temp)}°C</p>
                </div>
             </div>
             {/* Air Quality */}
             <div className={`p-4 rounded-3xl border border-white/10 flex items-center gap-4 bg-white/5`}>
                <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black ${theme.color} shadow-inner`}>
                  {Math.round(pmVal)}
                </div>
                <div>
                  <p className="text-xs font-black uppercase opacity-60 tracking-wider leading-none mb-1">PM 2.5</p>
                  <p className={`text-sm font-black uppercase ${theme.color}`}>{theme.label}</p>
                </div>
             </div>
          </div>

          {/* Health Impacts Section (Consolidated & Legible) */}
          <div className={`p-5 rounded-[2rem] border border-white/10 flex items-start gap-4 transition-all ${isHighDust ? 'bg-rose-900/40 border-rose-500/20' : 'bg-white/10'}`}>
             <UserRound size={18} className={`${theme.color} mt-1`} strokeWidth={2.5} />
             <div className="min-w-0">
                <p className="text-xs font-black uppercase opacity-60 tracking-[0.1em] mb-1">ผลกระทบต่อสุขภาพ:</p>
                <p className="text-base font-black leading-relaxed">{theme.symptom}</p>
             </div>
          </div>

          {/* Seasonal Warning Banner */}
          {showBurningWarning && (
            <div className="p-5 rounded-[2rem] border-2 border-amber-400/30 bg-amber-500/10 flex items-start gap-3">
               <Info size={18} className="text-amber-400 mt-0.5" strokeWidth={2.5} />
               <p className="text-sm font-black text-amber-50/90 italic leading-relaxed">
                 ช่วงนี้เป็นช่วงฤดูฝุ่นควัน ข้อมูลจากดาวเทียมอาจคลาดเคลื่อน อย่าลืมดูแลสุขภาพนะครับ
               </p>
            </div>
          )}
        </div>

        {/* Dynamic Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-white/10 transition-all duration-1000" />
      </div>

      {/* Hourly Forecast Transition */}
      {showHourly && data?.hourly && (
        <div className="bg-white dark:bg-zinc-900/40 rounded-[2.5rem] p-6 shadow-xl shadow-emerald-500/5 border border-white/5">
           <HourlyForecastRow hourly={data.hourly} />
        </div>
      )}
    </div>
  );
}

'use client';

type Tag = 'golden' | 'hot_warn' | 'wind_warn' | 'rain_warn' | 'normal';

interface HourlySlot {
  time: string;
  shiftLabel: string;
  temp: number;
  humidity: number;
  windKmh: number;
  pop: number;
  icon: string;
  tag: Tag;
}

const TAG_CONFIG: Record<Tag, { border: string; bg: string; label: string; labelColor: string; glow: string }> = {
  golden: {
    border: 'border-amber-200 dark:border-yellow-500/60',
    bg: 'bg-amber-50 dark:bg-gradient-to-b dark:from-yellow-950/40 dark:to-amber-950/30',
    label: '✨ ช่วงเวลาทอง',
    labelColor: 'text-amber-700 dark:text-yellow-400',
    glow: 'shadow-amber-500/10 dark:shadow-yellow-500/20',
  },
  hot_warn: {
    border: 'border-rose-200 dark:border-rose-500/60',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    label: '🔴 ร้อน น้ำยางแข็งเร็ว',
    labelColor: 'text-rose-700 dark:text-rose-200',
    glow: 'shadow-rose-500/20',
  },
  wind_warn: {
    border: 'border-blue-200 dark:border-blue-500/40',
    bg: 'bg-blue-50 dark:bg-gradient-to-b dark:from-blue-950/30 dark:to-sky-950/20',
    label: '🌬️ ลมแรง ระวังแห้ง',
    labelColor: 'text-blue-700 dark:text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  rain_warn: {
    border: 'border-indigo-200 dark:border-indigo-500/40',
    bg: 'bg-indigo-50 dark:bg-gradient-to-b dark:from-indigo-950/30 dark:to-slate-950/20',
    label: '🌧️ ฝนตก ระวังเสีย',
    labelColor: 'text-indigo-700 dark:text-indigo-400',
    glow: 'shadow-indigo-500/10',
  },
  normal: {
    border: 'border-slate-100 dark:border-white/10',
    bg: 'bg-slate-50 dark:bg-white/5',
    label: '✅ กรีดได้ดี',
    labelColor: 'text-emerald-700 dark:text-emerald-400',
    glow: '',
  },
};

export function HourlyForecastRow({ hourly }: { hourly: HourlySlot[] }) {
  return (
    <div className="w-full">
      <h3 className="font-black text-lg text-slate-900 dark:text-neutral-100 mb-4 px-1 uppercase tracking-wider flex items-center gap-2">
        <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
        พยากรณ์ 24 ชั่วโมง
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory -mx-1 px-1 scrollbar-hide">
        {hourly.map((slot, idx) => {
          const cfg = TAG_CONFIG[slot.tag];
          const isHighlighted = slot.tag !== 'normal';

          return (
            <div
              key={idx}
              className={`
                snap-start flex-shrink-0 w-[130px] rounded-[1.5rem] border-2 p-4
                transition-all duration-200 flex flex-col items-center gap-2 shadow-sm
                ${cfg.border} ${cfg.bg} ${isHighlighted ? `shadow-md ${cfg.glow}` : ''}
              `}
            >
              {/* Shift Label + Time */}
              <div className="flex flex-col items-center leading-none mb-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  {slot.shiftLabel}
                </span>
                <span className="text-lg font-black text-slate-950 dark:text-white tracking-tight">
                  {slot.time}
                </span>
              </div>

              {/* Weather Icon from OWM CDN (@2x for crisp rendering) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://openweathermap.org/img/wn/${slot.icon}@2x.png`}
                alt="weather"
                width={56}
                height={56}
                className="drop-shadow-lg"
              />

              {/* Temperature */}
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {slot.temp}°C
              </span>

              {/* Details */}
              <div className="w-full border-t border-slate-200 dark:border-white/10 mt-1 pt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400">
                  <span>💧</span>
                  <span className="font-bold text-slate-700 dark:text-neutral-300">{slot.humidity}%</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400">
                  <span>💨</span>
                  <span className="font-bold text-slate-700 dark:text-neutral-300">{slot.windKmh} km/h</span>
                </div>
                {slot.pop > 5 && (
                  <div className="flex items-center justify-between text-[11px] text-blue-600 dark:text-blue-400">
                    <span>🌧</span>
                    <span className="font-bold">{slot.pop}%</span>
                  </div>
                )}
              </div>

              {/* Intelligence Label */}
              <p className={`text-[10px] font-black text-center leading-tight mt-1 ${cfg.labelColor}`}>
                {cfg.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

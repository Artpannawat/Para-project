'use client';

type Tag = 'golden' | 'hot_warn' | 'wind_warn' | 'rain_warn' | 'normal';

interface HourlySlot {
  time: string;
  dateLabel: string;
  temp: number;
  humidity: number;
  windKmh: number;
  pop: number;
  icon: string;
  tag: Tag;
}

const TAG_CONFIG: Record<Tag, { border: string; bg: string; label: string; labelColor: string }> = {
  golden: {
    border: 'border-yellow-400 shadow-yellow-300/50',
    bg: 'bg-gradient-to-b from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
    label: '✨ ช่วงเวลาทอง น้ำยางไหลดี',
    labelColor: 'text-yellow-700 dark:text-yellow-300',
  },
  hot_warn: {
    border: 'border-rose-400 shadow-rose-300/40',
    bg: 'bg-gradient-to-b from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20',
    label: '🛑 อากาศร้อนสะสม น้ำยางแข็งเร็ว',
    labelColor: 'text-rose-700 dark:text-rose-300',
  },
  wind_warn: {
    border: 'border-blue-400 shadow-blue-300/40',
    bg: 'bg-gradient-to-b from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20',
    label: '🌬️ ลมแรง ระวังยางแห้งติดรอย',
    labelColor: 'text-blue-700 dark:text-blue-300',
  },
  rain_warn: {
    border: 'border-indigo-400 shadow-indigo-300/40',
    bg: 'bg-gradient-to-b from-indigo-50 to-slate-50 dark:from-indigo-900/20 dark:to-slate-900/20',
    label: '🌧️ มีฝนตก ระวังน้ำยางเสีย',
    labelColor: 'text-indigo-700 dark:text-indigo-300',
  },
  normal: {
    border: 'border-neutral-200 dark:border-neutral-800',
    bg: 'bg-white dark:bg-neutral-900/40',
    label: '✅ กรีดได้ดี',
    labelColor: 'text-emerald-600 dark:text-emerald-400',
  },
};

export function HourlyForecastRow({ hourly }: { hourly: HourlySlot[] }) {
  return (
    <div className="w-full">
      <h3 className="font-bold text-lg text-neutral-700 dark:text-neutral-300 mb-3 px-1">
        พยากรณ์ 24 ชั่วโมง
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory -mx-1 px-1">
        {hourly.map((slot, idx) => {
          const cfg = TAG_CONFIG[slot.tag];
          const isHighlighted = slot.tag !== 'normal';

          return (
            <div
              key={idx}
              className={`
                snap-start flex-shrink-0 w-[120px] rounded-2xl border-2 p-3 shadow-sm
                transition-all duration-200 flex flex-col items-center gap-1.5
                ${cfg.border} ${cfg.bg}
                ${isHighlighted ? 'shadow-md' : ''}
              `}
            >
              {/* Date & Time */}
              <div className="flex flex-col items-center leading-none mb-1">
                <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">
                  {slot.dateLabel}
                </span>
                <span className="text-sm font-black text-neutral-700 dark:text-neutral-200 tracking-tight">
                  {slot.time}
                </span>
              </div>

              {/* Weather Icon from OWM CDN */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://openweathermap.org/img/wn/${slot.icon}.png`}
                alt="weather"
                width={40}
                height={40}
                className="drop-shadow-sm"
              />

              {/* Temp */}
              <span className="text-base font-extrabold text-neutral-800 dark:text-neutral-100">
                {slot.temp}°C
              </span>

              <div className="w-full border-t border-neutral-200 dark:border-neutral-600 mt-0.5 pt-1.5 space-y-0.5">
                {/* Humidity */}
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span>💧</span>
                  <span className="font-semibold">{slot.humidity}%</span>
                </div>
                {/* Wind */}
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span>💨</span>
                  <span className="font-semibold">{slot.windKmh} km/h</span>
                </div>
                {/* Rain */}
                {slot.pop > 5 && (
                  <div className="flex items-center justify-between text-[11px] text-blue-500">
                    <span>🌧</span>
                    <span className="font-semibold">{slot.pop}%</span>
                  </div>
                )}
              </div>

              {/* Intelligence Label */}
              {cfg.label && (
                <p className={`text-[10px] font-bold text-center leading-tight mt-1 ${cfg.labelColor}`}>
                  {cfg.label}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

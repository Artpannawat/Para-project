'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import useSWR from 'swr';

// Dynamically import MapPicker to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import('@/components/map/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-3xl flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500" />
    </div>
  ),
});

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PlantationPage() {
  const router = useRouter();
  const { data, mutate } = useSWR('/api/user/plantation', fetcher);

  const handleSaveLocation = async (lat: number, lng: number) => {
    const res = await fetch('/api/user/plantation', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    });

    if (res.ok) {
      mutate();
    } else {
      throw new Error('Failed to save location');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 pt-10 pb-24 gap-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 text-neutral-500 hover:text-emerald-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <MapPin className="text-emerald-500" />
            พิกัดสวนยาง
          </h1>
          <p className="text-sm text-neutral-500 font-medium">ปักหมุดตำแหน่งสวนเพื่อให้พยากรณ์แม่นยำที่สุด</p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-neutral-900 p-2 rounded-[2.5rem] shadow-sm border border-neutral-100 dark:border-neutral-800 overflow-hidden relative min-h-[500px]">
        {data ? (
          <MapPicker 
            initialLat={data.plantation_lat} 
            initialLng={data.plantation_lng} 
            onSave={handleSaveLocation}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-emerald-500" />
          </div>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-3xl border border-amber-100 dark:border-amber-800/50 flex gap-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 flex items-center justify-center flex-shrink-0 font-bold">!</div>
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
          <strong>หมายเหตุ:</strong> ระบบจะใช้พิกัดนี้ในการคำนวณ "ช่วงเวลาทอง" และแจ้งเตือนฝนแทนตำแหน่งปัจจุบันของมือถือ เพื่อให้คุณทราบแผนการกรีดยางได้ล่วงหน้าแม้ตัวจะไม่อยู่ที่สวน
        </p>
      </div>
    </div>
  );
}

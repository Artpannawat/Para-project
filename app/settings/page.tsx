'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogOut, User, MapPin, Bell, Navigation, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [locationMode, setLocationMode] = useState<'default' | 'gps'>('default');
  const [notifStatus, setNotifStatus] = useState<'idle' | 'loading' | 'subscribed' | 'denied' | 'unsupported'>('idle');

  // Load saved preferences on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('para_location_mode');
    if (savedMode === 'gps') setLocationMode('gps');

    // Check current notification permission
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      setNotifStatus('unsupported');
      return;
    }

    if (Notification.permission === 'denied') {
      setNotifStatus('denied');
    } else if (Notification.permission === 'granted') {
      // Check if we have an active subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setNotifStatus('subscribed');
        });
      });
    }
  }, []);

  const toggleLocationMode = () => {
    const newMode = locationMode === 'default' ? 'gps' : 'default';
    setLocationMode(newMode);
    localStorage.setItem('para_location_mode', newMode);
    if (newMode === 'gps' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {
          alert('กรุณาอนุญาตการเข้าถึงตำแหน่งที่ตั้ง (GPS) ในเบราว์เซอร์ของคุณ');
          setLocationMode('default');
          localStorage.setItem('para_location_mode', 'default');
        }
      );
    }
  };

  const handleNotificationToggle = useCallback(async () => {
    if (notifStatus === 'subscribed') {
      // Unsubscribe
      try {
        setNotifStatus('loading');
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setNotifStatus('idle');
      } catch (e) {
        console.error(e);
        setNotifStatus('idle');
      }
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setNotifStatus('unsupported');
      return;
    }

    try {
      setNotifStatus('loading');

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotifStatus('denied');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const existingSub = await reg.pushManager.getSubscription();
      const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const sub = existingSub || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      } as PushSubscriptionOptionsInit);

      // Get current GPS coordinates if available
      let lat = 17.89, lon = 101.88;
      const mode = localStorage.getItem('para_location_mode');
      if (mode === 'gps' && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { lat = pos.coords.latitude; lon = pos.coords.longitude; resolve(); },
            () => resolve(),
            { timeout: 5000 }
          );
        });
      }

      // Save subscription to MongoDB
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), lat, lon }),
      });

      if (!res.ok) throw new Error('Failed to save subscription');

      setNotifStatus('subscribed');
    } catch (err) {
      console.error('[PUSH_SUBSCRIBE]', err);
      setNotifStatus('idle');
    }
  }, [notifStatus]);

  // Send a test notification to self
  const sendTest = async () => {
    await fetch('/api/cron/weather-alert');
  };

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const isNotifActive = notifStatus === 'subscribed';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 flex flex-col pt-10 pb-24">
      <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 mb-6 flex items-center gap-2">
        <User className="text-emerald-500" />
        การตั้งค่าโปรไฟล์
      </h2>

      {session?.user && (
        <section className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800 mb-6 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 z-0 bg-emerald-500/5 dark:bg-emerald-500/10 blur-xl scale-150 transition-transform group-hover:scale-110" />
          <div className="z-10 bg-white dark:bg-neutral-800 p-1 rounded-full shadow-lg mb-4 ring-4 ring-emerald-50 dark:ring-emerald-900/40">
            {session.user.image ? (
              <Image src={session.user.image} alt="Profile picture" width={80} height={80} className="rounded-full" />
            ) : (
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold">
                {session.user.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <h3 className="z-10 font-bold text-xl text-neutral-800 dark:text-neutral-100">{session.user.name}</h3>
          <p className="z-10 text-sm text-neutral-500 dark:text-neutral-400">{session.user.email}</p>
        </section>
      )}

      <div className="space-y-4 mb-8">
        {/* Location Setting */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 flex items-center justify-between shadow-sm border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${locationMode === 'gps' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-500'}`}>
              {locationMode === 'gps' ? <Navigation size={24} /> : <MapPin size={24} />}
            </div>
            <div>
              <p className="font-bold text-neutral-800 dark:text-neutral-200">ตำแหน่งสวนยาง</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {locationMode === 'default' ? 'บ้านคกไผ่ อ.ปากชม (ค่าเริ่มต้น)' : 'พิกัด GPS ปัจจุบัน'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleLocationMode}
            className={`text-sm font-bold px-3 py-1.5 rounded-full transition-colors ${locationMode === 'gps' ? 'text-indigo-500 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40' : 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40'}`}
          >
            เปลี่ยน
          </button>
        </div>

        {/* Notification Setting */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${isNotifActive ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-500'}`}>
                <Bell size={24} />
              </div>
              <div>
                <p className="font-bold text-neutral-800 dark:text-neutral-200">การแจ้งเตือนสภาพอากาศ</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {notifStatus === 'subscribed' && '✅ เปิดใช้งานแล้ว – แจ้งเตือน 16:00 ทุกวัน'}
                  {notifStatus === 'denied' && '🚫 ถูกบล็อค – เปิดใน Settings ของเบราว์เซอร์'}
                  {notifStatus === 'unsupported' && '❌ เบราว์เซอร์นี้ไม่รองรับ Push'}
                  {(notifStatus === 'idle' || notifStatus === 'loading') && 'แจ้งเตือนล่วงหน้าเมื่อมีฝน'}
                </p>
              </div>
            </div>
            {notifStatus === 'loading' ? (
              <Loader2 size={24} className="animate-spin text-emerald-500" />
            ) : notifStatus === 'unsupported' || notifStatus === 'denied' ? null : (
              <button
                onClick={handleNotificationToggle}
                className={`relative w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none ${isNotifActive ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${isNotifActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            )}
          </div>

          {/* Test Button (only when subscribed) */}
          {isNotifActive && (
            <button
              onClick={sendTest}
              className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl py-2.5 font-bold hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle size={16} />
              ส่งแจ้งเตือนทดสอบ
            </button>
          )}
        </div>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="mt-auto w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-colors border border-rose-100 dark:border-rose-900/50"
      >
        <LogOut size={20} />
        ออกจากระบบ
      </button>

      <div className="mt-8 text-center px-4">
        <p className="text-xs text-neutral-400 my-2">พัฒนาเพื่อเกษตรกรชาวสวนยางไทย 🇹🇭</p>
        <p className="text-xs text-neutral-300 dark:text-neutral-600 font-mono">ParaSmart v1.1.0 (Push Enabled)</p>
      </div>
    </div>
  );
}

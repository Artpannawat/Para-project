'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { Leaf } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-emerald-50 to-white dark:from-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-sm space-y-8 text-center z-10">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 mb-2 mt-4">
            ParaSmart
          </h1>
          <p className="text-lg text-emerald-700 dark:text-emerald-400 font-medium">
            ผู้ช่วยจัดการสวนยางอัจฉริยะ
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 px-4 shadow-sm">
            จัดการผลผลิต คำนวณรายได้ และตรวจสอบสภาพอากาศก่อนกรีดได้ง่ายๆ
          </p>
        </div>

        <div className="pt-8">
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-100 rounded-2xl py-4 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-100 dark:border-neutral-700 transition-all active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l2.85-2.22.83-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-base font-semibold">ลงชื่อเข้าใช้ด้วย Google</span>
          </button>
        </div>

      </div>

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-200/50 dark:bg-emerald-900/30 rounded-full blur-3xl opacity-50 mix-blend-multiply" />
        <div className="absolute top-40 -left-20 w-72 h-72 bg-teal-200/50 dark:bg-teal-900/30 rounded-full blur-3xl opacity-50 mix-blend-multiply" />
      </div>
    </div>
  );
}

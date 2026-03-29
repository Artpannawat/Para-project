'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CloudRain, Calculator, Settings } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming Shadcn utility exists

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'หน้าหลัก', href: '/', icon: Home },
    { label: 'สภาพอากาศ', href: '/weather', icon: CloudRain },
    { label: 'บัญชี', href: '/accounting', icon: Calculator },
    { label: 'ตั้งค่า', href: '/settings', icon: Settings },
  ];

  if (pathname === '/login') return null;

  return (
    <div className="h-16 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-lg flex justify-around items-center rounded-2xl border border-gray-100 dark:border-white/5 relative overflow-hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full transition-colors',
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-gray-500 hover:text-emerald-500 dark:text-gray-400 dark:hover:text-emerald-400'
            )}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} className="mb-1 transition-transform hover:scale-110 active:scale-95" />
            <span className="text-[10px] sm:text-xs">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

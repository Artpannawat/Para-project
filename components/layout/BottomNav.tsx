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
    <div className="fixed bottom-0 w-full h-16 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-around items-center z-50 rounded-t-2xl border-t border-gray-100 dark:bg-zinc-900 dark:border-zinc-800">
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

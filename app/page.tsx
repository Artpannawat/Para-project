import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import { WeatherAdviceCard } from '@/components/dashboard/WeatherAdviceCard';
import { FinancialOverview } from '@/components/dashboard/FinancialOverview';
import { 
  ArrowUpRight, BookOpen, MapPin, Info
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session || !session.user) {
    redirect('/login');
  }

  await dbConnect();
  
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 pt-8 pb-24 gap-6 anim-fade-in relative overflow-x-hidden">
      {/* Premium Header v2.2 (Integrated Logo) */}
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900/60 p-5 rounded-[2.5rem] shadow-sm border border-neutral-100 dark:border-white/5 backdrop-blur-3xl z-30">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-3xl overflow-hidden bg-white shadow-2xl shadow-emerald-500/10 border-4 border-emerald-50/50">
             <Image 
               src="/logo.png" 
               alt="ParaSmart Logo" 
               fill 
               priority
               className="object-cover transform hover:scale-110 transition-transform"
             />
          </div>
          <div>
            <h1 className="text-xl font-black text-neutral-800 dark:text-neutral-50 tracking-tight leading-tight">
              ParaSmart <span className="text-emerald-500 tracking-widest text-sm">v2.2</span>
            </h1>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] leading-none">
              Smart Rubber Farming
            </p>
          </div>
        </div>
        <Link href="/settings" className="relative group p-1 bg-neutral-50 dark:bg-white/5 rounded-full border border-neutral-100 dark:border-white/5 hover:scale-110 transition-all shadow-inner">
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt="Profile"
              width={42}
              height={42}
              className="rounded-full ring-2 ring-emerald-500/20 group-hover:ring-emerald-500 transition-all"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-black shadow-lg">
              {session.user?.name?.charAt(0) || 'U'}
            </div>
          )}
        </Link>
      </div>

      {/* Greetings */}
      <div className="px-2">
        <h2 className="text-3xl font-black text-neutral-800 dark:text-neutral-50 leading-tight tracking-tight drop-shadow-sm">
          สวัสดีครับคุณ {session.user?.name?.split(' ')[0] || 'เกษตรกร'} 👋
        </h2>
        <p className="text-sm text-neutral-500 font-bold uppercase tracking-wider opacity-60">พร้อมรับผลผลิตวันนี้แล้วหรือยัง?</p>
      </div>

      {/* Main Shortcuts (Fast Access - Medium Size) */}
      <div className="grid grid-cols-2 gap-4 z-20">
        <Link href="/guide" className="bg-gradient-to-br from-indigo-500 to-blue-700 p-4 rounded-3xl shadow-lg shadow-blue-500/10 text-white group hover:scale-[1.02] transition-all hover:shadow-xl active:scale-95 border-b-4 border-blue-800">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-md border border-white/20 shadow-inner">
            <BookOpen size={20} className="group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
          </div>
          <p className="font-black text-lg mb-0.5 tracking-tight">คู่มือกรีด</p>
          <p className="text-[9px] font-black uppercase tracking-widest opacity-70">เทคนิคลับ ParaSmart</p>
        </Link>

        <Link href="/settings/plantation" className="bg-gradient-to-br from-amber-400 to-orange-600 p-4 rounded-3xl shadow-lg shadow-orange-500/10 text-white group hover:scale-[1.02] transition-all hover:shadow-xl active:scale-95 border-b-4 border-orange-700">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-md border border-white/20 shadow-inner">
            <MapPin size={20} className="group-hover:bounce transition-transform" strokeWidth={2.5} />
          </div>
          <p className="font-black text-lg mb-0.5 tracking-tight">ปักหมุดสวน</p>
          <p className="text-[9px] font-black uppercase tracking-widest opacity-70">ตั้งพิกัดแม่นยำ</p>
        </Link>
      </div>

      {/* Real-time Weather & PM2.5 Logic v2.2 */}
      <section className="animate-in fade-in slide-in-from-bottom-5 duration-1000 z-10">
        <WeatherAdviceCard hideGuide={true} />
      </section>

      {/* Financial Overview Card (Now with SWR Real-time updates) */}
      <section className="mb-20 space-y-5">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xl font-black text-neutral-800 dark:text-neutral-200 tracking-tight">
            การเงินเดือนนี้ <span className="text-emerald-500 opacity-60 text-sm">Real-time</span>
          </h3>
          <Link href="/accounting" className="text-xs font-black text-emerald-500 flex items-center gap-1.5 hover:underline uppercase tracking-widest">
            จัดการบัญชี <ArrowUpRight size={16} strokeWidth={2.5} />
          </Link>
        </div>

        <FinancialOverview />

        {/* Info Banner */}
        <div className="bg-neutral-100 dark:bg-white/5 p-5 rounded-[2.5rem] flex items-center gap-4 border-2 border-dashed border-neutral-300 dark:border-white/10 shadow-inner group overflow-hidden relative">
           <div className="p-3 bg-white dark:bg-neutral-800 rounded-2xl text-neutral-500 shadow-sm border border-neutral-200 dark:border-white/5 z-10">
              <Info size={20} />
           </div>
           <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest leading-relaxed z-10">
             เร็วๆ นี้: ระบบจัดการสต็อกยางแบบอัจฉริยะ และ แผนผังการกรีด...
           </p>
           <div className="absolute inset-0 bg-emerald-500/5 translate-x-full group-hover:translate-x-0 transition-transform duration-700 pointer-events-none" />
        </div>
      </section>

      {/* Decorative background flair */}
      <div className="absolute top-[20%] -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[60%] -right-32 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}

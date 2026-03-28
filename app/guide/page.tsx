'use client';

import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, BookOpen, Clock, Thermometer, Wind, CloudRain, 
  Droplets, ShieldCheck, Info, Sparkles, TrendingUp, AlertCircle
} from 'lucide-react';

export default function GuidePage() {
  const router = useRouter();

  const guides = [
    {
      title: 'ช่วงเวลาทอง (Golden Hour)',
      icon: Clock,
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      content: 'ช่วงเวลา 01:00 - 04:00 น. เป็นช่วงที่ต้นยาง "ตื่นตัว" ที่สุด ความชื้นสัมพัทธ์สูงกว่า 80% และอุณหภูมิที่ต่ำกว่า 25°C จะช่วยให้น้ำยางไหลได้นานขึ้นและปริมาณมากกว่าปกติถึง 20%!',
    },
    {
      title: 'อุณหภูมิที่เหมาะสม',
      icon: Thermometer,
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      content: 'น้ำยางพาราไหลได้ดีที่สุดเมื่ออุณหภูมิต่ำกว่า 25°C หากอุณหภูมิสูงเกิน 28°C น้ำยางจะเริ่มแข็งตัวเร็วขึ้นและหยุดไหลไวกว่าปกติ ทำให้ผลผลิตลดลงอย่างมาก',
    },
    {
      title: 'การจัดการฝุ่นละออง (PM 2.5)',
      icon: AlertCircle,
      color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
      content: 'หากค่าฝุ่นสูงเกิน 50 μg/m³ ควรหลีกเลี่ยงการกรีดยางช่วงดึก เพราะในช่วงอากาศเย็นและนิ่ง ฝุ่นจะกดตัวลงต่ำสุดและมีความหนาแน่นสูงสุดในระดับจมูก เสี่ยงต่อระบบทางเดินหายใจอย่างมาก',
    },
    {
      title: 'ลมแรงและพัดระเหย',
      icon: Wind,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      content: 'หากลมแรงเกิน 15 กม./ชม. ลมจะพัดเอาน้ำระเหยออกจากหน้ายางรวดเร็ว ทำให้น้ำยาง "แห้งติดรอยกรีด" จนไหลต่อไม่ได้ ควรระวังเป็นพิเศษในคืนที่ลมแรง',
    },
    {
      title: 'ระวังฝนและน้ำยางเสีย',
      icon: CloudRain,
      color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
      content: 'การกรีดยางขณะหน้ายางเปียกจะทำให้เกิด "เชื้อรา" และหน้ายางเสียถาวร หากพยากรณ์บอกโอกาสฝนตกเกิน 60% ควรพิจารณางดกรีดเพื่อรักษาต้นยางในระยะยาว',
    },
    {
      title: 'ความชื้นสัมพัทธ์ (Humidity)',
      icon: Droplets,
      color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
      content: 'ความชื้นในอากาศช่วยลดการระเหยของน้ำในน้ำยาง ยิ่งความชื้นสูง (80-90%) น้ำยางจะคงสภาพเหลวและไหลได้สม่ำเสมอที่สุด',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 pt-10 pb-24 gap-8 anim-fade-in">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 text-neutral-500 hover:text-emerald-500 transition-all hover:scale-105"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <BookOpen className="text-indigo-500" />
            คู่มือการกรีดยางฉบับParaSmart
          </h1>
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">เทคนิคลับฉบับเกษตรกรรวยรื่น</p>
        </div>
      </div>

      {/* Main Consolidated Guide List */}
      <div className="grid grid-cols-1 gap-4">
        {guides.map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-neutral-900 p-6 rounded-[2.5rem] shadow-sm border border-neutral-100 dark:border-neutral-800 group transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4">
               <div className={`p-4 rounded-2xl ${item.color} group-hover:scale-110 transition-transform shadow-inner`}>
                 <item.icon size={28} strokeWidth={2.5} />
               </div>
               <h3 className="font-black text-xl text-neutral-800 dark:text-neutral-100">{item.title}</h3>
            </div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed pl-2 border-l-2 border-neutral-100 dark:border-neutral-800">
              {item.content}
            </p>
          </div>
        ))}
      </div>

      {/* Burning Season Special Warning */}
      <div className="bg-rose-50 dark:bg-rose-950/20 p-6 rounded-[2.5rem] border-2 border-rose-500/30 flex gap-4 shadow-lg shadow-rose-500/10">
         <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0">
            <AlertCircle size={28} />
         </div>
         <div>
            <h4 className="font-black text-rose-700 dark:text-rose-400 text-lg mb-1">คำแนะนำพิเศษช่วงฤดูเผา (มี.ค.-เม.ย.)</h4>
            <p className="text-xs font-bold text-rose-600 dark:text-rose-300 leading-relaxed uppercase tracking-tight">
              สวมใส่หน้ากาก N95 ตลอดเวลาที่อยู่ในสวน และล้างตัวด้วยน้ำสะอาดทันทีหลังกลับจากสวนเพื่อลดการสะสมของสารพิษ
            </p>
         </div>
      </div>

      {/* Roadmap v2.x */}
      <div className="mt-4 p-8 rounded-[3rem] bg-gradient-to-br from-neutral-800 to-neutral-900 text-white relative overflow-hidden shadow-2xl border-b-8 border-emerald-600">
         <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-widest">
              <Sparkles size={16} /> Roadmap ParaSmart 2.x
            </div>
            <h2 className="text-2xl font-black leading-tight">เตรียมยกระดับสวนยางของคุณสู่มาตรฐานโลก 🌍</h2>
            <div className="grid grid-cols-1 gap-4 pt-2">
               <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl backdrop-blur-sm">
                  <ShieldCheck size={20} className="text-emerald-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">คลังเก็บยางอัจฉริยะ (Inventory v2.3)</p>
                    <p className="text-[10px] opacity-70">รู้ยอดน้ำยาง/ยางก้อนในมือทันที ไม่ต้องจดสมุด</p>
                  </div>
               </div>
               <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl backdrop-blur-sm">
                  <TrendingUp size={20} className="text-emerald-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">ป้ายราคากลางแบบ Real-time (Market v2.4)</p>
                    <p className="text-[10px] opacity-70">วิเคราะห์จังหวะการขายเพื่อกำไรสูงสุด</p>
                  </div>
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20" />
      </div>
    </div>
  );
}

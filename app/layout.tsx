import type { Metadata, Viewport } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { ClientProvider } from "@/components/providers/client-provider";
import { BottomNav } from "@/components/layout/BottomNav";

const sarabun = Sarabun({ 
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ["latin", "thai"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ParaSmart",
  description: "จัดการสวนยางพาราของคุณด้วยเทคโนโลยีที่ทันสมัย",
  icons: {
    icon: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${sarabun.className} min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 antialiased selection:bg-emerald-500/30 flex flex-col`}>
        <ClientProvider>
          {/* Main Content Area: Centered Column (Twitter/X Style) */}
          <main className="flex-1 pb-20 overflow-x-hidden w-full max-w-3xl mx-auto relative bg-white dark:bg-neutral-900 min-h-screen transition-all duration-500 px-4 md:px-8 shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-none">
            {children}
          </main>
          
          {/* Bottom Navigation: Perfectly Synced with Content Column */}
          <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50 pointer-events-none pb-6">
             <div className="w-full max-w-3xl px-4 md:px-8 pointer-events-auto transition-all duration-300">
                <BottomNav />
             </div>
          </div>
        </ClientProvider>
      </body>
    </html>
  );
}

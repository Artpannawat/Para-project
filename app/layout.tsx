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
    icon: "/favicon.png",
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
      <body className={`${sarabun.className} min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 antialiased selection:bg-emerald-500/30 flex flex-col uppercase-none`}>
        <ClientProvider>
          {/* Main Content Area */}
          <main className="flex-1 pb-20 overflow-x-hidden">
            <div className="mx-auto max-w-md w-full min-h-screen relative bg-white dark:bg-neutral-900 shadow-xl overflow-x-hidden overflow-y-auto">
              {children}
            </div>
          </main>
          {/* Bottom Navigation */}
          <div className="fixed bottom-0 w-full flex justify-center pointer-events-none z-50">
            <div className="w-full max-w-md pointer-events-auto">
              <BottomNav />
            </div>
          </div>
        </ClientProvider>
      </body>
    </html>
  );
}

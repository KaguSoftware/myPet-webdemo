"use client";

import { StoreProvider } from "@/lib/store";
import TabBar from "./TabBar";
import Toasts from "./Toasts";

export default function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <div className="flex min-h-dvh items-center justify-center md:py-8 md:[background:radial-gradient(circle_at_30%_20%,oklch(0.95_0.05_45),oklch(0.9_0.06_65)_70%)]">
        <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-[oklch(0.98_0.006_45)] md:h-[min(880px,calc(100dvh-4rem))] md:max-w-[400px] md:rounded-[3rem] md:border-[10px] md:border-[oklch(0.22_0.02_45)] md:shadow-[0_30px_80px_-20px_oklch(0.3_0.08_45/0.5)]">
          <div className="pointer-events-none absolute left-1/2 top-2 z-30 hidden h-6 w-28 -translate-x-1/2 rounded-full bg-[oklch(0.22_0.02_45)] md:block" />
          <main className="flex-1 overflow-y-auto overscroll-contain pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {children}
          </main>
          <TabBar />
          <Toasts />
        </div>
      </div>
    </StoreProvider>
  );
}

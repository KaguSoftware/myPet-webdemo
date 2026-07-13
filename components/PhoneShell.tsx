"use client";

import { createContext, useContext, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { StoreProvider } from "@/lib/store";
import TabBar from "./TabBar";
import Toasts from "./Toasts";
import Welcome from "./Welcome";

const ScrollCtx = createContext(0);
export const useScrollTop = () => useContext(ScrollCtx);

export default function PhoneShell({ children }: { children: React.ReactNode }) {
  const [scrollTop, setScrollTop] = useState(0);
  const raf = useRef(0);
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  return (
    <StoreProvider>
      <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(120%_120%_at_20%_0%,#23252b_0%,#0e0f12_60%)] md:py-8">
        <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-bg md:h-[min(880px,calc(100dvh-4rem))] md:max-w-[400px] md:rounded-[3.2rem] md:border-[7px] md:border-[#1c1c1e] md:shadow-[0_0_0_1.5px_#3a3a3e,0_40px_100px_-20px_rgba(0,0,0,0.8)]">
          {/* Dynamic island */}
          <div className="pointer-events-none absolute left-1/2 top-2.5 z-40 hidden h-[26px] w-[96px] -translate-x-1/2 rounded-full bg-black md:block" />
          {/* Screen sheen */}
          <div className="pointer-events-none absolute inset-0 z-30 hidden bg-[linear-gradient(115deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0)_28%)] md:block md:rounded-[2.7rem]" />

          <ScrollCtx.Provider value={scrollTop}>
            <main
              onScroll={(e) => {
                const top = e.currentTarget.scrollTop;
                cancelAnimationFrame(raf.current);
                raf.current = requestAnimationFrame(() => setScrollTop(top));
              }}
              className="flex-1 overflow-y-auto overscroll-contain pb-36 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {children}
            </main>
          </ScrollCtx.Provider>

          {!isAuthRoute && <TabBar />}
          <Toasts />
          {!isAuthRoute && <Welcome />}
        </div>
      </div>
    </StoreProvider>
  );
}

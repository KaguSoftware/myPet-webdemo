"use client";

export default function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end md:rounded-[2.7rem] md:overflow-hidden">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-[oklch(0.15_0.01_264/0.35)] backdrop-blur-[2px] animate-fade-in"
      />
      <div className="relative max-h-[88%] overflow-y-auto rounded-t-sheet bg-bg px-5 pb-9 pt-2.5 shadow-[0_-8px_40px_rgba(0,0,0,0.18)] animate-sheet-in [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto mb-4 h-[5px] w-9 rounded-full bg-[oklch(0.22_0.01_264/0.18)]" />
        {children}
      </div>
    </div>
  );
}

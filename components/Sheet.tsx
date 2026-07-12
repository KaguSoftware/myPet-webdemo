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
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40 animate-fade-in" />
      <div className="relative max-h-[85%] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8 shadow-2xl animate-sheet-in">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        {children}
      </div>
    </div>
  );
}

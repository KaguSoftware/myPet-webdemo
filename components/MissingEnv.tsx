/**
 * Shown inside the phone frame when the Supabase env vars are missing, instead
 * of letting the client crash on `createClient()`. Purely presentational — no
 * store access (the store can't initialise without the keys).
 */
export default function MissingEnv() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="mb-4 text-[40px] leading-none">🔌</div>
      <h1 className="font-pixel text-[17px] text-label">Configuration needed</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-label-2">
        PetPal can&apos;t reach its backend. Add your Supabase keys to a{" "}
        <code className="rounded bg-fill px-1 py-0.5 text-[12px]">.env.local</code> file and restart.
      </p>

      <div className="mt-5 w-full rounded-card bg-card p-4 text-left shadow-[0_1px_2px_oklch(0.2_0.01_264/0.05)]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-label-3">Required</p>
        <ul className="mt-2 space-y-1.5 font-mono text-[12px] text-label">
          <li className="truncate">NEXT_PUBLIC_SUPABASE_URL</li>
          <li className="truncate">NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        </ul>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-label-3">
        Copy <code className="rounded bg-fill px-1 py-0.5">.env.example</code> to{" "}
        <code className="rounded bg-fill px-1 py-0.5">.env.local</code>, fill in the values, then rerun{" "}
        <code className="rounded bg-fill px-1 py-0.5">npm run dev</code>.
      </p>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/authErrors";
import { AccentButton, IconCircle } from "@/components/ui";
import BrandMark from "@/components/BrandMark";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    // The recovery session was established by /auth/confirm before we got here.
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(friendlyAuthError(error.message));
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1200);
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <BrandMark />
        <p className="mt-2 text-[15px] text-label-2">Choose a new password</p>
      </div>

      {done ? (
        <div className="text-center">
          <div className="mb-3 flex justify-center"><IconCircle icon="check" tint="text-green" bg="bg-green-soft" size={48} iconSize={22} /></div>
          <p className="text-[15px] font-semibold text-label">Password updated</p>
          <p className="mt-1 text-[14px] text-label-2">Taking you to your household…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12.5 rounded-ios bg-fill px-4 text-[16px] text-label outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-12.5 rounded-ios bg-fill px-4 text-[16px] text-label outline-none focus:ring-2 focus:ring-accent"
          />
          {error && <p className="text-[13px] text-red">{error}</p>}
          <AccentButton disabled={loading} className="mt-2">
            {loading ? "Saving…" : "Update password"}
          </AccentButton>
        </form>
      )}
    </div>
  );
}

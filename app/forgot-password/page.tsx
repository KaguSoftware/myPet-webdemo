"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/authErrors";
import { AccentButton } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    // The recovery link lands on /auth/confirm, which establishes the recovery
    // session and forwards to /auth/reset where the user picks a new password.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/auth/reset`,
    });
    setLoading(false);
    if (error) {
      setError(friendlyAuthError(error.message));
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <div className="mb-3 text-[40px] leading-none">🐾</div>
        <h1 className="font-pixel text-[22px] text-label">PetPal</h1>
        <p className="mt-2 text-[15px] text-label-2">Reset your password</p>
      </div>

      {sent ? (
        <div className="text-center">
          <div className="mb-3 text-[36px] leading-none">📧</div>
          <p className="text-[15px] font-semibold text-label">Check your email</p>
          <p className="mt-1 text-[14px] text-label-2">
            If an account exists for {email}, we&apos;ve sent a link to reset your password.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12.5 rounded-ios bg-fill px-4 text-[16px] text-label outline-none focus:ring-2 focus:ring-accent"
          />
          {error && <p className="text-[13px] text-red">{error}</p>}
          <AccentButton disabled={loading} className="mt-2">
            {loading ? "Sending…" : "Send reset link"}
          </AccentButton>
        </form>
      )}

      <p className="mt-6 text-center text-[14px] text-label-2">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Back to log in
        </Link>
      </p>
    </div>
  );
}

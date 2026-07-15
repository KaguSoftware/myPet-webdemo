"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/authErrors";
import { AccentButton } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(friendlyAuthError(error.message));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <div className="mb-3 text-[40px] leading-none">🐾</div>
        <h1 className="font-pixel text-[22px] text-label">PetPal</h1>
        <p className="mt-2 text-[15px] text-label-2">Log in to your household</p>
      </div>

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
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12.5 rounded-ios bg-fill px-4 text-[16px] text-label outline-none focus:ring-2 focus:ring-accent"
        />
        {error && <p className="text-[13px] text-red">{error}</p>}
        <AccentButton disabled={loading} className="mt-2">
          {loading ? "Logging in…" : "Log In"}
        </AccentButton>
      </form>

      <p className="mt-4 text-center text-[14px]">
        <Link href="/forgot-password" className="font-semibold text-accent">
          Forgot password?
        </Link>
      </p>

      <p className="mt-6 text-center text-[14px] text-label-2">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-accent">
          Sign up
        </Link>
      </p>
    </div>
  );
}

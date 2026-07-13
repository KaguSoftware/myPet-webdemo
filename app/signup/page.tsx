"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AccentButton } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || "You" } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.replace("/");
      router.refresh();
    } else {
      setConfirmSent(true);
    }
  }

  if (confirmSent) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 text-[40px]">📬</div>
        <h1 className="text-[18px] font-semibold text-label">Check your email</h1>
        <p className="mt-2 text-[15px] text-label-2">We sent a confirmation link to {email}. Confirm it, then log in.</p>
        <Link href="/login" className="mt-6 font-semibold text-accent">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <div className="mb-3 text-[40px] leading-none">🐾</div>
        <h1 className="font-pixel text-[22px] text-label">PetPal</h1>
        <p className="mt-2 text-[15px] text-label-2">Create your household</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12.5 rounded-ios bg-fill px-4 text-[16px] text-label outline-none focus:ring-2 focus:ring-accent"
        />
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
          minLength={6}
          autoComplete="new-password"
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12.5 rounded-ios bg-fill px-4 text-[16px] text-label outline-none focus:ring-2 focus:ring-accent"
        />
        {error && <p className="text-[13px] text-red">{error}</p>}
        <AccentButton disabled={loading} className="mt-2">
          {loading ? "Creating account…" : "Sign Up"}
        </AccentButton>
      </form>

      <p className="mt-6 text-center text-[14px] text-label-2">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Log in
        </Link>
      </p>
    </div>
  );
}

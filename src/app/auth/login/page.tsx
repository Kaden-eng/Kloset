"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { useToast } from "@/components/ToastProvider";
import { withTimeout } from "@/lib/asyncUtils";
import Header from "@/components/Header";

export default function LoginPage() {
  const { session, supabase } = useSupabase();
  const router = useRouter();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [router, session]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage(null);
    addToast("Signing in...", "info", 3000);

    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        20000,
        "Login request timed out"
      );

      if (error) {
        setMessage(error.message);
        addToast(error.message, "error");
        return;
      }

      addToast("Signed in successfully.", "success");
      router.replace("/dashboard");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Unable to sign in. Please try again.";
      setMessage(text);
      addToast(text, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070807] text-white">
      <Header />
      <main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-5xl items-center gap-8 px-6 py-10 lg:grid-cols-[0.85fr_1fr] lg:px-8">
        <section className="hidden lg:block">
          <p className="inline-flex rounded-full border border-[#b7ff32]/25 bg-[#b7ff32]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#d8ff79]">
            Seller session
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.035em] text-white">Back to the resale desk.</h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-stone-400">
            Pick up inventory status, listing drafts, and saved prices without noise.
          </p>
          <div className="mt-8 grid max-w-sm gap-3">
            {["Protected inventory", "Saved sessions", "User-owned items"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-stone-300">
                <span>{item}</span>
                <span className="h-2 w-2 rounded-full bg-[#b7ff32]" />
              </div>
            ))}
          </div>
        </section>

        <div className="w-full rounded-[1.5rem] border border-white/10 bg-[#10110f]/85 p-6 shadow-[0_40px_100px_-55px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-8">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#d8ff79]">Welcome back</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">Sign in to Kloset</h1>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              Use the email and password tied to your resale workspace.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.22em] text-stone-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-[#b7ff32]/70 focus:ring-2 focus:ring-[#b7ff32]/15"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.22em] text-stone-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-[#b7ff32]/70 focus:ring-2 focus:ring-[#b7ff32]/15"
                required
              />
            </div>

            {message ? <p className="rounded-2xl border border-rose-400/20 bg-rose-950/70 px-4 py-3 text-sm text-rose-200">{message}</p> : null}

            <button
              type="submit"
              className="w-full rounded-full bg-[#b7ff32] px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-[#d6ff74] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Continue"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-stone-400">
            New to Kloset? <Link href="/auth/signup" className="font-semibold text-[#d8ff79] hover:text-[#b7ff32]">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

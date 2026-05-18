"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { useToast } from "@/components/ToastProvider";
import { withTimeout } from "@/lib/asyncUtils";
import Header from "@/components/Header";

export default function SignupPage() {
  const { session, supabase } = useSupabase();
  const router = useRouter();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [router, session]);

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage(null);
    addToast("Creating your account...", "info", 3000);

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
            emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
          },
        }),
        20000,
        "Signup request timed out"
      );

      if (error) {
        setMessage(error.message);
        addToast(error.message, "error");
        return;
      }

      if (data.session) {
        addToast("Account created successfully.", "success");
        router.replace("/dashboard");
        return;
      }

      setMessage("Check your email to confirm your account, then sign in.");
      addToast("Check your email to confirm your account.", "success");
    } catch (err) {
      const text = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
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
            New seller setup
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.035em] text-white">Build a cleaner resale workflow.</h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-stone-400">
            Create one account for saved inventory, protected dashboard totals, and item history.
          </p>
          <div className="mt-8 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs uppercase tracking-[0.22em] text-stone-500">Setup flow</span>
              <span className="text-xs font-semibold text-[#d8ff79]">Simple</span>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-stone-300">
              <span>Create account</span>
              <span>Add inventory</span>
              <span>Pick up where you left off</span>
            </div>
          </div>
        </section>

        <div className="w-full rounded-[1.5rem] border border-white/10 bg-[#10110f]/85 p-6 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-8">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#d8ff79]">Create account</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Start your Kloset workspace.
            </h1>
          <p className="mt-3 text-sm leading-7 text-stone-400">
              Sign up with email and password. Kloset will show a short first-item guide after you enter.
          </p>
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>
            <div className="grid gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.22em] text-stone-400">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-[#b7ff32]/70 focus:ring-2 focus:ring-[#b7ff32]/15"
                  required
                />
              </div>
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
                  minLength={6}
                  required
                />
              </div>
            </div>

            {message ? (
              <p className="rounded-2xl border border-[#b7ff32]/20 bg-[#b7ff32]/10 px-4 py-3 text-sm text-[#d8ff79] shadow-sm">{message}</p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-full bg-[#b7ff32] px-4 py-3 text-sm font-semibold text-black shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#d6ff74] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-400">
            Already a member? <Link href="/auth/login" className="font-semibold text-[#d8ff79] transition hover:text-[#b7ff32]">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

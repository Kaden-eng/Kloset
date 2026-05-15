"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { useToast } from "@/components/ToastProvider";
import { withTimeout } from "@/lib/asyncUtils";
import Header from "@/components/Header";

export default function SignupPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage(null);
    addToast("Creating your account…", "info", 3000);

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
        }),
        20000,
        "Signup request timed out"
      );

      if (error) {
        console.error("Signup failed", error);
        setMessage(error.message);
        addToast(error.message, "error");
        return;
      }

      if (data.session) {
        addToast("Account created successfully.", "success");
        router.push("/dashboard");
        return;
      }

      setMessage("Check your email to confirm your account.");
      addToast("Check your email to confirm your account.", "success");
    } catch (err) {
      console.error("Signup error", err);
      const text = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setMessage(text);
      addToast(text, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    addToast("Redirecting to Google sign in…", "info", 3000);

    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined;
      const { error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: {
              access_type: "offline",
            },
          },
        }),
        20000,
        "Google signup timed out"
      );

      if (error) {
        console.error("Google signup failed", error);
        setMessage(error.message);
        addToast(error.message, "error");
      }
    } catch (err) {
      console.error("Google signup error", err);
      const text = err instanceof Error ? err.message : "Google sign-in failed. Please try again.";
      setMessage(text);
      addToast(text, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    addToast("Redirecting to Apple sign in…", "info", 3000);

    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined;
      const { error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: "apple",
          options: {
            redirectTo,
          },
        }),
        20000,
        "Apple signup timed out"
      );

      if (error) {
        console.error("Apple signup failed", error);
        setMessage(error.message);
        addToast(error.message, "error");
      }
    } catch (err) {
      console.error("Apple signup error", err);
      const text = err instanceof Error ? err.message : "Apple sign-in failed. Please try again.";
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
            Kloset is for inventory, pricing, and listing work first, with enough culture to feel current.
          </p>
          <div className="mt-8 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs uppercase tracking-[0.22em] text-stone-500">Setup flow</span>
              <span className="text-xs font-semibold text-[#d8ff79]">3 min</span>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-stone-300">
              <span>Upload item image</span>
              <span>Review AI listing draft</span>
              <span>Track status and market value</span>
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
              Secure signup for your resale operating system.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogle}
              className="grid w-full grid-cols-[1.25rem_1fr_1.25rem] items-center rounded-full border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-stone-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-stone-100 hover:shadow-lg"
              disabled={loading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
              </svg>
              <span>Continue with Google</span>
              <span />
            </button>
            <button
              type="button"
              onClick={handleApple}
              className="grid w-full grid-cols-[1.25rem_1fr_1.25rem] items-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.1]"
              disabled={loading}
            >
              <svg className="h-4 w-4 flex-none" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M16.365 12.34c-.028-.073-3.197-1.88-3.197-5.172 0-1.493.994-2.52 1.038-2.566-.57-.83-1.456-1.281-2.608-1.299-1.104-.018-2.17.66-2.738.66-.59 0-1.525-.631-2.506-.61-1.55.018-2.98.9-3.77 2.28-1.61 2.7-.41 6.68 1.158 8.873.77 1.11 1.686 2.36 2.885 2.317 1.164-.042 1.603-.74 3.008-.74 1.4 0 1.8.74 3.02.71 1.247-.03 2.04-1.13 2.8-2.25.88-1.31 1.245-2.58 1.26-2.64-.03-.01-2.49-.96-2.52-3.06z" />
                <path d="M12.224 3.045c.705-.854 1.182-2.043 1.048-3.045-.997.042-2.2.658-2.91 1.512-.64.77-1.206 1.98-1.05 3.14 1.108.08 2.236-.57 2.912-1.607z" />
              </svg>
              <span>Continue with Apple</span>
              <span />
            </button>
            <div className="relative">
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
              <span className="relative mx-auto block w-fit bg-[#10110f] px-3 text-[11px] uppercase tracking-[0.22em] text-stone-500">
                or continue with email
              </span>
            </div>
          </div>

          <form className="mt-7 space-y-4" onSubmit={handleSignup}>
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
              Create account
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

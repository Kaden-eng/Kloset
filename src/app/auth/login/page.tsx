"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { useToast } from "@/components/ToastProvider";
import { withTimeout } from "@/lib/asyncUtils";
import Header from "@/components/Header";

export default function LoginPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage(null);
    addToast("Signing in…", "info", 3000);

    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        20000,
        "Login request timed out"
      );

      if (error) {
        console.error("Login failed", error);
        setMessage(error.message);
        addToast(error.message, "error");
        return;
      }

      addToast("Signed in successfully.", "success");
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error", err);
      const message = err instanceof Error ? err.message : "Unable to sign in. Please try again.";
      setMessage(message);
      addToast(message, "error");
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
        "Google sign-in timed out"
      );

      if (error) {
        console.error("Google login failed", error);
        setMessage(error.message);
        addToast(error.message, "error");
      }
    } catch (err) {
      console.error("Google login error", err);
      const message = err instanceof Error ? err.message : "Google sign-in failed. Please try again.";
      setMessage(message);
      addToast(message, "error");
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
        "Apple sign-in timed out"
      );

      if (error) {
        console.error("Apple login failed", error);
        setMessage(error.message);
        addToast(error.message, "error");
      }
    } catch (err) {
      console.error("Apple login error", err);
      const message = err instanceof Error ? err.message : "Apple sign-in failed. Please try again.";
      setMessage(message);
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-2xl items-center px-6 py-12 lg:px-8">
        <div className="w-full rounded-[2rem] border border-white/10 bg-black/80 p-10 shadow-[0_40px_100px_-50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="mb-10 text-center">
            <p className="text-[10px] uppercase tracking-[0.35em] text-stone-400">Welcome back</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Sign in to Kloset</h1>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              Jump into your premium resale workflow with a more intentional, street-ready edge.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-stone-950 shadow-sm transition duration-200 hover:bg-stone-100 hover:shadow-md"
              disabled={loading}
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={handleApple}
              className="flex w-full items-center justify-center gap-2.5 rounded-3xl border border-white/10 bg-stone-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-stone-800 hover:shadow-md"
              disabled={loading}
            >
              <svg className="h-4 w-4 flex-none" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M16.365 12.34c-.028-.073-3.197-1.88-3.197-5.172 0-1.493.994-2.52 1.038-2.566-.57-.83-1.456-1.281-2.608-1.299-1.104-.018-2.17.66-2.738.66-.59 0-1.525-.631-2.506-.61-1.55.018-2.98.9-3.77 2.28-1.61 2.7-.41 6.68 1.158 8.873.77 1.11 1.686 2.36 2.885 2.317 1.164-.042 1.603-.74 3.008-.74 1.4 0 1.8.74 3.02.71 1.247-.03 2.04-1.13 2.8-2.25.88-1.31 1.245-2.58 1.26-2.64-.03-.01-2.49-.96-2.52-3.06z" />
                <path d="M12.224 3.045c.705-.854 1.182-2.043 1.048-3.045-.997.042-2.2.658-2.91 1.512-.64.77-1.206 1.98-1.05 3.14 1.108.08 2.236-.57 2.912-1.607z" />
              </svg>
              Continue with Apple
            </button>
            <div className="relative">
              <div className="absolute inset-x-0 top-1/2 h-px bg-stone-700" />
              <span className="relative mx-auto inline-block bg-black px-3 text-[11px] uppercase tracking-[0.28em] text-stone-500">
                or with email
              </span>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <label className="block text-[10px] uppercase tracking-[0.28em] text-stone-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-3 w-full rounded-3xl border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
                required
              />
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <label className="block text-[10px] uppercase tracking-[0.28em] text-stone-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-3 w-full rounded-3xl border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
                required
              />
            </div>

            {message ? <p className="rounded-3xl bg-rose-900/90 px-4 py-3 text-sm text-rose-200">{message}</p> : null}

            <button
              type="submit"
              className="w-full rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              Continue
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-stone-400">
            New to Kloset? <Link href="/auth/signup" className="font-semibold text-white hover:text-stone-200">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

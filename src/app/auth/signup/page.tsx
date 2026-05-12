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
      const { error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
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

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-2xl items-center px-6 py-12 lg:px-8">
        <div className="w-full rounded-[2rem] border border-stone-200 bg-white/95 p-10 shadow-2xl backdrop-blur-xl">
          <div className="mb-10 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Start your account</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900">Create your Kloset workspace</h1>
            <p className="mt-3 text-sm text-stone-600">
              Build your inventory, track listings, and manage AI-backed resale recommendations.
            </p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-3xl border border-stone-200 bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              disabled={loading}
            >
              Continue with Google
            </button>
            <div className="relative">
              <div className="absolute inset-x-0 top-1/2 h-px bg-stone-200" />
              <span className="relative mx-auto inline-block bg-white px-3 text-xs uppercase tracking-[0.28em] text-stone-500">
                or with email
              </span>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSignup}>
            <div className="rounded-4xl border border-stone-200 bg-stone-50 p-5">
              <label className="block text-xs uppercase tracking-[0.28em] text-stone-500">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-3 w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-900"
                required
              />
            </div>
            <div className="rounded-4xl border border-stone-200 bg-stone-50 p-5">
              <label className="block text-xs uppercase tracking-[0.28em] text-stone-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-3 w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-900"
                required
              />
            </div>
            <div className="rounded-4xl border border-stone-200 bg-stone-50 p-5">
              <label className="block text-xs uppercase tracking-[0.28em] text-stone-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-3 w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-900"
                required
              />
            </div>

            {message ? <p className="rounded-3xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

            <button
              type="submit"
              className="w-full rounded-3xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              disabled={loading}
            >
              Create account
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-stone-600">
            Already a member? <Link href="/auth/login" className="font-semibold text-stone-900 hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

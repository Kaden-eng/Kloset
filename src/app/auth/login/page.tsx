"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import Header from "@/components/Header";

export default function LoginPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          access_type: "offline",
        },
      },
    });
    setLoading(false);
    if (error) setMessage(error.message);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-2xl items-center px-6 py-12 lg:px-8">
        <div className="w-full rounded-[2rem] border border-stone-200 bg-white/95 p-10 shadow-2xl backdrop-blur-xl">
          <div className="mb-10 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Welcome back</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900">Sign in to Kloset</h1>
            <p className="mt-3 text-sm text-stone-600">
              Access your premium resale workspace, inventory, and AI market insights.
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

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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

            {message ? <p className="rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p> : null}

            <button
              type="submit"
              className="w-full rounded-3xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              disabled={loading}
            >
              Continue
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-stone-600">
            New to Kloset? <Link href="/auth/signup" className="font-semibold text-stone-900 hover:underline">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

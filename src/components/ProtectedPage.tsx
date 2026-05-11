"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";

export default function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { session } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (session === null) {
      router.replace("/auth/login");
    }
  }, [router, session]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6 py-24">
        <div className="rounded-4xl border border-stone-200 bg-white p-12 text-center shadow-lg">
          <p className="text-sm uppercase tracking-[0.28em] text-stone-500">Protected route</p>
          <h1 className="mt-4 text-3xl font-semibold text-stone-900">Checking your session…</h1>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

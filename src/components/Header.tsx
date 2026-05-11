"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
];

export default function Header({ transparent = false }: { transparent?: boolean }) {
  const { session, supabase } = useSupabase();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = useMemo(() => {
    const email = session?.user?.email ?? "";
    return email
      .split("@")[0]
      .split(".")
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2);
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300 ${
        transparent ? "bg-white/10 border-white/10" : "bg-white/95 border-stone-200"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="text-2xl font-bold tracking-tight text-stone-900">
          Kloset
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {session &&
            navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-stone-600 hover:text-stone-900">
                {link.label}
              </Link>
            ))}
        </div>

        <div className="flex items-center gap-3">
          {!session ? (
            <>
              <Link href="/auth/login" className="text-sm font-medium text-stone-600 hover:text-stone-900">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full border border-stone-900 bg-stone-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                Create account
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white shadow-sm"
              >
                {initials || "U"}
              </button>
              {menuOpen ? (
                <div className="absolute right-0 mt-3 w-48 rounded-3xl border border-stone-200 bg-white p-4 shadow-xl">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Account</p>
                  <p className="mt-3 text-sm font-semibold text-stone-900 truncate">{session.user.email}</p>
                  <div className="mt-4 space-y-2">
                    <Link href="/dashboard" className="block rounded-2xl px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">
                      Dashboard
                    </Link>
                    <Link href="/inventory" className="block rounded-2xl px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">
                      Inventory
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-2xl bg-stone-900 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

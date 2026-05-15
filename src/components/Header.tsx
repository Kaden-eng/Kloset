"use client";

import Link from "next/link";
import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { useToast } from "@/components/ToastProvider";

const navLinks = [
  { href: "/overview", label: "Overview" },
  { href: "/inventory", label: "Inventory" },
  { href: "/listings", label: "Listings" },
  { href: "/market", label: "Market" },
  { href: "/sales", label: "Sales" },
  { href: "/ai-tools", label: "AI Tools" },
];

export default function Header({ transparent = false }: { transparent?: boolean }) {
  const { session, supabase } = useSupabase();
  const router = useRouter();
  const { addToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

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
    if (signingOut) return;
    setSigningOut(true);
    addToast("Signing out…", "info", 3000);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout failed", error);
        addToast(error.message, "error");
        return;
      }
      addToast("Signed out successfully.", "success");
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout error", err);
      const message = err instanceof Error ? err.message : "Unable to log out. Please try again.";
      addToast(message, "error");
    } finally {
      setSigningOut(false);
      setMenuOpen(false);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${
        transparent ? "bg-black/15 border-white/10" : "bg-[#070807]/90 border-white/10"
      } shadow-[0_18px_50px_-24px_rgba(0,0,0,0.65)]`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.28em] text-white">
          <span className="h-2.5 w-2.5 rounded-full bg-[#b7ff32] shadow-[0_0_20px_rgba(183,255,50,0.75)]" />
          <span>Kloset</span>
        </Link>

        <div className="hidden items-center gap-5 lg:flex">
          {session &&
            navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-stone-300 transition hover:text-white">
                {link.label}
              </Link>
            ))}
        </div>

        <div className="flex items-center gap-3">
          {!session ? (
            <>
              <Link href="/auth/login" className="text-sm font-medium text-stone-300 transition hover:text-white">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full border border-[#b7ff32]/40 bg-[#b7ff32] px-5 py-2 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-[#d4ff70] hover:shadow-[0_14px_35px_-20px_rgba(183,255,50,0.9)]"
              >
                Create account
              </Link>
            </>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white shadow-sm transition hover:border-[#b7ff32]/50 hover:text-[#b7ff32]"
              >
                {initials || "U"}
              </button>
              {menuOpen ? (
                <div className="absolute right-0 mt-3 w-52 rounded-[1.5rem] border border-stone-800 bg-stone-950 p-4 shadow-[0_28px_60px_-26px_rgba(0,0,0,0.65)] transition duration-200 ease-out"
                  role="menu"
                  aria-label="Account menu"
                >
                  <p className="text-xs uppercase tracking-[0.32em] text-stone-500">Account</p>
                  <p className="mt-3 text-sm font-semibold text-white truncate">{session.user.email}</p>
                  <div className="mt-4 space-y-2">
                    {navLinks.map((link) => (
                      <Link key={link.href} href={link.href} className="block rounded-2xl px-3 py-2 text-sm text-stone-300 transition hover:bg-white/5 hover:text-white">
                        {link.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={signingOut}
                      className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-stone-950 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {signingOut ? "Signing out…" : "Log out"}
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

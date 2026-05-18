import Header from "@/components/Header";
import Link from "next/link";

const features = [
  {
    title: "Seller workspace",
    description: "Secure sessions, saved listing drafts, and fast account switching for your resale flow.",
  },
  {
    title: "Market-aware inventory",
    description: "Track items, price ranges, how fast they might sell, and platform context from one workspace.",
  },
  {
    title: "Upload to operating mode",
    description: "Turn item photos into clean drafts with useful pricing baselines and editable details.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070807] text-white">
      <Header transparent />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(183,255,50,0.13),_transparent_26%)]" />
        <section className="relative px-6 pt-24 pb-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.82fr] lg:items-end">
              <div className="space-y-8">
                <div className="max-w-2xl">
                  <p className="inline-flex rounded-full border border-[#b7ff32]/25 bg-[#b7ff32]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d8ff79]">
                    Resale ops for modern sellers
                  </p>
                  <h1 className="mt-6 text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
                    Run your closet like a resale desk.
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-8 text-stone-300 sm:text-lg">
                    Kloset keeps inventory, pricing, drafts, and marketplace signals tight without turning your workspace into a fashion campaign.
                  </p>
                  <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-full bg-[#b7ff32] px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-[#d6ff74] hover:shadow-[0_22px_55px_-30px_rgba(183,255,50,0.9)]">
                      Start workspace
                    </Link>
                    <Link href="/auth/login" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10">
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>

              <div className="relative rounded-[1.75rem] border border-white/10 bg-[#10110f]/80 p-5 shadow-[0_50px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-stone-400">
                    <span>Live desk</span>
                    <span className="text-[#b7ff32]">Synced</span>
                  </div>
                  <div className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-black/35 p-4 shadow-inner">
                    <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Inventory value</p>
                          <h2 className="mt-2 text-3xl font-semibold text-white">$8.4k</h2>
                        </div>
                        <span className="rounded-full bg-[#b7ff32]/15 px-3 py-1 text-xs font-semibold text-[#d8ff79]">+12%</span>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.15rem] bg-white/[0.04] p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Drafts</p>
                        <p className="mt-3 text-2xl font-semibold text-white">18</p>
                      </div>
                      <div className="rounded-[1.15rem] bg-white/[0.04] p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Listed</p>
                        <p className="mt-3 text-2xl font-semibold text-white">42</p>
                      </div>
                    </div>
                    <div className="rounded-[1.15rem] border border-[#b7ff32]/20 bg-[#b7ff32]/10 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[#d8ff79]">Recommended action</p>
                      <p className="mt-2 text-sm leading-6 text-stone-200">Push mid-weight jackets to Grailed before weekend demand spikes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_-45px_rgba(255,255,255,0.14)] transition hover:-translate-y-1 hover:border-[#b7ff32]/30 hover:bg-white/[0.07]">
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-stone-300">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_32px_80px_-50px_rgba(255,255,255,0.12)] sm:p-8">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-[#d8ff79]">Resale flow, organized</p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Serious tooling with street-market context.</h2>
                  <p className="mt-5 text-sm leading-7 text-stone-300">
                    Clean auth, protected inventory, and a real data stack designed for repeat selling work.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.15rem] bg-black/45 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-300">Persistent inventory</p>
                    <p className="mt-3 text-sm text-stone-300">Items stay synced to your account so your listings are always ready to post.</p>
                  </div>
                  <div className="rounded-[1.15rem] bg-black/45 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-300">Protected dashboard</p>
                    <p className="mt-3 text-sm text-stone-300">Session-backed pages keep your resale flow locked and clean.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

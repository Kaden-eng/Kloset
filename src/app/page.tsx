import Header from "@/components/Header";
import Link from "next/link";

const features = [
  {
    title: "Authenticated workspaces",
    description: "Secure user accounts with session persistence and luxury account navigation.",
  },
  {
    title: "Live inventory intelligence",
    description: "Saved listings, revenue estimates, and AI-powered market recommendations in one view.",
  },
  {
    title: "Upload and automate",
    description: "Smart upload flow stores items persistently while generating listing insights instantly.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <Header transparent />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.06),_transparent_28%)]" />
        <section className="relative px-6 pt-28 pb-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[0.95fr_0.65fr] lg:items-end">
              <div className="space-y-8">
                <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_32px_80px_-48px_rgba(255,255,255,0.15)] backdrop-blur-xl">
                  <p className="text-[11px] uppercase tracking-[0.4em] text-stone-400">Streetwear resale, sharpened</p>
                  <h1 className="mt-5 text-5xl font-black uppercase tracking-[-0.05em] text-white sm:text-6xl">
                    Kloset is the resale platform serious streetwear sellers actually want.
                  </h1>
                  <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
                    A premium resale workspace rooted in skate culture, editorial energy, and fast-moving market intelligence.
                  </p>
                  <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-semibold text-stone-950 transition hover:bg-stone-100">
                      Start your drop
                    </Link>
                    <Link href="/auth/login" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-transparent px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/5">
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>

              <div className="relative rounded-[2rem] border border-white/10 bg-black/70 p-8 shadow-[0_50px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                <div className="absolute -left-12 top-8 h-20 w-20 rounded-full border border-white/10 bg-white/5 blur-xl" />
                <div className="relative space-y-6">
                  <div className="text-xs uppercase tracking-[0.32em] text-stone-400">Kloset preview</div>
                  <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-stone-950/80 p-6 shadow-inner">
                    <div className="rounded-3xl bg-white/5 p-5">
                      <p className="text-[11px] uppercase tracking-[0.32em] text-stone-400">Persisted work</p>
                      <h2 className="mt-3 text-xl font-semibold text-white">Inventory built to move</h2>
                      <p className="mt-3 text-sm leading-6 text-stone-400">
                        Keep buy lists, price notes, and product mood boards in one clean workspace.
                      </p>
                    </div>
                    <div className="rounded-3xl bg-white/5 p-5">
                      <p className="text-[11px] uppercase tracking-[0.32em] text-stone-400">Market pulse</p>
                      <h2 className="mt-3 text-xl font-semibold text-white">Intelligence that feels alive</h2>
                      <p className="mt-3 text-sm leading-6 text-stone-400">
                        Get pricing insights with the confidence of skate, street, and collector culture.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-8 shadow-[0_20px_60px_-40px_rgba(255,255,255,0.12)] transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10">
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-stone-300">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-[0_32px_80px_-44px_rgba(255,255,255,0.12)]">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-stone-400">Resale flow, elevated</p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Built for street sellers, not spreadsheets.</h2>
                  <p className="mt-5 text-sm leading-7 text-stone-300">
                    Clean auth, protected inventory, and a real data stack designed to support hustle, not bookkeeping.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-black/70 p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-300">Persistent inventory</p>
                    <p className="mt-3 text-sm text-stone-300">Items stay synced to your account so your listings are always ready to post.</p>
                  </div>
                  <div className="rounded-3xl bg-black/70 p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-300">Protected dashboard</p>
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

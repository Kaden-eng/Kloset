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
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <Header transparent />

      <main className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-white to-transparent" />

        <section className="relative px-6 pt-28 pb-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-16 lg:grid-cols-[0.95fr_0.65fr] lg:items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-stone-500">Luxury resale workspace</p>
                <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-stone-900 sm:text-6xl">
                  Kloset is the premium resale platform for authenticated sellers.
                </h1>
                <p className="mt-8 max-w-2xl text-lg leading-8 text-stone-600">
                  Move beyond demo dashboards with real user accounts, persistent inventory, and data-driven listing workflows powered by Supabase.
                </p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-full bg-stone-900 px-8 py-4 text-sm font-semibold text-white transition hover:bg-stone-800">
                    Start free trial
                  </Link>
                  <Link href="/auth/login" className="inline-flex items-center justify-center rounded-full border border-stone-900 bg-white px-8 py-4 text-sm font-semibold text-stone-900 transition hover:bg-stone-100">
                    Sign in
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border border-stone-200 bg-white p-10 shadow-2xl">
                <div className="text-sm uppercase tracking-[0.28em] text-stone-500">Workspace preview</div>
                <div className="mt-8 grid gap-6">
                  <div className="rounded-4xl border border-stone-200 bg-stone-50 p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Session backed</p>
                    <h2 className="mt-3 text-xl font-semibold text-stone-900">Personalized account modules</h2>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      Each user retains their saved inventory, upload history, and AI analysis details across refreshes.
                    </p>
                  </div>
                  <div className="rounded-4xl border border-stone-200 bg-stone-50 p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-stone-500">AI resale insights</p>
                    <h2 className="mt-3 text-xl font-semibold text-stone-900">Machine-backed pricing</h2>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      Upload a product image, analyze demand, and receive marketplace recommendations instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-4xl border border-stone-200 bg-white p-8 shadow-sm transition hover:shadow-lg">
                  <h3 className="text-xl font-semibold text-stone-900">{feature.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-stone-600">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 rounded-[2rem] border border-stone-200 bg-stone-950 p-10 text-white shadow-2xl">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-stone-400">Scalable SaaS design</p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight">Built as a startup platform, not a prototype.</h2>
                  <p className="mt-5 text-sm leading-7 text-stone-300">
                    Modular auth, protected routes, reusable components, and a real database structure ready for production.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white/5 p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-300">Persistent inventory</p>
                    <p className="mt-3 text-sm text-stone-300">Saved items survive refreshes and live in your Supabase database.</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-300">Protected dashboard</p>
                    <p className="mt-3 text-sm text-stone-300">User sessions guard the dashboard and inventory pages.</p>
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

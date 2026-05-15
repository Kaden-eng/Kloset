import Link from "next/link";
import { CheckCircle2, CopyPlus, ExternalLink, Send, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import ProtectedPage from "@/components/ProtectedPage";

const draftQueue = [
  {
    item: "Stussy washed work jacket",
    channel: "Grailed primary",
    status: "Ready",
    price: "$185",
    details: "4 photos, measurements saved, recent sale prices checked",
  },
  {
    item: "Carhartt double-knee pant",
    channel: "Depop + eBay",
    status: "Text",
    price: "$96",
    details: "Needs a clearer title and condition note",
  },
  {
    item: "Salomon XT-6 black pair",
    channel: "Grailed + StockX check",
    status: "Price",
    price: "$128",
    details: "Recent sale prices vary, so double-check before listing",
  },
  {
    item: "Supreme small box hoodie",
    channel: "Grailed + Depop",
    status: "Photos",
    price: "$164",
    details: "Missing sleeve and tag closeups",
  },
];

const channels = [
  { name: "Grailed", ready: 9, tone: "Measurements, brand details, and clean photos" },
  { name: "Depop", ready: 7, tone: "Short caption, style keywords, and simple tags" },
  { name: "eBay", ready: 5, tone: "Clear search title and condition details" },
  { name: "StockX", ready: 2, tone: "Confirm exact model and size before posting" },
];

const checks = ["Photos complete", "Measurements", "Condition note", "Price checked", "App-specific text"];

export default function ListingsPage() {
  return (
    <ProtectedPage>
      <div className="min-h-screen bg-stone-50 text-stone-950">
        <Header />
        <main className="px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600 shadow-sm">
                  Listing tools
                </p>
                <h1 className="mt-4 bg-transparent text-3xl font-semibold tracking-[-0.03em] text-stone-950">
                  Get listings ready to post
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                  Turn saved inventory into clear marketplace posts with photos, prices, and text checked before you publish.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-stone-800">
                  <Send size={16} />
                  Post selected
                </button>
                <button className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100">
                  <CopyPlus size={16} />
                  Add drafts
                </button>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.35fr_0.8fr]">
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Drafts to finish</p>
                    <h2 className="mt-2 text-xl font-semibold text-stone-950">Review these before posting</h2>
                  </div>
                  <Link href="/inventory" className="text-sm font-semibold text-stone-700 transition hover:text-stone-950">
                    Add from inventory
                  </Link>
                </div>

                <div className="mt-2 divide-y divide-stone-200">
                  {draftQueue.map((draft, index) => (
                    <div key={draft.item} className="grid gap-4 py-5 md:grid-cols-[4rem_1fr_auto] md:items-center">
                      <div className="flex aspect-square items-center justify-center rounded-2xl border border-stone-200 bg-stone-100 text-sm font-semibold text-stone-500">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-stone-950">{draft.item}</h3>
                          <span className="rounded-full border border-stone-200 bg-stone-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600">
                            {draft.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-stone-600">{draft.channel}</p>
                        <p className="mt-2 text-xs leading-5 text-stone-500">{draft.details}</p>
                      </div>
                      <div className="flex items-center gap-3 md:justify-end">
                        <p className="text-sm font-semibold text-stone-950">{draft.price}</p>
                        <button className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-100">
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Post to selling apps</p>
                  <div className="mt-4 space-y-3">
                    {channels.map((channel) => (
                      <div key={channel.name} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-semibold text-stone-950">{channel.name}</h3>
                          <span className="rounded-full bg-stone-950 px-2.5 py-1 text-[11px] font-semibold text-white">{channel.ready} ready</span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-stone-500">{channel.tone}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Before you post</p>
                  <div className="mt-4 space-y-3">
                    {checks.map((check, index) => (
                      <div key={check} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-3 text-sm font-medium text-stone-800">
                          <CheckCircle2 size={17} className={index < 3 ? "text-stone-950" : "text-stone-300"} />
                          {check}
                        </span>
                        <span className="text-xs text-stone-500">{index < 3 ? "Done" : "Review"}</span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-200 bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800">
                    <Sparkles size={16} />
                    Improve selected drafts
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Almost ready</p>
                  <h2 className="mt-2 text-xl font-semibold text-stone-950">11 listings can go live after two fixes</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                    Add the missing photos and check prices first so buyers have fewer questions and your items are not listed too low.
                  </p>
                </div>
                <button className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100">
                  Open posting plan
                  <ExternalLink size={15} />
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}

import { BadgeDollarSign, Camera, FileText, MessageSquareText, Sparkles, Wand2 } from "lucide-react";
import Header from "@/components/Header";
import ProtectedPage from "@/components/ProtectedPage";

const tools = [
  {
    title: "Photo to listing",
    detail: "Turn item photos into a ready-to-edit title, category, tags, and description.",
    action: "Start draft",
    icon: Camera,
  },
  {
    title: "Price helper",
    detail: "See a low, fair, and high price option before you publish.",
    action: "Check price",
    icon: BadgeDollarSign,
  },
  {
    title: "Condition writer",
    detail: "Turn rough notes into a clear description buyers can understand.",
    action: "Clean notes",
    icon: FileText,
  },
  {
    title: "Rewrite for each app",
    detail: "Adjust your listing text for Grailed, Depop, eBay, or StockX.",
    action: "Remix copy",
    icon: MessageSquareText,
  },
];

const runs = [
  { task: "Wrote title options for Supreme hoodie", result: "3 options saved", time: "6 min ago" },
  { task: "Checked Salomon XT-6 sale prices", result: "$118-$136 suggested", time: "46 min ago" },
  { task: "Cleaned up Stussy jacket condition note", result: "Ready to review", time: "Today" },
];

const presets = [
  "Write a short listing with measurements",
  "Create a friendly Depop caption with style tags",
  "Help me choose a safe selling price",
  "Rewrite condition notes so they sound honest and clear",
];

export default function AIToolsPage() {
  return (
    <ProtectedPage>
      <div className="min-h-screen bg-stone-50 text-stone-950">
        <Header />
        <main className="px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600 shadow-sm">
                  AI tools
                </p>
                <h1 className="mt-4 bg-transparent text-3xl font-semibold tracking-[-0.03em] text-stone-950">
                  Simple tools to speed up selling
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                  Get help with pricing, descriptions, condition notes, and app-specific listing text. You review everything before it is saved.
                </p>
              </div>
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-stone-800">
                <Sparkles size={16} />
                Start a task
              </button>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {tools.map(({ title, detail, action, icon: Icon }) => (
                <div key={title} className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-950 text-white">
                    <Icon size={19} />
                  </span>
                  <h2 className="mt-5 text-lg font-semibold text-stone-950">{title}</h2>
                  <p className="mt-2 min-h-16 text-sm leading-6 text-stone-600">{detail}</p>
                  <button className="mt-5 w-full rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100">
                    {action}
                  </button>
                </div>
              ))}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-800">
                    <Wand2 size={18} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Quick actions</p>
                    <h2 className="mt-1 text-xl font-semibold text-stone-950">Pick what you need help with</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left text-sm font-medium leading-6 text-stone-800 transition hover:bg-stone-100"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Recently created</p>
                <div className="mt-4 space-y-3">
                  {runs.map((run) => (
                    <div key={run.task} className="rounded-2xl border border-stone-200 p-4">
                      <p className="font-semibold text-stone-950">{run.task}</p>
                      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-stone-500">
                        <span>{run.result}</span>
                        <span>{run.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-5 w-full rounded-full bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800">
                  View saved results
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}

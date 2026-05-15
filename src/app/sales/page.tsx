import { Banknote, PackageCheck, Printer, Truck } from "lucide-react";
import Header from "@/components/Header";
import ProtectedPage from "@/components/ProtectedPage";

const orders = [
  { item: "Palace knit polo", buyer: "Grailed order", stage: "Pack", net: "$118", due: "Ship today" },
  { item: "Levi's silver tab denim", buyer: "Depop order", stage: "Label ready", net: "$72", due: "Shipping label created" },
  { item: "Oakley software shell", buyer: "eBay order", stage: "Delivered", net: "$210", due: "Review ready" },
  { item: "Bape college tee", buyer: "Offer accepted", stage: "Getting paid", net: "$96", due: "Payment arrives Friday" },
];

const payouts = [
  { platform: "Grailed", amount: "$214", timing: "Expected May 16", status: "On the way" },
  { platform: "Depop", amount: "$146", timing: "Ships after label scan", status: "Waiting" },
  { platform: "eBay", amount: "$252", timing: "Available now", status: "Ready" },
];

const shippingSteps = [
  { label: "Create labels", count: 2, icon: Printer },
  { label: "Pack orders", count: 3, icon: PackageCheck },
  { label: "Drop-off ready", count: 1, icon: Truck },
];

export default function SalesPage() {
  return (
    <ProtectedPage>
      <div className="min-h-screen bg-stone-50 text-stone-950">
        <Header />
        <main className="px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600 shadow-sm">
                  Sales
                </p>
                <h1 className="mt-4 bg-transparent text-3xl font-semibold tracking-[-0.03em] text-stone-950">
                  Orders, payments, and shipping
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                  Track what sold, what needs to ship, and when your money is expected to arrive.
                </p>
              </div>
              <div className="grid grid-cols-3 overflow-hidden rounded-[1.25rem] border border-stone-200 bg-white shadow-sm">
                {[
                  ["Made this month", "$3.8k"],
                  ["Money coming", "$612"],
                  ["To ship", "5"],
                ].map(([label, value]) => (
                  <div key={label} className="border-r border-stone-200 px-5 py-3 last:border-r-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">{label}</p>
                    <p className="mt-2 text-xl font-semibold text-stone-950">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                <div className="border-b border-stone-200 pb-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Recent orders</p>
                  <h2 className="mt-2 text-xl font-semibold text-stone-950">What needs attention</h2>
                </div>
                <div className="mt-2 divide-y divide-stone-200">
                  {orders.map((order) => (
                    <div key={order.item} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-stone-950">{order.item}</h3>
                          <span className="rounded-full border border-stone-200 bg-stone-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600">
                            {order.stage}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-stone-600">{order.buyer}</p>
                        <p className="mt-2 text-xs text-stone-500">{order.due}</p>
                      </div>
                      <p className="text-sm font-semibold text-stone-950">{order.net} after fees</p>
                      <button className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-100">
                        Update
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Shipping steps</p>
                  <div className="mt-4 grid gap-3">
                    {shippingSteps.map(({ label, count, icon: Icon }) => (
                      <button
                        key={label}
                        className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left transition hover:bg-stone-100"
                      >
                        <span className="flex items-center gap-3 text-sm font-semibold text-stone-900">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-800 shadow-sm">
                            <Icon size={17} />
                          </span>
                          {label}
                        </span>
                        <span className="text-lg font-semibold text-stone-950">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-950 text-white">
                      <Banknote size={18} />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Money coming in</p>
                      <h2 className="mt-1 text-lg font-semibold text-stone-950">$612 expected</h2>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {payouts.map((payout) => (
                      <div key={payout.platform} className="rounded-2xl border border-stone-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-stone-950">{payout.platform}</p>
                          <p className="text-sm font-semibold text-stone-950">{payout.amount}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-stone-500">
                          <span>{payout.timing}</span>
                          <span>{payout.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}

import { Search, Tag } from "lucide-react";
import Header from "@/components/Header";
import ProtectedPage from "@/components/ProtectedPage";

const brands = [
  { name: "Arc'teryx", range: "$220-$320", note: "Jackets sell best when condition photos are clear", action: "Check zipper and fabric wear" },
  { name: "Stussy", range: "$45-$140", note: "Jackets and older tees get steady buyer interest", action: "List with measurements" },
  { name: "Oakley", range: "$65-$210", note: "Older technical pieces can sell well, but condition matters", action: "Show logos and flaws" },
  { name: "New Balance", range: "$70-$130", note: "Some recent models are selling lower after restocks", action: "Avoid overpaying" },
];

const categories = [
  { name: "Weather jackets", price: "$90-$280", action: "Only buy if priced low", reason: "Repairs and stains can lower the final sale price." },
  { name: "Vintage skate tees", price: "$28-$85", action: "Good for quick sales", reason: "Clear graphics and readable tags help buyers decide." },
  { name: "Trail sneakers", price: "$55-$135", action: "Check wear first", reason: "Sole wear changes the price quickly." },
  { name: "Loose denim", price: "$30-$95", action: "Good for bundle buys", reason: "Common sizes move more consistently." },
];

const salePrices = [
  { item: "Arc'teryx Beta LT", platform: "Grailed", sold: "$286", note: "Usually sells around this price", why: "Good condition shell with complete photos" },
  { item: "Nike ACG fleece", platform: "eBay", sold: "$94", note: "Prices vary a lot", why: "Color and fleece wear change buyer interest" },
  { item: "Vintage Alien Workshop tee", platform: "Depop", sold: "$68", note: "Good for quick sales", why: "Clean front graphic and wearable size" },
  { item: "Salomon XT-6", platform: "StockX", sold: "$121", note: "Prices dropping recently", why: "Recent restocks lowered some sale prices" },
];

export default function MarketPage() {
  return (
    <ProtectedPage>
      <div className="min-h-screen bg-stone-50 text-stone-950">
        <Header />
        <main className="px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600 shadow-sm">
                  Market guide
                </p>
                <h1 className="mt-4 bg-transparent text-3xl font-semibold tracking-[-0.03em] text-stone-950">
                  What&apos;s selling right now
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                  Use recent sale examples and plain notes to decide what to list, what to buy, and when to price more carefully.
                </p>
              </div>
              <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-3 shadow-sm">
                <Search size={17} className="text-stone-400" />
                <span className="text-sm text-stone-500">Search brands, items, or categories</span>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Brands buyers search for</p>
                <div className="mt-5 space-y-3">
                  {brands.map((brand) => (
                    <div key={brand.name} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="font-semibold text-stone-950">{brand.name}</h2>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700 shadow-sm">{brand.range}</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-stone-500">{brand.note}</p>
                      <p className="mt-3 text-xs font-semibold text-stone-800">{brand.action}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Recent sale prices</p>
                    <h2 className="mt-2 text-xl font-semibold text-stone-950">Similar items and why the price makes sense</h2>
                  </div>
                  <button className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800">
                    Add sale price
                  </button>
                </div>
                <div className="mt-2 divide-y divide-stone-200">
                  {salePrices.map((sale) => (
                    <div key={sale.item} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <p className="font-semibold text-stone-950">{sale.item}</p>
                        <p className="mt-1 text-sm text-stone-500">{sale.platform} - {sale.why}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-sm font-semibold text-stone-950">{sale.sold}</p>
                        <p className="mt-1 text-xs text-stone-500">{sale.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-500">
                  These are example sale references for demo use. In production, Kloset should show the source, date, and item condition for each price.
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-950 text-white">
                  <Tag size={18} />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Categories to watch</p>
                  <h2 className="mt-1 text-xl font-semibold text-stone-950">What to buy, list, or avoid</h2>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {categories.map((category) => (
                  <div key={category.name} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-stone-950">{category.name}</h3>
                      <span className="text-sm font-semibold text-stone-950">{category.price}</span>
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{category.action}</p>
                    <p className="mt-2 text-xs leading-5 text-stone-500">{category.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}

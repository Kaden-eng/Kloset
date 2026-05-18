export type MarketplaceSource = "Grailed" | "eBay" | "Depop" | "StockX" | "GOAT";

export type PricingInput = {
  title: string;
  brand: string;
  category: string;
  condition: string;
  listingPrice?: number | null;
  priceLow?: number | null;
  priceHigh?: number | null;
  tags?: string[];
};

export type SoldComp = {
  id: string;
  title: string;
  platform: MarketplaceSource;
  soldPrice: number;
  conditionNote: string;
  soldDate: string;
};

export type PricingIntelligence = {
  quickSalePrice: number;
  marketPrice: number;
  maxProfitPrice: number;
  confidenceLabel: "Low" | "Medium" | "High";
  confidenceScore: number;
  recentSoldLow: number;
  recentSoldHigh: number;
  averageSoldPrice: number;
  movement: "Trending lower" | "Holding steady" | "Trending higher";
  explanation: string[];
  comps: SoldComp[];
};

const platforms: MarketplaceSource[] = ["Grailed", "eBay", "Depop", "StockX", "GOAT"];

const categoryBase: Record<string, number> = {
  tops: 28,
  apparel: 34,
  outerwear: 86,
  bottoms: 46,
  footwear: 78,
  dresses: 52,
  accessories: 38,
};

const brandMultipliers: Array<{ terms: string[]; multiplier: number; confidence: number; note: string }> = [
  { terms: ["chrome hearts", "rick owens", "balenciaga", "maison margiela", "gucci", "dior", "louis vuitton"], multiplier: 2.05, confidence: 84, note: "Designer brands can sell higher, but condition still drives the final price." },
  { terms: ["supreme", "bape", "kapital", "off-white", "stussy", "arc'teryx", "arcteryx", "oakley"], multiplier: 1.55, confidence: 78, note: "Recognized resale brands get more searches when photos and size are clear." },
  { terms: ["nike", "adidas", "jordan", "new balance", "salomon"], multiplier: 1.2, confidence: 72, note: "Recent restocks can push common models lower, so pricing stays conservative." },
  { terms: ["gap", "old navy", "hollister", "american eagle", "target", "hm", "h&m", "zara", "uniqlo"], multiplier: 0.7, confidence: 70, note: "Mall-brand items usually move best at practical prices." },
];

function hashText(value: string) {
  return value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function moneyRound(value: number) {
  return Math.max(8, Math.round(value));
}

function conditionMultiplier(condition: string) {
  const normalized = condition.toLowerCase();
  if (normalized.includes("new")) return 1.08;
  if (normalized.includes("like")) return 1;
  if (normalized.includes("good")) return 0.86;
  if (normalized.includes("fair")) return 0.68;
  return 0.8;
}

function categoryPrice(category: string) {
  return categoryBase[category.toLowerCase()] ?? categoryBase.apparel;
}

function brandProfile(brand: string) {
  const normalized = brand.toLowerCase();
  return brandMultipliers.find((profile) => profile.terms.some((term) => normalized.includes(term))) ?? {
    multiplier: 0.95,
    confidence: 58,
    note: "With unknown brands, recent sold prices matter more than brand name.",
  };
}

function conservativeBase(input: PricingInput) {
  const savedPrice = input.listingPrice && input.listingPrice > 0 ? input.listingPrice : null;
  if (savedPrice) return savedPrice;

  const profile = brandProfile(input.brand);
  return moneyRound(categoryPrice(input.category) * profile.multiplier * conditionMultiplier(input.condition));
}

function platformModifier(platform: MarketplaceSource, category: string, brand: string) {
  const categoryName = category.toLowerCase();
  const brandName = brand.toLowerCase();
  if ((platform === "StockX" || platform === "GOAT") && categoryName.includes("footwear")) return 1.08;
  if ((platform === "StockX" || platform === "GOAT") && !categoryName.includes("footwear")) return 0.82;
  if (platform === "Depop" && /(gap|old navy|zara|uniqlo|hollister|american eagle)/.test(brandName)) return 0.92;
  if (platform === "Grailed" && /(rick owens|supreme|stussy|arc'teryx|arcteryx|oakley)/.test(brandName)) return 1.08;
  if (platform === "eBay") return 0.96;
  return 1;
}

function buildComps(input: PricingInput, marketPrice: number): SoldComp[] {
  const seed = hashText(`${input.brand}-${input.title}-${input.category}`);
  const condition = input.condition || "Good";
  const soldDates = ["May 11, 2026", "May 4, 2026", "April 28, 2026", "April 19, 2026", "April 12, 2026"];

  return platforms.map((platform, index) => {
    const variance = ((seed + index * 17) % 19) - 9;
    const price = moneyRound(marketPrice * platformModifier(platform, input.category, input.brand) * (1 + variance / 100));
    const conditionNote =
      condition.toLowerCase().includes("fair")
        ? "Visible wear shown"
        : condition.toLowerCase().includes("new")
          ? "New or unworn"
          : index % 2 === 0
            ? "Good condition"
            : "Minor wear noted";

    return {
      id: `${platform}-${seed}-${index}`,
      title: `${input.brand || "Unbranded"} ${input.category || "item"}`.trim(),
      platform,
      soldPrice: price,
      conditionNote,
      soldDate: soldDates[index],
    };
  });
}

export function getPricingIntelligence(input: PricingInput): PricingIntelligence {
  const base = conservativeBase(input);
  const profile = brandProfile(input.brand);
  const conditionFactor = conditionMultiplier(input.condition);
  const priceLow = input.priceLow && input.priceLow > 0 ? input.priceLow : null;
  const priceHigh = input.priceHigh && input.priceHigh > 0 ? input.priceHigh : null;
  const seed = hashText(`${input.title}-${input.brand}-${input.category}`);

  const marketPrice = moneyRound(base * clamp(conditionFactor + 0.12, 0.72, 1.08));
  const quickSalePrice = moneyRound(priceLow ?? marketPrice * 0.82);
  const maxProfitPrice = moneyRound(priceHigh ?? marketPrice * 1.16);
  const comps = buildComps(input, marketPrice);
  const compPrices = comps.map((comp) => comp.soldPrice);
  const recentSoldLow = Math.min(...compPrices);
  const recentSoldHigh = Math.max(...compPrices);
  const averageSoldPrice = moneyRound(compPrices.reduce((sum, price) => sum + price, 0) / compPrices.length);

  const spread = recentSoldHigh - recentSoldLow;
  const confidenceScore = clamp(Math.round(profile.confidence - spread / 8 + (input.brand ? 6 : 0)), 38, 88);
  const confidenceLabel = confidenceScore >= 74 ? "High" : confidenceScore >= 58 ? "Medium" : "Low";
  const movement = seed % 5 === 0 ? "Trending lower" : seed % 4 === 0 ? "Trending higher" : "Holding steady";

  const explanation = [
    `Usually sells between $${recentSoldLow}-$${recentSoldHigh}.`,
    profile.note,
    movement === "Trending lower"
      ? "Recent sales are trending lower, so a faster price is safer."
      : movement === "Trending higher"
        ? "Recent sales are slightly stronger, but the max price may take longer."
        : "Recent sales are steady, so the market price is a reasonable starting point.",
    conditionFactor >= 1 ? "Items in better condition sell faster." : "Wear lowers the safe starting price.",
  ];

  return {
    quickSalePrice,
    marketPrice,
    maxProfitPrice,
    confidenceLabel,
    confidenceScore,
    recentSoldLow,
    recentSoldHigh,
    averageSoldPrice,
    movement,
    explanation,
    comps,
  };
}

export const marketTrendBrands = [
  { name: "Arc'teryx", range: "$180-$310", movement: "Holding steady", note: "Clean shells still sell well when flaws are photographed." },
  { name: "Stussy", range: "$35-$120", movement: "Trending higher", note: "Older tees and jackets are getting steady searches." },
  { name: "New Balance", range: "$55-$125", movement: "Trending lower", note: "Restocks are keeping many recent models realistic." },
  { name: "Oakley", range: "$45-$190", movement: "Holding steady", note: "Technical pieces depend heavily on condition and logos." },
  { name: "Zara", range: "$18-$42", movement: "Holding steady", note: "Basic mall-brand pieces need practical prices to move." },
];

export const popularMarketCategories = [
  { name: "Outerwear", range: "$60-$180", note: "Check stains, zippers, and fabric wear first." },
  { name: "Footwear", range: "$45-$140", note: "Sole wear changes value quickly." },
  { name: "Graphic tees", range: "$18-$65", note: "Readable tags and clear graphics help." },
  { name: "Denim", range: "$28-$85", note: "Measurements matter more than brand for many pairs." },
];


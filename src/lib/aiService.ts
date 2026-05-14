"use client";

export interface AIAnalysisResult {
  brand: string;
  category: string;
  condition: string;
  estimated_price: number;
  price_low: number;
  price_high: number;
  demand_score: number;
  confidence_score?: number;
  market_demand?: string;
  sell_through_estimate?: string;
  tags: string[];
  generated_title?: string;
  generated_description?: string;
  marketplaces: {
    platform: string;
    estimated_sale_price: number;
    estimated_sell_speed: string;
    fee_estimate: number;
    demand_rating: string;
  }[];
}

const brandTier = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('supreme') || lower.includes('gucci') || lower.includes('balenciaga') || lower.includes('prada') || lower.includes('chanel')) return { brand: 'Supreme', multiplier: 2.3, label: 'Luxury' };
  if (lower.includes('off-white') || lower.includes('fear of god') || lower.includes('amiri') || lower.includes('saint laurent')) return { brand: 'Designer', multiplier: 2.1, label: 'Designer' };
  if (lower.includes('nike') || lower.includes('adidas') || lower.includes('jordan') || lower.includes('puma')) return { brand: 'Nike', multiplier: 1.0, label: 'Premium' };
  if (lower.includes('champion') || lower.includes('carhartt') || lower.includes('converse') || lower.includes('new balance')) return { brand: 'Champion', multiplier: 0.85, label: 'Heritage' };
  if (lower.includes('hollister') || lower.includes('ae') || lower.includes('aerie') || lower.includes('old navy') || lower.includes('gap') || lower.includes('target')) return { brand: 'Hollister', multiplier: 0.5, label: 'Accessible' };
  if (lower.includes('levis') || lower.includes('levi')) return { brand: "Levi's", multiplier: 0.7, label: 'Heritage' };
  if (lower.includes('cos') || lower.includes('ssense') || lower.includes('all saints') || lower.includes('uniqlo')) return { brand: 'COS', multiplier: 1.1, label: 'Contemporary' };
  return { brand: 'Modern label', multiplier: 0.85, label: 'Contemporary' };
};

const guessCategory = (name: string) => {
  const lower = name.toLowerCase();
  if (/hoodie|sweatshirt|jacket|coat|blazer|parka|anorak/.test(lower)) return 'Outerwear';
  if (/jean|denim|pants|trouser|cargo|shorts/.test(lower)) return 'Bottoms';
  if (/sneaker|shoe|boot|footwear|trainer/.test(lower)) return 'Footwear';
  if (/dress|gown|skirt/.test(lower)) return 'Dresses';
  if (/shirt|tee|t-shirt|top|blouse|bodysuit/.test(lower)) return 'Tops';
  return 'Apparel';
};

const detectRarity = (name: string) => {
  const lower = name.toLowerCase();
  if (/vintage|archive|deadstock|limited|rare|sample|collab|collaboration|exclusive/.test(lower)) return 'Archive';
  if (/heritage|collector|premium|special edition|premium/.test(lower)) return 'Rare';
  return 'Standard';
};

const categoryBasePrice = (category: string, name: string) => {
  const lowerName = name.toLowerCase();

  if (category === 'Tops') {
    if (/tee|t-shirt|tank|graphic|short sleeve/.test(lowerName)) return 14;
    if (/shirt|blouse|top|polo/.test(lowerName)) return 30;
    return 36;
  }

  if (category === 'Outerwear') {
    if (/jacket|blazer/.test(lowerName)) return 130;
    if (/coat|parka|anorak/.test(lowerName)) return 170;
    return 150;
  }

  if (category === 'Bottoms') {
    if (/jean|denim/.test(lowerName)) return 82;
    if (/cargo|trouser/.test(lowerName)) return 78;
    return 88;
  }

  if (category === 'Footwear') {
    if (/sneaker|trainer/.test(lowerName)) return 160;
    if (/boot/.test(lowerName)) return 140;
    return 150;
  }

  if (category === 'Dresses') return 110;
  return 60;
};

const conditionFactor = (condition: string) => {
  const lower = condition.toLowerCase();
  if (lower.includes('excellent') || lower.includes('new') || lower.includes('deadstock')) return 1.0;
  if (lower.includes('very good') || lower.includes('near') || lower.includes('mint')) return 0.9;
  if (lower.includes('good') || lower.includes('well-kept')) return 0.75;
  if (lower.includes('fair') || lower.includes('worn')) return 0.62;
  return 0.8;
};

const estimateDemand = (score: number) => {
  if (score > 88) return 'Strong demand';
  if (score > 72) return 'Healthy demand';
  if (score > 55) return 'Moderate demand';
  return 'Soft demand';
};

const estimateSellSpeed = (score: number) => {
  if (score > 88) return '1-2 weeks';
  if (score > 72) return '2-4 weeks';
  if (score > 55) return '4-6 weeks';
  return '6-8 weeks';
};

const detectCondition = (name: string) => {
  const lower = name.toLowerCase();
  if (/deadstock|ds|new|mint/.test(lower)) return 'Excellent';
  if (/very good|near mint|nm|excellent/.test(lower)) return 'Very Good';
  if (/good|well-kept|gently worn/.test(lower)) return 'Good';
  if (/fair|worn|distressed|used/.test(lower)) return 'Fair';
  return 'Very Good';
};

const detectRarityMultiplier = (rarity: string) => {
  if (rarity === 'Archive') return 1.28;
  if (rarity === 'Rare') return 1.12;
  return 1.0;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const buildMarketplaceEstimate = (
  price: number,
  score: number,
  platform: string,
  category: string,
  brandLabel: string
) => {
  const platformModifiers: Record<string, number> = {
    Grailed: 1.03,
    eBay: 0.94,
    Depop: 0.87,
    StockX: category === 'Footwear' ? 1.12 : 1.04,
    GOAT: category === 'Footwear' ? 1.08 : 0.92,
    Vestiaire: brandLabel === 'Luxury' || brandLabel === 'Designer' ? 1.1 : 0.95,
    TheRealReal: brandLabel === 'Luxury' || brandLabel === 'Designer' ? 1.07 : 0.92,
    Poshmark: 0.84,
  };

  const multiplier = platformModifiers[platform] ?? 0.95;
  const estimate = Math.round(price * multiplier * (0.95 + (score - 60) / 400));
  const feeEstimate = platform === 'StockX' || platform === 'GOAT' ? 14 : platform === 'TheRealReal' || platform === 'Vestiaire' ? 12 : 10;

  return {
    platform,
    estimated_sale_price: Math.max(8, estimate),
    estimated_sell_speed: estimateSellSpeed(clamp(score + (platform === 'Poshmark' ? -5 : 0), 40, 98)),
    fee_estimate: feeEstimate,
    demand_rating: score > 78 ? 'High' : score > 64 ? 'Medium' : 'Low',
  };
};

export class AIService {
  async analyzeItem(imageFile: File): Promise<AIAnalysisResult> {
    await new Promise(resolve => setTimeout(resolve, 2200));

    const name = imageFile.name || 'fashion item';
    const category = guessCategory(name);
    const brandInfo = brandTier(name);
    const rarity = detectRarity(name);
    const condition = detectCondition(name);
    const conditionMult = conditionFactor(condition);
    const rarityMult = detectRarityMultiplier(rarity);
    const base = categoryBasePrice(category, name);
    const recentSalesBoost = /sold|recent|last week|new arrival/.test(name.toLowerCase()) ? 1.07 : 1.0;
    const marketSignal = clamp(
      0.82 + (brandInfo.multiplier - 0.85) * 0.08 + (conditionMult - 0.8) * 0.12 + (rarity === 'Archive' ? 0.08 : 0) + (category === 'Footwear' ? 0.06 : 0),
      0.75,
      1.22
    );

    const estimatedPrice = Math.max(8, Math.round(base * brandInfo.multiplier * conditionMult * rarityMult * marketSignal * recentSalesBoost));
    const priceLow = Math.max(8, Math.round(estimatedPrice * 0.74));
    const priceHigh = Math.round(estimatedPrice * (rarity === 'Archive' ? 1.25 : 1.12));
    const demandScore = clamp(
      Math.round(50 + (brandInfo.multiplier - 0.8) * 16 + (conditionMult - 0.8) * 13 + (rarity === 'Archive' ? 8 : 0) + (category === 'Footwear' ? 8 : 0)),
      36,
      96
    );
    const confidenceScore = clamp(Math.round(demandScore + 6), 54, 96);

    const itemType = category === 'Outerwear'
      ? 'Hoodie'
      : category === 'Footwear'
      ? 'Sneakers'
      : category === 'Bottoms'
      ? 'Denim'
      : category === 'Dresses'
      ? 'Dress'
      : 'T-Shirt';

    const title = `${brandInfo.brand} ${itemType}${name.toLowerCase().includes('vintage') ? ' — Vintage' : ''}`;
    const description = `A ${condition.toLowerCase()} ${category.toLowerCase()} piece from ${brandInfo.brand}. Estimated resale pricing and demand are based on current marketplace signals.`;

    return {
      brand: brandInfo.brand,
      category,
      condition,
      estimated_price: estimatedPrice,
      price_low: priceLow,
      price_high: priceHigh,
      demand_score: demandScore,
      confidence_score: confidenceScore,
      market_demand: estimateDemand(demandScore),
      sell_through_estimate: estimateSellSpeed(demandScore),
      tags: [brandInfo.label, category, 'Vintage', 'Contemporary'].slice(0, 4),
      generated_title: title,
      generated_description: description,
      marketplaces: [
        'Grailed',
        'eBay',
        'Depop',
        'StockX',
        'GOAT',
        'Vestiaire',
        'TheRealReal',
        'Poshmark',
      ].map((platform) => buildMarketplaceEstimate(estimatedPrice, demandScore, platform, category, brandInfo.label)),
    };
  }

  async saveAnalysis(userId: string, analysis: AIAnalysisResult): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

export const aiService = new AIService();
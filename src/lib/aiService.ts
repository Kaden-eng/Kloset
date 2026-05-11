"use client";

export interface AIAnalysisResult {
  brand: string;
  category: string;
  condition: string;
  estimated_price: number;
  price_low: number;
  price_high: number;
  demand_score: number;
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

export class AIService {
  async analyzeItem(imageFile: File): Promise<AIAnalysisResult> {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2500));

    // For demo purposes, we'll return realistic analysis based on image characteristics
    // In a real implementation, this would call an AI service like OpenAI Vision, Google Vision, etc.

    // Mock analysis - in production, this would analyze the actual image
    const mockResults: AIAnalysisResult[] = [
      {
        brand: "Supreme",
        category: "Outerwear",
        condition: "Excellent",
        estimated_price: 1250,
        price_low: 1100,
        price_high: 1400,
        demand_score: 85,
        tags: ["Vintage", "Box Logo", "Rare", "Collector"],
        generated_title: "Supreme Box Logo Hooded Sweatshirt - Black",
        generated_description: "Authentic Supreme Box Logo hooded sweatshirt in excellent condition. Classic black colorway with the iconic box logo design.",
        marketplaces: [
          { platform: "Grailed", estimated_sale_price: 1350, estimated_sell_speed: "1-2 weeks", fee_estimate: 13, demand_rating: "High" },
          { platform: "StockX", estimated_sale_price: 1400, estimated_sell_speed: "1 week", fee_estimate: 19, demand_rating: "Very High" },
          { platform: "eBay", estimated_sale_price: 1250, estimated_sell_speed: "2-4 weeks", fee_estimate: 15, demand_rating: "Medium" },
        ]
      },
      {
        brand: "Nike",
        category: "Footwear",
        condition: "Like New",
        estimated_price: 180,
        price_low: 160,
        price_high: 200,
        demand_score: 75,
        tags: ["Retro", "Air Jordan", "Size 10", "Deadstock"],
        generated_title: "Nike Air Jordan 1 Retro High OG - Chicago",
        generated_description: "Nike Air Jordan 1 Retro High OG in the classic Chicago colorway. Size 10 in men's. Excellent condition with minimal wear.",
        marketplaces: [
          { platform: "StockX", estimated_sale_price: 200, estimated_sell_speed: "3-5 days", fee_estimate: 14, demand_rating: "High" },
          { platform: "GOAT", estimated_sale_price: 190, estimated_sell_speed: "1-2 weeks", fee_estimate: 12, demand_rating: "High" },
          { platform: "Flight Club", estimated_sale_price: 180, estimated_sell_speed: "1-2 weeks", fee_estimate: 11, demand_rating: "Medium" },
        ]
      },
      {
        brand: "Levi's",
        category: "Bottoms",
        condition: "Good",
        estimated_price: 95,
        price_low: 85,
        price_high: 110,
        demand_score: 60,
        tags: ["501", "Vintage", "Selvedge", "Raw Denim"],
        generated_title: "Levi's 501 Original Fit Jeans - Raw Selvedge",
        generated_description: "Classic Levi's 501 Original Fit jeans in raw selvedge denim. Size 32x32. Good vintage condition with natural fading.",
        marketplaces: [
          { platform: "Grailed", estimated_sale_price: 110, estimated_sell_speed: "2-4 weeks", fee_estimate: 9, demand_rating: "Medium" },
          { platform: "Depop", estimated_sale_price: 95, estimated_sell_speed: "1-2 weeks", fee_estimate: 8, demand_rating: "Medium" },
          { platform: "eBay", estimated_sale_price: 100, estimated_sell_speed: "3-4 weeks", fee_estimate: 10, demand_rating: "Low" },
        ]
      }
    ];

    // Randomly select one of the mock results for demo purposes
    const randomIndex = Math.floor(Math.random() * mockResults.length);
    return mockResults[randomIndex];
  }

  async saveAnalysis(userId: string, analysis: AIAnalysisResult): Promise<void> {
    // In a real implementation, this would save the analysis to a database
    // For now, we'll just simulate the save
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

export const aiService = new AIService();
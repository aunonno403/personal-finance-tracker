import { Category, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/types/finance";

// Keyword mappings for deterministic category suggestion
const EXPENSE_CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: [
    "restaurant",
    "food",
    "pizza",
    "burger",
    "lunch",
    "dinner",
    "breakfast",
    "cafe",
    "grocery",
    "market",
    "bakery",
    "meal",
    "eat",
    "cook",
  ],
  Transport: [
    "uber",
    "taxi",
    "gas",
    "petrol",
    "fuel",
    "parking",
    "bus",
    "train",
    "metro",
    "bike",
    "car",
    "travel",
    "commute",
    "ride",
  ],
  Rent: [
    "rent",
    "mortgage",
    "apartment",
    "house",
    "room",
    "landlord",
    "lease",
    "accommodation",
  ],
  Shopping: [
    "shop",
    "store",
    "mall",
    "buy",
    "purchase",
    "clothes",
    "amazon",
    "retail",
    "apparel",
    "fashion",
    "shopping",
  ],
  Entertainment: [
    "movie",
    "cinema",
    "ticket",
    "game",
    "concert",
    "show",
    "entertainment",
    "play",
    "streaming",
    "netflix",
    "spotify",
    "music",
  ],
  Health: [
    "doctor",
    "hospital",
    "pharmacy",
    "medicine",
    "health",
    "medical",
    "clinic",
    "gym",
    "fitness",
    "wellness",
    "checkup",
  ],
  Education: [
    "school",
    "college",
    "university",
    "tuition",
    "course",
    "class",
    "education",
    "exam",
    "book",
    "training",
    "learn",
  ],
  Bills: [
    "electric",
    "water",
    "internet",
    "phone",
    "utility",
    "bill",
    "subscription",
    "membership",
    "invoice",
  ],
  Cigarettes: [
    "cigarette",
    "smoke",
    "smoking",
    "tobacco",
    "cigar",
    "vape",
    "nicotine",
  ],
};

const INCOME_CATEGORY_KEYWORDS: Record<string, string[]> = {
  Salary: [
    "salary",
    "paycheck",
    "payroll",
    "wage",
    "compensation",
    "employment",
    "job",
    "monthly",
    "bi-weekly",
  ],
  Freelance: [
    "freelance",
    "contract",
    "consultant",
    "project",
    "gig",
    "self-employed",
    "client",
    "invoice",
  ],
  Investment: [
    "investment",
    "dividend",
    "return",
    "yield",
    "interest",
    "stock",
    "bond",
    "mutual fund",
    "crypto",
  ],
  Bonus: [
    "bonus",
    "incentive",
    "commission",
    "performance",
    "reward",
    "extra",
  ],
  Gift: [
    "gift",
    "present",
    "donation",
    "received",
    "from friend",
    "from family",
  ],
  Refund: [
    "refund",
    "reimbursement",
    "return",
    "cashback",
    "chargeback",
  ],
};

/**
 * Suggest a category based on transaction description using keyword matching
 * Falls back to "Others" if no keywords match
 */
export function suggestCategory(description: string, type: "income" | "expense"): Category {
  const lowerDesc = description.toLowerCase();
  const keywords =
    type === "income" ? INCOME_CATEGORY_KEYWORDS : EXPENSE_CATEGORY_KEYWORDS;

  // Score each category based on keyword matches
  let bestMatch: Category = type === "income" ? "Others" : "Others";
  let bestScore = 0;

  for (const [category, categoryKeywords] of Object.entries(keywords)) {
    let score = 0;

    for (const keyword of categoryKeywords) {
      if (lowerDesc.includes(keyword)) {
        score++;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = category as Category;
    }
  }

  return bestMatch;
}

/**
 * Analyze monthly transactions and provide insights
 */
export interface MonthlyInsight {
  topCategory: Category;
  topCategoryAmount: number;
  spendTrend: "increasing" | "decreasing" | "stable";
  budgetRiskLevel: "safe" | "warning" | "danger";
  totalExpense: number;
  message: string;
}

export function generateMonthlyInsights(
  currentMonthExpenses: number,
  lastMonthExpenses: number,
  categoryDistribution: Array<{ category: Category; total: number }>,
  monthlyBudget: number,
): MonthlyInsight {
  // Find top spending category
  const topCategory =
    categoryDistribution.length > 0
      ? (categoryDistribution[0].category as Category)
      : ("Others" as Category);
  const topCategoryAmount =
    categoryDistribution.length > 0 ? categoryDistribution[0].total : 0;

  // Determine spend trend
  const trendDifference = currentMonthExpenses - lastMonthExpenses;
  let spendTrend: "increasing" | "decreasing" | "stable";
  if (Math.abs(trendDifference) < monthlyBudget * 0.05) {
    spendTrend = "stable";
  } else if (trendDifference > 0) {
    spendTrend = "increasing";
  } else {
    spendTrend = "decreasing";
  }

  // Determine budget risk level
  const spendRatio = currentMonthExpenses / monthlyBudget;
  let budgetRiskLevel: "safe" | "warning" | "danger";
  if (spendRatio < 0.6) {
    budgetRiskLevel = "safe";
  } else if (spendRatio < 0.85) {
    budgetRiskLevel = "warning";
  } else {
    budgetRiskLevel = "danger";
  }

  // Generate message
  let message = `This month you spent ${new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
  }).format(currentMonthExpenses)} on ${topCategory.toLowerCase()}.`;

  if (spendTrend === "increasing") {
    message += " Your spending is increasing compared to last month.";
  } else if (spendTrend === "decreasing") {
    message += " Great! Your spending is decreasing compared to last month.";
  }

  if (budgetRiskLevel === "danger") {
    message += " ⚠️ You're close to exceeding your budget!";
  } else if (budgetRiskLevel === "warning") {
    message += " 📊 You're approaching your budget limit.";
  }

  return {
    topCategory,
    topCategoryAmount,
    spendTrend,
    budgetRiskLevel,
    totalExpense: currentMonthExpenses,
    message,
  };
}

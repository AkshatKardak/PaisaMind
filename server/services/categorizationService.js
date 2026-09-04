const CategoryRule = require("../models/CategoryRule");

const STANDARD_CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Shopping",
  "Entertainment",
  "Healthcare",
  "Education",
  "Travel",
  "Software Subscriptions",
  "Business",
  "Marketing",
  "Office",
  "Salary",
  "Freelance Income",
  "Investment",
  "Loan/EMI",
  "Insurance",
  "Taxes",
  "Other",
];

const MERCHANT_DICTIONARY = [
  // Software & Subscriptions
  { keywords: ["aws", "amazon web services", "digitalocean", "vercel", "render", "github", "gitlab", "figma", "adobe", "canva", "chatgpt", "openai", "claude", "jetbrains", "cursor", "notion", "slack", "zoom", "google workspace", "google one", "icloud", "godaddy", "namecheap", "hostinger", "cloudflare", "mongodb atlas"], category: "Software Subscriptions", confidence: 0.95 },
  // Food & Dining
  { keywords: ["swiggy", "zomato", "blinkit", "zepto", "instamart", "mcdonalds", "starbucks", "dominos", "pizza", "kfc", "burger", "cafe", "restaurant", "dmart", "spencer", "supermarket", "groceries", "chai", "bakery"], category: "Food", confidence: 0.92 },
  // Transport & Travel
  { keywords: ["uber", "ola", "rapido", "irctc", "petrol", "fuel", "hpcl", "bpcl", "ioc", "shell", "metro", "fastag", "toll", "indigo", "air india", "vistara", "makemytrip", "goibibo", "cleartrip", "airbnb", "hotel", "oyo"], category: "Transport", confidence: 0.90 },
  // Utilities & Internet
  { keywords: ["airtel", "jio", "vi", "vodafone", "act fibernet", "broadband", "bescom", "msedcl", "tata power", "electricity", "water bill", "cylinder", "indane", "hp gas", "bharat gas"], category: "Utilities", confidence: 0.93 },
  // Housing & Rent
  { keywords: ["rent", "maintenance", "society", "nobroker", "housing", "landlord"], category: "Housing", confidence: 0.88 },
  // Shopping
  { keywords: ["amazon", "flipkart", "myntra", "ajio", "meesho", "zara", "h&m", "croma", "reliance digital", "apple store", "decathlon", "nykaa"], category: "Shopping", confidence: 0.90 },
  // Entertainment
  { keywords: ["netflix", "prime video", "hotstar", "spotify", "youtube", "bookmyshow", "steam", "playstation", "cinema", "pvr", "inox"], category: "Entertainment", confidence: 0.94 },
  // Healthcare
  { keywords: ["apollo", "pharma", "1mg", "netmeds", "medplus", "hospital", "clinic", "doctor", "dental", "pathology", "diagnostic"], category: "Healthcare", confidence: 0.91 },
  // Education
  { keywords: ["udemy", "coursera", "edx", "kindle", "books", "bootcamp", "pluralsight", "linkedin learning", "skillshare"], category: "Education", confidence: 0.92 },
  // Business & Office
  { keywords: ["wework", "awfis", "coworking", "innov8", "office supplies", "stationary", "printing", "ca fees", "legal", "audit fee"], category: "Business", confidence: 0.89 },
  // Marketing & Ads
  { keywords: ["facebook ads", "meta ads", "google ads", "adwords", "linkedin ads", "twitter ads", "mailchimp", "brevo", "convertkit"], category: "Marketing", confidence: 0.93 },
  // Freelance & Client Income
  { keywords: ["upwork", "fiverr", "toptal", "paypal", "stripe", "razorpay", "client payment", "retainer", "neft cr", "rtgs cr", "imps cr", "upi cr", "salary", "inward remittance", "invoice payment"], category: "Freelance Income", confidence: 0.95 },
  // Investment
  { keywords: ["zerodha", "groww", "kuvera", "indmoney", "mutual fund", "sip", "coin", "angelone", "smallcase", "cdsl", "nsdl", "ppf", "nps"], category: "Investment", confidence: 0.95 },
  // Loan & EMI
  { keywords: ["emi", "loan", "bajaj finance", "credit card", "cred payment", "hdfc bank loan", "icici bank loan", "sbi loan"], category: "Loan/EMI", confidence: 0.92 },
  // Insurance
  { keywords: ["lic", "hdfc ergo", "star health", "care health", "max life", "icici lombard", "policybazaar", "acko"], category: "Insurance", confidence: 0.94 },
  // Taxes
  { keywords: ["income tax", "gst payment", "advance tax", "challan 280", "tds payment", "cbic", "nsdl tax"], category: "Taxes", confidence: 0.96 },
];

/**
 * Predicts category and confidence for a transaction description
 */
const categorizeTransaction = async (userId, description = "", type = "expense") => {
  const text = (description || "").toLowerCase().trim();

  // 1. Check user custom rules first (highest priority)
  if (userId) {
    try {
      const userRules = await CategoryRule.find({ userId });
      for (const rule of userRules) {
        const pattern = rule.pattern.toLowerCase();
        if (rule.matchType === "exact" && text === pattern) {
          return { category: rule.category, confidence: 0.99, source: "user_rule" };
        } else if (rule.matchType === "contains" && text.includes(pattern)) {
          return { category: rule.category, confidence: 0.95, source: "user_rule" };
        } else if (rule.matchType === "regex") {
          try {
            const re = new RegExp(pattern, "i");
            if (re.test(text)) return { category: rule.category, confidence: 0.95, source: "user_rule" };
          } catch (e) {
            // ignore invalid regex
          }
        }
      }
    } catch (e) {
      // ignore DB read failure
    }
  }

  // 2. Default income category if type is income
  if (type === "income") {
    for (const item of MERCHANT_DICTIONARY) {
      if (item.category === "Freelance Income" || item.category === "Investment") {
        if (item.keywords.some((kw) => text.includes(kw))) {
          return { category: item.category, confidence: item.confidence, source: "dictionary" };
        }
      }
    }
    return { category: "Freelance Income", confidence: 0.80, source: "default_income" };
  }

  // 3. Match against Merchant Dictionary
  for (const item of MERCHANT_DICTIONARY) {
    for (const kw of item.keywords) {
      if (text.includes(kw)) {
        return { category: item.category, confidence: item.confidence, source: "dictionary" };
      }
    }
  }

  return { category: "Other", confidence: 0.40, source: "fallback" };
};

/**
 * Saves a user categorization override for future automatic classification
 */
const learnCategoryCorrection = async (userId, pattern, category, transactionType = "any") => {
  if (!userId || !pattern || !category) return;
  const cleanPattern = pattern.toLowerCase().trim();
  if (cleanPattern.length < 3) return;

  await CategoryRule.findOneAndUpdate(
    { userId, pattern: cleanPattern },
    {
      category,
      matchType: "contains",
      transactionType,
      source: "user_correction",
      $inc: { usageCount: 1 },
    },
    { upsert: true, new: true }
  );
};

module.exports = {
  STANDARD_CATEGORIES,
  categorizeTransaction,
  learnCategoryCorrection,
};

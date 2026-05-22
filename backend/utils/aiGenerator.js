const generateQuestions = async (title, description, category) => {
  const t = (title || "").toLowerCase();
  const d = (description || "").toLowerCase();
  const cat = (category || "").toLowerCase();

  // HEURISTIC LOCAL FALLBACK (Always reliable, returns very contextual questions)
  const getLocalFallback = () => {
    // Electronics / Phone / Laptop / Tablet
    if (cat.includes("electronics") || t.includes("phone") || t.includes("iphone") || t.includes("laptop") || t.includes("macbook") || t.includes("ipad") || d.includes("screen") || d.includes("charger")) {
      return [
        "What is the lock screen wallpaper or background image?",
        "What is the brand, color, or style of the protective case or any unique stickers/scratches?",
      ];
    }
    // Wallet / Cards / IDs / Documents
    if (cat.includes("document") || cat.includes("card") || t.includes("wallet") || t.includes("card") || t.includes("id") || t.includes("license") || d.includes("cash") || d.includes("photo")) {
      return [
        "What is the full name, ID number, or specific cards/receipts stored inside?",
        "What other specific items, colors, or photos are inside?",
      ];
    }
    // Keys / Fobs
    if (t.includes("key") || t.includes("fob") || d.includes("keychain") || d.includes("ring")) {
      return [
        "What keychains, ornaments, or accessories are attached to the key ring?",
        "How many keys are on the ring and what specific brands/types are they (e.g. car, dorm)?",
      ];
    }
    // Bags / Backpacks / Purses
    if (cat.includes("bag") || t.includes("bag") || t.includes("backpack") || t.includes("purse") || d.includes("zipper") || d.includes("compartment")) {
      return [
        "What is the brand, color, or pattern of the interior lining?",
        "What specific contents (e.g. specific notebooks, cosmetics, snacks) are in the pockets?",
      ];
    }
    // General Fallback
    return [
      "Can you describe any unique markings, scratches, stickers, brand names, or colors on the item?",
      "What are the specific contents or matching accessories that go with this item?",
    ];
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    console.log("ℹ️ No GEMINI_API_KEY set. Using local heuristic fallback for security questions.");
    return getLocalFallback();
  }

  try {
    const prompt = `You are a security question generator for a campus lost and found app.
Based on the following item details:
Title: "${title}"
Description: "${description}"
Category: "${category}"

Generate exactly 1 or 2 specific, open-ended verification questions that the finder can ask a potential owner to prove ownership.
The questions should ask about hidden details that only the true owner would know, but are NOT already explicitly revealed in the title or description.
For example, if the item is a wallet, ask "What are the names on the cards inside?" or "What color is the inner lining?". If it's a phone, ask "What is the lock screen wallpaper?".
Keep the questions professional, clear, and direct.
Do NOT reveal the answers to the questions in the question itself.
Do NOT include any introductory or concluding text, only return the questions as a JSON array of strings, e.g., ["question 1", "question 2"].`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "A list of exactly 1 or 2 specific open-ended security questions.",
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (textResult) {
      const parsed = JSON.parse(textResult.trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 2);
      }
    }
    throw new Error("Invalid or empty response format from Gemini API");
  } catch (err) {
    console.error("⚠️ AI question generation failed, falling back to heuristics:", err.message);
    return getLocalFallback();
  }
};

const generateClaimQuestions = async (item) => {
  const title = item.title || "";
  const description = item.description || "";
  const category = item.category || "";
  const location = item.location || "";
  const color = item.color || "";
  const brand = item.brand || "";

  const base = await generateQuestions(title, description, category);
  const questions = [...base];

  const hidden = (item.verificationQuestions || [])
    .map((q) => (typeof q === "string" ? q : q.question))
    .filter(Boolean);

  hidden.forEach((q) => {
    if (!questions.includes(q)) questions.push(q);
  });

  const ctx = `${title} ${description} ${category} ${location} ${color} ${brand}`.toLowerCase();

  if (color && !questions.some((q) => /color/i.test(q))) {
    questions.push(`What color is the item (you mentioned: not in public listing)?`);
  }
  if (brand && !questions.some((q) => /brand/i.test(q))) {
    questions.push("What brand or model is it?");
  }
  if (/phone|iphone|android/i.test(ctx) && !questions.some((q) => /wallpaper|case/i.test(q))) {
    questions.push("What is the phone brand and case/wallpaper description?");
  }
  if (/wallet|bag|backpack/i.test(ctx) && !questions.some((q) => /inside|contents/i.test(q))) {
    questions.push("What items are inside or any unique marks?");
  }

  return [...new Set(questions.map((q) => String(q).trim()).filter(Boolean))].slice(0, 8);
};

module.exports = { generateQuestions, generateClaimQuestions };

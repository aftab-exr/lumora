import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const JOURNAL_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    mood_label: {
      type: Type.STRING,
      description:
        "Single-word dominant emotion such as Energized, Focused, Calm, Grateful, Stressed, Tired, or Anxious.",
    },
    sentiment_score: {
      type: Type.NUMBER,
      description:
        "Emotional polarity score ranging from -1.0 (very negative) to 1.0 (very positive).",
    },
    reflection_score: {
      type: Type.INTEGER,
      description:
        "Score from 0 to 100 evaluating emotional positivity, self-awareness, and constructive reflection.",
    },
    ai_insight: {
      type: Type.STRING,
      description:
        "One concise, actionable, supportive sentence reflecting on the user's mindset or habit progress.",
    },
  },
  required: [
    "mood_label",
    "sentiment_score",
    "reflection_score",
    "ai_insight",
  ],
};

export async function analyzeJournalEntry(journalText) {
  if (!journalText || !journalText.trim()) {
    throw new Error("Journal text cannot be empty.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following daily journal entry:\n\n"""${journalText.trim()}"""`,
      config: {
        systemInstruction:
          "You are an objective wellness and mindset analyst. Evaluate the user's daily journal entry accurately without exaggeration. Return strict JSON matching the requested schema.",
        responseMimeType: "application/json",
        responseSchema: JOURNAL_ANALYSIS_SCHEMA,
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text);

    return {
      mood_label: parsed.mood_label || "Neutral",
      sentiment_score: Math.max(
        -1,
        Math.min(1, Number(parsed.sentiment_score) || 0)
      ),
      reflection_score: Math.max(
        0,
        Math.min(100, Math.round(Number(parsed.reflection_score) || 50))
      ),
      ai_insight:
        parsed.ai_insight ||
        "Entry logged. Keep building consistency with your daily reflections.",
    };
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      mood_label: "Neutral",
      sentiment_score: 0,
      reflection_score: 50,
      ai_insight:
        "Entry saved. AI mood analysis was temporarily unavailable.",
    };
  }
}

export function calculateDailyScore({
  reflectionScore = 50,
  completedTasks = 0,
  totalTasks = 0,
}) {
  const checklistPercent =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const weightedScore = 0.5 * checklistPercent + 0.5 * reflectionScore;

  return Math.max(0, Math.min(100, Math.round(weightedScore)));
}
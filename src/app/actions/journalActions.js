"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { analyzeJournalEntry, calculateDailyScore } from "@/lib/gemini";

function getDateISO(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0];
}

export async function getTodayJournalData() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      entry: null,
      checklistStats: { completedTasks: 0, totalTasks: 0, completionPct: 0 },
    };
  }

  const todayISO = getDateISO(0);

  const [entryRes, tasksRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", todayISO)
      .maybeSingle(),
    supabase
      .from("daily_checklist")
      .select("id, is_completed")
      .eq("user_id", user.id)
      .eq("task_date", todayISO),
  ]);

  const tasks = tasksRes.data || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const completionPct =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    entry: entryRes.data || null,
    checklistStats: { completedTasks, totalTasks, completionPct },
  };
}

async function syncUserStreak(supabase, userId, alreadyLoggedToday) {
  if (alreadyLoggedToday) return;

  const yesterdayISO = getDateISO(-1);

  const [{ data: yesterdayEntry }, { data: profile }] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id")
      .eq("user_id", userId)
      .eq("entry_date", yesterdayISO)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("current_streak")
      .eq("id", userId)
      .single(),
  ]);

  const nextStreak = yesterdayEntry ? (profile?.current_streak || 0) + 1 : 1;

  await supabase
    .from("profiles")
    .update({
      current_streak: nextStreak,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export async function saveAndScoreJournal(content) {
  const cleanContent = content?.trim();
  if (!cleanContent || cleanContent.length < 10) {
    return { error: "Please write at least 10 characters for AI analysis." };
  }

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const todayISO = getDateISO(0);

  // 1. Check existing entry & today's checklist tasks in parallel
  const [existingRes, tasksRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("entry_date", todayISO)
      .maybeSingle(),
    supabase
      .from("daily_checklist")
      .select("id, is_completed")
      .eq("user_id", user.id)
      .eq("task_date", todayISO),
  ]);

  const tasks = tasksRes.data || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const checklistPct =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Run Gemini Structured JSON Mood & Reflection Analysis
  const analysis = await analyzeJournalEntry(cleanContent);

  // 3. Calculate Hybrid Daily Score (50% Checklist + 50% AI Reflection)
  const finalDailyScore = calculateDailyScore({
    reflectionScore: analysis.reflection_score,
    completedTasks,
    totalTasks,
  });

  // 4. Upsert today's journal row
  const { data: savedEntry, error } = await supabase
    .from("journal_entries")
    .upsert(
      {
        user_id: user.id,
        entry_date: todayISO,
        content: cleanContent,
        mood_label: analysis.mood_label,
        sentiment_score: analysis.sentiment_score,
        ai_insight: analysis.ai_insight,
        final_daily_score: finalDailyScore,
      },
      { onConflict: "user_id,entry_date" }
    )
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // 5. Update user streak if this is the first submission today
  await syncUserStreak(supabase, user.id, Boolean(existingRes.data));

  revalidatePath("/journal");
  revalidatePath("/dashboard");
  revalidatePath("/mood");

  return {
    success: true,
    entry: savedEntry,
    breakdown: {
      reflectionScore: analysis.reflection_score,
      checklistPct,
      finalScore: finalDailyScore,
    },
  };
}
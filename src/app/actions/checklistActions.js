"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";

const VALID_CATEGORIES = ["GYM", "WORK", "HABIT"];

const ROUTINE_TEMPLATES = {
  push_gym: [
    { title: "Barbell Bench Press (3x8)", category: "GYM", points: 15 },
    { title: "Overhead Dumbbell Press (3x10)", category: "GYM", points: 15 },
    { title: "Tricep Rope Pushdowns (3x12)", category: "GYM", points: 10 },
    { title: "15-Min Incline Treadmill Walk", category: "GYM", points: 10 },
  ],
  deep_work: [
    { title: "Define Top 3 Daily Priorities", category: "WORK", points: 10 },
    { title: "90-Min Distraction-Free Deep Work Block", category: "WORK", points: 20 },
    { title: "Clear Inbox & Review Daily Output", category: "WORK", points: 10 },
  ],
  morning_habits: [
    { title: "Drink 500ml Water After Waking", category: "HABIT", points: 10 },
    { title: "10-Min Mobility & Outdoor Sunlight", category: "HABIT", points: 10 },
    { title: "No Social Media for First 60 Mins", category: "HABIT", points: 15 },
  ],
};

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

function revalidateAppViews() {
  revalidatePath("/checklist");
  revalidatePath("/dashboard");
  revalidatePath("/journal");
}

export async function getTodayChecklist() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("daily_checklist")
    .select("*")
    .eq("user_id", user.id)
    .eq("task_date", getTodayISO())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching checklist:", error.message);
    return [];
  }

  return data || [];
}

export async function addChecklistItem({ title, category = "WORK" }) {
  const cleanTitle = title?.trim();
  if (!cleanTitle) return { error: "Task title cannot be empty." };

  const safeCategory = VALID_CATEGORIES.includes(category) ? category : "WORK";
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("daily_checklist").insert({
    user_id: user.id,
    task_date: getTodayISO(),
    title: cleanTitle,
    category: safeCategory,
    points: safeCategory === "GYM" ? 15 : 10,
  });

  if (error) return { error: error.message };

  revalidateAppViews();
  return { success: true };
}

export async function toggleChecklistItem(taskId, nextCompletedState) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("daily_checklist")
    .update({ is_completed: nextCompletedState })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAppViews();
  return { success: true };
}

export async function deleteChecklistItem(taskId) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("daily_checklist")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAppViews();
  return { success: true };
}

export async function applyRoutineTemplate(templateKey) {
  const preset = ROUTINE_TEMPLATES[templateKey];
  if (!preset) return { error: "Invalid template selected." };

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const rows = preset.map((item) => ({
    user_id: user.id,
    task_date: getTodayISO(),
    title: item.title,
    category: item.category,
    points: item.points,
    is_completed: false,
  }));

  const { error } = await supabase.from("daily_checklist").insert(rows);

  if (error) return { error: error.message };

  revalidateAppViews();
  return { success: true };
}
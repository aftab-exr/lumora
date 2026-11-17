import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
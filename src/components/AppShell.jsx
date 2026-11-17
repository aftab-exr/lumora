import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import NavBar from "./NavBar";

export default async function AppShell({ children }) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const todayISO = new Date().toISOString().split("T")[0];

  async function signOutAction() {
    "use server";
    const serverClient = await getServerSupabase();
    await serverClient.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#F3F4F6]">
      <NavBar
        userEmail={user.email}
        todayISO={todayISO}
        signOutAction={signOutAction}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
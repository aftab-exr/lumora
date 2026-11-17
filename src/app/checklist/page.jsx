import AppShell from "@/components/AppShell";
import { getTodayChecklist } from "@/app/actions/checklistActions";
import ChecklistClient from "./ChecklistClient";

export default async function ChecklistPage() {
  const initialTasks = await getTodayChecklist();

  return (
    <AppShell>
      <ChecklistClient initialTasks={initialTasks} />
    </AppShell>
  );
}
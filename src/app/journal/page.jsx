import AppShell from "@/components/AppShell";
import { getTodayJournalData } from "@/app/actions/journalActions";
import JournalClient from "./JournalClient";

export default async function JournalPage() {
  const { entry, checklistStats } = await getTodayJournalData();

  return (
    <AppShell>
      <JournalClient initialEntry={entry} checklistStats={checklistStats} />
    </AppShell>
  );
}
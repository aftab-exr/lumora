"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CheckSquare,
  FileText,
  Activity,
  LogOut,
} from "lucide-react";
import LumoraLogo from "./LumoraLogo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/checklist", label: "Checklist", icon: CheckSquare },
  { href: "/journal", label: "Journal", icon: FileText },
  { href: "/mood", label: "Analytics", icon: Activity },
];

export default function NavBar({ userEmail, todayISO, signOutAction }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[#22252C] bg-[#0A0B0D]/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4">
        {/* Brand + Route Tabs */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center">
            <LumoraLogo size="sm" />
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "bg-[#16191F] text-[#F3F4F6] ring-1 ring-[#2F343E]"
                      : "text-[#8E95A2] hover:bg-[#111317] hover:text-[#F3F4F6]"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isActive ? "text-emerald-400" : "text-[#5C6270]"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Telemetry Metadata + Sign Out */}
        <div className="flex items-center gap-3">
          <span className="tabular-telemetry hidden rounded border border-[#22252C] bg-[#111317] px-2 py-0.5 text-[11px] text-[#8E95A2] sm:inline-block">
            {todayISO}
          </span>

          {userEmail && (
            <span className="hidden font-mono text-[11px] text-[#5C6270] md:inline-block">
              {userEmail}
            </span>
          )}

          <form action={signOutAction}>
            <button
              type="submit"
              title="Sign out"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#22252C] bg-[#111317] text-[#8E95A2] transition hover:border-rose-500/40 hover:text-rose-400"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
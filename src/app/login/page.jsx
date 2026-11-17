"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    const supabase = getBrowserSupabase();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0B0D] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[#22252C] bg-[#111317] p-6">
        <div className="flex items-center justify-between border-b border-[#22252C] pb-4">
          <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-[#F3F4F6]">
            <span className="h-2 w-2 rounded-xs bg-emerald-400" />
            PULSE // AUTH
          </div>
          <span className="font-mono text-[11px] text-[#5C6270]">OAUTH 2.0</span>
        </div>

        <div className="mt-5">
          <h1 className="text-lg font-semibold tracking-tight text-[#F3F4F6]">
            Sign in to workspace
          </h1>
          <p className="mt-1 font-mono text-xs text-[#8E95A2]">
            Daily habit execution &amp; AI mood telemetry
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#F3F4F6] px-4 py-2.5 text-xs font-semibold text-[#0A0B0D] transition hover:bg-white disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M21.35 11.1h-9.18v2.98h5.27c-.23 1.48-1.74 4.34-5.27 4.34-3.17 0-5.76-2.63-5.76-5.87s2.59-5.87 5.76-5.87c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.79 4.16 14.69 3.2 12.17 3.2 7.21 3.2 3.2 7.21 3.2 12.17s4.01 8.97 8.97 8.97c5.18 0 8.61-3.64 8.61-8.77 0-.59-.06-1.04-.15-1.27Z"
            />
          </svg>
          {loading ? "Redirecting..." : "Continue with Google"}
        </button>
      </div>
    </main>
  );
}
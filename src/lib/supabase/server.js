import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getServerSupabase() {
  const cookieJar = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieJar.getAll();
        },
        setAll(newCookies) {
          try {
            for (const { name, value, options } of newCookies) {
              cookieJar.set(name, value, options);
            }
          } catch {
            // Safe to ignore when invoked from a read-only Server Component
          }
        },
      },
    }
  );
}
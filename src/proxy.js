import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const PRIVATE_ROUTES = ["/dashboard", "/journal", "/checklist", "/mood"];

export async function proxy(req) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookieList) {
          for (const { name, value } of cookieList) {
            req.cookies.set(name, value);
          }
          res = NextResponse.next({
            request: { headers: req.headers },
          });
          for (const { name, value, options } of cookieList) {
            res.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentPath = req.nextUrl.pathname;
  const requiresAuth = PRIVATE_ROUTES.some((route) =>
    currentPath.startsWith(route)
  );

  if (requiresAuth && !user) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (currentPath === "/login" && user) {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
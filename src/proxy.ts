import { NextResponse } from "next/server";
import { auth } from "@/auth";

const ROLE_HOME: Record<string, string> = {
  EMPLOYEE: "/employee",
  MANAGER: "/manager/directory",
  ADMIN: "/admin",
};

const ROLE_PREFIXES: [string, string[]][] = [
  ["/admin", ["ADMIN"]],
  ["/manager", ["MANAGER"]],
  // Managers are also paid staff, so they share the employee self-service area.
  ["/employee", ["EMPLOYEE", "MANAGER"]],
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;
  const mustChangePassword = req.auth?.user?.mustChangePassword;
  const isPublicRoute = pathname === "/login";
  const isChangePassword = pathname === "/change-password";

  if (!req.auth && !isPublicRoute) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth && role) {
    if (mustChangePassword && !isChangePassword) {
      return NextResponse.redirect(new URL("/change-password", req.nextUrl));
    }
    if (!mustChangePassword && isChangePassword) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.nextUrl));
    }

    if (isPublicRoute) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.nextUrl));
    }

    if (!isChangePassword) {
      for (const [prefix, allowedRoles] of ROLE_PREFIXES) {
        if (pathname.startsWith(prefix) && !allowedRoles.includes(role)) {
          return NextResponse.redirect(new URL(ROLE_HOME[role], req.nextUrl));
        }
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

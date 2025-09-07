import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/signin", "/signup", "/api/auth", "/_next", "/favicon.ico", "/public"];

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    const hasSession = Boolean(
        request.cookies.get("authjs.session-token")?.value ||
        request.cookies.get("__Secure-authjs.session-token")?.value
    );

    if (!hasSession) {
        const signInUrl = new URL("/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/api/:path*", "/"],
};



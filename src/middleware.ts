import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = ["/signin", "/signup", "/api/auth", "/_next", "/favicon.ico", "/public"];

export default auth((request) => {
    const { pathname } = request.nextUrl;
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    if (!request.auth) {
        const signInUrl = new URL("/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
});

export const config = {
    matcher: ["/dashboard/:path*", "/api/:path*", "/"],
};



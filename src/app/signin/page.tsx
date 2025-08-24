import { signIn } from "@/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  async function authenticate(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-lg p-6 shadow">
        <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
        <form action={authenticate} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 rounded border bg-white text-black"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 rounded border bg-white text-black"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded bg-black text-white hover:opacity-90"
          >
            Sign in
          </button>
        </form>
        <p className="text-sm mt-4">
          Don't have an account?{" "}
          <Link className="underline" href="/signup">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

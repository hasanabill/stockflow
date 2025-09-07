import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import Link from "next/link";
import SignInForm from "@/app/signin/SignInForm";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  async function authenticate(prevState: { error?: string }, formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    try {
      await signIn("credentials", { email, password, redirectTo: "/dashboard" });
      return {};
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.type === "CredentialsSignin") {
          return { error: "Invalid email or password" };
        }
        return { error: "Unable to sign in. Please try again." };
      }
      // Allow NextAuth/Next.js redirects to bubble up
      throw error;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-lg p-6 shadow">
        <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
        <SignInForm action={authenticate} />
        <p className="text-sm mt-4">
          Don&apos;t have an account?{" "}
          <Link className="underline" href="/signup">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

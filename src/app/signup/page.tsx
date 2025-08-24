import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  async function register(formData: FormData) {
    "use server";
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    const { default: connectToDB } = await import("@/lib/mongodb");
    const { default: User } = await import("@/models/user");
    const { default: bcrypt } = await import("bcryptjs");

    await connectToDB();
    const existing = await User.findOne({ email });
    if (existing) {
      throw new Error("User already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword });

    redirect("/signin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-lg p-6 shadow">
        <h1 className="text-2xl font-semibold mb-6">Create your account</h1>
        <form action={register} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 rounded border bg-white text-black"
              placeholder="Jane Doe"
            />
          </div>
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
            Sign up
          </button>
        </form>
        <p className="text-sm mt-4">
          Already have an account?{" "}
          <Link className="underline" href="/signin">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

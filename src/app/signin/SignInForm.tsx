"use client";

import { useFormState } from "react-dom";

export default function SignInForm({
  action,
}: {
  action: (prevState: { error?: string }, formData: FormData) => Promise<{ error?: string }>;
}) {
  const [state, formAction] = useFormState(action, {} as { error?: string });

  return (
    <form action={formAction} className="space-y-4">
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
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">{state.error}</p>
      )}
    </form>
  );
}



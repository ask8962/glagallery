import { useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebase } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { auth } = getFirebase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-200 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">CampusHub Login</h2>
        {error && <p className="mb-3 text-center text-sm text-red-600">{error}</p>}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-indigo-600 py-2 text-white transition hover:bg-indigo-700"
        >
          Sign In
        </button>
        <p className="mt-4 text-center text-sm text-gray-600">
          <a href="/auth/forgot" className="underline">Forgot password?</a> | <a href="/auth/signup" className="underline">Create account</a>
        </p>
      </form>
    </div>
  );
}

"use client"
import { useState } from "react";
import { getFirebase } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { auth } = getFirebase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email address.");
      } else {
        setError(err?.message || "Failed to send reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a]">
      <div className="w-full max-w-md bg-[#111111] border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <Link href="/" className="inline-block transition-transform hover:scale-105">
              <div className="bg-yellow-500/10 p-3 rounded-2xl border border-yellow-500/20">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-yellow-500">
                  <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3ZM12 12.82L3.97 8.44L12 4.06L20.03 8.44L12 12.82Z" fill="currentColor" />
                  <path d="M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" fill="currentColor" />
                </svg>
              </div>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Reset Password</h1>
            <p className="text-zinc-400 text-sm">Enter your email to receive a reset link.</p>
          </div>

          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-green-500/10 p-4 rounded-full border border-green-500/20 text-green-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Check your email</h3>
                <p className="text-sm text-zinc-400">
                  We've sent a password reset link to <br/>
                  <span className="text-white font-medium">{email}</span>
                </p>
              </div>
              <Link 
                href="/auth/login"
                className="block w-full h-12 bg-[#1a1a1a] hover:bg-[#222222] border border-zinc-800 text-white font-medium rounded-xl flex items-center justify-center transition-all"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Email *</label>
                  <input
                    type="email"
                    placeholder="name@college.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-12 bg-[#1a1a1a] border border-zinc-800 rounded-xl px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-12 bg-[#EAB308] hover:bg-[#FACC15] text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link href="/auth/login" className="text-sm text-zinc-500 hover:text-zinc-300 inline-flex items-center transition-colors">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

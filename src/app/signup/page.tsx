"use client";

import React, { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, signIn } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  ChevronRight,
  Code2,
  Sparkles,
  Zap,
} from "lucide-react";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await signUp.email({ name, email, password });
      if (result.error) {
        const msg = result.error.message ?? "Sign up failed";
        setError(
          msg.includes("USER_ALREADY_EXISTS")
            ? "An account with this email already exists. Please sign in."
            : msg
        );
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });

      // If the library didn't auto-redirect, do it manually
      if (result?.data?.url) {
        window.location.href = result.data.url;
        return;
      }

      // Surface server-side errors
      if (result?.error) {
        setError(
          (result.error as { message?: string }).message || "Google sign-in failed."
        );
        setGoogleLoading(false);
        return;
      }
    } catch (err) {
      console.error("Google OAuth error:", err);
      setError("Could not connect to Google. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-svh lg:grid-cols-2">
      {/* ── Left branding panel (hidden on mobile) ────────────────────── */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0c0c1d] via-[#12122a] to-[#1a1a3e] p-10 xl:p-14">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-[#6366f1]/8 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-[#a78bfa]/6 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[200px] w-[200px] rounded-full bg-[#818cf8]/5 blur-[80px]" />
        </div>

        {/* Top — logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#a78bfa] shadow-lg shadow-[#6366f1]/30">
            <ChevronRight size={22} className="text-white" />
          </div>
          <span className="text-[22px] font-bold tracking-tight text-white">
            Auris IDE
          </span>
        </div>

        {/* Center — headline */}
        <div className="relative z-10 -mt-12 space-y-6">
          <h1 className="text-[40px] xl:text-[46px] font-extrabold leading-[1.1] tracking-tight text-white">
            Start Building
            <br />
            <span className="bg-gradient-to-r from-[#818cf8] to-[#c084fc] bg-clip-text text-transparent">
              Something Great.
            </span>
          </h1>
          <p className="max-w-md text-[15px] leading-relaxed text-[#9898b0]">
            Join thousands of developers using Auris IDE to code, collaborate,
            and ship products faster than ever.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 pt-2">
            {[
              { icon: Code2, label: "Monaco Editor" },
              { icon: Sparkles, label: "AI Assistant" },
              { icon: Zap, label: "Real-time Collab" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-[#b0b0c8] backdrop-blur-sm"
              >
                <Icon size={14} className="text-[#818cf8]" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom — quote */}
        <p className="relative z-10 text-[13px] text-[#55557a]">
          &copy; {new Date().getFullYear()} Auris IDE &mdash; Built with
          Next.js, Better&nbsp;Auth&nbsp;&&nbsp;Neon
        </p>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center bg-[#0a0a18] p-5 sm:p-8 overflow-y-auto">
        {/* Mobile-only subtle bg glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute top-1/4 left-1/3 h-72 w-72 rounded-full bg-[#6366f1]/6 blur-[90px]" />
          <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-[#a78bfa]/5 blur-[90px]" />
        </div>

        <div className="relative z-10 w-full max-w-[420px] my-6">
          <Card className="border-[#ffffff0a] bg-[#13132a]/90 shadow-2xl shadow-black/40 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardContent className="px-7 py-8 sm:px-9 sm:py-10">
              {/* ── Logo + heading (inside card) ───────────────────── */}
              <div className="flex flex-col items-center text-center mb-8">
                {/* Mobile logo */}
                <div className="mb-5 flex items-center gap-2.5 lg:hidden">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#a78bfa] shadow-lg shadow-[#6366f1]/25">
                    <ChevronRight size={20} className="text-white" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">
                    Auris IDE
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[26px]">
                  Create your account
                </h1>
                <p className="mt-1.5 text-[14px] leading-normal text-[#8888a8]">
                  Get started with Auris IDE for free
                </p>
              </div>

              {/* ── Error ──────────────────────────────────────────── */}
              {error && (
                <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3 text-[13px] leading-snug text-red-400">
                  {error}
                </div>
              )}

              {/* ── Google button ──────────────────────────────────── */}
              <Button
                variant="outline"
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full h-[46px] rounded-xl border-[#ffffff0c] bg-[#1a1a38] text-[14px] font-medium text-[#ccc] gap-3 hover:bg-[#22224a] hover:border-[#ffffff14] transition-all"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[18px] w-[18px]">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Continue with Google
              </Button>

              {/* ── Divider ────────────────────────────────────────── */}
              <div className="relative my-7 flex items-center">
                <div className="flex-1 border-t border-[#ffffff0a]" />
                <span className="mx-4 text-[11px] font-medium uppercase tracking-widest text-[#55557a]">
                  or
                </span>
                <div className="flex-1 border-t border-[#ffffff0a]" />
              </div>

              {/* ── Sign up form ───────────────────────────────────── */}
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[13px] font-medium text-[#9898b0]">
                    Full name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-[46px] rounded-xl border-[#ffffff0c] bg-[#1a1a38] text-[14px] text-white placeholder:text-[#4a4a6a] focus-visible:ring-[#6366f1]/40 focus-visible:border-[#6366f1]/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[13px] font-medium text-[#9898b0]">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-[46px] rounded-xl border-[#ffffff0c] bg-[#1a1a38] text-[14px] text-white placeholder:text-[#4a4a6a] focus-visible:ring-[#6366f1]/40 focus-visible:border-[#6366f1]/50"
                  />
                </div>

                {/* Password row — 2 columns on wider screens */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[13px] font-medium text-[#9898b0]">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 8 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-[46px] rounded-xl border-[#ffffff0c] bg-[#1a1a38] text-[14px] text-white placeholder:text-[#4a4a6a] focus-visible:ring-[#6366f1]/40 focus-visible:border-[#6366f1]/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[13px] font-medium text-[#9898b0]">
                      Confirm
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-[46px] rounded-xl border-[#ffffff0c] bg-[#1a1a38] text-[14px] text-white placeholder:text-[#4a4a6a] focus-visible:ring-[#6366f1]/40 focus-visible:border-[#6366f1]/50"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={
                    loading || !name || !email || !password || !confirmPassword
                  }
                  className="w-full h-[46px] rounded-xl bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-[14px] font-semibold text-white shadow-lg shadow-[#6366f1]/20 hover:shadow-[#6366f1]/35 hover:brightness-110 transition-all disabled:opacity-50 mt-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              {/* ── Footer links (inside card) ─────────────────────── */}
              <div className="mt-8 space-y-4 text-center">
                <p className="text-[14px] text-[#8888a8]">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="font-semibold text-[#818cf8] hover:text-[#a5b4fc] transition-colors"
                  >
                    Sign in
                  </a>
                </p>
                <p className="text-[11px] leading-relaxed text-[#44446a]">
                  By continuing, you agree to our{" "}
                  <a href="#" className="underline underline-offset-2 hover:text-[#8888a8] transition-colors">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="underline underline-offset-2 hover:text-[#8888a8] transition-colors">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpContent />
    </Suspense>
  );
}

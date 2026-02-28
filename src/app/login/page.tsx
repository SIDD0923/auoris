"use client";

import { LoginForm } from "@/components/login-form";
import { ChevronRight, Code2, Sparkles, Zap } from "lucide-react";

export default function LoginPage() {
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
            Code. Collaborate.
            <br />
            <span className="bg-gradient-to-r from-[#818cf8] to-[#c084fc] bg-clip-text text-transparent">
              Ship Faster.
            </span>
          </h1>
          <p className="max-w-md text-[15px] leading-relaxed text-[#9898b0]">
            A modern cloud IDE with real-time collaboration, AI assistance,
            and everything you need to build beautiful software — right from
            your browser.
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
      <div className="relative flex items-center justify-center bg-[#0a0a18] p-5 sm:p-8">
        {/* Mobile-only subtle bg glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute top-1/4 left-1/3 h-72 w-72 rounded-full bg-[#6366f1]/6 blur-[90px]" />
          <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-[#a78bfa]/5 blur-[90px]" />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

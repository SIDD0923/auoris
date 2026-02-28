"use client";

import IDELayout from "@/components/IDELayout";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a1a]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#6366f1]" />
          <span className="text-sm text-[#888]">Loading workspace…</span>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return <IDELayout />;
}

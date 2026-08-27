"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SignInCard } from "@/components/sign-in-dialog";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  return (
    <div className="w-full max-w-[420px] rounded-[28px] border-0 bg-white p-8 sm:p-10 shadow-2xl">
      <SignInCard callbackUrl={callbackUrl} />
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-16">
      <Suspense
        fallback={
          <div className="w-full max-w-[420px] rounded-[28px] bg-white p-10 shadow-2xl text-center text-slate-400">
            Loading...
          </div>
        }
      >
        <SignInContent />
      </Suspense>
    </div>
  );
}

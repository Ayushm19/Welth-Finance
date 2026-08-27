"use client";

import { SignInCard } from "@/components/sign-in-dialog";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-[420px] rounded-[28px] border-0 bg-white p-8 sm:p-10 shadow-2xl">
        <SignInCard
          callbackUrl="/dashboard"
          title="Welcome to Welth"
          subtitle="Create your account with Google to start managing money smarter."
        />
      </div>
    </div>
  );
}

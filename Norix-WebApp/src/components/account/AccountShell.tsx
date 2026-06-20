"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { useAuth } from "@/contexts/AuthProvider";

export function AccountShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, ready, openAuth } = useAuth();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      openAuth("login");
      router.replace("/");
    }
  }, [ready, isAuthenticated, openAuth, router]);

  if (!ready || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-norix-gray-600">
        იტვირთება...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full px-4 py-8 md:px-8 lg:px-12 xl:px-16">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <AccountSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

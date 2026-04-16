import AdminLoginForm from "@/components/auth/AdminLoginForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "შესვლა | ადმინ",
  description: "აფოტეკა ადმინ პანელი — ავტორიზაცია",
};

function LoginFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
      იტვირთება…
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <AdminLoginForm />
    </Suspense>
  );
}

import { SiteHeader } from "@/components/layout/SiteHeader";
import { AccountShell } from "@/components/account/AccountShell";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="w-full flex-1 bg-norix-gray-100">
        <AccountShell>{children}</AccountShell>
      </main>
    </>
  );
}

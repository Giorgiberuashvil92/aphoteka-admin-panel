"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  LogOut,
  MapPin,
  ShoppingCart,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";

const NAV_ITEMS = [
  { href: "/account", label: "ჩემი ანგარიში", icon: User, exact: true },
  { href: "/account/addresses", label: "ჩემი მისამართები", icon: MapPin },
  { href: "/account/favorites", label: "ვიშლისტი", icon: Heart },
  { href: "/account/orders", label: "შეკვეთების ისტორია", icon: ShoppingCart },
] as const;

export function AccountSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <nav className="overflow-hidden rounded-2xl border border-norix-border bg-white">
        {NAV_ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
          const exact = "exact" in rest && rest.exact;
          const active = exact ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 border-b border-norix-border px-5 py-4 text-[15px] font-medium transition-colors last:border-b-0 ${
                active
                  ? "bg-norix-gray-100 text-norix-blue"
                  : "text-foreground hover:bg-norix-gray-100"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 px-5 py-4 text-left text-[15px] font-medium text-foreground transition-colors hover:bg-norix-gray-100"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          გასვლა
        </button>
      </nav>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { LogOut, MapPin, ShoppingCart, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";

interface UserProfileDropdownProps {
  open: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { href: "/account", label: "პროფილი", icon: User },
  { href: "/account/addresses", label: "მისამართები", icon: MapPin },
  { href: "/account/orders", label: "ჩემი შეკვეთები", icon: ShoppingCart },
] as const;

export function UserProfileDropdown({ open, onClose }: UserProfileDropdownProps) {
  const { logout } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-[calc(100%+10px)] z-[70] w-64 overflow-hidden rounded-2xl border border-norix-border bg-white py-2 shadow-xl"
    >
      <div className="absolute -top-2 right-5 h-4 w-4 rotate-45 border-l border-t border-norix-border bg-white" />

      {MENU_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onClose}
          className="flex items-center gap-3 px-5 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-norix-gray-100"
        >
          <Icon className="h-5 w-5 text-norix-gray-600" />
          {label}
        </Link>
      ))}

      <button
        type="button"
        onClick={() => {
          logout();
          onClose();
        }}
        className="flex w-full items-center gap-3 px-5 py-3 text-left text-[15px] font-medium text-red-500 transition-colors hover:bg-red-50"
      >
        <LogOut className="h-5 w-5" />
        გასვლა
      </button>
    </div>
  );
}

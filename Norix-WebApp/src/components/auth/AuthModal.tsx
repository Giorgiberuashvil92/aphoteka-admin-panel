"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import type { AuthView } from "@/types/auth";
import type { RegisterPayload } from "@/types/auth";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

interface AuthModalProps {
  open: boolean;
  view: AuthView;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onViewChange: (view: AuthView) => void;
  onLogin: (emailOrPhone: string, password: string) => void;
  onRegister: (payload: RegisterPayload) => void;
}

export function AuthModal({
  open,
  view,
  loading,
  error,
  onClose,
  onViewChange,
  onLogin,
  onRegister,
}: AuthModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="დახურვა"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-norix-border px-6 py-5">
          <h2
            id="auth-modal-title"
            className="text-2xl font-bold text-norix-blue"
          >
            {view === "login" ? "ავტორიზაცია" : "რეგისტრაცია"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-norix-gray-600 transition-colors hover:bg-norix-gray-100"
            aria-label="დახურვა"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {view === "login" ? (
            <LoginForm
              loading={loading}
              onSubmit={onLogin}
              onRegisterClick={() => onViewChange("register")}
            />
          ) : (
            <RegisterForm
              loading={loading}
              onSubmit={onRegister}
              onLoginClick={() => onViewChange("login")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

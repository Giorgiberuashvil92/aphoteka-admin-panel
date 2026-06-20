"use client";

import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useState } from "react";
import { AuthField } from "./AuthField";

interface LoginFormProps {
  loading: boolean;
  onSubmit: (emailOrPhone: string, password: string) => void;
  onRegisterClick: () => void;
}

export function LoginForm({
  loading,
  onSubmit,
  onRegisterClick,
}: LoginFormProps) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ emailOrPhone: "", password: "" });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = { emailOrPhone: "", password: "" };
    let valid = true;

    if (!emailOrPhone.trim()) {
      next.emailOrPhone = "ელ.ფოსტა ან ტელეფონი სავალდებულოა";
      valid = false;
    }
    if (!password) {
      next.password = "პაროლი სავალდებულოა";
      valid = false;
    }

    setErrors(next);
    if (!valid) return;
    onSubmit(emailOrPhone.trim(), password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthField
        placeholder="ელ.ფოსტა ან ტელეფონის ნომერი"
        value={emailOrPhone}
        onChange={(event) => {
          setEmailOrPhone(event.target.value);
          if (errors.emailOrPhone) {
            setErrors((current) => ({ ...current, emailOrPhone: "" }));
          }
        }}
        autoComplete="username"
        error={errors.emailOrPhone}
        leftIcon={<User className="h-5 w-5" />}
      />

      <AuthField
        type={showPassword ? "text" : "password"}
        placeholder="პაროლი"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          if (errors.password) {
            setErrors((current) => ({ ...current, password: "" }));
          }
        }}
        autoComplete="current-password"
        error={errors.password}
        leftIcon={<Lock className="h-5 w-5" />}
        rightSlot={
          <>
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="text-norix-gray-400 transition-colors hover:text-norix-gray-600"
              aria-label={showPassword ? "პაროლის დამალვა" : "პაროლის ჩვენება"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            <span className="h-4 w-px bg-norix-border" />
            <button
              type="button"
              className="text-sm font-medium text-norix-blue hover:underline"
            >
              აღდგენა
            </button>
          </>
        }
      />

      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-xl bg-norix-blue text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "იტვირთება..." : "ავტორიზაცია"}
      </button>

      <div className="space-y-3 pt-1">
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-norix-border bg-white text-[15px] font-medium text-foreground transition-colors hover:bg-norix-gray-100"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1877F2] text-xs font-bold text-white">
            f
          </span>
          შესვლა Facebook-ით
        </button>
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-norix-border bg-white text-[15px] font-medium text-foreground transition-colors hover:bg-norix-gray-100"
        >
          <span className="text-lg font-bold leading-none">
            <span className="text-[#4285F4]">G</span>
          </span>
          შესვლა Google-ით
        </button>
      </div>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onRegisterClick}
          className="text-base font-medium text-norix-blue hover:underline"
        >
          რეგისტრაცია
        </button>
      </div>
    </form>
  );
}

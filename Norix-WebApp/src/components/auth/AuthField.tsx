import type { InputHTMLAttributes, ReactNode } from "react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export function AuthField({
  label,
  error,
  leftIcon,
  rightSlot,
  className = "",
  ...props
}: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-norix-gray-600">{label}</label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-norix-gray-400">
            {leftIcon}
          </span>
        )}
        <input
          {...props}
          className={`h-12 w-full rounded-xl border border-norix-border bg-norix-gray-100 text-[15px] text-foreground outline-none transition-colors placeholder:text-norix-gray-400 focus:border-norix-blue-light focus:bg-white ${
            leftIcon ? "pl-11" : "pl-4"
          } ${rightSlot ? "pr-24" : "pr-4"} ${error ? "border-red-400" : ""} ${className}`}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {rightSlot}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

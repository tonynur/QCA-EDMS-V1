import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, icon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-sans">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <span className="absolute left-3 text-slate-400 pointer-events-none">{icon}</span>}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full bg-slate-50 hover:bg-white text-slate-900 placeholder-slate-400 border border-slate-300 rounded-[6px] text-xs focus:bg-white focus:outline-none focus:border-[#163d78] focus:ring-1 focus:ring-[#163d78] h-9 px-3 transition-colors font-sans",
              icon && "pl-9",
              error && "border-[#ed2e35] focus:border-[#ed2e35] focus:ring-[#ed2e35]",
              type === "number" && "tabular-nums",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[#ed2e35] font-mono">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";


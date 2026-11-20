"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  category?: string;
  title: string;
  badge?: string | number;
  badgeVariant?: "primary" | "success" | "warning" | "danger" | "neutral";
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: "default" | "executive";
  className?: string;
}

export function PageHeader({
  category,
  title,
  badge,
  badgeVariant = "neutral",
  description,
  icon,
  actions,
  variant = "default",
  className,
}: PageHeaderProps) {
  if (variant === "executive") {
    return (
      <div
        className={cn(
          "bg-gradient-to-r from-[#0d1e44] via-[#13275a] to-[#0f214d] text-white p-5 sm:p-6 rounded-[8px] border border-[#23458c]/80 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 select-none",
          "before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[#38bdf8]/40 before:to-transparent",
          className
        )}
      >
        <div className="space-y-1.5 z-10">
          {category && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#38bdf8] font-bold">
                {category}
              </span>
              <span className="text-white/20">•</span>
              <span className="text-[10px] font-mono text-slate-300">
                PT Asuka Engineering Indonesia
              </span>
            </div>
          )}
          <div className="flex items-center gap-2.5 flex-wrap">
            {icon && (
              <span className="w-9 h-9 rounded-[6px] bg-white/10 text-[#38bdf8] border border-white/15 flex items-center justify-center shrink-0 shadow-xs">
                {icon}
              </span>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              {title}
            </h1>
            {badge !== undefined && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-[3px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>{badge}</span>
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-200/90 font-mono max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0 z-10">
            {actions}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white p-4 sm:p-5 rounded-[8px] border border-slate-200/90 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none",
        "before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-[#163d78] before:via-[#1e4e96] before:to-transparent",
        className
      )}
    >
      <div className="space-y-1 z-10">
        {category && (
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#163d78] font-bold bg-blue-50/80 px-2 py-0.5 rounded-[3px] border border-blue-200/60 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-[1px] bg-[#163d78]" />
            <span>{category}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 flex-wrap">
          {icon && (
            <span className="w-8 h-8 rounded-[6px] bg-slate-100 text-[#163d78] border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
              {icon}
            </span>
          )}
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-sans">
            {title}
          </h1>
          {badge !== undefined && (
            <span
              className={cn(
                "text-[11px] font-mono font-bold px-2 py-0.5 rounded-[3px] border tabular-nums",
                badgeVariant === "primary" && "bg-blue-50 text-[#163d78] border-blue-200",
                badgeVariant === "success" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                badgeVariant === "warning" && "bg-amber-50 text-amber-700 border-amber-200",
                badgeVariant === "danger" && "bg-rose-50 text-rose-700 border-rose-200",
                badgeVariant === "neutral" && "bg-slate-100 text-slate-700 border-slate-200"
              )}
            >
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-500 font-mono mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0 z-10">
          {actions}
        </div>
      )}
    </div>
  );
}

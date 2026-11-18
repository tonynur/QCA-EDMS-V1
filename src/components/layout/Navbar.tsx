"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  LogOut,
  User as UserIcon,
  QrCode,
  Bot,
  Target,
  Bell,
  RefreshCw,
} from "lucide-react";
import { User } from "@/features/auth/types";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onGlobalSearch?: (query: string) => void;
  selectedProject?: string;
  onOpenQRScanner?: () => void;
  onOpenAIChat?: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export function Navbar({
  user,
  onLogout,
  onGlobalSearch,
  selectedProject,
  onOpenQRScanner,
  onOpenAIChat,
  unreadNotificationsCount = 0,
  onOpenNotifications,
}: NavbarProps) {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTimeStr(`${time} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatRoleLabel = (role?: string) => {
    if (!role) return "STAFF";
    const normalized = role.replace(/_/g, " ").toUpperCase();
    if (
      normalized.includes("QAQC ENGINEER") ||
      normalized.includes("QA/QC ENGINEER") ||
      normalized.includes("QAQC")
    ) {
      return "QA/QC";
    }
    if (normalized.includes("INSPECTOR")) return "INSPEKTOR";
    if (normalized.includes("MANAGER")) return "MANAGER";
    if (normalized.includes("ADMIN")) return "ADMIN";
    if (normalized.includes("LEAD")) return "LEAD";
    if (normalized.includes("CLIENT")) return "KLIEN";
    return normalized.length > 8 ? normalized.slice(0, 8) : normalized;
  };

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "U";

  return (
    <header className="h-14 bg-[#0a182e] border-b border-[#162f55] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-sm">
      {/* ========================================================
          LEFT ZONE: Brand Identity + Integrated Search
          ======================================================== */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Brand Logo */}
        <div className="flex items-center shrink-0">
          <Image
            src="/icons/logo.png"
            alt="PT Asuka Engineering Indonesia"
            width={116}
            height={26}
            className="h-6 w-auto object-contain"
            priority
          />
        </div>

        {/* Vertical Separator */}
        <div className="h-6 w-[1px] bg-[#1d3c6a] shrink-0 hidden sm:block" />

        {/* Technical System Title */}
        <div className="hidden sm:flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11.5px] tracking-wider text-white uppercase whitespace-nowrap">
              PT Asuka Engineering Indonesia
            </span>
            {selectedProject && (
              <span className="inline-flex items-center gap-1 text-[9.5px] font-mono px-1.5 py-0.2 rounded-[3px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                <Target className="w-2.5 h-2.5" />
                <span>{selectedProject}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-sans tracking-wide whitespace-nowrap">
            <span className="text-[#38bdf8] font-mono font-semibold">QCA EDMS</span>
            <span className="text-slate-600">•</span>
            <span>Sistem Kontrol Dokumen Mutu & Inspeksi Lapangan</span>
          </div>
        </div>

        {/* Global Search Bar (Positioned cohesively alongside Brand) */}
        <div className="hidden lg:flex items-center w-72 xl:w-80 ml-2 xl:ml-4 shrink-0">
          <div className="relative w-full">
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              strokeWidth={1.8}
            />
            <input
              type="text"
              placeholder="Cari dokumen, ITP, kalibrasi..."
              onChange={(e) => onGlobalSearch && onGlobalSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-12 text-xs bg-[#061224] text-slate-200 border border-[#1b3a6b] rounded-[6px] placeholder-slate-400 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/30 transition-all font-sans"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400 bg-[#0d2347] border border-[#1d3c6a] px-1.5 py-0.5 rounded pointer-events-none">
              Ctrl+K
            </kbd>
          </div>
        </div>
      </div>

      {/* ========================================================
          RIGHT ZONE: Telemetry + Action Utilities + User Profile
          ======================================================== */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Unified Telemetry Capsule (Live Sync & Server Time in ONE cohesive frame) */}
        <div className="hidden xl:flex items-center gap-2.5 h-8 px-3 rounded-[6px] bg-[#061224] border border-[#1b3a6b] text-[11px] font-mono text-slate-300 whitespace-nowrap shrink-0">
          <div className="flex items-center gap-1.5" title="Koneksi Master Database Aktif">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-slate-200 font-sans">Live Sync</span>
            <RefreshCw className="w-2.5 h-2.5 text-slate-400 shrink-0" />
          </div>
          {timeStr && (
            <>
              <span className="text-[#1d3c6a] font-normal">|</span>
              <span className="text-slate-300 tabular-nums" title="Waktu Sistem (WIB)">
                {timeStr}
              </span>
            </>
          )}
        </div>

        {/* Quick Action Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Scan QR Button */}
          {onOpenQRScanner && (
            <button
              type="button"
              onClick={onOpenQRScanner}
              className="hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[6px] text-slate-300 hover:text-white hover:bg-[#163d78]/60 border border-transparent hover:border-[#1d3c6a] text-xs font-mono whitespace-nowrap shrink-0 transition-colors"
              title="Pindai QR / Verifikasi Dokumen"
            >
              <QrCode className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
              <span>Scan QR</span>
            </button>
          )}

          {/* Tanya AI QC Button (Featured Action) */}
          {onOpenAIChat && (
            <button
              type="button"
              onClick={onOpenAIChat}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-[#163d78] hover:bg-[#1c4b91] text-white border border-[#255bb5] text-xs font-mono font-medium whitespace-nowrap shrink-0 transition-colors shadow-sm"
              title="Buka Tanya AI QC / Asisten Regulasi"
            >
              <Bot className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
              <span className="hidden sm:inline">Tanya AI QC</span>
              <span className="sm:hidden">AI QC</span>
            </button>
          )}

          {/* Notification Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative w-8 h-8 rounded-[6px] text-slate-300 hover:text-white hover:bg-[#163d78]/50 border border-transparent hover:border-[#1d3c6a] flex items-center justify-center shrink-0 transition-colors"
            title={
              unreadNotificationsCount > 0
                ? `${unreadNotificationsCount} dokumen memerlukan tindakan`
                : "Notifikasi Sistem"
            }
          >
            <Bell className="w-4 h-4" strokeWidth={1.8} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute 1 top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ed2e35] ring-2 ring-[#0a182e]" />
            )}
          </button>
        </div>

        {/* Separator before User Profile */}
        <div className="h-6 w-[1px] bg-[#1d3c6a] shrink-0" />

        {/* Unified User Profile & Session */}
        {user ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-2 h-8 pl-1.5 pr-2.5 rounded-[6px] bg-[#061224] border border-[#1b3a6b] shrink-0">
              {/* User Avatar Circle */}
              <div className="w-5 h-5 rounded-full bg-[#163d78] text-[#38bdf8] border border-[#255bb5] flex items-center justify-center text-[10px] font-bold shrink-0">
                {userInitial}
              </div>

              {/* User Display Name */}
              <span className="text-xs font-medium text-slate-200 hidden sm:inline whitespace-nowrap max-w-[110px] 2xl:max-w-[150px] truncate">
                {user.name}
              </span>

              {/* Technical Role Stamp */}
              <span className="px-1.5 py-0.2 rounded-[3px] bg-[#ed2e35]/15 text-[#f87171] border border-[#ed2e35]/30 text-[9.5px] font-mono font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
                {formatRoleLabel(user.role)}
              </span>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="w-8 h-8 rounded-[6px] text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 flex items-center justify-center transition-colors shrink-0"
              title="Keluar dari Sistem (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-[6px] bg-[#061224] border border-[#1b3a6b] text-xs text-slate-400 font-mono shrink-0">
            <UserIcon className="w-3.5 h-3.5" />
            <span>Guest</span>
          </div>
        )}
      </div>
    </header>
  );
}

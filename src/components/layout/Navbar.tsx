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

  return (
    <header className="h-14 bg-[#0a1a33] border-b border-[#1b3a6b] px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 shadow-md select-none">
      {/* 1. Official Brand Identity & Subsystem Header */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center shrink-0">
          <Image
            src="/icons/logo.png"
            alt="PT Asuka Engineering Indonesia"
            width={120}
            height={28}
            className="h-7 max-w-[130px] w-auto object-contain"
            priority
          />
        </div>

        {/* Vertical Hairline Divider */}
        <div className="h-7 w-[1px] bg-[#244785] shrink-0 hidden sm:block" />

        <div className="hidden sm:flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs tracking-wider text-white uppercase whitespace-nowrap">
              PT Asuka Engineering Indonesia
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-[3px] bg-[#163d78] text-[#38bdf8] border border-[#255bb5] whitespace-nowrap">
              QCA EDMS
            </span>
            {selectedProject && (
              <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] bg-[#16a34a]/20 text-[#4ade80] border border-[#16a34a]/40 whitespace-nowrap">
                <Target className="w-2.5 h-2.5" />
                <span>{selectedProject}</span>
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-300 font-medium tracking-wide flex items-center gap-1.5 whitespace-nowrap">
            <span>Sistem Kontrol Dokumen Mutu & Inspeksi Lapangan</span>
          </p>
        </div>
      </div>

      {/* 2. Global Document Search Bar */}
      <div className="hidden md:flex items-center flex-1 min-w-[200px] max-w-sm mx-3 lg:mx-6 shrink-0 lg:shrink">
        <div className="relative w-full">
          <Search
            className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            strokeWidth={1.8}
          />
          <input
            type="text"
            placeholder="Cari dokumen, ITP, kalibrasi, proyek..."
            onChange={(e) => onGlobalSearch && onGlobalSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-12 text-xs bg-[#091830] text-slate-200 border border-[#244785] rounded-[6px] placeholder-slate-400 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/30 transition-all font-sans"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden xl:inline-flex items-center text-[9px] font-mono text-slate-400 bg-[#163d78]/60 border border-[#255bb5]/60 px-1.5 py-0.5 rounded pointer-events-none">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* 3. Quick Action Tools & Status Indicators */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Sync Status Badge */}
        <div
          className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[4px] bg-[#052e16]/80 border border-[#166534] text-[11px] font-mono text-[#4ade80] whitespace-nowrap shrink-0"
          title="Status Koneksi: Terhubung ke Master Database"
        >
          <span className="w-2 h-2 rounded-[2px] bg-[#22c55e] shrink-0" />
          <span className="hidden lg:inline">Tersinkronisasi</span>
          <span className="lg:hidden">Tersinkron</span>
          <RefreshCw className="w-3 h-3 text-[#4ade80] shrink-0" />
        </div>

        {/* Tabular Clock */}
        {timeStr && (
          <div
            className="hidden xl:inline-flex items-center h-8 font-mono text-[11px] text-slate-300 tabular-nums px-2.5 bg-[#091830] rounded-[6px] border border-[#244785] whitespace-nowrap shrink-0"
            title="Waktu Sistem (WIB)"
          >
            {timeStr}
          </div>
        )}

        {/* Scan QR Button */}
        {onOpenQRScanner && (
          <button
            type="button"
            onClick={onOpenQRScanner}
            className="hidden lg:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[6px] bg-[#163d78]/60 hover:bg-[#163d78] text-slate-200 hover:text-white border border-[#244785] text-xs font-mono whitespace-nowrap shrink-0 transition-colors"
            title="Pindai QR / Verifikasi Dokumen"
          >
            <QrCode className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
            <span>Scan QR</span>
          </button>
        )}

        {/* Tanya AI QC Button */}
        {onOpenAIChat && (
          <button
            type="button"
            onClick={onOpenAIChat}
            className="hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[6px] bg-[#163d78]/80 hover:bg-[#1c4b91] text-[#38bdf8] hover:text-white border border-[#255bb5] text-xs font-mono font-medium whitespace-nowrap shrink-0 transition-colors"
            title="Buka Tanya AI QC / Asisten Regulasi"
          >
            <Bot className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden lg:inline">Tanya AI QC</span>
            <span className="lg:hidden">AI QC</span>
          </button>
        )}

        {/* Notification Bell with Badge */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative w-8 h-8 rounded-[6px] bg-[#163d78]/50 hover:bg-[#163d78] border border-[#244785] text-slate-200 hover:text-white flex items-center justify-center shrink-0 transition-colors"
          title={
            unreadNotificationsCount > 0
              ? `${unreadNotificationsCount} dokumen memerlukan approval / tindakan`
              : "Notifikasi Sistem"
          }
        >
          <Bell className="w-3.5 h-3.5" strokeWidth={1.8} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 rounded-[3px] bg-[#ed2e35] text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-sm pointer-events-none">
              {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* User Profile Pill & Logout */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-[#244785] shrink-0">
            <div className="flex items-center gap-2 h-8 px-2.5 rounded-[6px] bg-[#091830] border border-[#244785] shrink-0">
              <div className="w-5 h-5 rounded-[4px] bg-[#163d78] border border-[#255bb5] flex items-center justify-center text-[#38bdf8] shrink-0">
                <UserIcon className="w-3 h-3" />
              </div>
              <span className="text-xs font-medium text-slate-100 hidden sm:inline whitespace-nowrap max-w-[110px] xl:max-w-[160px] truncate">
                {user.name}
              </span>
              <span className="px-1.5 py-0.5 rounded-[3px] bg-[#ed2e35] text-white text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
                {formatRoleLabel(user.role)}
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="w-8 h-8 rounded-[6px] text-slate-300 hover:text-white border border-[#244785] bg-[#091830] hover:bg-[#dc2626]/20 hover:border-[#dc2626]/60 flex items-center justify-center transition-colors shrink-0"
              title="Keluar dari Sistem (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-[6px] bg-[#091830] border border-[#244785] text-xs text-slate-400 font-mono shrink-0">
            <UserIcon className="w-3.5 h-3.5" />
            <span>Guest</span>
          </div>
        )}
      </div>
    </header>
  );
}

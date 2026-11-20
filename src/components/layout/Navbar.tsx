"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  LogOut,
  QrCode,
  Bot,
  Target,
  Bell,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/features/auth/types";
import { useOfflineSync } from "@/lib/offline-sync";

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
  selectedProject,
  onOpenQRScanner,
  onOpenAIChat,
  unreadNotificationsCount = 22,
  onOpenNotifications,
}: NavbarProps) {
  const [timeStr, setTimeStr] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isOnline, queueCount, isSyncing, triggerManualSync } = useOfflineSync();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    return "Selamat malam";
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "Ahmad";
  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "U";

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
    return normalized.length > 10 ? normalized.slice(0, 10) : normalized;
  };

  return (
    <header className="h-14 bg-[#0d2347] border-b border-[#1b3a6b] px-3 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md w-full max-w-full select-none">
      {/* ═══ LEFT ZONE: Brand Identity & Greeting ═══ */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink min-w-0">
        <div className="flex items-center shrink-0">
          <Image
            src="/icons/logo.png"
            alt="PT Asuka Engineering Indonesia"
            width={120}
            height={28}
            className="h-7 max-w-[125px] w-auto object-contain"
            priority
          />
        </div>
        <div className="border-l border-[#244785] pl-2.5 sm:pl-3 flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-xs tracking-wider text-white uppercase whitespace-nowrap">
              PT Asuka Engineering Indonesia
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-[3px] bg-[#163d78] text-[#38bdf8] border border-[#255bb5] shrink-0">
              CMS EDMS
            </span>
            {selectedProject && (
              <span className="hidden xl:inline-flex items-center gap-1 text-[9.5px] font-mono px-1.5 py-0.2 rounded-[3px] bg-[#16a34a]/30 text-[#4ade80] border border-[#16a34a]/50 shrink-0">
                <Target className="w-2.5 h-2.5" />
                <span>{selectedProject}</span>
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-300 font-mono tracking-tight flex items-center gap-1 whitespace-nowrap">
            <span>{getGreeting()}, {firstName}</span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">Quality Assurance & Quality Control EDMS</span>
          </p>
        </div>
      </div>

      {/* ═══ RIGHT ZONE: Notification + User Dropdown (Zero Clutter) ═══ */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Dynamic Online / Offline Field Mode Indicator */}
        {isOnline ? (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#091830] border border-[#244785] text-slate-200 text-[11px] font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-emerald-400 font-semibold">Tersinkronisasi</span>
            <span className="text-white/20">•</span>
            <span className="font-mono text-slate-300 tabular-nums">{timeStr}</span>
            {queueCount > 0 && (
              <button
                type="button"
                onClick={triggerManualSync}
                className="ml-1 px-1.5 py-0.2 rounded-[2px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] font-mono cursor-pointer"
                title="Ada data offline yang menunggu sinkronisasi"
              >
                {isSyncing ? "Syncing..." : `Sync (${queueCount})`}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[11px] font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
            <span className="font-bold">Mode Lapangan (Offline)</span>
            {queueCount > 0 && (
              <span className="bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-[2px] text-[10px] font-mono">
                {queueCount} Antrean
              </span>
            )}
          </div>
        )}

        {/* Compact Notification Bell */}
        <button
          type="button"
          onClick={() => {
            if (onOpenNotifications) {
              onOpenNotifications();
            } else {
              setIsDropdownOpen((prev) => !prev);
            }
          }}
          className="relative w-8 h-8 rounded-[6px] bg-[#091830] hover:bg-[#163d78] border border-[#244785] text-slate-200 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          title={
            unreadNotificationsCount > 0
              ? `${unreadNotificationsCount} dokumen memerlukan tindakan`
              : "Notifikasi Sistem"
          }
        >
          <Bell className="w-4 h-4" strokeWidth={1.8} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 rounded-[2px] bg-[#ed2e35] text-white text-[9.5px] font-mono font-bold flex items-center justify-center shadow">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* 👤 PROFIL PENGGUNA & DROPDOWN RAMPING (Ringkas & Rapi) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 bg-[#091830] hover:bg-[#122550] border border-[#244785] hover:border-[#38bdf8]/40 rounded-[6px] px-2 sm:px-2.5 py-1 text-slate-100 transition-colors cursor-pointer select-none"
            title="Menu Profil & Alat Mutu Cepat"
          >
            <div className="w-6 h-6 rounded-[3px] bg-[#163d78] text-[#38bdf8] border border-[#38bdf8]/30 flex items-center justify-center font-bold text-[11px] shrink-0 font-mono">
              {userInitial}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[11px] font-semibold text-slate-100 leading-none truncate max-w-[95px] lg:max-w-[130px]">
                {user?.name || "QA/QC Engineer"}
              </span>
              <span className="text-[9px] font-mono text-[#38bdf8] font-bold leading-tight mt-0.5">
                {formatRoleLabel(user?.role)}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0",
                isDropdownOpen && "rotate-180 text-[#38bdf8]"
              )}
              strokeWidth={2}
            />
          </button>

          {/* ═══ DROPDOWN POPUP MENU ═══ */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-[8px] shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100 select-none text-slate-900 font-sans">
              {/* Dropdown User Header */}
              <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || "QA/QC Engineer"}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded-[3px] bg-rose-50 text-[#ed2e35] border border-rose-200 uppercase">
                    {user?.role || "QAQC_ENGINEER"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono truncate">
                    PT Asuka Engineering
                  </span>
                </div>
              </div>

              {/* Section: Aksi & Alat Mutu Cepat */}
              <div className="py-1">
                <div className="px-3.5 py-1 text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Aksi & Alat Cepat
                </div>

                {onOpenQRScanner && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenQRScanner();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <QrCode className="w-4 h-4 text-[#163d78] shrink-0" strokeWidth={1.8} />
                      <span>Scan QR / Verifikasi Dokumen</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded-[2px]">
                      Kamera
                    </span>
                  </button>
                )}

                {onOpenAIChat && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenAIChat();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Bot className="w-4 h-4 text-[#163d78] shrink-0" strokeWidth={1.8} />
                      <span>Tanya AI QC Copilot</span>
                    </span>
                    <span className="text-[9px] font-mono text-[#38bdf8] bg-blue-50 px-1 py-0.5 rounded-[2px] font-bold">
                      Smart AI
                    </span>
                  </button>
                )}

                <div className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left">
                  <span className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.8} />
                    <span>Dokumen Memerlukan Tindakan</span>
                  </span>
                  {unreadNotificationsCount > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-[3px] bg-rose-100 text-rose-700 border border-rose-200">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Telemetry & System Status Strip */}
              <div className="px-3.5 py-2 bg-slate-50 border-t border-b border-slate-100 flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-[2px] bg-emerald-500 inline-block shrink-0" />
                  <span>Tersinkronisasi</span>
                  <RefreshCw className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                </span>
                <span className="text-slate-500 tabular-nums font-medium">
                  {timeStr}
                </span>
              </div>

              {/* Logout Action */}
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-[4px] transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.8} />
                  <span>Keluar Akun (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

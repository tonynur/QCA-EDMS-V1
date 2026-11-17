"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Target,
  FileText,
  UploadCloud,
  Send,
  ClipboardCheck,
  Ruler,
  AlertOctagon,
  AlertCircle,
  ClipboardList,
  BarChart3,
  Building2,
  Users,
  Archive,
  Settings,
  Bot,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavTab =
  | "dashboard"
  | "command"
  | "documents"
  | "upload"
  | "transmittals"
  | "approval"
  | "calibration"
  | "ncr"
  | "nfilog"
  | "sitereport"
  | "analytics"
  | "projects"
  | "users"
  | "archive"
  | "settings";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  selectedProject?: string;
  onProjectChange?: (projectCode: string) => void;
  projects?: { code: string; name: string }[];
  pendingApprovalCount?: number;
  onOpenAIChat?: () => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  selectedProject = "",
  onProjectChange,
  projects = [],
  pendingApprovalCount = 0,
  onOpenAIChat,
}: SidebarProps) {
  const menuGroups: {
    group: string;
    items: {
      id: NavTab;
      label: string;
      icon: React.ReactNode;
      badge?: number | string;
    }[];
  }[] = [
    {
      group: "DOKUMEN MUTU",
      items: [
        {
          id: "documents",
          label: "Daftar Dokumen",
          icon: <FileText className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "upload",
          label: "Unggah Dokumen",
          icon: <UploadCloud className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "transmittals",
          label: "Transmittal",
          icon: <Send className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "archive",
          label: "Arsip & Retensi",
          icon: <Archive className="w-4 h-4" strokeWidth={1.8} />,
        },
      ],
    },
    {
      group: "INSPEKSI & ALAT",
      items: [
        {
          id: "calibration",
          label: "Kalibrasi Alat Ukur",
          icon: <Ruler className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "ncr",
          label: "Monitoring NCR",
          icon: <AlertOctagon className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "nfilog",
          label: "NFI Log Temuan",
          icon: <AlertCircle className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "sitereport",
          label: "Inspeksi Lapangan",
          icon: <ClipboardList className="w-4 h-4" strokeWidth={1.8} />,
        },
      ],
    },
    {
      group: "MONITORING",
      items: [
        {
          id: "dashboard",
          label: "Overview Dashboard",
          icon: <LayoutDashboard className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "command",
          label: "Command Center",
          icon: <Target className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "analytics",
          label: "Executive Analytics",
          icon: <BarChart3 className="w-4 h-4" strokeWidth={1.8} />,
        },
      ],
    },
    {
      group: "ADMINISTRASI",
      items: [
        {
          id: "projects",
          label: "Kelola Proyek",
          icon: <Building2 className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "users",
          label: "Kelola Pengguna",
          icon: <Users className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "approval",
          label: "Approval & Verifikasi",
          icon: <ClipboardCheck className="w-4 h-4" strokeWidth={1.8} />,
          badge: pendingApprovalCount > 0 ? pendingApprovalCount : undefined,
        },
        {
          id: "settings",
          label: "Pengaturan Sistem",
          icon: <Settings className="w-4 h-4" strokeWidth={1.8} />,
        },
      ],
    },
  ];

  // Accordion State
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "DOKUMEN MUTU": true,
    "INSPEKSI & ALAT": true,
    "MONITORING": true,
    "ADMINISTRASI": true,
  });

  // Auto-expand group containing active tab
  useEffect(() => {
    menuGroups.forEach((g) => {
      if (g.items.some((i) => i.id === activeTab)) {
        setOpenGroups((prev) => ({ ...prev, [g.group]: true }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  return (
    <aside className="w-60 bg-white border-r border-slate-200/90 flex flex-col h-[calc(100vh-3.5rem)] shrink-0 select-none shadow-[1px_0_3px_rgba(0,0,0,0.03)]">
      {/* 🎯 GLOBAL PROJECT FOCUS (Top of Sidebar) */}
      <div className="p-2.5 border-b border-slate-200 bg-slate-50/70 space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Target className="w-3.5 h-3.5 text-[#163d78]" strokeWidth={2} />
            <span>Fokus Proyek</span>
          </span>
          {selectedProject && (
            <button
              onClick={() => onProjectChange && onProjectChange("")}
              className="text-[9.5px] text-[#163d78] hover:underline font-bold"
            >
              Reset
            </button>
          )}
        </div>
        <select
          value={selectedProject}
          onChange={(e) => onProjectChange && onProjectChange(e.target.value)}
          className="w-full bg-white border border-slate-300 text-xs text-slate-800 rounded-[6px] px-2 py-1 outline-none focus:border-[#163d78] cursor-pointer shadow-sm font-medium"
        >
          <option value="">Semua Proyek (Global Portfolio)</option>
          {projects.map((p) => (
            <option key={p.code} value={p.code}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Accordion Navigation Menu */}
      <div className="p-1.5 space-y-2 flex-1 overflow-y-auto">
        {menuGroups.map((group) => {
          const isOpen = openGroups[group.group] !== false;
          return (
            <div key={group.group} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleGroup(group.group)}
                className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span>{group.group}</span>
                {isOpen ? (
                  <ChevronUp className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-[5px] text-xs font-medium transition-all text-left border-l-[3px]",
                          isActive
                            ? "bg-slate-100/90 border-l-[#163d78] text-[#163d78] font-bold shadow-xs"
                            : "border-l-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              isActive ? "text-[#163d78]" : "text-slate-500"
                            )}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge !== undefined && (
                          <span
                            className={cn(
                              "px-1.5 py-0.2 rounded-[2px] font-mono text-[10px] font-bold tabular-nums bg-rose-600 text-white"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 🤖 TANYA AI QC & OFFICIAL FOOTER BRANDING */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50/80 space-y-2">
        {onOpenAIChat && (
          <button
            onClick={onOpenAIChat}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 text-xs text-[#163d78] transition-colors shadow-xs cursor-pointer"
            title="Buka Asisten Tanya AI QC"
          >
            <span className="flex items-center gap-1.5 font-semibold text-xs">
              <Bot className="w-4 h-4 text-[#163d78]" />
              <span>Asisten Mutu AI</span>
            </span>
            <span className="text-[9.5px] font-mono bg-[#163d78] text-white px-1.5 py-0.2 rounded-[2px] font-bold">
              AI
            </span>
          </button>
        )}

        <div className="text-center pt-0.5">
          <div className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider">
            PT Asuka Engineering
          </div>
          <div className="text-[9px] font-mono text-slate-400">
            QCA EDMS v3.0 (Next.js)
          </div>
        </div>
      </div>
    </aside>
  );
}

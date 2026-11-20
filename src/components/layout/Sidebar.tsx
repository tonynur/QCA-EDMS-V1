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
  Trash2,
  CheckCircle2,
  Phone,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavTab =
  | "dashboard"
  | "overview"
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
  | "settings"
  | "mytasks"
  | "recyclebin";

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
      group: "Monitoring & Laporan",
      items: [
        {
          id: "command",
          label: "Command Center",
          icon: <Target className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "overview",
          label: "Ringkasan Proyek",
          icon: <Building2 className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "analytics",
          label: "Analisis Dokumen",
          icon: <BarChart3 className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "approval",
          label: "Approval",
          icon: <ClipboardCheck className="w-4 h-4" strokeWidth={1.8} />,
          badge: pendingApprovalCount > 0 ? pendingApprovalCount : undefined,
        },
      ],
    },
    {
      group: "Dokumen Mutu",
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
      group: "Inspeksi & Alat",
      items: [
        {
          id: "nfilog",
          label: "NFI Log",
          icon: <AlertCircle className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "sitereport",
          label: "Inspeksi Lapangan",
          icon: <ClipboardList className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "calibration",
          label: "Kalibrasi Alat",
          icon: <Ruler className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "ncr",
          label: "Monitoring NCR",
          icon: <AlertOctagon className="w-4 h-4" strokeWidth={1.8} />,
        },
      ],
    },
    {
      group: "Administrasi",
      items: [
        {
          id: "users",
          label: "Manajemen User",
          icon: <Users className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "projects",
          label: "Kelola Proyek",
          icon: <Building2 className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "settings",
          label: "Pengaturan Sistem",
          icon: <Settings className="w-4 h-4" strokeWidth={1.8} />,
        },
        {
          id: "recyclebin",
          label: "Sampah",
          icon: <Trash2 className="w-4 h-4" strokeWidth={1.8} />,
        },
      ],
    },
  ];

  // Accordion State
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Monitoring & Laporan": true,
    "Dokumen Mutu": true,
    "Inspeksi & Alat": true,
    "Administrasi": true,
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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-3.5rem)] shrink-0 select-none shadow-[1px_0_3px_rgba(0,0,0,0.03)]">
      {/* 🎯 GLOBAL PROJECT FOCUS (Top of Sidebar) */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-1.5">
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
          className="w-full bg-white border border-slate-300 text-xs text-slate-800 rounded-[6px] px-2.5 py-1.5 outline-none focus:border-[#163d78] cursor-pointer shadow-sm font-medium"
        >
          <option value="">Semua Proyek (Global Portfolio)</option>
          {projects.map((p) => (
            <option key={p.code} value={p.code}>
              {p.code} - {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* 📑 NAVIGATION ACCORDION */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
        {menuGroups.map((group) => {
          const isOpen = openGroups[group.group] !== false;
          return (
            <div key={group.group} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.group)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors"
              >
                <span>{group.group}</span>
                {isOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onTabChange(item.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-2 rounded-[6px] text-xs font-medium transition-all text-left",
                          isActive
                            ? "bg-[#ed2e35]/10 text-[#ed2e35] font-bold shadow-xs border border-[#ed2e35]/20"
                            : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className={cn(
                              "shrink-0",
                              isActive ? "text-[#ed2e35]" : "text-slate-500"
                            )}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge !== undefined && (
                          <span className="px-1.5 py-0.2 rounded-[3px] font-mono text-[10px] font-bold tabular-nums bg-[#ed2e35] text-white">
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

        {/* 🤖 SEKSI TANYA AI QC */}
        <div className="pt-2 border-t border-dashed border-slate-200">
          {onOpenAIChat && (
            <button
              onClick={onOpenAIChat}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-[6px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 transition-colors cursor-pointer"
              title="Buka Asisten Tanya AI QC"
            >
              <span className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <Bot className="w-4 h-4 text-[#163d78]" strokeWidth={2} />
                <span>Tanya AI QC</span>
              </span>
              <span className="text-[9px] font-bold bg-[#163d78] text-white px-1.5 py-0.5 rounded-[3px]">
                AI
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 🆕 OFFICIAL FOOTER & DEVELOPER SHOWCASE CARD */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/90 space-y-2.5 shrink-0">
        <div className="flex flex-col items-center justify-center text-center">
          <Image
            src="/icons/logo.png"
            alt="ASUKA"
            width={120}
            height={24}
            className="h-5 w-auto object-contain mx-auto"
          />
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-medium">
            <span className="font-semibold text-slate-700">PT Asuka Engineering</span>
            <span>·</span>
            <span className="font-mono text-slate-400">v3.2.1</span>
          </div>
        </div>

        {/* Developer Card (Ahmad Nur Fatony) */}
        <div className="p-2 rounded-[6px] bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8.5px] font-mono font-bold tracking-wider text-slate-600 uppercase">
                LEAD SYSTEM DEVELOPER
              </span>
              <span className="text-xs font-bold text-slate-800">
                Ahmad Nur Fatony
              </span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-[3px] bg-[#163d78] text-white font-mono">
              PRO
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-600 hover:underline"
            >
              <Phone className="w-3 h-3" />
              <span>WhatsApp</span>
            </a>
            <a
              href="mailto:fatony@asuka.id"
              className="flex items-center gap-1 text-[#163d78] hover:underline"
            >
              <Mail className="w-3 h-3" />
              <span>Email</span>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}

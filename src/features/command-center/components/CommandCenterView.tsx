"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Target,
  Search,
  RefreshCw,
  Download,
  BarChart2,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  ClipboardCheck,
  PackageCheck,
  Filter,
  SlidersHorizontal,
  ExternalLink,
  PieChart,
} from "lucide-react";
import { commandCenterService } from "../services/command-center-service";
import {
  ExecutiveProject,
  ExecutiveTotals,
  CCSortOrder,
} from "../types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface CommandCenterViewProps {
  onSelectProject?: (projectCode: string) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function CommandCenterView({
  onSelectProject,
  showToast,
}: CommandCenterViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [projects, setProjects] = useState<ExecutiveProject[]>([]);
  const [totals, setTotals] = useState<ExecutiveTotals | null>(null);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<CCSortOrder>("critical_first");
  const [showCharts, setShowCharts] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Fetch data
  const loadData = useCallback(async () => {
    try {
      const res = await commandCenterService.getExecutiveDashboard();
      if (res.success) {
        setProjects(res.projects || []);
        setTotals(res.totals || null);
        setDisciplines(res.disciplines || []);
        setLastUpdate(res.lastUpdate || new Date().toISOString());
      }
    } catch {
      showToast?.("Gagal memuat data Command Center", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!active) return;
      await loadData();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [loadData]);

  // Filter & Sort Logic
  const filteredProjects = useMemo(() => {
    let result = projects;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.pic && p.pic.toLowerCase().includes(q))
      );
    }

    if (selectedDiscipline && selectedDiscipline !== "ALL") {
      if (selectedDiscipline === "MRIR") {
        result = result.filter((p) => (p.totalMRIR || 0) > 0);
      } else {
        result = result.filter((p) => {
          const inDisciplines = p.disciplines?.some(
            (d) => d.toLowerCase() === selectedDiscipline.toLowerCase()
          );
          const inItrDisc = p.itrByDiscipline
            ? Object.keys(p.itrByDiscipline).some(
                (k) =>
                  k.toLowerCase().includes(selectedDiscipline.toLowerCase()) &&
                  (p.itrByDiscipline?.[k] || 0) > 0
              )
            : false;
          return inDisciplines || inItrDisc;
        });
      }
    }

    const sorted = [...result].sort((a, b) => {
      if (sortOrder === "critical_first") {
        const healthRank: Record<string, number> = { red: 0, yellow: 1, green: 2 };
        const hA = healthRank[a.health] ?? 3;
        const hB = healthRank[b.health] ?? 3;
        if (hA !== hB) return hA - hB;
        return (b.oldestOpenDays || 0) - (a.oldestOpenDays || 0);
      }
      if (sortOrder === "progress_asc") {
        const pctA = a.total > 0 ? a.closed / a.total : 0;
        const pctB = b.total > 0 ? b.closed / b.total : 0;
        return pctA - pctB;
      }
      if (sortOrder === "total_desc") {
        return (b.total || 0) - (a.total || 0);
      }
      if (sortOrder === "code_asc") {
        return a.code.localeCompare(b.code);
      }
      return 0;
    });

    return sorted;
  }, [projects, searchQuery, selectedDiscipline, sortOrder]);

  const handleSync = async () => {
    setIsSyncing(true);
    setIsLoading(true);
    try {
      const res = await commandCenterService.syncAllProjects();
      showToast?.(res.message || "Sinkronisasi selesai", "success");
      await loadData();
    } catch {
      showToast?.("Gagal sinkronisasi proyek", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportCSV = () => {
    if (!totals || projects.length === 0) {
      showToast?.("Tidak ada data untuk diekspor", "info");
      return;
    }
    commandCenterService.exportToCSV(filteredProjects, totals);
    showToast?.("Data Command Center berhasil diekspor ke CSV", "success");
  };

  const toggleCard = (code: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const globalProgress = useMemo(() => {
    if (!totals || totals.total === 0) return 0;
    return Math.round((totals.closed / totals.total) * 100);
  }, [totals]);

  const maxAgingInfo = useMemo(() => {
    let maxDays = 0;
    let projCode = "";
    for (const p of projects) {
      if ((p.oldestOpenDays || 0) > maxDays && p.open > 0) {
        maxDays = p.oldestOpenDays || 0;
        projCode = p.code;
      }
    }
    return { maxDays, projCode };
  }, [projects]);

  const donutTotals = useMemo(() => {
    if (!totals) return null;
    const total = totals.total || 1;
    const C = 238.76;
    const closedLen = (totals.closed / total) * C;
    const openLen = (totals.open / total) * C;
    const otherLen = ((totals.canceled + totals.other) / total) * C;

    const closedOff = 0;
    const openOff = -closedLen;
    const otherOff = -(closedLen + openLen);

    return {
      C,
      closedLen, openLen, otherLen,
      closedOff, openOff, otherOff,
    };
  }, [totals]);

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* ═══ EXECUTIVE COMMAND DECK HEADER ═══ */}
      <PageHeader
        variant="executive"
        category="MONITORING & LAPORAN // COMMAND DECK"
        title="QA/QC Command Center"
        badge={`${filteredProjects.length} Proyek Aktif`}
        description="Monitoring terpadu seluruh portofolio proyek dalam 1 layar — terhubung langsung ke Master Hub Cloud, ITR & Log NFI"
        icon={<Target className="w-4 h-4 text-[#38bdf8]" />}
        actions={
          <>
            <button
              onClick={() => setShowCharts(!showCharts)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-sans font-semibold transition-all cursor-pointer",
                showCharts
                  ? "bg-[#38bdf8] text-[#0c1b40] font-bold shadow-sm"
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
              )}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>{showCharts ? "Grafik Aktif" : "Buka Grafik"}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 rounded-[6px] text-xs font-sans font-semibold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] bg-[#ed2e35] hover:bg-[#c92026] text-white font-sans font-semibold text-xs tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
              <span>{isSyncing ? "Menyinkronkan..." : "Sync Master Hub"}</span>
            </button>
          </>
        }
      />

      {/* ═══ FILTER & SEARCH TOOLBAR ═══ */}
      <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="relative min-w-[180px] sm:min-w-[220px] max-w-sm flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari proyek, kode, atau PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-[6px] focus:outline-none focus:border-[#163d78] focus:bg-white text-slate-900 transition-colors placeholder:text-slate-400 font-sans"
            />
          </div>

          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-[6px] text-slate-800 font-medium focus:outline-none focus:border-[#163d78] cursor-pointer shadow-sm"
          >
            <option value="ALL">Semua Disiplin</option>
            {disciplines.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            <option value="MRIR">MRIR (Material Receiving)</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as CCSortOrder)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-[6px] text-slate-800 font-medium focus:outline-none focus:border-[#163d78] cursor-pointer shadow-sm"
          >
            <option value="critical_first">Prioritas: Kritis Dulu</option>
            <option value="progress_asc">Progres: Terendah Dulu</option>
            <option value="total_desc">Volume: Terbanyak Dulu</option>
            <option value="code_asc">Kode Proyek: A - Z</option>
          </select>

          {(searchQuery || selectedDiscipline !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDiscipline("ALL");
              }}
              className="text-xs font-sans text-rose-600 hover:text-rose-800 underline px-1.5 cursor-pointer font-medium"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="text-xs font-sans text-slate-500 self-end md:self-auto flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-[4px] border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{lastUpdate ? `Update: ${new Date(lastUpdate).toLocaleTimeString("id-ID")} WIB` : "Menunggu sinkronisasi..."}</span>
        </div>
      </div>

      {/* ═══ 1. TOP EXECUTIVE 3-COLUMN METRICS ═══ */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {/* Column 1: Volume Dokumen Mutu */}
          <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm flex flex-col justify-between border-l-4 border-l-[#163d78]">
            <div>
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-[4px] bg-[#163d78]/10 text-[#163d78] flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
                    Volume Dokumen Mutu
                  </h3>
                </div>
                <span className="text-[10px] font-sans text-[#163d78] bg-blue-50 px-2 py-0.5 rounded-[3px] border border-blue-200 font-semibold tracking-wide">
                  TOTAL RECORD
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-[6px] bg-slate-50 border-l-2 border-[#163d78]">
                  <span className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                    <FileText className="w-3.5 h-3.5 text-[#163d78]" />
                    NFI Unik
                  </span>
                  <span className="text-sm font-bold font-sans text-slate-900 tabular-nums">
                    {(totals.totalNFI || 0).toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-[6px] bg-slate-50 border-l-2 border-slate-400">
                  <span className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                    <ClipboardCheck className="w-3.5 h-3.5 text-slate-500" />
                    ITR Terverifikasi
                  </span>
                  <span className="text-sm font-bold font-sans text-slate-900 tabular-nums">
                    {(totals.totalITR || 0).toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-[6px] bg-slate-50 border-l-2 border-amber-500">
                  <span className="text-xs text-amber-800 flex items-center gap-1.5 font-medium">
                    <PackageCheck className="w-3.5 h-3.5 text-amber-600" />
                    MRIR Material
                  </span>
                  <span className="text-sm font-bold font-sans text-amber-700 tabular-nums">
                    {(totals.totalMRIR || 0).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-500">
              <span>Total: <strong className="text-slate-800 tabular-nums font-semibold">{totals.total.toLocaleString("id-ID")}</strong> records</span>
              <span><strong className="text-slate-800 tabular-nums font-semibold">{totals.projectsActive}</strong> Proyek Aktif</span>
            </div>
          </div>

          {/* Column 2: Klasifikasi Disiplin (ITR & MRIR) */}
          <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm flex flex-col justify-between border-l-4 border-l-sky-600">
            <div>
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-[4px] bg-sky-500/10 text-sky-700 flex items-center justify-center">
                    <ClipboardCheck className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
                    Klasifikasi Disiplin
                  </h3>
                </div>
                <span className="text-[10px] font-sans text-sky-700 bg-sky-50 px-2 py-0.5 rounded-[3px] border border-sky-200 font-semibold tracking-wide">
                  ITR & MRIR
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-[148px] overflow-y-auto pr-1">
                {Object.entries(totals.itrByDiscipline || {}).map(([disc, count]) => {
                  const isSelected = selectedDiscipline === disc.replace("ITR ", "");
                  return (
                    <button
                      key={disc}
                      onClick={() => setSelectedDiscipline(isSelected ? "ALL" : disc.replace("ITR ", ""))}
                      className={cn(
                        "flex items-center justify-between p-1.5 rounded-[4px] border text-left transition-colors cursor-pointer",
                        isSelected
                          ? "bg-[#163d78] border-[#163d78] text-white"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                      )}
                    >
                      <span className="text-xs truncate font-medium">{disc}</span>
                      <span className="text-xs font-sans font-bold ml-1 tabular-nums">
                        {count.toLocaleString("id-ID")}
                      </span>
                    </button>
                  );
                })}

                <button
                  onClick={() => setSelectedDiscipline(selectedDiscipline === "MRIR" ? "ALL" : "MRIR")}
                  className={cn(
                    "col-span-2 flex items-center justify-between p-1.5 rounded-[4px] border text-left transition-colors cursor-pointer",
                    selectedDiscipline === "MRIR"
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                  )}
                >
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5" />
                    MRIR (Material Receiving)
                  </span>
                  <span className="text-xs font-sans font-bold tabular-nums">
                    {(totals.totalMRIR || 0).toLocaleString("id-ID")}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-3 pt-2 text-xs font-sans text-slate-500">
              {totals.itrEmpty > 0 ? (
                <span className="text-[#ed2e35] font-medium">{totals.itrEmpty} data belum terklasifikasi</span>
              ) : (
                "Seluruh data ITR terklasifikasi rapi."
              )}
            </div>
          </div>

          {/* Column 3: Status Pelaksanaan Global */}
          <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm flex flex-col justify-between border-l-4 border-l-emerald-600 col-span-1 md:col-span-2 xl:col-span-1">
            <div>
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-[4px] bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
                    Status Pelaksanaan Global
                  </h3>
                </div>
                <span className="text-[10px] font-sans text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[3px] border border-emerald-200 font-semibold tracking-wide">
                  PORTOFOLIO
                </span>
              </div>

              <div className="flex items-center gap-4 my-2">
                <div className="w-16 h-16 rounded-[6px] bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center shrink-0">
                  <span className="text-lg font-bold font-sans text-emerald-700 tabular-nums">
                    {globalProgress}%
                  </span>
                  <span className="text-[10px] uppercase font-sans font-bold text-emerald-600 tracking-wider">Selesai</span>
                </div>

                <div className="space-y-0.5 font-sans">
                  <div className="text-sm font-bold text-emerald-700 tabular-nums">
                    {totals.closed.toLocaleString("id-ID")} Closed
                  </div>
                  <div className="text-xs font-bold text-rose-700 tabular-nums">
                    {totals.open.toLocaleString("id-ID")} Open Aktif
                  </div>
                  <div className="text-xs text-slate-500 tabular-nums font-medium">
                    {(totals.canceled + totals.other).toLocaleString("id-ID")} Canceled / Lain
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100">
              {maxAgingInfo.maxDays > 30 ? (
                <div className="p-2.5 rounded-[4px] bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 font-sans">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Aging Terlama: <strong className="font-bold">{maxAgingInfo.maxDays} hari</strong> (Proyek <span className="font-mono font-semibold">{maxAgingInfo.projCode}</span>)</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-[4px] bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-sans">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Seluruh Proyek Berjalan Sesuai Jadwal</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PRESENTATION CHARTS DECK ═══ */}
      {showCharts && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Chart 1: Project Comparison (Bar Chart) */}
          <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
                  Komparasi Status Dokumen per Proyek
                </h3>
              </div>
              <span className="text-xs font-sans text-slate-500 tabular-nums">
                {filteredProjects.length} Proyek
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredProjects.map((p) => {
                const total = p.total || 1;
                const closedPct = Math.round((p.closed / total) * 100);
                const openPct = Math.round((p.open / total) * 100);
                const mrirCount = p.totalMRIR || 0;

                return (
                  <div key={p.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#163d78]">{p.code}</span>
                        <span className="text-slate-600 truncate max-w-[140px] hidden sm:inline font-sans">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-sans font-medium tabular-nums">
                        <span className="text-emerald-700">{p.closed} Cls</span>
                        <span className="text-rose-700">{p.open} Opn</span>
                        {mrirCount > 0 && <span className="text-amber-700">{mrirCount} MRIR</span>}
                      </div>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-[2px] overflow-hidden flex">
                      <div style={{ width: `${closedPct}%` }} className="bg-emerald-600 h-full" />
                      <div style={{ width: `${openPct}%` }} className="bg-rose-600 h-full" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-center gap-6 text-xs font-sans text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[1px] bg-emerald-600" />Closed</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[1px] bg-rose-600" />Open Aktif</span>
            </div>
          </div>

          {/* Chart 2: Global Execution Status Donut Chart */}
          <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
                    Status Pelaksanaan Global
                  </h3>
                </div>
                <span className="text-[11px] font-sans text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-[3px] border border-emerald-200">
                  {globalProgress}% Selesai
                </span>
              </div>

              {donutTotals && totals && (
                <div className="flex flex-col items-center justify-center py-2 space-y-4">
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                      {totals.closed > 0 && (
                        <circle
                          cx="50" cy="50" r="38" fill="transparent" stroke="#059669" strokeWidth="12"
                          strokeDasharray={`${donutTotals.closedLen} ${donutTotals.C}`}
                          strokeDashoffset={donutTotals.closedOff}
                        />
                      )}
                      {totals.open > 0 && (
                        <circle
                          cx="50" cy="50" r="38" fill="transparent" stroke="#e11d48" strokeWidth="12"
                          strokeDasharray={`${donutTotals.openLen} ${donutTotals.C}`}
                          strokeDashoffset={donutTotals.openOff}
                        />
                      )}
                      {(totals.canceled + totals.other) > 0 && (
                        <circle
                          cx="50" cy="50" r="38" fill="transparent" stroke="#64748b" strokeWidth="12"
                          strokeDasharray={`${donutTotals.otherLen} ${donutTotals.C}`}
                          strokeDashoffset={donutTotals.otherOff}
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-bold font-sans text-slate-900 tabular-nums">{globalProgress}%</span>
                      <span className="text-[10px] font-sans text-emerald-700 font-bold uppercase tracking-wider">Selesai</span>
                    </div>
                  </div>

                  <div className="w-full space-y-1.5 text-xs font-sans">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-[1px] bg-[#059669] shrink-0" />
                        <span>Closed (Selesai)</span>
                      </span>
                      <span className="font-bold text-slate-900 tabular-nums">{totals.closed.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-[1px] bg-[#e11d48] shrink-0" />
                        <span>Open Aktif</span>
                      </span>
                      <span className="font-bold text-rose-700 tabular-nums">{totals.open.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-[1px] bg-[#64748b] shrink-0" />
                        <span>Canceled / Lain</span>
                      </span>
                      <span className="font-medium text-slate-500 tabular-nums">{(totals.canceled + totals.other).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <span className="text-xs font-sans text-slate-500">Total: <strong className="text-slate-800 tabular-nums">{totals?.total.toLocaleString("id-ID")}</strong> records</span>
            </div>
          </div>

          {/* Chart 3: Discipline & Material Distribution (Bar Chart) */}
          <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
                  Distribusi Disiplin Mutu Portofolio
                </h3>
              </div>
              <span className="text-xs font-sans text-slate-500">ITR & MRIR</span>
            </div>

            {totals && (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {Object.entries(totals.itrByDiscipline || {}).map(([disc, count]) => {
                  const pct = totals.totalITR > 0 ? Math.round((count / totals.totalITR) * 100) : 0;
                  return (
                    <div key={disc} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="text-slate-700 font-medium">{disc}</span>
                        <span className="text-slate-500 tabular-nums">{count} dok ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-[2px] overflow-hidden">
                        <div style={{ width: `${pct}%` }} className="bg-[#163d78] h-full" />
                      </div>
                    </div>
                  );
                })}

                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5" />
                      Material Receiving (MRIR)
                    </span>
                    <span className="text-amber-700 tabular-nums font-medium">{totals.totalMRIR || 0} dok</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-[2px] overflow-hidden">
                    <div
                      style={{
                        width: `${totals.total > 0 ? Math.round(((totals.totalMRIR || 0) / totals.total) * 100) : 0}%`,
                      }}
                      className="bg-amber-600 h-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ 2. ACTIVE PROJECTS GRID ═══ */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-4 bg-[#163d78] rounded-[1px]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-sans">
              Portofolio Proyek Aktif
            </h2>
            <span className="text-xs font-sans px-2 py-0.5 rounded-[3px] bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {filteredProjects.length} Proyek
            </span>
          </div>
          <span className="text-xs font-sans text-slate-500 hidden sm:inline">
            Standar Pengendalian Mutu Konstruksi & Fabrikasi
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-[8px]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-500 font-sans">Memuat portofolio proyek...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-[8px]">
            <Search className="w-6 h-6 mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-500 font-sans">Tidak ada proyek yang sesuai dengan kriteria filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredProjects.map((p) => {
              const pct = p.total > 0 ? Math.round((p.closed / p.total) * 100) : 0;
              const isExpanded = !!expandedCards[p.code];
              const mrirCount = p.totalMRIR || 0;

              return (
                <div
                  key={p.code}
                  className={cn(
                    "p-4 bg-white border rounded-[8px] shadow-sm transition-colors flex flex-col justify-between",
                    p.health === "red"
                      ? "border-rose-300 border-l-4 border-l-rose-600"
                      : p.health === "yellow"
                      ? "border-amber-300 border-l-4 border-l-amber-500"
                      : "border-slate-200 border-l-4 border-l-emerald-600"
                  )}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono font-bold text-xs text-[#163d78] bg-blue-50 px-2 py-0.5 rounded-[3px] border border-blue-200">
                        {p.code}
                      </span>
                      {p.health === "red" ? (
                        <Badge variant="rejected" className="rounded-[3px] font-sans font-semibold">Kritis</Badge>
                      ) : p.health === "yellow" ? (
                        <Badge variant="pending" className="rounded-[3px] font-sans font-semibold">Waspada</Badge>
                      ) : (
                        <Badge variant="approved" className="rounded-[3px] font-sans font-semibold">Lancar</Badge>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-3 font-sans" title={p.name}>
                      {p.name}
                    </h3>

                    {/* Mini Metric Grid */}
                    <div className="grid grid-cols-5 gap-1 text-center bg-slate-50 p-2 rounded-[6px] border border-slate-200 mb-3">
                      <div>
                        <div className="text-xs font-sans font-bold text-slate-900 tabular-nums">{p.totalNFI || 0}</div>
                        <div className="text-[10px] font-sans text-slate-500 font-medium">NFI</div>
                      </div>
                      <div>
                        <div className="text-xs font-sans font-bold text-slate-900 tabular-nums">{p.totalITR || 0}</div>
                        <div className="text-[10px] font-sans text-slate-500 font-medium">ITR</div>
                      </div>
                      <div>
                        <div className="text-xs font-sans font-bold text-amber-700 tabular-nums">{mrirCount}</div>
                        <div className="text-[10px] font-sans text-amber-700 font-medium">MRIR</div>
                      </div>
                      <div>
                        <div className="text-xs font-sans font-bold text-rose-700 tabular-nums">{p.open || 0}</div>
                        <div className="text-[10px] font-sans text-rose-700 font-medium">Open</div>
                      </div>
                      <div>
                        <div className="text-xs font-sans font-bold text-emerald-700 tabular-nums">{p.closed || 0}</div>
                        <div className="text-[10px] font-sans text-emerald-700 font-medium">Clsd</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between text-xs font-sans text-slate-500">
                        <span>Penyelesaian Dokumen</span>
                        <span className="font-bold text-slate-800 tabular-nums">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-[2px] overflow-hidden">
                        <div style={{ width: `${pct}%` }} className="bg-emerald-600 h-full transition-all duration-300" />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
                      <div className="flex items-center gap-1.5 truncate max-w-[180px]" title={`PIC: ${p.pic || "Belum ditentukan"}`}>
                        <User className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{p.pic || "—"}</span>
                      </div>

                      {p.oldestOpenDays && p.oldestOpenDays > 0 && p.open > 0 ? (
                        <span className={cn("flex items-center gap-1 font-bold tabular-nums", p.oldestOpenDays > 30 ? "text-rose-700" : "text-amber-700")}>
                          <Clock className="w-3.5 h-3.5" />
                          {p.oldestOpenDays} hari
                        </span>
                      ) : (
                        <span className="text-emerald-700 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          On Schedule
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => toggleCard(p.code)}
                        className="text-xs font-sans text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <span>{isExpanded ? "Tutup Rincian" : "Lihat Rincian"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {onSelectProject && (
                        <button
                          onClick={() => onSelectProject(p.code)}
                          className="text-xs font-sans text-[#163d78] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <span>Buka Dokumen</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                        {p.itrByDiscipline && Object.keys(p.itrByDiscipline).length > 0 && (
                          <div>
                            <div className="text-[11px] font-sans uppercase text-slate-500 mb-1 font-semibold">ITR per Disiplin</div>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(p.itrByDiscipline).map(([d, c]) => (
                                <span key={d} className="px-2 py-0.5 rounded-[3px] bg-slate-50 border border-slate-200 text-xs font-sans text-slate-700">
                                  {d}: <strong className="text-slate-900 tabular-nums font-semibold">{c}</strong>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {p.disciplines && p.disciplines.length > 0 && (
                          <div>
                            <div className="text-[11px] font-sans uppercase text-slate-500 mb-1 font-semibold">Disiplin Teknis</div>
                            <div className="flex flex-wrap gap-1">
                              {p.disciplines.map((d) => (
                                <span key={d} className="px-2 py-0.5 rounded-[3px] bg-blue-50 border border-blue-200 text-xs font-sans text-[#163d78] font-medium">
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { NCREntry, NCRSummary, NCRStatus } from "../types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  ExternalLink,
  Eye,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  BarChart2,
  PieChart,
} from "lucide-react";

interface NCRTableProps {
  entries: NCREntry[];
  summary: NCRSummary;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onViewDetail: (ncr: NCREntry) => void;
  onDeleteNcr: (ncrNo: string) => void;
}

export function NCRTable({
  entries,
  summary,
  isLoading,
  onRefresh,
  onOpenCreateModal,
  onViewDetail,
  onDeleteNcr,
}: NCRTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [showCharts, setShowCharts] = useState(true);

  // Analytics for NCR Bar and Donut Charts
  const ncrStats = useMemo(() => {
    const total = summary.total || entries.length || 1;
    const closed = summary.closed ?? entries.filter((e) => e.status === "CLOSED").length;
    const overdue = summary.overdue ?? entries.filter((e) => e.status === "OVERDUE").length;
    const open = summary.open ?? (total - closed - overdue);

    const closedPct = Math.round((closed / total) * 100);
    const openPct = Math.round((open / total) * 100);
    const overduePct = Math.round((overdue / total) * 100);

    const discCounts: Record<string, number> = {};
    entries.forEach((e) => {
      const d = e.discipline || "CIVIL";
      discCounts[d] = (discCounts[d] || 0) + 1;
    });

    const C = 238.76;
    const closedLen = (closed / total) * C;
    const openLen = (open / total) * C;
    const overdueLen = (overdue / total) * C;

    const closedOff = 0;
    const openOff = -closedLen;
    const overdueOff = -(closedLen + openLen);

    return {
      total,
      closed, open, overdue,
      closedPct, openPct, overduePct,
      discCounts,
      C,
      closedLen, openLen, overdueLen,
      closedOff, openOff, overdueOff,
    };
  }, [entries, summary]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        item.ncrNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ncrProject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.responsiblePerson.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDisc = selectedDiscipline === "ALL" || item.discipline.toLowerCase() === selectedDiscipline.toLowerCase();
      const matchStatus = selectedStatus === "ALL" || item.status === selectedStatus;

      return matchSearch && matchDisc && matchStatus;
    });
  }, [entries, searchQuery, selectedDiscipline, selectedStatus]);

  // Status badge renderer (Anti-AI strict: rounded-[3px], no emoji)
  const renderStatusBadge = (status: NCRStatus, daysRemaining?: string) => {
    switch (status) {
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-[3px] bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            CLOSED
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-[3px] bg-rose-50 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            OVERDUE ({daysRemaining || "0"}d)
          </span>
        );
      case "OPEN":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-[3px] bg-amber-50 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            OPEN ({daysRemaining ? `${daysRemaining}d` : "-"})
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Banner & Actions */}
      <PageHeader
        category="INSPEKSI & ALAT // KETIDAKSESUAIAN"
        title="Monitoring NCR (FR-IMS-QCA-007)"
        badge={`${summary.total || entries.length} NCR Terdaftar`}
        badgeVariant="primary"
        description="Register Non-Conformance Report (NCR), investigasi akar masalah & verifikasi tindakan korektif (CAPA)"
        icon={<AlertOctagon className="w-4 h-4 text-[#ed2e35]" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-[6px] text-xs font-semibold font-mono transition-colors cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#163d78]" />
              <span>{showCharts ? "Tutup Grafik" : "Buka Grafik"}</span>
            </button>
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-[6px] text-xs font-semibold font-mono transition-colors cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#ed2e35] hover:bg-[#c92026] text-white font-semibold text-xs tracking-wide shadow-sm transition-all cursor-pointer font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>Terbitkan NCR Baru</span>
            </button>
          </div>
        }
      />

      {/* 1. KPI Cards (Petrosea-inspired) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-[#163d78] petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Total NCR Terbit</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">{summary.total || entries.length}</p>
            </div>
            <div className="p-2 bg-slate-100 rounded-[6px]">
              <AlertOctagon className="w-5 h-5 text-[#163d78]" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-amber-500 petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">NCR Status Open</p>
              <p className="text-2xl font-bold text-amber-700 tabular-nums mt-0.5">
                {summary.open || entries.filter((e) => e.status === "OPEN").length}
              </p>
            </div>
            <div className="p-2 bg-amber-50 rounded-[6px]">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-rose-600 petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Jatuh Tempo (Overdue)</p>
              <p className="text-2xl font-bold text-rose-700 tabular-nums mt-0.5">
                {summary.overdue || entries.filter((e) => e.status === "OVERDUE").length}
              </p>
            </div>
            <div className="p-2 bg-rose-50 rounded-[6px]">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-emerald-600 petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Terselesaikan (Closed)</p>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums mt-0.5">
                {summary.closed || entries.filter((e) => e.status === "CLOSED").length}
              </p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-[6px]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 1B. Presentation Charts Deck: Grafik Batang & Donat NCR */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* Chart 1: Bar Chart - Distribusi Temuan per Disiplin */}
          <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[4px] bg-[#163d78]/10 text-[#163d78] flex items-center justify-center">
                  <BarChart2 className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                  Distribusi Temuan NCR per Disiplin
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                {ncrStats.total} Total Kasus
              </span>
            </div>

            <div className="space-y-3">
              {Object.entries(ncrStats.discCounts).map(([disc, count]) => {
                const pct = ncrStats.total > 0 ? Math.round((count / ncrStats.total) * 100) : 0;
                return (
                  <div key={disc} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-slate-800">{disc}</span>
                      <span className="font-mono text-slate-500 tabular-nums">{count} kasus ({pct}%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-[2px] overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="bg-[#163d78] h-full transition-all duration-300"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 2: Donut Chart - Status Penyelesaian & Closure Rate */}
          <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[4px] bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <PieChart className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                  Status Penyelesaian NCR (Closure Rate)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-[2px]">
                {ncrStats.closedPct}% Selesai
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-1">
              {/* SVG Donut */}
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                  {ncrStats.closed > 0 && (
                    <circle
                      cx="50" cy="50" r="38" fill="transparent" stroke="#059669" strokeWidth="12"
                      strokeDasharray={`${ncrStats.closedLen} ${ncrStats.C}`}
                      strokeDashoffset={ncrStats.closedOff}
                    />
                  )}
                  {ncrStats.open > 0 && (
                    <circle
                      cx="50" cy="50" r="38" fill="transparent" stroke="#d97706" strokeWidth="12"
                      strokeDasharray={`${ncrStats.openLen} ${ncrStats.C}`}
                      strokeDashoffset={ncrStats.openOff}
                    />
                  )}
                  {ncrStats.overdue > 0 && (
                    <circle
                      cx="50" cy="50" r="38" fill="transparent" stroke="#e11d48" strokeWidth="12"
                      strokeDasharray={`${ncrStats.overdueLen} ${ncrStats.C}`}
                      strokeDashoffset={ncrStats.overdueOff}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">{ncrStats.closedPct}%</span>
                  <span className="text-[9px] font-mono text-emerald-700 font-bold uppercase">Closed</span>
                </div>
              </div>

              {/* Legend & Count Details */}
              <div className="space-y-2 text-xs font-mono w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[#059669] shrink-0" />
                    <span>Terselesaikan (Closed)</span>
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{ncrStats.closed} ({ncrStats.closedPct}%)</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[#d97706] shrink-0" />
                    <span>Open Aktif (Dalam Tindakan)</span>
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{ncrStats.open} ({ncrStats.openPct}%)</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[#e11d48] shrink-0" />
                    <span>Jatuh Tempo (Overdue)</span>
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{ncrStats.overdue} ({ncrStats.overduePct}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Filter & Action Bar */}
      <Card className="p-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari No NCR, proyek, deskripsi, PIC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] focus:outline-none focus:border-[#163d78] focus:bg-white text-slate-800"
              />
            </div>

            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] text-slate-700 font-medium focus:outline-none focus:border-[#163d78]"
            >
              <option value="ALL">Semua Disiplin</option>
              <option value="Civil/Architecture">Sipil / Arsitektur</option>
              <option value="Mechanical">Mekanikal</option>
              <option value="Electrical">Elektrikal</option>
              <option value="Instrument">Instrumentasi</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] text-slate-700 font-medium focus:outline-none focus:border-[#163d78]"
            >
              <option value="ALL">Semua Status</option>
              <option value="OPEN">Status: OPEN</option>
              <option value="OVERDUE">Status: OVERDUE</option>
              <option value="CLOSED">Status: CLOSED</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-xs font-medium border-slate-300 hover:bg-slate-50"
            >
              {isLoading ? "Memuat..." : "Refresh"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenCreateModal}
              className="text-xs font-semibold bg-[#163d78] hover:bg-[#0f2d59] text-white flex items-center gap-1.5 rounded-[6px]"
            >
              <Plus className="w-3.5 h-3.5" />
              Buat NCR Baru
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Tabel Data NCR Register */}
      <Card className="overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3 min-w-[140px]">No. Register NCR</th>
                <th className="py-2.5 px-3 min-w-[120px]">Proyek & Area</th>
                <th className="py-2.5 px-3 w-28">Disiplin</th>
                <th className="py-2.5 px-3 min-w-[240px]">Uraian Ketidaksesuaian</th>
                <th className="py-2.5 px-3 w-28">Target / PIC</th>
                <th className="py-2.5 px-3 w-28 text-center">Status</th>
                <th className="py-2.5 px-3 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 bg-white">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Tidak ada catatan NCR yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((row, idx) => (
                  <tr key={row.ncrNo || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-500 tabular-nums">{row.no || idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-medium text-slate-900">{row.ncrNo}</div>
                      {row.ncrProject && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{row.ncrProject}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800 line-clamp-1">{row.project || "-"}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{row.area || "-"}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-[3px] border border-slate-200">
                        {row.discipline}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="text-slate-800 line-clamp-2 leading-relaxed">{row.description}</p>
                      {row.remarks && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">Catatan: {row.remarks}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800">{row.responsiblePerson || "-"}</div>
                      <div className="text-[10px] text-slate-500 tabular-nums">Due: {row.dueDate || "-"}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">{renderStatusBadge(row.status, row.daysRemaining)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="Lihat Rincian Teknis"
                          onClick={() => onViewDetail(row)}
                          className="p-1 rounded-[4px] text-slate-600 hover:text-[#163d78] hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {row.docLink && (
                          <a
                            href={row.docLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Buka Berkas Google Drive"
                            className="p-1 rounded-[4px] text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          title="Hapus Data NCR"
                          onClick={() => {
                            if (confirm(`Hapus catatan ${row.ncrNo}?`)) {
                              onDeleteNcr(row.ncrNo);
                            }
                          }}
                          className="p-1 rounded-[4px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

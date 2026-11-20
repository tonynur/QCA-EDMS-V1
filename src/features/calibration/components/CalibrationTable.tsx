"use client";

import React, { useState, useMemo } from "react";
import { Search, RefreshCw, Plus, QrCode, FileText, CheckCircle2, Clock, AlertTriangle, Download, BarChart2, PieChart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalibrationTool, CalibrationSummary } from "../types";
import { formatDate, cn } from "@/lib/utils";

interface CalibrationTableProps {
  tools: CalibrationTool[];
  summary: CalibrationSummary;
  isLoading: boolean;
  onRefresh: () => void;
  onAddNew: () => void;
  onScanLabel?: () => void;
}

export function CalibrationTable({
  tools,
  summary,
  isLoading,
  onRefresh,
  onAddNew,
  onScanLabel,
}: CalibrationTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [showCharts, setShowCharts] = useState(true);

  // Calibration Analytics for Bar and Donut Charts
  const calStats = useMemo(() => {
    const total = summary.totalTools || tools.length || 1;
    const valid = summary.validCount ?? tools.filter((t) => t.status === "VALID" || t.status === "CALIBRATED").length;
    const expiring = summary.expiringCount ?? 0;
    const expired = summary.expiredCount ?? tools.filter((t) => t.status === "EXPIRED").length;

    const validPct = Math.round((valid / total) * 100);
    const expiringPct = Math.round((expiring / total) * 100);
    const expiredPct = Math.round((expired / total) * 100);

    const discCounts: Record<string, number> = {};
    tools.forEach((t) => {
      const d = t.discipline || "CIVIL";
      discCounts[d] = (discCounts[d] || 0) + 1;
    });

    const C = 238.76;
    const validLen = (valid / total) * C;
    const expLen = (expiring / total) * C;
    const expiredLen = (expired / total) * C;

    const validOff = 0;
    const expOff = -validLen;
    const expiredOff = -(validLen + expLen);

    return {
      total,
      valid, expiring, expired,
      validPct, expiringPct, expiredPct,
      discCounts,
      C,
      validLen, expLen, expiredLen,
      validOff, expOff, expiredOff,
    };
  }, [tools, summary]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchSearch =
        tool.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tool.certificateNo && tool.certificateNo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDiscipline = selectedDiscipline === "ALL" || tool.discipline === selectedDiscipline;
      const matchStatus = selectedStatus === "ALL" || tool.status === selectedStatus;

      return matchSearch && matchDiscipline && matchStatus;
    });
  }, [tools, searchTerm, selectedDiscipline, selectedStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VALID":
      case "CALIBRATED":
        return <Badge variant="approved">VALID</Badge>;
      case "EXPIRING_SOON":
        return <Badge variant="expiring">EXPIRING</Badge>;
      case "EXPIRED":
        return <Badge variant="overdue">EXPIRED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <PageHeader
        category="INSPEKSI & ALAT // KALIBRASI"
        title="Monitoring & Kalibrasi Alat Ukur"
        badge={`${summary.totalTools} Alat Terdaftar`}
        badgeVariant="primary"
        description="Pengendalian validitas sertifikat kalibrasi instrumen inspeksi teknis lapangan sesuai standar ISO 9001:2015 klausul 7.1.5"
        icon={<FileText className="w-4 h-4 text-[#163d78]" />}
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
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#163d78] hover:bg-[#102d59] text-white font-semibold text-xs tracking-wide shadow-sm transition-all cursor-pointer font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Alat Baru</span>
            </button>
          </div>
        }
      />

      {/* Technical Metric Cards — Light Theme (Petrosea-inspired) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-[#163d78] petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Total Alat Ukur</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">{summary.totalTools}</p>
            </div>
            <div className="p-2 bg-slate-100 rounded-[6px]">
              <FileText className="w-5 h-5 text-[#163d78]" strokeWidth={1.8} />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Master Kalibrasi</span>
            <span className="font-semibold text-slate-700">100%</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-emerald-600 petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Sertifikat Valid</p>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums mt-0.5">{summary.validCount}</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-[6px]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={1.8} />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Status Aktif</span>
            <span className="font-semibold text-emerald-700">{summary.totalTools > 0 ? Math.round((summary.validCount / summary.totalTools) * 100) : 0}%</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-amber-500 petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Segera Berakhir</p>
              <p className="text-2xl font-bold text-amber-700 tabular-nums mt-0.5">{summary.expiringCount}</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-[6px]">
              <Clock className="w-5 h-5 text-amber-600" strokeWidth={1.8} />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>≤ 30 hari</span>
            <span className="font-semibold text-amber-700">{summary.totalTools > 0 ? Math.round((summary.expiringCount / summary.totalTools) * 100) : 0}%</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-rose-600 petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Sudah Kedaluwarsa</p>
              <p className="text-2xl font-bold text-rose-700 tabular-nums mt-0.5">{summary.expiredCount}</p>
            </div>
            <div className="p-2 bg-rose-50 rounded-[6px]">
              <AlertTriangle className="w-5 h-5 text-rose-600" strokeWidth={1.8} />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Perlu Re-kalibrasi</span>
            <span className="font-semibold text-rose-700">{summary.totalTools > 0 ? Math.round((summary.expiredCount / summary.totalTools) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* 1B. Presentation Charts Deck: Grafik Batang & Donat Kalibrasi */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* Chart 1: Bar Chart - Distribusi Alat Ukur per Disiplin */}
          <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[4px] bg-[#163d78]/10 text-[#163d78] flex items-center justify-center">
                  <BarChart2 className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                  Distribusi Alat Ukur per Disiplin
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                {calStats.total} Total Alat
              </span>
            </div>

            <div className="space-y-3">
              {Object.entries(calStats.discCounts).map(([disc, count]) => {
                const pct = calStats.total > 0 ? Math.round((count / calStats.total) * 100) : 0;
                return (
                  <div key={disc} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-slate-800">{disc}</span>
                      <span className="font-mono text-slate-500 tabular-nums">{count} alat ({pct}%)</span>
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

          {/* Chart 2: Donut Chart - Kepatuhan Kalibrasi & Validitas Sertifikat */}
          <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[4px] bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <PieChart className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                  Validitas Sertifikat Kalibrasi
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-[2px]">
                {calStats.validPct}% Valid
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-1">
              {/* SVG Donut */}
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                  {calStats.valid > 0 && (
                    <circle
                      cx="50" cy="50" r="38" fill="transparent" stroke="#059669" strokeWidth="12"
                      strokeDasharray={`${calStats.validLen} ${calStats.C}`}
                      strokeDashoffset={calStats.validOff}
                    />
                  )}
                  {calStats.expiring > 0 && (
                    <circle
                      cx="50" cy="50" r="38" fill="transparent" stroke="#d97706" strokeWidth="12"
                      strokeDasharray={`${calStats.expLen} ${calStats.C}`}
                      strokeDashoffset={calStats.expOff}
                    />
                  )}
                  {calStats.expired > 0 && (
                    <circle
                      cx="50" cy="50" r="38" fill="transparent" stroke="#e11d48" strokeWidth="12"
                      strokeDasharray={`${calStats.expiredLen} ${calStats.C}`}
                      strokeDashoffset={calStats.expiredOff}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">{calStats.validPct}%</span>
                  <span className="text-[9px] font-mono text-emerald-700 font-bold uppercase">Valid</span>
                </div>
              </div>

              {/* Legend & Count Details */}
              <div className="space-y-2 text-xs font-mono w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[#059669] shrink-0" />
                    <span>Sertifikat Valid</span>
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{calStats.valid} ({calStats.validPct}%)</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[#d97706] shrink-0" />
                    <span>Segera Berakhir (≤ 30 hr)</span>
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{calStats.expiring} ({calStats.expiringPct}%)</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[#e11d48] shrink-0" />
                    <span>Sudah Kedaluwarsa</span>
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{calStats.expired} ({calStats.expiredPct}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Action Row — Light Theme */}
      <div className="bg-white p-3 rounded-[8px] border border-slate-200/90 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ID alat / Nama / No Sertifikat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] focus:outline-none focus:border-[#163d78] focus:bg-white text-slate-900 transition-colors"
            />
          </div>

          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] text-slate-700 font-medium focus:outline-none focus:border-[#163d78] cursor-pointer"
          >
            <option value="ALL">Semua Disiplin</option>
            <option value="CIVIL">Civil & Architectural</option>
            <option value="MECHANICAL">Mechanical & Piping</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="INSTRUMENT">Instrumentation</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] text-slate-700 font-medium focus:outline-none focus:border-[#163d78] cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="VALID">Valid</option>
            <option value="EXPIRING_SOON">Expiring Soon</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <button
            onClick={() => {
              if (filteredTools.length === 0) return;
              const headers = ["No","Tool ID","Nama Alat Ukur","Disiplin","No Seri","Tgl Kalibrasi","Kalibrasi Ulang","Status","No Sertifikat","Vendor"];
              const rows = filteredTools.map((t, idx) => [
                idx + 1,`"${t.id}"`,`"${(t.name||"").replace(/"/g,'""')}"`,`"${t.discipline}"`,
                `"${t.serialNumber||""}"`,`"${t.lastCalDate}"`,`"${t.nextCalDate}"`,`"${t.status}"`,
                `"${(t.certificateNo||"").replace(/"/g,'""')}"`,`"${(t.vendor||"").replace(/"/g,'""')}"`,
              ]);
              const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
              const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `Data_Kalibrasi_${new Date().toISOString().slice(0,10)}.csv`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor CSV</span>
          </button>

          {onScanLabel && (
            <button
              onClick={onScanLabel}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-[6px] text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-600" />
              <span>Scan Label</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-[6px] text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Data Kalibrasi"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#ed2e35] hover:bg-[#c92026] text-white font-semibold text-xs tracking-wide shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Update Kalibrasi</span>
          </button>
        </div>
        </div>
      </div>

      {/* Main Technical Table — Light Theme */}
      <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3 w-32">Tool ID</th>
                <th className="py-2.5 px-3 min-w-[220px]">Nama Alat & Spesifikasi</th>
                <th className="py-2.5 px-3 w-32">Disiplin</th>
                <th className="py-2.5 px-3 w-28 text-center">Tgl Kalibrasi</th>
                <th className="py-2.5 px-3 w-28 text-center">Tgl Kedaluwarsa</th>
                <th className="py-2.5 px-3 w-28 text-center">Status</th>
                <th className="py-2.5 px-3 w-36">No Sertifikat</th>
                <th className="py-2.5 px-3 w-28">PIC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 bg-white">
              {filteredTools.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-mono text-xs">
                    {isLoading ? "Memuat data kalibrasi dari Google Apps Script..." : "Tidak ada data alat ukur yang sesuai kriteria."}
                  </td>
                </tr>
              ) : (
                filteredTools.map((tool, index) => (
                  <tr key={tool.id} className="hover:bg-slate-50/80 transition-colors even:bg-slate-50/30">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-xs tabular-nums">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#163d78] text-xs">
                      {tool.id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 text-xs">{tool.name}</div>
                      {tool.brand && (
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {tool.brand}{tool.serialNumber ? ` | SN: ${tool.serialNumber}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-700">{tool.discipline}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-600 tabular-nums">{formatDate(tool.lastCalDate)}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-600 tabular-nums">{formatDate(tool.nextCalDate)}</td>
                    <td className="py-2.5 px-3 text-center">{getStatusBadge(tool.status)}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 truncate max-w-[140px]">{tool.certificateNo || "-"}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-700">{tool.pic || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-200 text-slate-500 font-mono text-[11px] flex items-center justify-between">
          <span>Menampilkan {filteredTools.length} dari {tools.length} alat ukur</span>
          <span>PT Asuka Engineering Indonesia — Kalibrasi & Metrologi</span>
        </div>
      </div>
    </div>
  );
}

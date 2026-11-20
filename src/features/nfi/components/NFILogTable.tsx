"use client";

import React, { useState, useMemo } from "react";
import { Search, RefreshCw, Plus, CheckCircle2, Clock, XCircle, FileSpreadsheet, Download, Upload } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { NFIEntry, NFISummary } from "../types";
import { formatDate } from "@/lib/utils";

interface NFILogTableProps {
  entries: NFIEntry[];
  summary: NFISummary;
  isLoading: boolean;
  onRefresh: () => void;
  onAddNew?: () => void;
  onOpenImport?: () => void;
}

export function NFILogTable({
  entries,
  summary,
  isLoading,
  onRefresh,
  onAddNew,
  onOpenImport,
}: NFILogTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const matchSearch =
        item.noNfi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subjectDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.picAei.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDiscipline = selectedDiscipline === "ALL" || item.discipline === selectedDiscipline;
      const matchStatus = selectedStatus === "ALL" || item.status === selectedStatus;

      return matchSearch && matchDiscipline && matchStatus;
    });
  }, [entries, searchTerm, selectedDiscipline, selectedStatus]);

  const renderResultBadge = (result: string) => {
    switch (result) {
      case "PASS":
        return <Badge variant="approved">PASS</Badge>;
      case "FAIL":
        return <Badge variant="overdue">FAIL</Badge>;
      case "RE-INSPECT":
        return <Badge variant="expiring">RE-INSPECT</Badge>;
      default:
        return <Badge variant="neutral">{result}</Badge>;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
      case "PENDING":
        return <Badge variant="pending">OPEN</Badge>;
      case "CLOSED":
      case "RESOLVED":
        return <Badge variant="approved">CLOSED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Banner & Actions */}
      <PageHeader
        category="INSPEKSI & ALAT // LOG TEMUAN"
        title="Notice For Inspection (NFI Log Sheet)"
        badge={`${summary.total} Temuan Lapangan`}
        badgeVariant="primary"
        description="Pencatatan dan pemantauan tindak lanjut temuan inspeksi mutu (CAPA) di seluruh proyek"
        icon={<FileSpreadsheet className="w-4 h-4 text-[#163d78]" />}
        actions={
          <div className="flex items-center gap-2">
            {onOpenImport && (
              <button
                onClick={onOpenImport}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-[6px] text-xs font-semibold font-mono transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Import Batch</span>
              </button>
            )}
            {onAddNew && (
              <button
                onClick={onAddNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#ed2e35] hover:bg-[#c92026] text-white font-semibold text-xs tracking-wide shadow-sm transition-all cursor-pointer font-mono"
              >
                <Plus className="w-4 h-4" />
                <span>Catat NFI Baru</span>
              </button>
            )}
          </div>
        }
      />

      {/* KPI Cards — Light Theme (Petrosea-inspired) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-[#163d78] petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Total Temuan NFI</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">{summary.total}</p>
            </div>
            <div className="p-2 bg-slate-100 rounded-[6px]">
              <FileSpreadsheet className="w-5 h-5 text-[#163d78]" strokeWidth={1.8} />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Notice of Finding</span>
            <span className="font-semibold text-slate-700">100%</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-amber-500 petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Temuan Open</p>
              <p className="text-2xl font-bold text-amber-700 tabular-nums mt-0.5">{summary.openCount}</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-[6px]">
              <Clock className="w-5 h-5 text-amber-600" strokeWidth={1.8} />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Perlu CAPA</span>
            <span className="font-semibold text-amber-700">{summary.total > 0 ? Math.round((summary.openCount / summary.total) * 100) : 0}%</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-rose-600 petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Hasil Fail / Re-Inspect</p>
              <p className="text-2xl font-bold text-rose-700 tabular-nums mt-0.5">{summary.failCount}</p>
            </div>
            <div className="p-2 bg-rose-50 rounded-[6px]">
              <XCircle className="w-5 h-5 text-rose-600" strokeWidth={1.8} />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Tidak Sesuai Spek</span>
            <span className="font-semibold text-rose-700">{summary.total > 0 ? Math.round((summary.failCount / summary.total) * 100) : 0}%</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-emerald-600 petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Selesai (Closed)</p>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums mt-0.5">{summary.closedCount}</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-[6px]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={1.8} />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Terverifikasi Tuntas</span>
            <span className="font-semibold text-emerald-700">{summary.total > 0 ? Math.round((summary.closedCount / summary.total) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* Filter & Action Row — Light Theme */}
      <div className="bg-white p-3 rounded-[8px] border border-slate-200/90 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nomor NFI / uraian / area / PIC..."
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
              <option value="OPEN">Open / Pending</option>
              <option value="CLOSED">Closed / Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <button
              onClick={() => {
                if (filteredEntries.length === 0) return;
                const headers = ["No","No NFI","Subject / Description","Discipline","Area / Location","Inspection Date","Result","Status","PIC AEI","Remark"];
                const rows = filteredEntries.map((e, idx) => [
                  idx + 1,`"${e.noNfi}"`,`"${(e.subjectDescription||"").replace(/"/g,'""')}"`,`"${e.discipline}"`,
                  `"${(e.area||"").replace(/"/g,'""')}"`,`"${e.inspectionDate}"`,`"${e.result}"`,`"${e.status}"`,
                  `"${e.picAei}"`,`"${(e.remark||"").replace(/"/g,'""')}"`,
                ]);
                const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
                const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `NFI_Log_${new Date().toISOString().slice(0,10)}.csv`; a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ekspor CSV</span>
            </button>

            {onOpenImport && (
              <button
                onClick={onOpenImport}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-[6px] text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Impor Batch</span>
              </button>
            )}

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-[6px] text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh Data NFI"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            {onAddNew && (
              <button
                onClick={onAddNew}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#ed2e35] hover:bg-[#c92026] text-white font-semibold text-xs tracking-wide shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Catat Temuan NFI</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NFI Table — Light Theme */}
      <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3 w-36">No NFI</th>
                <th className="py-2.5 px-3 min-w-[260px]">Uraian Temuan & Lokasi</th>
                <th className="py-2.5 px-3 w-28">Disiplin</th>
                <th className="py-2.5 px-3 w-24 text-center">Tgl Inspeksi</th>
                <th className="py-2.5 px-3 w-24 text-center">Hasil</th>
                <th className="py-2.5 px-3 w-24 text-center">Status</th>
                <th className="py-2.5 px-3 w-32">PIC AEI</th>
                <th className="py-2.5 px-3 w-40">Tindak Lanjut / Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 bg-white">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-mono text-xs">
                    {isLoading ? "Mengambil data NFI Log dari Master..." : "Tidak ada temuan NFI yang sesuai kriteria."}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item, idx) => (
                  <tr key={item.nfiId} className="hover:bg-slate-50/80 transition-colors even:bg-slate-50/30">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-xs tabular-nums">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#163d78] text-xs">{item.noNfi}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 text-xs line-clamp-1">{item.subjectDescription}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{item.area} • {item.location}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-700">{item.discipline}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-600 tabular-nums">{formatDate(item.inspectionDate)}</td>
                    <td className="py-2.5 px-3 text-center">{renderResultBadge(item.result)}</td>
                    <td className="py-2.5 px-3 text-center">{renderStatusBadge(item.status)}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-700">{item.picAei}</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-600 font-mono truncate max-w-[180px]">{item.remark || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-200 text-slate-500 font-mono text-[11px] flex items-center justify-between">
          <span>Menampilkan {filteredEntries.length} dari {entries.length} temuan NFI</span>
          <span>PT Asuka Engineering Indonesia — QA/QC Division</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { Search, RefreshCw, Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SiteReportEntry } from "../types";
import { formatDate } from "@/lib/utils";

interface SiteReportTableProps {
  reports: SiteReportEntry[];
  isLoading: boolean;
  onRefresh: () => void;
  onAddNew?: () => void;
}

export function SiteReportTable({
  reports,
  isLoading,
  onRefresh,
  onAddNew,
}: SiteReportTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");

  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const matchSearch =
        item.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.activitySummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.areaLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inspectorName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDiscipline = selectedDiscipline === "ALL" || item.discipline === selectedDiscipline;

      return matchSearch && matchDiscipline;
    });
  }, [reports, searchTerm, selectedDiscipline]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge variant="approved">VERIFIED</Badge>;
      case "SUBMITTED":
        return <Badge variant="submitted">SUBMITTED</Badge>;
      case "DRAFT":
        return <Badge variant="neutral">DRAFT</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-[8px] border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Laporan Inspeksi Harian</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-[3px] bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              {filteredReports.length} Laporan
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Catatan aktivitas inspeksi lapangan harian QA/QC Engineer
          </p>
        </div>
        {onAddNew && (
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#ed2e35] hover:bg-[#c92026] text-white font-semibold text-xs tracking-wide shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Buat Laporan Harian</span>
          </button>
        )}
      </div>

      {/* Filter Bar — Light Theme */}
      <div className="bg-white p-3 rounded-[8px] border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no laporan / uraian kegiatan / area..."
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
              <option value="CIVIL">Civil</option>
              <option value="MECHANICAL">Mechanical</option>
              <option value="ELECTRICAL">Electrical</option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-[6px] text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Data Laporan"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Site Report Table — Light Theme */}
      <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3 w-36">No Laporan</th>
                <th className="py-2.5 px-3 w-24 text-center">Tgl Laporan</th>
                <th className="py-2.5 px-3 min-w-[260px]">Uraian Kegiatan Inspeksi & Catatan Mutu</th>
                <th className="py-2.5 px-3 w-28">Disiplin</th>
                <th className="py-2.5 px-3 w-32">Area Lokasi</th>
                <th className="py-2.5 px-3 w-24 text-center">Manpower</th>
                <th className="py-2.5 px-3 w-28 text-center">Status</th>
                <th className="py-2.5 px-3 w-32">Inspektor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 bg-white">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-mono text-xs">
                    {isLoading ? "Mengambil laporan inspeksi lapangan..." : "Belum ada laporan inspeksi harian."}
                  </td>
                </tr>
              ) : (
                filteredReports.map((item, idx) => (
                  <tr key={item.reportId} className="hover:bg-slate-50/80 transition-colors even:bg-slate-50/30">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-xs tabular-nums">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#163d78] text-xs">{item.reportNumber}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-600 tabular-nums">{formatDate(item.reportDate)}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 text-xs line-clamp-1">{item.activitySummary}</div>
                      {item.qualityIssue && (
                        <div className="text-[11px] text-emerald-700 font-mono mt-0.5">Mutu: {item.qualityIssue}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-700">{item.discipline}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-700 truncate max-w-[120px]">{item.areaLocation}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-600 tabular-nums">
                      {item.manpowerCount ? `${item.manpowerCount} Orang` : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center">{renderStatusBadge(item.status)}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-700">{item.inspectorName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-200 text-slate-500 font-mono text-[11px] flex items-center justify-between">
          <span>Menampilkan {filteredReports.length} dari {reports.length} laporan</span>
          <span>PT Asuka Engineering Indonesia — QA/QC Division</span>
        </div>
      </div>
    </div>
  );
}

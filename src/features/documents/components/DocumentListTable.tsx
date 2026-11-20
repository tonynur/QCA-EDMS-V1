"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ExternalLink,
  Check,
  X,
  RefreshCw,
  Eye,
  History,
  FileText,
  QrCode,
  FileSpreadsheet,
  UploadCloud,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileBox,
  RotateCcw,
  BarChart2,
  PieChart,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { PageHeader } from "@/components/layout/PageHeader";
import { DocumentItem } from "../types";
import { formatDate } from "@/lib/utils";
import { DigitalSealModal } from "./DigitalSealModal";

interface DocumentListTableProps {
  documents: DocumentItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onAddNew?: () => void;
  onViewDetail?: (doc: DocumentItem) => void;
  onPreviewDoc?: (doc: DocumentItem) => void;
  onHistoryDoc?: (doc: DocumentItem) => void;
  onApprove?: (docId: string) => void;
  onReject?: (docId: string) => void;
  onOpenQRScanner?: () => void;
}

export function DocumentListTable({
  documents,
  isLoading,
  onRefresh,
  onAddNew,
  onViewDetail,
  onPreviewDoc,
  onHistoryDoc,
  onApprove,
  onReject,
  onOpenQRScanner,
}: DocumentListTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [showCharts, setShowCharts] = useState(true);
  const [sealDoc, setSealDoc] = useState<DocumentItem | null>(null);

  // Discipline breakdown
  const discStats = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((d) => {
      const disc = d.discipline || "CIVIL";
      counts[disc] = (counts[disc] || 0) + 1;
    });
    return counts;
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch =
        searchTerm === "" ||
        doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.documentCode && doc.documentCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.projectName && doc.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.uploaderName && doc.uploaderName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = selectedType === "ALL" || doc.documentType === selectedType;
      const matchDiscipline = selectedDiscipline === "ALL" || doc.discipline === selectedDiscipline;
      const matchStatus =
        selectedStatus === "ALL" ||
        (doc.status || "").toUpperCase() === selectedStatus.toUpperCase();

      return matchSearch && matchType && matchDiscipline && matchStatus;
    });
  }, [documents, searchTerm, selectedType, selectedDiscipline, selectedStatus]);

  // Breakdown KPI Metrik
  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let superseded = 0;

    documents.forEach((d) => {
      const s = (d.status || "").toUpperCase();
      if (s === "APPROVED") approved++;
      else if (s === "PENDING" || s === "SUBMITTED" || s === "IN REVIEW" || s === "IN_REVIEW") pending++;
      else if (s === "REJECTED") rejected++;
      else if (s === "SUPERSEDED" || s === "OBSOLETE") superseded++;
      else pending++;
    });

    const total = documents.length;
    return {
      total,
      pending,
      approved,
      rejected,
      superseded,
      pctPending: total > 0 ? Math.round((pending / total) * 100) : 0,
      pctApproved: total > 0 ? Math.round((approved / total) * 100) : 0,
      pctRejected: total > 0 ? Math.round((rejected / total) * 100) : 0,
    };
  }, [documents]);

  // Donut chart stroke computations (Anti-AI pure SVG standard)
  const donutData = useMemo(() => {
    const total = stats.total || 1;
    const C = 238.76;
    const appLen = (stats.approved / total) * C;
    const penLen = (stats.pending / total) * C;
    const rejLen = (stats.rejected / total) * C;
    const supLen = (stats.superseded / total) * C;

    const appOff = 0;
    const penOff = -appLen;
    const rejOff = -(appLen + penLen);
    const supOff = -(appLen + penLen + rejLen);

    return {
      C,
      appLen, penLen, rejLen, supLen,
      appOff, penOff, rejOff, supOff,
    };
  }, [stats]);

  const hasActiveFilter =
    searchTerm !== "" || selectedType !== "ALL" || selectedDiscipline !== "ALL" || selectedStatus !== "ALL";

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedType("ALL");
    setSelectedDiscipline("ALL");
    setSelectedStatus("ALL");
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-[3px] bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            APPROVED
          </span>
        );
      case "PENDING":
      case "SUBMITTED":
      case "IN REVIEW":
      case "IN_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-[3px] bg-amber-50 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            PENDING
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-[3px] bg-rose-50 text-rose-800 border border-rose-300">
            <X className="w-3 h-3 text-rose-600" />
            REJECTED
          </span>
        );
      case "SUPERSEDED":
      case "OBSOLETE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-[3px] bg-slate-100 text-slate-700 border border-slate-300">
            SUPERSEDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-[3px] bg-slate-100 text-slate-700 border border-slate-300">
            {status || "DRAFT"}
          </span>
        );
    }
  };

  const handleExportCSV = () => {
    if (!documents.length) return;
    const headers = [
      "No",
      "Kode Dokumen",
      "Revisi",
      "Judul Dokumen",
      "Proyek",
      "Tipe",
      "Disiplin",
      "Status",
      "Pengunggah",
      "Tanggal",
    ];

    const rows = filteredDocs.map((doc, idx) => [
      idx + 1,
      `"${doc.documentCode || doc.documentNumber}"`,
      doc.revision ?? 0,
      `"${doc.title.replace(/"/g, '""')}"`,
      `"${(doc.projectName || "").replace(/"/g, '""')}"`,
      doc.documentType,
      doc.discipline,
      doc.status,
      `"${(doc.uploaderName || "").replace(/"/g, '""')}"`,
      formatDate(doc.timestamp),
    ]);

    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Master_Dokumen_QAQC_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Banner & Action Button */}
      <PageHeader
        category="DOKUMEN MUTU // MASTER REGISTER"
        title="Daftar Dokumen Mutu (EDMS)"
        badge={`${filteredDocs.length} Dokumen Aktif`}
        badgeVariant="primary"
        description="Sistem sentral kontrol dokumen ITP, Method Statement, MTR & laporan inspeksi terintegrasi Master Hub"
        icon={<FileText className="w-4 h-4 text-[#163d78]" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer font-sans"
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#163d78]" />
              <span>{showCharts ? "Tutup Grafik" : "Buka Grafik"}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer font-sans"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ekspor CSV</span>
            </button>
            {onAddNew && (
              <button
                onClick={onAddNew}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#ed2e35] hover:bg-[#c92026] text-white font-semibold text-xs tracking-wide shadow-sm hover:shadow transition-all cursor-pointer font-sans"
              >
                <UploadCloud className="w-4 h-4" strokeWidth={2} />
                <span>Unggah Dokumen</span>
              </button>
            )}
          </div>
        }
      />

      {/* 2. Executive KPI Cards Strip (Petrosea-inspired hover elevation & clean metric cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total */}
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-[#163d78] petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-sans">
                Total Dokumen
              </p>
              <p className="text-2xl font-bold font-sans text-slate-900 tabular-nums mt-0.5">
                {stats.total}
              </p>
            </div>
            <div className="p-2 bg-slate-100 rounded-[6px]">
              <FileBox className="w-5 h-5 text-[#163d78]" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-sans text-slate-500">
            <span>Portfolio Aktif</span>
            <span className="font-semibold text-slate-700">100%</span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-amber-500 petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-sans">
                Menunggu Review
              </p>
              <p className="text-2xl font-bold font-sans text-amber-700 tabular-nums mt-0.5">
                {stats.pending}
              </p>
            </div>
            <div className="p-2 bg-amber-50 rounded-[6px]">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-sans text-slate-500">
            <span>Antrean Approval</span>
            <span className="font-semibold text-amber-700">{stats.pctPending}%</span>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-emerald-600 petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-sans">
                Disetujui (Approved)
              </p>
              <p className="text-2xl font-bold font-sans text-emerald-700 tabular-nums mt-0.5">
                {stats.approved}
              </p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-[6px]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-sans text-slate-500">
            <span>Tingkat Kepatuhan</span>
            <span className="font-semibold text-emerald-700">{stats.pctApproved}%</span>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-rose-600 petrosea-card cursor-default">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-sans">
                Ditolak / Perlu Revisi
              </p>
              <p className="text-2xl font-bold font-sans text-rose-700 tabular-nums mt-0.5">
                {stats.rejected}
              </p>
            </div>
            <div className="p-2 bg-rose-50 rounded-[6px]">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-sans text-slate-500">
            <span>Tingkat Deviasi</span>
            <span className="font-semibold text-rose-700">{stats.pctRejected}%</span>
          </div>
        </div>
      </div>

      {/* 2B. Visual Charts Deck: Grafik Batang & Donat (Anti-AI Engineering Standard) */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* Chart 1: Bar Chart - Distribusi Dokumen per Disiplin */}
          <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[4px] bg-[#163d78]/10 text-[#163d78] flex items-center justify-center">
                  <BarChart2 className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
                  Distribusi Dokumen per Disiplin
                </h3>
              </div>
              <span className="text-[11px] font-sans text-slate-500 tabular-nums">
                {documents.length} Dokumen Total
              </span>
            </div>

            <div className="space-y-3">
              {Object.entries(discStats).map(([disc, count]) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={disc} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="font-semibold text-slate-800">{disc}</span>
                      <span className="text-slate-500 tabular-nums">{count} dok ({pct}%)</span>
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

          {/* Chart 2: Donut Chart - Komposisi Status Dokumen Mutu */}
          <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[4px] bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <PieChart className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
                  Proporsi Status Dokumen Mutu
                </h3>
              </div>
              <span className="text-[11px] font-sans text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-[2px]">
                {stats.pctApproved}% Disetujui
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-1">
              {/* SVG Donut */}
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                  {stats.approved > 0 && (
                    <circle
                      cx="50" cy="50" r="38" fill="transparent" stroke="#059669" strokeWidth="12"
                      strokeDasharray={`${donutData.appLen} ${donutData.C}`}
                      strokeDashoffset={donutData.appOff}
                    />
                  )}
                  {stats.pending > 0 && (
                    <circle
                      cx="50" cy="50" r="38" fill="transparent" stroke="#d97706" strokeWidth="12"
                      strokeDasharray={`${donutData.penLen} ${donutData.C}`}
                      strokeDashoffset={donutData.penOff}
                    />
                  )}
                  {stats.rejected > 0 && (
                    <circle
                      cx="50" cy="50" r="38" fill="transparent" stroke="#e11d48" strokeWidth="12"
                      strokeDasharray={`${donutData.rejLen} ${donutData.C}`}
                      strokeDashoffset={donutData.rejOff}
                    />
                  )}
                  {stats.superseded > 0 && (
                    <circle
                      cx="50" cy="50" r="38" fill="transparent" stroke="#64748b" strokeWidth="12"
                      strokeDasharray={`${donutData.supLen} ${donutData.C}`}
                      strokeDashoffset={donutData.supOff}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold font-sans text-slate-900 tabular-nums">{stats.pctApproved}%</span>
                  <span className="text-[9.5px] font-sans text-emerald-700 font-bold uppercase">Approved</span>
                </div>
              </div>

              {/* Legend & Count Details */}
              <div className="space-y-2 text-xs font-sans w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[#059669] shrink-0" />
                    <span>Disetujui (Approved)</span>
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{stats.approved} ({stats.pctApproved}%)</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[#d97706] shrink-0" />
                    <span>Menunggu Review</span>
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{stats.pending} ({stats.pctPending}%)</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[#e11d48] shrink-0" />
                    <span>Ditolak (Rejected)</span>
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{stats.rejected} ({stats.pctRejected}%)</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[#64748b] shrink-0" />
                    <span>Superseded / Lainnya</span>
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{stats.superseded}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Sleek Toolbar: Search, Filters & Export Options */}
      <div className="bg-white p-3 rounded-[8px] border border-slate-200/90 shadow-sm space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Search & Select Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari No Dokumen, Judul, Proyek, Submitter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] focus:outline-none focus:border-[#163d78] focus:bg-white text-slate-900 transition-colors"
              />
            </div>

            {onOpenQRScanner && (
              <button
                onClick={onOpenQRScanner}
                title="Pindai QR Dokumen"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-[6px] text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-600" />
                <span>Scan QR</span>
              </button>
            )}

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] text-slate-700 font-medium focus:outline-none focus:border-[#163d78] cursor-pointer"
            >
              <option value="ALL">Semua Jenis</option>
              <option value="ITP">ITP (Inspection & Test Plan)</option>
              <option value="MS">Method Statement (MS)</option>
              <option value="MTR">Material Approval (MTR)</option>
              <option value="FAT">Factory Acceptance Test (FAT)</option>
              <option value="RFI">Request For Inspection (RFI)</option>
              <option value="MRIR">Material Receiving Inspection (MRIR)</option>
            </select>

            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] text-slate-700 font-medium focus:outline-none focus:border-[#163d78] cursor-pointer"
            >
              <option value="ALL">Semua Disiplin</option>
              <option value="CIVIL">Civil & Architectural</option>
              <option value="MECHANICAL">Mechanical & Piping</option>
              <option value="ELECTRICAL">Electrical & Instrument</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] text-slate-700 font-medium focus:outline-none focus:border-[#163d78] cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUPERSEDED">Superseded</option>
            </select>

            {hasActiveFilter && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-[6px] transition-colors"
                title="Reset Semua Filter"
              >
                <RotateCcw className="w-3 h-3 text-rose-600" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Quick Export Actions & Refresh */}
          <div className="flex items-center gap-2 self-end lg:self-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ekspor Excel</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Perbarui Data Dokumen"
              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-[6px] text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Technical Engineering Document Table */}
      <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3 min-w-[170px]">No. Dokumen & Rev</th>
                <th className="py-2.5 px-3 min-w-[260px]">Judul Dokumen & Proyek</th>
                <th className="py-2.5 px-3 w-32">Tipe & Disiplin</th>
                <th className="py-2.5 px-3 w-28 text-center">Tgl Submit</th>
                <th className="py-2.5 px-3 w-28 text-center">Status</th>
                <th className="py-2.5 px-3 w-36">Submitter</th>
                <th className="py-2.5 px-3 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 bg-white">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-mono text-xs">
                    {isLoading ? "Mengambil daftar dokumen dari EDMS Master..." : "Tidak ada dokumen yang sesuai dengan filter."}
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => (
                  <tr
                    key={doc.docId || idx}
                    className="hover:bg-slate-50/80 transition-colors even:bg-slate-50/30"
                  >
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-xs tabular-nums">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-mono font-bold text-[#163d78] text-xs">
                        {doc.documentCode || doc.documentNumber}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {onHistoryDoc ? (
                          <button
                            onClick={() => onHistoryDoc(doc)}
                            className="font-mono text-[10.5px] text-slate-500 hover:text-[#163d78] transition-colors flex items-center gap-1 group cursor-pointer"
                            title="Lihat Riwayat & Rollback Revisi"
                          >
                            <History className="w-3 h-3 text-slate-400 group-hover:text-[#163d78]" />
                            <span className="font-semibold">Rev {doc.revision ?? 0}</span>
                          </button>
                        ) : (
                          <span className="font-mono text-[10.5px] text-slate-500">
                            Rev {doc.revision ?? 0}
                          </span>
                        )}
                        {doc.isLatestRevision && (
                          <span className="text-[9.5px] font-mono px-1 py-0.2 rounded-[2px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Latest
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 text-xs line-clamp-1 font-sans">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-sans mt-0.5 line-clamp-1">
                        {doc.projectName || "-"}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="text-xs font-semibold text-slate-800 font-sans">
                        {doc.documentType}
                      </span>
                      <div className="text-[10.5px] text-slate-500 font-sans mt-0.5 font-medium">
                        {doc.discipline}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center font-sans text-xs text-slate-600 tabular-nums">
                      {formatDate(doc.timestamp)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {renderStatusBadge(doc.status)}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="text-xs font-medium text-slate-800 line-clamp-1">
                        {doc.uploaderName || "-"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono line-clamp-1">
                        {doc.uploaderEmail || ""}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSealDoc(doc)}
                          className="p-1.5 rounded-[4px] bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 transition-colors cursor-pointer"
                          title="Segel Mutu Digital & QR Verifikasi Resmi (ISO 9001:2015)"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.8} />
                        </button>

                        {onPreviewDoc && (
                          <button
                            onClick={() => onPreviewDoc(doc)}
                            className="p-1.5 rounded-[4px] bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#163d78] border border-slate-200 transition-colors cursor-pointer"
                            title="Pratinjau Dokumen (In-App PDF/Viewer)"
                          >
                            <Eye className="w-3.5 h-3.5" strokeWidth={1.8} />
                          </button>
                        )}

                        {onViewDetail && (
                          <button
                            onClick={() => onViewDetail(doc)}
                            className="p-1.5 rounded-[4px] bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                            title="Lembar Detail Metadata Teknis"
                          >
                            <FileText className="w-3.5 h-3.5" strokeWidth={1.8} />
                          </button>
                        )}

                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-[4px] bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 transition-colors"
                            title="Buka File di Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.8} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-200 text-slate-500 font-sans text-[11px] flex items-center justify-between">
          <span>Menampilkan {filteredDocs.length} dari {documents.length} total dokumen</span>
          <span>PT Asuka Engineering Indonesia — QA/QC Division</span>
        </div>
      </div>

      <DigitalSealModal
        isOpen={!!sealDoc}
        onClose={() => setSealDoc(null)}
        document={sealDoc}
      />
    </div>
  );
}

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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { DocumentItem } from "../types";
import { formatDate } from "@/lib/utils";

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
      <div className="bg-white p-4 sm:p-5 rounded-[8px] border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Daftar Dokumen Mutu (EDMS)
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-[3px] bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              {filteredDocs.length} Dokumen Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Sistem sentral kontrol dokumen ITP, Method Statement, MTR & laporan inspeksi
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onAddNew && (
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#ed2e35] hover:bg-[#c92026] text-white font-semibold text-xs tracking-wide shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" strokeWidth={2} />
              <span>Unggah Dokumen Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Executive KPI Cards Strip (Pass 9 Layout: Ringkasan di paling atas, Tanpa Donut Raksasa) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total */}
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-[#163d78]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
                Total Dokumen
              </p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
                {stats.total}
              </p>
            </div>
            <div className="p-2 bg-slate-100 rounded-[6px]">
              <FileBox className="w-5 h-5 text-[#163d78]" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Portfolio Aktif</span>
            <span className="font-semibold text-slate-700">100%</span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
                Menunggu Review
              </p>
              <p className="text-2xl font-bold text-amber-700 tabular-nums mt-0.5">
                {stats.pending}
              </p>
            </div>
            <div className="p-2 bg-amber-50 rounded-[6px]">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Antrean Approval</span>
            <span className="font-semibold text-amber-700">{stats.pctPending}%</span>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
                Disetujui (Approved)
              </p>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums mt-0.5">
                {stats.approved}
              </p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-[6px]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Tingkat Kepatuhan</span>
            <span className="font-semibold text-emerald-700">{stats.pctApproved}%</span>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-rose-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
                Ditolak / Perlu Revisi
              </p>
              <p className="text-2xl font-bold text-rose-700 tabular-nums mt-0.5">
                {stats.rejected}
              </p>
            </div>
            <div className="p-2 bg-rose-50 rounded-[6px]">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Tingkat Deviasi</span>
            <span className="font-semibold text-rose-700">{stats.pctRejected}%</span>
          </div>
        </div>
      </div>

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
                      <div className="font-semibold text-slate-900 text-xs line-clamp-1">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 line-clamp-1">
                        {doc.projectName || "-"}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="text-xs font-semibold text-slate-800">
                        {doc.documentType}
                      </span>
                      <div className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                        {doc.discipline}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-600 tabular-nums">
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
                        {onPreviewDoc && doc.fileUrl && (
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
        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-200 text-slate-500 font-mono text-[11px] flex items-center justify-between">
          <span>Menampilkan {filteredDocs.length} dari {documents.length} total dokumen</span>
          <span>PT Asuka Engineering Indonesia — QA/QC Division</span>
        </div>
      </div>
    </div>
  );
}

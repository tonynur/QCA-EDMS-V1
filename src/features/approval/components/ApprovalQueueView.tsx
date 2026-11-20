"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  AlertTriangle,
  Search,
  RefreshCw,
  Eye,
} from "lucide-react";
import { DocumentItem } from "@/features/documents/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatDate, cn } from "@/lib/utils";

interface ApprovalQueueViewProps {
  documents: DocumentItem[];
  onApprove: (docId: string, comments: string) => Promise<void>;
  onReject: (docId: string, comments: string) => Promise<void>;
  onRefresh: () => void;
  isLoading?: boolean;
  onPreviewDoc?: (doc: DocumentItem) => void;
}

export function ApprovalQueueView({
  documents,
  onApprove,
  onReject,
  onRefresh,
  isLoading,
  onPreviewDoc,
}: ApprovalQueueViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter pending documents
  const pendingDocs = documents.filter((doc) => {
    const s = (doc.status || "").toUpperCase();
    const isPending = s === "PENDING" || s === "SUBMITTED" || s === "IN REVIEW" || s === "IN_REVIEW";
    if (!isPending) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (doc.documentCode && doc.documentCode.toLowerCase().includes(q)) ||
      (doc.documentNumber && doc.documentNumber.toLowerCase().includes(q)) ||
      doc.title.toLowerCase().includes(q) ||
      (doc.projectName && doc.projectName.toLowerCase().includes(q)) ||
      (doc.uploaderName && doc.uploaderName.toLowerCase().includes(q))
    );
  });

  const handleOpenActionModal = (doc: DocumentItem, type: "approve" | "reject") => {
    setSelectedDoc(doc);
    setActionType(type);
    setComment(
      type === "approve"
        ? "Dokumen telah diperiksa dan disetujui sesuai kriteria penerimaan ITP."
        : ""
    );
  };

  const handleConfirmAction = async () => {
    if (!selectedDoc || !actionType) return;
    setIsSubmitting(true);
    try {
      if (actionType === "approve") {
        await onApprove(selectedDoc.docId, comment);
      } else {
        await onReject(selectedDoc.docId, comment || "Ditolak - Mohon perbaiki dan unggah revisi.");
      }
      setSelectedDoc(null);
      setActionType(null);
      setComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <PageHeader
        category="DOKUMEN MUTU // WORKFLOW APPROVAL"
        title="Approval & Antrean Tugas Mutu"
        badge={`${pendingDocs.length} Dokumen Pending`}
        badgeVariant={pendingDocs.length > 0 ? "warning" : "success"}
        description="Verifikasi bertingkat dokumen kontrol, ITP, Method Statement & MTR sebelum rilis ke lapangan"
        icon={<Clock className="w-4 h-4 text-amber-600" />}
        actions={
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-[6px] text-xs font-semibold font-mono transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-slate-600", isLoading && "animate-spin")} />
            <span>Sinkronkan Antrean</span>
          </button>
        }
      />

      {/* Metric Summary Cards — Light Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Menunggu Verifikasi</p>
              <p className="text-2xl font-bold text-amber-700 tabular-nums mt-0.5">{pendingDocs.length}</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-[6px]">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
            Dokumen perlu tindakan review
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Total Disetujui</p>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums mt-0.5">
                {documents.filter((d) => (d.status || "").toUpperCase() === "APPROVED").length}
              </p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-[6px]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
            Status valid / rilis resmi
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-[#163d78]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Kepatuhan SLA QA/QC</p>
              <p className="text-2xl font-bold text-[#163d78] tabular-nums mt-0.5">100%</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-[6px]">
              <AlertTriangle className="w-5 h-5 text-[#163d78]" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
            Target evaluasi &lt; 48 jam
          </div>
        </div>
      </div>

      {/* Search Toolbar — Light Theme */}
      <div className="bg-white p-3 rounded-[8px] border border-slate-200/90 shadow-sm flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dokumen dalam antrean approval..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] focus:outline-none focus:border-[#163d78] focus:bg-white text-slate-900 transition-colors"
          />
        </div>
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          Ditemukan: <strong className="text-slate-800">{pendingDocs.length}</strong> dokumen
        </span>
      </div>

      {/* Task List Table — Light Theme */}
      <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-sm overflow-hidden">
        {pendingDocs.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">Seluruh Dokumen Telah Diperiksa</h4>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Tidak ada antrean dokumen yang memerlukan persetujuan saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Kode Dokumen</th>
                  <th className="py-2.5 px-3 min-w-[260px]">Judul & Proyek</th>
                  <th className="py-2.5 px-3 w-32">Tipe / Disiplin</th>
                  <th className="py-2.5 px-3 w-36">Diajukan Oleh</th>
                  <th className="py-2.5 px-3 w-28 text-center">Tanggal Unggah</th>
                  <th className="py-2.5 px-3 w-36 text-center">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pendingDocs.map((doc) => (
                  <tr key={doc.docId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-[#163d78] text-xs">
                        {doc.documentCode || doc.documentNumber}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        Rev {doc.revision ?? 0}
                      </div>
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-900 line-clamp-1 text-xs">{doc.title}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">{doc.projectName}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-800 font-semibold text-xs">{doc.documentType}</span>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">{doc.discipline}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium text-xs">{doc.uploaderName || "—"}</div>
                      <div className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]">{doc.uploaderEmail}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600 tabular-nums text-xs text-center">
                      {formatDate(doc.timestamp)}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {onPreviewDoc && (
                          <button
                            type="button"
                            onClick={() => onPreviewDoc(doc)}
                            className="p-1.5 rounded-[4px] bg-blue-50 hover:bg-blue-100 text-[#163d78] border border-blue-200 transition-colors cursor-pointer"
                            title="Pratinjau Lembar Mutu & Dokumen PDF"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-[4px] bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
                            title="Buka Berkas di Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => handleOpenActionModal(doc, "approve")}
                          className="px-2.5 py-1 rounded-[4px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Setujui</span>
                        </button>

                        <button
                          onClick={() => handleOpenActionModal(doc, "reject")}
                          className="px-2.5 py-1 rounded-[4px] bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-mono font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal — Light Theme */}
      {selectedDoc && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-[8px] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                {actionType === "approve" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <h3 className="text-sm font-bold font-mono text-slate-900 uppercase">
                  {actionType === "approve" ? "Setujui Dokumen Mutu" : "Tolak / Minta Revisi"}
                </h3>
              </div>
              <button
                onClick={() => { setSelectedDoc(null); setActionType(null); }}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-slate-500 font-mono">Kode Dokumen:</div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-[#163d78]">
                  {selectedDoc.documentCode || selectedDoc.documentNumber} Rev {selectedDoc.revision ?? 0}
                </span>
                {onPreviewDoc && (
                  <button
                    type="button"
                    onClick={() => onPreviewDoc(selectedDoc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-blue-50 text-[#163d78] border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Pratinjau Dokumen</span>
                  </button>
                )}
              </div>
              <div className="text-slate-800 font-medium mt-1">{selectedDoc.title}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-700">
                {actionType === "approve" ? "Catatan Verifikasi (Opsional):" : "Alasan Penolakan / Poin Revisi (Wajib):"}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                required={actionType === "reject"}
                placeholder={
                  actionType === "approve"
                    ? "Masukkan catatan verifikasi..."
                    : "Jelaskan pasal atau kriteria yang belum sesuai..."
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-[6px] p-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#163d78] focus:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => { setSelectedDoc(null); setActionType(null); }}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-[6px] border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isSubmitting || (actionType === "reject" && !comment.trim())}
                className={`px-4 py-2 text-xs font-semibold rounded-[6px] text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer ${
                  actionType === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-[#ed2e35] hover:bg-[#c92026]"
                }`}
              >
                {isSubmitting
                  ? "Menyimpan..."
                  : actionType === "approve"
                  ? "Konfirmasi Setujui"
                  : "Konfirmasi Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


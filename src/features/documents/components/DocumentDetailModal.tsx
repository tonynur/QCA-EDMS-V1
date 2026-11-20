"use client";

import React from "react";
import { X, ExternalLink, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DocumentItem } from "../types";
import { formatDate } from "@/lib/utils";

interface DocumentDetailModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (docId: string) => void;
  onReject?: (docId: string) => void;
}

export function DocumentDetailModal({
  document,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: DocumentDetailModalProps) {
  if (!isOpen || !document) return null;

  const renderBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="approved">APPROVED</Badge>;
      case "PENDING":
        return <Badge variant="pending">PENDING</Badge>;
      case "SUBMITTED":
        return <Badge variant="submitted">SUBMITTED</Badge>;
      case "REJECTED":
        return <Badge variant="rejected">REJECTED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-md overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white border border-slate-300 rounded-[8px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Asuka Steel Navy */}
        <div className="px-5 py-3.5 bg-[#163d78] text-white flex items-center justify-between border-b border-[#102d59] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <FileText className="w-4 h-4 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-white uppercase font-sans">
                Detail Dokumen EDMS
              </h3>
              <p className="text-xs text-blue-100 font-mono">
                {document.documentNumber} ({document.revision})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-[4px] hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-white font-sans text-xs">
          {/* Title & Status */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-[6px] bg-slate-50 border border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Judul Dokumen Mutu
              </span>
              <h4 className="text-sm font-bold text-slate-900">{document.title}</h4>
              <p className="text-xs text-[#163d78] font-medium mt-0.5">{document.projectName}</p>
            </div>
            <div>{renderBadge(document.status)}</div>
          </div>

          {/* Grid Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-1">Tipe Dokumen</span>
              <span className="text-slate-800 font-medium">{document.documentType}</span>
            </div>

            <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-1">Disiplin</span>
              <span className="text-slate-800 font-medium">{document.discipline}</span>
            </div>

            <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-1">Revisi</span>
              <span className="text-slate-800 font-mono font-medium">{document.revision}</span>
            </div>

            <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-1">Tanggal Submit</span>
              <span className="text-slate-800 font-mono">{formatDate(document.timestamp)}</span>
            </div>

            <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-1">Submitter</span>
              <span className="text-slate-800 font-medium">{document.uploaderName}</span>
            </div>

            <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-1">Referensi Standar</span>
              <span className="text-slate-800 truncate block font-medium">{document.standardRef || "-"}</span>
            </div>
          </div>

          {/* File Attachment */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Berkas Lampiran Resmi
            </span>
            {document.fileUrl ? (
              <div className="flex items-center justify-between p-3.5 rounded-[6px] bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-[#163d78] shrink-0" strokeWidth={1.8} />
                  <span className="text-xs font-mono text-slate-800 truncate">
                    {document.fileName || document.documentNumber + ".pdf"}
                  </span>
                </div>
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#163d78] hover:bg-[#113162] text-white text-xs font-medium transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.8} />
                  <span>Buka di Google Drive</span>
                </a>
              </div>
            ) : (
              <div className="text-xs text-slate-500 p-3 bg-slate-50 border border-slate-200 rounded-[6px]">
                Tidak ada URL berkas Drive yang terlampir.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Tutup
          </Button>

          <div className="flex items-center gap-2">
            {document.status === "PENDING" && onReject && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  onReject(document.docId);
                  onClose();
                }}
                icon={<X className="w-4 h-4" strokeWidth={1.8} />}
              >
                Tolak Dokumen
              </Button>
            )}

            {document.status === "PENDING" && onApprove && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onApprove(document.docId);
                  onClose();
                }}
                icon={<Check className="w-4 h-4" strokeWidth={1.8} />}
              >
                Setujui Dokumen
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  History,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Clock,
  User,
  MessageSquare,
} from "lucide-react";
import { DocumentItem } from "../types";
import { documentService } from "../services/document-service";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

interface RevisionHistoryModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRollbackSuccess?: () => void;
}

export function RevisionHistoryModal({
  document: doc,
  isOpen,
  onClose,
  onRollbackSuccess,
}: RevisionHistoryModalProps) {
  const [revisions, setRevisions] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !doc) return;

    let active = true;
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await documentService.getRevisionHistory(doc.docId);
        if (active) {
          if (res.success && res.revisions.length > 0) {
            setRevisions(res.revisions);
          } else {
            // Fallback: show current doc if no other revisions exist
            setRevisions([doc]);
          }
        }
      } catch {
        if (active) setRevisions([doc]);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchHistory();
    return () => {
      active = false;
    };
  }, [isOpen, doc]);

  if (!isOpen || !doc) return null;

  const handleRollback = async (targetDocId: string, revNum: string | number) => {
    if (
      !confirm(
        `Konfirmasi: Jadikan Revisi ${revNum} sebagai revisi aktif dokumen ini?`
      )
    ) {
      return;
    }

    setActionInProgress(targetDocId);
    try {
      const res = await documentService.rollbackToRevision(targetDocId);
      alert(res.message);
      if (res.success && onRollbackSuccess) {
        onRollbackSuccess();
        onClose();
      }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-300 rounded-[8px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header - Asuka Steel Navy */}
        <div className="h-14 bg-[#163d78] border-b border-[#102d59] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <History className="w-4 h-4 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2 font-sans">
                <span>Riwayat Silsilah Revisi</span>
                <span className="font-mono text-xs text-blue-100">
                  {doc.documentCode || doc.documentNumber}
                </span>
              </div>
              <div className="text-xs text-blue-100 font-sans">
                {doc.projectName} • {doc.discipline}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[4px] hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content / Timeline */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white">
          <div className="text-xs text-slate-800 font-semibold p-3 bg-slate-50 border border-slate-200 rounded-[6px]">
            {doc.title}
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <div className="w-6 h-6 border-2 border-[#163d78] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Memuat silsilah revisi dari Google Sheets...
            </div>
          ) : revisions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Belum ada riwayat revisi tambahan. Dokumen ini adalah revisi awal.
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {revisions.map((rev, idx) => {
                const isCurrent = rev.docId === doc.docId || idx === 0;
                const s = (rev.status || "").toUpperCase();

                return (
                  <div key={rev.docId} className="relative space-y-2">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isCurrent
                          ? "bg-[#163d78] border-[#163d78]"
                          : "bg-white border-slate-300"
                      }`}
                    >
                      {isCurrent && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>

                    {/* Revision Card */}
                    <div
                      className={`p-4 rounded-[6px] border transition-colors ${
                        isCurrent
                          ? "bg-blue-50/40 border-[#163d78]/30 shadow-xs"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            Rev {rev.revision ?? 0}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-sans uppercase bg-[#163d78] text-white px-2 py-0.5 rounded-[3px] font-semibold">
                              Aktif Sekarang
                            </span>
                          )}
                          <Badge
                            variant={
                              s === "APPROVED"
                                ? "approved"
                                : s === "REJECTED"
                                ? "rejected"
                                : s === "SUPERSEDED"
                                ? "neutral"
                                : "pending"
                            }
                          >
                            {rev.status || "DRAFT"}
                          </Badge>
                        </div>

                        {rev.fileUrl && (
                          <a
                            href={rev.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-[#163d78] hover:underline flex items-center gap-1"
                          >
                            <span>Berkas</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="text-xs text-slate-900 mt-2 font-medium">
                        {rev.title}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600 font-sans">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Pengunggah: {rev.uploaderName || "-"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Diunggah: {formatDate(rev.timestamp)}</span>
                        </div>
                      </div>

                      {/* Approver Information */}
                      {rev.approverName && (
                        <div className="mt-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-[4px] flex items-center gap-1.5 font-sans">
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                          <span>
                            Disetujui oleh <strong>{rev.approverName}</strong>{" "}
                            {rev.approvalDate ? `pada ${formatDate(rev.approvalDate)}` : ""}
                          </span>
                        </div>
                      )}

                      {/* Comments */}
                      {rev.description && (
                        <div className="mt-2 text-xs text-slate-700 bg-white p-2.5 rounded-[4px] border border-slate-200 flex items-start gap-1.5 font-sans">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span>{rev.description}</span>
                        </div>
                      )}

                      {/* Rollback Action Button */}
                      {!isCurrent && s !== "DELETED" && (
                        <div className="mt-3 pt-2 border-t border-slate-200 flex justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={actionInProgress === rev.docId}
                            onClick={() => handleRollback(rev.docId, rev.revision ?? 0)}
                            className="text-xs font-sans gap-1 text-[#163d78] border-slate-300 hover:bg-slate-100"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>
                              {actionInProgress === rev.docId
                                ? "Memproses..."
                                : "Jadikan Revisi Aktif"}
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 text-xs text-slate-600">
          <span>Total Riwayat: {revisions.length} versi</span>
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}

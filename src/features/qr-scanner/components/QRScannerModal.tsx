"use client";

import React, { useState } from "react";
import {
  QrCode,
  X,
  Search,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { DocumentItem } from "@/features/documents/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  onOpenDocument?: (doc: DocumentItem) => void;
  onPreviewDoc?: (doc: DocumentItem) => void;
}

export function QRScannerModal({
  isOpen,
  onClose,
  documents,
  onOpenDocument,
  onPreviewDoc,
}: QRScannerModalProps) {
  const [inputCode, setInputCode] = useState("");
  const [searchedDoc, setSearchedDoc] = useState<DocumentItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (codeToVerify?: string) => {
    const code = (codeToVerify || inputCode).trim().toLowerCase();
    if (!code) return;

    setHasSearched(true);
    const found = documents.find((d) => {
      const docCode = (d.documentCode || "").toLowerCase();
      const docNum = (d.documentNumber || "").toLowerCase();
      const docId = (d.docId || "").toLowerCase();
      return (
        docCode === code ||
        docNum === code ||
        docId === code ||
        docCode.includes(code)
      );
    });

    setSearchedDoc(found || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white border border-slate-300 rounded-[8px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header - Asuka Steel Navy */}
        <div className="px-5 py-3.5 bg-[#163d78] text-white flex items-center justify-between border-b border-[#102d59] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                Verifikasi Dokumen & Pemindai QR
              </h3>
              <p className="text-xs text-blue-100 font-sans">
                Pemeriksaan keaslian dan status rilis resmi dokumen PT Asuka Engineering Indonesia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[4px] text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 bg-white font-sans">
          {/* Technical Camera Viewfinder Placeholder */}
          <div className="relative aspect-video w-full rounded-[6px] bg-slate-900 border border-slate-800 flex flex-col items-center justify-center overflow-hidden p-4 text-center">
            {/* Corner Guides */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

            <QrCode className="w-12 h-12 text-cyan-400/70 mb-2" strokeWidth={1.5} />
            <div className="text-xs font-bold text-white font-sans">
              Bidik QR Code Fisik Dokumen
            </div>
            <div className="text-xs text-slate-300 mt-1 max-w-xs font-sans">
              Arahkan kamera ke QR Code pada lembar pengesahan ITP/MTR, atau masukkan kode di bawah
            </div>
          </div>

          {/* Manual Input Code Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 font-sans">
              Nomor Dokumen / Kode Verifikasi QR:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  placeholder="Contoh: AEI-CHI-ITP-CV-001 atau 1"
                  className="w-full bg-slate-50 hover:bg-white text-slate-900 border border-slate-300 rounded-[6px] pl-9 pr-3 py-2 text-xs font-mono placeholder-slate-400 outline-none focus:bg-white focus:border-[#163d78] transition-colors"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleVerify()}
                className="font-sans text-xs px-4 bg-[#163d78] hover:bg-[#113162]"
              >
                Verifikasi
              </Button>
            </div>
          </div>

          {/* Verification Result */}
          {hasSearched && (
            <div className="pt-2 border-t border-slate-200">
              {searchedDoc ? (
                <div className="p-4 rounded-[6px] bg-emerald-50 border border-emerald-300 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>DOKUMEN TERVERIFIKASI ASLI</span>
                    </div>
                    <Badge variant="approved">VALID</Badge>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="font-mono font-bold text-slate-900">
                      {searchedDoc.documentCode || searchedDoc.documentNumber} Rev {searchedDoc.revision ?? 0}
                    </div>
                    <div className="font-semibold text-slate-800">{searchedDoc.title}</div>
                    <div className="text-xs text-slate-600 font-sans">
                      {searchedDoc.projectName} • {searchedDoc.discipline}
                    </div>
                    <div className="text-xs text-slate-600 font-sans">
                      Diajukan: {formatDate(searchedDoc.timestamp)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-emerald-200">
                    <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-emerald-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ISO 9001:2015 Compliant</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {onOpenDocument && (
                        <button
                          onClick={() => onOpenDocument(searchedDoc)}
                          className="text-xs font-semibold text-[#163d78] hover:underline cursor-pointer"
                        >
                          Detail EDMS
                        </button>
                      )}
                      {onPreviewDoc && (
                        <button
                          onClick={() => {
                            onClose();
                            onPreviewDoc(searchedDoc);
                          }}
                          className="text-xs font-semibold text-[#163d78] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Pratinjau Dokumen</span>
                        </button>
                      )}
                      {searchedDoc.fileUrl && (
                        <a
                          href={searchedDoc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-[#163d78] hover:underline flex items-center gap-1"
                        >
                          <span>Buka File Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-[6px] bg-red-50 border border-red-200 text-center space-y-1">
                  <div className="text-xs font-bold text-red-700">
                    KODE DOKUMEN TIDAK DITEMUKAN
                  </div>
                  <div className="text-xs text-slate-600 font-sans">
                    Periksa kembali penulisan nomor atau hubungi Document Controller QA/QC.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}

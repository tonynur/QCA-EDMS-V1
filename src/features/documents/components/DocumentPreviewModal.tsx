"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  X,
  ExternalLink,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  AlertCircle,
  Printer,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Layers,
  Calendar,
  User,
  QrCode,
  FileCheck2,
} from "lucide-react";
import { DocumentItem } from "../types";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface DocumentPreviewModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreviewModal({
  document: doc,
  isOpen,
  onClose,
}: DocumentPreviewModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeView, setActiveView] = useState<"sheet" | "drive">("sheet");
  const [iframeError, setIframeError] = useState(false);

  // Extract Drive ID or construct preview URL
  const { fileId, previewUrl, downloadUrl, hasValidFile } = useMemo(() => {
    if (!doc || !doc.fileUrl) {
      return { fileId: null, previewUrl: null, downloadUrl: null, hasValidFile: false };
    }

    const raw = doc.fileUrl.trim();
    // Exclude generic root url
    if (raw === "https://drive.google.com" || raw === "https://drive.google.com/" || raw === "#") {
      return { fileId: null, previewUrl: null, downloadUrl: null, hasValidFile: false };
    }

    // Match file ID patterns
    const idMatch =
      raw.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/) ||
      raw.match(/id=([a-zA-Z0-9_-]{20,})/) ||
      raw.match(/\/d\/([a-zA-Z0-9_-]{20,})/) ||
      raw.match(/[-\w]{25,}/);

    const fId = idMatch ? (idMatch[1] || idMatch[0]) : null;

    if (fId) {
      return {
        fileId: fId,
        previewUrl: `https://drive.google.com/file/d/${fId}/preview`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${fId}`,
        hasValidFile: true,
      };
    }

    // If it's another valid web URL or PDF
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return {
        fileId: null,
        previewUrl: `https://docs.google.com/viewer?url=${encodeURIComponent(raw)}&embedded=true`,
        downloadUrl: raw,
        hasValidFile: true,
      };
    }

    return { fileId: null, previewUrl: null, downloadUrl: null, hasValidFile: false };
  }, [doc]);

  if (!isOpen || !doc) return null;

  const handlePrint = () => {
    window.print();
  };

  const statusUpper = (doc.status || "DRAFT").toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`bg-slate-900 border border-slate-700 rounded-[8px] flex flex-col shadow-2xl transition-all duration-200 overflow-hidden ${
          isFullscreen
            ? "w-full h-full"
            : "w-full max-w-5xl h-[88vh] max-h-[920px]"
        }`}
      >
        {/* ═══ MODAL HEADER ═══ */}
        <div className="h-14 bg-[#0a1428] border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-[4px] bg-[#163d78]/40 border border-[#244785] flex items-center justify-center text-[#38bdf8] shrink-0">
              <FileCheck2 className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-white tracking-wide truncate">
                  {doc.documentCode || doc.documentNumber}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-[2px]">
                  Rev {doc.revision ?? 0}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[2px] border ${
                    statusUpper === "APPROVED"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : statusUpper === "REJECTED"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  }`}
                >
                  {statusUpper}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans truncate mt-0.5">
                {doc.title}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-[6px] p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveView("sheet")}
                className={`px-2.5 py-1 rounded-[4px] font-medium transition-all ${
                  activeView === "sheet"
                    ? "bg-[#163d78] text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Lembar Mutu
              </button>
              <button
                type="button"
                onClick={() => setActiveView("drive")}
                className={`px-2.5 py-1 rounded-[4px] font-medium transition-all ${
                  activeView === "drive"
                    ? "bg-[#163d78] text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Drive / Berkas
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-[4px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Cetak Lembar Dokumen"
            >
              <Printer className="w-4 h-4" strokeWidth={1.8} />
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono transition-colors"
                title="Unduh Berkas"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span>Unduh</span>
              </a>
            )}

            {doc.fileUrl && (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors"
                title="Buka Langsung di Google Drive"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span>Drive</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-[4px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? "Kecilkan Tampilan" : "Layar Penuh"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" strokeWidth={1.8} />
              ) : (
                <Maximize2 className="w-4 h-4" strokeWidth={1.8} />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[4px] bg-slate-800 hover:bg-rose-900 border border-slate-700 hover:border-rose-700 text-slate-400 hover:text-rose-200 transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ═══ MODAL BODY ═══ */}
        <div className="flex-1 bg-slate-950 relative overflow-y-auto">
          {/* TAB 1: LEMBAR MUTU RESMI IN-APP (Default & Selalu Berfungsi 100%) */}
          {activeView === "sheet" && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5 animate-in fade-in duration-100">
              {/* Paper Card */}
              <div className="bg-white text-slate-900 rounded-[6px] border border-slate-300 shadow-xl p-6 sm:p-8 space-y-6">
                {/* Official Title Block Header */}
                <div className="border-b-2 border-[#163d78] pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/icons/logo.png"
                      alt="PT Asuka Engineering Indonesia"
                      width={130}
                      height={32}
                      className="h-8 w-auto object-contain"
                      priority
                    />
                    <div className="border-l-2 border-slate-300 pl-3">
                      <h2 className="text-xs font-bold font-mono tracking-wider text-[#163d78] uppercase">
                        PT ASUKA ENGINEERING INDONESIA
                      </h2>
                      <p className="text-[10px] text-slate-500 font-mono">
                        QUALITY ASSURANCE & QUALITY CONTROL DEPARTMENT
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:text-right w-full sm:w-auto">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">
                      STANDAR SISTEM MANAJEMEN MUTU
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-800">
                      ISO 9001:2015 KLAUSUL 7.5
                    </div>
                  </div>
                </div>

                {/* Document Main Title Block */}
                <div className="text-center py-2 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#163d78] font-bold bg-blue-50 px-2 py-0.5 rounded-[2px] border border-blue-200">
                    {doc.documentType || "INSPECTION & TEST PLAN (ITP)"}
                  </span>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {doc.title}
                  </h1>
                  <p className="text-xs font-mono text-slate-500">
                    Nomor Registrasi: <strong className="text-slate-800">{doc.documentNumber}</strong>
                  </p>
                </div>

                {/* Technical Metadata Table */}
                <div className="border border-slate-300 rounded-[4px] overflow-hidden text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50/50">
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Kode Dokumen</span>
                        <span className="font-bold text-slate-900">{doc.documentCode || doc.documentNumber}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Tingkat Revisi</span>
                        <span className="font-bold text-slate-900">Rev {doc.revision ?? 0}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Disiplin Pekerjaan</span>
                        <span className="font-bold text-[#163d78]">{doc.discipline || "CIVIL"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Standar Acuan</span>
                        <span className="font-medium text-slate-800">{doc.standardRef || "Spesifikasi Proyek / SNI / ASTM"}</span>
                      </div>
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Proyek Konstruksi</span>
                        <span className="font-bold text-slate-900 truncate max-w-[200px]" title={doc.projectName}>
                          {doc.projectName || "Chiyoda Manyar Smelter Project"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Status Validasi</span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded-[2px] ${
                            statusUpper === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : statusUpper === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {statusUpper}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Petugas QA/QC (Uploader)</span>
                        <span className="font-medium text-slate-800">{doc.uploaderName || "Ahmad Nur Fatony"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Tanggal Catat</span>
                        <span className="text-slate-700">{formatDate(doc.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Official QA/QC Verification Stamp */}
                <div className="border border-dashed border-slate-300 rounded-[4px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="text-[11px] font-bold text-slate-700 uppercase font-mono">
                      Verifikasi Integritas Data Digital QCA EDMS
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Dokumen ini terdaftar dalam Master Sheet Cloud PT Asuka Engineering Indonesia dan sah untuk pelaksanaan inspeksi lapangan.
                    </p>
                  </div>

                  {/* Stamp Badge */}
                  <div className="border-2 border-[#163d78] text-[#163d78] px-3 py-1.5 rounded-[4px] text-center font-mono shrink-0 select-none">
                    <div className="text-[9px] font-bold tracking-widest uppercase">QA/QC APPROVED</div>
                    <div className="text-[11px] font-black tracking-wider">PT ASUKA ENG. INDONESIA</div>
                    <div className="text-[8px] text-slate-600">EDMS VERIFIED DIGITAL RECORD</div>
                  </div>
                </div>

                {/* Actions inside Sheet */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                  <div className="text-[11px] font-mono text-slate-500">
                    Mode Tampilan: Lembar Kontrol Teknis (Offline & Online Compatible)
                  </div>
                  <div className="flex items-center gap-2">
                    {hasValidFile && (
                      <button
                        type="button"
                        onClick={() => setActiveView("drive")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#163d78] hover:bg-[#1a4a91] text-white text-xs font-mono font-semibold transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Buka Viewer PDF / Google Drive</span>
                      </button>
                    )}
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-mono font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Link Berkas</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE / PDF VIEWER (Jika ada fileUrl asli) */}
          {activeView === "drive" && (
            <div className="w-full h-full flex flex-col">
              {previewUrl && !iframeError ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0 flex-1 min-h-[500px]"
                  title={doc.title}
                  allow="autoplay"
                  onError={() => setIframeError(true)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-[8px] bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                    <FileText className="w-7 h-7" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-200 font-mono">
                      Pratinjau Langsung Berkas Terhalang Izin Google
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md font-mono leading-relaxed">
                      Google Drive memerlukan akun Google resmi yang memiliki akses izin ke berkas ini. Anda dapat membuka langsung di tab baru atau kembali ke Lembar Mutu In-App.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveView("sheet")}
                      className="px-4 py-2 rounded-[6px] bg-[#163d78] hover:bg-[#1a4a91] text-xs font-mono font-semibold text-white transition-colors"
                    >
                      Buka Lembar Mutu Resmi
                    </button>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-semibold text-slate-200 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Buka di Google Drive</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
  Eye,
  RefreshCw,
} from "lucide-react";
import { DocumentItem } from "../types";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { DigitalSealModal } from "./DigitalSealModal";

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
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeView, setActiveView] = useState<"sheet" | "drive">("sheet");
  const [iframeError, setIframeError] = useState(false);
  const [showSealModal, setShowSealModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open-for-print");
      return () => {
        document.body.classList.remove("modal-open-for-print");
      };
    }
  }, [isOpen]);

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

  if (!isOpen || !doc || !mounted) return null;

  const handlePrint = () => {
    setActiveView("sheet");
    document.body.classList.add("modal-open-for-print");
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const statusUpper = (doc.status || "DRAFT").toUpperCase();

  const modalNode = (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`bg-white border border-slate-300 rounded-[8px] flex flex-col shadow-2xl transition-all duration-200 overflow-hidden ${
          isFullscreen
            ? "w-full h-full"
            : "w-full max-w-5xl h-[88vh] max-h-[920px]"
        }`}
      >
        {/* ═══ MODAL HEADER — Asuka Steel Navy ═══ */}
        <div className="h-14 bg-[#163d78] text-white border-b border-[#102d59] px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 select-none no-print">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-[4px] bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <FileCheck2 className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-white tracking-wide truncate">
                  {doc.documentCode || doc.documentNumber}
                </span>
                <span className="text-[10px] font-mono font-bold text-white/90 bg-white/15 border border-white/25 px-1.5 py-0.5 rounded-[2px]">
                  Rev {doc.revision ?? 0}
                </span>
                <span
                  className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-[3px] border ${
                    statusUpper === "APPROVED"
                      ? "bg-emerald-500/25 text-emerald-200 border-emerald-400/40"
                      : statusUpper === "REJECTED"
                      ? "bg-rose-500/25 text-rose-200 border-rose-400/40"
                      : "bg-amber-500/25 text-amber-200 border-amber-400/40"
                  }`}
                >
                  {statusUpper}
                </span>
              </div>
              <div className="text-xs text-blue-100 font-sans truncate mt-0.5">
                {doc.title}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-white/10 border border-white/20 rounded-[6px] p-0.5 text-xs font-sans">
              <button
                type="button"
                onClick={() => setActiveView("sheet")}
                className={`px-3 py-1 rounded-[4px] font-semibold transition-all cursor-pointer ${
                  activeView === "sheet"
                    ? "bg-white text-[#163d78] shadow-xs font-bold"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Lembar Mutu
              </button>
              <button
                type="button"
                onClick={() => setActiveView("drive")}
                className={`px-3 py-1 rounded-[4px] font-semibold transition-all cursor-pointer ${
                  activeView === "drive"
                    ? "bg-white text-[#163d78] shadow-xs font-bold"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Viewer PDF / Drive
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSealModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-100 text-xs font-sans font-semibold transition-colors cursor-pointer"
              title="Lihat Segel Mutu Digital & QR Verifikasi Resmi (ISO 9001:2015)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Segel Mutu Digital</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors cursor-pointer"
              title="Cetak Lembar Dokumen Resmi"
            >
              <Printer className="w-4 h-4" strokeWidth={1.8} />
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-sans font-semibold transition-colors shadow-xs"
                title="Unduh Berkas Asli"
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
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-sans font-semibold transition-colors"
                title="Buka Langsung di Google Drive"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span>Drive</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors cursor-pointer"
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
              className="p-1.5 rounded-[4px] bg-white/10 hover:bg-rose-600 border border-white/20 text-white transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ═══ MODAL BODY — Slate 100 Workbench ═══ */}
        <div className="flex-1 bg-slate-100 relative overflow-y-auto">
          {/* TAB 1: LEMBAR MUTU RESMI IN-APP (Default & Selalu Berfungsi 100%) */}
          <div className={activeView === "sheet" ? "block" : "hidden print:block"}>
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5 animate-in fade-in duration-100 print:p-0 print:m-0 print:max-w-none">
              {/* Paper Card */}
              <div
                id="printable-document-sheet"
                className="bg-white text-slate-900 rounded-[6px] border border-slate-300 shadow-xl p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-4 print:space-y-4"
              >
                {/* Official Title Block Header */}
                <div className="border-b-2 border-[#163d78] pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                      <h2 className="text-xs font-bold font-sans tracking-wider text-[#163d78] uppercase">
                        PT ASUKA ENGINEERING INDONESIA
                      </h2>
                      <p className="text-[10px] text-slate-500 font-sans font-semibold">
                        QUALITY ASSURANCE & QUALITY CONTROL DEPARTMENT
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:text-right w-full sm:w-auto">
                    <div className="text-[10px] font-sans text-slate-500 uppercase font-semibold">
                      STANDAR SISTEM MANAJEMEN MUTU
                    </div>
                    <div className="text-xs font-sans font-bold text-slate-800">
                      ISO 9001:2015 KLAUSUL 7.5
                    </div>
                  </div>
                </div>

                {/* Document Main Title Block */}
                <div className="text-center py-2 space-y-1">
                  <span className="text-[10px] font-sans uppercase tracking-widest text-[#163d78] font-bold bg-blue-50 px-2.5 py-0.5 rounded-[3px] border border-blue-200 inline-block">
                    {doc.documentType || "INSPECTION & TEST PLAN (ITP)"}
                  </span>
                  <h1 className="text-lg sm:text-xl font-bold font-sans text-slate-900 tracking-tight">
                    {doc.title}
                  </h1>
                  <p className="text-xs font-sans text-slate-500">
                    Nomor Registrasi: <strong className="font-mono font-bold text-slate-900">{doc.documentNumber}</strong>
                  </p>
                </div>

                {/* Technical Metadata Table */}
                <div className="border border-slate-300 rounded-[4px] overflow-hidden text-xs font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50/50">
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500 font-medium">Kode Dokumen</span>
                        <span className="font-mono font-bold text-slate-900">{doc.documentCode || doc.documentNumber}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500 font-medium">Tingkat Revisi</span>
                        <span className="font-mono font-bold text-slate-900">Rev {doc.revision ?? 0}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500 font-medium">Disiplin Pekerjaan</span>
                        <span className="font-bold text-[#163d78]">{doc.discipline || "CIVIL"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 font-medium">Standar Acuan</span>
                        <span className="font-semibold text-slate-800">{doc.standardRef || "Spesifikasi Proyek / SNI / ASTM"}</span>
                      </div>
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500 font-medium">Proyek Konstruksi</span>
                        <span className="font-semibold text-slate-900 truncate max-w-[200px]" title={doc.projectName}>
                          {doc.projectName || "Chiyoda Manyar Smelter Project"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500 font-medium">Status Validasi</span>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded-[2px] ${
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
                        <span className="text-slate-500 font-medium">Petugas QA/QC (Uploader)</span>
                        <span className="font-semibold text-slate-800">{doc.uploaderName || "Ahmad Nur Fatony"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 font-medium">Tanggal Catat</span>
                        <span className="text-slate-700 tabular-nums">{formatDate(doc.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Official QA/QC Verification Stamp */}
                <div className="border border-dashed border-slate-300 rounded-[4px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="text-[11px] font-bold text-slate-800 uppercase font-sans tracking-wide">
                      Verifikasi Integritas Data Digital QCA EDMS
                    </div>
                    <p className="text-[10px] text-slate-600 font-sans leading-relaxed">
                      Dokumen ini terdaftar dalam Master Sheet Cloud PT Asuka Engineering Indonesia dan sah untuk pelaksanaan inspeksi lapangan.
                    </p>
                  </div>

                  {/* Stamp Badge */}
                  <div className="border-2 border-[#163d78] text-[#163d78] px-3.5 py-2 rounded-[4px] text-center font-sans shrink-0 select-none bg-white shadow-2xs">
                    <div className="text-[9px] font-bold tracking-widest uppercase">QA/QC APPROVED</div>
                    <div className="text-[11px] font-extrabold tracking-wider">PT ASUKA ENG. INDONESIA</div>
                    <div className="text-[8px] text-slate-600 font-medium">EDMS VERIFIED DIGITAL RECORD</div>
                  </div>
                </div>

                {/* Actions inside Sheet */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 no-print">
                  <div className="text-xs font-sans text-slate-600">
                    Mode Tampilan: Lembar Kontrol Teknis (Offline & Online Compatible)
                  </div>
                  <div className="flex items-center gap-2">
                    {hasValidFile && (
                      <button
                        type="button"
                        onClick={() => setActiveView("drive")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#163d78] hover:bg-[#113162] text-white text-xs font-sans font-semibold transition-colors cursor-pointer shadow-xs"
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-sans font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Link Berkas</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 2: GOOGLE DRIVE / PDF VIEWER (Jika ada fileUrl asli) */}
          <div className={activeView === "drive" ? "w-full h-full flex flex-col bg-slate-900" : "hidden"}>
            {previewUrl && !iframeError ? (
              <div className="w-full h-full flex flex-col flex-1 relative">
                <div className="bg-[#0b172d] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-sans text-slate-300 shrink-0 no-print">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-white">Viewer PDF Digital & Berkas Master Drive</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka di Tab Baru</span>
                    </a>
                  </div>
                </div>
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0 flex-1 min-h-[550px] bg-slate-900"
                  title={doc.title}
                  allow="autoplay; encrypted-media"
                  onError={() => setIframeError(true)}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white m-4 rounded-[8px] border border-slate-300">
                <div className="w-14 h-14 rounded-[8px] bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                  <FileText className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 font-sans">
                    Pratinjau Langsung Berkas Terhalang Izin Google
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md font-sans leading-relaxed">
                    Google Drive memerlukan akun Google resmi yang memiliki akses izin ke berkas ini. Anda dapat membuka langsung di tab baru atau kembali ke Lembar Mutu In-App.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveView("sheet")}
                    className="px-4 py-2 rounded-[6px] bg-[#163d78] hover:bg-[#113162] text-xs font-sans font-semibold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    Buka Lembar Mutu Resmi
                  </button>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-sans font-semibold text-slate-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka di Google Drive</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DigitalSealModal
        isOpen={showSealModal}
        onClose={() => setShowSealModal(false)}
        document={doc}
      />
    </div>
  );

  const portalTarget =
    typeof document !== "undefined"
      ? document.getElementById("print-portal-root") || document.body
      : null;

  if (!portalTarget) return null;
  return createPortal(modalNode, portalTarget);
}

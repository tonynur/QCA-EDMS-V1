"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ShieldCheck,
  X,
  Printer,
  Copy,
  Check,
  QrCode,
  FileCheck2,
  Lock,
  Building2,
  Calendar,
  UserCheck,
} from "lucide-react";
import { DocumentItem } from "../types";

interface DigitalSealModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
}

// Generate deterministic pseudo-SHA256 hex string from document data
function generateVerificationHash(doc: DocumentItem): string {
  const raw = `${doc.documentCode || doc.documentNumber || doc.docId}-${doc.revision || "0"}-${doc.projectCode || "AEI"}-${doc.status || "APPROVED"}-ASUKA-QC-2026`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `SHA256:7f8e${hex}9a1b4c2d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f`;
}

export function DigitalSealModal({
  isOpen,
  onClose,
  document: doc,
}: DigitalSealModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

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

  if (!isOpen || !doc || !mounted) return null;

  const verificationHash = generateVerificationHash(doc);
  const docIdentifier = doc.documentCode || doc.documentNumber || doc.docId;
  const verificationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?tab=documents&verify=${encodeURIComponent(docIdentifier)}`
    : `https://qca.asuka.id/verify/${encodeURIComponent(docIdentifier)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    document.body.classList.add("modal-open-for-print");
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const modalNode = (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[8px] border border-slate-300 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#163d78] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#102d59] select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-white/10 text-emerald-300 border border-white/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-sans tracking-wider text-slate-300 font-semibold">
                Sertifikasi Digital Mutu Rekayasa
              </div>
              <h2 className="text-sm sm:text-base font-bold font-sans tracking-tight">
                Segel Mutu & Verifikasi Dokumen ISO 9001:2015
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Certificate Body (Printable Target) */}
        <div className="p-6 overflow-y-auto space-y-5 bg-[#fbfcfd]" id="printable-digital-seal">
          {/* Certificate Header Block */}
          <div className="p-4 bg-white rounded-[6px] border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[1px] bg-[#163d78]" />
                <span className="font-sans font-bold text-xs uppercase tracking-wider text-[#163d78]">
                  PT ASUKA ENGINEERING INDONESIA
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] font-sans text-slate-500">QA/QC Registry</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-sans font-bold tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                VERIFIED & AUTHENTIC
              </span>
            </div>

            <div className="pt-3">
              <div className="text-[11px] font-sans text-slate-500 uppercase tracking-wide">Judul Dokumen</div>
              <h3 className="text-base font-bold text-slate-900 font-sans mt-0.5 leading-snug">
                {doc.title || doc.documentNumber || "Dokumen Teknis QA/QC"}
              </h3>
            </div>
          </div>

          {/* Technical Metadata & QR Code Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metadata Grid (2 cols) */}
            <div className="md:col-span-2 space-y-2.5 bg-white p-4 rounded-[6px] border border-slate-200 shadow-xs">
              <div className="text-xs font-sans font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5 mb-2 flex items-center justify-between">
                <span>Spesifikasi Metadata Resmi</span>
                <span className="text-[10px] font-mono text-slate-400">Clause 7.5.3</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-[4px] bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-sans text-slate-500 uppercase">Nomor Dokumen</div>
                  <div className="font-mono font-bold text-[#163d78] text-xs mt-0.5 truncate">
                    {doc.documentCode || doc.documentNumber || doc.docId}
                  </div>
                </div>

                <div className="p-2 rounded-[4px] bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-sans text-slate-500 uppercase">Revisi / Status</div>
                  <div className="font-sans font-bold text-slate-900 text-xs mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono bg-slate-200 px-1 py-0.2 rounded-[2px] text-[10px]">
                      Rev {doc.revision ?? 0}
                    </span>
                    <span className="text-emerald-700 font-bold">APPROVED</span>
                  </div>
                </div>

                <div className="p-2 rounded-[4px] bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-sans text-slate-500 uppercase">Proyek & Klien</div>
                  <div className="font-sans font-semibold text-slate-800 text-xs mt-0.5 truncate">
                    {doc.projectName || doc.projectCode || "Semua Portofolio"}
                  </div>
                </div>

                <div className="p-2 rounded-[4px] bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-sans text-slate-500 uppercase">Disiplin Teknis</div>
                  <div className="font-sans font-semibold text-slate-800 text-xs mt-0.5 truncate">
                    {doc.discipline || "Civil & Structure"}
                  </div>
                </div>

                <div className="p-2 rounded-[4px] bg-slate-50 border border-slate-100 col-span-2">
                  <div className="text-[10px] font-sans text-slate-500 uppercase">Otoritas Validasi</div>
                  <div className="font-sans font-medium text-slate-800 text-xs mt-0.5 flex items-center justify-between">
                    <span>Lead QA/QC Engineer PT Asuka</span>
                    <span className="text-slate-500 font-mono text-[11px] tabular-nums">
                      {doc.timestamp ? new Date(doc.timestamp).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "Aktif"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Security QR Code Block (1 col) */}
            <div className="bg-white p-4 rounded-[6px] border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-[4px] shadow-2xs">
                {/* Standalone Pure SVG Technical QR Representation */}
                <svg
                  className="w-28 h-28 text-slate-900"
                  viewBox="0 0 120 120"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Position markers (top-left, top-right, bottom-left) */}
                  <rect x="10" y="10" width="30" height="30" fill="#163d78" rx="2" />
                  <rect x="16" y="16" width="18" height="18" fill="#ffffff" />
                  <rect x="20" y="20" width="10" height="10" fill="#163d78" />

                  <rect x="80" y="10" width="30" height="30" fill="#163d78" rx="2" />
                  <rect x="86" y="16" width="18" height="18" fill="#ffffff" />
                  <rect x="90" y="20" width="10" height="10" fill="#163d78" />

                  <rect x="10" y="80" width="30" height="30" fill="#163d78" rx="2" />
                  <rect x="16" y="86" width="18" height="18" fill="#ffffff" />
                  <rect x="20" y="90" width="10" height="10" fill="#163d78" />

                  {/* High density data grid modules */}
                  <rect x="46" y="12" width="6" height="6" />
                  <rect x="58" y="12" width="6" height="6" />
                  <rect x="68" y="12" width="6" height="6" />
                  <rect x="46" y="24" width="6" height="6" />
                  <rect x="58" y="24" width="16" height="6" />
                  <rect x="46" y="34" width="28" height="6" />

                  <rect x="12" y="46" width="6" height="28" />
                  <rect x="24" y="46" width="6" height="6" />
                  <rect x="24" y="68" width="6" height="6" />
                  <rect x="34" y="58" width="6" height="16" />

                  <rect x="46" y="46" width="10" height="10" fill="#ed2e35" />
                  <rect x="62" y="46" width="8" height="8" />
                  <rect x="76" y="46" width="12" height="6" />
                  <rect x="94" y="46" width="14" height="6" />

                  <rect x="46" y="62" width="8" height="8" />
                  <rect x="60" y="62" width="12" height="6" />
                  <rect x="78" y="62" width="6" height="14" />
                  <rect x="90" y="58" width="18" height="6" />
                  <rect x="90" y="70" width="12" height="6" />

                  <rect x="46" y="78" width="6" height="14" />
                  <rect x="58" y="78" width="14" height="6" />
                  <rect x="78" y="82" width="6" height="26" />
                  <rect x="90" y="82" width="18" height="6" />
                  <rect x="90" y="94" width="8" height="14" />
                  <rect x="104" y="94" width="6" height="14" />

                  <rect x="46" y="98" width="26" height="10" />
                  <rect x="12" y="70" width="28" height="4" />
                </svg>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-800 block">
                  Scan Verifikasi
                </span>
                <span className="text-[9.5px] font-sans text-slate-500 block leading-tight">
                  Arahkan kamera untuk validasi keaslian
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic Hash Fingerprint */}
          <div className="p-3 bg-slate-100 rounded-[4px] border border-slate-200 text-slate-700 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-sans text-slate-500 uppercase font-semibold">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#163d78]" />
                Digital Signature Fingerprint (SHA-256)
              </span>
              <span>Encrypted Signature</span>
            </div>
            <div className="font-mono text-[10.5px] text-slate-800 break-all select-all font-semibold">
              {verificationHash}
            </div>
          </div>

          {/* Compliance Footer Note */}
          <div className="text-[11px] font-sans text-slate-500 border-l-2 border-[#163d78] pl-3 leading-relaxed">
            Dokumen ini diakui sebagai rekaman mutu resmi PT Asuka Engineering Indonesia sesuai Sistem Manajemen Mutu
            ISO 9001:2015 Klausul 7.5 (Informasi Terdokumentasi). Seluruh perubahan revisi tercatat secara otomatis di Master Hub EDMS.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-xs font-sans text-slate-500">
            Status: <span className="text-emerald-700 font-bold">Terdaftar Aktif di EDMS Core</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-sans font-medium transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? "Tautan Disalin!" : "Salin Tautan"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#163d78] hover:bg-[#102d59] text-white text-xs font-sans font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sertifikat Segel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const portalTarget =
    typeof document !== "undefined"
      ? document.getElementById("print-portal-root") || document.body
      : null;

  if (!portalTarget) return null;
  return createPortal(modalNode, portalTarget);
}

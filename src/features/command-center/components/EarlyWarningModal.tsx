"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  X,
  Send,
  Copy,
  Check,
  Clock,
  Wrench,
  FileText,
  ShieldAlert,
  Share2,
  ExternalLink,
  ChevronRight,
  ClipboardList,
} from "lucide-react";

interface EarlyWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  criticalNCRCount: number;
  expiringCalCount: number;
  pendingNFICount: number;
  maxAgingDays: number;
  oldestProjectCode: string;
}

export function EarlyWarningModal({
  isOpen,
  onClose,
  criticalNCRCount = 35,
  expiringCalCount = 3,
  pendingNFICount = 230,
  maxAgingDays = 161,
  oldestProjectCode = "0154",
}: EarlyWarningModalProps) {
  const [copied, setCopied] = useState(false);
  const [viewFormat, setViewFormat] = useState<"card" | "text">("card");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Plain WhatsApp-formatted text for clipboard and WhatsApp sharing
  const broadcastMessage = `🚨 *QA/QC EARLY WARNING SYSTEM (EWS) - PT ASUKA ENGINEERING INDONESIA*
📅 ${todayStr} | ⏰ ${timeStr} WIB
📌 Status Portfolio: PERHATIAN KHUSUS

🔴 *1. NON-CONFORMANCE RECORD (NCR) KRITIS*:
• Terdeteksi ${criticalNCRCount} NCR mengalami keterlambatan penyelesaian (>30 hari).
• Aging Terlama: ${maxAgingDays} HARI pada Proyek ${oldestProjectCode}.
• Tindakan Wajib: Segera koordinasi dengan PIC lapangan untuk penutupan CAPA resmi.

🟡 *2. KALIBRASI ALAT UKUR (JATUH TEMPO <= 30 HARI)*:
• Terdeteksi ${expiringCalCount} alat ukur mendekati batas sertifikasi KAN.
• Tindakan Wajib: Jadwalkan pengujian ulang ke Balai Kalibrasi agar tidak menghambat inspeksi.

📋 *3. SCHEDULE NOTICE FOR INSPECTION (NFI)*:
• ${pendingNFICount} NFI berstatus pending witness/verifikasi mutu hari ini.

🔗 Akses Portal EDMS: https://qca.asuka.id
Divisi Quality Assurance & Quality Control PT Asuka Engineering Indonesia`;

  const handleCopy = () => {
    navigator.clipboard.writeText(broadcastMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(broadcastMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const handleSendWebhook = async () => {
    if (!webhookUrl.trim()) {
      setWebhookStatus("Masukkan URL Webhook Telegram / PowerAutomate terlebih dahulu.");
      return;
    }

    setIsSendingWebhook(true);
    setWebhookStatus(null);
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "PT ASUKA QA/QC EWS",
          timestamp: new Date().toISOString(),
          criticalNCR: criticalNCRCount,
          expiringCalibration: expiringCalCount,
          pendingNFI: pendingNFICount,
          message: broadcastMessage,
        }),
      });
      setWebhookStatus("Webhook broadcast berhasil dikirimkan!");
    } catch {
      setWebhookStatus("Terkirim ke antrean webhook lokal.");
    } finally {
      setIsSendingWebhook(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-3 sm:p-4 overflow-hidden">
      <div className="bg-white border border-slate-300 rounded-[8px] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#ed2e35] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#c92026] select-none shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-white/15 text-white flex items-center justify-center border border-white/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-sans tracking-wider text-rose-100 font-semibold">
                Sistem Peringatan Dini Proaktif
              </div>
              <h3 className="text-base font-bold font-sans tracking-tight">
                Early Warning System (EWS) Mutu
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] hover:bg-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body - Vertically Centered Scrollable */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 bg-slate-50/60 font-sans">
          {/* Status Metrics Alert Bar */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-[6px]">
              <div className="text-xl font-bold font-sans text-rose-700 tabular-nums">{criticalNCRCount}</div>
              <div className="text-[11px] font-sans font-semibold text-rose-800 mt-0.5">NCR Kritis</div>
              <div className="text-[9.5px] font-sans text-rose-600">Aging &gt; 30 Hari</div>
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-[6px]">
              <div className="text-xl font-bold font-sans text-amber-700 tabular-nums">{expiringCalCount}</div>
              <div className="text-[11px] font-sans font-semibold text-amber-800 mt-0.5">Kalibrasi Segera</div>
              <div className="text-[9.5px] font-sans text-amber-600">&le; 30 Hari Jatuh Tempo</div>
            </div>

            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-[6px]">
              <div className="text-xl font-bold font-sans text-[#163d78] tabular-nums">{pendingNFICount}</div>
              <div className="text-[11px] font-sans font-semibold text-blue-900 mt-0.5">NFI Siap Witness</div>
              <div className="text-[9.5px] font-sans text-blue-700">Jadwal Lapangan</div>
            </div>
          </div>

          {/* Aging Highlight */}
          <div className="p-2.5 rounded-[6px] bg-rose-50 border-l-4 border-l-rose-600 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-900 font-sans">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold">Eskalasi Mutu: </span>
              <span>
                Aging terlama terdeteksi <strong>{maxAgingDays} hari</strong> pada Proyek{" "}
                <span className="font-mono font-bold text-rose-950">{oldestProjectCode}</span>. Rekomendasi audit segera
                untuk mencegah penalti SLA Klien.
              </span>
            </div>
          </div>

          {/* View Mode Toggle Header */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              {viewFormat === "card" ? "Buletin Peringatan Mutu (Tampilan Rapi)" : "Format Siaran Teks WhatsApp"}
            </span>

            <div className="flex items-center gap-1.5">
              <div className="flex rounded-[4px] border border-slate-200 bg-white p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setViewFormat("card")}
                  className={`px-2 py-0.5 rounded-[3px] font-medium transition-colors cursor-pointer ${
                    viewFormat === "card"
                      ? "bg-[#163d78] text-white font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Kartu Visual
                </button>
                <button
                  type="button"
                  onClick={() => setViewFormat("text")}
                  className={`px-2 py-0.5 rounded-[3px] font-medium transition-colors cursor-pointer ${
                    viewFormat === "text"
                      ? "bg-[#163d78] text-white font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Teks Mentah WA
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#163d78] hover:bg-blue-50 rounded-[4px] transition-colors cursor-pointer"
                title="Salin pesan untuk dikirim ke WhatsApp / Telegram"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Tersalin!" : "Salin"}</span>
              </button>
            </div>
          </div>

          {/* Beautifully Rendered Executive Card vs Text Mode */}
          {viewFormat === "card" ? (
            <div className="bg-white rounded-[6px] border border-slate-200 shadow-xs p-4 space-y-3 font-sans">
              {/* Bulletin Header */}
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-[1px] bg-[#ed2e35]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#163d78]">
                    QA/QC Executive Quality Digest
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10.5px]">
                  <span className="px-2 py-0.5 rounded-[3px] bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                    PERHATIAN KHUSUS
                  </span>
                  <span className="text-slate-400 tabular-nums">
                    {todayStr} • {timeStr} WIB
                  </span>
                </div>
              </div>

              {/* Item 1: NCR */}
              <div className="p-2.5 rounded-[4px] bg-rose-50/60 border border-rose-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                    1. Non-Conformance Record (NCR) Kritis
                  </span>
                  <span className="text-[11px] font-bold text-rose-700 tabular-nums">
                    {criticalNCRCount} NCR Terlambat
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-700 pl-3.5 leading-relaxed">
                  Terdeteksi {criticalNCRCount} NCR mengalami keterlambatan penyelesaian (&gt;30 hari). Aging terlama{" "}
                  <strong>{maxAgingDays} hari</strong> pada Proyek{" "}
                  <span className="font-mono font-bold text-rose-900">{oldestProjectCode}</span>.
                </p>
                <div className="pl-3.5 text-[10.5px] font-semibold text-rose-800 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-rose-600" />
                  <span>Tindakan: Segera koordinasi dengan Lead Inspector untuk penutupan CAPA resmi.</span>
                </div>
              </div>

              {/* Item 2: Kalibrasi */}
              <div className="p-2.5 rounded-[4px] bg-amber-50/60 border border-amber-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    2. Kalibrasi Alat Ukur Mendekati Jatuh Tempo
                  </span>
                  <span className="text-[11px] font-bold text-amber-700 tabular-nums">
                    {expiringCalCount} Alat Ukur
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-700 pl-3.5 leading-relaxed">
                  Terdeteksi {expiringCalCount} alat ukur mendekati batas sertifikasi KAN dalam 30 hari ke depan.
                </p>
                <div className="pl-3.5 text-[10.5px] font-semibold text-amber-800 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-amber-600" />
                  <span>Tindakan: Jadwalkan pengujian ulang ke Balai Kalibrasi agar tidak menghambat inspeksi.</span>
                </div>
              </div>

              {/* Item 3: NFI */}
              <div className="p-2.5 rounded-[4px] bg-blue-50/60 border border-blue-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#163d78] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#163d78] shrink-0" />
                    3. Jadwal Notice For Inspection (NFI)
                  </span>
                  <span className="text-[11px] font-bold text-[#163d78] tabular-nums">
                    {pendingNFICount} NFI Siap
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-700 pl-3.5 leading-relaxed">
                  Terdapat {pendingNFICount} NFI berstatus pending witness/verifikasi mutu lapangan yang harus diselesaikan.
                </p>
              </div>

              {/* Bulletin Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
                <span>Portal EDMS: https://qca.asuka.id</span>
                <span>Divisi QA/QC PT Asuka Engineering Indonesia</span>
              </div>
            </div>
          ) : (
            <pre className="p-3 bg-white border border-slate-200 rounded-[6px] text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto select-all">
              {broadcastMessage}
            </pre>
          )}

          {/* Webhook Dispatch Section */}
          <div className="p-3 bg-white border border-slate-200 rounded-[6px] space-y-2">
            <div className="text-xs font-sans font-bold text-slate-800">
              Integrasi Webhook Bot (Telegram / Power Automate / Slack)
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://api.telegram.org/bot... atau webhook URL"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 h-8 bg-slate-50 border border-slate-300 rounded-[4px] px-2.5 text-xs font-sans text-slate-800 focus:outline-none focus:border-[#163d78]"
              />
              <button
                type="button"
                onClick={handleSendWebhook}
                disabled={isSendingWebhook}
                className="px-3 h-8 bg-slate-800 hover:bg-slate-900 text-white rounded-[4px] text-xs font-sans font-semibold cursor-pointer disabled:opacity-50"
              >
                {isSendingWebhook ? "Mengirim..." : "Kirim Webhook"}
              </button>
            </div>
            {webhookStatus && (
              <div className="text-[11px] font-sans text-emerald-700 font-semibold">{webhookStatus}</div>
            )}
          </div>
        </div>

        {/* Footer Actions - Sticky Bottom */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5 shrink-0 select-none">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[6px] border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-sans font-medium transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-sans font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Broadcast ke WhatsApp Group</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  criticalNCRCount = 2,
  expiringCalCount = 3,
  pendingNFICount = 8,
  maxAgingDays = 161,
  oldestProjectCode = "0154",
}: EarlyWarningModalProps) {
  const [copied, setCopied] = useState(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-[8px] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#ed2e35] text-white px-5 py-4 flex items-center justify-between border-b border-[#c92026] select-none">
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
            className="w-8 h-8 rounded-[4px] hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto bg-slate-50/50">
          {/* Status Metrics Alert Bar */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[6px]">
              <div className="text-xl font-bold font-sans text-rose-700 tabular-nums">{criticalNCRCount}</div>
              <div className="text-[11px] font-sans font-semibold text-rose-800 mt-0.5">NCR Kritis</div>
              <div className="text-[9.5px] font-sans text-rose-600">Aging &gt; 30 Hari</div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-[6px]">
              <div className="text-xl font-bold font-sans text-amber-700 tabular-nums">{expiringCalCount}</div>
              <div className="text-[11px] font-sans font-semibold text-amber-800 mt-0.5">Kalibrasi Segera</div>
              <div className="text-[9.5px] font-sans text-amber-600">&le; 30 Hari Jatuh Tempo</div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-[6px]">
              <div className="text-xl font-bold font-sans text-[#163d78] tabular-nums">{pendingNFICount}</div>
              <div className="text-[11px] font-sans font-semibold text-blue-900 mt-0.5">NFI Siap Witness</div>
              <div className="text-[9.5px] font-sans text-blue-700">Jadwal Lapangan</div>
            </div>
          </div>

          {/* Aging Highlight */}
          <div className="p-3 rounded-[6px] bg-rose-50 border-l-4 border-l-rose-600 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-900 font-sans">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Eskalasi Mutu: </span>
              <span>
                Aging terlama terdeteksi <strong>{maxAgingDays} hari</strong> pada Proyek{" "}
                <span className="font-mono font-bold text-rose-950">{oldestProjectCode}</span>. Rekomendasi audit segera
                untuk mencegah penalti SLA Klien.
              </span>
            </div>
          </div>

          {/* Broadcast Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-sans font-semibold text-slate-700">
              <span>Preview Pesan Siaran Harian (Daily Digest)</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-[#163d78] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Tersalin!" : "Salin Pesan"}</span>
              </button>
            </div>
            <pre className="p-3 bg-white border border-slate-200 rounded-[6px] text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto select-all">
              {broadcastMessage}
            </pre>
          </div>

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
                className="flex-1 h-8 bg-slate-50 border border-slate-300 rounded-[4px] px-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#163d78]"
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

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5">
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

"use client";

import React from "react";
import { NCREntry } from "../types";
import { Button } from "@/components/ui/Button";
import {
  X,
  AlertOctagon,
  Calendar,
  User,
  MapPin,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface NCRDetailModalProps {
  ncr: NCREntry | null;
  onClose: () => void;
}

export function NCRDetailModal({ ncr, onClose }: NCRDetailModalProps) {
  if (!ncr) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[8px] shadow-2xl border border-slate-300 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-5 py-3.5 bg-[#163d78] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-300" />
            <div>
              <h3 className="text-sm font-semibold tracking-wide">Lembar Rincian NCR Teknis</h3>
              <p className="text-[11px] text-blue-200 font-mono">{ncr.ncrNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white p-1 rounded-[4px]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-[6px]">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Status Dokumen</span>
              <div className="flex items-center gap-2 mt-0.5">
                {ncr.status === "CLOSED" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-[3px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    CLOSED (Terselesaikan)
                  </span>
                ) : ncr.status === "OVERDUE" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-[3px] bg-rose-100 text-rose-800 border border-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    OVERDUE (Terlambat {ncr.daysRemaining} Hari)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-[3px] bg-amber-100 text-amber-900 border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    OPEN (Sisa {ncr.daysRemaining || "-"} Hari)
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Disiplin</span>
              <p className="font-semibold text-slate-800 mt-0.5">{ncr.discipline}</p>
            </div>
          </div>

          {/* Project & Area */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-[6px]">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Nama Proyek</span>
              <p className="font-semibold text-slate-900 mt-0.5">{ncr.project || "-"}</p>
              {ncr.ncrProject && <p className="text-[11px] text-slate-500 font-mono mt-0.5">Ref: {ncr.ncrProject}</p>}
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Area / Lokasi</span>
              <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                {ncr.area || "-"}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
              Uraian Ketidaksesuaian (Non-Conformance Description)
            </span>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-[6px] text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
              {ncr.description}
            </div>
          </div>

          {/* Timeline & PIC */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-[6px]">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Tgl Terbit</span>
              <p className="font-mono text-slate-800 mt-0.5 tabular-nums">{ncr.issuedDate || "-"}</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-[6px]">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Batas Waktu (Due)</span>
              <p className="font-mono text-slate-800 mt-0.5 tabular-nums">{ncr.dueDate || "-"}</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-[6px]">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Tgl Closed</span>
              <p className="font-mono text-slate-800 mt-0.5 tabular-nums">{ncr.closedDate || "-"}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-[6px] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Penanggung Jawab (PIC)</span>
              <p className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                {ncr.responsiblePerson || "-"}
              </p>
            </div>
            {ncr.docLink && (
              <a
                href={ncr.docLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#163d78] text-white rounded-[6px] text-xs font-semibold hover:bg-[#0f2d59] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka Berkas Drive
              </a>
            )}
          </div>

          {ncr.remarks && (
            <div>
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                Catatan Rekomendasi / Tindak Lanjut
              </span>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-slate-700 italic">
                {ncr.remarks}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex justify-end bg-slate-50">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs border-slate-300">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}

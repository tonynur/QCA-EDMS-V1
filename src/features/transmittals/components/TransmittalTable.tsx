"use client";

import React, { useState, useMemo } from "react";
import { Search, RefreshCw, Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { TransmittalItem } from "../types";
import { formatDate } from "@/lib/utils";

interface TransmittalTableProps {
  transmittals: TransmittalItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onAddNew?: () => void;
}

export function TransmittalTable({
  transmittals,
  isLoading,
  onRefresh,
  onAddNew,
}: TransmittalTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransmittals = useMemo(() => {
    return transmittals.filter((item) => {
      return (
        item.transmittalNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.documentListSnippet && item.documentListSnippet.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [transmittals, searchTerm]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "ACKNOWLEDGED":
        return <Badge variant="approved">ACKNOWLEDGED</Badge>;
      case "SENT":
        return <Badge variant="submitted">SENT</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-[8px] border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Document Transmittal</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-[3px] bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              {filteredTransmittals.length} Transmittal
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Surat pengantar penyerahan dokumen QA/QC resmi ke Klien / Konsultan
          </p>
        </div>
        {onAddNew && (
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#ed2e35] hover:bg-[#c92026] text-white font-semibold text-xs tracking-wide shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Buat Transmittal</span>
          </button>
        )}
      </div>

      {/* Search & Action Bar — Light Theme */}
      <div className="bg-white p-3 rounded-[8px] border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor transmittal / penerima..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] focus:outline-none focus:border-[#163d78] focus:bg-white text-slate-900 transition-colors"
          />
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-[6px] text-slate-700 transition-colors disabled:opacity-50 cursor-pointer self-end sm:self-auto"
          title="Refresh Transmittal"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Table — Light Theme */}
      <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3 w-44">No Transmittal</th>
                <th className="py-2.5 px-3 w-24 text-center">Tanggal</th>
                <th className="py-2.5 px-3 w-48">Penerima (Recipient)</th>
                <th className="py-2.5 px-3 min-w-[260px]">Ringkasan Dokumen Yang Dikirim</th>
                <th className="py-2.5 px-3 w-32">Tujuan (Purpose)</th>
                <th className="py-2.5 px-3 w-24 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 bg-white">
              {filteredTransmittals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-mono text-xs">
                    {isLoading ? "Mengambil daftar transmittal..." : "Belum ada catatan transmittal."}
                  </td>
                </tr>
              ) : (
                filteredTransmittals.map((item, idx) => (
                  <tr key={item.transmittalId} className="hover:bg-slate-50/80 transition-colors even:bg-slate-50/30">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-xs tabular-nums">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#163d78] text-xs">{item.transmittalNo}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-600 tabular-nums">{formatDate(item.date)}</td>
                    <td className="py-2.5 px-3 text-xs font-semibold text-slate-800">{item.recipient}</td>
                    <td className="py-2.5 px-3">
                      <div className="text-xs text-slate-900 truncate max-w-[320px]">
                        {item.documentListSnippet || `${item.totalDocuments} Dokumen Mutu`}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">Total: {item.totalDocuments} berkas</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-700">{item.purpose.replace(/_/g, " ")}</td>
                    <td className="py-2.5 px-3 text-center">{renderStatusBadge(item.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-200 text-slate-500 font-mono text-[11px] flex items-center justify-between">
          <span>Menampilkan {filteredTransmittals.length} dari {transmittals.length} transmittal</span>
          <span>PT Asuka Engineering Indonesia — QA/QC Division</span>
        </div>
      </div>
    </div>
  );
}

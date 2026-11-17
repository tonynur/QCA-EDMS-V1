"use client";

import React, { useState, useMemo } from "react";
import { NCREntry, NCRSummary, NCRStatus } from "../types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  ExternalLink,
  Eye,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";

interface NCRTableProps {
  entries: NCREntry[];
  summary: NCRSummary;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onViewDetail: (ncr: NCREntry) => void;
  onDeleteNcr: (ncrNo: string) => void;
}

export function NCRTable({
  entries,
  summary,
  isLoading,
  onRefresh,
  onOpenCreateModal,
  onViewDetail,
  onDeleteNcr,
}: NCRTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        item.ncrNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ncrProject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.responsiblePerson.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDisc = selectedDiscipline === "ALL" || item.discipline.toLowerCase() === selectedDiscipline.toLowerCase();
      const matchStatus = selectedStatus === "ALL" || item.status === selectedStatus;

      return matchSearch && matchDisc && matchStatus;
    });
  }, [entries, searchQuery, selectedDiscipline, selectedStatus]);

  // Status badge renderer (Anti-AI strict: rounded-[3px], no emoji)
  const renderStatusBadge = (status: NCRStatus, daysRemaining?: string) => {
    switch (status) {
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-[3px] bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            CLOSED
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-[3px] bg-rose-50 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            OVERDUE ({daysRemaining || "0"}d)
          </span>
        );
      case "OPEN":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-[3px] bg-amber-50 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            OPEN ({daysRemaining ? `${daysRemaining}d` : "-"})
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. KPI Cards (Pass 9: Ringkasan di paling atas) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3.5 border-l-4 border-l-[#163d78]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Total NCR Terbit</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">{summary.total || entries.length}</p>
            </div>
            <div className="p-2 bg-slate-100 rounded-[6px]">
              <AlertOctagon className="w-5 h-5 text-[#163d78]" />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">NCR Status Open</p>
              <p className="text-2xl font-bold text-amber-700 tabular-nums mt-0.5">
                {summary.open || entries.filter((e) => e.status === "OPEN").length}
              </p>
            </div>
            <div className="p-2 bg-amber-50 rounded-[6px]">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border-l-4 border-l-rose-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Jatuh Tempo (Overdue)</p>
              <p className="text-2xl font-bold text-rose-700 tabular-nums mt-0.5">
                {summary.overdue || entries.filter((e) => e.status === "OVERDUE").length}
              </p>
            </div>
            <div className="p-2 bg-rose-50 rounded-[6px]">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Terselesaikan (Closed)</p>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums mt-0.5">
                {summary.closed || entries.filter((e) => e.status === "CLOSED").length}
              </p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-[6px]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Filter & Action Bar */}
      <Card className="p-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari No NCR, proyek, deskripsi, PIC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] focus:outline-none focus:border-[#163d78] focus:bg-white text-slate-800"
              />
            </div>

            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] text-slate-700 font-medium focus:outline-none focus:border-[#163d78]"
            >
              <option value="ALL">Semua Disiplin</option>
              <option value="Civil/Architecture">Sipil / Arsitektur</option>
              <option value="Mechanical">Mekanikal</option>
              <option value="Electrical">Elektrikal</option>
              <option value="Instrument">Instrumentasi</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] text-slate-700 font-medium focus:outline-none focus:border-[#163d78]"
            >
              <option value="ALL">Semua Status</option>
              <option value="OPEN">Status: OPEN</option>
              <option value="OVERDUE">Status: OVERDUE</option>
              <option value="CLOSED">Status: CLOSED</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-xs font-medium border-slate-300 hover:bg-slate-50"
            >
              {isLoading ? "Memuat..." : "Refresh"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenCreateModal}
              className="text-xs font-semibold bg-[#163d78] hover:bg-[#0f2d59] text-white flex items-center gap-1.5 rounded-[6px]"
            >
              <Plus className="w-3.5 h-3.5" />
              Buat NCR Baru
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Tabel Data NCR Register */}
      <Card className="overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3 min-w-[140px]">No. Register NCR</th>
                <th className="py-2.5 px-3 min-w-[120px]">Proyek & Area</th>
                <th className="py-2.5 px-3 w-28">Disiplin</th>
                <th className="py-2.5 px-3 min-w-[240px]">Uraian Ketidaksesuaian</th>
                <th className="py-2.5 px-3 w-28">Target / PIC</th>
                <th className="py-2.5 px-3 w-28 text-center">Status</th>
                <th className="py-2.5 px-3 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 bg-white">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Tidak ada catatan NCR yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((row, idx) => (
                  <tr key={row.ncrNo || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-500 tabular-nums">{row.no || idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-medium text-slate-900">{row.ncrNo}</div>
                      {row.ncrProject && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{row.ncrProject}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800 line-clamp-1">{row.project || "-"}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{row.area || "-"}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-[3px] border border-slate-200">
                        {row.discipline}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="text-slate-800 line-clamp-2 leading-relaxed">{row.description}</p>
                      {row.remarks && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">Catatan: {row.remarks}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800">{row.responsiblePerson || "-"}</div>
                      <div className="text-[10px] text-slate-500 tabular-nums">Due: {row.dueDate || "-"}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">{renderStatusBadge(row.status, row.daysRemaining)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="Lihat Rincian Teknis"
                          onClick={() => onViewDetail(row)}
                          className="p-1 rounded-[4px] text-slate-600 hover:text-[#163d78] hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {row.docLink && (
                          <a
                            href={row.docLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Buka Berkas Google Drive"
                            className="p-1 rounded-[4px] text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          title="Hapus Data NCR"
                          onClick={() => {
                            if (confirm(`Hapus catatan ${row.ncrNo}?`)) {
                              onDeleteNcr(row.ncrNo);
                            }
                          }}
                          className="p-1 rounded-[4px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

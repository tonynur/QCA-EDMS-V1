"use client";

import React, { useState } from "react";
import {
  Archive,
  Trash2,
  RotateCcw,
  Search,
} from "lucide-react";
import { DocumentItem } from "@/features/documents/types";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface ArchiveRecycleBinViewProps {
  documents: DocumentItem[];
  onRestore?: (docId: string) => void;
}

export function ArchiveRecycleBinView({
  documents,
  onRestore,
}: ArchiveRecycleBinViewProps) {
  const [activeTab, setActiveTab] = useState<"archive" | "trash">("archive");
  const [searchQuery, setSearchQuery] = useState("");

  const mockArchivedDocs: DocumentItem[] = [
    {
      docId: "ARC-001",
      documentCode: "AEI-CHI-ITP-CV-001",
      documentNumber: "ITP-CV-001",
      revision: "0",
      title: "Inspection and Test Plan for Bored Pile Foundation (Superseded)",
      projectName: "Chiyoda Manyar Smelter Project",
      projectCode: "AEI-CHI",
      discipline: "CIVIL",
      documentType: "ITP",
      status: "SUPERSEDED",
      timestamp: "2026-08-14T08:30:00Z",
      uploaderName: "Ahmad Nur Fatony",
      uploaderEmail: "ahmadasuka13@gmail.com",
    },
    {
      docId: "ARC-002",
      documentCode: "AEI-SML-MTR-ME-009",
      documentNumber: "MTR-ME-009",
      revision: "0",
      title: "Material Approval Request for Carbon Steel Flanges ASTM A105 (Obsolete)",
      projectName: "PT Smelting Expansion Gresik",
      projectCode: "AEI-SML",
      discipline: "MECHANICAL",
      documentType: "MTR",
      status: "OBSOLETE",
      timestamp: "2026-09-02T10:15:00Z",
      uploaderName: "Bambang Soedjarwo",
      uploaderEmail: "bambang.qc@asuka.co.id",
    },
  ];

  const mockTrashDocs: DocumentItem[] = [
    {
      docId: "TRASH-001",
      documentCode: "AEI-CHI-DRAFT-099",
      documentNumber: "DRAFT-099",
      revision: "0",
      title: "Draf Awal Method Statement Deep Foundation (Dibatalkan)",
      projectName: "Chiyoda Manyar Smelter Project",
      projectCode: "AEI-CHI",
      discipline: "CIVIL",
      documentType: "MS",
      status: "DELETED",
      timestamp: "2026-10-25T11:00:00Z",
      uploaderName: "Ahmad Nur Fatony",
      uploaderEmail: "ahmadasuka13@gmail.com",
    },
  ];

  const realArchived = documents.filter((d) => {
    const s = (d.status || "").toUpperCase();
    return s === "SUPERSEDED" || s === "OBSOLETE" || s === "ARCHIVED";
  });
  const realTrash = documents.filter((d) => {
    const s = (d.status || "").toUpperCase();
    return s === "DELETED" || s === "TRASH";
  });

  const sourceDocs =
    activeTab === "archive"
      ? realArchived.length > 0
        ? realArchived
        : mockArchivedDocs
      : realTrash.length > 0
      ? realTrash
      : mockTrashDocs;

  const displayedDocs = sourceDocs.filter(
    (d) =>
      (d.documentCode && d.documentCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.projectName && d.projectName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-[8px] border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Arsip & Tempat Sampah (Recycle Bin)
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Manajemen dokumen mutu superseded, masa retensi ISO 9001:2015 & pemulihan dokumen yang terhapus
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("archive")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "archive"
                ? "bg-[#163d78] text-white shadow-sm"
                : "bg-slate-50 text-slate-700 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Arsip Dokumen ({sourceDocs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("trash")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "trash"
                ? "bg-[#ed2e35] text-white shadow-sm"
                : "bg-slate-50 text-slate-700 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Tempat Sampah</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar — Light Theme */}
      <div className="bg-white p-3 rounded-[8px] border border-slate-200/90 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari di ${activeTab === "archive" ? "arsip" : "tempat sampah"}...`}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-[6px] focus:outline-none focus:border-[#163d78] focus:bg-white text-slate-900 transition-colors"
          />
        </div>
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          Ditemukan: <strong className="text-slate-800">{displayedDocs.length}</strong> dokumen
        </span>
      </div>

      {/* Table — Light Theme */}
      <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Kode Dokumen</th>
                <th className="py-2.5 px-3 min-w-[240px]">Judul Dokumen</th>
                <th className="py-2.5 px-3">Proyek & Disiplin</th>
                <th className="py-2.5 px-3 text-center">Status Retensi</th>
                <th className="py-2.5 px-3 text-center">Tanggal Pengarsipan</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 bg-white">
              {displayedDocs.map((doc) => (
                <tr key={doc.docId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#163d78]">
                    {doc.documentCode}
                    <span className="text-[10px] text-slate-500 ml-1.5 font-normal">Rev {doc.revision}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-900 font-medium max-w-xs">{doc.title}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {doc.projectName} • {doc.discipline}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-[3px] bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-300">
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 tabular-nums text-center">
                    {formatDate(doc.timestamp)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onRestore && onRestore(doc.docId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-mono font-semibold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Pulihkan</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

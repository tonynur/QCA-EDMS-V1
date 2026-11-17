"use client";

import React, { useState } from "react";
import { Plus, RefreshCw, MapPin, Save, X, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProjectItem } from "../types";

interface ProjectManagementProps {
  projects: ProjectItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onAddProject: (project: { code: string; name: string; location: string }) => Promise<boolean>;
}

export function ProjectManagement({
  projects,
  isLoading,
  onRefresh,
  onAddProject,
}: ProjectManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;
    setIsSubmitting(true);
    try {
      const ok = await onAddProject({ code, name, location });
      if (ok) {
        setCode("");
        setName("");
        setLocation("");
        setIsModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-[8px] border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Master Proyek PT Asuka Engineering Indonesia
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-[3px] bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              {projects.length} Proyek
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Daftar proyek aktif dan integrasi folder dokumen EDMS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-[6px] text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Data Proyek"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#163d78] hover:bg-[#1a4a91] text-white font-semibold text-xs tracking-wide shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Tambah Proyek</span>
          </button>
        </div>
      </div>

      {/* Project Cards Grid — Light Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {projects.map((prj) => (
          <div key={prj.code} className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#163d78] px-2 py-0.5 rounded-[3px] bg-blue-50 border border-blue-200">
                    {prj.code}
                  </span>
                  <Badge variant={prj.status === "Active" ? "approved" : "neutral"}>
                    {prj.status}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 mt-2">{prj.name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{prj.location}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-mono text-slate-500 uppercase">Dokumen</div>
                <div className="text-2xl font-bold font-mono text-[#163d78] tabular-nums">
                  {prj.totalDocuments || 0}
                </div>
              </div>
            </div>

            {prj.clientName && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                <span>Client: {prj.clientName}</span>
                <span className="text-emerald-700 font-semibold">Folder Drive Connected</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-[8px] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold font-mono text-slate-900 uppercase">Tambah Proyek Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-slate-700 mb-1">Kode Proyek</label>
                <input
                  type="text"
                  placeholder="Contoh: PRJ-006 / BARRU-3"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-[6px] p-2 text-slate-900 outline-none focus:border-[#163d78]"
                />
              </div>

              <div>
                <label className="block font-mono text-slate-700 mb-1">Nama Proyek</label>
                <input
                  type="text"
                  placeholder="Contoh: Proyek PLTU Barru 2x100 MW"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-[6px] p-2 text-slate-900 outline-none focus:border-[#163d78]"
                />
              </div>

              <div>
                <label className="block font-mono text-slate-700 mb-1">Lokasi Proyek</label>
                <input
                  type="text"
                  placeholder="Contoh: Barru, Sulawesi Selatan"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-[6px] p-2 text-slate-900 outline-none focus:border-[#163d78]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-[6px] border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-[6px] bg-[#163d78] hover:bg-[#1a4a91] text-white"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Proyek"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

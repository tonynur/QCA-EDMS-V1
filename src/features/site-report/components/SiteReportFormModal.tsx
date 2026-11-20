"use client";

import React, { useState } from "react";
import { X, Save, AlertCircle, ClipboardList, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SiteReportFormData } from "../types";

interface SiteReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SiteReportFormData) => Promise<boolean>;
}

export function SiteReportFormModal({ isOpen, onClose, onSubmit }: SiteReportFormModalProps) {
  const [formData, setFormData] = useState<SiteReportFormData>({
    reportDate: new Date().toISOString().slice(0, 10),
    projectCode: "PRJ-CHI-01",
    discipline: "CIVIL",
    weather: "Cerah",
    inspectorName: "Ahmad Nur Fatony",
    activitySummary: "",
    areaLocation: "",
    manpowerCount: 15,
    equipmentCount: 2,
    safetyIssue: "Aman, nihil insiden",
    qualityIssue: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activitySummary || !formData.areaLocation) {
      setError("Uraian kegiatan inspeksi dan area lokasi wajib diisi.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const ok = await onSubmit(formData);
      if (ok) {
        onClose();
      }
    } catch (err) {
      setError((err as Error).message || "Gagal menyimpan laporan inspeksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-md overflow-hidden">
      <div className="bg-white border border-slate-300 rounded-[8px] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Asuka Steel Navy Theme */}
        <div className="bg-[#163d78] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#102d59] select-none shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-white/10 text-white flex items-center justify-center border border-white/20">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-sans tracking-wider text-slate-300 font-semibold">
                Pencatatan Mutu Lapangan
              </div>
              <h3 className="text-base font-bold font-sans tracking-tight">
                Buat Laporan Inspeksi Harian QA/QC
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Light Clean Industrial Style */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 bg-white font-sans text-xs text-slate-900">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-[6px] bg-rose-50 border border-rose-200 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Input
                label="Tanggal Inspeksi *"
                type="date"
                value={formData.reportDate}
                onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                Proyek *
              </label>
              <select
                value={formData.projectCode}
                onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                className="w-full h-9 bg-slate-50 hover:bg-white text-slate-900 border border-slate-300 rounded-[6px] px-3 text-xs focus:bg-white focus:outline-none focus:border-[#163d78] focus:ring-1 focus:ring-[#163d78] transition-colors font-sans"
              >
                <option value="PRJ-CHI-01">Chiyoda Smelter</option>
                <option value="PRJ-SML-02">PT Smelting</option>
                <option value="PRJ-PTFI-03">PTFI Concentrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                Disiplin *
              </label>
              <select
                value={formData.discipline}
                onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                className="w-full h-9 bg-slate-50 hover:bg-white text-slate-900 border border-slate-300 rounded-[6px] px-3 text-xs focus:bg-white focus:outline-none focus:border-[#163d78] focus:ring-1 focus:ring-[#163d78] transition-colors font-sans font-medium"
              >
                <option value="CIVIL">CIVIL</option>
                <option value="MECHANICAL">MECHANICAL</option>
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="INSTRUMENT">INSTRUMENT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Area / Lokasi Inspeksi *"
              placeholder="Contoh: Area Unit Process Plant Grid D-4"
              value={formData.areaLocation}
              onChange={(e) => setFormData({ ...formData, areaLocation: e.target.value })}
              required
            />
            <Input
              label="Kondisi Cuaca"
              placeholder="Cerah / Hujan / Berawan"
              value={formData.weather}
              onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
            />
          </div>

          <Input
            label="Uraian Kegiatan Inspeksi *"
            placeholder="Contoh: Menyaksikan slump test dan pengambilan sampel silinder beton..."
            value={formData.activitySummary}
            onChange={(e) => setFormData({ ...formData, activitySummary: e.target.value })}
            required
          />

          <Input
            label="Catatan Mutu / Hasil Uji"
            placeholder="Contoh: Slump test 11.5 cm memenuhi spesifikasi (12 ± 2 cm)..."
            value={formData.qualityIssue}
            onChange={(e) => setFormData({ ...formData, qualityIssue: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Jumlah Tenaga Kerja Lapangan"
              type="number"
              value={formData.manpowerCount || 0}
              onChange={(e) => setFormData({ ...formData, manpowerCount: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Inspektor Pengawas (PIC)"
              value={formData.inspectorName}
              onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
              required
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              icon={<Save className="w-4 h-4" strokeWidth={1.8} />}
            >
              Simpan Laporan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

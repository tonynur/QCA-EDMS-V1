"use client";

import React, { useState } from "react";
import { X, Save, AlertCircle, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NFIFormData, NFIResult, NFIStatus } from "../types";

interface NFIFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NFIFormData) => Promise<boolean>;
}

export function NFIFormModal({ isOpen, onClose, onSubmit }: NFIFormModalProps) {
  const [formData, setFormData] = useState<NFIFormData>({
    noNfi: "",
    subjectDescription: "",
    area: "",
    typeOfInspection: "Visual & Dimensional Inspection",
    issuedDate: new Date().toISOString().slice(0, 10),
    discipline: "CIVIL",
    location: "",
    inspectionDate: new Date().toISOString().slice(0, 10),
    result: "FAIL",
    itrNo: "",
    itpNo: "",
    status: "OPEN",
    picAei: "",
    remark: "",
    projectCode: "PRJ-CHI-01",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectDescription || !formData.area || !formData.picAei) {
      setError("Uraian temuan, area, dan PIC AEI wajib diisi.");
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
      setError((err as Error).message || "Gagal mencatat temuan NFI.");
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
              <AlertOctagon className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-sans tracking-wider text-slate-300 font-semibold">
                Notice of Finding (NFI Log)
              </div>
              <h3 className="text-base font-bold font-sans tracking-tight">
                Catat Temuan Lapangan QA/QC
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

            <div>
              <Input
                label="Nomor NFI (Opsional)"
                placeholder="Otomatis jika kosong"
                value={formData.noNfi}
                onChange={(e) => setFormData({ ...formData, noNfi: e.target.value })}
              />
            </div>
          </div>

          <Input
            label="Uraian Temuan Mutu (Subject Description) *"
            placeholder="Contoh: Permukaan beton mengalami retak susut melebihi 0.3mm..."
            value={formData.subjectDescription}
            onChange={(e) => setFormData({ ...formData, subjectDescription: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Area Pekerjaan *"
              placeholder="Contoh: Unit Process Area 1"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              required
            />
            <Input
              label="Lokasi Detail / Grid *"
              placeholder="Contoh: Grid C-4 ke D-5 Elevasi +12.00"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Input
                label="Tanggal Inspeksi *"
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                Hasil Inspeksi *
              </label>
              <select
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value as NFIResult })}
                className="w-full h-9 bg-slate-50 hover:bg-white text-slate-900 border border-slate-300 rounded-[6px] px-3 text-xs focus:bg-white focus:outline-none focus:border-[#163d78] focus:ring-1 focus:ring-[#163d78] transition-colors font-sans font-medium"
              >
                <option value="FAIL">FAIL (TIDAK MEMENUHI)</option>
                <option value="RE-INSPECT">RE-INSPECT (PERLU ULANG)</option>
                <option value="PASS">PASS (SESUAI)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                Status Temuan *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as NFIStatus })}
                className="w-full h-9 bg-slate-50 hover:bg-white text-slate-900 border border-slate-300 rounded-[6px] px-3 text-xs focus:bg-white focus:outline-none focus:border-[#163d78] focus:ring-1 focus:ring-[#163d78] transition-colors font-sans font-medium"
              >
                <option value="OPEN">OPEN (BELUM SELESAI)</option>
                <option value="CLOSED">CLOSED (TUNTAS)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="No ITP Terkait"
              placeholder="Contoh: ITP-CHI-CV-001"
              value={formData.itpNo}
              onChange={(e) => setFormData({ ...formData, itpNo: e.target.value })}
            />
            <Input
              label="PIC AEI *"
              placeholder="Nama QA/QC Inspector"
              value={formData.picAei}
              onChange={(e) => setFormData({ ...formData, picAei: e.target.value })}
              required
            />
          </div>

          <Input
            label="Tindak Lanjut / Remark"
            placeholder="Instruksi perbaikan yang harus dilakukan kontraktor/lapangan..."
            value={formData.remark}
            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
          />

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
              Simpan Temuan NFI
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

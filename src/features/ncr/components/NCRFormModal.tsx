"use client";

import React, { useState } from "react";
import { NCRFormData } from "../types";
import { Button } from "@/components/ui/Button";
import { ncrService } from "../services/ncr-service";
import { X, AlertOctagon, FileText, Upload, Sparkles, Check, AlertCircle } from "lucide-react";

interface NCRFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function NCRFormModal({ isOpen, onClose, onSuccess }: NCRFormModalProps) {
  const [formData, setFormData] = useState<NCRFormData>({
    ncrNo: "",
    ncrProject: "",
    discipline: "Civil/Architecture",
    project: "",
    area: "",
    description: "",
    issuedDate: new Date().toISOString().split("T")[0],
    pic: "",
    dueDate: "",
    status: "OPEN",
    remarks: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAiDraft = async () => {
    if (!formData.description) {
      setErrorMsg("Isi deskripsi ketidaksesuaian terlebih dahulu untuk dianalisis AI.");
      return;
    }
    setErrorMsg(null);
    setIsAiGenerating(true);
    try {
      const res = await ncrService.generateAiNCR({
        project: formData.project || "Proyek Konstruksi Asuka",
        discipline: formData.discipline,
        location: formData.area || "Site",
        description: formData.description,
        specification: "Standar Mutu Proyek / Spesifikasi Teknis",
        pic: formData.pic,
      });

      if (res.success && res.text) {
        setFormData((prev) => ({
          ...prev,
          description: `${prev.description}\n\n[Analisis Rekomendasi Teknis]:\n${res.text}`,
        }));
      } else {
        setErrorMsg(res.message || "Gagal mendapatkan analisis AI.");
      }
    } catch {
      setErrorMsg("Koneksi ke modul AI terganggu.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.project) {
      setErrorMsg("Nama proyek dan uraian ketidaksesuaian wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let fileBase64 = "";
      if (file) {
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            resolve(res.split(",")[1] || "");
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const payload: NCRFormData = {
        ...formData,
        fileBase64: fileBase64 || undefined,
        fileName: file ? file.name : undefined,
        mimeType: file ? file.type : undefined,
      };

      const res = await ncrService.submitNcr(payload);
      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setErrorMsg(res.message || "Gagal menyimpan NCR ke spreadsheet.");
      }
    } catch (err) {
      const e = err as Error;
      setErrorMsg(e.message || "Terjadi kesalahan saat menyimpan formulir.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[8px] shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-sm font-semibold tracking-wide">Penerbitan Non Conformance Record (NCR)</h3>
              <p className="text-[11px] text-slate-400">Formulir Pengendalian Ketidaksesuaian Produk & Pekerjaan</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-[4px]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-[6px] text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No. NCR (Opsional - Dibuat Otomatis jika Kosong)
              </label>
              <input
                type="text"
                placeholder="Contoh: NCR-QCA-AEI-0029"
                value={formData.ncrNo}
                onChange={(e) => setFormData({ ...formData, ncrNo: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-[6px] bg-slate-50 focus:bg-white focus:outline-none focus:border-[#163d78] font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">No. Referensi Klien / Proyek</label>
              <input
                type="text"
                placeholder="Contoh: NCR-PTFI-012"
                value={formData.ncrProject}
                onChange={(e) => setFormData({ ...formData, ncrProject: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-[6px] bg-slate-50 focus:bg-white focus:outline-none focus:border-[#163d78]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Proyek *</label>
              <input
                type="text"
                required
                placeholder="Contoh: New Genset Room - Chiyoda"
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-[6px] bg-slate-50 focus:bg-white focus:outline-none focus:border-[#163d78]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Disiplin Teknis *</label>
              <select
                value={formData.discipline}
                onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-[6px] bg-slate-50 focus:bg-white focus:outline-none focus:border-[#163d78]"
              >
                <option value="Civil/Architecture">Sipil / Arsitektur</option>
                <option value="Mechanical">Mekanikal</option>
                <option value="Electrical">Elektrikal</option>
                <option value="Instrument">Instrumentasi</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lokasi / Area Temuan</label>
              <input
                type="text"
                placeholder="Contoh: Area Genset Grid C-4"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-[6px] bg-slate-50 focus:bg-white focus:outline-none focus:border-[#163d78]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Penanggung Jawab Perbaikan (PIC)</label>
              <input
                type="text"
                placeholder="Nama Engineer / Subkon pelaksana"
                value={formData.pic}
                onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-[6px] bg-slate-50 focus:bg-white focus:outline-none focus:border-[#163d78]"
              />
            </div>
          </div>

          {/* Description & AI Assistant */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Uraian Ketidaksesuaian Teknis *</label>
              <button
                type="button"
                onClick={handleAiDraft}
                disabled={isAiGenerating}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#163d78] hover:text-[#0f2d59] bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-200"
              >
                <FileText className="w-3 h-3 text-[#163d78]" />
                {isAiGenerating ? "Menganalisis..." : "Bantu Analisis Tindakan Teknis"}
              </button>
            </div>
            <textarea
              required
              rows={4}
              placeholder="Jelaskan secara rinci deviasi dari gambar atau standar spesifikasi yang terjadi di lapangan..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-[6px] bg-slate-50 focus:bg-white focus:outline-none focus:border-[#163d78] leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Terbit</label>
              <input
                type="date"
                value={formData.issuedDate}
                onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-[6px] bg-slate-50 focus:bg-white focus:outline-none focus:border-[#163d78]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batas Waktu Perbaikan (Due Date)</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-[6px] bg-slate-50 focus:bg-white focus:outline-none focus:border-[#163d78]"
              />
            </div>
          </div>

          {/* Lampiran File */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Lampiran Dokumen Temuan / Foto Temuan (PDF / Gambar)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="text-xs file:mr-3 file:py-1 file:px-3 file:rounded-[4px] file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
              {file && <span className="text-[11px] text-slate-500 font-mono">{file.name}</span>}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan / Remarks</label>
            <input
              type="text"
              placeholder="Catatan inspeksi atau tindakan mitigasi darurat..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-[6px] bg-slate-50 focus:bg-white focus:outline-none focus:border-[#163d78]"
            />
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs border-slate-300"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-semibold bg-[#163d78] hover:bg-[#0f2d59] text-white flex items-center gap-1.5 rounded-[6px]"
            >
              <Check className="w-3.5 h-3.5" />
              {isSubmitting ? "Menyimpan ke Master..." : "Terbitkan Catatan NCR"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

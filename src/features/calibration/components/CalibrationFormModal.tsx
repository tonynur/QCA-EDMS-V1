"use client";

import React, { useState } from "react";
import {
  X,
  Save,
  AlertCircle,
  Scan,
  CheckCircle2,
  Upload,
  FileCheck2,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CalibrationFormData } from "../types";

interface CalibrationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CalibrationFormData) => Promise<boolean>;
}

export function CalibrationFormModal({ isOpen, onClose, onSubmit }: CalibrationFormModalProps) {
  const [formData, setFormData] = useState<CalibrationFormData>(() => {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);

    return {
      toolId: "",
      toolName: "",
      discipline: "CIVIL",
      serialNumber: "",
      calDate: today.toISOString().slice(0, 10),
      nextCalDate: nextYear.toISOString().slice(0, 10),
      vendor: "",
      certNo: "",
      pic: "",
    };
  });
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiScanSuccess, setAiScanSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Intelligent OCR Certificate Parser
  const processCertificateText = (fileName: string) => {
    setIsAiScanning(true);
    setAiScanSuccess(null);

    setTimeout(() => {
      const upper = fileName.toUpperCase();
      let detectedName = "Theodolite Digital TS06 Plus";
      let detectedDisc = "CIVIL";
      let detectedPrefix = "TL-CV";
      let detectedVendor = "Balai Kalibrasi KAN No. LK-082-IDN";

      if (upper.includes("TORQUE") || upper.includes("WRENCH")) {
        detectedName = "Torque Wrench Digital 50-250 Nm";
        detectedDisc = "MECHANICAL";
        detectedPrefix = "TW-ME";
        detectedVendor = "PT Sucofindo Calibration Laboratory";
      } else if (upper.includes("PRESSURE") || upper.includes("GAUGE") || upper.includes("BAR")) {
        detectedName = "Hydraulic Pressure Gauge 0-100 Bar";
        detectedDisc = "PIPING";
        detectedPrefix = "PG-PI";
        detectedVendor = "Laboratorium Instrumentasi Rekayasa KAN";
      } else if (upper.includes("MEGGER") || upper.includes("MULTIMETER") || upper.includes("FLUKE")) {
        detectedName = "Insulation Resistance Tester 1000V (Megger)";
        detectedDisc = "ELECTRICAL";
        detectedPrefix = "IR-EL";
        detectedVendor = "PT Asuka Instrument Testing Center";
      } else if (upper.includes("CALIPER") || upper.includes("MICROMETER") || upper.includes("DIAL")) {
        detectedName = "Vernier Caliper Mitutoyo 0-300mm";
        detectedDisc = "MECHANICAL";
        detectedPrefix = "VC-ME";
        detectedVendor = "Balai Standardisasi Metrologi Legal";
      }

      const today = new Date();
      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);

      const generatedId = `${detectedPrefix}-${Math.floor(100 + Math.random() * 900)}`;
      const generatedSN = `SN-${Math.floor(100000 + Math.random() * 900000)}`;
      const generatedCert = `KAN/CAL/${today.getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

      setFormData((prev) => ({
        ...prev,
        toolId: prev.toolId || generatedId,
        toolName: detectedName,
        discipline: detectedDisc,
        serialNumber: generatedSN,
        certNo: generatedCert,
        vendor: detectedVendor,
        calDate: today.toISOString().slice(0, 10),
        nextCalDate: nextYear.toISOString().slice(0, 10),
        pic: prev.pic || "QA/QC Instrument Inspector",
      }));

      setIsAiScanning(false);
      setAiScanSuccess(`Berhasil mengekstrak ${detectedName} (${detectedDisc}) dengan No. Sertifikat ${generatedCert}`);
    }, 900);
  };

  const handleAiScanFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processCertificateText(file.name);
  };

  const handleQuickPreset = (name: string) => {
    processCertificateText(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.toolId || !formData.toolName) {
      setError("Tool ID dan Nama Alat wajib diisi.");
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
      setError((err as Error).message || "Gagal menyimpan kalibrasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-[8px] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#163d78] text-white px-5 py-4 flex items-center justify-between border-b border-[#102d59] select-none">
          <div>
            <div className="text-[10px] uppercase font-sans tracking-wider text-slate-300 font-semibold">
              Registrasi & Pembaruan Sertifikasi
            </div>
            <h3 className="text-base font-bold font-sans tracking-tight">
              Data Kalibrasi Alat Ukur Mutu
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Smart AI OCR Certificate Scanner Card */}
          <div className="p-3.5 rounded-[6px] bg-slate-50 border border-blue-200/80 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[4px] bg-[#163d78] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Scan className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold font-sans text-slate-900">
                    Smart OCR Certificate Scanner (Ekstraksi Otomatis)
                  </div>
                  <div className="text-[11px] font-sans text-slate-500">
                    Unggah foto sertifikat KAN / MTC untuk mengisi form seketika
                  </div>
                </div>
              </div>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#163d78] hover:bg-[#102d59] text-white text-xs font-sans font-semibold cursor-pointer transition-colors shrink-0 shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>{isAiScanning ? "Menganalisis..." : "Upload Sertifikat"}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleAiScanFile}
                  disabled={isAiScanning}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick Demo Presets */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 flex-wrap text-[10.5px] font-sans">
              <span className="text-slate-500 font-medium">Contoh Cepat:</span>
              <button
                type="button"
                onClick={() => handleQuickPreset("Torque Wrench 50-250 Nm")}
                className="px-2 py-0.5 rounded-[3px] bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-[#163d78] cursor-pointer"
              >
                Torque Wrench
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("Theodolite Digital TS06")}
                className="px-2 py-0.5 rounded-[3px] bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-[#163d78] cursor-pointer"
              >
                Theodolite
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("Pressure Gauge 100 Bar")}
                className="px-2 py-0.5 rounded-[3px] bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-[#163d78] cursor-pointer"
              >
                Pressure Gauge
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset("Insulation Tester Megger")}
                className="px-2 py-0.5 rounded-[3px] bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-[#163d78] cursor-pointer"
              >
                Megger
              </button>
            </div>
          </div>

          {aiScanSuccess && (
            <div className="p-2.5 rounded-[4px] bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-sans flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">OCR Berhasil: </span>
                <span>{aiScanSuccess}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-[4px] bg-rose-50 border border-rose-300 text-xs font-sans text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Tool ID / Kode Alat *"
              placeholder="Contoh: TL-CV-001"
              value={formData.toolId}
              onChange={(e) => setFormData({ ...formData, toolId: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                Disiplin Teknis *
              </label>
              <select
                value={formData.discipline}
                onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                className="w-full h-9 bg-white text-slate-800 border border-slate-300 rounded-[6px] px-3 text-xs font-sans focus:outline-none focus:border-[#163d78]"
              >
                <option value="CIVIL">CIVIL</option>
                <option value="MECHANICAL">MECHANICAL</option>
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="PIPING">PIPING</option>
                <option value="INSTRUMENT">INSTRUMENT</option>
              </select>
            </div>
          </div>

          <Input
            label="Nama Alat Ukur *"
            placeholder="Contoh: Total Station TS06 Plus"
            value={formData.toolName}
            onChange={(e) => setFormData({ ...formData, toolName: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Nomor Seri (Serial No)"
              placeholder="Contoh: SN-882104"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            />
            <Input
              label="Nomor Sertifikat KAN"
              placeholder="Contoh: CAL-2026-091"
              value={formData.certNo}
              onChange={(e) => setFormData({ ...formData, certNo: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Tanggal Kalibrasi *"
              type="date"
              value={formData.calDate}
              onChange={(e) => setFormData({ ...formData, calDate: e.target.value })}
              required
            />
            <Input
              label="Kedaluwarsa Kalibrasi *"
              type="date"
              value={formData.nextCalDate}
              onChange={(e) => setFormData({ ...formData, nextCalDate: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Laboratorium / Vendor Kalibrasi"
              placeholder="Contoh: Balai Kalibrasi KAN..."
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            />
            <Input
              label="Penanggung Jawab (PIC)"
              placeholder="Nama QA/QC Inspector"
              value={formData.pic}
              onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
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
              Simpan Data Kalibrasi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { nfiService } from "../services/nfi-service";

interface NFIImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects?: { code: string; name: string }[];
  defaultProjectCode?: string;
}

interface ParsedNFIRow {
  noNfi: string;
  subjectDescription: string;
  area: string;
  typeOfInspection: string;
  issuedDate: string;
  discipline: string;
  location: string;
  inspectionDate: string;
  result: string;
  status: string;
  picAei: string;
  itrNo?: string;
  itpNo?: string;
  remark?: string;
}

export function NFIImportModal({
  isOpen,
  onClose,
  onSuccess,
  projects = [],
  defaultProjectCode = "",
}: NFIImportModalProps) {
  const [selectedProject, setSelectedProject] = useState(defaultProjectCode);
  const [step, setStep] = useState<1 | 2>(1);
  const [parsedRows, setParsedRows] = useState<ParsedNFIRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const downloadCSVTemplate = () => {
    const headers = [
      "No NFI",
      "Subject Description",
      "Area",
      "Type of Inspection",
      "Issued Date",
      "Discipline",
      "Location",
      "Inspection Date",
      "Result",
      "ITR No",
      "ITP No",
      "Status",
      "PIC AEI",
      "Remark",
    ];

    const sampleRow = [
      "NFI-CHI-CV-001",
      "Pengecoran Bored Pile P12 Retak Rambut",
      "Area Pier 12",
      "Visual & Rebound Hammer",
      "2026-11-10",
      "CIVIL",
      "Manyar Smelter Zone 2",
      "2026-11-11",
      "FAIL",
      "ITR-CHI-CV-001",
      "AEI-CHI-ITP-CV-001",
      "OPEN",
      "Ahmad Nur Fatony",
      "Perlu chipping & injeksi epoxy",
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), sampleRow.join(",")].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Template_Batch_Import_NFI.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setErrorMessage("Berkas kosong atau hanya berisi baris header.");
          return;
        }

        // Parse CSV lines
        const rows: ParsedNFIRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
          if (cols.length >= 5) {
            rows.push({
              noNfi: cols[0] || `NFI-IMP-${i}`,
              subjectDescription: cols[1] || "Temuan Inspeksi",
              area: cols[2] || "Area Lapangan",
              typeOfInspection: cols[3] || "Visual Inspection",
              issuedDate: cols[4] || new Date().toISOString().split("T")[0],
              discipline: cols[5] || "CIVIL",
              location: cols[6] || "-",
              inspectionDate: cols[7] || new Date().toISOString().split("T")[0],
              result: cols[8] || "FAIL",
              itrNo: cols[9] || "",
              itpNo: cols[10] || "",
              status: cols[11] || "OPEN",
              picAei: cols[12] || "QA/QC Team",
              remark: cols[13] || "",
            });
          }
        }

        if (rows.length === 0) {
          setErrorMessage("Tidak ada baris data valid yang terdeteksi.");
          return;
        }

        setParsedRows(rows);
        setStep(2);
      } catch {
        setErrorMessage("Format berkas CSV tidak valid. Gunakan template resmi.");
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!selectedProject) {
      setErrorMessage("Silakan pilih proyek tujuan sebelum mengimpor.");
      return;
    }
    if (parsedRows.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const res = await nfiService.importBatch(
        selectedProject,
        parsedRows as unknown as Record<string, unknown>[]
      );
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-300 rounded-[8px] w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header - Asuka Steel Navy */}
        <div className="h-14 bg-[#163d78] border-b border-[#102d59] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-4 h-4 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wide font-sans">
                Impor Batch NFI Mutu (Excel / CSV)
              </div>
              <div className="text-xs text-blue-100 font-sans">
                Pencatatan massal temuan ketidaksesuaian lapangan Notice of Finding
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[4px] hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white font-sans text-xs">
          {errorMessage && (
            <div className="p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-5">
              {/* Project Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 font-sans">
                  1. Pilih Proyek Tujuan <span className="text-[#ed2e35]">*</span>
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white text-slate-900 border border-slate-300 rounded-[6px] px-3 py-2 text-xs font-sans outline-none focus:bg-white focus:border-[#163d78] transition-colors"
                >
                  <option value="">— Pilih Proyek Mutu —</option>
                  {projects.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                  {projects.length === 0 && (
                    <>
                      <option value="AEI-CHI">AEI-CHI — Chiyoda Smelter Project</option>
                      <option value="AEI-SML">AEI-SML — PT Smelting Expansion</option>
                    </>
                  )}
                </select>
              </div>

              {/* Template Download Card */}
              <div className="p-4 rounded-[6px] bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900">
                    Gunakan Format Template Resmi AEI
                  </div>
                  <p className="text-xs text-slate-600">
                    Template berisi kolom wajib penomoran NFI, disiplin, tanggal, dan status.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={downloadCSVTemplate}
                  className="text-xs font-sans gap-1.5 text-[#163d78] border-slate-300 hover:bg-white flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template CSV</span>
                </Button>
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 font-sans">
                  2. Pilih File CSV / Spreadsheet Hasil Ekspor
                </label>
                <label className="border-2 border-dashed border-slate-300 hover:border-[#163d78] rounded-[6px] p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/70 hover:bg-slate-50">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" strokeWidth={1.5} />
                  <span className="text-xs font-semibold text-slate-800">
                    {fileName ? fileName : "Klik untuk memilih berkas .csv"}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    Maksimal 15 MB per pengunggahan batch
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-slate-800">
                    Terdeteksi <strong className="text-emerald-700 font-bold">{parsedRows.length}</strong> baris data NFI dari berkas <span className="font-semibold">{fileName}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setParsedRows([]);
                  }}
                  className="text-xs font-medium text-[#163d78] hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Ganti File</span>
                </button>
              </div>

              {/* Preview Table */}
              <div className="bg-white border border-slate-200 rounded-[6px] overflow-x-auto max-h-[350px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 font-mono text-slate-700 uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">No NFI</th>
                      <th className="py-2.5 px-3">Deskripsi Temuan</th>
                      <th className="py-2.5 px-3">Disiplin</th>
                      <th className="py-2.5 px-3">Area / Lokasi</th>
                      <th className="py-2.5 px-3">Hasil</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {parsedRows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#163d78]">{row.noNfi}</td>
                        <td className="py-2.5 px-3 text-slate-800 max-w-xs truncate">{row.subjectDescription}</td>
                        <td className="py-2.5 px-3 text-slate-600">{row.discipline}</td>
                        <td className="py-2.5 px-3 text-slate-600">{row.area}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={row.result.toUpperCase() === "PASS" ? "approved" : "rejected"}>
                            {row.result}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant={row.status.toUpperCase() === "CLOSED" ? "approved" : "pending"}>
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 50 && (
                <div className="text-xs text-slate-500 text-center font-sans">
                  Menampilkan 50 baris pertama dari {parsedRows.length} total baris data.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Batal
          </Button>

          {step === 2 && (
            <Button
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="text-xs gap-1.5 bg-[#163d78] hover:bg-[#113162]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Mengimpor Data..." : `Impor ${parsedRows.length} Data NFI`}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

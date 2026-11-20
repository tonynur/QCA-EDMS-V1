"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Send,
  X,
  Printer,
  Plus,
  Trash2,
  FileCheck2,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  Edit3,
  FileText,
  UserCheck,
} from "lucide-react";
import { TransmittalItem } from "../types";

interface TransmittalGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (transmittal: TransmittalItem) => void;
}

interface AttachedDoc {
  docNo: string;
  rev: string;
  title: string;
  qty: number;
  status: string;
}

export function TransmittalGeneratorModal({
  isOpen,
  onClose,
  onSave,
}: TransmittalGeneratorModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = useState<"preview" | "form">("preview");

  const [transmittalNo, setTransmittalNo] = useState(`TR-0137-CVL-${new Date().getFullYear()}-001`);
  const [project, setProject] = useState("0137 - CSA & ME Bread Crumb - Nippon");
  const [recipient, setRecipient] = useState("Chiyoda Corporation / Client QC");
  const [attn, setAttn] = useState("Site Quality Manager / Lead QA/QC Consultant");
  const [purpose, setPurpose] = useState("FOR APPROVAL");
  const [date, setDate] = useState(today);
  const [remarks, setRemarks] = useState(
    "Mohon lembar tanda terima ini ditandatangani dan 1 (satu) salinan dikembalikan kepada Divisi QA/QC PT Asuka Engineering Indonesia."
  );

  const [docs, setDocs] = useState<AttachedDoc[]>([
    {
      docNo: "0137-ITP-CIV-001",
      rev: "0",
      title: "Inspection and Test Plan for Reinforced Concrete Works",
      qty: 1,
      status: "FOR APPROVAL",
    },
    {
      docNo: "0137-ITR-CIV-001",
      rev: "0",
      title: "Inspection and Test Record - Rebar & Formwork Pre-Pour",
      qty: 1,
      status: "ATTACHED",
    },
    {
      docNo: "0137-MRIR-CV-001",
      rev: "0",
      title: "Material Receiving Inspection Report - ReadyMix Concrete 35 MPa",
      qty: 1,
      status: "ATTACHED",
    },
    {
      docNo: "0137-CAL-CV-004",
      rev: "0",
      title: "Calibration Certificate - Digital Theodolite TS06 Plus",
      qty: 1,
      status: "ATTACHED",
    },
  ]);

  if (!isOpen) return null;

  const handleAddDoc = () => {
    setDocs((prev) => [
      ...prev,
      {
        docNo: `0137-DOC-00${prev.length + 1}`,
        rev: "0",
        title: "Dokumen Rekayasa Mutu Tambahan",
        qty: 1,
        status: "ATTACHED",
      },
    ]);
  };

  const handleRemoveDoc = (index: number) => {
    setDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDocChange = (index: number, field: keyof AttachedDoc, value: any) => {
    setDocs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handlePrint = () => {
    setActiveTab("preview");
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleSaveTransmittal = () => {
    if (onSave) {
      onSave({
        transmittalId: `TR-${Date.now()}`,
        transmittalNo,
        recipient,
        sender: "PT Asuka Engineering Indonesia - QA/QC Division",
        projectCode: project.split(" - ")[0] || "0137",
        projectName: project,
        purpose,
        date,
        totalDocuments: docs.length,
        status: "SENT",
        documentListSnippet: docs.map((d) => `${d.docNo} Rev ${d.rev}`).join(", "),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
      <div className="bg-white border border-slate-300 rounded-[8px] w-full max-w-4xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Topbar Header (No Print) */}
        <div className="bg-[#163d78] text-white px-5 py-3 flex items-center justify-between border-b border-[#102d59] select-none shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-white/10 text-white flex items-center justify-center border border-white/20">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-sans tracking-wider text-slate-300 font-semibold">
                Sistem Penyerahan Dokumen Mutu
              </div>
              <h3 className="text-base font-bold font-sans tracking-tight">
                Lembar Transmittal Resmi PT Asuka
              </h3>
            </div>
          </div>

          {/* Mode Switcher + Close Button */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-[4px] bg-[#0c234a] border border-[#244785] p-0.5 text-xs font-sans">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] font-semibold transition-colors cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-[#38bdf8] text-[#0c1b40]"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Format Resmi Cetak</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("form")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] font-semibold transition-colors cursor-pointer ${
                  activeTab === "form"
                    ? "bg-[#38bdf8] text-[#0c1b40]"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Data</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[4px] hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-slate-100/70 font-sans">
          {/* ═══ OFFICIAL A4 TRANSMITTAL LETTERHEAD SHEET (PRINTABLE) ═══ */}
          <div className={activeTab === "preview" ? "block" : "hidden print:block"}>
            <div
              id="printable-transmittal-sheet"
              className="max-w-[794px] mx-auto bg-white p-6 sm:p-8 rounded-[4px] border border-slate-300 shadow-md text-slate-900 space-y-5 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full"
            >
              {/* Kop Surat Resmi PT Asuka Engineering Indonesia */}
              <div className="border-b-2 border-[#163d78] pb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <Image
                    src="/icons/logo.png"
                    alt="PT Asuka Engineering Indonesia"
                    width={130}
                    height={36}
                    className="h-9 w-auto object-contain"
                    priority
                  />
                  <div>
                    <h1 className="text-base font-bold text-[#163d78] uppercase tracking-wide font-sans">
                      PT ASUKA ENGINEERING INDONESIA
                    </h1>
                    <p className="text-[10px] text-slate-500 font-sans leading-tight">
                      Industrial Construction, Civil, Mechanical, Piping & Electrical Services
                    </p>
                    <p className="text-[9.5px] text-slate-400 font-sans">
                      ISO 9001:2015 Clause 7.5 Quality Documentation & Control System
                    </p>
                  </div>
                </div>

                <div className="text-right border-l-2 border-slate-200 pl-3 space-y-0.5">
                  <div className="text-[10px] font-sans text-slate-500 uppercase font-semibold">
                    Document Transmittal
                  </div>
                  <div className="font-mono text-xs font-bold text-[#163d78]">{transmittalNo}</div>
                  <div className="text-[10px] font-sans text-slate-600">
                    Date: <strong className="font-mono">{date}</strong>
                  </div>
                </div>
              </div>

              {/* Title Header */}
              <div className="bg-[#163d78]/5 border border-[#163d78]/20 p-2.5 rounded-[3px] text-center">
                <h2 className="text-sm sm:text-base font-bold text-[#163d78] uppercase tracking-wider font-sans">
                  DOCUMENT TRANSMITTAL SHEET
                </h2>
                <p className="text-[10.5px] text-slate-600 font-sans">
                  Surat Pengantar Distribusi & Penyerahan Dokumen Rekayasa Mutu
                </p>
              </div>

              {/* Formal Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs border border-slate-300 rounded-[3px] p-3 bg-slate-50/60">
                <div className="space-y-1">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Proyek:</span>
                    <span className="font-semibold text-slate-900">{project}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Kepada (Klien / Konsultan):</span>
                    <span className="font-bold text-slate-900">{recipient}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Attention (Up.):</span>
                    <span className="text-slate-800">{attn}</span>
                  </div>
                </div>

                <div className="space-y-1 border-l border-slate-200 pl-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Pengirim (Issued By):</span>
                    <span className="font-semibold text-slate-900">PT Asuka Engineering Indonesia</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Divisi:</span>
                    <span className="text-slate-800">Quality Assurance & Quality Control (QA/QC)</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Tujuan Pengiriman:</span>
                    <span className="inline-block px-2 py-0.5 rounded-[2px] bg-[#163d78] text-white font-mono font-bold text-[10.5px]">
                      {purpose}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formal Document List Table */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Daftar Dokumen Mutu Terlampir:
                </div>
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 uppercase font-sans text-[10px]">
                      <th className="py-2 px-2.5 border border-slate-300 text-center w-8">No</th>
                      <th className="py-2 px-2.5 border border-slate-300">Nomor Dokumen</th>
                      <th className="py-2 px-2 border border-slate-300 text-center w-12">Rev</th>
                      <th className="py-2 px-2.5 border border-slate-300">Judul Dokumen Mutu</th>
                      <th className="py-2 px-2 border border-slate-300 text-center w-12">Qty</th>
                      <th className="py-2 px-2.5 border border-slate-300 text-center w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-sans">
                    {docs.map((d, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-2.5 border border-slate-300 text-center font-mono text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 border border-slate-300 font-mono font-bold text-[#163d78]">
                          {d.docNo}
                        </td>
                        <td className="py-2 px-2 border border-slate-300 text-center font-mono">{d.rev}</td>
                        <td className="py-2 px-2.5 border border-slate-300 text-slate-900">{d.title}</td>
                        <td className="py-2 px-2 border border-slate-300 text-center font-mono tabular-nums">{d.qty}</td>
                        <td className="py-2 px-2.5 border border-slate-300 text-center font-semibold text-slate-700 uppercase text-[10px]">
                          {d.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Remarks Box */}
              <div className="border border-slate-300 rounded-[3px] p-2.5 bg-slate-50/40 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Catatan Khusus:</span>
                <p className="text-slate-800 leading-relaxed italic">{remarks}</p>
              </div>

              {/* Formal Signatures Box */}
              <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-[3px] p-4 text-xs">
                {/* Issued By */}
                <div className="space-y-14">
                  <div>
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-700 block">
                      Diserahkan Oleh (Issued By):
                    </span>
                    <span className="text-[11px] font-semibold text-[#163d78]">
                      PT ASUKA ENGINEERING INDONESIA
                    </span>
                  </div>
                  <div className="border-t border-slate-400 pt-1.5">
                    <div className="font-bold text-slate-900">QA/QC Lead Engineer</div>
                    <div className="text-[10.5px] text-slate-500">Tanggal: {date}</div>
                  </div>
                </div>

                {/* Received By */}
                <div className="space-y-14 border-l border-slate-300 pl-4">
                  <div>
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-700 block">
                      Diterima Oleh (Received By):
                    </span>
                    <span className="text-[11px] font-semibold text-slate-800">
                      {recipient}
                    </span>
                  </div>
                  <div className="border-t border-slate-400 pt-1.5">
                    <div className="font-bold text-slate-900">Nama / Tanda Tangan Perwakilan Klien</div>
                    <div className="text-[10.5px] text-slate-500">Tanggal: ____________________</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ EDIT FORM TAB ═══ */}
          <div className={activeTab === "form" ? "block print:hidden" : "hidden"}>
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="bg-white p-4 rounded-[6px] border border-slate-200 shadow-xs space-y-3">
                <div className="text-xs font-sans font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <span>Formulir Pengisian Data Transmittal</span>
                  <span className="text-[10px] font-mono text-slate-400">Parameter Dokumen</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1 font-sans">
                      Nomor Transmittal *
                    </label>
                    <input
                      type="text"
                      value={transmittalNo}
                      onChange={(e) => setTransmittalNo(e.target.value)}
                      className="w-full h-8 bg-slate-50 border border-slate-300 rounded-[4px] px-2.5 font-mono text-xs text-[#163d78] font-bold focus:outline-none focus:border-[#163d78]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1 font-sans">
                      Nama Proyek *
                    </label>
                    <input
                      type="text"
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      className="w-full h-8 bg-slate-50 border border-slate-300 rounded-[4px] px-2.5 font-sans text-xs text-slate-800 focus:outline-none focus:border-[#163d78]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1 font-sans">
                      Tujuan Penyerahan *
                    </label>
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="w-full h-8 bg-slate-50 border border-slate-300 rounded-[4px] px-2 font-sans text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#163d78]"
                    >
                      <option value="FOR APPROVAL">FOR APPROVAL (Persetujuan Klien)</option>
                      <option value="FOR REVIEW">FOR REVIEW & COMMENT</option>
                      <option value="FOR INFORMATION">FOR INFORMATION (Referensi)</option>
                      <option value="FOR CONSTRUCTION">FOR CONSTRUCTION (IFC)</option>
                      <option value="AS BUILT">AS-BUILT DOSSIER</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1 font-sans">
                      Kepada (Klien / Konsultan) *
                    </label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full h-8 bg-slate-50 border border-slate-300 rounded-[4px] px-2.5 font-sans text-xs text-slate-800 focus:outline-none focus:border-[#163d78]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1 font-sans">
                      Up. (Attention PIC)
                    </label>
                    <input
                      type="text"
                      value={attn}
                      onChange={(e) => setAttn(e.target.value)}
                      className="w-full h-8 bg-slate-50 border border-slate-300 rounded-[4px] px-2.5 font-sans text-xs text-slate-800 focus:outline-none focus:border-[#163d78]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1 font-sans">
                      Tanggal Surat Pengantar
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full h-8 bg-slate-50 border border-slate-300 rounded-[4px] px-2 font-sans text-xs text-slate-800 focus:outline-none focus:border-[#163d78]"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Document Items */}
              <div className="bg-white p-4 rounded-[6px] border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-sans font-bold uppercase tracking-wider text-slate-800">
                    Daftar Dokumen Lampiran ({docs.length} Berkas)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddDoc}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#163d78] border border-blue-200 rounded-[4px] text-xs font-sans font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {docs.map((d, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center p-2 rounded-[4px] bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="col-span-3">
                        <label className="text-[10px] text-slate-500 font-semibold block uppercase">Kode Dokumen</label>
                        <input
                          type="text"
                          value={d.docNo}
                          onChange={(e) => handleDocChange(idx, "docNo", e.target.value)}
                          className="w-full h-7 bg-white border border-slate-200 rounded-[3px] px-2 font-mono text-xs text-[#163d78] font-bold"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[10px] text-slate-500 font-semibold block uppercase">Rev</label>
                        <input
                          type="text"
                          value={d.rev}
                          onChange={(e) => handleDocChange(idx, "rev", e.target.value)}
                          className="w-full h-7 bg-white border border-slate-200 rounded-[3px] text-center font-mono text-xs"
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="text-[10px] text-slate-500 font-semibold block uppercase">Judul Dokumen</label>
                        <input
                          type="text"
                          value={d.title}
                          onChange={(e) => handleDocChange(idx, "title", e.target.value)}
                          className="w-full h-7 bg-white border border-slate-200 rounded-[3px] px-2 text-xs text-slate-800"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-500 font-semibold block uppercase">Status</label>
                        <input
                          type="text"
                          value={d.status}
                          onChange={(e) => handleDocChange(idx, "status", e.target.value)}
                          className="w-full h-7 bg-white border border-slate-200 rounded-[3px] px-1.5 text-xs text-slate-700 font-semibold uppercase"
                        />
                      </div>
                      <div className="col-span-1 text-center pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-[3px] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1 font-sans">
                    Catatan Transmittal (Remarks)
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-[4px] text-xs font-sans text-slate-800 focus:outline-none focus:border-[#163d78]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (No Print) */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5 shrink-0 no-print select-none">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[6px] border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-sans font-medium transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] bg-[#163d78] hover:bg-[#102d59] text-white text-xs font-sans font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Cetak PDF Resmi</span>
            </button>

            <button
              type="button"
              onClick={handleSaveTransmittal}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-sans font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Terbitkan Transmittal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

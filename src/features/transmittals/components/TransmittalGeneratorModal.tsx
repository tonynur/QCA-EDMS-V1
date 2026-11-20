"use client";

import React, { useState } from "react";
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
  const [transmittalNo, setTransmittalNo] = useState(`TR-0137-CVL-${new Date().getFullYear()}-001`);
  const [project, setProject] = useState("0137 - CSA & ME Bread Crumb");
  const [recipient, setRecipient] = useState("Chiyoda Corporation / Client QC");
  const [attn, setAttn] = useState("Site Quality Manager / Inspector Rep.");
  const [purpose, setPurpose] = useState("FOR APPROVAL");
  const [date, setDate] = useState(today);
  const [remarks, setRemarks] = useState("Mohon review dan lembar tanda tangan tanda terima dikembalikan kepada QA/QC PT Asuka.");

  const [docs, setDocs] = useState<AttachedDoc[]>([
    {
      docNo: "0137-ITP-CIV-001",
      rev: "0",
      title: "Inspection and Test Plan for Reinforced Concrete Works",
      qty: 1,
      status: "FOR REVIEW",
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
  ]);

  if (!isOpen) return null;

  const handleAddDoc = () => {
    setDocs((prev) => [
      ...prev,
      {
        docNo: `0137-DOC-00${prev.length + 1}`,
        rev: "0",
        title: "Dokumen Rekayasa Tambahan",
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
    window.print();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-[8px] w-full max-w-4xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#163d78] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#102d59] select-none shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-white/10 text-white flex items-center justify-center border border-white/20">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-sans tracking-wider text-slate-300 font-semibold">
                Distribusi Dokumen Mutu Resmi
              </div>
              <h3 className="text-base font-bold font-sans tracking-tight">
                Generator Lembar Transmittal PT Asuka
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 bg-slate-50/50">
          {/* Metadata Input Grid */}
          <div className="bg-white p-4 rounded-[6px] border border-slate-200 shadow-xs space-y-3">
            <div className="text-xs font-sans font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
              <span>Informasi Transmittal Surat Pengantar</span>
              <span className="text-[10px] font-mono text-slate-400">ISO 9001:2015 Clause 7.5</span>
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
                  Proyek *
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
                  Tujuan Pengiriman *
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full h-8 bg-slate-50 border border-slate-300 rounded-[4px] px-2 font-sans text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#163d78]"
                >
                  <option value="FOR APPROVAL">FOR APPROVAL (Persetujuan)</option>
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
                  Up. / Attention PIC
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

          {/* Attached Documents Table */}
          <div className="bg-white p-4 rounded-[6px] border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-slate-800">
                Daftar Lampiran Dokumen Mutu Terlampir ({docs.length} Berkas)
              </span>
              <button
                type="button"
                onClick={handleAddDoc}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#163d78] border border-blue-200 rounded-[4px] text-xs font-sans font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris Dokumen</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-[4px] overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-sans text-[10.5px]">
                  <tr>
                    <th className="py-2 px-2.5 text-center w-10">No</th>
                    <th className="py-2 px-2.5">Nomor Dokumen</th>
                    <th className="py-2 px-2 text-center w-14">Rev</th>
                    <th className="py-2 px-2.5">Judul Dokumen</th>
                    <th className="py-2 px-2 text-center w-14">Qty</th>
                    <th className="py-2 px-2.5">Status</th>
                    <th className="py-2 px-2 text-center w-10">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {docs.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-1.5 px-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-1.5 px-2.5">
                        <input
                          type="text"
                          value={d.docNo}
                          onChange={(e) => handleDocChange(idx, "docNo", e.target.value)}
                          className="w-full h-7 bg-white border border-slate-200 rounded-[3px] px-1.5 font-mono text-xs text-[#163d78] font-bold"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="text"
                          value={d.rev}
                          onChange={(e) => handleDocChange(idx, "rev", e.target.value)}
                          className="w-full h-7 bg-white border border-slate-200 rounded-[3px] text-center font-mono text-xs"
                        />
                      </td>
                      <td className="py-1.5 px-2.5">
                        <input
                          type="text"
                          value={d.title}
                          onChange={(e) => handleDocChange(idx, "title", e.target.value)}
                          className="w-full h-7 bg-white border border-slate-200 rounded-[3px] px-2 text-xs text-slate-800"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="number"
                          value={d.qty}
                          onChange={(e) => handleDocChange(idx, "qty", parseInt(e.target.value) || 1)}
                          className="w-full h-7 bg-white border border-slate-200 rounded-[3px] text-center font-mono text-xs tabular-nums"
                        />
                      </td>
                      <td className="py-1.5 px-2.5">
                        <input
                          type="text"
                          value={d.status}
                          onChange={(e) => handleDocChange(idx, "status", e.target.value)}
                          className="w-full h-7 bg-white border border-slate-200 rounded-[3px] px-1.5 text-xs text-slate-700 font-semibold uppercase"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-[3px] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[6px] border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-sans font-medium transition-colors cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-slate-800 hover:bg-slate-900 text-white text-xs font-sans font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Cetak PDF Resmi</span>
            </button>

            <button
              type="button"
              onClick={handleSaveTransmittal}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] bg-[#163d78] hover:bg-[#102d59] text-white text-xs font-sans font-semibold transition-colors cursor-pointer shadow-xs"
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

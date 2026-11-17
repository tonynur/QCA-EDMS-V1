"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Binary,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  settingsService,
  NumberingRule,
  ApprovalRule,
} from "../services/settings-service";

interface NumberingAndApprovalSettingsViewProps {
  projects?: { code: string; name: string }[];
  showToast: (text: string, type?: "success" | "error" | "info") => void;
}

export function NumberingAndApprovalSettingsView({
  projects = [],
  showToast,
}: NumberingAndApprovalSettingsViewProps) {
  const [subTab, setSubTab] = useState<"numbering" | "approval">("numbering");

  // Numbering State
  const [numRules, setNumRules] = useState<NumberingRule[]>([]);
  const [numProject, setNumProject] = useState("ALL");
  const [numFormat, setNumFormat] = useState("{PROJECT}-{TYPE}-{DISC}-{SEQ}");
  const [numPadding, setNumPadding] = useState(3);
  const [isNumLoading, setIsNumLoading] = useState(false);

  // Approval State
  const [appRules, setAppRules] = useState<ApprovalRule[]>([]);
  const [appProject, setAppProject] = useState("ALL");
  const [appDocType, setAppDocType] = useState("ITP");
  const [appEmail, setAppEmail] = useState("");
  const [appName, setAppName] = useState("");
  const [appRequired, setAppRequired] = useState(true);
  const [isAppLoading, setIsAppLoading] = useState(false);

  // Load Rules
  const loadRules = useCallback(async () => {
    setIsNumLoading(true);
    setIsAppLoading(true);
    try {
      const [nRules, aRules] = await Promise.all([
        settingsService.getNumberingRules(),
        settingsService.getApprovalRules(),
      ]);
      setNumRules(nRules);
      setAppRules(aRules);
    } catch {
      showToast("Gagal memuat aturan pengaturan", "error");
    } finally {
      setIsNumLoading(false);
      setIsAppLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        loadRules();
      }
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [loadRules]);

  // Live Numbering Preview
  const previewNumber = useMemo(() => {
    const pCode = numProject === "ALL" ? "CHI" : numProject.replace("AEI-", "");
    const seq = "1".padStart(numPadding, "0");
    const now = new Date();
    const yyyy = now.getFullYear().toString();
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    let res = numFormat;
    res = res.replace(/\{PROJECT\}/g, pCode);
    res = res.replace(/\{TYPE\}/g, "ITP");
    res = res.replace(/\{DISC\}/g, "CV");
    res = res.replace(/\{SEQ\}/g, seq);
    res = res.replace(/\{YYYY\}/g, yyyy);
    res = res.replace(/\{MM\}/g, mm);
    return res;
  }, [numFormat, numProject, numPadding]);

  // Handle Save Numbering Rule
  const handleSaveNumbering = async (e: React.FormEvent) => {
    e.preventDefault();
    const prj = projects.find((p) => p.code === numProject);
    const pName = numProject === "ALL" ? "Semua Proyek" : prj?.name || numProject;

    const res = await settingsService.saveNumberingRule({
      projectCode: numProject,
      projectName: pName,
      format: numFormat,
      seqPadding: numPadding,
    });

    if (res.success) {
      showToast(res.message, "success");
      loadRules();
    } else {
      showToast(res.message, "error");
    }
  };

  // Handle Delete Numbering Rule
  const handleDeleteNumbering = async (projectCode: string) => {
    if (!confirm(`Hapus format penomoran untuk proyek ${projectCode}?`)) return;
    const res = await settingsService.deleteNumberingRule(projectCode);
    showToast(res.message, res.success ? "success" : "error");
    loadRules();
  };

  // Handle Save Approval Rule
  const handleSaveApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !appEmail) {
      showToast("Nama dan email approver wajib diisi", "error");
      return;
    }

    const prj = projects.find((p) => p.code === appProject);
    const pName = appProject === "ALL" ? "Semua Proyek" : prj?.name || appProject;

    const res = await settingsService.saveApprovalRule({
      projectCode: appProject,
      projectName: pName,
      documentType: appDocType,
      approverEmail: appEmail,
      approverName: appName,
      requireApproval: appRequired,
    });

    if (res.success) {
      showToast(res.message, "success");
      setAppEmail("");
      setAppName("");
      loadRules();
    } else {
      showToast(res.message, "error");
    }
  };

  // Handle Delete Approval Rule
  const handleDeleteApproval = async (projectCode: string, docType: string) => {
    if (!confirm(`Hapus aturan approval ${docType} untuk ${projectCode}?`)) return;
    const res = await settingsService.deleteApprovalRule(projectCode, docType);
    showToast(res.message, res.success ? "success" : "error");
    loadRules();
  };

  return (
    <div className="space-y-4">
      {/* Header & Sub Tabs */}
      <div className="bg-white p-4 sm:p-5 rounded-[8px] border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Pengaturan Penomoran & Approval Mutu
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Konfigurasi format kode dokumen otomatis dan matriks verifikator approval QA/QC
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab("numbering")}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              subTab === "numbering"
                ? "bg-[#163d78] text-white shadow-sm"
                : "bg-slate-50 text-slate-700 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>Format Penomoran</span>
          </button>

          <button
            onClick={() => setSubTab("approval")}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              subTab === "approval"
                ? "bg-[#163d78] text-white shadow-sm"
                : "bg-slate-50 text-slate-700 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Matriks Approval</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: NUMBERING RULES */}
      {subTab === "numbering" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Add / Edit Form */}
          <div className="bg-white p-5 rounded-[8px] border border-slate-200/90 shadow-sm">
            <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-800 mb-3">
              Atur Format Penomoran
            </h3>
            <form onSubmit={handleSaveNumbering} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono text-slate-700 mb-1">
                  Proyek Target
                </label>
                <select
                  value={numProject}
                  onChange={(e) => setNumProject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-[#163d78] cursor-pointer"
                >
                  <option value="ALL">ALL — Semua Proyek (Default Sistem)</option>
                  {projects.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-700 mb-1">
                  Pola Format Kode Dokumen
                </label>
                <input
                  type="text"
                  value={numFormat}
                  onChange={(e) => setNumFormat(e.target.value)}
                  placeholder="{PROJECT}-{TYPE}-{DISC}-{SEQ}"
                  className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-[#163d78]"
                />
                <div className="mt-1.5 p-2 rounded-[4px] bg-slate-50 border border-slate-200 text-[10.5px] font-mono text-slate-600 space-y-1">
                  <div className="flex items-center gap-1 text-[#163d78] font-semibold">
                    <HelpCircle className="w-3 h-3" />
                    <span>Tag Placeholder yang Tersedia:</span>
                  </div>
                  <div>
                    <code className="text-[#163d78] font-bold">{`{PROJECT}`}</code>: Kode proyek • <code className="text-[#163d78] font-bold">{`{TYPE}`}</code>: Tipe (ITP, MS, MTR)
                  </div>
                  <div>
                    <code className="text-[#163d78] font-bold">{`{DISC}`}</code>: Disiplin (CV, ME, EL) • <code className="text-[#163d78] font-bold">{`{SEQ}`}</code>: Nomor urut
                  </div>
                  <div>
                    <code className="text-[#163d78] font-bold">{`{YYYY}`}</code>: Tahun • <code className="text-[#163d78] font-bold">{`{MM}`}</code>: Bulan
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-700 mb-1">
                  Digit Padding Nomor Urut (Sequence)
                </label>
                <select
                  value={numPadding}
                  onChange={(e) => setNumPadding(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-[#163d78] cursor-pointer"
                >
                  <option value={2}>2 Digit (Contoh: 01, 02...)</option>
                  <option value={3}>3 Digit (Contoh: 001, 002... - Standar)</option>
                  <option value={4}>4 Digit (Contoh: 0001, 0002...)</option>
                </select>
              </div>

              {/* Dynamic Live Preview */}
              <div className="p-3 rounded-[6px] bg-blue-50 border border-blue-200 space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#163d78] font-bold">
                  Pratinjau Hasil Penomoran:
                </span>
                <div className="font-mono text-sm font-bold text-[#163d78] tracking-wider break-all">
                  {previewNumber}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 rounded-[6px] bg-[#163d78] hover:bg-[#1a4a91] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan Aturan Format</span>
              </button>
            </form>
          </div>

          {/* List of Registered Numbering Rules */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-800">
                  Daftar Aturan Penomoran Aktif
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200 font-mono text-slate-700 uppercase text-[10.5px]">
                      <th className="py-2.5 px-3">Proyek</th>
                      <th className="py-2.5 px-3">Format Pola</th>
                      <th className="py-2.5 px-3 text-center">Padding</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-mono bg-white">
                    {isNumLoading ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Memuat aturan penomoran...
                        </td>
                      </tr>
                    ) : numRules.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">
                          Belum ada format kustom terdaftar. Menggunakan default sistem.
                        </td>
                      </tr>
                    ) : (
                      numRules.map((rule) => (
                        <tr key={rule.projectCode} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{rule.projectCode}</div>
                            <div className="text-[11px] text-slate-500">{rule.projectName}</div>
                          </td>
                          <td className="py-3 px-3 text-[#163d78] font-bold">{rule.format}</td>
                          <td className="py-3 px-3 text-center text-slate-700">{rule.seqPadding} digit</td>
                          <td className="py-3 px-3 text-right">
                            {rule.projectCode !== "ALL" && (
                              <button
                                onClick={() => handleDeleteNumbering(rule.projectCode)}
                                className="p-1.5 rounded-[4px] hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Hapus Format"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: APPROVAL MATRIX */}
      {subTab === "approval" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Add / Edit Form */}
          <div className="bg-white p-5 rounded-[8px] border border-slate-200/90 shadow-sm">
            <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-800 mb-3">
              Tambah Jalur Verifikator
            </h3>
            <form onSubmit={handleSaveApproval} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono text-slate-700 mb-1">
                  Proyek
                </label>
                <select
                  value={appProject}
                  onChange={(e) => setAppProject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-[#163d78] cursor-pointer"
                >
                  <option value="ALL">ALL — Semua Proyek</option>
                  {projects.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-700 mb-1">
                  Tipe Dokumen Mutu
                </label>
                <select
                  value={appDocType}
                  onChange={(e) => setAppDocType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-[#163d78] cursor-pointer"
                >
                  <option value="ITP">ITP — Inspection & Test Plan</option>
                  <option value="MS">MS — Method Statement</option>
                  <option value="MTR">MTR — Material Approval / Test</option>
                  <option value="NCR">NCR — Non-Conformance Report</option>
                  <option value="CAL">CAL — Sertifikat Kalibrasi</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-700 mb-1">
                  Nama Personel Approver
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Bambang Soedjarwo"
                  className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-[#163d78]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-700 mb-1">
                  Email Akun Approver
                </label>
                <input
                  type="email"
                  value={appEmail}
                  onChange={(e) => setAppEmail(e.target.value)}
                  placeholder="bambang.qc@asuka.co.id"
                  className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-[#163d78]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reqApp"
                  checked={appRequired}
                  onChange={(e) => setAppRequired(e.target.checked)}
                  className="rounded border-slate-300 text-[#163d78]"
                />
                <label htmlFor="reqApp" className="text-xs font-mono text-slate-700 cursor-pointer">
                  Wajib Persetujuan Manual (Review Gate)
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 rounded-[6px] bg-[#163d78] hover:bg-[#1a4a91] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan Matriks Approval</span>
              </button>
            </form>
          </div>

          {/* List of Registered Approval Rules */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-800">
                  Matriks Approval Aktif per Dokumen
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200 font-mono text-slate-700 uppercase text-[10.5px]">
                      <th className="py-2.5 px-3">Proyek & Dokumen</th>
                      <th className="py-2.5 px-3">Approver Utama</th>
                      <th className="py-2.5 px-3 text-center">Status Alur</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-mono bg-white">
                    {isAppLoading ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Memuat matriks alur approval...
                        </td>
                      </tr>
                    ) : appRules.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">
                          Belum ada jalur approval terdaftar.
                        </td>
                      </tr>
                    ) : (
                      appRules.map((rule, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{rule.projectCode}</span>
                              <Badge variant="neutral">{rule.documentType}</Badge>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{rule.projectName}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{rule.approverName}</div>
                            <div className="text-[11px] text-slate-500">{rule.approverEmail}</div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {rule.requireApproval ? (
                              <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-[3px] font-semibold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Approval Wajib</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-[3px]">
                                <AlertCircle className="w-3 h-3 text-slate-400" />
                                <span>Auto-Pass</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleDeleteApproval(rule.projectCode, rule.documentType)}
                              className="p-1.5 rounded-[4px] hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Hapus Aturan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

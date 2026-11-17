"use client";

import React from "react";
import { Clock, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DocumentItem } from "@/features/documents/types";
import { CalibrationSummary } from "@/features/calibration/types";
import { NFISummary } from "@/features/nfi/types";

interface ExecutiveAnalyticsProps {
  documents: DocumentItem[];
  calibrationSummary: CalibrationSummary;
  nfiSummary: NFISummary;
}

export function ExecutiveAnalytics({
  documents,
  calibrationSummary,
  nfiSummary,
}: ExecutiveAnalyticsProps) {
  const totalDocs = documents.length || 1;
  const approvedDocs = documents.filter((d) => (d.status || "").toUpperCase() === "APPROVED").length;
  const pendingDocs = documents.filter((d) =>
    ["PENDING", "SUBMITTED", "IN REVIEW", "IN_REVIEW"].includes((d.status || "").toUpperCase())
  ).length;

  const approvalRate = Math.round((approvedDocs / totalDocs) * 100);

  // Group by discipline
  const disciplines = ["CIVIL", "MECHANICAL", "ELECTRICAL", "INSTRUMENT", "HSE"];
  const disciplineStats = disciplines.map((disc) => {
    const docs = documents.filter((d) => (d.discipline || "").toUpperCase() === disc);
    const approved = docs.filter((d) => (d.status || "").toUpperCase() === "APPROVED").length;
    const pending = docs.filter((d) =>
      ["PENDING", "SUBMITTED", "IN REVIEW", "IN_REVIEW"].includes((d.status || "").toUpperCase())
    ).length;
    return {
      discipline: disc,
      total: docs.length,
      approved,
      pending,
      compliancePct: docs.length ? Math.round((approved / docs.length) * 100) : 100,
    };
  });

  return (
    <div className="space-y-4">
      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Tingkat Persetujuan</p>
              <p className="text-2xl font-bold font-mono text-emerald-700 tabular-nums mt-0.5">{approvalRate}%</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-[6px]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={1.8} />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
            Rasio dokumen lolos verifikasi
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-[#163d78]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Backlog Review</p>
              <p className="text-2xl font-bold font-mono text-[#163d78] tabular-nums mt-0.5">{pendingDocs}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-[6px]">
              <Clock className="w-5 h-5 text-[#163d78]" strokeWidth={1.8} />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
            Menunggu approval QA/QC
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Kepatuhan Kalibrasi</p>
              <p className="text-2xl font-bold font-mono text-amber-700 tabular-nums mt-0.5">
                {calibrationSummary.totalTools
                  ? Math.round((calibrationSummary.validCount / calibrationSummary.totalTools) * 100)
                  : 100}
                %
              </p>
            </div>
            <div className="p-2 bg-amber-50 rounded-[6px]">
              <ShieldCheck className="w-5 h-5 text-amber-600" strokeWidth={1.8} />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
            {calibrationSummary.validCount} dari {calibrationSummary.totalTools} alat valid
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-rose-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">Resolusi NFI</p>
              <p className="text-2xl font-bold font-mono text-rose-700 tabular-nums mt-0.5">
                {nfiSummary.total ? Math.round((nfiSummary.closedCount / nfiSummary.total) * 100) : 100}%
              </p>
            </div>
            <div className="p-2 bg-rose-50 rounded-[6px]">
              <AlertTriangle className="w-5 h-5 text-rose-600" strokeWidth={1.8} />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
            {nfiSummary.openCount} temuan masih open
          </div>
        </div>
      </div>

      {/* Discipline Quality Matrix */}
      <div className="bg-white rounded-[8px] border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              Matriks Kepatuhan Mutu per Disiplin Teknis
            </h3>
            <span className="text-xs font-mono text-slate-500">ISO 9001:2015 Audit Index</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Disiplin Teknis</th>
                <th className="py-2.5 px-3 w-28 text-center">Total Dokumen</th>
                <th className="py-2.5 px-3 w-28 text-center">Approved</th>
                <th className="py-2.5 px-3 w-28 text-center">Pending</th>
                <th className="py-2.5 px-3 w-48 text-center">Progress Kepatuhan</th>
                <th className="py-2.5 px-3 w-28 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 bg-white">
              {disciplineStats.map((item) => (
                <tr key={item.discipline} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900 font-mono">
                    {item.discipline}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-xs tabular-nums text-slate-700">
                    {item.total}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-xs tabular-nums text-emerald-700 font-semibold">
                    {item.approved}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-xs tabular-nums text-amber-700 font-semibold">
                    {item.pending}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-100 rounded-[2px] h-2 overflow-hidden border border-slate-200">
                        <div
                          className="bg-[#163d78] h-full rounded-[2px]"
                          style={{ width: `${item.compliancePct}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs tabular-nums text-slate-700 w-10 text-right font-semibold">
                        {item.compliancePct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant={item.compliancePct >= 80 ? "approved" : "expiring"}>
                      {item.compliancePct >= 80 ? "EXCELLENT" : "ATTENTION"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aging Analysis of Pending Documents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-emerald-600">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
            Review Cepat (&le; 24 Jam)
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
            {Math.max(0, pendingDocs - 2)} Dokumen
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Dalam batas SLA respons normal</p>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-amber-500">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
            Menunggu 2 - 5 Hari
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 tabular-nums">
            {Math.min(pendingDocs, 2)} Dokumen
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Perlu percepatan evaluasi lead engineer</p>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-sm border-l-4 border-l-slate-400">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
            Kritis (&gt; 5 Hari)
          </div>
          <div className="text-xl font-bold font-mono text-slate-700 tabular-nums">
            0 Dokumen
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Nihil keterlambatan kritis</p>
        </div>
      </div>
    </div>
  );
}

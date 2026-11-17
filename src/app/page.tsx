"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar, NavTab } from "@/components/layout/Sidebar";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { useAuth } from "@/features/auth/hooks/useAuth";

// Documents
import { DocumentListTable } from "@/features/documents/components/DocumentListTable";
import { DocumentUploadForm } from "@/features/documents/components/DocumentUploadForm";
import { DocumentDetailModal } from "@/features/documents/components/DocumentDetailModal";
import { documentService } from "@/features/documents/services/document-service";
import { DocumentItem } from "@/features/documents/types";

// Calibration
import { CalibrationTable } from "@/features/calibration/components/CalibrationTable";
import { CalibrationFormModal } from "@/features/calibration/components/CalibrationFormModal";
import { calibrationService } from "@/features/calibration/services/calibration-service";
import { CalibrationTool, CalibrationSummary, CalibrationFormData } from "@/features/calibration/types";

// NCR (Non Conformance Record)
import { NCRTable, NCRFormModal, NCRDetailModal, ncrService, NCREntry, NCRSummary } from "@/features/ncr";

// NFI Log
import { NFILogTable } from "@/features/nfi/components/NFILogTable";
import { NFIFormModal } from "@/features/nfi/components/NFIFormModal";
import { nfiService } from "@/features/nfi/services/nfi-service";
import { NFIEntry, NFISummary, NFIFormData } from "@/features/nfi/types";

// Site Report
import { SiteReportTable } from "@/features/site-report/components/SiteReportTable";
import { SiteReportFormModal } from "@/features/site-report/components/SiteReportFormModal";
import { siteReportService } from "@/features/site-report/services/site-report-service";
import { SiteReportEntry, SiteReportFormData } from "@/features/site-report/types";

// Transmittals
import { TransmittalTable } from "@/features/transmittals/components/TransmittalTable";
import { transmittalService } from "@/features/transmittals/services/transmittal-service";
import { TransmittalItem } from "@/features/transmittals/types";

// Projects & Analytics
import { ProjectManagement } from "@/features/projects/components/ProjectManagement";
import { projectService } from "@/features/projects/services/project-service";
import { ProjectItem } from "@/features/projects/types";
import { ExecutiveAnalytics } from "@/features/analytics/components/ExecutiveAnalytics";
import { DashboardOverview } from "@/features/dashboard/components/DashboardOverview";
import { CommandCenterView } from "@/features/command-center";

// Quality Operations (Approval, User Roles, Archive, AI & QR)
import { ApprovalQueueView } from "@/features/approval/components/ApprovalQueueView";
import { UserManagementView } from "@/features/users/components/UserManagementView";
import { ArchiveRecycleBinView } from "@/features/archive/components/ArchiveRecycleBinView";
import { AIAssistantModal } from "@/features/ai-assistant/components/AIAssistantModal";
import { QRScannerModal } from "@/features/qr-scanner/components/QRScannerModal";

// Advanced Features (Document Previewer, Revision History, Batch Import, Numbering & Approval Settings)
import { DocumentPreviewModal } from "@/features/documents/components/DocumentPreviewModal";
import { RevisionHistoryModal } from "@/features/documents/components/RevisionHistoryModal";
import { NFIImportModal } from "@/features/nfi/components/NFIImportModal";
import { NumberingAndApprovalSettingsView } from "@/features/settings/components/NumberingAndApprovalSettingsView";

// UI Components
import { Card, CardTitle } from "@/components/ui/Card";
import { Database, Server } from "lucide-react";

export default function HomePage() {
  const { user, isAuthenticated, isLoading: authLoading, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("documents");

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = useCallback((text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Documents State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isDocLoading, setIsDocLoading] = useState(false);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<DocumentItem | null>(null);

  // Calibration State
  const [calTools, setCalTools] = useState<CalibrationTool[]>([]);
  const [calSummary, setCalSummary] = useState<CalibrationSummary>({
    totalTools: 0,
    validCount: 0,
    expiringCount: 0,
    expiredCount: 0,
  });
  const [isCalLoading, setIsCalLoading] = useState(false);
  const [isCalModalOpen, setIsCalModalOpen] = useState(false);

  // NCR State
  const [ncrEntries, setNcrEntries] = useState<NCREntry[]>([]);
  const [ncrSummary, setNcrSummary] = useState<NCRSummary>({ total: 0, closed: 0, open: 0, overdue: 0 });
  const [isNcrLoading, setIsNcrLoading] = useState(false);
  const [isNcrModalOpen, setIsNcrModalOpen] = useState(false);
  const [selectedNcrForDetail, setSelectedNcrForDetail] = useState<NCREntry | null>(null);

  // NFI State
  const [nfiEntries, setNfiEntries] = useState<NFIEntry[]>([]);
  const [nfiSummary, setNfiSummary] = useState<NFISummary>({
    total: 0,
    openCount: 0,
    closedCount: 0,
    failCount: 0,
  });
  const [isNfiLoading, setIsNfiLoading] = useState(false);
  const [isNfiModalOpen, setIsNfiModalOpen] = useState(false);

  // Site Report State
  const [siteReports, setSiteReports] = useState<SiteReportEntry[]>([]);
  const [isSiteReportLoading, setIsSiteReportLoading] = useState(false);
  const [isSiteReportModalOpen, setIsSiteReportModalOpen] = useState(false);

  // Transmittals State
  const [transmittals, setTransmittals] = useState<TransmittalItem[]>([]);
  const [isTransmittalLoading, setIsTransmittalLoading] = useState(false);

  // Projects State
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isProjectLoading, setIsProjectLoading] = useState(false);

  // Global Project Filter & Modals
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [historyDoc, setHistoryDoc] = useState<DocumentItem | null>(null);
  const [isNfiImportOpen, setIsNfiImportOpen] = useState(false);

  // Filtered documents by project
  const filteredDocuments = selectedProject
    ? documents.filter((doc) => {
      const pCode = (doc.projectCode || "").toUpperCase();
      const pName = (doc.projectName || "").toUpperCase();
      const target = selectedProject.toUpperCase();
      return (
        pCode === target ||
        pName.includes(target) ||
        (doc.documentCode && doc.documentCode.toUpperCase().includes(target))
      );
    })
    : documents;

  // Pending approval counter for badge
  const pendingApprovalCount = documents.filter((d) =>
    ["PENDING", "SUBMITTED", "IN REVIEW", "IN_REVIEW"].includes(
      (d.status || "").toUpperCase()
    )
  ).length;

  // Loaders
  const loadDocuments = useCallback(async () => {
    setIsDocLoading(true);
    try {
      const docs = await documentService.getDocuments();
      setDocuments(docs);
    } catch {
      showToast("Gagal memuat dokumen", "error");
    } finally {
      setIsDocLoading(false);
    }
  }, [showToast]);

  const loadCalibration = useCallback(async () => {
    setIsCalLoading(true);
    try {
      const tools = await calibrationService.getTools();
      setCalTools(tools);
      setCalSummary(calibrationService.calculateSummary(tools));
    } catch {
      showToast("Gagal memuat data kalibrasi", "error");
    } finally {
      setIsCalLoading(false);
    }
  }, [showToast]);

  const loadNcr = useCallback(async () => {
    setIsNcrLoading(true);
    try {
      const [data, summary] = await Promise.all([
        ncrService.getNcrData(),
        ncrService.getNcrSummary(),
      ]);
      setNcrEntries(data);
      setNcrSummary(summary);
    } catch {
      showToast("Gagal memuat register NCR", "error");
    } finally {
      setIsNcrLoading(false);
    }
  }, [showToast]);

  const loadNfi = useCallback(async () => {
    setIsNfiLoading(true);
    try {
      const entries = await nfiService.getList();
      setNfiEntries(entries);
      setNfiSummary(nfiService.calculateSummary(entries));
    } catch {
      showToast("Gagal memuat NFI Log", "error");
    } finally {
      setIsNfiLoading(false);
    }
  }, [showToast]);

  const loadSiteReports = useCallback(async () => {
    setIsSiteReportLoading(true);
    try {
      const reps = await siteReportService.getReports();
      setSiteReports(reps);
    } catch {
      showToast("Gagal memuat site report", "error");
    } finally {
      setIsSiteReportLoading(false);
    }
  }, [showToast]);

  const loadTransmittals = useCallback(async () => {
    setIsTransmittalLoading(true);
    try {
      const trs = await transmittalService.getTransmittals();
      setTransmittals(trs);
    } catch {
      showToast("Gagal memuat transmittal", "error");
    } finally {
      setIsTransmittalLoading(false);
    }
  }, [showToast]);

  const loadProjects = useCallback(async () => {
    setIsProjectLoading(true);
    try {
      const prjs = await projectService.getProjects();
      setProjects(prjs);
    } catch {
      showToast("Gagal memuat master proyek", "error");
    } finally {
      setIsProjectLoading(false);
    }
  }, [showToast]);

  // Initial Load on Auth using microtask to avoid cascading renders
  useEffect(() => {
    let active = true;
    if (!isAuthenticated) return;

    const timer = setTimeout(async () => {
      if (!active) return;

      setIsDocLoading(true);
      setIsCalLoading(true);
      setIsNcrLoading(true);
      setIsNfiLoading(true);
      setIsSiteReportLoading(true);
      setIsTransmittalLoading(true);
      setIsProjectLoading(true);

      const [docs, tools, ncrs, nfi, reps, trs, prjs] = await Promise.allSettled([
        documentService.getDocuments(),
        calibrationService.getTools(),
        ncrService.getNcrData(),
        nfiService.getList(),
        siteReportService.getReports(),
        transmittalService.getTransmittals(),
        projectService.getProjects(),
      ]);

      if (!active) return;

      if (docs.status === "fulfilled") setDocuments(docs.value);
      setIsDocLoading(false);

      if (tools.status === "fulfilled") {
        setCalTools(tools.value);
        setCalSummary(calibrationService.calculateSummary(tools.value));
      }
      setIsCalLoading(false);

      if (ncrs.status === "fulfilled") {
        setNcrEntries(ncrs.value);
      }
      setIsNcrLoading(false);

      if (nfi.status === "fulfilled") {
        setNfiEntries(nfi.value);
        setNfiSummary(nfiService.calculateSummary(nfi.value));
      }
      setIsNfiLoading(false);

      if (reps.status === "fulfilled") setSiteReports(reps.value);
      setIsSiteReportLoading(false);

      if (trs.status === "fulfilled") setTransmittals(trs.value);
      setIsTransmittalLoading(false);

      if (prjs.status === "fulfilled") setProjects(prjs.value);
      setIsProjectLoading(false);
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isAuthenticated]);

  // Handlers
  const handleApproveDoc = async (docId: string) => {
    try {
      const res = await documentService.approveDocument(docId);
      showToast(res.message, res.success ? "success" : "error");
      await loadDocuments();
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  };

  const handleRejectDoc = async (docId: string) => {
    const reason = prompt("Masukkan alasan penolakan dokumen:");
    if (!reason) return;
    try {
      const res = await documentService.rejectDocument(docId, reason);
      showToast(res.message, res.success ? "success" : "error");
      await loadDocuments();
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  };

  const handleSaveCalibration = async (data: CalibrationFormData) => {
    const res = await calibrationService.submitCalibration(data);
    if (res.success) {
      showToast(res.message, "success");
      await loadCalibration();
      return true;
    } else {
      showToast(res.message, "error");
      return false;
    }
  };

  const handleSaveNfi = async (data: NFIFormData) => {
    const res = await nfiService.saveEntry(data);
    if (res.success) {
      showToast(res.message, "success");
      await loadNfi();
      return true;
    } else {
      showToast(res.message, "error");
      return false;
    }
  };

  const handleSaveSiteReport = async (data: SiteReportFormData) => {
    const res = await siteReportService.submitReport(data);
    if (res.success) {
      showToast(res.message, "success");
      await loadSiteReports();
      return true;
    } else {
      showToast(res.message, "error");
      return false;
    }
  };

  const handleAddProject = async (p: { code: string; name: string; location: string }) => {
    const res = await projectService.addProject(p);
    if (res.success) {
      showToast(res.message, "success");
      await loadProjects();
      return true;
    } else {
      showToast(res.message, "error");
      return false;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center text-slate-600 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#163d78] border-t-[#ed2e35] rounded-full animate-spin mb-4" />
        <span className="font-semibold tracking-wider text-slate-700">MEMUAT SUBSISTEM QCA EDMS...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d2347] flex items-center justify-center p-4">
        <LoginForm onSuccess={refreshUser} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col text-slate-900 font-sans antialiased">
      <Navbar
        user={user}
        onLogout={logout}
        selectedProject={selectedProject}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenAIChat={() => setIsAIChatOpen(true)}
      />

      {/* Floating Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-[4px] border text-xs font-mono shadow-2xl transition-all ${
            toastMessage.type === "success"
              ? "bg-[#052e16] text-[#4ade80] border-[#166534]"
              : toastMessage.type === "info"
                ? "bg-[#0b1f3a] text-[#60a5fa] border-[#1e40af]"
                : "bg-[#450a0a] text-[#f87171] border-[#991b1b]"
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedProject={selectedProject}
          onProjectChange={(projectCode) => {
            setSelectedProject(projectCode);
            if (projectCode) {
              showToast(`Fokus proyek aktif: ${projectCode}`, "info");
            } else {
              showToast("Menampilkan seluruh proyek", "info");
            }
          }}
          projects={projects.map((p) => ({ code: p.code, name: p.name }))}
          pendingApprovalCount={pendingApprovalCount}
          onOpenAIChat={() => setIsAIChatOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 bg-[#f1f5f9]">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h1 className="text-lg font-bold tracking-wide text-slate-900 uppercase">
                  Overview Dashboard Mutu QA/QC
                </h1>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Monitoring eksekutif dokumen kontrol, kepatuhan kalibrasi & temuan lapangan
                </p>
              </div>
              <DashboardOverview
                documents={filteredDocuments}
                calibrationSummary={calSummary}
                onNavigateToTab={setActiveTab}
              />
            </div>
          )}

          {/* TAB 1B: QA/QC COMMAND CENTER */}
          {activeTab === "command" && (
            <CommandCenterView
              onSelectProject={(projectCode) => {
                setSelectedProject(projectCode);
                setActiveTab("documents");
                showToast(`Menampilkan dokumen untuk proyek ${projectCode}`, "info");
              }}
              showToast={showToast}
            />
          )}

          {/* TAB 2: DAFTAR DOKUMEN (CMS LAYOUT) */}
          {activeTab === "documents" && (
            <DocumentListTable
              documents={filteredDocuments}
              isLoading={isDocLoading}
              onRefresh={loadDocuments}
              onAddNew={() => setActiveTab("upload")}
              onViewDetail={(doc) => setSelectedDocForDetail(doc)}
              onPreviewDoc={(doc) => setPreviewDoc(doc)}
              onHistoryDoc={(doc) => setHistoryDoc(doc)}
              onApprove={handleApproveDoc}
              onReject={handleRejectDoc}
              onOpenQRScanner={() => setIsQRScannerOpen(true)}
            />
          )}

          {/* TAB 3: UNGGAH DOKUMEN */}
          {activeTab === "upload" && (
            <div className="space-y-6">
              <DocumentUploadForm
                onSuccess={() => {
                  showToast("Dokumen berhasil diunggah ke master register.");
                  loadDocuments();
                  setActiveTab("documents");
                }}
                onCancel={() => setActiveTab("documents")}
              />
            </div>
          )}

          {/* TAB 4: TRANSMITTALS */}
          {activeTab === "transmittals" && (
            <TransmittalTable
              transmittals={transmittals}
              isLoading={isTransmittalLoading}
              onRefresh={loadTransmittals}
            />
          )}

          {/* TAB 4B: APPROVAL & TUGAS SAYA */}
          {activeTab === "approval" && (
            <ApprovalQueueView
              documents={documents}
              onApprove={async (docId, comments) => {
                try {
                  const res = await documentService.approveDocument(docId, comments);
                  showToast(res.message, res.success ? "success" : "error");
                  await loadDocuments();
                } catch (e) {
                  showToast((e as Error).message, "error");
                }
              }}
              onReject={async (docId, comments) => {
                try {
                  const res = await documentService.rejectDocument(docId, comments);
                  showToast(res.message, res.success ? "success" : "error");
                  await loadDocuments();
                } catch (e) {
                  showToast((e as Error).message, "error");
                }
              }}
              onRefresh={loadDocuments}
              isLoading={isDocLoading}
            />
          )}

          {/* TAB 5: KALIBRASI ALAT */}
          {activeTab === "calibration" && (
            <CalibrationTable
              tools={calTools}
              summary={calSummary}
              isLoading={isCalLoading}
              onRefresh={loadCalibration}
              onAddNew={() => setIsCalModalOpen(true)}
            />
          )}

          {/* TAB 5B: MONITORING NCR */}
          {activeTab === "ncr" && (
            <NCRTable
              entries={ncrEntries}
              summary={ncrSummary}
              isLoading={isNcrLoading}
              onRefresh={loadNcr}
              onOpenCreateModal={() => setIsNcrModalOpen(true)}
              onViewDetail={(ncr) => setSelectedNcrForDetail(ncr)}
              onDeleteNcr={async (ncrNo) => {
                const res = await ncrService.deleteNcr(ncrNo);
                showToast(res.message, res.success ? "success" : "error");
                loadNcr();
              }}
            />
          )}

          {/* TAB 6: NFI LOG */}
          {activeTab === "nfilog" && (
            <NFILogTable
              entries={nfiEntries}
              summary={nfiSummary}
              isLoading={isNfiLoading}
              onRefresh={loadNfi}
              onAddNew={() => setIsNfiModalOpen(true)}
              onOpenImport={() => setIsNfiImportOpen(true)}
            />
          )}

          {/* TAB 7: SITE REPORT */}
          {activeTab === "sitereport" && (
            <SiteReportTable
              reports={siteReports}
              isLoading={isSiteReportLoading}
              onRefresh={loadSiteReports}
              onAddNew={() => setIsSiteReportModalOpen(true)}
            />
          )}

          {/* TAB 8: EXECUTIVE ANALYTICS */}
          {activeTab === "analytics" && (
            <ExecutiveAnalytics
              documents={documents}
              calibrationSummary={calSummary}
              nfiSummary={nfiSummary}
            />
          )}

          {/* TAB 9: KELOLA PROYEK */}
          {activeTab === "projects" && (
            <ProjectManagement
              projects={projects}
              isLoading={isProjectLoading}
              onRefresh={loadProjects}
              onAddProject={handleAddProject}
            />
          )}

          {/* TAB 9B: MANAJEMEN PENGGUNA */}
          {activeTab === "users" && (
            <UserManagementView />
          )}

          {/* TAB 9C: ARSIP MUTU & RECYCLE BIN */}
          {activeTab === "archive" && (
            <ArchiveRecycleBinView
              documents={documents}
              onRestore={(docId) => {
                showToast(`Dokumen ${docId} berhasil dipulihkan.`, "success");
              }}
            />
          )}

          {/* TAB 10: PENGATURAN SISTEM */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <NumberingAndApprovalSettingsView
                projects={projects.map((p) => ({ code: p.code, name: p.name }))}
                showToast={showToast}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <Card className="p-5 border-slate-200 bg-white">
                  <div className="flex items-center gap-3 mb-3">
                    <Server className="w-5 h-5 text-[#163d78]" />
                    <CardTitle className="text-slate-900">Arsitektur Frontend Baru</CardTitle>
                  </div>
                  <div className="space-y-2 text-xs font-mono text-slate-600">
                    <div>Framework: <span className="text-[#163d78] font-bold">Next.js 16.4.6 (App Router)</span></div>
                    <div>Language: <span className="text-[#163d78] font-bold">TypeScript 5 (Strict Mode)</span></div>
                    <div>Styling: <span className="text-[#163d78] font-bold">Tailwind CSS v4 (Anti-AI Industrial)</span></div>
                    <div>Pattern: <span className="text-[#163d78] font-bold">Feature-Based Architecture</span></div>
                    <div>Ukuran Rata-rata File: <span className="text-slate-800">100 - 350 LOC per modul</span></div>
                  </div>
                </Card>

                <Card className="p-5 border-slate-200 bg-white">
                  <div className="flex items-center gap-3 mb-3">
                    <Database className="w-5 h-5 text-emerald-700" />
                    <CardTitle className="text-slate-900">Integrasi Google Apps Script</CardTitle>
                  </div>
                  <div className="space-y-2 text-xs font-mono text-slate-600">
                    <div>Backend Engine: <span className="text-emerald-700 font-bold">kode.gs (Vercel Serverless BFF Proxy)</span></div>
                    <div>Database: <span className="text-emerald-700 font-bold">Google Sheets Multi-Sheet Master</span></div>
                    <div>Storage Berkas: <span className="text-emerald-700 font-bold">Google Drive (Root Folder ID)</span></div>
                    <div>Konektivitas Proxy: <span className="text-emerald-700 font-bold">/api/gas (Bypass CORS 100%)</span></div>
                    <div>Status Keamanan: <span className="text-emerald-700 font-bold">CSRF Protection + Session Token</span></div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <DocumentDetailModal
        document={selectedDocForDetail}
        isOpen={!!selectedDocForDetail}
        onClose={() => setSelectedDocForDetail(null)}
        onApprove={handleApproveDoc}
        onReject={handleRejectDoc}
      />

      <CalibrationFormModal
        isOpen={isCalModalOpen}
        onClose={() => setIsCalModalOpen(false)}
        onSubmit={handleSaveCalibration}
      />

      {/* NCR Modals */}
      <NCRFormModal
        isOpen={isNcrModalOpen}
        onClose={() => setIsNcrModalOpen(false)}
        onSuccess={(msg) => {
          showToast(msg, "success");
          loadNcr();
        }}
      />

      <NCRDetailModal
        ncr={selectedNcrForDetail}
        onClose={() => setSelectedNcrForDetail(null)}
      />

      <NFIFormModal
        isOpen={isNfiModalOpen}
        onClose={() => setIsNfiModalOpen(false)}
        onSubmit={handleSaveNfi}
      />

      <SiteReportFormModal
        isOpen={isSiteReportModalOpen}
        onClose={() => setIsSiteReportModalOpen(false)}
        onSubmit={handleSaveSiteReport}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        activeProjectCode={selectedProject}
      />

      {/* QR & Barcode Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        documents={documents}
        onOpenDocument={(doc) => {
          setIsQRScannerOpen(false);
          setSelectedDocForDetail(doc);
        }}
      />

      {/* In-App Document Viewer & Preview Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {/* Revision History & Rollback Modal */}
      <RevisionHistoryModal
        document={historyDoc}
        isOpen={!!historyDoc}
        onClose={() => setHistoryDoc(null)}
        onRollbackSuccess={() => {
          showToast("Revisi dokumen berhasil dijadikan aktif.", "success");
          loadDocuments();
        }}
      />

      {/* Batch Import NFI Modal */}
      <NFIImportModal
        isOpen={isNfiImportOpen}
        onClose={() => setIsNfiImportOpen(false)}
        onSuccess={() => {
          showToast("Data NFI berhasil diimpor.", "success");
          loadNfi();
        }}
        projects={projects.map((p) => ({ code: p.code, name: p.name }))}
        defaultProjectCode={selectedProject}
      />
    </div>
  );
}

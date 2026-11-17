import { callGasApi } from "@/lib/gas-client";
import { NCREntry, NCRSummary, NCRFormData, NCRStatus } from "../types";

export const ncrService = {
  /**
   * Fetch all NCR records from backend (Sheet: NCR Register All_Project)
   */
  async getNcrData(): Promise<NCREntry[]> {
    try {
      const res = await callGasApi<{ data: unknown[][]; total: number }>("getNcrData");
      if (!res.success || !res.data) {
        return getMockNcrData();
      }

      const raw = res.data;
      const rows = Array.isArray(raw) ? raw : (raw as { data: unknown[][] }).data;
      if (!rows || rows.length <= 1) return getMockNcrData();

      // Row 0 is headers
      return rows.slice(1).map((row: unknown[]) => {
        const rawStatus = String(row[11] || "OPEN").toUpperCase().trim();
        let status: NCRStatus = "OPEN";
        if (rawStatus.includes("CLOSED") || rawStatus.includes("SELESAI")) {
          status = "CLOSED";
        } else if (rawStatus.includes("OVERDUE") || rawStatus.includes("EXPIRED")) {
          status = "OVERDUE";
        }

        return {
          no: String(row[0] || ""),
          ncrNo: String(row[1] || ""),
          ncrProject: String(row[2] || ""),
          discipline: String(row[3] || "General"),
          project: String(row[4] || ""),
          area: String(row[5] || ""),
          description: String(row[6] || ""),
          issuedDate: String(row[7] || ""),
          responsiblePerson: String(row[8] || ""),
          dueDate: String(row[9] || ""),
          closedDate: String(row[10] || ""),
          status: status,
          daysRemaining: String(row[12] || ""),
          remarks: String(row[13] || ""),
          regAei: String(row[14] || ""),
          rowIndex: Number(row[15] || 0),
          docLink: String(row[16] || ""),
        };
      });
    } catch {
      return getMockNcrData();
    }
  },

  /**
   * Get NCR KPI Metrics
   */
  async getNcrSummary(): Promise<NCRSummary> {
    try {
      const res = await callGasApi<NCRSummary>("getNcrSummary");
      if (res.success && res.data) {
        return res.data;
      }
      return { total: 0, closed: 0, open: 0, overdue: 0 };
    } catch {
      return { total: 0, closed: 0, open: 0, overdue: 0 };
    }
  },

  /**
   * Submit new or updated NCR
   */
  async submitNcr(formData: NCRFormData): Promise<{ success: boolean; message: string }> {
    try {
      const res = await callGasApi<{ success: boolean; message?: string }>("submitNcr", [formData]);
      return {
        success: Boolean(res.success),
        message: res.message || (res.success ? "Data NCR berhasil disimpan" : "Gagal menyimpan NCR"),
      };
    } catch (err) {
      const e = err as Error;
      return { success: false, message: e.message || "Gagal menghubungi backend" };
    }
  },

  /**
   * Delete an NCR record
   */
  async deleteNcr(ncrNo: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await callGasApi<{ success: boolean; message?: string }>("submitNcr", [{ ncrNo, isDelete: true }]);
      return {
        success: Boolean(res.success),
        message: res.message || "Data NCR berhasil dihapus",
      };
    } catch (err) {
      const e = err as Error;
      return { success: false, message: e.message || "Gagal menghubungi backend" };
    }
  },

  /**
   * Generate Draft NCR using OpenHermes / Gemini AI
   */
  async generateAiNCR(payload: {
    project: string;
    discipline: string;
    location: string;
    description: string;
    specification: string;
    pic?: string;
  }): Promise<{ success: boolean; text?: string; message?: string }> {
    try {
      const prompt = `Proyek: ${payload.project}\nDisiplin: ${payload.discipline}\nLokasi: ${payload.location}\nUraian Ketidaksesuaian: ${payload.description}\nAcuan Spesifikasi/Standar: ${payload.specification}\nPIC: ${payload.pic || "-"}`;
      const res = await callGasApi<{ success: boolean; text?: string; result?: string; message?: string }>("aiGenerateNCR", [prompt]);
      return {
        success: Boolean(res.success),
        text: (res.data as { text?: string })?.text || res.message || "",
      };
    } catch (err) {
      const e = err as Error;
      return { success: false, message: e.message || "Gagal memproses AI" };
    }
  },
};

function getMockNcrData(): NCREntry[] {
  return [
    {
      no: "1",
      ncrNo: "NCR-QCA-AEI-0001",
      ncrProject: "NCR-CHP-001",
      discipline: "Civil/Architecture",
      project: "New Genset Room - Chiyoda",
      area: "Area Genset - Grid C-4",
      description: "Retak susut melebihi toleransi teknis pada plat lantai genset (lebar 0.35mm > batas 0.20mm ACI 224R)",
      issuedDate: "12 Nov 2026",
      responsiblePerson: "Budi Santoso",
      dueDate: "19 Nov 2026",
      closedDate: "",
      status: "OPEN",
      daysRemaining: "2",
      remarks: "Sedang dilakukan grouting epoxy",
      docLink: "",
    },
    {
      no: "2",
      ncrNo: "NCR-QCA-AEI-0002",
      ncrProject: "NCR-PTFI-004",
      discipline: "Mechanical",
      project: "PTFI Manyar Smelter",
      area: "Pipe Rack Zone 2",
      description: "Hasil NDT Radiography sambungan las pipa 6 inch seam weld ditemukan incomplete penetration",
      issuedDate: "05 Nov 2026",
      responsiblePerson: "Hendra Wijaya",
      dueDate: "10 Nov 2026",
      closedDate: "09 Nov 2026",
      status: "CLOSED",
      daysRemaining: "0",
      remarks: "Repair las ulang & re-NDT dinyatakan Lulus (Accepted)",
      docLink: "",
    },
    {
      no: "3",
      ncrNo: "NCR-QCA-AEI-0003",
      ncrProject: "NCR-NIP-002",
      discipline: "Electrical",
      project: "CSA & ME Bread Crumb - Nippon",
      area: "Main Switchboard Room",
      description: "Isolasi kabel feeder utama 3x185mm2 lecet akibat penarikan kabel tanpa cable roller pelindung",
      issuedDate: "01 Nov 2026",
      responsiblePerson: "Syarif Hidayat",
      dueDate: "08 Nov 2026",
      closedDate: "",
      status: "OVERDUE",
      daysRemaining: "-9",
      remarks: "Menunggu material pengganti tiba di site",
      docLink: "",
    },
  ];
}

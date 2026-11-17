export type NCRStatus = "OPEN" | "CLOSED" | "OVERDUE";

export interface NCREntry {
  no: string;
  ncrNo: string;
  ncrProject: string;
  discipline: string;
  project: string;
  area: string;
  description: string;
  issuedDate: string;
  responsiblePerson: string;
  dueDate: string;
  closedDate: string;
  status: NCRStatus;
  daysRemaining: string;
  remarks: string;
  regAei?: string;
  rowIndex?: number;
  docLink?: string;
}

export interface NCRSummary {
  total: number;
  closed: number;
  open: number;
  overdue: number;
  byDiscipline?: Record<string, { total: number; closed: number; open: number; overdue: number }>;
  byProject?: Record<string, { total: number; closed: number; open: number; overdue: number }>;
}

export interface NCRFormData {
  no?: string;
  ncrNo?: string;
  ncrProject?: string;
  discipline: string;
  project: string;
  area: string;
  description: string;
  issuedDate: string;
  pic: string;
  dueDate: string;
  closedDate?: string;
  status?: string;
  remarks?: string;
  docLink?: string;
  fileBase64?: string;
  fileName?: string;
  mimeType?: string;
}

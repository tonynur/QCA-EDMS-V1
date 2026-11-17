/**
 * ============================================================================
 * QC-CMS — QA/QC Centralized Monitoring System  (EDMS MODE)
 * PT ASUKA ENGINEERING INDONESIA
 * ============================================================================
 * File: Code.gs
 *
 * Fitur utama:
 *   - Login & role (Admin, Manager, QA/QC Engineer, Inspector, Client)
 *   - Upload dokumen mutu (ITP, ITR, FAT, RFI, MRIR) dgn revisi & approval
 *   - Lifecycle Stage, Confidentiality, Extended metadata (EDMS)
 *   - Transmittal + Access Log + Archive & Retention
 *   - Laporan Inspeksi Lapangan (site report dgn foto)
 *   - NFI Log — tracker inspeksi lapangan ala NFI/ITR (BARU)
 *   - Dashboard, ringkasan proyek, audit log, notifikasi in-app
 *
 * SETUP: jalankan initializeSystem() SEKALI, buat Admin pertama lewat
 * BOOTSTRAP_createFirstAdmin(), isi ROOT_FOLDER_ID di tab Config, deploy.
 * ============================================================================
 */
// ============================================================================
// 1. KONFIGURASI DASAR
// ============================================================================
const SPREADSHEET_ID = '';
const SHEET = {
  DOCUMENTS: 'Documents',
  PROJECTS: 'Projects',
  APPROVERS: 'Approvers',
  CONFIG: 'Config',
  USERS: 'Users',
  SITE_REPORTS: 'SiteReports',
  AUDIT_LOG: 'AuditLog',
  NOTIFICATIONS: 'Notifications',
  NUMBERING: 'NumberingRules',
  TRANSMITTALS: 'Transmittals',
  TRANSMITTAL_ITEMS: 'TransmittalItems',
  ACCESS_LOG: 'AccessLog',
  NFILOG: 'NFILog',
  DISCIPLINES: 'Disciplines',
  DOCUMENT_TYPES: 'DocumentTypes',
};
const DOC_TYPES = ['ITP', 'ITR', 'FAT', 'RFI', 'MRIR'];
const DEFAULT_DISCIPLINES = ['Sipil', 'Struktur', 'Arsitektur', 'Mekanikal', 'Elektrikal', 'Instrumentasi'];
const INSPECTION_RESULTS = ['Lulus', 'Lulus dengan Catatan', 'Tidak Lulus'];
const SITE_REPORT_HEADER = [
  'EntryID', 'Timestamp', 'ReportDate', 'ProjectCode', 'ProjectName',
  'LocationArea', 'WorkDescription', 'QCFindings', 'FollowUp',
  'Progress', 'StatusQC', 'PhotoURL', 'PhotoFileID', 'AdditionalPhotoURLs',
  'InspectorName', 'InspectorEmail', 'RecordStatus'
];
const SITE_STATUS_OPTIONS = ['ACC (Accepted)', 'Reject / Repair', 'On Progress'];
const SITE_STATUS_STYLE = {
  'ACC (Accepted)':  { bg: '#dcfce7', text: '#15803d', icon: '\u2705' },
  'Reject / Repair': { bg: '#fee2e2', text: '#b91c1c', icon: '\u26a0\ufe0f' },
  'On Progress':     { bg: '#fef3c7', text: '#92400e', icon: '\ud83d\udd27' }
};
const MAX_PHOTOS_PER_ENTRY = 6;
const DOC_STATUS_STYLE = {
  Pending:    { bg: '#fef3c7', text: '#92400e' },
  Approved:   { bg: '#dcfce7', text: '#15803d' },
  Rejected:   { bg: '#fee2e2', text: '#b91c1c' },
  Superseded: { bg: '#e2e8f0', text: '#475569' }
};
const AUDIT_LOG_HEADER = ['LogID', 'Timestamp', 'ActorEmail', 'ActorName', 'ActorRole', 'Action', 'EntityType', 'EntityId', 'Details'];
const NOTIFICATIONS_HEADER = ['NotifID', 'RecipientEmail', 'Type', 'Message', 'RelatedType', 'RelatedId', 'CreatedAt', 'IsRead'];
const DUPLICATE_CHECK_WINDOW_DAYS = 365;
const STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SUPERSEDED: 'Superseded',
  DELETED: 'Deleted',
};
const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  QC_ENGINEER: 'QA/QC Engineer',
  INSPECTOR: 'Inspector',
  CLIENT: 'Client/Konsultan',
};
const ALL_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.QC_ENGINEER, ROLES.INSPECTOR, ROLES.CLIENT];
const UPLOADER_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.QC_ENGINEER, ROLES.INSPECTOR];
const APPROVER_ROLES = [ROLES.ADMIN, ROLES.MANAGER];
const VIEW_ALL_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.CLIENT];
const SELF_REGISTER_ROLES = [ROLES.QC_ENGINEER, ROLES.INSPECTOR];
const USER_STATUS = { ACTIVE: 'Active', PENDING: 'Pending', INACTIVE: 'Inactive' };
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 10;
const ALLOWED_DOC_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'dwg'];
const DOCUMENTS_HEADER = [
  'DocID', 'Timestamp', 'ProjectCode', 'ProjectName', 'Discipline',
  'DocumentType', 'DocumentNumber', 'Revision', 'Title', 'StandardRef',
  'FileName', 'FileURL', 'FileID', 'UploaderName', 'UploaderEmail',
  'Status', 'ApproverEmail', 'ApproverName', 'ApprovalDate', 'Comments',
  'SLADueDate', 'InspectionResult', 'IsLatestRevision', 'ApprovalToken',
  'SLANotified', 'AdditionalFileURLs', 'FileHash', 'ApprovalTokenExpiry',
  'DocumentCode',
  'Keywords', 'Description', 'Confidentiality', 'LifecycleStage',
  'ReferenceNumber', 'RelatedDocIds', 'SupersedesDocId',
  'ArchivedDate', 'RetentionUntil', 'CheckedOutBy', 'CheckedOutAt',
  'DeletedAt', 'DeletedFromStatus'
];
const PROJECTS_HEADER = ['ProjectCode', 'ProjectName', 'Location', 'Status'];
const DISCIPLINES_HEADER = ['DisciplineName', 'Active', 'CreatedAt'];
const DOCUMENT_TYPES_HEADER = ['TypeCode', 'TypeDescription', 'Active', 'CreatedAt'];
const SEED_DOC_TYPES = [
  ['ITP', 'Inspection Test Plan'],
  ['ITR', 'Inspection Test Report'],
  ['FAT', 'Factory Acceptance Test'],
  ['RFI', 'Request for Inspection'],
  ['MRIR', 'Material Receiving Inspection Report'],
];
const APPROVERS_HEADER = ['ProjectCode', 'DocumentType', 'ApproverEmail', 'ApproverName', 'RequireApproval'];
const NUMBERING_HEADER = ['ProjectCode', 'Format', 'SeqPadding'];
const SEED_NUMBERING = [['ALL', '{PROJECT}-{TYPE}-{SEQ}', 3]];
const CONFIG_HEADER = ['Key', 'Value', 'Keterangan'];
const USERS_HEADER = [
  'UserID', 'FullName', 'Email', 'PasswordHash', 'Salt', 'Role', 'Status',
  'CreatedAt', 'CreatedByEmail', 'FailedAttempts', 'LockedUntil', 'LastLoginAt',
  'SessionToken', 'SessionExpiry', 'ResetToken', 'ResetTokenExpiry', 'CanApprove'
];
const DEFAULT_CONFIG = [
  ['ROOT_FOLDER_ID', '', 'ID folder Google Drive tempat semua dokumen disimpan (WAJIB diisi)'],
  ['SLA_DAYS_RFI', '7', 'Batas waktu (hari kerja) respon RFI sebelum dianggap lewat SLA'],
  ['DEFAULT_APPROVER_EMAIL', '', 'Email approver fallback jika kombinasi proyek/jenis dokumen tidak ada di tab Approvers, dan tidak ada Admin/Manager aktif'],
  ['COMPANY_NAME', 'PT Asuka Engineering Indonesia', 'Nama perusahaan, ditampilkan di UI & email'],
  ['WEB_APP_URL', '', '(Opsional) URL Web App — otomatis terdeteksi sistem'],
  ['TOKEN_SECRET', '', 'Diisi otomatis oleh initializeSystem() — JANGAN diubah manual'],
  ['SESSION_HOURS', '12', 'Lama sesi login (jam) sebelum harus login ulang'],
  ['ALLOW_SELF_REGISTER', 'TRUE', 'Izinkan pendaftaran mandiri (TRUE/FALSE)'],
  ['MAX_LOGIN_ATTEMPTS', '5', 'Batas percobaan login gagal sebelum akun dikunci'],
  ['LOCKOUT_MINUTES', '15', 'Lama penguncian akun (menit)'],
  ['SILENT_PROJECT_DAYS', '14', 'Proyek ditandai "senyap" jika tidak ada aktivitas sekian hari'],
  ['STALE_PENDING_DAYS', '5', 'Dokumen pending ditandai "terlalu lama" jika belum diproses sekian hari'],
  ['APPROVAL_TOKEN_VALID_DAYS', '30', 'Masa berlaku tautan approve/reject di email (hari)'],
  ['PASSWORD_RESET_COOLDOWN_MINUTES', '5', 'Jeda minimal (menit) antar permintaan reset password'],
  ['EXPECTED_TIMEZONE', 'Asia/Jakarta', 'Timezone yang diharapkan'],
    ['DEFAULT_RETENTION_YEARS', '5', 'Retensi default arsip dokumen (tahun)'],
  ['NFI_OPEN_ALERT_DAYS', '3', 'Kirim notifikasi otomatis jika NFI berstatus Open/In Progress lebih dari X hari'],
  ['NFI_TYPE_OF_INSPECTION_CUSTOM', '[]', 'Tipe inspeksi custom (JSON array). Diisi via Pengaturan Sistem.'],
  ['COMPANY_LOGO_ENABLED', 'TRUE', 'Tampilkan logo di header laporan Excel/PDF/Word (TRUE/FALSE)'],
  ['COMPANY_LOGO_URL', 'https://cdn.phototourl.com/free/2026-09-16-72dd0332-d14b-4e83-8e0e-6cfacd74a83c.png', 'URL logo perusahaan (PNG/JPG). Ganti kapan saja.'],
  ['COMPANY_LOGO_SIZE', '80', 'Ukuran logo di header laporan dalam pixel (40-160). Default 80.'],
  ['BACKUP_ENABLED', 'TRUE', 'Aktifkan backup harian otomatis ke Google Drive (TRUE/FALSE)'],
  ['BACKUP_RETENTION_DAYS', '30', 'Hapus backup lebih lama dari X hari (0 = tidak pernah hapus)'],
  ['BACKUP_FOLDER_NAME', 'Backups', 'Nama sub-folder di dalam ROOT_FOLDER_ID untuk menyimpan backup'],
  ['RECYCLE_BIN_RETENTION_DAYS', '30', 'Auto-hapus permanen item di Sampah setelah X hari (0 = jangan auto-hapus)'],
];
const SEED_PROJECTS = [
  ['KNMP-KD', 'Pembangunan KNMP Kuranji Dalang', 'Desa Kuranji Dalang, Lombok Barat', 'Active'],
  ['SCB-PTS', 'Safety Center Building', 'PT Smelting (PTS)', 'Active'],
];
const STATUS_CHART_COLORS = { Pending: '#f59e0b', Approved: '#16a34a', Rejected: '#dc2626', Superseded: '#64748b' };
const INDONESIAN_MONTHS_ = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const CACHE_SECONDS = 300;
const LIFECYCLE = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In Review',
  APPROVED: 'Approved',
  SUPERSEDED: 'Superseded',
  ARCHIVED: 'Archived',
  OBSOLETE: 'Obsolete',
  REJECTED: 'Rejected',
  DELETED: 'Deleted'
};
const CONFIDENTIALITY_LEVELS = ['Public', 'Internal', 'Confidential', 'Restricted'];
const TRANSMITTAL_PURPOSES = ['For Approval', 'For Information', 'For Construction', 'For Record', 'For Review & Comment', 'As-Built'];
const TRANSMITTAL_STATUS = ['Draft', 'Sent', 'Acknowledged', 'Closed'];
const TRANSMITTAL_HEADER = [
  'TransmittalID', 'TransmittalNumber', 'Timestamp', 'ProjectCode', 'ProjectName',
  'Discipline', 'SenderName', 'SenderEmail', 'RecipientCompany', 'RecipientName',
  'RecipientEmail', 'Purpose', 'Remarks', 'Status', 'SentAt', 'AcknowledgedAt',
  'AcknowledgedBy', 'DocumentCount', 'CoverSheetURL', 'CreatedBy'
];
const TRANSMITTAL_ITEMS_HEADER = [
  'ItemID', 'TransmittalID', 'DocID', 'DocumentCode', 'Revision', 'DocumentType', 'Title', 'Purpose'
];
const ACCESS_LOG_HEADER = [
  'LogID', 'Timestamp', 'DocID', 'DocumentCode', 'UserEmail', 'UserName', 'Action', 'Details', 'UserAgent'
];
// ---------- NFI Log (Notification of Inspection) ----------
const NFI_TYPE_OF_INSPECTION = [
  // --- Umum / Standard ---
  'Visual',
  'Dimensional',
  'Functional Test',
  'Pre-Commissioning',
  // --- Struktur & Sipil ---
  'Welding',
  'Welding Test',
  'Rebar Test',
  'Wiremesh Test',
  'Trial Mix',
  'Sondir Test',
  'Survey Check',
  'Pre-Pour Inspection',
  // --- Mekanikal / Piping ---
  'Painting/Coating',
  'NDT (RT/UT/MT/PT)',
  'Hydrotest',
  'Pressure Test',
  // --- Equipment & Material ---
  'Equipment Check',
  'Material Check',
  'Installation Check',
  // --- Umum ---
  'Inspection Test',
  'Lainnya'
];
const NFI_RESULT_OPTIONS = ['Pass', 'Fail', 'Continue', 'Pending', 'N/A'];
const NFI_STATUS_OPTIONS = ['Open', 'In Progress', 'Closed', 'Cancelled'];
const NFI_LOG_HEADER = [
  'NFIID', 'No', 'NoNFI', 'SubjectDescription', 'Area', 'TypeOfInspection',
  'IssuedDate', 'Discipline', 'Location', 'InspectionDate', 'Result',
  'ITRNo', 'ITPNo', 'ReportSubmissionDate', 'CompleteDate', 'Status',
  'PICAei', 'Remark', 'AttachmentURL', 'AttachmentFileID',
  'CreatedByEmail', 'CreatedByName', 'CreatedAt', 'UpdatedAt', 'RecordStatus',
  'ProjectCode', 'ProjectName', 'DeletedAt'
];
// ============================================================================
// 2. MENU & SETUP
// ============================================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('QC-CMS')
    .addItem('⚙️ Setup Sistem (Jalankan Sekali)', 'initializeSystem')
    .addItem('🔔 Cek SLA RFI Sekarang', 'checkSLABreaches')
    .addItem('⏰ Aktifkan Trigger Harian SLA', 'createDailySLATrigger')
    .addItem('🔇 Cek Proyek Senyap Sekarang', 'checkSilentProjects')
    .addItem('⏰ Aktifkan Trigger Mingguan Proyek Senyap', 'createWeeklySilentProjectTrigger')
    .addItem('🗄️ Cek Retensi Arsip Sekarang', 'checkRetentionExpiries')
    .addItem('📝 Cek NFI Belum Selesai Sekarang', 'checkNFIOpenAlerts')
    .addItem('⏰ Aktifkan Trigger Harian NFI Open', 'createDailyNFIOpenTrigger')
    .addSeparator()
    .addItem('🧹 Bersihkan Cache Sistem', 'clearSystemCache')
    .addItem('🕒 Cek Konfigurasi Timezone', 'checkTimezoneConfig')
    .addSeparator()
    .addItem('💾 Backup Sekarang (Manual)', 'runManualBackup')
    .addItem('⏰ Aktifkan Trigger Backup Harian', 'createDailyBackupTrigger')
    .addItem('🗑 Hapus Backup Lama (Manual)', 'cleanOldBackups')
    .addSeparator()
    .addItem('♻️ Bersihkan Sampah (>30 hari)', 'cleanRecycleBinMenu')
    .addItem('⏰ Aktifkan Trigger Bersih Sampah Harian', 'createRecycleBinTrigger')
    .addSeparator()
    .addItem('🔄 Sync Semua Proyek Sekarang', 'runSyncAll')
    .addItem('⏰ Aktifkan Auto-Sync Tiap 1 Jam (Command Center)', 'setupHourlyTrigger')
    .addToUi();
}
function initializeSystem() {
  const ss = getSS_();
  let docSheet = ss.getSheetByName(SHEET.DOCUMENTS);
  if (!docSheet) docSheet = ss.insertSheet(SHEET.DOCUMENTS);
  ensureHeader_(docSheet, DOCUMENTS_HEADER);
  let projSheet = ss.getSheetByName(SHEET.PROJECTS);
  if (!projSheet) projSheet = ss.insertSheet(SHEET.PROJECTS);
  const projWasEmpty = ensureHeader_(projSheet, PROJECTS_HEADER);
  if (projWasEmpty && projSheet.getLastRow() < 2) SEED_PROJECTS.forEach(row => projSheet.appendRow(row));
  let apprSheet = ss.getSheetByName(SHEET.APPROVERS);
  if (!apprSheet) apprSheet = ss.insertSheet(SHEET.APPROVERS);
  ensureHeader_(apprSheet, APPROVERS_HEADER);
  let numSheet = ss.getSheetByName(SHEET.NUMBERING);
  if (!numSheet) numSheet = ss.insertSheet(SHEET.NUMBERING);
  const numWasEmpty = ensureHeader_(numSheet, NUMBERING_HEADER);
  if (numWasEmpty && numSheet.getLastRow() < 2) SEED_NUMBERING.forEach(row => numSheet.appendRow(row));
    // Disciplines — bisa dikelola dari UI Pengaturan Sistem
  let discSheet = ss.getSheetByName(SHEET.DISCIPLINES);
  if (!discSheet) discSheet = ss.insertSheet(SHEET.DISCIPLINES);
  const discWasEmpty = ensureHeader_(discSheet, DISCIPLINES_HEADER);
  if (discWasEmpty && discSheet.getLastRow() < 2) {
    DEFAULT_DISCIPLINES.forEach(function (d) {
      discSheet.appendRow([d, true, new Date()]);
    });
  }
    // Document Types — bisa dikelola dari UI Pengaturan Sistem
  let dtSheet = ss.getSheetByName(SHEET.DOCUMENT_TYPES);
  if (!dtSheet) dtSheet = ss.insertSheet(SHEET.DOCUMENT_TYPES);
  const dtWasEmpty = ensureHeader_(dtSheet, DOCUMENT_TYPES_HEADER);
  if (dtWasEmpty && dtSheet.getLastRow() < 2) {
    SEED_DOC_TYPES.forEach(function (row) {
      dtSheet.appendRow([row[0], row[1], true, new Date()]);
    });
  }
  let cfgSheet = ss.getSheetByName(SHEET.CONFIG);
  if (!cfgSheet) cfgSheet = ss.insertSheet(SHEET.CONFIG);
  ensureHeader_(cfgSheet, CONFIG_HEADER);
  const existingKeys = cfgSheet.getLastRow() > 1
    ? cfgSheet.getRange(2, 1, cfgSheet.getLastRow() - 1, 1).getValues().flat()
    : [];
  DEFAULT_CONFIG.forEach(row => {
    if (existingKeys.indexOf(row[0]) === -1) {
      const rowToAdd = row.slice();
      if (rowToAdd[0] === 'TOKEN_SECRET') rowToAdd[1] = Utilities.getUuid();
      cfgSheet.appendRow(rowToAdd);
    }
  });
  let usersSheet = ss.getSheetByName(SHEET.USERS);
  if (!usersSheet) usersSheet = ss.insertSheet(SHEET.USERS);
  ensureHeader_(usersSheet, USERS_HEADER);
  let siteSheet = ss.getSheetByName(SHEET.SITE_REPORTS);
  if (!siteSheet) siteSheet = ss.insertSheet(SHEET.SITE_REPORTS);
  ensureHeader_(siteSheet, SITE_REPORT_HEADER);
  let auditSheet = ss.getSheetByName(SHEET.AUDIT_LOG);
  if (!auditSheet) auditSheet = ss.insertSheet(SHEET.AUDIT_LOG);
  ensureHeader_(auditSheet, AUDIT_LOG_HEADER);
  let notifSheet = ss.getSheetByName(SHEET.NOTIFICATIONS);
  if (!notifSheet) notifSheet = ss.insertSheet(SHEET.NOTIFICATIONS);
  ensureHeader_(notifSheet, NOTIFICATIONS_HEADER);
  let transSheet = ss.getSheetByName(SHEET.TRANSMITTALS);
  if (!transSheet) transSheet = ss.insertSheet(SHEET.TRANSMITTALS);
  ensureHeader_(transSheet, TRANSMITTAL_HEADER);
  let transItemsSheet = ss.getSheetByName(SHEET.TRANSMITTAL_ITEMS);
  if (!transItemsSheet) transItemsSheet = ss.insertSheet(SHEET.TRANSMITTAL_ITEMS);
  ensureHeader_(transItemsSheet, TRANSMITTAL_ITEMS_HEADER);
  let accessSheet = ss.getSheetByName(SHEET.ACCESS_LOG);
  if (!accessSheet) accessSheet = ss.insertSheet(SHEET.ACCESS_LOG);
  ensureHeader_(accessSheet, ACCESS_LOG_HEADER);
  // NFI Log — tracker inspeksi lapangan
  let nfiSheet = ss.getSheetByName(SHEET.NFILOG);
  if (!nfiSheet) nfiSheet = ss.insertSheet(SHEET.NFILOG);
  ensureHeader_(nfiSheet, NFI_LOG_HEADER);
  // Data validation
  const statusList = Object.keys(STATUS).map(k => STATUS[k]);
  const statusCol = DOCUMENTS_HEADER.indexOf('Status') + 1;
  const typeCol = DOCUMENTS_HEADER.indexOf('DocumentType') + 1;
  docSheet.getRange(2, statusCol, 1000, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(statusList, true).build());
  docSheet.getRange(2, typeCol, 1000, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(DOC_TYPES, true).build());
  const roleCol = USERS_HEADER.indexOf('Role') + 1;
  const userStatusCol = USERS_HEADER.indexOf('Status') + 1;
  usersSheet.getRange(2, roleCol, 500, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(ALL_ROLES, true).build());
  usersSheet.getRange(2, userStatusCol, 500, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(Object.keys(USER_STATUS).map(k => USER_STATUS[k]), true).build());
  const siteStatusCol = SITE_REPORT_HEADER.indexOf('StatusQC') + 1;
  siteSheet.getRange(2, siteStatusCol, 2000, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(SITE_STATUS_OPTIONS, true).build());
  const nfiResultCol = NFI_LOG_HEADER.indexOf('Result') + 1;
  const nfiStatusCol = NFI_LOG_HEADER.indexOf('Status') + 1;
  const nfiTypeCol = NFI_LOG_HEADER.indexOf('TypeOfInspection') + 1;
  nfiSheet.getRange(2, nfiResultCol, 2000, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(NFI_RESULT_OPTIONS, true).build());
  nfiSheet.getRange(2, nfiStatusCol, 2000, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(NFI_STATUS_OPTIONS, true).build());
  nfiSheet.getRange(2, nfiTypeCol, 2000, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(NFI_TYPE_OF_INSPECTION, true).build());
  // Header styling
  [docSheet, projSheet, apprSheet, numSheet, cfgSheet, usersSheet, siteSheet,
   auditSheet, notifSheet, transSheet, transItemsSheet, accessSheet, nfiSheet, discSheet, dtSheet].forEach(sh => {
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold').setBackground('#1a2332').setFontColor('#ffffff');
  });
  docSheet.autoResizeColumns(1, DOCUMENTS_HEADER.length);
  siteSheet.autoResizeColumns(1, SITE_REPORT_HEADER.length);
  checkTimezoneConfig_(true);
  try {
    SpreadsheetApp.getUi().alert(
      'Setup QC-CMS EDMS selesai!\n\n' +
      'Fitur yang aktif:\n' +
      '• Lifecycle Stage, Confidentiality, Extended Metadata\n' +
      '• Transmittal + Cover Sheet PDF\n' +
      '• Access Log, Arsip & Retensi\n' +
      '• Laporan Inspeksi Lapangan (dengan foto)\n' +
      '• NFI Log — Tracker inspeksi lapangan ala NFI/ITR (BARU)\n\n' +
      'Langkah lanjutan:\n' +
      '1. Buat akun Admin pertama via BOOTSTRAP_createFirstAdmin() (jika belum).\n' +
      '2. Isi ROOT_FOLDER_ID di tab Config.\n' +
      '3. Deploy Web App sebagai versi baru.'
    );
  } catch (e) {
    Logger.log('Setup QC-CMS EDMS selesai.');
  }
}
function ensureHeader_(sheet, headerArr) {
  const currentLastCol = sheet.getLastColumn();
  if (currentLastCol === 0) {
    sheet.getRange(1, 1, 1, headerArr.length).setValues([headerArr]);
    return true;
  }
  const existingHeader = sheet.getRange(1, 1, 1, currentLastCol).getValues()[0];
  const isEmpty = existingHeader.every(c => c === '');
  if (isEmpty) {
    sheet.getRange(1, 1, 1, headerArr.length).setValues([headerArr]);
    return true;
  }
  const missing = headerArr.filter(h => existingHeader.indexOf(h) === -1);
  if (missing.length) {
    sheet.getRange(1, currentLastCol + 1, 1, missing.length).setValues([missing]);
    return true;
  }
  return false;
}
function clearSystemCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove('qc_config_cache');
    cache.remove('qc_projects_cache');
    if (typeof CK !== 'undefined' && CK.PROJECTS) cache.remove(CK.PROJECTS);
    SpreadsheetApp.getUi().alert('Cache Config & daftar Proyek berhasil dibersihkan.');
  } catch (e) {
    Logger.log('Cache dibersihkan.');
  }
}
function checkTimezoneConfig_(silent) {
  try {
    const config = getConfig_();
    const expected = config.EXPECTED_TIMEZONE || 'Asia/Jakarta';
    const actual = Session.getScriptTimeZone();
    const ok = actual === expected;
    if (!ok && !silent) {
      try {
        SpreadsheetApp.getUi().alert(
          'Peringatan Konfigurasi Timezone\n\n' +
          'Timezone project Apps Script saat ini: ' + actual + '\n' +
          'Timezone yang diharapkan: ' + expected + '\n\n' +
          'Perbaiki lewat Project Settings > Time zone di editor Apps Script.'
        );
      } catch (e) { /* di luar konteks UI */ }
    }
    return { ok: ok, actual: actual, expected: expected };
  } catch (e) {
    return { ok: true, actual: '', expected: '' };
  }
}
function checkTimezoneConfig() {
  const r = checkTimezoneConfig_(true);
  try {
    SpreadsheetApp.getUi().alert(r.ok
      ? ('Timezone sudah sesuai: ' + r.actual)
      : ('Timezone TIDAK sesuai!\nSaat ini: ' + r.actual + '\nDiharapkan: ' + r.expected));
  } catch (e) { Logger.log('Timezone check: ' + JSON.stringify(r)); }
}
function BOOTSTRAP_createFirstAdmin() {
  createFirstAdminAccount('Nama Lengkap Anda', 'email.anda@perusahaan.com', 'GantiPasswordIni123');
}
function createFirstAdminAccount(fullName, email, password) {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.USERS);
  if (!sheet) throw new Error('Jalankan initializeSystem() terlebih dahulu.');
  if (!fullName || fullName === 'Nama Lengkap Anda' || !email || email === 'email.anda@perusahaan.com' || !password) {
    throw new Error('Edit dulu 3 nilai (nama, email, password) di BOOTSTRAP_createFirstAdmin().');
  }
  if (password.length < 8) throw new Error('Password minimal 8 karakter.');
  if (findUserByEmail_(sheet, email)) throw new Error('Email ini sudah terdaftar.');
  const salt = generateSalt_();
  const hash = hashPassword_(password, salt);
  const userId = Utilities.getUuid();
  sheet.appendRow([
    userId, fullName, email.toLowerCase().trim(), hash, salt, ROLES.ADMIN,
    USER_STATUS.ACTIVE, new Date(), 'system-bootstrap', 0, '', '', '', '', '', '', ''
  ]);
  try {
    SpreadsheetApp.getUi().alert('Akun Admin pertama untuk ' + fullName + ' (' + email + ') berhasil dibuat.');
  } catch (e) { Logger.log('Admin pertama dibuat: ' + email); }
}
// ============================================================================
// 3. WEB APP ENTRY POINTS
// ============================================================================
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
    // ✅ API mode — untuk Vercel (via GET)
    if (params.api === '1' && params.apiAction && !params.callback) {
    try {
      const apiArgs = params.apiArgs ? JSON.parse(params.apiArgs) : [];
      return handleApiRequest_({ action: params.apiAction, args: apiArgs, sessionToken: params.sessionToken || '' });
    } catch (err) {
      return jsonResponse_({ success: false, message: err.message || 'Invalid args' });
    }
  }
    // ✅ JSONP mode — bypass CORS (untuk Vercel)
  if (params.api === '1' && params.apiAction && params.callback) {
    var cbName = String(params.callback).replace(/[^a-zA-Z0-9_]/g, '');
    try {
      var jArgs = params.apiArgs ? JSON.parse(params.apiArgs) : [];
      var jResult = handleApiRequest_({ action: params.apiAction, args: jArgs, sessionToken: params.sessionToken || '' });
      var rawJson = jResult.getContent();
      return ContentService
        .createTextOutput(cbName + '(' + rawJson + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } catch (err) {
      return ContentService
        .createTextOutput(cbName + '(' + JSON.stringify({ success: false, message: err.message }) + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
  }
  if (params.action === 'approve' || params.action === 'reject') return handleEmailAction_(params);
  if (params.action === 'reset-password') return renderResetPasswordPage_(params.uid, params.token);
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('QC-CMS — EDMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  if (params.action === 'approve-submit') {
    const config = getConfig_();
    const valid = verifyApprovalToken_(params.id, params.token, config.TOKEN_SECRET, params.exp);
    if (!valid) return renderMessagePage_('Tautan Tidak Valid', 'Tautan ini tidak valid atau sudah kedaluwarsa.', false);
    const result = processApproval_(params.id, STATUS.APPROVED);
    return renderMessagePage_(result.success ? 'Dokumen Disetujui' : 'Gagal', result.message, result.success);
  }
  if (params.action === 'reject-submit') {
    const config = getConfig_();
    const valid = verifyApprovalToken_(params.id, params.token, config.TOKEN_SECRET, params.exp);
    if (!valid) return renderMessagePage_('Tautan Tidak Valid', 'Tautan ini tidak valid atau sudah kedaluwarsa.', false);
    const result = processApproval_(params.id, STATUS.REJECTED, params.comment || '');
    return renderMessagePage_(result.success ? 'Dokumen Ditolak' : 'Gagal', result.message, result.success);
  }
  if (params.action === 'reset-password-submit') {
    return handlePasswordResetSubmit_(params.uid, params.token, params.newPassword);
  }
    // ✅ API JSON ROUTER — untuk Vercel / PWA
  if (e && e.postData && e.postData.contents) {
    try {
      const body = JSON.parse(e.postData.contents);
      if (body && body.action) {
        return handleApiRequest_(body);
      }
    } catch (err) { /* bukan JSON, lanjut ke fallback */ }
  }
  return renderMessagePage_('Permintaan Tidak Dikenal', 'Aksi tidak dikenali.', false);
}
function handleEmailAction_(params) {
  const config = getConfig_();
  const valid = verifyApprovalToken_(params.id, params.token, config.TOKEN_SECRET, params.exp);
  if (!valid) return renderMessagePage_('Tautan Tidak Valid', 'Tautan ini tidak valid, sudah dipakai/kedaluwarsa, atau dokumennya sudah diproses.', false);
  if (params.action === 'approve') return renderApproveConfirmPage_(params.id, params.token, params.exp);
  if (params.action === 'reject') return renderRejectFormPage_(params.id, params.token, params.exp);
  return renderMessagePage_('Permintaan Tidak Dikenal', 'Aksi tidak dikenali.', false);
}
function renderMessagePage_(title, message, isSuccess) {
  const color = isSuccess ? '#15803d' : '#b91c1c';
  const html = '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#f7f8fa;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;box-sizing:border-box;}.card{background:#fff;padding:32px;border-radius:10px;box-shadow:0 2px 16px rgba(26,35,50,0.1);max-width:420px;text-align:center;}h2{color:' + color + ';margin-top:0;}p{color:#374151;line-height:1.5;}</style></head><body><div class="card"><h2>' + escapeHtml_(title) + '</h2><p>' + escapeHtml_(message) + '</p></div></body></html>';
  return HtmlService.createHtmlOutput(html).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function renderRejectFormPage_(docId, token, exp) {
  const actionUrl = getWebAppUrl_(getConfig_());
  const doc = findDocumentById_(getSS_().getSheetByName(SHEET.DOCUMENTS), docId);
  const docSummary = doc ? (escapeHtml_(doc.DocumentType) + ' — ' + escapeHtml_(doc.Title) + ' (' + escapeHtml_(doc.ProjectName) + ')') : '';
  const html = '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#f7f8fa;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;box-sizing:border-box;}.card{background:#fff;padding:32px;border-radius:10px;box-shadow:0 2px 16px rgba(26,35,50,0.1);max-width:420px;width:100%;box-sizing:border-box;}h2{color:#b91c1c;margin-top:0;}p{color:#374151;line-height:1.5;}.doc-summary{background:#f7f8fa;border:1px solid #e5e9ef;border-radius:8px;padding:10px 12px;font-size:13px;color:#1a2332;font-weight:600;margin-bottom:14px;}textarea{width:100%;min-height:100px;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-family:inherit;box-sizing:border-box;font-size:14px;}button{background:#b91c1c;color:#fff;border:none;padding:10px 24px;border-radius:6px;font-weight:600;margin-top:12px;cursor:pointer;font-size:14px;}</style></head><body><div class="card">' +
    '<h2>Tolak Dokumen</h2>' + (docSummary ? '<div class="doc-summary">' + docSummary + '</div>' : '') +
    '<p>Alasan penolakan (opsional namun disarankan):</p>' +
    '<form method="post" action="' + escapeHtml_(actionUrl) + '">' +
    '<input type="hidden" name="action" value="reject-submit"><input type="hidden" name="id" value="' + escapeHtml_(docId) + '">' +
    '<input type="hidden" name="token" value="' + escapeHtml_(token) + '"><input type="hidden" name="exp" value="' + escapeHtml_(exp || '') + '">' +
    '<textarea name="comment" placeholder="Contoh: Referensi standar tidak sesuai, mohon revisi."></textarea><br>' +
    '<button type="submit">Kirim Penolakan</button></form></div></body></html>';
  return HtmlService.createHtmlOutput(html).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function renderApproveConfirmPage_(docId, token, exp) {
  const actionUrl = getWebAppUrl_(getConfig_());
  const doc = findDocumentById_(getSS_().getSheetByName(SHEET.DOCUMENTS), docId);
  if (!doc) return renderMessagePage_('Dokumen Tidak Ditemukan', 'Dokumen ini mungkin sudah dihapus.', false);
  if (doc.Status !== STATUS.PENDING) return renderMessagePage_('Sudah Diproses', 'Dokumen ini sudah berstatus ' + doc.Status + '.', doc.Status === STATUS.APPROVED);
  const html = '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#f7f8fa;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;box-sizing:border-box;}.card{background:#fff;padding:32px;border-radius:10px;box-shadow:0 2px 16px rgba(26,35,50,0.1);max-width:420px;width:100%;box-sizing:border-box;}h2{color:#15803d;margin-top:0;}p{color:#374151;line-height:1.5;}.doc-summary{background:#f7f8fa;border:1px solid #e5e9ef;border-radius:8px;padding:12px 14px;font-size:13px;color:#1a2332;margin-bottom:16px;}.doc-summary b{display:block;font-size:14.5px;margin-bottom:4px;}button{background:#15803d;color:#fff;border:none;padding:10px 24px;border-radius:6px;font-weight:600;margin-top:6px;cursor:pointer;font-size:14px;width:100%;}</style></head><body><div class="card">' +
    '<h2>Konfirmasi Persetujuan</h2>' +
    '<div class="doc-summary"><b>' + escapeHtml_(doc.Title) + '</b>' + escapeHtml_(doc.DocumentType) + ' · ' + escapeHtml_(doc.ProjectName) + '<br>Diunggah oleh ' + escapeHtml_(doc.UploaderName) + '</div>' +
    '<p>Klik tombol di bawah untuk menyetujui dokumen ini.</p>' +
    '<form method="post" action="' + escapeHtml_(actionUrl) + '">' +
    '<input type="hidden" name="action" value="approve-submit"><input type="hidden" name="id" value="' + escapeHtml_(docId) + '">' +
    '<input type="hidden" name="token" value="' + escapeHtml_(token) + '"><input type="hidden" name="exp" value="' + escapeHtml_(exp || '') + '">' +
    '<button type="submit">✓ Ya, Setujui Dokumen Ini</button></form></div></body></html>';
  return HtmlService.createHtmlOutput(html).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function renderResetPasswordPage_(userId, token) {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.USERS);
  const user = findUserById_(sheet, userId);
  if (!user || !user.ResetToken || user.ResetToken !== token || !user.ResetTokenExpiry || new Date(user.ResetTokenExpiry) < new Date()) {
    return renderMessagePage_('Tautan Tidak Valid', 'Tautan reset password ini tidak valid atau kedaluwarsa.', false);
  } 
  
  const actionUrl = getWebAppUrl_(getConfig_());
  const html = '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#f7f8fa;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;box-sizing:border-box;}.card{background:#fff;padding:32px;border-radius:10px;box-shadow:0 2px 16px rgba(26,35,50,0.1);max-width:400px;width:100%;box-sizing:border-box;}h2{color:#1a2332;margin-top:0;}p{color:#374151;line-height:1.5;font-size:13.5px;}label{font-size:12.5px;font-weight:600;color:#5b6b7f;display:block;margin-top:4px;}input{width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-family:inherit;box-sizing:border-box;font-size:14px;margin-top:6px;}button{background:#e8720c;color:#fff;border:none;padding:10px 24px;border-radius:6px;font-weight:600;margin-top:16px;cursor:pointer;font-size:14px;width:100%;}</style></head><body><div class="card">' +
    '<h2>Buat Password Baru</h2><p>Untuk akun: <b>' + escapeHtml_(user.Email) + '</b></p>' +
    '<form method="post" action="' + escapeHtml_(actionUrl) + '">' +
    '<input type="hidden" name="action" value="reset-password-submit"><input type="hidden" name="uid" value="' + escapeHtml_(userId) + '">' +
    '<input type="hidden" name="token" value="' + escapeHtml_(token) + '">' +
    '<label>Password Baru (minimal 8 karakter)</label><input type="password" name="newPassword" minlength="8" required>' +
    '<button type="submit">Simpan Password Baru</button></form></div></body></html>';
  return HtmlService.createHtmlOutput(html).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function handlePasswordResetSubmit_(userId, token, newPassword) {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.USERS);
  const user = findUserById_(sheet, userId);
  if (!user || !user.ResetToken || user.ResetToken !== token || !user.ResetTokenExpiry || new Date(user.ResetTokenExpiry) < new Date()) {
    return renderMessagePage_('Tautan Tidak Valid', 'Tautan reset password ini tidak valid atau kedaluwarsa.', false);
  }
  if (!newPassword || newPassword.length < 8) return renderMessagePage_('Gagal', 'Password baru minimal 8 karakter.', false);
  const idx = usersIdx_();
  const salt = generateSalt_();
  const hash = hashPassword_(newPassword, salt);
  // Batch update — 1 round-trip instead of 6
  var rowData = sheet.getRange(user.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  rowData[idx.PasswordHash] = hash;
  rowData[idx.Salt] = salt;
  rowData[idx.ResetToken] = '';
  rowData[idx.ResetTokenExpiry] = '';
  rowData[idx.SessionToken] = '';
  rowData[idx.SessionExpiry] = '';
  sheet.getRange(user.rowIndex, 1, 1, rowData.length).setValues([rowData]);
  return renderMessagePage_('Password Berhasil Diubah', 'Silakan login dengan password baru Anda.', true);
}
// ============================================================================
// 4. AUTENTIKASI & MANAJEMEN SESI
// ============================================================================
function login(email, password) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sedang sibuk, coba lagi.' }; }
  try {
    if (!email || !password) return { success: false, message: 'Email dan password wajib diisi.' };
    // Rate limit login: maks 10 percobaan per menit per email
    const cleanEmail = String(email).trim().toLowerCase();
    if (typeof checkRateLimit_ === 'function' && !checkRateLimit_('login_' + cleanEmail, 10, 60)) {
      return { success: false, message: 'Terlalu banyak percobaan login. Harap tunggu 1 menit.' };
    }
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.USERS);
    const user = findUserByEmail_(sheet, email);
    if (!user) return { success: false, message: 'Email atau password salah.' };
    const config = getConfig_();
    const maxAttempts = parseInt(config.MAX_LOGIN_ATTEMPTS, 10) || 5;
    const lockoutMin = parseInt(config.LOCKOUT_MINUTES, 10) || 15;
    const idx = usersIdx_();
    if (user.LockedUntil && new Date(user.LockedUntil) > new Date()) {
      return { success: false, message: 'Akun terkunci sementara. Coba lagi setelah ' + new Date(user.LockedUntil).toLocaleTimeString('id-ID') + '.' };
    }
    if (user.Status !== USER_STATUS.ACTIVE) {
      const msg = user.Status === USER_STATUS.PENDING ? 'Akun Anda masih menunggu persetujuan Admin.' : 'Akun Anda tidak aktif.';
      return { success: false, message: msg };
    }
    if (!verifyPassword_(password, user.Salt, user.PasswordHash)) {
      const attempts = (parseInt(user.FailedAttempts, 10) || 0) + 1;
      if (attempts >= maxAttempts) {
        const lockedUntil = new Date(Date.now() + lockoutMin * 60000);
        // Batch update — 1 round-trip instead of 2
        var failRow = sheet.getRange(user.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
        failRow[idx.FailedAttempts] = attempts;
        failRow[idx.LockedUntil] = lockedUntil;
        sheet.getRange(user.rowIndex, 1, 1, failRow.length).setValues([failRow]);
        return { success: false, message: 'Terlalu banyak percobaan gagal. Akun dikunci ' + lockoutMin + ' menit.' };
      }
      sheet.getRange(user.rowIndex, idx.FailedAttempts + 1).setValue(attempts);
      return { success: false, message: 'Email atau password salah.' };
    }
    const sessionHours = parseInt(config.SESSION_HOURS, 10) || 12;
    const token = Utilities.getUuid();
    const expiry = new Date(Date.now() + sessionHours * 3600000);
    // Batch update — 1 round-trip instead of 5
    var loginRow = sheet.getRange(user.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
    loginRow[idx.SessionToken] = token;
    loginRow[idx.SessionExpiry] = expiry;
    loginRow[idx.FailedAttempts] = 0;
    loginRow[idx.LockedUntil] = '';
    loginRow[idx.LastLoginAt] = new Date();
    sheet.getRange(user.rowIndex, 1, 1, loginRow.length).setValues([loginRow]);
    return { success: true, sessionToken: token, user: { userId: user.UserID, fullName: user.FullName, email: user.Email, role: user.Role } };
  } finally { lock.releaseLock(); }
}
function logout(sessionToken) {
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.USERS);
    const user = findUserBySessionToken_(sheet, sessionToken);
    if (user) {
      const idx = usersIdx_();
      // Batch update — 1 round-trip instead of 2
      var logoutRow = sheet.getRange(user.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
      logoutRow[idx.SessionToken] = '';
      logoutRow[idx.SessionExpiry] = '';
      sheet.getRange(user.rowIndex, 1, 1, logoutRow.length).setValues([logoutRow]);
    }
    return { success: true };
  } catch (err) { return { success: false, message: err.message }; }
}
function getSessionUser(sessionToken) {
  const user = requireSession_(sessionToken);
  if (!user) return { success: false };
  return { success: true, user: { userId: user.UserID, fullName: user.FullName, email: user.Email, role: user.Role } };
}
function registerAccount(payload) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sedang sibuk, coba lagi.' }; }
  try {
    payload = payload || {};
    const config = getConfig_();
    if (String(config.ALLOW_SELF_REGISTER).toUpperCase() === 'FALSE') {
      return { success: false, message: 'Pendaftaran mandiri sedang dinonaktifkan.' };
    }
    if (!payload.fullName || !payload.email || !payload.password) return { success: false, message: 'Nama, email, password wajib diisi.' };
    if (payload.password.length < 8) return { success: false, message: 'Password minimal 8 karakter.' };
    if (SELF_REGISTER_ROLES.indexOf(payload.role) === -1) return { success: false, message: 'Role tidak valid untuk pendaftaran mandiri.' };
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.USERS);
    if (findUserByEmail_(sheet, payload.email)) return { success: false, message: 'Email ini sudah terdaftar.' };
    const salt = generateSalt_();
    const hash = hashPassword_(payload.password, salt);
    const userId = Utilities.getUuid();
    sheet.appendRow([
      userId, payload.fullName, payload.email.toLowerCase().trim(), hash, salt, payload.role,
      USER_STATUS.PENDING, new Date(), payload.email.toLowerCase().trim(), 0, '', '', '', '', '', '', ''
    ]);
    return { success: true, message: 'Pendaftaran berhasil! Akun menunggu persetujuan Admin.' };
  } finally { lock.releaseLock(); }
}
function requestPasswordReset(email) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: true, message: 'Jika email terdaftar, tautan reset telah dikirim.' }; }
  try {
    const genericMsg = 'Jika email terdaftar dan aktif, tautan reset password telah dikirim.';
    if (!email) return { success: true, message: genericMsg };
    const cache = CacheService.getScriptCache();
    const cacheKey = 'pwreset_' + String(email).toLowerCase().trim();
    if (cache.get(cacheKey)) return { success: true, message: genericMsg };
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.USERS);
    const user = findUserByEmail_(sheet, email);
    if (user && user.Status === USER_STATUS.ACTIVE) {
      const idx = usersIdx_();
      const token = Utilities.getUuid();
      const expiry = new Date(Date.now() + 60 * 60000);
      // Batch update — 1 round-trip instead of 2
      var resetRow = sheet.getRange(user.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
      resetRow[idx.ResetToken] = token;
      resetRow[idx.ResetTokenExpiry] = expiry;
      sheet.getRange(user.rowIndex, 1, 1, resetRow.length).setValues([resetRow]);
      const baseUrl = getWebAppUrl_(getConfig_());
      if (baseUrl) {
        const resetUrl = baseUrl + '?action=reset-password&uid=' + encodeURIComponent(user.UserID) + '&token=' + encodeURIComponent(token);
        MailApp.sendEmail({
          to: user.Email,
          subject: '[QC-CMS] Permintaan Reset Password',
          htmlBody: '<div style="font-family:Arial,sans-serif;color:#1a2332;max-width:480px;"><h2>Reset Password QC-CMS</h2><p>Kami menerima permintaan reset password. Klik tombol di bawah (berlaku 1 jam).</p><p><a href="' + resetUrl + '" style="background-color:#e8720c;color:#fff;padding:10px 22px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Buat Password Baru</a></p><p style="color:#6b7280;font-size:12px;margin-top:16px;">Jika Anda tidak meminta ini, abaikan email ini.</p></div>'
        });
      }
    }
    const cooldownMinutes = parseInt(getConfig_().PASSWORD_RESET_COOLDOWN_MINUTES, 10) || 5;
    cache.put(cacheKey, '1', Math.min(cooldownMinutes * 60, 21600));
    return { success: true, message: genericMsg };
  } finally { lock.releaseLock(); }
}
function requireSession_(sessionToken) {
  if (!sessionToken) return null;
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.USERS);
  const user = findUserBySessionToken_(sheet, sessionToken);
  if (!user) return null;
  if (user.Status !== USER_STATUS.ACTIVE) return null;
  if (!user.SessionExpiry || new Date(user.SessionExpiry) < new Date()) return null;
  return user;
}
function requireRole_(sessionToken, allowedRoles) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
  if (allowedRoles && allowedRoles.indexOf(user.Role) === -1) throw new Error('Anda tidak memiliki izin untuk aksi ini.');
  return user;
}
function canUserApprove_(user) {
  if (!user) return false;
  if (user.Role === ROLES.ADMIN || user.Role === ROLES.MANAGER) return true;
  return parseBool_(user.CanApprove, false) === true;
}
function requireApprover_(sessionToken) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  if (!canUserApprove_(user)) throw new Error('Anda tidak memiliki izin untuk aksi ini.');
  return user;
}
function parseBool_(val, defaultVal) {
  if (val === '' || val === null || val === undefined) return defaultVal;
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toLowerCase();
  if (s === 'true' || s === 'ya' || s === 'yes' || s === '1') return true;
  if (s === 'false' || s === 'tidak' || s === 'no' || s === '0') return false;
  return defaultVal;
}
// ============================================================================
// 5. MANAJEMEN USER
// ============================================================================
function createUser(sessionToken, payload) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sedang sibuk.' }; }
  try {
    payload = payload || {};
    if (!payload.fullName || !payload.email || !payload.password || !payload.role) return { success: false, message: 'Semua field wajib diisi.' };
    if (payload.password.length < 8) return { success: false, message: 'Password minimal 8 karakter.' };
    if (ALL_ROLES.indexOf(payload.role) === -1) return { success: false, message: 'Role tidak valid.' };
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.USERS);
    if (findUserByEmail_(sheet, payload.email)) return { success: false, message: 'Email ini sudah terdaftar.' };
    const salt = generateSalt_();
    const hash = hashPassword_(payload.password, salt);
    const userId = Utilities.getUuid();
    sheet.appendRow([
      userId, payload.fullName, payload.email.toLowerCase().trim(), hash, salt, payload.role,
      USER_STATUS.ACTIVE, new Date(), actor.Email, 0, '', '', '', '', '', '', ''
    ]);
    logAudit_(actor, 'createUser', 'User', userId, payload.fullName + ' <' + payload.email + '> (' + payload.role + ')');
    return { success: true, message: 'Akun ' + payload.fullName + ' (' + payload.role + ') berhasil dibuat.' };
  } finally { lock.releaseLock(); }
}
function getUserList(sessionToken) {
  requireRole_(sessionToken, [ROLES.ADMIN]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.USERS);
  const data = sheet.getDataRange().getValues();
  const idx = usersIdx_();
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    results.push({
      userId: row[idx.UserID], fullName: row[idx.FullName], email: row[idx.Email],
      role: row[idx.Role], status: row[idx.Status],
      createdAt: row[idx.CreatedAt] ? new Date(row[idx.CreatedAt]).toISOString() : '',
      lastLoginAt: row[idx.LastLoginAt] ? new Date(row[idx.LastLoginAt]).toISOString() : '',
      canApprove: canUserApprove_({ Role: row[idx.Role], CanApprove: row[idx.CanApprove] })
    });
  }
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return results;
}
function updateUser(sessionToken, userId, patch) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  patch = patch || {};
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.USERS);
  ensureHeader_(sheet, USERS_HEADER);
  const user = findUserById_(sheet, userId);
  if (!user) return { success: false, message: 'User tidak ditemukan.' };

  // Proteksi anti-self-lockout: Admin tidak dapat menonaktifkan atau menurunkan role akunnya sendiri yang sedang aktif
  if (user.Email && actor.Email && String(user.Email).toLowerCase().trim() === String(actor.Email).toLowerCase().trim()) {
    if (patch.status && patch.status !== USER_STATUS.ACTIVE) {
      return { success: false, message: 'Anda tidak dapat menonaktifkan akun Admin Anda sendiri yang sedang aktif.' };
    }
    if (patch.role && patch.role !== ROLES.ADMIN) {
      return { success: false, message: 'Anda tidak dapat menurunkan role akun Admin Anda sendiri.' };
    }
  }
  const idx = usersIdx_();
  const changes = [];
  const rowData = sheet.getRange(user.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  let dirty = false;
  if (typeof patch.canApprove === 'boolean') {
    if (user.Role === ROLES.ADMIN || user.Role === ROLES.MANAGER) return { success: false, message: 'Role Admin/Manager sudah otomatis bisa approval.' };
    rowData[idx.CanApprove] = patch.canApprove;
    dirty = true;
    changes.push('bisa approval → ' + (patch.canApprove ? 'Ya' : 'Tidak'));
  }
  if (patch.status && [USER_STATUS.ACTIVE, USER_STATUS.PENDING, USER_STATUS.INACTIVE].indexOf(patch.status) !== -1) {
    rowData[idx.Status] = patch.status;
    dirty = true;
    changes.push('status → ' + patch.status);
    if (patch.status !== USER_STATUS.ACTIVE) {
      rowData[idx.SessionToken] = '';
      rowData[idx.SessionExpiry] = '';
    }
  }
  if (patch.role && ALL_ROLES.indexOf(patch.role) !== -1) {
    rowData[idx.Role] = patch.role;
    dirty = true;
    changes.push('role → ' + patch.role);
  }
  if (patch.newPassword) {
    if (patch.newPassword.length < 8) return { success: false, message: 'Password baru minimal 8 karakter.' };
    const salt = generateSalt_();
    const hash = hashPassword_(patch.newPassword, salt);
    rowData[idx.PasswordHash] = hash;
    rowData[idx.Salt] = salt;
    dirty = true;
    changes.push('password direset');
  }
  if (dirty) {
    sheet.getRange(user.rowIndex, 1, 1, rowData.length).setValues([rowData]);
  }
  logAudit_(actor, 'updateUser', 'User', userId, user.FullName + ' <' + user.Email + '>: ' + (changes.join(', ') || 'tidak ada perubahan'));
  return { success: true, message: 'Akun berhasil diperbarui.' };
}
// ============================================================================
// 5b. MANAJEMEN APPROVAL
// ============================================================================
function getApproverCandidates(sessionToken) {
  requireRole_(sessionToken, [ROLES.ADMIN]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.USERS);
  const data = sheet.getDataRange().getValues();
  const idx = usersIdx_();
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[idx.Status] !== USER_STATUS.ACTIVE) continue;
    if (canUserApprove_({ Role: row[idx.Role], CanApprove: row[idx.CanApprove] })) {
      results.push({ email: row[idx.Email], fullName: row[idx.FullName], role: row[idx.Role] });
    }
  }
  results.sort((a, b) => a.fullName.localeCompare(b.fullName));
  return results;
}
function getApprovalRules(sessionToken) {
  requireRole_(sessionToken, [ROLES.ADMIN]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.APPROVERS);
  ensureHeader_(sheet, APPROVERS_HEADER);
  const data = sheet.getDataRange().getValues();
  const results = [];
  if (data.length > 1) {
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);
    const projectNameMap = {};
    getActiveProjects_().forEach(p => { projectNameMap[p.code] = p.name; });
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[idx.ProjectCode] || !row[idx.DocumentType]) continue;
      const pc = row[idx.ProjectCode];
      results.push({
        projectCode: pc,
        projectName: pc === 'ALL' ? 'Semua Proyek' : (projectNameMap[pc] || pc),
        documentType: row[idx.DocumentType],
        approverEmail: row[idx.ApproverEmail] || '',
        approverName: row[idx.ApproverName] || '',
        requireApproval: parseBool_(row[idx.RequireApproval], true)
      });
    }
  }
  results.sort((a, b) => (a.projectCode + a.documentType).localeCompare(b.projectCode + b.documentType));
  return results;
}
function saveApprovalRule(sessionToken, rule) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  rule = rule || {};
  const projectCode = String(rule.projectCode || '').trim();
  const documentType = String(rule.documentType || '').trim();
  const requireApproval = !!rule.requireApproval;
  const approverEmailInput = String(rule.approverEmail || '').trim().toLowerCase();
  if (!projectCode || !documentType) return { success: false, message: 'Proyek dan jenis dokumen wajib dipilih.' };
  if (projectCode !== 'ALL' && getActiveProjects_().map(p => p.code).indexOf(projectCode) === -1) return { success: false, message: 'Kode proyek tidak valid.' };
  if (documentType !== 'ALL' && getDocTypesCodes_().indexOf(documentType) === -1) return { success: false, message: 'Jenis dokumen tidak valid.' };
  let approverEmail = '';
  let approverName = '';
  if (requireApproval) {
    if (!approverEmailInput) return { success: false, message: 'Pilih approver untuk aturan yang memerlukan approval.' };
    const usersSheet = getSS_().getSheetByName(SHEET.USERS);
    const approverUser = findUserByEmail_(usersSheet, approverEmailInput);
    if (!approverUser) return { success: false, message: 'Approver tidak ditemukan.' };
    if (!canUserApprove_(approverUser)) return { success: false, message: 'User tersebut belum memiliki izin approval.' };
    approverEmail = approverUser.Email;
    approverName = approverUser.FullName;
  }
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sibuk.' }; }
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.APPROVERS);
    ensureHeader_(sheet, APPROVERS_HEADER);
    const data = sheet.getDataRange().getValues();
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);
    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idx.ProjectCode] === projectCode && data[i][idx.DocumentType] === documentType) { foundRow = i + 1; break; }
    }
    const rowValues = [];
    rowValues[idx.ProjectCode] = projectCode;
    rowValues[idx.DocumentType] = documentType;
    rowValues[idx.ApproverEmail] = approverEmail;
    rowValues[idx.ApproverName] = approverName;
    rowValues[idx.RequireApproval] = requireApproval;
    const targetRow = foundRow === -1 ? sheet.getLastRow() + 1 : foundRow;
    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    logAudit_(actor, 'saveApprovalRule', 'ApprovalRule', projectCode + '/' + documentType, 'Perlu approval: ' + (requireApproval ? 'Ya' : 'Tidak'));
    return { success: true, message: 'Aturan untuk ' + documentType + ' / ' + projectCode + ' berhasil disimpan.' };
  } finally { lock.releaseLock(); }
}
function deleteApprovalRule(sessionToken, projectCode, documentType) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.APPROVERS);
  const data = sheet.getDataRange().getValues();
  if (data.length > 1) {
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);
    for (let i = 1; i < data.length; i++) {
      if (data[i][idx.ProjectCode] === projectCode && data[i][idx.DocumentType] === documentType) {
        sheet.deleteRow(i + 1);
        logAudit_(actor, 'deleteApprovalRule', 'ApprovalRule', projectCode + '/' + documentType, 'Aturan dihapus');
        return { success: true, message: 'Aturan berhasil dihapus.' };
      }
    }
  }
  return { success: false, message: 'Aturan tidak ditemukan.' };
}
// ============================================================================
// 5c. PENOMORAN DOKUMEN
// ============================================================================
function buildDocumentCode_(template, ctx) {
  const pad = ctx.seqPadding || 3;
  const seqStr = String(ctx.seq).padStart(pad, '0');
  const now = ctx.date ? new Date(ctx.date) : new Date();
  const yyyy = String(now.getFullYear());
  return String(template || '{PROJECT}-{TYPE}-{SEQ}')
    .replace(/\{PROJECT\}/g, ctx.projectCode || '')
    .replace(/\{TYPE\}/g, ctx.docType || '')
    .replace(/\{DISC\}/g, ctx.discipline || '')
    .replace(/\{SEQ\}/g, seqStr)
    .replace(/\{YYYY\}/g, yyyy)
    .replace(/\{YY\}/g, yyyy.slice(-2))
    .replace(/\{MM\}/g, String(now.getMonth() + 1).padStart(2, '0'));
}
function findNumberingFormat_(projectCode) {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.NUMBERING);
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    if (data.length > 1) {
      const header = data[0];
      const idx = {};
      header.forEach((h, i) => idx[h] = i);
      const tryMatch = function (pc) {
        for (let i = 1; i < data.length; i++) {
          if (data[i][idx.ProjectCode] === pc) return data[i];
        }
        return null;
      };
      const row = tryMatch(projectCode) || tryMatch('ALL');
      if (row) return { format: row[idx.Format] || '{PROJECT}-{TYPE}-{SEQ}', seqPadding: parseInt(row[idx.SeqPadding], 10) || 3 };
    }
  }
  return { format: '{PROJECT}-{TYPE}-{SEQ}', seqPadding: 3 };
}
function displayDocCode_(obj) {
  if (obj.DocumentCode) return obj.DocumentCode;
  return obj.ProjectCode + '-' + obj.DocumentType + '-' + String(obj.DocumentNumber).padStart(3, '0');
}
function getNumberingRules(sessionToken) {
  requireRole_(sessionToken, [ROLES.ADMIN]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.NUMBERING);
  ensureHeader_(sheet, NUMBERING_HEADER);
  const data = sheet.getDataRange().getValues();
  const results = [];
  if (data.length > 1) {
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);
    const projectNameMap = {};
    getActiveProjects_().forEach(p => { projectNameMap[p.code] = p.name; });
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[idx.ProjectCode]) continue;
      const pc = row[idx.ProjectCode];
      results.push({
        projectCode: pc,
        projectName: pc === 'ALL' ? 'Semua Proyek (default)' : (projectNameMap[pc] || pc),
        format: row[idx.Format] || '{PROJECT}-{TYPE}-{SEQ}',
        seqPadding: parseInt(row[idx.SeqPadding], 10) || 3
      });
    }
  }
  results.sort((a, b) => (a.projectCode === 'ALL' ? '' : a.projectCode).localeCompare(b.projectCode === 'ALL' ? '' : b.projectCode));
  return results;
}
function saveNumberingRule(sessionToken, rule) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  rule = rule || {};
  const projectCode = String(rule.projectCode || '').trim();
  const format = String(rule.format || '').trim();
  const seqPadding = parseInt(rule.seqPadding, 10) || 3;
  if (!projectCode) return { success: false, message: 'Proyek wajib dipilih.' };
  if (projectCode !== 'ALL' && getActiveProjects_().map(p => p.code).indexOf(projectCode) === -1) return { success: false, message: 'Kode proyek tidak valid.' };
  if (!format) return { success: false, message: 'Format penomoran wajib diisi.' };
  if (!/\{SEQ\}/.test(format)) return { success: false, message: 'Format wajib mengandung {SEQ}.' };
  if (seqPadding < 1 || seqPadding > 8) return { success: false, message: 'Digit nomor urut harus 1-8.' };
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sibuk.' }; }
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.NUMBERING);
    ensureHeader_(sheet, NUMBERING_HEADER);
    const data = sheet.getDataRange().getValues();
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);
    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idx.ProjectCode] === projectCode) { foundRow = i + 1; break; }
    }
    const rowValues = [];
    rowValues[idx.ProjectCode] = projectCode;
    rowValues[idx.Format] = format;
    rowValues[idx.SeqPadding] = seqPadding;
    const targetRow = foundRow === -1 ? sheet.getLastRow() + 1 : foundRow;
    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    logAudit_(actor, 'saveNumberingRule', 'NumberingRule', projectCode, 'Format: ' + format);
    return { success: true, message: 'Aturan penomoran untuk ' + (projectCode === 'ALL' ? 'Semua Proyek' : projectCode) + ' berhasil disimpan.' };
  } finally { lock.releaseLock(); }
}
function deleteNumberingRule(sessionToken, projectCode) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.NUMBERING);
  const data = sheet.getDataRange().getValues();
  if (data.length > 1) {
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);
    for (let i = 1; i < data.length; i++) {
      if (data[i][idx.ProjectCode] === projectCode) {
        sheet.deleteRow(i + 1);
        logAudit_(actor, 'deleteNumberingRule', 'NumberingRule', projectCode, 'Aturan dihapus');
        return { success: true, message: 'Aturan berhasil dihapus.' };
      }
    }
  }
  return { success: false, message: 'Aturan tidak ditemukan.' };
}
// ============================================================================
// 6. DOCUMENT API
// ============================================================================
function getInitData(sessionToken) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const config = getConfig_();
  const tzCheck = checkTimezoneConfig_(true);
  return {
    success: true,
    projects: getActiveProjects_() || [],
    disciplines: getDisciplinesList_() || [],
    documentTypes: getDocTypesCodes_() || [],
    documentTypesFull: getDocTypesFull_() || [],
    inspectionResults: INSPECTION_RESULTS || [],
    siteStatusOptions: SITE_STATUS_OPTIONS || [],
    companyName: (config && config.COMPANY_NAME) || 'PT Asuka Engineering Indonesia',
    rootFolderConfigured: !!(config && config.ROOT_FOLDER_ID),
    role: user.Role,
    fullName: user.FullName,
    canUpload: UPLOADER_ROLES.indexOf(user.Role) !== -1,
    canApprove: canUserApprove_(user),
    canViewReports: VIEW_ALL_ROLES.indexOf(user.Role) !== -1,
    isAdmin: user.Role === ROLES.ADMIN,
    unreadNotificationCount: countUnreadNotifications_(user.Email),
    tzWarning: tzCheck.ok ? '' : ('Timezone project (' + tzCheck.actual + ') tidak sesuai konfigurasi (' + tzCheck.expected + ').'),
    confidentialityLevels: CONFIDENTIALITY_LEVELS || [],
    transmittalPurposes: TRANSMITTAL_PURPOSES || [],
    lifecycleStages: [LIFECYCLE.DRAFT, LIFECYCLE.IN_REVIEW, LIFECYCLE.APPROVED, LIFECYCLE.SUPERSEDED, LIFECYCLE.ARCHIVED, LIFECYCLE.OBSOLETE],
    canCreateTransmittal: [ROLES.ADMIN, ROLES.MANAGER, ROLES.QC_ENGINEER].indexOf(user.Role) !== -1,
    canArchive: user.Role === ROLES.ADMIN || user.Role === ROLES.MANAGER,
    defaultRetentionYears: parseInt((config && config.DEFAULT_RETENTION_YEARS), 10) || 5,
    nfiTypeOfInspection: getNFITypeList_() || [],
    nfiResultOptions: NFI_RESULT_OPTIONS || [],
    nfiStatusOptions: NFI_STATUS_OPTIONS || [],
    canManageNfi: UPLOADER_ROLES.indexOf(user.Role) !== -1,
  };
}
function getExistingDocumentsForRevision(sessionToken, projectCode, documentType) {
  requireRole_(sessionToken, UPLOADER_ROLES);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const data = sheet.getDataRange().getValues();
  const results = [];
  if (data.length > 1) {
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[idx.ProjectCode] === projectCode && row[idx.DocumentType] === documentType && row[idx.IsLatestRevision] === true) {
        if (row[idx.LifecycleStage] === LIFECYCLE.ARCHIVED || row[idx.LifecycleStage] === LIFECYCLE.OBSOLETE) continue;
        results.push({
          docId: row[idx.DocID],
          documentNumber: row[idx.DocumentNumber],
          documentCode: displayDocCode_({ DocumentCode: row[idx.DocumentCode], ProjectCode: row[idx.ProjectCode], DocumentType: row[idx.DocumentType], DocumentNumber: row[idx.DocumentNumber] }),
          revision: row[idx.Revision],
          title: row[idx.Title],
          status: row[idx.Status]
        });
      }
    }
  }
  return results;
}
function submitDocument(sessionToken, payload) {
  const user = requireRole_(sessionToken, UPLOADER_ROLES);
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (lockErr) { return { success: false, message: 'Sistem sedang sibuk memproses unggahan lain.' }; }
  try {
    payload = payload || {};
    const required = ['projectCode', 'discipline', 'documentType', 'title'];
    for (let k = 0; k < required.length; k++) {
      if (!payload[required[k]]) return { success: false, message: 'Field wajib belum diisi: ' + required[k] };
    }
    if (getDocTypesCodes_().indexOf(payload.documentType) === -1) return { success: false, message: 'Jenis dokumen tidak valid.' };
    if (!payload.files || !payload.files.length) return { success: false, message: 'Pilih minimal 1 file dokumen.' };
    if (payload.files.length > MAX_FILES_PER_UPLOAD) return { success: false, message: 'Maksimal ' + MAX_FILES_PER_UPLOAD + ' file per unggahan.' };
    const config = getConfig_();
    if (!config.ROOT_FOLDER_ID) return { success: false, message: 'ROOT_FOLDER_ID belum diisi di tab Config.' };
    const decodedFiles = [];
    for (let f = 0; f < payload.files.length; f++) {
      const fileObj = payload.files[f];
      if (!fileObj.fileName || !fileObj.base64Data) return { success: false, message: 'Data file tidak lengkap.' };
      if (ALLOWED_DOC_EXTENSIONS.indexOf(getFileExtension_(fileObj.fileName).toLowerCase()) === -1) {
        return { success: false, message: 'Tipe file "' + fileObj.fileName + '" tidak diizinkan.' };
      }
      const cleanBase64 = fileObj.base64Data.indexOf(',') !== -1 ? fileObj.base64Data.split(',')[1] : fileObj.base64Data;
      const bytes = Utilities.base64Decode(cleanBase64);
      if (bytes.length > MAX_FILE_SIZE_BYTES) return { success: false, message: 'File "' + fileObj.fileName + '" melebihi batas 15MB.' };
      decodedFiles.push({ fileName: fileObj.fileName, mimeType: fileObj.mimeType || 'application/octet-stream', bytes: bytes });
    }
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
    const projectSheet = ss.getSheetByName(SHEET.PROJECTS);
    const projectRow = findProjectByCode_(projectSheet, payload.projectCode);
    const projectName = projectRow ? projectRow.ProjectName : payload.projectCode;
    let documentNumber, revision, documentCode;
    let previousRowsToSupersede = [];
    const numRule = findNumberingFormat_(payload.projectCode);
    if (payload.isRevision && payload.existingDocId) {
      const existing = findDocumentById_(sheet, payload.existingDocId);
      if (!existing) return { success: false, message: 'Dokumen yang ingin direvisi tidak ditemukan.' };
      documentNumber = existing.DocumentNumber;
      documentCode = existing.DocumentCode || buildDocumentCode_(numRule.format, {
        projectCode: payload.projectCode, docType: payload.documentType, discipline: payload.discipline,
        seq: documentNumber, seqPadding: numRule.seqPadding, date: existing.Timestamp
      });
      revision = getNextRevisionNumber_(sheet, payload.projectCode, payload.documentType, documentNumber);
      previousRowsToSupersede = findLatestRows_(sheet, payload.projectCode, payload.documentType, documentNumber);
    } else {
      documentNumber = getNextDocumentNumber_(sheet, payload.projectCode, payload.documentType);
      documentCode = buildDocumentCode_(numRule.format, {
        projectCode: payload.projectCode, docType: payload.documentType, discipline: payload.discipline,
        seq: documentNumber, seqPadding: numRule.seqPadding, date: new Date()
      });
      revision = 0;
    }
    const folder = getOrCreateFolderPath_(config.ROOT_FOLDER_ID, [projectName, payload.discipline, payload.documentType]);
    const primaryExt = getFileExtension_(decodedFiles[0].fileName);
    const standardFileName = buildFileName_(documentCode, revision, primaryExt);
    const primaryFile = createFileInFolder_(folder, standardFileName, decodedFiles[0].bytes, decodedFiles[0].mimeType);
    const additionalUrls = [];
    for (let f = 1; f < decodedFiles.length; f++) {
      const extra = decodedFiles[f];
      const extraExt = getFileExtension_(extra.fileName);
      const extraBaseName = buildFileName_(documentCode, revision, '').replace(/\.$/, '');
      const extraName = extraBaseName + '-lampiran' + f + (extraExt ? '.' + extraExt : '');
      const extraFile = createFileInFolder_(folder, extraName, extra.bytes, extra.mimeType);
      additionalUrls.push(extraFile.getUrl());
    }
    if (previousRowsToSupersede.length > 0) {
      const isLatestIdx = DOCUMENTS_HEADER.indexOf('IsLatestRevision');
      const statusIdx = DOCUMENTS_HEADER.indexOf('Status');
      const lcIdx = DOCUMENTS_HEADER.indexOf('LifecycleStage');
      previousRowsToSupersede.forEach(r => {
        const rowData = sheet.getRange(r.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
        rowData[isLatestIdx] = false;
        if (r.Status === STATUS.APPROVED) {
          rowData[statusIdx] = STATUS.SUPERSEDED;
          if (lcIdx !== -1) rowData[lcIdx] = LIFECYCLE.SUPERSEDED;
        }
        sheet.getRange(r.rowIndex, 1, 1, rowData.length).setValues([rowData]);
      });
    }
    const approvalRule = findApprovalRule_(payload.projectCode, payload.documentType, config);
    const requireApproval = approvalRule.requireApproval;
    const approverEmail = approvalRule.approverEmail;
    let slaDueDate = '';
    if (payload.documentType === 'RFI') {
      const slaDays = parseInt(config.SLA_DAYS_RFI, 10) || 7;
      slaDueDate = addBusinessDays_(new Date(), slaDays);
    }
    const fileHash = computeFileHash_(decodedFiles[0].bytes);
    const duplicate = findDuplicateDocument_(sheet, payload.projectCode, payload.documentType, fileHash, DUPLICATE_CHECK_WINDOW_DAYS);
    const docId = Utilities.getUuid();
    const tokenValidDays = parseInt(config.APPROVAL_TOKEN_VALID_DAYS, 10) || 30;
    const tokenExpiry = Date.now() + tokenValidDays * 86400000;
    const token = buildApprovalToken_(docId, config.TOKEN_SECRET, tokenExpiry);
    const initialStatus = requireApproval ? STATUS.PENDING : STATUS.APPROVED;
    const initialLifecycle = requireApproval ? LIFECYCLE.IN_REVIEW : LIFECYCLE.APPROVED;
    const initialApproverEmail = requireApproval ? approverEmail : '';
    const initialApproverName = requireApproval ? '' : 'Sistem (Tidak Memerlukan Approval)';
    const initialApprovalDate = requireApproval ? '' : new Date();
    const confidentialityVal = CONFIDENTIALITY_LEVELS.indexOf(payload.confidentiality) !== -1 ? payload.confidentiality : 'Internal';
    const newRow = [
      docId, new Date(), payload.projectCode, projectName, payload.discipline,
      payload.documentType, documentNumber, revision, sanitizeForSheet_(payload.title), sanitizeForSheet_(payload.standardRef || ''),
      standardFileName, primaryFile.getUrl(), primaryFile.getId(), user.FullName, user.Email,
      initialStatus, initialApproverEmail, initialApproverName, initialApprovalDate, '',
      slaDueDate, payload.inspectionResult || '', true, token, false,
      additionalUrls.join('\n'), fileHash, tokenExpiry, documentCode,
      sanitizeForSheet_(payload.keywords || ''),
      sanitizeForSheet_(payload.description || ''),
      confidentialityVal,
      initialLifecycle,
      sanitizeForSheet_(payload.referenceNumber || ''),
      (payload.relatedDocIds || []).join(','),
      payload.supersedesDocId || '',
      '', '', '', ''
    ];
    sheet.appendRow(newRow);
    logAudit_(user, 'submitDocument', 'Document', docId,
      standardFileName + ' (' + payload.documentType + ', proyek ' + payload.projectCode + ')' +
      (requireApproval ? '' : ' — otomatis disetujui') +
      (duplicate ? ' — kemungkinan duplikat dari ' + duplicate.fileName : ''));
    if (requireApproval) {
      if (approverEmail) {
        sendApprovalEmail_({
          approverEmail: approverEmail, docId: docId, token: token, tokenExpiry: tokenExpiry, projectName: projectName,
          documentType: payload.documentType, documentCode: documentCode, revision: revision,
          title: payload.title, fileUrl: primaryFile.getUrl(), uploaderName: user.FullName, config: config
        });
        notify_(approverEmail, 'approval_needed',
          'Dokumen "' + payload.title + '" (' + payload.documentType + ', ' + projectName + ') menunggu persetujuan Anda.',
          'Document', docId);
      } else {
        notifyAdminsNoApprover_(projectName, config, payload.title);
      }
    }
    return {
      success: true,
      message: 'Dokumen berhasil diunggah sebagai ' + standardFileName +
        (decodedFiles.length > 1 ? ' (+ ' + (decodedFiles.length - 1) + ' lampiran)' : '') +
        (!requireApproval ? '. Kombinasi ini tidak memerlukan approval — dokumen langsung Approved.'
          : (approverEmail ? '. Notifikasi dikirim ke approver (' + approverEmail + ').'
                            : '. PERHATIAN: tidak ada approver — Admin sudah diberi tahu.')) +
        (duplicate ? ' ⚠️ Catatan: file ini tampak sama dengan dokumen yang sudah ada (' + duplicate.fileName + ').' : ''),
      fileUrl: primaryFile.getUrl(),
      fileName: standardFileName,
      duplicateWarning: duplicate ? true : false
    };
  } catch (err) {
    return { success: false, message: 'Terjadi kesalahan: ' + err.message };
  } finally { lock.releaseLock(); }
}
function queryDocuments_(user, filters) {
  filters = filters || {};
  const onlyLatest = filters.onlyLatest !== false;
  const canViewAll = VIEW_ALL_ROLES.indexOf(user.Role) !== -1;
  const searchQuery = filters.search ? String(filters.search).toLowerCase().trim() : '';
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[idx.Status] === STATUS.DELETED) continue;
    if (filters.excludeArchived !== false && (row[idx.LifecycleStage] === LIFECYCLE.ARCHIVED || row[idx.LifecycleStage] === LIFECYCLE.OBSOLETE)) continue;
    if (onlyLatest && row[idx.IsLatestRevision] !== true) continue;
    if (!canViewAll && row[idx.UploaderEmail] !== user.Email) continue;
    if (filters.projectCode && row[idx.ProjectCode] !== filters.projectCode) continue;
    if (filters.documentType && row[idx.DocumentType] !== filters.documentType) continue;
    if (filters.status && row[idx.Status] !== filters.status) continue;
    if (filters.lifecycle && row[idx.LifecycleStage] !== filters.lifecycle) continue;
    if (filters.confidentiality && row[idx.Confidentiality] !== filters.confidentiality) continue;
    if (searchQuery) {
      const hay = [
        row[idx.Title], row[idx.FileName], row[idx.DocumentNumber], row[idx.DocumentCode], row[idx.Discipline],
        row[idx.ProjectCode], row[idx.ProjectName], row[idx.StandardRef], row[idx.UploaderName],
        row[idx.Keywords], row[idx.Description], row[idx.ReferenceNumber]
      ].filter(Boolean).join(' ').toLowerCase();
      if (hay.indexOf(searchQuery) === -1) continue;
    }
    const uploaderEmail = row[idx.UploaderEmail];
    const status = row[idx.Status];
    const additionalRaw = row[idx.AdditionalFileURLs];
    const lcStage = row[idx.LifecycleStage] || (status === STATUS.PENDING ? LIFECYCLE.IN_REVIEW : status);
    results.push({
      docId: row[idx.DocID],
      timestamp: row[idx.Timestamp] ? new Date(row[idx.Timestamp]).toISOString() : '',
      projectCode: row[idx.ProjectCode],
      projectName: row[idx.ProjectName],
      discipline: row[idx.Discipline],
      documentType: row[idx.DocumentType],
      documentNumber: row[idx.DocumentNumber],
      documentCode: displayDocCode_({ DocumentCode: row[idx.DocumentCode], ProjectCode: row[idx.ProjectCode], DocumentType: row[idx.DocumentType], DocumentNumber: row[idx.DocumentNumber] }),
      revision: row[idx.Revision],
      title: row[idx.Title],
      standardRef: row[idx.StandardRef],
      fileName: row[idx.FileName],
      fileUrl: row[idx.FileURL],
      additionalFileUrls: additionalRaw ? String(additionalRaw).split('\n').filter(Boolean) : [],
      uploaderName: row[idx.UploaderName],
      uploaderEmail: uploaderEmail,
      status: status,
      lifecycleStage: lcStage,
      confidentiality: row[idx.Confidentiality] || 'Internal',
      keywords: row[idx.Keywords] || '',
      description: row[idx.Description] || '',
      referenceNumber: row[idx.ReferenceNumber] || '',
      relatedDocIds: row[idx.RelatedDocIds] ? String(row[idx.RelatedDocIds]).split(',').filter(Boolean) : [],
      supersedesDocId: row[idx.SupersedesDocId] || '',
      approverEmail: row[idx.ApproverEmail],
      approvalDate: row[idx.ApprovalDate] ? new Date(row[idx.ApprovalDate]).toISOString() : '',
      comments: row[idx.Comments],
      slaDueDate: row[idx.SLADueDate] ? new Date(row[idx.SLADueDate]).toISOString() : '',
      inspectionResult: row[idx.InspectionResult],
      archivedDate: row[idx.ArchivedDate] ? new Date(row[idx.ArchivedDate]).toISOString() : '',
      retentionUntil: row[idx.RetentionUntil] ? new Date(row[idx.RetentionUntil]).toISOString() : '',
      checkedOutBy: row[idx.CheckedOutBy] || '',
      canEdit: (user.Role === ROLES.ADMIN || user.Role === ROLES.MANAGER) || (uploaderEmail === user.Email && status === STATUS.PENDING)
    });
  }
  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return results;
}
function getDocumentList(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  return queryDocuments_(user, filters).slice(0, 300);
}
function exportDocumentListExcel(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  try {
    const documents = queryDocuments_(user, filters || {});
    if (!documents.length) return { success: false, message: 'Tidak ada dokumen yang cocok dengan filter.' };
    const config = getConfig_();
    const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
    const now = new Date();
    const fileBaseName = 'Daftar-Dokumen-' + Utilities.formatDate(now, tz, 'yyyyMMdd-HHmm');
    const filterSummary = describeDocumentFilters_(filters || {});
    const blob = buildDocumentListXlsx_(documents, {
      companyName: config.COMPANY_NAME || 'PT Asuka Engineering Indonesia',
      generatedBy: user.FullName + ' (' + user.Role + ')',
      generatedAt: formatIndonesianDate_(now, tz),
      fileBaseName: fileBaseName,
      filterSummary: filterSummary
    });
    let driveUrl = '';
    try {
      const reportsFolder = getOrCreateFolderPath_(config.ROOT_FOLDER_ID, ['Reports', 'Daftar Dokumen']);
      driveUrl = reportsFolder.createFile(blob).getUrl();
    } catch (e) { /* lanjut tanpa arsip Drive */ }
    logAudit_(user, 'exportDocumentListExcel', 'Document', '', documents.length + ' dokumen \u2014 ' + filterSummary);
    return { success: true, base64: Utilities.base64Encode(blob.getBytes()), fileName: blob.getName(), driveUrl: driveUrl, count: documents.length };
  } catch (err) {
    return { success: false, message: 'Gagal membuat file Excel: ' + err.message };
  }
}
function describeDocumentFilters_(filters) {
  const parts = [];
  parts.push(filters.projectCode ? ('Proyek: ' + filters.projectCode) : 'Semua Proyek');
  parts.push(filters.documentType ? ('Jenis: ' + filters.documentType) : 'Semua Jenis');
  if (filters.status) parts.push('Status: ' + filters.status);
  if (filters.lifecycle) parts.push('Lifecycle: ' + filters.lifecycle);
  if (filters.confidentiality) parts.push('Kerahasiaan: ' + filters.confidentiality);
  if (filters.search) parts.push('Kata kunci: "' + filters.search + '"');
  parts.push((filters.onlyLatest !== false) ? 'Hanya revisi terbaru' : 'Semua revisi');
  return parts.join(' | ');
}
function buildDocumentListXlsx_(documents, meta) {
  const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
  const tempSs = SpreadsheetApp.create(meta.fileBaseName);
  const sheet = tempSs.getSheets()[0];
  sheet.setName('Daftar Dokumen');
  const cols = ['No', 'Proyek', 'Disiplin', 'Jenis', 'No. Dokumen', 'Rev', 'Judul', 'Status', 'Lifecycle', 'Kerahasiaan', 'Diunggah Oleh', 'Tanggal Unggah', 'Approver', 'Tanggal Approval', 'Hasil Inspeksi', 'Catatan', 'Link File'];
    const headerRowIdx = buildXlsxHeader_(sheet, {
    totalCols: cols.length,
    lines: [
      meta.companyName,
      'DAFTAR DOKUMEN \u2014 QC-CMS EDMS',
      'Filter: ' + meta.filterSummary,
      'Diunduh: ' + meta.generatedAt + ' oleh ' + meta.generatedBy + ' \u2014 Total ' + documents.length + ' dokumen'
    ]
  });
  sheet.getRange(2, 1).setFontColor('#1a2332');
  sheet.getRange(headerRowIdx, 1, 1, cols.length).setValues([cols])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1a2332').setHorizontalAlignment('center');
  sheet.setFrozenRows(headerRowIdx);
  let r = headerRowIdx + 1;
  documents.forEach(function (d, i) {
    const uploadDate = d.timestamp ? Utilities.formatDate(new Date(d.timestamp), tz, 'dd/MM/yyyy HH:mm') : '-';
    const approvalDate = d.approvalDate ? Utilities.formatDate(new Date(d.approvalDate), tz, 'dd/MM/yyyy HH:mm') : '-';
    const values = [
      i + 1, d.projectName || d.projectCode, d.discipline, d.documentType, d.documentCode || d.documentNumber, d.revision,
      d.title, d.status, d.lifecycleStage || '-', d.confidentiality || '-', d.uploaderName, uploadDate, d.approverEmail || '-', approvalDate,
      d.inspectionResult || '-', d.comments || '-', d.fileUrl || '-'
    ];
    sheet.getRange(r, 1, 1, values.length).setValues([values]);
    const style = DOC_STATUS_STYLE[d.status];
    if (style) sheet.getRange(r, 8).setBackground(style.bg).setFontColor(style.text).setFontWeight('bold');
    r++;
  });
  const lastRow = r - 1;
  if (lastRow >= headerRowIdx) {
    const bodyRows = lastRow - headerRowIdx;
    sheet.getRange(headerRowIdx, 1, bodyRows + 1, cols.length)
      .setBorder(true, true, true, true, true, true, '#dbe2ea', SpreadsheetApp.BorderStyle.SOLID);
    sheet.getRange(headerRowIdx + 1, 1, bodyRows, cols.length).setVerticalAlignment('top');
    sheet.getRange(headerRowIdx + 1, 7, bodyRows, 1).setWrap(true);
    sheet.getRange(headerRowIdx + 1, 16, bodyRows, 1).setWrap(true);
  }
  const widths = [32, 130, 100, 60, 120, 40, 220, 90, 100, 100, 130, 110, 160, 110, 110, 200, 250];
  widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
  SpreadsheetApp.flush();
  const blob = exportGoogleFileAs_(tempSs.getId(), 'spreadsheets', 'xlsx').setName(meta.fileBaseName + '.xlsx');
  try { DriveApp.getFileById(tempSs.getId()).setTrashed(true); } catch (e) { /* abaikan */ }
  return blob;
}
function getRevisionHistory(sessionToken, docId) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const doc = findDocumentById_(sheet, docId);
  if (!doc) return { success: false, message: 'Dokumen tidak ditemukan.' };
  const canViewAll = VIEW_ALL_ROLES.indexOf(user.Role) !== -1;
  if (!canViewAll && doc.UploaderEmail !== user.Email) return { success: false, message: 'Anda tidak memiliki izin.' };
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const revisions = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[idx.ProjectCode] === doc.ProjectCode && row[idx.DocumentType] === doc.DocumentType && String(row[idx.DocumentNumber]) === String(doc.DocumentNumber)) {
      if (row[idx.Status] === STATUS.DELETED) continue;
      const additionalRaw = row[idx.AdditionalFileURLs];
      revisions.push({
        docId: row[idx.DocID],
        revision: row[idx.Revision],
        title: row[idx.Title],
        standardRef: row[idx.StandardRef],
        fileName: row[idx.FileName],
        fileUrl: row[idx.FileURL],
        additionalFileUrls: additionalRaw ? String(additionalRaw).split('\n').filter(Boolean) : [],
        status: row[idx.Status],
        lifecycleStage: row[idx.LifecycleStage] || row[idx.Status],
        uploaderName: row[idx.UploaderName],
        timestamp: row[idx.Timestamp] ? new Date(row[idx.Timestamp]).toISOString() : '',
        approverName: row[idx.ApproverName],
        approvalDate: row[idx.ApprovalDate] ? new Date(row[idx.ApprovalDate]).toISOString() : '',
        comments: row[idx.Comments],
        isLatestRevision: row[idx.IsLatestRevision] === true,
        canManage: (user.Role === ROLES.ADMIN) || (row[idx.UploaderEmail] === user.Email)
      });
    }
  }
  revisions.sort((a, b) => b.revision - a.revision);
  return {
    success: true,
    documentNumber: doc.DocumentNumber,
    documentCode: displayDocCode_(doc),
    documentType: doc.DocumentType,
    projectName: doc.ProjectName,
    revisions: revisions
  };
}
function updateDocumentMetadata(sessionToken, docId, payload) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  payload = payload || {};
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const doc = findDocumentById_(sheet, docId);
  if (!doc) return { success: false, message: 'Dokumen tidak ditemukan.' };
  const isOwner = doc.UploaderEmail === user.Email;
  const canEdit = (user.Role === ROLES.ADMIN || user.Role === ROLES.MANAGER) || (isOwner && doc.Status === STATUS.PENDING);
  if (!canEdit) return { success: false, message: 'Anda tidak memiliki izin mengedit dokumen ini.' };
  const idx = {};
  DOCUMENTS_HEADER.forEach((h, i) => idx[h] = i + 1);
  const changes = [];
  const rowData = sheet.getRange(doc.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  let dirty = false;
  if (payload.title) { rowData[idx.Title - 1] = sanitizeForSheet_(payload.title); dirty = true; changes.push('title'); }
  if (payload.standardRef !== undefined) { rowData[idx.StandardRef - 1] = sanitizeForSheet_(payload.standardRef); dirty = true; changes.push('standardRef'); }
  if (payload.discipline) { rowData[idx.Discipline - 1] = payload.discipline; dirty = true; changes.push('discipline'); }
  if (payload.inspectionResult !== undefined) { rowData[idx.InspectionResult - 1] = payload.inspectionResult; dirty = true; changes.push('inspectionResult'); }
  if (payload.keywords !== undefined) { rowData[idx.Keywords - 1] = sanitizeForSheet_(payload.keywords); dirty = true; changes.push('keywords'); }
  if (payload.description !== undefined) { rowData[idx.Description - 1] = sanitizeForSheet_(payload.description); dirty = true; changes.push('description'); }
  if (payload.confidentiality && CONFIDENTIALITY_LEVELS.indexOf(payload.confidentiality) !== -1) {
    rowData[idx.Confidentiality - 1] = payload.confidentiality; dirty = true; changes.push('confidentiality');
  }
  if (payload.referenceNumber !== undefined) { rowData[idx.ReferenceNumber - 1] = sanitizeForSheet_(payload.referenceNumber); dirty = true; changes.push('referenceNumber'); }
  if (payload.base64Data && payload.fileName) {
    if (ALLOWED_DOC_EXTENSIONS.indexOf(getFileExtension_(payload.fileName).toLowerCase()) === -1) {
      return { success: false, message: 'Tipe file tidak diizinkan.' };
    }
    const cleanBase64 = payload.base64Data.indexOf(',') !== -1 ? payload.base64Data.split(',')[1] : payload.base64Data;
    const bytes = Utilities.base64Decode(cleanBase64);
    if (bytes.length > MAX_FILE_SIZE_BYTES) return { success: false, message: 'Ukuran file melebihi batas 15MB.' };
    const ext = getFileExtension_(payload.fileName);
    const standardFileName = buildFileName_(displayDocCode_(doc), doc.Revision, ext);
    try { DriveApp.getFileById(doc.FileID).setTrashed(true); } catch (e) { Logger.log('Gagal trash file lama di updateDocumentMetadata: ' + e.message); }
    const config = getConfig_();
    const folder = getOrCreateFolderPath_(config.ROOT_FOLDER_ID, [doc.ProjectName, payload.discipline || doc.Discipline, doc.DocumentType]);
    const newFile = createFileInFolder_(folder, standardFileName, bytes, payload.mimeType);
    rowData[idx.FileName - 1] = standardFileName;
    rowData[idx.FileURL - 1] = newFile.getUrl();
    rowData[idx.FileID - 1] = newFile.getId();
    if (idx.FileHash) rowData[idx.FileHash - 1] = computeFileHash_(bytes);
    dirty = true;
    changes.push('file diganti (' + standardFileName + ')');
  }
  if (dirty) {
    sheet.getRange(doc.rowIndex, 1, 1, rowData.length).setValues([rowData]);
  }
  logAudit_(user, 'updateDocumentMetadata', 'Document', docId, changes.length ? changes.join(', ') : 'tidak ada perubahan');
  return { success: true, message: 'Dokumen berhasil diperbarui.' };
}
function deleteDocument(sessionToken, docId) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const doc = findDocumentById_(sheet, docId);
  if (!doc) return { success: false, message: 'Dokumen tidak ditemukan.' };
  const isOwner = doc.UploaderEmail === user.Email;
  const canDelete = (user.Role === ROLES.ADMIN || user.Role === ROLES.MANAGER) || (isOwner && doc.Status === STATUS.PENDING);
  if (!canDelete) return { success: false, message: 'Anda tidak memiliki izin menghapus dokumen ini.' };
  const idx = {};
  DOCUMENTS_HEADER.forEach((h, i) => idx[h] = i + 1);
  const wasLatest = doc.IsLatestRevision === true;
  const previousStatus = doc.Status;

  // Batch update baris dokumen terhapus (1 round-trip)
  const docRow = sheet.getRange(doc.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  docRow[idx.Status - 1] = STATUS.DELETED;
  docRow[idx.LifecycleStage - 1] = LIFECYCLE.DELETED;
  docRow[idx.IsLatestRevision - 1] = false;
  if (idx.DeletedAt) docRow[idx.DeletedAt - 1] = new Date();
  if (idx.DeletedFromStatus) docRow[idx.DeletedFromStatus - 1] = previousStatus;
  sheet.getRange(doc.rowIndex, 1, 1, docRow.length).setValues([docRow]);

  try { if (doc.FileID) DriveApp.getFileById(doc.FileID).setTrashed(true); } catch (e) { Logger.log('Gagal trash file Drive di deleteDocument: ' + e.message); }
  if (wasLatest) {
    const siblings = findAllRevisionRows_(sheet, doc.ProjectCode, doc.DocumentType, doc.DocumentNumber);
    const remaining = siblings.filter(r => r.rowIndex !== doc.rowIndex && r.Status !== STATUS.DELETED);
    if (remaining.length) {
      remaining.sort((a, b) => b.Revision - a.Revision);
      const restore = remaining[0];
      const restoreRow = sheet.getRange(restore.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
      restoreRow[idx.IsLatestRevision - 1] = true;
      if (restore.Status === STATUS.SUPERSEDED) {
        restoreRow[idx.Status - 1] = STATUS.APPROVED;
        restoreRow[idx.LifecycleStage - 1] = LIFECYCLE.APPROVED;
      }
      sheet.getRange(restore.rowIndex, 1, 1, restoreRow.length).setValues([restoreRow]);
    }
  }
  logAudit_(user, 'deleteDocument', 'Document', docId, doc.DocumentType + ' ' + displayDocCode_(doc) + ' Rev' + doc.Revision);
  return { success: true, message: 'Dokumen berhasil dihapus.' };
}
function getDashboardStats(sessionToken, projectCode) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const data = sheet.getDataRange().getValues();
  const empty = { totalPending: 0, totalApproved: 0, totalRejected: 0, rfiOverdueCount: 0, mrirPassRate: null, avgApprovalDays: null, pendingByProject: [], byType: [] };
  if (data.length <= 1) return empty;
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const now = new Date();
  const pendingByProject = {};
  const byType = {};
  const typeDecisionDays = {};
  let totalPending = 0, totalApproved = 0, totalRejected = 0, rfiOverdueCount = 0;
  let mrirTotal = 0, mrirPass = 0;
  let totalDecisionDays = 0, decisionCount = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (projectCode && row[idx.ProjectCode] !== projectCode) continue;
    const status = row[idx.Status];
    const type = row[idx.DocumentType];
    if ((status === STATUS.APPROVED || status === STATUS.REJECTED) && row[idx.Timestamp] && row[idx.ApprovalDate]) {
      const days = (new Date(row[idx.ApprovalDate]) - new Date(row[idx.Timestamp])) / 86400000;
      if (days >= 0) {
        totalDecisionDays += days; decisionCount++;
        if (!typeDecisionDays[type]) typeDecisionDays[type] = { sum: 0, count: 0 };
        typeDecisionDays[type].sum += days; typeDecisionDays[type].count++;
      }
    }
    if (row[idx.IsLatestRevision] !== true) continue;
    const project = row[idx.ProjectName];
    if (!byType[type]) byType[type] = { pending: 0, approved: 0, rejected: 0 };
    if (status === STATUS.PENDING) { totalPending++; byType[type].pending++; }
    else if (status === STATUS.APPROVED) { totalApproved++; byType[type].approved++; }
    else if (status === STATUS.REJECTED) { totalRejected++; byType[type].rejected++; }
    if (status === STATUS.PENDING && project) pendingByProject[project] = (pendingByProject[project] || 0) + 1;
    if (type === 'RFI' && status === STATUS.PENDING && row[idx.SLADueDate]) {
      if (new Date(row[idx.SLADueDate]) < now) rfiOverdueCount++;
    }
    if (type === 'MRIR' && row[idx.InspectionResult]) {
      mrirTotal++;
      if (row[idx.InspectionResult] === 'Lulus') mrirPass++;
    }
  }
  return {
    totalPending, totalApproved, totalRejected, rfiOverdueCount,
    mrirPassRate: mrirTotal > 0 ? Math.round((mrirPass / mrirTotal) * 100) : null,
    avgApprovalDays: decisionCount > 0 ? Math.round((totalDecisionDays / decisionCount) * 10) / 10 : null,
    pendingByProject: Object.keys(pendingByProject).map(k => ({ projectName: k, count: pendingByProject[k] })).sort((a, b) => b.count - a.count),
    byType: getDocTypesCodes_().map(t => ({
      type: t,
      pending: (byType[t] && byType[t].pending) || 0,
      approved: (byType[t] && byType[t].approved) || 0,
      rejected: (byType[t] && byType[t].rejected) || 0,
      avgDays: typeDecisionDays[t] ? Math.round((typeDecisionDays[t].sum / typeDecisionDays[t].count) * 10) / 10 : null
    }))
  };
}
function getProjectOverview(sessionToken) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const canViewAll = VIEW_ALL_ROLES.indexOf(user.Role) !== -1;
  return computeProjectOverview_(canViewAll, user.Email);
}
function computeProjectOverview_(canViewAll, userEmail) {
  const ss = getSS_();
  const config = getConfig_();
  const silentDays = parseInt(config.SILENT_PROJECT_DAYS, 10) || 14;
  const staleDays = parseInt(config.STALE_PENDING_DAYS, 10) || 5;
  const now = new Date();
  const projSheet = ss.getSheetByName(SHEET.PROJECTS);
  const projData = projSheet.getDataRange().getValues();
  const pIdx = {};
  projData[0].forEach((h, i) => pIdx[h] = i);
  const projectsMap = {};
  for (let i = 1; i < projData.length; i++) {
    if (!projData[i][pIdx.Status] || projData[i][pIdx.Status] === 'Active') {
      const code = projData[i][pIdx.ProjectCode];
      projectsMap[code] = {
        code: code, name: projData[i][pIdx.ProjectName] || code, location: projData[i][pIdx.Location] || '',
        pendingCount: 0, rfiOverdueCount: 0, lastActivity: null, oldestPendingTimestamp: null
      };
    }
  }
  const docSheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const data = docSheet.getDataRange().getValues();
  const idx = {};
  data[0].forEach((h, i) => idx[h] = i);
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = row[idx.Status];
    if (status === STATUS.DELETED) continue;
    const pCode = row[idx.ProjectCode];
    if (!projectsMap[pCode]) continue;
    if (!canViewAll && row[idx.UploaderEmail] !== userEmail) continue;
    const ts = row[idx.Timestamp] ? new Date(row[idx.Timestamp]) : null;
    const approvalDate = row[idx.ApprovalDate] ? new Date(row[idx.ApprovalDate]) : null;
    const lastForRow = (approvalDate && ts) ? (approvalDate > ts ? approvalDate : ts) : (approvalDate || ts);
    if (lastForRow && (!projectsMap[pCode].lastActivity || lastForRow > projectsMap[pCode].lastActivity)) {
      projectsMap[pCode].lastActivity = lastForRow;
    }
    if (row[idx.IsLatestRevision] !== true) continue;
    if (status === STATUS.PENDING) {
      projectsMap[pCode].pendingCount++;
      if (ts && (!projectsMap[pCode].oldestPendingTimestamp || ts < projectsMap[pCode].oldestPendingTimestamp)) {
        projectsMap[pCode].oldestPendingTimestamp = ts;
      }
    }
    if (row[idx.DocumentType] === 'RFI' && status === STATUS.PENDING && row[idx.SLADueDate] && new Date(row[idx.SLADueDate]) < now) {
      projectsMap[pCode].rfiOverdueCount++;
    }
  }
  const results = Object.keys(projectsMap).map(function (code) {
    const p = projectsMap[code];
    const daysSinceActivity = p.lastActivity ? Math.floor((now - p.lastActivity) / 86400000) : null;
    const oldestPendingDays = p.oldestPendingTimestamp ? Math.floor((now - p.oldestPendingTimestamp) / 86400000) : null;
    const reasons = [];
    let health = 'green';
    if (p.lastActivity === null) {
      health = 'yellow';
      reasons.push('Belum ada dokumen diunggah');
    } else {
      if (p.rfiOverdueCount > 0) { health = 'red'; reasons.push(p.rfiOverdueCount + ' RFI lewat SLA'); }
      if (daysSinceActivity >= silentDays) { health = 'red'; reasons.push('Tidak ada aktivitas ' + daysSinceActivity + ' hari'); }
      if (health !== 'red' && p.pendingCount > 0 && oldestPendingDays !== null && oldestPendingDays >= staleDays) {
        health = 'yellow'; reasons.push('Ada dokumen pending ' + oldestPendingDays + ' hari belum diproses');
      }
    }
    return {
      code: p.code, name: p.name, location: p.location,
      pendingCount: p.pendingCount, rfiOverdueCount: p.rfiOverdueCount,
      daysSinceActivity: daysSinceActivity, oldestPendingDays: oldestPendingDays,
      health: health, reasons: reasons
    };
  });
  const healthOrder = { red: 0, yellow: 1, green: 2 };
  results.sort(function (a, b) {
    if (healthOrder[a.health] !== healthOrder[b.health]) return healthOrder[a.health] - healthOrder[b.health];
    return a.name.localeCompare(b.name);
  });
  return results;
}
function checkSilentProjects() {
  const overview = computeProjectOverview_(true, null);
  const silentOnes = overview.filter(function (p) { return p.health === 'red' && p.reasons.some(function (r) { return r.indexOf('Tidak ada aktivitas') !== -1; }); });
  if (!silentOnes.length) { Logger.log('Cek proyek senyap selesai. Tidak ada proyek senyap.'); return; }
  const ss = getSS_();
  const usersSheet = ss.getSheetByName(SHEET.USERS);
  const udata = usersSheet.getDataRange().getValues();
  const uidx = usersIdx_();
  const recipients = [];
  for (let i = 1; i < udata.length; i++) {
    if (udata[i][uidx.Status] === USER_STATUS.ACTIVE && APPROVER_ROLES.indexOf(udata[i][uidx.Role]) !== -1) {
      recipients.push(udata[i][uidx.Email]);
    }
  }
  if (!recipients.length) { Logger.log('Ada proyek senyap tapi tidak ada Admin/Manager aktif.'); return; }
  const listHtml = silentOnes.map(function (p) {
    return '<li><b>' + escapeHtml_(p.name) + '</b> — ' + p.reasons.join(', ') + '</li>';
  }).join('');
  MailApp.sendEmail({
    to: recipients.join(','),
    subject: '[QC-CMS] ' + silentOnes.length + ' Proyek Tanpa Aktivitas Terdeteksi',
    htmlBody: '<div style="font-family:Arial,sans-serif;color:#1a2332;max-width:520px;"><h2>Proyek Tanpa Aktivitas</h2><p>Proyek berikut tidak ada aktivitas dokumen dalam waktu lama:</p><ul>' + listHtml + '</ul><p style="color:#6b7280;font-size:13px;">Buka tab "Ringkasan Proyek" di QC-CMS untuk detail.</p></div>'
  });
  Logger.log('Cek proyek senyap selesai. ' + silentOnes.length + ' proyek senyap.');
}
function createWeeklySilentProjectTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'checkSilentProjects') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkSilentProjects').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
  try { SpreadsheetApp.getUi().alert('Trigger mingguan proyek senyap berhasil diaktifkan (Senin ~08:00).'); } catch (e) { Logger.log('Trigger mingguan aktif.'); }
}
function checkRetentionExpiries() {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) { Logger.log('Tidak ada dokumen.'); return; }
  const idx = {};
  DOCUMENTS_HEADER.forEach((h, i) => idx[h] = i);
  const now = new Date();
  const soon = new Date(now.getTime() + 90 * 86400000);
  const expiring = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[idx.LifecycleStage] !== LIFECYCLE.ARCHIVED) continue;
    if (!row[idx.RetentionUntil]) continue;
    const ret = new Date(row[idx.RetentionUntil]);
    if (ret <= soon) {
      expiring.push({ code: displayDocCode_({ DocumentCode: row[idx.DocumentCode], ProjectCode: row[idx.ProjectCode], DocumentType: row[idx.DocumentType], DocumentNumber: row[idx.DocumentNumber] }), title: row[idx.Title], retentionUntil: ret });
    }
  }
  if (!expiring.length) { Logger.log('Tidak ada arsip yang mendekati masa retensi.'); return; }
  const usersSheet = ss.getSheetByName(SHEET.USERS);
  const udata = usersSheet.getDataRange().getValues();
  const uidx = usersIdx_();
  const recipients = [];
  for (let i = 1; i < udata.length; i++) {
    if (udata[i][uidx.Status] === USER_STATUS.ACTIVE && udata[i][uidx.Role] === ROLES.ADMIN) recipients.push(udata[i][uidx.Email]);
  }
  if (!recipients.length) return;
  const list = expiring.map(function (e) { return '<li><b>' + escapeHtml_(e.code) + '</b> — ' + escapeHtml_(e.title) + ' (retensi: ' + formatIndonesianDateShort_(e.retentionUntil, Session.getScriptTimeZone()) + ')</li>'; }).join('');
  MailApp.sendEmail({
    to: recipients.join(','),
    subject: '[QC-CMS] ' + expiring.length + ' Dokumen Arsip Mendekati Masa Retensi',
    htmlBody: '<div style="font-family:Arial,sans-serif;color:#1a2332;max-width:520px;"><h2>Retensi Arsip</h2><p>Dokumen arsip berikut mendekati akhir masa retensi (90 hari):</p><ul>' + list + '</ul></div>'
  });
}
// ============================================================================
// 7. APPROVAL
// ============================================================================
function getPendingApprovals(sessionToken, projectCode) {
  requireApprover_(sessionToken);
  return getDocumentList(sessionToken, { status: STATUS.PENDING, onlyLatest: true, projectCode: projectCode || '' });
}
function getApprovalHistory(sessionToken, projectCode) {
  requireApprover_(sessionToken);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (projectCode && row[idx.ProjectCode] !== projectCode) continue;
    const status = row[idx.Status];
    if (status !== STATUS.APPROVED && status !== STATUS.REJECTED) continue;
    results.push({
      docId: row[idx.DocID],
      projectName: row[idx.ProjectName], documentType: row[idx.DocumentType],
      documentNumber: row[idx.DocumentNumber],
      documentCode: displayDocCode_({ DocumentCode: row[idx.DocumentCode], ProjectCode: row[idx.ProjectCode], DocumentType: row[idx.DocumentType], DocumentNumber: row[idx.DocumentNumber] }),
      revision: row[idx.Revision],
      title: row[idx.Title], fileName: row[idx.FileName], fileUrl: row[idx.FileURL],
      uploaderName: row[idx.UploaderName], status: status,
      approverName: row[idx.ApproverName],
      approvalDate: row[idx.ApprovalDate] ? new Date(row[idx.ApprovalDate]).toISOString() : '',
      comments: row[idx.Comments]
    });
  }
  results.sort((a, b) => new Date(b.approvalDate) - new Date(a.approvalDate));
  return results.slice(0, 300);
}
function approveDocumentInApp(sessionToken, docId) {
  const user = requireApprover_(sessionToken);
  return processApproval_(docId, STATUS.APPROVED, '', user.FullName, user.Email);
}
function rejectDocumentInApp(sessionToken, docId, comment) {
  const user = requireApprover_(sessionToken);
  return processApproval_(docId, STATUS.REJECTED, comment || '', user.FullName, user.Email);
}
function approveMultipleInApp(sessionToken, docIds) {
  const user = requireApprover_(sessionToken);
  const result = { successCount: 0, failCount: 0, messages: [] };
  (docIds || []).forEach(function (id) {
    const r = processApproval_(id, STATUS.APPROVED, '', user.FullName, user.Email);
    if (r.success) result.successCount++;
    else { result.failCount++; result.messages.push(r.message); }
  });
  return result;
}
function processApproval_(docId, newStatus, comment, actorName, actorEmail) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (lockErr) { return { success: false, message: 'Sistem sedang sibuk.' }; }
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
    const doc = findDocumentById_(sheet, docId);
    if (!doc) return { success: false, message: 'Dokumen tidak ditemukan.' };
    if (doc.Status !== STATUS.PENDING) return { success: false, message: 'Dokumen sudah diproses sebelumnya dengan status: ' + doc.Status + '.' };
    const idx = {};
    DOCUMENTS_HEADER.forEach((h, i) => idx[h] = i + 1);
    const recordedApproverName = actorName || doc.ApproverEmail || 'Disetujui via tautan email';

    // Batch update row dokumen (1 round trip instead of 6)
    const docRow = sheet.getRange(doc.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (actorEmail) docRow[idx.ApproverEmail - 1] = actorEmail;
    docRow[idx.Status - 1] = newStatus;
    docRow[idx.ApproverName - 1] = recordedApproverName;
    docRow[idx.ApprovalDate - 1] = new Date();
    docRow[idx.LifecycleStage - 1] = newStatus === STATUS.APPROVED ? LIFECYCLE.APPROVED : LIFECYCLE.REJECTED;
    if (comment) docRow[idx.Comments - 1] = sanitizeForSheet_(comment);
    sheet.getRange(doc.rowIndex, 1, 1, docRow.length).setValues([docRow]);
    sendUploaderNotification_(doc, newStatus, comment);
    notify_(doc.UploaderEmail, newStatus === STATUS.APPROVED ? 'document_approved' : 'document_rejected',
      'Dokumen "' + doc.Title + '" (' + doc.DocumentType + ' ' + displayDocCode_(doc) + ') ' +
      (newStatus === STATUS.APPROVED ? 'telah disetujui.' : 'ditolak.' + (comment ? ' Catatan: ' + comment : '')),
      'Document', docId);
    logAudit_(
      { Email: actorEmail || 'email-link', FullName: recordedApproverName, Role: actorEmail ? '' : 'via tautan email' },
      newStatus === STATUS.APPROVED ? 'approveDocument' : 'rejectDocument', 'Document', docId,
      doc.DocumentType + ' ' + displayDocCode_(doc) + ' Rev' + doc.Revision + (comment ? ' \u2014 ' + comment : '')
    );
    return { success: true, message: 'Dokumen "' + escapeHtml_(doc.Title) + '" berhasil ditandai sebagai ' + newStatus + '.', doc: doc };
  } finally { lock.releaseLock(); }
}
function sendApprovalEmail_(p) {
  const baseUrl = getWebAppUrl_(p.config);
  const subject = '[QC-CMS] Persetujuan Diperlukan: ' + p.documentType + ' ' + p.projectName + ' - ' + p.title;
  let actionButtons = '';
  if (baseUrl) {
    const expParam = p.tokenExpiry ? '&exp=' + encodeURIComponent(p.tokenExpiry) : '';
    const approveUrl = baseUrl + '?action=approve&id=' + encodeURIComponent(p.docId) + '&token=' + encodeURIComponent(p.token) + expParam;
    const rejectUrl = baseUrl + '?action=reject&id=' + encodeURIComponent(p.docId) + '&token=' + encodeURIComponent(p.token) + expParam;
    actionButtons =
      '<div style="margin-top:20px;">' +
      '<a href="' + approveUrl + '" style="background-color:#15803d;color:#ffffff;padding:10px 24px;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;font-weight:bold;margin-right:12px;display:inline-block;">Setuju</a>' +
      '<a href="' + rejectUrl + '" style="background-color:#b91c1c;color:#ffffff;padding:10px 24px;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;font-weight:bold;display:inline-block;">Tolak</a>' +
      '</div>' +
      '<p style="color:#6b7280;font-size:12px;margin-top:14px;">Tombol "Setuju" meminta konfirmasi sekali lagi di halaman web sebelum disetujui.</p>';
  }
  const html =
    '<div style="font-family:Arial,sans-serif;color:#1a2332;max-width:560px;">' +
    '<h2 style="color:#1a2332;">Permintaan Persetujuan Dokumen Mutu</h2>' +
    '<table style="border-collapse:collapse;width:100%;margin-top:12px;">' +
    '<tr><td style="padding:6px 0;color:#6b7280;">Proyek</td><td style="padding:6px 0;font-weight:bold;">' + escapeHtml_(p.projectName) + '</td></tr>' +
    '<tr><td style="padding:6px 0;color:#6b7280;">Jenis Dokumen</td><td style="padding:6px 0;font-weight:bold;">' + escapeHtml_(p.documentType) + '</td></tr>' +
    '<tr><td style="padding:6px 0;color:#6b7280;">No. Dokumen / Revisi</td><td style="padding:6px 0;font-weight:bold;">' + escapeHtml_(p.documentCode) + ' / Rev ' + escapeHtml_(p.revision) + '</td></tr>' +
    '<tr><td style="padding:6px 0;color:#6b7280;">Judul</td><td style="padding:6px 0;font-weight:bold;">' + escapeHtml_(p.title) + '</td></tr>' +
    '<tr><td style="padding:6px 0;color:#6b7280;">Diunggah oleh</td><td style="padding:6px 0;">' + escapeHtml_(p.uploaderName) + '</td></tr>' +
    '</table>' +
    '<p style="margin-top:16px;"><a href="' + p.fileUrl + '" style="color:#2563eb;">Lihat / unduh file dokumen</a></p>' +
    actionButtons +
    (!baseUrl ? '<p style="color:#b91c1c;font-size:13px;">Catatan: URL Web App belum terdeteksi.</p>' : '') +
    '</div>';
  MailApp.sendEmail({ to: p.approverEmail, subject: subject, htmlBody: html });
}
function sendUploaderNotification_(doc, newStatus, comment) {
  if (!doc.UploaderEmail) return;
  try {
    const isApproved = newStatus === STATUS.APPROVED;
    const subject = '[QC-CMS] Dokumen ' + (isApproved ? 'Disetujui' : 'Ditolak') + ': ' + doc.Title;
    const color = isApproved ? '#15803d' : '#b91c1c';
    const html = '<div style="font-family:Arial,sans-serif;color:#1a2332;max-width:560px;">' +
      '<h2 style="color:' + color + ';">Dokumen Anda ' + (isApproved ? 'Disetujui' : 'Perlu Direvisi (Ditolak)') + '</h2>' +
      '<table style="border-collapse:collapse;width:100%;margin-top:12px;">' +
      '<tr><td style="padding:6px 0;color:#6b7280;">Proyek</td><td style="padding:6px 0;font-weight:bold;">' + escapeHtml_(doc.ProjectName) + '</td></tr>' +
      '<tr><td style="padding:6px 0;color:#6b7280;">Dokumen</td><td style="padding:6px 0;font-weight:bold;">' + escapeHtml_(doc.DocumentType) + ' ' + escapeHtml_(displayDocCode_(doc)) + ' Rev' + escapeHtml_(doc.Revision) + '</td></tr>' +
      '<tr><td style="padding:6px 0;color:#6b7280;">Judul</td><td style="padding:6px 0;font-weight:bold;">' + escapeHtml_(doc.Title) + '</td></tr>' +
      '</table>' +
      (comment ? '<p style="margin-top:14px;"><b>Catatan dari approver:</b> ' + escapeHtml_(comment) + '</p>' : '') +
      (doc.FileURL ? '<p style="margin-top:14px;"><a href="' + doc.FileURL + '" style="color:#2563eb;">Lihat file dokumen</a></p>' : '') +
      (!isApproved ? '<p style="margin-top:14px;color:#6b7280;font-size:13px;">Silakan revisi sesuai catatan di atas, lalu unggah ulang sebagai revisi baru.</p>' : '') +
      '</div>';
    MailApp.sendEmail({ to: doc.UploaderEmail, subject: subject, htmlBody: html });
  } catch (e) { /* abaikan */ }
}
// ============================================================================
// 8. GRAFIK & LAPORAN
// ============================================================================
function getStatusCounts(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const canViewAll = VIEW_ALL_ROLES.indexOf(user.Role) !== -1;
  return computeStatusCounts_(canViewAll, user.Email, filters || {});
}
function computeStatusCounts_(canViewAll, userEmail, filters) {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const data = sheet.getDataRange().getValues();
  const counts = { Pending: 0, Approved: 0, Rejected: 0, Superseded: 0 };
  if (data.length <= 1) return counts;
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = row[idx.Status];
    if (status === STATUS.DELETED) continue;
    if (row[idx.IsLatestRevision] !== true) continue;
    if (row[idx.LifecycleStage] === LIFECYCLE.ARCHIVED || row[idx.LifecycleStage] === LIFECYCLE.OBSOLETE) continue;
    if (!canViewAll && row[idx.UploaderEmail] !== userEmail) continue;
    if (filters.projectCode && row[idx.ProjectCode] !== filters.projectCode) continue;
    if (filters.documentType && row[idx.DocumentType] !== filters.documentType) continue;
    if (counts.hasOwnProperty(status)) counts[status]++;
  }
  return counts;
}
function generateReport(sessionToken, options) {
  const user = requireRole_(sessionToken, VIEW_ALL_ROLES);
  try {
    options = options || {};
    const periodDays = options.period === 'weekly' ? 7 : 1;
    const periodLabel = options.period === 'weekly' ? 'Mingguan' : 'Harian';
    const config = getConfig_();
    const companyName = config.COMPANY_NAME || 'PT Asuka Engineering Indonesia';
    const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
    const rd = buildReportData_(periodDays);
    const dateStr = formatIndonesianDate_(rd.now, tz);
    const fileBaseName = 'Laporan-' + periodLabel + '-QCCMS-' + Utilities.formatDate(rd.now, tz, 'yyyyMMdd-HHmm');
     const doc = DocumentApp.create(fileBaseName);
    const body = doc.getBody();
    body.setMarginTop(50).setMarginBottom(50).setMarginLeft(50).setMarginRight(50);

    buildDocHeader_(body, {
      title: 'Laporan ' + periodLabel + ' — QC-CMS',
      subtitle: companyName,
      textColWidth: 460
    });
    body.appendParagraph('Dibuat: ' + dateStr + ' oleh ' + user.FullName + ' (' + user.Role + ')')
      .editAsText().setForegroundColor('#5b6b7f').setFontSize(9);
    body.appendHorizontalRule();
    body.appendParagraph('Ringkasan Periode Ini').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    styleReportTable_(body.appendTable([
      ['Dokumen Diajukan', String(rd.overall.submitted)],
      ['Dokumen Disetujui', String(rd.overall.approved)],
      ['Dokumen Ditolak', String(rd.overall.rejected)],
      ['Total Pending Saat Ini', String(rd.overall.pendingNow)],
      ['RFI Lewat SLA Saat Ini', String(rd.overall.rfiOverdueNow)]
    ]));
    const statusCounts = computeStatusCounts_(true, user.Email, {});
    const chartDataTable = Charts.newDataTable()
      .addColumn(Charts.ColumnType.STRING, 'Status')
      .addColumn(Charts.ColumnType.NUMBER, 'Jumlah');
    const chartColors = [];
    ['Pending', 'Approved', 'Rejected', 'Superseded'].forEach(function (k) {
      if (statusCounts[k] > 0) {
        chartDataTable.addRow([k, statusCounts[k]]);
        chartColors.push(STATUS_CHART_COLORS[k]);
      }
    });
    if (chartColors.length) {
      const chart = Charts.newPieChart()
        .setDataTable(chartDataTable.build())
        .setTitle('Distribusi Status Dokumen (Saat Ini)')
        .setColors(chartColors)
        .setDimensions(420, 280)
        .build();
      body.appendImage(chart.getAs('image/png'));
    } else {
      body.appendParagraph('Tidak ada dokumen aktif untuk ditampilkan pada grafik ini.').setItalic(true);
    }
    body.appendParagraph('Update per Proyek Aktif').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    if (rd.activeProjects.length) {
      const projRows = [['Proyek', 'Diajukan', 'Disetujui', 'Ditolak', 'Pending Saat Ini', 'RFI Lewat SLA']];
      rd.activeProjects.forEach(function (p) {
        const s = rd.byProject[p.code];
        projRows.push([p.name, String(s.submitted), String(s.approved), String(s.rejected), String(s.pendingNow), String(s.rfiOverdueNow)]);
      });
      styleReportTable_(body.appendTable(projRows));
    } else {
      body.appendParagraph('Belum ada proyek aktif terdaftar.');
    }
    body.appendParagraph('Detail Aktivitas Periode Ini').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    if (rd.activityRows.length) {
      const actRows = [['Tanggal', 'Proyek', 'Jenis', 'Dokumen', 'Aksi', 'Oleh']];
      rd.activityRows.forEach(function (a) {
        actRows.push([Utilities.formatDate(a.date, tz, 'dd/MM/yyyy HH:mm'), a.project, a.type, a.title, a.action, a.by || '-']);
      });
      styleReportTable_(body.appendTable(actRows));
    } else {
      body.appendParagraph('Tidak ada aktivitas pada periode ini.');
    }
    body.appendParagraph(' ');
    body.appendParagraph('Laporan ini dibuat otomatis oleh QC-CMS EDMS.').editAsText().setForegroundColor('#8592a3').setItalic(true).setFontSize(8);
    doc.saveAndClose();
    const pdfBlob = DriveApp.getFileById(doc.getId()).getAs('application/pdf').setName(fileBaseName + '.pdf');
    let driveUrl = '';
    try {
      const reportsFolder = getOrCreateFolderPath_(config.ROOT_FOLDER_ID, ['Reports']);
      driveUrl = reportsFolder.createFile(pdfBlob).getUrl();
    } catch (e) { /* lanjut tanpa arsip Drive */ }
    try { DriveApp.getFileById(doc.getId()).setTrashed(true); } catch (e) { /* abaikan */ }
    return { success: true, base64: Utilities.base64Encode(pdfBlob.getBytes()), fileName: fileBaseName + '.pdf', driveUrl: driveUrl };
  } catch (err) {
    return { success: false, message: 'Gagal membuat laporan: ' + err.message };
  }
}
function buildReportData_(periodDays) {
  const ss = getSS_();
  const docSheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const projSheet = ss.getSheetByName(SHEET.PROJECTS);
  const data = docSheet.getDataRange().getValues();
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const now = new Date();
  const periodStart = new Date(now.getTime() - periodDays * 24 * 3600000);
  const projData = projSheet.getDataRange().getValues();
  const pHeader = projData[0];
  const pIdx = {};
  pHeader.forEach((h, i) => pIdx[h] = i);
  const activeProjects = [];
  const byProject = {};
  for (let i = 1; i < projData.length; i++) {
    if (!projData[i][pIdx.Status] || projData[i][pIdx.Status] === 'Active') {
      const code = projData[i][pIdx.ProjectCode];
      const name = projData[i][pIdx.ProjectName] || code;
      activeProjects.push({ code: code, name: name });
      byProject[code] = { name: name, submitted: 0, approved: 0, rejected: 0, pendingNow: 0, rfiOverdueNow: 0 };
    }
  }
  const overall = { submitted: 0, approved: 0, rejected: 0, pendingNow: 0, rfiOverdueNow: 0 };
  const activityRows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = row[idx.Status];
    if (status === STATUS.DELETED) continue;
    const pCode = row[idx.ProjectCode];
    const ts = row[idx.Timestamp] ? new Date(row[idx.Timestamp]) : null;
    const approvalDate = row[idx.ApprovalDate] ? new Date(row[idx.ApprovalDate]) : null;
    const isLatest = row[idx.IsLatestRevision] === true;
    if (ts && ts >= periodStart) {
      overall.submitted++;
      if (byProject[pCode]) byProject[pCode].submitted++;
      activityRows.push({ date: ts, project: row[idx.ProjectName], type: row[idx.DocumentType], title: row[idx.Title], action: 'Diajukan', by: row[idx.UploaderName] });
    }
    if (approvalDate && approvalDate >= periodStart && (status === STATUS.APPROVED || status === STATUS.REJECTED)) {
      if (status === STATUS.APPROVED) { overall.approved++; if (byProject[pCode]) byProject[pCode].approved++; }
      else { overall.rejected++; if (byProject[pCode]) byProject[pCode].rejected++; }
      activityRows.push({ date: approvalDate, project: row[idx.ProjectName], type: row[idx.DocumentType], title: row[idx.Title], action: status === STATUS.APPROVED ? 'Disetujui' : 'Ditolak', by: row[idx.ApproverName] });
    }
    if (isLatest && status === STATUS.PENDING) {
      overall.pendingNow++;
      if (byProject[pCode]) byProject[pCode].pendingNow++;
    }
    if (isLatest && row[idx.DocumentType] === 'RFI' && status === STATUS.PENDING && row[idx.SLADueDate] && new Date(row[idx.SLADueDate]) < now) {
      overall.rfiOverdueNow++;
      if (byProject[pCode]) byProject[pCode].rfiOverdueNow++;
    }
  }
  activityRows.sort((a, b) => b.date - a.date);
  return { now: now, periodStart: periodStart, activeProjects: activeProjects, overall: overall, byProject: byProject, activityRows: activityRows.slice(0, 150) };
}
function styleReportTable_(table) {
  const headerRow = table.getRow(0);
  for (let c = 0; c < headerRow.getNumCells(); c++) {
    headerRow.getCell(c).setBackgroundColor('#1a2332');
    headerRow.getCell(c).editAsText().setForegroundColor('#ffffff').setBold(true);
  }
  return table;
}
function formatIndonesianDate_(date, tz) {
  const d = Utilities.formatDate(date, tz, 'dd');
  const m = parseInt(Utilities.formatDate(date, tz, 'MM'), 10) - 1;
  const y = Utilities.formatDate(date, tz, 'yyyy');
  const hm = Utilities.formatDate(date, tz, 'HH:mm');
  return d + ' ' + INDONESIAN_MONTHS_[m] + ' ' + y + ' ' + hm;
}
// ============================================================================
// 9. SITE REPORT
// ============================================================================
function siteReportIdx_() { const idx = {}; SITE_REPORT_HEADER.forEach((h, i) => idx[h] = i); return idx; }
function startOfDay_(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay_(d) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function formatIndonesianDateShort_(date, tz) {
  const d = Utilities.formatDate(date, tz, 'dd');
  const m = parseInt(Utilities.formatDate(date, tz, 'MM'), 10) - 1;
  const y = Utilities.formatDate(date, tz, 'yyyy');
  return d + ' ' + INDONESIAN_MONTHS_[m] + ' ' + y;
}
function submitSiteReportEntry(sessionToken, payload) {
  const user = requireRole_(sessionToken, UPLOADER_ROLES);
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sibuk.' }; }
  try {
    payload = payload || {};
    if (!payload.projectCode) return { success: false, message: 'Pilih proyek.' };
    if (!payload.locationArea) return { success: false, message: 'Lokasi/Area wajib diisi.' };
    if (!payload.workDescription) return { success: false, message: 'Deskripsi pekerjaan wajib diisi.' };
    if (SITE_STATUS_OPTIONS.indexOf(payload.statusQC) === -1) return { success: false, message: 'Status QC tidak valid.' };
    const progress = Math.max(0, Math.min(100, parseInt(payload.progress, 10) || 0));
    const config = getConfig_();
    const photos = payload.photos || [];
    if (photos.length > MAX_PHOTOS_PER_ENTRY) return { success: false, message: 'Maksimal ' + MAX_PHOTOS_PER_ENTRY + ' foto per entri.' };
    if (photos.length && !config.ROOT_FOLDER_ID) return { success: false, message: 'ROOT_FOLDER_ID belum diisi.' };
    const ss = getSS_();
    const projectSheet = ss.getSheetByName(SHEET.PROJECTS);
    const projectRow = findProjectByCode_(projectSheet, payload.projectCode);
    const projectName = projectRow ? projectRow.ProjectName : payload.projectCode;
    const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
    const reportDateVal = payload.reportDate ? new Date(payload.reportDate) : new Date();
    let photoUrl = '', photoFileId = '', additionalUrls = [];
    if (photos.length) {
      const monthFolder = Utilities.formatDate(reportDateVal, tz, 'yyyy-MM');
      const folder = getOrCreateFolderPath_(config.ROOT_FOLDER_ID, [projectName, 'Laporan Inspeksi Lapangan', monthFolder]);
      const decoded = [];
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (!p.fileName || !p.base64Data) return { success: false, message: 'Data foto tidak lengkap.' };
        const clean = p.base64Data.indexOf(',') !== -1 ? p.base64Data.split(',')[1] : p.base64Data;
        const bytes = Utilities.base64Decode(clean);
        if (bytes.length > MAX_FILE_SIZE_BYTES) return { success: false, message: 'Foto "' + p.fileName + '" melebihi batas 15MB.' };
        decoded.push({ fileName: p.fileName, mimeType: p.mimeType || 'image/jpeg', bytes: bytes });
      }
      const namePrefix = payload.projectCode + '-SiteLog-' + Utilities.formatDate(reportDateVal, tz, 'yyyyMMdd') + '-' + Utilities.getUuid().slice(0, 6);
      decoded.forEach(function (d, i) {
        const ext = getFileExtension_(d.fileName) || 'jpg';
        const f = createFileInFolder_(folder, namePrefix + '-' + (i + 1) + '.' + ext, d.bytes, d.mimeType);
        if (i === 0) { photoUrl = f.getUrl(); photoFileId = f.getId(); }
        else additionalUrls.push(f.getUrl());
      });
    }
    const sheet = ss.getSheetByName(SHEET.SITE_REPORTS);
    const entryId = Utilities.getUuid();
    sheet.appendRow([
      entryId, new Date(), reportDateVal, payload.projectCode, projectName,
      sanitizeForSheet_(payload.locationArea), sanitizeForSheet_(payload.workDescription), sanitizeForSheet_(payload.qcFindings || ''), sanitizeForSheet_(payload.followUp || ''),
      progress, payload.statusQC, photoUrl, photoFileId, additionalUrls.join('\n'),
      user.FullName, user.Email, 'Active'
    ]);
    logAudit_(user, 'submitSiteReportEntry', 'SiteReport', entryId, payload.locationArea + ' (' + projectName + ', ' + payload.statusQC + ')');
    return { success: true, message: 'Entri inspeksi berhasil disimpan.' };
  } catch (err) {
    return { success: false, message: 'Terjadi kesalahan: ' + err.message };
  } finally { lock.releaseLock(); }
}
function getSiteReportEntries(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  filters = filters || {};
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.SITE_REPORTS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const idx = siteReportIdx_();
  const dateFrom = filters.dateFrom ? startOfDay_(new Date(filters.dateFrom)) : null;
  const dateTo = filters.dateTo ? endOfDay_(new Date(filters.dateTo)) : null;
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[idx.RecordStatus] === 'Deleted') continue;
    if (filters.projectCode && row[idx.ProjectCode] !== filters.projectCode) continue;
    const rDate = row[idx.ReportDate] ? new Date(row[idx.ReportDate]) : null;
    if (dateFrom && rDate && rDate < dateFrom) continue;
    if (dateTo && rDate && rDate > dateTo) continue;
    const additionalRaw = row[idx.AdditionalPhotoURLs];
    const additionalList = additionalRaw ? String(additionalRaw).split('\n').filter(Boolean) : [];
    results.push({
      entryId: row[idx.EntryID],
      timestamp: row[idx.Timestamp] ? new Date(row[idx.Timestamp]).toISOString() : '',
      reportDate: rDate ? rDate.toISOString() : '',
      projectCode: row[idx.ProjectCode],
      projectName: row[idx.ProjectName],
      locationArea: row[idx.LocationArea],
      workDescription: row[idx.WorkDescription],
      qcFindings: row[idx.QCFindings],
      followUp: row[idx.FollowUp],
      progress: row[idx.Progress],
      statusQC: row[idx.StatusQC],
      photoUrl: row[idx.PhotoURL],
      additionalPhotoUrls: additionalList,
      photoCount: (row[idx.PhotoURL] ? 1 : 0) + additionalList.length,
      inspectorName: row[idx.InspectorName],
      inspectorEmail: row[idx.InspectorEmail],
      canManage: (user.Role === ROLES.ADMIN) || (row[idx.InspectorEmail] === user.Email)
    });
  }
  results.sort(function (a, b) { return new Date(b.reportDate) - new Date(a.reportDate) || new Date(b.timestamp) - new Date(a.timestamp); });
  return results;
}
function deleteSiteReportEntry(sessionToken, entryId) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.SITE_REPORTS);
  const data = sheet.getDataRange().getValues();
  const idx = siteReportIdx_();
  for (let i = 1; i < data.length; i++) {
    if (data[i][idx.EntryID] === entryId) {
      const canDelete = (user.Role === ROLES.ADMIN) || (data[i][idx.InspectorEmail] === user.Email);
      if (!canDelete) return { success: false, message: 'Anda tidak memiliki izin.' };
      const rowIndex = i + 1;
      sheet.getRange(rowIndex, idx.RecordStatus + 1).setValue('Deleted');
      try {
        const fid = data[i][idx.PhotoFileID];
        if (fid) DriveApp.getFileById(fid).setTrashed(true);
        const extra = data[i][idx.AdditionalPhotoURLs];
        if (extra) String(extra).split('\n').filter(Boolean).forEach(function (u) {
          try { DriveApp.getFileById(extractDriveId_(u)).setTrashed(true); } catch (e2) { /* abaikan */ }
        });
      } catch (e) { /* abaikan */ }
      logAudit_(user, 'deleteSiteReportEntry', 'SiteReport', entryId, data[i][idx.LocationArea]);
      return { success: true, message: 'Entri berhasil dihapus.' };
    }
  }
  return { success: false, message: 'Entri tidak ditemukan.' };
}
function generateSiteInspectionReport(sessionToken, options) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  try {
    options = options || {};
    const format = ['pdf', 'docx', 'xlsx'].indexOf(options.format) !== -1 ? options.format : 'pdf';
    const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
    const config = getConfig_();
    const companyName = config.COMPANY_NAME || 'PT Asuka Engineering Indonesia';
    const entries = getSiteReportEntries(sessionToken, {
      projectCode: options.projectCode || '', dateFrom: options.dateFrom, dateTo: options.dateTo
    });
    if (!entries.length) return { success: false, message: 'Tidak ada entri inspeksi pada periode/proyek yang dipilih.' };
    entries.sort(function (a, b) {
      return new Date(a.reportDate) - new Date(b.reportDate)
        || String(a.projectName || '').localeCompare(String(b.projectName || ''))
        || String(a.locationArea || '').localeCompare(String(b.locationArea || ''));
    });
    const dateFrom = options.dateFrom ? new Date(options.dateFrom) : null;
    const dateTo = options.dateTo ? new Date(options.dateTo) : null;
    const sameDay = dateFrom && dateTo && Utilities.formatDate(dateFrom, tz, 'yyyyMMdd') === Utilities.formatDate(dateTo, tz, 'yyyyMMdd');
    const periodLabel = sameDay ? 'Harian' : 'Mingguan';
    const periodRangeLabel = dateFrom && dateTo
      ? (sameDay ? formatIndonesianDateShort_(dateFrom, tz) : formatIndonesianDateShort_(dateFrom, tz) + ' \u2013 ' + formatIndonesianDateShort_(dateTo, tz))
      : '-';
    const projectLabel = options.projectCode ? (entries[0].projectName || options.projectCode) : 'Seluruh Proyek Aktif';
    const inspectorNames = entries.map(function (e) { return e.inspectorName; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
    const now = new Date();
    const fileBaseName = 'Laporan-Inspeksi-' + periodLabel + '-' + (options.projectCode || 'Semua') + '-' + Utilities.formatDate(now, tz, 'yyyyMMdd-HHmm');
    const meta = {
      companyName: companyName, projectLabel: projectLabel, periodLabel: periodLabel,
      periodRangeLabel: periodRangeLabel, inspectorNames: inspectorNames.join(', ') || '-',
      generatedBy: user.FullName + ' (' + user.Role + ')', generatedAt: formatIndonesianDate_(now, tz),
      fileBaseName: fileBaseName, groupByProject: !options.projectCode
    };
    let blob;
    if (format === 'xlsx') {
      blob = buildSiteReportXlsx_(entries, meta);
    } else {
      const docId = buildSiteReportDoc_(entries, meta);
      if (format === 'pdf') {
        blob = DriveApp.getFileById(docId).getAs('application/pdf').setName(fileBaseName + '.pdf');
      } else {
        blob = exportGoogleFileAs_(docId, 'document', 'docx').setName(fileBaseName + '.docx');
      }
      try { DriveApp.getFileById(docId).setTrashed(true); } catch (e) { /* abaikan */ }
    }
    let driveUrl = '';
    try {
      const reportsFolder = getOrCreateFolderPath_(config.ROOT_FOLDER_ID, ['Reports', 'Laporan Inspeksi Lapangan']);
      driveUrl = reportsFolder.createFile(blob).getUrl();
    } catch (e) { /* lanjut tanpa arsip Drive */ }
    logAudit_(user, 'generateSiteInspectionReport', 'SiteReport', '', format.toUpperCase() + ' — ' + projectLabel + ' — ' + periodRangeLabel);
    return { success: true, base64: Utilities.base64Encode(blob.getBytes()), fileName: blob.getName(), driveUrl: driveUrl };
  } catch (err) {
    return { success: false, message: 'Gagal membuat laporan: ' + err.message };
  }
}
function buildSiteReportDoc_(entries, meta) {
  const doc = DocumentApp.create(meta.fileBaseName);
  const body = doc.getBody();
  try { body.setPageWidth(841.89).setPageHeight(595.28); } catch (e) { /* fallback */ }
  body.setMarginTop(28).setMarginBottom(28).setMarginLeft(28).setMarginRight(28);

  buildDocHeader_(body, {
    title: 'LAPORAN DOKUMENTASI ' + meta.periodLabel.toUpperCase() + ' \u2014 QC INSPECTOR',
    subtitle: meta.companyName,
    textColWidth: 640
  });
  body.appendParagraph(' ');
  const infoTable = body.appendTable([
    ['Proyek', meta.projectLabel],
    ['Periode Laporan', meta.periodRangeLabel],
    ['QC Inspector', meta.inspectorNames],
    ['Dibuat', meta.generatedAt + ' oleh ' + meta.generatedBy]
  ]);
  infoTable.setBorderWidth(0.5);
  for (let r = 0; r < infoTable.getNumRows(); r++) {
    infoTable.getRow(r).getCell(0).setBackgroundColor('#eef1f5');
    infoTable.getRow(r).getCell(0).editAsText().setBold(true).setFontSize(9.5);
    infoTable.getRow(r).getCell(1).editAsText().setFontSize(9.5);
  }
  body.appendParagraph(' ');
  const total = entries.length;
  const accCount = entries.filter(function (e) { return e.statusQC === 'ACC (Accepted)'; }).length;
  const rejectCount = entries.filter(function (e) { return e.statusQC === 'Reject / Repair'; }).length;
  const progressCount = total - accCount - rejectCount;
  const avgProgress = Math.round(entries.reduce(function (s, e) { return s + (Number(e.progress) || 0); }, 0) / total);
  const sumTable = body.appendTable([[
    'Total Entri: ' + total, 'ACC: ' + accCount, 'Reject/Repair: ' + rejectCount,
    'On Progress: ' + progressCount, 'Rata-rata Progres: ' + avgProgress + '%'
  ]]);
  sumTable.setBorderWidth(0);
  for (let c = 0; c < sumTable.getRow(0).getNumCells(); c++) {
    const cell = sumTable.getRow(0).getCell(c);
    cell.setBackgroundColor('#1a2332');
    cell.editAsText().setForegroundColor('#ffffff').setBold(true).setFontSize(9);
    cell.setPaddingTop(6).setPaddingBottom(6);
  }
  body.appendParagraph(' ');
  const table = body.appendTable([['No', 'Lokasi / Area', 'Dokumentasi (Foto)', 'Keterangan Inspeksi', 'Progres / Status']]);
  const headerRow = table.getRow(0);
  for (let c = 0; c < headerRow.getNumCells(); c++) {
    headerRow.getCell(c).setBackgroundColor('#1a2332');
    headerRow.getCell(c).editAsText().setForegroundColor('#ffffff').setBold(true).setFontSize(9.5);
  }
  [26, 95, 150, 330, 118].forEach(function (w, i) { table.setColumnWidth(i, w); });
  entries.forEach(function (e, i) {
    const row = table.appendTableRow();
    row.appendTableCell(String(i + 1));
    const locCell = row.appendTableCell();
    const dateStr = e.reportDate ? formatIndonesianDateShort_(new Date(e.reportDate), Session.getScriptTimeZone() || 'Asia/Jakarta') : '-';
    const locFirstPara = locCell.getChild(0).asParagraph();
    locFirstPara.setText(e.locationArea);
    locFirstPara.editAsText().setBold(true).setFontSize(9.5);
    locCell.appendParagraph(dateStr).editAsText().setFontSize(8).setForegroundColor('#5b6b7f');
    if (meta.groupByProject) locCell.appendParagraph(e.projectName).editAsText().setFontSize(8).setForegroundColor('#8a97a8').setItalic(true);
    appendEntryPhotos_(row.appendTableCell(), e);
    const infoCell = row.appendTableCell();
    setCellLines_(infoCell, [
      { label: 'Pekerjaan', value: e.workDescription },
      { label: 'Temuan QC', value: e.qcFindings },
      { label: 'Tindak Lanjut', value: e.followUp }
    ]);
    const statusCell = row.appendTableCell();
    const style = SITE_STATUS_STYLE[e.statusQC] || { bg: '#e2e8f0', text: '#475569', icon: '\u2022' };
    statusCell.setBackgroundColor(style.bg);
    const sp = statusCell.getChild(0).asParagraph();
    sp.setText((e.progress || 0) + '%\n' + style.icon + ' ' + e.statusQC);
    sp.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    sp.editAsText().setBold(true).setForegroundColor(style.text).setFontSize(9.5);
  });
  body.appendParagraph(' ');
  body.appendParagraph('Laporan ini dibuat otomatis oleh QC-CMS EDMS \u2014 ' + meta.companyName + '.')
    .editAsText().setForegroundColor('#8592a3').setItalic(true).setFontSize(8);
  doc.saveAndClose();
  return doc.getId();
}
function appendEntryPhotos_(cell, entry) {
  const urls = [entry.photoUrl].concat(entry.additionalPhotoUrls || []).filter(Boolean);
  if (!urls.length) {
    const emptyPara = cell.getChild(0).asParagraph();
    emptyPara.setText('\u2014 tidak ada foto \u2014');
    emptyPara.editAsText().setItalic(true).setFontSize(8).setForegroundColor('#8a97a8');
    return;
  }
  const maxPhotos = 3;
  let isFirst = true;
  urls.slice(0, maxPhotos).forEach(function (url) {
    try {
      const blob = DriveApp.getFileById(extractDriveId_(url)).getBlob();
      const img = isFirst ? cell.getChild(0).asParagraph().appendInlineImage(blob) : cell.appendImage(blob);
      const ratio = img.getHeight() / img.getWidth();
      const w = 118;
      img.setWidth(w);
      img.setHeight(Math.round(w * ratio));
    } catch (e) {
      const p = isFirst ? cell.getChild(0).asParagraph() : cell.appendParagraph('');
      p.setText('(gagal memuat foto)');
      p.editAsText().setItalic(true).setFontSize(8);
    }
    isFirst = false;
  });
  if (urls.length > maxPhotos) {
    cell.appendParagraph('+' + (urls.length - maxPhotos) + ' foto lainnya').editAsText().setFontSize(7.5).setForegroundColor('#8a97a8');
  }
}
function setCellLines_(cell, lines) {
  let first = true;
  lines.forEach(function (item) {
    const label = item.label + ': ';
    const value = item.value || '-';
    const para = first ? cell.getChild(0).asParagraph() : cell.appendParagraph('');
    para.setText(label + value);
    para.editAsText().setBold(0, label.length - 1, true).setFontSize(9);
    first = false;
  });
}
function exportGoogleFileAs_(fileId, docTypeSegment, format) {
  const url = 'https://docs.google.com/' + docTypeSegment + '/d/' + fileId + '/export?format=' + format;
  const token = ScriptApp.getOAuthToken();
  const resp = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) {
    throw new Error('Gagal mengekspor file (' + docTypeSegment + ' \u2192 ' + format + '), kode: ' + resp.getResponseCode() + '. Coba jalankan sekali lagi.');
  }
  return resp.getBlob();
}
function buildSiteReportXlsx_(entries, meta) {
  const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
  const tempSs = SpreadsheetApp.create(meta.fileBaseName);
  const sheet = tempSs.getSheets()[0];
  sheet.setName('Laporan Inspeksi');

  const cols = ['No', 'Tanggal', 'Lokasi / Area', 'Proyek', 'Dokumentasi', 'Pekerjaan', 'Temuan QC', 'Tindak Lanjut', 'Progres', 'Status QC'];

  const headerRowIdx = buildXlsxHeader_(sheet, {
    totalCols: cols.length,
    lines: [
      meta.companyName,
      'LAPORAN DOKUMENTASI ' + meta.periodLabel.toUpperCase() + ' — QC INSPECTOR',
      'Proyek: ' + meta.projectLabel,
      'Periode Laporan: ' + meta.periodRangeLabel,
      'QC Inspector: ' + meta.inspectorNames,
      'Dibuat: ' + meta.generatedAt + ' oleh ' + meta.generatedBy
    ]
  });

  sheet.getRange(headerRowIdx, 1, 1, cols.length).setValues([cols])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#1a2332')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.setFrozenRows(headerRowIdx);
  sheet.setRowHeight(headerRowIdx, 30);

  const photoCol = cols.indexOf('Dokumentasi') + 1;
  const startRow = headerRowIdx + 1;
  const tableData = [];
  const statusStyles = [];

  entries.forEach(function (e, i) {
    const dateStr = e.reportDate ? Utilities.formatDate(new Date(e.reportDate), tz, 'dd/MM/yyyy') : '-';
    const urls = [e.photoUrl].concat(e.additionalPhotoUrls || []).filter(Boolean);
    const photoPlaceholder = urls.length ? '' : '— tidak ada foto —';
    tableData.push([
      i + 1,
      dateStr,
      e.locationArea || '',
      e.projectName || '',
      photoPlaceholder,
      e.workDescription || '',
      e.qcFindings || '-',
      e.followUp || '-',
      (e.progress || 0) + '%',
      e.statusQC || ''
    ]);
    statusStyles.push(SITE_STATUS_STYLE[e.statusQC] || { bg: '#e2e8f0', text: '#475569' });
  });

  if (tableData.length > 0) {
    // 1 single batch call untuk SEMUA data baris dan kolom
    sheet.getRange(startRow, 1, tableData.length, cols.length).setValues(tableData);

    entries.forEach(function (e, i) {
      const curRow = startRow + i;
      sheet.setRowHeight(curRow, 92);
      const style = statusStyles[i];
      sheet.getRange(curRow, 10).setBackground(style.bg).setFontColor(style.text).setFontWeight('bold');

      const urls = [e.photoUrl].concat(e.additionalPhotoUrls || []).filter(Boolean);
      if (urls.length) {
        try {
          const blob = DriveApp.getFileById(extractDriveId_(urls[0])).getBlob();
          const img = sheet.insertImage(blob, photoCol, curRow);
          img.setWidth(110).setHeight(82);
          if (urls.length > 1) sheet.getRange(curRow, photoCol).setNote('+' + (urls.length - 1) + ' foto lainnya.');
        } catch (e2) {
          sheet.getRange(curRow, photoCol).setValue('(foto gagal dimuat)');
        }
      } else {
        sheet.getRange(curRow, photoCol).setFontStyle('italic').setFontColor('#8a97a8');
      }
    });
  }
  let r = startRow + entries.length;

  const lastRow = r - 1;
  if (lastRow >= headerRowIdx) {
    sheet.getRange(headerRowIdx, 1, lastRow - headerRowIdx + 1, cols.length)
      .setBorder(true, true, true, true, true, true, '#dbe2ea', SpreadsheetApp.BorderStyle.SOLID);
    sheet.getRange(headerRowIdx + 1, 6, Math.max(lastRow - headerRowIdx, 0), 3).setWrap(true).setVerticalAlignment('top');
    sheet.getRange(headerRowIdx + 1, 1, Math.max(lastRow - headerRowIdx, 0), cols.length).setVerticalAlignment('top');
  }

  const widths = [32, 78, 130, 130, 130, 220, 220, 200, 70, 130];
  widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });

  SpreadsheetApp.flush();
  const blob = exportGoogleFileAs_(tempSs.getId(), 'spreadsheets', 'xlsx').setName(meta.fileBaseName + '.xlsx');
  try { DriveApp.getFileById(tempSs.getId()).setTrashed(true); } catch (e) { Logger.log('Gagal hapus temp spreadsheet di exportSiteReport: ' + e.message); }
  return blob;
}
function rollbackToRevision(sessionToken, docId) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const target = findDocumentById_(sheet, docId);
  if (!target) return { success: false, message: 'Revisi tujuan tidak ditemukan.' };
  const isOwner = target.UploaderEmail === user.Email;
  if (user.Role !== ROLES.ADMIN && !isOwner) return { success: false, message: 'Anda tidak memiliki izin.' };
  const idx = {};
  DOCUMENTS_HEADER.forEach((h, i) => idx[h] = i + 1);
  const siblings = findAllRevisionRows_(sheet, target.ProjectCode, target.DocumentType, target.DocumentNumber)
    .filter(function (r) { return r.Status !== STATUS.DELETED; });
  siblings.forEach(function (r) {
    sheet.getRange(r.rowIndex, idx.IsLatestRevision).setValue(r.rowIndex === target.rowIndex);
  });
  if (target.Status === STATUS.SUPERSEDED) {
    const targetRow = sheet.getRange(target.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
    targetRow[idx.Status - 1] = STATUS.APPROVED;
    targetRow[idx.LifecycleStage - 1] = LIFECYCLE.APPROVED;
    sheet.getRange(target.rowIndex, 1, 1, targetRow.length).setValues([targetRow]);
  }
  logAudit_(user, 'rollbackToRevision', 'Document', docId, target.DocumentType + ' ' + displayDocCode_(target) + ' Rev' + target.Revision);
  return { success: true, message: 'Revisi ' + target.Revision + ' berhasil dijadikan revisi aktif.' };
}
// ============================================================================
// 10. AUDIT LOG & NOTIFIKASI
// ============================================================================
function logAudit_(user, action, entityType, entityId, details) {
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.AUDIT_LOG);
    if (!sheet) return;
    sheet.appendRow([
      Utilities.getUuid(), new Date(), (user && user.Email) || 'system', (user && user.FullName) || 'system',
      (user && user.Role) || '-', action, entityType || '', entityId || '', details || ''
    ]);
  } catch (e) { /* abaikan */ }
}
function getRecentAuditLog(sessionToken, limit) {
  requireRole_(sessionToken, [ROLES.ADMIN]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.AUDIT_LOG);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const cap = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200);
  const rows = [];
  for (let i = data.length - 1; i >= 1 && rows.length < cap; i--) {
    const row = data[i];
    rows.push({
      timestamp: row[idx.Timestamp] ? new Date(row[idx.Timestamp]).toISOString() : '',
      actorName: row[idx.ActorName], actorEmail: row[idx.ActorEmail], actorRole: row[idx.ActorRole],
      action: row[idx.Action], entityType: row[idx.EntityType], entityId: row[idx.EntityId], details: row[idx.Details]
    });
  }
  return rows;
}
function notify_(recipientEmail, type, message, relatedType, relatedId) {
  try {
    if (!recipientEmail) return;
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.NOTIFICATIONS);
    if (!sheet) return;
    sheet.appendRow([Utilities.getUuid(), String(recipientEmail).toLowerCase().trim(), type || 'info', message || '', relatedType || '', relatedId || '', new Date(), false]);
  } catch (e) { /* abaikan */ }
}
function notifyAdminsNoApprover_(projectName, config, docTitle) {
  try {
    const ss = getSS_();
    const usersSheet = ss.getSheetByName(SHEET.USERS);
    const udata = usersSheet.getDataRange().getValues();
    const idx = usersIdx_();
    const adminEmails = [];
    for (let i = 1; i < udata.length; i++) {
      if (udata[i][idx.Status] === USER_STATUS.ACTIVE && udata[i][idx.Role] === ROLES.ADMIN && udata[i][idx.Email]) {
        adminEmails.push(udata[i][idx.Email]);
        notify_(udata[i][idx.Email], 'no_approver', 'Dokumen "' + docTitle + '" (' + projectName + ') diunggah tanpa approver.', 'Document', '');
      }
    }
    if (!adminEmails.length) return;
    const companyName = (config && config.COMPANY_NAME) || 'PT Asuka Engineering Indonesia';
    MailApp.sendEmail({
      to: adminEmails.join(','),
      subject: '[QC-CMS] PERHATIAN: Dokumen tanpa Approver \u2014 ' + projectName,
      htmlBody: '<p>Dokumen <b>' + escapeHtml_(docTitle) + '</b> (proyek ' + escapeHtml_(projectName) + ') diunggah tanpa approver.</p>' +
        '<p>Mohon lengkapi aturan approver lewat tab <b>Pengaturan Approval</b>.</p>'
    });
  } catch (e) { /* abaikan */ }
}
function countUnreadNotifications_(email) {
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.NOTIFICATIONS);
    if (!sheet) return 0;
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return 0;
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);
    const em = String(email).toLowerCase().trim();
    let count = 0;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idx.RecipientEmail]).toLowerCase().trim() === em && data[i][idx.IsRead] !== true) count++;
    }
    return count;
  } catch (e) { return 0; }
}
function getMyNotifications(sessionToken) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.NOTIFICATIONS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const email = user.Email.toLowerCase().trim();
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[idx.RecipientEmail]).toLowerCase().trim() !== email) continue;
    results.push({
      notifId: row[idx.NotifID], type: row[idx.Type], message: row[idx.Message],
      relatedType: row[idx.RelatedType], relatedId: row[idx.RelatedId],
      createdAt: row[idx.CreatedAt] ? new Date(row[idx.CreatedAt]).toISOString() : '',
      isRead: row[idx.IsRead] === true, rowIndex: i + 1
    });
  }
  results.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  return results.slice(0, 50);
}
function markNotificationRead(sessionToken, notifId) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.NOTIFICATIONS);
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const email = user.Email.toLowerCase().trim();
  for (let i = 1; i < data.length; i++) {
    if (data[i][idx.NotifID] === notifId && String(data[i][idx.RecipientEmail]).toLowerCase().trim() === email) {
      sheet.getRange(i + 1, idx.IsRead + 1).setValue(true);
      return { success: true };
    }
  }
  return { success: false };
}
function markAllNotificationsRead(sessionToken) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.NOTIFICATIONS);
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const email = user.Email.toLowerCase().trim();
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx.RecipientEmail]).toLowerCase().trim() === email && data[i][idx.IsRead] !== true) {
      sheet.getRange(i + 1, idx.IsRead + 1).setValue(true);
      count++;
    }
  }
  return { success: true, count: count };
}
function computeFileHash_(bytes) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, bytes);
  return bytesToHex_(digest);
}
function findDuplicateDocument_(sheet, projectCode, docType, hash, windowDays) {
  if (!hash) return null;
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  if (idx.FileHash === undefined) return null;
  const cutoff = new Date(Date.now() - windowDays * 86400000);
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[idx.Status] === STATUS.DELETED) continue;
    if (row[idx.ProjectCode] !== projectCode || row[idx.DocumentType] !== docType) continue;
    if (!row[idx.FileHash] || row[idx.FileHash] !== hash) continue;
    const ts = row[idx.Timestamp] ? new Date(row[idx.Timestamp]) : null;
    if (ts && ts < cutoff) continue;
    return { docId: row[idx.DocID], fileName: row[idx.FileName], documentNumber: row[idx.DocumentNumber], revision: row[idx.Revision] };
  }
  return null;
}
// ============================================================================
// 11. TRIGGER SLA
// ============================================================================
function checkSLABreaches() {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const now = new Date();
  let notifiedCount = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const type = row[idx.DocumentType];
    const status = row[idx.Status];
    const isLatest = row[idx.IsLatestRevision];
    const slaDue = row[idx.SLADueDate];
    const alreadyNotified = row[idx.SLANotified];
    if (type === 'RFI' && status === STATUS.PENDING && isLatest === true && slaDue && !alreadyNotified) {
      if (new Date(slaDue) < now) {
        const approverEmail = row[idx.ApproverEmail];
        const title = row[idx.Title];
        const projectName = row[idx.ProjectName];
        if (approverEmail) {
          MailApp.sendEmail({
            to: approverEmail,
            subject: '[QC-CMS] RFI Lewat SLA: ' + projectName + ' - ' + title,
            htmlBody: '<p>RFI berikut sudah melewati batas SLA dan masih berstatus Pending:</p>' +
              '<p><b>Proyek:</b> ' + escapeHtml_(projectName) + '<br><b>Judul:</b> ' + escapeHtml_(title) +
              '<br><b>Batas SLA:</b> ' + new Date(slaDue).toLocaleDateString('id-ID') + '</p>' +
              '<p>Mohon segera ditindaklanjuti.</p>'
          });
          notifiedCount++;
        }
        sheet.getRange(i + 1, idx.SLANotified + 1).setValue(true);
      }
    }
  }
  Logger.log('Cek SLA selesai. ' + notifiedCount + ' notifikasi terkirim.');
}
function createDailySLATrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'checkSLABreaches') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkSLABreaches').timeBased().everyDays(1).atHour(8).create();
  try { SpreadsheetApp.getUi().alert('Trigger harian SLA berhasil diaktifkan (jam 08:00).'); } catch (e) { Logger.log('Trigger harian SLA aktif.'); }
}
// ============================================================================
// 12. EDMS — TRANSMITTALS, ACCESS LOG, ARCHIVE, LIFECYCLE
// ============================================================================
function transIdx_() { const idx = {}; TRANSMITTAL_HEADER.forEach((h, i) => idx[h] = i); return idx; }
function transItemsIdx_() { const idx = {}; TRANSMITTAL_ITEMS_HEADER.forEach((h, i) => idx[h] = i); return idx; }
function accessLogIdx_() { const idx = {}; ACCESS_LOG_HEADER.forEach((h, i) => idx[h] = i); return idx; }
function logDocumentAccess_(user, docId, documentCode, action, details) {
  try {
    const sheet = getSS_().getSheetByName(SHEET.ACCESS_LOG);
    if (!sheet) return;
    sheet.appendRow([
      Utilities.getUuid(), new Date(), docId || '', documentCode || '',
      (user && user.Email) || '', (user && user.FullName) || '', action || 'view',
      details || '', ''
    ]);
  } catch (e) { /* abaikan */ }
}
function getDocumentAccessLog(sessionToken, docId) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const docSheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const doc = findDocumentById_(docSheet, docId);
  if (!doc) return { success: false, message: 'Dokumen tidak ditemukan.' };
  const canViewAll = VIEW_ALL_ROLES.indexOf(user.Role) !== -1;
  if (!canViewAll && doc.UploaderEmail !== user.Email) return { success: false, message: 'Anda tidak memiliki izin.' };
  const sheet = ss.getSheetByName(SHEET.ACCESS_LOG);
  if (!sheet) return { success: true, entries: [] };
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, entries: [] };
  const idx = accessLogIdx_();
  const results = [];
  for (let i = data.length - 1; i >= 1 && results.length < 200; i--) {
    const row = data[i];
    if (String(row[idx.DocID]) !== String(docId)) continue;
    results.push({
      timestamp: row[idx.Timestamp] ? new Date(row[idx.Timestamp]).toISOString() : '',
      userEmail: row[idx.UserEmail], userName: row[idx.UserName],
      action: row[idx.Action], details: row[idx.Details]
    });
  }
  logDocumentAccess_(user, docId, displayDocCode_(doc), 'view_access_log', '');
  return { success: true, entries: results };
}
function getDocumentDetail(sessionToken, docId) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const doc = findDocumentById_(sheet, docId);
  if (!doc) return { success: false, message: 'Dokumen tidak ditemukan.' };
  const canViewAll = VIEW_ALL_ROLES.indexOf(user.Role) !== -1;
  if (!canViewAll && doc.UploaderEmail !== user.Email) return { success: false, message: 'Anda tidak memiliki izin.' };
  logDocumentAccess_(user, docId, displayDocCode_(doc), 'view', '');
  const relatedIds = doc.RelatedDocIds ? String(doc.RelatedDocIds).split(',').filter(Boolean) : [];
  const related = relatedIds.map(function (rid) {
    const r = findDocumentById_(sheet, rid);
    return r ? { docId: r.DocID, documentCode: displayDocCode_(r), title: r.Title, documentType: r.DocumentType, revision: r.Revision } : null;
  }).filter(Boolean);
  let supersedes = null;
  if (doc.SupersedesDocId) {
    const s = findDocumentById_(sheet, doc.SupersedesDocId);
    if (s) supersedes = { docId: s.DocID, documentCode: displayDocCode_(s), title: s.Title, revision: s.Revision };
  }
  return {
    success: true,
    doc: {
      docId: doc.DocID, documentCode: displayDocCode_(doc), revision: doc.Revision,
      title: doc.Title, description: doc.Description || '', keywords: doc.Keywords || '',
      referenceNumber: doc.ReferenceNumber || '',
      confidentiality: doc.Confidentiality || 'Internal',
      lifecycleStage: doc.LifecycleStage || doc.Status,
      status: doc.Status, projectName: doc.ProjectName, projectCode: doc.ProjectCode,
      discipline: doc.Discipline, documentType: doc.DocumentType, standardRef: doc.StandardRef,
      fileName: doc.FileName, fileUrl: doc.FileURL,
      additionalFileUrls: doc.AdditionalFileURLs ? String(doc.AdditionalFileURLs).split('\n').filter(Boolean) : [],
      uploaderName: doc.UploaderName, uploaderEmail: doc.UploaderEmail,
      approverName: doc.ApproverName, approvalDate: doc.ApprovalDate ? new Date(doc.ApprovalDate).toISOString() : '',
      comments: doc.Comments || '', timestamp: doc.Timestamp ? new Date(doc.Timestamp).toISOString() : '',
      archivedDate: doc.ArchivedDate ? new Date(doc.ArchivedDate).toISOString() : '',
      retentionUntil: doc.RetentionUntil ? new Date(doc.RetentionUntil).toISOString() : '',
      checkedOutBy: doc.CheckedOutBy || '', checkedOutAt: doc.CheckedOutAt ? new Date(doc.CheckedOutAt).toISOString() : ''
    },
    related: related, supersedes: supersedes
  };
}
function createTransmittal(sessionToken, payload) {
  const user = requireRole_(sessionToken, [ROLES.ADMIN, ROLES.MANAGER, ROLES.QC_ENGINEER]);
  payload = payload || {};
  if (!payload.projectCode) return { success: false, message: 'Proyek wajib dipilih.' };
  if (!payload.recipientCompany) return { success: false, message: 'Perusahaan penerima wajib diisi.' };
  if (!payload.docIds || !payload.docIds.length) return { success: false, message: 'Pilih minimal 1 dokumen.' };
  if (TRANSMITTAL_PURPOSES.indexOf(payload.purpose) === -1) return { success: false, message: 'Tujuan transmittal tidak valid.' };
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sibuk.' }; }
  try {
    const ss = getSS_();
    const projSheet = ss.getSheetByName(SHEET.PROJECTS);
    const proj = findProjectByCode_(projSheet, payload.projectCode);
    const projectName = proj ? proj.ProjectName : payload.projectCode;
    const transNumber = getNextTransmittalNumber_(ss, payload.projectCode);
    const docSheet = ss.getSheetByName(SHEET.DOCUMENTS);
    const selectedDocs = [];
    for (let i = 0; i < payload.docIds.length; i++) {
      const d = findDocumentById_(docSheet, payload.docIds[i]);
      if (d) selectedDocs.push(d);
    }
    if (!selectedDocs.length) return { success: false, message: 'Dokumen yang dipilih tidak ditemukan.' };
    const tId = Utilities.getUuid();
    const transSheet = ss.getSheetByName(SHEET.TRANSMITTALS);
    transSheet.appendRow([
      tId, transNumber, new Date(), payload.projectCode, projectName,
      payload.discipline || '', user.FullName, user.Email,
      sanitizeForSheet_(payload.recipientCompany), sanitizeForSheet_(payload.recipientName || ''),
      payload.recipientEmail || '', payload.purpose, sanitizeForSheet_(payload.remarks || ''),
      'Sent', new Date(), '', '', selectedDocs.length, '', user.Email
    ]);
    const itemsSheet = ss.getSheetByName(SHEET.TRANSMITTAL_ITEMS);
    selectedDocs.forEach(function (d) {
      itemsSheet.appendRow([
        Utilities.getUuid(), tId, d.DocID, displayDocCode_(d), d.Revision, d.DocumentType, d.Title, payload.purpose
      ]);
      logDocumentAccess_(user, d.DocID, displayDocCode_(d), 'transmittal', transNumber + ' → ' + payload.recipientCompany);
    });
    logAudit_(user, 'createTransmittal', 'Transmittal', tId,
      transNumber + ' → ' + payload.recipientCompany + ' (' + selectedDocs.length + ' dokumen, ' + payload.purpose + ')');
    let coverUrl = '';
    try {
      const config = getConfig_();
      const coverBlob = buildTransmittalCoverSheet_(transNumber, {
        projectName: projectName, recipientCompany: payload.recipientCompany,
        recipientName: payload.recipientName || '', recipientEmail: payload.recipientEmail || '',
        purpose: payload.purpose, remarks: payload.remarks || '',
        senderName: user.FullName, senderEmail: user.Email,
        documents: selectedDocs, companyName: config.COMPANY_NAME || 'PT Asuka Engineering Indonesia'
      });
      const folder = getOrCreateFolderPath_(config.ROOT_FOLDER_ID, [projectName, 'Transmittals']);
      const coverFile = folder.createFile(coverBlob);
      coverUrl = coverFile.getUrl();
      transSheet.getRange(transSheet.getLastRow(), TRANSMITTAL_HEADER.indexOf('CoverSheetURL') + 1).setValue(coverUrl);
    } catch (e) { /* abaikan */ }
    if (payload.recipientEmail) {
      try { sendTransmittalEmail_(payload, selectedDocs, transNumber, projectName, coverUrl); } catch (e) { /* abaikan */ }
    }
    return { success: true, message: 'Transmittal ' + transNumber + ' berhasil dibuat (' + selectedDocs.length + ' dokumen).', transmittalId: tId, transmittalNumber: transNumber, coverSheetUrl: coverUrl };
  } finally { lock.releaseLock(); }
}
function getNextTransmittalNumber_(ss, projectCode) {
  const sheet = ss.getSheetByName(SHEET.TRANSMITTALS);
  if (!sheet) return projectCode + '-TR-001';
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return projectCode + '-TR-001';
  const idx = transIdx_();
  let maxN = 0;
  const prefix = projectCode + '-TR-';
  for (let i = 1; i < data.length; i++) {
    const num = String(data[i][idx.TransmittalNumber] || '');
    if (num.indexOf(prefix) === 0) {
      const n = parseInt(num.slice(prefix.length), 10);
      if (!isNaN(n) && n > maxN) maxN = n;
    }
  }
  return prefix + String(maxN + 1).padStart(3, '0');
}
function buildTransmittalCoverSheet_(transNumber, meta) {
  const doc = DocumentApp.create('Transmittal-' + transNumber);
  const body = doc.getBody();
  body.setMarginTop(50).setMarginBottom(50).setMarginLeft(50).setMarginRight(50);

  buildDocHeader_(body, {
    title: 'DOCUMENT TRANSMITTAL',
    subtitle: meta.companyName,
    textColWidth: 460
  });
  body.appendHorizontalRule();
  body.appendParagraph('Transmittal No.: ' + transNumber).editAsText().setBold(true).setFontSize(13);
  body.appendParagraph(' ');
  const info = [
    ['Project', meta.projectName],
    ['To (Company)', meta.recipientCompany],
    ['Attn.', meta.recipientName || '-'],
    ['Email', meta.recipientEmail || '-'],
    ['Purpose', meta.purpose],
    ['From', meta.senderName + ' <' + meta.senderEmail + '>'],
    ['Date', formatIndonesianDate_(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta')]
  ];
  const tbl = body.appendTable(info);
  tbl.setBorderWidth(0.5);
  for (let r = 0; r < info.length; r++) {
    tbl.getRow(r).getCell(0).setBackgroundColor('#eef1f5');
    tbl.getRow(r).getCell(0).editAsText().setBold(true).setFontSize(10);
    tbl.getRow(r).getCell(1).editAsText().setFontSize(10);
  }
  body.appendParagraph(' ');
  body.appendParagraph('Daftar Dokumen').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  const rows = [['No', 'Doc. Number', 'Rev', 'Type', 'Title']];
  meta.documents.forEach(function (d, i) {
    rows.push([String(i + 1), displayDocCode_(d), String(d.Revision), d.DocumentType, d.Title]);
  });
  const docTbl = body.appendTable(rows);
  const hdr = docTbl.getRow(0);
  for (let c = 0; c < hdr.getNumCells(); c++) {
    hdr.getCell(c).setBackgroundColor('#1a2332');
    hdr.getCell(c).editAsText().setForegroundColor('#ffffff').setBold(true).setFontSize(10);
  }
  if (meta.remarks) {
    body.appendParagraph(' ');
    body.appendParagraph('Remarks: ' + meta.remarks).setItalic(true).setFontSize(10);
  }
  body.appendParagraph(' ');
  body.appendParagraph('Mohon konfirmasi penerimaan dengan membalas email transmittal ini.').setFontSize(9).setForegroundColor('#5b6b7f');
  body.appendParagraph(' ');
  const sign = body.appendTable([
    ['Dikirim oleh', 'Diterima oleh'],
    ['\n\n\n' + meta.senderName + '\n' + meta.senderEmail, '\n\n\n_________________\n' + (meta.recipientName || '')]
  ]);
  sign.setBorderWidth(0.5);
  doc.saveAndClose();
  return DriveApp.getFileById(doc.getId()).getAs('application/pdf').setName('Transmittal-' + transNumber + '.pdf');
}
function sendTransmittalEmail_(payload, docs, transNumber, projectName, coverUrl) {
  const rows = docs.map(function (d, i) {
    return '<tr><td style="padding:4px 8px;border-bottom:1px solid #eee;">' + (i + 1) + '</td><td style="padding:4px 8px;border-bottom:1px solid #eee;font-family:monospace;">' + escapeHtml_(displayDocCode_(d)) + '</td><td style="padding:4px 8px;border-bottom:1px solid #eee;">R' + escapeHtml_(d.Revision) + '</td><td style="padding:4px 8px;border-bottom:1px solid #eee;">' + escapeHtml_(d.DocumentType) + '</td><td style="padding:4px 8px;border-bottom:1px solid #eee;">' + escapeHtml_(d.Title) + '</td></tr>';
  }).join('');
  const html = '<div style="font-family:Arial,sans-serif;color:#1a2332;max-width:640px;">' +
    '<h2 style="color:#1a2332;">Document Transmittal — ' + escapeHtml_(transNumber) + '</h2>' +
    '<p>Kepada Yth. <b>' + escapeHtml_(payload.recipientCompany) + '</b>' + (payload.recipientName ? ' (Attn: ' + escapeHtml_(payload.recipientName) + ')' : '') + '</p>' +
    '<p><b>Proyek:</b> ' + escapeHtml_(projectName) + '<br><b>Tujuan:</b> ' + escapeHtml_(payload.purpose) + '</p>' +
    '<table style="border-collapse:collapse;width:100%;font-size:12.5px;"><thead><tr style="background:#1a2332;color:#fff;"><th style="padding:6px 8px;">No</th><th style="padding:6px 8px;">Doc. Number</th><th style="padding:6px 8px;">Rev</th><th style="padding:6px 8px;">Type</th><th style="padding:6px 8px;text-align:left;">Title</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    (payload.remarks ? '<p><b>Remarks:</b> ' + escapeHtml_(payload.remarks) + '</p>' : '') +
    (coverUrl ? '<p><a href="' + coverUrl + '" style="background:#163d78;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">📄 Unduh Cover Sheet (PDF)</a></p>' : '') +
    '<p style="color:#6b7280;font-size:12px;margin-top:16px;">Mohon konfirmasi penerimaan dokumen ini dengan membalas email.</p></div>';
  MailApp.sendEmail({ to: payload.recipientEmail, subject: '[QC-CMS] Transmittal ' + transNumber + ' — ' + projectName, htmlBody: html });
}
function getTransmittals(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  filters = filters || {};
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.TRANSMITTALS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const idx = transIdx_();
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (filters.projectCode && row[idx.ProjectCode] !== filters.projectCode) continue;
    if (filters.status && row[idx.Status] !== filters.status) continue;
    results.push({
      transmittalId: row[idx.TransmittalID],
      transmittalNumber: row[idx.TransmittalNumber],
      timestamp: row[idx.Timestamp] ? new Date(row[idx.Timestamp]).toISOString() : '',
      projectCode: row[idx.ProjectCode], projectName: row[idx.ProjectName],
      discipline: row[idx.Discipline],
      senderName: row[idx.SenderName], senderEmail: row[idx.SenderEmail],
      recipientCompany: row[idx.RecipientCompany], recipientName: row[idx.RecipientName], recipientEmail: row[idx.RecipientEmail],
      purpose: row[idx.Purpose], remarks: row[idx.Remarks],
      status: row[idx.Status],
      sentAt: row[idx.SentAt] ? new Date(row[idx.SentAt]).toISOString() : '',
      acknowledgedAt: row[idx.AcknowledgedAt] ? new Date(row[idx.AcknowledgedAt]).toISOString() : '',
      acknowledgedBy: row[idx.AcknowledgedBy],
      documentCount: row[idx.DocumentCount],
      coverSheetUrl: row[idx.CoverSheetURL]
    });
  }
  results.sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
  return results.slice(0, 200);
}
function getTransmittalDetail(sessionToken, transmittalId) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.TRANSMITTALS);
  const data = sheet.getDataRange().getValues();
  const idx = transIdx_();
  let head = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idx.TransmittalID] === transmittalId) { head = data[i]; break; }
  }
  if (!head) return { success: false, message: 'Transmittal tidak ditemukan.' };
  const itemsSheet = ss.getSheetByName(SHEET.TRANSMITTAL_ITEMS);
  const idata = itemsSheet.getDataRange().getValues();
  const iidx = transItemsIdx_();
  const items = [];
  for (let i = 1; i < idata.length; i++) {
    if (idata[i][iidx.TransmittalID] === transmittalId) {
      items.push({
        docId: idata[i][iidx.DocID], documentCode: idata[i][iidx.DocumentCode],
        revision: idata[i][iidx.Revision], documentType: idata[i][iidx.DocumentType],
        title: idata[i][iidx.Title], purpose: idata[i][iidx.Purpose]
      });
    }
  }
  return {
    success: true,
    transmittal: {
      transmittalNumber: head[idx.TransmittalNumber],
      timestamp: head[idx.Timestamp] ? new Date(head[idx.Timestamp]).toISOString() : '',
      projectName: head[idx.ProjectName], projectCode: head[idx.ProjectCode],
      senderName: head[idx.SenderName], recipientCompany: head[idx.RecipientCompany],
      recipientName: head[idx.RecipientName], recipientEmail: head[idx.RecipientEmail],
      purpose: head[idx.Purpose], remarks: head[idx.Remarks], status: head[idx.Status],
      acknowledgedAt: head[idx.AcknowledgedAt] ? new Date(head[idx.AcknowledgedAt]).toISOString() : '',
      acknowledgedBy: head[idx.AcknowledgedBy], coverSheetUrl: head[idx.CoverSheetURL]
    },
    items: items
  };
}
function acknowledgeTransmittal(sessionToken, transmittalId, note) {
  const user = requireRole_(sessionToken, [ROLES.ADMIN, ROLES.MANAGER]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.TRANSMITTALS);
  const data = sheet.getDataRange().getValues();
  const idx = transIdx_();
  for (let i = 1; i < data.length; i++) {
    if (data[i][idx.TransmittalID] === transmittalId) {
      data[i][idx.Status] = 'Acknowledged';
      data[i][idx.AcknowledgedAt] = new Date();
      data[i][idx.AcknowledgedBy] = user.FullName + (note ? ' — ' + note : '');
      sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
      logAudit_(user, 'acknowledgeTransmittal', 'Transmittal', transmittalId, data[i][idx.TransmittalNumber]);
      return { success: true, message: 'Transmittal ditandai sudah diterima.' };
    }
  }
  return { success: false, message: 'Transmittal tidak ditemukan.' };
}
function archiveDocument(sessionToken, docId, retentionYears) {
  const user = requireRole_(sessionToken, [ROLES.ADMIN, ROLES.MANAGER]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const doc = findDocumentById_(sheet, docId);
  if (!doc) return { success: false, message: 'Dokumen tidak ditemukan.' };
  const idx = {};
  DOCUMENTS_HEADER.forEach((h, i) => idx[h] = i + 1);
  const now = new Date();
  const years = parseInt(retentionYears, 10) || 5;
  const retention = new Date(now.getTime() + years * 365 * 86400000);
  const archRow = sheet.getRange(doc.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  archRow[idx.LifecycleStage - 1] = LIFECYCLE.ARCHIVED;
  archRow[idx.ArchivedDate - 1] = now;
  archRow[idx.RetentionUntil - 1] = retention;
  sheet.getRange(doc.rowIndex, 1, 1, archRow.length).setValues([archRow]);
  logAudit_(user, 'archiveDocument', 'Document', docId, displayDocCode_(doc) + ' Rev' + doc.Revision + ' (retensi ' + years + ' tahun)');
  return { success: true, message: 'Dokumen diarsipkan. Retensi sampai ' + formatIndonesianDateShort_(retention, Session.getScriptTimeZone()) + '.' };
}
function restoreFromArchive(sessionToken, docId) {
  const user = requireRole_(sessionToken, [ROLES.ADMIN, ROLES.MANAGER]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const doc = findDocumentById_(sheet, docId);
  if (!doc) return { success: false, message: 'Dokumen tidak ditemukan.' };
  const idx = {};
  DOCUMENTS_HEADER.forEach((h, i) => idx[h] = i + 1);
  const restoredStage = doc.IsLatestRevision === true
    ? (doc.Status === STATUS.APPROVED ? LIFECYCLE.APPROVED : (doc.Status === STATUS.PENDING ? LIFECYCLE.IN_REVIEW : doc.Status))
    : LIFECYCLE.SUPERSEDED;
  const restRow = sheet.getRange(doc.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  restRow[idx.LifecycleStage - 1] = restoredStage;
  restRow[idx.ArchivedDate - 1] = '';
  restRow[idx.RetentionUntil - 1] = '';
  sheet.getRange(doc.rowIndex, 1, 1, restRow.length).setValues([restRow]);
  logAudit_(user, 'restoreFromArchive', 'Document', docId, displayDocCode_(doc) + ' Rev' + doc.Revision);
  return { success: true, message: 'Dokumen dikembalikan dari arsip.' };
}
function markDocumentObsolete(sessionToken, docId, reason) {
  const user = requireRole_(sessionToken, [ROLES.ADMIN, ROLES.MANAGER]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const doc = findDocumentById_(sheet, docId);
  if (!doc) return { success: false, message: 'Dokumen tidak ditemukan.' };
  const idx = {};
  DOCUMENTS_HEADER.forEach((h, i) => idx[h] = i + 1);
  const obsRow = sheet.getRange(doc.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  obsRow[idx.LifecycleStage - 1] = LIFECYCLE.OBSOLETE;
  if (reason) {
    const oldComments = doc.Comments || '';
    obsRow[idx.Comments - 1] = sanitizeForSheet_((oldComments ? oldComments + ' | ' : '') + 'OBSOLETE: ' + reason);
  }
  sheet.getRange(doc.rowIndex, 1, 1, obsRow.length).setValues([obsRow]);
  logAudit_(user, 'markObsolete', 'Document', docId, displayDocCode_(doc) + ' Rev' + doc.Revision + (reason ? ' — ' + reason : ''));
  return { success: true, message: 'Dokumen ditandai Obsolete.' };
}
function getArchivedDocuments(sessionToken, projectCode) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const canViewAll = VIEW_ALL_ROLES.indexOf(user.Role) !== -1;
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[idx.Status] === STATUS.DELETED) continue;
    if (row[idx.LifecycleStage] !== LIFECYCLE.ARCHIVED && row[idx.LifecycleStage] !== LIFECYCLE.OBSOLETE) continue;
    if (projectCode && row[idx.ProjectCode] !== projectCode) continue;
    if (!canViewAll && row[idx.UploaderEmail] !== user.Email) continue;
    results.push({
      docId: row[idx.DocID],
      documentCode: displayDocCode_({ DocumentCode: row[idx.DocumentCode], ProjectCode: row[idx.ProjectCode], DocumentType: row[idx.DocumentType], DocumentNumber: row[idx.DocumentNumber] }),
      revision: row[idx.Revision], title: row[idx.Title], projectName: row[idx.ProjectName],
      documentType: row[idx.DocumentType], discipline: row[idx.Discipline],
      lifecycleStage: row[idx.LifecycleStage],
      archivedDate: row[idx.ArchivedDate] ? new Date(row[idx.ArchivedDate]).toISOString() : '',
      retentionUntil: row[idx.RetentionUntil] ? new Date(row[idx.RetentionUntil]).toISOString() : '',
      fileUrl: row[idx.FileURL], uploaderName: row[idx.UploaderName]
    });
  }
  results.sort(function (a, b) { return new Date(b.archivedDate) - new Date(a.archivedDate); });
  return results;
}
function checkOutDocument(sessionToken, docId) {
  const user = requireRole_(sessionToken, [ROLES.ADMIN, ROLES.QC_ENGINEER, ROLES.MANAGER]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const doc = findDocumentById_(sheet, docId);
  if (!doc) return { success: false, message: 'Dokumen tidak ditemukan.' };
  if (doc.CheckedOutBy && doc.CheckedOutBy !== user.Email) return { success: false, message: 'Dokumen sedang di-checkout oleh ' + doc.CheckedOutBy + '.' };
  const idx = {};
  DOCUMENTS_HEADER.forEach((h, i) => idx[h] = i + 1);
  sheet.getRange(doc.rowIndex, idx.CheckedOutBy, 1, 2).setValues([[user.Email, new Date()]]);
  logAudit_(user, 'checkOutDocument', 'Document', docId, displayDocCode_(doc));
  return { success: true, message: 'Dokumen di-checkout. Anda dapat mengeditnya.' };
}
function checkInDocument(sessionToken, docId) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const doc = findDocumentById_(sheet, docId);
  if (!doc) return { success: false, message: 'Dokumen tidak ditemukan.' };
  if (doc.CheckedOutBy && doc.CheckedOutBy !== user.Email && user.Role !== ROLES.ADMIN) return { success: false, message: 'Anda bukan pemegang checkout dokumen ini.' };
  const idx = {};
  DOCUMENTS_HEADER.forEach((h, i) => idx[h] = i + 1);
  sheet.getRange(doc.rowIndex, idx.CheckedOutBy, 1, 2).setValues([['', '']]);
  logAudit_(user, 'checkInDocument', 'Document', docId, displayDocCode_(doc));
  return { success: true, message: 'Dokumen di-check-in.' };
}
// ============================================================================
// 13. UTILITAS
// ============================================================================
function getSS_() {
  const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(extractDriveId_(SPREADSHEET_ID)) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Spreadsheet tidak ditemukan atau belum terikat (bound). Pastikan variabel SPREADSHEET_ID di kode.gs sudah diisi dengan ID Spreadsheet.');
  }
  return ss;
}
function getConfig_() {
  const cache = CacheService.getScriptCache();
  try {
    const cached = cache.get('qc_config_cache');
    if (cached) return JSON.parse(cached);
  } catch (e) { /* lanjut dari sheet */ }
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.CONFIG);
  const data = sheet.getDataRange().getValues();
  const config = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) config[data[i][0]] = data[i][1];
  }
  try { cache.put('qc_config_cache', JSON.stringify(config), CACHE_SECONDS); } catch (e) { /* abaikan */ }
  return config;
}
function getActiveProjects_() {
  const cache = CacheService.getScriptCache();
  try {
    const cached = cache.get('qc_projects_cache');
    if (cached) return JSON.parse(cached);
  } catch (e) { /* lanjut dari sheet */ }
  try {
    const ss = getSS_();
    const projectSheet = ss.getSheetByName(SHEET.PROJECTS);
    if (!projectSheet) return [];
    const data = projectSheet.getDataRange().getValues();
    const projects = [];
    if (data.length > 1) {
      const header = data[0];
      const idx = {};
      header.forEach((h, i) => idx[h] = i);
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[idx.ProjectCode] && (!row[idx.Status] || row[idx.Status] === 'Active')) {
          projects.push({ code: row[idx.ProjectCode], name: row[idx.ProjectName] || row[idx.ProjectCode] });
        }
      }
    }
    try { cache.put('qc_projects_cache', JSON.stringify(projects), CACHE_SECONDS); } catch (e) { /* abaikan */ }
    return projects;
  } catch (err) {
    Logger.log('getActiveProjects_ gagal: ' + err.message);
    return [];
  }
}
function escapeHtml_(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function sanitizeForSheet_(str) {
  str = (str === null || str === undefined) ? '' : String(str);
  return /^[=+\-@]/.test(str) ? ("'" + str) : str;
}
function sanitizeFileName_(name) {
  return String(name || 'file').replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
}
function bytesToHex_(bytes) {
  return bytes.map(b => {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}
function buildApprovalToken_(docId, secret, expiry) {
  const payload = expiry ? (docId + '|' + expiry) : docId;
  const raw = Utilities.computeHmacSha256Signature(payload, secret || 'ganti-secret-ini-di-config');
  return bytesToHex_(raw);
}
function verifyApprovalToken_(docId, token, secret, expiry) {
  if (!docId || !token) return false;
  if (expiry) {
    const expNum = Number(expiry);
    if (!expNum || Date.now() > expNum) return false;
    return buildApprovalToken_(docId, secret, expNum) === token;
  }
  return buildApprovalToken_(docId, secret) === token;
}
function generateSalt_() { return Utilities.getUuid().replace(/-/g, ''); }
function hashPassword_(password, salt) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt);
  return bytesToHex_(digest);
}
function verifyPassword_(password, salt, hash) { return hashPassword_(password, salt) === hash; }
function addBusinessDays_(startDate, days) {
  const date = new Date(startDate);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return date;
}
function getFileExtension_(fileName) {
  const parts = String(fileName).split('.');
  return parts.length > 1 ? parts.pop() : '';
}
function buildFileName_(documentCode, revision, ext) {
  return documentCode + '-R' + revision + (ext ? '.' + ext : '');
}
function extractDriveId_(input) {
  if (!input) return '';
  const str = String(input).trim();
  if (!/^https?:\/\//i.test(str)) return str;
  let m = str.match(/\/(?:folders|d)\/([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1];
  m = str.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1];
  return str;
}
function getOrCreateFolderPath_(rootFolderId, pathParts) {
  const cleanId = extractDriveId_(rootFolderId);
  if (!cleanId) throw new Error('ROOT_FOLDER_ID belum diisi di tab Config.');
  let currentFolder;
  try { currentFolder = DriveApp.getFolderById(cleanId); } catch (err) {
    throw new Error('ROOT_FOLDER_ID di tab Config tidak valid atau tidak bisa diakses.');
  }
  pathParts.forEach(name => {
    const safeName = name || 'Umum';
    const existing = currentFolder.getFoldersByName(safeName);
    currentFolder = existing.hasNext() ? existing.next() : currentFolder.createFolder(safeName);
  });
  return currentFolder;
}
function createFileInFolder_(folder, fileName, bytes, mimeType) {
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const file = folder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    // Abaikan jika domain Google Workspace membatasi sharing publik
  }
  return file;
}
function getWebAppUrl_(config) {
  try {
    const url = ScriptApp.getService().getUrl();
    if (url) return url;
  } catch (e) { /* fallback ke Config */ }
  return (config && config.WEB_APP_URL) || '';
}
function findProjectByCode_(sheet, code) {
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  for (let i = 1; i < data.length; i++) {
    if (data[i][idx.ProjectCode] === code) {
      const obj = {};
      header.forEach((h, c) => obj[h] = data[i][c]);
      return obj;
    }
  }
  return null;
}
function findDocumentById_(sheet, docId) {
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  for (let i = 1; i < data.length; i++) {
    if (data[i][idx.DocID] === docId) {
      const obj = { rowIndex: i + 1 };
      header.forEach((h, c) => obj[h] = data[i][c]);
      return obj;
    }
  }
  return null;
}
function findLatestRows_(sheet, projectCode, docType, docNumber) {
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[idx.ProjectCode] === projectCode && row[idx.DocumentType] === docType &&
        String(row[idx.DocumentNumber]) === String(docNumber) && row[idx.IsLatestRevision] === true) {
      results.push({ rowIndex: i + 1, Status: row[idx.Status] });
    }
  }
  return results;
}
function findAllRevisionRows_(sheet, projectCode, docType, docNumber) {
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[idx.ProjectCode] === projectCode && row[idx.DocumentType] === docType && String(row[idx.DocumentNumber]) === String(docNumber)) {
      results.push({ rowIndex: i + 1, Status: row[idx.Status], Revision: row[idx.Revision] });
    }
  }
  return results;
}
function findApprovalRule_(projectCode, docType, config) {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.APPROVERS);
  const data = sheet.getDataRange().getValues();
  if (data.length > 1) {
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);
    const tryMatch = function (pc, dt) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][idx.ProjectCode] === pc && data[i][idx.DocumentType] === dt) return data[i];
      }
      return null;
    };
    const row = tryMatch(projectCode, docType) || tryMatch(projectCode, 'ALL') || tryMatch('ALL', docType) || tryMatch('ALL', 'ALL');
    if (row) {
      return {
        requireApproval: parseBool_(row[idx.RequireApproval], true),
        approverEmail: row[idx.ApproverEmail] || ''
      };
    }
  }
  return { requireApproval: true, approverEmail: findFallbackApproverEmail_(config) };
}
function findFallbackApproverEmail_(config) {
  if (config.DEFAULT_APPROVER_EMAIL) return config.DEFAULT_APPROVER_EMAIL;
  const ss = getSS_();
  const usersSheet = ss.getSheetByName(SHEET.USERS);
  if (usersSheet) {
    const udata = usersSheet.getDataRange().getValues();
    const idx = usersIdx_();
    for (let i = 1; i < udata.length; i++) {
      if (udata[i][idx.Status] === USER_STATUS.ACTIVE && APPROVER_ROLES.indexOf(udata[i][idx.Role]) !== -1) {
        return udata[i][idx.Email];
      }
    }
  }
  return '';
}
function getNextDocumentNumber_(sheet, projectCode, docType) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 1;
  const header = data[0];
  const colProjectCode = header.indexOf('ProjectCode');
  const colDocType = header.indexOf('DocumentType');
  const colDocNumber = header.indexOf('DocumentNumber');
  let maxNum = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[colProjectCode] === projectCode && row[colDocType] === docType) {
      const n = parseInt(row[colDocNumber], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  }
  return maxNum + 1;
}
function getNextRevisionNumber_(sheet, projectCode, docType, docNumber) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 0;
  const header = data[0];
  const colProjectCode = header.indexOf('ProjectCode');
  const colDocType = header.indexOf('DocumentType');
  const colDocNumber = header.indexOf('DocumentNumber');
  const colRevision = header.indexOf('Revision');
  let maxRev = -1;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[colProjectCode] === projectCode && row[colDocType] === docType && String(row[colDocNumber]) === String(docNumber)) {
      const r = parseInt(row[colRevision], 10);
      if (!isNaN(r) && r > maxRev) maxRev = r;
    }
  }
  return maxRev + 1;
}
function usersIdx_() {
  const idx = {};
  USERS_HEADER.forEach((h, i) => idx[h] = i);
  return idx;
}
function rowToUserObj_(row, idx, rowIndex) {
  const obj = { rowIndex: rowIndex };
  USERS_HEADER.forEach(h => obj[h] = row[idx[h]]);
  return obj;
}
function findUserByEmail_(sheet, email) {
  if (!email) return null;
  const data = sheet.getDataRange().getValues();
  const idx = usersIdx_();
  const target = String(email).toLowerCase().trim();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx.Email]).toLowerCase().trim() === target) {
      return rowToUserObj_(data[i], idx, i + 1);
    }
  }
  return null;
}
function findUserBySessionToken_(sheet, token) {
  if (!token) return null;
  const data = sheet.getDataRange().getValues();
  const idx = usersIdx_();
  for (let i = 1; i < data.length; i++) {
    if (data[i][idx.SessionToken] && data[i][idx.SessionToken] === token) {
      return rowToUserObj_(data[i], idx, i + 1);
    }
  }
  return null;
}
function findUserById_(sheet, userId) {
  const data = sheet.getDataRange().getValues();
  const idx = usersIdx_();
  for (let i = 1; i < data.length; i++) {
    if (data[i][idx.UserID] === userId) {
      return rowToUserObj_(data[i], idx, i + 1);
    }
  }
  return null;
}
// ============================================================================
// 14. NFI LOG — Tracker Inspeksi Lapangan
// ============================================================================
function nfiLogIdx_() {
  const idx = {};
  NFI_LOG_HEADER.forEach((h, i) => idx[h] = i);
  return idx;
}
function getNFILogList(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  filters = filters || {};
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.NFILOG);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const idx = nfiLogIdx_();
  const canManageAll = user.Role === ROLES.ADMIN || user.Role === ROLES.MANAGER;
  const results = [];
  const searchQ = filters.search ? String(filters.search).toLowerCase().trim() : '';
  const projectFilter = filters.projectCode ? String(filters.projectCode).trim() : '';
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[idx.RecordStatus] === 'Deleted') continue;
    if (projectFilter && String(row[idx.ProjectCode] || '') !== projectFilter) continue;
    if (filters.discipline && row[idx.Discipline] !== filters.discipline) continue;
    if (filters.status && row[idx.Status] !== filters.status) continue;
    if (filters.result && row[idx.Result] !== filters.result) continue;
    if (filters.typeOfInspection && row[idx.TypeOfInspection] !== filters.typeOfInspection) continue;
    if (filters.dateFrom && row[idx.InspectionDate] && new Date(row[idx.InspectionDate]) < startOfDay_(new Date(filters.dateFrom))) continue;
    if (filters.dateTo && row[idx.InspectionDate] && new Date(row[idx.InspectionDate]) > endOfDay_(new Date(filters.dateTo))) continue;
    if (searchQ) {
      const hay = [
        row[idx.NoNFI], row[idx.SubjectDescription], row[idx.Area], row[idx.Location],
        row[idx.Discipline], row[idx.ITRNo], row[idx.ITPNo], row[idx.PICAei],
        row[idx.Remark], row[idx.TypeOfInspection], row[idx.ProjectName], row[idx.ProjectCode]
      ].filter(Boolean).join(' ').toLowerCase();
      if (hay.indexOf(searchQ) === -1) continue;
    }
    const canManage = canManageAll || row[idx.CreatedByEmail] === user.Email;
    results.push({
      nfiId: row[idx.NFIID],
      no: row[idx.No],
      noNfi: row[idx.NoNFI],
      projectCode: row[idx.ProjectCode] || '',
      projectName: row[idx.ProjectName] || '',
      subjectDescription: row[idx.SubjectDescription],
      area: row[idx.Area],
      typeOfInspection: row[idx.TypeOfInspection],
      issuedDate: row[idx.IssuedDate] ? new Date(row[idx.IssuedDate]).toISOString() : '',
      discipline: row[idx.Discipline],
      location: row[idx.Location],
      inspectionDate: row[idx.InspectionDate] ? new Date(row[idx.InspectionDate]).toISOString() : '',
      result: row[idx.Result],
      itrNo: row[idx.ITRNo],
      itpNo: row[idx.ITPNo],
      reportSubmissionDate: row[idx.ReportSubmissionDate] ? new Date(row[idx.ReportSubmissionDate]).toISOString() : '',
      completeDate: row[idx.CompleteDate] ? new Date(row[idx.CompleteDate]).toISOString() : '',
      status: row[idx.Status],
      picAei: row[idx.PICAei],
      remark: row[idx.Remark],
      attachmentUrl: row[idx.AttachmentURL],
      createdByName: row[idx.CreatedByName],
      createdByEmail: row[idx.CreatedByEmail],
      createdAt: row[idx.CreatedAt] ? new Date(row[idx.CreatedAt]).toISOString() : '',
      updatedAt: row[idx.UpdatedAt] ? new Date(row[idx.UpdatedAt]).toISOString() : '',
      canManage: canManage
    });
  }
  results.sort(function (a, b) {
    const pc = String(a.projectCode).localeCompare(String(b.projectCode));
    if (pc !== 0) return pc;
    const an = parseInt(a.no, 10) || 0;
    const bn = parseInt(b.no, 10) || 0;
    if (an !== bn) return bn - an;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  return results.slice(0, 500);
}
/** Nomor urut (No.) dihitung PER PROYEK — tiap proyek mulai dari 1 lagi. */
function getNextNfiNo_(sheet, projectCode) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 1;
  const idx = nfiLogIdx_();
  let maxN = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx.ProjectCode] || '') !== String(projectCode || '')) continue;
    const n = parseInt(data[i][idx.No], 10);
    if (!isNaN(n) && n > maxN) maxN = n;
  }
  return maxN + 1;
}
function saveNFILogEntry(sessionToken, payload) {
  const user = requireRole_(sessionToken, UPLOADER_ROLES);
  payload = payload || {};
  if (!payload.projectCode) return { success: false, message: 'Proyek wajib dipilih.' };
  if (!payload.noNfi) return { success: false, message: 'No. NFI wajib diisi.' };
  if (!payload.subjectDescription) return { success: false, message: 'Subject Description wajib diisi.' };
  if (!payload.discipline) return { success: false, message: 'Discipline wajib dipilih.' };
  if (payload.typeOfInspection && NFI_TYPE_OF_INSPECTION.indexOf(payload.typeOfInspection) === -1) {
    return { success: false, message: 'Type of Inspection tidak valid.' };
  }
  if (payload.result && NFI_RESULT_OPTIONS.indexOf(payload.result) === -1) {
    return { success: false, message: 'Result tidak valid.' };
  }
  if (payload.status && NFI_STATUS_OPTIONS.indexOf(payload.status) === -1) {
    return { success: false, message: 'Status tidak valid.' };
  }
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sibuk, coba lagi.' }; }
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.NFILOG);
    const idx = nfiLogIdx_();
    // Resolve ProjectName dari Projects sheet
    const projectRow = findProjectByCode_(ss.getSheetByName(SHEET.PROJECTS), payload.projectCode);
    const projectName = projectRow ? projectRow.ProjectName : payload.projectCode;
    const isEdit = !!payload.nfiId;
    let attachmentUrl = '';
    let attachmentFileId = '';
    let existingCreatedAt = new Date();
    let existingCreatedByEmail = user.Email;
    let existingCreatedByName = user.FullName;
    let existingNo = '';
    let foundRow = -1;
    if (isEdit) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][idx.NFIID] === payload.nfiId) { foundRow = i + 1; break; }
      }
      if (foundRow === -1) return { success: false, message: 'Entri NFI tidak ditemukan.' };
      const oldRow = data[foundRow - 1];
      const canManage = (user.Role === ROLES.ADMIN) || (user.Role === ROLES.MANAGER) || (oldRow[idx.CreatedByEmail] === user.Email);
      if (!canManage) return { success: false, message: 'Anda tidak memiliki izin mengedit entri ini.' };
      existingNo = oldRow[idx.No];
      existingCreatedAt = oldRow[idx.CreatedAt] || new Date();
      existingCreatedByEmail = oldRow[idx.CreatedByEmail] || user.Email;
      existingCreatedByName = oldRow[idx.CreatedByName] || user.FullName;
      attachmentUrl = oldRow[idx.AttachmentURL] || '';
      attachmentFileId = oldRow[idx.AttachmentFileID] || '';
    }
    if (payload.attachmentBase64 && payload.attachmentFileName) {
      const config = getConfig_();
      if (!config.ROOT_FOLDER_ID) return { success: false, message: 'ROOT_FOLDER_ID belum diisi di tab Config.' };
      const cleanB64 = payload.attachmentBase64.indexOf(',') !== -1 ? payload.attachmentBase64.split(',')[1] : payload.attachmentBase64;
      const bytes = Utilities.base64Decode(cleanB64);
      if (bytes.length > MAX_FILE_SIZE_BYTES) return { success: false, message: 'File lampiran melebihi batas 15MB.' };
      const ext = getFileExtension_(payload.attachmentFileName).toLowerCase();
      if (ALLOWED_DOC_EXTENSIONS.indexOf(ext) === -1) {
        return { success: false, message: 'Tipe file lampiran tidak diizinkan.' };
      }
      // Simpan lampiran dalam folder per proyek: NFI Log / <ProjectName> / Attachments
      const folder = getOrCreateFolderPath_(config.ROOT_FOLDER_ID, ['NFI Log', projectName, 'Attachments']);
      const safeName = sanitizeFileName_(payload.attachmentFileName);
      const uploadName = (payload.noNfi ? (payload.noNfi + '-') : '') + new Date().getTime() + '-' + safeName;
      const newFile = createFileInFolder_(folder, uploadName, bytes, payload.attachmentMimeType || 'application/octet-stream');
      if (isEdit && attachmentFileId) {
        try { DriveApp.getFileById(attachmentFileId).setTrashed(true); } catch (e) { /* abaikan */ }
      }
      attachmentUrl = newFile.getUrl();
      attachmentFileId = newFile.getId();
    }
    const now = new Date();
    const number = isEdit ? existingNo : String(getNextNfiNo_(sheet, payload.projectCode));
    const rowValues = [];
    rowValues[idx.NFIID] = isEdit ? payload.nfiId : Utilities.getUuid();
    rowValues[idx.No] = number;
    rowValues[idx.NoNFI] = sanitizeForSheet_(payload.noNfi);
    rowValues[idx.SubjectDescription] = sanitizeForSheet_(payload.subjectDescription);
    rowValues[idx.Area] = sanitizeForSheet_(payload.area || '');
    rowValues[idx.TypeOfInspection] = payload.typeOfInspection || '';
    rowValues[idx.IssuedDate] = payload.issuedDate ? new Date(payload.issuedDate) : '';
    rowValues[idx.Discipline] = payload.discipline;
    rowValues[idx.Location] = sanitizeForSheet_(payload.location || '');
    rowValues[idx.InspectionDate] = payload.inspectionDate ? new Date(payload.inspectionDate) : '';
    rowValues[idx.Result] = payload.result || 'Pending';
    rowValues[idx.ITRNo] = sanitizeForSheet_(payload.itrNo || '');
    rowValues[idx.ITPNo] = sanitizeForSheet_(payload.itpNo || '');
    rowValues[idx.ReportSubmissionDate] = payload.reportSubmissionDate ? new Date(payload.reportSubmissionDate) : '';
    rowValues[idx.CompleteDate] = payload.completeDate ? new Date(payload.completeDate) : '';
    rowValues[idx.Status] = payload.status || 'Open';
    rowValues[idx.PICAei] = sanitizeForSheet_(payload.picAei || '');
    rowValues[idx.Remark] = sanitizeForSheet_(payload.remark || '');
    rowValues[idx.AttachmentURL] = attachmentUrl;
    rowValues[idx.AttachmentFileID] = attachmentFileId;
    rowValues[idx.CreatedByEmail] = existingCreatedByEmail;
    rowValues[idx.CreatedByName] = existingCreatedByName;
    rowValues[idx.CreatedAt] = existingCreatedAt;
    rowValues[idx.UpdatedAt] = now;
    rowValues[idx.RecordStatus] = 'Active';
    rowValues[idx.ProjectCode] = payload.projectCode;
    rowValues[idx.ProjectName] = projectName;
    if (isEdit) {
      sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
      logAudit_(user, 'updateNFILog', 'NFILog', payload.nfiId, projectName + ' / ' + payload.noNfi + ' — ' + payload.subjectDescription);
      return { success: true, message: 'Entri NFI berhasil diperbarui.', nfiId: payload.nfiId };
    } else {
      sheet.appendRow(rowValues);
      logAudit_(user, 'createNFILog', 'NFILog', rowValues[idx.NFIID], projectName + ' / ' + payload.noNfi + ' — ' + payload.subjectDescription);
      return { success: true, message: 'Entri NFI berhasil ditambahkan.', nfiId: rowValues[idx.NFIID] };
    }
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan: ' + err.message };
  } finally { lock.releaseLock(); }
}
function deleteNFILogEntry(sessionToken, nfiId) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.NFILOG);
  const data = sheet.getDataRange().getValues();
  const idx = nfiLogIdx_();
  for (let i = 1; i < data.length; i++) {
    if (data[i][idx.NFIID] === nfiId) {
      const canDelete = (user.Role === ROLES.ADMIN) || (user.Role === ROLES.MANAGER) || (data[i][idx.CreatedByEmail] === user.Email);
      if (!canDelete) return { success: false, message: 'Anda tidak memiliki izin menghapus entri ini.' };
      data[i][idx.RecordStatus] = 'Deleted';
      data[i][idx.UpdatedAt] = new Date();
      if (idx.DeletedAt !== undefined) data[i][idx.DeletedAt] = new Date();
      sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
      logAudit_(user, 'deleteNFILog', 'NFILog', nfiId, data[i][idx.NoNFI] + ' — ' + data[i][idx.SubjectDescription]);
      return { success: true, message: 'Entri NFI berhasil dihapus.' };
    }
  }
  return { success: false, message: 'Entri tidak ditemukan.' };
}
// ============================================================================
// 16. NFI LOG — IMPORT (client-side parsing, server hanya terima data)
// ============================================================================
function importNFILogFromData(sessionToken, payload) {
  const user = requireRole_(sessionToken, UPLOADER_ROLES);
  payload = payload || {};
  if (!payload.projectCode) return { success: false, message: 'Proyek tujuan wajib dipilih.' };
  if (!payload.rows || !payload.rows.length) return { success: false, message: 'Tidak ada data untuk diimport.' };
  if (payload.rows.length > 2000) return { success: false, message: 'Maksimal 2000 baris per import — pecah file Anda.' };

  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sibuk, coba lagi.' }; }

  try {
    const ss = getSS_();
    const nfiSheet = ss.getSheetByName(SHEET.NFILOG);
    if (!nfiSheet) return { success: false, message: 'Sheet NFILog belum dibuat. Jalankan initializeSystem() dulu.' };
    const projectRow = findProjectByCode_(ss.getSheetByName(SHEET.PROJECTS), payload.projectCode);
    if (!projectRow) return { success: false, message: 'Proyek tidak ditemukan di sheet Projects.' };
    const projectName = projectRow.ProjectName;

    const existingData = nfiSheet.getDataRange().getValues();
    const nfiIdx = nfiLogIdx_();
    const existingNoNfiSet = new Set();
    if (existingData.length > 1) {
      for (let i = 1; i < existingData.length; i++) {
        if (existingData[i][nfiIdx.RecordStatus] === 'Deleted') continue;
        if (String(existingData[i][nfiIdx.ProjectCode] || '') !== payload.projectCode) continue;
        const n = String(existingData[i][nfiIdx.NoNFI] || '').trim().toLowerCase();
        if (n) existingNoNfiSet.add(n);
      }
    }

    const now = new Date();
    const rowsToAppend = [];
    let successCount = 0, skipCount = 0, failCount = 0;
    const errors = [];
    const seenInFile = new Set();
    let nextNo = getNextNfiNo_(nfiSheet, payload.projectCode);

    const parseDate = function (v) {
      if (!v) return '';
      if (v instanceof Date) return isNaN(v.getTime()) ? '' : v;
      const s = String(v).trim();
      if (!s) return '';
      let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
      m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (m) {
        const yyyy = m[3].length === 2 ? (parseInt(m[3], 10) + 2000) : parseInt(m[3], 10);
        return new Date(yyyy, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? '' : d;
    };

    for (let i = 0; i < payload.rows.length; i++) {
      const r = payload.rows[i] || {};
      const rowNum = i + 2;
      const getVal = function (k) { const v = r[k]; return (v === null || v === undefined) ? '' : String(v).trim(); };
      const getRaw = function (k) { return r[k]; };

      const noNfi = getVal('NoNFI');
      const subject = getVal('SubjectDescription');
      const discipline = getVal('Discipline');

      if (subject.toLowerCase().indexOf('contoh baris') === 0) continue;

      if (!noNfi || !subject || !discipline) {
        failCount++;
        if (errors.length < 20) errors.push('Baris ' + rowNum + ': kolom wajib kosong (No. NFI / Subject / Discipline).');
        continue;
      }
      const noNfiKey = noNfi.toLowerCase();
      if (existingNoNfiSet.has(noNfiKey) || seenInFile.has(noNfiKey)) { skipCount++; continue; }
      seenInFile.add(noNfiKey);

      // --- Type of Inspection: FREE TEXT (terima apa pun) ---
      const typeRaw = getVal('TypeOfInspection');
      const typeVal = typeRaw ? sanitizeForSheet_(typeRaw) : '';

      // --- Result: normalisasi otomatis ---
      const normalizeResult_ = function (v) {
        const s = String(v || '').trim();
        if (!s) return 'Pending';
        const low = s.toLowerCase();
        if (low === 'pass' || low === 'lulus' || low === 'ok' || low === 'accept' || low === 'accepted' || low === 'lolos') return 'Pass';
        if (low === 'fail' || low === 'tidak lulus' || low === 'reject' || low === 'rejected' || low === 'gagal' || low === 'repair') return 'Fail';
        if (low === 'continue' || low === 'cont' || low === 'lanjut' || low === 'on going' || low === 'on-going' || low === 'ongoing') return 'Continue';
        if (low === 'pending' || low === 'menunggu' || low === 'dalam proses') return 'Pending';
        if (low === 'cancel' || low === 'cancelled' || low === 'canceled' || low === 'batal' || low === 'n/a' || low === 'na' || low === 'belum' || low === '-' || low === '—') return 'N/A';
        return s;
      };
      const normalizeStatus_ = function (v) {
        const s = String(v || '').trim();
        if (!s) return 'Open';
        const low = s.toLowerCase();
        if (low === 'open' || low === 'baru' || low === 'new') return 'Open';
        if (low.indexOf('progress') !== -1 || low === 'sedang' || low === 'proses') return 'In Progress';
        if (low === 'closed' || low === 'close' || low === 'selesai' || low === 'done' || low === 'finish' || low === 'finished' || low === 'complete' || low === 'completed') return 'Closed';
        if (low === 'cancel' || low === 'cancelled' || low === 'canceled' || low === 'batal') return 'Cancelled';
        return s;
      };
      const resultVal = normalizeResult_(getVal('Result'));
      const statusVal = normalizeStatus_(getVal('Status'));

      const rowValues = [];
      rowValues[nfiIdx.NFIID] = Utilities.getUuid();
      rowValues[nfiIdx.No] = String(nextNo);
      rowValues[nfiIdx.NoNFI] = sanitizeForSheet_(noNfi);
      rowValues[nfiIdx.SubjectDescription] = sanitizeForSheet_(subject);
      rowValues[nfiIdx.Area] = sanitizeForSheet_(getVal('Area'));
      rowValues[nfiIdx.TypeOfInspection] = typeVal;
      rowValues[nfiIdx.IssuedDate] = parseDate(getRaw('IssuedDate'));
      rowValues[nfiIdx.Discipline] = discipline;
      rowValues[nfiIdx.Location] = sanitizeForSheet_(getVal('Location'));
      rowValues[nfiIdx.InspectionDate] = parseDate(getRaw('InspectionDate'));
      rowValues[nfiIdx.Result] = resultVal || 'Pending';
      rowValues[nfiIdx.ITRNo] = sanitizeForSheet_(getVal('ITRNo'));
      rowValues[nfiIdx.ITPNo] = sanitizeForSheet_(getVal('ITPNo'));
      rowValues[nfiIdx.ReportSubmissionDate] = parseDate(getRaw('ReportSubmissionDate'));
      rowValues[nfiIdx.CompleteDate] = parseDate(getRaw('CompleteDate'));
      rowValues[nfiIdx.Status] = statusVal || 'Open';
      rowValues[nfiIdx.PICAei] = sanitizeForSheet_(getVal('PICAei'));
      rowValues[nfiIdx.Remark] = sanitizeForSheet_(getVal('Remark'));
      rowValues[nfiIdx.AttachmentURL] = '';
      rowValues[nfiIdx.AttachmentFileID] = '';
      rowValues[nfiIdx.CreatedByEmail] = user.Email;
      rowValues[nfiIdx.CreatedByName] = user.FullName;
      rowValues[nfiIdx.CreatedAt] = now;
      rowValues[nfiIdx.UpdatedAt] = now;
      rowValues[nfiIdx.RecordStatus] = 'Active';
      rowValues[nfiIdx.ProjectCode] = payload.projectCode;
      rowValues[nfiIdx.ProjectName] = projectName;

      rowsToAppend.push(rowValues);
      nextNo++;
      successCount++;
    }

    if (rowsToAppend.length) {
      const startRow = nfiSheet.getLastRow() + 1;
      nfiSheet.getRange(startRow, 1, rowsToAppend.length, NFI_LOG_HEADER.length).setValues(rowsToAppend);
    }

    logAudit_(user, 'importNFILog', 'NFILog', '',
      'Import ' + successCount + ' entri ke ' + projectName + ' (' + skipCount + ' duplikat, ' + failCount + ' gagal)');

    return {
      success: true,
      message: successCount + ' entri berhasil ditambahkan ke ' + projectName + '.' +
        (skipCount ? ' ' + skipCount + ' duplikat dilewati.' : '') +
        (failCount ? ' ' + failCount + ' gagal.' : ''),
      successCount: successCount,
      skipCount: skipCount,
      failCount: failCount,
      errors: errors
    };
  } catch (err) {
    return { success: false, message: 'Gagal import: ' + err.message };
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// 16b. NFI IMPORT TEMPLATE
// ============================================================================
const NFI_IMPORT_COLUMNS = [
  { header: 'No. NFI', field: 'NoNFI', required: true },
  { header: 'Subject Description', field: 'SubjectDescription', required: true },
  { header: 'Area', field: 'Area' },
  { header: 'Type of Inspection', field: 'TypeOfInspection' },
  { header: 'Issued Date', field: 'IssuedDate', type: 'date' },
  { header: 'Discipline', field: 'Discipline', required: true },
  { header: 'Location', field: 'Location' },
  { header: 'Inspection Date', field: 'InspectionDate', type: 'date' },
  { header: 'Result', field: 'Result' },
  { header: 'ITR No.', field: 'ITRNo' },
  { header: 'ITP No.', field: 'ITPNo' },
  { header: 'Report Submission Date', field: 'ReportSubmissionDate', type: 'date' },
  { header: 'Complete Date', field: 'CompleteDate', type: 'date' },
  { header: 'Status', field: 'Status' },
  { header: 'PIC AEI', field: 'PICAei' },
  { header: 'Remark', field: 'Remark' }
];

function getNFIImportTemplate(sessionToken) {
  requireRole_(sessionToken, UPLOADER_ROLES);
  try {
    const tempSs = SpreadsheetApp.create('Template-Import-NFI');
    const sheet = tempSs.getSheets()[0];
    sheet.setName('NFI Log');
    const headers = NFI_IMPORT_COLUMNS.map(c => c.header);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setFontColor('#ffffff').setBackground('#b91c1c')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 32);
    const today = new Date();
    const sampleRow = [
      'NFI-2025-001', 'Inspeksi sambungan las kolom lantai 2', 'Area A — Pondasi Utama',
      'Visual', today, 'Sipil', 'Kolom K2, Grid B-4', today, 'Pass',
      'ITR-CIV-001', 'ITP-CIV-001', today, '', 'Open', 'Budi Santoso',
      'Contoh baris — silakan hapus atau timpa dengan data Anda.'
    ];
    sheet.getRange(2, 1, 1, sampleRow.length).setValues([sampleRow])
      .setFontStyle('italic').setFontColor('#6b7280');
    const widths = [120, 280, 160, 140, 110, 100, 160, 110, 90, 120, 120, 130, 110, 90, 120, 220];
    widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
    const typeCol = NFI_IMPORT_COLUMNS.findIndex(c => c.field === 'TypeOfInspection') + 1;
    const resultCol = NFI_IMPORT_COLUMNS.findIndex(c => c.field === 'Result') + 1;
    const statusCol = NFI_IMPORT_COLUMNS.findIndex(c => c.field === 'Status') + 1;
    const discCol = NFI_IMPORT_COLUMNS.findIndex(c => c.field === 'Discipline') + 1;
    sheet.getRange(3, typeCol, 500, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(NFI_TYPE_OF_INSPECTION, true).build());
    sheet.getRange(3, resultCol, 500, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(NFI_RESULT_OPTIONS, true).build());
    sheet.getRange(3, statusCol, 500, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(NFI_STATUS_OPTIONS, true).build());
    sheet.getRange(3, discCol, 500, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(DEFAULT_DISCIPLINES, true).build());
    ['IssuedDate', 'InspectionDate', 'ReportSubmissionDate', 'CompleteDate'].forEach(f => {
      const c = NFI_IMPORT_COLUMNS.findIndex(x => x.field === f) + 1;
      sheet.getRange(3, c, 500, 1).setNumberFormat('yyyy-mm-dd');
    });
    const instrSheet = tempSs.insertSheet('Petunjuk', 0);
    const rows = [
      ['PETUNJUK IMPORT NFI LOG — QC-CMS'],
      [''],
      ['1. Isi data di sheet "NFI Log". Jangan ubah nama/urutan kolom header (baris 1).'],
      ['2. Hapus baris contoh (baris 2) sebelum mengisi data Anda.'],
      ['3. Kolom WAJIB: No. NFI, Subject Description, Discipline.'],
      ['4. Format tanggal: YYYY-MM-DD (contoh: 2025-01-15). Boleh dikosongkan.'],
      ['5. Kolom Type of Inspection, Result, Status, Discipline sudah ada dropdown.'],
      ['6. Nomor urut (No.) akan diisi otomatis oleh sistem per proyek.'],
      ['7. Kolom lampiran tidak bisa diisi lewat import — isi manual lewat tombol Edit.'],
      ['8. Setelah selesai, simpan file sebagai .xlsx, lalu upload via "Import Excel".'],
      [''],
      ['Kolom yang tersedia:']
    ];
    NFI_IMPORT_COLUMNS.forEach(c => rows.push(['  • ' + c.header + (c.required ? '  (WAJIB)' : '')]));
    instrSheet.getRange(1, 1, rows.length, 1).setValues(rows);
    instrSheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
    instrSheet.setColumnWidth(1, 620);
    instrSheet.getRange(1, 1, rows.length, 1).setVerticalAlignment('top').setWrap(true);
    SpreadsheetApp.flush();
    const xlsxBlob = exportGoogleFileAs_(tempSs.getId(), 'spreadsheets', 'xlsx')
      .setName('Template-Import-NFI.xlsx');
    try { DriveApp.getFileById(tempSs.getId()).setTrashed(true); } catch (e) { Logger.log('Gagal hapus temp template NFI: ' + e.message); }
    return { success: true, base64: Utilities.base64Encode(xlsxBlob.getBytes()), fileName: 'Template-Import-NFI.xlsx' };
  } catch (err) {
    return { success: false, message: 'Gagal membuat template: ' + err.message };
  }
}
// ============================================================================
// 17. NFI LOG — UTILITAS TIPE INSPEKSI & KONFIG
// ============================================================================
function getNFITypeList_() {
  const config = getConfig_();
  let custom = [];
  try { custom = JSON.parse(config.NFI_TYPE_OF_INSPECTION_CUSTOM || '[]') || []; } catch (e) { custom = []; }
  const merged = NFI_TYPE_OF_INSPECTION.concat(custom);
  const seen = new Set();
  const result = [];
  merged.forEach(function (t) {
    const s = String(t || '').trim();
    const k = s.toLowerCase();
    if (!k || seen.has(k)) return;
    seen.add(k);
    result.push(s);
  });
  return result;
}

function getNFISettings(sessionToken) {
  requireRole_(sessionToken, [ROLES.ADMIN]);
  const config = getConfig_();
  let custom = [];
  try { custom = JSON.parse(config.NFI_TYPE_OF_INSPECTION_CUSTOM || '[]') || []; } catch (e) { Logger.log('Parse NFI_TYPE_OF_INSPECTION_CUSTOM gagal: ' + e.message); }
  return {
    success: true,
    defaultTypes: NFI_TYPE_OF_INSPECTION.slice(),
    customTypes: custom,
    openAlertDays: parseInt(config.NFI_OPEN_ALERT_DAYS, 10) || 3
  };
}

function addNFIType(sessionToken, typeName) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  const name = String(typeName || '').trim();
  if (!name) return { success: false, message: 'Nama tipe tidak boleh kosong.' };
  if (name.length > 60) return { success: false, message: 'Nama tipe maksimal 60 karakter.' };
  const all = getNFITypeList_().map(function (t) { return t.toLowerCase(); });
  if (all.indexOf(name.toLowerCase()) !== -1) return { success: false, message: 'Tipe ini sudah ada di daftar.' };
  const sheet = getSS_().getSheetByName(SHEET.CONFIG);
  const data = sheet.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) { if (data[i][0] === 'NFI_TYPE_OF_INSPECTION_CUSTOM') { rowIdx = i + 1; break; } }
  if (rowIdx === -1) return { success: false, message: 'Baris config tidak ditemukan. Jalankan initializeSystem() dulu.' };
  let custom = [];
  try { custom = JSON.parse(data[rowIdx - 1][1] || '[]') || []; } catch (e) { Logger.log('Parse custom config gagal di addNFIType: ' + e.message); }
  custom.push(name);
  sheet.getRange(rowIdx, 2).setValue(JSON.stringify(custom));
  CacheService.getScriptCache().remove('qc_config_cache');
  logAudit_(actor, 'addNFIType', 'NFIConfig', '', 'Tambah tipe: ' + name);
  return { success: true, message: 'Tipe "' + name + '" berhasil ditambahkan.' };
}

function removeNFIType(sessionToken, typeName) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  const name = String(typeName || '').trim();
  const defaultLower = NFI_TYPE_OF_INSPECTION.map(function (t) { return t.toLowerCase(); });
  if (defaultLower.indexOf(name.toLowerCase()) !== -1) {
    return { success: false, message: 'Tipe bawaan sistem tidak bisa dihapus.' };
  }
  const sheet = getSS_().getSheetByName(SHEET.CONFIG);
  const data = sheet.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) { if (data[i][0] === 'NFI_TYPE_OF_INSPECTION_CUSTOM') { rowIdx = i + 1; break; } }
  if (rowIdx === -1) return { success: false, message: 'Baris config tidak ditemukan.' };
  let custom = [];
  try { custom = JSON.parse(data[rowIdx - 1][1] || '[]') || []; } catch (e) { Logger.log('Parse custom config gagal di removeNFIType: ' + e.message); }
  const filtered = custom.filter(function (t) { return String(t).toLowerCase() !== name.toLowerCase(); });
  if (filtered.length === custom.length) return { success: false, message: 'Tipe tidak ditemukan di daftar custom.' };
  sheet.getRange(rowIdx, 2).setValue(JSON.stringify(filtered));
  CacheService.getScriptCache().remove('qc_config_cache');
  logAudit_(actor, 'removeNFIType', 'NFIConfig', '', 'Hapus tipe: ' + name);
  return { success: true, message: 'Tipe "' + name + '" berhasil dihapus.' };
}

function saveNFIAlertDays(sessionToken, days) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  const n = parseInt(days, 10);
  if (isNaN(n) || n < 1 || n > 90) return { success: false, message: 'Jumlah hari harus 1-90.' };
  const sheet = getSS_().getSheetByName(SHEET.CONFIG);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'NFI_OPEN_ALERT_DAYS') {
      sheet.getRange(i + 1, 2).setValue(String(n));
      CacheService.getScriptCache().remove('qc_config_cache');
      logAudit_(actor, 'saveNFIAlertDays', 'NFIConfig', '', 'Alert NFI Open > ' + n + ' hari');
      return { success: true, message: 'Ambang notifikasi diubah menjadi ' + n + ' hari.' };
    }
  }
  return { success: false, message: 'Baris config tidak ditemukan.' };
}

// ============================================================================
// 18. NFI LOG — EXPORT EXCEL PER PROYEK
// ============================================================================
function exportNFILogExcel(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  try {
    const entries = getNFILogList(sessionToken, filters || {});
    if (!entries.length) return { success: false, message: 'Tidak ada entri NFI untuk filter ini.' };
    const config = getConfig_();
    const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
    const now = new Date();
    const projectLabel = filters && filters.projectCode ? filters.projectCode : 'Semua-Proyek';
    const fileBaseName = 'NFI-Log-' + projectLabel + '-' + Utilities.formatDate(now, tz, 'yyyyMMdd-HHmm');
    const tempSs = SpreadsheetApp.create(fileBaseName);
    const sheet = tempSs.getSheets()[0];
    sheet.setName('NFI Log');
    const cols = ['No.', 'No. NFI', 'Proyek', 'Subject Description', 'Area', 'Type of Inspection',
      'Issued Date', 'Discipline', 'Location', 'Inspection Date', 'Result',
      'ITR No.', 'ITP No.', 'Report Submission Date', 'Complete Date', 'Status',
      'PIC AEI', 'Remark'];
    const headerLines = [
      config.COMPANY_NAME || 'PT Asuka Engineering Indonesia',
      'NFI LOG — Notification of Inspection',
      'Proyek: ' + (filters && filters.projectCode ? filters.projectCode : 'Seluruh Proyek') +
        ' | Dicetak: ' + formatIndonesianDate_(now, tz) + ' oleh ' + user.FullName,
      'Total: ' + entries.length + ' entri'
    ];
    headerLines.forEach(function (line, i) {
      sheet.getRange(i + 1, 1, 1, cols.length).merge().setValue(line)
        .setFontWeight(i === 1 ? 'bold' : 'normal')
        .setFontSize(i === 1 ? 13 : (i === 0 ? 11 : 9.5));
    });
    const headerRowIdx = headerLines.length + 1;
    sheet.getRange(headerRowIdx, 1, 1, cols.length).setValues([cols])
      .setFontWeight('bold').setFontColor('#ffffff').setBackground('#b91c1c')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    sheet.setFrozenRows(headerRowIdx);
    sheet.setRowHeight(headerRowIdx, 30);
    const numCols = ['Issued Date', 'Inspection Date', 'Report Submission Date', 'Complete Date'];
    let r = headerRowIdx + 1;
    entries.forEach(function (e, i) {
      const vals = [
        i + 1,
        e.noNfi,
        e.projectName || e.projectCode || '',
        e.subjectDescription,
        e.area || '',
        e.typeOfInspection || '',
        e.issuedDate ? new Date(e.issuedDate) : '',
        e.discipline || '',
        e.location || '',
        e.inspectionDate ? new Date(e.inspectionDate) : '',
        e.result || '',
        e.itrNo || '',
        e.itpNo || '',
        e.reportSubmissionDate ? new Date(e.reportSubmissionDate) : '',
        e.completeDate ? new Date(e.completeDate) : '',
        e.status || '',
        e.picAei || '',
        e.remark || ''
      ];
      sheet.getRange(r, 1, 1, vals.length).setValues([vals]);
      // Warnai Result
      const resultColor = e.result === 'Pass' ? { bg: '#dcfce7', text: '#15803d' } :
                          e.result === 'Fail' ? { bg: '#fee2e2', text: '#b91c1c' } :
                          e.result === 'Continue' ? { bg: '#dbeafe', text: '#1e40af' } :
                          e.result === 'Pending' ? { bg: '#fef3c7', text: '#92400e' } : null;
      if (resultColor) sheet.getRange(r, 11).setBackground(resultColor.bg).setFontColor(resultColor.text).setFontWeight('bold');
      // Warnai Status
      const statusColor = e.status === 'Closed' ? { bg: '#dcfce7', text: '#15803d' } :
                          e.status === 'Cancelled' ? { bg: '#e5e7eb', text: '#6b7280' } :
                          e.status === 'In Progress' ? { bg: '#fef3c7', text: '#92400e' } :
                          e.status === 'Open' ? { bg: '#dbeafe', text: '#1e40af' } : null;
      if (statusColor) sheet.getRange(r, 16).setBackground(statusColor.bg).setFontColor(statusColor.text).setFontWeight('bold');
      r++;
    });
    const dateCols = [7, 10, 14, 15];
    dateCols.forEach(function (c) {
      sheet.getRange(headerRowIdx + 1, c, entries.length, 1).setNumberFormat('yyyy-mm-dd');
    });
    const lastRow = r - 1;
    if (lastRow >= headerRowIdx) {
      sheet.getRange(headerRowIdx, 1, lastRow - headerRowIdx + 1, cols.length)
        .setBorder(true, true, true, true, true, true, '#dbe2ea', SpreadsheetApp.BorderStyle.SOLID);
      sheet.getRange(headerRowIdx + 1, 1, entries.length, cols.length).setVerticalAlignment('top');
      sheet.getRange(headerRowIdx + 1, 4, entries.length, 1).setWrap(true);
      sheet.getRange(headerRowIdx + 1, 18, entries.length, 1).setWrap(true);
    }
    const widths = [40, 110, 160, 260, 140, 140, 100, 100, 160, 110, 90, 120, 120, 130, 110, 90, 130, 220];
    widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
    SpreadsheetApp.flush();
    const blob = exportGoogleFileAs_(tempSs.getId(), 'spreadsheets', 'xlsx').setName(fileBaseName + '.xlsx');
    try { DriveApp.getFileById(tempSs.getId()).setTrashed(true); } catch (e) { Logger.log('Gagal hapus tempSs di exportNFILogExcel: ' + e.message); }
    let driveUrl = '';
    try {
      const folder = getOrCreateFolderPath_(config.ROOT_FOLDER_ID, ['Reports', 'NFI Log']);
      driveUrl = folder.createFile(blob).getUrl();
    } catch (e) { Logger.log('Gagal simpan copy NFI Log ke Drive folder: ' + e.message); }
    logAudit_(user, 'exportNFILogExcel', 'NFILog', '', entries.length + ' entri — ' + projectLabel);
    return { success: true, base64: Utilities.base64Encode(blob.getBytes()), fileName: blob.getName(), driveUrl: driveUrl, count: entries.length };
  } catch (err) {
    return { success: false, message: 'Gagal membuat Excel: ' + err.message };
  }
}

// ============================================================================
// 19. NFI LOG — CHART DATA
// ============================================================================
function getNFIChartData(sessionToken, filters) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  filters = filters || {};
  const list = getNFILogList(sessionToken, filters);
  const byProject = {};
  list.forEach(function (n) {
    const p = n.projectName || n.projectCode || '(Tanpa Proyek)';
    if (!byProject[p]) byProject[p] = { projectName: p, total: 0, pass: 0, fail: 0, continue: 0, pending: 0, open: 0, closed: 0 };
    byProject[p].total++;
    if (n.result === 'Pass') byProject[p].pass++;
    else if (n.result === 'Fail') byProject[p].fail++;
    else if (n.result === 'Continue') byProject[p].continue++;
    else if (n.result === 'Pending') byProject[p].pending++;
    if (n.status === 'Open' || n.status === 'In Progress') byProject[p].open++;
    if (n.status === 'Closed') byProject[p].closed++;
  });
  // Monthly trend — 6 bulan terakhir
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const months = [];
  const monthMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const label = monthNames[d.getMonth()] + ' ' + String(d.getFullYear()).slice(-2);
    const m = { key: key, label: label, count: 0 };
    months.push(m);
    monthMap[key] = m;
  }
  list.forEach(function (n) {
    if (!n.inspectionDate) return;
    const d = new Date(n.inspectionDate);
    if (isNaN(d.getTime())) return;
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (monthMap[key]) monthMap[key].count++;
  });
  // Overall totals
  const overall = { total: list.length, pass: 0, fail: 0, continueCount: 0, pending: 0, open: 0, closed: 0 };
  list.forEach(function (n) {
    if (n.result === 'Pass') overall.pass++;
    else if (n.result === 'Fail') overall.fail++;
    else if (n.result === 'Continue') overall.continueCount++;
    else if (n.result === 'Pending') overall.pending++;
    if (n.status === 'Open' || n.status === 'In Progress') overall.open++;
    if (n.status === 'Closed') overall.closed++;
  });
  return {
    success: true,
    byProject: Object.keys(byProject).map(function (k) { return byProject[k]; }).sort(function (a, b) { return b.total - a.total; }),
    monthly: months,
    overall: overall
  };
}

// ============================================================================
// 20. NFI LOG — NOTIFIKASI OTOMATIS (OPEN > X HARI)
// ============================================================================
function checkNFIOpenAlerts() {
  const config = getConfig_();
  const days = parseInt(config.NFI_OPEN_ALERT_DAYS, 10) || 3;
  const threshold = new Date(Date.now() - days * 86400000);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.NFILOG);
  if (!sheet) { Logger.log('Sheet NFILog tidak ditemukan.'); return; }
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) { Logger.log('Tidak ada entri NFI.'); return; }
  const idx = nfiLogIdx_();
  // Kelompokkan berdasarkan PIC AEI (kalau ada email), atau Admin fallback
  const overdueByOwner = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[idx.RecordStatus] === 'Deleted') continue;
    const status = String(row[idx.Status] || '');
    if (status !== 'Open' && status !== 'In Progress') continue;
    // Pakai InspectionDate, fallback IssuedDate, fallback CreatedAt
    const refDate = row[idx.InspectionDate] || row[idx.IssuedDate] || row[idx.CreatedAt];
    if (!refDate) continue;
    const d = new Date(refDate);
    if (d > threshold) continue;
    const ageDays = Math.floor((Date.now() - d.getTime()) / 86400000);
    // Tentukan penerima: kolom PICAei mungkin berisi nama atau email
    let recipient = String(row[idx.PICAei] || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) recipient = ''; // bukan email
    if (!recipient) recipient = '__ADMIN__';
    if (!overdueByOwner[recipient]) overdueByOwner[recipient] = [];
    overdueByOwner[recipient].push({
      noNfi: row[idx.NoNFI],
      project: row[idx.ProjectName],
      subject: row[idx.SubjectDescription],
      status: status,
      ageDays: ageDays,
      discipline: row[idx.Discipline]
    });
  }
  if (!Object.keys(overdueByOwner).length) { Logger.log('Tidak ada NFI yang overdue.'); return; }

  // Ambil daftar admin & QC Engineer untuk fallback dan CC
  const usersSheet = ss.getSheetByName(SHEET.USERS);
  const udata = usersSheet.getDataRange().getValues();
  const uidx = usersIdx_();
  const adminEmails = [];
  for (let i = 1; i < udata.length; i++) {
    if (udata[i][uidx.Status] === USER_STATUS.ACTIVE &&
        (udata[i][uidx.Role] === ROLES.ADMIN || udata[i][uidx.Role] === ROLES.MANAGER)) {
      if (udata[i][uidx.Email]) adminEmails.push(udata[i][uidx.Email]);
    }
  }

  let sentCount = 0;
  Object.keys(overdueByOwner).forEach(function (recipient) {
    const items = overdueByOwner[recipient];
    const recipientList = recipient === '__ADMIN__' ? adminEmails.slice() : [recipient].concat(adminEmails);
    if (!recipientList.length) return;
    const listHtml = items.map(function (it) {
      return '<tr>' +
        '<td style="padding:6px 10px;border-bottom:1px solid #eee;">' + escapeHtml_(it.noNfi) + '</td>' +
        '<td style="padding:6px 10px;border-bottom:1px solid #eee;">' + escapeHtml_(it.project) + '</td>' +
        '<td style="padding:6px 10px;border-bottom:1px solid #eee;">' + escapeHtml_(it.subject) + '</td>' +
        '<td style="padding:6px 10px;border-bottom:1px solid #eee;">' + escapeHtml_(it.discipline) + '</td>' +
        '<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">' + it.ageDays + ' hari</td>' +
        '</tr>';
    }).join('');
    try {
      MailApp.sendEmail({
        to: recipientList.join(','),
        subject: '[QC-CMS] ' + items.length + ' NFI belum selesai (> ' + days + ' hari)',
        htmlBody: '<div style="font-family:Arial,sans-serif;color:#1a2332;max-width:720px;">' +
          '<h2 style="color:#b91c1c;">Peringatan NFI Belum Selesai</h2>' +
          '<p>Entri NFI berikut sudah berstatus <b>Open / In Progress</b> lebih dari <b>' + days + ' hari</b>:</p>' +
          '<table style="border-collapse:collapse;width:100%;font-size:13px;">' +
          '<thead><tr style="background:#b91c1c;color:#fff;">' +
          '<th style="padding:8px 10px;text-align:left;">No. NFI</th>' +
          '<th style="padding:8px 10px;text-align:left;">Proyek</th>' +
          '<th style="padding:8px 10px;text-align:left;">Subject</th>' +
          '<th style="padding:8px 10px;text-align:left;">Discipline</th>' +
          '<th style="padding:8px 10px;text-align:center;">Umur</th>' +
          '</tr></thead><tbody>' + listHtml + '</tbody></table>' +
          '<p style="color:#6b7280;font-size:12px;margin-top:16px;">Mohon segera ditindaklanjuti di QC-CMS → NFI Log.</p>' +
          '</div>'
      });
      sentCount++;
      // Juga kirim notifikasi in-app ke penerima utama
      items.forEach(function (it) {
        recipientList.forEach(function (em) {
          notify_(em, 'nfi_overdue', 'NFI ' + it.noNfi + ' (' + it.project + ') sudah ' + it.ageDays + ' hari belum selesai.', 'NFILog', '');
        });
      });
    } catch (e) { Logger.log('Gagal kirim email ke ' + recipientList.join(',') + ': ' + e.message); }
  });
  Logger.log('Cek NFI Open alerts selesai. ' + sentCount + ' email terkirim.');
}

function createDailyNFIOpenTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'checkNFIOpenAlerts') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkNFIOpenAlerts').timeBased().everyDays(1).atHour(8).create();
  try { SpreadsheetApp.getUi().alert('Trigger harian NFI Open alerts berhasil diaktifkan (jam 08:00).'); }
  catch (e) { Logger.log('Trigger harian NFI Open alerts aktif.'); }
}
// ============================================================================
// 21. NFI LOG — PREVIEW IMPORT (validasi tanpa simpan)
// ============================================================================
function previewNFIImport(sessionToken, payload) {
  const user = requireRole_(sessionToken, UPLOADER_ROLES);
  payload = payload || {};
  if (!payload.projectCode) return { success: false, message: 'Proyek belum dipilih.' };
  if (!payload.rows || !payload.rows.length) return { success: false, message: 'Tidak ada data untuk dipreview.' };

  const ss = getSS_();
  const nfiSheet = ss.getSheetByName(SHEET.NFILOG);
  if (!nfiSheet) return { success: false, message: 'Sheet NFILog belum dibuat.' };
  const projectRow = findProjectByCode_(ss.getSheetByName(SHEET.PROJECTS), payload.projectCode);
  if (!projectRow) return { success: false, message: 'Proyek tidak ditemukan.' };

  const existingData = nfiSheet.getDataRange().getValues();
  const nfiIdx = nfiLogIdx_();
  const existingNoNfiSet = new Set();
  if (existingData.length > 1) {
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][nfiIdx.RecordStatus] === 'Deleted') continue;
      if (String(existingData[i][nfiIdx.ProjectCode] || '') !== payload.projectCode) continue;
      const n = String(existingData[i][nfiIdx.NoNFI] || '').trim().toLowerCase();
      if (n) existingNoNfiSet.add(n);
    }
  }

  const seenInFile = new Set();
  const preview = [];
  let okCount = 0, dupCount = 0, errCount = 0;

  for (let i = 0; i < payload.rows.length; i++) {
    const r = payload.rows[i] || {};
    const g = function (k) { const v = r[k]; return (v === null || v === undefined) ? '' : String(v).trim(); };
    const noNfi = g('NoNFI');
    const subject = g('SubjectDescription');
    const discipline = g('Discipline');

    // Skip baris contoh template
    if (subject.toLowerCase().indexOf('contoh baris') === 0) continue;

    let status = 'ok';
    let note = '';

    if (!noNfi || !subject || !discipline) {
      status = 'error';
      note = 'Kolom wajib kosong';
      errCount++;
    } else {
      const k = noNfi.toLowerCase();
      if (existingNoNfiSet.has(k)) {
        status = 'duplicate';
        note = 'Sudah ada di sistem';
        dupCount++;
      } else if (seenInFile.has(k)) {
        status = 'duplicate';
        note = 'Duplikat di file ini';
        dupCount++;
      } else {
        seenInFile.add(k);
        okCount++;
      }
    }

    preview.push({
      rowNum: i + 2,
      noNfi: noNfi,
      subject: subject,
      area: g('Area'),
      type: g('TypeOfInspection'),
      discipline: discipline,
      inspDate: g('InspectionDate'),
      result: g('Result'),
      status: status,
      note: note
    });
  }

  return {
    success: true,
    projectName: projectRow.ProjectName,
    totalRows: preview.length,
    okCount: okCount,
    dupCount: dupCount,
    errCount: errCount,
    preview: preview
  };
}
// ============================================================================
// 23. DASHBOARD ANALYTICS (enhanced)
// ============================================================================
function getEnhancedDashboardStats(sessionToken, projectCode) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const data = sheet.getDataRange().getValues();
  const empty = { success: true, trend: [], topProjects: [], byDiscipline: [], alerts: [], totalActive: 0 };
  if (data.length <= 1) return empty;

  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const now = new Date();
  const canViewAll = VIEW_ALL_ROLES.indexOf(user.Role) !== -1;
  const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

  // --- Tren 6 bulan terakhir ---
  const months = [];
  const monthMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const m = { key, label: monthNames[d.getMonth()] + " '" + String(d.getFullYear()).slice(-2), submitted: 0, approved: 0, rejected: 0 };
    months.push(m);
    monthMap[key] = m;
  }

  const projMap = {};
  const discMap = {};
  const alerts = [];
  const config = getConfig_();
  const staleDays = parseInt(config.STALE_PENDING_DAYS, 10) || 5;
  let totalActive = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[idx.Status] === STATUS.DELETED) continue;
    if (!canViewAll && row[idx.UploaderEmail] !== user.Email) continue;
    if (projectCode && row[idx.ProjectCode] !== projectCode) continue;
    if (row[idx.IsLatestRevision] !== true) continue;
    const lc = row[idx.LifecycleStage];
    if (lc === LIFECYCLE.ARCHIVED || lc === LIFECYCLE.OBSOLETE) continue;
    totalActive++;

    const pCode = row[idx.ProjectCode];
    const pName = row[idx.ProjectName] || pCode;
    const status = row[idx.Status];
    const discipline = row[idx.Discipline] || '(Tidak ada)';
    const ts = row[idx.Timestamp] ? new Date(row[idx.Timestamp]) : null;
    const approvalDate = row[idx.ApprovalDate] ? new Date(row[idx.ApprovalDate]) : null;

    // Top proyek
    if (!projMap[pCode]) projMap[pCode] = { code: pCode, name: pName, total: 0, pending: 0, approved: 0, rejected: 0 };
    projMap[pCode].total++;
    if (status === STATUS.PENDING) projMap[pCode].pending++;
    else if (status === STATUS.APPROVED) projMap[pCode].approved++;
    else if (status === STATUS.REJECTED) projMap[pCode].rejected++;

    // Distribusi disiplin
    if (!discMap[discipline]) discMap[discipline] = { discipline, total: 0, pending: 0, approved: 0, rejected: 0 };
    discMap[discipline].total++;
    if (status === STATUS.PENDING) discMap[discipline].pending++;
    else if (status === STATUS.APPROVED) discMap[discipline].approved++;
    else if (status === STATUS.REJECTED) discMap[discipline].rejected++;

    // Tren bulanan
    if (ts) {
      const tKey = ts.getFullYear() + '-' + String(ts.getMonth() + 1).padStart(2, '0');
      if (monthMap[tKey]) monthMap[tKey].submitted++;
    }
    if (approvalDate && (status === STATUS.APPROVED || status === STATUS.REJECTED)) {
      const aKey = approvalDate.getFullYear() + '-' + String(approvalDate.getMonth() + 1).padStart(2, '0');
      if (monthMap[aKey]) {
        if (status === STATUS.APPROVED) monthMap[aKey].approved++;
        else monthMap[aKey].rejected++;
      }
    }

    // Alert: pending lama & RFI lewat SLA
    if (status === STATUS.PENDING && ts) {
      const ageDays = Math.floor((now - ts) / 86400000);
      let alertType = null;
      let reason = '';
      if (row[idx.DocumentType] === 'RFI' && row[idx.SLADueDate] && new Date(row[idx.SLADueDate]) < now) {
        alertType = 'rfi_overdue';
        reason = 'RFI lewat SLA ' + Math.floor((now - new Date(row[idx.SLADueDate])) / 86400000) + ' hari';
      } else if (ageDays >= staleDays) {
        alertType = 'pending_stale';
        reason = 'Pending ' + ageDays + ' hari';
      }
      if (alertType) {
        alerts.push({
          docId: row[idx.DocID],
          documentCode: displayDocCode_({ DocumentCode: row[idx.DocumentCode], ProjectCode: row[idx.ProjectCode], DocumentType: row[idx.DocumentType], DocumentNumber: row[idx.DocumentNumber] }),
          title: row[idx.Title],
          documentType: row[idx.DocumentType],
          projectName: pName,
          ageDays: ageDays,
          alertType: alertType,
          reason: reason,
          uploaderName: row[idx.UploaderName]
        });
      }
    }
  }

  // Urutkan
  const topProjects = Object.keys(projMap).map(k => projMap[k]).sort((a, b) => b.total - a.total).slice(0, 5);
  const byDiscipline = Object.keys(discMap).map(k => discMap[k]).sort((a, b) => b.total - a.total);
  alerts.sort((a, b) => b.ageDays - a.ageDays);

  return {
    success: true,
    trend: months,
    topProjects: topProjects,
    byDiscipline: byDiscipline,
    alerts: alerts.slice(0, 20),
    totalActive: totalActive
  };
}
// ============================================================================
// 24. LOGO PERUSAHAAN untuk Laporan
// ============================================================================
/** Download logo dari URL (di-cache 1 jam supaya tidak bolak-balik download). */
function getLogoBlob_() {
  try {
    const config = getConfig_();
    if (String(config.COMPANY_LOGO_ENABLED || 'TRUE').toUpperCase() !== 'TRUE') return null;
    const url = String(config.COMPANY_LOGO_URL || '').trim();
    if (!url || !/^https?:\/\//i.test(url)) return null;
    const cache = CacheService.getScriptCache();
    const cacheKey = 'qc_logo_b64';
    const cached = cache.get(cacheKey);
    if (cached) {
      try { return Utilities.newBlob(Utilities.base64Decode(cached), 'image/png', 'logo.png'); }
      catch (e) { cache.remove(cacheKey); }
    }
    const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
    if (resp.getResponseCode() !== 200) return null;
    const blob = resp.getBlob();
    const bytes = blob.getBytes();
    if (!bytes || bytes.length > 500 * 1024) return null;
    cache.put(cacheKey, Utilities.base64Encode(bytes), 3600);
    return blob;
  } catch (e) {
    Logger.log('getLogoBlob_ error: ' + e.message);
    return null;
  }
}
// ============================================================================
// 24b. HELPER: layout header laporan (Excel & Docs)
// ============================================================================
/** Baca ukuran logo dari config (default 80, clamp 40-160). */
function getLogoSize_() {
  const config = getConfig_();
  const n = parseInt(config.COMPANY_LOGO_SIZE, 10);
  if (isNaN(n) || n < 40) return 80;
  if (n > 160) return 160;
  return n;
}

/** Bangun header di SPREADSHEET (Excel).
 *  Mengembalikan nomor baris header tabel (baris pertama kolom). */
function buildXlsxHeader_(sheet, opts) {
  const logoBlob = getLogoBlob_();
  const size = getLogoSize_();
  const hasLogo = !!logoBlob;
  const lines = opts.lines || [];
  const totalCols = opts.totalCols || 10;
  const rowHeight = opts.rowHeight || 22;

  const startCol = hasLogo ? 3 : 1;
  const numCols = totalCols - startCol + 1;

  // Set lebar kolom A+B supaya total = ukuran logo + margin
  if (hasLogo) {
    const half = Math.max(20, Math.floor((size + 16) / 2));
    sheet.setColumnWidth(1, half);
    sheet.setColumnWidth(2, half);
  }

  // Tulis teks header
  lines.forEach(function (line, i) {
    const r = i + 1;
    sheet.getRange(r, startCol, 1, numCols).merge().setValue(line)
      .setFontWeight(i === 1 ? 'bold' : 'normal')
      .setFontSize(i === 1 ? 13 : (i === 0 ? 11 : 9.5))
      .setVerticalAlignment('middle')
      .setHorizontalAlignment(i === 1 ? 'center' : 'left');
    sheet.setRowHeight(r, rowHeight);
  });

  // Insert logo (di kolom A, baris 1, dengan offset kecil)
  if (hasLogo) {
    try {
      const img = sheet.insertImage(logoBlob, 1, 1, 4, 4);
      img.setWidth(size);
      img.setHeight(size);
    } catch (e) { Logger.log('Logo insert gagal: ' + e.message); }
  }

  return lines.length + 2;
}

/** Bangun header di DOCUMENT (PDF/Word) — pakai tabel 2 kolom.
 *  logoBlob & size di-pass dari luar supaya bisa dipakai berulang. */
function buildDocHeader_(body, opts) {
  const logoBlob = opts.logoBlob || getLogoBlob_();
  const size = opts.logoSize || getLogoSize_();
  const title = opts.title || '';
  const subtitle = opts.subtitle || '';
  const subtitle2 = opts.subtitle2 || '';
  const hasLogo = !!logoBlob;

  if (!hasLogo) {
    // Fallback: cuma teks
    if (title) body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.TITLE);
    if (subtitle) body.appendParagraph(subtitle).setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
    if (subtitle2) body.appendParagraph(subtitle2).setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
    return;
  }

  try {
    const tbl = body.appendTable([['', '']]);
    tbl.setBorderWidth(0);
    tbl.setColumnWidth(0, size + 24);
    tbl.setColumnWidth(1, opts.textColWidth || 480);

    const cellLogo = tbl.getRow(0).getCell(0);
    const cellText = tbl.getRow(0).getCell(1);

    cellLogo.setPaddingTop(0).setPaddingBottom(0).setPaddingLeft(0).setPaddingRight(0);
    cellLogo.setVerticalAlignment(DocumentApp.VerticalAlignment.MIDDLE);
    cellText.setPaddingTop(0).setPaddingBottom(0).setPaddingLeft(12).setPaddingRight(0);
    cellText.setVerticalAlignment(DocumentApp.VerticalAlignment.MIDDLE);

    const pLogo = cellLogo.getChild(0).asParagraph();
    pLogo.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    const img = pLogo.appendInlineImage(logoBlob);
    img.setWidth(size);
    img.setHeight(size);

    if (title) {
      const pTitle = cellText.getChild(0).asParagraph();
      pTitle.setText(title);
      pTitle.setHeading(DocumentApp.ParagraphHeading.TITLE);
      pTitle.setSpacingBefore(0);
    }
    if (subtitle) {
      const pSub = cellText.appendParagraph(subtitle);
      pSub.setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
    }
    if (subtitle2) {
      const pSub2 = cellText.appendParagraph(subtitle2);
      pSub2.setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
    }
  } catch (e) {
    Logger.log('Doc header gagal: ' + e.message);
    if (title) body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.TITLE);
    if (subtitle) body.appendParagraph(subtitle).setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
    if (subtitle2) body.appendParagraph(subtitle2).setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
  }
}
// ============================================================================
// 25. AUTO-BACKUP HARIAN KE GOOGLE DRIVE
// ============================================================================
const BACKUP_SHEETS = [
  'Documents', 'NFILog', 'Users', 'Projects', 'Approvers',
  'NumberingRules', 'Transmittals', 'TransmittalItems',
  'SiteReports', 'Notifications', 'AuditLog', 'Config'
];

/** Fungsi utama: buat backup 1 file Excel dari semua sheet penting. */
function runDailyBackup() {
  const config = getConfig_();
  if (String(config.BACKUP_ENABLED || 'TRUE').toUpperCase() !== 'TRUE') {
    Logger.log('Backup dinonaktifkan (BACKUP_ENABLED = FALSE).');
    return { success: false, message: 'Backup dinonaktifkan.' };
  }
  const rootFolderId = config.ROOT_FOLDER_ID;
  if (!rootFolderId) {
    Logger.log('ROOT_FOLDER_ID belum diisi — backup dilewati.');
    return { success: false, message: 'ROOT_FOLDER_ID belum diisi.' };
  }

  try {
    const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
    const now = new Date();
    const dateStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
    const timeStr = Utilities.formatDate(now, tz, 'HHmm');
    const fileName = 'Backup-QCCMS-' + dateStr + '-' + timeStr;

    // Buat spreadsheet baru untuk menampung semua sheet
    const backupSs = SpreadsheetApp.create(fileName);
    const defaultSheet = backupSs.getSheets()[0];
    let sheetCount = 0;
    let totalRows = 0;

    const ss = getSS_();

    BACKUP_SHEETS.forEach(function (sheetName) {
      const srcSheet = ss.getSheetByName(sheetName);
      if (!srcSheet) return;
      const lastRow = srcSheet.getLastRow();
      const lastCol = srcSheet.getLastColumn();
      if (lastRow < 1 || lastCol < 1) return;

      // Buat sheet baru di backup
      let destSheet;
      if (sheetCount === 0) {
        destSheet = defaultSheet;
        destSheet.setName(sheetName.substring(0, 30)); // nama sheet max 31 char
      } else {
        destSheet = backupSs.insertSheet(sheetName.substring(0, 30));
      }
      sheetCount++;

      // Copy semua data (value only — jangan formula)
      const data = srcSheet.getRange(1, 1, lastRow, lastCol).getValues();
      destSheet.getRange(1, 1, data.length, lastCol).setValues(data);
      totalRows += Math.max(0, data.length - 1); // -1 karena baris header

      // Format header
      if (data.length > 0) {
        destSheet.getRange(1, 1, 1, lastCol)
          .setFontWeight('bold').setBackground('#1a2332').setFontColor('#ffffff');
        destSheet.setFrozenRows(1);
      }
      // Auto-resize kolom supaya rapi
      try { destSheet.autoResizeColumns(1, Math.min(lastCol, 15)); } catch (e) { Logger.log('autoResizeColumns gagal di sheet ' + sheetName + ': ' + e.message); }
    });

    if (sheetCount === 0) {
      DriveApp.getFileById(backupSs.getId()).setTrashed(true);
      Logger.log('Tidak ada sheet yang bisa di-backup.');
      return { success: false, message: 'Tidak ada sheet yang bisa di-backup.' };
    }

    // Hapus sheet default kalau kosong & tidak terpakai
    if (sheetCount > 0 && defaultSheet.getName() === 'Sheet1') {
      try { backupSs.deleteSheet(defaultSheet); } catch (e) { Logger.log('Gagal hapus Sheet1 default backup: ' + e.message); }
    }

    // Info tambahan di file: keterangan waktu
    try {
      const infoSheet = backupSs.insertSheet('Info');
      infoSheet.getRange(1, 1, 6, 2).setValues([
        ['QC-CMS Backup', ''],
        ['Waktu Backup', Utilities.formatDate(now, tz, 'dd MMM yyyy HH:mm:ss')],
        ['Timezone', tz],
        ['Jumlah Sheet', String(sheetCount)],
        ['Total Baris Data', String(totalRows)],
        ['Versi Sistem', 'QC-CMS EDMS v55']
      ]);
      infoSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setFontSize(14);
      infoSheet.getRange(2, 1, 5, 1).setFontWeight('bold').setBackground('#f1ede4');
      infoSheet.setColumnWidth(1, 160);
      infoSheet.setColumnWidth(2, 320);
    } catch (e) { /* abaikan */ }

    SpreadsheetApp.flush();

    // Konversi ke Excel (.xlsx)
    const xlsxBlob = exportGoogleFileAs_(backupSs.getId(), 'spreadsheets', 'xlsx')
      .setName(fileName + '.xlsx');

    // Pindahkan ke folder Backups
    const backupFolderName = config.BACKUP_FOLDER_NAME || 'Backups';
    const backupFolder = getOrCreateFolderPath_(rootFolderId, [backupFolderName]);
    const savedFile = backupFolder.createFile(xlsxBlob);

    // Hapus file Google Sheet temporary
    try { DriveApp.getFileById(backupSs.getId()).setTrashed(true); } catch (e) { Logger.log('Gagal hapus temp backup spreadsheet: ' + e.message); }

    Logger.log('Backup berhasil: ' + savedFile.getName() + ' (' + totalRows + ' baris dari ' + sheetCount + ' sheet)');

    // Hapus backup lama
    cleanOldBackups_();

    // Log ke AuditLog
    try {
      logAudit_(
        { Email: 'system-backup', FullName: 'Auto Backup', Role: 'system' },
        'runDailyBackup', 'Backup', savedFile.getId(),
        savedFile.getName() + ' — ' + sheetCount + ' sheet, ' + totalRows + ' baris'
      );
    } catch (e) { Logger.log('logAudit_ gagal di runDailyBackup: ' + e.message); }

    return {
      success: true,
      message: 'Backup berhasil: ' + savedFile.getName(),
      fileUrl: savedFile.getUrl(),
      fileName: savedFile.getName(),
      sheetCount: sheetCount,
      totalRows: totalRows
    };
  } catch (err) {
    Logger.log('Backup error: ' + err.message);
    try {
      logAudit_(
        { Email: 'system-backup', FullName: 'Auto Backup', Role: 'system' },
        'runDailyBackup_error', 'Backup', '', err.message
      );
    } catch (e) { Logger.log('logAudit_ error handler gagal di backup: ' + e.message); }
    return { success: false, message: err.message };
  }
}

/** Hapus file backup lebih lama dari BACKUP_RETENTION_DAYS. */
function cleanOldBackups_() {
  try {
    const config = getConfig_();
    const days = parseInt(config.BACKUP_RETENTION_DAYS, 10);
    if (isNaN(days) || days <= 0) return { deleted: 0 }; // 0 = jangan hapus
    const rootFolderId = config.ROOT_FOLDER_ID;
    if (!rootFolderId) return { deleted: 0 };
    const backupFolderName = config.BACKUP_FOLDER_NAME || 'Backups';
    const folder = getOrCreateFolderPath_(rootFolderId, [backupFolderName]);
    const cutoff = new Date(Date.now() - days * 86400000);
    const files = folder.getFiles();
    let deleted = 0;
    while (files.hasNext()) {
      const file = files.next();
      const name = file.getName();
      if (name.indexOf('Backup-QCCMS-') !== 0) continue;
      if (file.getDateCreated() < cutoff) {
        try { file.setTrashed(true); deleted++; } catch (e) { Logger.log('Gagal hapus backup lama ' + file.getName() + ': ' + e.message); }
      }
    }
    Logger.log('Pembersihan backup: ' + deleted + ' file dihapus (> ' + days + ' hari).');
    return { deleted: deleted };
  } catch (e) {
    Logger.log('cleanOldBackups error: ' + e.message);
    return { deleted: 0 };
  }
}

/** Menu: jalankan backup manual + tampilkan hasil ke user. */
function runManualBackup() {
  const result = runDailyBackup();
  try {
    if (result.success) {
      SpreadsheetApp.getUi().alert(
        'Backup Berhasil!\n\n' +
        'File: ' + result.fileName + '\n' +
        'Sheet: ' + result.sheetCount + '\n' +
        'Total baris: ' + result.totalRows + '\n\n' +
        'Tersimpan di folder "' + (getConfig_().BACKUP_FOLDER_NAME || 'Backups') + '" di Google Drive.\n\n' +
        'Link: ' + result.fileUrl
      );
    } else {
      SpreadsheetApp.getUi().alert('Backup GAGAL:\n\n' + result.message);
    }
  } catch (e) {
    Logger.log('runManualBackup: ' + JSON.stringify(result));
  }
}

/** Menu: hapus backup lama manual. */
function cleanOldBackups() {
  const result = cleanOldBackups_();
  try {
    SpreadsheetApp.getUi().alert('Pembersihan selesai. ' + result.deleted + ' file backup lama dihapus.');
  } catch (e) {
    Logger.log('cleanOldBackups: ' + result.deleted + ' dihapus');
  }
}

/** Menu: aktifkan trigger harian jam 02:00. */
function createDailyBackupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'runDailyBackup') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('runDailyBackup').timeBased().everyDays(1).atHour(2).create();
  try {
    SpreadsheetApp.getUi().alert(
      'Trigger backup harian berhasil diaktifkan.\n\n' +
      'Backup akan berjalan setiap hari sekitar jam 02:00 pagi.\n\n' +
      'File disimpan di folder "' + (getConfig_().BACKUP_FOLDER_NAME || 'Backups') + '" ' +
      'di dalam ROOT_FOLDER_ID, dengan retensi ' +
      (getConfig_().BACKUP_RETENTION_DAYS || '30') + ' hari.'
    );
  } catch (e) {
    Logger.log('Trigger backup harian aktif.');
  }
}
// ============================================================================
// 26. RECYCLE BIN (SAMPAH) — Dokumen & NFI
// ============================================================================
/** Ambil semua item yang ada di sampah (dokumen + entri NFI yang sudah dihapus). */
function getRecycleBinItems(sessionToken) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const now = new Date();
  const canViewAll = VIEW_ALL_ROLES.indexOf(user.Role) !== -1;

  const documents = [];
  const nfiEntries = [];

  // --- Dokumen ---
  const docSheet = ss.getSheetByName(SHEET.DOCUMENTS);
  if (docSheet) {
    const data = docSheet.getDataRange().getValues();
    if (data.length > 1) {
      const header = data[0];
      const idx = {};
      header.forEach((h, i) => idx[h] = i);
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[idx.Status] !== STATUS.DELETED) continue;
        if (!canViewAll && row[idx.UploaderEmail] !== user.Email) continue;
        const deletedAt = row[idx.DeletedAt] ? new Date(row[idx.DeletedAt]) : (row[idx.Timestamp] ? new Date(row[idx.Timestamp]) : null);
        const daysAgo = deletedAt ? Math.floor((now - deletedAt) / 86400000) : null;
        documents.push({
          docId: row[idx.DocID],
          documentCode: displayDocCode_({ DocumentCode: row[idx.DocumentCode], ProjectCode: row[idx.ProjectCode], DocumentType: row[idx.DocumentType], DocumentNumber: row[idx.DocumentNumber] }),
          title: row[idx.Title],
          projectName: row[idx.ProjectName],
          documentType: row[idx.DocumentType],
          discipline: row[idx.Discipline],
          fileName: row[idx.FileName],
          deletedAt: deletedAt ? deletedAt.toISOString() : '',
          deletedFromStatus: row[idx.DeletedFromStatus] || '',
          daysAgo: daysAgo,
          uploaderName: row[idx.UploaderName],
          canManage: (user.Role === ROLES.ADMIN) || (row[idx.UploaderEmail] === user.Email)
        });
      }
    }
  }

  // --- NFI Log ---
  const nfiSheet = ss.getSheetByName(SHEET.NFILOG);
  if (nfiSheet) {
    const data = nfiSheet.getDataRange().getValues();
    if (data.length > 1) {
      const idx = nfiLogIdx_();
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[idx.RecordStatus] !== 'Deleted') continue;
        if (!canViewAll && row[idx.CreatedByEmail] !== user.Email) continue;
        const deletedAt = row[idx.DeletedAt] ? new Date(row[idx.DeletedAt]) : (row[idx.UpdatedAt] ? new Date(row[idx.UpdatedAt]) : null);
        const daysAgo = deletedAt ? Math.floor((now - deletedAt) / 86400000) : null;
        nfiEntries.push({
          nfiId: row[idx.NFIID],
          noNfi: row[idx.NoNFI],
          subject: row[idx.SubjectDescription],
          projectName: row[idx.ProjectName] || row[idx.ProjectCode],
          discipline: row[idx.Discipline],
          typeOfInspection: row[idx.TypeOfInspection],
          deletedAt: deletedAt ? deletedAt.toISOString() : '',
          daysAgo: daysAgo,
          createdByName: row[idx.CreatedByName],
          canManage: (user.Role === ROLES.ADMIN) || (user.Role === ROLES.MANAGER) || (row[idx.CreatedByEmail] === user.Email)
        });
      }
    }
  }

  documents.sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));
  nfiEntries.sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));

  const config = getConfig_();
  const retentionDays = parseInt(config.RECYCLE_BIN_RETENTION_DAYS, 10);
  return {
    success: true,
    documents: documents,
    nfiEntries: nfiEntries,
    totalCount: documents.length + nfiEntries.length,
    retentionDays: isNaN(retentionDays) ? 30 : retentionDays
  };
}

/** Pulihkan dokumen dari sampah. */
function restoreDocumentFromBin(sessionToken, docId) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const doc = findDocumentById_(sheet, docId);
  if (!doc) return { success: false, message: 'Dokumen tidak ditemukan.' };
  if (doc.Status !== STATUS.DELETED) return { success: false, message: 'Dokumen ini tidak dalam status terhapus.' };
  const canRestore = (user.Role === ROLES.ADMIN || user.Role === ROLES.MANAGER) || (doc.UploaderEmail === user.Email);
  if (!canRestore) return { success: false, message: 'Anda tidak memiliki izin memulihkan dokumen ini.' };

  const idx = {};
  DOCUMENTS_HEADER.forEach((h, i) => idx[h] = i + 1);
  const restoreTo = doc.DeletedFromStatus || STATUS.PENDING;

  // Cek apakah ada revisi lain yang jadi latest untuk grup yang sama
  const siblings = findAllRevisionRows_(sheet, doc.ProjectCode, doc.DocumentType, doc.DocumentNumber)
    .filter(r => r.rowIndex !== doc.rowIndex && r.Status !== STATUS.DELETED);
  const hasOtherLatest = siblings.some(r => r.rowIndex !== doc.rowIndex && sheet.getRange(r.rowIndex, idx.IsLatestRevision).getValue() === true);

  const restBinRow = sheet.getRange(doc.rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  restBinRow[idx.Status - 1] = restoreTo;
  const lcMap = { Approved: LIFECYCLE.APPROVED, Pending: LIFECYCLE.IN_REVIEW, Rejected: LIFECYCLE.REJECTED, Superseded: LIFECYCLE.SUPERSEDED };
  restBinRow[idx.LifecycleStage - 1] = lcMap[restoreTo] || LIFECYCLE.IN_REVIEW;
  if (!hasOtherLatest) restBinRow[idx.IsLatestRevision - 1] = true;
  if (idx.DeletedAt) restBinRow[idx.DeletedAt - 1] = '';
  if (idx.DeletedFromStatus) restBinRow[idx.DeletedFromStatus - 1] = '';
  sheet.getRange(doc.rowIndex, 1, 1, restBinRow.length).setValues([restBinRow]);

  logAudit_(user, 'restoreDocument', 'Document', docId, doc.DocumentType + ' ' + displayDocCode_(doc) + ' Rev' + doc.Revision);
  return { success: true, message: 'Dokumen "' + doc.Title + '" berhasil dipulihkan.' };
}

/** Pulihkan entri NFI dari sampah. */
function restoreNFIEntryFromBin(sessionToken, nfiId) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const sheet = getSS_().getSheetByName(SHEET.NFILOG);
  const data = sheet.getDataRange().getValues();
  const idx = nfiLogIdx_();
  for (let i = 1; i < data.length; i++) {
    if (data[i][idx.NFIID] === nfiId) {
      if (data[i][idx.RecordStatus] !== 'Deleted') return { success: false, message: 'Entri ini tidak dalam status terhapus.' };
      const canRestore = (user.Role === ROLES.ADMIN) || (user.Role === ROLES.MANAGER) || (data[i][idx.CreatedByEmail] === user.Email);
      if (!canRestore) return { success: false, message: 'Anda tidak memiliki izin.' };
      data[i][idx.RecordStatus] = 'Active';
      data[i][idx.UpdatedAt] = new Date();
      if (idx.DeletedAt !== undefined) data[i][idx.DeletedAt] = '';
      sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
      logAudit_(user, 'restoreNFIEntry', 'NFILog', nfiId, data[i][idx.NoNFI] + ' — ' + data[i][idx.SubjectDescription]);
      return { success: true, message: 'Entri NFI "' + data[i][idx.NoNFI] + '" berhasil dipulihkan.' };
    }
  }
  return { success: false, message: 'Entri tidak ditemukan.' };
}

/** Hapus permanen dokumen (row + file Drive). */
function permanentlyDeleteDocument(sessionToken, docId) {
  const user = requireRole_(sessionToken, [ROLES.ADMIN, ROLES.MANAGER]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENTS);
  const doc = findDocumentById_(sheet, docId);
  if (!doc) return { success: false, message: 'Dokumen tidak ditemukan.' };
  if (doc.Status !== STATUS.DELETED) return { success: false, message: 'Hanya dokumen di sampah yang bisa dihapus permanen.' };
  try {
    if (doc.FileID) DriveApp.getFileById(doc.FileID).setTrashed(true);
    const additionalRaw = doc.AdditionalFileURLs;
    if (additionalRaw) {
      String(additionalRaw).split('\n').filter(Boolean).forEach(function (u) {
        try { DriveApp.getFileById(extractDriveId_(u)).setTrashed(true); } catch (e) { Logger.log('Gagal hapus attachment lampiran ' + u + ': ' + e.message); }
      });
    }
  } catch (e) { Logger.log('Gagal hapus file drive utama di permanentlyDeleteDocument: ' + e.message); }
  sheet.deleteRow(doc.rowIndex);
  logAudit_(user, 'permanentlyDeleteDocument', 'Document', docId, doc.DocumentType + ' ' + displayDocCode_(doc) + ' — ' + doc.Title);
  return { success: true, message: 'Dokumen "' + doc.Title + '" dihapus permanen.' };
}

/** Hapus permanen entri NFI. */
function permanentlyDeleteNFIEntry(sessionToken, nfiId) {
  const user = requireRole_(sessionToken, [ROLES.ADMIN, ROLES.MANAGER]);
  const sheet = getSS_().getSheetByName(SHEET.NFILOG);
  const data = sheet.getDataRange().getValues();
  const idx = nfiLogIdx_();
  for (let i = 1; i < data.length; i++) {
    if (data[i][idx.NFIID] === nfiId) {
      if (data[i][idx.RecordStatus] !== 'Deleted') return { success: false, message: 'Hanya entri di sampah yang bisa dihapus permanen.' };
      try {
        if (data[i][idx.AttachmentFileID]) DriveApp.getFileById(data[i][idx.AttachmentFileID]).setTrashed(true);
      } catch (e) { Logger.log('Gagal hapus attachment Drive di permanentlyDeleteNFIEntry: ' + e.message); }
      sheet.deleteRow(i + 1);
      logAudit_(user, 'permanentlyDeleteNFIEntry', 'NFILog', nfiId, data[i][idx.NoNFI] + ' — ' + data[i][idx.SubjectDescription]);
      return { success: true, message: 'Entri NFI dihapus permanen.' };
    }
  }
  return { success: false, message: 'Entri tidak ditemukan.' };
}

/** Auto-bersihkan sampah yang lebih tua dari RECYCLE_BIN_RETENTION_DAYS. */
function cleanOldRecycleBin_() {
  try {
    const config = getConfig_();
    const days = parseInt(config.RECYCLE_BIN_RETENTION_DAYS, 10);
    if (isNaN(days) || days <= 0) return { documents: 0, nfi: 0 };
    const cutoff = new Date(Date.now() - days * 86400000);
    const ss = getSS_();
    let deletedDocs = 0, deletedNfi = 0;

    // Dokumen
    const docSheet = ss.getSheetByName(SHEET.DOCUMENTS);
    if (docSheet) {
      const data = docSheet.getDataRange().getValues();
      if (data.length > 1) {
        const header = data[0];
        const idx = {};
        header.forEach((h, i) => idx[h] = i);
        // Loop mundur supaya index tidak kacau saat deleteRow
        for (let i = data.length - 1; i >= 1; i--) {
          const row = data[i];
          if (row[idx.Status] !== STATUS.DELETED) continue;
          const delAt = row[idx.DeletedAt] ? new Date(row[idx.DeletedAt]) : null;
          if (!delAt || delAt > cutoff) continue;
          try {
            if (row[idx.FileID]) DriveApp.getFileById(row[idx.FileID]).setTrashed(true);
            const additionalRaw = row[idx.AdditionalFileURLs];
            if (additionalRaw) String(additionalRaw).split('\n').filter(Boolean).forEach(function (u) {
              try { DriveApp.getFileById(extractDriveId_(u)).setTrashed(true); } catch (e) { Logger.log('Gagal hapus additional file di emptyBin: ' + e.message); }
            });
          } catch (e) { Logger.log('Gagal hapus file Drive di emptyBin: ' + e.message); }
          docSheet.deleteRow(i + 1);
          deletedDocs++;
        }
      }
    }

    // NFI
    const nfiSheet = ss.getSheetByName(SHEET.NFILOG);
    if (nfiSheet) {
      const data = nfiSheet.getDataRange().getValues();
      if (data.length > 1) {
        const idx = nfiLogIdx_();
        for (let i = data.length - 1; i >= 1; i--) {
          const row = data[i];
          if (row[idx.RecordStatus] !== 'Deleted') continue;
          const delAt = row[idx.DeletedAt] ? new Date(row[idx.DeletedAt]) : (row[idx.UpdatedAt] ? new Date(row[idx.UpdatedAt]) : null);
          if (!delAt || delAt > cutoff) continue;
          try {
            if (row[idx.AttachmentFileID]) DriveApp.getFileById(row[idx.AttachmentFileID]).setTrashed(true);
          } catch (e) { Logger.log('Gagal hapus attachment NFI di emptyBin: ' + e.message); }
          nfiSheet.deleteRow(i + 1);
          deletedNfi++;
        }
      }
    }

    Logger.log('Bersih sampah: ' + deletedDocs + ' dokumen, ' + deletedNfi + ' NFI dihapus permanen (> ' + days + ' hari).');
    if (deletedDocs + deletedNfi > 0) {
      logAudit_(
        { Email: 'system-recyclebin', FullName: 'Auto Clean', Role: 'system' },
        'cleanRecycleBin', 'RecycleBin', '',
        deletedDocs + ' dokumen, ' + deletedNfi + ' NFI dihapus permanen (>' + days + ' hari)'
      );
    }
    return { documents: deletedDocs, nfi: deletedNfi };
  } catch (e) {
    Logger.log('cleanOldRecycleBin error: ' + e.message);
    return { documents: 0, nfi: 0 };
  }
}

/** Menu: bersihkan sampah manual + alert. */
function cleanRecycleBinMenu() {
  const r = cleanOldRecycleBin_();
  try {
    SpreadsheetApp.getUi().alert(
      'Pembersihan Sampah Selesai\n\n' +
      'Dokumen dihapus permanen: ' + r.documents + '\n' +
      'Entri NFI dihapus permanen: ' + r.nfi + '\n\n' +
      'Item yang lebih lama dari ' + (getConfig_().RECYCLE_BIN_RETENTION_DAYS || 30) + ' hari dibersihkan otomatis.'
    );
  } catch (e) { Logger.log('cleanRecycleBinMenu: ' + JSON.stringify(r)); }
}

/** Menu: aktifkan trigger harian bersih sampah jam 03:00. */
function createRecycleBinTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'cleanOldRecycleBin_') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('cleanOldRecycleBin_').timeBased().everyDays(1).atHour(3).create();
  try {
    SpreadsheetApp.getUi().alert(
      'Trigger bersih sampah harian diaktifkan.\n\n' +
      'Setiap hari jam 03:00, item di Sampah yang lebih tua dari ' +
      (getConfig_().RECYCLE_BIN_RETENTION_DAYS || 30) + ' hari akan dihapus permanen.'
    );
  } catch (e) { Logger.log('Trigger bersih sampah harian aktif.'); }
}
// ============================================================================
// 27. TUGAS SAYA — Personal Task Dashboard
// ============================================================================
function getMyTasks(sessionToken) {
  const user = requireSession_(sessionToken);
  if (!user) throw new Error('Sesi Anda telah berakhir.');
  const ss = getSS_();
  const now = new Date();
  const config = getConfig_();
  const staleDays = parseInt(config.STALE_PENDING_DAYS, 10) || 5;

  const result = {
    success: true,
    userRole: user.Role,
    userName: user.FullName,
    canApprove: canUserApprove_(user),
    pendingApprovals: [],
    myPendingDocs: [],
    myRejectedDocs: [],
    myOpenNfi: [],
    summary: {
      totalApprovals: 0,
      totalPending: 0,
      totalRejected: 0,
      totalNfiOpen: 0,
      grandTotal: 0
    }
  };

  // =============== 1. DOKUMEN ===============
  const docSheet = ss.getSheetByName(SHEET.DOCUMENTS);
  if (docSheet) {
    const data = docSheet.getDataRange().getValues();
    if (data.length > 1) {
      const header = data[0];
      const idx = {};
      header.forEach((h, i) => idx[h] = i);

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[idx.Status] === STATUS.DELETED) continue;
        if (row[idx.IsLatestRevision] !== true) continue;
        const lc = row[idx.LifecycleStage];
        if (lc === LIFECYCLE.ARCHIVED || lc === LIFECYCLE.OBSOLETE) continue;

        const status = row[idx.Status];
        const uploaderEmail = String(row[idx.UploaderEmail] || '').toLowerCase().trim();
        const approverEmail = String(row[idx.ApproverEmail] || '').toLowerCase().trim();
        const ts = row[idx.Timestamp] ? new Date(row[idx.Timestamp]) : null;
        const ageDays = ts ? Math.floor((now - ts) / 86400000) : null;
        const docBase = {
          docId: row[idx.DocID],
          documentCode: displayDocCode_({ DocumentCode: row[idx.DocumentCode], ProjectCode: row[idx.ProjectCode], DocumentType: row[idx.DocumentType], DocumentNumber: row[idx.DocumentNumber] }),
          title: row[idx.Title],
          documentType: row[idx.DocumentType],
          projectName: row[idx.ProjectName],
          discipline: row[idx.Discipline],
          uploaderName: row[idx.UploaderName],
          status: status,
          fileName: row[idx.FileName],
          fileUrl: row[idx.FileURL],
          ageDays: ageDays,
          slaDueDate: row[idx.SLADueDate] ? new Date(row[idx.SLADueDate]).toISOString() : '',
          isRfiOverdue: row[idx.DocumentType] === 'RFI' && status === STATUS.PENDING && row[idx.SLADueDate] && new Date(row[idx.SLADueDate]) < now,
          comments: row[idx.Comments] || ''
        };

        // Menunggu approval SAYA (kalau saya approver & dokumen ini ditujukan ke saya atau saya bisa approve)
        if (status === STATUS.PENDING && canUserApprove_(user)) {
          // Prioritas: kalau approver email persis saya, atau saya admin/manager
          const isDirectAssignee = approverEmail && approverEmail === user.Email.toLowerCase().trim();
          const isAdminOrManager = user.Role === ROLES.ADMIN || user.Role === ROLES.MANAGER;
          if (isDirectAssignee || isAdminOrManager) {
            result.pendingApprovals.push(Object.assign({}, docBase, {
              isDirectAssignee: !!isDirectAssignee,
              priority: isDirectAssignee ? 'high' : 'normal'
            }));
          }
        }

        // Dokumen SAYA yang pending
        if (status === STATUS.PENDING && uploaderEmail === user.Email.toLowerCase().trim()) {
          result.myPendingDocs.push(Object.assign({}, docBase, {
            isStale: ageDays !== null && ageDays >= staleDays
          }));
        }

        // Dokumen SAYA yang rejected (perlu revisi)
        if (status === STATUS.REJECTED && uploaderEmail === user.Email.toLowerCase().trim()) {
          result.myRejectedDocs.push(docBase);
        }
      }
    }
  }

  // =============== 2. NFI LOG ===============
  const nfiSheet = ss.getSheetByName(SHEET.NFILOG);
  if (nfiSheet) {
    const data = nfiSheet.getDataRange().getValues();
    if (data.length > 1) {
      const nidx = nfiLogIdx_();
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[nidx.RecordStatus] === 'Deleted') continue;
        const status = String(row[nidx.Status] || '');
        if (status !== 'Open' && status !== 'In Progress') continue;

        const createdBy = String(row[nidx.CreatedByEmail] || '').toLowerCase().trim();
        const picAei = String(row[nidx.PICAei] || '').trim();
        const isCreator = createdBy === user.Email.toLowerCase().trim();
        const isPicAei = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(picAei) && picAei.toLowerCase() === user.Email.toLowerCase();
        const isPicAeiName = picAei && picAei.toLowerCase().indexOf(user.FullName.toLowerCase()) !== -1;

        if (!isCreator && !isPicAei && !isPicAeiName) continue;
        // Admin/Manager lihat semua yang Open (opsional: batasi 10 terbaru)
        const isAdmin = user.Role === ROLES.ADMIN || user.Role === ROLES.MANAGER;
        if (!isCreator && !isPicAei && !isPicAeiName && !isAdmin) continue;

        const refDate = row[nidx.InspectionDate] || row[nidx.IssuedDate] || row[nidx.CreatedAt];
        const ageDays = refDate ? Math.floor((now - new Date(refDate)) / 86400000) : null;

        result.myOpenNfi.push({
          nfiId: row[nidx.NFIID],
          noNfi: row[nidx.NoNFI],
          subject: row[nidx.SubjectDescription],
          projectName: row[nidx.ProjectName] || row[nidx.ProjectCode],
          discipline: row[nidx.Discipline],
          typeOfInspection: row[nidx.TypeOfInspection],
          status: status,
          result: row[nidx.Result],
          picAei: picAei,
          ageDays: ageDays,
          isOverdue: ageDays !== null && ageDays > 7,
          createdByName: row[nidx.CreatedByName],
          role: isCreator ? 'creator' : (isPicAei || isPicAeiName ? 'pic' : 'admin')
        });
      }
    }
  }

  // Urutkan
  result.pendingApprovals.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
    return (b.ageDays || 0) - (a.ageDays || 0);
  });
  result.myPendingDocs.sort((a, b) => (b.ageDays || 0) - (a.ageDays || 0));
  result.myRejectedDocs.sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));
  result.myOpenNfi.sort((a, b) => (b.ageDays || 0) - (a.ageDays || 0));

  // Batasi 20 item per kategori supaya halaman tidak overload
  result.pendingApprovals = result.pendingApprovals.slice(0, 20);
  result.myPendingDocs = result.myPendingDocs.slice(0, 20);
  result.myRejectedDocs = result.myRejectedDocs.slice(0, 20);
  result.myOpenNfi = result.myOpenNfi.slice(0, 20);

  result.summary.totalApprovals = result.pendingApprovals.length;
  result.summary.totalPending = result.myPendingDocs.length;
  result.summary.totalRejected = result.myRejectedDocs.length;
  result.summary.totalNfiOpen = result.myOpenNfi.length;
  result.summary.grandTotal =
    result.summary.totalApprovals +
    result.summary.totalPending +
    result.summary.totalRejected +
    result.summary.totalNfiOpen;

  return result;
}
// ============================================================================
// 28. KELOLA DISIPLIN & PROYEK DARI UI
// ============================================================================
/** Baca daftar disiplin aktif dari sheet. Fallback ke DEFAULT_DISCIPLINES kalau kosong. */
function getDisciplinesList_() {
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.DISCIPLINES);
    if (!sheet) return DEFAULT_DISCIPLINES.slice();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return DEFAULT_DISCIPLINES.slice();
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);
    const results = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[idx.DisciplineName]) continue;
      const active = row[idx.Active] === true || String(row[idx.Active]).toUpperCase() === 'TRUE';
      if (!active) continue;
      results.push(String(row[idx.DisciplineName]).trim());
    }
    return results.length ? results : DEFAULT_DISCIPLINES.slice();
  } catch (e) {
    return DEFAULT_DISCIPLINES.slice();
  }
}

/** Admin: dapatkan semua disiplin (aktif + non-aktif) untuk UI pengaturan. */
function getDisciplinesSettings(sessionToken) {
  requireRole_(sessionToken, [ROLES.ADMIN]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DISCIPLINES);
  if (!sheet) return { success: true, items: [] };
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, items: [] };
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const items = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[idx.DisciplineName]) continue;
    items.push({
      rowIndex: i + 1,
      name: String(row[idx.DisciplineName]).trim(),
      active: row[idx.Active] === true || String(row[idx.Active]).toUpperCase() === 'TRUE',
      createdAt: row[idx.CreatedAt] ? new Date(row[idx.CreatedAt]).toISOString() : '',
      isDefault: DEFAULT_DISCIPLINES.indexOf(String(row[idx.DisciplineName]).trim()) !== -1
    });
  }
  return { success: true, items: items };
}

/** Admin: simpan (tambah / edit) disiplin. */
function saveDisciplineFromUI(sessionToken, payload) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  payload = payload || {};
  const name = String(payload.name || '').trim();
  const oldName = String(payload.oldName || '').trim();
  if (!name) return { success: false, message: 'Nama disiplin wajib diisi.' };
  if (name.length > 60) return { success: false, message: 'Nama disiplin maksimal 60 karakter.' };
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sibuk, coba lagi.' }; }
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.DISCIPLINES);
    if (!sheet) return { success: false, message: 'Sheet Disciplines belum dibuat. Jalankan initializeSystem() dulu.' };
    const data = sheet.getDataRange().getValues();
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);

    // Cek duplikat
    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      const curr = String(data[i][idx.DisciplineName] || '').trim().toLowerCase();
      if (oldName && curr === oldName.toLowerCase()) { foundRow = i + 1; continue; }
      if (curr === name.toLowerCase() && (!oldName || oldName.toLowerCase() !== curr)) {
        return { success: false, message: 'Disiplin "' + name + '" sudah ada.' };
      }
    }

    if (oldName && foundRow !== -1) {
      // Edit
      sheet.getRange(foundRow, idx.DisciplineName + 1).setValue(name);
      logAudit_(actor, 'updateDiscipline', 'Discipline', '', oldName + ' → ' + name);
      return { success: true, message: 'Disiplin "' + oldName + '" berhasil diubah menjadi "' + name + '".' };
    } else {
      // Tambah baru
      sheet.appendRow([name, true, new Date()]);
      logAudit_(actor, 'addDiscipline', 'Discipline', '', name);
      return { success: true, message: 'Disiplin "' + name + '" berhasil ditambahkan.' };
    }
  } finally { lock.releaseLock(); }
}

/** Admin: hapus (soft delete) disiplin — set Active = false. */
function deleteDisciplineFromUI(sessionToken, name) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  const target = String(name || '').trim();
  if (!target) return { success: false, message: 'Nama disiplin tidak valid.' };
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sibuk.' }; }
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.DISCIPLINES);
    if (!sheet) return { success: false, message: 'Sheet Disciplines belum dibuat.' };
    const data = sheet.getDataRange().getValues();
    const idx = {};
    data[0].forEach((h, i) => idx[h] = i);
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idx.DisciplineName] || '').trim().toLowerCase() === target.toLowerCase()) {
        sheet.getRange(i + 1, idx.Active + 1).setValue(false);
        logAudit_(actor, 'deleteDiscipline', 'Discipline', '', target);
        return { success: true, message: 'Disiplin "' + target + '" dinonaktifkan.' };
      }
    }
    return { success: false, message: 'Disiplin tidak ditemukan.' };
  } finally { lock.releaseLock(); }
}

/** Admin: aktifkan kembali disiplin yang sudah dihapus. */
function restoreDisciplineFromUI(sessionToken, name) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  const target = String(name || '').trim();
  if (!target) return { success: false, message: 'Nama disiplin tidak valid.' };
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DISCIPLINES);
  if (!sheet) return { success: false, message: 'Sheet Disciplines belum dibuat.' };
  const data = sheet.getDataRange().getValues();
  const idx = {};
  data[0].forEach((h, i) => idx[h] = i);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx.DisciplineName] || '').trim().toLowerCase() === target.toLowerCase()) {
      sheet.getRange(i + 1, idx.Active + 1).setValue(true);
      logAudit_(actor, 'restoreDiscipline', 'Discipline', '', target);
      return { success: true, message: 'Disiplin "' + target + '" diaktifkan kembali.' };
    }
  }
  return { success: false, message: 'Disiplin tidak ditemukan.' };
}

/** Admin: dapatkan semua proyek (aktif + non-aktif) untuk UI pengaturan. */
function getProjectsSettings(sessionToken) {
  requireRole_(sessionToken, [ROLES.ADMIN]);

  return withCache_(CK.PROJECTS, 300, function () {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.PROJECTS);
    if (!sheet) return { success: true, items: [] };
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, items: [] };
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);
    const items = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[idx.ProjectCode]) continue;
      const statusRaw = String(row[idx.Status] || 'Active');
      items.push({
        rowIndex: i + 1,
        code: String(row[idx.ProjectCode]).trim(),
        name: String(row[idx.ProjectName] || '').trim(),
        location: String(row[idx.Location] || '').trim(),
        status: statusRaw
      });
    }
    return { success: true, items: items };
  });
}

/** Admin: simpan (tambah / edit) proyek. */
function saveProjectFromUI(sessionToken, payload) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  payload = payload || {};
  const code = String(payload.code || '').trim().toUpperCase();
  const name = String(payload.name || '').trim();
  const location = String(payload.location || '').trim();
  const status = String(payload.status || 'Active').trim();
  const oldCode = String(payload.oldCode || '').trim().toUpperCase();

  if (!code) return { success: false, message: 'Kode proyek wajib diisi.' };
  if (code.length > 20) return { success: false, message: 'Kode proyek maksimal 20 karakter.' };
  if (!/^[A-Z0-9\-_]+$/.test(code)) return { success: false, message: 'Kode proyek hanya boleh huruf, angka, strip (-), underscore (_).' };
  if (!name) return { success: false, message: 'Nama proyek wajib diisi.' };
  if (name.length > 120) return { success: false, message: 'Nama proyek maksimal 120 karakter.' };
  if (['Active', 'Inactive', 'Closed'].indexOf(status) === -1) return { success: false, message: 'Status proyek tidak valid.' };

  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sibuk.' }; }
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.PROJECTS);
    if (!sheet) return { success: false, message: 'Sheet Projects tidak ditemukan.' };
    const data = sheet.getDataRange().getValues();
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);

    // Cek duplikat kode
    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      const currCode = String(data[i][idx.ProjectCode] || '').trim().toUpperCase();
      if (oldCode && currCode === oldCode) { foundRow = i + 1; continue; }
      if (currCode === code && (!oldCode || oldCode !== code)) {
        return { success: false, message: 'Kode proyek "' + code + '" sudah terdaftar.' };
      }
    }

    if (oldCode && foundRow !== -1) {
      // Edit
      sheet.getRange(foundRow, 1, 1, 4).setValues([[code, name, location, status]]);
      logAudit_(actor, 'updateProject', 'Project', code, oldCode + ' → ' + code + ' (' + name + ', ' + status + ')');
      if (typeof invalidateCacheMulti_ === 'function') {
        invalidateCacheMulti_([CK.PROJECTS, 'qc_projects_cache']);
      } else {
        CacheService.getScriptCache().remove('qc_projects_cache');
      }
      return { success: true, message: 'Proyek "' + name + '" berhasil diperbarui.' };
    } else {
      // Tambah baru
      sheet.appendRow([code, name, location, status]);
      logAudit_(actor, 'addProject', 'Project', code, code + ' — ' + name + ' (' + status + ')');
      if (typeof invalidateCacheMulti_ === 'function') {
        invalidateCacheMulti_([CK.PROJECTS, 'qc_projects_cache']);
      } else {
        CacheService.getScriptCache().remove('qc_projects_cache');
      }
      return { success: true, message: 'Proyek "' + name + '" berhasil ditambahkan.' };
    }
  } finally { lock.releaseLock(); }
}

/** Admin: non-aktifkan proyek (soft delete via Status = 'Inactive'). */
function deleteProjectFromUI(sessionToken, code) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  const target = String(code || '').trim().toUpperCase();
  if (!target) return { success: false, message: 'Kode proyek tidak valid.' };
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sibuk.' }; }
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.PROJECTS);
    const data = sheet.getDataRange().getValues();
    const idx = {};
    data[0].forEach((h, i) => idx[h] = i);
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idx.ProjectCode] || '').trim().toUpperCase() === target) {
        sheet.getRange(i + 1, idx.Status + 1).setValue('Inactive');
        logAudit_(actor, 'deleteProject', 'Project', target, 'Dinonaktifkan');
        if (typeof invalidateCacheMulti_ === 'function') {
          invalidateCacheMulti_([CK.PROJECTS, 'qc_projects_cache']);
        } else {
          CacheService.getScriptCache().remove('qc_projects_cache');
        }
        return { success: true, message: 'Proyek "' + target + '" dinonaktifkan.' };
      }
    }
    return { success: false, message: 'Proyek tidak ditemukan.' };
  } finally { lock.releaseLock(); }
}

/** Admin: aktifkan kembali proyek. */
function restoreProjectFromUI(sessionToken, code) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  const target = String(code || '').trim().toUpperCase();
  if (!target) return { success: false, message: 'Kode proyek tidak valid.' };
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.PROJECTS);
  const data = sheet.getDataRange().getValues();
  const idx = {};
  data[0].forEach((h, i) => idx[h] = i);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx.ProjectCode] || '').trim().toUpperCase() === target) {
      sheet.getRange(i + 1, idx.Status + 1).setValue('Active');
      logAudit_(actor, 'restoreProject', 'Project', target, 'Diaktifkan kembali');
      if (typeof invalidateCacheMulti_ === 'function') {
        invalidateCacheMulti_([CK.PROJECTS, 'qc_projects_cache']);
      } else {
        CacheService.getScriptCache().remove('qc_projects_cache');
      }
      return { success: true, message: 'Proyek "' + target + '" diaktifkan kembali.' };
    }
  }
  return { success: false, message: 'Proyek tidak ditemukan.' };
}
// ============================================================================
// 29. KELOLA JENIS DOKUMEN DARI UI
// ============================================================================
/** Baca daftar kode jenis dokumen yang aktif (untuk validasi & dropdown). */
function getDocTypesCodes_() {
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.DOCUMENT_TYPES);
    if (!sheet) return DOC_TYPES.slice();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return DOC_TYPES.slice();
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);
    const results = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[idx.TypeCode]) continue;
      const active = row[idx.Active] === true || String(row[idx.Active]).toUpperCase() === 'TRUE';
      if (!active) continue;
      results.push(String(row[idx.TypeCode]).trim().toUpperCase());
    }
    return results.length ? results : DOC_TYPES.slice();
  } catch (e) {
    return DOC_TYPES.slice();
  }
}

/** Baca daftar lengkap {code, description} aktif — untuk ditampilkan di dropdown. */
function getDocTypesFull_() {
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.DOCUMENT_TYPES);
    if (!sheet) {
      return DOC_TYPES.map(function (t) { return { code: t, description: '' }; });
    }
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return DOC_TYPES.map(function (t) { return { code: t, description: '' }; });
    }
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);
    const results = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[idx.TypeCode]) continue;
      const active = row[idx.Active] === true || String(row[idx.Active]).toUpperCase() === 'TRUE';
      if (!active) continue;
      results.push({
        code: String(row[idx.TypeCode]).trim().toUpperCase(),
        description: String(row[idx.TypeDescription] || '').trim()
      });
    }
    return results.length ? results : DOC_TYPES.map(function (t) { return { code: t, description: '' }; });
  } catch (e) {
    return DOC_TYPES.map(function (t) { return { code: t, description: '' }; });
  }
}

/** Admin: dapatkan semua jenis dokumen (aktif + non-aktif) untuk UI pengaturan. */
function getDocTypesSettings(sessionToken) {
  requireRole_(sessionToken, [ROLES.ADMIN]);
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENT_TYPES);
  if (!sheet) return { success: true, items: [] };
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, items: [] };
  const header = data[0];
  const idx = {};
  header.forEach((h, i) => idx[h] = i);
  const items = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[idx.TypeCode]) continue;
    const code = String(row[idx.TypeCode]).trim().toUpperCase();
    items.push({
      code: code,
      description: String(row[idx.TypeDescription] || '').trim(),
      active: row[idx.Active] === true || String(row[idx.Active]).toUpperCase() === 'TRUE',
      createdAt: row[idx.CreatedAt] ? new Date(row[idx.CreatedAt]).toISOString() : '',
      isDefault: DOC_TYPES.indexOf(code) !== -1
    });
  }
  return { success: true, items: items };
}

/** Admin: simpan (tambah / edit) jenis dokumen. */
function saveDocTypeFromUI(sessionToken, payload) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  payload = payload || {};
  const code = String(payload.code || '').trim().toUpperCase();
  const description = String(payload.description || '').trim();
  const oldCode = String(payload.oldCode || '').trim().toUpperCase();

  if (!code) return { success: false, message: 'Kode jenis dokumen wajib diisi.' };
  if (code.length > 10) return { success: false, message: 'Kode jenis dokumen maksimal 10 karakter.' };
  if (!/^[A-Z0-9\-_]+$/.test(code)) return { success: false, message: 'Kode hanya boleh huruf, angka, strip (-), underscore (_).' };
  if (description && description.length > 80) return { success: false, message: 'Deskripsi maksimal 80 karakter.' };

  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sibuk, coba lagi.' }; }
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.DOCUMENT_TYPES);
    if (!sheet) return { success: false, message: 'Sheet DocumentTypes belum dibuat. Jalankan initializeSystem() dulu.' };
    const data = sheet.getDataRange().getValues();
    const header = data[0];
    const idx = {};
    header.forEach((h, i) => idx[h] = i);

    // Cek duplikat kode
    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      const curr = String(data[i][idx.TypeCode] || '').trim().toUpperCase();
      if (oldCode && curr === oldCode) { foundRow = i + 1; continue; }
      if (curr === code && (!oldCode || oldCode !== code)) {
        return { success: false, message: 'Kode jenis dokumen "' + code + '" sudah ada.' };
      }
    }

    if (oldCode && foundRow !== -1) {
      // Edit
      sheet.getRange(foundRow, idx.TypeCode + 1, 1, 2).setValues([[code, description]]);
      logAudit_(actor, 'updateDocType', 'DocumentType', code, oldCode + ' → ' + code + (description ? ' (' + description + ')' : ''));
      return { success: true, message: 'Jenis dokumen "' + code + '" berhasil diperbarui.' };
    } else {
      // Tambah baru
      sheet.appendRow([code, description, true, new Date()]);
      logAudit_(actor, 'addDocType', 'DocumentType', code, code + (description ? ' — ' + description : ''));
      return { success: true, message: 'Jenis dokumen "' + code + '" berhasil ditambahkan.' };
    }
  } finally { lock.releaseLock(); }
}

/** Admin: non-aktifkan jenis dokumen (soft delete). */
function deleteDocTypeFromUI(sessionToken, code) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  const target = String(code || '').trim().toUpperCase();
  if (!target) return { success: false, message: 'Kode jenis dokumen tidak valid.' };
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return { success: false, message: 'Sistem sibuk.' }; }
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET.DOCUMENT_TYPES);
    if (!sheet) return { success: false, message: 'Sheet DocumentTypes belum dibuat.' };
    const data = sheet.getDataRange().getValues();
    const idx = {};
    data[0].forEach((h, i) => idx[h] = i);
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idx.TypeCode] || '').trim().toUpperCase() === target) {
        sheet.getRange(i + 1, idx.Active + 1).setValue(false);
        logAudit_(actor, 'deleteDocType', 'DocumentType', target, 'Dinonaktifkan');
        return { success: true, message: 'Jenis dokumen "' + target + '" dinonaktifkan.' };
      }
    }
    return { success: false, message: 'Jenis dokumen tidak ditemukan.' };
  } finally { lock.releaseLock(); }
}

/** Admin: aktifkan kembali jenis dokumen. */
function restoreDocTypeFromUI(sessionToken, code) {
  const actor = requireRole_(sessionToken, [ROLES.ADMIN]);
  const target = String(code || '').trim().toUpperCase();
  if (!target) return { success: false, message: 'Kode jenis dokumen tidak valid.' };
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET.DOCUMENT_TYPES);
  if (!sheet) return { success: false, message: 'Sheet DocumentTypes belum dibuat.' };
  const data = sheet.getDataRange().getValues();
  const idx = {};
  data[0].forEach((h, i) => idx[h] = i);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx.TypeCode] || '').trim().toUpperCase() === target) {
      sheet.getRange(i + 1, idx.Active + 1).setValue(true);
      logAudit_(actor, 'restoreDocType', 'DocumentType', target, 'Diaktifkan kembali');
      return { success: true, message: 'Jenis dokumen "' + target + '" diaktifkan kembali.' };
    }
  }
  return { success: false, message: 'Jenis dokumen tidak ditemukan.' };
}
/**
 * Helper untuk include file HTML partial di Apps Script.
 * Dipakai di Index.html dengan sintaks: <?!= include('Utils') ?>
 */

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITER & SECURITY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Rate limiter sederhana berbasis CacheService.
 * @param {string} identifier - ID unik (session token / IP)
 * @param {number} maxRequests - Maksimal request dalam window
 * @param {number} windowSeconds - Durasi window (detik)
 * @return {boolean} true jika masih boleh, false jika sudah limit
 */
function checkRateLimit_(identifier, maxRequests, windowSeconds) {
  try {
    var cache = CacheService.getScriptCache();
    var key = 'ratelimit_' + identifier;
    var current = parseInt(cache.get(key) || '0', 10);
    if (current >= maxRequests) {
      return false;
    }
    cache.put(key, String(current + 1), windowSeconds);
    return true;
  } catch (e) {
    Logger.log('Rate limit check failed: ' + e.message);
    return true; // Fail open agar app tetap jalan
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// API ROUTER — Dipanggil oleh doPost untuk request JSON dari Vercel
// ═══════════════════════════════════════════════════════════════════════════

function handleApiRequest_(body) {
  var action = String(body.action || '');
  var args = body.args || [];
  var sessionToken = body.sessionToken || '';

  var ALLOWED = [
    'addNFIType', 'addNewProjectFromUI', 'aiChat', 'aiGenerateNCR', 'aiScanCertificate', 'aiValidateMTR',
    'approveDocumentInApp', 'approveMultipleInApp', 'archiveDocument', 'createTransmittal', 'createUser',
    'deleteApprovalRule', 'deleteDisciplineFromUI', 'deleteDocTypeFromUI', 'deleteDocument',
    'deleteNFILogEntry', 'deleteNumberingRule', 'deleteProjectFromUI', 'deleteSiteReportEntry',
    'deleteSyncProjectFromUI', 'exportAIChat', 'exportDocumentListExcel', 'exportNFILogExcel',
    'generateMorningBriefing', 'generateReport', 'generateSiteInspectionReport', 'getAgingAnalysis', 'getApprovalHistory', 'getApprovalRules',
    'getApproverCandidates', 'getArchivedDocuments', 'getBacklogData', 'getBreakdownByDiscipline',
    'getCalibrationSummary', 'getCalibrationTools', 'getDashboardStats', 'getDisciplinesSettings',
    'getDocTypesSettings', 'getDocumentAccessLog', 'getDocumentDetail', 'getDocumentList',
    'getDrillDownData', 'getEnhancedDashboardStats', 'getExecutiveDashboard', 'getExistingDocumentsForRevision',
    'getFilePreviewInfo', 'getInitData', 'getMyNotifications', 'getMyTasks',
    'getNFIChartData', 'getNFIImportTemplate', 'getNFILogList', 'getNFISettings',
    'getNumberingRules', 'getPendingApprovals', 'getProjectDetailFromMaster', 'getProjectOverview', 'getProjectsListForUI',
    'getProjectsSettings', 'getRecentAuditLog', 'getRecycleBinItems', 'getRevisionHistory',
    'getSessionUser', 'getSiteReportEntries', 'getStatusCounts', 'getTransmittalDetail',
    'getTransmittals', 'getTrendData', 'getUserList', 'importNFILogFromData',
    'login', 'logout', 'markAllNotificationsRead', 'markNotificationRead',
    'permanentlyDeleteDocument', 'permanentlyDeleteNFIEntry', 'previewNFIImport', 'registerAccount',
    'rejectDocumentInApp', 'removeNFIType', 'requestPasswordReset', 'restoreDisciplineFromUI',
    'restoreDocTypeFromUI', 'restoreDocumentFromBin', 'restoreFromArchive', 'restoreNFIEntryFromBin',
    'restoreProjectFromUI', 'rollbackToRevision', 'runSyncAll', 'saveApprovalRule',
    'saveDisciplineFromUI', 'saveDocTypeFromUI', 'saveNFIAlertDays', 'saveNFILogEntry',
    'saveNumberingRule', 'saveProjectFromUI', 'setupHourlyTrigger', 'submitCalibration', 'deleteCalibrationTool', 'addCalibrationTool', 'importCalibrationTools',
    'syncAllToolsFromListDiscipline',
    'uploadCalibrationCertificate',
    'getNcrData', 'getNcrSummary', 'submitNcr', 'uploadNcrDocument', 'submitDocument',
    'submitSiteReportEntry', 'testSpreadsheetAccess', 'updateDocumentMetadata', 'updateProjectDetails',
    'updateProjectStatus', 'updateUser', 'getSyncTriggerStatus', 'deleteHourlyTrigger', 'cleanupDuplicateDocumentsInMaster'
  ];

  if (ALLOWED.indexOf(action) === -1) {
    return jsonResponse_({ success: false, message: 'Action tidak diizinkan: ' + action });
  }

  // Rate limiting — maks 60 request/menit per session, 120/menit global
  var rateLimitKey = sessionToken || 'anon_' + (body._clientId || 'global');
  if (!checkRateLimit_(rateLimitKey, 60, 60)) {
    return jsonResponse_({ success: false, message: 'Terlalu banyak permintaan. Coba lagi sebentar.' });
  }

  try {
    var fn = this[action] || (typeof globalThis !== 'undefined' ? globalThis[action] : null);
    if (typeof fn !== 'function') {
      return jsonResponse_({ success: false, message: 'Function tidak ditemukan: ' + action });
    }
    
    var result;
    if (action === 'login' || action === 'registerAccount' || action === 'requestPasswordReset' || (args.length > 0 && args[0] === sessionToken)) {
      result = fn.apply(null, args);
    } else if (sessionToken && fn.length > args.length) {
      result = fn.apply(null, [sessionToken].concat(args));
    } else {
      result = fn.apply(null, args);
    }
    
    return jsonResponse_(result);
  } catch (err) {
    return jsonResponse_({ success: false, message: err.message || 'Error di server' });
  }
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════
// 👁️ IN-BROWSER DOCUMENT PREVIEW API
// ═══════════════════════════════════════════════════════════════
var PREVIEW_CFG = typeof PREVIEW_CFG !== 'undefined' ? PREVIEW_CFG : {
  BROWSER_NATIVE: [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
    'text/plain', 'text/csv'
  ],
  GOOGLE_VIEWER: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
};

function getFilePreviewInfo(sessionToken, fileUrl) {
  try {
    const user = requireSession_(sessionToken);
    if (!user) return { success: false, message: 'Sesi Anda telah berakhir.' };

    const fileId = extractDriveId_(fileUrl);
    if (!fileId) return { success: false, message: 'URL file tidak valid.' };

    let file;
    try {
      file = DriveApp.getFileById(fileId);
    } catch (e) {
      return { success: false, message: 'File tidak ditemukan di Google Drive atau tidak dapat diakses.' };
    }

    // Pastikan hak akses file terbuka agar bisa dipreview
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) { /* abaikan jika domain Google Workspace membatasi */ }

    const fileName = file.getName();
    const mimeType = file.getMimeType();
    let mode = 'native';
    let previewUrl = 'https://drive.google.com/file/d/' + fileId + '/preview';

    // Catat log akses dokumen
    try {
      if (typeof logDocumentAccess_ === 'function') {
        logDocumentAccess_(user, fileId, '', 'preview', fileName);
      }
    } catch (e) { /* abaikan */ }

    return {
      success: true,
      fileId: fileId,
      mode: mode,
      previewUrl: previewUrl,
      fileName: fileName,
      mimeType: mimeType,
      downloadUrl: file.getUrl(),
      directDownloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}


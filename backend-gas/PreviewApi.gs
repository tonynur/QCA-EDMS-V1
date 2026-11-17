/**
 * ============================================================================
 * QC-CMS EDMS — Preview In-Browser
 * Fitur: Preview file (PDF, gambar, Word, Excel) langsung di browser
 *        tanpa perlu download.
 * 
 * File ini terpisah dari Kode.gs — tidak mengubah kode lama.
 * ============================================================================
 */

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

/**
 * Ambil informasi preview untuk sebuah file.
 * Return: { success, mode, previewUrl, fileName, mimeType, downloadUrl }
 *   - mode = 'native'        → preview langsung (PDF, gambar, text)
 *   - mode = 'google-viewer' → preview via Google Docs (Word, Excel, PPT)
 *   - mode = 'download'      → tidak bisa di-preview (mis. DWG), fallback download
 */
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
      return { success: false, message: 'File tidak ditemukan atau tidak bisa diakses.' };
    }

    // Pastikan hak akses file terbuka agar bisa dipreview
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) { /* abaikan jika domain Google Workspace membatasi */ }

    const fileName = file.getName();
    const mimeType = file.getMimeType();
    let mode = 'native';
    let previewUrl = 'https://drive.google.com/file/d/' + fileId + '/preview';

    // Catat aktivitas preview (opsional — pakai logger existing kalau ada)
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
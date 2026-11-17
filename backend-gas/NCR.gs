/**
 * MODUL MONITORING NON CONFORMANCE RECORD (NCR)
 * PT Asuka Engineering Indonesia
 * Form Reference: [FR-IMS-QCA-007]
 */

// Spreadsheet ID Khusus NCR Register All_Project
var NCR_SS_ID = '1z_Dkh8zx-GeKDvjJAUUt_qhEO_HmEHYsosZEEcgpLS0';
var NCR_SHEET_NAME = 'NCR Register All_Project';
var NCR_SHEET_GID = 371322571;

// Root Folder Google Drive target: "qca edms v3"
var NCR_DRIVE_ROOT_FOLDER_ID = '1YTHEh_eyyLx45G0-nCVNWgXoNreA9Y81';

// Helper ambil spreadsheet NCR
function getNcrSS_() {
  if (NCR_SS_ID) {
    try {
      return SpreadsheetApp.openById(NCR_SS_ID);
    } catch (e) {
      Logger.log('getNcrSS_ openById gagal: ' + e.message);
    }
  }
  return typeof getSS_ === 'function' ? getSS_() : SpreadsheetApp.getActiveSpreadsheet();
}

// Helper ambil folder root Google Drive target "qca edms v3"
function getNcrDriveRootFolder_() {
  var rootId = typeof NCR_DRIVE_ROOT_FOLDER_ID !== 'undefined' && NCR_DRIVE_ROOT_FOLDER_ID ? NCR_DRIVE_ROOT_FOLDER_ID : '1YTHEh_eyyLx45G0-nCVNWgXoNreA9Y81';
  try {
    var targetFolder = DriveApp.getFolderById(rootId);
    if (targetFolder) {
      Logger.log('Root folder qca edms v3 ditemukan: ' + targetFolder.getName());
      return targetFolder;
    }
  } catch (e) {
    Logger.log('Gagal getFolderById(' + rootId + '): ' + e.message);
  }

  // Fallback cari berdasarkan nama folder
  try {
    var it = DriveApp.getFoldersByName('qca edms v3');
    if (it.hasNext()) return it.next();
  } catch (e2) {}

  return DriveApp.getRootFolder();
}

// Helper susun struktur subfolder bertingkat di Google Drive
function getOrCreateNcrFolderHierarchy_(rootFolder, folderNames) {
  var current = rootFolder;
  for (var i = 0; i < folderNames.length; i++) {
    var rawName = String(folderNames[i] || 'Umum').trim();
    var safeName = rawName.replace(/[\/\\:*?"<>|]/g, '_').trim() || 'Umum';
    var it = current.getFoldersByName(safeName);
    current = it.hasNext() ? it.next() : current.createFolder(safeName);
  }
  return current;
}

// 1. Ambil Data Register NCR (Mulai Baris 21 Header, Data Baris 22 ke bawah)
function getNcrData() {
  try {
    var ss = getNcrSS_();
    var sheet = ss.getSheetByName(NCR_SHEET_NAME);
    if (!sheet) {
      // Fallback cari sheet yang ada kata "NCR" atau sheet pertama
      var sheets = ss.getSheets();
      for (var s = 0; s < sheets.length; s++) {
        if (/NCR/i.test(sheets[s].getName())) {
          sheet = sheets[s];
          break;
        }
      }
      if (!sheet) sheet = sheets[0];
    }

    if (!sheet) {
      return { success: false, error: 'Sheet "' + NCR_SHEET_NAME + '" tidak ditemukan.' };
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 21) {
      return { success: true, data: [], total: 0 };
    }

    var numRows = lastRow - 20; // Dari baris 21 sampai baris terakhir
    var rawValues = sheet.getRange(21, 1, numRows, 20).getDisplayValues();

    // Headers standar kolom
    var headers = [
      'No',               // 0
      'NCR No',           // 1
      'NCR Project',      // 2
      'Discipline',       // 3
      'Project',          // 4
      'Area',             // 5
      'Description',      // 6
      'Issued Date',      // 7
      'Responsible Person',// 8
      'Due Date',         // 9
      'Closed Date',      // 10
      'Status',           // 11
      'Days Remaining',   // 12
      'Remarks',          // 13
      'Register AEI NCR', // 14
      'Row Index',        // 15
      'Doc Link'          // 16
    ];

    var result = [headers];
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    for (var i = 1; i < rawValues.length; i++) {
      var row = rawValues[i];
      var noVal = String(row[1] || '').trim();
      var ncrNo = String(row[2] || '').trim();
      var ncrProj = String(row[3] || '').trim();
      var disc = String(row[4] || 'General').trim();
      var proj = String(row[5] || '').trim();
      var area = String(row[6] || '').trim();
      var desc = String(row[7] || '').trim();
      var issuedDate = String(row[8] || '').trim();
      var pic = String(row[9] || '').trim();
      var dueDate = String(row[10] || '').trim();
      var closedDate = String(row[11] || '').trim();
      var rawStatus = String(row[12] || '').toUpperCase().trim();
      var daysRemaining = String(row[13] || '').trim();
      var remarks = String(row[14] || '').trim();
      var docLink = String(row[15] || '').trim();
      var regAei = String(row[19] || '').trim();

      // Cari link berkas jika ada di kolom lain / remarks
      if (!docLink) {
        for (var c = 12; c < row.length; c++) {
          var cv = String(row[c] || '').trim();
          if (/https?:\/\/(?:drive|docs)\.google\.com/i.test(cv)) {
            docLink = cv;
            break;
          }
        }
      }

      var numVal = parseInt(noVal, 10);
      var hasContent = Boolean(ncrNo || desc || proj || ncrProj || pic || closedDate || (remarks && remarks !== '-'));

      // Lewati baris jika tidak ada identitas sama sekali
      if (!ncrNo && !noVal && !desc) continue;

      // ELIMINASI ROW PHANTOM (29-50):
      // Sesuai permintaan user: "kan harus e sampai 28 terakir karna ncr 29 masih belum ada untuk saat ini"
      if (!hasContent) {
        // Jika tidak ada isi deskripsi/proyek, dan nomor > 28 atau tidak valid -> lewati!
        if (isNaN(numVal) || numVal > 28 || numVal < 1) {
          continue;
        }
      } else {
        // Jika nomor urut > 28 dan tidak memiliki nomor NCR dan tidak ada deskripsi -> lewati
        if (numVal > 28 && !ncrNo && !desc && !proj) {
          continue;
        }
      }

      // Pastikan format nomor NCR
      if (!ncrNo && numVal > 0) {
        ncrNo = 'NCR-QCA-AEI-' + String(numVal).padStart(4, '0');
      }

      // Normalisasi status
      var status = 'OPEN';
      if (rawStatus.indexOf('CLOSED') !== -1 || rawStatus.indexOf('SELESAI') !== -1 || closedDate) {
        status = 'CLOSED';
      } else if (rawStatus.indexOf('OVERDUE') !== -1 || rawStatus.indexOf('EXPIRED') !== -1) {
        status = 'OVERDUE';
      } else {
        if (dueDate) {
          var parsedDue = new Date(dueDate);
          if (!isNaN(parsedDue.getTime()) && parsedDue < today) {
            status = 'OVERDUE';
          }
        }
      }

      result.push([
        noVal || String(i),
        ncrNo,
        ncrProj,
        disc,
        proj,
        area,
        desc,
        issuedDate,
        pic,
        dueDate,
        closedDate,
        status,
        daysRemaining,
        remarks,
        regAei,
        (21 + i),
        docLink
      ]);
    }

    return {
      success: true,
      data: result,
      total: result.length - 1,
      source: sheet.getName()
    };
  } catch (e) {
    Logger.log('getNcrData error: ' + e.message);
    return { success: false, error: e.toString() };
  }
}

// 2. Ringkasan KPI & Data Grafik Monitoring NCR
function getNcrSummary() {
  try {
    var res = getNcrData();
    if (!res.success) return res;
    var data = res.data;

    var total = 0, closed = 0, open = 0, overdue = 0;
    var byDiscipline = {};
    var byProject = {};

    for (var i = 1; i < data.length; i++) {
      total++;
      var st = String(data[i][11] || 'OPEN').toUpperCase().trim();
      var disc = String(data[i][3] || 'General').trim() || 'General';
      var proj = String(data[i][4] || 'Lainnya').trim() || 'Lainnya';

      if (st === 'CLOSED') {
        closed++;
      } else if (st === 'OVERDUE') {
        overdue++;
      } else {
        open++;
      }

      // Distribusi per Disiplin
      if (!byDiscipline[disc]) {
        byDiscipline[disc] = { total: 0, closed: 0, open: 0, overdue: 0 };
      }
      byDiscipline[disc].total++;
      if (st === 'CLOSED') byDiscipline[disc].closed++;
      else if (st === 'OVERDUE') byDiscipline[disc].overdue++;
      else byDiscipline[disc].open++;

      // Distribusi per Proyek
      if (!byProject[proj]) {
        byProject[proj] = { total: 0, closed: 0, open: 0, overdue: 0 };
      }
      byProject[proj].total++;
      if (st === 'CLOSED') byProject[proj].closed++;
      else if (st === 'OVERDUE') byProject[proj].overdue++;
      else byProject[proj].open++;
    }

    return {
      success: true,
      total: total,
      closed: closed,
      open: open,
      overdue: overdue,
      byDiscipline: byDiscipline,
      byProject: byProject
    };
  } catch (e) {
    Logger.log('getNcrSummary error: ' + e.message);
    return { success: false, error: e.toString() };
  }
}

// 3. Tambah, Update, atau Hapus Data NCR
function submitNcr(formData) {
  try {
    var ss = getNcrSS_();
    var sheet = ss.getSheetByName(NCR_SHEET_NAME);
    if (!sheet) return { success: false, error: 'Sheet "' + NCR_SHEET_NAME + '" tidak ditemukan.' };

    var ncrNo = String((formData && formData.ncrNo) || '').trim();
    var isDelete = formData && (formData.isDelete || formData.action === 'delete');

    var lastRow = sheet.getLastRow();
    var rawValues = lastRow >= 21 ? sheet.getRange(21, 1, lastRow - 20, 20).getDisplayValues() : [];

    // Cari baris jika update / delete
    var targetRow = -1;
    for (var i = 1; i < rawValues.length; i++) {
      if (String(rawValues[i][2] || '').trim() === ncrNo) {
        targetRow = 21 + i;
        break;
      }
    }

    // A. AKSI HAPUS (DELETE)
    if (isDelete) {
      if (targetRow !== -1) {
        sheet.deleteRow(targetRow);
        return { success: true, message: 'Data ' + ncrNo + ' berhasil dihapus dari register NCR.' };
      }
      return { success: false, error: 'NCR No ' + ncrNo + ' tidak ditemukan untuk dihapus.' };
    }

    // Jika ada lampiran berkas langsung dalam form submit
    var docLink = String((formData && (formData.docLink || formData.fileUrl)) || '').trim();
    if (formData && formData.fileBase64 && !docLink) {
      var uploadRes = uploadNcrDocument({
        ncrNo: ncrNo,
        project: formData.project,
        discipline: formData.discipline,
        fileName: formData.fileName || (ncrNo + '_Dokumen.pdf'),
        fileBase64: formData.fileBase64,
        mimeType: formData.mimeType || 'application/pdf'
      });
      if (uploadRes && uploadRes.success) {
        docLink = uploadRes.fileUrl;
      }
    }

    // B. AKSI TAMBAH ATAU UPDATE
    var noVal = formData.no || (targetRow !== -1 ? rawValues[targetRow - 21][1] : String(rawValues.length));
    var ncrProj = formData.ncrProject || '';
    var disc = formData.discipline || 'Civil/Architecture';
    var proj = formData.project || '';
    var area = formData.area || '';
    var desc = formData.description || '';
    var issuedDate = formData.issuedDate || Utilities.formatDate(new Date(), 'GMT+7', 'd MMM yyyy');
    var pic = formData.pic || '';
    var dueDate = formData.dueDate || '';
    var closedDate = formData.closedDate || '';
    var status = formData.status || (closedDate ? 'CLOSED' : 'OPEN');
    var remarks = formData.remarks || '';
    var regAei = formData.regAei || '';

    // Hitung sisa hari jika belum closed
    var daysRemaining = '';
    if (status === 'CLOSED') {
      daysRemaining = '0';
    } else if (dueDate) {
      var dDue = new Date(dueDate);
      var dToday = new Date();
      if (!isNaN(dDue.getTime())) {
        var diffTime = dDue.getTime() - dToday.getTime();
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysRemaining = String(diffDays);
      }
    }

    if (targetRow !== -1) {
      // UPDATE DATA LAMA (Kolom B s/d O adalah 2 s/d 15)
      sheet.getRange(targetRow, 2, 1, 14).setValues([[
        noVal,
        ncrNo,
        ncrProj,
        disc,
        proj,
        area,
        desc,
        issuedDate,
        pic,
        dueDate,
        closedDate,
        status,
        daysRemaining,
        remarks
      ]]);
      if (docLink) {
        sheet.getRange(targetRow, 16).setValue(docLink);
      }
      if (regAei) {
        sheet.getRange(targetRow, 20).setValue(regAei);
      }
      return { success: true, message: 'Data NCR ' + ncrNo + ' berhasil diperbarui!' };
    } else {
      // TAMBAH DATA BARU DI BARIS TERAKHIR
      if (!ncrNo) {
        var nextSeq = rawValues.length;
        ncrNo = 'NCR-QCA-AEI-' + String(nextSeq).padStart(4, '0');
        noVal = String(nextSeq);
      }

      var newRow = new Array(20).fill('');
      newRow[1] = noVal;
      newRow[2] = ncrNo;
      newRow[3] = ncrProj;
      newRow[4] = disc;
      newRow[5] = proj;
      newRow[6] = area;
      newRow[7] = desc;
      newRow[8] = issuedDate;
      newRow[9] = pic;
      newRow[10] = dueDate;
      newRow[11] = closedDate;
      newRow[12] = status;
      newRow[13] = daysRemaining;
      newRow[14] = remarks;
      newRow[15] = docLink; // Kolom P (16)
      newRow[19] = regAei;

      sheet.appendRow(newRow);
      return { success: true, message: 'NCR baru ' + ncrNo + ' berhasil ditambahkan!' };
    }
  } catch (e) {
    Logger.log('submitNcr error: ' + e.message);
    return { success: false, error: e.toString() };
  }
}

// 4. Upload Dokumen NCR ke Google Drive (qca edms v3) & Simpan Link ke Spreadsheet
function uploadNcrDocument(payload) {
  try {
    if (!payload || !payload.fileBase64) {
      return { success: false, error: 'Data berkas dokumen NCR tidak ditemukan.' };
    }

    var ncrNo = String(payload.ncrNo || '').trim();
    var project = String(payload.project || 'Umum').trim();
    var discipline = String(payload.discipline || 'General').trim();
    var fileName = String(payload.fileName || (ncrNo ? (ncrNo + '_Dokumen.pdf') : 'Dokumen_NCR.pdf')).trim();
    var mimeType = payload.mimeType || 'application/pdf';

    // 1. Susun struktur folder di Google Drive:
    // Target: "qca edms v3" / Dokumen NCR / [Nama Proyek] / [Disiplin]
    var rootFolder = getNcrDriveRootFolder_();
    var targetFolder = getOrCreateNcrFolderHierarchy_(rootFolder, ['Dokumen NCR', project, discipline]);

    // 2. Decode file base64
    var rawData = payload.fileBase64;
    if (rawData.indexOf(',') !== -1) {
      rawData = rawData.split(',')[1];
    }
    var bytes = Utilities.base64Decode(rawData);
    var blob = Utilities.newBlob(bytes, mimeType, fileName);

    // 3. Simpan berkas di folder Google Drive
    var driveFile = targetFolder.createFile(blob);
    try {
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (eShare) {}

    var fileUrl = driveFile.getUrl();
    var fileId = driveFile.getId();
    var previewUrl = 'https://drive.google.com/file/d/' + fileId + '/preview';
    var downloadUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;

    // 4. Perbarui link dokumen di Spreadsheet master
    if (ncrNo) {
      updateNcrDocLinkInSpreadsheet_(ncrNo, fileUrl, fileId);
    }

    return {
      success: true,
      message: 'Dokumen ' + fileName + ' berhasil disimpan di folder Google Drive!',
      fileUrl: fileUrl,
      previewUrl: previewUrl,
      downloadUrl: downloadUrl,
      fileId: fileId,
      folderName: targetFolder.getName()
    };
  } catch (e) {
    Logger.log('uploadNcrDocument error: ' + e.message);
    return { success: false, error: e.toString() };
  }
}

// Helper: Perbarui Kolom Link Dokumen di Spreadsheet
function updateNcrDocLinkInSpreadsheet_(ncrNo, fileUrl, fileId) {
  try {
    var ss = getNcrSS_();
    var sheet = ss.getSheetByName(NCR_SHEET_NAME);
    if (!sheet) return;

    var lastRow = sheet.getLastRow();
    if (lastRow < 22) return;

    var values = sheet.getRange(22, 1, lastRow - 21, 20).getDisplayValues();
    var ncrNoClean = String(ncrNo || '').toLowerCase().trim();

    for (var i = 0; i < values.length; i++) {
      var rowNcrNo = String(values[i][2] || '').toLowerCase().trim();
      var rowNo = String(values[i][1] || '').trim();
      if (rowNcrNo === ncrNoClean || ('ncr-qca-aei-' + String(rowNo).padStart(4, '0')) === ncrNoClean) {
        var r = 22 + i;
        // Kolom P (kolom 16) untuk Link Dokumen
        sheet.getRange(r, 16).setValue(fileUrl);
        // Jika Remarks (kolom O / 15) masih kosong, beri keterangan
        var curRemarks = String(values[i][14] || '').trim();
        if (!curRemarks) {
          sheet.getRange(r, 15).setValue('Dokumen terlampir di Google Drive');
        }
        break;
      }
    }
  } catch (e) {
    Logger.log('updateNcrDocLinkInSpreadsheet_ error: ' + e.message);
  }
}

/**
 * MODUL CALIBRATION MONITORING
 * Terpisah dari Kode.gs utama — PT Asuka Engineering Indonesia
 */

// ID Spreadsheet QC-CMS
var CAL_SS_ID = '1yxVKQiUbKZnj8nY5foo6MHy6vcZS0bmDNY2UdW7Qo4Q';

// ID Folder Root Google Drive: qca edms v3 (MANDATORI)
var CAL_DRIVE_ROOT_FOLDER_ID = '1YTHEh_eyyLx45G0-nCVNWgXoNreA9Y81';

var SHEET_CAL_TOOLS = 'Calibration_Tools';
var SHEET_CAL_DISCIPLINE = 'LIST CALIBRATION PER DISCIPLINE';
var SHEET_CAL_LOG   = 'Calibration_Log';

// Helper ambil spreadsheet (dengan fallback aman ke spreadsheet aktif/utama)
function getCalSS_() {
  if (typeof CAL_SS_ID !== 'undefined' && CAL_SS_ID) {
    try {
      return SpreadsheetApp.openById(CAL_SS_ID);
    } catch (e) {
      Logger.log('CAL_SS_ID openById gagal, mencoba spreadsheet utama: ' + e.message);
    }
  }
  return typeof getSS_ === 'function' ? getSS_() : SpreadsheetApp.getActiveSpreadsheet();
}

// 1. Ambil Data Alat (Mendukung auto-detect tab LIST CALIBRATION PER DISCIPLINE & Calibration_Tools)
function getCalibrationTools() {
  try {
    var ss = getCalSS_();
    var sheetNameDisc = typeof SHEET_CAL_DISCIPLINE !== 'undefined' ? SHEET_CAL_DISCIPLINE : 'LIST CALIBRATION PER DISCIPLINE';
    var sheetNameTools = typeof SHEET_CAL_TOOLS !== 'undefined' ? SHEET_CAL_TOOLS : 'Calibration_Tools';

    // Prioritas 1: Baca langsung dari tab LIST CALIBRATION PER DISCIPLINE (Database asli Pak Tony: 335+ alat)
    var sheetDisc = ss.getSheetByName(sheetNameDisc);
    if (sheetDisc && sheetDisc.getLastRow() > 3) {
      var rawValues = sheetDisc.getDataRange().getDisplayValues();
      var parsed = parseDisciplineSheetData_(rawValues);
      if (parsed && parsed.length > 2) {
        return { success: true, data: parsed, source: sheetNameDisc, total: parsed.length - 1 };
      }
    }

    // Prioritas 2: Baca dari sheet Calibration_Tools jika ada
    var sheetTools = ss.getSheetByName(sheetNameTools);
    if (sheetTools) {
      var data = sheetTools.getDataRange().getDisplayValues();
      if (data && data.length > 1) {
        return { success: true, data: data, source: sheetNameTools, total: data.length - 1 };
      }
    }

    return { success: false, error: 'Sheet kalibrasi tidak ditemukan di spreadsheet.' };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Helper normalisasi nama disiplin ke 4 pilar teknis PT Asuka Engineering Indonesia
function normalizeDisciplineName_(d) {
  var s = String(d || '').trim();
  if (/electric|avometer|megger|multimeter|insulation|clamp|earth|sensor|phase|signal|decade|power supply/i.test(s)) return 'Electrical';
  if (/mechanical|piping|torque|pressure|gauge|hi-lo|weld|dial|anemometer|caliper|micrometer|taper|recorder|laser|yoke|valve|manometer|oven/i.test(s)) return 'Mechanical & Piping';
  if (/civil|architecture|total station|auto level|hammer|theodolite|prisma|waterpass|rambu|tripod|proving ring/i.test(s)) return 'Civil & Architecture';
  if (/coating|painting|film|dew|blasting/i.test(s)) return 'Coating & Painting';
  return s || 'General';
}

// Parser cerdas untuk tab LIST CALIBRATION PER DISCIPLINE (17 kolom dengan header per disiplin)
function parseDisciplineSheetData_(rawValues) {
  var headers = [
    'Tool ID',        // 0
    'Nama Alat',      // 1
    'Disiplin',       // 2
    'Tgl Kalibrasi',  // 3
    'Tgl Berikutnya', // 4
    'Status',         // 5
    'PIC',            // 6
    'Link Sertifikat',// 7
    'No Sertifikat',  // 8
    'Vendor',         // 9
    'Manufacture',    // 10
    'Serial Number'   // 11
  ];
  var result = [headers];

  var currentDiscipline = 'General';
  var currentCategory = '';

  for (var i = 2; i < rawValues.length; i++) {
    var row = rawValues[i];
    if (!row || !row.length) continue;

    var noCol = String(row[0] || '').trim();
    var nameCol = String(row[1] || '').trim();

    // Header Disiplin Utama (contoh: ELECTRICAL, MECHANICAL & PIPING, COATING & PAINTING)
    if (noCol && isNaN(parseInt(noCol))) {
      var isHeader = true;
      for (var k = 1; k < 10; k++) {
        if (row[k] && String(row[k]).trim()) { isHeader = false; break; }
      }
      if (isHeader) {
        if (/ELECTRICAL/i.test(noCol)) {
          currentDiscipline = 'Electrical';
        } else if (/MECHANICAL|PIPING/i.test(noCol)) {
          currentDiscipline = 'Mechanical & Piping';
        } else if (/COATING|PAINTING/i.test(noCol)) {
          currentDiscipline = 'Coating & Painting';
        } else if (/CIVIL|ARCHITECTURE/i.test(noCol)) {
          currentDiscipline = 'Civil & Architecture';
        } else {
          currentCategory = noCol;
        }
        continue;
      }
    }

    // Subkategori / Baris judul kelompok alat (contoh: MULTIMETER, PRESSURE GAUGE)
    if (noCol && isNaN(parseInt(noCol)) && !row[5] && !row[6]) {
      currentCategory = noCol;
      continue;
    }

    // Baris data alat ukur bernomor
    var num = parseInt(noCol);
    if (!isNaN(num) && (row[1] || row[3])) {
      var rawName = String(row[1] || currentCategory || 'Alat Ukur').trim();
      var spec = String(row[2] || '').trim();
      var serialNo = String(row[3] || '').trim();
      var mfg = String(row[4] || '').trim();
      var calDate = String(row[5] || '').trim();
      var expDate = String(row[6] || '').trim();
      var duration = String(row[7] || '').trim();
      var certNo = String(row[8] || '').trim();
      var vendor = String(row[9] || '').trim();
      var rawStatus = String(row[10] || '').toUpperCase().trim();
      var toolType = String(row[11] || '').trim();
      var proj = String(row[12] || '').trim();
      var loc = String(row[13] || '').trim();
      var linkCert = String(row[15] || '').trim();

      // 1. Tool ID: Prefer Serial Number, fallback ke Certificate No, fallback ke Auto-ID
      var toolId = serialNo;
      if (!toolId || toolId === '-' || toolId.toLowerCase() === 'n/a') {
        toolId = (certNo && certNo !== '-' && certNo.toLowerCase() !== 'n/a') ? certNo : (currentDiscipline.substring(0,3).toUpperCase() + '-' + String(num).padStart(3, '0'));
      }

      // 2. Format Nama Alat Lengkap: Name (Manufacture - Type) [Specification]
      var fullDisplayName = rawName;
      var extras = [];
      if (mfg && mfg !== '-' && mfg.toLowerCase() !== 'n/a') extras.push(mfg);
      if (toolType && toolType !== '-' && toolType.toLowerCase() !== 'n/a') extras.push(toolType);
      if (extras.length) fullDisplayName += ' (' + extras.join(' - ') + ')';
      if (spec && spec !== '-' && spec.toLowerCase() !== 'n/a') fullDisplayName += ' [' + spec + ']';

      // 3. Normalisasi Status Asli Spreadsheet
      var rawUpper = rawStatus.toUpperCase().trim();
      var status = 'VALID';
      if (rawUpper.indexOf('NOT VALID') !== -1 || rawUpper.indexOf('EXPIRED') !== -1 || rawUpper.indexOf('OVERDUE') !== -1) {
        status = 'NOT VALID';
      } else if (rawUpper.indexOf('NOT VERIFIED') !== -1 || rawUpper.indexOf('DALAM PROSES') !== -1 || rawUpper.indexOf('PROCESS') !== -1) {
        status = 'NOT VERIFIED';
      } else if (rawUpper.indexOf('NOT REQUIRED') !== -1) {
        status = 'NOT REQUIRED';
      } else if (rawUpper.indexOf('VALID') !== -1) {
        status = 'VALID';
      } else {
        status = rawUpper || 'VALID';
      }

      // 4. PIC / Lokasi / Proyek
      var picText = proj;
      if (loc && loc !== '-' && loc.toLowerCase() !== 'n/a') {
        picText = picText ? (picText + ' (' + loc + ')') : loc;
      }
      if (!picText) picText = vendor || '-';

      var cleanDiscipline = normalizeDisciplineName_(currentDiscipline);

      result.push([
        toolId,
        fullDisplayName,
        cleanDiscipline,
        calDate,
        expDate,
        status,
        picText,
        linkCert,
        certNo,
        vendor,
        mfg,
        serialNo
      ]);
    }
  }

  return result;
}

// 2. Manajemen Folder & Upload Sertifikat ke Google Drive
function getOrCreateFolderHierarchy_(rootFolder, folderNames) {
  var current = rootFolder;
  for (var i = 0; i < folderNames.length; i++) {
    var rawName = String(folderNames[i] || 'Umum').trim();
    var safeName = rawName.replace(/[\/\\:*?"<>|]/g, '_').trim() || 'Umum';
    var it = current.getFoldersByName(safeName);
    current = it.hasNext() ? it.next() : current.createFolder(safeName);
  }
  return current;
}

function getCalibrationDriveRootFolder_() {
  var rootId = typeof CAL_DRIVE_ROOT_FOLDER_ID !== 'undefined' && CAL_DRIVE_ROOT_FOLDER_ID ? CAL_DRIVE_ROOT_FOLDER_ID : '1YTHEh_eyyLx45G0-nCVNWgXoNreA9Y81';
  try {
    var targetFolder = DriveApp.getFolderById(rootId);
    if (targetFolder) {
      Logger.log('Root folder qca edms v3 ditemukan: ' + targetFolder.getName());
      return targetFolder;
    }
  } catch (e) {
    Logger.log('Gagal getFolderById(' + rootId + '): ' + e.message);
  }

  // Fallback pencarian folder berdasarkan nama
  try {
    var it = DriveApp.getFoldersByName('qca edms v3');
    if (it.hasNext()) return it.next();
  } catch (e2) {}

  return DriveApp.getRootFolder();
}

// Upload Sertifikat Kalibrasi ke Google Drive & Simpan ke Spreadsheet
function uploadCalibrationCertificate(payload) {
  try {
    if (!payload || !payload.fileBase64) {
      return { success: false, error: 'Data berkas sertifikat tidak ditemukan.' };
    }

    var toolId = String(payload.toolId || '').trim();
    var toolName = String(payload.toolName || 'Alat Ukur').trim();
    var discipline = String(payload.discipline || 'Umum').trim();
    var certNo = String(payload.certNo || '').trim();
    var fileName = String(payload.fileName || (toolId + '_Certificate.pdf')).trim();
    var mimeType = payload.mimeType || 'application/pdf';

    // 1. Buat folder terorganisir di Google Drive:
    // Calibration Certificate / [Disiplin] / [Nama Alat]
    var rootFolder = getCalibrationDriveRootFolder_();
    // Susun hierarki folder: qca edms v3 / Sertifikat Kalibrasi / [Disiplin] / [Kategori Alat]
    var targetFolder = getOrCreateFolderHierarchy_(rootFolder, ['Sertifikat Kalibrasi', discipline, toolName]);

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

    // 4. Perbarui link sertifikat di Spreadsheet (Tab LIST CALIBRATION & Calibration_Tools)
    updateCertLinkInSpreadsheets_(toolId, fileUrl, fileId, certNo);

    return {
      success: true,
      message: 'Sertifikat alat ' + toolId + ' berhasil diunggah ke Google Drive!',
      fileUrl: fileUrl,
      previewUrl: previewUrl,
      downloadUrl: downloadUrl,
      fileId: fileId,
      folderName: targetFolder.getName()
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Helper: Simpan link sertifikat ke Spreadsheet
function updateCertLinkInSpreadsheets_(toolId, fileUrl, fileId, certNo) {
  try {
    var ss = getCalSS_();
    var sheetNameDisc = typeof SHEET_CAL_DISCIPLINE !== 'undefined' ? SHEET_CAL_DISCIPLINE : 'LIST CALIBRATION PER DISCIPLINE';
    var sheetDisc = ss.getSheetByName(sheetNameDisc);
    var toolIdClean = String(toolId || '').toLowerCase().trim();
    var certNoClean = String(certNo || '').toLowerCase().trim();

    if (sheetDisc) {
      var dataDisc = sheetDisc.getDataRange().getDisplayValues();
      for (var i = 2; i < dataDisc.length; i++) {
        var sNo = String(dataDisc[i][3] || '').toLowerCase().trim();
        var cNo = String(dataDisc[i][8] || '').toLowerCase().trim();
        var photoName = String(dataDisc[i][14] || '').toLowerCase().trim();
        var matched = false;

        if (toolIdClean) {
          if (sNo === toolIdClean) matched = true;
          else if (cNo === toolIdClean) matched = true;
          else if (photoName.indexOf(toolIdClean) !== -1) matched = true;
        }
        if (!matched && certNoClean && cNo === certNoClean) {
          matched = true;
        }

        if (matched) {
          // Kolom 16 (1-based, Kolom P) adalah LINK SERTIFIKAT KALIBRASI
          sheetDisc.getRange(i + 1, 16).setValue(fileUrl);
          Logger.log('Updated cert link in ' + sheetNameDisc + ' row ' + (i + 1) + ' to ' + fileUrl);
          break;
        }
      }
    }

    var sheetNameTools = typeof SHEET_CAL_TOOLS !== 'undefined' ? SHEET_CAL_TOOLS : 'Calibration_Tools';
    var sheetTools = ss.getSheetByName(sheetNameTools);
    if (sheetTools) {
      var dataTools = sheetTools.getDataRange().getDisplayValues();
      for (var j = 1; j < dataTools.length; j++) {
        if (String(dataTools[j][0]).trim() === toolId) {
          // Pastikan kolom ke-8 ada
          sheetTools.getRange(j + 1, 8).setValue(fileUrl);
          break;
        }
      }
    }
  } catch (e) {
    Logger.log('updateCertLinkInSpreadsheets_ err: ' + e.message);
  }
}

// Sinkronisasi 1-Klik dari tab LIST CALIBRATION PER DISCIPLINE ke tab Calibration_Tools
function syncAllToolsFromListDiscipline() {
  try {
    var ss = getCalSS_();
    var sheetNameDisc = typeof SHEET_CAL_DISCIPLINE !== 'undefined' ? SHEET_CAL_DISCIPLINE : 'LIST CALIBRATION PER DISCIPLINE';
    var sheetNameTools = typeof SHEET_CAL_TOOLS !== 'undefined' ? SHEET_CAL_TOOLS : 'Calibration_Tools';

    var sheetDisc = ss.getSheetByName(sheetNameDisc);
    if (!sheetDisc) return { success: false, error: 'Sheet "' + sheetNameDisc + '" tidak ditemukan.' };

    var sheetTools = ss.getSheetByName(sheetNameTools);
    if (!sheetTools) {
      sheetTools = ss.insertSheet(sheetNameTools);
    }

    var rawValues = sheetDisc.getDataRange().getDisplayValues();
    var parsed = parseDisciplineSheetData_(rawValues);
    if (!parsed || parsed.length < 2) {
      return { success: false, error: 'Tidak ada data valid yang dapat diparsing dari ' + sheetNameDisc };
    }

    sheetTools.clearContents();
    sheetTools.getRange(1, 1, parsed.length, parsed[0].length).setValues(parsed);
    styleHeader_(sheetTools, parsed[0].length);

    return {
      success: true,
      message: 'Berhasil menyinkronkan ' + (parsed.length - 1) + ' alat ukur dari ' + sheetNameDisc + ' ke ' + sheetNameTools,
      count: parsed.length - 1
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// 3. Simpan Data Kalibrasi Baru atau Tambah / Hapus / Update Alat
function submitCalibration(formData) {
  try {
    var ss = getCalSS_();
    var sheetNameTools = typeof SHEET_CAL_TOOLS !== 'undefined' ? SHEET_CAL_TOOLS : 'Calibration_Tools';
    var sheetNameLog   = typeof SHEET_CAL_LOG !== 'undefined' ? SHEET_CAL_LOG : 'Calibration_Log';

    var sheetLog   = ss.getSheetByName(sheetNameLog);
    var sheetTools = ss.getSheetByName(sheetNameTools);
    if (!sheetTools) return { success: false, error: 'Sheet "' + sheetNameTools + '" tidak ditemukan.' };

    var toolId = String((formData && (formData.toolId || formData.id)) || '').trim();
    if (!toolId) return { success: false, error: 'Tool ID wajib diisi.' };

    // A. JIKA INI AKSI HAPUS (DELETE)
    if (formData.isDelete || formData.action === 'delete') {
      var dataTools = sheetTools.getDataRange().getValues();
      var deleted = false;
      for (var i = 1; i < dataTools.length; i++) {
        if (String(dataTools[i][0]).trim() === toolId) {
          sheetTools.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }
      if (sheetLog) {
        try {
          sheetLog.appendRow([
            new Date(),
            toolId,
            formData.toolName || '-',
            formData.discipline || '-',
            '-',
            '-',
            'DELETED',
            formData.pic || 'Admin',
            (Session.getActiveUser() && Session.getActiveUser().getEmail()) || 'System'
          ]);
        } catch (eLog) {}
      }
      return { 
        success: deleted, 
        message: deleted ? 'Alat ' + toolId + ' berhasil dihapus dari daftar.' : 'Alat dengan ID ' + toolId + ' tidak ditemukan.' 
      };
    }

    // B. JIKA INI AKSI TAMBAH ATAU UPDATE
    var dataTools = sheetTools.getDataRange().getValues();
    var foundIndex = -1;
    for (var j = 1; j < dataTools.length; j++) {
      if (String(dataTools[j][0]).trim() === toolId) {
        foundIndex = j;
        break;
      }
    }

    var tName = formData.toolName || (foundIndex !== -1 ? dataTools[foundIndex][1] : 'Alat Ukur');
    var tDisc = formData.discipline || (foundIndex !== -1 ? dataTools[foundIndex][2] : 'Umum');
    var tCalDate = formData.calDate || (foundIndex !== -1 ? dataTools[foundIndex][3] : '');
    var tNextDate = formData.nextCalDate || (foundIndex !== -1 ? dataTools[foundIndex][4] : '');
    var tStatus = formData.status || (foundIndex !== -1 ? dataTools[foundIndex][5] : 'Valid');
    var tPic = formData.pic || (foundIndex !== -1 ? dataTools[foundIndex][6] : '-');
    var tCertLink = formData.certLink || (foundIndex !== -1 ? (dataTools[foundIndex][7] || '') : '');

    if (foundIndex !== -1) {
      // UPDATE ALAT LAMA
      var r = foundIndex + 1;
      sheetTools.getRange(r, 1, 1, 8).setValues([[
        toolId, tName, tDisc, tCalDate, tNextDate, tStatus, tPic, tCertLink
      ]]);
    } else {
      // TAMBAH ALAT BARU
      sheetTools.appendRow([
        toolId, tName, tDisc, tCalDate, tNextDate, tStatus, tPic, tCertLink
      ]);
    }

    if (tCertLink) {
      updateCertLinkInSpreadsheets_(toolId, tCertLink, '', '');
    }

    // Catat ke Log Kalibrasi
    if (sheetLog) {
      try {
        sheetLog.appendRow([
          new Date(),
          toolId,
          tName,
          tDisc,
          tCalDate || '-',
          tNextDate || '-',
          tStatus,
          tPic,
          (Session.getActiveUser() && Session.getActiveUser().getEmail()) || tPic || 'System'
        ]);
      } catch (eLog2) {}
    }

    return { 
      success: true, 
      message: (foundIndex !== -1 ? 'Data alat ' : 'Alat baru ') + toolId + ' berhasil disimpan!' 
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Hapus Alat Kalibrasi
function deleteCalibrationTool(toolId) {
  return submitCalibration({ toolId: toolId, isDelete: true });
}

// Tambah Alat Kalibrasi
function addCalibrationTool(toolData) {
  return submitCalibration(toolData);
}

// Impor Massal Data Alat dari Spreadsheet / Array
function importCalibrationTools(toolsArray) {
  try {
    if (!toolsArray || !Array.isArray(toolsArray) || !toolsArray.length) {
      return { success: false, error: 'Data impor kosong atau format tidak sesuai.' };
    }
    var ss = getCalSS_();
    var sheetNameTools = typeof SHEET_CAL_TOOLS !== 'undefined' ? SHEET_CAL_TOOLS : 'Calibration_Tools';
    var sheetTools = ss.getSheetByName(sheetNameTools);
    if (!sheetTools) return { success: false, error: 'Sheet "' + sheetNameTools + '" tidak ditemukan.' };

    var dataTools = sheetTools.getDataRange().getValues();
    var existingMap = {};
    for (var i = 1; i < dataTools.length; i++) {
      existingMap[String(dataTools[i][0]).trim()] = i + 1;
    }

    var addedCount = 0;
    var updatedCount = 0;
    var rowsToAppend = [];

    toolsArray.forEach(function(item) {
      var id = String(item.toolId || item[0] || '').trim();
      if (!id || id.toLowerCase() === 'tool id' || id.toLowerCase() === 'no') return;

      var name = String(item.toolName || item[1] || 'Alat Ukur').trim();
      var disc = String(item.discipline || item[2] || 'Umum').trim();
      var calDate = String(item.calDate || item[3] || '').trim();
      var nextDate = String(item.nextCalDate || item[4] || '').trim();
      var status = String(item.status || item[5] || 'Valid').trim();
      var pic = String(item.pic || item[6] || '-').trim();
      var certLink = String(item.certLink || item[7] || '').trim();

      if (existingMap[id]) {
        sheetTools.getRange(existingMap[id], 1, 1, 8).setValues([[
          id, name, disc, calDate, nextDate, status, pic, certLink
        ]]);
        updatedCount++;
      } else {
        rowsToAppend.push([id, name, disc, calDate, nextDate, status, pic, certLink]);
        existingMap[id] = true;
        addedCount++;
      }
    });

    if (rowsToAppend.length > 0) {
      sheetTools.getRange(sheetTools.getLastRow() + 1, 1, rowsToAppend.length, 8).setValues(rowsToAppend);
    }

    return {
      success: true,
      message: 'Impor selesai: ' + addedCount + ' alat baru ditambahkan, ' + updatedCount + ' alat diperbarui.',
      added: addedCount,
      updated: updatedCount
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// 4. Ringkasan KPI & Data Grafik Kalibrasi
function getCalibrationSummary() {
  var res = getCalibrationTools();
  if (!res.success) return res;
  var data = res.data;
  var total = 0, valid = 0, overdue = 0, dalamProses = 0, notRequired = 0;
  var byDiscipline = {
    'Electrical': { total: 0, valid: 0, overdue: 0, proses: 0 },
    'Mechanical & Piping': { total: 0, valid: 0, overdue: 0, proses: 0 },
    'Civil & Architecture': { total: 0, valid: 0, overdue: 0, proses: 0 },
    'Coating & Painting': { total: 0, valid: 0, overdue: 0, proses: 0 }
  };

  for (var i = 1; i < data.length; i++) {
    total++;
    var st = String(data[i][5] || '').toUpperCase().trim();
    var disc = normalizeDisciplineName_(String(data[i][2] || 'Electrical').trim());

    if (!byDiscipline[disc]) {
      byDiscipline[disc] = { total: 0, valid: 0, notValid: 0, notVerified: 0, notRequired: 0, overdue: 0, proses: 0 };
    }
    byDiscipline[disc].total++;

    if (st === 'NOT VALID' || st === 'OVERDUE') {
      overdue++;
      byDiscipline[disc].notValid = (byDiscipline[disc].notValid || 0) + 1;
      byDiscipline[disc].overdue++;
    } else if (st === 'NOT VERIFIED' || st === 'DALAM PROSES') {
      dalamProses++;
      byDiscipline[disc].notVerified = (byDiscipline[disc].notVerified || 0) + 1;
      byDiscipline[disc].proses++;
    } else if (st === 'NOT REQUIRED') {
      notRequired++;
      byDiscipline[disc].notRequired = (byDiscipline[disc].notRequired || 0) + 1;
    } else {
      valid++;
      byDiscipline[disc].valid++;
    }
  }

  return {
    success: true,
    total: total,
    valid: valid,
    notValid: overdue,
    notVerified: dalamProses,
    notRequired: notRequired,
    overdue: overdue,
    dalamProses: dalamProses,
    byDiscipline: byDiscipline
  };
}

// ============================================================
// SETUP OTOMATIS
// ============================================================
function setupCalibrationSheets() {
  try {
    var ss = getCalSS_();
    var result = [];

    var headersTools = [
      'Tool ID', 'Nama Alat', 'Disiplin',
      'Tgl Kalibrasi', 'Tgl Berikutnya', 'Status', 'PIC', 'Link Sertifikat'
    ];
    result.push(ensureSheet_(ss, SHEET_CAL_TOOLS, headersTools));

    var headersLog = [
      'Timestamp', 'Tool ID', 'Nama Alat', 'Disiplin',
      'Tgl Kalibrasi', 'Tgl Berikutnya', 'Status', 'PIC', 'User Email'
    ];
    result.push(ensureSheet_(ss, SHEET_CAL_LOG, headersLog));

    var msg = 'Setup selesai:\n' + result.join('\n');
    Logger.log(msg);
    return { success: true, message: msg };

  } catch (e) {
    Logger.log('Error: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}

function ensureSheet_(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeader_(sheet, headers.length);
    return 'Sheet "' + sheetName + '" DIBUAT dengan ' + headers.length + ' kolom.';
  }

  var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var matches = headers.every(function (h, i) { return firstRow[i] === h; });
  if (!matches) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeader_(sheet, headers.length);
    return 'Header Sheet "' + sheetName + '" DIPERBARUI.';
  }

  return 'Sheet "' + sheetName + '" sudah ada dan valid.';
}

function styleHeader_(sheet, colCount) {
  var headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setBackground('#163d78');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Arial');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

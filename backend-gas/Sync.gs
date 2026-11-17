/**
 * ============================================================================
 * QC-CMS SYNC — Master Hub Auto-Sync (VERSI BERSIH FINAL)
 * ============================================================================
 */

var MASTER_ID    = '1-USvck0bs_ZwrdWmiEWCKvfTm8vJD_DrwybQhCCC3Yo';
var TAB_DOCS     = 'ALL_DOCUMENTS';
var TAB_PROJECTS = 'PROJECTS';
var TAB_LOG      = 'SYNC_LOG';

var HEADER_DOCS = [
  'Proyek', 'No. NFI', 'Subject Description', 'AREA', 'Type of Inspection',
  'Issued Date', 'Discipline', 'Location', 'Inspection Date', 'Result',
  'ITR No.', 'ITP No.', 'Report Submission Date', 'Complete Date', 'Status',
  'PIC AEI', 'Remark', 'Link Documents', 'Last Synced'
];

var HEADER_PROJECTS = [
  'Kode', 'Nama Proyek', 'ID Spreadsheet', 'Nama Tab', 'PIC', 'Email PIC', 'Status', 'Last Sync'
];

var HEADER_LOG = [
  'Waktu', 'Proyek', 'Baris Dibaca', 'Baru', 'Update', 'Skip', 'Status', 'Keterangan'
];


// ═══════════════════════════════════════════════════════════════════════════
// SETUP MASTER HUB
// ═══════════════════════════════════════════════════════════════════════════

function setupMaster() {
  Logger.log('=== SETUP MASTER HUB ===');
  var ss = SpreadsheetApp.openById(MASTER_ID);

  var sheetDocs = ss.getSheetByName(TAB_DOCS) || ss.insertSheet(TAB_DOCS);
  sheetDocs.clear();
  sheetDocs.getRange(1, 1, 1, HEADER_DOCS.length).setValues([HEADER_DOCS]);
  sheetDocs.getRange(1, 1, 1, HEADER_DOCS.length)
    .setBackground('#163d78').setFontColor('#fff').setFontWeight('bold');
  sheetDocs.setFrozenRows(1);
  sheetDocs.getRange('A:A').setNumberFormat('@');
  Logger.log('  ✅ Tab "' + TAB_DOCS + '" siap');

  var sheetPrj = ss.getSheetByName(TAB_PROJECTS) || ss.insertSheet(TAB_PROJECTS);
  sheetPrj.clear();
  sheetPrj.getRange(1, 1, 1, HEADER_PROJECTS.length).setValues([HEADER_PROJECTS]);
  sheetPrj.getRange(1, 1, 1, HEADER_PROJECTS.length)
    .setBackground('#163d78').setFontColor('#fff').setFontWeight('bold');
  sheetPrj.setFrozenRows(1);
  sheetPrj.getRange('A:A').setNumberFormat('@');
  Logger.log('  ✅ Tab "' + TAB_PROJECTS + '" siap');

  var sheetLog = ss.getSheetByName(TAB_LOG) || ss.insertSheet(TAB_LOG);
  sheetLog.clear();
  sheetLog.getRange(1, 1, 1, HEADER_LOG.length).setValues([HEADER_LOG]);
  sheetLog.getRange(1, 1, 1, HEADER_LOG.length)
    .setBackground('#163d78').setFontColor('#fff').setFontWeight('bold');
  sheetLog.setFrozenRows(1);
  Logger.log('  ✅ Tab "' + TAB_LOG + '" siap');

  var def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (def) { try { ss.deleteSheet(def); Logger.log('  🗑️ Sheet1 dihapus'); } catch (e) { Logger.log('Gagal hapus Sheet1: ' + e.message); } }

  Logger.log('=== SETUP SELESAI ===');
}


// ═══════════════════════════════════════════════════════════════════════════
// AUTO-POPULATE PROYEK
// ═══════════════════════════════════════════════════════════════════════════

function autoPopulateProjects() {
  var PROJECTS_TO_ADD = [
    { id: '1Pu9DQClEtnGQSZqx7YNUKdTTzIEC_9Sd', kode: '0154', nama: 'INDOCOPPER 0154 - Refining Plant Phase 1' },
    { id: '1VfnZusu3LZjjUd7BzM3GH7Lus6IRMWJUlSiUHy5LQ9s', kode: '0132', nama: 'COATS REJO 0132 - DnF Facility' },
    { id: '19eJ6uUpIrXCqGca0pYANzEKeXMuQj_P6', kode: '0129', nama: '0129 FMR' },
    { id: '1rqIF3hnAF-MOuGxTqnQbtc-SMIKauaG7', kode: '0155', nama: '0155 PJA' },
    { id: '1RMDC5gZWbr5Xk7Jduy_5UeLwSaENDN7_OT_3ulNCuus', kode: 'CEPR-WH', nama: 'New Warehouse Building CEPR' },
    { id: '1GFbusAXhw3-0DdxRTVp9hEy1qAocIPjmhmL3BKa-vlc', kode: 'SCB', nama: 'Safety Center Building Project AEI-OTE PT. Smelting' },
    { id: '1pyA1kAljqmO33zFTJr2c3HiybMfTjvK_HNQn9xOiu4Q', kode: 'CB700', nama: 'Capasitor Bank for Substantion 700 AEI-CII PT. Smelting' },
    { id: '1fVl1xj4l7iVXV1hc2IOXzf6UmJfoX23S', kode: 'RFI-01', nama: 'Request for Inspection (20 Jan 26)' },
    { id: '1-dizIT_M9uUhJ9ezJb9UoskKJkOyK3Mvfi6Ya8Zj_6U', kode: 'TMK', nama: 'Progres & Schedule TIMIKA' }
  ];

  Logger.log('=== AUTO-POPULATE PROJECTS ===');
  var ss = SpreadsheetApp.openById(MASTER_ID);
  var sheetPrj = ss.getSheetByName(TAB_PROJECTS);

  sheetPrj.getRange('A:A').setNumberFormat('@');
  var lastRow = sheetPrj.getLastRow();
  if (lastRow > 1) sheetPrj.getRange(2, 1, lastRow - 1, HEADER_PROJECTS.length).clear();

  var rows = [];
  PROJECTS_TO_ADD.forEach(function (p, idx) {
    Logger.log('▶️ [' + (idx + 1) + '/' + PROJECTS_TO_ADD.length + '] ' + p.kode);
    var tabNFI = '';
    try {
      var srcSS = SpreadsheetApp.openById(p.id);
      var bestTab = findNfiTabSmart_(srcSS.getSheets());
      if (bestTab) {
        tabNFI = bestTab.getName();
        Logger.log('   ✅ Tab: "' + tabNFI + '"');
      }
    } catch (e) { Logger.log('   ❌ ' + e.message); }

    rows.push(["'" + p.kode, p.nama, p.id, tabNFI, '', '', 'Aktif', '']);
  });

  if (rows.length > 0) {
    sheetPrj.getRange(2, 1, rows.length, HEADER_PROJECTS.length).setValues(rows);
  }
  Logger.log('✅ Berhasil tambah ' + rows.length + ' proyek');
}


function syncProjectMaster_(projectCode) {
  var startTime = new Date();
  Logger.log('=== SYNC PROYEK: ' + projectCode + ' ===');

  var master = SpreadsheetApp.openById(MASTER_ID);
  var sheetPrj = master.getSheetByName(TAB_PROJECTS);
  var sheetDocs = master.getSheetByName(TAB_DOCS);
  var sheetLog = master.getSheetByName(TAB_LOG);

  // 1. Cari proyek
  var prjData = sheetPrj.getDataRange().getValues();
  var project = null;
  var needle = String(projectCode).trim();
  for (var i = 1; i < prjData.length; i++) {
    var kodeAsli = String(prjData[i][0]).trim();
    if (kodeAsli === needle || Number(kodeAsli) === Number(needle)) {
      project = {
        code: prjData[i][0], name: prjData[i][1], id: prjData[i][2],
        tabName: prjData[i][3] || 'Register NFI',
        status: prjData[i][6], rowIdx: i + 1
      };
      break;
    }
  }
  if (!project) { Logger.log('❌ Proyek tidak ditemukan'); return; }
  if (project.status !== 'Aktif') { Logger.log('⏭️ Proyek tidak aktif'); return; }

  // 2. Buka spreadsheet
  var srcSS;
  try { srcSS = SpreadsheetApp.openById(project.id); }
  catch (e) {
    Logger.log('❌ Akses gagal: ' + e.message);
    logSync_(sheetLog, projectCode, 0, 0, 0, 0, 'Gagal', 'Akses gagal');
    return;
  }

  // 3. Cari tab
  var srcSheet = srcSS.getSheetByName(project.tabName);
  if (!srcSheet) {
    var sheets = srcSS.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (hasNfiHeader_(sheets[i])) { srcSheet = sheets[i]; break; }
    }
  }
  if (!srcSheet) {
    Logger.log('❌ Tab sumber tidak ditemukan');
    logSync_(sheetLog, projectCode, 0, 0, 0, 0, 'Gagal', 'Tab tidak ada');
    return;
  }
  Logger.log('📄 Sumber: ' + srcSS.getName() + ' → tab "' + srcSheet.getName() + '"');

  // 4. Baca semua data, formula, dan rich text (untuk hyperlink Ctrl+K & formula)
  var lastRow = srcSheet.getLastRow();
  var lastCol = srcSheet.getLastColumn();
  if (lastRow === 0) { Logger.log('❌ Sheet kosong'); return; }
  var srcRange = srcSheet.getRange(1, 1, lastRow, lastCol);
  var allData = srcRange.getValues();
  var allFormulas = srcRange.getFormulas();
  var allRichText = null;
  try {
    allRichText = srcRange.getRichTextValues();
  } catch (e) {
    Logger.log('⚠️ RichText tidak didukung atau error: ' + e.message);
  }

  var chipMap = {}; // Cache smart chips dari Sheets API v4

  // Helper ekstraksi link sel ultra cepat (100% memori, 0 network call)
  function getCellLink_(rIdx, cIdx) {
    if (cIdx < 0 || !allData[rIdx] || cIdx >= allData[rIdx].length) return '';
    var mapKey = rIdx + '_' + cIdx;
    if (chipMap && chipMap[mapKey]) {
      return chipMap[mapKey];
    }
    var v = allData[rIdx][cIdx];
    var f = (allFormulas && allFormulas[rIdx]) ? allFormulas[rIdx][cIdx] : '';
    var rt = (allRichText && allRichText[rIdx]) ? allRichText[rIdx][cIdx] : null;
    return extractUrlFast_(v, f, rt);
  }

  // 5. Cari header
  var headerRowIdx = -1;
  for (var r = 0; r < Math.min(15, allData.length); r++) {
    var rowNorm = allData[r].map(function (v) {
      return String(v == null ? '' : v).replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    });
    if (rowNorm.indexOf('no. nfi') !== -1 || rowNorm.indexOf('no nfi') !== -1 || rowNorm.indexOf('no. rfi') !== -1 || rowNorm.indexOf('no rfi') !== -1) {
      headerRowIdx = r; break;
    }
  }
  if (headerRowIdx === -1) {
    Logger.log('❌ Header "No. NFI" tidak ditemukan');
    logSync_(sheetLog, projectCode, 0, 0, 0, 0, 'Gagal', 'Header tidak ada');
    return;
  }
  var headerRow = allData[headerRowIdx];
  Logger.log('📍 Header di baris ' + (headerRowIdx + 1));

  // 6. Map kolom (dengan sinonim luas Indonesia & Inggris + partial match)
  var colMap = {
    noNFI:        findColInHeader_(headerRow, ['no. nfi', 'no nfi', 'nonfi', 'nomor nfi', 'nfi no', 'nfi no.', 'no. rfi', 'no rfi', 'nomor rfi'], true),
    subject:      findColInHeader_(headerRow, ['subject description', 'subject desc', 'subject', 'deskripsi', 'description', 'keterangan pekerjaan', 'pekerjaan'], true),
    area:         findColInHeader_(headerRow, ['area', 'zona', 'zone', 'lokasi area'], true),
    typeInsp:     findColInHeader_(headerRow, ['type of inspection', 'type inspection', 'inspection type', 'tipe inspeksi', 'jenis inspeksi', 'type', 'tipe'], true),
    issuedDate:   findColInHeader_(headerRow, ['issued date', 'issuedate', 'tanggal issued', 'tgl issued', 'issue date', 'date issued'], true),
    discipline:   findColInHeader_(headerRow, ['discipline', 'disiplin', 'disicpline', 'disicplin', 'dicipline', 'diciplin', 'disciplne'], true),
    location:     findColInHeader_(headerRow, ['location', 'lokasi', 'tempat'], true),
    inspDate:     findColInHeader_(headerRow, ['inspection date', 'tanggal inspeksi', 'tgl inspeksi', 'date of inspection'], true),
    result:       findColInHeader_(headerRow, ['result (pass/fail)', 'result', 'hasil', 'hasil inspeksi', 'status inspeksi'], true),
    itrNo:        findColInHeader_(headerRow, ['itr no.', 'itr no', 'itr', 'no. itr/mrir', 'no itr/mrir', 'itr/mrir', 'no. itr', 'no itr', 'nomor itr', 'mrir no.', 'mrir no', 'no. mrir', 'no mrir'], true),
    itpNo:        findColInHeader_(headerRow, ['itp no.', 'itp no', 'itp', 'no. itp', 'no itp', 'nomor itp'], true),
    reportSub:    findColInHeader_(headerRow, ['report submission date', 'report submission', 'tgl report', 'tanggal submit'], true),
    completeDate: findColInHeader_(headerRow, ['complete date', 'complete', 'tanggal selesai', 'tgl selesai'], true),
    status:       findColInHeader_(headerRow, ['status', 'status nfi', 'status dokumen'], true),
    pic:          findColInHeader_(headerRow, ['pic aei', 'pic', 'pic qc', 'inspector', 'inspektur'], true),
    remark:       findColInHeader_(headerRow, ['remark', 'catatan', 'remarks', 'note', 'notes'], true),
    link:         findColInHeader_(headerRow, [
                    'link documents closed', 'link document closed', 'link dokumen closed',
                    'link documents', 'link document', 'link dokumen', 'link berkas', 'link file',
                    'link drive', 'link gdrive', 'google drive', 'link g-drive',
                    'link attachment', 'attachment link', 'link bukti', 'link scan',
                    'link pdf', 'link itr', 'link nfi', 'url dokumen', 'url document',
                    'link', 'drive', 'attachment', 'lampiran', 'berkas', 'scan dokumen',
                    'dokumen closed', 'document closed', 'evidence'
                  ], true)
  };

  Logger.log('🔍 Kolom:');
  Object.keys(colMap).forEach(function (k) {
    Logger.log('  ' + k + ' → ' + (colMap[k] === -1 ? '❌' : 'kolom ' + (colMap[k] + 1)));
  });

  if (colMap.noNFI === -1) {
    Logger.log('❌ Kolom "No. NFI" tidak ditemukan');
    logSync_(sheetLog, projectCode, 0, 0, 0, 0, 'Gagal', 'Kolom No. NFI tidak ada');
    return;
  }

  // Ekstraksi Smart Chips (Google Drive chips) via Sheets API v4 (Hanya 1 request)
  try {
    var chipTargetCols = [colMap.link, colMap.noNFI, colMap.itrNo].filter(function(c) { return c >= 0; });
    chipMap = fetchSmartChipsMap_(project.id, srcSheet.getName(), lastRow, chipTargetCols);
  } catch (e) {
    Logger.log('⚠️ fetchSmartChipsMap_ info: ' + e.message);
  }

  // Pre-Index seluruh berkas Google Drive untuk proyek ini secara batch (Mendukung Shared Drive & Folder Proyek)
  var driveIndex = null;
  try {
    driveIndex = buildProjectDriveFileIndex_(projectCode, project.id);
  } catch (e) {
    Logger.log('⚠️ buildProjectDriveFileIndex_ info: ' + e.message);
  }

  // 7. Load existing (key = Proyek | No. NFI | ITR No.)
  var existData = sheetDocs.getDataRange().getValues();
  var existMap = {};
  for (var i = 1; i < existData.length; i++) {
    var key = normCodeProject_(existData[i][0]) + '|' +
              String(existData[i][1] || '').trim() + '|' +
              String(existData[i][10] || '').trim();
    existMap[key] = i + 1;
  }
  Logger.log('📊 Existing rows: ' + (existData.length - 1));

  // 8. Process — SETIAP ITR jadi baris terpisah
  var newRows = [], updates = [];
  var newCount = 0, updCount = 0, skipCount = 0;
  var dataStart = headerRowIdx + 1;
  var multiItrCount = 0;   // ← TAMBAH
  var totalRecords = 0;    // ← TAMBAH

  for (var i = dataStart; i < allData.length; i++) {
    var row = allData[i];
    var noNFI = colMap.noNFI >= 0 ? String(row[colMap.noNFI] || '').trim() : '';
    if (!noNFI) { skipCount++; continue; }

    // Split ITR — expand "s/d" jadi individual ITRs
    var itrRaw = getVal_(row, colMap.itrNo);
    var itrList = [];
    if (itrRaw) {
      itrList = expandItrRange_(itrRaw);
      
      // ✨ FILTER: Buang ITR yang berakhiran -000 (dianggap tidak valid)
      itrList = itrList.filter(function(it) {
        return !/-000\s*$/.test(String(it).trim());
      });
    }
    
    // Kalau setelah filter kosong → NFI tetap masuk dengan ITR kosong
    if (itrList.length === 0) itrList.push('');

    // Counter
    if (itrList.length > 1) {
      multiItrCount++;
      Logger.log('🔬 MULTI-ITR: ' + noNFI + ' → ' + itrList.length + ' ITR: ' + JSON.stringify(itrList));
    }

    // Ekstraksi Link Dokumen (Cepat, 100% In-Memory):
    // Prioritas 1: URL langsung dari sel link (Smart Chip / Hyperlink / Formula)
    var docLink = colMap.link >= 0 ? getCellLink_(i, colMap.link) : '';

    // Prioritas 2: Jika sel link berisi teks nama file (misal .pdf), cari di Drive Pre-Index
    if (!docLink && colMap.link >= 0 && driveIndex) {
      var rawLinkText = getVal_(row, colMap.link);
      if (rawLinkText) {
        docLink = resolveFromDriveIndex_(driveIndex, rawLinkText, noNFI, null);
      }
    }

    // Prioritas 3: Cek jika ada hyperlink langsung di kolom No. NFI atau ITR No.
    if (!docLink && colMap.noNFI >= 0) {
      docLink = getCellLink_(i, colMap.noNFI);
    }
    if (!docLink && colMap.itrNo >= 0) {
      docLink = getCellLink_(i, colMap.itrNo);
    }

    var rowStatus = String(getVal_(row, colMap.status) || '').trim().toLowerCase();
    var isRowClosed = rowStatus === 'closed' || rowStatus === 'close';

    // Loop setiap ITR
    for (var k = 0; k < itrList.length; k++) {
      totalRecords++;
      var itrNo = itrList[k];

      // Kunci identifikasi unik: Proyek | No. NFI | ITR No. (harus dievaluasi untuk SEMUA status: Open, Closed, dll)
      var key = normCodeProject_(projectCode) + '|' + noNFI + '|' + itrNo;

      var finalLink = '';
      if (isRowClosed) {
        // HANYA dokumen berstatus CLOSED yang boleh memiliki Link Documents Closed
        finalLink = docLink;
        if (!finalLink && existMap[key] && existData[existMap[key] - 1]) {
          var prevLink = String(existData[existMap[key] - 1][17] || '').trim();
          if (prevLink && /^https?:\/\//i.test(prevLink)) {
            finalLink = prevLink;
          }
        }

        // Prioritas 5: Cocokkan berkas di Drive Pre-Index HANYA untuk status CLOSED
        if (!finalLink && driveIndex) {
          finalLink = resolveFromDriveIndex_(driveIndex, '', noNFI, itrNo);
        }
      }

      var record = [
        projectCode, noNFI,
        getVal_(row, colMap.subject),
        getVal_(row, colMap.area),
        getVal_(row, colMap.typeInsp),
        fmtDate_(getVal_(row, colMap.issuedDate)),
        getVal_(row, colMap.discipline),
        getVal_(row, colMap.location),
        fmtDate_(getVal_(row, colMap.inspDate)),
        getVal_(row, colMap.result),
        itrNo,
        getVal_(row, colMap.itpNo),
        fmtDate_(getVal_(row, colMap.reportSub)),
        fmtDate_(getVal_(row, colMap.completeDate)),
        getVal_(row, colMap.status),
        getVal_(row, colMap.pic),
        getVal_(row, colMap.remark),
        finalLink,
        new Date()
      ];

      if (existMap[key]) {
        updates.push({ row: existMap[key], data: record });
        updCount++;
      } else {
        newRows.push(record);
        newCount++;
        existMap[key] = existData.length + newRows.length;
      }
    }
  }

  // 9. BATCH UPDATE ke ALL_DOCUMENTS (Super cepat: menggabungkan baris berurutan)
  if (updates.length > 0) {
    Logger.log('💾 Batch Update ' + updates.length + ' baris ke Master Hub...');
    updates.sort(function(a, b) { return a.row - b.row; });
    
    var chunkStart = 0;
    while (chunkStart < updates.length) {
      var chunkEnd = chunkStart;
      while (chunkEnd + 1 < updates.length && updates[chunkEnd + 1].row === updates[chunkEnd].row + 1) {
        chunkEnd++;
      }
      
      var startRow = updates[chunkStart].row;
      var numRows = chunkEnd - chunkStart + 1;
      var chunkData = [];
      for (var u = chunkStart; u <= chunkEnd; u++) {
        chunkData.push(updates[u].data);
      }
      
      sheetDocs.getRange(startRow, 1, numRows, HEADER_DOCS.length).setValues(chunkData);
      chunkStart = chunkEnd + 1;
    }
    Logger.log('  ✅ Batch update selesai');
  }

  // 10. Append
  if (newRows.length > 0) {
    var startRow = sheetDocs.getLastRow() + 1;
    sheetDocs.getRange(startRow, 1, newRows.length, HEADER_DOCS.length).setValues(newRows);
  }

  // 11. Update last sync
  sheetPrj.getRange(project.rowIdx, 8).setValue(new Date());

  // 12. Log
  var duration = ((new Date() - startTime) / 1000).toFixed(1);
  logSync_(sheetLog, projectCode, allData.length - dataStart, newCount, updCount, skipCount, 'Sukses', 'Durasi: ' + duration + 's');

  Logger.log('=== HASIL: ' + newCount + ' baru, ' + updCount + ' update, ' + skipCount + ' skip, ' + duration + 's ===');
  Logger.log('🔬 Multi-ITR rows: ' + multiItrCount + ' | Total records: ' + totalRecords);
  return { success: true, newCount: newCount, updateCount: updCount };
}


// ═══════════════════════════════════════════════════════════════════════════
// RUNNER
// ═══════════════════════════════════════════════════════════════════════════

function runSyncAll() {
  var ss = SpreadsheetApp.openById(MASTER_ID);
  var sheetPrj = ss.getSheetByName(TAB_PROJECTS);
  var data = sheetPrj.getDataRange().getValues();

  Logger.log('=== SYNC SEMUA PROYEK ===');
  var totalNew = 0, totalUpd = 0, count = 0;

  for (var i = 1; i < data.length; i++) {
    var code = String(data[i][0]).trim();
    var status = String(data[i][6]).trim();
    if (!code || status !== 'Aktif') continue;

    Logger.log('');
    Logger.log('▶️ ' + code);
    try {
      var res = syncProjectMaster_(code);
      if (res && res.success) {
        totalNew += res.newCount || 0;
        totalUpd += res.updateCount || 0;
        count++;
      }
    } catch (e) { Logger.log('❌ ' + e.message); }
  }

  Logger.log('');
  Logger.log('=== RINGKASAN ===');
  Logger.log('Proyek diproses: ' + count);
  Logger.log('Total baris baru: ' + totalNew);
  Logger.log('Total update: ' + totalUpd);
  return {
    success: true,
    processedProjects: count,
    totalNew: totalNew,
    totalUpdated: totalUpd
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// AUTO-SYNC TIAP JAM
// ═══════════════════════════════════════════════════════════════════════════

function autoSyncAllProjects() {
  var startTime = new Date();
  Logger.log('════════════════════════════════════════');
  Logger.log('🔄 AUTO-SYNC DIMULAI: ' + startTime.toLocaleString('id-ID'));
  Logger.log('════════════════════════════════════════');

  var ss = SpreadsheetApp.openById(MASTER_ID);
  var sheetPrj = ss.getSheetByName(TAB_PROJECTS);
  var sheetLog = ss.getSheetByName(TAB_LOG);
  var data = sheetPrj.getDataRange().getValues();

  var totalNew = 0, totalUpd = 0;
  var successCount = 0, failCount = 0;
  var errors = [];

  for (var i = 1; i < data.length; i++) {
    var code = String(data[i][0]).trim();
    var status = String(data[i][6]).trim();
    if (!code || status !== 'Aktif') continue;

    Logger.log('');
    Logger.log('▶️ Sync: ' + code);

    try {
      var res = syncProjectMaster_(code);
      if (res && res.success) {
        totalNew += res.newCount || 0;
        totalUpd += res.updateCount || 0;
        successCount++;
      } else {
        failCount++;
      }
    } catch (e) {
      failCount++;
      errors.push(code + ': ' + e.message);
      Logger.log('❌ Error: ' + e.message);
    }
  }

  var duration = ((new Date() - startTime) / 1000).toFixed(1);

  Logger.log('');
  Logger.log('════════════════════════════════════════');
  Logger.log('📊 RINGKASAN AUTO-SYNC');
  Logger.log('════════════════════════════════════════');
  Logger.log('✅ Sukses: ' + successCount + ' proyek');
  Logger.log('❌ Gagal: ' + failCount + ' proyek');
  Logger.log('🆕 Baru: ' + totalNew + ' baris');
  Logger.log('🔄 Update: ' + totalUpd + ' baris');
  Logger.log('⏱️ Durasi: ' + duration + ' detik');
  Logger.log('════════════════════════════════════════');

  if (errors.length > 0) {
    sheetLog.appendRow([new Date(), 'AUTO-SYNC', successCount, totalNew, totalUpd, 0, 'Ada Error', errors.join(' | ')]);
  }

  return {
    success: true, successCount: successCount, failCount: failCount,
    totalNew: totalNew, totalUpdate: totalUpd, duration: duration
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PEMBERSIHAN DUPLIKAT DI MASTER HUB (ALL_DOCUMENTS)
// ═══════════════════════════════════════════════════════════════════════════

function cleanupDuplicateDocumentsInMaster() {
  Logger.log('=== CLEANUP DUPLICATE DOCUMENTS IN ALL_DOCUMENTS ===');
  var ss = SpreadsheetApp.openById(MASTER_ID);
  var sheetDocs = ss.getSheetByName(TAB_DOCS);
  if (!sheetDocs) return { success: false, message: 'Tab ' + TAB_DOCS + ' tidak ditemukan' };

  var data = sheetDocs.getDataRange().getValues();
  if (data.length <= 1) return { success: true, message: 'Sheet kosong atau hanya ada header' };

  var rows = data.slice(1);
  var initialCount = rows.length;

  var uniqueMap = {};
  var order = [];

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var prj = normCodeProject_(r[0]);
    var nfi = String(r[1] || '').trim();
    var itr = String(r[10] || '').trim();
    if (!prj || !nfi) continue; // skip baris kosong tanpa identitas

    var key = prj + '|' + nfi + '|' + itr;
    var status = String(r[14] || '').trim().toLowerCase();
    var isClosed = (status === 'closed' || status === 'close');
    var hasLink = !!String(r[17] || '').trim();

    if (!uniqueMap[key]) {
      uniqueMap[key] = r;
      order.push(key);
    } else {
      var existing = uniqueMap[key];
      var existingStatus = String(existing[14] || '').trim().toLowerCase();
      var existingIsClosed = (existingStatus === 'closed' || existingStatus === 'close');
      var existingHasLink = !!String(existing[17] || '').trim();

      // Aturan prioritas data:
      // 1. Prioritaskan baris yang CLOSED jika sebelumnya non-closed
      // 2. Jika sama-sama closed/open, prioritaskan yang memiliki link dokumen
      // 3. Jika sama, ambil baris yang lebih baru
      if (isClosed && !existingIsClosed) {
        uniqueMap[key] = r;
      } else if (isClosed === existingIsClosed) {
        if (hasLink && !existingHasLink) {
          uniqueMap[key] = r;
        } else if (!existingHasLink || hasLink) {
          uniqueMap[key] = r;
        }
      }
    }
  }

  var cleanRows = order.map(function(k) { return uniqueMap[k]; });
  var removedCount = initialCount - cleanRows.length;

  Logger.log('📊 Baris awal: ' + initialCount + ' | Bersih: ' + cleanRows.length + ' | Duplikat dihapus: ' + removedCount);

  // Tulis kembali data bersih ke ALL_DOCUMENTS
  sheetDocs.clear();
  sheetDocs.getRange(1, 1, 1, HEADER_DOCS.length).setValues([HEADER_DOCS]);
  sheetDocs.getRange(1, 1, 1, HEADER_DOCS.length)
    .setBackground('#163d78').setFontColor('#fff').setFontWeight('bold');
  sheetDocs.setFrozenRows(1);
  sheetDocs.getRange('A:A').setNumberFormat('@');

  if (cleanRows.length > 0) {
    sheetDocs.getRange(2, 1, cleanRows.length, HEADER_DOCS.length).setValues(cleanRows);
  }

  Logger.log('✅ Cleanup selesai! Duplikat terhapus: ' + removedCount);
  return {
    success: true,
    initialCount: initialCount,
    cleanedCount: cleanRows.length,
    removedDuplicates: removedCount,
    message: 'Berhasil membersihkan ' + removedCount + ' data duplikat. Tersisa ' + cleanRows.length + ' dokumen valid.'
  };
}

function setupHourlyTrigger() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function (t) {
      if (t.getHandlerFunction() === 'autoSyncAllProjects') {
        ScriptApp.deleteTrigger(t);
        Logger.log('🗑️ Trigger lama dihapus');
      }
    });

    ScriptApp.newTrigger('autoSyncAllProjects')
      .timeBased()
      .everyHours(1)
      .create();

    Logger.log('✅ TRIGGER BERHASIL DIBUAT!');
    Logger.log('   Fungsi: autoSyncAllProjects');
    Logger.log('   Frekuensi: Setiap 1 jam');

    try {
      SpreadsheetApp.getUi().alert('✅ Trigger Berhasil Diaktifkan!\n\nAuto-sync semua proyek akan berjalan otomatis setiap 1 jam di background.');
    } catch (uiErr) {}

    return {
      success: true,
      active: true,
      message: 'Trigger auto-sync semua proyek berhasil diaktifkan (berjalan tiap 1 jam).'
    };
  } catch (e) {
    return { success: false, message: 'Gagal membuat trigger: ' + e.message };
  }
}

function getSyncTriggerStatus() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var active = false;
    triggers.forEach(function (t) {
      if (t.getHandlerFunction() === 'autoSyncAllProjects') {
        active = true;
      }
    });
    return { success: true, active: active };
  } catch (e) {
    return { success: false, active: false, message: e.message };
  }
}

function deleteHourlyTrigger() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var count = 0;
    triggers.forEach(function (t) {
      if (t.getHandlerFunction() === 'autoSyncAllProjects') {
        ScriptApp.deleteTrigger(t);
        count++;
      }
    });
    return { success: true, active: false, message: count + ' trigger dinonaktifkan.' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function listTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  Logger.log('=== DAFTAR TRIGGER ===');
  Logger.log('Total: ' + triggers.length);
  triggers.forEach(function (t, i) {
    Logger.log((i + 1) + '. ' + t.getHandlerFunction() + ' · ' + t.getEventType());
  });
}

function deleteAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  var count = 0;
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'autoSyncAllProjects') {
      ScriptApp.deleteTrigger(t);
      count++;
    }
  });
  Logger.log('🗑️ ' + count + ' trigger dihapus');
}

function testSyncIndocopper() {
  Logger.log('=== TEST SYNC INDOCOPPER (0154) ===');
  return syncProjectMaster_('0154');
}

function testAutoSync() {
  Logger.log('🧪 Test auto-sync manual...');
  var res = autoSyncAllProjects();
  Logger.log('Hasil: ' + JSON.stringify(res));
}


// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD EXECUTIVE
// ═══════════════════════════════════════════════════════════════════════════

function getExecutiveDashboard() {
  try {
    var ss = SpreadsheetApp.openById(MASTER_ID);
    var sheetDocs = ss.getSheetByName(TAB_DOCS);
    var sheetPrj = ss.getSheetByName(TAB_PROJECTS);

    var docsData = sheetDocs.getDataRange().getValues();
    var prjData = sheetPrj.getDataRange().getValues();

    var docs = docsData.slice(1).filter(function (r) { return String(r[0] || '').trim(); });

    var byProject = {};
    docs.forEach(function (row) {
      var code = normCodeProject_(row[0]);
      if (!code) return;

      if (!byProject[code]) {
        byProject[code] = {
          total: 0, open: 0, closed: 0, canceled: 0, other: 0,
          byType: {}, byDiscipline: {},
          oldestOpenDays: 0, pic: '',
          nfiSet: {}, itrSet: {}, itrEmpty: 0
        };
      }
      var b = byProject[code];
      b.total++;

      // NFI unik
      var noNFI = String(row[1] || '').trim();
      if (noNFI) b.nfiSet[noNFI] = true;

      // ITR unik
      var itrNo = String(row[10] || '').trim();
      if (itrNo) b.itrSet[itrNo] = true;
      else b.itrEmpty++;

      // ✅ Status — hitung Open, Closed, Canceled, Lain
      var status = String(row[14] || '').trim().toLowerCase();
      if (status === 'closed') b.closed++;
      else if (status === 'open') b.open++;
      else if (status === 'canceled' || status === 'cancelled' || status === 'cancel') b.canceled++;
      else b.other++;

      var typeInsp = String(row[4] || '').trim();
      if (typeInsp) b.byType[typeInsp] = (b.byType[typeInsp] || 0) + 1;

      // ✅ Normalize disiplin (fix duplikat "structure" vs "Structure")
      var discipline = String(row[6] || '').trim();
      if (!discipline) discipline = '(tidak ada)';
      // Capitalize first letter, lowercase rest untuk konsistensi
      var discKey = discipline.charAt(0).toUpperCase() + discipline.slice(1).toLowerCase();
      b.byDiscipline[discKey] = (b.byDiscipline[discKey] || 0) + 1;

      var pic = String(row[15] || '').trim();
      if (pic && !b.pic) b.pic = pic;

      if (status !== 'closed' && status !== 'canceled' && status !== 'cancelled' && status !== 'cancel' && row[5]) {
        try {
          var issued = row[5] instanceof Date ? row[5] : new Date(row[5]);
          if (!isNaN(issued.getTime())) {
            var days = Math.floor((new Date() - issued) / 86400000);
            if (days > b.oldestOpenDays) b.oldestOpenDays = days;
          }
        } catch (e) { Logger.log('Parse tanggal issued gagal: ' + e.message); }
      }
    });

    var allDisciplines = {};
    docs.forEach(function (row) {
      var d = String(row[6] || '').trim();
      if (d) {
        var discKey = d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
        allDisciplines[discKey] = true;
      }
    });
    var disciplineList = Object.keys(allDisciplines).sort();

    var projects = [];
    var totalProjectsAll = 0, totalProjectsActive = 0, totalProjectsInactive = 0;

    prjData.slice(1).forEach(function (row) {
      var codeRaw = row[0];
      var code = normCodeProject_(codeRaw);
      if (!code) return;

      var projStatus = String(row[6] || 'Aktif').trim();
      totalProjectsAll++;
      if (projStatus === 'Aktif') totalProjectsActive++;
      else totalProjectsInactive++;

      if (projStatus !== 'Aktif') return;

      var agg = byProject[code] || { total: 0, open: 0, closed: 0, canceled: 0, other: 0, byType: {}, byDiscipline: {}, oldestOpenDays: 0, pic: '', nfiSet: {}, itrSet: {}, itrEmpty: 0 };

      var health = 'green';
      if (agg.open > 0) {
        var openRatio = agg.open / (agg.total || 1);
        if (openRatio > 0.5 || agg.oldestOpenDays > 30) health = 'red';
        else if (openRatio > 0.2 || agg.oldestOpenDays > 14) health = 'yellow';
      }

      projects.push({
        code: String(codeRaw || '').trim(),
        name: String(row[1] || ''),
        id: String(row[2] || '').trim(),
        tabName: String(row[3] || ''),
        pic: agg.pic || String(row[4] || ''),
        status: projStatus,
        total: agg.total,
        open: agg.open,
        closed: agg.closed,
        canceled: agg.canceled,
        other: agg.other,
        totalNFI: Object.keys(agg.nfiSet).length,
        totalITR: Object.keys(agg.itrSet).length,
        itrEmpty: agg.itrEmpty,
        byType: agg.byType,
        byDiscipline: agg.byDiscipline,
        oldestOpenDays: agg.oldestOpenDays,
        health: health,
        lastSync: row[7] ? String(row[7]) : ''
      });
    });

    var totals = {
      total: 0, open: 0, closed: 0, canceled: 0, other: 0,
      totalNFI: 0, totalITR: 0, itrEmpty: 0,
      projects: projects.length,
      projectsActive: totalProjectsActive,
      projectsInactive: totalProjectsInactive,
      projectsAll: totalProjectsAll,
      projectsCritical: projects.filter(function (p) { return p.health === 'red'; }).length
    };
    projects.forEach(function (p) {
      totals.total += p.total;
      totals.open += p.open;
      totals.closed += p.closed;
      totals.canceled += p.canceled;
      totals.other += p.other;
      totals.totalNFI += p.totalNFI;
      totals.totalITR += p.totalITR;
      totals.itrEmpty += p.itrEmpty;
    });

    var healthOrder = { red: 0, yellow: 1, green: 2 };
    projects.sort(function (a, b) {
      if (healthOrder[a.health] !== healthOrder[b.health]) return healthOrder[a.health] - healthOrder[b.health];
      return b.open - a.open;
    });

    return {
      success: true,
      totals: totals,
      projects: projects,
      disciplines: disciplineList,
      lastUpdate: new Date().toISOString()
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}


function getProjectDetailFromMaster(projectCode) {
  try {
    var ss = SpreadsheetApp.openById(MASTER_ID);
    var sheet = ss.getSheetByName(TAB_DOCS);
    var data = sheet.getDataRange().getValues();

    var needle = normCodeProject_(projectCode);
    var items = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (normCodeProject_(row[0]) !== needle) continue;

      items.push({
        noNFI: row[1], subject: row[2], area: row[3], typeInsp: row[4],
        issuedDate: row[5], discipline: row[6], location: row[7],
        inspDate: row[8], result: row[9], itrNo: row[10], itpNo: row[11],
        reportSub: row[12], completeDate: row[13], status: row[14],
        pic: row[15], remark: row[16], link: row[17]
      });
    }

    // Ambil info proyek dari tab PROJECTS
    var sheetPrj = ss.getSheetByName(TAB_PROJECTS);
    var prjData = sheetPrj ? sheetPrj.getDataRange().getValues() : [];
    var prjInfo = { code: projectCode, name: '', id: '', tabName: '', spreadsheetUrl: '' };
    for (var p = 1; p < prjData.length; p++) {
      if (normCodeProject_(prjData[p][0]) === needle) {
        var sId = String(prjData[p][2] || '').trim();
        prjInfo.name = String(prjData[p][1] || '').trim();
        prjInfo.id = sId;
        prjInfo.tabName = String(prjData[p][3] || '').trim();
        prjInfo.spreadsheetUrl = sId ? ('https://docs.google.com/spreadsheets/d/' + sId + '/edit') : '';
        break;
      }
    }

    return { success: true, items: items, count: items.length, project: prjInfo };
  } catch (e) {
    return { success: false, message: e.message };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// KELOLA PROYEK VIA UI
// ═══════════════════════════════════════════════════════════════════════════

function getProjectsListForUI() {
  try {
    var ss = SpreadsheetApp.openById(MASTER_ID);
    var sheet = ss.getSheetByName(TAB_PROJECTS);
    var data = sheet.getDataRange().getValues();

    var items = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!String(row[0] || '').trim()) continue;

      items.push({
        rowIndex: i + 1,
        code: String(row[0]).trim(),
        name: String(row[1] || '').trim(),
        id: String(row[2] || '').trim(),
        tabName: String(row[3] || '').trim(),
        pic: String(row[4] || '').trim(),
        status: String(row[6] || 'Aktif').trim(),
        lastSync: row[7] ? String(row[7]) : ''
      });
    }

    return { success: true, items: items };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function updateProjectStatus(projectCode, newStatus) {
  try {
    if (newStatus !== 'Aktif' && newStatus !== 'Nonaktif') {
      return { success: false, message: 'Status tidak valid' };
    }

    var ss = SpreadsheetApp.openById(MASTER_ID);
    var sheet = ss.getSheetByName(TAB_PROJECTS);
    var data = sheet.getDataRange().getValues();

    var needle = normCodeProject_(projectCode);
    for (var i = 1; i < data.length; i++) {
      if (normCodeProject_(data[i][0]) === needle) {
        sheet.getRange(i + 1, 7).setValue(newStatus);
        return { success: true, message: 'Proyek "' + data[i][0] + '" → ' + newStatus };
      }
    }

    return { success: false, message: 'Proyek tidak ditemukan' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function updateProjectDetails(projectCode, details) {
  try {
    var ss = SpreadsheetApp.openById(MASTER_ID);
    var sheet = ss.getSheetByName(TAB_PROJECTS);
    var data = sheet.getDataRange().getValues();

    var needle = normCodeProject_(projectCode);
    for (var i = 1; i < data.length; i++) {
      if (normCodeProject_(data[i][0]) === needle) {
        var rowIdx = i + 1;
        // Batch update — 1 round-trip instead of 3 individual setValue
        var rowData = data[i].slice();
        if (details.name !== undefined) rowData[1] = details.name;
        if (details.pic !== undefined) rowData[4] = details.pic;
        if (details.status !== undefined) rowData[6] = details.status;
        sheet.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
        return { success: true, message: 'Detail proyek diperbarui' };
      }
    }

    return { success: false, message: 'Proyek tidak ditemukan' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function addNewProjectFromUI(payload) {
  try {
    if (!payload.code || !payload.name || !payload.id) {
      return { success: false, message: 'Kode, Nama, dan ID wajib diisi' };
    }

    var ss = SpreadsheetApp.openById(MASTER_ID);
    var sheet = ss.getSheetByName(TAB_PROJECTS);
    sheet.getRange('A:A').setNumberFormat('@');

    var data = sheet.getDataRange().getValues();
    var needle = normCodeProject_(payload.code);
    for (var i = 1; i < data.length; i++) {
      if (normCodeProject_(data[i][0]) === needle) {
        return { success: false, message: 'Kode proyek sudah ada' };
      }
    }

    var tabNFI = payload.tabName || '';
    if (!tabNFI) {
      try {
        var srcSS = SpreadsheetApp.openById(payload.id);
        var bestTab = findNfiTabSmart_(srcSS.getSheets());
        if (bestTab) tabNFI = bestTab.getName();
      } catch (e) { Logger.log('Auto-detect NFI tab gagal: ' + e.message); }
    }

    sheet.appendRow([
      "'" + String(payload.code).trim(),
      String(payload.name).trim(),
      String(payload.id).trim(),
      tabNFI,
      String(payload.pic || '').trim(),
      '', 'Aktif', ''
    ]);

    return { success: true, message: 'Proyek "' + payload.code + '" ditambahkan' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deleteSyncProjectFromUI(projectCode) {
  try {
    var ss = SpreadsheetApp.openById(MASTER_ID);
    var sheet = ss.getSheetByName(TAB_PROJECTS);
    var data = sheet.getDataRange().getValues();

    var needle = normCodeProject_(projectCode);
    for (var i = 1; i < data.length; i++) {
      if (normCodeProject_(data[i][0]) === needle) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Proyek "' + data[i][0] + '" dihapus' };
      }
    }

    return { success: false, message: 'Proyek tidak ditemukan' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function testSpreadsheetAccess(ssId) {
  try {
    var ss = SpreadsheetApp.openById(ssId);
    var sheets = ss.getSheets();
    var bestTab = findNfiTabSmart_(sheets);
    return {
      success: true,
      fileName: ss.getName(),
      tabs: sheets.map(function(s) { return s.getName(); }),
      detectedTab: bestTab ? bestTab.getName() : '(tidak terdeteksi)'
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════════════════

function normCodeProject_(s) {
  var v = String(s == null ? '' : s).trim();
  if (/^0+\d+$/.test(v)) return String(parseInt(v, 10));
  if (/^\d+$/.test(v)) return String(parseInt(v, 10));
  return v;
}

function findColInHeader_(headerRow, names, allowPartial) {
  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/\u00A0/g, ' ')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
  var normHeaders = (headerRow || []).map(norm);

  // 1. Exact match (prioritas tertinggi)
  for (var n = 0; n < names.length; n++) {
    var target = norm(names[n]);
    for (var i = 0; i < normHeaders.length; i++) {
      if (normHeaders[i] === target) return i;
    }
  }

  // 2. Partial match (jika diizinkan)
  if (allowPartial) {
    for (var n = 0; n < names.length; n++) {
      var target = norm(names[n]);
      if (target.length < 3) continue;
      for (var i = 0; i < normHeaders.length; i++) {
        var h = normHeaders[i];
        if (h && (h.indexOf(target) !== -1 || target.indexOf(h) !== -1)) return i;
      }
    }
  }

  return -1;
}

/**
 * Membangun indeks seluruh berkas Drive proyek secara BATCH.
 * Mendukung pencarian di SHARED DRIVE (Drive Bersama) via Drive REST API v3
 * serta membaca langsung folder proyek tempat spreadsheet berada.
 */
function buildProjectDriveFileIndex_(projectCode, spreadsheetId) {
  var index = {
    byExactName: {},
    byCleanName: {},
    byNfi: {},
    byItr: {}
  };

  if (!projectCode) return index;
  var code = String(projectCode).trim();
  var startTime = new Date();
  var count = 0;

  function addFileToIndex_(rawName, url) {
    if (!rawName || !url) return;
    var low = rawName.toLowerCase();
    if (!index.byExactName[low]) {
      index.byExactName[low] = url;
      count++;
    }

    var clean = low.replace(/^[0-9]+[\.\-\s]+/g, '').trim();
    if (!index.byCleanName[clean]) index.byCleanName[clean] = url;

    // Deteksi No. NFI / RFI (Universal Multi-Proyek: Simpan Full Key & Short Key)
    var mNfi = rawName.match(/(?:[A-Z0-9]+[-_])*(?:NFI|RFI)[-_]?[A-Z0-9]*[-_]?[0-9]+/i);
    if (mNfi) {
      var nfiKey = mNfi[0].toUpperCase().replace(/[-_\s]/g, '');
      if (!index.byNfi[nfiKey]) index.byNfi[nfiKey] = url;
    }
    var mShortNfi = rawName.match(/(?:NFI|RFI)[-_]?[0-9]+/i);
    if (mShortNfi) {
      var shortNfiKey = mShortNfi[0].toUpperCase().replace(/[-_\s]/g, '');
      if (!index.byNfi[shortNfiKey]) index.byNfi[shortNfiKey] = url;
    }

    // Deteksi No. ITR (Universal Multi-Proyek: Simpan Full Key & Short Key)
    var mItr = rawName.match(/(?:[A-Z0-9]+[-_])*ITR[-_][A-Z0-9]+[-_][0-9]+/i);
    if (mItr) {
      var itrKey = mItr[0].toUpperCase().replace(/[-_\s]/g, '');
      if (!index.byItr[itrKey]) index.byItr[itrKey] = url;
    }
    var mShortItr = rawName.match(/ITR[-_][A-Z0-9]+[-_][0-9]+/i);
    if (mShortItr) {
      var shortItrKey = mShortItr[0].toUpperCase().replace(/[-_\s]/g, '');
      if (!index.byItr[shortItrKey]) index.byItr[shortItrKey] = url;
    }
  }

  // 1. CARI VIA DRIVE API REST V3 (Mencakup SELURUH Shared Drive & My Drive)
  try {
    // Bangun query universal mencakup kode utama, variasi tanpa nol, dan prefix proyek
    var searchTerms = [code];
    var noZero = code.replace(/^0+/, '');
    if (noZero && noZero !== code && noZero.length >= 2) searchTerms.push(noZero);
    var dashPrefix = code.split(/[-_\s]/)[0].trim();
    if (dashPrefix && dashPrefix.length >= 3 && searchTerms.indexOf(dashPrefix) === -1) searchTerms.push(dashPrefix);

    var qSub = searchTerms.map(function(t) { return "name contains '" + t + "'"; }).join(' or ');
    var q = "(" + qSub + ") and trashed = false";

    var driveApiUrl = 'https://www.googleapis.com/drive/v3/files?' +
      'q=' + encodeURIComponent(q) +
      '&corpora=allDrives' +
      '&includeItemsFromAllDrives=true' +
      '&supportsAllDrives=true' +
      '&fields=' + encodeURIComponent('files(id,name,webViewLink)') +
      '&pageSize=1000';

    var res = UrlFetchApp.fetch(driveApiUrl, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });

    if (res.getResponseCode() === 200) {
      var data = JSON.parse(res.getContentText());
      if (data.files && data.files.length > 0) {
        data.files.forEach(function(f) {
          addFileToIndex_(f.name, f.webViewLink || ('https://drive.google.com/file/d/' + f.id + '/view'));
        });
        Logger.log('  🌐 Drive API v3 (Shared Drive): Menemukan ' + data.files.length + ' berkas');
      }
    } else {
      Logger.log('  ⚠️ Drive API v3 Response: ' + res.getResponseCode());
    }
  } catch (errApi) {
    Logger.log('  ⚠️ Drive API v3 info: ' + errApi.message);
  }

  // 2. JIKA SPREADSHEET BERADA DALAM FOLDER TERTENTU, BACA SEMUA BERKAS DI FOLDER TERSEBUT
  if (spreadsheetId) {
    try {
      var ssFile = DriveApp.getFileById(spreadsheetId);
      var parents = ssFile.getParents();
      while (parents.hasNext()) {
        var parentFolder = parents.next();
        indexFolderFiles_(parentFolder, addFileToIndex_, 0);
      }
    } catch (errFolder) {
      Logger.log('  ⚠️ Parent folder crawl info: ' + errFolder.message);
    }
  }

  // 3. FALLBACK KE DriveApp.searchFiles (My Drive)
  try {
    var files = DriveApp.searchFiles("title contains '" + code + "' and trashed = false");
    var localCount = 0;
    while (files.hasNext() && localCount < 1000) {
      localCount++;
      var f = files.next();
      addFileToIndex_(f.getName(), f.getUrl());
    }
  } catch (errSearch) {
    Logger.log('  ⚠️ DriveApp searchFiles info: ' + errSearch.message);
  }

  var dur = ((new Date() - startTime) / 1000).toFixed(1);
  Logger.log('  📂 Total Drive Pre-Index: ' + count + ' berkas diindeks (' + dur + 's)');
  return index;
}

function indexFolderFiles_(folder, addFileFn, depth) {
  if (depth > 2) return; // Batasi kedalaman subfolder maksimal 2 level agar cepat
  try {
    var files = folder.getFiles();
    while (files.hasNext()) {
      var f = files.next();
      addFileFn(f.getName(), f.getUrl());
    }
    var subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
      indexFolderFiles_(subfolders.next(), addFileFn, depth + 1);
    }
  } catch (e) {}
}

/**
 * Mencari URL dari Drive Pre-Index secara instan di memori (0.001 ms).
 */
function resolveFromDriveIndex_(driveIndex, cellText, nfiNo, itrNo) {
  if (!driveIndex) return '';

  if (cellText) {
    var t = String(cellText).trim().toLowerCase();
    if (driveIndex.byExactName[t]) return driveIndex.byExactName[t];

    var clean = t.replace(/^[0-9]+[\.\-\s]+/g, '').trim();
    if (driveIndex.byCleanName[clean]) return driveIndex.byCleanName[clean];

    // Cek partial match nama file
    if (clean.length > 8) {
      for (var k in driveIndex.byCleanName) {
        if (k.indexOf(clean) !== -1 || clean.indexOf(k) !== -1) {
          return driveIndex.byCleanName[k];
        }
      }
    }
  }

  if (nfiNo) {
    var nKey = String(nfiNo).toUpperCase().replace(/[-_\s]/g, '');
    if (driveIndex.byNfi[nKey]) return driveIndex.byNfi[nKey];

    // JANGAN match /(?:NFI|RFI)[-_]?[0-9]+/ karena akan match kode proyek seperti NFI-0132!
    // Ekstrak nomor urut spesifik dokumen NFI di akhir (misal 325 dari MEC-325)
    var mEndSeq = String(nfiNo).match(/[0-9]+$/);
    if (mEndSeq && mEndSeq[0].length >= 3) {
      var seq = mEndSeq[0];
      for (var k in driveIndex.byNfi) {
        if (k.endsWith(seq)) {
          return driveIndex.byNfi[k];
        }
      }
    }
  }

  if (itrNo) {
    var iKey = String(itrNo).toUpperCase().replace(/[-_\s]/g, '');
    if (driveIndex.byItr[iKey]) return driveIndex.byItr[iKey];

    var mShortI = String(itrNo).match(/ITR[-_][A-Z0-9]+[-_][0-9]+/i);
    if (mShortI) {
      var sKeyI = mShortI[0].toUpperCase().replace(/[-_\s]/g, '');
      if (driveIndex.byItr[sKeyI]) return driveIndex.byItr[sKeyI];
    }
  }

  return '';
}

/**
 * Ekstraksi URL langsung dari sel (RichText, Formula, Text URL).
 * Berjalan murni di memori tanpa query eksternal.
 */
function extractUrlFast_(val, formula, richText) {
  if (richText) {
    try {
      var directLink = richText.getLinkUrl();
      if (directLink && String(directLink).trim()) {
        return String(directLink).trim();
      }
      var runs = richText.getRuns ? richText.getRuns() : [];
      for (var r = 0; r < runs.length; r++) {
        var rLink = runs[r].getLinkUrl();
        if (rLink && String(rLink).trim()) {
          return String(rLink).trim();
        }
      }
    } catch (e) {}
  }

  if (formula && typeof formula === 'string') {
    var f = formula.trim();
    if (/^=HYPERLINK\(/i.test(f)) {
      var m = f.match(/^=HYPERLINK\(\s*["']([^"']+)["']/i);
      if (m && m[1]) return m[1].trim();
    }
    var mUrl = f.match(/https?:\/\/[^\s"'\)]+/i);
    if (mUrl && mUrl[0]) return mUrl[0].trim();
  }

  if (val != null) {
    var s = String(val).trim();
    if (/^https?:\/\//i.test(s)) return s;
    if (/^(?:drive|docs)\.google\.com\//i.test(s)) return 'https://' + s;
    var matchInline = s.match(/https?:\/\/[^\s"'<>\)]+/i);
    if (matchInline && matchInline[0]) return matchInline[0].trim();
  }

  return '';
}

function columnToLetter_(col) {
  var temp, letter = '';
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = Math.floor((col - temp - 1) / 26);
  }
  return letter;
}

var DRIVE_FILENAME_CACHE_ = {};
var DRIVE_NFI_CACHE_ = {};

function getDriveFileUrlByName_(fileName) {
  if (!fileName || typeof fileName !== 'string') return '';
  var cleanName = fileName.replace(/^[\s"'“”]+|[\s"'“”]+$/g, '').trim();
  if (!cleanName || cleanName.length < 3) return '';

  if (DRIVE_FILENAME_CACHE_[cleanName] !== undefined) {
    return DRIVE_FILENAME_CACHE_[cleanName];
  }

  try {
    // 1. Cek exact match nama berkas di Drive
    var files = DriveApp.getFilesByName(cleanName);
    if (files.hasNext()) {
      var url = files.next().getUrl();
      DRIVE_FILENAME_CACHE_[cleanName] = url;
      return url;
    }

    // 2. Jika nama berkas memiliki ekstensi (misal .pdf), coba search dengan judul aman
    if (/\.(pdf|docx?|xlsx?|zip|png|jpe?g)$/i.test(cleanName)) {
      var safeName = cleanName.replace(/'/g, "\\'");
      var qFiles = DriveApp.searchFiles("title = '" + safeName + "' and trashed = false");
      if (qFiles.hasNext()) {
        var url2 = qFiles.next().getUrl();
        DRIVE_FILENAME_CACHE_[cleanName] = url2;
        return url2;
      }
    }
  } catch (e) {
    Logger.log('  ⚠️ DriveApp lookup error for "' + cleanName + '": ' + e.message);
  }

  DRIVE_FILENAME_CACHE_[cleanName] = '';
  return '';
}

function getDriveFileUrlByNfi_(nfiNo) {
  if (!nfiNo || typeof nfiNo !== 'string') return '';
  var cleanNfi = nfiNo.trim();
  if (!cleanNfi || cleanNfi.length < 4) return '';

  if (DRIVE_NFI_CACHE_[cleanNfi] !== undefined) {
    return DRIVE_NFI_CACHE_[cleanNfi];
  }

  try {
    var safeNfi = cleanNfi.replace(/'/g, "\\'");
    var files = DriveApp.searchFiles("title contains '" + safeNfi + "' and trashed = false");
    if (files.hasNext()) {
      var url = files.next().getUrl();
      DRIVE_NFI_CACHE_[cleanNfi] = url;
      return url;
    }
  } catch (e) {
    Logger.log('  ⚠️ DriveApp lookup by NFI error: ' + e.message);
  }

  DRIVE_NFI_CACHE_[cleanNfi] = '';
  return '';
}

function fetchSmartChipsMap_(spreadsheetId, sheetName, lastRow, targetColIndices) {
  var chipMap = {};
  if (!targetColIndices || targetColIndices.length === 0 || lastRow <= 1) return chipMap;

  try {
    var validCols = targetColIndices.filter(function(c) { return c >= 0; });
    if (validCols.length === 0) return chipMap;

    var ranges = validCols.map(function(c) {
      var letter = columnToLetter_(c + 1);
      return "'" + sheetName.replace(/'/g, "''") + "'!" + letter + "1:" + letter + lastRow;
    });

    var rangeParam = ranges.map(function(r) { return 'ranges=' + encodeURIComponent(r); }).join('&');
    var fields = 'sheets(data(rowData(values(chipRuns,textFormatRuns,formattedValue))))';
    var url = 'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '?' + rangeParam + '&fields=' + encodeURIComponent(fields);

    var res = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true
    });

    if (res.getResponseCode() === 200) {
      var json = JSON.parse(res.getContentText());
      if (json.sheets && json.sheets[0] && json.sheets[0].data) {
        var dataBlocks = json.sheets[0].data;
        for (var b = 0; b < dataBlocks.length; b++) {
          var targetCol = validCols[b];
          var rowData = dataBlocks[b].rowData || [];
          for (var r = 0; r < rowData.length; r++) {
            var cellValues = rowData[r].values;
            if (!cellValues || cellValues.length === 0) continue;
            var cell = cellValues[0];
            var foundUrl = '';

            // Cek chipRuns (Google Drive Smart Chip)
            if (cell.chipRuns && cell.chipRuns.length > 0) {
              for (var cr = 0; cr < cell.chipRuns.length; cr++) {
                var chip = cell.chipRuns[cr].chip;
                if (chip && chip.richLinkProperties && chip.richLinkProperties.uri) {
                  foundUrl = chip.richLinkProperties.uri;
                  break;
                }
              }
            }

            // Cek textFormatRuns (Hyperlink API)
            if (!foundUrl && cell.textFormatRuns && cell.textFormatRuns.length > 0) {
              for (var tfr = 0; tfr < cell.textFormatRuns.length; tfr++) {
                var fmt = cell.textFormatRuns[tfr].format;
                if (fmt && fmt.link && fmt.link.uri) {
                  foundUrl = fmt.link.uri;
                  break;
                }
              }
            }

            if (foundUrl) {
              chipMap[r + '_' + targetCol] = foundUrl;
            }
          }
        }
        var chipCount = Object.keys(chipMap).length;
        if (chipCount > 0) {
          Logger.log('  🎯 Sheets API Chip Map: Berhasil membaca ' + chipCount + ' link/chip');
        }
      }
    } else {
      Logger.log('  ⚠️ Sheets API Response: ' + res.getResponseCode() + ' (fallback ke DriveApp search)');
    }
  } catch (err) {
    Logger.log('  ⚠️ Sheets API fetchSmartChipsMap_ info: ' + err.message + ' (fallback ke DriveApp)');
  }

  return chipMap;
}

function extractUrlFromCell_(val, formula, richText, nfiNo) {
  // 1. Cek dari RichText (Ctrl+K pada sel atau teks parsial)
  if (richText) {
    try {
      var directLink = richText.getLinkUrl();
      if (directLink && String(directLink).trim()) {
        return String(directLink).trim();
      }
      var runs = richText.getRuns ? richText.getRuns() : [];
      for (var r = 0; r < runs.length; r++) {
        var rLink = runs[r].getLinkUrl();
        if (rLink && String(rLink).trim()) {
          return String(rLink).trim();
        }
      }
    } catch (e) {}
  }

  // 2. Cek dari Formula (=HYPERLINK("https://...", ...))
  if (formula && typeof formula === 'string') {
    var f = formula.trim();
    if (/^=HYPERLINK\(/i.test(f)) {
      var m = f.match(/^=HYPERLINK\(\s*["']([^"']+)["']/i);
      if (m && m[1]) return m[1].trim();
    }
    var mUrl = f.match(/https?:\/\/[^\s"'\)]+/i);
    if (mUrl && mUrl[0]) return mUrl[0].trim();
  }

  // 3. Cek dari Raw Value teks (URL langsung atau nama berkas Drive)
  if (val != null) {
    var s = String(val).trim();
    if (/^https?:\/\//i.test(s)) return s;
    if (/^(?:drive|docs)\.google\.com\//i.test(s)) return 'https://' + s;
    var matchInline = s.match(/https?:\/\/[^\s"'<>\)]+/i);
    if (matchInline && matchInline[0]) return matchInline[0].trim();

    // 4. Cek apakah teks adalah nama berkas (Smart Chip yang dirender jadi nama file, misal *.pdf, *.doc, *.xlsx)
    if (/\.(pdf|docx?|xlsx?|zip|png|jpe?g)$/i.test(s) || /^[0-9]+\.\s+AEI-QC/i.test(s)) {
      var driveUrl = getDriveFileUrlByName_(s);
      if (driveUrl) return driveUrl;
    }
  }

  // 5. Fallback pencarian berkas di Drive berdasarkan No. NFI
  if (nfiNo && typeof nfiNo === 'string' && nfiNo.length >= 4) {
    var nfiDriveUrl = getDriveFileUrlByNfi_(nfiNo);
    if (nfiDriveUrl) return nfiDriveUrl;
  }

  return '';
}

function findNfiTabSmart_(sheets) {
  var kandidat = [];
  for (var s = 0; s < sheets.length; s++) {
    var tabNameRaw = sheets[s].getName();
    var tabName = tabNameRaw.toLowerCase().trim();
    if (!hasNfiHeader_(sheets[s])) continue;

    var lastRow = sheets[s].getLastRow();
    var skor = 0;
    if (tabName === 'register nfi' || tabName === 'register rfi') skor = 100;
    else if (tabName.indexOf('regist') !== -1 && (tabName.indexOf('nfi') !== -1 || tabName.indexOf('rfi') !== -1)) skor = 95;
    else if (tabName.indexOf('regist') !== -1) skor = 90;
    else if (tabName.indexOf('summary') !== -1 && tabName.indexOf('nfi') !== -1) skor = 20;
    else if (tabName === 'nfi' || tabName === 'rfi') skor = 30;
    else if (tabName.indexOf('nfi') !== -1 || tabName.indexOf('rfi') !== -1) skor = 50;
    else skor = 10;

    kandidat.push({ sheet: sheets[s], nama: tabNameRaw, baris: lastRow, skor: skor });
  }

  if (kandidat.length === 0) return null;
  kandidat.sort(function (a, b) {
    if (b.skor !== a.skor) return b.skor - a.skor;
    return b.baris - a.baris;
  });
  return kandidat[0].sheet;
}

function hasNfiHeader_(sheet) {
  try {
    var lastR = sheet.getLastRow();
    var lastC = sheet.getLastColumn();
    if (lastR === 0 || lastC === 0) return false;

    var data = sheet.getRange(1, 1, Math.min(15, lastR), Math.min(25, lastC)).getValues();
    for (var r = 0; r < data.length; r++) {
      for (var c = 0; c < data[r].length; c++) {
        var h = String(data[r][c] || '')
          .replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
        if (h === 'no. nfi' || h === 'no nfi' || h === 'no.nfi' ||
            h === 'nfi no' || h === 'nfi no.' || h === 'nfi' ||
            h === 'no. rfi' || h === 'no rfi' || h === 'no.rfi' ||
            h.indexOf('no. nfi') !== -1 || h.indexOf('no nfi') !== -1) {
          return true;
        }
      }
    }
    return false;
  } catch (e) { return false; }
}

function getVal_(row, idx) {
  if (idx < 0 || idx >= row.length) return '';
  var v = row[idx];
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function fmtDate_(val) {
  if (!val) return '';
  if (val instanceof Date) {
    try { return Utilities.formatDate(val, 'Asia/Jakarta', 'yyyy-MM-dd'); }
    catch (e) { return ''; }
  }
  return String(val).trim();
}

function logSync_(sheet, code, total, newC, updC, skipC, status, note) {
  sheet.appendRow([new Date(), code, total, newC, updC, skipC, status, note || '']);
}


// ═══════════════════════════════════════════════════════════════════════════
// DEBUG & RESET
// ═══════════════════════════════════════════════════════════════════════════

function resetAllDocuments() {
  var ss = SpreadsheetApp.openById(MASTER_ID);
  var sheet = ss.getSheetByName(TAB_DOCS);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, HEADER_DOCS.length).clearContent();
  }
  Logger.log('✅ ALL_DOCUMENTS dibersihkan');
  return { success: true, message: 'Dibersihkan' };
}

function fixColumnFormat() {
  var ss = SpreadsheetApp.openById(MASTER_ID);
  var sheet = ss.getSheetByName(TAB_DOCS);
  sheet.getRange('A:A').setNumberFormat('@');
  Logger.log('✅ Kolom A di ALL_DOCUMENTS di-set sebagai TEXT');
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER — Expand ITR Range (Koma sebagai Rentang, "s/d", dll)
// ═══════════════════════════════════════════════════════════════════════════

function expandItrRange_(rawText) {
  if (!rawText) return [];
  var text = String(rawText).trim();
  if (!text) return [];

  // 1. Normalisasi pemisah "s/d" jadi baris baru
  text = text.replace(/\s+s\/d\s+/gi, '\n');

  // 2. Split berdasarkan baris baru, koma, atau titik koma
  var parts = text.split(/[\n,;]+/)
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s; });

  if (parts.length === 0) return [];

  // 3. PERBAIKAN PREFIX: Pastikan semua part punya prefix
  var lastPrefix = '';
  var partsWithPrefix = [];
  for (var i = 0; i < parts.length; i++) {
    var item = parts[i];
    var m = item.match(/^(.*?)(\d+)\s*$/);
    if (m) {
      var p = m[1];
      var n = m[2];
      if (p) {
        lastPrefix = p;
        partsWithPrefix.push({ prefix: p, numStr: n, original: item });
      } else {
        // Tidak ada prefix, gunakan lastPrefix
        partsWithPrefix.push({ prefix: lastPrefix, numStr: n, original: lastPrefix + n });
      }
    } else {
      // Bukan format teks+angka
      partsWithPrefix.push({ prefix: '', numStr: '', original: item });
    }
  }

  // 4. Cek apakah semua part punya prefix yang sama & berbentuk angka
  var allMatch = true;
  var basePrefix = partsWithPrefix[0].prefix.replace(/\s/g, '');
  for (var j = 0; j < partsWithPrefix.length; j++) {
    if (!partsWithPrefix[j].numStr || partsWithPrefix[j].prefix.replace(/\s/g, '') !== basePrefix) {
      allMatch = false;
      break;
    }
  }

  // 5. Jika semua part adalah angka dengan prefix yang sama → expand jadi rentang
  if (allMatch && partsWithPrefix.length >= 2) {
    var numbers = partsWithPrefix.map(function(item) { return parseInt(item.numStr, 10); });
    numbers.sort(function (a, b) { return a - b; });

    var minNum = numbers[0];
    var maxNum = numbers[numbers.length - 1];

    // Batasi maksimum 500 angka agar tidak timeout
    if ((maxNum - minNum) <= 500) {
      var padding = Math.max(
        partsWithPrefix[0].numStr.length,
        partsWithPrefix[partsWithPrefix.length - 1].numStr.length
      );
      var result = [];
      for (var n = minNum; n <= maxNum; n++) {
        result.push(partsWithPrefix[0].prefix + String(n).padStart(padding, '0'));
      }
      return result;
    }
  }

  // 6. Jika tidak memenuhi syarat rentang, kembalikan hasil yang sudah diperbaiki prefix-nya
  return partsWithPrefix.map(function(item) { return item.original; });
}

// Fungsi ini tetap dipertahankan untuk kompatibilitas
function expandRangeInto_(outArr, startText, endText) {
  var sM = String(startText).match(/^(.*?)(\d+)\s*$/);
  var eM = String(endText).match(/^(.*?)(\d+)\s*$/);

  if (!sM || !eM) {
    outArr.push(startText + ' s/d ' + endText);
    return;
  }

  var sPrefix = sM[1];
  var sNumStr = sM[2];
  var ePrefix = eM[1];
  var eNumStr = eM[2];

  var sNum = parseInt(sNumStr, 10);
  var eNum = parseInt(eNumStr, 10);

  if (isNaN(sNum) || isNaN(eNum) || eNum < sNum || (eNum - sNum) > 500) {
    outArr.push(startText + ' s/d ' + endText);
    return;
  }

  var prefix = sPrefix.length >= ePrefix.length ? sPrefix : ePrefix;
  var padding = Math.max(sNumStr.length, eNumStr.length);

  for (var n = sNum; n <= eNum; n++) {
    outArr.push(prefix + String(n).padStart(padding, '0'));
  }
}
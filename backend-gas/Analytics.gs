/**
 * ============================================================================
 * QC-CMS ANALYTICS — Aging, Trend, Drill-down, Filter
 * ============================================================================
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. AGING ANALYSIS (Umur Dokumen Open)
// ═══════════════════════════════════════════════════════════════════════════

function getAgingAnalysis(projectCode) {
  try {
    var ss = SpreadsheetApp.openById(MASTER_ID);
    var sheetDocs = ss.getSheetByName(TAB_DOCS);
    var data = sheetDocs.getDataRange().getValues();

    var needle = normCodeProject_(projectCode);
    var buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0 };
    var bucketDetails = { '0-30': [], '31-60': [], '61-90': [], '>90': [] };
    var totalOpen = 0;
    var totalAge = 0;
    var maxAge = 0;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (normCodeProject_(row[0]) !== needle) continue;

      var status = String(row[14] || '').trim().toLowerCase();
      if (status !== 'open') continue;

      var issuedVal = row[5];
      if (!issuedVal) continue;

      var issued = issuedVal instanceof Date ? issuedVal : new Date(issuedVal);
      if (isNaN(issued.getTime())) continue;

      var ageDays = Math.floor((new Date() - issued) / 86400000);
      if (ageDays < 0) ageDays = 0;

      totalOpen++;
      totalAge += ageDays;
      if (ageDays > maxAge) maxAge = ageDays;

      var bucketKey;
      if (ageDays <= 30) bucketKey = '0-30';
      else if (ageDays <= 60) bucketKey = '31-60';
      else if (ageDays <= 90) bucketKey = '61-90';
      else bucketKey = '>90';

      buckets[bucketKey]++;
      bucketDetails[bucketKey].push({
        noNFI: String(row[1] || ''),
        itrNo: String(row[10] || ''),
        subject: String(row[2] || ''),
        discipline: String(row[6] || ''),
        typeInsp: String(row[4] || ''),
        pic: String(row[15] || ''),
        issuedDate: issued.toISOString().slice(0, 10),
        ageDays: ageDays,
        link: String(row[17] || '')
      });
    }

    return {
      success: true,
      totalOpen: totalOpen,
      avgAge: totalOpen > 0 ? Math.round(totalAge / totalOpen) : 0,
      maxAge: maxAge,
      buckets: buckets,
      details: bucketDetails
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. TREND ANALYSIS (Tren Bulanan)
// ═══════════════════════════════════════════════════════════════════════════

function getTrendData(projectCode, monthsBack) {
  try {
    monthsBack = monthsBack || 6;
    var ss = SpreadsheetApp.openById(MASTER_ID);
    var sheetDocs = ss.getSheetByName(TAB_DOCS);
    var data = sheetDocs.getDataRange().getValues();

    var needle = normCodeProject_(projectCode);
    var now = new Date();
    var trend = {};

    // Inisialisasi 6 bulan terakhir
    for (var m = monthsBack - 1; m >= 0; m--) {
      var d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      trend[key] = { month: key, label: getMonthLabel_(d), opened: 0, closed: 0, total: 0 };
    }

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (normCodeProject_(row[0]) !== needle) continue;

      var issuedVal = row[5];
      var inspVal = row[8];
      var status = String(row[14] || '').trim().toLowerCase();

      // Hitung "opened" berdasarkan Issued Date
      if (issuedVal) {
        var issued = issuedVal instanceof Date ? issuedVal : new Date(issuedVal);
        if (!isNaN(issued.getTime())) {
          var keyIssue = issued.getFullYear() + '-' + String(issued.getMonth() + 1).padStart(2, '0');
          if (trend[keyIssue]) {
            trend[keyIssue].opened++;
            trend[keyIssue].total++;
          }
        }
      }

      // Hitung "closed" berdasarkan Inspection Date + status closed
      if (status === 'closed' && inspVal) {
        var insp = inspVal instanceof Date ? inspVal : new Date(inspVal);
        if (!isNaN(insp.getTime())) {
          var keyInsp = insp.getFullYear() + '-' + String(insp.getMonth() + 1).padStart(2, '0');
          if (trend[keyInsp]) trend[keyInsp].closed++;
        }
      }
    }

    return {
      success: true,
      data: Object.values(trend)
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getMonthLabel_(d) {
  var bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return bulan[d.getMonth()] + ' ' + String(d.getFullYear()).slice(-2);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. DRILL-DOWN (Detail berdasarkan Filter)
// ═══════════════════════════════════════════════════════════════════════════

function getDrillDownData(filters) {
  try {
    filters = filters || {};
    var ss = SpreadsheetApp.openById(MASTER_ID);
    var sheetDocs = ss.getSheetByName(TAB_DOCS);
    var data = sheetDocs.getDataRange().getValues();

    var items = [];
    var projectNeedle = filters.project ? normCodeProject_(filters.project) : null;
    var statusFilter = filters.status ? String(filters.status).toLowerCase() : null;
    var disciplineFilter = filters.discipline ? String(filters.discipline).toLowerCase() : null;
    var typeFilter = filters.typeInsp ? String(filters.typeInsp).toLowerCase() : null;
    var ageBucket = filters.ageBucket || null;
    var dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
    var dateTo = filters.dateTo ? new Date(filters.dateTo) : null;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];

      if (projectNeedle && normCodeProject_(row[0]) !== projectNeedle) continue;

      var status = String(row[14] || '').trim().toLowerCase();
      if (statusFilter) {
        if (statusFilter === 'open' && status !== 'open') continue;
        if (statusFilter === 'closed' && status !== 'closed') continue;
        if (statusFilter === 'canceled' && status.indexOf('cancel') === -1) continue;
        if (statusFilter === 'other' && (status === 'open' || status === 'closed' || status.indexOf('cancel') !== -1)) continue;
      }

      if (disciplineFilter) {
        var disc = String(row[6] || '').trim().toLowerCase();
        if (disc !== disciplineFilter) continue;
      }

      if (typeFilter) {
        var ti = String(row[4] || '').trim().toLowerCase();
        if (ti !== typeFilter) continue;
      }

      // Aging bucket
      if (ageBucket) {
        var issuedVal = row[5];
        if (!issuedVal) continue;
        var issued = issuedVal instanceof Date ? issuedVal : new Date(issuedVal);
        if (isNaN(issued.getTime())) continue;
        var ageDays = Math.floor((new Date() - issued) / 86400000);
        var bKey = ageDays <= 30 ? '0-30' : ageDays <= 60 ? '31-60' : ageDays <= 90 ? '61-90' : '>90';
        if (bKey !== ageBucket) continue;
      }

      // Date range
      if (dateFrom || dateTo) {
        var issuedVal2 = row[5];
        if (!issuedVal2) continue;
        var issued2 = issuedVal2 instanceof Date ? issuedVal2 : new Date(issuedVal2);
        if (isNaN(issued2.getTime())) continue;
        if (dateFrom && issued2 < dateFrom) continue;
        if (dateTo && issued2 > dateTo) continue;
      }

      items.push({
        project: String(row[0] || ''),
        noNFI: String(row[1] || ''),
        subject: String(row[2] || ''),
        typeInsp: String(row[4] || ''),
        issuedDate: fmtDate_(row[5]),
        discipline: String(row[6] || ''),
        location: String(row[7] || ''),
        inspDate: fmtDate_(row[8]),
        result: String(row[9] || ''),
        itrNo: String(row[10] || ''),
        itpNo: String(row[11] || ''),
        status: String(row[14] || ''),
        pic: String(row[15] || ''),
        remark: String(row[16] || ''),
        link: String(row[17] || '')
      });
    }

    return { success: true, items: items, count: items.length };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. BREAKDOWN PER DISIPLIN & TIPE (untuk chart)
// ═══════════════════════════════════════════════════════════════════════════

function getBreakdownByDiscipline(projectCode) {
  try {
    var ss = SpreadsheetApp.openById(MASTER_ID);
    var sheetDocs = ss.getSheetByName(TAB_DOCS);
    var data = sheetDocs.getDataRange().getValues();

    var needle = normCodeProject_(projectCode);
    var byDiscipline = {};
    var byType = {};

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (normCodeProject_(row[0]) !== needle) continue;

      var disc = String(row[6] || '(kosong)').trim();
      disc = disc.charAt(0).toUpperCase() + disc.slice(1).toLowerCase();

      var status = String(row[14] || '').trim().toLowerCase();
      if (!byDiscipline[disc]) byDiscipline[disc] = { open: 0, closed: 0, canceled: 0, other: 0, total: 0 };
      byDiscipline[disc].total++;

      if (status === 'closed') byDiscipline[disc].closed++;
      else if (status === 'open') byDiscipline[disc].open++;
      else if (status.indexOf('cancel') !== -1) byDiscipline[disc].canceled++;
      else byDiscipline[disc].other++;

      var ti = String(row[4] || '(kosong)').trim();
      if (!byType[ti]) byType[ti] = 0;
      byType[ti]++;
    }

    return { success: true, byDiscipline: byDiscipline, byType: byType };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. BACKLOG ANALYSIS — Total dokumen belum selesai
// ═══════════════════════════════════════════════════════════════════════════

function getBacklogData(projectCode) {
  try {
    var ss = SpreadsheetApp.openById(MASTER_ID);
    var sheetDocs = ss.getSheetByName(TAB_DOCS);
    var data = sheetDocs.getDataRange().getValues();

    var needle = normCodeProject_(projectCode);
    var total = 0;
    var open = 0;
    var closed = 0;
    var canceled = 0;
    var other = 0;

    // Backlog per bulan (untuk mini trend)
    var byMonth = {};

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (normCodeProject_(row[0]) !== needle) continue;

      total++;
      var status = String(row[14] || '').trim().toLowerCase();

      if (status === 'closed') closed++;
      else if (status === 'open') open++;
      else if (status.indexOf('cancel') !== -1) canceled++;
      else other++;

      // Kelompokkan berdasarkan Issued Date
      var issuedVal = row[5];
      if (issuedVal) {
        var issued = issuedVal instanceof Date ? issuedVal : new Date(issuedVal);
        if (!isNaN(issued.getTime())) {
          var key = issued.getFullYear() + '-' + String(issued.getMonth() + 1).padStart(2, '0');
          if (!byMonth[key]) byMonth[key] = { opened: 0, closed: 0 };
          byMonth[key].opened++;
          if (status === 'closed') byMonth[key].closed++;
        }
      }
    }

    // Hitung backlog total (yang belum selesai)
    var backlog = total - closed - canceled;
    var completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;
    var backlogRate = total > 0 ? Math.round((backlog / total) * 100) : 0;

    return {
      success: true,
      total: total,
      open: open,
      closed: closed,
      canceled: canceled,
      other: other,
      backlog: backlog,
      completionRate: completionRate,
      backlogRate: backlogRate,
      byMonth: byMonth
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
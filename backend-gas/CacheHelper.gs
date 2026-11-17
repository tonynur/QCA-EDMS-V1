/**
 * ============================================================================
 * CACHE HELPER — Percepat akses data statis
 * ============================================================================
 * Data yang cocok di-cache:
 *   - Daftar proyek, disiplin, jenis dokumen, tipe NFI
 *   - Settings, config, master data lain
 *
 * Data yang JANGAN di-cache:
 *   - Dokumen list (sering berubah)
 *   - Notifikasi user (personal)
 *   - Session/audit log
 */

var CACHE_TTL = 300; // 5 menit

/** Ambil dari cache, atau jalankan fn() kalau cache kosong. */
function withCache_(key, ttl, fn) {
  try {
    var cache = CacheService.getScriptCache();
    var hit = cache.get(key);
    if (hit) {
      try { return JSON.parse(hit); } catch (e) { /* corrupt, fallthrough */ }
    }
    var fresh = fn();
    try { cache.put(key, JSON.stringify(fresh), ttl || CACHE_TTL); } catch (e) { /* too big, skip */ }
    return fresh;
  } catch (e) {
    // Kalau cache error, tetap jalankan fn() supaya app tidak crash
    return fn();
  }
}

/** Hapus 1 key cache. */
function invalidateCache_(key) {
  try { CacheService.getScriptCache().remove(key); } catch (e) { Logger.log('invalidateCache_ gagal untuk key=' + key + ': ' + e.message); }
}

/** Hapus beberapa key sekaligus. */
function invalidateCacheMulti_(keys) {
  try { CacheService.getScriptCache().removeAll(keys); } catch (e) { Logger.log('invalidateCacheMulti_ gagal: ' + e.message); }
}

/** Prefix key cache biar rapi. */
var CK = {
  PROJECTS:   'qccms_projects_v1',
  DISCIPLINES:'qccms_disciplines_v1',
  DOCTYPES:   'qccms_doctypes_v1',
  NFI_TYPES:  'qccms_nfi_types_v1',
  SETTINGS:   'qccms_settings_v1',
  USERS:      'qccms_users_v1'
};
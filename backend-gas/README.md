# Panduan Pemasangan Backend Google Apps Script (QC-CMS EDMS)
**PT Asuka Engineering Indonesia**

Folder ini berisi seluruh file kode sumber Google Apps Script (`.gs`) versi terbaru yang berfungsi sebagai backend API dan terhubung langsung ke Google Sheets & Google Drive.

---

## 📁 Daftar File & Fungsinya

1. **`kode.gs`** (316 KB)
   - Core API Router (`doGet`, `doPost`, `handleApiRequest_`).
   - Autentikasi pengguna, manajemen sesi, dan RBAC.
   - Modul Dokumen Mutu (ITP, ITR, FAT, RFI, MRIR), revisi, dan approval token.
   - Modul Transmittal, Laporan Lapangan (Site Reports), Audit Log, dan Notifikasi.

2. **`AI.gs`** (104 KB)
   - Integrasi model AI (Nous Hermes / OpenHermes via OpenRouter, Groq Cloud, dan Google Gemini).
   - `aiScanCertificate`: OCR pemindai sertifikat kalibrasi.
   - `aiGenerateNCR`: Asisten penyusun deskripsi & rekomendasi teknis NCR otomatis.
   - `aiValidateMTR`: Validasi sertifikat uji material (Mill Test Report).

3. **`Calibration.gs`** (24.8 KB)
   - Modul registrasi dan monitoring kalibrasi 335+ alat ukur.
   - Pembacaan tab `LIST CALIBRATION PER DISCIPLINE` & `Calibration_Tools`.
   - Logika status alat: VALID, EXPIRING SOON, EXPIRED.

4. **`NCR.gs`** (16.3 KB)
   - Modul monitoring Non Conformance Record (Form `[FR-IMS-QCA-007]`).
   - Pengambilan register `NCR Register All_Project`.
   - Manajemen upload bukti/foto ke Google Drive folder `qca edms v3`.

5. **`Sync.gs`** (69.2 KB)
   - Engine sinkronisasi Master Hub (`ALL_DOCUMENTS`, `PROJECTS`, `SYNC_LOG`).
   - Penjadwalan otomatis jam-an (*Hourly Trigger*).

6. **`Analytics.gs`** (13.5 KB)
   - Kalkulasi metrik KPI eksekutif, analisis aging dokumen, dan tren bulanan.

7. **`CacheHelper.gs`** (1.7 KB)
   - Cache layer untuk mempercepat response time query data besar.

8. **`PreviewApi.gs`** (2.9 KB)
   - Resolver tautan preview dokumen Google Drive agar dapat dibuka langsung di aplikasi.

---

## 🚀 Langkah Deploy ke Google Apps Script

1. Buat Google Spreadsheet baru (atau buka spreadsheet yang sudah ada).
2. Di menu atas, klik **Extensions > Apps Script** (Ekstensi > Apps Script).
3. Buat file-file script di Apps Script Editor dengan nama yang sama persis:
   - `Code.gs` (paste isi dari `kode.gs`)
   - `AI.gs` (paste isi dari `AI.gs`)
   - `Calibration.gs` (paste isi dari `Calibration.gs`)
   - `NCR.gs` (paste isi dari `NCR.gs`)
   - `Sync.gs` (paste isi dari `Sync.gs`)
   - `Analytics.gs` (paste isi dari `Analytics.gs`)
   - `CacheHelper.gs` (paste isi dari `CacheHelper.gs`)
   - `PreviewApi.gs` (paste isi dari `PreviewApi.gs`)
4. Jalankan fungsi `initializeSystem()` sekali dari `Code.gs` untuk menyiapkan tab-tab default di spreadsheet.
5. Klik tombol biru **Deploy > New Deployment**:
   - Pilih jenis: **Web app**
   - Description: `QCA EDMS Backend Production`
   - Execute as: **Me** (akun Google Anda)
   - Who has access: **Anyone** (Siapa saja, agar Next.js bisa memanggil API)
6. Salin **Web App URL** yang dihasilkan (contoh: `https://script.google.com/macros/s/AKfycb.../exec`).
7. Buka file `.env.local` di folder Next.js ini, lalu tempel URL tersebut:
   ```env
   GAS_EXEC_URL=https://script.google.com/macros/s/AKfycb.../exec
   ```

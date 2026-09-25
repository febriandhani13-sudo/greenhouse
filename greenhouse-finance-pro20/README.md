# GREENHOUSE FINANCE PRO 🌿
### Sistem Manajemen Keuangan & Produksi Greenhouse Melon Terintegrasi (DFT 2-Tunnel)

GREENHOUSE FINANCE PRO adalah sistem manajemen agribisnis 100% **Client-Side Web App** khusus untuk greenhouse melon berbasis **Deep Flow Technique (DFT)** dengan 2 tunnel (8 × 48 meter per tunnel, total 16 × 48 meter).

Aplikasi ini berjalan mandiri di browser dan perangkat mobile tanpa backend server, tanpa database cloud berbayar, tanpa Google Sheets, dan tanpa REST API eksternal. Semua data tersimpan aman dan privat di database internal perangkat (**IndexedDB**).

---

## 1. Arsitektur Aplikasi (Client-Side Web App)

```text
React 19 + TypeScript + Vite
       ↓
Local Data Service (`src/services/localDataService.ts`)
       ↓
IndexedDB (`src/services/storage.ts` via idb)
       ↓
Browser Storage (IndexedDB)
```

- **Frontend:** React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons
- **Database:** IndexedDB (Local in-browser database)
- **Data Service:** `localDataService` & `backupService`
- **Export & Backup:** Client-side Blob generation (JSON & CSV)
- **Ketergantungan Eksternal:** **0 (Nol)** — Tidak ada Node/Express server, REST API, Google Sheets, Google Form, ataupun Shortcut webhook.

---

## 2. Fitur & Modul Utama

1. **Dashboard Eksekutif Finansial & Operasional:**
   - 4 Kartu KPI Utama: **Saldo Kas Riil**, **Omzet Penjualan**, **Laba Bersih**, dan **Modal Belum Kembali**
   - Grafik Cash Flow bulanan (Pemasukan vs Pengeluaran)
   - Grafik Evaluasi Omzet vs Biaya Produksi vs Laba per Siklus
   - Status Aktif Tunnel 1 & Tunnel 2
   - Metrik Produksi: Total kg panen, target panen, dan HPP rata-rata per kg
   - Indikator Payback Investasi & Progres Pengembalian Modal
   - Daftar 5 Transaksi Keuangan Terbaru

2. **Buku Transaksi Digital:**
   - Pencatatan Pemasukan & Pengeluaran cepat
   - Pengelompokan: Produksi Siklus, Operasional Rutin, Investasi Awal, Penjualan Melon, Modal Pemilik, Pinjaman
   - Tagging Tunnel (Tunnel 1, Tunnel 2, Kedua Tunnel, Umum) dan Siklus Tanam
   - Filter lengkap berdasarkan jenis, kelompok, rentang tanggal, dan pencarian kata kunci
   - **Ekspor CSV Transaksi** langsung dibuat di browser via Blob

3. **Siklus Tanam (Crop Cycles):**
   - Pencatatan siklus tanam per tunnel (varietas, jumlah bibit, tanggal semai, tanggal panen, status)
   - Pelacakan tanaman hidup, mati, dan persentase survival rate
   - Drawer rincian 8 komponen biaya produksi: Benih, Pupuk AB Mix, Media Tanam, Pestisida & Fungisida, Listrik Pompa, Air Baku, Tenaga Kerja/Perawatan, dan Kemasan Box
   - Rekapitulasi otomatis HPP per kg dan HPP per tanaman

4. **Panen & Penjualan Melon:**
   - Mendukung panen bertingkat (multiple harvests) dalam satu siklus
   - Sortasi grading: Grade A, Grade B, dan Grade C
   - Kalkulasi otomatis total bobot (kg), rata-rata bobot per buah (kg/buah), dan total penerimaan omzet
   - Integrasi otomatis penambahan saldo kas dan pencatatan riwayat transaksi penjualan
   - **Ekspor CSV Panen** client-side

5. **Belanja Investasi (Capital Expenditure):**
   - Pencatatan modal awal pembangunan greenhouse (bambu petung, atap UV, insect net, tandon 5000L, pipa DFT, listrik, dll.)
   - Opsi otomatisasi pendaftaran ke modul Inventaris Aset
   - **Prinsip Finansial Baku:** Biaya investasi dipisahkan dari biaya produksi harian/siklus, murni untuk kalkulasi nilai aset, BEP, ROI, dan payback period
   - **Ekspor CSV Investasi** client-side

6. **Inventaris & Mutasi Stok Saprotan:**
   - Pemantauan stok benih, AB mix, cocopeat/rockwool, pestisida, lakban, dan dus kemasan
   - Alert peringatan otomatis saat stok berada di bawah batas minimum
   - Riwayat mutasi stok: Stok Masuk, Stok Keluar, dan Penyesuaian (Stock Opname)
   - **Ekspor CSV Inventaris** client-side

7. **Manajemen Aset Greenhouse:**
   - Pencatatan aktiva tetap kebun, tahun perolehan, masa manfaat/umur ekonomis, dan estimasi nilai penyusutan
   - Pemantauan kondisi fisik aset (Sangat Baik, Baik, Perlu Perbaikan, Rusak)

8. **Hutang & Piutang:**
   - Pelacakan kewajiban hutang ke supplier saprotan dan piutang penjualan melon ke pembeli/supermarket
   - Pencatatan pembayaran cicilan/termin bertahap
   - Indikator status: Belum Lunas, Sebagian, Lunas, Jatuh Tempo
   - **Ekspor CSV Hutang/Piutang** client-side

9. **Laporan Keuangan & Analisis BEP:**
   - Laporan Laba Rugi komprehensif (Omzet - Biaya Produksi = Laba Kotor; Laba Kotor - Biaya Operasional = Laba Bersih)
   - Kalkulator Break-Even Point (BEP Unit Kg dan BEP Rupiah) interaktif
   - Analisis ROI (Return on Investment) dan estimasi waktu Payback Period

10. **Pengaturan, Backup & Pemulihan Data:**
    - Konfigurasi nama kebun, dimensi tunnel, kapasitas tanaman, saldo awal kas, dan target harga jual
    - **Backup JSON:** Unduh seluruh isi database IndexedDB ke 1 file JSON cadangan
    - **Restore JSON:** Pulihkan database dari file cadangan dengan dialog konfirmasi aman
    - **Reset ke Demo:** Muat kembali contoh data benchmark (2 tunnel DFT, panen 1.000 kg, omzet Rp 25 jt)
    - **Kosongkan Database:** Hapus semua data demo untuk mulai pembukuan kebun riil dari nol

---

## 3. Parameter Finansial & Formula Benchmark

- **Spesifikasi Greenhouse:**
  - 2 Tunnel (Tunnel 1 & Tunnel 2)
  - Ukuran: 8 × 48 meter per tunnel (Total 16 × 48 meter, 768 m²)
  - Rangka utama: Bambu Petung Super bertulang cor beton
  - Atap & Dinding: UV Plastic 200 micron (14% additive) & Insect Net 50 mesh
  - Sistem: DFT sirkulasi tandon 5.000 liter + pompa submersible flow tinggi
  - Kapasitas: 1.000 titik tanam per tunnel (total 2.000 tanaman)

- **Formula Finansial yang Diterapkan:**
  - **HPP / Kg:** `Total Biaya Produksi Siklus ÷ Total Kg Panen Siklus`
  - **HPP / Tanaman:** `Total Biaya Produksi Siklus ÷ Jumlah Tanaman Siklus`
  - **Laba Kotor:** `Omzet Penjualan - Total Biaya Produksi`
  - **Laba Bersih:** `Laba Kotor - Biaya Operasional Umum`
  - **Saldo Kas Riil:** `Saldo Awal + Total Uang Masuk Kas - Total Uang Keluar Kas`
  - **BEP (Kg):** `Biaya Tetap ÷ (Harga Jual/Kg - Biaya Variabel/Kg)`
  - **BEP (Rupiah):** `BEP Kg × Harga Jual/Kg`
  - **ROI Sederhana:** `(Akumulasi Laba Bersih ÷ Total Investasi) × 100%`
  - **Modal Belum Kembali:** `Total Investasi - Akumulasi Laba Bersih yang Dialokasikan`

- **Benchmark Data Uji (Siklus 001 Tunnel 1):**
  - Investasi Pembangunan = Rp 100.000.000
  - Biaya Produksi Siklus = Rp 10.000.000
  - Biaya Operasional = Rp 2.000.000
  - Hasil Panen = 1.000 kg (Grade A: 750 kg, Grade B: 200 kg, Grade C: 50 kg)
  - Harga Jual Rata-rata = Rp 25.000 / kg
  - **Omzet Penjualan:** `Rp 25.000.000`
  - **HPP / Kg:** `Rp 10.000 / kg`
  - **Laba Kotor:** `Rp 15.000.000`
  - **Laba Bersih:** `Rp 13.000.000`
  - **Modal Belum Kembali:** `Rp 87.000.000`
  - **ROI Sederhana:** `13.00%`

---

## 4. Penyimpanan Data & Backup

- **Storage:** Data transaksi, panen, aset, inventaris, greenhouse, tunnel, dan pengaturan disimpan di IndexedDB browser pada perangkat yang digunakan.
- **Mode aplikasi:** Aplikasi dijalankan sebagai web app biasa dan **tidak menyediakan mode offline/service worker/PWA cache**.
- **Backup:** Gunakan menu Pengaturan untuk mengunduh backup JSON secara berkala. File backup dapat dipindahkan dan dipulihkan melalui fitur Restore.

## 5. Penggunaan di iPhone

Aplikasi tetap menggunakan desain mobile-first dan dapat dibuka melalui browser Safari/Chrome. Tidak ada fitur PWA/offline khusus yang dipasang oleh aplikasi.

## 6. Build & Static Deployment

Aplikasi ini adalah situs statis murni yang dapat di-deploy ke penyedia hosting statis mana pun (Cloudflare Pages, Vercel, Netlify, GitHub Pages, Firebase Hosting, atau AWS S3):

```bash
# 1. Validasi tipe TypeScript
npm run lint

# 2. Build aset produksi ke folder /dist
npm run build

# 3. Jalankan preview lokal
npm run preview
```

Output folder `dist/` berisi file HTML, JS, CSS, aset HTML, JavaScript, CSS, dan ikon statis yang siap disajikan oleh web server statis tanpa kebutuhan runtime Node.js.

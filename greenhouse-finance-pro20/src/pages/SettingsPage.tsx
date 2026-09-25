import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { dataService } from '../services/localDataService.js';
import { AppSettings } from '../types/index.js';
import { formatRupiah, formatNumber } from '../utils/formatters.js';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Warehouse,
  Coins,
  Database,
  HardDrive,
  FileSpreadsheet,
  Trash2,
  Check,
  Info
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettingsState, showToast, refreshData } = useApp();

  const [formData, setFormData] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);
  
  // Restore Confirmation State
  const [pendingRestoreData, setPendingRestoreData] = useState<any | null>(null);
  const [pendingRestoreFileName, setPendingRestoreFileName] = useState<string>('');
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  
  // Storage Info
  const [storageEstimate, setStorageEstimate] = useState<{ usage: string; quota: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        const usageMb = est.usage ? (est.usage / (1024 * 1024)).toFixed(2) + ' MB' : '0 MB';
        const quotaMb = est.quota ? (est.quota / (1024 * 1024)).toFixed(0) + ' MB' : 'N/A';
        setStorageEstimate({ usage: usageMb, quota: quotaMb });
      }).catch(() => {});
    }
  }, []);

  if (!formData) {
    return <div className="p-8 text-center text-xs text-stone-500">Memuat pengaturan...</div>;
  }

  // Handle dimensions calculation
  const handleDimensionChange = (panjang: number, lebar: number, jumlahTunnel: number) => {
    const luasPerTunnel = panjang * lebar;
    const luasTotal = luasPerTunnel * jumlahTunnel;
    setFormData(prev => prev ? ({
      ...prev,
      panjangTunnelM: panjang,
      lebarTunnelM: lebar,
      jumlahTunnel: jumlahTunnel,
      luasTotalM2: luasTotal,
      dimensiTunnel: `${lebar} × ${panjang} meter`,
      totalDimensi: `${lebar * jumlahTunnel} × ${panjang} meter (${luasTotal} m²)`
    }) : null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await dataService.updateSettings(formData);
      updateSettingsState(updated);
      showToast('Pengaturan greenhouse & keuangan berhasil disimpan!', 'success');
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDemo = async () => {
    try {
      await dataService.resetToDemo();
      showToast('Database berhasil di-reset ke data demo greenhouse awal!', 'success');
      setIsResetConfirmOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mereset data', 'error');
    }
  };

  const handleWipeData = async () => {
    try {
      await dataService.resetToEmpty();
      showToast('Database telah dikosongkan total. Siap untuk pencatatan riil!', 'success');
      setIsWipeConfirmOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengosongkan database', 'error');
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingRestoreFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json || typeof json !== 'object') {
          throw new Error('File JSON tidak valid atau kosong');
        }
        setPendingRestoreData(json);
        setIsRestoreConfirmOpen(true);
      } catch (err: any) {
        showToast('Format file backup JSON tidak valid: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    // reset input value so re-uploading same file triggers change
    e.target.value = '';
  };

  const handleExecuteRestore = async () => {
    if (!pendingRestoreData) return;
    try {
      const res = await dataService.restoreBackup(pendingRestoreData);
      showToast(`Restore berhasil! ${res.count} data riil dipulihkan ke IndexedDB.`, 'success');
      setIsRestoreConfirmOpen(false);
      setPendingRestoreData(null);
      refreshData();
    } catch (err: any) {
      showToast('Gagal memulihkan database: ' + err.message, 'error');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-5xl mx-auto pb-28 lg:pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-stone-900 tracking-tight">
          Pengaturan & Manajemen Data
        </h2>
        <p className="text-xs lg:text-sm text-stone-500 mt-0.5">
          Konfigurasi greenhouse, profil usaha, parameter finansial, backup JSON, dan export CSV lokal
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* BAGIAN 1: PROFIL USAHA & GREENHOUSE */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Warehouse className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-stone-900 text-sm">Profil Usaha & Lokasi</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="settings-business-name" className="block font-bold text-stone-700 mb-1">
                Nama Usaha / Brand Agribisnis
              </label>
              <input
                id="settings-business-name"
                type="text"
                value={formData.namaUsaha}
                onChange={(e) => setFormData({ ...formData, namaUsaha: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                required
              />
            </div>

            <div>
              <label htmlFor="settings-greenhouse-name" className="block font-bold text-stone-700 mb-1">
                Nama Greenhouse
              </label>
              <input
                id="settings-greenhouse-name"
                type="text"
                value={formData.namaGreenhouse}
                onChange={(e) => setFormData({ ...formData, namaGreenhouse: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                required
              />
            </div>

            <div>
              <label htmlFor="settings-owner" className="block font-bold text-stone-700 mb-1">
                Pemilik / Pengelola Kebun
              </label>
              <input
                id="settings-owner"
                type="text"
                value={formData.pemilik}
                onChange={(e) => setFormData({ ...formData, pemilik: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                required
              />
            </div>

            <div>
              <label htmlFor="settings-location" className="block font-bold text-stone-700 mb-1">
                Lokasi Kebun
              </label>
              <input
                id="settings-location"
                type="text"
                value={formData.lokasi}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                required
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 2: SPESIFIKASI FISIK GREENHOUSE */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Settings className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-stone-900 text-sm">Spesifikasi Fisik & Sistem Budidaya</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label htmlFor="settings-tunnel-count" className="block font-bold text-stone-700 mb-1">
                Jumlah Tunnel
              </label>
              <input
                id="settings-tunnel-count"
                type="number"
                min="1"
                max="20"
                value={formData.jumlahTunnel}
                onChange={(e) => handleDimensionChange(formData.panjangTunnelM, formData.lebarTunnelM, Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                required
              />
            </div>

            <div>
              <label htmlFor="settings-tunnel-length" className="block font-bold text-stone-700 mb-1">
                Panjang per Tunnel (meter)
              </label>
              <input
                id="settings-tunnel-length"
                type="number"
                min="1"
                value={formData.panjangTunnelM}
                onChange={(e) => handleDimensionChange(Number(e.target.value), formData.lebarTunnelM, formData.jumlahTunnel)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                required
              />
            </div>

            <div>
              <label htmlFor="settings-tunnel-width" className="block font-bold text-stone-700 mb-1">
                Lebar per Tunnel (meter)
              </label>
              <input
                id="settings-tunnel-width"
                type="number"
                min="1"
                value={formData.lebarTunnelM}
                onChange={(e) => handleDimensionChange(formData.panjangTunnelM, Number(e.target.value), formData.jumlahTunnel)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                required
              />
            </div>

            <div>
              <label htmlFor="settings-total-area" className="block font-bold text-stone-700 mb-1">
                Total Luas Lahan (m²)
              </label>
              <input
                id="settings-total-area"
                type="number"
                value={formData.luasTotalM2}
                readOnly
                className="w-full px-3 py-2 bg-stone-100 border border-stone-300 rounded-xl font-mono font-bold text-stone-600"
              />
            </div>

            <div>
              <label htmlFor="settings-plant-capacity" className="block font-bold text-stone-700 mb-1">
                Kapasitas Tanaman (Populasi Total)
              </label>
              <input
                id="settings-plant-capacity"
                type="number"
                value={formData.kapasitasTanaman}
                onChange={(e) => setFormData({ ...formData, kapasitasTanaman: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                required
              />
            </div>

            <div>
              <label htmlFor="settings-tank-capacity" className="block font-bold text-stone-700 mb-1">
                Kapasitas Tandon Nutrisi (Liter)
              </label>
              <input
                id="settings-tank-capacity"
                type="number"
                value={formData.kapasitasTandonLiter}
                onChange={(e) => setFormData({ ...formData, kapasitasTandonLiter: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label htmlFor="settings-hydroponic-system" className="block font-bold text-stone-700 mb-1">
                Sistem Budidaya
              </label>
              <input
                id="settings-hydroponic-system"
                type="text"
                value={formData.sistemBudidaya}
                onChange={(e) => setFormData({ ...formData, sistemBudidaya: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                placeholder="Contoh: DFT Sirkulasi Tandon, Drip Irigasi"
                required
              />
            </div>

            <div>
              <label htmlFor="settings-target-yield" className="block font-bold text-stone-700 mb-1">
                Target Hasil per Pohon (kg/tanaman)
              </label>
              <input
                id="settings-target-yield"
                type="number"
                step="0.1"
                value={formData.targetHasilPerTanamanKg}
                onChange={(e) => setFormData({ ...formData, targetHasilPerTanamanKg: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                required
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 3: KEUANGAN & SALDO */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Coins className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-stone-900 text-sm">Parameter Keuangan & Saldo</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label htmlFor="settings-initial-cash" className="block font-bold text-stone-700 mb-1">
                Saldo Awal Kas Riil (Rp)
              </label>
              <input
                id="settings-initial-cash"
                type="number"
                value={formData.saldoAwalKas}
                onChange={(e) => setFormData({ ...formData, saldoAwalKas: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-emerald-700"
                required
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                {formatRupiah(formData.saldoAwalKas)}
              </span>
            </div>

            <div>
              <label htmlFor="settings-target-price" className="block font-bold text-stone-700 mb-1">
                Target Harga Jual Melon (Rp/kg)
              </label>
              <input
                id="settings-target-price"
                type="number"
                value={formData.targetHargaJualPerKg}
                onChange={(e) => setFormData({ ...formData, targetHargaJualPerKg: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                required
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                {formatRupiah(formData.targetHargaJualPerKg)} / kg
              </span>
            </div>

            <div>
              <label htmlFor="settings-currency" className="block font-bold text-stone-700 mb-1">
                Mata Uang
              </label>
              <input
                id="settings-currency"
                type="text"
                value={formData.mataUang}
                readOnly
                className="w-full px-3 py-2 bg-stone-100 border border-stone-300 rounded-xl font-mono font-bold text-stone-600"
              />
            </div>
          </div>
        </div>

        {/* Tombol Simpan Profil & Parameter */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-900/20 cursor-pointer active:scale-95 transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Seluruh Pengaturan'}</span>
          </button>
        </div>
      </form>

      {/* BAGIAN 4: DATA & BACKUP */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <Database className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Manajemen Data & Backup</h3>
            <p className="text-[11px] text-stone-500">
              Data tersimpan 100% lokal di IndexedDB iPhone/browser Anda. Unduh backup secara rutin untuk keamanan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Download JSON Backup */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-stone-900 block">Backup Sekarang</span>
              <p className="text-[11px] text-stone-500 mt-1">
                Export seluruh IndexedDB (transaksi, siklus, panen, aset, hutang, dll) menjadi file JSON lengkap.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dataService.downloadBackup()}
              className="w-full py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg text-center flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Backup JSON</span>
            </button>
          </div>

          {/* Upload Restore */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-stone-900 block">Restore Backup</span>
              <p className="text-[11px] text-stone-500 mt-1">
                Pulihkan data dari file JSON cadangan. Konfirmasi akan ditampilkan sebelum penimpaan data.
              </p>
            </div>
            <label className="w-full py-2.5 px-3 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold rounded-lg text-center flex items-center justify-center gap-1.5 transition cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Pilih File Backup JSON</span>
              <input type="file" accept=".json" onChange={handleFileSelected} className="hidden" />
            </label>
          </div>

          {/* Reset Demo Data */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-emerald-950 block">Reset ke Data Demo</span>
              <p className="text-[11px] text-emerald-800 mt-1">
                Muat ulang data percontohan greenhouse (Investasi 100jt, Biaya 10jt, Panen 1000kg, Omzet 25jt).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-center flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Data Demo</span>
            </button>
          </div>

          {/* Kosongkan Database */}
          <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-rose-950 block">Kosongkan Database</span>
              <p className="text-[11px] text-rose-800 mt-1">
                Hapus semua transaksi dan panen. Siapkan kebun Anda dari nol tanpa data demo sama sekali.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsWipeConfirmOpen(true)}
              className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-center flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Semua Data</span>
            </button>
          </div>
        </div>

        {/* EXPORT CSV TABLE */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center gap-2 mb-3">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <h4 className="font-bold text-stone-800 text-xs uppercase tracking-wider">
              Export Laporan ke Format CSV / Excel
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
            <button
              type="button"
              onClick={() => dataService.exportCSV('transactions')}
              className="p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl font-bold text-stone-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV Transaksi</span>
            </button>
            <button
              type="button"
              onClick={() => dataService.exportCSV('harvests')}
              className="p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl font-bold text-stone-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV Panen</span>
            </button>
            <button
              type="button"
              onClick={() => dataService.exportCSV('investments')}
              className="p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl font-bold text-stone-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV Investasi</span>
            </button>
            <button
              type="button"
              onClick={() => dataService.exportCSV('inventory')}
              className="p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl font-bold text-stone-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV Inventory</span>
            </button>
            <button
              type="button"
              onClick={() => dataService.exportCSV('debts')}
              className="p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl font-bold text-stone-700 flex items-center justify-center gap-1.5 transition cursor-pointer col-span-2 sm:col-span-1"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV Hutang/Piutang</span>
            </button>
          </div>
        </div>
      </div>

      {/* BAGIAN 5: INFORMASI APLIKASI & STORAGE */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <HardDrive className="w-5 h-5 text-stone-600" />
          <h3 className="font-bold text-stone-900 text-sm">Informasi Sistem & Penyimpanan Data</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-[10px] text-stone-500 uppercase font-semibold block">Versi Aplikasi</span>
            <span className="font-bold text-stone-800 text-sm mt-0.5 block">1.1.0 (Web App)</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-[10px] text-stone-500 uppercase font-semibold block">Penyimpanan Utama</span>
            <span className="font-bold text-stone-800 text-sm mt-0.5 block font-mono">IndexedDB (Local)</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-[10px] text-stone-500 uppercase font-semibold block">Kapasitas Terpakai</span>
            <span className="font-bold text-emerald-700 text-sm mt-0.5 block font-mono">
              {storageEstimate ? storageEstimate.usage : 'Tersedia'}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-[10px] text-stone-500 uppercase font-semibold block">Mode Aplikasi</span>
            <span className="font-bold text-emerald-700 text-sm mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Online Web App</span>
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            Aplikasi ini menggunakan koneksi web untuk memuat dan menjalankan aplikasi. 
            Data pembukuan tetap disimpan di IndexedDB browser pada perangkat ini. Gunakan fitur 
            <strong> Backup JSON</strong> secara berkala agar data mudah dipindahkan atau dipulihkan.
          </p>
        </div>
      </div>

      {/* CONFIRMATION MODAL: RESTORE BACKUP */}
      {isRestoreConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div 
            className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 animate-scale-up"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-restore-title"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 id="dialog-restore-title" className="text-base font-bold text-stone-900">
                Konfirmasi Restore Backup
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Restore akan mengganti data aplikasi saat ini dengan file <strong>{pendingRestoreFileName}</strong>. 
                Pastikan Anda sudah melakukan backup data terkini. Lanjutkan?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRestoreConfirmOpen(false);
                  setPendingRestoreData(null);
                }}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Ya, Pulihkan Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: RESET TO DEMO */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div 
            className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 animate-scale-up"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-reset-demo-title"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 id="dialog-reset-demo-title" className="text-base font-bold text-stone-900">
                Reset ke Data Demo Greenhouse
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Data saat ini akan digantikan dengan data percontohan standar (2 tunnel DFT, panen 1.000 kg, omzet Rp 25 jt). Lanjutkan?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetToDemo}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Ya, Muat Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: WIPE / KOSONGKAN DATABASE */}
      {isWipeConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div 
            className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 animate-scale-up"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-wipe-data-title"
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 id="dialog-wipe-data-title" className="text-base font-bold text-stone-900">
                Kosongkan Seluruh Database?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                PERINGATAN: Semua transaksi, siklus, panen, investasi, dan persediaan akan dihapus total (saldo kembali ke 0). Tindakan ini tidak dapat dibatalkan kecuali Anda memiliki file backup JSON.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsWipeConfirmOpen(false)}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleWipeData}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

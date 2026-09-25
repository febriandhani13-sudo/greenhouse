import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.js';
import { dataService } from '../services/localDataService.js';
import { Investment, InvestmentCategory, PaymentMethod, TunnelChoice, Greenhouse, GreenhouseTunnel } from '../types/index.js';
import { formatRupiah, formatDate } from '../utils/formatters.js';
import {
  Landmark,
  PlusCircle,
  Building2,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  Trash2,
  Edit2,
  X,
  Check,
  Info,
  Download
} from 'lucide-react';

const CATEGORY_ICONS: Record<InvestmentCategory, string> = {
  Struktur: '🏗️',
  'Atap & Dinding': '🛡️',
  DFT: '💧',
  Listrik: '⚡',
  'Tenaga Kerja Pembangunan': '👷',
  Peralatan: '🔬',
  Lainnya: '📦'
};

export const InvestmentsPage: React.FC = () => {
  const { refreshTrigger, refreshData, showToast } = useApp();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [availableGreenhouses, setAvailableGreenhouses] = useState<Greenhouse[]>([]);
  const [availableTunnels, setAvailableTunnels] = useState<GreenhouseTunnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter
  const [categoryFilter, setCategoryFilter] = useState<string>('semua');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    namaItem: string;
    kategori: InvestmentCategory;
    nominal: number;
    tanggal: string;
    greenhouseId: string;
    tunnel: TunnelChoice;
    vendor: string;
    metodePembayaran: PaymentMethod;
    catatan: string;
    createAssetRecord: boolean;
  }>({
    namaItem: '',
    kategori: 'DFT',
    nominal: 5000000,
    tanggal: new Date().toISOString().split('T')[0],
    greenhouseId: '',
    tunnel: 'Kedua Tunnel',
    vendor: 'Toko Perlengkapan Hidroponik',
    metodePembayaran: 'Transfer Bank',
    catatan: '',
    createAssetRecord: true
  });

  const openNewInvestmentModal = () => {
    setEditingInvestment(null);
    setFormData({
      namaItem: '',
      kategori: 'DFT',
      nominal: 5000000,
      tanggal: new Date().toISOString().split('T')[0],
      greenhouseId: availableGreenhouses[0]?.id || '',
      tunnel: 'Kedua Tunnel',
      vendor: 'Toko Perlengkapan Hidroponik',
      metodePembayaran: 'Transfer Bank',
      catatan: '',
      createAssetRecord: true
    });
    setIsModalOpen(true);
  };

  const openEditInvestmentModal = (inv: Investment) => {
    setEditingInvestment(inv);
    setFormData({
      namaItem: inv.namaItem,
      kategori: inv.kategori,
      nominal: inv.nominal,
      tanggal: inv.tanggal,
      greenhouseId: inv.greenhouseId || availableGreenhouses[0]?.id || '',
      tunnel: inv.tunnel,
      vendor: inv.vendor || '',
      metodePembayaran: inv.metodePembayaran,
      catatan: inv.catatan || '',
      createAssetRecord: false
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      dataService.getInvestments(),
      dataService.getGreenhouses(),
      dataService.getGreenhouseTunnels()
    ])
      .then(([data, ghList, tnlList]) => {
        if (!isMounted) return;
        setInvestments(data || []);
        setAvailableGreenhouses(ghList || []);
        setAvailableTunnels(tnlList || []);
      })
      .catch(err => {
        showToast('Gagal memuat data investasi: ' + err.message, 'error');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const filteredInvestments = useMemo(() => {
    if (categoryFilter === 'semua') return investments;
    return investments.filter(i => i.kategori === categoryFilter);
  }, [investments, categoryFilter]);

  const totalInvestasi = useMemo(() => {
    return investments.reduce((sum, i) => sum + i.nominal, 0);
  }, [investments]);

  // Breakdown by category
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const inv of investments) {
      map[inv.kategori] = (map[inv.kategori] || 0) + inv.nominal;
    }
    return map;
  }, [investments]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaItem || formData.nominal <= 0) {
      showToast('Nama item dan nominal investasi harus diisi dengan benar', 'error');
      return;
    }

    try {
      if (editingInvestment) {
        await dataService.updateInvestment(editingInvestment.id, formData);
        showToast('Data investasi berhasil diperbarui!', 'success');
      } else {
        await dataService.createInvestment(formData);
        showToast('Investasi greenhouse berhasil dicatat!', 'success');
      }
      setIsModalOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan investasi', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await dataService.deleteInvestment(deleteTargetId);
      showToast('Data investasi dihapus', 'success');
      setDeleteTargetId(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus investasi', 'error');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-stone-900 tracking-tight">
            Investasi Pembangunan Greenhouse
          </h2>
          <p className="text-xs lg:text-sm text-stone-500 mt-0.5">
            Pencatatan modal konstruksi, bambu petung, sistem DFT, kelistrikan, dan peralatan utama
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dataService.exportCSV('investments')}
            className="py-2.5 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={openNewInvestmentModal}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah Investasi Baru</span>
          </button>
        </div>
      </div>

      {/* Important Architecture Note Box */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs leading-relaxed">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Prinsip Pemisahan Finansial (Aturan Baku):</strong> Nilai investasi pembangunan greenhouse <strong className="underline">TIDAK dimasukkan</strong> secara langsung ke biaya produksi harian maupun HPP satu siklus melon. Nilai investasi digunakan murni untuk menghitung nilai aset, titik impas (BEP), ROI sederhana, dan rasio pengembalian modal.
        </div>
      </div>

      {/* Total Card & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Total Big Card */}
        <div className="bg-stone-900 text-white p-6 rounded-2xl shadow-md border border-stone-800 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Total Modal Investasi</span>
            <div className="text-2xl lg:text-3xl font-extrabold font-mono mt-2 text-white">
              {formatRupiah(totalInvestasi)}
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Mencakup seluruh belanja modal 2 Tunnel (16 × 48m)
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-800 text-xs text-stone-400 flex items-center justify-between">
            <span>Item Terdata</span>
            <span className="font-bold text-white">{investments.length} komponen</span>
          </div>
        </div>

        {/* Category Breakdown Cards (3 cols) */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(['Struktur', 'Atap & Dinding', 'DFT', 'Listrik', 'Tenaga Kerja Pembangunan', 'Peralatan'] as InvestmentCategory[]).map(cat => {
            const amount = categoryTotals[cat] || 0;
            const pct = totalInvestasi > 0 ? ((amount / totalInvestasi) * 100).toFixed(1) : '0';
            return (
              <div key={cat} className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold">
                    <span>{CATEGORY_ICONS[cat]}</span>
                    <span className="truncate">{cat}</span>
                  </div>
                  <div className="text-base font-extrabold text-stone-900 font-mono mt-1">
                    {formatRupiah(amount)}
                  </div>
                </div>
                <div className="mt-2 text-[11px] font-bold text-emerald-700">
                  {pct}% dari total modal
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setCategoryFilter('semua')}
          className={`py-1.5 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            categoryFilter === 'semua'
              ? 'bg-stone-900 text-white'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          Semua Kategori ({investments.length})
        </button>
        {(['Struktur', 'Atap & Dinding', 'DFT', 'Listrik', 'Tenaga Kerja Pembangunan', 'Peralatan'] as InvestmentCategory[]).map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              categoryFilter === cat
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {CATEGORY_ICONS[cat]} {cat}
          </button>
        ))}
      </div>

      {/* Investments Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">Tanggal & ID</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Komponen Investasi</th>
                <th className="py-3.5 px-4">Tunnel</th>
                <th className="py-3.5 px-4">Vendor / Toko</th>
                <th className="py-3.5 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredInvestments.map(inv => (
                <tr key={inv.id} className="hover:bg-stone-50/90 transition group">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-stone-900">{formatDate(inv.tanggal)}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{inv.id}</div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800">
                      {CATEGORY_ICONS[inv.kategori]} {inv.kategori}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-stone-900">{inv.namaItem}</div>
                    {inv.catatan && <div className="text-[11px] text-stone-500 truncate max-w-xs">{inv.catatan}</div>}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                    {inv.tunnel}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                    {inv.vendor || '-'}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-stone-900 text-sm whitespace-nowrap">
                    {formatRupiah(inv.nominal)}
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditInvestmentModal(inv)}
                        className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title="Edit data investasi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(inv.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus data investasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div 
            className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 animate-scale-up"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-delete-investment-title"
          >
            <div className="text-center">
              <h3 id="dialog-delete-investment-title" className="text-base font-bold text-stone-900">Hapus Data Investasi</h3>
              <p className="text-xs text-stone-500 mt-1">
                Apakah Anda yakin ingin menghapus data investasi ini?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Investment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div 
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-investment-title"
          >
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 id="modal-investment-title" className="text-base font-bold">
                {editingInvestment ? 'Edit Data Investasi Greenhouse' : 'Tambah Investasi Greenhouse'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label htmlFor="inv-modal-item-name-input" className="block font-bold text-stone-700 mb-1">Nama Item / Pengeluaran Investasi</label>
                <input
                  id="inv-modal-item-name-input"
                  type="text"
                  placeholder="Contoh: Talang DFT Trapesium 48 Meter + Sambungan"
                  value={formData.namaItem}
                  onChange={(e) => setFormData({ ...formData, namaItem: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inv-modal-category-select" className="block font-bold text-stone-700 mb-1">Kategori Investasi</label>
                  <select
                    id="inv-modal-category-select"
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  >
                    <option value="Struktur">Struktur (Bambu, Pondasi, Hebel)</option>
                    <option value="Atap & Dinding">Atap & Dinding (UV, Net)</option>
                    <option value="DFT">DFT (Talang, Pipa, Pompa, Tandon)</option>
                    <option value="Listrik">Listrik & Otomasi</option>
                    <option value="Tenaga Kerja Pembangunan">Tenaga Kerja Pembangunan</option>
                    <option value="Peralatan">Peralatan (Timbangan, pH/EC Meter)</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="inv-modal-nominal-input" className="block font-bold text-stone-700 mb-1">Nominal (Rp)</label>
                  <input
                    id="inv-modal-nominal-input"
                    type="number"
                    value={formData.nominal}
                    onChange={(e) => setFormData({ ...formData, nominal: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Greenhouse & Tunnel Selectors (Requirement S) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inv-modal-gh-select" className="block font-bold text-stone-700 mb-1">
                    Greenhouse
                  </label>
                  <select
                    id="inv-modal-gh-select"
                    value={formData.greenhouseId}
                    onChange={(e) => setFormData({ ...formData, greenhouseId: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900"
                  >
                    {availableGreenhouses.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.lengthM}×{g.widthM}m)
                      </option>
                    ))}
                    {availableGreenhouses.length === 0 && (
                      <option value="">Greenhouse Utama</option>
                    )}
                  </select>
                </div>

                <div>
                  <label htmlFor="inv-modal-tunnel-select" className="block font-bold text-stone-700 mb-1">
                    Alokasi Tunnel (Opsional)
                  </label>
                  <select
                    id="inv-modal-tunnel-select"
                    value={formData.tunnel}
                    onChange={(e) => setFormData({ ...formData, tunnel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                  >
                    <option value="Kedua Tunnel">Kedua Tunnel / Fasilitas Umum</option>
                    <option value="Tunnel 1">Tunnel 1</option>
                    <option value="Tunnel 2">Tunnel 2</option>
                    <option value="Umum / Fasilitas">Umum / Fasilitas</option>
                    {availableTunnels
                      .filter(t => !formData.greenhouseId || t.greenhouseId === formData.greenhouseId)
                      .map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="inv-modal-date-input" className="block font-bold text-stone-700 mb-1">Tanggal Pembelian</label>
                <input
                  id="inv-modal-date-input"
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inv-modal-vendor-input" className="block font-bold text-stone-700 mb-1">Vendor / Toko / Sumber</label>
                  <input
                    id="inv-modal-vendor-input"
                    type="text"
                    placeholder="Nama vendor..."
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="inv-modal-method-select" className="block font-bold text-stone-700 mb-1">Metode Pembayaran</label>
                  <select
                    id="inv-modal-method-select"
                    value={formData.metodePembayaran}
                    onChange={(e) => setFormData({ ...formData, metodePembayaran: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Tunai">Tunai / Kas</option>
                    <option value="Hutang">Hutang (Tempo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="inv-modal-notes-input" className="block font-bold text-stone-700 mb-1">Catatan Tambahan</label>
                <input
                  id="inv-modal-notes-input"
                  type="text"
                  placeholder="Spesifikasi teknis, garansi..."
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-stone-100 rounded-xl border border-stone-200">
                <input
                  type="checkbox"
                  id="createAssetCheckbox"
                  checked={formData.createAssetRecord}
                  onChange={(e) => setFormData({ ...formData, createAssetRecord: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="createAssetCheckbox" className="text-xs text-stone-800 font-semibold cursor-pointer">
                  Daftarkan langsung ke Buku Aset Greenhouse
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 text-stone-600 hover:bg-stone-100 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-900/20"
                >
                  {editingInvestment ? 'Simpan Perubahan' : 'Simpan Investasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

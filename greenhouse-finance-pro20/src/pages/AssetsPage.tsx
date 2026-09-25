import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.js';
import { dataService } from '../services/localDataService.js';
import { Asset, AssetCondition } from '../types/index.js';
import { formatRupiah, formatDate } from '../utils/formatters.js';
import {
  Cpu,
  PlusCircle,
  Building,
  Wrench,
  Trash2,
  AlertCircle,
  X,
  Check,
  ShieldCheck,
  Clock
} from 'lucide-react';

const CONDITION_COLORS: Record<AssetCondition, { bg: string; text: string; border: string }> = {
  Baik: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  'Perlu Perawatan': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  Rusak: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  Afkir: { bg: 'bg-stone-200', text: 'text-stone-800', border: 'border-stone-400' }
};

export const AssetsPage: React.FC = () => {
  const { refreshTrigger, refreshData, showToast } = useApp();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    namaAset: string;
    kategori: string;
    tanggalPembelian: string;
    harga: number;
    jumlah: number;
    kondisi: AssetCondition;
    umurEkonomisTahun: number;
    lokasi: string;
    catatan: string;
  }>({
    namaAset: '',
    kategori: 'Greenhouse',
    tanggalPembelian: new Date().toISOString().split('T')[0],
    harga: 10000000,
    jumlah: 1,
    kondisi: 'Baik',
    umurEkonomisTahun: 5,
    lokasi: 'Tunnel 1 & Tunnel 2',
    catatan: ''
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    dataService.getAssets()
      .then(data => {
        if (isMounted) setAssets(data);
      })
      .catch(err => {
        showToast('Gagal memuat aset: ' + err.message, 'error');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const totalNilaiAset = useMemo(() => {
    return assets.reduce((sum, a) => sum + a.nilaiTotal, 0);
  }, [assets]);

  // Estimasi penyusutan tahunan garis lurus (Straight-line depreciation estimate info only)
  const estimasiPenyusutanTahunan = useMemo(() => {
    return assets.reduce((sum, a) => {
      const umur = a.umurEkonomisTahun > 0 ? a.umurEkonomisTahun : 5;
      return sum + Math.round(a.nilaiTotal / umur);
    }, 0);
  }, [assets]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaAset || formData.harga <= 0) {
      showToast('Nama aset dan harga harus valid', 'error');
      return;
    }
    try {
      await dataService.createAsset(formData);
      showToast('Aset berhasil dicatat', 'success');
      setIsModalOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mencatat aset', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await dataService.deleteAsset(deleteTargetId);
      showToast('Aset berhasil dihapus', 'success');
      setDeleteTargetId(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus aset', 'error');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-stone-900 tracking-tight">
            Daftar Aset Greenhouse
          </h2>
          <p className="text-xs lg:text-sm text-stone-500 mt-0.5">
            Inventarisasi aktiva tetap: rangka struktur, sistem DFT, pompa sirkulasi, tandon, dan instrumen ukur
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              namaAset: '',
              kategori: 'Peralatan',
              tanggalPembelian: new Date().toISOString().split('T')[0],
              harga: 2500000,
              jumlah: 1,
              kondisi: 'Baik',
              umurEkonomisTahun: 5,
              lokasi: 'Greenhouse',
              catatan: ''
            });
            setIsModalOpen(true);
          }}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Catat Aset Baru</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Total Nilai Perolehan Aset</span>
          <div className="text-2xl font-extrabold text-stone-900 font-mono mt-1">
            {formatRupiah(totalNilaiAset)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Total {assets.length} item aktiva tetap tercatat
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Kondisi Aset Prima (Baik)</span>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            {assets.filter(a => a.kondisi === 'Baik').length} dari {assets.length}
          </div>
          <div className="text-[11px] text-emerald-800 mt-1">
            Siap mendukung operasional penuh siklus
          </div>
        </div>

        <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider block">Estimasi Penyusutan Tahunan</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 font-bold">Info Akuntansi</span>
          </div>
          <div className="text-xl font-extrabold text-stone-800 font-mono mt-1">
            {formatRupiah(estimasiPenyusutanTahunan)} / tahun
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            *Tidak mengurangi cash flow harian (sesuai aturan baku)
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">Nama Aset & ID</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Tgl Pembelian</th>
                <th className="py-3.5 px-4 text-center">Jumlah</th>
                <th className="py-3.5 px-4 text-right">Nilai Total (Rp)</th>
                <th className="py-3.5 px-4 text-center">Kondisi</th>
                <th className="py-3.5 px-4 text-center">Umur Ekonomis</th>
                <th className="py-3.5 px-4">Lokasi</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {assets.map(asset => {
                const condStyle = CONDITION_COLORS[asset.kondisi] || CONDITION_COLORS.Baik;
                return (
                  <tr key={asset.id} className="hover:bg-stone-50/90 transition group">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{asset.namaAset}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{asset.id}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                        {asset.kategori}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-stone-500">
                      {formatDate(asset.tanggalPembelian)}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold whitespace-nowrap">
                      {asset.jumlah}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-stone-900 whitespace-nowrap text-sm">
                      {formatRupiah(asset.nilaiTotal)}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${condStyle.bg} ${condStyle.text} ${condStyle.border}`}>
                        {asset.kondisi}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-stone-600">
                      {asset.umurEkonomisTahun} Tahun
                    </td>

                    <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap">
                      {asset.lokasi}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setDeleteTargetId(asset.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus aset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div 
            className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 animate-scale-up"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-delete-asset-title"
          >
            <div className="text-center">
              <h3 id="dialog-delete-asset-title" className="text-base font-bold text-stone-900">Hapus Data Aset</h3>
              <p className="text-xs text-stone-500 mt-1">
                Apakah Anda yakin ingin menghapus aset ini dari buku aset greenhouse?
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

      {/* Add Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div 
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-asset-title"
          >
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 id="modal-asset-title" className="text-base font-bold">Catat Aset Greenhouse Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label htmlFor="asset-modal-name-input" className="block font-bold text-stone-700 mb-1">Nama Aset</label>
                <input
                  id="asset-modal-name-input"
                  type="text"
                  placeholder="Contoh: Pompa Sirkulasi Submersible 8000 L/h"
                  value={formData.namaAset}
                  onChange={(e) => setFormData({ ...formData, namaAset: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="asset-modal-category-select" className="block font-bold text-stone-700 mb-1">Kategori</label>
                  <select
                    id="asset-modal-category-select"
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  >
                    <option value="Greenhouse">Greenhouse & Rangka</option>
                    <option value="DFT">Instalasi DFT</option>
                    <option value="Pompa & Tandon">Pompa & Tandon</option>
                    <option value="Listrik">Panel & Kelistrikan</option>
                    <option value="Peralatan">Peralatan QC & Pengukuran</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="asset-modal-condition-select" className="block font-bold text-stone-700 mb-1">Kondisi Fisik</label>
                  <select
                    id="asset-modal-condition-select"
                    value={formData.kondisi}
                    onChange={(e) => setFormData({ ...formData, kondisi: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  >
                    <option value="Baik">Baik (Normal Berfungsi)</option>
                    <option value="Perlu Perawatan">Perlu Perawatan / Servis</option>
                    <option value="Rusak">Rusak</option>
                    <option value="Afkir">Afkir</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label htmlFor="asset-modal-price-input" className="block font-bold text-stone-700 mb-1">Harga Beli Satuan (Rp)</label>
                  <input
                    id="asset-modal-price-input"
                    type="number"
                    value={formData.harga}
                    onChange={(e) => setFormData({ ...formData, harga: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="asset-modal-quantity-input" className="block font-bold text-stone-700 mb-1">Jumlah</label>
                  <input
                    id="asset-modal-quantity-input"
                    type="number"
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="asset-modal-economic-life-input" className="block font-bold text-stone-700 mb-1">Umur Ekonomis (Tahun)</label>
                  <input
                    id="asset-modal-economic-life-input"
                    type="number"
                    value={formData.umurEkonomisTahun}
                    onChange={(e) => setFormData({ ...formData, umurEkonomisTahun: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="asset-modal-location-input" className="block font-bold text-stone-700 mb-1">Lokasi Penempatan</label>
                  <input
                    id="asset-modal-location-input"
                    type="text"
                    placeholder="Tunnel 1, Ruang Nutrisi..."
                    value={formData.lokasi}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="asset-modal-purchase-date-input" className="block font-bold text-stone-700 mb-1">Tanggal Pembelian</label>
                <input
                  id="asset-modal-purchase-date-input"
                  type="date"
                  value={formData.tanggalPembelian}
                  onChange={(e) => setFormData({ ...formData, tanggalPembelian: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
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
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

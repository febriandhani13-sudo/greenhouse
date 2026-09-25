import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.js';
import { dataService } from '../services/localDataService.js';
import { InventoryItem, StockMovement } from '../types/index.js';
import { formatRupiah, formatNumber, formatDate } from '../utils/formatters.js';
import {
  Boxes,
  PlusCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
  History,
  Download
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { refreshTrigger, refreshData, showToast, cyclesList } = useApp();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab: 'stok' vs 'mutasi'
  const [activeTab, setActiveTab] = useState<'stok' | 'mutasi'>('stok');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItemIdForMovement, setSelectedItemIdForMovement] = useState<string>('');

  // Item Form
  const [itemForm, setItemForm] = useState<{
    namaBarang: string;
    kategori: string;
    satuan: string;
    stokAwal: number;
    minimumStok: number;
    hargaRataRata: number;
    lokasiPenyimpanan: string;
    catatan: string;
  }>({
    namaBarang: '',
    kategori: 'Nutrisi',
    satuan: 'paket',
    stokAwal: 10,
    minimumStok: 5,
    hargaRataRata: 180000,
    lokasiPenyimpanan: 'Gudang Saprotan',
    catatan: ''
  });

  // Movement Form
  const [movementForm, setMovementForm] = useState<{
    itemId: string;
    jenis: 'Masuk' | 'Keluar' | 'Penyesuaian';
    jumlah: number;
    hargaSatuan: number;
    referensi: string;
    cycleId: string;
    catatan: string;
    tanggal: string;
  }>({
    itemId: '',
    jenis: 'Keluar',
    jumlah: 1,
    hargaSatuan: 0,
    referensi: '',
    cycleId: '',
    catatan: '',
    tanggal: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    dataService.getInventory()
      .then(res => {
        if (!isMounted) return;
        setItems(res.items || []);
        setMovements(res.movements || []);
      })
      .catch(err => {
        showToast('Gagal memuat inventaris: ' + err.message, 'error');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  // Low stock warning items
  const lowStockItems = useMemo(() => {
    return items.filter(i => i.stokSaatIni <= i.minimumStok);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i =>
      i.namaBarang.toLowerCase().includes(q) ||
      i.kategori.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const openMovementModalForItem = (item: InventoryItem, jenis: 'Masuk' | 'Keluar') => {
    setMovementForm({
      itemId: item.id,
      jenis,
      jumlah: 1,
      hargaSatuan: item.hargaRataRata,
      referensi: jenis === 'Keluar' ? 'Pemakaian Greenhouse' : 'Restock Pembelian',
      cycleId: cyclesList[0]?.id || '',
      catatan: '',
      tanggal: new Date().toISOString().split('T')[0]
    });
    setIsMovementModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.namaBarang || !itemForm.satuan) {
      showToast('Nama barang dan satuan wajib diisi', 'error');
      return;
    }
    try {
      await dataService.createInventoryItem(itemForm);
      showToast('Barang berhasil ditambahkan ke inventaris', 'success');
      setIsItemModalOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan barang', 'error');
    }
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.itemId || movementForm.jumlah <= 0) {
      showToast('Pilih barang dan masukkan jumlah mutasi valid', 'error');
      return;
    }
    try {
      await dataService.createStockMovement(movementForm);
      showToast(`Mutasi stok (${movementForm.jenis}) berhasil dicatat`, 'success');
      setIsMovementModalOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mencatat mutasi stok', 'error');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-stone-900 tracking-tight">
            Inventaris & Mutasi Stok Saprotan
          </h2>
          <p className="text-xs lg:text-sm text-stone-500 mt-0.5">
            Manajemen stok benih, AB mix, media tanam, kemasan box, dan riwayat mutasi masuk/keluar
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dataService.exportCSV('inventory')}
            className="py-2.5 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => {
              if (items.length === 0) {
                showToast('Tambahkan barang terlebih dahulu', 'info');
                return;
              }
              setMovementForm({
                itemId: items[0].id,
                jenis: 'Keluar',
                jumlah: 1,
                hargaSatuan: items[0].hargaRataRata,
                referensi: 'Pemakaian Siklus',
                cycleId: cyclesList[0]?.id || '',
                catatan: '',
                tanggal: new Date().toISOString().split('T')[0]
              });
              setIsMovementModalOpen(true);
            }}
            className="py-2.5 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <History className="w-4 h-4 text-stone-600" />
            <span>+ Catat Mutasi</span>
          </button>

          <button
            onClick={() => {
              setItemForm({
                namaBarang: '',
                kategori: 'AB Mix',
                satuan: 'paket',
                stokAwal: 10,
                minimumStok: 5,
                hargaRataRata: 180000,
                lokasiPenyimpanan: 'Gudang Saprotan',
                catatan: ''
              });
              setIsItemModalOpen(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah Barang Baru</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-xs">Peringatan: {lowStockItems.length} Barang Mencapai / Di Bawah Batas Minimum Stok!</h4>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {lowStockItems.map(item => (
                <span key={item.id} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 border border-amber-300 text-amber-900">
                  <span>{item.namaBarang}</span>
                  <span className="font-bold font-mono">({item.stokSaatIni} {item.satuan})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 bg-stone-100 rounded-xl gap-1 w-fit">
          <button
            onClick={() => setActiveTab('stok')}
            className={`py-2 px-4 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'stok' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Daftar Stok Barang ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('mutasi')}
            className={`py-2 px-4 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'mutasi' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Riwayat Mutasi Stok ({movements.length})
          </button>
        </div>

        <div className="relative">
          <label htmlFor="inventory-search-input" className="sr-only">Cari barang saprotan</label>
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="inventory-search-input"
            type="text"
            placeholder="Cari barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Tab Content 1: Items List */}
      {activeTab === 'stok' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4">Nama Barang & ID</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 text-center">Stok Awal</th>
                  <th className="py-3.5 px-4 text-center">Masuk (+)</th>
                  <th className="py-3.5 px-4 text-center">Keluar (-)</th>
                  <th className="py-3.5 px-4 text-center">Stok Saat Ini</th>
                  <th className="py-3.5 px-4 text-right">Harga Rata-rata</th>
                  <th className="py-3.5 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {filteredItems.map(item => {
                  const isLow = item.stokSaatIni <= item.minimumStok;
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/90 transition group">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{item.namaBarang}</div>
                        <div className="text-[10px] text-stone-400 font-mono flex items-center gap-1.5">
                          <span>{item.id}</span>
                          <span>•</span>
                          <span>Lokasi: {item.lokasiPenyimpanan || 'Gudang'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                          {item.kategori}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-medium whitespace-nowrap">
                        {formatNumber(item.stokAwal)} {item.satuan}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-emerald-700 font-bold whitespace-nowrap">
                        +{formatNumber(item.stokMasuk)}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-rose-700 font-bold whitespace-nowrap">
                        -{formatNumber(item.stokKeluar)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg ${
                            isLow ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300' : 'bg-emerald-50 text-emerald-900'
                          }`}>
                            {formatNumber(item.stokSaatIni)} {item.satuan}
                          </span>
                        </div>
                        {isLow && (
                          <div className="text-[10px] text-amber-700 font-bold mt-0.5">
                            Min: {item.minimumStok} {item.satuan}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold whitespace-nowrap">
                        {formatRupiah(item.hargaRataRata)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openMovementModalForItem(item, 'Masuk')}
                            className="py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold cursor-pointer"
                          >
                            + Masuk
                          </button>
                          <button
                            onClick={() => openMovementModalForItem(item, 'Keluar')}
                            className="py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-bold cursor-pointer"
                          >
                            - Pakai
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Stock Movement History */}
      {activeTab === 'mutasi' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4">Tanggal & ID</th>
                  <th className="py-3.5 px-4">Nama Barang</th>
                  <th className="py-3.5 px-4">Jenis Mutasi</th>
                  <th className="py-3.5 px-4 text-center">Jumlah</th>
                  <th className="py-3.5 px-4 text-right">Nilai Mutasi</th>
                  <th className="py-3.5 px-4">Siklus & Referensi</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {movements.map(mv => (
                  <tr key={mv.id} className="hover:bg-stone-50/90 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-stone-900">{formatDate(mv.tanggal)}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{mv.id}</div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      {mv.namaBarang}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        mv.jenis === 'Masuk'
                          ? 'bg-emerald-100 text-emerald-800'
                          : mv.jenis === 'Keluar'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {mv.jenis}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold whitespace-nowrap">
                      {mv.jenis === 'Masuk' ? '+' : mv.jenis === 'Keluar' ? '-' : ''}
                      {formatNumber(mv.jumlah)} {mv.satuan}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900 whitespace-nowrap">
                      {formatRupiah(mv.totalNilai)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-stone-800">{mv.referensi || '-'}</div>
                      {mv.cycleId && <div className="text-[10px] text-stone-500 font-mono">{mv.cycleId}</div>}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500 max-w-xs truncate">
                      {mv.catatan || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Item */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-add-item-title"
          >
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 id="modal-add-item-title" className="text-base font-bold">Tambah Barang Saprotan</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-3.5 text-xs">
              <div>
                <label htmlFor="inv-item-name-input" className="block font-bold text-stone-700 mb-1">Nama Barang</label>
                <input
                  id="inv-item-name-input"
                  type="text"
                  placeholder="Contoh: AB Mix Melon Formulasi Super"
                  value={itemForm.namaBarang}
                  onChange={(e) => setItemForm({ ...itemForm, namaBarang: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="inv-item-category-select" className="block font-bold text-stone-700 mb-1">Kategori</label>
                  <select
                    id="inv-item-category-select"
                    value={itemForm.kategori}
                    onChange={(e) => setItemForm({ ...itemForm, kategori: e.target.value })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  >
                    <option value="AB Mix">AB Mix</option>
                    <option value="Benih">Benih Melon</option>
                    <option value="Nutrisi">Nutrisi Tambahan</option>
                    <option value="Media Tanam">Media Tanam</option>
                    <option value="Pestisida">Pestisida / Fungisida</option>
                    <option value="Kemasan">Kemasan & Kardus</option>
                    <option value="Perlengkapan">Perlengkapan</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="inv-item-unit-input" className="block font-bold text-stone-700 mb-1">Satuan</label>
                  <input
                    id="inv-item-unit-input"
                    type="text"
                    placeholder="paket, butir, slab, kg, buah..."
                    value={itemForm.satuan}
                    onChange={(e) => setItemForm({ ...itemForm, satuan: e.target.value })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="inv-item-initial-stock-input" className="block font-bold text-stone-700 mb-1">Stok Awal</label>
                  <input
                    id="inv-item-initial-stock-input"
                    type="number"
                    value={itemForm.stokAwal}
                    onChange={(e) => setItemForm({ ...itemForm, stokAwal: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="inv-item-min-stock-input" className="block font-bold text-stone-700 mb-1">Batas Minimum Stok</label>
                  <input
                    id="inv-item-min-stock-input"
                    type="number"
                    value={itemForm.minimumStok}
                    onChange={(e) => setItemForm({ ...itemForm, minimumStok: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="inv-item-avg-price-input" className="block font-bold text-stone-700 mb-1">Harga Satuan Rata-rata (Rp)</label>
                <input
                  id="inv-item-avg-price-input"
                  type="number"
                  value={itemForm.hargaRataRata}
                  onChange={(e) => setItemForm({ ...itemForm, hargaRataRata: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label htmlFor="inv-item-storage-location-input" className="block font-bold text-stone-700 mb-1">Lokasi Penyimpanan</label>
                <input
                  id="inv-item-storage-location-input"
                  type="text"
                  placeholder="Gudang Saprotan, Rak 1..."
                  value={itemForm.lokasiPenyimpanan}
                  onChange={(e) => setItemForm({ ...itemForm, lokasiPenyimpanan: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="py-2 px-3 text-stone-600 hover:bg-stone-100 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Record Movement */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-stock-movement-title"
          >
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 id="modal-stock-movement-title" className="text-base font-bold">Catat Mutasi Stok</h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-5 space-y-3.5 text-xs">
              <div>
                <label htmlFor="inv-movement-item-select" className="block font-bold text-stone-700 mb-1">Barang Terkait</label>
                <select
                  id="inv-movement-item-select"
                  value={movementForm.itemId}
                  onChange={(e) => {
                    const sel = items.find(i => i.id === e.target.value);
                    setMovementForm({
                      ...movementForm,
                      itemId: e.target.value,
                      hargaSatuan: sel ? sel.hargaRataRata : 0
                    });
                  }}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  required
                >
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.namaBarang} (Stok: {item.stokSaatIni} {item.satuan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="inv-movement-type-select" className="block font-bold text-stone-700 mb-1">Jenis Mutasi</label>
                  <select
                    id="inv-movement-type-select"
                    value={movementForm.jenis}
                    onChange={(e) => setMovementForm({ ...movementForm, jenis: e.target.value as any })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  >
                    <option value="Keluar">Keluar (Dipakai di Greenhouse)</option>
                    <option value="Masuk">Masuk (Beli / Tambah Stok)</option>
                    <option value="Penyesuaian">Penyesuaian (Stock Opname)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="inv-movement-amount-input" className="block font-bold text-stone-700 mb-1">Jumlah</label>
                  <input
                    id="inv-movement-amount-input"
                    type="number"
                    value={movementForm.jumlah}
                    onChange={(e) => setMovementForm({ ...movementForm, jumlah: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="inv-movement-date-input" className="block font-bold text-stone-700 mb-1">Tanggal</label>
                  <input
                    id="inv-movement-date-input"
                    type="date"
                    value={movementForm.tanggal}
                    onChange={(e) => setMovementForm({ ...movementForm, tanggal: e.target.value })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="inv-movement-cycle-select" className="block font-bold text-stone-700 mb-1">Kaitkan Siklus</label>
                  <select
                    id="inv-movement-cycle-select"
                    value={movementForm.cycleId}
                    onChange={(e) => setMovementForm({ ...movementForm, cycleId: e.target.value })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  >
                    <option value="">-- Umum / Tanpa Siklus --</option>
                    {cyclesList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.id} - {c.namaSiklus}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="inv-movement-reference-input" className="block font-bold text-stone-700 mb-1">Referensi / Penggunaan</label>
                <input
                  id="inv-movement-reference-input"
                  type="text"
                  placeholder="Contoh: Semai Siklus 002 Tunnel 2"
                  value={movementForm.referensi}
                  onChange={(e) => setMovementForm({ ...movementForm, referensi: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="py-2 px-3 text-stone-600 hover:bg-stone-100 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

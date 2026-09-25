import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  transactionRepository,
  harvestRepository,
  investmentRepository
} from '../../services/storage.js';
import {
  TransactionType,
  TransactionGroup,
  PaymentMethod,
  TunnelChoice
} from '../../types/index.js';
import { formatRupiah } from '../../utils/formatters.js';
import { X, ArrowDownRight, ArrowUpRight, Check, Scale, Landmark } from 'lucide-react';

const INCOME_CATEGORIES = [
  'Penjualan Melon',
  'Penjualan Lainnya',
  'Modal Masuk',
  'Pinjaman',
  'Pendapatan Lainnya'
];

const EXPENSE_CATEGORIES = [
  'AB Mix',
  'Benih',
  'Nutrisi',
  'Media Tanam',
  'Pestisida',
  'Fungisida',
  'Insektisida',
  'Listrik',
  'Air',
  'Tenaga Kerja',
  'Kemasan',
  'Transportasi',
  'Perawatan DFT',
  'Perawatan Greenhouse',
  'Pompa',
  'Peralatan',
  'Administrasi',
  'Sewa',
  'Lainnya'
];

type QuickEntryMode = 'pengeluaran' | 'pemasukan' | 'panen' | 'investasi';

export const QuickTransactionModal: React.FC = () => {
  const {
    isTransactionModalOpen,
    closeTransactionModal,
    transactionModalInitialData,
    cyclesList,
    showToast,
    refreshData
  } = useApp();

  const [entryMode, setEntryMode] = useState<QuickEntryMode>('pengeluaran');
  const [kelompok, setKelompok] = useState<TransactionGroup>('produksi');
  const [kategori, setKategori] = useState<string>('AB Mix');
  const [subkategori, setSubkategori] = useState<string>('');
  const [nominal, setNominal] = useState<string>('');
  const [metodePembayaran, setMetodePembayaran] = useState<PaymentMethod>('Transfer Bank');
  const [tunnel, setTunnel] = useState<TunnelChoice>('Tunnel 1');
  const [cycleId, setCycleId] = useState<string>('');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [catatan, setCatatan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Panen-specific quick fields
  const [harvestTotalKg, setHarvestTotalKg] = useState<number>(300);
  const [harvestGradeA, setHarvestGradeA] = useState<number>(240);
  const [harvestGradeB, setHarvestGradeB] = useState<number>(50);
  const [harvestGradeC, setHarvestGradeC] = useState<number>(10);
  const [harvestPricePerKg, setHarvestPricePerKg] = useState<number>(25000);
  const [harvestBuyer, setHarvestBuyer] = useState<string>('Grosir Buah Segar');

  // Investasi-specific quick fields
  const [investCategory, setInvestCategory] = useState<any>('DFT');
  const [investItemName, setInvestItemName] = useState<string>('');

  useEffect(() => {
    if (isTransactionModalOpen) {
      if (transactionModalInitialData) {
        const mode = transactionModalInitialData.kelompokTransaksi === 'investasi'
          ? 'investasi'
          : transactionModalInitialData.jenis === 'pemasukan'
          ? 'pemasukan'
          : 'pengeluaran';
        setEntryMode(mode);
        setKelompok(transactionModalInitialData.kelompokTransaksi || 'produksi');
        setKategori(transactionModalInitialData.kategori || 'AB Mix');
        setSubkategori(transactionModalInitialData.subkategori || '');
        setNominal(transactionModalInitialData.nominal ? String(transactionModalInitialData.nominal) : '');
        setMetodePembayaran(transactionModalInitialData.metodePembayaran || 'Transfer Bank');
        setTunnel(transactionModalInitialData.tunnel || 'Tunnel 1');
        setCycleId(transactionModalInitialData.cycleId || (cyclesList[0]?.id || ''));
        setTanggal(transactionModalInitialData.tanggal || new Date().toISOString().split('T')[0]);
        setCatatan(transactionModalInitialData.catatan || '');
      } else {
        setEntryMode('pengeluaran');
        setKelompok('produksi');
        setKategori('AB Mix');
        setSubkategori('');
        setNominal('');
        setMetodePembayaran('Transfer Bank');
        setTunnel('Tunnel 1');
        setCycleId(cyclesList[0]?.id || '');
        setTanggal(new Date().toISOString().split('T')[0]);
        setCatatan('');
      }
    }
  }, [isTransactionModalOpen, transactionModalInitialData, cyclesList]);

  const handleModeChange = (mode: QuickEntryMode) => {
    setEntryMode(mode);
    if (mode === 'pengeluaran') {
      setKategori('AB Mix');
      setKelompok('produksi');
    } else if (mode === 'pemasukan') {
      setKategori('Penjualan Melon');
      setKelompok('penjualan');
    } else if (mode === 'investasi') {
      setKategori('DFT');
      setKelompok('investasi');
    } else if (mode === 'panen') {
      setKategori('Penjualan Melon');
      setKelompok('penjualan');
    }
  };

  const handleCategorySelect = (cat: string) => {
    setKategori(cat);
    if (entryMode === 'pengeluaran') {
      if (['Perawatan Greenhouse', 'Perawatan DFT', 'Pompa', 'Peralatan'].includes(cat)) {
        setKelompok('investasi');
      } else if (['Listrik', 'Air', 'Transportasi', 'Administrasi', 'Sewa'].includes(cat)) {
        setKelompok('operasional');
      } else {
        setKelompok('produksi');
      }
    } else if (entryMode === 'pemasukan') {
      if (cat === 'Modal Masuk') setKelompok('modal');
      else if (cat === 'Pinjaman') setKelompok('pinjaman');
      else setKelompok('penjualan');
    }
  };

  const addQuickNominal = (amount: number) => {
    const current = Number(nominal.replace(/[^0-9]/g, '')) || 0;
    setNominal(String(current + amount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (entryMode === 'panen') {
        // Validation Rule 20: Grade A + Grade B + Grade C harus sama dengan Total Kg
        const sumGrades = harvestGradeA + harvestGradeB + harvestGradeC;
        if (sumGrades !== harvestTotalKg) {
          showToast(`Total grade (${sumGrades} kg) harus sama dengan Total Panen (${harvestTotalKg} kg)!`, 'error');
          setIsSubmitting(false);
          return;
        }

        await harvestRepository.create({
          tanggal,
          cycleId: cycleId || (cyclesList[0]?.id || 'S001'),
          tunnel: (tunnel === 'Kedua Tunnel' ? 'Tunnel 1' : tunnel) as any,
          totalKg: harvestTotalKg,
          gradeA: harvestGradeA,
          gradeB: harvestGradeB,
          gradeC: harvestGradeC,
          hargaRataRata: harvestPricePerKg,
          pembeli: harvestBuyer.trim() || 'Pembeli Umum',
          statusPembayaran: 'Lunas',
          dibayar: harvestTotalKg * harvestPricePerKg,
          catatan: catatan.trim() || undefined,
          createTransactionRecord: true
        });

        showToast(`Panen ${harvestTotalKg} kg (${formatRupiah(harvestTotalKg * harvestPricePerKg)}) berhasil dicatat!`, 'success');
      } else if (entryMode === 'investasi') {
        const cleanNominal = Number(nominal.replace(/[^0-9]/g, ''));
        if (!cleanNominal || cleanNominal <= 0) {
          showToast('Nominal investasi harus lebih dari 0', 'error');
          setIsSubmitting(false);
          return;
        }

        await investmentRepository.create({
          namaItem: investItemName.trim() || kategori,
          kategori: investCategory,
          nominal: cleanNominal,
          tanggal,
          tunnel,
          metodePembayaran,
          catatan: catatan.trim() || undefined,
          createAssetRecord: true,
          createTransactionRecord: true
        });

        showToast(`Investasi ${formatRupiah(cleanNominal)} berhasil dicatat!`, 'success');
      } else {
        // Standard Pemasukan / Pengeluaran
        const cleanNominal = Number(nominal.replace(/[^0-9]/g, ''));
        if (!cleanNominal || cleanNominal <= 0) {
          showToast('Nominal transaksi harus lebih dari 0', 'error');
          setIsSubmitting(false);
          return;
        }

        await transactionRepository.create({
          tanggal,
          jenis: entryMode === 'pemasukan' ? 'pemasukan' : 'pengeluaran',
          kelompokTransaksi: kelompok,
          kategori,
          subkategori: subkategori.trim() || undefined,
          nominal: cleanNominal,
          metodePembayaran,
          tunnel,
          cycleId: cycleId || undefined,
          catatan: catatan.trim() || undefined
        });

        showToast(`Transaksi ${formatRupiah(cleanNominal)} berhasil disimpan!`, 'success');
      }

      refreshData();
      closeTransactionModal();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan transaksi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isTransactionModalOpen) return null;

  const currentNumeric = Number(nominal.replace(/[^0-9]/g, '')) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-scale-up max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-quick-transaction-title"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 id="modal-quick-transaction-title" className="text-sm sm:text-base font-bold">Catat Transaksi Cepat</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              &lt; 10s
            </span>
          </div>
          <button
            onClick={closeTransactionModal}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with internal scrolling for iOS virtual keyboard */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {/* 4 Mode Choices (Rule 7) */}
          <div className="grid grid-cols-4 p-1 bg-stone-100 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => handleModeChange('pengeluaran')}
              className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                entryMode === 'pengeluaran' ? 'bg-rose-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('pemasukan')}
              className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                entryMode === 'pemasukan' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('panen')}
              className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                entryMode === 'panen' ? 'bg-blue-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Panen</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('investasi')}
              className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                entryMode === 'investasi' ? 'bg-purple-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Invest</span>
            </button>
          </div>

          {/* MODE: PANEN QUICK FORM */}
          {entryMode === 'panen' && (
            <div className="space-y-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="quick-harvest-total-kg-input" className="block font-bold text-stone-700 mb-0.5">Total Panen (Kg)</label>
                  <input
                    id="quick-harvest-total-kg-input"
                    type="number"
                    value={harvestTotalKg}
                    onChange={(e) => {
                      const kg = Number(e.target.value);
                      setHarvestTotalKg(kg);
                      const a = Math.round(kg * 0.8);
                      const b = Math.round(kg * 0.15);
                      const c = kg - a - b;
                      setHarvestGradeA(a);
                      setHarvestGradeB(b);
                      setHarvestGradeC(c);
                    }}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono font-extrabold text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="quick-harvest-price-per-kg-input" className="block font-bold text-stone-700 mb-0.5">Harga / Kg (Rp)</label>
                  <input
                    id="quick-harvest-price-per-kg-input"
                    type="number"
                    value={harvestPricePerKg}
                    onChange={(e) => setHarvestPricePerKg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono font-bold text-sm"
                    required
                  />
                </div>
              </div>

              {/* Grade A, B, C input with validation display */}
              <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-stone-800 text-[11px]">Rincian Sortasi Grade:</span>
                  <span className={`text-[10px] font-bold ${
                    harvestGradeA + harvestGradeB + harvestGradeC === harvestTotalKg
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                  }`}>
                    {harvestGradeA + harvestGradeB + harvestGradeC} / {harvestTotalKg} kg
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="quick-harvest-grade-a-input" className="block text-[10px] text-stone-500 mb-0.5">Grade A (kg)</label>
                    <input
                      id="quick-harvest-grade-a-input"
                      type="number"
                      value={harvestGradeA}
                      onChange={(e) => setHarvestGradeA(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor="quick-harvest-grade-b-input" className="block text-[10px] text-stone-500 mb-0.5">Grade B (kg)</label>
                    <input
                      id="quick-harvest-grade-b-input"
                      type="number"
                      value={harvestGradeB}
                      onChange={(e) => setHarvestGradeB(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor="quick-harvest-grade-c-input" className="block text-[10px] text-stone-500 mb-0.5">Grade C (kg)</label>
                    <input
                      id="quick-harvest-grade-c-input"
                      type="number"
                      value={harvestGradeC}
                      onChange={(e) => setHarvestGradeC(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="quick-harvest-buyer-input" className="block font-bold text-stone-700 mb-0.5">Pembeli / Buyer</label>
                <input
                  id="quick-harvest-buyer-input"
                  type="text"
                  value={harvestBuyer}
                  onChange={(e) => setHarvestBuyer(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl"
                  required
                />
              </div>

              <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded-xl text-[11px] font-bold flex justify-between">
                <span>Total Omzet Penjualan:</span>
                <span className="font-mono text-sm">{formatRupiah(harvestTotalKg * harvestPricePerKg)}</span>
              </div>
            </div>
          )}

          {/* MODE: INVESTASI FORM */}
          {entryMode === 'investasi' && (
            <div className="space-y-3 p-3 bg-purple-50/50 rounded-2xl border border-purple-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="quick-invest-category-select" className="block font-bold text-stone-700 mb-0.5">Kategori Investasi</label>
                  <select
                    id="quick-invest-category-select"
                    value={investCategory}
                    onChange={(e) => setInvestCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold"
                  >
                    <option value="Struktur">Struktur Bambu/Pondasi</option>
                    <option value="Atap & Dinding">Atap UV / Insect Net</option>
                    <option value="DFT">DFT (Talang, Pompa, Pipa)</option>
                    <option value="Listrik">Listrik & Otomasi</option>
                    <option value="Peralatan">Peralatan & QC</option>
                    <option value="Tenaga Kerja Pembangunan">Tenaga Kerja Konstruksi</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="quick-invest-item-name-input" className="block font-bold text-stone-700 mb-0.5">Nama Komponen</label>
                  <input
                    id="quick-invest-item-name-input"
                    type="text"
                    placeholder="Contoh: Pompa Submersible 8000L"
                    value={investItemName}
                    onChange={(e) => setInvestItemName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-semibold"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Nominal Input (For Pengeluaran, Pemasukan, Investasi) */}
          {entryMode !== 'panen' && (
            <div>
              <label htmlFor="quick-tx-nominal-input" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Nominal (Rupiah) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-lg pointer-events-none">
                  Rp
                </span>
                <input
                  id="quick-tx-nominal-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={nominal ? Number(nominal).toLocaleString('id-ID') : ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setNominal(val);
                  }}
                  className="w-full pl-12 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-lg font-extrabold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition font-mono"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[100000, 250000, 500000, 1000000, 2500000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => addQuickNominal(amt)}
                    className="py-1 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 text-[10px] font-semibold text-stone-700 transition"
                  >
                    +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Chips (Only for Pengeluaran / Pemasukan) */}
          {(entryMode === 'pengeluaran' || entryMode === 'pemasukan') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-stone-700">Kategori Cepat:</span>
                <span className="text-[10px] text-stone-400">Pilih salah satu</span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-stone-50 border border-stone-200 rounded-xl scrollbar-thin">
                {(entryMode === 'pengeluaran' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`py-1 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                      kategori === cat
                        ? entryMode === 'pengeluaran'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tunnel & Cycle Selection */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="quick-tx-tunnel-select" className="block font-bold text-stone-700 mb-0.5">Tunnel Terkait</label>
              <select
                id="quick-tx-tunnel-select"
                value={tunnel}
                onChange={(e) => setTunnel(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
              >
                <option value="Tunnel 1">Tunnel 1 (8x48m)</option>
                <option value="Tunnel 2">Tunnel 2 (8x48m)</option>
                <option value="Kedua Tunnel">Kedua Tunnel</option>
                <option value="Umum / Fasilitas">Umum / Fasilitas</option>
              </select>
            </div>
            <div>
              <label htmlFor="quick-tx-cycle-select" className="block font-bold text-stone-700 mb-0.5">Siklus</label>
              <select
                id="quick-tx-cycle-select"
                value={cycleId}
                onChange={(e) => setCycleId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
              >
                <option value="">-- Tanpa Siklus --</option>
                {cyclesList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.id} ({c.tunnel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="quick-tx-date-input" className="block font-bold text-stone-700 mb-0.5">Tanggal</label>
              <input
                id="quick-tx-date-input"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
              />
            </div>
            <div>
              <label htmlFor="quick-tx-payment-method-select" className="block font-bold text-stone-700 mb-0.5">Metode Bayar</label>
              <select
                id="quick-tx-payment-method-select"
                value={metodePembayaran}
                onChange={(e) => setMetodePembayaran(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
              >
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Tunai">Tunai</option>
                <option value="QRIS">QRIS</option>
                <option value="E-wallet">E-wallet</option>
                <option value="Hutang">Hutang (Tempo)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="quick-tx-notes-input" className="block font-bold text-stone-700 mb-0.5">Catatan</label>
            <input
              id="quick-tx-notes-input"
              type="text"
              placeholder="Keterangan singkat..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={closeTransactionModal}
              disabled={isSubmitting}
              className="py-2 px-3 text-stone-600 hover:bg-stone-100 rounded-xl font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Cepat'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

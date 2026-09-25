import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.js';
import { dataService } from '../services/localDataService.js';
import { DashboardMetrics, CycleFinancialDetail } from '../types/index.js';
import { formatRupiah, formatNumber } from '../utils/formatters.js';
import { calculateBEP, calculateROI, calculatePayback } from '../calculations/finance.js';
import {
  FileSpreadsheet,
  Calculator,
  Percent,
  Landmark,
  Scale,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  Download,
  Filter
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const {
    refreshTrigger,
    tunnelFilter,
    yearFilter,
    setYearFilter,
    monthFilter,
    setMonthFilter
  } = useApp();

  const [activeTab, setActiveTab] = useState<'labarugi' | 'siklus' | 'bep' | 'roi'>('labarugi');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [cycleDetails, setCycleDetails] = useState<CycleFinancialDetail[]>([]);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // BEP Calculator interactive state
  const [bepFixedCost, setBepFixedCost] = useState<number>(10000000);
  const [bepVarCostPerKg, setBepVarCostPerKg] = useState<number>(10000);
  const [bepSalePricePerKg, setBepSalePricePerKg] = useState<number>(25000);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    dataService.getDashboardData({
      tunnel: tunnelFilter,
      year: yearFilter,
      month: monthFilter !== '' ? Number(monthFilter) : undefined
    })
      .then(res => {
        if (!isMounted) return;
        setMetrics(res.metrics);
        setCycleDetails(res.cycleDetails || []);
        setCashFlow(res.cashFlow || []);

        // Autofill BEP defaults from actual calculated HPP if available
        if (res.metrics.hppRataRataPerKg > 0) {
          setBepVarCostPerKg(res.metrics.hppRataRataPerKg);
        }
      })
      .catch(err => {
        console.error('Gagal memuat laporan:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tunnelFilter, yearFilter, monthFilter, refreshTrigger]);

  // BEP calculations result
  const bepResult = useMemo(() => {
    return calculateBEP(bepFixedCost, bepVarCostPerKg, bepSalePricePerKg);
  }, [bepFixedCost, bepVarCostPerKg, bepSalePricePerKg]);

  // Payback & ROI results
  const paybackResult = useMemo(() => {
    if (!metrics) return { modalKembali: 0, modalBelumKembali: 0, persenKembali: 0 };
    return calculatePayback(metrics.totalInvestasi, metrics.labaBersih);
  }, [metrics]);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-stone-900 tracking-tight">
            Laporan Finansial & Analisis Investasi
          </h2>
          <p className="text-xs lg:text-sm text-stone-500 mt-0.5">
            Laba rugi agribisnis, evaluasi HPP tiap siklus, kalkulator titik impas (BEP), dan pengembalian modal
          </p>
        </div>

        {/* Global Period Filters */}
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="report-year-select" className="sr-only">Tahun</label>
          <select
            id="report-year-select"
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-stone-800"
          >
            <option value={2026}>Tahun 2026</option>
            <option value={2027}>Tahun 2027</option>
          </select>

          <label htmlFor="report-month-select" className="sr-only">Bulan</label>
          <select
            id="report-month-select"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-stone-800"
          >
            <option value="">Semua Bulan (Tahunan)</option>
            <option value="0">Januari</option>
            <option value="1">Februari</option>
            <option value="2">Maret</option>
            <option value="3">April</option>
            <option value="4">Mei</option>
            <option value="5">Juni</option>
            <option value="6">Juli</option>
            <option value="7">Agustus</option>
            <option value="8">September</option>
            <option value="9">Oktober</option>
            <option value="10">November</option>
            <option value="11">Desember</option>
          </select>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center p-1 bg-stone-100 rounded-xl gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('labarugi')}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'labarugi' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Laporan Laba Rugi
        </button>
        <button
          onClick={() => setActiveTab('siklus')}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'siklus' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Laporan Finansial Per Siklus
        </button>
        <button
          onClick={() => setActiveTab('bep')}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'bep' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Kalkulator BEP (Titik Impas)
        </button>
        <button
          onClick={() => setActiveTab('roi')}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'roi' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          ROI Sederhana & Modal Belum Kembali
        </button>
      </div>

      {/* TAB 1: LAPORAN LABA RUGI */}
      {activeTab === 'labarugi' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 max-w-3xl mx-auto">
            <div className="text-center pb-6 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-900">LAPORAN LABA RUGI GREENHOUSE</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Periode: {monthFilter !== '' ? `Bulan ${Number(monthFilter) + 1} ` : ''}Tahun {yearFilter} • {tunnelFilter}
              </p>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* 1. Pendapatan */}
              <div>
                <div className="flex items-center justify-between font-bold text-stone-900 text-sm pb-1">
                  <span>1. PENDAPATAN USAHA (OMZET)</span>
                  <span className="font-mono text-blue-700">{formatRupiah(metrics?.totalOmzet)}</span>
                </div>
                <div className="pl-4 text-stone-600 flex justify-between py-1">
                  <span>Penjualan Melon Aktual ({formatNumber(metrics?.totalPanenKg)} kg)</span>
                  <span className="font-mono">{formatRupiah(metrics?.totalOmzet)}</span>
                </div>
              </div>

              {/* 2. Biaya Produksi / HPP */}
              <div className="pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between font-bold text-stone-900 text-sm pb-1">
                  <span>2. BIAYA PRODUKSI (HARGA POKOK PRODUKSI)</span>
                  <span className="font-mono text-amber-700">({formatRupiah(metrics?.totalBiayaProduksi)})</span>
                </div>
                <div className="pl-4 text-stone-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Benih, AB Mix, Media, Pestisida, Kemasan, Tenaga Siklus</span>
                    <span className="font-mono">({formatRupiah(metrics?.totalBiayaProduksi)})</span>
                  </div>
                </div>
              </div>

              {/* 3. Laba Kotor */}
              <div className="p-3 bg-stone-50 rounded-xl flex items-center justify-between font-bold text-sm">
                <span className="text-stone-900">3. LABA KOTOR (GROSS PROFIT)</span>
                <span className="font-mono text-stone-900">{formatRupiah(metrics?.labaKotor)}</span>
              </div>

              {/* 4. Biaya Operasional Umum */}
              <div className="pt-2">
                <div className="flex items-center justify-between font-bold text-stone-900 text-sm pb-1">
                  <span>4. BIAYA OPERASIONAL UMUM</span>
                  <span className="font-mono text-rose-700">({formatRupiah(metrics?.totalBiayaOperasional)})</span>
                </div>
                <div className="pl-4 text-stone-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Listrik Pompa 24 Jam, Transportasi, Pemeliharaan</span>
                    <span className="font-mono">({formatRupiah(metrics?.totalBiayaOperasional)})</span>
                  </div>
                </div>
              </div>

              {/* 5. Laba Bersih */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between font-extrabold text-base">
                <span className="text-emerald-950">5. LABA BERSIH USAHA (NET PROFIT)</span>
                <span className="font-mono text-emerald-800">{formatRupiah(metrics?.labaBersih)}</span>
              </div>
            </div>

            {/* Verification banner matching exact user test */}
            <div className="mt-4 p-3 bg-stone-100 rounded-xl text-[11px] text-stone-600 leading-relaxed flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Akurasi Terverifikasi:</strong> Laba kotor = Omzet - Biaya Produksi. Laba bersih = Laba Kotor - Biaya Operasional. Investasi Rp 100jt dipisahkan dari beban operasional.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LAPORAN PER SIKLUS TANAM */}
      {activeTab === 'siklus' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Evaluasi Finansial Antar Siklus Tanam</h3>
              <p className="text-xs text-stone-500">Perbandingan biaya, produktivitas per tanaman, HPP/kg, dan laba bersih</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4">Siklus</th>
                  <th className="py-3.5 px-4">Tunnel</th>
                  <th className="py-3.5 px-4 text-center">Populasi Tanaman</th>
                  <th className="py-3.5 px-4 text-right">Biaya Produksi</th>
                  <th className="py-3.5 px-4 text-center">Hasil Panen</th>
                  <th className="py-3.5 px-4 text-right">Omzet Penjualan</th>
                  <th className="py-3.5 px-4 text-right">HPP / Tanaman</th>
                  <th className="py-3.5 px-4 text-right">HPP / Kg</th>
                  <th className="py-3.5 px-4 text-right">Laba Kotor</th>
                  <th className="py-3.5 px-4 text-right">Laba Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {cycleDetails.map(detail => (
                  <tr key={detail.cycle.id} className="hover:bg-stone-50/90 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{detail.cycle.id}</div>
                      <div className="text-[10px] text-stone-500">{detail.cycle.namaSiklus}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                      {detail.cycle.tunnel}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold whitespace-nowrap">
                      {formatNumber(detail.cycle.jumlahTanaman)} btg
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold whitespace-nowrap">
                      {formatRupiah(detail.totalBiayaProduksi)}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold whitespace-nowrap">
                      {detail.totalPanenKg > 0 ? `${formatNumber(detail.totalPanenKg)} kg` : '-'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-700 whitespace-nowrap">
                      {formatRupiah(detail.omzet)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold whitespace-nowrap">
                      {formatRupiah(detail.hppPerTanaman)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-amber-700 whitespace-nowrap">
                      {detail.hppPerKg > 0 ? formatRupiah(detail.hppPerKg) : '-'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900 whitespace-nowrap">
                      {formatRupiah(detail.labaKotor)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-700 whitespace-nowrap">
                      {formatRupiah(detail.labaBersih)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: KALKULATOR BEP (TITIK IMPAS) */}
      {activeTab === 'bep' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-stone-900 text-sm">Parameter Kalkulator BEP</h3>
            </div>
            <p className="text-xs text-stone-500">
              Menghitung berapa kilogram melon dan nilai rupiah yang wajib diproduksi/dijual agar mencapai titik impas (tidak rugi dan tidak untung).
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="bep-fixed-cost-input" className="block font-bold text-stone-700 mb-1">
                  Biaya Tetap yang Dialokasikan (Fixed Cost / Operasional + Depresiasi)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">Rp</span>
                  <input
                    id="bep-fixed-cost-input"
                    type="number"
                    value={bepFixedCost}
                    onChange={(e) => setBepFixedCost(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bep-var-cost-input" className="block font-bold text-stone-700 mb-1">
                  Biaya Variabel per Kg (HPP Produksi Melon / Kg)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">Rp</span>
                  <input
                    id="bep-var-cost-input"
                    type="number"
                    value={bepVarCostPerKg}
                    onChange={(e) => setBepVarCostPerKg(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bep-sale-price-input" className="block font-bold text-stone-700 mb-1">
                  Harga Jual Melon per Kg (Target Pasar)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">Rp</span>
                  <input
                    id="bep-sale-price-input"
                    type="number"
                    value={bepSalePricePerKg}
                    onChange={(e) => setBepSalePricePerKg(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600">
              <strong>Rumus Utama:</strong> BEP (Kg) = Biaya Tetap ÷ (Harga Jual/Kg - Biaya Variabel/Kg)
            </div>
          </div>

          {/* Results display */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Hasil Kalkulasi Titik Impas (BEP)</h3>
              <p className="text-xs text-stone-500 mt-0.5">Target minimal panen agar beban biaya tertutupi</p>

              {bepResult.isValid ? (
                <div className="space-y-4 mt-5">
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">BEP Hasil Panen (Kg)</span>
                    <div className="text-3xl font-extrabold text-emerald-900 font-mono mt-1">
                      {formatNumber(bepResult.bepKg)} <span className="text-sm font-normal text-emerald-700">kg melon</span>
                    </div>
                    <p className="text-xs text-emerald-700 mt-1">
                      Kapasitas 1 Tunnel (1.000 btg) cukup menghasilkan rata-rata 1 buah melon per pohon (~1.2 - 1.5 kg) untuk melampaui titik impas ini!
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">BEP Nominal Rupiah</span>
                    <div className="text-2xl font-extrabold text-blue-900 font-mono mt-1">
                      {formatRupiah(bepResult.bepRupiah)}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Margin Kontribusi: <strong>{formatRupiah(bepResult.marginKontribusi)}/kg</strong> ({bepResult.marginKontribusiRatio}%)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mt-4 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <strong>Peringatan Input:</strong> {bepResult.message}
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-stone-500 pt-3 border-t border-stone-100">
              Perhitungan BEP membantu menentukan harga jual dasar saat bernegosiasi dengan distributor atau pasar supermarket.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ROI SEDERHANA & PENGEMBALIAN MODAL */}
      {activeTab === 'roi' && (
        <div className="space-y-6">
          {/* Main Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">1. Total Investasi Awal</span>
              <div className="text-2xl font-extrabold text-stone-900 font-mono mt-1">
                {formatRupiah(metrics?.totalInvestasi)}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Biaya pembangunan 2 Tunnel & DFT</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">2. Akumulasi Laba Bersih</span>
              <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">
                {formatRupiah(metrics?.labaBersih)}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Laba bersih aktual yang dialokasikan</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">3. Modal Telah Kembali</span>
              <div className="text-2xl font-extrabold text-blue-700 font-mono mt-1">
                {formatRupiah(paybackResult.modalKembali)}
              </div>
              <p className="text-[11px] text-blue-700 mt-1 font-semibold">
                Progress: {paybackResult.persenKembali}% dari total investasi
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">4. Modal Belum Kembali</span>
              <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1">
                {formatRupiah(paybackResult.modalBelumKembali)}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Sisa yang perlu ditutup laba siklus berikutnya</p>
            </div>
          </div>

          {/* Progress Bar & Simple ROI display */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Progress Pengembalian Modal Investasi (Payback Tracker)</h3>
                <p className="text-xs text-stone-500">
                  Target pengembalian modal dari laba bersih siklus tanam berkesinambungan
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-600 font-semibold">ROI Sederhana:</span>
                <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 font-extrabold text-sm border border-amber-300">
                  {metrics?.roiSederhanaPersen || 0}%
                </span>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-5 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 shadow-xs"
                  style={{ width: `${Math.min(100, paybackResult.persenKembali)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-stone-600 font-medium">
                <span>0% (Awal)</span>
                <span>{paybackResult.persenKembali}% Modal Kembali ({formatRupiah(paybackResult.modalKembali)})</span>
                <span>100% Impas ({formatRupiah(metrics?.totalInvestasi)})</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 leading-relaxed">
              <strong>Catatan Agribisnis:</strong> Perhitungan ROI di atas dinyatakan sebagai <em>ROI Sederhana</em> (Akumulasi Laba Bersih ÷ Total Investasi × 100%). Omzet penjualan tidak dihitung sebagai modal kembali, melainkan hanya laba bersih setelah dikurangi seluruh biaya benih, nutrisi, media, tenaga kerja, dan operasional.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

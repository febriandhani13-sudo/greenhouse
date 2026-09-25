import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { dashboardService, transactionRepository } from '../services/storage.js';
import { DashboardMetrics, CycleFinancialDetail, Transaction, Greenhouse, GreenhouseTunnel } from '../types/index.js';
import { localDataService } from '../services/localDataService.js';
import { formatRupiah, formatNumber, formatDate } from '../utils/formatters.js';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Landmark,
  Sprout,
  Plus,
  Percent,
  Warehouse,
  Building2,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Clock,
  Activity,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const {
    tunnelFilter,
    cycleFilter,
    yearFilter,
    monthFilter,
    refreshTrigger,
    openTransactionModal,
    setActivePage,
    settings
  } = useApp();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [cycleDetails, setCycleDetails] = useState<CycleFinancialDetail[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [activeGreenhouses, setActiveGreenhouses] = useState<Greenhouse[]>([]);
  const [allTunnels, setAllTunnels] = useState<GreenhouseTunnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const [res, txs, ghList, tnlList] = await Promise.all([
          dashboardService.getMetrics({
            tunnel: tunnelFilter,
            cycleId: cycleFilter,
            year: yearFilter,
            month: monthFilter !== '' ? Number(monthFilter) : undefined
          }),
          transactionRepository.getAll(),
          localDataService.getGreenhouses(),
          localDataService.getGreenhouseTunnels()
        ]);

        if (!isMounted) return;
        setMetrics(res.metrics);
        setCashFlowData(res.cashFlow || []);
        setExpenseBreakdown(res.expenseBreakdown || []);
        setCycleDetails(res.cycleDetails || []);
        setRecentTransactions(txs.slice(0, 5));
        setActiveGreenhouses(ghList.filter(g => g.status !== 'inactive'));
        setAllTunnels(tnlList || []);
      } catch (err) {
        console.error('Gagal memuat dashboard:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [tunnelFilter, cycleFilter, yearFilter, monthFilter, refreshTrigger]);

  if (isLoading && !metrics) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-stone-600 font-semibold text-xs">Memuat kontrol keuangan greenhouse...</p>
      </div>
    );
  }

  // Formatting cycle comparison chart data
  const cycleChartData = cycleDetails.map((c) => ({
    name: c.cycle.id,
    siklus: c.cycle.namaSiklus ? c.cycle.namaSiklus.split('-')[0].trim() : c.cycle.id,
    omzet: c.omzet,
    biayaProduksi: c.totalBiayaProduksi,
    labaBersih: c.labaBersih,
    panenKg: c.totalPanenKg,
    hppKg: c.hppPerKg
  }));

  // Tunnel progress calculations
  const t1Cycle = cycleDetails.find(d => d.cycle.tunnel === 'Tunnel 1');
  const t2Cycle = cycleDetails.find(d => d.cycle.tunnel === 'Tunnel 2');

  const t1Progress = t1Cycle
    ? t1Cycle.cycle.status === 'Selesai'
      ? 100
      : Math.min(95, Math.round(((t1Cycle.totalPanenKg || 1) / (t1Cycle.targetHasilKg || 1000)) * 100))
    : 0;

  const t2Progress = t2Cycle
    ? t2Cycle.cycle.status === 'Selesai'
      ? 100
      : t2Cycle.cycle.status === 'Generatif'
      ? 65
      : t2Cycle.cycle.status === 'Vegetatif'
      ? 35
      : 15
    : 0;

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto pb-28 lg:pb-14">
      {/* 1. Header Hero Control Center (Rule 11) */}
      <div className="bg-stone-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-stone-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">
                {settings?.namaUsaha || 'Greenhouse Melon Nusantara'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Greenhouse Finance Pro
            </h2>
            <p className="text-xs text-stone-300 mt-0.5">
              Financial & Production Control Center •{' '}
              {activeGreenhouses.length > 0
                ? `${activeGreenhouses[0].name} (${activeGreenhouses[0].lengthM} × ${activeGreenhouses[0].widthM}m • ${activeGreenhouses[0].tunnelCount || allTunnels.filter(t => t.greenhouseId === activeGreenhouses[0].id).length || 2} Tunnel)`
                : `${settings?.jumlahTunnel || 2} Tunnel (${settings?.panjangTunnelM || 48} × ${settings?.lebarTunnelM || 8}m)`}
            </p>
          </div>

          {/* Quick Add Buttons on Desktop / Tablet */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => openTransactionModal({ jenis: 'pengeluaran', kelompokTransaksi: 'produksi' })}
              className="py-2 px-3 bg-rose-600/90 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Biaya</span>
            </button>
            <button
              onClick={() => openTransactionModal({ jenis: 'pemasukan', kelompokTransaksi: 'penjualan' })}
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pemasukan</span>
            </button>
            <button
              onClick={() => openTransactionModal({ kelompokTransaksi: 'penjualan' })}
              className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Panen</span>
            </button>
            <button
              onClick={() => openTransactionModal({ kelompokTransaksi: 'investasi' })}
              className="py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Invest</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Buttons for One-Hand Mobile Usage (Rule 17) */}
      <div className="grid grid-cols-4 gap-2 sm:hidden">
        <button
          onClick={() => openTransactionModal({ jenis: 'pengeluaran', kelompokTransaksi: 'produksi' })}
          className="p-2.5 rounded-2xl bg-white border border-stone-200 text-stone-800 text-center flex flex-col items-center justify-center gap-1 shadow-xs active:bg-rose-50 active:scale-95 transition"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold">Biaya</span>
        </button>

        <button
          onClick={() => openTransactionModal({ jenis: 'pemasukan', kelompokTransaksi: 'penjualan' })}
          className="p-2.5 rounded-2xl bg-white border border-stone-200 text-stone-800 text-center flex flex-col items-center justify-center gap-1 shadow-xs active:bg-emerald-50 active:scale-95 transition"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold">Pemasukan</span>
        </button>

        <button
          onClick={() => openTransactionModal({ kelompokTransaksi: 'penjualan' })}
          className="p-2.5 rounded-2xl bg-white border border-stone-200 text-stone-800 text-center flex flex-col items-center justify-center gap-1 shadow-xs active:bg-blue-50 active:scale-95 transition"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Scale className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold">Panen</span>
        </button>

        <button
          onClick={() => openTransactionModal({ kelompokTransaksi: 'investasi' })}
          className="p-2.5 rounded-2xl bg-white border border-stone-200 text-stone-800 text-center flex flex-col items-center justify-center gap-1 shadow-xs active:bg-purple-50 active:scale-95 transition"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Landmark className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold">Invest</span>
        </button>
      </div>

      {/* 3. Four Core Financial KPI Cards (Rule 11) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Saldo Kas */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-emerald-400 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Saldo Kas Riil</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-stone-900 font-mono tracking-tight">
              {formatRupiah(metrics?.saldoKas)}
            </div>
            <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
              <span className="text-emerald-700 font-semibold">Masuk: {formatRupiah(metrics?.totalPemasukan)}</span>
            </div>
            <div className="text-[11px] text-rose-700 font-semibold">
              Keluar: {formatRupiah(metrics?.totalPengeluaran)}
            </div>
          </div>
        </div>

        {/* Card 2: Omzet */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-blue-400 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Total Omzet Penjualan</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-blue-800 font-mono tracking-tight">
              {formatRupiah(metrics?.totalOmzet)}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              Terjual: <strong className="text-stone-800">{formatNumber(metrics?.totalPanenKg)} kg</strong>
            </div>
            <div className="text-[11px] text-stone-600">
              Rata-rata: <strong className="text-stone-900">{metrics?.totalPanenKg && metrics.totalPanenKg > 0 ? formatRupiah(Math.round(metrics.totalOmzet / metrics.totalPanenKg)) : 'Rp 0'}/kg</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Laba Bersih */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-emerald-400 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Laba Bersih Usaha</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className={`text-xl sm:text-2xl font-extrabold font-mono tracking-tight ${(metrics?.labaBersih || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatRupiah(metrics?.labaBersih)}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              Laba Kotor: <strong className="text-stone-800">{formatRupiah(metrics?.labaKotor)}</strong>
            </div>
            <div className="text-[11px] text-emerald-700 font-bold">
              Net Margin: {metrics?.totalOmzet && metrics.totalOmzet > 0 ? `${((metrics.labaBersih / metrics.totalOmzet) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>
        </div>

        {/* Card 4: Modal Belum Kembali */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-amber-400 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Modal Belum Kembali</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-amber-800 font-mono tracking-tight">
              {formatRupiah(metrics?.modalBelumKembali)}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              Total Investasi: <strong className="text-stone-800">{formatRupiah(metrics?.totalInvestasi)}</strong>
            </div>
            <div className="text-[11px] text-amber-800 font-bold">
              ROI Sederhana: {metrics?.roiSederhanaPersen || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* 4. Cash Flow Chart & Profitability Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cash Flow Chart */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-stone-900 text-xs sm:text-sm">Arus Kas Bulanan (Cash Flow)</h3>
              <p className="text-[11px] text-stone-500">Pemasukan vs Pengeluaran Riil ({yearFilter})</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Masuk
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Keluar
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `${val >= 1000000 ? `${(val / 1000000).toFixed(0)}jt` : `${(val / 1000).toFixed(0)}k`}`}
                />
                <Tooltip
                  formatter={(val: any) => formatRupiah(Number(val))}
                  contentStyle={{ backgroundColor: '#1c1917', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="pemasukan" name="Pemasukan" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profitability per Cycle Chart (Omzet vs Biaya vs Laba) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-stone-900 text-xs sm:text-sm">Omzet vs Biaya vs Laba per Siklus</h3>
              <p className="text-[11px] text-stone-500">Evaluasi Profitabilitas Produksi Antar Siklus</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
              {cycleDetails.length} Siklus
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cycleChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="siklus" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `${val >= 1000000 ? `${(val / 1000000).toFixed(0)}jt` : `${(val / 1000).toFixed(0)}k`}`}
                />
                <Tooltip
                  formatter={(val: any) => formatRupiah(Number(val))}
                  contentStyle={{ backgroundColor: '#1c1917', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                <Bar dataKey="omzet" name="Omzet" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="biayaProduksi" name="Biaya HPP" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="labaBersih" name="Laba Bersih" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. GREENHOUSE AKTIF SECTION (Requirement T) */}
      {activeGreenhouses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-stone-900 text-xs tracking-wider uppercase">
                Greenhouse Aktif
              </h3>
            </div>
            <button
              onClick={() => setActivePage('greenhouses')}
              className="text-emerald-700 hover:text-emerald-800 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
            >
              <span>Kelola Greenhouse</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGreenhouses.map((gh) => {
              const ghTunnels = allTunnels.filter((t) => t.greenhouseId === gh.id);
              const tunnelCount = ghTunnels.length > 0 ? ghTunnels.length : (gh.tunnelCount || 1);
              const plantCapacity = gh.totalPlantCapacity || 2000;

              return (
                <div
                  key={gh.id}
                  className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-stone-900 text-base">{gh.name}</h4>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                          {gh.code || gh.id}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {gh.location || 'Fasilitas Greenhouse Hidroponik'}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-100 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        Dimensi & Luas
                      </span>
                      <div className="font-mono font-extrabold text-stone-900 text-sm mt-0.5">
                        {gh.lengthM} × {gh.widthM} m
                      </div>
                      <div className="text-[11px] font-mono text-emerald-600 font-semibold mt-0.5">
                        {formatNumber(gh.areaM2 || (gh.lengthM || 0) * (gh.widthM || 0))} m²
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        Tunnel & Kapasitas
                      </span>
                      <div className="font-mono font-extrabold text-stone-900 text-sm mt-0.5">
                        {tunnelCount} Tunnel
                      </div>
                      <div className="text-[11px] font-mono text-stone-600 font-semibold mt-0.5">
                        {formatNumber(plantCapacity)} tanaman
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 text-[11px]">
                      Sistem: <strong>{gh.cultivationSystem || 'DFT'}</strong> ({gh.cultivationMedia || 'Pasir'})
                    </span>
                    <button
                      onClick={() => setActivePage('greenhouses')}
                      className="py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition cursor-pointer"
                    >
                      Kelola Greenhouse
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Tunnel 1 & Tunnel 2 Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tunnel 1 */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                T1
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Tunnel 1 ({settings?.panjangTunnelM || 48} × {settings?.lebarTunnelM || 8}m)</h3>
                <span className="text-[10px] text-stone-500">{t1Cycle?.cycle.namaSiklus || 'Belum ada siklus'}</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
              {t1Cycle?.cycle.status || 'Siap Tanam'}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-semibold text-stone-700">
              <span>Populasi: {formatNumber(t1Cycle?.cycle.tanamanHidup || 1000)} Tanaman</span>
              <span>Progress: {t1Progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${t1Progress}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="p-2 bg-stone-50 rounded-xl">
              <span className="text-[10px] text-stone-500 block">Panen</span>
              <strong className="font-mono text-stone-900">{formatNumber(t1Cycle?.totalPanenKg || 0)} kg</strong>
            </div>
            <div className="p-2 bg-stone-50 rounded-xl">
              <span className="text-[10px] text-stone-500 block">HPP / Kg</span>
              <strong className="font-mono text-amber-800">{formatRupiah(t1Cycle?.hppPerKg || 0)}</strong>
            </div>
            <div className="p-2 bg-stone-50 rounded-xl">
              <span className="text-[10px] text-stone-500 block">Laba Bersih</span>
              <strong className="font-mono text-emerald-800">{formatRupiah(t1Cycle?.labaBersih || 0)}</strong>
            </div>
          </div>
        </div>

        {/* Tunnel 2 */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                T2
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Tunnel 2 ({settings?.panjangTunnelM || 48} × {settings?.lebarTunnelM || 8}m)</h3>
                <span className="text-[10px] text-stone-500">{t2Cycle?.cycle.namaSiklus || 'Belum ada siklus'}</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
              {t2Cycle?.cycle.status || 'Persiapan'}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-semibold text-stone-700">
              <span>Populasi: {formatNumber(t2Cycle?.cycle.tanamanHidup || 1000)} Tanaman</span>
              <span>Progress: {t2Progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${t2Progress}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="p-2 bg-stone-50 rounded-xl">
              <span className="text-[10px] text-stone-500 block">Target Panen</span>
              <strong className="font-mono text-stone-900">{formatNumber(t2Cycle?.targetHasilKg || 1000)} kg</strong>
            </div>
            <div className="p-2 bg-stone-50 rounded-xl">
              <span className="text-[10px] text-stone-500 block">Varietas</span>
              <strong className="truncate block text-emerald-800">{t2Cycle?.cycle.varietas || 'Fujisawa'}</strong>
            </div>
            <div className="p-2 bg-stone-50 rounded-xl">
              <span className="text-[10px] text-stone-500 block">Tgl Panen Target</span>
              <strong className="text-[11px] block text-stone-800">{formatDate(t2Cycle?.cycle.targetPanen)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Production Performance Summary */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sprout className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-stone-900 text-xs sm:text-sm">Performa Produksi Melon</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Kapasitas: {settings?.kapasitasTanaman || 2000} Tanaman
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-3 text-xs">
          <div className="p-2.5 bg-stone-50 rounded-xl">
            <span className="text-[10px] text-stone-500 font-medium block">Tanaman Aktif</span>
            <span className="font-extrabold font-mono text-emerald-800 text-sm mt-0.5 block">
              {formatNumber(metrics?.totalTanamanAktif)} btg
            </span>
          </div>

          <div className="p-2.5 bg-stone-50 rounded-xl">
            <span className="text-[10px] text-stone-500 font-medium block">Tanaman Mati</span>
            <span className="font-extrabold font-mono text-rose-700 text-sm mt-0.5 block">
              {formatNumber(metrics?.totalTanamanMati)} btg
            </span>
          </div>

          <div className="p-2.5 bg-stone-50 rounded-xl">
            <span className="text-[10px] text-stone-500 font-medium block">Total Panen</span>
            <span className="font-extrabold font-mono text-stone-900 text-sm mt-0.5 block">
              {formatNumber(metrics?.totalPanenKg)} kg
            </span>
          </div>

          <div className="p-2.5 bg-stone-50 rounded-xl">
            <span className="text-[10px] text-stone-500 font-medium block">Target Panen</span>
            <span className="font-extrabold font-mono text-stone-900 text-sm mt-0.5 block">
              {formatNumber(metrics?.targetPanenKg)} kg
            </span>
          </div>

          <div className="p-2.5 bg-stone-50 rounded-xl">
            <span className="text-[10px] text-stone-500 font-medium block">Pencapaian Target</span>
            <span className="font-extrabold font-mono text-blue-700 text-sm mt-0.5 block">
              {metrics?.persenTargetPanen}%
            </span>
          </div>

          <div className="p-2.5 bg-stone-50 rounded-xl">
            <span className="text-[10px] text-stone-500 font-medium block">HPP / Kg</span>
            <span className="font-extrabold font-mono text-amber-800 text-sm mt-0.5 block">
              {formatRupiah(metrics?.hppRataRataPerKg)}
            </span>
          </div>

          <div className="p-2.5 bg-stone-50 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] text-stone-500 font-medium block">Harga Jual / Kg</span>
            <span className="font-extrabold font-mono text-emerald-800 text-sm mt-0.5 block">
              {metrics?.totalPanenKg && metrics.totalPanenKg > 0 ? formatRupiah(Math.round(metrics.totalOmzet / metrics.totalPanenKg)) : 'Rp 0'}
            </span>
          </div>
        </div>
      </div>

      {/* 7. Payback / Pengembalian Modal Visual Card */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-xs sm:text-sm">Pengembalian Modal Greenhouse (Payback Tracker)</h3>
            <p className="text-[11px] text-stone-500">Dialokasikan dari akumulasi laba bersih siklus tanam</p>
          </div>
          <span className="text-xs font-mono font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            {metrics?.totalInvestasi && metrics.totalInvestasi > 0
              ? `${((metrics.modalKembali / metrics.totalInvestasi) * 100).toFixed(1)}%`
              : '0%'}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-4 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
              style={{
                width: `${metrics?.totalInvestasi ? Math.min(100, (metrics.modalKembali / metrics.totalInvestasi) * 100) : 0}%`
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-stone-600 font-semibold">
            <span>Sudah Kembali: <strong className="text-emerald-700">{formatRupiah(metrics?.modalKembali)}</strong></span>
            <span>Belum Kembali: <strong className="text-amber-800">{formatRupiah(metrics?.modalBelumKembali)}</strong></span>
            <span>Total Investasi: <strong className="text-stone-900">{formatRupiah(metrics?.totalInvestasi)}</strong></span>
          </div>
        </div>
      </div>

      {/* 8. Recent Transactions Preview */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-stone-100">
          <div>
            <h3 className="font-bold text-stone-900 text-xs sm:text-sm">5 Transaksi Terakhir</h3>
            <p className="text-[11px] text-stone-500">Tersimpan di IndexedDB iPhone</p>
          </div>
          <button
            onClick={() => setActivePage('transactions')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Semua Transaksi</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-stone-100">
          {recentTransactions.map((tx) => {
            const isIncome = tx.jenis === 'pemasukan';
            return (
              <div key={tx.id} className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-stone-50 transition">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-stone-900 text-xs truncate">{tx.kategori}</div>
                    <div className="text-[10px] text-stone-500 flex items-center gap-1.5 truncate">
                      <span>{formatDate(tx.tanggal)}</span>
                      <span>•</span>
                      <span>{tx.tunnel}</span>
                      {tx.cycleId && <span>• {tx.cycleId}</span>}
                    </div>
                  </div>
                </div>

                <div className={`text-right font-mono font-bold text-xs shrink-0 ${
                  isIncome ? 'text-emerald-700' : 'text-stone-900'
                }`}>
                  {isIncome ? '+' : '-'}{formatRupiah(tx.nominal)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

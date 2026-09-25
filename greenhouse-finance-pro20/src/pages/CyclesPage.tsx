import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { dataService } from '../services/localDataService.js';
import { Cycle, CycleFinancialDetail, CycleStatus, TunnelChoice, Greenhouse, GreenhouseTunnel } from '../types/index.js';
import { formatRupiah, formatNumber, formatDate } from '../utils/formatters.js';
import {
  Sprout,
  PlusCircle,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Scale,
  DollarSign,
  AlertCircle,
  X,
  Check,
  CheckCircle2,
  Clock,
  Warehouse,
  Building2,
  PieChart as PieIcon,
  Tag
} from 'lucide-react';

const STATUS_COLORS: Record<CycleStatus, { bg: string; text: string; border: string }> = {
  Persiapan: { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-300' },
  Tanam: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Vegetatif: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Generatif: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Menjelang Panen': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  Panen: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Selesai: { bg: 'bg-stone-900', text: 'text-white', border: 'border-stone-800' }
};

export const CyclesPage: React.FC = () => {
  const { refreshTrigger, refreshData, showToast, openTransactionModal } = useApp();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [details, setDetails] = useState<CycleFinancialDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Greenhouse & Tunnel dynamic options
  const [availableGreenhouses, setAvailableGreenhouses] = useState<Greenhouse[]>([]);
  const [availableTunnels, setAvailableTunnels] = useState<GreenhouseTunnel[]>([]);

  // Selected cycle for detailed drawer
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  // Cycle Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);

  const [formData, setFormData] = useState<{
    id: string;
    namaSiklus: string;
    varietas: string;
    greenhouseId: string;
    tunnelId: string;
    tunnel: string;
    tanggalPersiapan: string;
    tanggalTanam: string;
    targetPanen: string;
    jumlahTanaman: number;
    tanamanHidup: number;
    tanamanMati: number;
    status: CycleStatus;
    targetHasilKg: number;
    catatan: string;
  }>({
    id: '',
    namaSiklus: '',
    varietas: 'Inthanon RZ',
    greenhouseId: '',
    tunnelId: '',
    tunnel: 'Tunnel 1',
    tanggalPersiapan: new Date().toISOString().split('T')[0],
    tanggalTanam: new Date().toISOString().split('T')[0],
    targetPanen: new Date(Date.now() + 75 * 24 * 3600 * 1000).toISOString().split('T')[0],
    jumlahTanaman: 1000,
    tanamanHidup: 1000,
    tanamanMati: 0,
    status: 'Persiapan',
    targetHasilKg: 1000,
    catatan: ''
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      dataService.getCycles(),
      dataService.getGreenhouses(),
      dataService.getGreenhouseTunnels()
    ])
      .then(([res, ghList, tnlList]) => {
        if (!isMounted) return;
        setCycles(res.cycles || []);
        setDetails(res.details || []);
        setAvailableGreenhouses(ghList || []);
        setAvailableTunnels(tnlList || []);
        if (!selectedCycleId && res.cycles?.length > 0) {
          setSelectedCycleId(res.cycles[0].id);
        }
      })
      .catch(err => {
        showToast('Gagal memuat data siklus: ' + err.message, 'error');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const activeDetail = details.find(d => d.cycle.id === selectedCycleId);

  const openNewCycleModal = () => {
    setEditingCycle(null);
    let maxNum = 0;
    for (const c of cycles) {
      const match = c.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextId = `S${String(maxNum + 1).padStart(3, '0')}`;

    const defaultGh = availableGreenhouses[0];
    const defaultGhTunnels = defaultGh ? availableTunnels.filter(t => t.greenhouseId === defaultGh.id) : [];
    const defaultTnl = defaultGhTunnels[0];
    const defaultPlantCapacity = defaultTnl?.plantCapacity || 1000;

    setFormData({
      id: nextId,
      namaSiklus: `Siklus ${nextId} - Melon Premium`,
      varietas: 'Inthanon RZ F1',
      greenhouseId: defaultGh?.id || '',
      tunnelId: defaultTnl?.id || '',
      tunnel: defaultTnl?.name || 'Tunnel 1',
      tanggalPersiapan: new Date().toISOString().split('T')[0],
      tanggalTanam: new Date().toISOString().split('T')[0],
      targetPanen: new Date(Date.now() + 75 * 24 * 3600 * 1000).toISOString().split('T')[0],
      jumlahTanaman: defaultPlantCapacity,
      tanamanHidup: defaultPlantCapacity,
      tanamanMati: 0,
      status: 'Persiapan',
      targetHasilKg: defaultPlantCapacity,
      catatan: ''
    });
    setIsModalOpen(true);
  };

  const openEditCycleModal = (c: Cycle) => {
    setEditingCycle(c);
    setFormData({
      id: c.id,
      namaSiklus: c.namaSiklus,
      varietas: c.varietas || '',
      greenhouseId: c.greenhouseId || availableGreenhouses[0]?.id || '',
      tunnelId: c.tunnelId || '',
      tunnel: c.tunnel || 'Tunnel 1',
      tanggalPersiapan: c.tanggalPersiapan || c.tanggalTanam,
      tanggalTanam: c.tanggalTanam,
      targetPanen: c.targetPanen,
      jumlahTanaman: c.jumlahTanaman,
      tanamanHidup: c.tanamanHidup ?? c.jumlahTanaman,
      tanamanMati: c.tanamanMati ?? 0,
      status: c.status,
      targetHasilKg: c.targetHasilKg || c.jumlahTanaman,
      catatan: c.catatan || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCycle) {
        await dataService.updateCycle(editingCycle.id, formData);
        showToast('Siklus tanam berhasil diperbarui', 'success');
      } else {
        const selectedGh = availableGreenhouses.find(g => g.id === formData.greenhouseId);
        const selectedTnl = availableTunnels.find(t => t.id === formData.tunnelId);
        const greenhouseSnapshot = selectedGh ? {
          greenhouseId: selectedGh.id,
          greenhouseName: selectedGh.name,
          lengthM: selectedGh.lengthM,
          widthM: selectedGh.widthM,
          plantCapacity: selectedGh.totalPlantCapacity,
          tunnelId: selectedTnl?.id,
          tunnelName: selectedTnl?.name || formData.tunnel,
          tunnelLengthM: selectedTnl?.lengthM,
          tunnelWidthM: selectedTnl?.widthM,
          tunnelPlantCapacity: selectedTnl?.plantCapacity,
          cultivationSystem: selectedTnl?.cultivationSystem || selectedGh.cultivationSystem || 'DFT',
          cultivationMedia: selectedTnl?.cultivationMedia || selectedGh.cultivationMedia || 'Pasir',
          capturedAt: new Date().toISOString()
        } : undefined;

        await dataService.createCycle({
          ...formData,
          greenhouseSnapshot
        });
        showToast('Siklus tanam baru berhasil dibuat', 'success');
      }
      setIsModalOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan siklus', 'error');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-stone-900 tracking-tight">
            Manajemen Siklus Tanam
          </h2>
          <p className="text-xs lg:text-sm text-stone-500 mt-0.5">
            Pelacakan populasi tanaman, fase pertumbuhan, kalkulasi HPP dan laba rugi tiap siklus
          </p>
        </div>

        <button
          onClick={openNewCycleModal}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Buat Siklus Tanam Baru</span>
        </button>
      </div>

      {/* Cycle Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cycles.map(cycle => {
          const detail = details.find(d => d.cycle.id === cycle.id);
          const isSelected = cycle.id === selectedCycleId;
          const statusStyle = STATUS_COLORS[cycle.status] || STATUS_COLORS.Persiapan;

          return (
            <div
              key={cycle.id}
              onClick={() => setSelectedCycleId(cycle.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
              }`}
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                    {cycle.id}
                  </span>
                  <span className="text-xs font-semibold text-stone-600">{cycle.tunnel}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  {cycle.status}
                </span>
              </div>

              {/* Title & Variety */}
              <h3 className="font-bold text-stone-900 text-base mt-2.5 truncate">
                {cycle.namaSiklus}
              </h3>
              <div className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                <Tag className="w-3 h-3 text-stone-400" />
                <span>Varietas: <strong className="text-stone-700">{cycle.varietas}</strong></span>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-stone-100 text-center">
                <div className="p-2 bg-stone-50 rounded-xl">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase block">Tanaman</span>
                  <span className="text-xs font-bold text-stone-900 font-mono mt-0.5 block">
                    {formatNumber(cycle.tanamanHidup || cycle.jumlahTanaman)}
                  </span>
                </div>
                <div className="p-2 bg-stone-50 rounded-xl">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase block">HPP / Kg</span>
                  <span className="text-xs font-bold text-emerald-700 font-mono mt-0.5 block">
                    {detail?.hppPerKg ? formatRupiah(detail.hppPerKg) : '-'}
                  </span>
                </div>
                <div className="p-2 bg-stone-50 rounded-xl">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase block">Hasil Panen</span>
                  <span className="text-xs font-bold text-stone-900 font-mono mt-0.5 block">
                    {detail?.totalPanenKg ? `${formatNumber(detail.totalPanenKg)} kg` : '0 kg'}
                  </span>
                </div>
              </div>

              {/* Action buttons inside card */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditCycleModal(cycle);
                  }}
                  className="text-stone-500 hover:text-stone-900 font-semibold cursor-pointer"
                >
                  Edit Siklus
                </button>
                <div className="text-emerald-700 font-bold flex items-center gap-1">
                  <span>Rincian HPP</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Cycle Financial Detail Drawer / Panel */}
      {activeDetail && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {activeDetail.cycle.id}
                </span>
                <h3 className="text-lg font-bold text-stone-900">
                  Rincian Keuangan & HPP: {activeDetail.cycle.namaSiklus}
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Lokasi: {activeDetail.cycle.tunnel} • Populasi: {formatNumber(activeDetail.cycle.jumlahTanaman)} tanaman ({activeDetail.cycle.tanamanHidup} hidup, {activeDetail.cycle.tanamanMati} mati)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openTransactionModal({ cycleId: activeDetail.cycle.id, tunnel: activeDetail.cycle.tunnel as TunnelChoice, jenis: 'pengeluaran', kelompokTransaksi: 'produksi' })}
                className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                + Tambah Biaya Siklus Ini
              </button>
            </div>
          </div>

          {/* Historical Greenhouse Snapshot Banner (Requirement R) */}
          {activeDetail.cycle.greenhouseSnapshot && (
            <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-950 block">
                  Snapshot Historis Spesifikasi Greenhouse (Terkunci saat siklus dibuat):
                </span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  <strong>{activeDetail.cycle.greenhouseSnapshot.greenhouseName}</strong>
                  {activeDetail.cycle.greenhouseSnapshot.lengthM && ` (${activeDetail.cycle.greenhouseSnapshot.lengthM} × ${activeDetail.cycle.greenhouseSnapshot.widthM} m)`}
                  {activeDetail.cycle.greenhouseSnapshot.tunnelName && ` • Lokasi: ${activeDetail.cycle.greenhouseSnapshot.tunnelName}`}
                  {activeDetail.cycle.greenhouseSnapshot.cultivationSystem && ` • Sistem: ${activeDetail.cycle.greenhouseSnapshot.cultivationSystem}`}
                  {activeDetail.cycle.greenhouseSnapshot.cultivationMedia && ` (${activeDetail.cycle.greenhouseSnapshot.cultivationMedia})`}
                </p>
              </div>
            </div>
          )}

          {/* 4 Core Financial Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Total Biaya Produksi</span>
              <span className="text-xl font-extrabold text-stone-900 font-mono mt-1 block">
                {formatRupiah(activeDetail.totalBiayaProduksi)}
              </span>
              <span className="text-[11px] text-stone-500 mt-1 block">
                HPP per Tanaman: <strong className="text-stone-800">{formatRupiah(activeDetail.hppPerTanaman)}</strong>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Total Omzet Panen</span>
              <span className="text-xl font-extrabold text-blue-900 font-mono mt-1 block">
                {formatRupiah(activeDetail.omzet)}
              </span>
              <span className="text-[11px] text-blue-700 mt-1 block">
                Total Panen: <strong className="text-blue-900">{formatNumber(activeDetail.totalPanenKg)} kg</strong>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">HPP Rata-rata per Kg</span>
              <span className="text-xl font-extrabold text-amber-900 font-mono mt-1 block">
                {formatRupiah(activeDetail.hppPerKg)}
                <span className="text-xs font-normal text-amber-700"> / kg</span>
              </span>
              <span className="text-[11px] text-amber-800 mt-1 block">
                Harga Jual Rata-rata: <strong>{formatRupiah(activeDetail.hargaJualRataRata)}/kg</strong>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Laba Bersih Siklus</span>
              <span className="text-xl font-extrabold text-emerald-900 font-mono mt-1 block">
                {formatRupiah(activeDetail.labaBersih)}
              </span>
              <span className="text-[11px] text-emerald-700 mt-1 block">
                Laba Kotor: <strong>{formatRupiah(activeDetail.labaKotor)}</strong>
              </span>
            </div>
          </div>

          {/* Breakdown Biaya Produksi per Kategori (Rule 14 Requirements) */}
          <div>
            <h4 className="font-bold text-stone-900 text-sm mb-3 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <span>Rincian Biaya per Kategori Produksi (Siklus {activeDetail.cycle.id})</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 font-medium">1. Biaya Benih</span>
                <div className="font-bold text-stone-900 font-mono text-sm mt-0.5">{formatRupiah(activeDetail.biayaBenih)}</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 font-medium">2. Biaya AB Mix & Nutrisi</span>
                <div className="font-bold text-stone-900 font-mono text-sm mt-0.5">{formatRupiah(activeDetail.biayaNutrisi)}</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 font-medium">3. Biaya Media Tanam</span>
                <div className="font-bold text-stone-900 font-mono text-sm mt-0.5">{formatRupiah(activeDetail.biayaMedia)}</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 font-medium">4. Biaya Pestisida & Fungisida</span>
                <div className="font-bold text-stone-900 font-mono text-sm mt-0.5">{formatRupiah(activeDetail.biayaPestisida)}</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 font-medium">5. Biaya Tenaga Kerja Perawatan</span>
                <div className="font-bold text-stone-900 font-mono text-sm mt-0.5">{formatRupiah(activeDetail.biayaTenagaKerja)}</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 font-medium">6. Biaya Listrik & Air DFT</span>
                <div className="font-bold text-stone-900 font-mono text-sm mt-0.5">{formatRupiah(activeDetail.biayaListrikAir)}</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 font-medium">7. Biaya Kemasan / Kardus</span>
                <div className="font-bold text-stone-900 font-mono text-sm mt-0.5">{formatRupiah(activeDetail.biayaKemasan)}</div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 font-medium">8. Biaya Lain-lain</span>
                <div className="font-bold text-stone-900 font-mono text-sm mt-0.5">{formatRupiah(activeDetail.biayaLainnya)}</div>
              </div>
            </div>
          </div>

          {/* Panen Breakdown Grade A, B, C */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-stone-900 block">Kualitas Hasil Panen (Grade Ratio)</span>
              <span className="text-stone-500">Rasio sortasi mutu buah melon siklus ini</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <span className="text-[10px] text-stone-500 block">Grade A</span>
                <span className="font-bold font-mono text-emerald-700">{formatNumber(activeDetail.panenGradeA)} kg</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-stone-500 block">Grade B</span>
                <span className="font-bold font-mono text-amber-700">{formatNumber(activeDetail.panenGradeB)} kg</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-stone-500 block">Grade C</span>
                <span className="font-bold font-mono text-rose-700">{formatNumber(activeDetail.panenGradeC)} kg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cycle Modal: Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div 
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-cycle-title"
          >
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 id="modal-cycle-title" className="text-base font-bold">
                {editingCycle ? `Edit Siklus ${editingCycle.id}` : 'Buat Siklus Tanam Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCycle} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="cycle-modal-id-input" className="block font-bold text-stone-700 mb-1">ID Siklus</label>
                  <input
                    id="cycle-modal-id-input"
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor="cycle-modal-name-input" className="block font-bold text-stone-700 mb-1">Nama Siklus</label>
                  <input
                    id="cycle-modal-name-input"
                    type="text"
                    value={formData.namaSiklus}
                    onChange={(e) => setFormData({ ...formData, namaSiklus: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Greenhouse & Tunnel Selection (Requirement Q) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cycle-modal-gh-select" className="block font-bold text-stone-700 mb-1">
                    Greenhouse
                  </label>
                  <select
                    id="cycle-modal-gh-select"
                    value={formData.greenhouseId}
                    onChange={(e) => {
                      const newGhId = e.target.value;
                      const ghTunnels = availableTunnels.filter(t => t.greenhouseId === newGhId);
                      const firstTnl = ghTunnels[0];
                      const newCap = firstTnl?.plantCapacity || formData.jumlahTanaman;
                      setFormData({
                        ...formData,
                        greenhouseId: newGhId,
                        tunnelId: firstTnl?.id || '',
                        tunnel: firstTnl?.name || 'Tunnel 1',
                        jumlahTanaman: newCap,
                        tanamanHidup: newCap - formData.tanamanMati
                      });
                    }}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900"
                  >
                    {availableGreenhouses.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.lengthM}×{g.widthM}m)
                      </option>
                    ))}
                    {availableGreenhouses.length === 0 && (
                      <option value="">Greenhouse Default</option>
                    )}
                  </select>
                </div>

                <div>
                  <label htmlFor="cycle-modal-tunnel-select" className="block font-bold text-stone-700 mb-1">
                    Tunnel
                  </label>
                  <select
                    id="cycle-modal-tunnel-select"
                    value={formData.tunnelId || formData.tunnel}
                    onChange={(e) => {
                      const val = e.target.value;
                      const tnl = availableTunnels.find(t => t.id === val || t.name === val);
                      if (tnl) {
                        const newCap = tnl.plantCapacity || formData.jumlahTanaman;
                        setFormData({
                          ...formData,
                          tunnelId: tnl.id,
                          tunnel: tnl.name,
                          jumlahTanaman: newCap,
                          tanamanHidup: newCap - formData.tanamanMati
                        });
                      } else {
                        setFormData({ ...formData, tunnel: val });
                      }
                    }}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900"
                  >
                    {availableTunnels
                      .filter(t => !formData.greenhouseId || t.greenhouseId === formData.greenhouseId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.lengthM}×{t.widthM}m - {t.plantCapacity || 1000} tanaman)
                        </option>
                      ))}
                    {availableTunnels.filter(t => !formData.greenhouseId || t.greenhouseId === formData.greenhouseId).length === 0 && (
                      <>
                        <option value="Tunnel 1">Tunnel 1 (8x48m)</option>
                        <option value="Tunnel 2">Tunnel 2 (8x48m)</option>
                        <option value="Kedua Tunnel">Kedua Tunnel (16x48m)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="cycle-modal-variety-input" className="block font-bold text-stone-700 mb-1">Varietas Melon</label>
                <input
                  id="cycle-modal-variety-input"
                  type="text"
                  placeholder="Contoh: Inthanon RZ F1"
                  value={formData.varietas}
                  onChange={(e) => setFormData({ ...formData, varietas: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  required
                />
              </div>

              {/* Plant Population (Dynamically adjustable per prompt Rule 1) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="cycle-modal-total-plants-input" className="block font-bold text-stone-700 mb-1">Populasi Awal</label>
                  <input
                    id="cycle-modal-total-plants-input"
                    type="number"
                    value={formData.jumlahTanaman}
                    onChange={(e) => setFormData({
                      ...formData,
                      jumlahTanaman: Number(e.target.value),
                      tanamanHidup: Number(e.target.value) - formData.tanamanMati
                    })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="cycle-modal-alive-plants-input" className="block font-bold text-stone-700 mb-1">Tanaman Hidup</label>
                  <input
                    id="cycle-modal-alive-plants-input"
                    type="number"
                    value={formData.tanamanHidup}
                    onChange={(e) => setFormData({ ...formData, tanamanHidup: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono text-emerald-700 font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="cycle-modal-dead-plants-input" className="block font-bold text-stone-700 mb-1">Tanaman Mati</label>
                  <input
                    id="cycle-modal-dead-plants-input"
                    type="number"
                    value={formData.tanamanMati}
                    onChange={(e) => setFormData({ ...formData, tanamanMati: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono text-rose-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cycle-modal-plant-date-input" className="block font-bold text-stone-700 mb-1">Tanggal Tanam</label>
                  <input
                    id="cycle-modal-plant-date-input"
                    type="date"
                    value={formData.tanggalTanam}
                    onChange={(e) => setFormData({ ...formData, tanggalTanam: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="cycle-modal-harvest-target-input" className="block font-bold text-stone-700 mb-1">Target Panen</label>
                  <input
                    id="cycle-modal-harvest-target-input"
                    type="date"
                    value={formData.targetPanen}
                    onChange={(e) => setFormData({ ...formData, targetPanen: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cycle-modal-status-select" className="block font-bold text-stone-700 mb-1">Status Siklus</label>
                <select
                  id="cycle-modal-status-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as CycleStatus })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                >
                  <option value="Persiapan">Persiapan (Sterilisasi & Semai)</option>
                  <option value="Tanam">Tanam (Pindah Tanam)</option>
                  <option value="Vegetatif">Vegetatif (Pertumbuhan Daun & Batang)</option>
                  <option value="Generatif">Generatif (Polinasi & Pembesaran Buah)</option>
                  <option value="Menjelang Panen">Menjelang Panen (Pematangan & Netting)</option>
                  <option value="Panen">Panen (Sedang Berjalan)</option>
                  <option value="Selesai">Selesai (Tuntas Panen & Evaluasi)</option>
                </select>
              </div>

              <div>
                <label htmlFor="cycle-modal-notes-input" className="block font-bold text-stone-700 mb-1">Catatan Tambahan</label>
                <textarea
                  id="cycle-modal-notes-input"
                  rows={2}
                  placeholder="Catatan kondisi tanaman, target brix, nutrisi..."
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
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
                  Simpan Siklus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

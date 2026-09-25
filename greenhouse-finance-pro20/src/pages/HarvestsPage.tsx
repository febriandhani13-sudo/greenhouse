import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.js';
import { dataService } from '../services/localDataService.js';
import { Harvest, Cycle } from '../types/index.js';
import { formatRupiah, formatNumber, formatDate } from '../utils/formatters.js';
import {
  Scale,
  PlusCircle,
  TrendingUp,
  Download,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Check,
  Building,
  UserCheck
} from 'lucide-react';

export const HarvestsPage: React.FC = () => {
  const { refreshTrigger, refreshData, showToast, cyclesList } = useApp();
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [selectedCycleFilter, setSelectedCycleFilter] = useState<string>('semua');

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    id: string;
    tanggal: string;
    cycleId: string;
    tunnel: 'Tunnel 1' | 'Tunnel 2' | 'Kedua Tunnel';
    totalKg: number;
    gradeA: number;
    gradeB: number;
    gradeC: number;
    hargaRataRata: number;
    pembeli: string;
    statusPembayaran: 'Lunas' | 'Sebagian' | 'Belum Lunas';
    dibayar: number;
    catatan: string;
    createTransactionRecord: boolean;
  }>({
    id: '',
    tanggal: new Date().toISOString().split('T')[0],
    cycleId: cyclesList[0]?.id || 'S001',
    tunnel: 'Tunnel 1',
    totalKg: 300,
    gradeA: 240,
    gradeB: 50,
    gradeC: 10,
    hargaRataRata: 25000,
    pembeli: 'Distributor Supermarket Buah',
    statusPembayaran: 'Lunas',
    dibayar: 7500000,
    catatan: '',
    createTransactionRecord: true
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    dataService.getHarvests()
      .then(data => {
        if (isMounted) setHarvests(data);
      })
      .catch(err => {
        showToast('Gagal memuat panen: ' + err.message, 'error');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const filteredHarvests = useMemo(() => {
    if (selectedCycleFilter === 'semua') return harvests;
    return harvests.filter(h => h.cycleId === selectedCycleFilter);
  }, [harvests, selectedCycleFilter]);

  // Aggregate stats
  const { totalKgAll, totalOmzetAll, totalGradeA, totalGradeB, totalGradeC } = useMemo(() => {
    let kg = 0;
    let omzet = 0;
    let a = 0;
    let b = 0;
    let c = 0;
    for (const h of filteredHarvests) {
      kg += h.totalKg;
      omzet += h.totalNominal;
      a += h.gradeA;
      b += h.gradeB;
      c += h.gradeC;
    }
    return {
      totalKgAll: kg,
      totalOmzetAll: omzet,
      totalGradeA: a,
      totalGradeB: b,
      totalGradeC: c
    };
  }, [filteredHarvests]);

  const openNewHarvestModal = () => {
    setEditingHarvest(null);
    let maxNum = 0;
    for (const h of harvests) {
      const match = h.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextId = `HRV-${String(maxNum + 1).padStart(3, '0')}`;
    setFormData({
      id: nextId,
      tanggal: new Date().toISOString().split('T')[0],
      cycleId: cyclesList[0]?.id || 'S001',
      tunnel: 'Tunnel 1',
      totalKg: 350,
      gradeA: 280,
      gradeB: 50,
      gradeC: 20,
      hargaRataRata: 25000,
      pembeli: 'Grosir Buah Segar',
      statusPembayaran: 'Lunas',
      dibayar: 350 * 25000,
      catatan: '',
      createTransactionRecord: true
    });
    setIsModalOpen(true);
  };

  const openEditHarvestModal = (harvest: Harvest) => {
    setEditingHarvest(harvest);
    setFormData({
      id: harvest.id,
      tanggal: harvest.tanggal,
      cycleId: harvest.cycleId,
      tunnel: harvest.tunnel,
      totalKg: harvest.totalKg,
      gradeA: harvest.gradeA,
      gradeB: harvest.gradeB,
      gradeC: harvest.gradeC,
      hargaRataRata: harvest.hargaRataRata,
      pembeli: harvest.pembeli,
      statusPembayaran: harvest.statusPembayaran,
      dibayar: harvest.dibayar ?? 0,
      catatan: harvest.catatan || '',
      createTransactionRecord: true
    });
    setIsModalOpen(true);
  };

  const handleGradeChange = (grade: 'A' | 'B' | 'C', val: number) => {
    const newA = grade === 'A' ? val : formData.gradeA;
    const newB = grade === 'B' ? val : formData.gradeB;
    const newC = grade === 'C' ? val : formData.gradeC;
    const sumKg = newA + newB + newC;
    const nominal = sumKg * formData.hargaRataRata;

    setFormData(prev => ({
      ...prev,
      gradeA: newA,
      gradeB: newB,
      gradeC: newC,
      totalKg: sumKg,
      dibayar: prev.statusPembayaran === 'Lunas' ? nominal : prev.dibayar
    }));
  };

  const handlePriceChange = (val: number) => {
    const nominal = formData.totalKg * val;
    setFormData(prev => ({
      ...prev,
      hargaRataRata: val,
      dibayar: prev.statusPembayaran === 'Lunas' ? nominal : prev.dibayar
    }));
  };

  const handleStatusChange = (newStatus: 'Lunas' | 'Sebagian' | 'Belum Lunas') => {
    const total = formData.totalKg * formData.hargaRataRata;
    let newDibayar = formData.dibayar;
    if (newStatus === 'Lunas') {
      newDibayar = total;
    } else if (newStatus === 'Belum Lunas') {
      newDibayar = 0;
    } else if (newStatus === 'Sebagian') {
      newDibayar = (formData.dibayar > 0 && formData.dibayar < total) ? formData.dibayar : Math.round(total / 2);
    }
    setFormData(prev => ({
      ...prev,
      statusPembayaran: newStatus,
      dibayar: newDibayar
    }));
  };

  const handleSaveHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.totalKg <= 0 || formData.hargaRataRata <= 0) {
      showToast('Total kg dan harga jual harus lebih dari 0', 'error');
      return;
    }

    try {
      if (editingHarvest) {
        await dataService.updateHarvest(editingHarvest.id, formData);
        showToast('Data panen berhasil diperbarui', 'success');
      } else {
        const { id, ...createPayload } = formData;
        await dataService.createHarvest(createPayload);
        showToast('Panen dan penjualan berhasil dicatat!', 'success');
      }
      setIsModalOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan panen', 'error');
    }
  };

  const handleDeleteHarvest = async () => {
    if (!deleteTargetId) return;
    try {
      await dataService.deleteHarvest(deleteTargetId);
      showToast('Data panen berhasil dihapus', 'success');
      setDeleteTargetId(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus panen', 'error');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-stone-900 tracking-tight">
            Panen & Penjualan Melon
          </h2>
          <p className="text-xs lg:text-sm text-stone-500 mt-0.5">
            Pencatatan bertahap (multiple harvest), sortasi grade A/B/C, dan kalkulasi omzet riil
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dataService.exportCSV('harvests')}
            className="py-2.5 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={openNewHarvestModal}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Catat Hasil Panen</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Total Panen (Kg)</span>
          <div className="text-2xl font-extrabold text-stone-900 font-mono mt-1">
            {formatNumber(totalKgAll)} <span className="text-xs text-stone-500 font-normal">kg</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Dari {filteredHarvests.length} kali panen tercatat
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Total Omzet Penjualan</span>
          <div className="text-2xl font-extrabold text-blue-700 font-mono mt-1">
            {formatRupiah(totalOmzetAll)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Harga Rata-rata: <strong className="text-stone-800">{totalKgAll > 0 ? formatRupiah(Math.round(totalOmzetAll / totalKgAll)) : 'Rp 0'}/kg</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Sortasi Grade A (Super)</span>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            {formatNumber(totalGradeA)} <span className="text-xs text-stone-500 font-normal">kg</span>
          </div>
          <div className="text-[11px] text-emerald-800 mt-1">
            {totalKgAll > 0 ? `${((totalGradeA / totalKgAll) * 100).toFixed(1)}%` : '0%'} dari total panen
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Grade B & Grade C</span>
          <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1">
            {formatNumber(totalGradeB + totalGradeC)} <span className="text-xs text-stone-500 font-normal">kg</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Grade B: {formatNumber(totalGradeB)} kg • Grade C: {formatNumber(totalGradeC)} kg
          </div>
        </div>
      </div>

      {/* Cycle Filter Selection */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCycleFilter('semua')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            selectedCycleFilter === 'semua'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          Semua Panen ({harvests.length})
        </button>
        {cyclesList.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCycleFilter(c.id)}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCycleFilter === c.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {c.id} - {(c.namaSiklus || '').split('-')[0].trim()} ({c.tunnel})
          </button>
        ))}
      </div>

      {/* Harvests Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">Tanggal & ID</th>
                <th className="py-3.5 px-4">Siklus & Tunnel</th>
                <th className="py-3.5 px-4 text-center">Total (Kg)</th>
                <th className="py-3.5 px-4 text-center">Rincian Grade</th>
                <th className="py-3.5 px-4 text-right">Harga Jual / Kg</th>
                <th className="py-3.5 px-4 text-right">Total Omzet</th>
                <th className="py-3.5 px-4">Pembeli / Buyer</th>
                <th className="py-3.5 px-4 text-center">Status Bayar</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredHarvests.map(h => (
                <tr key={h.id} className="hover:bg-stone-50/90 transition group">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-stone-900">{formatDate(h.tanggal)}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{h.id}</div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-stone-900">{h.cycleId}</div>
                    <div className="text-[11px] text-stone-500">{h.tunnel}</div>
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="font-extrabold text-sm font-mono text-stone-900">
                      {formatNumber(h.totalKg)} kg
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">
                        A: {h.gradeA}kg
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">
                        B: {h.gradeB}kg
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 font-bold">
                        C: {h.gradeC}kg
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-semibold whitespace-nowrap">
                    {formatRupiah(h.hargaRataRata)}/kg
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-700 whitespace-nowrap text-sm">
                    {formatRupiah(h.totalNominal)}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-stone-900 truncate max-w-xs">{h.pembeli}</div>
                    {h.catatan && <div className="text-[11px] text-stone-500 truncate max-w-xs">{h.catatan}</div>}
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      h.statusPembayaran === 'Lunas'
                        ? 'bg-emerald-100 text-emerald-800'
                        : h.statusPembayaran === 'Sebagian'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {h.statusPembayaran}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditHarvestModal(h)}
                        className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title="Edit data panen"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(h.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus data panen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredHarvests.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    <Scale className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-600">Belum ada panen tercatat untuk siklus ini</p>
                  </td>
                </tr>
              )}
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
            aria-labelledby="dialog-delete-harvest-title"
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 id="dialog-delete-harvest-title" className="text-base font-bold text-stone-900">Hapus Data Panen</h3>
              <p className="text-xs text-stone-500 mt-1">
                Apakah Anda yakin ingin menghapus data panen ini?
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
                onClick={handleDeleteHarvest}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Harvest Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div 
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-harvest-title"
          >
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 id="modal-harvest-title" className="text-base font-bold">
                {editingHarvest ? 'Edit Data Panen & Penjualan' : 'Catat Panen & Penjualan Melon'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHarvest} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="harvest-modal-date-input" className="block font-bold text-stone-700 mb-1">Tanggal Panen</label>
                  <input
                    id="harvest-modal-date-input"
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="harvest-modal-cycle-select" className="block font-bold text-stone-700 mb-1">Siklus Terkait</label>
                  <select
                    id="harvest-modal-cycle-select"
                    value={formData.cycleId}
                    onChange={(e) => {
                      const sel = cyclesList.find(c => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        cycleId: e.target.value,
                        tunnel: (sel?.tunnel as 'Tunnel 1' | 'Tunnel 2' | 'Kedua Tunnel') || 'Tunnel 1'
                      });
                    }}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  >
                    {cyclesList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.id} - {c.namaSiklus} ({c.tunnel})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grade A, B, C input */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="font-bold text-stone-800">Bobot Hasil Panen Berdasarkan Grade:</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="harvest-modal-grade-a-input" className="block text-[11px] font-semibold text-emerald-800 mb-0.5">Grade A (Super)</label>
                    <input
                      id="harvest-modal-grade-a-input"
                      type="number"
                      placeholder="0"
                      value={formData.gradeA}
                      onChange={(e) => handleGradeChange('A', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor="harvest-modal-grade-b-input" className="block text-[11px] font-semibold text-amber-800 mb-0.5">Grade B (Medium)</label>
                    <input
                      id="harvest-modal-grade-b-input"
                      type="number"
                      placeholder="0"
                      value={formData.gradeB}
                      onChange={(e) => handleGradeChange('B', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor="harvest-modal-grade-c-input" className="block text-[11px] font-semibold text-rose-800 mb-0.5">Grade C (Afkir)</label>
                    <input
                      id="harvest-modal-grade-c-input"
                      type="number"
                      placeholder="0"
                      value={formData.gradeC}
                      onChange={(e) => handleGradeChange('C', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-stone-200">
                  <span className="font-bold text-stone-600">Total Panen Otomatis:</span>
                  <span className="font-extrabold font-mono text-stone-900 text-sm">{formatNumber(formData.totalKg)} kg</span>
                </div>
              </div>

              {/* Harga Jual & Omzet */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="harvest-modal-price-input" className="block font-bold text-stone-700 mb-1">Harga Jual / Kg (Rp)</label>
                  <input
                    id="harvest-modal-price-input"
                    type="number"
                    value={formData.hargaRataRata}
                    onChange={(e) => handlePriceChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="harvest-modal-total-nominal-readonly" className="block font-bold text-stone-700 mb-1">Total Omzet (Kalkulasi)</label>
                  <input
                    id="harvest-modal-total-nominal-readonly"
                    type="text"
                    readOnly
                    value={formatRupiah(formData.totalKg * formData.hargaRataRata)}
                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl font-mono font-extrabold text-emerald-900"
                  />
                </div>
              </div>

              {/* Pembeli & Status Bayar */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="harvest-modal-buyer-input" className="block font-bold text-stone-700 mb-1">Nama Pembeli / Distributor</label>
                  <input
                    id="harvest-modal-buyer-input"
                    type="text"
                    placeholder="Contoh: Toko Buah Segar"
                    value={formData.pembeli}
                    onChange={(e) => setFormData({ ...formData, pembeli: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="harvest-modal-payment-status-select" className="block font-bold text-stone-700 mb-1">Status Pembayaran</label>
                  <select
                    id="harvest-modal-payment-status-select"
                    value={formData.statusPembayaran}
                    onChange={(e) => handleStatusChange(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  >
                    <option value="Lunas">Lunas (Langsung Terima Kas)</option>
                    <option value="Sebagian">Sebagian (DP / Termin)</option>
                    <option value="Belum Lunas">Belum Lunas (Piutang Tempo)</option>
                  </select>
                </div>
              </div>

              {formData.statusPembayaran === 'Sebagian' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1 animate-scale-up">
                  <label htmlFor="harvest-modal-partial-paid-input" className="block font-bold text-amber-900 text-xs">
                    Nominal Pembayaran Diterima / DP (Rp)
                  </label>
                  <input
                    id="harvest-modal-partial-paid-input"
                    type="number"
                    value={formData.dibayar}
                    onChange={(e) => setFormData({ ...formData, dibayar: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-amber-950"
                    placeholder="0"
                    max={formData.totalKg * formData.hargaRataRata}
                  />
                  <div className="flex justify-between text-[11px] text-amber-800 font-semibold pt-1">
                    <span>Sisa Piutang Tempo:</span>
                    <span className="font-mono font-bold text-amber-900">
                      {formatRupiah(Math.max(0, (formData.totalKg * formData.hargaRataRata) - (formData.dibayar || 0)))}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="harvest-modal-notes-input" className="block font-bold text-stone-700 mb-1">Catatan Panen</label>
                <input
                  id="harvest-modal-notes-input"
                  type="text"
                  placeholder="Kadar brix rata-rata, kualitas jaring net, dll"
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <input
                  type="checkbox"
                  id="autoRecordTx"
                  checked={formData.createTransactionRecord}
                  onChange={(e) => setFormData({ ...formData, createTransactionRecord: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="autoRecordTx" className="text-xs text-emerald-900 font-semibold cursor-pointer">
                  Otomatis catat uang masuk di Buku Transaksi & Saldo Kas
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
                  {editingHarvest ? 'Simpan Perubahan' : 'Simpan Panen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.js';
import { localDataService } from '../services/localDataService.js';
import { Greenhouse, GreenhouseTunnel, GreenhouseStatus, TunnelStatus } from '../types/index.js';
import { formatNumber, formatRupiah } from '../utils/formatters.js';
import { GreenhouseFormModal } from '../components/greenhouse/GreenhouseFormModal.js';
import { TunnelFormModal } from '../components/greenhouse/TunnelFormModal.js';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Ruler,
  Sprout,
  Droplets,
  Wrench,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Eye,
  Info,
  PowerOff
} from 'lucide-react';

export const GreenhousesPage: React.FC = () => {
  const { refreshTrigger, refreshData, showToast } = useApp();

  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([]);
  const [tunnels, setTunnels] = useState<GreenhouseTunnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detail View State
  const [selectedGreenhouseId, setSelectedGreenhouseId] = useState<string | null>(null);

  // Modal States
  const [isGhModalOpen, setIsGhModalOpen] = useState(false);
  const [editingGh, setEditingGh] = useState<Greenhouse | null>(null);

  const [isTunnelModalOpen, setIsTunnelModalOpen] = useState(false);
  const [editingTunnel, setEditingTunnel] = useState<GreenhouseTunnel | null>(null);

  // Delete & Deactivate Protection Modals
  const [ghDeleteTarget, setGhDeleteTarget] = useState<{
    gh: Greenhouse;
    related: { tunnelCount: number; cycleCount: number; investmentCount: number };
  } | null>(null);

  const [tunnelDeleteTarget, setTunnelDeleteTarget] = useState<{
    tunnel: GreenhouseTunnel;
    related: { cycleCount: number; relatedCycles: string[] };
  } | null>(null);

  // Load all data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      localDataService.getGreenhouses(),
      localDataService.getGreenhouseTunnels()
    ])
      .then(([ghList, tnlList]) => {
        if (!isMounted) return;
        setGreenhouses(ghList);
        setTunnels(tnlList);
      })
      .catch((err) => {
        showToast('Gagal memuat data greenhouse: ' + err.message, 'error');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  // Selected greenhouse and its tunnels
  const selectedGreenhouse = useMemo(() => {
    if (!selectedGreenhouseId) return null;
    return greenhouses.find((g) => g.id === selectedGreenhouseId) || null;
  }, [greenhouses, selectedGreenhouseId]);

  const selectedTunnels = useMemo(() => {
    if (!selectedGreenhouseId) return [];
    return tunnels.filter((t) => t.greenhouseId === selectedGreenhouseId);
  }, [tunnels, selectedGreenhouseId]);

  // Status badges & text
  const getStatusBadge = (status: GreenhouseStatus | TunnelStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Aktif
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Pemeliharaan
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
            Nonaktif
          </span>
        );
    }
  };

  // Handlers for Greenhouse CRUD
  const handleOpenAddGh = () => {
    setEditingGh(null);
    setIsGhModalOpen(true);
  };

  const handleOpenEditGh = (gh: Greenhouse) => {
    setEditingGh(gh);
    setIsGhModalOpen(true);
  };

  const handleSaveGh = async (data: Omit<Greenhouse, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingGh) {
        await localDataService.updateGreenhouse(editingGh.id, data);
        showToast('Greenhouse berhasil diperbarui!', 'success');
      } else {
        await localDataService.createGreenhouse(data);
        showToast('Greenhouse baru berhasil ditambahkan!', 'success');
      }
      setIsGhModalOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan greenhouse', 'error');
    }
  };

  const handlePromptDeleteGh = async (gh: Greenhouse) => {
    try {
      const related = await localDataService.checkGreenhouseRelatedData(gh.id);
      setGhDeleteTarget({ gh, related });
    } catch (err: any) {
      showToast('Gagal memeriksa data terkait: ' + err.message, 'error');
    }
  };

  const handleConfirmDeleteGh = async () => {
    if (!ghDeleteTarget) return;
    try {
      await localDataService.deleteGreenhouse(ghDeleteTarget.gh.id, false);
      showToast('Greenhouse berhasil dihapus', 'success');
      setGhDeleteTarget(null);
      if (selectedGreenhouseId === ghDeleteTarget.gh.id) {
        setSelectedGreenhouseId(null);
      }
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus greenhouse', 'error');
    }
  };

  const handleDeactivateGh = async () => {
    if (!ghDeleteTarget) return;
    try {
      await localDataService.updateGreenhouse(ghDeleteTarget.gh.id, { status: 'inactive' });
      showToast(`Status greenhouse diubah menjadi Nonaktif. Data historis tetap aman.`, 'success');
      setGhDeleteTarget(null);
      refreshData();
    } catch (err: any) {
      showToast('Gagal menonaktifkan greenhouse: ' + err.message, 'error');
    }
  };

  // Handlers for Tunnel CRUD
  const handleOpenAddTunnel = () => {
    if (!selectedGreenhouse) return;
    setEditingTunnel(null);
    setIsTunnelModalOpen(true);
  };

  const handleOpenEditTunnel = (tnl: GreenhouseTunnel) => {
    setEditingTunnel(tnl);
    setIsTunnelModalOpen(true);
  };

  const handleSaveTunnel = async (data: Omit<GreenhouseTunnel, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingTunnel) {
        await localDataService.updateGreenhouseTunnel(editingTunnel.id, data);
        showToast('Spesifikasi tunnel berhasil diperbarui!', 'success');
      } else {
        await localDataService.createGreenhouseTunnel(data);
        showToast('Tunnel baru berhasil ditambahkan!', 'success');
      }
      setIsTunnelModalOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan tunnel', 'error');
    }
  };

  const handlePromptDeleteTunnel = async (tnl: GreenhouseTunnel) => {
    try {
      const related = await localDataService.checkGreenhouseTunnelRelatedData(tnl.id);
      setTunnelDeleteTarget({ tunnel: tnl, related });
    } catch (err: any) {
      showToast('Gagal memeriksa data terkait tunnel: ' + err.message, 'error');
    }
  };

  const handleConfirmDeleteTunnel = async () => {
    if (!tunnelDeleteTarget) return;
    try {
      await localDataService.deleteGreenhouseTunnel(tunnelDeleteTarget.tunnel.id, false);
      showToast('Tunnel berhasil dihapus', 'success');
      setTunnelDeleteTarget(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus tunnel', 'error');
    }
  };

  const handleDeactivateTunnel = async () => {
    if (!tunnelDeleteTarget) return;
    try {
      await localDataService.updateGreenhouseTunnel(tunnelDeleteTarget.tunnel.id, { status: 'inactive' });
      showToast('Status tunnel diubah menjadi Nonaktif. Data siklus tanam tetap aman.', 'success');
      setTunnelDeleteTarget(null);
      refreshData();
    } catch (err: any) {
      showToast('Gagal menonaktifkan tunnel: ' + err.message, 'error');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto pb-28 lg:pb-14">
      {/* ========================================================================= */}
      {/* 1. DETAIL VIEW: WHEN A GREENHOUSE IS SELECTED                             */}
      {/* ========================================================================= */}
      {selectedGreenhouse ? (
        <div className="space-y-6 animate-fade-in">
          {/* Back Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
            <button
              onClick={() => setSelectedGreenhouseId(null)}
              className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-xs py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 transition cursor-pointer w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Greenhouse</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenEditGh(selectedGreenhouse)}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs transition cursor-pointer shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Edit Greenhouse</span>
              </button>

              <button
                onClick={() => handlePromptDeleteGh(selectedGreenhouse)}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus / Nonaktifkan</span>
              </button>
            </div>
          </div>

          {/* Greenhouse Hero Banner */}
          <div className="bg-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-stone-800">
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {selectedGreenhouse.name}
                      </h2>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700">
                        {selectedGreenhouse.code || selectedGreenhouse.id}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {selectedGreenhouse.location || 'Greenhouse DFT Spesialis Melon Nusantara'}
                    </p>
                  </div>
                </div>

                <div>{getStatusBadge(selectedGreenhouse.status)}</div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700/60">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Dimensi Total
                  </span>
                  <div className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
                    {selectedGreenhouse.lengthM} × {selectedGreenhouse.widthM} m
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                    {formatNumber(selectedGreenhouse.areaM2 || 0)} m²
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700/60">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Jumlah Tunnel
                  </span>
                  <div className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
                    {selectedTunnels.length} Tunnel
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    Tersimpan di database
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700/60">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Kapasitas Tanaman
                  </span>
                  <div className="text-base sm:text-lg font-black font-mono text-emerald-400 mt-0.5">
                    {formatNumber(selectedGreenhouse.totalPlantCapacity || 0)}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    Populasi operasional
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700/60">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Nilai Investasi Awal
                  </span>
                  <div className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
                    {formatRupiah(selectedGreenhouse.investmentValue || 0)}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    Tahun {selectedGreenhouse.constructionYear || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Specifications Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* SPESIFIKASI STRUKTUR */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-stone-900 text-xs uppercase tracking-wider">
                  Spesifikasi Struktur
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-stone-400 block text-[11px]">Material Utama:</span>
                  <span className="font-bold text-stone-800">
                    {selectedGreenhouse.structureMaterial || 'Bambu Petung'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-stone-400 block text-[11px]">Tinggi Tiang Samping:</span>
                    <span className="font-bold text-stone-800 font-mono">
                      {selectedGreenhouse.sideHeightM || 3.0} m
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">Tinggi Tiang Tengah:</span>
                    <span className="font-bold text-stone-800 font-mono">
                      {selectedGreenhouse.centerHeightM || 4.2} m
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-stone-400 block text-[11px]">Jarak Antar Tiang:</span>
                    <span className="font-bold text-stone-800 font-mono">
                      {selectedGreenhouse.poleSpacingM || 3.0} m
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">Jarak Usuk:</span>
                    <span className="font-bold text-stone-800 font-mono">
                      {Math.round((selectedGreenhouse.roofBattenSpacingM || 0.4) * 100)} cm
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-stone-400 block text-[11px]">Jenis Pondasi:</span>
                  <span className="font-semibold text-stone-700 leading-relaxed text-[11px]">
                    {selectedGreenhouse.foundationType ||
                      '2 tingkat bata hebel untuk sisi, tiang tengah ditanam dan dicor langsung'}
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 block text-[11px]">Penutup Atap:</span>
                  <span className="font-bold text-stone-800">
                    {selectedGreenhouse.roofCover || 'Plastik UV 200 Micron 14%'}
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 block text-[11px]">Dinding & Insect Net:</span>
                  <span className="font-bold text-stone-800">
                    {selectedGreenhouse.wallType || 'Insect Net Full Keliling'}
                  </span>
                </div>
              </div>
            </div>

            {/* BUDIDAYA & MEDIA */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-stone-900 text-xs uppercase tracking-wider">
                  Budidaya & Media
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-stone-400 block text-[11px]">Sistem Budidaya Utama:</span>
                  <span className="font-black text-sm text-stone-900">
                    {selectedGreenhouse.cultivationSystem || 'DFT (Deep Flow Technique)'}
                  </span>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-stone-400 block text-[11px]">Media Tanam:</span>
                  <span className="font-bold text-sm text-stone-800">
                    {selectedGreenhouse.cultivationMedia || 'Pasir'}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-emerald-800 block text-[11px] font-semibold">
                    Target Populasi Greenhouse:
                  </span>
                  <span className="font-extrabold text-base text-emerald-950 font-mono">
                    {formatNumber(selectedGreenhouse.totalPlantCapacity || 0)} tanaman
                  </span>
                </div>

                {selectedGreenhouse.notes && (
                  <div>
                    <span className="text-stone-400 block text-[11px]">Catatan Greenhouse:</span>
                    <p className="text-stone-600 italic text-[11px] mt-0.5 leading-relaxed">
                      "{selectedGreenhouse.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* IRIGASI & FASILITAS */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
                <Droplets className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-stone-900 text-xs uppercase tracking-wider">
                  Irigasi & Fasilitas
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-stone-400 block text-[11px]">Jumlah Tandon Nutrisi:</span>
                  <span className="font-black text-base text-stone-900 font-mono">
                    {selectedGreenhouse.tankCount || 2} Unit
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 block text-[11px]">Total Kapasitas Tandon:</span>
                  <span className="font-black text-base text-stone-900 font-mono">
                    {formatNumber(selectedGreenhouse.tankCapacityL || 10000)} Liter
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 block text-[11px]">Jenis Pompa Sirkulasi:</span>
                  <span className="font-bold text-stone-800">
                    {selectedGreenhouse.pumpType || 'Submersible Flow Tinggi'}
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 block text-[11px]">Debit Pompa:</span>
                  <span className="font-bold text-stone-800 font-mono">
                    {selectedGreenhouse.pumpFlowLMin || 133} Liter / Menit
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TUNNEL SECTION (Requirement I & J) */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base sm:text-lg font-black text-stone-900">
                    Tunnel Budidaya ({selectedTunnels.length})
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Daftar tunnel aktif, ukuran, instalasi talang, dan kapasitas tanaman melon per tunnel
                </p>
              </div>

              <button
                onClick={handleOpenAddTunnel}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Tunnel Baru</span>
              </button>
            </div>

            {selectedTunnels.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-stone-700">Belum ada tunnel di greenhouse ini</div>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Tambahkan tunnel untuk mulai menghubungkan siklus tanam melon dengan populasi dan talang hidroponik.
                </p>
                <button
                  onClick={handleOpenAddTunnel}
                  className="py-2 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition cursor-pointer"
                >
                  + Tambah Tunnel Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 sm:p-6">
                {selectedTunnels.map((tnl) => (
                  <div
                    key={tnl.id}
                    className="p-5 rounded-2xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 transition space-y-4 relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-stone-900 text-sm">{tnl.name}</h4>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                            {tnl.code || tnl.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Dimensi: {tnl.lengthM} × {tnl.widthM} m • Area: {formatNumber(tnl.areaM2)} m²
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(tnl.status)}
                        <button
                          onClick={() => handleOpenEditTunnel(tnl)}
                          className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Edit Tunnel"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePromptDeleteTunnel(tnl)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus / Nonaktifkan Tunnel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-stone-100 text-center">
                        <span className="text-[10px] text-stone-400 font-bold block uppercase">Kapasitas</span>
                        <span className="font-extrabold text-stone-900 font-mono text-sm mt-0.5 block">
                          {formatNumber(tnl.plantCapacity || 0)}
                        </span>
                        <span className="text-[9px] text-stone-500">tanaman</span>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-stone-100 text-center">
                        <span className="text-[10px] text-stone-400 font-bold block uppercase">Talang</span>
                        <span className="font-extrabold text-stone-900 font-mono text-sm mt-0.5 block">
                          {tnl.gutterCount || 0}
                        </span>
                        <span className="text-[9px] text-stone-500">{tnl.rowCount || 0} baris</span>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-stone-100 text-center">
                        <span className="text-[10px] text-stone-400 font-bold block uppercase">Total Lubang</span>
                        <span className="font-extrabold text-emerald-700 font-mono text-sm mt-0.5 block">
                          {formatNumber(tnl.totalPlantHoles || 0)}
                        </span>
                        <span className="text-[9px] text-stone-500">{tnl.holesPerGutter || 0}/talang</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-[11px] text-stone-500">
                      <span>Sistem: <strong>{tnl.cultivationSystem || 'DFT'}</strong> ({tnl.cultivationMedia || 'Pasir'})</span>
                      <span>Tandon: {tnl.tankCount || 1} unit ({formatNumber(tnl.tankCapacityL || 5000)} L)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. MAIN LIST VIEW: ALL GREENHOUSES                                        */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Header (Section C) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-stone-900 tracking-tight">
                Greenhouse
              </h2>
              <p className="text-xs lg:text-sm text-stone-500 mt-0.5">
                Kelola spesifikasi, tunnel, kapasitas, dan fasilitas greenhouse
              </p>
            </div>

            <button
              onClick={handleOpenAddGh}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer w-fit"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Greenhouse</span>
            </button>
          </div>

          {/* Cards Grid (Section D) */}
          {isLoading ? (
            <div className="p-12 text-center text-xs text-stone-500">Memuat data greenhouse...</div>
          ) : greenhouses.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Belum Ada Data Greenhouse</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Mulai catat spesifikasi greenhouse melon Anda untuk menghubungkan data produksi siklus dan investasi.
                </p>
              </div>
              <button
                onClick={handleOpenAddGh}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                + Tambah Greenhouse Baru
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {greenhouses.map((gh) => {
                const ghTunnels = tunnels.filter((t) => t.greenhouseId === gh.id);
                const actualTunnelCount = ghTunnels.length;
                const actualCapacity = gh.totalPlantCapacity || 0;

                return (
                  <div
                    key={gh.id}
                    className="bg-white rounded-3xl border border-stone-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="p-6 space-y-4">
                      {/* Top Row: Name, Code & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-stone-400 block uppercase">
                            {gh.code || gh.id}
                          </span>
                          <h3 className="text-base font-black text-stone-900 group-hover:text-emerald-700 transition">
                            {gh.name}
                          </h3>
                          {gh.location && (
                            <p className="text-xs text-stone-500 mt-0.5 truncate">{gh.location}</p>
                          )}
                        </div>

                        <div>{getStatusBadge(gh.status)}</div>
                      </div>

                      {/* Dimensions & Capacity Highlight Card */}
                      <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            Dimensi & Luas
                          </span>
                          <div className="font-mono font-extrabold text-stone-900 text-sm mt-0.5">
                            {gh.lengthM} × {gh.widthM} m
                          </div>
                          <div className="text-[11px] font-mono text-emerald-600 font-semibold mt-0.5">
                            {formatNumber(gh.areaM2 || 0)} m²
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            Tunnel & Kapasitas
                          </span>
                          <div className="font-mono font-extrabold text-stone-900 text-sm mt-0.5">
                            {actualTunnelCount} Tunnel
                          </div>
                          <div className="text-[11px] font-mono text-stone-600 font-semibold mt-0.5">
                            {formatNumber(actualCapacity)} tanaman
                          </div>
                        </div>
                      </div>

                      {/* Quick Specs Snippet */}
                      <div className="space-y-1.5 text-xs text-stone-600">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">Struktur:</span>
                          <span className="font-semibold text-stone-800">{gh.structureMaterial || 'Bambu Petung'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">Sistem Budidaya:</span>
                          <span className="font-semibold text-stone-800">{gh.cultivationSystem || 'DFT'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">Tandon Nutrisi:</span>
                          <span className="font-semibold text-stone-800 font-mono">
                            {gh.tankCount || 2} unit ({formatNumber(gh.tankCapacityL || 10000)} L)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons (Section D) */}
                    <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedGreenhouseId(gh.id)}
                        className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Detail</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditGh(gh)}
                          className="py-2 px-3 rounded-xl bg-white hover:bg-stone-100 text-stone-700 font-semibold text-xs border border-stone-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-stone-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handlePromptDeleteGh(gh)}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Hapus / Nonaktifkan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODALS: GREENHOUSE FORM & TUNNEL FORM                                  */}
      {/* ========================================================================= */}
      {isGhModalOpen && (
        <GreenhouseFormModal
          isOpen={isGhModalOpen}
          onClose={() => setIsGhModalOpen(false)}
          onSave={handleSaveGh}
          initialData={editingGh}
        />
      )}

      {isTunnelModalOpen && selectedGreenhouse && (
        <TunnelFormModal
          isOpen={isTunnelModalOpen}
          onClose={() => setIsTunnelModalOpen(false)}
          onSave={handleSaveTunnel}
          greenhouseId={selectedGreenhouse.id}
          greenhouseName={selectedGreenhouse.name}
          initialData={editingTunnel}
        />
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: PROTEKSI DELETE / DEACTIVATE GREENHOUSE (Section N)            */}
      {/* ========================================================================= */}
      {ghDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div
            className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 space-y-4 animate-scale-up"
            role="alertdialog"
            aria-modal="true"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-stone-900">
                {ghDeleteTarget.related.tunnelCount > 0 ||
                ghDeleteTarget.related.cycleCount > 0 ||
                ghDeleteTarget.related.investmentCount > 0
                  ? 'Greenhouse Memiliki Data Terkait'
                  : 'Konfirmasi Hapus Greenhouse'}
              </h3>

              {ghDeleteTarget.related.tunnelCount > 0 ||
              ghDeleteTarget.related.cycleCount > 0 ||
              ghDeleteTarget.related.investmentCount > 0 ? (
                <div className="text-xs text-stone-600 leading-relaxed space-y-2">
                  <p>
                    Greenhouse <strong>{ghDeleteTarget.gh.name}</strong> masih terhubung dengan data:
                  </p>
                  <div className="p-3 bg-stone-50 rounded-xl text-left border border-stone-200 text-stone-700 space-y-1">
                    <div>• <strong>{ghDeleteTarget.related.tunnelCount}</strong> tunnel budidaya</div>
                    <div>• <strong>{ghDeleteTarget.related.cycleCount}</strong> siklus produksi tanam</div>
                    <div>• <strong>{ghDeleteTarget.related.investmentCount}</strong> catatan investasi modal</div>
                  </div>
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    Sesuai aturan proteksi data, greenhouse yang memiliki relasi historis tidak dapat dihapus permanen. Anda disarankan untuk <strong>Menonaktifkan</strong> greenhouse.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-stone-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus greenhouse <strong>{ghDeleteTarget.gh.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {ghDeleteTarget.related.tunnelCount > 0 ||
              ghDeleteTarget.related.cycleCount > 0 ||
              ghDeleteTarget.related.investmentCount > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={handleDeactivateGh}
                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <PowerOff className="w-4 h-4" />
                    <span>Nonaktifkan Greenhouse (Aman)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGhDeleteTarget(null)}
                    className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Batalkan
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGhDeleteTarget(null)}
                    className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Batalkan
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteGh}
                    className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Ya, Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: PROTEKSI DELETE / DEACTIVATE TUNNEL (Section O)                */}
      {/* ========================================================================= */}
      {tunnelDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div
            className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 space-y-4 animate-scale-up"
            role="alertdialog"
            aria-modal="true"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-stone-900">
                {tunnelDeleteTarget.related.cycleCount > 0
                  ? 'Tunnel Digunakan Oleh Siklus Produksi'
                  : 'Konfirmasi Hapus Tunnel'}
              </h3>

              {tunnelDeleteTarget.related.cycleCount > 0 ? (
                <div className="text-xs text-stone-600 leading-relaxed space-y-2">
                  <p>
                    Tunnel <strong>{tunnelDeleteTarget.tunnel.name}</strong> masih digunakan oleh <strong>{tunnelDeleteTarget.related.cycleCount} siklus produksi</strong>:
                  </p>
                  <div className="p-2.5 bg-stone-50 rounded-xl text-left border border-stone-200 text-stone-700 text-[11px] max-h-24 overflow-y-auto">
                    {tunnelDeleteTarget.related.relatedCycles.map((cy, i) => (
                      <div key={i} className="truncate">• {cy}</div>
                    ))}
                  </div>
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    Menghapus tunnel ini secara permanen dapat merusak histori data produksi. Anda dapat <strong>Menonaktifkan Tunnel</strong> agar tidak dipilih di siklus berikutnya.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-stone-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus <strong>{tunnelDeleteTarget.tunnel.name}</strong>? Kapasitas greenhouse akan otomatis dihitung ulang.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {tunnelDeleteTarget.related.cycleCount > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={handleDeactivateTunnel}
                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <PowerOff className="w-4 h-4" />
                    <span>Nonaktifkan Tunnel (Aman)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTunnelDeleteTarget(null)}
                    className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Batalkan
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTunnelDeleteTarget(null)}
                    className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Batalkan
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteTunnel}
                    className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Ya, Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

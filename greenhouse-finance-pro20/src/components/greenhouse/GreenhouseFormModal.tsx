import React, { useState, useEffect } from 'react';
import { Greenhouse, GreenhouseStatus } from '../../types/index.js';
import { X, Building2, Ruler, Wrench, Sprout, Droplets, Landmark } from 'lucide-react';
import { formatRupiah, formatNumber } from '../../utils/formatters.js';

interface GreenhouseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Greenhouse, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Greenhouse | null;
}

export const GreenhouseFormModal: React.FC<GreenhouseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: 'active' as GreenhouseStatus,
    location: '',
    notes: '',
    constructionYear: new Date().getFullYear(),
    lengthM: 48,
    widthM: 16,
    tunnelCount: 2,
    structureMaterial: 'Bambu petung',
    foundationType: 'Pondasi samping 2 tingkat bata hebel, tiang tengah ditanam dan dicor langsung',
    sideHeightM: 3.0,
    centerHeightM: 4.2,
    poleSpacingM: 3.0,
    roofBattenSpacingM: 0.40,
    roofType: 'Arch Tunnel Ganda (2 Tunnel)',
    roofCover: 'Plastik UV 200 Micron 14%',
    wallType: 'Dinding Samping Hebel + Insect Net',
    insectNet: true,
    cultivationSystem: 'DFT',
    cultivationMedia: 'Pasir',
    totalPlantCapacity: 2000,
    tankCount: 2,
    tankCapacityL: 10000,
    pumpType: 'Submersible Flow Tinggi',
    pumpFlowLMin: 133,
    investmentValue: 100000000
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        status: initialData.status || 'active',
        location: initialData.location || '',
        notes: initialData.notes || '',
        constructionYear: initialData.constructionYear ?? new Date().getFullYear(),
        lengthM: initialData.lengthM ?? 48,
        widthM: initialData.widthM ?? 16,
        tunnelCount: initialData.tunnelCount ?? 2,
        structureMaterial: initialData.structureMaterial || 'Bambu petung',
        foundationType: initialData.foundationType || 'Pondasi samping 2 tingkat bata hebel, tiang tengah ditanam dan dicor langsung',
        sideHeightM: initialData.sideHeightM ?? 3.0,
        centerHeightM: initialData.centerHeightM ?? 4.2,
        poleSpacingM: initialData.poleSpacingM ?? 3.0,
        roofBattenSpacingM: initialData.roofBattenSpacingM ?? 0.40,
        roofType: initialData.roofType || 'Arch Tunnel Ganda (2 Tunnel)',
        roofCover: initialData.roofCover || 'Plastik UV 200 Micron 14%',
        wallType: initialData.wallType || 'Dinding Samping Hebel + Insect Net',
        insectNet: initialData.insectNet !== undefined ? initialData.insectNet : true,
        cultivationSystem: initialData.cultivationSystem || 'DFT',
        cultivationMedia: initialData.cultivationMedia || 'Pasir',
        totalPlantCapacity: initialData.totalPlantCapacity ?? 2000,
        tankCount: initialData.tankCount ?? 2,
        tankCapacityL: initialData.tankCapacityL ?? 10000,
        pumpType: initialData.pumpType || 'Submersible Flow Tinggi',
        pumpFlowLMin: initialData.pumpFlowLMin ?? 133,
        investmentValue: initialData.investmentValue ?? 100000000
      });
    } else {
      setFormData({
        name: 'Greenhouse Melon Baru',
        code: `GH-${String(Date.now()).slice(-3)}`,
        status: 'active',
        location: 'Kawasan Agribisnis DFT',
        notes: 'Greenhouse struktur bambu petung bertulang cor.',
        constructionYear: new Date().getFullYear(),
        lengthM: 48,
        widthM: 16,
        tunnelCount: 2,
        structureMaterial: 'Bambu petung',
        foundationType: 'Pondasi samping 2 tingkat bata hebel, tiang tengah ditanam dan dicor langsung',
        sideHeightM: 3.0,
        centerHeightM: 4.2,
        poleSpacingM: 3.0,
        roofBattenSpacingM: 0.40,
        roofType: 'Arch Tunnel Ganda (2 Tunnel)',
        roofCover: 'Plastik UV 200 Micron 14%',
        wallType: 'Dinding Samping Hebel + Insect Net',
        insectNet: true,
        cultivationSystem: 'DFT',
        cultivationMedia: 'Pasir',
        totalPlantCapacity: 2000,
        tankCount: 2,
        tankCapacityL: 10000,
        pumpType: 'Submersible Flow Tinggi',
        pumpFlowLMin: 133,
        investmentValue: 100000000
      });
    }
    setErrorMessage('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const totalAreaM2 = (formData.lengthM || 0) * (formData.widthM || 0);
  const areaPerTunnel = formData.tunnelCount > 0 ? totalAreaM2 / formData.tunnelCount : totalAreaM2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations (Section 15)
    if (!formData.name.trim()) {
      setErrorMessage('Nama greenhouse wajib diisi');
      return;
    }
    if (formData.lengthM <= 0) {
      setErrorMessage('Panjang greenhouse harus lebih besar dari 0 meter');
      return;
    }
    if (formData.widthM <= 0) {
      setErrorMessage('Lebar greenhouse harus lebih besar dari 0 meter');
      return;
    }
    if (formData.tunnelCount < 1) {
      setErrorMessage('Jumlah tunnel minimal 1 tunnel');
      return;
    }
    if (formData.totalPlantCapacity < 0) {
      setErrorMessage('Kapasitas tanaman tidak boleh negatif');
      return;
    }
    if (formData.tankCount < 0) {
      setErrorMessage('Jumlah tandon tidak boleh negatif');
      return;
    }
    if (formData.tankCapacityL < 0) {
      setErrorMessage('Kapasitas tandon tidak boleh negatif');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        ...formData,
        areaM2: totalAreaM2
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan greenhouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-scale-up max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {initialData ? 'Edit Spesifikasi Greenhouse' : 'Tambah Greenhouse Baru'}
              </h3>
              <p className="text-[11px] text-stone-400">
                Spesifikasi teknis struktur bambu, dimensi, sistem DFT, dan kapasitas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1 scrollbar-thin">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold text-xs flex items-center gap-2">
              <span className="font-bold">Error:</span> {errorMessage}
            </div>
          )}

          {/* SECTION A — IDENTITAS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-stone-200 text-stone-800 font-bold text-xs uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Section A — Identitas Greenhouse</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nama Greenhouse *</label>
                <input
                  type="text"
                  placeholder="Contoh: Greenhouse Melon Utama"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Kode Greenhouse</label>
                <input
                  type="text"
                  placeholder="Contoh: GH-001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Status Operasional</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as GreenhouseStatus })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:bg-white"
                >
                  <option value="active">● Aktif (Beroperasi)</option>
                  <option value="maintenance">● Pemeliharaan (Maintenance)</option>
                  <option value="inactive">● Nonaktif (Istirahat)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Lokasi Kebun</label>
                <input
                  type="text"
                  placeholder="Contoh: Kawasan Agribisnis DFT"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Catatan Tambahan</label>
              <textarea
                rows={2}
                placeholder="Deskripsi fasilitas, orientasi arah angin/matahari, dsb"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900"
              />
            </div>
          </div>

          {/* SECTION B — DIMENSI */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-stone-200 text-stone-800 font-bold text-xs uppercase tracking-wider">
              <Ruler className="w-3.5 h-3.5 text-emerald-600" />
              <span>Section B — Dimensi & Kapasitas Tunnel</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Panjang Total (m) *</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={formData.lengthM}
                  onChange={(e) => setFormData({ ...formData, lengthM: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Lebar Total (m) *</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={formData.widthM}
                  onChange={(e) => setFormData({ ...formData, widthM: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Jumlah Tunnel *</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={formData.tunnelCount}
                  onChange={(e) => setFormData({ ...formData, tunnelCount: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                  required
                />
              </div>
            </div>

            {/* Area Info Box */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 grid grid-cols-2 gap-2 text-emerald-950 font-semibold">
              <div>
                <span className="text-[11px] text-emerald-800 block">Luas Total Greenhouse:</span>
                <span className="text-base font-extrabold font-mono text-emerald-900">
                  {formatNumber(totalAreaM2)} m²
                </span>
                <span className="text-[10px] text-emerald-700 block">
                  ({formData.lengthM} × {formData.widthM} meter)
                </span>
              </div>
              <div>
                <span className="text-[11px] text-emerald-800 block">Luas Rata-rata per Tunnel:</span>
                <span className="text-base font-extrabold font-mono text-emerald-900">
                  {formatNumber(areaPerTunnel)} m²
                </span>
                <span className="text-[10px] text-emerald-700 block">
                  ({formData.tunnelCount} tunnel)
                </span>
              </div>
            </div>
          </div>

          {/* SECTION C — STRUKTUR & PONDASI */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-stone-200 text-stone-800 font-bold text-xs uppercase tracking-wider">
              <Wrench className="w-3.5 h-3.5 text-emerald-600" />
              <span>Section C — Struktur, Atap & Pondasi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Material Utama Struktur</label>
                <input
                  type="text"
                  placeholder="Contoh: Bambu petung pilihan"
                  value={formData.structureMaterial}
                  onChange={(e) => setFormData({ ...formData, structureMaterial: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Jenis Pondasi</label>
                <input
                  type="text"
                  placeholder="Contoh: Pondasi bata hebel & tiang tengah cor langsung"
                  value={formData.foundationType}
                  onChange={(e) => setFormData({ ...formData, foundationType: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Tinggi Tiang Samping (m)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="3.0"
                  value={formData.sideHeightM}
                  onChange={(e) => setFormData({ ...formData, sideHeightM: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Tinggi Tiang Tengah (m)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="4.2"
                  value={formData.centerHeightM}
                  onChange={(e) => setFormData({ ...formData, centerHeightM: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Jarak Antar Tiang (m)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="3.0"
                  value={formData.poleSpacingM}
                  onChange={(e) => setFormData({ ...formData, poleSpacingM: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Jarak Usuk / Reng (m)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.05"
                  placeholder="0.40"
                  value={formData.roofBattenSpacingM}
                  onChange={(e) => setFormData({ ...formData, roofBattenSpacingM: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Jenis Bentuk Atap</label>
                <input
                  type="text"
                  placeholder="Contoh: Arch Tunnel Ganda"
                  value={formData.roofType}
                  onChange={(e) => setFormData({ ...formData, roofType: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Material Penutup Atap</label>
                <input
                  type="text"
                  placeholder="Contoh: Plastik UV 200 Micron 14%"
                  value={formData.roofCover}
                  onChange={(e) => setFormData({ ...formData, roofCover: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Jenis Dinding</label>
                <input
                  type="text"
                  placeholder="Contoh: Dinding Samping Hebel + Insect Net"
                  value={formData.wallType}
                  onChange={(e) => setFormData({ ...formData, wallType: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="gh-insect-net"
                  checked={formData.insectNet}
                  onChange={(e) => setFormData({ ...formData, insectNet: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="gh-insect-net" className="font-bold text-stone-800 cursor-pointer">
                  Dilengkapi Insect Net (50 Mesh Anti Kutu Kebul)
                </label>
              </div>
            </div>
          </div>

          {/* SECTION D — BUDIDAYA */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-stone-200 text-stone-800 font-bold text-xs uppercase tracking-wider">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              <span>Section D — Sistem Budidaya & Kapasitas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Sistem Budidaya</label>
                <select
                  value={formData.cultivationSystem}
                  onChange={(e) => setFormData({ ...formData, cultivationSystem: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900"
                >
                  <option value="DFT">DFT (Deep Flow Technique)</option>
                  <option value="Drip">Drip Irrigation / Fertigasi Tetes</option>
                  <option value="NFT">NFT (Nutrient Film Technique)</option>
                  <option value="Media pasir">Media Pasir Sirkulasi</option>
                  <option value="Media tanah">Media Tanah / Bedengan</option>
                  <option value="Lainnya">Sistem Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Media Tanam</label>
                <input
                  type="text"
                  placeholder="Contoh: Pasir, Cocopeat, Rockwool"
                  value={formData.cultivationMedia}
                  onChange={(e) => setFormData({ ...formData, cultivationMedia: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Total Kapasitas Tanaman</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={formData.totalPlantCapacity}
                  onChange={(e) => setFormData({ ...formData, totalPlantCapacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* SECTION E — IRIGASI & TANDON */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-stone-200 text-stone-800 font-bold text-xs uppercase tracking-wider">
              <Droplets className="w-3.5 h-3.5 text-emerald-600" />
              <span>Section E — Irigasi, Tandon & Pompa</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Jumlah Unit Tandon</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={formData.tankCount}
                  onChange={(e) => setFormData({ ...formData, tankCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Total Kapasitas Tandon (Liter)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={formData.tankCapacityL}
                  onChange={(e) => setFormData({ ...formData, tankCapacityL: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Jenis Pompa Sirkulasi</label>
                <input
                  type="text"
                  placeholder="Contoh: Submersible Flow Tinggi"
                  value={formData.pumpType}
                  onChange={(e) => setFormData({ ...formData, pumpType: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Debit Pompa (Liter / Menit)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={formData.pumpFlowLMin}
                  onChange={(e) => setFormData({ ...formData, pumpFlowLMin: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* SECTION F — INVESTASI & TAHUN */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-stone-200 text-stone-800 font-bold text-xs uppercase tracking-wider">
              <Landmark className="w-3.5 h-3.5 text-emerald-600" />
              <span>Section F — Investasi & Pembangunan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Estimasi Nilai Investasi (Rp)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={formData.investmentValue}
                  onChange={(e) => setFormData({ ...formData, investmentValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
                <span className="text-[10px] text-stone-500 font-semibold">
                  Nilai: {formatRupiah(formData.investmentValue)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Tahun Pembangunan</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="2000"
                  max="2100"
                  value={formData.constructionYear}
                  onChange={(e) => setFormData({ ...formData, constructionYear: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer Buttons */}
        <div className="px-5 py-3.5 bg-stone-100 border-t border-stone-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="py-2.5 px-4 rounded-xl text-stone-600 hover:bg-stone-200 font-bold transition active:scale-95 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-950/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : initialData ? 'Simpan Perubahan' : 'Simpan Greenhouse'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { GreenhouseTunnel, TunnelStatus } from '../../types/index.js';
import { X, Layers, Ruler, Sprout, Droplets } from 'lucide-react';
import { formatNumber } from '../../utils/formatters.js';

interface TunnelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<GreenhouseTunnel, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  greenhouseId: string;
  greenhouseName: string;
  initialData?: GreenhouseTunnel | null;
}

export const TunnelFormModal: React.FC<TunnelFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  greenhouseId,
  greenhouseName,
  initialData
}) => {
  const [formData, setFormData] = useState({
    name: 'Tunnel Baru',
    code: 'T1',
    status: 'active' as TunnelStatus,
    lengthM: 48,
    widthM: 8,
    plantCapacity: 1000,
    rowCount: 4,
    gutterCount: 10,
    gutterLengthM: 48,
    holesPerGutter: 100,
    cultivationSystem: 'DFT',
    cultivationMedia: 'Pasir',
    tankCount: 1,
    tankCapacityL: 5000,
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        status: initialData.status || 'active',
        lengthM: initialData.lengthM ?? 48,
        widthM: initialData.widthM ?? 8,
        plantCapacity: initialData.plantCapacity ?? 1000,
        rowCount: initialData.rowCount ?? 4,
        gutterCount: initialData.gutterCount ?? 10,
        gutterLengthM: initialData.gutterLengthM ?? 48,
        holesPerGutter: initialData.holesPerGutter ?? 100,
        cultivationSystem: initialData.cultivationSystem || 'DFT',
        cultivationMedia: initialData.cultivationMedia || 'Pasir',
        tankCount: initialData.tankCount ?? 1,
        tankCapacityL: initialData.tankCapacityL ?? 5000,
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        name: 'Tunnel 1',
        code: 'T1',
        status: 'active',
        lengthM: 48,
        widthM: 8,
        plantCapacity: 1000,
        rowCount: 4,
        gutterCount: 10,
        gutterLengthM: 48,
        holesPerGutter: 100,
        cultivationSystem: 'DFT',
        cultivationMedia: 'Pasir',
        tankCount: 1,
        tankCapacityL: 5000,
        notes: ''
      });
    }
    setErrorMessage('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const areaM2 = (formData.lengthM || 0) * (formData.widthM || 0);
  const totalPlantHoles = (formData.gutterCount || 0) * (formData.holesPerGutter || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Nama tunnel wajib diisi');
      return;
    }
    if (formData.lengthM <= 0) {
      setErrorMessage('Panjang tunnel harus lebih besar dari 0 meter');
      return;
    }
    if (formData.widthM <= 0) {
      setErrorMessage('Lebar tunnel harus lebih besar dari 0 meter');
      return;
    }
    if (formData.plantCapacity < 0) {
      setErrorMessage('Kapasitas tanaman tidak boleh negatif');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        ...formData,
        greenhouseId,
        areaM2,
        totalPlantHoles: totalPlantHoles > 0 ? totalPlantHoles : formData.plantCapacity
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan tunnel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-scale-up max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {initialData ? 'Edit Spesifikasi Tunnel' : 'Tambah Tunnel Baru'}
              </h3>
              <p className="text-[11px] text-stone-400">
                Greenhouse: <span className="text-emerald-400 font-semibold">{greenhouseName}</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1 scrollbar-thin">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold text-xs flex items-center gap-2">
              <span className="font-bold">Error:</span> {errorMessage}
            </div>
          )}

          {/* Section 1: Identitas & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-stone-700 mb-1">Nama Tunnel *</label>
              <input
                type="text"
                placeholder="Contoh: Tunnel 1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-900"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">Kode Tunnel</label>
              <input
                type="text"
                placeholder="T1"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Status Operasional</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TunnelStatus })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900"
            >
              <option value="active">● Aktif (Siap Tanam / Sedang Berjalan)</option>
              <option value="maintenance">● Pemeliharaan / Sterilisasi</option>
              <option value="inactive">● Nonaktif</option>
            </select>
          </div>

          {/* Section 2: Dimensi & Luas Otomatis */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-stone-800 text-xs">
              <Ruler className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dimensi & Luas Tunnel</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Panjang (meter) *</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={formData.lengthM}
                  onChange={(e) => setFormData({ ...formData, lengthM: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Lebar (meter) *</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={formData.widthM}
                  onChange={(e) => setFormData({ ...formData, widthM: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                  required
                />
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <span className="font-bold text-emerald-800">Luas Area Otomatis:</span>
              <span className="font-mono font-extrabold text-sm text-emerald-950">{formatNumber(areaM2)} m²</span>
            </div>
          </div>

          {/* Section 3: Talang & Lubang Tanam Otomatis */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-stone-800 text-xs">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instalasi Talang & Kapasitas Tanam</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Jml Baris</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.rowCount}
                  onChange={(e) => setFormData({ ...formData, rowCount: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Jml Talang</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.gutterCount}
                  onChange={(e) => setFormData({ ...formData, gutterCount: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Panjang Talang (m)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.gutterLengthM}
                  onChange={(e) => setFormData({ ...formData, gutterLengthM: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Lubang/Talang</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.holesPerGutter}
                  onChange={(e) => setFormData({ ...formData, holesPerGutter: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-emerald-800">Total Lubang Tanam:</span>
                <span className="font-mono font-extrabold text-sm text-emerald-950">
                  {formatNumber(totalPlantHoles)} titik
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Target Kapasitas Tanaman</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.plantCapacity}
                  onChange={(e) => setFormData({ ...formData, plantCapacity: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Budidaya & Tandon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Sistem Budidaya</label>
              <select
                value={formData.cultivationSystem}
                onChange={(e) => setFormData({ ...formData, cultivationSystem: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900"
              >
                <option value="DFT">DFT (Deep Flow Technique)</option>
                <option value="Drip">Drip Irrigation / Fertigasi</option>
                <option value="NFT">NFT (Nutrient Film Technique)</option>
                <option value="Media pasir">Media Pasir</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Media Tanam</label>
              <input
                type="text"
                placeholder="Contoh: Pasir, Cocopeat"
                value={formData.cultivationMedia}
                onChange={(e) => setFormData({ ...formData, cultivationMedia: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-900"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Jumlah Tandon Khusus</label>
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
              <label className="block font-bold text-stone-700 mb-1">Kapasitas Tandon (Liter)</label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={formData.tankCapacityL}
                onChange={(e) => setFormData({ ...formData, tankCapacityL: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Catatan Khusus Tunnel</label>
            <input
              type="text"
              placeholder="Sisi barat, sirkulasi return pipe, dll"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900"
            />
          </div>
        </form>

        {/* Footer */}
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
            {isSubmitting ? 'Menyimpan...' : initialData ? 'Simpan Perubahan' : 'Simpan Tunnel'}
          </button>
        </div>
      </div>
    </div>
  );
};

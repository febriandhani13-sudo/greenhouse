import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.js';
import { dataService } from '../services/localDataService.js';
import { Debt, DebtPayment, PaymentMethod } from '../types/index.js';
import { formatRupiah, formatDate } from '../utils/formatters.js';
import {
  BadgeAlert,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  Trash2,
  X,
  Check,
  CheckCircle2,
  Clock,
  UserCheck,
  Download
} from 'lucide-react';

export const DebtsPage: React.FC = () => {
  const { refreshTrigger, refreshData, showToast } = useApp();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab filter: 'hutang' vs 'piutang'
  const [activeTab, setActiveTab] = useState<'hutang' | 'piutang'>('hutang');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<Debt | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form New Debt
  const [formData, setFormData] = useState<{
    jenis: 'hutang' | 'piutang';
    kontak: string;
    nominal: number;
    tanggal: string;
    jatuhTempo: string;
    dibayarAwal: number;
    kategori: string;
    keterangan: string;
  }>({
    jenis: 'hutang',
    kontak: '',
    nominal: 2500000,
    tanggal: new Date().toISOString().split('T')[0],
    jatuhTempo: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    dibayarAwal: 0,
    kategori: 'Saprotan AB Mix',
    keterangan: ''
  });

  // Form Payment
  const [paymentForm, setPaymentForm] = useState<{
    nominal: number;
    tanggal: string;
    metodePembayaran: PaymentMethod;
    catatan: string;
  }>({
    nominal: 1000000,
    tanggal: new Date().toISOString().split('T')[0],
    metodePembayaran: 'Transfer Bank',
    catatan: 'Pembayaran cicilan termin'
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    dataService.getDebts()
      .then(data => {
        if (isMounted) setDebts(data);
      })
      .catch(err => {
        showToast('Gagal memuat hutang & piutang: ' + err.message, 'error');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const hutangList = useMemo(() => debts.filter(d => d.jenis === 'hutang'), [debts]);
  const piutangList = useMemo(() => debts.filter(d => d.jenis === 'piutang'), [debts]);

  const totalSisaHutang = useMemo(() => hutangList.reduce((s, d) => s + d.sisa, 0), [hutangList]);
  const totalSisaPiutang = useMemo(() => piutangList.reduce((s, d) => s + d.sisa, 0), [piutangList]);

  const currentList = activeTab === 'hutang' ? hutangList : piutangList;

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kontak || formData.nominal <= 0) {
      showToast('Kontak dan nominal harus diisi dengan benar', 'error');
      return;
    }
    try {
      await dataService.createDebt(formData);
      showToast(`${formData.jenis === 'hutang' ? 'Hutang' : 'Piutang'} berhasil dicatat`, 'success');
      setIsAddModalOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mencatat', 'error');
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtForPayment || paymentForm.nominal <= 0) {
      showToast('Nominal pembayaran harus lebih dari 0', 'error');
      return;
    }
    if (paymentForm.nominal > selectedDebtForPayment.sisa) {
      showToast('Nominal pembayaran melebihi sisa.', 'error');
      return;
    }
    try {
      await dataService.payDebt(selectedDebtForPayment.id, paymentForm);
      showToast('Pembayaran berhasil dicatat & uang kas terupdate', 'success');
      setIsPayModalOpen(false);
      setSelectedDebtForPayment(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pembayaran', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await dataService.deleteDebt(deleteTargetId);
      showToast('Data berhasil dihapus', 'success');
      setDeleteTargetId(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus', 'error');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-stone-900 tracking-tight">
            Hutang & Piutang Usaha
          </h2>
          <p className="text-xs lg:text-sm text-stone-500 mt-0.5">
            Pengendalian kewajiban ke supplier pupuk/sarana dan tagihan penjualan melon ke pembeli
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dataService.exportCSV('debts')}
            className="py-2.5 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => {
              setFormData({
                jenis: activeTab,
                kontak: '',
                nominal: 2000000,
                tanggal: new Date().toISOString().split('T')[0],
                jatuhTempo: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
                dibayarAwal: 0,
                kategori: activeTab === 'hutang' ? 'Saprotan' : 'Penjualan Melon',
                keterangan: ''
              });
              setIsAddModalOpen(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Catat {activeTab === 'hutang' ? 'Hutang Supplier' : 'Piutang Pembeli'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Hutang */}
        <div className={`p-5 rounded-2xl border transition shadow-xs ${
          activeTab === 'hutang' ? 'bg-white border-rose-300 ring-2 ring-rose-500/10' : 'bg-white border-stone-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Total Sisa Kewajiban Hutang (Kita Berhutang)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 font-mono mt-2">
            {formatRupiah(totalSisaHutang)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Total {hutangList.length} tagihan supplier • Tidak mengurangi uang kas sebelum dibayarkan
          </div>
        </div>

        {/* Total Piutang */}
        <div className={`p-5 rounded-2xl border transition shadow-xs ${
          activeTab === 'piutang' ? 'bg-white border-blue-300 ring-2 ring-blue-500/10' : 'bg-white border-stone-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Total Sisa Piutang Penjualan (Orang Berhutang)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-800 font-mono mt-2">
            {formatRupiah(totalSisaPiutang)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Total {piutangList.length} tagihan pembeli melon • Belum dihitung sebagai uang kas riil
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center p-1 bg-stone-100 rounded-xl gap-1 w-fit">
        <button
          onClick={() => setActiveTab('hutang')}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'hutang' ? 'bg-rose-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>Hutang ke Supplier ({hutangList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('piutang')}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'piutang' ? 'bg-blue-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Piutang dari Pembeli ({piutangList.length})</span>
        </button>
      </div>

      {/* Debts Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">{activeTab === 'hutang' ? 'Supplier / Toko' : 'Pembeli / Pelanggan'}</th>
                <th className="py-3.5 px-4">Kategori & Keterangan</th>
                <th className="py-3.5 px-4">Tgl Transaksi</th>
                <th className="py-3.5 px-4">Jatuh Tempo</th>
                <th className="py-3.5 px-4 text-right">Nominal Awal</th>
                <th className="py-3.5 px-4 text-right">Sudah Dibayar</th>
                <th className="py-3.5 px-4 text-right">Sisa Tagihan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi Pembayaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {currentList.map(debt => {
                const isLunas = debt.status === 'Lunas';
                const isSebagian = debt.status === 'Sebagian';
                return (
                  <tr key={debt.id} className="hover:bg-stone-50/90 transition group">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{debt.kontak}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{debt.id}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-800">{debt.kategori}</div>
                      {debt.keterangan && <div className="text-[11px] text-stone-500 truncate max-w-xs">{debt.keterangan}</div>}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-stone-600">
                      {formatDate(debt.tanggal)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-amber-800">
                      {formatDate(debt.jatuhTempo)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                      {formatRupiah(debt.nominal)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {formatRupiah(debt.dibayar)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sm whitespace-nowrap text-rose-700">
                      {formatRupiah(debt.sisa)}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isLunas
                          ? 'bg-emerald-100 text-emerald-800'
                          : isSebagian
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {debt.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {!isLunas && (
                          <button
                            onClick={() => {
                              setSelectedDebtForPayment(debt);
                              setPaymentForm({
                                nominal: debt.sisa,
                                tanggal: new Date().toISOString().split('T')[0],
                                metodePembayaran: 'Transfer Bank',
                                catatan: `Pelunasan ${debt.kontak}`
                              });
                              setIsPayModalOpen(true);
                            }}
                            className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                          >
                            + Bayar
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTargetId(debt.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus data"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {currentList.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                    <p className="font-semibold text-stone-700">Tidak ada {activeTab} yang tersisa</p>
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
            aria-labelledby="dialog-delete-debt-title"
          >
            <div className="text-center">
              <h3 id="dialog-delete-debt-title" className="text-base font-bold text-stone-900">Hapus Data</h3>
              <p className="text-xs text-stone-500 mt-1">
                Apakah Anda yakin ingin menghapus data ini?
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

      {/* Modal Add Debt/Receivable */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-add-debt-title"
          >
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 id="modal-add-debt-title" className="text-base font-bold">
                Catat {formData.jenis === 'hutang' ? 'Hutang Baru ke Supplier' : 'Piutang Baru ke Pelanggan'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDebt} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, jenis: 'hutang' })}
                  className={`py-1.5 rounded-lg font-bold transition ${
                    formData.jenis === 'hutang' ? 'bg-rose-600 text-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Hutang (Kewajiban)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, jenis: 'piutang' })}
                  className={`py-1.5 rounded-lg font-bold transition ${
                    formData.jenis === 'piutang' ? 'bg-blue-600 text-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Piutang (Hak Tagih)
                </button>
              </div>

              <div>
                <label htmlFor="debt-modal-contact-input" className="block font-bold text-stone-700 mb-1">
                  Nama {formData.jenis === 'hutang' ? 'Supplier / Toko' : 'Pembeli / Pelanggan'}
                </label>
                <input
                  id="debt-modal-contact-input"
                  type="text"
                  placeholder="Contoh: CV Agro Pupuk Makmur"
                  value={formData.kontak}
                  onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="debt-modal-nominal-input" className="block font-bold text-stone-700 mb-1">Nominal (Rp)</label>
                  <input
                    id="debt-modal-nominal-input"
                    type="number"
                    value={formData.nominal}
                    onChange={(e) => setFormData({ ...formData, nominal: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="debt-modal-dp-input" className="block font-bold text-stone-700 mb-1">Sudah Dibayar / DP (Rp)</label>
                  <input
                    id="debt-modal-dp-input"
                    type="number"
                    value={formData.dibayarAwal}
                    onChange={(e) => setFormData({ ...formData, dibayarAwal: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="debt-modal-date-input" className="block font-bold text-stone-700 mb-1">Tanggal</label>
                  <input
                    id="debt-modal-date-input"
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="debt-modal-due-date-input" className="block font-bold text-stone-700 mb-1">Jatuh Tempo</label>
                  <input
                    id="debt-modal-due-date-input"
                    type="date"
                    value={formData.jatuhTempo}
                    onChange={(e) => setFormData({ ...formData, jatuhTempo: e.target.value })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-amber-900"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="debt-modal-notes-input" className="block font-bold text-stone-700 mb-1">Keterangan / Faktur</label>
                <input
                  id="debt-modal-notes-input"
                  type="text"
                  placeholder="Keterangan pengiriman / tempo 30 hari"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2 px-3 text-stone-600 hover:bg-stone-100 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pay Debt */}
      {isPayModalOpen && selectedDebtForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-pay-debt-title"
          >
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <h3 id="modal-pay-debt-title" className="text-base font-bold">
                  {selectedDebtForPayment.jenis === 'hutang' ? 'Bayar Hutang Supplier' : 'Terima Pelunasan Piutang'}
                </h3>
                <p className="text-xs text-stone-400">{selectedDebtForPayment.kontak}</p>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <span className="font-bold text-stone-600">Sisa Tagihan Saat Ini:</span>
                <span className="font-extrabold text-sm font-mono text-rose-700">
                  {formatRupiah(selectedDebtForPayment.sisa)}
                </span>
              </div>

              <div>
                <label htmlFor="pay-debt-modal-nominal-input" className="block font-bold text-stone-700 mb-1">Nominal Pembayaran (Rp)</label>
                <input
                  id="pay-debt-modal-nominal-input"
                  type="number"
                  max={selectedDebtForPayment.sisa}
                  value={paymentForm.nominal}
                  onChange={(e) => setPaymentForm({ ...paymentForm, nominal: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="pay-debt-modal-date-input" className="block font-bold text-stone-700 mb-1">Tanggal Bayar</label>
                  <input
                    id="pay-debt-modal-date-input"
                    type="date"
                    value={paymentForm.tanggal}
                    onChange={(e) => setPaymentForm({ ...paymentForm, tanggal: e.target.value })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="pay-debt-modal-method-select" className="block font-bold text-stone-700 mb-1">Metode Bayar</label>
                  <select
                    id="pay-debt-modal-method-select"
                    value={paymentForm.metodePembayaran}
                    onChange={(e) => setPaymentForm({ ...paymentForm, metodePembayaran: e.target.value as any })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Tunai">Tunai / Kas</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="pay-debt-modal-notes-input" className="block font-bold text-stone-700 mb-1">Catatan Pembayaran</label>
                <input
                  id="pay-debt-modal-notes-input"
                  type="text"
                  placeholder="Keterangan cicilan..."
                  value={paymentForm.catatan}
                  onChange={(e) => setPaymentForm({ ...paymentForm, catatan: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 text-[11px] leading-snug">
                Pembayaran ini akan otomatis masuk ke Buku Transaksi Keuangan dan memperbarui Saldo Kas Riil.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="py-2 px-3 text-stone-600 hover:bg-stone-100 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

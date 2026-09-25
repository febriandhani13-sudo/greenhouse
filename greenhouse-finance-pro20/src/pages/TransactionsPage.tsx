import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.js';
import { dataService } from '../services/localDataService.js';
import { Transaction, TransactionType, TransactionGroup, TunnelChoice, PaymentMethod } from '../types/index.js';
import { formatRupiah, formatDate } from '../utils/formatters.js';
import {
  PlusCircle,
  Download,
  Search,
  Filter,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  X,
  Check
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const {
    openTransactionModal,
    refreshTrigger,
    refreshData,
    showToast,
    tunnelFilter,
    cycleFilter,
    cyclesList
  } = useApp();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Local filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState<string>('semua');
  const [filterKelompok, setFilterKelompok] = useState<string>('semua');
  const [filterTunnel, setFilterTunnel] = useState<string>('semua');
  const [filterCycle, setFilterCycle] = useState<string>('semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Edit modal state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    dataService.getTransactions()
      .then(data => {
        if (isMounted) setTransactions(data);
      })
      .catch(err => {
        showToast('Gagal memuat transaksi: ' + err.message, 'error');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  // Synchronize global tunnel and cycle filters if set
  useEffect(() => {
    if (tunnelFilter !== 'Semua Tunnel') {
      setFilterTunnel(tunnelFilter);
    }
    if (cycleFilter !== 'Semua Siklus') {
      setFilterCycle(cycleFilter);
    }
  }, [tunnelFilter, cycleFilter]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filterJenis !== 'semua' && tx.jenis !== filterJenis) return false;
      if (filterKelompok !== 'semua' && tx.kelompokTransaksi !== filterKelompok) return false;
      if (filterTunnel !== 'semua' && tx.tunnel !== filterTunnel && tx.tunnel !== 'Kedua Tunnel' && tx.tunnel !== 'Umum / Fasilitas') return false;
      if (filterCycle !== 'semua' && tx.cycleId !== filterCycle) return false;
      if (startDate && tx.tanggal < startDate) return false;
      if (endDate && tx.tanggal > endDate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchKategori = tx.kategori?.toLowerCase().includes(q);
        const matchSub = tx.subkategori?.toLowerCase().includes(q);
        const matchCatatan = tx.catatan?.toLowerCase().includes(q);
        const matchId = tx.id.toLowerCase().includes(q);
        if (!matchKategori && !matchSub && !matchCatatan && !matchId) return false;
      }

      return true;
    });
  }, [transactions, filterJenis, filterKelompok, filterTunnel, filterCycle, startDate, endDate, searchQuery]);

  // Financial summary of filtered records
  const { totalPemasukan, totalPengeluaran, netKas } = useMemo(() => {
    let inSum = 0;
    let outSum = 0;
    for (const tx of filteredTransactions) {
      if (tx.jenis === 'pemasukan') inSum += tx.nominal;
      else outSum += tx.nominal;
    }
    return {
      totalPemasukan: inSum,
      totalPengeluaran: outSum,
      netKas: inSum - outSum
    };
  }, [filteredTransactions]);

  // Paginated records
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await dataService.deleteTransaction(deleteTargetId);
      showToast('Transaksi berhasil dihapus', 'success');
      setDeleteTargetId(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus transaksi', 'error');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    try {
      await dataService.updateTransaction(editingTx.id, editingTx);
      showToast('Transaksi berhasil diperbarui', 'success');
      setEditingTx(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui', 'error');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-stone-900 tracking-tight">
            Buku Transaksi Keuangan
          </h2>
          <p className="text-xs lg:text-sm text-stone-500 mt-0.5">
            Mencatat dan mengelompokkan setiap aliran pemasukan & pengeluaran greenhouse
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dataService.exportCSV('transactions')}
            className="py-2.5 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => openTransactionModal()}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ TAMBAH TRANSAKSI</span>
          </button>
        </div>
      </div>

      {/* Summary Bar of Filtered Results */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
          <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            Total Pemasukan (Tersaring)
          </div>
          <div className="text-xl font-extrabold text-emerald-900 font-mono mt-1">
            {formatRupiah(totalPemasukan)}
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl">
          <div className="text-xs text-rose-800 font-semibold flex items-center gap-1.5">
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
            Total Pengeluaran (Tersaring)
          </div>
          <div className="text-xl font-extrabold text-rose-900 font-mono mt-1">
            {formatRupiah(totalPengeluaran)}
          </div>
        </div>

        <div className="bg-stone-100 border border-stone-200 p-4 rounded-xl">
          <div className="text-xs text-stone-700 font-semibold">
            Net Arus Kas (Tersaring)
          </div>
          <div className={`text-xl font-extrabold font-mono mt-1 ${netKas >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatRupiah(netKas)}
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search box */}
          <div className="lg:col-span-2 relative">
            <label htmlFor="tx-search-input" className="sr-only">Cari transaksi</label>
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="tx-search-input"
              type="text"
              placeholder="Cari kategori, catatan, ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter Jenis */}
          <div>
            <label htmlFor="tx-filter-jenis-select" className="sr-only">Filter Jenis</label>
            <select
              id="tx-filter-jenis-select"
              value={filterJenis}
              onChange={(e) => {
                setFilterJenis(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 cursor-pointer"
            >
              <option value="semua">Semua Jenis (Masuk & Keluar)</option>
              <option value="pemasukan">Pemasukan Saja</option>
              <option value="pengeluaran">Pengeluaran Saja</option>
            </select>
          </div>

          {/* Filter Kelompok */}
          <div>
            <label htmlFor="tx-filter-kelompok-select" className="sr-only">Filter Kelompok</label>
            <select
              id="tx-filter-kelompok-select"
              value={filterKelompok}
              onChange={(e) => {
                setFilterKelompok(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 cursor-pointer"
            >
              <option value="semua">Semua Kelompok</option>
              <option value="produksi">Produksi (HPP Siklus)</option>
              <option value="operasional">Operasional Umum</option>
              <option value="investasi">Investasi Greenhouse</option>
              <option value="penjualan">Penjualan Melon</option>
              <option value="modal">Modal Masuk</option>
              <option value="pinjaman">Pinjaman</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          {/* Filter Tunnel */}
          <div>
            <label htmlFor="tx-filter-tunnel-select" className="sr-only">Filter Tunnel</label>
            <select
              id="tx-filter-tunnel-select"
              value={filterTunnel}
              onChange={(e) => {
                setFilterTunnel(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 cursor-pointer"
            >
              <option value="semua">Semua Tunnel</option>
              <option value="Tunnel 1">Tunnel 1 (8x48m)</option>
              <option value="Tunnel 2">Tunnel 2 (8x48m)</option>
              <option value="Umum / Fasilitas">Umum / Fasilitas</option>
            </select>
          </div>
        </div>

        {/* Date range filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs">
          <span className="text-stone-500 font-semibold">Rentang Tanggal:</span>
          <label htmlFor="tx-filter-start-date" className="sr-only">Tanggal Mulai</label>
          <input
            id="tx-filter-start-date"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold text-stone-700"
          />
          <span className="text-stone-400">s/d</span>
          <label htmlFor="tx-filter-end-date" className="sr-only">Tanggal Akhir</label>
          <input
            id="tx-filter-end-date"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold text-stone-700"
          />

          {(searchQuery || filterJenis !== 'semua' || filterKelompok !== 'semua' || filterTunnel !== 'semua' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterJenis('semua');
                setFilterKelompok('semua');
                setFilterTunnel('semua');
                setFilterCycle('semua');
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
              className="ml-auto text-emerald-700 hover:text-emerald-800 font-bold text-xs cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 select-none">
              <tr>
                <th className="py-3.5 px-4">Tanggal & ID</th>
                <th className="py-3.5 px-4">Jenis</th>
                <th className="py-3.5 px-4">Kategori & Rincian</th>
                <th className="py-3.5 px-4">Kelompok</th>
                <th className="py-3.5 px-4">Tunnel</th>
                <th className="py-3.5 px-4">Siklus</th>
                <th className="py-3.5 px-4">Metode</th>
                <th className="py-3.5 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {paginatedTransactions.map((tx) => {
                const isIncome = tx.jenis === 'pemasukan';
                return (
                  <tr key={tx.id} className="hover:bg-stone-50/90 transition group">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-stone-900">{formatDate(tx.tanggal)}</div>
                      <div className="text-[10px] text-stone-600 font-mono font-medium">{tx.id}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{tx.kategori}</div>
                      {tx.catatan && (
                        <div className="text-[11px] text-stone-500 truncate max-w-xs mt-0.5" title={tx.catatan}>
                          {tx.catatan}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        tx.kelompokTransaksi === 'produksi'
                          ? 'bg-amber-100 text-amber-900'
                          : tx.kelompokTransaksi === 'investasi'
                          ? 'bg-purple-100 text-purple-900'
                          : tx.kelompokTransaksi === 'operasional'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {tx.kelompokTransaksi}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                      {tx.tunnel}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {tx.cycleId ? (
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-mono font-bold text-[10px]">
                          {tx.cycleId}
                        </span>
                      ) : (
                        <span className="text-stone-300">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                      {tx.metodePembayaran}
                    </td>

                    <td className={`py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap text-sm ${
                      isIncome ? 'text-emerald-700' : 'text-stone-900'
                    }`}>
                      {isIncome ? '+' : '-'}{formatRupiah(tx.nominal)}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => setEditingTx(tx)}
                          className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                          title="Edit transaksi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(tx.id)}
                          className="p-1.5 text-stone-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    <Receipt className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-600">Tidak ada transaksi ditemukan</p>
                    <p className="text-xs text-stone-400">Coba ubah kata kunci atau bersihkan filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
          <div>
            Menampilkan <span className="font-bold">{paginatedTransactions.length}</span> dari{' '}
            <span className="font-bold">{filteredTransactions.length}</span> total transaksi tersaring
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-stone-100"
            >
              Sebelumnya
            </button>
            <span className="font-semibold">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-stone-100"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div 
            className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 animate-scale-up"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-delete-transaction-title"
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 id="dialog-delete-transaction-title" className="text-base font-bold text-stone-900">Konfirmasi Hapus Transaksi</h3>
              <p className="text-xs text-stone-500 mt-1">
                Apakah Anda yakin ingin menghapus data transaksi ini secara permanen? Data yang dihapus tidak dapat dipulihkan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-rose-900/20 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-edit-transaction-title"
          >
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 id="modal-edit-transaction-title" className="text-sm font-bold">Edit Transaksi {editingTx.id}</h3>
              <button onClick={() => setEditingTx(null)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label htmlFor="edit-tx-nominal-input" className="block font-bold text-stone-700 mb-1">Nominal (Rp)</label>
                <input
                  id="edit-tx-nominal-input"
                  type="number"
                  value={editingTx.nominal}
                  onChange={(e) => setEditingTx({ ...editingTx, nominal: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-tx-category-input" className="block font-bold text-stone-700 mb-1">Kategori</label>
                <input
                  id="edit-tx-category-input"
                  type="text"
                  value={editingTx.kategori}
                  onChange={(e) => setEditingTx({ ...editingTx, kategori: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="edit-tx-tunnel-select" className="block font-bold text-stone-700 mb-1">Tunnel</label>
                  <select
                    id="edit-tx-tunnel-select"
                    value={editingTx.tunnel}
                    onChange={(e) => setEditingTx({ ...editingTx, tunnel: e.target.value as TunnelChoice })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  >
                    <option value="Tunnel 1">Tunnel 1</option>
                    <option value="Tunnel 2">Tunnel 2</option>
                    <option value="Kedua Tunnel">Kedua Tunnel</option>
                    <option value="Umum / Fasilitas">Umum / Fasilitas</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-tx-method-select" className="block font-bold text-stone-700 mb-1">Metode Bayar</label>
                  <select
                    id="edit-tx-method-select"
                    value={editingTx.metodePembayaran}
                    onChange={(e) => setEditingTx({ ...editingTx, metodePembayaran: e.target.value as PaymentMethod })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Tunai">Tunai</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Hutang">Hutang</option>
                    <option value="Piutang">Piutang</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="edit-tx-note-input" className="block font-bold text-stone-700 mb-1">Catatan</label>
                <input
                  id="edit-tx-note-input"
                  type="text"
                  value={editingTx.catatan || ''}
                  onChange={(e) => setEditingTx({ ...editingTx, catatan: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="py-2 px-3 text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

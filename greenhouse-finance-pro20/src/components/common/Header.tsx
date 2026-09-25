import React from 'react';
import { useApp } from '../../context/AppContext.js';
import {
  PlusCircle,
  Warehouse,
  Layers,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const {
    tunnelFilter,
    setTunnelFilter,
    cycleFilter,
    setCycleFilter,
    cyclesList,
    openTransactionModal,
    refreshData,
    settings
  } = useApp();

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs safe-top">
      <div className="px-4 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Title & Description */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-xl font-bold text-stone-900 tracking-tight truncate">
              {title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {settings?.jumlahTunnel || 2} Tunnel DFT
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] lg:text-xs text-stone-500 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Tunnel Filter */}
          <div className="relative inline-flex items-center">
            <label htmlFor="header-tunnel-select" className="sr-only">Pilih Tunnel</label>
            <div className="absolute left-2.5 pointer-events-none text-stone-400">
              <Warehouse className="w-3.5 h-3.5" />
            </div>
            <select
              id="header-tunnel-select"
              value={tunnelFilter}
              onChange={(e) => setTunnelFilter(e.target.value)}
              className="pl-8 pr-7 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition cursor-pointer appearance-none"
            >
              <option value="Semua Tunnel">Semua Tunnel (1 & 2)</option>
              <option value="Tunnel 1">Tunnel 1 (8x48m)</option>
              <option value="Tunnel 2">Tunnel 2 (8x48m)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-stone-400 absolute right-2 pointer-events-none" />
          </div>

          {/* Cycle Filter */}
          <div className="relative inline-flex items-center">
            <label htmlFor="header-cycle-select" className="sr-only">Pilih Siklus</label>
            <div className="absolute left-2.5 pointer-events-none text-stone-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <select
              id="header-cycle-select"
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="pl-8 pr-7 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition cursor-pointer appearance-none max-w-[140px] truncate"
            >
              <option value="Semua Siklus">Semua Siklus</option>
              {cyclesList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id} ({c.tunnel})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-stone-400 absolute right-2 pointer-events-none" />
          </div>

          {/* Refresh Data button */}
          <button
            onClick={() => refreshData()}
            title="Segarkan Data Lokal"
            className="p-1.5 text-stone-500 hover:text-stone-800 bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Quick Transaction Button */}
          <button
            onClick={() => openTransactionModal()}
            className="hidden sm:inline-flex items-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Transaksi</span>
          </button>
        </div>
      </div>
    </header>
  );
};

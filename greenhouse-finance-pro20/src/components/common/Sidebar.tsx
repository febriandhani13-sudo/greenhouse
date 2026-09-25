import React from 'react';
import { useApp, PageId } from '../../context/AppContext.js';
import {
  LayoutDashboard,
  Building2,
  ArrowLeftRight,
  Sprout,
  Scale,
  Landmark,
  Boxes,
  Cpu,
  BadgeAlert,
  FileSpreadsheet,
  Settings,
  PlusCircle,
  Leaf
} from 'lucide-react';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'greenhouses', label: 'Greenhouse', icon: Building2 },
  { id: 'transactions', label: 'Buku Transaksi', icon: ArrowLeftRight },
  { id: 'cycles', label: 'Siklus Tanam', icon: Sprout },
  { id: 'harvests', label: 'Panen & Penjualan', icon: Scale },
  { id: 'investments', label: 'Investasi Greenhouse', icon: Landmark },
  { id: 'inventory', label: 'Stok Saprotan', icon: Boxes },
  { id: 'assets', label: 'Aset Greenhouse', icon: Cpu },
  { id: 'debts', label: 'Hutang & Piutang', icon: BadgeAlert },
  { id: 'reports', label: 'Laporan & BEP', icon: FileSpreadsheet },
  { id: 'settings', label: 'Pengaturan & Backup', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, openTransactionModal, settings } = useApp();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-stone-900 border-r border-stone-800 text-stone-300 min-h-screen shrink-0 sticky top-0 h-screen select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-stone-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 shrink-0">
          <Leaf className="w-6 h-6" />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-white font-bold text-sm leading-tight tracking-tight">GREENHOUSE</h1>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-extrabold text-xs tracking-wider">FINANCE PRO</span>
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="p-4 space-y-2">
        <button
          onClick={() => openTransactionModal()}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition active:scale-[0.98] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-emerald-100" />
          <span>+ Catat Transaksi</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-stone-500 uppercase">
          Menu Utama
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs transition text-left cursor-pointer ${
                isActive
                  ? 'bg-emerald-600/15 text-emerald-400 font-semibold border border-emerald-500/30 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-stone-400'}`} />
              <span className="truncate flex-1">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Storage Indicator & Greenhouse Specs */}
      <div className="p-3.5 border-t border-stone-800 text-[11px] bg-stone-950/40 space-y-1">
        <div className="flex items-center justify-between text-stone-400 font-semibold">
          <span className="truncate">{settings?.namaGreenhouse || 'Greenhouse Melon'}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
            {settings?.jumlahTunnel || 2} Tunnel
          </span>
        </div>
        <div className="text-[10px] text-stone-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>IndexedDB lokal di browser</span>
        </div>
      </div>
    </aside>
  );
};

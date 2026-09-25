import React, { useState } from 'react';
import { useApp, PageId } from '../../context/AppContext.js';
import {
  LayoutDashboard,
  Building2,
  ArrowLeftRight,
  Sprout,
  FileSpreadsheet,
  Menu,
  Plus,
  Scale,
  Landmark,
  Boxes,
  Cpu,
  BadgeAlert,
  Settings,
  X
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { activePage, setActivePage, openTransactionModal } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'greenhouses', label: 'Greenhouse', icon: Building2 },
    { id: 'harvests', label: 'Panen & Penjualan', icon: Scale },
    { id: 'investments', label: 'Investasi Greenhouse', icon: Landmark },
    { id: 'inventory', label: 'Stok Saprotan', icon: Boxes },
    { id: 'assets', label: 'Aset Greenhouse', icon: Cpu },
    { id: 'debts', label: 'Hutang & Piutang', icon: BadgeAlert },
    { id: 'reports', label: 'Laporan & BEP', icon: FileSpreadsheet },
    { id: 'settings', label: 'Pengaturan & Backup', icon: Settings },
  ];

  const handleSelectPage = (id: PageId) => {
    setActivePage(id);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Drawer / Sheet (Rule 29) */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-stone-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-t-3xl border-t border-stone-200 p-5 space-y-4 max-h-[85vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  GH
                </div>
                <h3 className="font-bold text-stone-900 text-sm">Menu Tambahan</h3>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectPage(item.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 font-medium'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600 shadow-xs'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 text-stone-400 px-3 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* 1. Dashboard */}
          <button
            onClick={() => setActivePage('dashboard')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
              activePage === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Dashboard</span>
          </button>

          {/* 2. Transaksi */}
          <button
            onClick={() => setActivePage('transactions')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
              activePage === 'transactions' ? 'text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5 mb-0.5" />
            <span>Transaksi</span>
          </button>

          {/* Center Quick Entry Button */}
          <div className="relative -top-3">
            <button
              onClick={() => openTransactionModal()}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 border-2 border-stone-900 active:scale-95 transition"
              aria-label="Catat Cepat"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* 3. Produksi (Cycles) */}
          <button
            onClick={() => setActivePage('cycles')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
              activePage === 'cycles' ? 'text-emerald-400 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sprout className="w-5 h-5 mb-0.5" />
            <span>Produksi</span>
          </button>

          {/* 4. Menu Sheet Trigger */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
              isMenuOpen || ['greenhouses', 'harvests', 'investments', 'inventory', 'assets', 'debts', 'reports', 'settings'].includes(activePage)
                ? 'text-emerald-400 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span>Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
};

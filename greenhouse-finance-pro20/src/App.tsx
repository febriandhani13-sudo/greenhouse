/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp, PageId } from './context/AppContext.js';
import { Sidebar } from './components/common/Sidebar.js';
import { Header } from './components/common/Header.js';
import { MobileBottomNav } from './components/common/MobileBottomNav.js';
import { ToastContainer } from './components/common/ToastContainer.js';
import { QuickTransactionModal } from './components/modals/QuickTransactionModal.js';
import { DatabaseInitModal } from './components/common/DatabaseInitModal.js';

// Pages
import { DashboardPage } from './pages/DashboardPage.js';
import { GreenhousesPage } from './pages/GreenhousesPage.js';
import { TransactionsPage } from './pages/TransactionsPage.js';
import { CyclesPage } from './pages/CyclesPage.js';
import { HarvestsPage } from './pages/HarvestsPage.js';
import { InvestmentsPage } from './pages/InvestmentsPage.js';
import { InventoryPage } from './pages/InventoryPage.js';
import { AssetsPage } from './pages/AssetsPage.js';
import { DebtsPage } from './pages/DebtsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

const PAGE_METADATA: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Keuangan',
    subtitle: 'Ikhtisar saldo kas, omzet penjualan, HPP rata-rata, dan pengembalian modal'
  },
  greenhouses: {
    title: 'Greenhouse',
    subtitle: 'Kelola spesifikasi greenhouse, tunnel, kapasitas, dan fasilitas'
  },
  transactions: {
    title: 'Buku Transaksi',
    subtitle: 'Pencatatan arus kas masuk & keluar, biaya produksi, operasional, dan modal'
  },
  cycles: {
    title: 'Siklus Tanam Melon',
    subtitle: 'Manajemen populasi tanaman, biaya per siklus, dan kalkulasi HPP/kg'
  },
  harvests: {
    title: 'Panen & Penjualan',
    subtitle: 'Pencatatan hasil panen melon bertahap, sortasi grade A/B/C, dan omzet'
  },
  investments: {
    title: 'Investasi Greenhouse',
    subtitle: 'Struktur bambu petung, atap UV, dinding net, dan instalasi DFT'
  },
  inventory: {
    title: 'Stok Saprotan',
    subtitle: 'Pengendalian persediaan benih, AB mix, media rockwool, dan kemasan'
  },
  assets: {
    title: 'Aset Greenhouse',
    subtitle: 'Inventarisasi aktiva tetap, pompa, tandon, alat ukur pH/EC, dan depresiasi'
  },
  debts: {
    title: 'Hutang & Piutang',
    subtitle: 'Monitoring kewajiban pembayaran supplier dan piutang pembeli melon'
  },
  reports: {
    title: 'Laporan Finansial & BEP',
    subtitle: 'Laba rugi agribisnis, evaluasi antar siklus, kalkulator BEP, dan ROI'
  },
  settings: {
    title: 'Pengaturan & Backup Data',
    subtitle: 'Konfigurasi greenhouse, profil usaha, manajemen backup JSON, dan export CSV'
  }
};

const MainContent: React.FC = () => {
  const {
    activePage,
    isInitModalOpen,
    handleChooseDemo,
    handleChooseEmpty,
    isInitializing
  } = useApp();
  const meta = PAGE_METADATA[activePage] || PAGE_METADATA.dashboard;

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header title={meta.title} subtitle={meta.subtitle} />

        {/* Dynamic Page Component */}
        <main className="flex-1">
          {activePage === 'dashboard' && <DashboardPage />}
          {activePage === 'greenhouses' && <GreenhousesPage />}
          {activePage === 'transactions' && <TransactionsPage />}
          {activePage === 'cycles' && <CyclesPage />}
          {activePage === 'harvests' && <HarvestsPage />}
          {activePage === 'investments' && <InvestmentsPage />}
          {activePage === 'inventory' && <InventoryPage />}
          {activePage === 'assets' && <AssetsPage />}
          {activePage === 'debts' && <DebtsPage />}
          {activePage === 'reports' && <ReportsPage />}
          {activePage === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Quick Transaction Modal */}
      <QuickTransactionModal />

      {/* First Time Database Initialization Modal (Demo vs Clean) */}
      <DatabaseInitModal
        isOpen={isInitModalOpen}
        onChooseDemo={handleChooseDemo}
        onChooseEmpty={handleChooseEmpty}
        isProcessing={isInitializing}
      />

      {/* Global Toasts Notification */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

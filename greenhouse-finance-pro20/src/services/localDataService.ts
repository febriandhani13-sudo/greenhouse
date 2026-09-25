/**
 * GREENHOUSE FINANCE PRO - Browser Data Service
 *
 * Bridges UI components directly to IndexedDB repositories.
 * The application requires the web app to be loaded normally; IndexedDB is used
 * for persistent browser-side data storage and backup/restore.
 */

import {
  settingsRepository,
  transactionRepository,
  cycleRepository,
  harvestRepository,
  investmentRepository,
  assetRepository,
  inventoryRepository,
  debtRepository,
  greenhouseRepository,
  greenhouseTunnelRepository,
  dashboardService,
  reportService,
  backupService
} from './storage.js';

import {
  Transaction,
  Cycle,
  Harvest,
  Investment,
  Asset,
  InventoryItem,
  StockMovement,
  Debt,
  Greenhouse,
  GreenhouseTunnel,
  AppSettings,
  DashboardMetrics,
  CycleFinancialDetail
} from '../types/index.js';

export const localDataService = {
  // GREENHOUSES & TUNNELS
  async getGreenhouses(): Promise<Greenhouse[]> {
    return greenhouseRepository.getAll();
  },

  async getGreenhouseById(id: string): Promise<Greenhouse | undefined> {
    return greenhouseRepository.getById(id);
  },

  async createGreenhouse(data: Omit<Greenhouse, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Greenhouse> {
    return greenhouseRepository.create(data);
  },

  async updateGreenhouse(id: string, updates: Partial<Greenhouse>): Promise<Greenhouse> {
    return greenhouseRepository.update(id, updates);
  },

  async deleteGreenhouse(id: string, force?: boolean): Promise<void> {
    return greenhouseRepository.delete(id, force);
  },

  async checkGreenhouseRelatedData(id: string): Promise<{ tunnelCount: number; cycleCount: number; investmentCount: number }> {
    return greenhouseRepository.checkRelatedData(id);
  },

  async getGreenhouseTunnels(greenhouseId?: string): Promise<GreenhouseTunnel[]> {
    if (greenhouseId) {
      return greenhouseTunnelRepository.getByGreenhouseId(greenhouseId);
    }
    return greenhouseTunnelRepository.getAll();
  },

  async getTunnelById(id: string): Promise<GreenhouseTunnel | undefined> {
    return greenhouseTunnelRepository.getById(id);
  },

  async createGreenhouseTunnel(data: Omit<GreenhouseTunnel, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<GreenhouseTunnel> {
    return greenhouseTunnelRepository.create(data);
  },

  async updateGreenhouseTunnel(id: string, updates: Partial<GreenhouseTunnel>): Promise<GreenhouseTunnel> {
    return greenhouseTunnelRepository.update(id, updates);
  },

  async checkGreenhouseTunnelRelatedData(id: string): Promise<{ cycleCount: number; relatedCycles: string[] }> {
    return greenhouseTunnelRepository.checkRelatedData(id);
  },

  async deleteGreenhouseTunnel(id: string, force?: boolean): Promise<void> {
    return greenhouseTunnelRepository.delete(id, force);
  },

  // TRANSACTIONS
  async getTransactions(): Promise<Transaction[]> {
    return transactionRepository.getAll();
  },

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    return transactionRepository.getById(id);
  },

  async createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Transaction> {
    return transactionRepository.create(data);
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    return transactionRepository.update(id, updates);
  },

  async deleteTransaction(id: string): Promise<void> {
    return transactionRepository.delete(id);
  },

  // CYCLES
  async getCycles(): Promise<{ cycles: Cycle[]; details: CycleFinancialDetail[] }> {
    const cycles = await cycleRepository.getAll();
    const details = await reportService.getAllCyclesFinancial();
    return { cycles, details };
  },

  async getCycleById(id: string): Promise<Cycle | undefined> {
    return cycleRepository.getById(id);
  },

  async createCycle(data: Omit<Cycle, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Cycle> {
    return cycleRepository.create(data);
  },

  async updateCycle(id: string, updates: Partial<Cycle>): Promise<Cycle> {
    return cycleRepository.update(id, updates);
  },

  async deleteCycle(id: string): Promise<void> {
    return cycleRepository.delete(id);
  },

  // HARVESTS
  async getHarvests(cycleId?: string): Promise<Harvest[]> {
    return harvestRepository.getAll(cycleId);
  },

  async createHarvest(data: Omit<Harvest, 'id' | 'totalNominal' | 'createdAt' | 'updatedAt'> & { id?: string; createTransactionRecord?: boolean }): Promise<Harvest> {
    return harvestRepository.create(data);
  },

  async updateHarvest(id: string, updates: Partial<Harvest>): Promise<Harvest> {
    return harvestRepository.update(id, updates);
  },

  async deleteHarvest(id: string): Promise<void> {
    return harvestRepository.delete(id);
  },

  // INVESTMENTS
  async getInvestments(): Promise<Investment[]> {
    return investmentRepository.getAll();
  },

  async createInvestment(data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createAssetRecord?: boolean; createTransactionRecord?: boolean }): Promise<Investment> {
    return investmentRepository.create(data);
  },

  async updateInvestment(id: string, updates: Partial<Investment>): Promise<Investment> {
    return investmentRepository.update(id, updates);
  },

  async deleteInvestment(id: string): Promise<void> {
    return investmentRepository.delete(id);
  },

  // ASSETS
  async getAssets(): Promise<Asset[]> {
    return assetRepository.getAll();
  },

  async createAsset(data: Omit<Asset, 'id' | 'nilaiTotal'> & { id?: string; nilaiTotal?: number }): Promise<Asset> {
    return assetRepository.create(data);
  },

  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
    return assetRepository.update(id, updates);
  },

  async deleteAsset(id: string): Promise<void> {
    return assetRepository.delete(id);
  },

  // INVENTORY & STOCK MOVEMENTS
  async getInventory(): Promise<{ items: InventoryItem[]; movements: StockMovement[] }> {
    const items = await inventoryRepository.getAllItems();
    const movements = await inventoryRepository.getAllMovements();
    return { items, movements };
  },

  async createInventoryItem(data: {
    namaBarang: string;
    kategori: string;
    satuan: string;
    stokAwal?: number;
    stokMasuk?: number;
    stokKeluar?: number;
    minimumStok?: number;
    hargaRataRata?: number;
    lokasiPenyimpanan?: string;
    catatan?: string;
    id?: string;
  }): Promise<InventoryItem> {
    return inventoryRepository.createItem({
      ...data,
      stokAwal: data.stokAwal || 0,
      stokMasuk: data.stokMasuk || 0,
      stokKeluar: data.stokKeluar || 0,
      minimumStok: data.minimumStok || 0,
      hargaRataRata: data.hargaRataRata || 0
    });
  },

  async createStockMovement(data: {
    itemId: string;
    jenis: 'Masuk' | 'Keluar' | 'Penyesuaian';
    jumlah: number;
    hargaSatuan: number;
    namaBarang?: string;
    satuan?: string;
    tanggal?: string;
    referensi?: string;
    cycleId?: string;
    catatan?: string;
    id?: string;
  }): Promise<StockMovement> {
    let namaBarang = data.namaBarang;
    let satuan = data.satuan;
    if (!namaBarang || !satuan) {
      const item = await inventoryRepository.getItemById(data.itemId);
      if (item) {
        namaBarang = namaBarang || item.namaBarang;
        satuan = satuan || item.satuan;
      }
    }
    return inventoryRepository.createMovement({
      ...data,
      namaBarang: namaBarang || 'Barang',
      satuan: satuan || 'unit',
      tanggal: data.tanggal || new Date().toISOString().split('T')[0]
    });
  },

  // DEBTS & RECEIVABLES
  async getDebts(jenis?: 'hutang' | 'piutang'): Promise<Debt[]> {
    return debtRepository.getAll(jenis);
  },

  async createDebt(data: Omit<Debt, 'id' | 'dibayar' | 'sisa' | 'status' | 'riwayatPembayaran' | 'createdAt' | 'updatedAt'> & { id?: string; dibayarAwal?: number }): Promise<Debt> {
    return debtRepository.create(data);
  },

  async recordDebtPayment(debtId: string, payment: { nominal: number; tanggal: string; metodePembayaran: any; catatan?: string }): Promise<Debt> {
    return debtRepository.recordPayment(debtId, payment);
  },

  async payDebt(debtId: string, payment: { nominal: number; tanggal: string; metodePembayaran: any; catatan?: string }): Promise<Debt> {
    return debtRepository.recordPayment(debtId, payment);
  },

  async deleteDebt(id: string): Promise<void> {
    return debtRepository.delete(id);
  },

  // DASHBOARD & REPORTS
  async getDashboardData(filters?: { tunnel?: string; cycleId?: string; year?: number; month?: number }): Promise<{
    metrics: DashboardMetrics;
    cashFlow: { month: string; pemasukan: number; pengeluaran: number; netCashFlow: number }[];
    expenseBreakdown: { category: string; amount: number; percentage: number }[];
    cycleDetails: CycleFinancialDetail[];
  }> {
    return dashboardService.getMetrics(filters);
  },

  async getCycleFinancialDetail(cycleId: string): Promise<CycleFinancialDetail | null> {
    return reportService.getCycleFinancialDetail(cycleId);
  },

  async getAllCyclesFinancial(): Promise<CycleFinancialDetail[]> {
    return reportService.getAllCyclesFinancial();
  },

  // SETTINGS
  async getSettings(): Promise<AppSettings> {
    return settingsRepository.get();
  },

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    return settingsRepository.update(updates);
  },

  // BACKUP & RESTORE & CSV
  async downloadBackup(): Promise<void> {
    return backupService.exportJSON();
  },

  async restoreBackup(jsonContent: any): Promise<{ success: boolean; count: number }> {
    return backupService.restoreJSON(jsonContent);
  },

  async exportCSV(type: 'transactions' | 'harvests' | 'investments' | 'inventory' | 'debts'): Promise<void> {
    return backupService.exportCSV(type);
  },

  async resetToDemo(): Promise<void> {
    return backupService.resetToDemo();
  },

  async resetToEmpty(): Promise<void> {
    return backupService.resetToEmpty();
  }
};

// Aliases for clean architectural naming
export const dataService = localDataService;

// Re-export all repositories and services for modular access
export {
  settingsRepository,
  transactionRepository,
  cycleRepository,
  harvestRepository,
  investmentRepository,
  assetRepository,
  inventoryRepository,
  debtRepository,
  greenhouseRepository,
  greenhouseTunnelRepository,
  dashboardService,
  reportService,
  backupService
};

import { getDatabase, seedDemoData, seedEmptyData, checkDatabaseInitialization } from '../db/indexedDB.js';
import {
  AppSettings,
  Transaction,
  Cycle,
  Harvest,
  Investment,
  Asset,
  InventoryItem,
  StockMovement,
  Debt,
  DebtPayment,
  DashboardMetrics,
  CycleFinancialDetail,
  Greenhouse,
  GreenhouseTunnel
} from '../types/index.js';
import { DEFAULT_SETTINGS, DEMO_GREENHOUSES, DEMO_TUNNELS } from '../db/demoData.js';
import { greenhouseRepository, greenhouseTunnelRepository } from './greenhouseRepository.js';

export { greenhouseRepository, greenhouseTunnelRepository };

// ============================================================================
// SETTINGS REPOSITORY
// ============================================================================
export const settingsRepository = {
  async get(): Promise<AppSettings> {
    const db = await getDatabase();
    const settings = await db.get('settings', 'current');
    if (!settings) {
      const defaultVal = { ...DEFAULT_SETTINGS };
      await db.put('settings', defaultVal, 'current');
      return defaultVal;
    }
    return settings;
  },

  async update(updates: Partial<AppSettings>): Promise<AppSettings> {
    const db = await getDatabase();
    const current = await this.get();
    const merged: AppSettings = { ...current, ...updates };
    await db.put('settings', merged, 'current');
    return merged;
  }
};

// ============================================================================
// TRANSACTIONS REPOSITORY
// ============================================================================
export const transactionRepository = {
  async getAll(): Promise<Transaction[]> {
    const db = await getDatabase();
    const list = await db.getAll('transactions');
    return list.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  },

  async getById(id: string): Promise<Transaction | undefined> {
    const db = await getDatabase();
    return db.get('transactions', id);
  },

  async create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Transaction> {
    const db = await getDatabase();
    const all = await db.getAll('transactions');
    let maxNum = 0;
    for (const t of all) {
      const match = t.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const newId = data.id || `TRX-${String(maxNum + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const tx: Transaction = {
      ...data,
      id: newId,
      createdAt: now,
      updatedAt: now
    };

    await db.put('transactions', tx);
    return tx;
  },

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const db = await getDatabase();
    const current = await db.get('transactions', id);
    if (!current) throw new Error('Transaksi tidak ditemukan');

    const updated: Transaction = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await db.put('transactions', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    const tx = await db.get('transactions', id);
    if (tx) {
      // Bersihkan relasi jika transaksi otomatis panen dihapus manual
      if (tx.referenceType === 'harvest' || tx.referenceId) {
        const harvests = await db.getAll('harvests');
        for (const h of harvests) {
          if (h.transactionId === id || h.id === tx.referenceId) {
            h.transactionId = undefined;
            if (tx.referenceType === 'harvest' || h.id === tx.referenceId) {
              h.dibayar = 0;
              h.statusPembayaran = 'Belum Lunas';
              h.updatedAt = new Date().toISOString();
              await db.put('harvests', h);
            }
          }
        }
      }
      // Bersihkan relasi investasi jika dihapus manual
      if (tx.referenceType === 'investment' || tx.referenceId) {
        const investments = await db.getAll('investments');
        for (const inv of investments) {
          if (inv.transactionId === id || inv.id === tx.referenceId) {
            inv.transactionId = undefined;
            inv.updatedAt = new Date().toISOString();
            await db.put('investments', inv);
          }
        }
      }
    }
    await db.delete('transactions', id);
  }
};

// ============================================================================
// CYCLES REPOSITORY
// ============================================================================
export const cycleRepository = {
  async getAll(): Promise<Cycle[]> {
    const db = await getDatabase();
    return db.getAll('cycles');
  },

  async getById(id: string): Promise<Cycle | undefined> {
    const db = await getDatabase();
    return db.get('cycles', id);
  },

  async create(data: Omit<Cycle, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Cycle> {
    const db = await getDatabase();
    const all = await db.getAll('cycles');
    let maxNum = 0;
    for (const c of all) {
      const match = c.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const newId = data.id || `S${String(maxNum + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    // Auto-capture greenhouse snapshot if not already provided (Requirement R)
    let snapshot = data.greenhouseSnapshot;
    if (!snapshot && data.greenhouseId) {
      const gh = await db.get('greenhouses', data.greenhouseId);
      if (gh) {
        const tnl = data.tunnelId ? await db.get('greenhouseTunnels', data.tunnelId) : undefined;
        snapshot = {
          greenhouseId: gh.id,
          greenhouseName: gh.name,
          lengthM: gh.lengthM,
          widthM: gh.widthM,
          plantCapacity: gh.totalPlantCapacity,
          tunnelId: tnl?.id,
          tunnelName: tnl?.name || data.tunnel,
          tunnelLengthM: tnl?.lengthM,
          tunnelWidthM: tnl?.widthM,
          tunnelPlantCapacity: tnl?.plantCapacity,
          cultivationSystem: tnl?.cultivationSystem || gh.cultivationSystem || 'DFT',
          cultivationMedia: tnl?.cultivationMedia || gh.cultivationMedia || 'Pasir',
          capturedAt: now
        };
      }
    }

    const cycle: Cycle = {
      ...data,
      id: newId,
      greenhouseSnapshot: snapshot,
      createdAt: now,
      updatedAt: now
    };

    await db.put('cycles', cycle);
    return cycle;
  },

  async update(id: string, updates: Partial<Cycle>): Promise<Cycle> {
    const db = await getDatabase();
    const current = await db.get('cycles', id);
    if (!current) throw new Error('Siklus tidak ditemukan');

    // Pastikan historical greenhouseSnapshot cycle lama tetap dipertahankan (Requirement R)
    const updated: Cycle = {
      ...current,
      ...updates,
      greenhouseSnapshot: updates.greenhouseSnapshot !== undefined ? updates.greenhouseSnapshot : current.greenhouseSnapshot,
      updatedAt: new Date().toISOString()
    };

    await db.put('cycles', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('cycles', id);
  }
};

// ============================================================================
// HARVESTS REPOSITORY (With Double-Counting Protection)
// ============================================================================
export const harvestRepository = {
  async getAll(cycleId?: string): Promise<Harvest[]> {
    const db = await getDatabase();
    if (cycleId && cycleId !== 'semua') {
      return db.getAllFromIndex('harvests', 'by-cycle', cycleId);
    }
    const list = await db.getAll('harvests');
    return list.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  },

  async create(data: Omit<Harvest, 'id' | 'totalNominal' | 'createdAt' | 'updatedAt'> & { id?: string; createTransactionRecord?: boolean }): Promise<Harvest> {
    const db = await getDatabase();
    const all = await db.getAll('harvests');
    let maxNum = 0;
    for (const h of all) {
      const match = h.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const newId = data.id || `HRV-${String(maxNum + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const totalNominal = data.totalKg * data.hargaRataRata;

    // Tentukan nilai pembayaran aktual terlebih dahulu
    const dibayarAktual =
      data.statusPembayaran === 'Belum Lunas'
        ? 0
        : data.dibayar !== undefined
          ? data.dibayar
          : data.statusPembayaran === 'Lunas'
            ? totalNominal
            : 0;

    let transactionId: string | undefined = undefined;

    // Automatic Transaction Linkage: Hanya catat transaksi kas jika ada pembayaran aktual > 0
    if (data.createTransactionRecord !== false && dibayarAktual > 0) {
      const tx = await transactionRepository.create({
        tanggal: data.tanggal,
        jenis: 'pemasukan',
        kelompokTransaksi: 'penjualan',
        kategori: 'Penjualan Melon',
        subkategori: `Panen Siklus ${data.cycleId}`,
        nominal: dibayarAktual,
        metodePembayaran: 'Transfer Bank',
        cycleId: data.cycleId,
        tunnel: data.tunnel,
        catatan: `Hasil Panen ${data.totalKg} kg (${data.pembeli})`,
        referenceType: 'harvest',
        referenceId: newId
      });
      transactionId = tx.id;
    }

    const harvest: Harvest = {
      ...data,
      id: newId,
      totalNominal,
      dibayar: dibayarAktual,
      transactionId,
      createdAt: now,
      updatedAt: now
    };

    await db.put('harvests', harvest);
    return harvest;
  },

  async update(id: string, updates: Partial<Harvest>): Promise<Harvest> {
    const db = await getDatabase();
    const current = await db.get('harvests', id);
    if (!current) throw new Error('Data panen tidak ditemukan');

    const totalKg = updates.totalKg !== undefined ? updates.totalKg : current.totalKg;
    const hargaRataRata = updates.hargaRataRata !== undefined ? updates.hargaRataRata : current.hargaRataRata;
    const totalNominal = totalKg * hargaRataRata;
    const now = new Date().toISOString();

    const targetStatus = updates.statusPembayaran !== undefined ? updates.statusPembayaran : current.statusPembayaran;

    const nominalToSet =
      targetStatus === 'Belum Lunas'
        ? 0
        : updates.dibayar !== undefined
          ? updates.dibayar
          : targetStatus === 'Lunas'
            ? totalNominal
            : (current.dibayar ?? 0);

    const updated: Harvest = {
      ...current,
      ...updates,
      totalKg,
      hargaRataRata,
      totalNominal,
      dibayar: nominalToSet,
      updatedAt: now
    };

    // Find linked transaction: prioritize referenceType + referenceId, fallback to current.transactionId or referenceId
    const allTransactions = await transactionRepository.getAll();
    const linkedTxs = allTransactions.filter(t => 
      (t.referenceType === 'harvest' && t.referenceId === id) ||
      (current.transactionId && t.id === current.transactionId) ||
      t.referenceId === id
    );

    if (nominalToSet <= 0) {
      // Saat nilai pembayaran menjadi 0 atau tidak ada pembayaran:
      // 1. Hapus transaksi otomatis yang terkait (JANGAN menyimpan transaksi dengan nominal = 0)
      for (const tx of linkedTxs) {
        await transactionRepository.delete(tx.id).catch(() => {});
      }
      // 2. Set transactionId = undefined
      updated.transactionId = undefined;
      // 3. Simpan harvest
    } else {
      // Pembayaran > 0
      if (linkedTxs.length > 0) {
        // Update transaksi terkait yang sudah ada - tidak ada duplicate
        const primaryTx = linkedTxs[0];
        await transactionRepository.update(primaryTx.id, {
          nominal: nominalToSet,
          tanggal: updated.tanggal,
          tunnel: updated.tunnel,
          cycleId: updated.cycleId,
          catatan: `Hasil Panen ${totalKg} kg (${updated.pembeli})`,
          referenceType: 'harvest',
          referenceId: id
        });
        updated.transactionId = primaryTx.id;
        // Hapus duplikasi jika ada transaksi berlebih
        for (let i = 1; i < linkedTxs.length; i++) {
          await transactionRepository.delete(linkedTxs[i].id).catch(() => {});
        }
      } else {
        // Buat transaksi otomatis baru jika sebelumnya dibayar = 0 dan sekarang > 0
        const newTx = await transactionRepository.create({
          tanggal: updated.tanggal,
          jenis: 'pemasukan',
          kelompokTransaksi: 'penjualan',
          kategori: 'Penjualan Melon',
          subkategori: `Panen Siklus ${updated.cycleId}`,
          nominal: nominalToSet,
          metodePembayaran: 'Transfer Bank',
          cycleId: updated.cycleId,
          tunnel: updated.tunnel,
          catatan: `Hasil Panen ${totalKg} kg (${updated.pembeli})`,
          referenceType: 'harvest',
          referenceId: id
        });
        updated.transactionId = newTx.id;
      }
    }

    await db.put('harvests', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    const harvest = await db.get('harvests', id);
    // Find all linked transactions created automatically by this harvest
    const allTransactions = await transactionRepository.getAll();
    const linkedTransactions = allTransactions.filter(t => 
      (t.referenceType === 'harvest' && t.referenceId === id) ||
      (harvest?.transactionId && t.id === harvest.transactionId) ||
      t.referenceId === id
    );
    for (const tx of linkedTransactions) {
      await transactionRepository.delete(tx.id).catch(() => {});
    }
    await db.delete('harvests', id);
  }
};

// ============================================================================
// INVESTMENTS REPOSITORY (With Double-Counting Protection)
// ============================================================================
export const investmentRepository = {
  async getAll(): Promise<Investment[]> {
    const db = await getDatabase();
    const list = await db.getAll('investments');
    return list.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  },

  async create(data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createAssetRecord?: boolean; createTransactionRecord?: boolean }): Promise<Investment> {
    const db = await getDatabase();
    const all = await db.getAll('investments');
    let maxNum = 0;
    for (const invItem of all) {
      const match = invItem.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const newId = data.id || `INV-${String(maxNum + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    let assetId: string | undefined = undefined;
    if (data.createAssetRecord) {
      const asset = await assetRepository.create({
        namaAset: data.namaItem,
        kategori: data.kategori,
        tanggalPembelian: data.tanggal,
        harga: data.nominal,
        jumlah: 1,
        nilaiTotal: data.nominal,
        kondisi: 'Baik',
        umurEkonomisTahun: 5,
        lokasi: data.tunnel,
        catatan: `Aset dari investasi ${data.namaItem}`
      });
      assetId = asset.id;
    }

    let transactionId: string | undefined = undefined;
    if (data.createTransactionRecord !== false) {
      const tx = await transactionRepository.create({
        tanggal: data.tanggal,
        jenis: 'pengeluaran',
        kelompokTransaksi: 'investasi',
        kategori: data.kategori,
        subkategori: data.namaItem,
        nominal: data.nominal,
        metodePembayaran: data.metodePembayaran,
        tunnel: data.tunnel,
        catatan: data.catatan || `Investasi greenhouse: ${data.namaItem}`,
        referenceType: 'investment',
        referenceId: newId
      });
      transactionId = tx.id;
    }

    const inv: Investment = {
      ...data,
      id: newId,
      assetId,
      transactionId,
      createdAt: now,
      updatedAt: now
    };

    await db.put('investments', inv);
    return inv;
  },

  async update(id: string, updates: Partial<Investment>): Promise<Investment> {
    const db = await getDatabase();
    const current = await db.get('investments', id);
    if (!current) throw new Error('Data investasi tidak ditemukan');

    const updated: Investment = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Update linked transaction
    const allTx = await transactionRepository.getAll();
    const linkedTxs = allTx.filter(t => 
      (t.referenceType === 'investment' && t.referenceId === id) ||
      (current.transactionId && t.id === current.transactionId) ||
      t.referenceId === id
    );
    if (linkedTxs.length > 0) {
      const primaryTx = linkedTxs[0];
      await transactionRepository.update(primaryTx.id, {
        nominal: updated.nominal,
        tanggal: updated.tanggal,
        tunnel: updated.tunnel,
        kategori: updated.kategori,
        subkategori: updated.namaItem,
        metodePembayaran: updated.metodePembayaran,
        catatan: updated.catatan || `Investasi greenhouse: ${updated.namaItem}`,
        referenceType: 'investment',
        referenceId: id
      });
      updated.transactionId = primaryTx.id;
      // Clean up extra duplicate transactions if any
      for (let i = 1; i < linkedTxs.length; i++) {
        await transactionRepository.delete(linkedTxs[i].id).catch(() => {});
      }
    }

    // Update linked asset if exists
    if (current.assetId) {
      await assetRepository.update(current.assetId, {
        namaAset: updated.namaItem,
        kategori: updated.kategori,
        harga: updated.nominal,
        nilaiTotal: updated.nominal,
        tanggalPembelian: updated.tanggal,
        lokasi: updated.tunnel
      }).catch(() => {});
    }

    await db.put('investments', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    const inv = await db.get('investments', id);
    // Delete linked transactions only
    const allTx = await transactionRepository.getAll();
    const linkedTxs = allTx.filter(t => 
      (t.referenceType === 'investment' && t.referenceId === id) ||
      (inv?.transactionId && t.id === inv.transactionId) ||
      t.referenceId === id
    );
    for (const tx of linkedTxs) {
      await transactionRepository.delete(tx.id).catch(() => {});
    }
    // Delete linked asset
    if (inv?.assetId) {
      await assetRepository.delete(inv.assetId).catch(() => {});
    }
    await db.delete('investments', id);
  }
};

// ============================================================================
// ASSETS REPOSITORY
// ============================================================================
export const assetRepository = {
  async getAll(): Promise<Asset[]> {
    const db = await getDatabase();
    return db.getAll('assets');
  },

  async create(data: Omit<Asset, 'id' | 'nilaiTotal'> & { id?: string; nilaiTotal?: number }): Promise<Asset> {
    const db = await getDatabase();
    const all = await db.getAll('assets');
    let maxNum = 0;
    for (const a of all) {
      const match = a.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const newId = data.id || `AST-${String(maxNum + 1).padStart(3, '0')}`;
    const nilaiTotal = data.nilaiTotal !== undefined ? data.nilaiTotal : data.harga * data.jumlah;
    const now = new Date().toISOString();

    const asset: Asset = {
      ...data,
      id: newId,
      nilaiTotal,
      createdAt: now,
      updatedAt: now
    };

    await db.put('assets', asset);
    return asset;
  },

  async update(id: string, updates: Partial<Asset>): Promise<Asset> {
    const db = await getDatabase();
    const current = await db.get('assets', id);
    if (!current) throw new Error('Aset tidak ditemukan');

    const harga = updates.harga ?? current.harga;
    const jumlah = updates.jumlah ?? current.jumlah;
    const nilaiTotal = updates.nilaiTotal ?? (harga * jumlah);

    const updated: Asset = {
      ...current,
      ...updates,
      nilaiTotal,
      updatedAt: new Date().toISOString()
    };

    await db.put('assets', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('assets', id);
  }
};

// ============================================================================
// INVENTORY & STOCK MOVEMENTS REPOSITORY
// ============================================================================
export const inventoryRepository = {
  async getAllItems(): Promise<InventoryItem[]> {
    const db = await getDatabase();
    return db.getAll('inventoryItems');
  },

  async getItemById(id: string): Promise<InventoryItem | undefined> {
    const db = await getDatabase();
    return db.get('inventoryItems', id);
  },

  async createItem(data: Omit<InventoryItem, 'id' | 'stokSaatIni' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<InventoryItem> {
    const db = await getDatabase();
    const all = await db.getAll('inventoryItems');
    let maxNum = 0;
    for (const it of all) {
      const match = it.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const newId = data.id || `STK-${String(maxNum + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const stokSaatIni = (data.stokAwal || 0) + (data.stokMasuk || 0) - (data.stokKeluar || 0);

    const item: InventoryItem = {
      ...data,
      id: newId,
      stokAwal: data.stokAwal || 0,
      stokMasuk: data.stokMasuk || 0,
      stokKeluar: data.stokKeluar || 0,
      stokSaatIni,
      createdAt: now,
      updatedAt: now
    };

    await db.put('inventoryItems', item);
    return item;
  },

  async getAllMovements(): Promise<StockMovement[]> {
    const db = await getDatabase();
    const list = await db.getAll('stockMovements');
    return list.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  },

  async createMovement(data: Omit<StockMovement, 'id' | 'totalNilai' | 'createdAt'> & { id?: string }): Promise<StockMovement> {
    const db = await getDatabase();
    const all = await db.getAll('stockMovements');
    let maxNum = 0;
    for (const mvItem of all) {
      const match = mvItem.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const newId = data.id || `MV-${String(maxNum + 1).padStart(4, '0')}`;
    const now = new Date().toISOString();
    const totalNilai = data.jumlah * data.hargaSatuan;

    const mv: StockMovement = {
      ...data,
      id: newId,
      totalNilai,
      createdAt: now
    };

    await db.put('stockMovements', mv);

    // Update item stock
    const item = await db.get('inventoryItems', data.itemId);
    if (item) {
      if (data.jenis === 'Masuk') {
        item.stokMasuk += data.jumlah;
        item.stokSaatIni = item.stokAwal + item.stokMasuk - item.stokKeluar;
      } else if (data.jenis === 'Keluar') {
        item.stokKeluar += data.jumlah;
        item.stokSaatIni = item.stokAwal + item.stokMasuk - item.stokKeluar;
      } else if (data.jenis === 'Penyesuaian') {
        item.stokSaatIni = data.jumlah;
      }
      item.updatedAt = now;
      await db.put('inventoryItems', item);
    }

    return mv;
  }
};

// ============================================================================
// DEBTS & RECEIVABLES REPOSITORY
// ============================================================================
export const debtRepository = {
  async getAll(jenis?: 'hutang' | 'piutang'): Promise<Debt[]> {
    const db = await getDatabase();
    const list = await db.getAll('debts');
    if (jenis) {
      return list.filter(d => d.jenis === jenis);
    }
    return list.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  },

  async create(data: Omit<Debt, 'id' | 'dibayar' | 'sisa' | 'status' | 'riwayatPembayaran' | 'createdAt' | 'updatedAt'> & { id?: string; dibayarAwal?: number }): Promise<Debt> {
    const db = await getDatabase();
    const all = await db.getAll('debts');
    let maxNum = 0;
    for (const d of all) {
      const match = d.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const newId = data.id || `DBT-${String(maxNum + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const dibayar = data.dibayarAwal || 0;
    const sisa = Math.max(0, data.nominal - dibayar);
    const status = sisa === 0 ? 'Lunas' : dibayar > 0 ? 'Sebagian' : 'Belum Lunas';

    // Cari nomor pembayaran tertinggi di seluruh hutang/piutang untuk ID unik global
    let maxPmtNum = 0;
    for (const d of all) {
      for (const p of d.riwayatPembayaran || []) {
        const num = parseInt(p.id?.replace('PMT-', '') || '0', 10);
        if (!isNaN(num) && num > maxPmtNum) {
          maxPmtNum = num;
        }
      }
    }
    const paymentId = `PMT-${String(maxPmtNum + 1).padStart(3, '0')}`;
    let transactionId: string | undefined = undefined;

    // Catat transaksi kas jika ada pembayaran awal
    if (dibayar > 0) {
      if (data.jenis === 'hutang') {
        const tx = await transactionRepository.create({
          tanggal: data.tanggal,
          jenis: 'pengeluaran',
          kelompokTransaksi: 'operasional',
          kategori: 'Pelunasan Hutang',
          subkategori: data.kontak,
          nominal: dibayar,
          metodePembayaran: 'Transfer Bank',
          tunnel: 'Umum / Fasilitas',
          catatan: `Pembayaran awal hutang ke ${data.kontak} (${data.kategori})`,
          referenceType: 'debtPayment',
          referenceId: paymentId
        });
        transactionId = tx.id;
      } else {
        const tx = await transactionRepository.create({
          tanggal: data.tanggal,
          jenis: 'pemasukan',
          kelompokTransaksi: 'lainnya',
          kategori: 'Penerimaan Piutang',
          subkategori: data.kontak,
          nominal: dibayar,
          metodePembayaran: 'Transfer Bank',
          tunnel: 'Umum / Fasilitas',
          catatan: `Penerimaan awal piutang dari ${data.kontak}`,
          referenceType: 'debtPayment',
          referenceId: paymentId
        });
        transactionId = tx.id;
      }
    }

    const debt: Debt = {
      ...data,
      id: newId,
      dibayar,
      sisa,
      status,
      riwayatPembayaran: dibayar > 0 ? [{
        id: paymentId,
        tanggal: data.tanggal,
        nominal: dibayar,
        metodePembayaran: 'Transfer Bank',
        catatan: 'Pembayaran awal',
        transactionId,
        createdAt: now
      }] : [],
      createdAt: now,
      updatedAt: now
    };

    await db.put('debts', debt);
    return debt;
  },

  async recordPayment(debtId: string, payment: { nominal: number; tanggal: string; metodePembayaran: any; catatan?: string }): Promise<Debt> {
    const db = await getDatabase();
    const debt = await db.get('debts', debtId);
    if (!debt) throw new Error('Data hutang/piutang tidak ditemukan');

    // Validasi nominal pembayaran
    if (!payment.nominal || payment.nominal <= 0) {
      throw new Error('Nominal pembayaran harus lebih besar dari Rp 0');
    }

    if (payment.nominal > debt.sisa) {
      throw new Error('Nominal pembayaran melebihi sisa.');
    }

    const now = new Date().toISOString();
    const all = await db.getAll('debts');
    let maxPmtNum = 0;
    for (const d of all) {
      for (const p of d.riwayatPembayaran || []) {
        const num = parseInt(p.id?.replace('PMT-', '') || '0', 10);
        if (!isNaN(num) && num > maxPmtNum) {
          maxPmtNum = num;
        }
      }
    }
    const paymentId = `PMT-${String(maxPmtNum + 1).padStart(3, '0')}`;

    // Auto record cash transaction for payment with referenceType: 'debtPayment' and referenceId: paymentId
    let transactionId: string | undefined = undefined;
    if (debt.jenis === 'hutang') {
      const tx = await transactionRepository.create({
        tanggal: payment.tanggal,
        jenis: 'pengeluaran',
        kelompokTransaksi: 'operasional',
        kategori: 'Pelunasan Hutang',
        subkategori: debt.kontak,
        nominal: payment.nominal,
        metodePembayaran: payment.metodePembayaran,
        tunnel: 'Umum / Fasilitas',
        catatan: `Bayar hutang ke ${debt.kontak} (${debt.kategori})`,
        referenceType: 'debtPayment',
        referenceId: paymentId
      });
      transactionId = tx.id;
    } else {
      const tx = await transactionRepository.create({
        tanggal: payment.tanggal,
        jenis: 'pemasukan',
        kelompokTransaksi: 'lainnya',
        kategori: 'Penerimaan Piutang',
        subkategori: debt.kontak,
        nominal: payment.nominal,
        metodePembayaran: payment.metodePembayaran,
        tunnel: 'Umum / Fasilitas',
        catatan: `Terima pelunasan piutang dari ${debt.kontak}`,
        referenceType: 'debtPayment',
        referenceId: paymentId
      });
      transactionId = tx.id;
    }

    const paymentRecord: DebtPayment = {
      id: paymentId,
      tanggal: payment.tanggal,
      nominal: payment.nominal,
      metodePembayaran: payment.metodePembayaran,
      catatan: payment.catatan,
      transactionId,
      createdAt: now
    };

    debt.riwayatPembayaran.push(paymentRecord);
    debt.dibayar += payment.nominal;
    debt.sisa = Math.max(0, debt.nominal - debt.dibayar);
    debt.status = debt.sisa === 0 ? 'Lunas' : 'Sebagian';
    debt.updatedAt = now;

    await db.put('debts', debt);
    return debt;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    const debt = await db.get('debts', id);
    const paymentIds = new Set(debt?.riwayatPembayaran?.map(p => p.id) || []);
    const paymentTxIds = new Set(debt?.riwayatPembayaran?.map(p => p.transactionId).filter(Boolean) || []);

    const allTx = await transactionRepository.getAll();
    const linkedTxs = allTx.filter(t => 
      (t.referenceType === 'debtPayment' && paymentIds.has(t.referenceId || '')) ||
      paymentTxIds.has(t.id) ||
      paymentIds.has(t.referenceId || '') ||
      t.referenceId === id
    );
    for (const tx of linkedTxs) {
      await transactionRepository.delete(tx.id).catch(() => {});
    }
    await db.delete('debts', id);
  }
};

// ============================================================================
// DASHBOARD & FINANCIAL ANALYTICS SERVICE (100% Client-Side)
// ============================================================================
export const dashboardService = {
  async getMetrics(filters?: { tunnel?: string; cycleId?: string; year?: number; month?: number }): Promise<{
    metrics: DashboardMetrics;
    cashFlow: { month: string; pemasukan: number; pengeluaran: number; netCashFlow: number }[];
    expenseBreakdown: { category: string; amount: number; percentage: number }[];
    cycleDetails: CycleFinancialDetail[];
  }> {
    const settings = await settingsRepository.get();
    let transactions = await transactionRepository.getAll();
    let harvests = await harvestRepository.getAll();
    let investments = await investmentRepository.getAll();
    const assets = await assetRepository.getAll();
    const debts = await debtRepository.getAll();
    const cycles = await cycleRepository.getAll();

    // Filters
    if (filters?.tunnel && filters.tunnel !== 'Semua Tunnel') {
      transactions = transactions.filter(t => t.tunnel === filters.tunnel || t.tunnel === 'Kedua Tunnel' || t.tunnel === 'Umum / Fasilitas');
      harvests = harvests.filter(h => h.tunnel === filters.tunnel || h.tunnel === 'Kedua Tunnel');
      investments = investments.filter(i => i.tunnel === filters.tunnel || i.tunnel === 'Kedua Tunnel' || i.tunnel === 'Umum / Fasilitas');
    }

    if (filters?.cycleId && filters.cycleId !== 'Semua Siklus') {
      transactions = transactions.filter(t => t.cycleId === filters.cycleId);
      harvests = harvests.filter(h => h.cycleId === filters.cycleId);
    }

    if (filters?.year) {
      transactions = transactions.filter(t => new Date(t.tanggal).getFullYear() === filters.year);
      harvests = harvests.filter(h => new Date(h.tanggal).getFullYear() === filters.year);
    }

    if (filters?.month !== undefined && filters?.month !== null) {
      transactions = transactions.filter(t => new Date(t.tanggal).getMonth() === filters.month);
      harvests = harvests.filter(h => new Date(h.tanggal).getMonth() === filters.month);
    }

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let totalBiayaProduksi = 0;
    let totalBiayaOperasional = 0;

    for (const tx of transactions) {
      if (tx.jenis === 'pemasukan') {
        totalPemasukan += tx.nominal;
      } else if (tx.jenis === 'pengeluaran') {
        totalPengeluaran += tx.nominal;
        if (tx.kelompokTransaksi === 'produksi') {
          totalBiayaProduksi += tx.nominal;
        } else if (tx.kelompokTransaksi === 'operasional') {
          totalBiayaOperasional += tx.nominal;
        }
      }
    }

    // Saldo kas = Saldo Awal + Total Uang Masuk Kas - Total Uang Keluar Kas (Arus Kas Aktual)
    const saldoAwal = settings.saldoAwalKas || 0;
    const saldoKas = saldoAwal + totalPemasukan - totalPengeluaran;

    // OMZET: Nilai penjualan aktual (totalKg * harga rata-rata dari panen + penjualan manual independen)
    const harvestOmzet = harvests.reduce((sum, h) => sum + h.totalNominal, 0);
    const manualSalesOmzet = transactions
      .filter(t => t.jenis === 'pemasukan' && t.kelompokTransaksi === 'penjualan' && !t.referenceId && t.referenceType !== 'harvest' && t.referenceType !== 'debtPayment')
      .reduce((sum, t) => sum + t.nominal, 0);
    const totalOmzet = harvestOmzet + manualSalesOmzet;

    // Total Investasi (terpisah dari HPP/operasional siklus)
    const totalInvestasi = investments.reduce((sum, i) => sum + i.nominal, 0);

    // Total Hasil Panen (Kg)
    const totalPanenKg = harvests.reduce((sum, h) => sum + h.totalKg, 0);

    // HPP Rata-rata/kg = Biaya Produksi / Total Kg Panen
    const hppRataRataPerKg = totalPanenKg > 0 ? Math.round(totalBiayaProduksi / totalPanenKg) : 0;

    // Laba Kotor = Omzet - Biaya Produksi
    const labaKotor = totalOmzet - totalBiayaProduksi;

    // Laba Bersih = Laba Kotor - Biaya Operasional
    const labaBersih = labaKotor - totalBiayaOperasional;

    // Modal Belum Kembali = Total Investasi - Akumulasi Laba Bersih yang Dialokasikan
    const modalKembali = Math.min(totalInvestasi, Math.max(0, labaBersih));
    const modalBelumKembali = Math.max(0, totalInvestasi - modalKembali);

    // ROI Sederhana (%) = (Akumulasi Laba Bersih / Total Investasi) * 100%
    const roiSederhanaPersen = totalInvestasi > 0 ? Number(((labaBersih / totalInvestasi) * 100).toFixed(2)) : 0;

    const totalAsetNilai = assets.reduce((sum, a) => sum + a.nilaiTotal, 0);
    const totalHutang = debts.filter(d => d.jenis === 'hutang').reduce((sum, d) => sum + d.sisa, 0);

    // Total Piutang: Nilai penjualan panen yang belum terbayar + sisa piutang di buku hutang/piutang
    const piutangPanen = harvests.reduce((sum, h) => sum + Math.max(0, h.totalNominal - (h.dibayar || 0)), 0);
    const piutangDebts = debts.filter(d => d.jenis === 'piutang').reduce((sum, d) => sum + d.sisa, 0);
    const totalPiutang = piutangPanen + piutangDebts;

    // Plant population stats
    let totalTanamanAktif = 0;
    let totalTanamanMati = 0;
    let targetPanenKg = 0;
    for (const c of cycles) {
      totalTanamanAktif += c.tanamanHidup || c.jumlahTanaman;
      totalTanamanMati += c.tanamanMati || 0;
      targetPanenKg += c.targetHasilKg || c.jumlahTanaman;
    }
    const persenTargetPanen = targetPanenKg > 0 ? Number(((totalPanenKg / targetPanenKg) * 100).toFixed(1)) : 0;

    // Cash flow by month
    const targetYear = filters?.year || new Date().getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyMap: { [key: number]: { p: number; q: number } } = {};
    for (let m = 0; m < 12; m++) monthlyMap[m] = { p: 0, q: 0 };

    for (const tx of transactions) {
      const d = new Date(tx.tanggal);
      if (d.getFullYear() === targetYear) {
        const m = d.getMonth();
        if (tx.jenis === 'pemasukan') monthlyMap[m].p += tx.nominal;
        else monthlyMap[m].q += tx.nominal;
      }
    }

    const cashFlow = monthNames.map((name, idx) => ({
      month: name,
      pemasukan: monthlyMap[idx].p,
      pengeluaran: monthlyMap[idx].q,
      netCashFlow: monthlyMap[idx].p - monthlyMap[idx].q
    }));

    // Expense breakdown by category
    const catMap: { [key: string]: number } = {};
    let totalExp = 0;
    for (const tx of transactions.filter(t => t.jenis === 'pengeluaran')) {
      catMap[tx.kategori] = (catMap[tx.kategori] || 0) + tx.nominal;
      totalExp += tx.nominal;
    }

    const expenseBreakdown = Object.entries(catMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExp > 0 ? Number(((amount / totalExp) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Cycle details
    const cycleDetails = await reportService.getAllCyclesFinancial();

    return {
      metrics: {
        saldoKas,
        saldoAwal,
        totalPemasukan,
        totalPengeluaran,
        totalOmzet,
        totalBiayaProduksi,
        totalBiayaOperasional,
        totalInvestasi,
        labaKotor,
        labaBersih,
        totalPanenKg,
        hppRataRataPerKg,
        modalKembali,
        modalBelumKembali,
        roiSederhanaPersen,
        totalAsetNilai,
        totalHutang,
        totalPiutang,
        totalTanamanAktif,
        totalTanamanMati,
        targetPanenKg,
        persenTargetPanen
      },
      cashFlow,
      expenseBreakdown,
      cycleDetails
    };
  }
};

// ============================================================================
// REPORT SERVICE
// ============================================================================
export const reportService = {
  async getCycleFinancialDetail(cycleId: string): Promise<CycleFinancialDetail | null> {
    const cycle = await cycleRepository.getById(cycleId);
    if (!cycle) return null;

    const allTx = (await transactionRepository.getAll()).filter(t => t.cycleId === cycleId);
    const harvests = await harvestRepository.getAll(cycleId);

    let biayaBenih = 0;
    let biayaNutrisi = 0;
    let biayaPestisida = 0;
    let biayaMedia = 0;
    let biayaListrikAir = 0;
    let biayaTenagaKerja = 0;
    let biayaKemasan = 0;
    let biayaLainnya = 0;
    let totalBiayaOperasional = 0;
    let modalSiklus = 0;

    for (const tx of allTx) {
      if (tx.jenis === 'pengeluaran') {
        const cat = (tx.kategori || '').toLowerCase();
        if (tx.kelompokTransaksi === 'produksi') {
          if (cat.includes('benih')) biayaBenih += tx.nominal;
          else if (cat.includes('ab mix') || cat.includes('nutrisi')) biayaNutrisi += tx.nominal;
          else if (cat.includes('pestisida') || cat.includes('fungisida') || cat.includes('insektisida')) biayaPestisida += tx.nominal;
          else if (cat.includes('media')) biayaMedia += tx.nominal;
          else if (cat.includes('tenaga') || cat.includes('upah')) biayaTenagaKerja += tx.nominal;
          else if (cat.includes('kemasan') || cat.includes('box')) biayaKemasan += tx.nominal;
          else if (cat.includes('listrik') || cat.includes('air')) biayaListrikAir += tx.nominal;
          else biayaLainnya += tx.nominal;
        } else if (tx.kelompokTransaksi === 'operasional') {
          totalBiayaOperasional += tx.nominal;
        }
      } else if (tx.jenis === 'pemasukan' && tx.kelompokTransaksi === 'modal') {
        modalSiklus += tx.nominal;
      }
    }

    const totalBiayaProduksi = biayaBenih + biayaNutrisi + biayaPestisida + biayaMedia + biayaListrikAir + biayaTenagaKerja + biayaKemasan + biayaLainnya;

    let totalPanenKg = 0;
    let panenGradeA = 0;
    let panenGradeB = 0;
    let panenGradeC = 0;
    let totalHarvestRevenue = 0;

    for (const h of harvests) {
      totalPanenKg += h.totalKg;
      panenGradeA += h.gradeA;
      panenGradeB += h.gradeB;
      panenGradeC += h.gradeC;
      totalHarvestRevenue += h.totalNominal;
    }

    // Omzet from actual sales (total harvest revenue + independent manual sales for this cycle)
    const manualSalesTx = allTx.filter(t => 
      t.jenis === 'pemasukan' && 
      t.kelompokTransaksi === 'penjualan' && 
      !t.referenceId && 
      t.referenceType !== 'harvest' && 
      t.referenceType !== 'debtPayment'
    );
    const omzet = totalHarvestRevenue + manualSalesTx.reduce((s, t) => s + t.nominal, 0);

    const hargaJualRataRata = totalPanenKg > 0 ? Math.round(omzet / totalPanenKg) : 0;
    const hppPerTanaman = cycle.jumlahTanaman > 0 ? Math.round(totalBiayaProduksi / cycle.jumlahTanaman) : 0;
    const hppPerKg = totalPanenKg > 0 ? Math.round(totalBiayaProduksi / totalPanenKg) : 0;
    const labaKotor = omzet - totalBiayaProduksi;
    const labaBersih = labaKotor - totalBiayaOperasional;

    const survivalRate = cycle.jumlahTanaman > 0
      ? Number(((cycle.tanamanHidup / cycle.jumlahTanaman) * 100).toFixed(1))
      : 0;

    const targetHasilKg = cycle.targetHasilKg || cycle.jumlahTanaman;
    const pencapaianKgPersen = targetHasilKg > 0
      ? Number(((totalPanenKg / targetHasilKg) * 100).toFixed(1))
      : 0;

    return {
      cycle,
      modalSiklus,
      biayaBenih,
      biayaNutrisi,
      biayaPestisida,
      biayaMedia,
      biayaListrikAir,
      biayaTenagaKerja,
      biayaKemasan,
      biayaLainnya,
      totalBiayaProduksi,
      totalBiayaOperasional,
      totalPanenKg,
      panenGradeA,
      panenGradeB,
      panenGradeC,
      omzet,
      hppPerTanaman,
      hppPerKg,
      labaKotor,
      labaBersih,
      hargaJualRataRata,
      survivalRate,
      targetHasilKg,
      pencapaianKgPersen
    };
  },

  async getAllCyclesFinancial(): Promise<CycleFinancialDetail[]> {
    const cycles = await cycleRepository.getAll();
    const list: CycleFinancialDetail[] = [];
    for (const c of cycles) {
      const detail = await this.getCycleFinancialDetail(c.id);
      if (detail) list.push(detail);
    }
    return list;
  }
};

// ============================================================================
// BACKUP, RESTORE & CSV EXPORT SERVICE (100% Client-Side)
// ============================================================================
export const backupService = {
  async exportJSON(): Promise<void> {
    const db = await getDatabase();
    const backup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      settings: await settingsRepository.get(),
      greenhouses: await db.getAll('greenhouses'),
      greenhouseTunnels: await db.getAll('greenhouseTunnels'),
      cycles: await db.getAll('cycles'),
      investments: await db.getAll('investments'),
      assets: await db.getAll('assets'),
      harvests: await db.getAll('harvests'),
      transactions: await db.getAll('transactions'),
      inventoryItems: await db.getAll('inventoryItems'),
      stockMovements: await db.getAll('stockMovements'),
      debts: await db.getAll('debts')
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greenhouse-finance-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async restoreJSON(jsonContent: any): Promise<{ success: boolean; count: number }> {
    // 1 & 2. Validasi format awal: harus berupa objek (bukan array / null)
    if (!jsonContent || typeof jsonContent !== 'object' || Array.isArray(jsonContent)) {
      throw new Error('Format file backup tidak valid: File harus berupa berkas JSON objek.');
    }

    // 3. Validasi kelengkapan struktur field utama sebelum menyentuh database
    const requiredFields = [
      'version',
      'exportedAt',
      'settings',
      'cycles',
      'investments',
      'assets',
      'harvests',
      'transactions',
      'inventoryItems',
      'stockMovements',
      'debts'
    ];

    for (const field of requiredFields) {
      if (!(field in jsonContent)) {
        throw new Error(`Struktur file backup tidak lengkap: Properti '${field}' tidak ditemukan.`);
      }
    }

    // 4. Validasi tipe data masing-masing komponen
    if (typeof jsonContent.settings !== 'object' || jsonContent.settings === null || Array.isArray(jsonContent.settings)) {
      throw new Error("Struktur data 'settings' dalam file backup tidak valid.");
    }

    const arrayFields = [
      'cycles',
      'investments',
      'assets',
      'harvests',
      'transactions',
      'inventoryItems',
      'stockMovements',
      'debts'
    ];

    for (const field of arrayFields) {
      if (!Array.isArray(jsonContent[field])) {
        throw new Error(`Struktur data '${field}' dalam file backup tidak valid (harus berupa array).`);
      }
    }

    // Validasi greenhouses & greenhouseTunnels jika ada
    if (jsonContent.greenhouses && !Array.isArray(jsonContent.greenhouses)) {
      throw new Error("Struktur data 'greenhouses' dalam file backup tidak valid (harus berupa array).");
    }
    if (jsonContent.greenhouseTunnels && !Array.isArray(jsonContent.greenhouseTunnels)) {
      throw new Error("Struktur data 'greenhouseTunnels' dalam file backup tidak valid (harus berupa array).");
    }

    // 5. Baru mulai transaction IndexedDB setelah validasi langkah 1-4 lolos 100%
    const db = await getDatabase();
    const tx = db.transaction(
      ['settings', 'cycles', 'investments', 'assets', 'harvests', 'transactions', 'inventoryItems', 'stockMovements', 'debts', 'greenhouses', 'greenhouseTunnels', 'appMeta'],
      'readwrite'
    );

    // 6. Clear data lama
    await tx.objectStore('settings').clear();
    await tx.objectStore('cycles').clear();
    await tx.objectStore('investments').clear();
    await tx.objectStore('assets').clear();
    await tx.objectStore('harvests').clear();
    await tx.objectStore('transactions').clear();
    await tx.objectStore('inventoryItems').clear();
    await tx.objectStore('stockMovements').clear();
    await tx.objectStore('debts').clear();
    await tx.objectStore('greenhouses').clear();
    await tx.objectStore('greenhouseTunnels').clear();

    // 7. Insert data backup
    let totalRestored = 0;

    await tx.objectStore('settings').put(jsonContent.settings, 'current');

    // Restore or fallback greenhouses
    if (Array.isArray(jsonContent.greenhouses) && jsonContent.greenhouses.length > 0) {
      for (const gh of jsonContent.greenhouses) {
        await tx.objectStore('greenhouses').put(gh);
        totalRestored++;
      }
    } else {
      for (const gh of DEMO_GREENHOUSES) {
        await tx.objectStore('greenhouses').put(gh);
      }
    }

    // Restore or fallback tunnels
    if (Array.isArray(jsonContent.greenhouseTunnels) && jsonContent.greenhouseTunnels.length > 0) {
      for (const tnl of jsonContent.greenhouseTunnels) {
        await tx.objectStore('greenhouseTunnels').put(tnl);
        totalRestored++;
      }
    } else {
      for (const tnl of DEMO_TUNNELS) {
        await tx.objectStore('greenhouseTunnels').put(tnl);
      }
    }

    for (const c of jsonContent.cycles) {
      await tx.objectStore('cycles').put(c);
      totalRestored++;
    }

    for (const inv of jsonContent.investments) {
      await tx.objectStore('investments').put(inv);
      totalRestored++;
    }

    for (const a of jsonContent.assets) {
      await tx.objectStore('assets').put(a);
      totalRestored++;
    }

    for (const h of jsonContent.harvests) {
      await tx.objectStore('harvests').put(h);
      totalRestored++;
    }

    for (const t of jsonContent.transactions) {
      await tx.objectStore('transactions').put(t);
      totalRestored++;
    }

    for (const i of jsonContent.inventoryItems) {
      await tx.objectStore('inventoryItems').put(i);
      totalRestored++;
    }

    for (const m of jsonContent.stockMovements) {
      await tx.objectStore('stockMovements').put(m);
      totalRestored++;
    }

    for (const d of jsonContent.debts) {
      await tx.objectStore('debts').put(d);
      totalRestored++;
    }

    await tx.objectStore('appMeta').put({
      initialized: true,
      choice: 'restored',
      timestamp: new Date().toISOString()
    }, 'initialized');

    // 8. Commit
    await tx.done;

    return { success: true, count: totalRestored };
  },

  async exportCSV(type: 'transactions' | 'harvests' | 'investments' | 'inventory' | 'debts'): Promise<void> {
    const db = await getDatabase();
    let csv = '';
    const dateStr = new Date().toISOString().split('T')[0];

    if (type === 'transactions') {
      const list = await db.getAll('transactions');
      csv = 'ID,Tanggal,Jenis,Kelompok,Kategori,Subkategori,Nominal,Metode,Siklus,Tunnel,Catatan\n';
      list.forEach(t => {
        csv += `"${t.id}","${t.tanggal}","${t.jenis}","${t.kelompokTransaksi}","${t.kategori}","${t.subkategori || ''}","${t.nominal}","${t.metodePembayaran}","${t.cycleId || ''}","${t.tunnel}","${(t.catatan || '').replace(/"/g, '""')}"\n`;
      });
    } else if (type === 'harvests') {
      const list = await db.getAll('harvests');
      csv = 'ID,Tanggal,Siklus,Tunnel,Total Kg,Grade A,Grade B,Grade C,Harga Rata2,Total Rp,Pembeli,Status Bayar\n';
      list.forEach(h => {
        csv += `"${h.id}","${h.tanggal}","${h.cycleId}","${h.tunnel}","${h.totalKg}","${h.gradeA}","${h.gradeB}","${h.gradeC}","${h.hargaRataRata}","${h.totalNominal}","${h.pembeli}","${h.statusPembayaran}"\n`;
      });
    } else if (type === 'investments') {
      const list = await db.getAll('investments');
      csv = 'ID,Tanggal,Kategori,Komponen,Nominal,Tunnel,Vendor,Metode,Catatan\n';
      list.forEach(i => {
        csv += `"${i.id}","${i.tanggal}","${i.kategori}","${i.namaItem}","${i.nominal}","${i.tunnel}","${i.vendor || ''}","${i.metodePembayaran}","${(i.catatan || '').replace(/"/g, '""')}"\n`;
      });
    } else if (type === 'inventory') {
      const list = await db.getAll('inventoryItems');
      csv = 'ID,Nama Barang,Kategori,Satuan,Stok Awal,Masuk,Keluar,Stok Saat Ini,Min Stok,Harga Rata2\n';
      list.forEach(i => {
        csv += `"${i.id}","${i.namaBarang}","${i.kategori}","${i.satuan}","${i.stokAwal}","${i.stokMasuk}","${i.stokKeluar}","${i.stokSaatIni}","${i.minimumStok}","${i.hargaRataRata}"\n`;
      });
    } else if (type === 'debts') {
      const list = await db.getAll('debts');
      csv = 'ID,Tanggal,Kontak,Jenis,Nominal Total,Dibayar,Sisa,Jatuh Tempo,Status,Kategori,Keterangan\n';
      list.forEach(d => {
        csv += `"${d.id}","${d.tanggal}","${d.kontak}","${d.jenis}","${d.nominal}","${d.dibayar}","${d.sisa}","${d.jatuhTempo}","${d.status}","${d.kategori}","${(d.keterangan || '').replace(/"/g, '""')}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-greenhouse-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async resetToDemo(): Promise<void> {
    await seedDemoData();
  },

  async resetToEmpty(): Promise<void> {
    await seedEmptyData();
  }
};

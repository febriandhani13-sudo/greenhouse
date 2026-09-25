import { openDB, DBSchema, IDBPDatabase } from 'idb';
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
  Greenhouse,
  GreenhouseTunnel
} from '../types/index.js';
import {
  DEFAULT_SETTINGS,
  DEMO_TRANSACTIONS,
  DEMO_CYCLES,
  DEMO_HARVESTS,
  DEMO_INVESTMENTS,
  DEMO_ASSETS,
  DEMO_INVENTORY,
  DEMO_STOCK_MOVEMENTS,
  DEMO_DEBTS,
  DEMO_GREENHOUSES,
  DEMO_TUNNELS
} from './demoData.js';

const DB_NAME = 'GreenhouseFinanceProDB';
const DB_VERSION = 2;

export interface GreenhouseDB extends DBSchema {
  settings: {
    key: string;
    value: AppSettings;
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-date': string;
      'by-cycle': string;
      'by-tunnel': string;
    };
  };
  cycles: {
    key: string;
    value: Cycle;
  };
  harvests: {
    key: string;
    value: Harvest;
    indexes: {
      'by-cycle': string;
    };
  };
  investments: {
    key: string;
    value: Investment;
  };
  assets: {
    key: string;
    value: Asset;
  };
  inventoryItems: {
    key: string;
    value: InventoryItem;
  };
  stockMovements: {
    key: string;
    value: StockMovement;
    indexes: {
      'by-item': string;
    };
  };
  debts: {
    key: string;
    value: Debt;
  };
  greenhouses: {
    key: string;
    value: Greenhouse;
    indexes: {
      'by-status': string;
    };
  };
  greenhouseTunnels: {
    key: string;
    value: GreenhouseTunnel;
    indexes: {
      'by-greenhouse': string;
      'by-status': string;
    };
  };
  appMeta: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<GreenhouseDB>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<GreenhouseDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GreenhouseDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // 1. Settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }

        // 2. Transactions
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-date', 'tanggal');
          txStore.createIndex('by-cycle', 'cycleId');
          txStore.createIndex('by-tunnel', 'tunnel');
        }

        // 3. Cycles
        if (!db.objectStoreNames.contains('cycles')) {
          db.createObjectStore('cycles', { keyPath: 'id' });
        }

        // 4. Harvests
        if (!db.objectStoreNames.contains('harvests')) {
          const hrvStore = db.createObjectStore('harvests', { keyPath: 'id' });
          hrvStore.createIndex('by-cycle', 'cycleId');
        }

        // 5. Investments
        if (!db.objectStoreNames.contains('investments')) {
          db.createObjectStore('investments', { keyPath: 'id' });
        }

        // 6. Assets
        if (!db.objectStoreNames.contains('assets')) {
          db.createObjectStore('assets', { keyPath: 'id' });
        }

        // 7. Inventory Items
        if (!db.objectStoreNames.contains('inventoryItems')) {
          db.createObjectStore('inventoryItems', { keyPath: 'id' });
        }

        // 8. Stock Movements
        if (!db.objectStoreNames.contains('stockMovements')) {
          const mvStore = db.createObjectStore('stockMovements', { keyPath: 'id' });
          mvStore.createIndex('by-item', 'itemId');
        }

        // 9. Debts
        if (!db.objectStoreNames.contains('debts')) {
          db.createObjectStore('debts', { keyPath: 'id' });
        }

        // 10. Greenhouses (v2 migration)
        if (!db.objectStoreNames.contains('greenhouses')) {
          const ghStore = db.createObjectStore('greenhouses', { keyPath: 'id' });
          ghStore.createIndex('by-status', 'status');
        }

        // 11. Greenhouse Tunnels (v2 migration)
        if (!db.objectStoreNames.contains('greenhouseTunnels')) {
          const tnlStore = db.createObjectStore('greenhouseTunnels', { keyPath: 'id' });
          tnlStore.createIndex('by-greenhouse', 'greenhouseId');
          tnlStore.createIndex('by-status', 'status');
        }

        // 12. App Meta
        if (!db.objectStoreNames.contains('appMeta')) {
          db.createObjectStore('appMeta');
        }
      }
    });
  }
  return dbPromise;
}

/**
 * Checks if the database has already been initialized with a choice (demo or empty).
 * Also performs seamless data migration for existing v1 users to ensure default greenhouse exists.
 */
export async function checkDatabaseInitialization(): Promise<{
  isInitialized: boolean;
  choice?: 'demo' | 'empty';
}> {
  const db = await getDatabase();
  const initFlag = await db.get('appMeta', 'initialized');

  // IMPORTANT:
  // Do not reseed demo greenhouse data after the user explicitly selected
  // an empty database. Only seed the default greenhouse for legacy databases
  // that predate the initialization flag, or for an explicitly initialized
  // demo database whose greenhouse records are missing.
  const ghCount = await db.count('greenhouses');

  if (!initFlag) {
    // Legacy database migration: older versions may have settings/cycles but
    // no initialization flag and no greenhouse records.
    if (ghCount === 0) {
      const tx = db.transaction(['greenhouses', 'greenhouseTunnels'], 'readwrite');
      for (const gh of DEMO_GREENHOUSES) {
        await tx.objectStore('greenhouses').put(gh);
      }
      for (const tnl of DEMO_TUNNELS) {
        await tx.objectStore('greenhouseTunnels').put(tnl);
      }
      await tx.done;
    }
  } else if (initFlag.choice === 'demo' && ghCount === 0) {
    // A demo database should always retain its default greenhouse records.
    const tx = db.transaction(['greenhouses', 'greenhouseTunnels'], 'readwrite');
    for (const gh of DEMO_GREENHOUSES) {
      await tx.objectStore('greenhouses').put(gh);
    }
    for (const tnl of DEMO_TUNNELS) {
      await tx.objectStore('greenhouseTunnels').put(tnl);
    }
    await tx.done;
  }

  if (initFlag) {
    return {
      isInitialized: true,
      choice: initFlag.choice
    };
  }

  // Also check if any settings or cycles exist
  const existingSettings = await db.get('settings', 'current');
  const countCycles = await db.count('cycles');
  if (existingSettings || countCycles > 0) {
    return { isInitialized: true, choice: 'demo' };
  }

  return { isInitialized: false };
}

/**
 * Initializes database with demo benchmark data.
 */
export async function seedDemoData(): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction(
    ['settings', 'cycles', 'investments', 'assets', 'harvests', 'transactions', 'inventoryItems', 'stockMovements', 'debts', 'greenhouses', 'greenhouseTunnels', 'appMeta'],
    'readwrite'
  );

  // Clear existing
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

  // Populate
  await tx.objectStore('settings').put({ ...DEFAULT_SETTINGS, dbInitialized: true, dbInitialChoice: 'demo' }, 'current');

  for (const gh of DEMO_GREENHOUSES) await tx.objectStore('greenhouses').put(gh);
  for (const tnl of DEMO_TUNNELS) await tx.objectStore('greenhouseTunnels').put(tnl);
  for (const c of DEMO_CYCLES) await tx.objectStore('cycles').put(c);
  for (const inv of DEMO_INVESTMENTS) await tx.objectStore('investments').put(inv);
  for (const a of DEMO_ASSETS) await tx.objectStore('assets').put(a);
  for (const h of DEMO_HARVESTS) await tx.objectStore('harvests').put(h);
  for (const t of DEMO_TRANSACTIONS) await tx.objectStore('transactions').put(t);
  for (const i of DEMO_INVENTORY) await tx.objectStore('inventoryItems').put(i);
  for (const m of DEMO_STOCK_MOVEMENTS) await tx.objectStore('stockMovements').put(m);
  for (const d of DEMO_DEBTS) await tx.objectStore('debts').put(d);

  await tx.objectStore('appMeta').put({
    initialized: true,
    choice: 'demo',
    timestamp: new Date().toISOString()
  }, 'initialized');

  await tx.done;
}

/**
 * Initializes database as clean empty state.
 */
export async function seedEmptyData(): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction(
    ['settings', 'cycles', 'investments', 'assets', 'harvests', 'transactions', 'inventoryItems', 'stockMovements', 'debts', 'greenhouses', 'greenhouseTunnels', 'appMeta'],
    'readwrite'
  );

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

  await tx.objectStore('settings').put({
    ...DEFAULT_SETTINGS,
    saldoAwalKas: 0,
    dbInitialized: true,
    dbInitialChoice: 'empty'
  }, 'current');

  await tx.objectStore('appMeta').put({
    initialized: true,
    choice: 'empty',
    timestamp: new Date().toISOString()
  }, 'initialized');

  await tx.done;
}

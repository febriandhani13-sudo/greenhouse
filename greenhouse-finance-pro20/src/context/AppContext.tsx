import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  settingsRepository,
  cycleRepository,
  backupService
} from '../services/storage.js';
import { checkDatabaseInitialization, seedDemoData, seedEmptyData } from '../db/indexedDB.js';
import { AppSettings, Cycle, Transaction } from '../types/index.js';

export type PageId = 
  | 'dashboard'
  | 'greenhouses'
  | 'transactions'
  | 'cycles'
  | 'harvests'
  | 'investments'
  | 'inventory'
  | 'assets'
  | 'debts'
  | 'reports'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  tunnelFilter: string;
  setTunnelFilter: (tunnel: string) => void;
  cycleFilter: string;
  setCycleFilter: (cycle: string) => void;
  yearFilter: number;
  setYearFilter: (year: number) => void;
  monthFilter: string;
  setMonthFilter: (month: string) => void;
  refreshTrigger: number;
  refreshData: () => void;
  settings: AppSettings | null;
  updateSettingsState: (newSettings: AppSettings) => void;
  cyclesList: Cycle[];
  
  // Quick Transaction Modal
  isTransactionModalOpen: boolean;
  openTransactionModal: (initialData?: Partial<Transaction>) => void;
  closeTransactionModal: () => void;
  transactionModalInitialData: Partial<Transaction> | null;

  // First time launch modal
  isInitModalOpen: boolean;
  handleChooseDemo: () => Promise<void>;
  handleChooseEmpty: () => Promise<void>;
  isInitializing: boolean;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [tunnelFilter, setTunnelFilter] = useState<string>('Semua Tunnel');
  const [cycleFilter, setCycleFilter] = useState<string>('Semua Siklus');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cyclesList, setCyclesList] = useState<Cycle[]>([]);

  // First time initialization state
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Transaction Modal State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalInitialData, setTransactionModalInitialData] = useState<Partial<Transaction> | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const openTransactionModal = useCallback((initialData?: Partial<Transaction>) => {
    setTransactionModalInitialData(initialData || null);
    setIsTransactionModalOpen(true);
  }, []);

  const closeTransactionModal = useCallback(() => {
    setIsTransactionModalOpen(false);
    setTransactionModalInitialData(null);
  }, []);

  const updateSettingsState = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
  }, []);

  // Handle first time launch choices
  const handleChooseDemo = async () => {
    setIsInitializing(true);
    try {
      await seedDemoData();
      setIsInitModalOpen(false);
      showToast('Database berhasil diinisialisasi dengan data demo verified!', 'success');
      refreshData();
    } catch (err: any) {
      showToast('Gagal inisialisasi: ' + err.message, 'error');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleChooseEmpty = async () => {
    setIsInitializing(true);
    try {
      await seedEmptyData();
      setIsInitModalOpen(false);
      showToast('Database bersih siap digunakan!', 'success');
      refreshData();
    } catch (err: any) {
      showToast('Gagal inisialisasi: ' + err.message, 'error');
    } finally {
      setIsInitializing(false);
    }
  };

  // Initial load check
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const { isInitialized } = await checkDatabaseInitialization();
        if (!isMounted) return;

        if (!isInitialized) {
          setIsInitModalOpen(true);
        } else {
          const loadedSettings = await settingsRepository.get();
          const loadedCycles = await cycleRepository.getAll();
          if (!isMounted) return;
          setSettings(loadedSettings);
          setCyclesList(loadedCycles);
        }
      } catch (err) {
        console.error('Database check error:', err);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        tunnelFilter,
        setTunnelFilter,
        cycleFilter,
        setCycleFilter,
        yearFilter,
        setYearFilter,
        monthFilter,
        setMonthFilter,
        refreshTrigger,
        refreshData,
        settings,
        updateSettingsState,
        cyclesList,
        isTransactionModalOpen,
        openTransactionModal,
        closeTransactionModal,
        transactionModalInitialData,
        isInitModalOpen,
        handleChooseDemo,
        handleChooseEmpty,
        isInitializing,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

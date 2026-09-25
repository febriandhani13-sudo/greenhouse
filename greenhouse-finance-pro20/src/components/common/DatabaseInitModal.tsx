import React from 'react';
import { Sparkles, Database, Leaf, ArrowRight } from 'lucide-react';

interface DatabaseInitModalProps {
  isOpen: boolean;
  onChooseDemo: () => Promise<void>;
  onChooseEmpty: () => Promise<void>;
  isProcessing: boolean;
}

export const DatabaseInitModal: React.FC<DatabaseInitModalProps> = ({
  isOpen,
  onChooseDemo,
  onChooseEmpty,
  isProcessing
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-db-init-title"
      >
        <div className="p-6 bg-gradient-to-br from-stone-900 to-emerald-950 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-950/50">
            <Leaf className="w-8 h-8" />
          </div>
          <h2 id="modal-db-init-title" className="text-lg font-extrabold tracking-tight">Selamat Datang di</h2>
          <div className="text-xl font-black text-emerald-400 tracking-wider">GREENHOUSE FINANCE PRO</div>
          <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
            Sistem Manajemen Finansial & Produksi Greenhouse Melon DFT (2-Tunnel 16×48m) Standalone di iPhone Anda.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-xs text-stone-600 text-center leading-relaxed">
            Data Anda akan tersimpan <strong>100% lokal & aman di browser IndexedDB</strong> perangkat ini tanpa server cloud berbayar. Pilih mode awal:
          </div>

          <div className="space-y-3 pt-1">
            {/* Option 1: Demo Benchmark */}
            <button
              onClick={onChooseDemo}
              disabled={isProcessing}
              className="w-full p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-left transition flex items-start gap-3 cursor-pointer group active:scale-[0.99] disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-stone-900 text-sm flex items-center justify-between">
                  <span>Mulai dengan Data Demo</span>
                  <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                  Dilengkapi data contoh terverifikasi: Investasi Rp 100jt, Biaya Siklus 1 Rp 10jt, Panen 1.000 kg, Laba Rp 13jt, dan Siklus 2 aktif.
                </p>
              </div>
            </button>

            {/* Option 2: Empty Database */}
            <button
              onClick={onChooseEmpty}
              disabled={isProcessing}
              className="w-full p-4 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 text-left transition flex items-start gap-3 cursor-pointer group active:scale-[0.99] disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-stone-900 text-sm flex items-center justify-between">
                  <span>Mulai Database Kosong</span>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                  Mulai dari lembaran bersih 0 rupiah untuk kebun greenhouse Anda dari awal.
                </p>
              </div>
            </button>
          </div>

          {isProcessing && (
            <div className="text-center py-2 text-xs font-semibold text-emerald-700 animate-pulse">
              Menyiapkan database lokal IndexedDB...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

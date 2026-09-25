export type TransactionType = 'pemasukan' | 'pengeluaran';
export type IncomeGroup = 'penjualan' | 'modal' | 'pinjaman' | 'lainnya';
export type ExpenseGroup = 'investasi' | 'produksi' | 'operasional' | 'lainnya';
export type TransactionGroup = IncomeGroup | ExpenseGroup;

export type PaymentMethod = 
  | 'Tunai' 
  | 'Transfer Bank' 
  | 'QRIS' 
  | 'E-wallet' 
  | 'Hutang' 
  | 'Piutang' 
  | 'Lainnya';

export type TunnelChoice = 
  | 'Tunnel 1' 
  | 'Tunnel 2' 
  | 'Kedua Tunnel' 
  | 'Umum / Fasilitas';

export type GreenhouseStatus = 'active' | 'maintenance' | 'inactive';
export type TunnelStatus = 'active' | 'maintenance' | 'inactive';

export interface Greenhouse {
  id: string;
  name: string;
  code?: string;
  status: GreenhouseStatus;
  location?: string;
  notes?: string;
  constructionYear?: number;
  lengthM?: number;
  widthM?: number;
  areaM2?: number;
  tunnelCount?: number;
  structureMaterial?: string;
  foundationType?: string;
  sideHeightM?: number;
  centerHeightM?: number;
  poleSpacingM?: number;
  roofBattenSpacingM?: number;
  roofType?: string;
  roofCover?: string;
  wallType?: string;
  insectNet?: boolean;
  cultivationSystem?: string;
  cultivationMedia?: string;
  totalPlantCapacity?: number;
  tankCount?: number;
  tankCapacityL?: number;
  pumpType?: string;
  pumpFlowLMin?: number;
  investmentValue?: number;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GreenhouseTunnel {
  id: string;
  greenhouseId: string;
  name: string;
  code?: string;
  status: TunnelStatus;
  lengthM: number;
  widthM: number;
  areaM2: number;
  plantCapacity?: number;
  rowCount?: number;
  gutterCount?: number;
  gutterLengthM?: number;
  holesPerGutter?: number;
  totalPlantHoles?: number;
  cultivationSystem?: string;
  cultivationMedia?: string;
  tankCount?: number;
  tankCapacityL?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GreenhouseSnapshot {
  greenhouseId: string;
  greenhouseName: string;
  lengthM?: number;
  widthM?: number;
  plantCapacity?: number;
  tunnelId?: string;
  tunnelName?: string;
  tunnelLengthM?: number;
  tunnelWidthM?: number;
  tunnelPlantCapacity?: number;
  cultivationSystem?: string;
  cultivationMedia?: string;
  capturedAt: string;
}

export type CycleStatus = 
  | 'Persiapan' 
  | 'Tanam' 
  | 'Vegetatif' 
  | 'Generatif' 
  | 'Menjelang Panen' 
  | 'Panen' 
  | 'Selesai';

export interface Transaction {
  id: string;
  tanggal: string;
  jenis: TransactionType;
  kelompokTransaksi: TransactionGroup;
  kategori: string;
  subkategori?: string;
  nominal: number;
  metodePembayaran: PaymentMethod;
  cycleId?: string;
  tunnel: TunnelChoice;
  catatan?: string;
  receipt?: string;
  referenceType?: 'harvest' | 'investment' | 'debtPayment';
  referenceId?: string; // harvestId, investmentId, debtPaymentId
  createdAt: string;
  updatedAt: string;
}

export interface Cycle {
  id: string;
  namaSiklus: string;
  varietas: string;
  greenhouseId?: string;
  tunnelId?: string;
  tunnel: 'Tunnel 1' | 'Tunnel 2' | 'Kedua Tunnel' | string;
  tanggalPersiapan: string;
  tanggalTanam: string;
  targetPanen: string;
  tanggalPanenAktual?: string;
  jumlahTanaman: number;
  tanamanHidup: number;
  tanamanMati: number;
  status: CycleStatus;
  targetHasilKg: number;
  catatan?: string;
  greenhouseSnapshot?: GreenhouseSnapshot;
  createdAt: string;
  updatedAt: string;
}

export interface Harvest {
  id: string;
  tanggal: string;
  cycleId: string;
  tunnel: 'Tunnel 1' | 'Tunnel 2' | 'Kedua Tunnel';
  totalKg: number;
  gradeA: number;
  gradeB: number;
  gradeC: number;
  hargaRataRata: number;
  totalNominal: number;
  pembeli: string;
  statusPembayaran: 'Lunas' | 'Sebagian' | 'Belum Lunas';
  dibayar?: number;
  catatan?: string;
  transactionId?: string; // linked transaction reference
  createdAt: string;
  updatedAt: string;
}

export type InvestmentCategory = 
  | 'Struktur' 
  | 'Atap & Dinding' 
  | 'DFT' 
  | 'Listrik' 
  | 'Tenaga Kerja Pembangunan' 
  | 'Peralatan' 
  | 'Lainnya';

export interface Investment {
  id: string;
  tanggal: string;
  namaItem: string;
  kategori: InvestmentCategory;
  nominal: number;
  greenhouseId?: string;
  tunnel: TunnelChoice;
  vendor?: string;
  metodePembayaran: PaymentMethod;
  catatan?: string;
  assetId?: string;
  transactionId?: string; // linked transaction reference
  createdAt: string;
  updatedAt: string;
}

export type AssetCondition = 'Baik' | 'Perlu Perawatan' | 'Rusak' | 'Afkir';

export interface Asset {
  id: string;
  namaAset: string;
  kategori: string;
  tanggalPembelian: string;
  harga: number;
  jumlah: number;
  nilaiTotal: number;
  kondisi: AssetCondition;
  umurEkonomisTahun: number;
  lokasi: string;
  catatan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: string;
  namaBarang: string;
  kategori: string;
  satuan: string;
  stokAwal: number;
  stokMasuk: number;
  stokKeluar: number;
  stokSaatIni: number;
  minimumStok: number;
  hargaRataRata: number;
  lokasiPenyimpanan?: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  tanggal: string;
  itemId: string;
  namaBarang: string;
  jenis: 'Masuk' | 'Keluar' | 'Penyesuaian';
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalNilai: number;
  referensi?: string;
  cycleId?: string;
  catatan?: string;
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  tanggal: string;
  nominal: number;
  metodePembayaran: PaymentMethod;
  catatan?: string;
  transactionId?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  jenis: 'hutang' | 'piutang';
  kontak: string;
  nominal: number;
  tanggal: string;
  jatuhTempo: string;
  dibayar: number;
  sisa: number;
  status: 'Belum Lunas' | 'Sebagian' | 'Lunas';
  kategori: string;
  keterangan?: string;
  riwayatPembayaran: DebtPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  namaUsaha: string;
  namaGreenhouse: string;
  pemilik: string;
  lokasi: string;
  jumlahTunnel: number;
  panjangTunnelM: number;
  lebarTunnelM: number;
  luasTotalM2: number;
  dimensiTunnel?: string;
  totalDimensi?: string;
  sistemBudidaya: string;
  kapasitasTanaman: number;
  kapasitasTandonLiter: number;
  targetHasilPerTanamanKg: number;
  targetHargaJualPerKg: number;
  saldoAwalKas: number;
  mataUang: string;
  dbInitialized: boolean;
  dbInitialChoice?: 'demo' | 'empty';
  lastBackupDate?: string;
}

export interface DashboardMetrics {
  saldoKas: number;
  saldoAwal: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  totalOmzet: number;
  totalBiayaProduksi: number;
  totalBiayaOperasional: number;
  totalInvestasi: number;
  labaKotor: number;
  labaBersih: number;
  totalPanenKg: number;
  hppRataRataPerKg: number;
  modalKembali: number;
  modalBelumKembali: number;
  roiSederhanaPersen: number;
  totalAsetNilai: number;
  totalHutang: number;
  totalPiutang: number;
  totalTanamanAktif: number;
  totalTanamanMati: number;
  targetPanenKg: number;
  persenTargetPanen: number;
}

export interface CycleFinancialDetail {
  cycle: Cycle;
  modalSiklus: number;
  biayaBenih: number;
  biayaNutrisi: number;
  biayaPestisida: number;
  biayaMedia: number;
  biayaListrikAir: number;
  biayaTenagaKerja: number;
  biayaKemasan: number;
  biayaLainnya: number;
  totalBiayaProduksi: number;
  totalBiayaOperasional: number;
  totalPanenKg: number;
  panenGradeA: number;
  panenGradeB: number;
  panenGradeC: number;
  omzet: number;
  hppPerTanaman: number;
  hppPerKg: number;
  labaKotor: number;
  labaBersih: number;
  hargaJualRataRata: number;
  survivalRate: number;
  targetHasilKg: number;
  pencapaianKgPersen: number;
}

/**
 * GREENHOUSE FINANCE PRO - Centralized Financial Calculation Engine
 * 
 * Standar perhitungan agribisnis greenhouse melon:
 * - HPP/kg = Total Biaya Produksi Siklus / Total Kg Panen
 * - HPP/tanaman = Total Biaya Produksi / Jumlah Tanaman
 * - Laba Kotor = Omzet - Total Biaya Produksi
 * - Laba Bersih = Laba Kotor - Biaya Operasional
 * - BEP Kg = Biaya Tetap / (Harga Jual/Kg - Biaya Variabel/Kg)
 * - BEP Rupiah = BEP Kg * Harga Jual/Kg
 * - ROI Sederhana = (Akumulasi Laba Bersih / Total Investasi) * 100%
 * - Modal Belum Kembali = Total Investasi - Akumulasi Laba yang dialokasikan
 */

import { Transaction, Cycle, Harvest, Investment } from '../types/index.js';

export function calculateHPP(totalBiayaProduksi: number, totalKgPanen: number): number {
  if (!totalKgPanen || totalKgPanen <= 0) return 0;
  return Math.round(totalBiayaProduksi / totalKgPanen);
}

export function calculateHPPPerTanaman(totalBiayaProduksi: number, jumlahTanaman: number): number {
  if (!jumlahTanaman || jumlahTanaman <= 0) return 0;
  return Math.round(totalBiayaProduksi / jumlahTanaman);
}

export function calculateGrossProfit(omzet: number, biayaProduksi: number): number {
  return omzet - biayaProduksi;
}

export function calculateNetProfit(labaKotor: number, biayaOperasional: number): number {
  return labaKotor - biayaOperasional;
}

export function calculateBEP(biayaTetap: number, biayaVariabelPerKg: number, hargaJualPerKg: number): {
  bepKg: number;
  bepRupiah: number;
  marginKontribusi: number;
  marginKontribusiRatio: number;
  isValid: boolean;
  message?: string;
} {
  if (biayaTetap < 0 || biayaVariabelPerKg < 0 || hargaJualPerKg <= 0) {
    return {
      bepKg: 0,
      bepRupiah: 0,
      marginKontribusi: 0,
      marginKontribusiRatio: 0,
      isValid: false,
      message: 'Parameter perhitungan BEP harus valid dan lebih dari 0'
    };
  }

  const marginKontribusi = hargaJualPerKg - biayaVariabelPerKg;
  if (marginKontribusi <= 0) {
    return {
      bepKg: 0,
      bepRupiah: 0,
      marginKontribusi,
      marginKontribusiRatio: 0,
      isValid: false,
      message: 'Harga jual melon per kg harus lebih besar dari biaya variabel/kg untuk mencapai titik impas'
    };
  }

  const bepKg = Math.ceil(biayaTetap / marginKontribusi);
  const bepRupiah = bepKg * hargaJualPerKg;
  const marginKontribusiRatio = Number(((marginKontribusi / hargaJualPerKg) * 100).toFixed(1));

  return {
    bepKg,
    bepRupiah,
    marginKontribusi,
    marginKontribusiRatio,
    isValid: true
  };
}

export function calculateROI(akumulasiLabaBersih: number, totalInvestasi: number): number {
  if (!totalInvestasi || totalInvestasi <= 0) return 0;
  return Number(((akumulasiLabaBersih / totalInvestasi) * 100).toFixed(2));
}

export function calculatePayback(totalInvestasi: number, akumulasiLabaBersih: number): {
  modalKembali: number;
  modalBelumKembali: number;
  persenKembali: number;
} {
  const modalKembali = Math.min(totalInvestasi, Math.max(0, akumulasiLabaBersih));
  const modalBelumKembali = Math.max(0, totalInvestasi - modalKembali);
  const persenKembali = totalInvestasi > 0 ? Number(((modalKembali / totalInvestasi) * 100).toFixed(1)) : 0;

  return {
    modalKembali,
    modalBelumKembali,
    persenKembali
  };
}

export function calculateCashFlow(saldoAwal: number, totalPemasukan: number, totalPengeluaran: number): {
  saldoAkhir: number;
  netCashFlow: number;
} {
  const netCashFlow = totalPemasukan - totalPengeluaran;
  const saldoAkhir = saldoAwal + netCashFlow;
  return {
    saldoAkhir,
    netCashFlow
  };
}

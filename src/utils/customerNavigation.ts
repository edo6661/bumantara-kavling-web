import type { NavigateFunction, SetURLSearchParams } from 'react-router-dom';

export type TransaksiTab = 'penjualan' | 'tagihan' | 'laporan';

export const MANAJEMEN_TRANSAKSI_PATH = '/management/manajemen-transaksi';

export function buildManajemenTransaksiSearchPath(customerNama: string): string {
  const params = new URLSearchParams({ search: customerNama, page: '1' });
  return `${MANAJEMEN_TRANSAKSI_PATH}?${params.toString()}`;
}

export function isManajemenTransaksiPage(pathname: string): boolean {
  return pathname === MANAJEMEN_TRANSAKSI_PATH || pathname.startsWith(`${MANAJEMEN_TRANSAKSI_PATH}/`);
}

export function buildPenjualanSearchPath(customerNama: string): string {
  const params = new URLSearchParams({ search: customerNama, page: '1' });
  return `/management/penjualan?${params.toString()}`;
}

export function buildTagihanSearchPath(customerNama: string): string {
  const params = new URLSearchParams({ search: customerNama.toLowerCase(), page: '1' });
  return `/customer/tagihan?${params.toString()}`;
}

export function buildPemasukanPenjualanSearchPath(customerNama: string): string {
  const params = new URLSearchParams({ search: customerNama, page: '1' });
  return `/laporan/pemasukan-penjualan?${params.toString()}`;
}

function getStandaloneTabPath(tab: TransaksiTab, customerNama: string): string {
  switch (tab) {
    case 'penjualan':
      return buildPenjualanSearchPath(customerNama);
    case 'tagihan':
      return buildTagihanSearchPath(customerNama);
    case 'laporan':
      return buildPemasukanPenjualanSearchPath(customerNama);
  }
}

function normalizeSearchForTab(tab: TransaksiTab, customerNama: string): string {
  return tab === 'tagihan' ? customerNama.toLowerCase() : customerNama;
}

/** Hapus filter spesifik tab lain saat pindah tab di hub Manajemen Transaksi */
function clearHubTabSpecificParams(prev: URLSearchParams): void {
  [
    'status',
    'orderBy',
    'caraPembayaran',
    'skemaPembayaran',
    'blok',
    'limit',
    'filterCustomerName',
    'filterKavling',
    'penjualanId',
  ].forEach((key) => prev.delete(key));
}

export function goToTransaksiTab(options: {
  tab: TransaksiTab;
  customerNama: string;
  pathname: string;
  navigate: NavigateFunction;
  setSearchParams: SetURLSearchParams;
}): void {
  const { tab, customerNama, pathname, navigate, setSearchParams } = options;

  if (isManajemenTransaksiPage(pathname)) {
    setSearchParams((prev) => {
      clearHubTabSpecificParams(prev);
      prev.set('tab', tab);
      prev.set('search', normalizeSearchForTab(tab, customerNama));
      prev.set('page', '1');
      return prev;
    });
    return;
  }

  navigate(getStandaloneTabPath(tab, customerNama));
}

export function goToTagihanTab(options: {
  customerNama?: string;
  pathname: string;
  navigate: NavigateFunction;
  setSearchParams: SetURLSearchParams;
}): void {
  const { customerNama, pathname, navigate, setSearchParams } = options;

  if (isManajemenTransaksiPage(pathname)) {
    setSearchParams((prev) => {
      clearHubTabSpecificParams(prev);
      prev.set('tab', 'tagihan');
      if (customerNama) {
        prev.set('search', customerNama.toLowerCase());
        prev.set('page', '1');
      }
      return prev;
    });
    return;
  }

  navigate(customerNama ? buildTagihanSearchPath(customerNama) : '/customer/tagihan');
}

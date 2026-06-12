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

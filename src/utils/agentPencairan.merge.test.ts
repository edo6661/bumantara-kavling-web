import { describe, expect, it } from 'vitest';
import {
  mergeAgentPenjualanWithEligibleBatal,
  resolveSaleDetail,
} from './agentPencairan';
import type { PenjualanAgentData } from '../types/models/agent';

const agentNama = 'Agent Budi';

const baseBatalSale: PenjualanAgentData = {
  id: 42,
  noTransaksi: 'TRX-2024-001',
  tanggal: '2024-01-15',
  hargaJual: 500_000_000,
  status: 'BATAL',
  bookingFeeLunasBatal: true,
  customer: { nama: 'Andi Wijaya' },
  kavling: { blok: 'A', nomorUnit: '12', perumahan: { nama: 'Perumahan X' } },
};

const listBatalSale = {
  id: 'TRX-2024-001',
  dbId: 42,
  noTransaksi: 'TRX-2024-001',
  agent: agentNama,
  nama: 'Andi Wijaya',
  tanggal: '2024-01-15',
  hargaJual: 500_000_000,
  status: 'BATAL',
  bookingFeeLunasBatal: true,
  blok: 'A',
  nomorUnit: '12',
  perumahan: 'Perumahan X',
  tagihan: [],
};

describe('mergeAgentPenjualanWithEligibleBatal', () => {
  it('tidak menduplikasi penjualan BATAL yang sudah ada di relasi agent', () => {
    const result = mergeAgentPenjualanWithEligibleBatal(
      { nama: agentNama, penjualan: [baseBatalSale] },
      [listBatalSale],
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(42);
    expect(result[0].customer?.nama).toBe('Andi Wijaya');
  });

  it('menambahkan penjualan BATAL eligible yang belum ada di relasi agent', () => {
    const missingBatal = {
      ...listBatalSale,
      id: 'TRX-2024-099',
      dbId: 99,
      noTransaksi: 'TRX-2024-099',
      nama: 'Siti Rahma',
    };

    const result = mergeAgentPenjualanWithEligibleBatal(
      { nama: agentNama, penjualan: [baseBatalSale] },
      [listBatalSale, missingBatal],
    );

    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id).sort()).toEqual([42, 99]);
    expect(result.find((s) => s.id === 99)?.customer?.nama).toBe('Siti Rahma');
  });

  it('tidak menambahkan penjualan aktif dari list penjualan', () => {
    const activeSale = {
      ...listBatalSale,
      id: 'TRX-2024-050',
      dbId: 50,
      noTransaksi: 'TRX-2024-050',
      status: 'LUNAS',
      bookingFeeLunasBatal: false,
    };

    const result = mergeAgentPenjualanWithEligibleBatal(
      { nama: agentNama, penjualan: [baseBatalSale] },
      [listBatalSale, activeSale],
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(42);
  });

  it('tidak menambahkan penjualan milik agent lain', () => {
    const otherAgentSale = {
      ...listBatalSale,
      id: 'TRX-2024-077',
      dbId: 77,
      noTransaksi: 'TRX-2024-077',
      agent: 'Agent Lain',
    };

    const result = mergeAgentPenjualanWithEligibleBatal(
      { nama: agentNama, penjualan: [] },
      [otherAgentSale],
    );

    expect(result).toHaveLength(0);
  });

  it('menggunakan dbId numerik pada penjualan tambahan (untuk lookup fee)', () => {
    const result = mergeAgentPenjualanWithEligibleBatal(
      { nama: agentNama, penjualan: [] },
      [listBatalSale],
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(42);
    expect(result[0].noTransaksi).toBe('TRX-2024-001');
  });
});

describe('resolveSaleDetail', () => {
  it('mencocokkan penjualan agent (id numerik) dengan baris list API (id = noTransaksi)', () => {
    const detail = resolveSaleDetail(
      {
        id: 42,
        noTransaksi: 'TRX-2024-001',
        status: 'BATAL',
        bookingFeeLunasBatal: true,
      },
      [
        {
          id: 'TRX-2024-001',
          dbId: 42,
          noTransaksi: 'TRX-2024-001',
          status: 'BATAL',
          bookingFeeLunasBatal: true,
          caraPembayaran: 'CASH KERAS',
          tagihan: [{ pembayaran: 'Booking Fee', status: 'LUNAS', tujuan: 'BOOKING_FEE' }],
          progressPenjualan: { nilaiAjb: 450_000_000 },
        } as never,
      ],
    );

    expect(detail.caraPembayaran).toBe('CASH KERAS');
    expect(detail.progressPenjualan?.nilaiAjb).toBe(450_000_000);
    expect(detail.tagihan).toHaveLength(1);
  });

  it('tetap fallback ke data sale jika tidak ada di list penjualan', () => {
    const detail = resolveSaleDetail(
      {
        id: 10,
        noTransaksi: 'TRX-ONLY-BASE',
        status: 'PROSES',
        hargaJual: 300_000_000,
        bookingFeeLunasBatal: false,
      },
      [],
    );

    expect(detail.status).toBe('PROSES');
    expect(detail.hargaJual).toBe(300_000_000);
    expect(detail.tagihan).toBeUndefined();
  });
});

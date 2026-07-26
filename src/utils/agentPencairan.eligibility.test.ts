import { describe, expect, it } from 'vitest';
import type { AgentData } from '../types/models/agent';
import type { AgentPencairanData } from '../services/agentPencairan.service';
import type { FeeAgentData } from '../services/feeAgent.service';
import {
  IN_HOUSE_FEE_MARKETING_PCT,
  formatPencairanTahapLabel,
  getFullMarketingFee,
  getPencairanBlockReason,
  getPencairanKomponen,
  hasAnyEligiblePencairan,
  type SaleDetail,
} from './agentPencairan';

const NILAI_AJB = 332_800_000;
const IN_HOUSE_MARKETING = NILAI_AJB * (IN_HOUSE_FEE_MARKETING_PCT / 100);

function buildAgent(overrides: Partial<AgentData> = {}): AgentData {
  return {
    id: 1,
    nik: 'NIK-001',
    kodeSales: null,
    nama: 'Eva',
    alamat: null,
    noHp: '08000000000',
    email: null,
    status: 'AKTIF',
    type: 'PRIBADI',
    namaBank: null,
    noRekening: null,
    atasNamaRekening: null,
    feeMarketingPct: 5,
    feeClosingNominal: 1_500_000,
    potonganPph: 0,
    isInHouse: false,
    fileKtp: null,
    fileNpwp: null,
    kwitansiBookingFee: null,
    fileSuratPernyataan: null,
    defaultSuratPernyataan: null,
    fileSuratKeterangan: null,
    fileKtpDirektur: null,
    fileNpwpPerusahaan: null,
    hasAccount: false,
    pics: [],
    ...overrides,
  };
}

const feeRecord: FeeAgentData = {
  id: 1,
  agentId: 1,
  namaAgent: 'Eva',
  penjualanId: 10,
  noTransaksi: 'TRX-001',
  namaCustomer: 'Lukman Hakim',
  kavling: 'AA30-8',
  bookingNominal: null,
  bookingTanggal: null,
  bookingBukti: null,
  closingNominal: null,
  closingTanggal: null,
  closingBukti: null,
  marketingNominal: null,
  marketingTanggal: null,
  marketingBukti: null,
};

function buildDetail(overrides: Partial<SaleDetail> = {}): SaleDetail {
  return {
    status: 'AKTIF',
    caraPembayaran: 'CASH_KERAS',
    hargaJual: 406_000_000,
    tagihan: [{ tujuan: 'BOOKING_FEE', pembayaran: 'CASH', status: 'LUNAS' }],
    progressPenjualan: {
      nilaiAjb: NILAI_AJB,
      filePpjb: 'ppjb.pdf',
      fileAjb: null,
      fileSp3k: null,
      fileSuratPernyataanAkadKredit: null,
    },
    ...overrides,
  };
}

function buildPaidPpjbPencairan(
  marketingNominal: number,
): AgentPencairanData[] {
  return [
    {
      id: 1,
      feeAgentId: 1,
      penjualanId: 10,
      agentId: 1,
      tahap: 'PPJB',
      closingNominal: 0,
      marketingNominal,
      potonganPph: 0,
      totalNominal: marketingNominal,
      status: 'SUDAH_DIBAYAR',
      fileInvoice: null,
      fileInvoiceList: [],
      buktiPembayaran: null,
      tanggalPembayaran: null,
      bsiCmsDilaporkan: false,
      bsiCmsDilaporkanAt: null,
      diajukanOlehId: 1,
      dibayarOlehId: 2,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];
}

describe('formatPencairanTahapLabel', () => {
  it('cash: PPJB dan AJB jelas', () => {
    expect(formatPencairanTahapLabel('PPJB', 'CASH_KERAS')).toBe('50% PPJB');
    expect(formatPencairanTahapLabel('AJB', 'CASH KERAS')).toBe('50% AJB');
  });

  it('KPR: AJB berarti komisi penuh, bukan upload dokumen', () => {
    expect(formatPencairanTahapLabel('AJB', 'KPR')).toBe('Komisi KPR');
  });
});

describe('agentPencairan eligibility — in-house selaras dengan agent eksternal', () => {
  it('fee marketing in-house tetap 0,5%', () => {
    const agent = buildAgent({ isInHouse: true, feeMarketingPct: 99 });
    const detail = buildDetail();

    expect(getFullMarketingFee(agent, detail)).toBe(IN_HOUSE_MARKETING);
  });

  it('in-house cash: boleh ajukan 50% PPJB tanpa file AJB', () => {
    const agent = buildAgent({ isInHouse: true, feeClosingNominal: 0 });
    const detail = buildDetail();

    expect(hasAnyEligiblePencairan(agent, feeRecord, [], detail)).toBe(true);

    const marketing = getPencairanKomponen(agent, feeRecord, [], detail)[1];
    expect(marketing).toMatchObject({
      key: 'marketing',
      eligible: true,
      // Hanya portion yang bisa disubmit sekarang (50% PPJB)
      nominalSisa: IN_HOUSE_MARKETING / 2,
    });
  });

  it('in-house cash: sisa 50% AJB diblokir tanpa file AJB', () => {
    const agent = buildAgent({ isInHouse: true, feeClosingNominal: 0 });
    const detail = buildDetail();
    const pencairanList = buildPaidPpjbPencairan(IN_HOUSE_MARKETING / 2);

    expect(hasAnyEligiblePencairan(agent, feeRecord, pencairanList, detail)).toBe(
      false,
    );
    expect(
      getPencairanBlockReason(agent, feeRecord, pencairanList, detail),
    ).toBe('Upload salinan AJB (sisa 50%)');

    const marketing = getPencairanKomponen(
      agent,
      feeRecord,
      pencairanList,
      detail,
    )[1];
    expect(marketing).toMatchObject({
      key: 'marketing',
      eligible: false,
      nominalSisa: IN_HOUSE_MARKETING / 2,
      alasan: 'Upload salinan AJB (sisa 50%)',
    });
  });

  it('in-house KPR: boleh ajukan penuh dengan PPJB tanpa file AJB', () => {
    const agent = buildAgent({ isInHouse: true, feeClosingNominal: 0 });
    const detail = buildDetail({
      caraPembayaran: 'KPR',
      progressPenjualan: {
        nilaiAjb: NILAI_AJB,
        filePpjb: 'ppjb.pdf',
        fileAjb: null,
        fileSp3k: 'sp3k.pdf',
        fileSuratPernyataanAkadKredit: null,
      },
    });

    expect(hasAnyEligiblePencairan(agent, feeRecord, [], detail)).toBe(true);

    const marketing = getPencairanKomponen(agent, feeRecord, [], detail)[1];
    expect(marketing).toMatchObject({
      key: 'marketing',
      eligible: true,
      nominalSisa: IN_HOUSE_MARKETING,
    });
  });

  it('agent eksternal cash: closing tetap eligible tanpa AJB', () => {
    const agent = buildAgent();
    const detail = buildDetail();

    const closing = getPencairanKomponen(agent, feeRecord, [], detail)[0];
    expect(closing).toMatchObject({ key: 'closing', eligible: true });
  });
});

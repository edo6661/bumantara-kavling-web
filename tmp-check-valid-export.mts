import {
  getInvalidCoretaxNikEntries,
  buildCoretaxPph21Rows,
  generateCoretaxPph21Xml,
  buildDefaultNitkuPemotong,
  resolveCoretaxKsoConfig,
} from './src/utils/coretaxPph21.ts';

const pembayaran = {
  id: 'p1',
  nominal: 2000000,
  tanggalDari: '2026-07-01',
  tanggalSampai: '2026-07-10',
  tanggalPembayaran: '2026-07-11',
  spkId: 1,
  spk: { noSpk: 'SPK-001', bankRekeningPt: { atasNama: 'SGMP' } },
  upahBaris: [
    {
      id: 't1',
      nama: 'A',
      nik: '3175091201990001',
      nominal: 1000000,
      sudahMenikah: false,
      jumlahAnak: 0,
    },
    {
      id: 't2',
      nama: 'B',
      nik: '3276010101900002',
      nominal: 1000000,
      sudahMenikah: true,
      jumlahAnak: 2,
    },
  ],
};

const invalid = getInvalidCoretaxNikEntries(pembayaran as any);
const kso = resolveCoretaxKsoConfig('SGMP')!;
const nitku = buildDefaultNitkuPemotong(kso.tin);
const { rows } = buildCoretaxPph21Rows(pembayaran as any, {
  taxPeriodMonth: 7,
  taxPeriodYear: 2026,
  nitkuPemotong: nitku,
});
const xml = generateCoretaxPph21Xml(rows, kso.tin);

console.log(
  JSON.stringify(
    {
      invalidCount: invalid.length,
      rowCount: rows.length,
      tinsOk: rows.every((r) => r.counterpartTin.length === 16),
      nitkuRecipientOk: rows.every(
        (r) => r.idPlaceOfBusinessActivityOfIncomeRecipient.length === 22,
      ),
      ptkp: rows.map((r) => r.statusTaxExemption),
      grossTotal: rows.reduce((s, r) => s + r.gross, 0),
      hasXmlRoot: xml.includes('<Bp21Bulk'),
      hasBothNiks:
        xml.includes('3175091201990001') && xml.includes('3276010101900002'),
    },
    null,
    2,
  ),
);

import type { SpkPembayaranData, SpkPembayaranUpahBarisData } from '../services/spkPembayaran.service';

export const CORETAX_MAX_GROSS_PER_TUKANG = 5_000_000;
export const CORETAX_TAX_OBJECT_CODE = '21-100-35';
export const CORETAX_PTKP_OPTIONS = ['TK/0', 'K/0', 'K/1', 'K/2', 'K/3'] as const;

const DOC_COUNTER_KEY = 'coretax-pph21-doc-counter';

export interface CoretaxKsoConfig {
  tin: string;
  companyCode: 'BSG' | 'BSM';
  label: string;
}

export interface CoretaxPph21Row {
  lineNo: number;
  taxPeriodMonth: number;
  taxPeriodYear: number;
  counterpartTin: string;
  idPlaceOfBusinessActivityOfIncomeRecipient: string;
  statusTaxExemption: string;
  taxCertificate: string;
  taxObjectCode: string;
  gross: number;
  deemed: number;
  rate: number;
  document: string;
  documentNumber: string;
  documentDate: string;
  idPlaceOfBusinessActivity: string;
  withholdingDate: string;
  tukangNama: string;
}

export interface BuildCoretaxPph21Options {
  taxPeriodMonth: number;
  taxPeriodYear: number;
  documentStartNumber?: number;
}

export function resolveCoretaxKsoConfig(atasNama: string | null | undefined): CoretaxKsoConfig | null {
  const n = (atasNama ?? '').trim().toLowerCase();
  if (!n) return null;
  if (n.includes('mahligai') || n.includes('bms')) {
    return {
      tin: '1000000005313046',
      companyCode: 'BSM',
      label: 'BMS',
    };
  }
  if (n.includes('gajah') || n.includes('sgmp')) {
    return {
      tin: '1000000000423419',
      companyCode: 'BSG',
      label: 'BSG',
    };
  }
  return null;
}

/** Bulan Romawi mengikuti template Coretax (April = IIII). */
export function toCoretaxRomanMonth(month: number): string {
  const map: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IIII',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
    9: 'IX',
    10: 'X',
    11: 'XI',
    12: 'XII',
  };
  return map[month] ?? String(month);
}

export function normalizeNik(nik: string): string {
  return nik.replace(/\D/g, '');
}

export function getCoretaxPtkpStatus(nik: string): string {
  const digits = normalizeNik(nik);
  let hash = 0;
  for (const c of digits) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return CORETAX_PTKP_OPTIONS[Math.abs(hash) % CORETAX_PTKP_OPTIONS.length];
}

function resolveDocumentDate(row: SpkPembayaranData, taxPeriodMonth: number, taxPeriodYear: number): string {
  const raw = row.tanggalSampai ?? row.tanggalPembayaran ?? row.tanggalDari;
  if (raw) return raw.slice(0, 10);
  const mm = String(taxPeriodMonth).padStart(2, '0');
  return `${taxPeriodYear}-${mm}-15`;
}

function readDocCounter(companyCode: string, year: number): number {
  try {
    const raw = localStorage.getItem(`${DOC_COUNTER_KEY}-${companyCode}-${year}`);
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 194;
  } catch {
    return 194;
  }
}

export function reserveCoretaxDocumentNumbers(
  companyCode: string,
  year: number,
  count: number,
  startNumber?: number,
): number[] {
  const base = startNumber ?? readDocCounter(companyCode, year);
  return Array.from({ length: count }, (_, i) => base + i + 1);
}

export function commitCoretaxDocumentNumbers(
  companyCode: string,
  year: number,
  lastNumber: number,
): void {
  try {
    localStorage.setItem(`${DOC_COUNTER_KEY}-${companyCode}-${year}`, String(lastNumber));
  } catch {
    // ignore storage errors
  }
}

/** Distribusi penghasilan per tukang; total harus sama dengan nominal pengajuan. */
export function distributeCoretaxGross(
  total: number,
  baris: SpkPembayaranUpahBarisData[],
): number[] {
  if (baris.length === 0) return [];

  const explicit = baris.map((b) => Math.round(Number(b.nominal) || 0));
  const explicitSum = explicit.reduce((sum, n) => sum + n, 0);

  if (explicitSum > 0) {
    const zeroIndexes = explicit
      .map((n, i) => (n <= 0 ? i : -1))
      .filter((i) => i >= 0);
    if (zeroIndexes.length === 0) return explicit;

    const remainder = total - explicitSum;
    if (remainder < 0) {
      throw new Error(
        'Total upah per tukang melebihi nominal pengajuan. Periksa data upah baris.',
      );
    }
    const perZero = Math.floor(remainder / zeroIndexes.length);
    let leftover = remainder - perZero * zeroIndexes.length;
    return explicit.map((n, index) => {
      if (n > 0) return n;
      const extra = leftover > 0 ? 1 : 0;
      if (extra) leftover -= 1;
      return perZero + extra;
    });
  }

  const count = baris.length;
  const base = Math.floor(total / count);
  let leftover = total - base * count;
  return Array.from({ length: count }, () => {
    const extra = leftover > 0 ? 1 : 0;
    if (extra) leftover -= 1;
    return base + extra;
  });
}

export function buildCoretaxPph21Rows(
  pembayaran: SpkPembayaranData,
  options: BuildCoretaxPph21Options,
): { rows: CoretaxPph21Row[]; kso: CoretaxKsoConfig } {
  const kso = resolveCoretaxKsoConfig(pembayaran.spk?.bankRekeningPt?.atasNama);
  if (!kso) {
    throw new Error('KSO tidak dikenali. Hanya SGMP/Gajah (BSG) atau Mahligai/BMS yang didukung.');
  }

  const baris = pembayaran.upahBaris ?? [];
  if (baris.length === 0) {
    throw new Error('Tidak ada data tukang pada pengajuan ini.');
  }

  const grossList = distributeCoretaxGross(Math.round(pembayaran.nominal), baris);
  const docNumbers = reserveCoretaxDocumentNumbers(
    kso.companyCode,
    options.taxPeriodYear,
    baris.length,
    options.documentStartNumber,
  );

  const documentDate = resolveDocumentDate(
    pembayaran,
    options.taxPeriodMonth,
    options.taxPeriodYear,
  );
  const idPlaceOfBusinessActivity = `${kso.tin}000000`;
  const romanMonth = toCoretaxRomanMonth(options.taxPeriodMonth);

  const rows: CoretaxPph21Row[] = baris.map((tukang, index) => {
    const nik = normalizeNik(tukang.nik);
    if (!nik) {
      throw new Error(`NIK tukang baris ${index + 1} (${tukang.nama || 'tanpa nama'}) wajib diisi.`);
    }

    const gross = grossList[index] ?? 0;
    if (gross <= 0) {
      throw new Error(`Penghasilan tukang ${tukang.nama} harus lebih dari 0.`);
    }
    if (gross > CORETAX_MAX_GROSS_PER_TUKANG) {
      throw new Error(
        `Penghasilan tukang ${tukang.nama} melebihi ${CORETAX_MAX_GROSS_PER_TUKANG.toLocaleString('id-ID')}.`,
      );
    }

    const docNo = docNumbers[index];
    return {
      lineNo: index + 1,
      taxPeriodMonth: options.taxPeriodMonth,
      taxPeriodYear: options.taxPeriodYear,
      counterpartTin: nik,
      idPlaceOfBusinessActivityOfIncomeRecipient: `${nik}000000`,
      statusTaxExemption: getCoretaxPtkpStatus(nik),
      taxCertificate: 'N/A',
      taxObjectCode: CORETAX_TAX_OBJECT_CODE,
      gross,
      deemed: 100,
      rate: 0,
      document: 'Other',
      documentNumber: `${docNo}/${kso.companyCode}/${romanMonth}/${options.taxPeriodYear}`,
      documentDate,
      idPlaceOfBusinessActivity,
      withholdingDate: documentDate,
      tukangNama: tukang.nama,
    };
  });

  const grossTotal = rows.reduce((sum, row) => sum + row.gross, 0);
  if (grossTotal !== Math.round(pembayaran.nominal)) {
    throw new Error(
      `Total penghasilan XML (${grossTotal.toLocaleString('id-ID')}) tidak sama dengan nominal pengajuan (${Math.round(pembayaran.nominal).toLocaleString('id-ID')}).`,
    );
  }

  return { rows, kso };
}

export function validateCoretaxPph21Rows(rows: CoretaxPph21Row[]): string[] {
  const errors: string[] = [];
  for (const row of rows) {
    const prefix = `Baris ${row.lineNo} (${row.tukangNama})`;
    if (!row.counterpartTin) errors.push(`${prefix}: NIK kosong.`);
    if (row.gross <= 0) errors.push(`${prefix}: penghasilan harus > 0.`);
    if (row.gross > CORETAX_MAX_GROSS_PER_TUKANG) {
      errors.push(`${prefix}: penghasilan melebihi batas 5 juta.`);
    }
  }
  return errors;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function bp21RowToXml(row: CoretaxPph21Row): string {
  return `\t\t<Bp21>
\t\t\t<TaxPeriodMonth>${row.taxPeriodMonth}</TaxPeriodMonth>
\t\t\t<TaxPeriodYear>${row.taxPeriodYear}</TaxPeriodYear>
\t\t\t<CounterpartTin>${escapeXml(row.counterpartTin)}</CounterpartTin>
\t\t\t<IDPlaceOfBusinessActivityOfIncomeRecipient>${escapeXml(row.idPlaceOfBusinessActivityOfIncomeRecipient)}</IDPlaceOfBusinessActivityOfIncomeRecipient>
\t\t\t<StatusTaxExemption>${escapeXml(row.statusTaxExemption)}</StatusTaxExemption>
\t\t\t<TaxCertificate>${escapeXml(row.taxCertificate)}</TaxCertificate>
\t\t\t<TaxObjectCode>${escapeXml(row.taxObjectCode)}</TaxObjectCode>
\t\t\t<Gross>${row.gross}</Gross>
\t\t\t<Deemed>${row.deemed}</Deemed>
\t\t\t<Rate>${row.rate}</Rate>
\t\t\t<Document>${escapeXml(row.document)}</Document>
\t\t\t<DocumentNumber>${escapeXml(row.documentNumber)}</DocumentNumber>
\t\t\t<DocumentDate>${escapeXml(row.documentDate)}</DocumentDate>
\t\t\t<IDPlaceOfBusinessActivity>${escapeXml(row.idPlaceOfBusinessActivity)}</IDPlaceOfBusinessActivity>
\t\t\t<WithholdingDate>${escapeXml(row.withholdingDate)}</WithholdingDate>
\t\t</Bp21>`;
}

export function generateCoretaxPph21Xml(rows: CoretaxPph21Row[], tin: string): string {
  const body = rows.map(bp21RowToXml).join('\n');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Bp21Bulk xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
\t<TIN>${escapeXml(tin)}</TIN>
\t<ListOfBp21>
${body}
\t</ListOfBp21>
</Bp21Bulk>
`;
}

export function downloadCoretaxPph21Xml(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function buildCoretaxPph21Filename(
  pembayaran: SpkPembayaranData,
  kso: CoretaxKsoConfig,
  taxPeriodMonth: number,
  taxPeriodYear: number,
): string {
  const mm = String(taxPeriodMonth).padStart(2, '0');
  const spkNo = (pembayaran.spk?.noSpk ?? `spk-${pembayaran.spkId}`)
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-');
  return `PPH21-${kso.companyCode}-${taxPeriodYear}${mm}-${spkNo}-${pembayaran.id}.xml`;
}

export function exportCoretaxPph21ForPembayaran(
  pembayaran: SpkPembayaranData,
  options: BuildCoretaxPph21Options,
): void {
  const { rows, kso } = buildCoretaxPph21Rows(pembayaran, options);
  const validationErrors = validateCoretaxPph21Rows(rows);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join('\n'));
  }

  const xml = generateCoretaxPph21Xml(rows, kso.tin);
  const filename = buildCoretaxPph21Filename(
    pembayaran,
    kso,
    options.taxPeriodMonth,
    options.taxPeriodYear,
  );
  downloadCoretaxPph21Xml(xml, filename);

  const lastDocNumber = Number(rows[rows.length - 1]?.documentNumber.split('/')[0]);
  if (Number.isFinite(lastDocNumber)) {
    commitCoretaxDocumentNumbers(kso.companyCode, options.taxPeriodYear, lastDocNumber);
  }
}

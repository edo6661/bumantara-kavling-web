import type { SpkPembayaranData } from '../services/spkPembayaran.service';
import { SPK_PEMBAYARAN_JENIS_LABEL } from './spkPembayaran';

export const BSI_SOURCE_ACCOUNT_OPTIONS = ['7304466671', '7315321381'] as const;
export const BSI_DEFAULT_SOURCE_ACCOUNT = BSI_SOURCE_ACCOUNT_OPTIONS[0];
export const BSI_NOTIFY_EMAIL = 'bintangsafana.globalindo@gmail.com';
export const BSI_BANK_CODE = 'CENAIDJA';
export const BSI_DEFAULT_COMPANY_ID = '85553201';

/** Kolom kosong setelah AMOUNT (USING SPECIAL RATE s.d. DOC. UNDERLYING CODE). */
const BSI_EMPTY_FIELDS_AFTER_AMOUNT = 6;
/** Kolom kosong setelah BENEFICIARY NATIONALITY (CATEGORY s.d. IDENTIFICATION NUMBER). */
const BSI_EMPTY_FIELDS_AFTER_NATIONALITY = 3;

const BSI_BANK_NAME_MAP: Record<string, string> = {
  bca: 'PT. BANK CENTRAL ASIA Tbk.',
};

export function normalizeBsiBankName(namaBank: string): string {
  const trimmed = namaBank.trim();
  if (!trimmed) return trimmed;
  const mapped = BSI_BANK_NAME_MAP[trimmed.toLowerCase()];
  return mapped ?? trimmed;
}

export type BsiTransferType = 'BI FAST' | 'ONLINE';

export interface BsiBatchPaymentRow {
  pembayaranId: number;
  lineNo: number;
  paymentSubject: string;
  transferType: BsiTransferType;
  sourceAcct: string;
  sourceAcctCcy: string;
  beneficiaryCountry: string;
  beneficiaryType: string;
  destination: string;
  beneficiaryAcctName: string;
  beneficiaryNotifEmail: string;
  creditAmountCcy: string;
  amount: number;
  bankName: string;
  bankCode: string;
  beneficiaryCitizenship: string;
  beneficiaryNationality: string;
  city: string;
  chargeType: string;
  additionalMessage: string;
  spkNo: string;
  mandorUsername: string;
}

export interface BsiBatchHeader {
  batchId: string;
  paymentDate: string;
  companyId: string;
}

export function getBsiPaymentSubject(row: SpkPembayaranData): string {
  if (row.jenis === 'KASBON') {
    return (row.keterangan ?? 'Kasbon').trim();
  }
  return SPK_PEMBAYARAN_JENIS_LABEL[row.jenis];
}

export function getBsiAdditionalMessage(row: SpkPembayaranData): string {
  if (row.keterangan?.trim()) return row.keterangan.trim();
  return getBsiPaymentSubject(row);
}

export function buildBsiBatchRows(
  items: SpkPembayaranData[],
  defaults: {
    transferType?: BsiTransferType;
    sourceAcct?: string;
  } = {},
): BsiBatchPaymentRow[] {
  const transferType = defaults.transferType ?? 'BI FAST';
  const sourceAcct = defaults.sourceAcct ?? BSI_DEFAULT_SOURCE_ACCOUNT;

  return items.map((row, index) => {
    const mandor = row.spk?.mandor;
    return {
      pembayaranId: row.id,
      lineNo: index + 1,
      paymentSubject: getBsiPaymentSubject(row),
      transferType,
      sourceAcct,
      sourceAcctCcy: 'IDR',
      beneficiaryCountry: 'ID',
      beneficiaryType: 'Beneficiary Account',
      destination: mandor?.noRekening ?? '',
      beneficiaryAcctName: mandor?.username ?? '',
      beneficiaryNotifEmail: BSI_NOTIFY_EMAIL,
      creditAmountCcy: 'IDR',
      amount: row.nominal,
      bankName: normalizeBsiBankName(mandor?.namaBank ?? ''),
      bankCode: BSI_BANK_CODE,
      beneficiaryCitizenship: 'R',
      beneficiaryNationality: 'W',
      city: 'tangerang',
      chargeType: 'OUR',
      additionalMessage: getBsiAdditionalMessage(row),
      spkNo: row.spk?.noSpk ?? '',
      mandorUsername: mandor?.username ?? '',
    };
  });
}

export function validateBsiBatchRows(rows: BsiBatchPaymentRow[]): string[] {
  const errors: string[] = [];
  rows.forEach((row) => {
    const prefix = `Baris ${row.lineNo} (${row.paymentSubject})`;
    if (!row.destination.trim()) errors.push(`${prefix}: nomor rekening mandor kosong.`);
    if (!row.beneficiaryAcctName.trim()) errors.push(`${prefix}: nama mandor kosong.`);
    if (!row.bankName.trim()) errors.push(`${prefix}: nama bank mandor kosong.`);
    if (!row.sourceAcct.trim()) errors.push(`${prefix}: rekening sumber kosong.`);
    if (row.amount <= 0) errors.push(`${prefix}: nominal harus lebih dari 0.`);
  });
  return errors;
}

function formatBatchId(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}

function formatPaymentDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createDefaultBsiBatchHeader(date = new Date()): BsiBatchHeader {
  return {
    batchId: formatBatchId(date),
    paymentDate: formatPaymentDate(date),
    companyId: BSI_DEFAULT_COMPANY_ID,
  };
}

function emptyFields(count: number): string[] {
  return Array.from({ length: count }, () => '');
}

function rowToPipeLine(row: BsiBatchPaymentRow): string {
  return [
    row.lineNo,
    row.paymentSubject,
    row.transferType,
    row.sourceAcct,
    row.sourceAcctCcy,
    row.beneficiaryCountry,
    row.beneficiaryType,
    row.destination,
    row.beneficiaryAcctName,
    row.beneficiaryNotifEmail,
    row.creditAmountCcy,
    Math.round(row.amount),
    ...emptyFields(BSI_EMPTY_FIELDS_AFTER_AMOUNT),
    normalizeBsiBankName(row.bankName),
    row.bankCode,
    row.beneficiaryCitizenship,
    row.beneficiaryNationality,
    ...emptyFields(BSI_EMPTY_FIELDS_AFTER_NATIONALITY),
    row.city,
    row.chargeType,
    '',
    row.additionalMessage,
    '',
  ].join('|');
}

const COLUMN_HEADER =
  '0|PAYMENT SUBJECT (50)|TRANSFER TYPE|SOURCE ACCT (16)|SOURCE ACCT (CCY) |BENEFICIARY COUNTRY |BENEFICIARY TYPE |DESTINATION|BENEFICIARY ACCT NAME |BENEFICIARY NOTIF EMAIL(100)|CREDIT AMOUNT CCY|AMOUNT|USING SPECIAL RATE|TREASURY NUMBER|TRANSACTION TYPE|TRANSACTION PURPOSE CODE|UNDERLTYING DOC. TYPE CODE|DOC. UNDERLYING CODE|BANK NAME|BANK CODE|BENEFICIARY CITIZENSHIP|BENEFICIARY NATIONALITY|BENEFICIARY CATEGORY|BENEFICIARY IDENTIFICATION TYPE|BENEFICIARY IDENTIFICATION NUMBER|CITY|CHARGE TYPE|MESSAGE (65)|ADDITIONAL MESSAGE (16)|';

export function generateBsiBatchTxt(
  rows: BsiBatchPaymentRow[],
  header: BsiBatchHeader,
): string {
  const lines: string[] = [
    `0|${header.batchId}|${header.paymentDate}|${rows.length}|${header.companyId}|`,
    COLUMN_HEADER,
    ...rows.map(rowToPipeLine),
  ];
  return `${lines.join('\r\n')}\r\n`;
}

export function downloadBsiBatchTxt(content: string, paymentDate: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `bsi-batch-payment-${paymentDate}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

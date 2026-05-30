import type { SpkPembayaranData } from '../services/spkPembayaran.service';
import type { NotarisPembayaranData } from '../services/notarisPembayaran.service';
import type { BankKprPembayaranData } from '../services/bankKprPembayaran.service';

export const BSI_SOURCE_ACCOUNT_OPTIONS = ['7304466671', '7315321381'] as const;
export const BSI_DEFAULT_SOURCE_ACCOUNT = BSI_SOURCE_ACCOUNT_OPTIONS[0];
export const BSI_NOTIFY_EMAIL = 'bintangsafana.globalindo@gmail.com';
export const BSI_BANK_CODE = 'CENAIDJA';
export const BSI_DEFAULT_COMPANY_ID = '85553201';

/** Batas panjang field sesuai header template BSI CMS. */
export const BSI_MAX_PAYMENT_SUBJECT = 50;
export const BSI_MAX_ADDITIONAL_MESSAGE = 16;
export const BSI_MAX_SOURCE_ACCT = 16;
export const BSI_MAX_BENEFICIARY_NOTIF_EMAIL = 100;

/** Kolom kosong setelah AMOUNT (USING SPECIAL RATE s.d. DOC. UNDERLYING CODE). */
const BSI_EMPTY_FIELDS_AFTER_AMOUNT = 6;
/** Kolom kosong setelah BENEFICIARY NATIONALITY (CATEGORY s.d. IDENTIFICATION NUMBER). */
const BSI_EMPTY_FIELDS_AFTER_NATIONALITY = 3;

const BSI_BANK_NAME_MAP: Record<string, string> = {
  bca: 'PT. BANK CENTRAL ASIA Tbk.',
};

/** Label pendek untuk kolom PAYMENT SUBJECT — mengikuti gaya template BSI. */
const SPK_BSI_PAYMENT_SUBJECT: Record<string, string> = {
  TERMIN_55: 'termin 55',
  TERMIN_100: 'termin 100',
  RETENSI: 'retensi',
};

const NOTARIS_BSI_PAYMENT_SUBJECT: Record<string, string> = {
  BIAYA_NOTARIS: 'biaya notaris',
  BPHTB: 'bphtb',
};

const BANK_KPR_BSI_PAYMENT_SUBJECT: Record<string, string> = {
  BIAYA_KPR: 'biaya kpr',
  BIAYA_APPRAISAL: 'biaya appraisal',
};

export function truncateBsiField(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

/** Payment subject max 50; additional message = potongan subject max 16 ( pola template BSI ). */
export function alignBsiPaymentFields(subject: string): {
  paymentSubject: string;
  additionalMessage: string;
} {
  const paymentSubject = truncateBsiField(subject, BSI_MAX_PAYMENT_SUBJECT);
  const additionalMessage = truncateBsiField(
    paymentSubject,
    BSI_MAX_ADDITIONAL_MESSAGE,
  );
  return { paymentSubject, additionalMessage };
}

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
  referenceNo?: string;
}

export interface BsiBatchHeader {
  batchId: string;
  paymentDate: string;
  companyId: string;
}

export function getBsiPaymentSubject(row: SpkPembayaranData): string {
  if (row.jenis === 'KASBON') {
    return (row.keterangan ?? 'kasbon').trim();
  }
  return SPK_BSI_PAYMENT_SUBJECT[row.jenis] ?? row.jenis.toLowerCase();
}

export function getBsiAdditionalMessage(row: SpkPembayaranData): string {
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
    const { paymentSubject, additionalMessage } = alignBsiPaymentFields(
      getBsiPaymentSubject(row),
    );
    return {
      pembayaranId: row.id,
      lineNo: index + 1,
      paymentSubject,
      transferType,
      sourceAcct: truncateBsiField(sourceAcct, BSI_MAX_SOURCE_ACCT),
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
      additionalMessage,
      spkNo: row.spk?.noSpk ?? '',
      mandorUsername: mandor?.username ?? '',
      referenceNo: row.spk?.noSpk ?? '',
    };
  });
}

export function getNotarisBsiPaymentSubject(row: NotarisPembayaranData): string {
  return NOTARIS_BSI_PAYMENT_SUBJECT[row.jenis] ?? row.jenis.toLowerCase();
}

export function getNotarisBsiAdditionalMessage(row: NotarisPembayaranData): string {
  return getNotarisBsiPaymentSubject(row);
}

export function buildNotarisBsiBatchRows(
  items: NotarisPembayaranData[],
  defaults: {
    transferType?: BsiTransferType;
    sourceAcct?: string;
  } = {},
): BsiBatchPaymentRow[] {
  const transferType = defaults.transferType ?? 'BI FAST';
  const sourceAcct = defaults.sourceAcct ?? BSI_DEFAULT_SOURCE_ACCOUNT;

  return items.map((row, index) => {
    const notaris = row.penjualan?.detailKavlingPajak?.notaris;
    const { paymentSubject, additionalMessage } = alignBsiPaymentFields(
      getNotarisBsiPaymentSubject(row),
    );
    return {
      pembayaranId: row.id,
      lineNo: index + 1,
      paymentSubject,
      transferType,
      sourceAcct: truncateBsiField(sourceAcct, BSI_MAX_SOURCE_ACCT),
      sourceAcctCcy: 'IDR',
      beneficiaryCountry: 'ID',
      beneficiaryType: 'Beneficiary Account',
      destination: notaris?.noRekening ?? '',
      beneficiaryAcctName: notaris?.atasNamaRekening ?? notaris?.nama ?? '',
      beneficiaryNotifEmail: BSI_NOTIFY_EMAIL,
      creditAmountCcy: 'IDR',
      amount: row.nominal,
      bankName: normalizeBsiBankName(notaris?.namaBank ?? ''),
      bankCode: BSI_BANK_CODE,
      beneficiaryCitizenship: 'R',
      beneficiaryNationality: 'W',
      city: 'tangerang',
      chargeType: 'OUR',
      additionalMessage,
      spkNo: row.penjualan?.noTransaksi ?? '',
      mandorUsername: notaris?.nama ?? '',
      referenceNo: row.penjualan?.noTransaksi ?? '',
    };
  });
}

export function getBankKprBsiPaymentSubject(row: BankKprPembayaranData): string {
  return BANK_KPR_BSI_PAYMENT_SUBJECT[row.jenis] ?? row.jenis.toLowerCase();
}

export function buildBankKprBsiBatchRows(
  items: BankKprPembayaranData[],
  defaults: {
    transferType?: BsiTransferType;
    sourceAcct?: string;
  } = {},
): BsiBatchPaymentRow[] {
  const transferType = defaults.transferType ?? 'BI FAST';
  const sourceAcct = defaults.sourceAcct ?? BSI_DEFAULT_SOURCE_ACCOUNT;

  return items.map((row, index) => {
    const penjualan = row.penjualan;
    const bankName =
      penjualan?.bankKprNamaRekening?.trim() || penjualan?.bank?.trim() || '';
    const { paymentSubject, additionalMessage } = alignBsiPaymentFields(
      getBankKprBsiPaymentSubject(row),
    );
    return {
      pembayaranId: row.id,
      lineNo: index + 1,
      paymentSubject,
      transferType,
      sourceAcct: truncateBsiField(sourceAcct, BSI_MAX_SOURCE_ACCT),
      sourceAcctCcy: 'IDR',
      beneficiaryCountry: 'ID',
      beneficiaryType: 'Beneficiary Account',
      destination: penjualan?.bankKprNoRekening ?? '',
      beneficiaryAcctName: penjualan?.bankKprAtasNamaRekening ?? bankName,
      beneficiaryNotifEmail: BSI_NOTIFY_EMAIL,
      creditAmountCcy: 'IDR',
      amount: row.nominal,
      bankName: normalizeBsiBankName(bankName),
      bankCode: BSI_BANK_CODE,
      beneficiaryCitizenship: 'R',
      beneficiaryNationality: 'W',
      city: 'tangerang',
      chargeType: 'OUR',
      additionalMessage,
      spkNo: penjualan?.noTransaksi ?? '',
      mandorUsername: bankName,
      referenceNo: penjualan?.noTransaksi ?? '',
    };
  });
}

export function validateBsiBatchRows(rows: BsiBatchPaymentRow[]): string[] {
  const errors: string[] = [];
  rows.forEach((row) => {
    const { paymentSubject, additionalMessage } = alignBsiPaymentFields(row.paymentSubject);
    const prefix = `Baris ${row.lineNo} (${paymentSubject})`;
    if (!row.destination.trim()) errors.push(`${prefix}: nomor rekening penerima kosong.`);
    if (!row.beneficiaryAcctName.trim()) errors.push(`${prefix}: nama penerima kosong.`);
    if (!row.bankName.trim()) errors.push(`${prefix}: nama bank penerima kosong.`);
    if (!row.sourceAcct.trim()) errors.push(`${prefix}: rekening sumber kosong.`);
    if (row.amount <= 0) errors.push(`${prefix}: nominal harus lebih dari 0.`);
    if (row.paymentSubject.length > BSI_MAX_PAYMENT_SUBJECT) {
      errors.push(`${prefix}: payment subject melebihi ${BSI_MAX_PAYMENT_SUBJECT} karakter.`);
    }
    if (row.additionalMessage.length > BSI_MAX_ADDITIONAL_MESSAGE) {
      errors.push(
        `${prefix}: additional message melebihi ${BSI_MAX_ADDITIONAL_MESSAGE} karakter.`,
      );
    }
    if (row.additionalMessage !== additionalMessage) {
      errors.push(
        `${prefix}: additional message harus sama dengan payment subject (max ${BSI_MAX_ADDITIONAL_MESSAGE} karakter).`,
      );
    }
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
  const { paymentSubject, additionalMessage } = alignBsiPaymentFields(row.paymentSubject);
  return [
    row.lineNo,
    paymentSubject,
    row.transferType,
    truncateBsiField(row.sourceAcct, BSI_MAX_SOURCE_ACCT),
    row.sourceAcctCcy,
    row.beneficiaryCountry,
    row.beneficiaryType,
    row.destination.trim(),
    row.beneficiaryAcctName.trim(),
    truncateBsiField(row.beneficiaryNotifEmail, BSI_MAX_BENEFICIARY_NOTIF_EMAIL),
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
    additionalMessage,
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

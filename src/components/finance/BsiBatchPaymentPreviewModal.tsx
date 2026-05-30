import { useEffect, useMemo, useState } from 'react';
import Modal from '../shared/Modal';
import { formatRupiah } from '../../utils/formatters';
import {
  alignBsiPaymentFields,
  BSI_MAX_ADDITIONAL_MESSAGE,
  BSI_MAX_PAYMENT_SUBJECT,
  BSI_MAX_SOURCE_ACCT,
  BSI_SOURCE_ACCOUNT_OPTIONS,
  type BsiBatchHeader,
  type BsiBatchPaymentRow,
  type BsiTransferType,
  downloadBsiBatchTxt,
  generateBsiBatchTxt,
  truncateBsiField,
  validateBsiBatchRows,
} from '../../utils/bsiBatchPayment';

interface BsiBatchPaymentPreviewModalProps {
  isOpen: boolean;
  initialRows: BsiBatchPaymentRow[];
  initialHeader: BsiBatchHeader;
  onClose: () => void;
  onGenerated?: (pembayaranIds: number[]) => void | Promise<void>;
  referenceColumnLabel?: string;
}

const fieldInputClass =
  'text-black bg-white placeholder:text-slate-400 border border-slate-200 rounded';

type EditableField = keyof Pick<
  BsiBatchPaymentRow,
  | 'paymentSubject'
  | 'transferType'
  | 'sourceAcct'
  | 'destination'
  | 'beneficiaryAcctName'
  | 'bankName'
  | 'amount'
>;

const BsiBatchPaymentPreviewModal = ({
  isOpen,
  initialRows,
  initialHeader,
  onClose,
  onGenerated,
  referenceColumnLabel = 'SPK',
}: BsiBatchPaymentPreviewModalProps) => {
  const [rows, setRows] = useState<BsiBatchPaymentRow[]>(initialRows);
  const [header, setHeader] = useState<BsiBatchHeader>(initialHeader);

  useEffect(() => {
    if (isOpen) {
      setRows(initialRows);
      setHeader(initialHeader);
    }
  }, [isOpen, initialRows, initialHeader]);

  const validationErrors = useMemo(() => validateBsiBatchRows(rows), [rows]);

  const updateRow = (lineNo: number, field: EditableField, value: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.lineNo !== lineNo) return row;
        if (field === 'amount') {
          const parsed = Number(value.replace(/\D/g, ''));
          return { ...row, amount: Number.isFinite(parsed) ? parsed : 0 };
        }
        if (field === 'transferType') {
          return { ...row, transferType: value as BsiTransferType };
        }
        if (field === 'paymentSubject') {
          const aligned = alignBsiPaymentFields(value);
          return { ...row, ...aligned };
        }
        if (field === 'sourceAcct') {
          return { ...row, sourceAcct: truncateBsiField(value, BSI_MAX_SOURCE_ACCT) };
        }
        return { ...row, [field]: value };
      }),
    );
  };

  const applySourceAcctToAll = (sourceAcct: string) => {
    setRows((prev) => prev.map((row) => ({ ...row, sourceAcct })));
  };

  const handleGenerate = async () => {
    if (validationErrors.length > 0) return;
    const content = generateBsiBatchTxt(rows, header);
    downloadBsiBatchTxt(content, header.paymentDate);
    const pembayaranIds = rows.map((row) => row.pembayaranId);
    await onGenerated?.(pembayaranIds);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Preview Batch Payment BSI"
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <label className="text-xs">
            <span className="font-bold text-slate-500 uppercase">Batch ID</span>
            <input
              type="text"
              value={header.batchId}
              onChange={(e) => setHeader((h) => ({ ...h, batchId: e.target.value }))}
              className={`mt-1 w-full px-2 py-1.5 rounded-lg text-sm ${fieldInputClass}`}
            />
          </label>
          <label className="text-xs">
            <span className="font-bold text-slate-500 uppercase">Tanggal</span>
            <input
              type="date"
              value={header.paymentDate}
              onChange={(e) => setHeader((h) => ({ ...h, paymentDate: e.target.value }))}
              className={`mt-1 w-full px-2 py-1.5 rounded-lg text-sm ${fieldInputClass}`}
            />
          </label>
          <label className="text-xs">
            <span className="font-bold text-slate-500 uppercase">Company ID</span>
            <input
              type="text"
              value={header.companyId}
              onChange={(e) => setHeader((h) => ({ ...h, companyId: e.target.value }))}
              className={`mt-1 w-full px-2 py-1.5 rounded-lg text-sm ${fieldInputClass}`}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Rekening sumber (semua baris)</span>
          {BSI_SOURCE_ACCOUNT_OPTIONS.map((acct) => (
            <button
              key={acct}
              type="button"
              onClick={() => applySourceAcctToAll(acct)}
              className="text-black px-2.5 py-1 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-100"
            >
              {acct}
            </button>
          ))}
        </div>

        {validationErrors.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 space-y-1">
            {validationErrors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[50vh]">
          <table className="w-full min-w-[1100px] text-xs">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="text-[10px] font-bold text-slate-500 uppercase">
                <th className="px-2 py-2 text-left">#</th>
                <th className="px-2 py-2 text-left">{referenceColumnLabel}</th>
                <th className="px-2 py-2 text-left">Payment Subject</th>
                <th className="px-2 py-2 text-left">Transfer</th>
                <th className="px-2 py-2 text-left">Source Acct</th>
                <th className="px-2 py-2 text-left">Destination</th>
                <th className="px-2 py-2 text-left">Beneficiary Name</th>
                <th className="px-2 py-2 text-left">Bank</th>
                <th className="px-2 py-2 text-right">Amount</th>
                <th className="px-2 py-2 text-left">Add. Message</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.pembayaranId} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-semibold">{row.lineNo}</td>
                  <td className="px-2 py-2 text-slate-600 whitespace-nowrap">
                    {row.referenceNo ?? row.spkNo}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.paymentSubject}
                      maxLength={BSI_MAX_PAYMENT_SUBJECT}
                      onChange={(e) => updateRow(row.lineNo, 'paymentSubject', e.target.value)}
                      className={`w-full min-w-[100px] px-1.5 py-1 ${fieldInputClass}`}
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      max {BSI_MAX_PAYMENT_SUBJECT}
                    </p>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={row.transferType}
                      onChange={(e) => updateRow(row.lineNo, 'transferType', e.target.value)}
                      className={`w-full px-1.5 py-1 min-w-[72px] ${fieldInputClass}`}
                    >
                      <option value="BI FAST">BI FAST</option>
                      <option value="ONLINE">ONLINE</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      list="bsi-source-accounts"
                      value={row.sourceAcct}
                      maxLength={BSI_MAX_SOURCE_ACCT}
                      onChange={(e) => updateRow(row.lineNo, 'sourceAcct', e.target.value)}
                      className={`w-full min-w-[110px] px-1.5 py-1 font-mono ${fieldInputClass}`}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.destination}
                      onChange={(e) => updateRow(row.lineNo, 'destination', e.target.value)}
                      className={`w-full min-w-[110px] px-1.5 py-1 font-mono ${fieldInputClass}`}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.beneficiaryAcctName}
                      onChange={(e) => updateRow(row.lineNo, 'beneficiaryAcctName', e.target.value)}
                      className={`w-full min-w-[90px] px-1.5 py-1 ${fieldInputClass}`}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.bankName}
                      onChange={(e) => updateRow(row.lineNo, 'bankName', e.target.value)}
                      className={`w-full min-w-[100px] px-1.5 py-1 ${fieldInputClass}`}
                    />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <input
                      value={row.amount}
                      onChange={(e) => updateRow(row.lineNo, 'amount', e.target.value)}
                      className={`w-full min-w-[90px] px-1.5 py-1 text-right font-mono ${fieldInputClass}`}
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatRupiah(row.amount)}</p>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.additionalMessage}
                      readOnly
                      title="Otomatis dari Payment Subject (max 16 karakter, sesuai template BSI)"
                      className={`w-full min-w-[100px] px-1.5 py-1 bg-slate-50 text-slate-600 ${fieldInputClass}`}
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      max {BSI_MAX_ADDITIONAL_MESSAGE}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <datalist id="bsi-source-accounts">
          {BSI_SOURCE_ACCOUNT_OPTIONS.map((acct) => (
            <option key={acct} value={acct} />
          ))}
        </datalist>

        <p className="text-[10px] text-slate-500">
          Template BSI: Payment Subject max {BSI_MAX_PAYMENT_SUBJECT} karakter, Additional Message
          max {BSI_MAX_ADDITIONAL_MESSAGE} (otomatis = potongan subject). Field tetap: CCY IDR,
          negara ID, Beneficiary Account, email notifikasi, bank code CENAIDJA, citizenship R,
          nationality W, kota tangerang, charge OUR, MESSAGE kosong.
        </p>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="text-black px-4 py-2 text-xs font-bold uppercase border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={validationErrors.length > 0}
            className="px-4 py-2 text-xs font-bold uppercase bg-slate-900 text-white rounded-lg hover:bg-black disabled:opacity-40"
          >
            Generate TXT
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BsiBatchPaymentPreviewModal;

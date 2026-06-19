import { useEffect, useMemo, useState } from 'react';
import Modal from '../shared/Modal';
import { formatRupiah } from '../../utils/formatters';
import type {
  PencairanAjukanPreview,
  PencairanKomponenKey,
} from '../../utils/agentPencairanPreview';
import { calcSelectedPencairanTotal } from '../../utils/agentPencairanPreview';
import type { AgentPencairanData } from '../../services/agentPencairan.service';
import AgentPencairanHistoryTable from './AgentPencairanHistoryTable';
import { Info } from 'lucide-react';

interface AjukanPencairanModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: PencairanAjukanPreview | null;
  saleLabel: string;
  pencairanHistory?: AgentPencairanData[];
  isSubmitting: boolean;
  onConfirm: (selected: Set<PencairanKomponenKey>) => void;
}

const KomponenRow = ({
  label,
  nominalPenuh,
  nominalDicairkan,
  checked,
  disabled,
  onChange,
  alasan,
  muted,
}: {
  label: string;
  nominalPenuh: number;
  nominalDicairkan: number;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  alasan?: string;
  muted?: boolean;
}) => (
  <div
    className={`rounded-xl border p-3 ${
      muted ? 'border-slate-100 bg-slate-50/80' : 'border-blue-100 bg-blue-50/30'
    }`}
  >
    <div className="flex items-start gap-3">
      {onChange != null && (
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-semibold ${muted ? 'text-slate-500' : 'text-slate-800'}`}>
            {label}
          </p>
          <p className={`text-sm font-bold tabular-nums ${muted ? 'text-slate-400' : 'text-slate-900'}`}>
            {nominalDicairkan > 0 ? formatRupiah(nominalDicairkan) : formatRupiah(nominalPenuh)}
          </p>
        </div>
        {alasan && (
          <p className={`text-[11px] mt-1.5 leading-snug ${muted ? 'text-slate-500' : 'text-blue-700'}`}>
            {alasan}
          </p>
        )}
      </div>
    </div>
  </div>
);

const AjukanPencairanModal = ({
  isOpen,
  onClose,
  preview,
  saleLabel,
  pencairanHistory = [],
  isSubmitting,
  onConfirm,
}: AjukanPencairanModalProps) => {
  const [selected, setSelected] = useState<Set<PencairanKomponenKey>>(new Set());

  useEffect(() => {
    if (!preview) return;
    setSelected(new Set(preview.komponenSekarang.map((k) => k.key)));
  }, [preview]);

  const totals = useMemo(() => {
    if (!preview) return null;
    return calcSelectedPencairanTotal(preview, selected);
  }, [preview, selected]);

  const toggleKomponen = (key: PencairanKomponenKey, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleConfirm = () => {
    if (!preview || selected.size === 0) return;
    onConfirm(selected);
  };

  if (!preview) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajukan Pencairan Agent" size="md">
      <div className="p-6 space-y-5">
        <div>
          <p className="text-sm font-semibold text-slate-800">{saleLabel}</p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-600 flex gap-2">
          <Info size={16} className="shrink-0 text-blue-500 mt-0.5" />
          <div className="space-y-1">
            <p>
              Closing fee:{' '}
              <span className="font-bold text-slate-800 tabular-nums">
                {formatRupiah(preview.closingFeeFull)}
              </span>
              {' + '}
              Marketing fee:{' '}
              <span className="font-bold text-slate-800 tabular-nums">
                {formatRupiah(preview.marketingFeeFull)}
              </span>
            </p>
            <p>
              Total fee:{' '}
              <span className="font-bold text-slate-800 tabular-nums">
                {formatRupiah(preview.totalFeeReferensi)}
              </span>
            </p>
            <p>
              Pot. PPh ({preview.potonganPphPct}% × total fee):{' '}
              <span className="font-bold text-red-600 tabular-nums">
                {formatRupiah(preview.potonganPphTotal)}
              </span>
              {preview.potonganPphSudah > 0 && (
                <span className="text-slate-500">
                  {' '}
                  (sudah dipotong {formatRupiah(preview.potonganPphSudah)})
                </span>
              )}
            </p>
            <p>
              Total transfer penuh (total fee − pot. PPh):{' '}
              <span className="font-bold text-emerald-700 tabular-nums">
                {formatRupiah(preview.grandTotalPenuh)}
              </span>
            </p>
            {preview.potonganPph > 0 && (
              <p>
                Pot. PPh pengajuan ini:{' '}
                <span className="font-bold text-red-600 tabular-nums">
                  {formatRupiah(preview.potonganPph)}
                </span>
              </p>
            )}
            <p className="text-slate-500 pt-0.5">{preview.catatanTahap}</p>
          </div>
        </div>

        {pencairanHistory.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Riwayat pengajuan sebelumnya
            </p>
            <AgentPencairanHistoryTable
              records={pencairanHistory}
              compact
              showBukti={false}
            />
          </div>
        )}

        {preview.komponenSekarang.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Pilih komponen yang diajukan
            </p>
            {preview.komponenSekarang.map((k) => (
              <KomponenRow
                key={k.key}
                label={k.label}
                nominalPenuh={k.nominalPenuh}
                nominalDicairkan={k.nominalDicairkan}
                checked={selected.has(k.key)}
                onChange={(checked) => toggleKomponen(k.key, checked)}
                alasan={k.alasan}
              />
            ))}
          </div>
        )}

        {preview.komponenBelum.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Belum bisa diajukan
            </p>
            {preview.komponenBelum.map((k) => (
              <KomponenRow
                key={k.key}
                label={k.label}
                nominalPenuh={k.nominalPenuh}
                nominalDicairkan={0}
                alasan={k.alasan}
                muted
              />
            ))}
          </div>
        )}

        {totals && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 pb-1">
              Pengajuan ini
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Closing diajukan</span>
              <span className="font-medium tabular-nums text-slate-900">{formatRupiah(totals.closingNominal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Marketing diajukan</span>
              <span className="font-medium tabular-nums text-slate-900">{formatRupiah(totals.marketingNominal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal diajukan</span>
              <span className="font-medium tabular-nums text-slate-900">
                {formatRupiah(totals.closingNominal + totals.marketingNominal)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-red-600">
              <span>Pot. PPh (pengajuan ini)</span>
              <span className="font-medium tabular-nums">
                {totals.potonganPph > 0
                  ? `− ${formatRupiah(totals.potonganPph)}`
                  : formatRupiah(0)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-slate-100 pt-2">
              <span className="text-slate-800">Total transfer</span>
              <span className="text-emerald-700 tabular-nums">{formatRupiah(totals.totalTransfer)}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || selected.size === 0}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Mengajukan...' : 'Ajukan ke Finance'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AjukanPencairanModal;

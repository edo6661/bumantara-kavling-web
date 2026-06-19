import Modal from '../shared/Modal';
import AgentPencairanHistoryTable from './AgentPencairanHistoryTable';
import { formatRupiah } from '../../utils/formatters';
import type { AgentPencairanData } from '../../services/agentPencairan.service';
import { summarizePencairanHistory } from '../../utils/agentPencairan';

interface PencairanHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  records: AgentPencairanData[];
  previewUrl: string | null;
  onPreviewBukti: (url: string) => void;
  onClosePreview: () => void;
}

const PencairanHistoryModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  records,
  previewUrl,
  onPreviewBukti,
  onClosePreview,
}: PencairanHistoryModalProps) => {
  const summary = summarizePencairanHistory(records);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
        <div className="p-6 space-y-4">
          {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}

          {records.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-slate-500">Pengajuan</p>
                <p className="text-lg font-black text-slate-900">{summary.jumlahPengajuan}x</p>
              </div>
              <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-green-700">Terbayar</p>
                <p className="text-sm font-bold text-green-800 tabular-nums">
                  {formatRupiah(summary.totalNominalTerbayar)}
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-amber-700">Menunggu</p>
                <p className="text-sm font-bold text-amber-800 tabular-nums">
                  {formatRupiah(summary.totalNominalMenunggu)}
                </p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-blue-700">Komponen diajukan</p>
                <p className="text-[11px] font-semibold text-blue-900 leading-snug">
                  Closing {formatRupiah(summary.totalClosingDiajukan)}
                  <br />
                  Mkt {formatRupiah(summary.totalMarketingDiajukan)}
                </p>
              </div>
            </div>
          )}

          <AgentPencairanHistoryTable
            records={records}
            showInvoice={records.some((r) => r.fileInvoice)}
            onPreviewBukti={onPreviewBukti}
            onPreviewInvoice={onPreviewBukti}
          />

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!previewUrl} onClose={onClosePreview} title="Pratinjau Dokumen">
        {previewUrl && (
          <div className="flex justify-center">
            {previewUrl.toLowerCase().includes('.pdf') ? (
              <iframe src={previewUrl} className="w-full h-[60vh] rounded-lg" title="Bukti PDF" />
            ) : (
              <img src={previewUrl} alt="Bukti" className="max-h-[70vh] rounded-lg" />
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default PencairanHistoryModal;

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Modal from '../shared/Modal';
import BuktiFileThumbnail, { isBuktiPdfUrl } from '../shared/BuktiFileThumbnail';
import type { PemasukanTerbayarDetail } from '../../services/report.service';
import { formatDate, formatRupiah } from '../../utils/formatters';
import { getTagihanFileBuktiList } from '../../utils/tagihanBukti';

type PembayaranTerbayarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  detail: PemasukanTerbayarDetail | null;
  customerNama?: string;
  kavlingLabel?: string;
};

const PembayaranTerbayarModal = ({
  isOpen,
  onClose,
  detail,
  customerNama,
  kavlingLabel,
}: PembayaranTerbayarModalProps) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!detail) return null;

  const buktiList = getTagihanFileBuktiList(detail);

  const handleClose = () => {
    setPreviewImage(null);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Detail Pembayaran"
        size="lg"
      >
        <div className="space-y-5">
          {(customerNama || kavlingLabel) && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
              {customerNama && (
                <p className="text-[13px] font-bold text-slate-800">{customerNama}</p>
              )}
              {kavlingLabel && (
                <p className="text-[11px] text-slate-500 mt-0.5">Kavling {kavlingLabel}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                No. Tagihan
              </p>
              <p className="text-[13px] font-semibold text-slate-800">{detail.noTagihan}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                Jenis Pembayaran
              </p>
              <p className="text-[13px] font-semibold text-slate-800">{detail.pembayaran}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                Nominal
              </p>
              <p className="text-[15px] font-black text-emerald-600">
                {formatRupiah(detail.nominal)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                Jatuh Tempo
              </p>
              <p className="text-[13px] font-semibold text-slate-800">
                {formatDate(detail.jatuhTempo)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                Status
              </p>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 rounded-md">
                <CheckCircle2 size={12} />
                {detail.status === 'LUNAS' ? 'Lunas' : detail.status}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                Tanggal Pembayaran
              </p>
              <p className="text-[13px] font-semibold text-slate-800">
                {formatDate(detail.updatedAt)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              Bukti Pembayaran
            </p>
            {buktiList.length === 0 ? (
              <p className="text-[12px] text-slate-400 italic">Tidak ada bukti pembayaran.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {buktiList.map((url, index) => (
                  <BuktiFileThumbnail
                    key={`${detail.tagihanId}-bukti-${index}`}
                    url={url}
                    onClick={() => setPreviewImage(url)}
                    className="w-24 h-16"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="Bukti Pembayaran"
      >
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              {isBuktiPdfUrl(previewImage) ? (
                <iframe
                  src={previewImage}
                  className="w-full h-[60vh] rounded-lg border-none"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewImage}
                  alt="Preview Bukti"
                  className="max-w-full max-h-[60vh] rounded-lg shadow-xl object-contain"
                />
              )}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a
              href={previewImage || '#'}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
            >
              Buka Layar Penuh
            </a>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-md"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PembayaranTerbayarModal;

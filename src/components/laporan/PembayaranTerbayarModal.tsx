import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Modal from '../shared/Modal';
import BuktiFileThumbnail, { isBuktiPdfUrl } from '../shared/BuktiFileThumbnail';
import type { PemasukanTerbayarDetail } from '../../services/report.service';
import { formatDate, formatTanpaDesimal } from '../../utils/formatters';
import { getTagihanFileBuktiList } from '../../utils/tagihanBukti';

type PembayaranTerbayarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  details: PemasukanTerbayarDetail[];
  customerNama?: string;
  kavlingLabel?: string;
  jenisPembayaran?: string;
};

const PembayaranTerbayarModal = ({
  isOpen,
  onClose,
  details,
  customerNama,
  kavlingLabel,
  jenisPembayaran,
}: PembayaranTerbayarModalProps) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!isOpen || details.length === 0) return null;

  const handleClose = () => {
    setPreviewImage(null);
    onClose();
  };

  const totalNominal = details.reduce((sum, item) => sum + item.nominal, 0);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Detail Pembayaran${jenisPembayaran ? ` — ${jenisPembayaran}` : ''}`}
        size="lg"
      >
        <div className="space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
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

          <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
              {details.length} Pembayaran
            </p>
            <p className="text-[15px] font-black text-emerald-700 tabular-nums">
              {formatTanpaDesimal(totalNominal)}
            </p>
          </div>

          <div className="space-y-4">
            {details.map((detail, index) => {
              const buktiList = getTagihanFileBuktiList(detail);
              return (
                <div
                  key={`${detail.tagihanId}-${index}`}
                  className="rounded-xl border border-slate-100 bg-white p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-bold text-slate-800">
                      {detail.pembayaran}
                    </p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-green-100 text-green-700 rounded-md shrink-0">
                      <CheckCircle2 size={10} />
                      {detail.status === 'LUNAS' ? 'Lunas' : detail.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                        No. Tagihan
                      </p>
                      <p className="text-[12px] font-semibold text-slate-800">{detail.noTagihan}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                        Nominal
                      </p>
                      <p className="text-[13px] font-bold text-emerald-600 tabular-nums">
                        {formatTanpaDesimal(detail.nominal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                        Jatuh Tempo
                      </p>
                      <p className="text-[12px] font-semibold text-slate-800">
                        {formatDate(detail.jatuhTempo)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
                        Tanggal Pembayaran
                      </p>
                      <p className="text-[12px] font-semibold text-slate-800">
                        {formatDate(detail.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Bukti Pembayaran
                    </p>
                    {buktiList.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Tidak ada bukti pembayaran.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {buktiList.map((url, buktiIndex) => (
                          <BuktiFileThumbnail
                            key={`${detail.tagihanId}-bukti-${buktiIndex}`}
                            url={url}
                            onClick={() => setPreviewImage(url)}
                            className="w-24 h-16"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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

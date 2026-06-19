import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Modal from '../shared/Modal';
import BuktiFileThumbnail, { isBuktiPdfUrl } from '../shared/BuktiFileThumbnail';
import type { PemasukanTerbayarDetail } from '../../services/report.service';
import { formatDate, formatTanpaDesimal } from '../../utils/formatters';
import { getTagihanFileBuktiList } from '../../utils/tagihanBukti';

type DetailWithCustomer = PemasukanTerbayarDetail & {
  customerNama?: string;
  kavlingLabel?: string;
  noTransaksi?: string;
};

type PembayaranTerbayarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  details: DetailWithCustomer[];
  customerNama?: string;
  kavlingLabel?: string;
  jenisPembayaran?: string;
  /** Tampilkan customer/kavling per baris (untuk ringkasan agregat). */
  showCustomerPerItem?: boolean;
};

const PembayaranTerbayarModal = ({
  isOpen,
  onClose,
  details,
  customerNama,
  kavlingLabel,
  jenisPembayaran,
  showCustomerPerItem = false,
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
        <div className="space-y-3">
          {!showCustomerPerItem && (customerNama || kavlingLabel) && (
            <p className="text-[12px] text-slate-600">
              {customerNama && <span className="font-bold text-slate-800">{customerNama}</span>}
              {customerNama && kavlingLabel && ' · '}
              {kavlingLabel && <span>Kavling {kavlingLabel}</span>}
            </p>
          )}

          <div className="overflow-auto custom-scrollbar max-h-[65vh] rounded-xl border border-slate-100">
            <table className="w-full text-[12px] border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95">
                  {showCustomerPerItem && (
                    <>
                      <th className="py-2 px-3 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="py-2 px-3 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                        Kavling
                      </th>
                    </>
                  )}
                  <th className="py-2 px-3 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Pembayaran
                  </th>
                  <th className="py-2 px-3 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Nominal
                  </th>
                  <th className="py-2 px-3 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Jatuh Tempo
                  </th>
                  <th className="py-2 px-3 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Tgl Bayar
                  </th>
                  <th className="py-2 px-3 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    Bukti
                  </th>
                </tr>
              </thead>
              <tbody>
                {details.map((detail, index) => {
                  const buktiList = getTagihanFileBuktiList(detail);
                  return (
                    <tr
                      key={`${detail.tagihanId}-${index}`}
                      className="border-b border-slate-50 align-top hover:bg-slate-50/60"
                    >
                      {showCustomerPerItem && (
                        <>
                          <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">
                            {detail.customerNama ?? '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                            {detail.kavlingLabel ?? '-'}
                          </td>
                        </>
                      )}
                      <td className="py-2 px-3 text-slate-800">
                        <p className="font-semibold">{detail.pembayaran}</p>
                        <span className="inline-flex items-center gap-0.5 mt-0.5 text-[10px] font-bold uppercase text-green-700">
                          <CheckCircle2 size={10} />
                          {detail.status === 'LUNAS' ? 'Lunas' : detail.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-600 tabular-nums whitespace-nowrap">
                        {formatTanpaDesimal(detail.nominal)}
                      </td>
                      <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                        {formatDate(detail.jatuhTempo)}
                      </td>
                      <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                        {formatDate(detail.updatedAt)}
                      </td>
                      <td className="py-2 px-3">
                        {buktiList.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {buktiList.map((url, buktiIndex) => (
                              <BuktiFileThumbnail
                                key={`${detail.tagihanId}-bukti-${buktiIndex}`}
                                url={url}
                                onClick={() => setPreviewImage(url)}
                                className="w-12 h-8"
                              />
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50/80 border-t border-emerald-200">
                  <td
                    colSpan={showCustomerPerItem ? 3 : 1}
                    className="py-2 px-3 text-[11px] font-bold text-emerald-800 uppercase tracking-wide"
                  >
                    Total ({details.length} pembayaran)
                  </td>
                  <td className="py-2 px-3 text-right font-black text-emerald-900 tabular-nums">
                    {formatTanpaDesimal(totalNominal)}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
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

import { useParams } from 'react-router-dom';
import { AlertCircle, ShieldCheck, Printer } from 'lucide-react';
import { useVerifyDocument } from '../../hooks/queries/useVerify';
import type { VerifyInvoiceData, VerifySprData } from '../../services/verify.service';
import { formatDate, formatRupiah } from '../../utils/formatters';
import { jsPDF } from "jspdf";
import * as htmlToImage from 'html-to-image';
import QRCode from "react-qr-code";

const VerifyDocument = () => {
  const { id } = useParams<{ id: string }>();
  const { data: documentData, isLoading, isError } = useVerifyDocument(id || '');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-500 font-bold animate-pulse tracking-widest uppercase text-sm">Memverifikasi Dokumen...</p>
      </div>
    );
  }

  if (isError || !documentData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-50">
        <div className="bg-red-50 p-6 rounded-full mb-4">
          <AlertCircle size={64} className="text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dokumen Tidak Valid</h2>
        <p className="text-base text-slate-500 max-w-md mt-3 font-medium">
          Maaf, kami tidak dapat menemukan data dokumen dengan nomor registrasi tersebut di dalam sistem resmi.
        </p>
      </div>
    );
  }

  const { type, data } = documentData;
  const isSpr = type === 'SPR';
  const isKwitansi = type === 'KWITANSI';
  const isInvoice = type === 'INVOICE';

  const invData = data as VerifyInvoiceData;
  const sprData = data as VerifySprData;

  // Setup variable data menyesuaikan jenis dokumen agar rapi
  const docTitle = isSpr ? 'SURAT PESANAN (SPR)' : isKwitansi ? 'BUKTI PEMBAYARAN' : 'TAGIHAN';
  const cleanNoDoc = data.noDokumen.toString().replace(/INV-BF-|INV-DP-|KWT-BF-|KWT-DP-/g, '');
  const tanggalDoc = isSpr ? sprData.tanggalTransaksi : invData.tanggalDibuat;
  const logo = data.kavling.logoPerumahan;
  const perumahanName = data.kavling.perumahan;

  // Fungsi untuk Download PDF (Sama persis mekanismenya)
  const handlePrintPDF = async () => {
    const element = document.getElementById('print-area');
    if (!element) return;

    try {
      // Jeda sejenak agar font & layout render sempurna
      await new Promise(resolve => setTimeout(resolve, 200));

      const scrollWidth = element.scrollWidth;
      const scrollHeight = element.scrollHeight;

      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: scrollWidth,
        height: scrollHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (scrollHeight * pdfWidth) / scrollWidth;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const fileName = `${docTitle.replace(/\s+/g, '_')}_${cleanNoDoc}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Gagal membuat PDF:', error);
      alert('Terjadi kesalahan saat memproses file PDF.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/50 py-12 px-4 font-sans flex flex-col items-center justify-start">

      <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-50 border border-emerald-200 p-5 rounded-t-2xl sm:rounded-2xl mb-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-inner shadow-emerald-700/20">
            <ShieldCheck size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-sm font-black text-emerald-900 tracking-widest uppercase mb-1">DOKUMEN VALID & TERVERIFIKASI</h2>
            <p className="text-xs text-emerald-700 font-medium">Dokumen ini sah dan dilindungi oleh sistem portal.</p>
          </div>
        </div>
        <button
          onClick={handlePrintPDF}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer w-full sm:w-auto shrink-0"
        >
          <Printer size={16} /> Download PDF
        </button>
      </div>

      <div className="w-full max-w-3xl shadow-2xl relative bg-white">
        <div
          id="print-area"
          className="bg-white"
          style={{ width: '100%', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', borderTop: '8px solid #0f172a' }}
        >
          <div className="p-6 flex flex-col min-h-[800px]">

            <div className="flex justify-between items-start border-b-[2px] border-slate-900 pb-4 mb-4 mt-1">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-slate-900 m-0">
                  {docTitle}
                </h2>
                <div className="mt-2 space-y-0.5">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <span className="w-20 inline-block">NO DOC</span>: {cleanNoDoc} / {new Date(tanggalDoc).getFullYear()}
                  </p>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <span className="w-20 inline-block">NO INVOICE</span>: {cleanNoDoc}
                  </p>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <span className="w-20 inline-block">TANGGAL</span>: {formatDate(tanggalDoc)}
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                {logo ? (
                  <img src={logo} alt="Logo" className="h-12 object-contain mb-2" crossOrigin="anonymous" />
                ) : (
                  <h3 className="m-0 text-xl font-black text-slate-900 tracking-tight mb-1">{perumahanName}</h3>
                )}
              </div>
            </div>

            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[9px] text-slate-400 font-black mb-1.5 uppercase tracking-[0.2em]">
                {isKwitansi ? 'Telah Diterima Dari:' : isSpr ? 'Pihak Pemesan:' : 'Ditagihkan Kepada:'}
              </p>
              <p className="font-black text-lg text-slate-900 m-0 mb-0.5">{data.customer.nama}</p>
              <p className="text-xs m-0 mb-0.5 font-bold text-slate-500">{data.customer.noHp || '-'}</p>
              <p className="text-xs m-0 leading-relaxed font-medium text-slate-600 max-w-md">{data.customer.alamat || '-'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden mb-6">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-2.5 px-4 text-left text-[10px] uppercase tracking-widest font-bold">Deskripsi</th>
                    <th className="py-2.5 px-4 text-right text-[10px] uppercase tracking-widest font-bold w-1/3">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-4 px-4 border-b border-slate-100 align-top">
                      <p className="text-base font-black text-slate-900 m-0 mb-2">
                        {isSpr ? 'Pemesanan Unit Kavling (SPR)' : invData.pembayaran}
                      </p>
                      <p className="text-xs text-slate-600 font-medium m-0 mb-0.5">Perumahan: <strong>{perumahanName}</strong></p>
                      <p className="text-xs text-slate-600 font-medium m-0 mb-0.5">
                        Kavling: <strong>{isSpr ? sprData.kavling.blokUnit : `Blok ${invData.kavling.blok} - No. ${invData.kavling.nomorUnit}`}</strong> {data.kavling.tipe ? `(Tipe ${data.kavling.tipe})` : ''}
                      </p>
                      <p className="text-xs text-slate-600 font-medium m-0">
                        Skema Pembayaran: <strong>{isSpr ? sprData.caraPembayaran : invData.transaksi.caraPembayaran?.replace('_', ' ')}</strong>
                      </p>
                    </td>
                    <td className="py-4 px-4 border-b border-slate-100 text-right align-top text-lg font-black text-slate-900">
                      {formatRupiah(isSpr ? sprData.hargaJual : invData.nominal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-row justify-between items-start gap-6 mb-6">

              <div className="flex-1">
                {(isInvoice || isKwitansi) && invData.kavling.rekeningTujuan && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                      {isKwitansi ? 'Pembayaran Ditransfer Ke:' : 'Transfer Pembayaran Ke:'}
                    </span>
                    <p className="text-xs font-bold text-slate-900 uppercase">Bank {invData.kavling.rekeningTujuan.namaBank}</p>
                    <p className="text-lg font-black text-slate-900 my-0.5 font-mono tracking-tight">{invData.kavling.rekeningTujuan.noRekening}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">A/N: {invData.kavling.rekeningTujuan.atasNama}</p>
                  </div>
                )}
                {isSpr && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 inline-block w-full">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                      Status Kesepakatan Penjualan:
                    </span>
                    <p className={`text-sm font-black uppercase tracking-widest ${sprData.status === 'BATAL' ? 'text-red-600' : 'text-blue-600'}`}>
                      {sprData.status}
                    </p>
                  </div>
                )}
              </div>

              <div className="w-[280px] space-y-3">


                {isSpr && (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>Booking Fee</span>
                      <span className="text-slate-800 text-xs">{formatRupiah(sprData.bookingFee || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>Down Payment (DP)</span>
                      <span className="text-slate-800 text-xs">{formatRupiah(sprData.dp || 0)}</span>
                    </div>
                  </div>
                )}

                <div className={`flex justify-between items-center p-4 rounded-xl border-2 ${isKwitansi ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-900 border-slate-900 text-white'}`}>
                  <span className="text-xs font-black uppercase tracking-[0.2em]">{isSpr ? 'Harga Jual' : 'Total'}</span>
                  <span className="text-xl font-black">{formatRupiah(isSpr ? sprData.hargaJual : invData.nominal)}</span>
                </div>
              </div>
            </div>

            <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl text-[9px] text-slate-600 leading-relaxed text-left">
              <p className="font-bold text-slate-800 mb-1 uppercase tracking-widest">Catatan:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Harga jual pembelian unit rumah sudah termasuk biaya AJB, Sertipikat, IMB, Listrik, BPHTB, dan Notaris.</li>
                <li>Harga jual khusus pembelian kavling belum termasuk biaya BPHTB, PPJB, AJB, Sertipikat dan Biaya Mutasi PBB.</li>
                <li>Apabila terjadi pembatalan, uang tanda jadi (Booking Fee) tidak dapat dikembalikan / hangus.</li>
              </ul>
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-slate-100 mt-auto">
              <div className="flex flex-col items-center p-2 border border-slate-200 rounded-xl bg-slate-50 shadow-sm">
                <div style={{ background: 'white', padding: '3px', borderRadius: '6px' }}>
                  <QRCode
                    value={`${window.location.origin}/verify/${data.noDokumen}`}
                    size={60}
                    level="H"
                  />
                </div>
                <span className="text-[8px] text-slate-500 mt-2 font-bold tracking-widest uppercase">Scan Validasi</span>
                <span className="text-[9px] text-slate-800 font-bold mt-0.5 tracking-wide">www.purisafana.com</span>
                <span className="text-[8px] text-slate-500 mt-2 font-bold tracking-widest uppercase">Hormat Kami,</span>
                <span className="text-[10px] text-slate-900 font-black mt-0.5 tracking-wide uppercase">
                  {data.pembuat}
                </span>
              </div>


            </div>




          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyDocument;
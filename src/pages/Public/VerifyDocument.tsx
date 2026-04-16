import { useParams } from 'react-router-dom';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { useVerifyDocument } from '../../hooks/queries/useVerify';
import type { VerifyInvoiceData, VerifySprData } from '../../services/verify.service';
import { formatDate, formatRupiah } from '../../utils/formatters';

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
          Maaf, kami tidak dapat menemukan data dokumen dengan nomor registrasi tersebut di dalam sistem resmi .
        </p>
      </div>
    );
  }

  const { type, data } = documentData;

  const renderHeader = (docType: string, noDokumen: string, tanggal: string, logo: string | undefined, perumahanNama: string) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-[3px] border-slate-900 pb-6 mb-8 gap-6">
      <div className="order-2 sm:order-1">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-slate-900 m-0">
          {docType}
        </h2>
        <div className="mt-3 space-y-1">
          <p className="text-slate-500 text-sm font-bold flex items-center gap-2">
            <span className="w-16 inline-block text-slate-400">NO DOC</span> : <span className="text-slate-900">{noDokumen}</span>
          </p>
          <p className="text-slate-500 text-sm font-bold flex items-center gap-2">
            <span className="w-16 inline-block text-slate-400">TANGGAL</span> : <span className="text-slate-900">{formatDate(tanggal)}</span>
          </p>
        </div>
      </div>
      <div className="order-1 sm:order-2 text-left sm:text-right flex flex-col items-start sm:items-end w-full sm:w-auto">
        {logo ? (
          <img src={logo} alt="Logo Perumahan" className="h-16 md:h-20 object-contain mb-3" />
        ) : (
          <h3 className="m-0 text-2xl font-black text-slate-900 tracking-tight">{perumahanNama}</h3>
        )}
        <p className="m-0 text-xs text-slate-500 font-bold uppercase tracking-widest">Divisi Marketing & Keuangan</p>
      </div>
    </div>
  );

  const renderInvoice = (invData: VerifyInvoiceData, docType: string) => {
    const isLunas = invData.status === 'LUNAS';

    return (
      <div className="space-y-6 text-left">
        {renderHeader(docType, invData.noDokumen, invData.tanggalDibuat, invData.kavling.logoPerumahan, invData.kavling.perumahan)}

        {/* Data Customer & Kavling Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <p className="text-[10px] text-slate-400 font-black mb-2 uppercase tracking-[0.2em]">
              {isLunas ? 'Telah Diterima Dari :' : 'Ditagihkan Kepada :'}
            </p>
            <p className="font-black text-xl text-slate-900 m-0 mb-1">{invData.customer.nama}</p>
            <p className="text-sm m-0 mb-1 font-bold text-slate-500">{invData.customer.noHp || '-'}</p>
            <p className="text-sm m-0 leading-relaxed font-medium text-slate-600">{invData.customer.alamat || '-'}</p>
          </div>
          <div className="md:border-l border-slate-200 md:pl-8">
            <p className="text-[10px] text-slate-400 font-black mb-2 uppercase tracking-[0.2em]">Informasi Unit :</p>
            <p className="font-black text-lg text-slate-900 m-0 mb-1">{invData.kavling.perumahan}</p>
            <p className="text-sm m-0 mb-1 font-bold text-slate-700">Blok {invData.kavling.blok} - No. {invData.kavling.nomorUnit}</p>
            <p className="text-sm m-0 font-medium text-slate-600">Tipe {invData.kavling.tipe}</p>
          </div>
        </div>

        {/* Tabel Deskripsi */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-4 px-6 text-left text-xs uppercase tracking-widest font-bold">Deskripsi Pembayaran</th>
                <th className="py-4 px-6 text-right text-xs uppercase tracking-widest font-bold w-1/3">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-8 px-6 border-b border-slate-100 align-top bg-white">
                  <p className="text-lg font-black text-slate-900 m-0 mb-2">{invData.pembayaran}</p>
                  <p className="text-sm text-slate-500 font-medium m-0">Skema: <strong>{invData.transaksi.caraPembayaran}</strong> {invData.transaksi.bank ? `(${invData.transaksi.bank})` : ''}</p>
                </td>
                <td className="py-8 px-6 border-b border-slate-100 text-right align-top text-xl font-black text-slate-900 bg-white">
                  {formatRupiah(invData.nominal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-8 items-start">
          <div className="w-full md:w-1/2">
            {invData.kavling.rekeningTujuan && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">
                  {isLunas ? 'Pembayaran Ditransfer Ke:' : 'Transfer Pembayaran Ke:'}
                </span>
                <p className="text-sm font-bold text-slate-900 uppercase">Bank {invData.kavling.rekeningTujuan.namaBank}</p>
                <p className="text-2xl font-black text-slate-900 my-1 font-mono tracking-tight">{invData.kavling.rekeningTujuan.noRekening}</p>
                <p className="text-xs font-bold text-slate-500 uppercase mt-2">A/N: {invData.kavling.rekeningTujuan.atasNama}</p>
              </div>
            )}
          </div>

          <div className="w-full md:w-[400px] space-y-4">
            {(invData.pembayaran.toLowerCase().includes('booking') || invData.pembayaran.toLowerCase().includes('dp')) && (
              <div className="space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span>Harga Jual Unit</span>
                  <span className="text-slate-800 text-sm">{formatRupiah(invData.transaksi.hargaJual)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span>Sisa Belum Dibayar</span>
                  <span className="text-orange-600 text-sm">
                    {formatRupiah(invData.transaksi.sisaBelumDibayar)}
                  </span>
                </div>
              </div>
            )}

            <div className={`flex justify-between items-center p-6 rounded-2xl border-2 ${isLunas ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-900 border-slate-900 text-white'}`}>
              <span className="text-sm font-black uppercase tracking-[0.2em]">
                {isLunas ? 'Total Lunas' : 'Total'}
              </span>
              <span className="text-2xl font-black">
                {formatRupiah(invData.nominal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSpr = (sprData: VerifySprData) => (
    <div className="space-y-6 text-left">
      {renderHeader('SURAT PESANAN', sprData.noDokumen, sprData.tanggalTransaksi, sprData.kavling.logoPerumahan, sprData.kavling.perumahan)}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <div>
          <p className="text-[10px] text-slate-400 font-black mb-2 uppercase tracking-[0.2em]">Pihak Pemesan :</p>
          <p className="font-black text-xl text-slate-900 m-0 mb-1">{sprData.customer.nama}</p>
          <p className="text-sm m-0 mb-1 font-bold text-slate-500">{sprData.customer.noHp || '-'}</p>
          <p className="text-sm m-0 leading-relaxed font-medium text-slate-600">{sprData.customer.alamat || '-'}</p>
        </div>
        <div className="md:border-l border-slate-200 md:pl-8">
          <p className="text-[10px] text-slate-400 font-black mb-2 uppercase tracking-[0.2em]">Detail Kavling Pesanan :</p>
          <p className="font-black text-lg text-slate-900 m-0 mb-1">{sprData.kavling.perumahan}</p>
          <p className="text-sm m-0 mb-1 font-bold text-slate-700">{sprData.kavling.blokUnit} <span className="font-medium text-slate-500">(Tipe {sprData.kavling.tipe})</span></p>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Status Penjualan</p>
            <p className={`text-sm font-black uppercase tracking-widest ${sprData.status === 'BATAL' ? 'text-red-600' : 'text-blue-600'}`}>{sprData.status}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-8">
        <div className="w-full md:w-[450px] p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span>Skema Pembiayaan</span>
            <span className="text-slate-900">{sprData.caraPembayaran} {sprData.bank ? `(${sprData.bank})` : ''}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span>Booking Fee</span>
            <span className="text-slate-900">{formatRupiah(sprData.bookingFee)}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span>Down Payment (DP)</span>
            <span className="text-slate-900">{formatRupiah(sprData.dp)}</span>
          </div>
          <div className="pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center p-5 bg-slate-900 text-white rounded-xl shadow-lg">
              <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-200">
                Harga Kesepakatan
              </span>
              <span className="text-xl font-black">{formatRupiah(sprData.hargaJual)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/50 py-12 px-4 font-sans flex justify-center items-start">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 relative">
        {/* Banner Garis Atas */}
        <div className="h-2 w-full bg-slate-900"></div>

        <div className="p-8 md:p-12">
          {/* Lencana Validasi (Lebih Mewah) */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl mb-12 shadow-sm">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-inner shadow-emerald-700/20">
              <ShieldCheck size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-sm font-black text-emerald-900 tracking-widest uppercase mb-1">DOKUMEN VALID & TERVERIFIKASI</h2>
              <p className="text-xs text-emerald-700 font-medium">Dokumen ini diterbitkan secara sah dan dilindungi oleh sistem portal .</p>
            </div>
          </div>

          {/* Isi Konten Dinamis */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {type === 'INVOICE' || type === 'KWITANSI'
              ? renderInvoice(data as VerifyInvoiceData, type)
              : renderSpr(data as VerifySprData)}
          </div>

          {/* Tanda Tangan Footer untuk semua dokumen */}
          <div className="flex justify-end text-center mt-16 pt-8 border-t border-slate-100">
            <div className="w-[250px]">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-20">
                Tangerang, {formatDate(type === 'SPR' ? (data as VerifySprData).tanggalTransaksi : (data as VerifyInvoiceData).tanggalDibuat)}
              </p>
              <p className="text-sm font-black text-slate-900 uppercase tracking-widest border-b-[2px] border-slate-900 pb-2 inline-block">
                {type === 'SPR' ? 'Divisi Marketing' : 'Divisi Keuangan'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyDocument;
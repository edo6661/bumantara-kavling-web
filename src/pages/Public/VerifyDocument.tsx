import React from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useVerifyDocument } from '../../hooks/queries/useVerify';
import type { VerifyInvoiceData, VerifySprData } from '../../services/verify.service';
import { formatDate, formatRupiah } from '../../utils/formatters';

const VerifyDocument = () => {
  const { id } = useParams<{ id: string }>();
  const { data: documentData, isLoading, isError } = useVerifyDocument(id || '');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-500 font-bold animate-pulse tracking-widest uppercase text-sm">Memverifikasi Dokumen...</p>
      </div>
    );
  }

  if (isError || !documentData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-50">
        <AlertCircle size={56} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dokumen Tidak Valid</h2>
        <p className="text-sm text-slate-500 max-w-sm mt-2 font-medium">
          Maaf, kami tidak dapat menemukan data dokumen dengan nomor seri tersebut di dalam sistem server Bumantara.
        </p>
      </div>
    );
  }

  const { type, data } = documentData;

  const renderInvoice = (invData: VerifyInvoiceData, docType: string) => {
    const isLunas = invData.status === 'LUNAS';

    return (
      <div className="space-y-6 text-left">
        {/* Header Dokumen */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-6">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-widest text-slate-900 m-0">
              {docType}
            </h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">No: {invData.noDokumen}</p>
            <p className="text-slate-500 text-sm mt-1 font-medium">Tanggal: {formatDate(invData.tanggalDibuat)}</p>
          </div>
          <div className="text-right">
            <h3 className="m-0 text-xl font-bold text-slate-900">BUMANTARA</h3>
            <p className="m-0 mt-1 text-xs text-slate-500 font-bold">Divisi Marketing & Keuangan</p>
          </div>
        </div>

        {/* Data Customer */}
        <div className="mb-6">
          <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">
            {isLunas ? 'Telah Diterima Dari:' : 'Ditagihkan Kepada:'}
          </p>
          <p className="font-black text-lg text-slate-800 m-0 mb-1">{invData.customer.nama}</p>
          <p className="text-sm m-0 mb-1 font-medium text-slate-600">{invData.customer.noHp || '-'}</p>
          <p className="text-sm m-0 leading-relaxed font-medium text-slate-600">{invData.customer.alamat || '-'}</p>
        </div>

        {/* Tabel Deskripsi */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr>
              <th className="py-3 px-4 text-left bg-slate-50 text-slate-600 text-xs uppercase border-y border-slate-300">Deskripsi Pembayaran</th>
              <th className="py-3 px-4 text-right bg-slate-50 text-slate-600 text-xs uppercase border-y border-slate-300">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-6 px-4 border-b border-slate-200 align-top">
                <p className="text-base font-bold text-slate-900 m-0 mb-3">{invData.pembayaran}</p>
                <p className="text-sm text-slate-600 font-medium m-0 mb-1.5">Perumahan: <strong>{invData.kavling.perumahan}</strong></p>
                <p className="text-sm text-slate-600 font-medium m-0 mb-1.5">Kavling: <strong>Blok {invData.kavling.blok} - No. {invData.kavling.nomorUnit}</strong> (Tipe {invData.kavling.tipe})</p>
                <p className="text-sm text-slate-600 font-medium m-0">Skema: <strong>{invData.transaksi.caraPembayaran}</strong> {invData.transaksi.bank ? `(${invData.transaksi.bank})` : ''}</p>
              </td>
              <td className="py-6 px-4 border-b border-slate-200 text-right align-top text-lg font-black text-slate-900">
                {formatRupiah(invData.nominal)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Ringkasan Biaya */}
        <div className="flex justify-end mb-8">
          <div className="w-full sm:w-[350px]">
            {/* Tampilkan Sisa Harga khusus tagihan Booking Fee/DP */}
            {(invData.pembayaran.toLowerCase().includes('booking') || invData.pembayaran.toLowerCase().includes('dp')) && (
              <div className="mb-4 space-y-2.5 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wide">
                  <span>Harga Jual Unit</span>
                  <span className="text-slate-800 text-sm">{formatRupiah(invData.transaksi.hargaJual)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wide">
                  <span>Sisa Belum Dibayar</span>
                  <span className="text-orange-600 text-sm">
                    {formatRupiah(invData.transaksi.sisaBelumDibayar)}
                  </span>
                </div>
              </div>
            )}

            <div className={`flex justify-between items-center p-4 rounded-lg border ${isLunas ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 border-slate-200'}`}>
              <span className={`text-sm font-bold uppercase tracking-widest ${isLunas ? 'text-emerald-700' : 'text-slate-600'}`}>
                {isLunas ? 'Total Pembayaran' : 'Total Tagihan'}
              </span>
              <span className={`text-xl font-black ${isLunas ? 'text-emerald-900' : 'text-slate-900'}`}>
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
      <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-widest text-slate-900 m-0">
            SURAT PESANAN
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">No: {sprData.noDokumen}</p>
          <p className="text-slate-500 text-sm mt-1 font-medium">Tanggal: {formatDate(sprData.tanggalTransaksi)}</p>
        </div>
        <div className="text-right">
          <h3 className="m-0 text-xl font-bold text-slate-900">BUMANTARA</h3>
          <p className="m-0 mt-1 text-xs text-slate-500 font-bold">Divisi Marketing & Keuangan</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Pihak Pemesan:</p>
        <p className="font-black text-lg text-slate-800 m-0 mb-1">{sprData.customer.nama}</p>
        <p className="text-sm m-0 mb-1 font-medium text-slate-600">{sprData.customer.noHp || '-'}</p>
        <p className="text-sm m-0 leading-relaxed font-medium text-slate-600">{sprData.customer.alamat || '-'}</p>
      </div>

      <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 mb-6">
        <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Detail Kavling Pesanan</h4>
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Perumahan</p>
            <p className="text-sm font-black text-slate-800">{sprData.kavling.perumahan}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Blok - Unit</p>
            <p className="text-sm font-black text-slate-800">{sprData.kavling.blokUnit} <span className="font-semibold text-slate-600">(Tipe {sprData.kavling.tipe})</span></p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Skema Pembiayaan</p>
            <p className="text-sm font-black text-slate-800">{sprData.caraPembayaran} {sprData.bank ? `(${sprData.bank})` : ''}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status Penjualan</p>
            <p className={`text-sm font-black uppercase tracking-wider ${sprData.status === 'BATAL' ? 'text-red-600' : 'text-blue-600'}`}>{sprData.status}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-8">
        <div className="w-full sm:w-[350px]">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5 px-4">
            <span>Booking Fee</span>
            <span className="text-slate-800 text-sm">{formatRupiah(sprData.bookingFee)}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 px-4">
            <span>Down Payment (DP)</span>
            <span className="text-slate-800 text-sm">{formatRupiah(sprData.dp)}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-lg shadow-md">
            <span className="text-sm font-bold uppercase tracking-widest text-slate-200">
              Harga Kesepakatan
            </span>
            <span className="text-xl font-black">{formatRupiah(sprData.hargaJual)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/50 py-8 px-4 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-8 md:p-10">

          {/* Lencana Validasi (Simple & Elegan) */}
          <div className="flex justify-center items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-10">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-black text-emerald-800 tracking-tight">DOKUMEN VALID & RESMI</h2>
              <p className="text-xs text-emerald-600 font-bold">Diterbitkan oleh sistem Bumantara.</p>
            </div>
          </div>

          {/* Isi Konten Dinamis */}
          {type === 'INVOICE' || type === 'KWITANSI'
            ? renderInvoice(data as VerifyInvoiceData, type)
            : renderSpr(data as VerifySprData)}

          {/* Tanda Tangan Footer untuk semua dokumen */}
          <div className="flex justify-end text-center mt-12">
            <div className="w-[200px]">
              <p className="text-sm font-medium text-slate-600 m-0 mb-16">
                Tangerang, {formatDate(type === 'SPR' ? (data as VerifySprData).tanggalTransaksi : (data as VerifyInvoiceData).tanggalDibuat)}
              </p>
              <p className="text-sm font-black text-slate-900 m-0 underline">
                {type === 'SPR' ? 'Divisi Marketing' : 'Divisi Keuangan'}
              </p>
              <p className="text-xs font-bold text-slate-400 mt-1 m-0">Bumantara</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VerifyDocument;
import React from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  FileText,
  User,
  Building2,
  CalendarClock,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { useVerifyDocument } from '../../hooks/queries/useVerify';
import type { VerifyInvoiceData, VerifySprData } from '../../services/verify.service';
import { formatDate, formatRupiah } from '../../utils/formatters';
const VerifyDocument = () => {
  const { id } = useParams<{ id: string }>();
  const { data: documentData, isLoading, isError } = useVerifyDocument(id || '');
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-slate-500 animate-pulse">Memverifikasi Dokumen...</p>
      </div>
    );
  }
  if (isError || !documentData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Dokumen Tidak Valid</h2>
        <p className="text-sm text-slate-500 max-w-xs mt-2">
          Maaf, kami tidak dapat menemukan data dokumen dengan nomor seri tersebut di dalam sistem Bumantara.
        </p>
      </div>
    );
  }
  const { type, data } = documentData;
  const renderInvoice = (invData: VerifyInvoiceData) => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status Pembayaran</p>
        <span className={`inline-block px-4 py-1.5 rounded-lg text-sm font-bold tracking-widest uppercase shadow-sm ${invData.status === 'LUNAS'
          ? 'bg-green-100 text-green-700 border border-green-200'
          : 'bg-orange-100 text-orange-700 border border-orange-200'
          }`}>
          {invData.status}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <FileText size={12} /> Keterangan Tagihan
          </p>
          <p className="text-base font-bold text-slate-900">{invData.pembayaran}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <User size={12} /> Customer
          </p>
          <p className="text-base font-bold text-slate-900">{invData.customer.nama}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Building2 size={12} /> Unit Kavling
          </p>
          <p className="text-sm font-semibold text-slate-800">{invData.kavling}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <CalendarClock size={12} /> Jatuh Tempo
            </p>
            <p className="text-sm font-semibold text-slate-800">{formatDate(invData.jatuhTempo)}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <CreditCard size={12} /> Nominal
            </p>
            <p className="text-sm font-black text-slate-900">{formatRupiah(invData.nominal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
  const renderSpr = (sprData: VerifySprData) => (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status Penjualan</p>
        <span className={`inline-block px-4 py-1.5 rounded-lg text-sm font-bold tracking-widest uppercase shadow-sm ${sprData.status === 'BATAL'
          ? 'bg-red-100 text-red-700 border border-red-200'
          : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
          {sprData.status}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <User size={12} /> Customer / Pemesan
          </p>
          <p className="text-base font-bold text-slate-900">{sprData.customer.nama}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Building2 size={12} /> Unit Dipesan
          </p>
          <p className="text-sm font-bold text-slate-900">{sprData.kavling.perumahan}</p>
          <p className="text-sm text-slate-600">{sprData.kavling.blokUnit} - Tipe {sprData.kavling.tipe}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <CalendarClock size={12} /> Tgl. Transaksi
            </p>
            <p className="text-sm font-semibold text-slate-800">{formatDate(sprData.tanggalTransaksi)}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <CreditCard size={12} /> Metode
            </p>
            <p className="text-sm font-bold text-slate-900">{sprData.caraPembayaran}</p>
          </div>
        </div>
        <div className="bg-slate-900 p-5 rounded-xl shadow-md mt-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Harga Jual Kesepakatan</p>
          <p className="text-2xl font-black text-white">{formatRupiah(sprData.hargaJual)}</p>
        </div>
      </div>
    </div>
  );
  return (
    <div className="max-w-md mx-auto my-8 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      <div className="p-6 md:p-8">
        {/* Header Status Valid */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-sm ring-8 ring-emerald-50">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Dokumen Valid & Resmi</h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-[250px] leading-relaxed">
            Dokumen ini diterbitkan secara sah oleh sistem.
          </p>
        </div>
        {/* Info Nomor Dokumen */}
        <div className="mb-6 pb-6 border-b border-dashed border-slate-200 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Dokumen</p>
          <p className="text-sm font-mono font-bold text-slate-800 bg-slate-100 py-2 px-4 rounded-lg inline-block border border-slate-200">
            {data.noDokumen}
          </p>
        </div>
        {/* Konten Spesifik berdasarkan Tipe (SPR / Invoice) */}
        {type === 'INVOICE' ? renderInvoice(data as VerifyInvoiceData) : renderSpr(data as VerifySprData)}
      </div>
      {/* Footer */}
      <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diterbitkan Oleh</p>
        <h3 className="font-black text-sm text-slate-800 tracking-tight mt-0.5">BUMANTARA</h3>
      </div>
    </div>
  );
};
export default VerifyDocument;
/* eslint-disable @typescript-eslint/no-explicit-any */
// <file path="src/pages/Customer/Kavling.tsx">
import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import { formatRupiah, formatDate } from "../../utils/formatters";
import { useGetCustomerKavlings, useUpdateCustomerKavling } from "../../hooks/queries/useCustomerKavling";
import { useGetNotaris } from '../../hooks/queries/useNotaris';
import { useGetTagihans } from '../../hooks/queries/useTagihan';
import CurrencyInput from '../../components/shared/CurrencyInput';
interface KavlingData {
  id: string;
  perumahan: string;
  status: string;
  statusKavling: string;
  lantai: string;
  blok: string;
  unit: string;
  tipe: string;
  luasBangunan: string | number;
  luasTanah: string | number;
  lokasiStrategis: string;
  tanggalAkadPpjb: string;
  akadPpjb: string;
  tanggalAkadAjbPpat: string;
  tanggalPembayaranPph: string;
  tanggalPembayaranBphtb: string;
  pembiayaan: string;
  sp3r: string;
  hargaDasarKavling: number; // Tambahan Baru dari UseCase
  diskonPenjualan: number;   // Tambahan Baru dari UseCase
  lebihTanah: number;
  biayaStrategis: number;
  totalHargaJual: number;
  nrBiayaKprAsuransi: number;
  nrDiskonAngsuran: number;
  nrDiskonCash: number;
  nrBiayaBbn: number;
  nrBiayaNotarisAjb: number;
  nrBiayaNotarisPpjb: number;
  nrBiayaAppraisal: number;
  nrBiayaBphtb: number;
  nrLainLain: number;
  nrTotalSubsidi: number;
  nrNilaiPenyerahan: number;
  nrPpn: number;
  nrBphtb: number;
  nrPph: number;
  pjBiayaKpr: number;
  pjBiayaAsuransi: number;
  pjDiskonAngsuran: number;
  pjBiayaBbn: number;
  pjBiayaAjb: number;
  pjBiayaAppraisal: number;
  pjBphtb: number;
  pjLainLain: number;
  pjTotalSubsidi: number;
  pjNilaiPenyerahan: number;
  pjPpn: number;
  pjBphtbPajak: number;
  pjPph: number;
  pjTotalBphtbPph: number;
  ajbNjopTanahPerMeter: number;
  ajbNjopTanah: number;
  ajbNjopBangunanPerMeter: number;
  ajbNjopBangunan: number;
  ajbNjopTotal: number;
  ajbPpn: number;
  ajbBphtb: number;
  ajbPph: number;
  ajbTotalBphtbPph: number;
  ajbSelisihPajakPbb: number;
  ajbUping: number;
  rekeningTujuanId: number;
  notarisId: number | string;
}

const initialFormState: KavlingData = {
  id: '',
  rekeningTujuanId: 0,
  perumahan: '', status: '', statusKavling: 'AVAILABLE', lantai: '', blok: '', unit: '', tipe: '', luasBangunan: '', luasTanah: '', lokasiStrategis: '',
  tanggalAkadPpjb: '', akadPpjb: '', tanggalAkadAjbPpat: '', tanggalPembayaranPph: '', tanggalPembayaranBphtb: '', pembiayaan: '', sp3r: '',
  hargaDasarKavling: 0, diskonPenjualan: 0, lebihTanah: 0, biayaStrategis: 0, totalHargaJual: 0,
  nrBiayaKprAsuransi: 0, nrDiskonAngsuran: 0, nrDiskonCash: 0, nrBiayaBbn: 0, nrBiayaNotarisAjb: 0, nrBiayaNotarisPpjb: 0, nrBiayaAppraisal: 0, nrBiayaBphtb: 0, nrLainLain: 0, nrTotalSubsidi: 0, nrNilaiPenyerahan: 0, nrPpn: 0, nrBphtb: 0, nrPph: 0,
  pjBiayaKpr: 0, pjBiayaAsuransi: 0, pjDiskonAngsuran: 0, pjBiayaBbn: 0, pjBiayaAjb: 0, pjBiayaAppraisal: 0, pjBphtb: 0, pjLainLain: 0, pjTotalSubsidi: 0, pjNilaiPenyerahan: 0, pjPpn: 0, pjBphtbPajak: 0, pjPph: 0, pjTotalBphtbPph: 0,
  ajbNjopTanahPerMeter: 0, ajbNjopTanah: 0, ajbNjopBangunanPerMeter: 0, ajbNjopBangunan: 0, ajbNjopTotal: 0, ajbPpn: 0, ajbBphtb: 0, ajbPph: 0, ajbTotalBphtbPph: 0, ajbSelisihPajakPbb: 0, ajbUping: 0,
  notarisId: '',
};

const CustomerKavling = () => {

  const { data: apiData = [], isLoading } = useGetCustomerKavlings({ limit: 300 });
  const { data: tagihans = [], isLoading: isLoadingTagihan } = useGetTagihans({ limit: 300 });
  const { data: notarisList = [] } = useGetNotaris();
  const updateMutation = useUpdateCustomerKavling();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const [activeTab, setActiveTab] = useState<'dasar' | 'harga' | 'nilai' | 'pajak' | 'ajb' | 'notaris'>('dasar');

  const columns = [
    { header: 'Nama Customer', accessor: 'namaCustomer', render: (val: string) => val },
    { header: 'Blok', accessor: 'blok', render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
    { header: 'No', accessor: 'unit', render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
    { header: 'Tipe', accessor: 'tipe' },
    { header: 'Harga Jual', accessor: 'totalHargaJual', render: (val: number) => formatRupiah(val) }, {
      header: 'Status Penjualan',
      accessor: 'status',
      render: (val: string) => {
        let style = 'bg-gray-100 text-gray-800';
        if (val?.toUpperCase() === 'AVAILABLE') style = 'bg-green-100 text-green-800';
        if (val?.toUpperCase() === 'BOOKED' || val?.toUpperCase() === 'BOOKING') style = 'bg-blue-100 text-blue-800';
        if (val?.toUpperCase() === 'PROSES') style = 'bg-yellow-100 text-yellow-800';
        if (val?.toUpperCase() === 'LUNAS' || val?.toUpperCase() === 'TERJUAL') style = 'bg-emerald-100 text-emerald-800';

        return <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${style}`}>{val}</span>;
      }
    },
  ];

  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  };

  const openModal = (item: any) => {
    setFormData({
      ...item,
      nrBiayaNotarisPpjb: item.nrBiayaNotarisPpjb || 0,
      hargaDasarKavling: item.hargaDasarKavling || 0,
      diskonPenjualan: item.diskonPenjualan || 0,
      totalHargaJual: item.totalHargaJual || 0,
      tanggalAkadPpjb: formatDateForInput(item.tanggalAkadPpjb),
      tanggalAkadAjbPpat: formatDateForInput(item.tanggalAkadAjbPpat),
      tanggalPembayaranPph: formatDateForInput(item.tanggalPembayaranPph),
      tanggalPembayaranBphtb: formatDateForInput(item.tanggalPembayaranBphtb),
    });
    setErrors({});
    setActiveTab('dasar');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
  };

  const calculateDerivedFields = (currentData: KavlingData): KavlingData => {
    const d = { ...currentData };

    // Total Harga Akhir yang dinamis (Harga Jual dari Penjualan + Lebih Tanah + Biaya Strategis)
    const hargaBase = (Number(d.totalHargaJual) || 0) + (Number(d.lebihTanah) || 0) + (Number(d.biayaStrategis) || 0);

    d.nrTotalSubsidi = (Number(d.nrBiayaKprAsuransi) || 0) + (Number(d.nrDiskonAngsuran) || 0) + (Number(d.nrDiskonCash) || 0) + (Number(d.nrBiayaBbn) || 0) + (Number(d.nrBiayaNotarisAjb) || 0) + (Number(d.nrBiayaNotarisPpjb) || 0) + (Number(d.nrBiayaAppraisal) || 0) + (Number(d.nrBiayaBphtb) || 0) + (Number(d.nrLainLain) || 0);
    d.nrNilaiPenyerahan = hargaBase - d.nrTotalSubsidi;
    d.pjTotalSubsidi = (Number(d.pjBiayaKpr) || 0) + (Number(d.pjBiayaAsuransi) || 0) + (Number(d.pjDiskonAngsuran) || 0) + (Number(d.pjBiayaBbn) || 0) + (Number(d.pjBiayaAjb) || 0) + (Number(d.pjBiayaAppraisal) || 0) + (Number(d.pjBphtb) || 0) + (Number(d.pjLainLain) || 0);
    d.pjNilaiPenyerahan = hargaBase - d.pjTotalSubsidi;
    d.pjTotalBphtbPph = (Number(d.pjBphtbPajak) || 0) + (Number(d.pjPph) || 0);
    d.ajbNjopTotal = (Number(d.ajbNjopTanah) || 0) + (Number(d.ajbNjopBangunan) || 0);
    d.ajbTotalBphtbPph = (Number(d.ajbBphtb) || 0) + (Number(d.ajbPph) || 0);
    return d;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;

    setFormData((prev) => {
      const updatedData = { ...prev, [name]: parsedValue };
      return calculateDerivedFields(updatedData);
    });
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCurrencyChange = (name: string, value: number) => {
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };
      return calculateDerivedFields(updatedData);
    });
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const getNum = (val: string | number | undefined) => (val === '' || val === undefined) ? undefined : Number(val);
    const getStr = (val: string | undefined) => val === '' ? undefined : val;

    const payload = {
      statusKavling: getStr(formData.statusKavling),
      namaTipe: getStr(formData.tipe),
      luasBangunan: getNum(formData.luasBangunan),
      luasTanah: getNum(formData.luasTanah),
      // hargaDasarKavling TIDAK di lempar karena read-only
      rekeningTujuanId: getNum(formData.rekeningTujuanId),

      notarisId: getNum(formData.notarisId),
      lantai: getStr(formData.lantai),
      lokasiStrategis: getStr(formData.lokasiStrategis),
      tanggalAkadPpjb: getStr(formData.tanggalAkadPpjb),
      akadPpjb: getStr(formData.akadPpjb),
      tanggalAkadAjbPpat: getStr(formData.tanggalAkadAjbPpat),
      tanggalPembayaranPph: getStr(formData.tanggalPembayaranPph),
      tanggalPembayaranBphtb: getStr(formData.tanggalPembayaranBphtb),
      pembiayaan: getStr(formData.pembiayaan),
      sp3r: getStr(formData.sp3r),
      lebihTanah: getNum(formData.lebihTanah),
      biayaStrategis: getNum(formData.biayaStrategis),
      nrBiayaKprAsuransi: getNum(formData.nrBiayaKprAsuransi),
      nrDiskonAngsuran: getNum(formData.nrDiskonAngsuran),
      nrDiskonCash: getNum(formData.nrDiskonCash),
      nrBiayaBbn: getNum(formData.nrBiayaBbn),
      nrBiayaNotarisAjb: getNum(formData.nrBiayaNotarisAjb),
      nrBiayaNotarisPpjb: getNum(formData.nrBiayaNotarisPpjb),
      nrBiayaAppraisal: getNum(formData.nrBiayaAppraisal),
      nrBiayaBphtb: getNum(formData.nrBiayaBphtb),
      nrLainLain: getNum(formData.nrLainLain),
      nrTotalSubsidi: getNum(formData.nrTotalSubsidi),
      nrNilaiPenyerahan: getNum(formData.nrNilaiPenyerahan),
      nrPpn: getNum(formData.nrPpn),
      nrBphtb: getNum(formData.nrBphtb),
      nrPph: getNum(formData.nrPph),
      pjBiayaKpr: getNum(formData.pjBiayaKpr),
      pjBiayaAsuransi: getNum(formData.pjBiayaAsuransi),
      pjDiskonAngsuran: getNum(formData.pjDiskonAngsuran),
      pjBiayaBbn: getNum(formData.pjBiayaBbn),
      pjBiayaAjb: getNum(formData.pjBiayaAjb),
      pjBiayaAppraisal: getNum(formData.pjBiayaAppraisal),
      pjBphtb: getNum(formData.pjBphtb),
      pjLainLain: getNum(formData.pjLainLain),
      pjTotalSubsidi: getNum(formData.pjTotalSubsidi),
      pjNilaiPenyerahan: getNum(formData.pjNilaiPenyerahan),
      pjPpn: getNum(formData.pjPpn),
      pjBphtbPajak: getNum(formData.pjBphtbPajak),
      pjPph: getNum(formData.pjPph),
      pjTotalBphtbPph: getNum(formData.pjTotalBphtbPph),
      ajbNjopTanahPerMeter: getNum(formData.ajbNjopTanahPerMeter),
      ajbNjopTanah: getNum(formData.ajbNjopTanah),
      ajbNjopBangunanPerMeter: getNum(formData.ajbNjopBangunanPerMeter),
      ajbNjopBangunan: getNum(formData.ajbNjopBangunan),
      ajbNjopTotal: getNum(formData.ajbNjopTotal),
      ajbPpn: getNum(formData.ajbPpn),
      ajbBphtb: getNum(formData.ajbBphtb),
      ajbPph: getNum(formData.ajbPph),
      ajbTotalBphtbPph: getNum(formData.ajbTotalBphtbPph),
      ajbSelisihPajakPbb: getNum(formData.ajbSelisihPajakPbb),
      ajbUping: getNum(formData.ajbUping),
    };

    try {
      await updateMutation.mutateAsync({ id: formData.id, data: payload });
      closeModal();
    } catch (error: any) {
      const responseData = error.response?.data;

      if (responseData?.error && Array.isArray(responseData.error)) {
        const backendErrors: Record<string, string> = {};
        responseData.error.forEach((err: { field: string; message: string }) => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
      } else {
        alert(responseData?.message || 'Terjadi kesalahan saat menyimpan data');
      }
    }
  };

  type TabId = 'dasar' | 'harga' | 'nilai' | 'pajak' | 'ajb' | 'notaris';

  const tabs: { id: TabId; label: string }[] = [
    { id: 'dasar', label: 'Info Dasar' },
    { id: 'harga', label: 'Harga Jual' },
    { id: 'nilai', label: 'Nilai Rumah' },
    { id: 'pajak', label: 'Pajak' },
    { id: 'ajb', label: 'Keperluan AJB' },
    { id: 'notaris', label: 'Notaris' },
  ];

  const expandedRowRender = (row: KavlingData) => {
    const history = tagihans.filter((t: any) => String(t.penjualanId) === String(row.id));
    const totalTerbayar = history.filter((t: any) => t.status === 'LUNAS').reduce((acc: number, curr: any) => acc + Number(curr.nominal), 0);
    const sisaPembayaran = (row.totalHargaJual || 0) - totalTerbayar;

    return (
      <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-200 shadow-inner">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h4 className="text-sm font-bold text-slate-800">Riwayat Tagihan & Pembayaran</h4>
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
              Total Terbayar: {formatRupiah(totalTerbayar)}
            </span>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-lg border border-orange-200">
              Sisa Tagihan: {formatRupiah(sisaPembayaran)}
            </span>
          </div>
        </div>

        {history.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 uppercase tracking-widest text-[10px]">
                  <th className="p-3 font-bold">Keterangan</th>
                  <th className="p-3 font-bold">Jatuh Tempo</th>
                  <th className="p-3 font-bold text-right">Nominal Tagihan</th>
                  <th className="p-3 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.sort((a: any, b: any) => new Date(a.jatuhTempo).getTime() - new Date(b.jatuhTempo).getTime()).map((item: any) => (
                  <tr key={item.id} className="bg-white hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-800">{item.pembayaran}</td>
                    <td className="p-3 text-slate-600 font-medium">{formatDate(item.jatuhTempo)}</td>
                    <td className="p-3 text-slate-900 font-bold text-right">{formatRupiah(item.nominal)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${item.status === 'LUNAS' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic text-center py-4 bg-white rounded-lg border border-slate-100">Belum ada riwayat tagihan atau pembayaran.</p>
        )}
      </div>
    );
  };

  if (isLoading || isLoadingTagihan) return;

  return (
    <div>
      <DataTable
        title="Data Kavling Customer"
        columns={columns}
        data={apiData}
        onEdit={(item) => openModal(item)}
        expandedRowRender={expandedRowRender}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Edit Data Kavling">
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-4 border-b-2 font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer ${activeTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'dasar' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Input label="Perumahan" name="perumahan" value={formData.perumahan} readOnly className="bg-gray-100 text-gray-600 px-4 py-2.5 text-sm rounded-xl border border-slate-200 w-full" />

              <Select
                label="Status Kavling"
                name="statusKavling"
                value={formData.statusKavling}
                onChange={handleChange}
                options={[
                  { value: 'AVAILABLE', label: 'Available' },
                  { value: 'BOOKING', label: 'Booking' },
                  { value: 'HOLD', label: 'Hold' },
                  { value: 'TERJUAL', label: 'Terjual' }
                ]}
              />

              <div className="grid grid-cols-2 gap-2">
                <Input label="Blok" name="blok" value={formData.blok} readOnly className="bg-gray-100 text-gray-600 px-4 py-2.5 text-sm rounded-xl border border-slate-200 w-full" />
                <Input label="Unit" name="unit" value={formData.unit} readOnly className="bg-gray-100 text-gray-600 px-4 py-2.5 text-sm rounded-xl border border-slate-200 w-full" />
              </div>
              <Input label="Tipe" name="tipe" value={formData.tipe} onChange={handleChange} error={errors.tipe} placeholder="Contoh: 45/90" />
              <Input label="Lantai" name="lantai" value={formData.lantai || ''} onChange={handleChange} error={errors.lantai} />
              <Input label="Luas Bangunan (m²)" name="luasBangunan" type="number" value={formData.luasBangunan === 0 ? '' : formData.luasBangunan} onChange={handleChange} error={errors.luasBangunan} />
              <Select label="Lokasi Strategis" name="lokasiStrategis" value={formData.lokasiStrategis || ''} onChange={handleChange} options={[{ value: 'Ya', label: 'Ya (Hook)' }, { value: 'Tidak', label: 'Tidak' }]} error={errors.lokasiStrategis} />

              <Select
                label="Pembiayaan"
                name="pembiayaan"
                value={formData.pembiayaan || ''}
                onChange={handleChange}
                options={[
                  { value: 'KPR', label: 'KPR Bank' },
                  { value: 'CASH_KERAS', label: 'Cash Keras' },
                  { value: 'CASH_BERTAHAP', label: 'Cash Bertahap' }
                ]}
              />

              <Select label="SP3R" name="sp3r" value={formData.sp3r || ''} onChange={handleChange} options={[{ value: 'BANK', label: 'Bank' }, { value: 'CASH', label: 'Cash' }]} />
              <Input label="Tanggal Akad PPJB" type="date" name="tanggalAkadPpjb" value={formData.tanggalAkadPpjb} onChange={handleChange} />

              <Select
                label="Akad PPJB"
                name="akadPpjb"
                value={formData.akadPpjb || ''}
                onChange={handleChange}
                options={[
                  { value: '', label: '-- Pilih --' },
                  { value: 'NOTARIS', label: 'Notaris' },
                  { value: 'DEVELOPER', label: 'Developer' }
                ]}
              />

              <Input label="Tanggal Akad AJB PPAT" type="date" name="tanggalAkadAjbPpat" value={formData.tanggalAkadAjbPpat} onChange={handleChange} />
              <Input label="Tanggal Pembayaran PPh" type="date" name="tanggalPembayaranPph" value={formData.tanggalPembayaranPph} onChange={handleChange} />
              <Input label="Tanggal Pembayaran BPHTB" type="date" name="tanggalPembayaranBphtb" value={formData.tanggalPembayaranBphtb} onChange={handleChange} />
            </div>
          )}

          {activeTab === 'harga' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CurrencyInput label="Harga Jual (Sistem Nett)" name="totalHargaJual" value={formData.totalHargaJual} onValueChange={handleCurrencyChange} disabled={true} />
              <CurrencyInput label="Diskon Penjualan (Sistem)" name="diskonPenjualan" value={formData.diskonPenjualan} onValueChange={handleCurrencyChange} disabled={true} />

              <CurrencyInput label="Lebih Tanah Tambahan" name="lebihTanah" value={formData.lebihTanah} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Biaya Strategis Tambahan" name="biayaStrategis" value={formData.biayaStrategis} onValueChange={handleCurrencyChange} />

              <div className="md:col-span-2 mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Harga Kavling</span>
                <span className="text-2xl font-black text-slate-900">{formatRupiah((formData.totalHargaJual || 0) + (formData.lebihTanah || 0) + (formData.biayaStrategis || 0) - (formData.diskonPenjualan || 0))}</span>
              </div>
            </div>
          )}

          {activeTab === 'nilai' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SectionTitle title="Subsidi & Bonus (Nilai Rumah)" />
              <CurrencyInput label="Biaya KPR & Asuransi" name="nrBiayaKprAsuransi" value={formData.nrBiayaKprAsuransi} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Diskon Angsuran" name="nrDiskonAngsuran" value={formData.nrDiskonAngsuran} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Diskon Cash & Lainnya" name="nrDiskonCash" value={formData.nrDiskonCash} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Biaya Balik Nama Sertifikat" name="nrBiayaBbn" value={formData.nrBiayaBbn} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Biaya Notaris AJB" name="nrBiayaNotarisAjb" value={formData.nrBiayaNotarisAjb} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Biaya Notaris PPJB" name="nrBiayaNotarisPpjb" value={formData.nrBiayaNotarisPpjb} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Biaya Appraisal" name="nrBiayaAppraisal" value={formData.nrBiayaAppraisal} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Biaya BPHTB" name="nrBiayaBphtb" value={formData.nrBiayaBphtb} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Lain-lain (Utilitas, Fisik)" name="nrLainLain" value={formData.nrLainLain} onValueChange={handleCurrencyChange} />
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-200">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Subsidi & Bonus</span>
                <span className="font-black text-red-600">- {formatRupiah(formData.nrTotalSubsidi)}</span>
              </div>
              <div className="md:col-span-2 bg-blue-50 p-5 rounded-xl flex justify-between items-center border border-blue-200 mb-4 shadow-sm">
                <span className="text-sm font-bold text-blue-800 uppercase tracking-widest">Nilai Penyerahan (Setelah Subsidi)</span>
                <span className="text-2xl font-black text-blue-900">{formatRupiah(formData.nrNilaiPenyerahan)}</span>
              </div>
              <SectionTitle title="Pajak Nilai Rumah" />
              <CurrencyInput label="PPN" name="nrPpn" value={formData.nrPpn} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="BPHTB" name="nrBphtb" value={formData.nrBphtb} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="PPh" name="nrPph" value={formData.nrPph} onValueChange={handleCurrencyChange} />
            </div>
          )}

          {activeTab === 'pajak' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SectionTitle title="Subsidi & Bonus (Pajak)" />
              <CurrencyInput label="Biaya KPR" name="pjBiayaKpr" value={formData.pjBiayaKpr} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Biaya Asuransi" name="pjBiayaAsuransi" value={formData.pjBiayaAsuransi} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Diskon Angsuran" name="pjDiskonAngsuran" value={formData.pjDiskonAngsuran} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Biaya Balik Nama Sertifikat" name="pjBiayaBbn" value={formData.pjBiayaBbn} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Biaya Pembuatan AJB" name="pjBiayaAjb" value={formData.pjBiayaAjb} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Biaya Appraisal" name="pjBiayaAppraisal" value={formData.pjBiayaAppraisal} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="BPHTB" name="pjBphtb" value={formData.pjBphtb} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Lain-lain (Utilitas, Fisik)" name="pjLainLain" value={formData.pjLainLain} onValueChange={handleCurrencyChange} />
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-200">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Subsidi & Bonus (Pajak)</span>
                <span className="font-black text-red-600">- {formatRupiah(formData.pjTotalSubsidi)}</span>
              </div>
              <div className="md:col-span-2 bg-indigo-50 p-5 rounded-xl flex justify-between items-center border border-indigo-200 mb-4 shadow-sm">
                <span className="text-sm font-bold text-indigo-800 uppercase tracking-widest">Nilai Penyerahan (Pajak)</span>
                <span className="text-2xl font-black text-indigo-900">{formatRupiah(formData.pjNilaiPenyerahan)}</span>
              </div>
              <SectionTitle title="Detail Pajak" />
              <CurrencyInput label="PPN" name="pjPpn" value={formData.pjPpn} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="BPHTB" name="pjBphtbPajak" value={formData.pjBphtbPajak} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="PPh" name="pjPph" value={formData.pjPph} onValueChange={handleCurrencyChange} />
              <div className="md:col-span-2 mt-2 p-4 bg-slate-800 rounded-xl flex justify-between items-center shadow-lg">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Total BPHTB + PPh</span>
                <span className="text-xl font-black text-white">{formatRupiah(formData.pjTotalBphtbPph)}</span>
              </div>
            </div>
          )}

          {activeTab === 'ajb' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SectionTitle title="Nilai Jual Objek Pajak (NJOP)" />
              <CurrencyInput label="NJOP Tanah per Meter" name="ajbNjopTanahPerMeter" value={formData.ajbNjopTanahPerMeter} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Total NJOP Tanah" name="ajbNjopTanah" value={formData.ajbNjopTanah} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="NJOP Bangunan per Meter" name="ajbNjopBangunanPerMeter" value={formData.ajbNjopBangunanPerMeter} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Total NJOP Bangunan" name="ajbNjopBangunan" value={formData.ajbNjopBangunan} onValueChange={handleCurrencyChange} />
              <div className="md:col-span-2 bg-slate-50 p-5 rounded-xl flex justify-between items-center border border-slate-200 mb-4 shadow-sm">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">NJOP Tanah + Bangunan</span>
                <span className="text-2xl font-black text-slate-900">{formatRupiah(formData.ajbNjopTotal)}</span>
              </div>
              <SectionTitle title="Kewajiban Pajak AJB" />
              <CurrencyInput label="PPN" name="ajbPpn" value={formData.ajbPpn} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="BPHTB" name="ajbBphtb" value={formData.ajbBphtb} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="PPh" name="ajbPph" value={formData.ajbPph} onValueChange={handleCurrencyChange} />
              <div className="md:col-span-2 mt-2 p-5 bg-slate-800 rounded-xl flex justify-between items-center shadow-lg">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">BPHTB + PPh (AJB)</span>
                <span className="text-xl font-black text-white">{formatRupiah(formData.ajbTotalBphtbPph)}</span>
              </div>
              <SectionTitle title="Lain-lain" />
              <CurrencyInput label="Selisih (BPHTB+PPh) Pajak - PBB" name="ajbSelisihPajakPbb" value={formData.ajbSelisihPajakPbb} onValueChange={handleCurrencyChange} />
              <CurrencyInput label="Uping" name="ajbUping" value={formData.ajbUping} onValueChange={handleCurrencyChange} />
            </div>
          )}

          {activeTab === 'notaris' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SectionTitle title="Pemilihan Notaris" />
              <div className="md:col-span-2">
                <Select
                  label="Pilih Notaris"
                  name="notarisId"
                  value={formData.notarisId || ''}
                  onChange={handleChange}
                  options={[
                    { value: '', label: '-- Belum ditentukan --' },
                    ...notarisList.map(n => ({ value: n.id, label: n.nama }))
                  ]}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-8">
            <button
              type="button"
              onClick={closeModal}
              disabled={updateMutation.isPending}
              className="px-6 py-2.5 text-xs uppercase tracking-widest font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-8 py-2.5 text-xs uppercase tracking-widest font-bold text-white bg-black rounded-xl hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-black/10 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>
    </div >
  );
};

const SectionTitle = ({ title }: { title: string }) => (
  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-3 md:col-span-2 mt-4">{title}</h4>
);

export default CustomerKavling;
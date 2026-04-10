import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import { formatRupiah } from "../../utils/formatters";
import PageLoader from "../PageLoader";
import { useGetCustomerKavlings, useUpdateCustomerKavling } from "../../hooks/queries/useCustomerKavling";
import { useGetNotaris } from '../../hooks/queries/useNotaris';

interface KavlingData {
  id: string;
  perumahan: string;
  status: string;
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
  harga: number;
  lebihTanah: number;
  biayaStrategis: number;
  totalHargaJual: number;
  nrBiayaKprAsuransi: number;
  nrDiskonAngsuran: number;
  nrDiskonCash: number;
  nrBiayaBbn: number;
  nrBiayaNotarisAjb: number;
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
  notarisId: number | string;
}

const initialFormState: KavlingData = {
  id: '',
  perumahan: '', status: '', lantai: '', blok: '', unit: '', tipe: '', luasBangunan: '', luasTanah: '', lokasiStrategis: '',
  tanggalAkadPpjb: '', akadPpjb: '', tanggalAkadAjbPpat: '', tanggalPembayaranPph: '', tanggalPembayaranBphtb: '', pembiayaan: '', sp3r: '',
  harga: 0, lebihTanah: 0, biayaStrategis: 0, totalHargaJual: 0,
  nrBiayaKprAsuransi: 0, nrDiskonAngsuran: 0, nrDiskonCash: 0, nrBiayaBbn: 0, nrBiayaNotarisAjb: 0, nrBiayaAppraisal: 0, nrBiayaBphtb: 0, nrLainLain: 0, nrTotalSubsidi: 0, nrNilaiPenyerahan: 0, nrPpn: 0, nrBphtb: 0, nrPph: 0,
  pjBiayaKpr: 0, pjBiayaAsuransi: 0, pjDiskonAngsuran: 0, pjBiayaBbn: 0, pjBiayaAjb: 0, pjBiayaAppraisal: 0, pjBphtb: 0, pjLainLain: 0, pjTotalSubsidi: 0, pjNilaiPenyerahan: 0, pjPpn: 0, pjBphtbPajak: 0, pjPph: 0, pjTotalBphtbPph: 0,
  ajbNjopTanahPerMeter: 0, ajbNjopTanah: 0, ajbNjopBangunanPerMeter: 0, ajbNjopBangunan: 0, ajbNjopTotal: 0, ajbPpn: 0, ajbBphtb: 0, ajbPph: 0, ajbTotalBphtbPph: 0, ajbSelisihPajakPbb: 0, ajbUping: 0,
  notarisId: '',
};

const CustomerKavling = () => {

  const { data: apiData = [], isLoading } = useGetCustomerKavlings({ limit: 100 });
  const { data: notarisList = [] } = useGetNotaris();
  const updateMutation = useUpdateCustomerKavling();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<KavlingData>(initialFormState);
  const [errors, setErrors] = useState<Partial<KavlingData>>({});

  const [activeTab, setActiveTab] = useState<'dasar' | 'harga' | 'nilai' | 'pajak' | 'ajb' | 'notaris'>('dasar');

  const columns = [
    { header: 'Perumahan', accessor: 'perumahan' },
    { header: 'Blok/Unit', accessor: 'blok', render: (_: any, row: KavlingData) => `${row.blok}-${row.unit}` },
    { header: 'Tipe', accessor: 'tipe' },
    { header: 'Total Harga Jual', accessor: 'totalHargaJual', render: (val: number) => formatRupiah(val) },
    {
      header: 'Status',
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
    d.totalHargaJual = (Number(d.harga) || 0) + (Number(d.lebihTanah) || 0) + (Number(d.biayaStrategis) || 0);
    d.nrTotalSubsidi = (Number(d.nrBiayaKprAsuransi) || 0) + (Number(d.nrDiskonAngsuran) || 0) + (Number(d.nrDiskonCash) || 0) + (Number(d.nrBiayaBbn) || 0) + (Number(d.nrBiayaNotarisAjb) || 0) + (Number(d.nrBiayaAppraisal) || 0) + (Number(d.nrBiayaBphtb) || 0) + (Number(d.nrLainLain) || 0);
    d.nrNilaiPenyerahan = d.totalHargaJual - d.nrTotalSubsidi;
    d.pjTotalSubsidi = (Number(d.pjBiayaKpr) || 0) + (Number(d.pjBiayaAsuransi) || 0) + (Number(d.pjDiskonAngsuran) || 0) + (Number(d.pjBiayaBbn) || 0) + (Number(d.pjBiayaAjb) || 0) + (Number(d.pjBiayaAppraisal) || 0) + (Number(d.pjBphtb) || 0) + (Number(d.pjLainLain) || 0);
    d.pjNilaiPenyerahan = d.totalHargaJual - d.pjTotalSubsidi;
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

    if (errors[name as keyof KavlingData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<KavlingData> = {};

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;


    const getNum = (val: string | number | undefined) => (val === '' || val === undefined) ? undefined : Number(val);
    const getStr = (val: string | undefined) => val === '' ? undefined : val;

    const payload = {
      statusKavling: getStr(formData.status),
      namaTipe: getStr(formData.tipe),
      luasBangunan: getNum(formData.luasBangunan),
      luasTanah: getNum(formData.luasTanah),
      hargaJualKavling: getNum(formData.harga),

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
      alert(error.response?.data?.message || "Terjadi kesalahan saat menyimpan data");
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

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Kavling Customer"
        columns={columns}
        data={apiData}
        onEdit={(item) => openModal(item)}
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
              <Select label="Status Kavling" name="status" value={formData.status} onChange={handleChange} options={[{ value: 'AVAILABLE', label: 'Available' }, { value: 'BOOKED', label: 'Booked' }, { value: 'PROSES', label: 'Proses' }, { value: 'TERJUAL', label: 'Terjual' }, { value: 'LUNAS', label: 'Lunas' }]} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Blok" name="blok" value={formData.blok} readOnly className="bg-gray-100 text-gray-600 px-4 py-2.5 text-sm rounded-xl border border-slate-200 w-full" />
                <Input label="Unit" name="unit" value={formData.unit} readOnly className="bg-gray-100 text-gray-600 px-4 py-2.5 text-sm rounded-xl border border-slate-200 w-full" />
              </div>
              <Input label="Tipe" name="tipe" value={formData.tipe} onChange={handleChange} placeholder="Contoh: 45/90" />
              <Input label="Lantai" name="lantai" value={formData.lantai || ''} onChange={handleChange} />
              <Input label="Luas Bangunan (m²)" name="luasBangunan" type="number" value={formData.luasBangunan === 0 ? '' : formData.luasBangunan} onChange={handleChange} />
              <Select label="Lokasi Strategis" name="lokasiStrategis" value={formData.lokasiStrategis || ''} onChange={handleChange} options={[{ value: 'Ya', label: 'Ya (Hook)' }, { value: 'Tidak', label: 'Tidak' }]} />
              <Select label="Pembiayaan" name="pembiayaan" value={formData.pembiayaan || ''} onChange={handleChange} options={[{ value: 'KPR', label: 'KPR Bank' }, { value: 'CASH KERAS', label: 'Cash Keras' }, { value: 'CASH BERTAHAP', label: 'Cash Bertahap' }]} />
              <Select label="SP3R" name="sp3r" value={formData.sp3r || ''} onChange={handleChange} options={[{ value: 'BANK', label: 'Bank' }, { value: 'CASH', label: 'Cash' }]} />
              <Input label="Tanggal Akad PPJB" type="date" name="tanggalAkadPpjb" value={formData.tanggalAkadPpjb} onChange={handleChange} />
              <Input label="Akad PPJB" name="akadPpjb" value={formData.akadPpjb || ''} onChange={handleChange} />
              <Input label="Tanggal Akad AJB PPAT" type="date" name="tanggalAkadAjbPpat" value={formData.tanggalAkadAjbPpat} onChange={handleChange} />
              <Input label="Tanggal Pembayaran PPh" type="date" name="tanggalPembayaranPph" value={formData.tanggalPembayaranPph} onChange={handleChange} />
              <Input label="Tanggal Pembayaran BPHTB" type="date" name="tanggalPembayaranBphtb" value={formData.tanggalPembayaranBphtb} onChange={handleChange} />
            </div>
          )}

          {activeTab === 'harga' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Input label="Harga Standar Kavling (Rp)" type="number" name="harga" value={formData.harga === 0 ? '' : formData.harga} onChange={handleChange} />
              <Input label="Lebih Tanah (Rp)" type="number" name="lebihTanah" value={formData.lebihTanah === 0 ? '' : formData.lebihTanah} onChange={handleChange} />
              <Input label="Biaya Strategis (Rp)" type="number" name="biayaStrategis" value={formData.biayaStrategis === 0 ? '' : formData.biayaStrategis} onChange={handleChange} />
              <div className="md:col-span-2 mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Harga Jual</span>
                <span className="text-2xl font-black text-slate-900">{formatRupiah(formData.totalHargaJual)}</span>
              </div>
            </div>
          )}

          {activeTab === 'nilai' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SectionTitle title="Subsidi & Bonus (Nilai Rumah)" />
              <Input label="Biaya KPR & Asuransi" type="number" name="nrBiayaKprAsuransi" value={formData.nrBiayaKprAsuransi === 0 ? '' : formData.nrBiayaKprAsuransi} onChange={handleChange} />
              <Input label="Diskon Angsuran" type="number" name="nrDiskonAngsuran" value={formData.nrDiskonAngsuran === 0 ? '' : formData.nrDiskonAngsuran} onChange={handleChange} />
              <Input label="Diskon Cash & Lainnya" type="number" name="nrDiskonCash" value={formData.nrDiskonCash === 0 ? '' : formData.nrDiskonCash} onChange={handleChange} />
              <Input label="Biaya Balik Nama Sertifikat" type="number" name="nrBiayaBbn" value={formData.nrBiayaBbn === 0 ? '' : formData.nrBiayaBbn} onChange={handleChange} />
              <Input label="Biaya Notaris AJB" type="number" name="nrBiayaNotarisAjb" value={formData.nrBiayaNotarisAjb === 0 ? '' : formData.nrBiayaNotarisAjb} onChange={handleChange} />
              <Input label="Biaya Appraisal" type="number" name="nrBiayaAppraisal" value={formData.nrBiayaAppraisal === 0 ? '' : formData.nrBiayaAppraisal} onChange={handleChange} />
              <Input label="Biaya BPHTB" type="number" name="nrBiayaBphtb" value={formData.nrBiayaBphtb === 0 ? '' : formData.nrBiayaBphtb} onChange={handleChange} />
              <Input label="Lain-lain (Utilitas, Fisik)" type="number" name="nrLainLain" value={formData.nrLainLain === 0 ? '' : formData.nrLainLain} onChange={handleChange} />
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-200">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Subsidi & Bonus</span>
                <span className="font-black text-red-600">- {formatRupiah(formData.nrTotalSubsidi)}</span>
              </div>
              <div className="md:col-span-2 bg-blue-50 p-5 rounded-xl flex justify-between items-center border border-blue-200 mb-4 shadow-sm">
                <span className="text-sm font-bold text-blue-800 uppercase tracking-widest">Nilai Penyerahan (Setelah Subsidi)</span>
                <span className="text-2xl font-black text-blue-900">{formatRupiah(formData.nrNilaiPenyerahan)}</span>
              </div>
              <SectionTitle title="Pajak Nilai Rumah" />
              <Input label="PPN" type="number" name="nrPpn" value={formData.nrPpn === 0 ? '' : formData.nrPpn} onChange={handleChange} />
              <Input label="BPHTB" type="number" name="nrBphtb" value={formData.nrBphtb === 0 ? '' : formData.nrBphtb} onChange={handleChange} />
              <Input label="PPh" type="number" name="nrPph" value={formData.nrPph === 0 ? '' : formData.nrPph} onChange={handleChange} />
            </div>
          )}

          {activeTab === 'pajak' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SectionTitle title="Subsidi & Bonus (Pajak)" />
              <Input label="Biaya KPR" type="number" name="pjBiayaKpr" value={formData.pjBiayaKpr === 0 ? '' : formData.pjBiayaKpr} onChange={handleChange} />
              <Input label="Biaya Asuransi" type="number" name="pjBiayaAsuransi" value={formData.pjBiayaAsuransi === 0 ? '' : formData.pjBiayaAsuransi} onChange={handleChange} />
              <Input label="Diskon Angsuran" type="number" name="pjDiskonAngsuran" value={formData.pjDiskonAngsuran === 0 ? '' : formData.pjDiskonAngsuran} onChange={handleChange} />
              <Input label="Biaya Balik Nama Sertifikat" type="number" name="pjBiayaBbn" value={formData.pjBiayaBbn === 0 ? '' : formData.pjBiayaBbn} onChange={handleChange} />
              <Input label="Biaya Pembuatan AJB" type="number" name="pjBiayaAjb" value={formData.pjBiayaAjb === 0 ? '' : formData.pjBiayaAjb} onChange={handleChange} />
              <Input label="Biaya Appraisal" type="number" name="pjBiayaAppraisal" value={formData.pjBiayaAppraisal === 0 ? '' : formData.pjBiayaAppraisal} onChange={handleChange} />
              <Input label="BPHTB" type="number" name="pjBphtb" value={formData.pjBphtb === 0 ? '' : formData.pjBphtb} onChange={handleChange} />
              <Input label="Lain-lain (Utilitas, Fisik)" type="number" name="pjLainLain" value={formData.pjLainLain === 0 ? '' : formData.pjLainLain} onChange={handleChange} />
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-200">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Subsidi & Bonus (Pajak)</span>
                <span className="font-black text-red-600">- {formatRupiah(formData.pjTotalSubsidi)}</span>
              </div>
              <div className="md:col-span-2 bg-indigo-50 p-5 rounded-xl flex justify-between items-center border border-indigo-200 mb-4 shadow-sm">
                <span className="text-sm font-bold text-indigo-800 uppercase tracking-widest">Nilai Penyerahan (Pajak)</span>
                <span className="text-2xl font-black text-indigo-900">{formatRupiah(formData.pjNilaiPenyerahan)}</span>
              </div>
              <SectionTitle title="Detail Pajak" />
              <Input label="PPN" type="number" name="pjPpn" value={formData.pjPpn === 0 ? '' : formData.pjPpn} onChange={handleChange} />
              <Input label="BPHTB" type="number" name="pjBphtbPajak" value={formData.pjBphtbPajak === 0 ? '' : formData.pjBphtbPajak} onChange={handleChange} />
              <Input label="PPh" type="number" name="pjPph" value={formData.pjPph === 0 ? '' : formData.pjPph} onChange={handleChange} />
              <div className="md:col-span-2 mt-2 p-5 bg-slate-800 rounded-xl flex justify-between items-center shadow-lg">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Total BPHTB + PPh</span>
                <span className="text-xl font-black text-white">{formatRupiah(formData.pjTotalBphtbPph)}</span>
              </div>
            </div>
          )}

          {activeTab === 'ajb' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SectionTitle title="Nilai Jual Objek Pajak (NJOP)" />
              <Input label="NJOP Tanah per Meter" type="number" name="ajbNjopTanahPerMeter" value={formData.ajbNjopTanahPerMeter === 0 ? '' : formData.ajbNjopTanahPerMeter} onChange={handleChange} />
              <Input label="Total NJOP Tanah" type="number" name="ajbNjopTanah" value={formData.ajbNjopTanah === 0 ? '' : formData.ajbNjopTanah} onChange={handleChange} />
              <Input label="NJOP Bangunan per Meter" type="number" name="ajbNjopBangunanPerMeter" value={formData.ajbNjopBangunanPerMeter === 0 ? '' : formData.ajbNjopBangunanPerMeter} onChange={handleChange} />
              <Input label="Total NJOP Bangunan" type="number" name="ajbNjopBangunan" value={formData.ajbNjopBangunan === 0 ? '' : formData.ajbNjopBangunan} onChange={handleChange} />
              <div className="md:col-span-2 bg-slate-50 p-5 rounded-xl flex justify-between items-center border border-slate-200 mb-4 shadow-sm">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">NJOP Tanah + Bangunan</span>
                <span className="text-2xl font-black text-slate-900">{formatRupiah(formData.ajbNjopTotal)}</span>
              </div>
              <SectionTitle title="Kewajiban Pajak AJB" />
              <Input label="PPN" type="number" name="ajbPpn" value={formData.ajbPpn === 0 ? '' : formData.ajbPpn} onChange={handleChange} />
              <Input label="BPHTB" type="number" name="ajbBphtb" value={formData.ajbBphtb === 0 ? '' : formData.ajbBphtb} onChange={handleChange} />
              <Input label="PPh" type="number" name="ajbPph" value={formData.ajbPph === 0 ? '' : formData.ajbPph} onChange={handleChange} />
              <div className="md:col-span-2 mt-2 p-5 bg-slate-800 rounded-xl flex justify-between items-center shadow-lg">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">BPHTB + PPh (AJB)</span>
                <span className="text-xl font-black text-white">{formatRupiah(formData.ajbTotalBphtbPph)}</span>
              </div>
              <SectionTitle title="Lain-lain" />
              <Input label="Selisih (BPHTB+PPh) Pajak - PBB" type="number" name="ajbSelisihPajakPbb" value={formData.ajbSelisihPajakPbb === 0 ? '' : formData.ajbSelisihPajakPbb} onChange={handleChange} />
              <Input label="Uping" type="number" name="ajbUping" value={formData.ajbUping === 0 ? '' : formData.ajbUping} onChange={handleChange} />
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
    </div>
  );
};

const SectionTitle = ({ title }: { title: string }) => (
  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-3 md:col-span-2 mt-4">{title}</h4>
);

export default CustomerKavling;
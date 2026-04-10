/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import { formatRupiah } from "../../utils/formatters";

interface KavlingData {
  id: string;
  perumahan: string;
  status: string;
  lantai: string;
  blok: string;
  unit: string;
  tipe: string;
  luasBangunan: string;
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
  notarisName: string;
}

const initialFormState: KavlingData = {
  id: '',
  perumahan: '', status: '', lantai: '', blok: '', unit: '', tipe: '', luasBangunan: '', lokasiStrategis: '',
  tanggalAkadPpjb: '', akadPpjb: '', tanggalAkadAjbPpat: '', tanggalPembayaranPph: '', tanggalPembayaranBphtb: '', pembiayaan: '', sp3r: '',
  harga: 0, lebihTanah: 0, biayaStrategis: 0, totalHargaJual: 0,
  nrBiayaKprAsuransi: 0, nrDiskonAngsuran: 0, nrDiskonCash: 0, nrBiayaBbn: 0, nrBiayaNotarisAjb: 0, nrBiayaAppraisal: 0, nrBiayaBphtb: 0, nrLainLain: 0, nrTotalSubsidi: 0, nrNilaiPenyerahan: 0, nrPpn: 0, nrBphtb: 0, nrPph: 0,
  pjBiayaKpr: 0, pjBiayaAsuransi: 0, pjDiskonAngsuran: 0, pjBiayaBbn: 0, pjBiayaAjb: 0, pjBiayaAppraisal: 0, pjBphtb: 0, pjLainLain: 0, pjTotalSubsidi: 0, pjNilaiPenyerahan: 0, pjPpn: 0, pjBphtbPajak: 0, pjPph: 0, pjTotalBphtbPph: 0,
  ajbNjopTanahPerMeter: 0, ajbNjopTanah: 0, ajbNjopBangunanPerMeter: 0, ajbNjopBangunan: 0, ajbNjopTotal: 0, ajbPpn: 0, ajbBphtb: 0, ajbPph: 0, ajbTotalBphtbPph: 0, ajbSelisihPajakPbb: 0, ajbUping: 0,
  notarisName: '',
};

const mockNotaris = [
  { id: 'NOT-001', name: 'Notaris PPAT Budi Hartono, S.H., M.Kn.' },
  { id: 'NOT-002', name: 'Notaris Anita Wijaya, S.H.' },
];

const initialMockData: KavlingData[] = [
  {
    ...initialFormState,
    id: '1',
    perumahan: 'Puri Safana',
    status: 'Available',
    lantai: '1',
    blok: 'A',
    unit: '01',
    tipe: '45/90',
    luasBangunan: '45',
    lokasiStrategis: 'Ya',
    pembiayaan: 'KPR',
    harga: 500000000,
    lebihTanah: 0,
    biayaStrategis: 15000000,
    totalHargaJual: 515000000,
    nrNilaiPenyerahan: 515000000,
    pjNilaiPenyerahan: 515000000,
    notarisName: 'Notaris PPAT Budi Hartono, S.H., M.Kn.',
  },
  {
    ...initialFormState,
    id: '2',
    perumahan: 'Puri Safana',
    status: 'Terjual',
    lantai: '2',
    blok: 'B',
    unit: '12',
    tipe: '60/120',
    luasBangunan: '60',
    lokasiStrategis: 'Tidak',
    pembiayaan: 'Cash Keras',
    harga: 850000000,
    lebihTanah: 20000000,
    biayaStrategis: 0,
    totalHargaJual: 870000000,
    nrNilaiPenyerahan: 870000000,
    pjNilaiPenyerahan: 870000000,
  }
];

const CustomerKavling = () => {
  const [data, setData] = useState<KavlingData[]>(initialMockData);
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
      render: (val: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${val === 'Available' ? 'bg-green-100 text-green-800' : val === 'Booking' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {val}
        </span>
      )
    },
  ];

  const openModal = (item: KavlingData) => {
    setFormData(item);
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
    if (!formData.perumahan.trim()) newErrors.perumahan = 'Perumahan wajib diisi';
    if (!formData.blok.trim()) newErrors.blok = 'Blok wajib diisi';
    if (!formData.unit.trim()) newErrors.unit = 'Unit wajib diisi';
    if (!formData.tipe.trim()) newErrors.tipe = 'Tipe wajib diisi';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) setActiveTab('dasar');
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setData((prev) => prev.map((item) => (item.id === formData.id ? formData : item)));
    closeModal();
  };

  const handleDelete = (item: KavlingData) => {
    if (window.confirm(`Hapus data kavling Blok ${item.blok}-${item.unit}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  const tabs = [
    { id: 'dasar', label: 'Info Dasar' },
    { id: 'harga', label: 'Harga Jual' },
    { id: 'nilai', label: 'Nilai Rumah' },
    { id: 'pajak', label: 'Pajak' },
    { id: 'ajb', label: 'Keperluan AJB' },
    { id: 'notaris', label: 'Notaris' },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Kavling Customer"
        columns={columns}
        data={data}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Edit Data Kavling">
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm transition-colors cursor-pointer ${activeTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TAB 1: INFORMASI DASAR */}
          {activeTab === 'dasar' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Input label="Perumahan" name="perumahan" value={formData.perumahan} onChange={handleChange} error={errors.perumahan} />
              <Select label="Status" name="status" value={formData.status} onChange={handleChange} options={[{ value: 'Available', label: 'Available' }, { value: 'Booking', label: 'Booking' }, { value: 'Terjual', label: 'Terjual' }]} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Blok" name="blok" value={formData.blok} onChange={handleChange} error={errors.blok} placeholder="Contoh: A" />
                <Input label="Unit" name="unit" value={formData.unit} onChange={handleChange} error={errors.unit} placeholder="Contoh: 01" />
              </div>
              <Input label="Tipe" name="tipe" value={formData.tipe} onChange={handleChange} error={errors.tipe} placeholder="Contoh: 45/90" />
              <Input label="Lantai" name="lantai" value={formData.lantai} onChange={handleChange} />
              <Input label="Luas Bangunan (m²)" name="luasBangunan" value={formData.luasBangunan} onChange={handleChange} />
              <Select label="Lokasi Strategis" name="lokasiStrategis" value={formData.lokasiStrategis} onChange={handleChange} options={[{ value: 'Ya', label: 'Ya (Hook)' }, { value: 'Tidak', label: 'Tidak' }]} />
              <Select label="Pembiayaan" name="pembiayaan" value={formData.pembiayaan} onChange={handleChange} options={[{ value: 'KPR', label: 'KPR Bank' }, { value: 'Cash Keras', label: 'Cash Keras' }, { value: 'Cash Bertahap', label: 'Cash Bertahap' }]} />
              <Input label="SP3R" name="sp3r" value={formData.sp3r} onChange={handleChange} />
              <Input label="Tanggal Akad PPJB" type="date" name="tanggalAkadPpjb" value={formData.tanggalAkadPpjb} onChange={handleChange} />
              <Input label="Akad PPJB" name="akadPpjb" value={formData.akadPpjb} onChange={handleChange} />
              <Input label="Tanggal Akad AJB PPAT" type="date" name="tanggalAkadAjbPpat" value={formData.tanggalAkadAjbPpat} onChange={handleChange} />
              <Input label="Tanggal Pembayaran PPh" type="date" name="tanggalPembayaranPph" value={formData.tanggalPembayaranPph} onChange={handleChange} />
              <Input label="Tanggal Pembayaran BPHTB" type="date" name="tanggalPembayaranBphtb" value={formData.tanggalPembayaranBphtb} onChange={handleChange} />
            </div>
          )}

          {/* TAB 2: HARGA JUAL */}
          {activeTab === 'harga' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Input label="Harga Standar (Rp)" type="number" name="harga" value={formData.harga || ''} onChange={handleChange} />
              <Input label="Lebih Tanah (Rp)" type="number" name="lebihTanah" value={formData.lebihTanah || ''} onChange={handleChange} />
              <Input label="Biaya Strategis (Rp)" type="number" name="biayaStrategis" value={formData.biayaStrategis || ''} onChange={handleChange} />
              <div className="md:col-span-2 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Total Harga Jual</span>
                <span className="text-xl font-bold text-gray-900">{formatRupiah(formData.totalHargaJual)}</span>
              </div>
            </div>
          )}

          {/* TAB 3: NILAI RUMAH */}
          {activeTab === 'nilai' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SectionTitle title="Subsidi & Bonus (Nilai Rumah)" />
              <Input label="Biaya KPR & Asuransi" type="number" name="nrBiayaKprAsuransi" value={formData.nrBiayaKprAsuransi || ''} onChange={handleChange} />
              <Input label="Diskon Angsuran" type="number" name="nrDiskonAngsuran" value={formData.nrDiskonAngsuran || ''} onChange={handleChange} />
              <Input label="Diskon Cash & Lainnya" type="number" name="nrDiskonCash" value={formData.nrDiskonCash || ''} onChange={handleChange} />
              <Input label="Biaya Balik Nama Sertifikat" type="number" name="nrBiayaBbn" value={formData.nrBiayaBbn || ''} onChange={handleChange} />
              <Input label="Biaya Notaris AJB" type="number" name="nrBiayaNotarisAjb" value={formData.nrBiayaNotarisAjb || ''} onChange={handleChange} />
              <Input label="Biaya Appraisal" type="number" name="nrBiayaAppraisal" value={formData.nrBiayaAppraisal || ''} onChange={handleChange} />
              <Input label="Biaya BPHTB" type="number" name="nrBiayaBphtb" value={formData.nrBiayaBphtb || ''} onChange={handleChange} />
              <Input label="Lain-lain (Utilitas, Fisik)" type="number" name="nrLainLain" value={formData.nrLainLain || ''} onChange={handleChange} />
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-md flex justify-between items-center border border-gray-200">
                <span className="text-sm font-medium text-gray-600">Total Subsidi & Bonus</span>
                <span className="font-bold text-red-600">- {formatRupiah(formData.nrTotalSubsidi)}</span>
              </div>
              <div className="md:col-span-2 bg-blue-50 p-4 rounded-md flex justify-between items-center border border-blue-200 mb-4">
                <span className="text-sm font-medium text-blue-800">Nilai Penyerahan (Setelah Subsidi)</span>
                <span className="text-xl font-bold text-blue-900">{formatRupiah(formData.nrNilaiPenyerahan)}</span>
              </div>
              <SectionTitle title="Pajak Nilai Rumah" />
              <Input label="PPN" type="number" name="nrPpn" value={formData.nrPpn || ''} onChange={handleChange} />
              <Input label="BPHTB" type="number" name="nrBphtb" value={formData.nrBphtb || ''} onChange={handleChange} />
              <Input label="PPh" type="number" name="nrPph" value={formData.nrPph || ''} onChange={handleChange} />
            </div>
          )}

          {/* TAB 4: PAJAK */}
          {activeTab === 'pajak' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SectionTitle title="Subsidi & Bonus (Pajak)" />
              <Input label="Biaya KPR" type="number" name="pjBiayaKpr" value={formData.pjBiayaKpr || ''} onChange={handleChange} />
              <Input label="Biaya Asuransi" type="number" name="pjBiayaAsuransi" value={formData.pjBiayaAsuransi || ''} onChange={handleChange} />
              <Input label="Diskon Angsuran" type="number" name="pjDiskonAngsuran" value={formData.pjDiskonAngsuran || ''} onChange={handleChange} />
              <Input label="Biaya Balik Nama Sertifikat" type="number" name="pjBiayaBbn" value={formData.pjBiayaBbn || ''} onChange={handleChange} />
              <Input label="Biaya Pembuatan AJB" type="number" name="pjBiayaAjb" value={formData.pjBiayaAjb || ''} onChange={handleChange} />
              <Input label="Biaya Appraisal" type="number" name="pjBiayaAppraisal" value={formData.pjBiayaAppraisal || ''} onChange={handleChange} />
              <Input label="BPHTB" type="number" name="pjBphtb" value={formData.pjBphtb || ''} onChange={handleChange} />
              <Input label="Lain-lain (Utilitas, Fisik)" type="number" name="pjLainLain" value={formData.pjLainLain || ''} onChange={handleChange} />
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-md flex justify-between items-center border border-gray-200">
                <span className="text-sm font-medium text-gray-600">Total Subsidi & Bonus (Pajak)</span>
                <span className="font-bold text-red-600">- {formatRupiah(formData.pjTotalSubsidi)}</span>
              </div>
              <div className="md:col-span-2 bg-blue-50 p-4 rounded-md flex justify-between items-center border border-blue-200 mb-4">
                <span className="text-sm font-medium text-blue-800">Nilai Penyerahan (Pajak)</span>
                <span className="text-xl font-bold text-blue-900">{formatRupiah(formData.pjNilaiPenyerahan)}</span>
              </div>
              <SectionTitle title="Detail Pajak" />
              <Input label="PPN" type="number" name="pjPpn" value={formData.pjPpn || ''} onChange={handleChange} />
              <Input label="BPHTB" type="number" name="pjBphtbPajak" value={formData.pjBphtbPajak || ''} onChange={handleChange} />
              <Input label="PPh" type="number" name="pjPph" value={formData.pjPph || ''} onChange={handleChange} />
              <div className="md:col-span-2 mt-2 p-4 bg-gray-600 rounded-md flex justify-between items-center">
                <span className="text-sm font-medium text-white">BPHTB + PPh</span>
                <span className="font-bold text-white">{formatRupiah(formData.pjTotalBphtbPph)}</span>
              </div>
            </div>
          )}

          {/* TAB 5: KEPERLUAN AJB */}
          {activeTab === 'ajb' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SectionTitle title="Nilai Jual Objek Pajak (NJOP)" />
              <Input label="NJOP Tanah per Meter" type="number" name="ajbNjopTanahPerMeter" value={formData.ajbNjopTanahPerMeter || ''} onChange={handleChange} />
              <Input label="Total NJOP Tanah" type="number" name="ajbNjopTanah" value={formData.ajbNjopTanah || ''} onChange={handleChange} />
              <Input label="NJOP Bangunan per Meter" type="number" name="ajbNjopBangunanPerMeter" value={formData.ajbNjopBangunanPerMeter || ''} onChange={handleChange} />
              <Input label="Total NJOP Bangunan" type="number" name="ajbNjopBangunan" value={formData.ajbNjopBangunan || ''} onChange={handleChange} />
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-md flex justify-between items-center border border-gray-200 mb-4">
                <span className="text-sm font-medium text-gray-600">NJOP Tanah + Bangunan</span>
                <span className="font-bold text-gray-900">{formatRupiah(formData.ajbNjopTotal)}</span>
              </div>
              <SectionTitle title="Kewajiban Pajak AJB" />
              <Input label="PPN" type="number" name="ajbPpn" value={formData.ajbPpn || ''} onChange={handleChange} />
              <Input label="BPHTB" type="number" name="ajbBphtb" value={formData.ajbBphtb || ''} onChange={handleChange} />
              <Input label="PPh" type="number" name="ajbPph" value={formData.ajbPph || ''} onChange={handleChange} />
              <div className="md:col-span-2 mt-2 p-4 bg-gray-600 rounded-md flex justify-between items-center">
                <span className="text-sm font-medium text-white">BPHTB + PPh (AJB)</span>
                <span className="font-bold text-white">{formatRupiah(formData.ajbTotalBphtbPph)}</span>
              </div>
              <SectionTitle title="Lain-lain" />
              <Input label="Selisih (BPHTB+PPh) Pajak - PBB" type="number" name="ajbSelisihPajakPbb" value={formData.ajbSelisihPajakPbb || ''} onChange={handleChange} />
              <Input label="Uping" type="number" name="ajbUping" value={formData.ajbUping || ''} onChange={handleChange} />
            </div>
          )}

          {/* TAB 6: NOTARIS (TAMBAHAN BARU) */}
          {activeTab === 'notaris' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SectionTitle title="Pemilihan Notaris" />
              <div className="md:col-span-2">
                <Select
                  label="Pilih Notaris"
                  name="notarisName"
                  value={formData.notarisName}
                  onChange={handleChange}
                  options={mockNotaris.map(n => ({ value: n.name, label: n.name }))}
                />
              </div>

            </div>
          )}

          {/* FOOTER BUTTONS */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-8">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 cursor-pointer">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 cursor-pointer">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const SectionTitle = ({ title }: { title: string }) => (
  <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2 md:col-span-2">{title}</h4>
);

export default CustomerKavling;
import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import { formatDate, formatRupiah } from "../../utils/formatters";
import { FileText, Receipt, Printer, UploadCloud } from 'lucide-react';

interface PenjualanData {
  id: string;
  tanggal: string;
  nama: string;
  alamat: string;
  noTelepon: string;
  noIdentitas: string;
  perusahaan: string;
  alamatKoresponden: string;
  perumahan: string;
  blok: string;
  tipe: string;
  nomorUnit: string;
  hargaJual: number;
  dp: number;
  diskonPenjualan: number;
  hargaPromosi: number;
  bank: string;
  caraPembayaran: string;
  nilaiPengajuanKpr: number;
  fileKtp: string;
  fileKk: string;
  fileNpwp: string;
  bookingFee: number;
  status: string;
  agent: string;
  jumlahCicilanTerbayar?: number;
  fileBuktiBooking?: string;
  fileBuktiDp?: string;
}

const initialFormState: PenjualanData = {
  id: '',
  tanggal: '',
  nama: '',
  alamat: '',
  noTelepon: '',
  noIdentitas: '',
  perusahaan: '',
  alamatKoresponden: '',
  perumahan: '',
  blok: '',
  tipe: '',
  nomorUnit: '',
  hargaJual: 0,
  dp: 0,
  diskonPenjualan: 0,
  hargaPromosi: 0,
  bank: '',
  caraPembayaran: '',
  nilaiPengajuanKpr: 0,
  fileKtp: '',
  fileKk: '',
  fileNpwp: '',
  bookingFee: 5000000,
  status: 'Booked',
  agent: '',
  fileBuktiBooking: '',
  fileBuktiDp: '',
};

const mockPerumahanList = ['Puri Safana'];

const Penjualan = () => {
  const [data, setData] = useState<PenjualanData[]>([
    {
      ...initialFormState,
      id: 'TRX-001',
      tanggal: '2026-04-09',
      nama: 'Budi Santoso',
      perumahan: 'Puri Safana',
      blok: 'A',
      nomorUnit: '01',
      caraPembayaran: 'KPR',
      status: 'Booking',
      agent: 'Andi Pratama',
      jumlahCicilanTerbayar: 2,
      fileBuktiBooking: 'bukti_booking_budi.pdf',
      fileBuktiDp: ''
    }
  ]);
  const [agentList, setAgentList] = useState<string[]>(['Andi Pratama', 'Rina Wijaya']);
  const [isNewAgent, setIsNewAgent] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<PenjualanData>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof PenjualanData, string>>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [printType, setPrintType] = useState<'invoice' | 'kwitansi' | null>(null);
  const [printTitle, setPrintTitle] = useState('');

  const columns = [
    { header: 'ID Penjualan', accessor: 'id' },
    { header: 'Tanggal', accessor: 'tanggal', render: (val: string) => formatDate(val) },
    { header: 'Nama Customer', accessor: 'nama' },
    { header: 'Perumahan', accessor: 'perumahan' },
    { header: 'Kavling', accessor: 'blok', render: (_: any, row: PenjualanData) => `${row.blok} - ${row.nomorUnit}` },
    { header: 'Cara Pembayaran', accessor: 'caraPembayaran' },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          {val}
        </span>
      )
    },
  ];

  const openModal = (item?: PenjualanData) => {
    if (item) {
      setFormData(item);
      setIsEditing(true);
      if (item.agent && !agentList.includes(item.agent)) {
        setIsNewAgent(true);
      } else {
        setIsNewAgent(false);
      }
    } else {
      setFormData({
        ...initialFormState,
        tanggal: new Date().toISOString().split('T')[0]
      });
      setIsEditing(false);
      setIsNewAgent(false);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setIsNewAgent(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'caraPembayaran' && value !== 'KPR') {
      setFormData(prev => ({ ...prev, [name]: value, nilaiPengajuanKpr: 0 }));
    } else {
      const parsedValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;
      setFormData((prev) => {
        const updates: any = { [name]: parsedValue };
        if (name === 'hargaJual') {
          updates.dp = (parsedValue as number) * 0.1;
        }
        return { ...prev, ...updates };
      });
    }
    if (errors[name as keyof PenjualanData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [fieldName]: file.name }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof PenjualanData, string>> = {};
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.perumahan.trim()) newErrors.perumahan = 'Perumahan wajib diisi';
    if (!formData.blok.trim()) newErrors.blok = 'Blok wajib diisi';
    if (!formData.nomorUnit.trim()) newErrors.nomorUnit = 'Nomor Unit wajib diisi';
    if (!formData.caraPembayaran) newErrors.caraPembayaran = 'Cara pembayaran wajib dipilih';
    if (formData.caraPembayaran && !formData.bank.trim()) {
      newErrors.bank = 'Bank wajib diisi';
    }
    if (formData.caraPembayaran === 'KPR') {
      if (formData.nilaiPengajuanKpr <= 0) newErrors.nilaiPengajuanKpr = 'Nilai pengajuan harus lebih dari 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (isNewAgent && formData.agent.trim() !== '') {
      if (!agentList.includes(formData.agent)) {
        setAgentList(prev => [...prev, formData.agent]);
      }
    }
    if (isEditing) {
      setData((prev) => prev.map((item) => (item.id === formData.id ? formData : item)));
    } else {
      const newId = `TRX-${String(data.length + 1).padStart(3, '0')}`;
      setData((prev) => [...prev, { ...formData, id: newId }]);
    }
    closeModal();
  };

  const handleDelete = (item: PenjualanData) => {
    if (window.confirm(`Hapus data penjualan ${item.id}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  const expandedRowRender = (row: PenjualanData) => {
    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
          <h4 className="text-sm font-bold text-slate-800">Manajemen Dokumen Penjualan & Tagihan Awal</h4>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold border border-blue-100">
            Status: {row.status}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tindakan Dokumen (DP & Booking)</h5>
            <div className="flex flex-col gap-2">
              {/* BOOKING */}
              <div className="flex items-center gap-2">
                <button onClick={() => { setPrintType('invoice'); setPrintTitle('Invoice Booking Fee'); setPrintData({ ...row, nominalCetak: row.bookingFee }); }} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <FileText size={14} /> Invoice Booking
                </button>
                {row.fileBuktiBooking ? (
                  <button onClick={() => { setPrintType('kwitansi'); setPrintTitle('Kwitansi Booking Fee'); setPrintData({ ...row, nominalCetak: row.bookingFee }); }} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                    <Receipt size={14} /> Kwitansi Booking
                  </button>
                ) : (
                  <button onClick={() => openModal(row)} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    <UploadCloud size={14} /> Upload Bukti
                  </button>
                )}
              </div>

              {/* DOWN PAYMENT */}
              <div className="flex items-center gap-2">
                <button onClick={() => { setPrintType('invoice'); setPrintTitle('Invoice Down Payment (DP)'); setPrintData({ ...row, nominalCetak: row.dp }); }} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <FileText size={14} /> Invoice DP
                </button>
                {row.fileBuktiDp ? (
                  <button onClick={() => { setPrintType('kwitansi'); setPrintTitle('Kwitansi Down Payment (DP)'); setPrintData({ ...row, nominalCetak: row.dp }); }} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                    <Receipt size={14} /> Kwitansi DP
                  </button>
                ) : (
                  <button onClick={() => openModal(row)} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    <UploadCloud size={14} /> Upload Bukti
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Status Pembayaran Cicilan</h5>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black text-slate-800">{row.jumlahCicilanTerbayar || 0}</div>
              <div className="text-sm text-slate-600 font-medium leading-tight">Kali<br />Cicilan Terbayar</div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 italic">*Pembuatan, pembayaran, dan pencetakan cicilan sepenuhnya dilakukan di halaman Tagihan.</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Data Penjualan"
        columns={columns}
        data={data}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
        expandedRowRender={expandedRowRender}
      />
      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit Penjualan / Upload Bukti" : "Tambah Penjualan Baru"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">1. Data Pembeli & Marketing</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mb-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                {!isNewAgent ? (
                  <Select
                    label="Agent Marketing"
                    name="agent"
                    value={formData.agent}
                    onChange={(e) => {
                      if (e.target.value === 'NEW') {
                        setIsNewAgent(true);
                        setFormData((prev) => ({ ...prev, agent: '' }));
                      } else {
                        handleChange(e);
                      }
                    }}
                    options={[
                      ...agentList.map(a => ({ value: a, label: a })),
                      { value: 'NEW', label: '+ Tambah Agent Baru...' }
                    ]}
                  />
                ) : (
                  <div className="relative animate-in fade-in zoom-in-95 duration-200">
                    <Input
                      label="Nama Agent Baru"
                      name="agent"
                      value={formData.agent}
                      onChange={handleChange}
                      placeholder="Ketik nama agent..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewAgent(false);
                        setFormData((prev) => ({ ...prev, agent: '' }));
                      }}
                      className="absolute right-1 top-0 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      Batal Tambah
                    </button>
                  </div>
                )}
              </div>
              <Input label="Nama Lengkap Customer" name="nama" value={formData.nama} onChange={handleChange} error={errors.nama} />
              <Input label="No Identitas (KTP)" name="noIdentitas" value={formData.noIdentitas} onChange={handleChange} />
              <Input label="No Telepon / HP" name="noTelepon" value={formData.noTelepon} onChange={handleChange} />
              <Input label="Perusahaan" name="perusahaan" value={formData.perusahaan} onChange={handleChange} />
              <div className="md:col-span-2">
                <Input label="Alamat Sesuai KTP" name="alamat" value={formData.alamat} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <Input label="Alamat Koresponden" name="alamatKoresponden" value={formData.alamatKoresponden} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">2. Data Kavling</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Perumahan"
                name="perumahan"
                value={formData.perumahan}
                onChange={handleChange}
                error={errors.perumahan}
                options={mockPerumahanList.map(p => ({ value: p, label: p }))}
              />
              <Input label="Blok" name="blok" value={formData.blok} onChange={handleChange} error={errors.blok} />
              <Input label="Tipe" name="tipe" value={formData.tipe} onChange={handleChange} />
              <Input label="Nomor Unit" name="nomorUnit" value={formData.nomorUnit} onChange={handleChange} error={errors.nomorUnit} />
              <Input label="Harga Promosi (Rp)" type="number" name="hargaPromosi" value={formData.hargaPromosi === 0 ? '' : formData.hargaPromosi} onChange={handleChange} />
              <Input label="Harga Jual (Rp)" type="number" name="hargaJual" value={formData.hargaJual === 0 ? '' : formData.hargaJual} onChange={handleChange} />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">3. Skema Pembayaran</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Cara Pembayaran"
                name="caraPembayaran"
                value={formData.caraPembayaran}
                onChange={handleChange}
                options={[
                  { value: 'CASH KERAS', label: 'CASH KERAS' },
                  { value: 'CASH BERTAHAP', label: 'CASH BERTAHAP' },
                  { value: 'KPR', label: 'KPR' }
                ]}
                error={errors.caraPembayaran}
              />
              <Input
                label="Down Payment (DP) - Rp"
                type="number"
                name="dp"
                value={formData.dp}
                onChange={handleChange}
                placeholder="Otomatis 10% dari Harga Jual"
              />
              <Input
                label="Diskon Penjualan (Rp)"
                type="number"
                name="diskonPenjualan"
                value={formData.diskonPenjualan === 0 ? '' : formData.diskonPenjualan}
                onChange={handleChange}
              />
            </div>
            {formData.caraPembayaran && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
                <Input
                  label={formData.caraPembayaran === 'KPR' ? "Bank KPR" : "Bank"}
                  name="bank"
                  value={formData.bank}
                  onChange={handleChange}
                  placeholder="Contoh: BCA, BSI, Mandiri"
                  error={errors.bank}
                />
                {formData.caraPembayaran === 'KPR' && (
                  <Input
                    label="Nilai Pengajuan KPR (Rp)"
                    type="number"
                    name="nilaiPengajuanKpr"
                    value={formData.nilaiPengajuanKpr === 0 ? '' : formData.nilaiPengajuanKpr}
                    onChange={handleChange}
                    error={errors.nilaiPengajuanKpr}
                  />
                )}
              </div>
            )}
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">4. Upload Berkas (Opsional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FileInput label="Upload KTP" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'fileKtp')} />
                {formData.fileKtp && <p className="text-xs text-green-600 mt-1 truncate">{formData.fileKtp}</p>}
              </div>
              <div>
                <FileInput label="Upload KK" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'fileKk')} />
                {formData.fileKk && <p className="text-xs text-green-600 mt-1 truncate">{formData.fileKk}</p>}
              </div>
              <div>
                <FileInput label="Upload NPWP" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'fileNpwp')} />
                {formData.fileNpwp && <p className="text-xs text-green-600 mt-1 truncate">{formData.fileNpwp}</p>}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">5. Booking Fee</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Booking Fee (Fixed Rp)"
                type="number"
                name="bookingFee"
                value={formData.bookingFee}
                readOnly
                className="px-3 py-2 border rounded-md focus:outline-none bg-gray-200 text-gray-600 cursor-not-allowed w-full"
              />
            </div>
          </div>

          {/* Form Upload Transfer hanya muncul di mode EDIT */}
          {isEditing && (
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">6. Upload Bukti Transfer</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FileInput label="Bukti Transfer Booking" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'fileBuktiBooking')} />
                  {formData.fileBuktiBooking && <p className="text-xs text-green-600 mt-1 truncate">{formData.fileBuktiBooking}</p>}
                </div>
                <div>
                  <FileInput label="Bukti Transfer DP" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'fileBuktiDp')} />
                  {formData.fileBuktiDp && <p className="text-xs text-green-600 mt-1 truncate">{formData.fileBuktiDp}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 transition-colors cursor-pointer">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 transition-colors cursor-pointer">
              Simpan Penjualan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Pratinjau Print Invoice / Kwitansi */}
      <Modal isOpen={!!printData} onClose={() => setPrintData(null)} title={`Pratinjau Dokumen`}>
        {printData && (
          <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-xl" id="print-area">
            <div className="text-center mb-8 border-b border-slate-200 pb-6">
              <h2 className="text-2xl font-black uppercase tracking-widest text-slate-900">{printType === 'invoice' ? 'INVOICE' : 'KWITANSI PEMBAYARAN'}</h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">{printTitle} - No: {printData.id} / BMT / {new Date().getFullYear()}</p>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
              <div>
                <p className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">Diterima Dari / Kepada Yth:</p>
                <p className="font-black text-lg text-slate-800">{printData.nama}</p>
                <p className="text-slate-600 font-medium">{printData.perumahan} - Blok {printData.blok} {printData.nomorUnit ? `No. ${printData.nomorUnit}` : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">Tanggal Cetak:</p>
                <p className="font-bold text-slate-800">{formatDate(new Date().toISOString())}</p>
              </div>
            </div>
            <div className="mb-8">
              <p className="text-slate-400 font-bold mb-2 uppercase tracking-wider text-[10px]">Keterangan Pembayaran:</p>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl font-medium text-slate-700">
                {printTitle} untuk unit Kavling {printData.perumahan} Blok {printData.blok} {printData.nomorUnit ? `No. ${printData.nomorUnit}` : ''}.
              </div>
            </div>
            <div className="flex justify-between items-center p-5 bg-slate-100 rounded-xl border border-slate-200">
              <p className="font-black text-slate-700 uppercase tracking-widest text-sm">Total Nominal</p>
              <p className="text-2xl font-black text-slate-900">{formatRupiah(printData.nominalCetak || 0)}</p>
            </div>
            <div className="mt-16 flex justify-end">
              <div className="text-center">
                <p className="text-slate-500 mb-16 font-medium">Hormat Kami,</p>
                <p className="font-bold border-b border-slate-300 pb-1 text-slate-800">Finance Dept.</p>
                <p className="text-xs text-slate-400 mt-1 font-bold">Bumantaraz</p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={() => setPrintData(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-50">Tutup</button>
          <button onClick={() => {
            alert('Membuka browser print dialog (Simulasi)');
          }} className="px-6 py-2 bg-black text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-800 shadow-lg shadow-black/10 flex items-center gap-2">
            <Printer size={16} /> Cetak Dokumen
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Penjualan;
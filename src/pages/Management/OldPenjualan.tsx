/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import { formatDate, formatRupiah } from "../../utils/formatters";
import { FileText, Receipt, Printer, UploadCloud } from 'lucide-react';
import { jsPDF } from "jspdf";
import * as htmlToImage from 'html-to-image';

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
  luasBangunan?: number;
  luasTanah?: number;
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
  luasBangunan: 0,
  luasTanah: 0,
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

const KAVLING_DATA: Record<string, { lb: number; lt: number[] }> = {
  Asvara: { lb: 48, lt: [60, 61, 62, 64, 67, 68, 72, 76, 79, 80, 81, 96, 100, 120, 123, 127, 132, 134, 135] },
  Adara: { lb: 52, lt: [60, 61, 65, 70, 75, 82, 85, 87, 114, 120, 121, 133, 148] },
  Aruna: { lb: 73, lt: [60, 62, 63, 67, 71, 91, 109, 154] },
  Ansara: { lb: 36, lt: [60, 103, 120, 122, 132, 143] }
};

const Penjualan = () => {
  const [data, setData] = useState<PenjualanData[]>([
    {
      ...initialFormState,
      id: 'TRX-001',
      tanggal: '2026-04-09',
      nama: 'Budi Santoso',
      alamat: 'Jl. Merdeka No. 45, Tangerang',
      noTelepon: '081234567890',
      perumahan: 'Puri Safana',
      blok: 'A',
      tipe: 'Asvara',
      nomorUnit: '01',
      caraPembayaran: 'KPR',
      bank: 'BCA',
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
    { header: 'Kavling', accessor: 'blok', render: (_: unknown, row: PenjualanData) => `${row.blok} - ${row.nomorUnit}` },
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
      setFormData({ ...item });
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
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    const finalValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;

    setFormData((prev) => {
      const updates: any = { [name]: finalValue };

      if (name === 'hargaJual') {
        updates.dp = Number(finalValue) * 0.1;
      }

      if (name === 'caraPembayaran' && finalValue !== 'KPR') {
        updates.nilaiPengajuanKpr = 0;
      }

      if (name === 'tipe') {
        const selectedKavling = KAVLING_DATA[finalValue];
        updates.luasBangunan = selectedKavling ? selectedKavling.lb : 0;
        updates.luasTanah = 0;
      }

      return { ...prev, ...updates };
    });

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
    if (!formData.agent.trim()) newErrors.agent = 'Agent wajib dipilih/diisi';

    if (formData.caraPembayaran) {
      if (!formData.bank.trim()) newErrors.bank = 'Bank wajib diisi';
      if (formData.caraPembayaran === 'KPR' && formData.nilaiPengajuanKpr <= 0) {
        newErrors.nilaiPengajuanKpr = 'Nilai pengajuan harus lebih dari 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createAndDownloadPDF = async (data: PenjualanData, title: string, nominal: number) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '800px';

    const docType = title.toLowerCase().includes('kwitansi') ? 'KWITANSI' : 'INVOICE';
    const labelKepada = docType === 'KWITANSI' ? 'Telah Diterima Dari:' : 'Ditagihkan Kepada:';
    const labelTotal = docType === 'KWITANSI' ? 'Total' : 'Total';

    container.innerHTML = `
      <div style="padding: 40px; background-color: white; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 32px;">
          <div>
            <h2 style="font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin: 0;">${docType}</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 8px; font-weight: 500;">No: ${data.id} / BMT / 2026</p>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Tanggal: ${formatDate(data.tanggal || new Date().toISOString())}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0; font-size: 18px; color: #0f172a;">BUMANTARA</h3>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Divisi Marketing & Keuangan</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
          <div style="max-width: 50%;">
            <p style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0; font-weight: bold;">${labelKepada}</p>
            <p style="font-size: 16px; font-weight: bold; color: #0f172a; margin: 0 0 4px 0;">${data.nama}</p>
            <p style="font-size: 14px; margin: 0 0 4px 0;">${data.noTelepon || '-'}</p>
            <p style="font-size: 14px; margin: 0; line-height: 1.5;">${data.alamat || '-'}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
          <thead>
            <tr>
              <th style="padding: 12px 16px; text-align: left; background-color: #f1f5f9; color: #475569; font-size: 12px; text-transform: uppercase; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">Deskripsi Pembayaran</th>
              <th style="padding: 12px 16px; text-align: right; background-color: #f1f5f9; color: #475569; font-size: 12px; text-transform: uppercase; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 24px 16px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
                <p style="font-size: 15px; font-weight: bold; color: #0f172a; margin: 0 0 8px 0;">${title}</p>
                <p style="font-size: 14px; color: #475569; margin: 0 0 4px 0;">Perumahan: <strong>${data.perumahan}</strong></p>
                <p style="font-size: 14px; color: #475569; margin: 0 0 4px 0;">Kavling: <strong>Blok ${data.blok} - No. ${data.nomorUnit}</strong> ${data.tipe ? `(Tipe ${data.tipe})` : ''}</p>
                <p style="font-size: 14px; color: #475569; margin: 0;">Skema Pembayaran: <strong>${data.caraPembayaran}</strong> ${data.bank ? `(${data.bank})` : ''}</p>
              </td>
              <td style="padding: 24px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; vertical-align: top; font-size: 16px; font-weight: bold; color: #0f172a;">
                ${formatRupiah(nominal)}
              </td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 48px;">
          <div style="width: 300px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
              <span style="font-size: 14px; font-weight: bold; color: #475569; text-transform: uppercase;">${labelTotal}</span>
              <span style="font-size: 20px; font-weight: 900; color: #0f172a;">${formatRupiah(nominal)}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; text-align: center;">
          <div style="width: 200px;">
            <p style="font-size: 14px; color: #475569; margin: 0 0 80px 0;">Tangerang, ${formatDate(data.tanggal || new Date().toISOString())}</p>
            <p style="font-size: 14px; font-weight: bold; color: #0f172a; margin: 0; text-decoration: underline;">Divisi Keuangan</p>
            <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">Bumantara</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const element = container.firstElementChild as HTMLElement;
      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const fileName = `${title.replace(/\s+/g, '_')}_${data.id}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Gagal membuat PDF otomatis:', error);
    } finally {
      document.body.removeChild(container);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isNewAgent && formData.agent.trim() !== '') {
      if (!agentList.includes(formData.agent)) {
        setAgentList(prev => [...prev, formData.agent]);
      }
    }

    if (isEditing) {
      setData((prev) => prev.map((item) => (item.id === formData.id ? { ...formData } : item)));
      closeModal();
    } else {
      const nextNumber = data.length > 0 ? Math.max(...data.map(d => parseInt(d.id.split('-')[1]))) + 1 : 1;
      const newId = `TRX-${String(nextNumber).padStart(3, '0')}`;
      const newData = { ...formData, id: newId };
      setData((prev) => [...prev, newData]);

      closeModal();

      await createAndDownloadPDF(newData, 'Invoice Booking Fee', newData.bookingFee);
      await createAndDownloadPDF(newData, 'Invoice Down Payment', newData.dp);
    }
  };

  const handleDelete = (item: PenjualanData) => {
    if (window.confirm(`Hapus data penjualan ${item.id}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  const sendToWhatsApp = (row: any, type: string) => {
    const phone = (row.noTelepon || '').replace(/[^0-9]/g, '');
    if (!phone) {
      alert('Nomor telepon tidak valid');
      return;
    }
    const waPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const message = `Halo Bapak/Ibu ${row.nama}, berikut kami kirimkan ${type} untuk unit Kavling ${row.perumahan} Blok ${row.blok}-${row.nomorUnit}. Terima kasih.`;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const expandedRowRender = (row: PenjualanData) => {
    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
          <h4 className="text-sm font-bold text-slate-800">Manajemen Dokumen Penjualan & Tagihan Awal</h4>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-100 uppercase tracking-wider">
            Status: {row.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">1. Booking Fee</h5>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setPrintType('invoice');
                  setPrintTitle('Invoice Booking Fee');
                  setPrintData({ ...row, nominalCetak: row.bookingFee });
                }}
                className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <FileText size={14} /> Invoice
              </button>

              {row.fileBuktiBooking ? (
                <>
                  <button
                    onClick={() => {
                      setPrintType('kwitansi');
                      setPrintTitle('Kwitansi Booking Fee');
                      setPrintData({ ...row, nominalCetak: row.bookingFee });
                    }}
                    className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
                  >
                    <Receipt size={14} /> Kwitansi
                  </button>
                  <button
                    onClick={() => sendToWhatsApp(row, 'Kwitansi Booking Fee')}
                    className="p-2 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
                  >
                    <UploadCloud size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => openModal(row)}
                  className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-md"
                >
                  <UploadCloud size={14} /> Upload Bukti Booking
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">2. Down Payment</h5>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setPrintType('invoice');
                  setPrintTitle('Invoice Down Payment (DP)');
                  setPrintData({ ...row, nominalCetak: row.dp });
                }}
                className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <FileText size={14} /> Invoice DP
              </button>

              {row.fileBuktiDp ? (
                <>
                  <button
                    onClick={() => {
                      setPrintType('kwitansi');
                      setPrintTitle('Kwitansi Down Payment (DP)');
                      setPrintData({ ...row, nominalCetak: row.dp });
                    }}
                    className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
                  >
                    <Receipt size={14} /> Kwitansi DP
                  </button>
                  <button
                    onClick={() => sendToWhatsApp(row, 'Kwitansi DP')}
                    className="p-2 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
                  >
                    <UploadCloud size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => openModal(row)}
                  className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-md"
                >
                  <UploadCloud size={14} /> Upload Bukti DP
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handlePrintPDF = async () => {
    const element = document.getElementById('print-area');
    if (!element) return;

    try {
      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        fontEmbedCSS: ''
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const fileName = `${printTitle ? printTitle.replace(/\s+/g, '_') : 'Dokumen'}_${printData?.id || 'BMT'}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Gagal membuat PDF:', error);
      alert('Terjadi kesalahan saat memproses PDF.');
    }
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
                    error={errors.agent}
                    options={[
                      { value: '', label: '-- Pilih Agent --' },
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
                      error={errors.agent}
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
                options={[
                  { value: '', label: '-- Pilih Perumahan --' },
                  ...mockPerumahanList.map(p => ({ value: p, label: p }))
                ]}
              />
              <Input label="Blok" name="blok" value={formData.blok} onChange={handleChange} error={errors.blok} />

              <Select
                label="Tipe Kavling"
                name="tipe"
                value={formData.tipe}
                onChange={handleChange}
                options={[
                  { value: '', label: '-- Pilih Tipe --' },
                  ...Object.keys(KAVLING_DATA).map(t => ({ value: t, label: t }))
                ]}
              />

              <Select
                label="Luas Tanah (LT)"
                name="luasTanah"
                value={formData.luasTanah || ''}
                onChange={handleChange}
                options={[
                  { value: '', label: '-- Pilih LT --' },
                  ...(formData.tipe && KAVLING_DATA[formData.tipe]
                    ? [...KAVLING_DATA[formData.tipe].lt].sort((a, b) => a - b).map(lt => ({ value: lt, label: String(lt) }))
                    : [])
                ]}
              />

              <Input
                label="Luas Bangunan (LB)"
                name="luasBangunan"
                type="number"
                value={formData.luasBangunan || ''}
                readOnly
              />
              <Input label="Nomor Unit" name="nomorUnit" value={formData.nomorUnit} onChange={handleChange} error={errors.nomorUnit} />
              <Input label="Harga Promosi (Rp)" type="number" name="hargaPromosi" value={formData.hargaPromosi || ''} onChange={handleChange} />
              <Input label="Harga Jual (Rp)" type="number" name="hargaJual" value={formData.hargaJual || ''} onChange={handleChange} />
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
                  { value: '', label: '-- Pilih --' },
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
                value={formData.dp || ''}
                onChange={handleChange}
                placeholder="Otomatis 10% dari Harga Jual"
              />
              <Input
                label="Diskon Penjualan (Rp)"
                type="number"
                name="diskonPenjualan"
                value={formData.diskonPenjualan || ''}
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
                    value={formData.nilaiPengajuanKpr || ''}
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
                className="bg-gray-200 cursor-not-allowed text-black px-4 py-2 rounded-md"
              />
            </div>
          </div>

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
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors cursor-pointer">
              Simpan Penjualan
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!printData} onClose={() => setPrintData(null)} title={`Pratinjau Dokumen`}>
        {printData && (
          <div className="p-8 bg-white border border-slate-200 rounded-xl" id="print-area" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-8">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-widest text-slate-900 m-0">
                  {printType === 'invoice' ? 'INVOICE' : 'KWITANSI'}
                </h2>
                <p className="text-slate-500 text-sm mt-2 font-medium">No: {printData.id} / BMT / 2026</p>
                <p className="text-slate-500 text-sm mt-1">Tanggal: {formatDate(printData.tanggal || new Date().toISOString())}</p>
              </div>
              <div className="text-right">
                <h3 className="m-0 text-xl font-bold text-slate-900">BUMANTARA</h3>
                <p className="m-0 mt-1 text-xs text-slate-500">Divisi Marketing & Keuangan</p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="flex justify-between mb-8">
              <div className="max-w-[50%]">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold">
                  {printType === 'kwitansi' ? 'Telah Diterima Dari:' : 'Ditagihkan Kepada:'}
                </p>
                <p className="text-lg font-bold text-slate-900 m-0 mb-1">{printData.nama}</p>
                <p className="text-sm m-0 mb-1 text-slate-600">{printData.noTelepon || '-'}</p>
                <p className="text-sm m-0 leading-relaxed text-slate-600">{printData.alamat || '-'}</p>
              </div>
            </div>

            {/* Detail Table */}
            <table className="w-full border-collapse mb-8">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-left bg-slate-50 text-slate-600 text-xs uppercase border-y border-slate-300">Deskripsi Pembayaran</th>
                  <th className="py-3 px-4 text-right bg-slate-50 text-slate-600 text-xs uppercase border-y border-slate-300">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-6 px-4 border-b border-slate-200 align-top">
                    <p className="text-base font-bold text-slate-900 m-0 mb-2">{printTitle}</p>
                    <p className="text-sm text-slate-600 m-0 mb-1">Perumahan: <strong>{printData.perumahan}</strong></p>
                    <p className="text-sm text-slate-600 m-0 mb-1">Kavling: <strong>Blok {printData.blok} - No. {printData.nomorUnit}</strong> {printData.tipe ? `(Tipe ${printData.tipe})` : ''}</p>
                    <p className="text-sm text-slate-600 m-0">Skema Pembayaran: <strong>{printData.caraPembayaran}</strong> {printData.bank ? `(${printData.bank})` : ''}</p>
                  </td>
                  <td className="py-6 px-4 border-b border-slate-200 text-right align-top text-lg font-bold text-slate-900">
                    {formatRupiah(printData.nominalCetak || 0)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Total Section */}
            <div className="flex justify-end mb-12">
              <div className="w-[300px]">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-sm font-bold text-slate-600 uppercase">
                    {printType === 'kwitansi' ? 'Total' : 'Total'}
                  </span>
                  <span className="text-xl font-black text-slate-900">{formatRupiah(printData.nominalCetak || 0)}</span>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="flex justify-end text-center">
              <div className="w-[200px]">
                <p className="text-sm text-slate-600 m-0 mb-20">Tangerang, {formatDate(printData.tanggal || new Date().toISOString())}</p>
                <p className="text-sm font-bold text-slate-900 m-0 underline">Divisi Keuangan</p>
                <p className="text-xs text-slate-500 mt-1 m-0">Bumantara</p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={() => setPrintData(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-50">Tutup</button>
          <button onClick={handlePrintPDF} className="px-6 py-2 bg-black text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-800 shadow-lg shadow-black/10 flex items-center gap-2">
            <Printer size={16} /> Download PDF
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Penjualan;
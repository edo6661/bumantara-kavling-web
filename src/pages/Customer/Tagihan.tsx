import React, { useState, useMemo } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import { formatRupiah, formatDate } from "../../utils/formatters";
import { FileText, Printer, UploadCloud, Edit2, Trash2 } from 'lucide-react';
import { jsPDF } from "jspdf";
import * as htmlToImage from 'html-to-image';

interface TagihanData {
  id: string;
  namaCustomer: string;
  perumahan: string;
  blok: string;
  pembayaran: string;
  nominal: number;
  jatuhTempo: string;
  status: string;
  fileBukti: string;
  reminderBerikutnya: string;
}

const initialFormState: TagihanData = {
  id: '',
  namaCustomer: '',
  perumahan: '',
  blok: '',
  pembayaran: '',
  nominal: 0,
  jatuhTempo: '',
  status: 'Belum Bayar',
  fileBukti: '',
  reminderBerikutnya: '',
};

const mockCustomers = [
  { id: 'CUST-001', name: 'Budi Santoso', perumahan: 'Puri Safana', blok: 'A-01' },
  { id: 'CUST-002', name: 'Andi Pratama', perumahan: 'Puri Safana', blok: 'B-12' },
  { id: 'CUST-003', name: 'Siti Aminah', perumahan: 'Puri Safana', blok: 'C-05' },
];

const Tagihan = () => {
  const [data, setData] = useState<TagihanData[]>([
    {
      id: 'INV-001',
      namaCustomer: 'Budi Santoso',
      perumahan: 'Puri Safana',
      blok: 'A-01',
      pembayaran: 'Cicilan Bertahap ke-1',
      nominal: 15000000,
      jatuhTempo: '2026-05-01',
      status: 'Lunas',
      fileBukti: 'bukti_tf_budi.pdf',
      reminderBerikutnya: '',
    },
    {
      id: 'INV-002',
      namaCustomer: 'Budi Santoso',
      perumahan: 'Puri Safana',
      blok: 'A-01',
      pembayaran: 'Cicilan Bertahap ke-2',
      nominal: 15000000,
      jatuhTempo: '2026-06-01',
      status: 'Belum Bayar',
      fileBukti: '',
      reminderBerikutnya: '2026-05-25',
    },
    {
      id: 'INV-003',
      namaCustomer: 'Andi Pratama',
      perumahan: 'Puri Safana',
      blok: 'B-12',
      pembayaran: 'Pembayaran DP',
      nominal: 4500000,
      jatuhTempo: '2026-05-15',
      status: 'Belum Bayar',
      fileBukti: '',
      reminderBerikutnya: '2026-05-10',
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<TagihanData>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof TagihanData, string>>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [printType, setPrintType] = useState<'invoice' | 'kwitansi' | null>(null);
  const [printTitle, setPrintTitle] = useState('');

  const groupedData = useMemo(() => {
    const groups: Record<string, any> = {};
    data.forEach(item => {
      if (!groups[item.namaCustomer]) {
        groups[item.namaCustomer] = {
          id: item.namaCustomer,
          namaCustomer: item.namaCustomer,
          kavling: `${item.perumahan} - Blok ${item.blok}`,
          reminderSelanjutnya: '',
          cicilan: []
        };
      }

      if (item.status !== 'Lunas' && item.reminderBerikutnya) {
        groups[item.namaCustomer].reminderSelanjutnya = item.reminderBerikutnya;
      }

      groups[item.namaCustomer].cicilan.push(item);
    });
    return Object.values(groups);
  }, [data]);

  const columns = [
    { header: 'Nama Customer', accessor: 'namaCustomer' },
    { header: 'Kavling', accessor: 'kavling' },
    {
      header: 'Reminder Selanjutnya',
      accessor: 'reminderSelanjutnya',
      render: (val: string) => val ? <span className="text-blue-600 font-medium">{formatDate(val)}</span> : <span className="text-slate-400">-</span>
    },
  ];

  const openModal = (item?: TagihanData, defaultCustomerName?: string) => {
    if (item) {
      setFormData(item);
      setIsEditing(true);
    } else {
      const defaultCust = mockCustomers.find(c => c.name === defaultCustomerName);
      setFormData({
        ...initialFormState,
        namaCustomer: defaultCust?.name || '',
        perumahan: defaultCust?.perumahan || '',
        blok: defaultCust?.blok || ''
      });
      setIsEditing(false);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const customer = mockCustomers.find(c => c.name === selectedName);
    setFormData(prev => ({
      ...prev,
      namaCustomer: selectedName,
      perumahan: customer?.perumahan || '',
      blok: customer?.blok || ''
    }));
    if (errors.namaCustomer) setErrors(prev => ({ ...prev, namaCustomer: undefined }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    if (errors[name as keyof TagihanData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: file.name,
        status: 'Lunas'
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: '',
        status: 'Belum Bayar'
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof TagihanData, string>> = {};
    if (!formData.namaCustomer) newErrors.namaCustomer = 'Customer wajib dipilih';
    if (!formData.pembayaran.trim()) newErrors.pembayaran = 'Keterangan pembayaran wajib diisi';
    if (formData.nominal <= 0) newErrors.nominal = 'Nominal harus lebih dari 0';
    if (!formData.jatuhTempo) newErrors.jatuhTempo = 'Jatuh tempo wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (isEditing) {
      setData((prev) => prev.map((item) => (item.id === formData.id ? formData : item)));
    } else {
      const newId = `INV-${String(data.length + 1).padStart(3, '0')}`;
      setData((prev) => [...prev, { ...formData, id: newId }]);
    }
    closeModal();
  };

  const handleDelete = (item: TagihanData) => {
    if (window.confirm(`Hapus data tagihan ${item.pembayaran} untuk ${item.namaCustomer}?`)) {
      setData((prev) => prev.filter((d) => d.id !== item.id));
    }
  };

  const expandedRowRender = (row: any) => {
    return (
      <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 shadow-inner">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText size={16} className="text-blue-600" /> Detail Cicilan & Tagihan
          </h4>
          <button
            onClick={() => openModal(undefined, row.namaCustomer)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition"
          >
            + Tambah Cicilan
          </button>
        </div>

        <div className="space-y-3">
          {row.cicilan
            .sort((a: TagihanData, b: TagihanData) => a.jatuhTempo.localeCompare(b.jatuhTempo))
            .map((c: TagihanData) => (
              <div key={c.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4 transition hover:border-blue-200">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{c.id}</span>
                    <h5 className="font-bold text-slate-800 text-sm">{c.pembayaran}</h5>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'Lunas' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-600 font-medium mt-2">
                    <p>Jatuh Tempo: <span className="text-slate-900 font-bold">{formatDate(c.jatuhTempo)}</span></p>
                    <p>Nominal: <span className="text-slate-900 font-bold">{formatRupiah(c.nominal)}</span></p>
                    {c.fileBukti && <p>Bukti: <span className="text-blue-600">{c.fileBukti}</span></p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => openModal(c)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Cicilan">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(c)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus Cicilan">
                    <Trash2 size={16} />
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-1"></div>

                  {c.status === 'Lunas' ? (
                    <button onClick={() => { setPrintType('kwitansi'); setPrintTitle('Kwitansi Pembayaran'); setPrintData({ ...c, nominalCetak: c.nominal }); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition shadow-md">
                      <Printer size={14} /> Kwitansi
                    </button>
                  ) : (
                    <>
                      <button onClick={() => { setPrintType('invoice'); setPrintTitle('Invoice Tagihan'); setPrintData({ ...c, nominalCetak: c.nominal }); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition">
                        <FileText size={14} /> Invoice
                      </button>
                      <button onClick={() => openModal(c)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-md">
                        <UploadCloud size={14} /> Upload Bukti
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
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
        fontEmbedCSS: '',
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
        title="Data Tagihan Customer"
        columns={columns}
        data={groupedData}
        onAdd={() => openModal()}
        expandedRowRender={expandedRowRender}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit Tagihan / Upload Bukti" : "Buat Tagihan Baru"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100 flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-800">Status Pembayaran</span>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${formData.status === 'Lunas' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-orange-100 text-orange-800 border border-orange-200'}`}>
              {formData.status}
            </span>
          </div>
          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <Select
              label="Pilih Customer"
              name="namaCustomer"
              value={formData.namaCustomer}
              onChange={handleCustomerChange}
              error={errors.namaCustomer}
              options={mockCustomers.map(c => ({ value: c.name, label: `${c.name} (${c.perumahan} - ${c.blok})` }))}
            />
            {formData.namaCustomer && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input label="Perumahan" name="perumahan" value={formData.perumahan} readOnly className="bg-gray-100 text-black px-4 py-2 rounded-md" />
                <Input label="Blok/Unit" name="blok" value={formData.blok} readOnly className="bg-gray-100 text-black px-4 py-2 rounded-md" />
              </div>
            )}
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Detail Tagihan & Reminder</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input label="Pembayaran (Deskripsi)" name="pembayaran" value={formData.pembayaran} onChange={handleChange} error={errors.pembayaran} placeholder="Contoh: Cicilan Bertahap ke-1 / Pelunasan DP" />
              </div>
              <Input label="Nominal (Rp)" type="number" name="nominal" value={formData.nominal === 0 ? '' : formData.nominal} onChange={handleChange} error={errors.nominal} placeholder="0" />
              <Input label="Jatuh Tempo" type="date" name="jatuhTempo" value={formData.jatuhTempo} onChange={handleChange} error={errors.jatuhTempo} />
              <div className="md:col-span-2 mt-2">
                <Input label="Reminder Tagihan Berikutnya (Opsional)" type="date" name="reminderBerikutnya" value={formData.reminderBerikutnya} onChange={handleChange} />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="bg-blue-50/50 p-4 rounded-md border border-blue-100">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Upload Bukti Pembayaran</h4>
              <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                Upload bukti transfer dari pihak pelanggan di sini. Sistem otomatis mengubah status menjadi <strong className="text-green-700">LUNAS</strong>.
              </p>
              <FileInput label="Upload Bukti Transfer" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'fileBukti')} />
              {formData.fileBukti && (
                <p className="text-xs text-green-600 mt-2 truncate flex items-center gap-1 font-medium bg-green-50 p-2 rounded border border-green-100">
                  <FileText size={14} /> File tersimpan: {formData.fileBukti}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">Batal</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition">Simpan Tagihan</button>
          </div>
        </form>
      </Modal>

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
                <p className="font-black text-lg text-slate-800">{printData.namaCustomer}</p>
                <p className="text-slate-600 font-medium">{printData.perumahan} - Blok {printData.blok}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">Tanggal Cetak:</p>
                <p className="font-bold text-slate-800">{formatDate(new Date().toISOString())}</p>
              </div>
            </div>
            <div className="mb-8">
              <p className="text-slate-400 font-bold mb-2 uppercase tracking-wider text-[10px]">Keterangan Pembayaran:</p>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl font-medium text-slate-700">
                {printData.pembayaran || printTitle} untuk unit Kavling {printData.perumahan} Blok {printData.blok}.
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
          <button onClick={() => setPrintData(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50">Tutup</button>
          <button onClick={handlePrintPDF} className="px-6 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg flex items-center gap-2">
            <Printer size={16} /> Download PDF
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Tagihan;
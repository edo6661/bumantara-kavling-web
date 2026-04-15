/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import { formatDate, formatRupiah } from "../../utils/formatters";
import { FileText, Receipt, Printer, UploadCloud, Ban } from 'lucide-react';
import { jsPDF } from "jspdf";
import * as htmlToImage from 'html-to-image';
import PageLoader from "../PageLoader";

import { useGetPenjualan, useCreatePenjualan, useCancelPenjualan, useUploadBuktiPenjualan, useUpdatePenjualan } from "../../hooks/queries/usePenjualan";
import { useGetAgents } from "../../hooks/queries/useAgent";
import { useGetPerumahan } from "../../hooks/queries/usePerumahan";
import { useGetKavlings } from "../../hooks/queries/useKavling";
import { useGetBankRekening } from "../../hooks/queries/useBankRekening";
import CurrencyInput from "../../components/shared/CurrencyInput";
import QRCode from "react-qr-code";
import { useAuth } from "../../context/AuthContext";

interface PenjualanData {
  id?: string;
  tanggal: string;
  nama: string;
  alamat: string;
  noTelepon: string;
  noIdentitas: string;
  alasanBatal?: string | null;
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
  fileSpr?: string | null;
  progressCicilan?: string;
  rekeningTujuanId?: number | '';
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
  rekeningTujuanId: '',
};

const Penjualan = () => {
  const { data: penjualanData = [], isLoading } = useGetPenjualan();
  const { data: agentData = [] } = useGetAgents();
  const { data: perumahanData = [] } = useGetPerumahan();
  const { data: kavlingResponse } = useGetKavlings({ limit: 500 });
  const { data: bankList = [] } = useGetBankRekening();

  const { selectedPerumahan } = useAuth();
  const kavlingList = useMemo(() => kavlingResponse?.items || [], [kavlingResponse]);
  const createMutation = useCreatePenjualan();
  const cancelMutation = useCancelPenjualan();
  const uploadBuktiMutation = useUploadBuktiPenjualan();
  const updateMutation = useUpdatePenjualan();

  const [isNewAgent, setIsNewAgent] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<PenjualanData>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof PenjualanData, string>>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [originalKavling, setOriginalKavling] = useState({ blok: '', unit: '' });

  const [printData, setPrintData] = useState<any>(null);
  const [printType, setPrintType] = useState<'invoice' | 'kwitansi' | null>(null);
  const [printTitle, setPrintTitle] = useState('');

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelData, setCancelData] = useState({ id: '', alasanBatal: '' });

  const availableKavlings = useMemo(() => {
    return kavlingList.filter(k =>
      k.perumahan?.nama === formData.perumahan &&
      (
        k.status === 'AVAILABLE' ||
        (isEditing && k.blok === originalKavling.blok && k.nomorUnit === originalKavling.unit)
      )
    );
  }, [kavlingList, formData.perumahan, isEditing, originalKavling]);

  const uniqueBloks = useMemo(() => {
    const bloks = availableKavlings.map(k => k.blok);
    return [...new Set(bloks)].sort();
  }, [availableKavlings]);

  const availableUnits = useMemo(() => {
    if (!formData.blok) return [];
    return availableKavlings
      .filter(k => k.blok === formData.blok)
      .map(k => k.nomorUnit)
      .sort();
  }, [availableKavlings, formData.blok]);

  // ✅ BEST PRACTICE: Derived State untuk Menghitung Pengajuan KPR secara on-the-fly (tanpa useEffect)
  const calculatedPengajuanKpr = useMemo(() => {
    if (formData.caraPembayaran === 'KPR') {
      const harga = Number(formData.hargaJual) || 0;
      const diskon = Number(formData.diskonPenjualan) || 0;
      const dp = Number(formData.dp) || 0;
      const bf = Number(formData.bookingFee) || 0;

      const pengajuanKPR = harga - diskon - dp - bf;
      return pengajuanKPR > 0 ? pengajuanKPR : 0;
    }
    return 0;
  }, [formData.hargaJual, formData.diskonPenjualan, formData.dp, formData.bookingFee, formData.caraPembayaran]);


  const columns = [
    { header: 'ID Penjualan', accessor: 'id' },
    { header: 'Tanggal', accessor: 'tanggal', render: (val: string) => formatDate(val) },
    { header: 'Nama Customer', accessor: 'nama' },
    { header: 'Perumahan', accessor: 'perumahan' },
    { header: 'Kavling', accessor: 'blok', render: (_: unknown, row: PenjualanData) => `${row.blok} - ${row.nomorUnit}` },
    {
      header: 'Progress Cicilan',
      accessor: 'progressCicilan',
      render: (val: string) => (
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
          {val || '-'}
        </span>
      )
    },
    { header: 'Cara Pembayaran', accessor: 'caraPembayaran' },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          {val}
        </span>
      )
    },
  ];

  const openModal = (item?: PenjualanData) => {
    if (item) {
      const uiCaraPembayaran = item.caraPembayaran ? item.caraPembayaran.replace(/_/g, " ") : "";
      setFormData({
        ...item,
        caraPembayaran: uiCaraPembayaran,
        rekeningTujuanId: item.rekeningTujuanId ?? ''
      });
      setOriginalKavling({ blok: item.blok, unit: item.nomorUnit });
      setIsEditing(true);
    } else {
      setFormData({
        ...initialFormState,
        tanggal: new Date().toISOString().split('T')[0],
        perumahan: selectedPerumahan ? selectedPerumahan.nama : '',
      });
      setOriginalKavling({ blok: '', unit: '' });
      setIsEditing(false);
    }
    setIsNewAgent(false);
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setIsEditing(false);
    setIsNewAgent(false);
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;

    setFormData((prev) => {
      const updates: any = { [name]: finalValue };

      if (name === 'perumahan') {
        updates.blok = '';
        updates.nomorUnit = '';
        updates.tipe = '';
        updates.luasBangunan = 0;
        updates.luasTanah = 0;
        updates.hargaJual = 0;
      }

      // ✅ Kosongkan nama bank KPR jika skema diubah selain KPR
      if (name === 'caraPembayaran' && finalValue !== 'KPR') {
        updates.bank = '';
      }

      return { ...prev, ...updates };
    });

    if (errors[name as keyof PenjualanData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCurrencyChange = (name: string, value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof PenjualanData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlokChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const blok = e.target.value;
    setFormData(prev => ({
      ...prev,
      blok,
      nomorUnit: '',
      tipe: '',
      luasBangunan: 0,
      luasTanah: 0,
      hargaJual: 0
    }));
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unit = e.target.value;
    const selectedKav = availableKavlings.find(k => k.blok === formData.blok && k.nomorUnit === unit);

    if (selectedKav) {
      setFormData(prev => {
        let diskonPenjualan = 0;
        const tipeKavling = selectedKav.namaTipe.toLowerCase();

        if (["ansara", "adara", "asvara"].includes(tipeKavling)) {
          diskonPenjualan = 6000000;
        } else if (tipeKavling === "aruna") {
          diskonPenjualan = 10000000;
        }

        return {
          ...prev,
          nomorUnit: unit,
          tipe: selectedKav.namaTipe,
          luasBangunan: selectedKav.luasBangunan,
          luasTanah: selectedKav.luasTanah,
          hargaJual: selectedKav.hargaJual,
          rekeningTujuanId: selectedKav.rekeningTujuanId || prev.rekeningTujuanId,
          diskonPenjualan
        };
      });
    } else {
      setFormData(prev => ({ ...prev, nomorUnit: unit }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof PenjualanData, string>> = {};
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.noIdentitas.trim() || formData.noIdentitas.length < 16) newErrors.noIdentitas = 'NIK minimal 16 digit';
    if (!formData.perumahan.trim()) newErrors.perumahan = 'Perumahan wajib diisi';
    if (!formData.blok.trim()) newErrors.blok = 'Blok wajib diisi';
    if (!formData.nomorUnit.trim()) newErrors.nomorUnit = 'Nomor Unit wajib diisi';
    if (!formData.caraPembayaran) newErrors.caraPembayaran = 'Cara pembayaran wajib dipilih';
    if (!formData.agent.trim()) newErrors.agent = 'Agent wajib dipilih/diisi';

    if (formData.caraPembayaran === 'KPR') {
      if (!formData.bank?.trim()) newErrors.bank = 'Bank KPR wajib diisi';
      // Kita pakai calculatedPengajuanKpr untuk validasinya
      if (calculatedPengajuanKpr <= 0) newErrors.nilaiPengajuanKpr = 'Nilai pengajuan harus valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isEditing && formData.id) {
        const updatePayload = {
          nama: formData.nama,
          noIdentitas: formData.noIdentitas,
          noTelepon: formData.noTelepon,
          alamat: formData.alamat,
          perusahaan: formData.perusahaan || undefined,
          alamatKoresponden: formData.alamatKoresponden || undefined,
          agent: formData.agent,
          blok: formData.blok,
          nomorUnit: formData.nomorUnit,
          tipe: formData.tipe,
          luasBangunan: Number(formData.luasBangunan),
          luasTanah: Number(formData.luasTanah),
          hargaJual: Number(formData.hargaJual),
          caraPembayaran: formData.caraPembayaran,
          bank: formData.bank || undefined,
          nilaiPengajuanKpr: formData.caraPembayaran === 'KPR' ? calculatedPengajuanKpr : undefined, // ✅ Gunakan nilai useMemo
          dp: Number(formData.dp) || undefined,
          diskonPenjualan: Number(formData.diskonPenjualan) || undefined,
          hargaPromosi: Number(formData.hargaPromosi) || undefined,
          rekeningTujuanId: formData.rekeningTujuanId ? Number(formData.rekeningTujuanId) : undefined,
        };

        await updateMutation.mutateAsync({ id: formData.id, data: updatePayload });
        closeModal();

      } else {
        const payload = {
          noIdentitas: formData.noIdentitas,
          nama: formData.nama,
          noTelepon: formData.noTelepon,
          alamat: formData.alamat,
          perusahaan: formData.perusahaan || undefined,
          alamatKoresponden: formData.alamatKoresponden || undefined,
          perumahan: formData.perumahan,
          blok: formData.blok,
          nomorUnit: formData.nomorUnit,
          tipe: formData.tipe,
          luasBangunan: Number(formData.luasBangunan),
          luasTanah: Number(formData.luasTanah),
          tanggal: formData.tanggal,
          hargaJual: Number(formData.hargaJual),
          hargaPromosi: Number(formData.hargaPromosi) || undefined,
          diskonPenjualan: Number(formData.diskonPenjualan) || undefined,
          dp: Number(formData.dp) || undefined,
          bookingFee: Number(formData.bookingFee) || undefined,
          caraPembayaran: formData.caraPembayaran,
          bank: formData.bank || undefined,
          nilaiPengajuanKpr: formData.caraPembayaran === 'KPR' ? calculatedPengajuanKpr : undefined, // ✅ Gunakan nilai useMemo
          agent: formData.agent,
          rekeningTujuanId: formData.rekeningTujuanId ? Number(formData.rekeningTujuanId) : undefined,
        };

        const result = await createMutation.mutateAsync(payload);
        closeModal();

        if (result) {
          setPrintData({ ...formData, id: result.noTransaksi, nominalCetak: formData.bookingFee });
          setPrintType('invoice');
          setPrintTitle('Invoice Booking Fee');
        }
      }
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

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cancelData.alasanBatal.length < 5) {
      alert("Alasan pembatalan minimal 5 karakter.");
      return;
    }
    try {
      await cancelMutation.mutateAsync({ id: cancelData.id, alasanBatal: cancelData.alasanBatal });
      setIsCancelModalOpen(false);
      setCancelData({ id: '', alasanBatal: '' });
      alert("Penjualan berhasil dibatalkan dan status kavling kembali Available.");
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal membatalkan penjualan.");
    }
  };

  const handleUploadBukti = async (id: string, type: "booking" | "dp", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadBuktiMutation.mutateAsync({ id, type, file });
      alert(`Bukti ${type === "booking" ? "Booking" : "DP"} berhasil diunggah! SPR akan otomatis di-generate (jika booking).`);
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal mengunggah bukti");
    }
  };

  const handlePrintPDF = async () => {
    const element = document.getElementById('print-area');
    if (!element) return;
    try {
      const dataUrl = await htmlToImage.toPng(element, { quality: 1.0, pixelRatio: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${printTitle.replace(/\s+/g, '_')}_${printData?.id}.pdf`);
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan saat memproses PDF.');
    }
  };

  const handleShareWA = () => {
    if (!printData) return;
    const phone = (printData.noTelepon || '').replace(/[^0-9]/g, '');
    if (!phone) {
      alert('Nomor telepon customer tidak valid / kosong.');
      return;
    }
    const waPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const documentLink = `http://localhost:5173/verify/${printData.id}`;
    let message = `Halo Bapak/Ibu *${printData.nama}*,\n\nBerikut kami sampaikan ringkasan *${printTitle}* untuk unit Kavling *${printData.perumahan} Blok ${printData.blok}-${printData.nomorUnit}*.\n\nNominal Tagihan: *${formatRupiah(printData.nominalCetak || 0)}*`;

    if (printTitle.includes('Booking Fee')) {
      const sisa = (printData.hargaJual || 0) - (printData.nominalCetak || 0);
      message += `\n\nHarga Jual Kavling: *${formatRupiah(printData.hargaJual || 0)}*\nSisa Belum Dibayar: *${formatRupiah(sisa)}*`;
    }
    message += `\n\n🔗 *Lihat & Unduh Dokumen PDF:*\n${documentLink}`;
    message += `\n\n_Mohon lampirkan bukti transfer jika sudah melakukan pembayaran ke rekening PT._\n\nTerima Kasih,\n*Finance Bumantara*`;

    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`, '_blank');
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
    if (row.status === 'BATAL') {
      return (
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-800">Manajemen Dokumen Penjualan & Tagihan Awal</h4>
            <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
              Status: BATAL
            </span>
          </div>
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm flex items-start gap-3">
            <Ban size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold mb-1">Transaksi ini telah dibatalkan.</p>
              <p className="font-medium text-red-600">Alasan: {row.alasanBatal || 'Tidak ada alasan yang dicantumkan.'}</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
          <h4 className="text-sm font-bold text-slate-800">Manajemen Dokumen Penjualan & Tagihan Awal</h4>
          <div className="flex items-center gap-3">
            {((row.status === 'BOOKED' || row.status === 'PROSES')) && (
              <button
                onClick={() => {
                  setCancelData({ id: row.id!, alasanBatal: '' });
                  setIsCancelModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                <Ban size={12} /> Batalkan Transaksi
              </button>
            )}
            <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${row.status === 'BATAL' ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-700'}`}>
              Status: {row.status}
            </span>
          </div>
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
                <label className={`flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md ${uploadBuktiMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <UploadCloud size={14} /> {uploadBuktiMutation.isPending ? "Mengunggah..." : "Upload Bukti Booking"}
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleUploadBukti(row.id!, 'booking', e)} disabled={uploadBuktiMutation.isPending} />
                </label>
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
                <label className={`flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md ${uploadBuktiMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <UploadCloud size={14} /> {uploadBuktiMutation.isPending ? "Mengunggah..." : "Upload Bukti DP"}
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleUploadBukti(row.id!, 'dp', e)} disabled={uploadBuktiMutation.isPending} />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Data Penjualan"
        columns={columns}
        data={penjualanData}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item as PenjualanData)}
        expandedRowRender={expandedRowRender}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit Data Penjualan" : "Tambah Penjualan Baru"}>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Bagian Pembeli & Marketing */}
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
                      ...agentData.map((a: any) => ({ value: a.nama, label: a.nama })),
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
              <Input label="No Identitas (KTP)" name="noIdentitas" value={formData.noIdentitas} onChange={handleChange} error={errors.noIdentitas} />
              <Input label="No Telepon / HP" name="noTelepon" value={formData.noTelepon} onChange={handleChange} />
              <Input label="Perusahaan (Opsional)" name="perusahaan" value={formData.perusahaan} onChange={handleChange} />
              <div className="md:col-span-2">
                <Input label="Alamat Sesuai KTP" name="alamat" value={formData.alamat} onChange={handleChange} error={errors.alamat} />
              </div>
              <div className="md:col-span-2">
                <Input label="Alamat Koresponden" name="alamatKoresponden" value={formData.alamatKoresponden} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Bagian Kavling */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">2. Data Kavling</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Perumahan"
                  name="perumahan"
                  value={formData.perumahan}
                  onChange={handleChange}
                  error={errors.perumahan}
                  disabled={true}
                  options={[
                    { value: '', label: '-- Pilih Perumahan --' },
                    ...perumahanData.map((p) => ({ value: p.nama, label: p.nama }))
                  ]}
                />
                <Input
                  label="Tipe Kavling"
                  name="tipe"
                  value={formData.tipe}
                  disabled={true}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Blok"
                  name="blok"
                  value={formData.blok}
                  onChange={handleBlokChange}
                  error={errors.blok}
                  disabled={!formData.perumahan}
                  options={[
                    { value: '', label: '-- Pilih Blok --' },
                    ...uniqueBloks.map(b => ({ value: b, label: b }))
                  ]}
                />
                <Select
                  label="Nomor Unit"
                  name="nomorUnit"
                  value={formData.nomorUnit}
                  onChange={handleUnitChange}
                  error={errors.nomorUnit}
                  disabled={!formData.blok}
                  options={[
                    { value: '', label: '-- Pilih Unit --' },
                    ...availableUnits.map(u => ({ value: u, label: u }))
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Luas Tanah (m²)"
                  name="luasTanah"
                  type="number"
                  value={formData.luasTanah || ''}
                  disabled={true}
                />
                <Input
                  label="Luas Bangunan (m²)"
                  name="luasBangunan"
                  type="number"
                  value={formData.luasBangunan || ''}
                  disabled={true}
                />
              </div>

              <CurrencyInput
                label="Harga Jual"
                name="hargaJual"
                value={formData.hargaJual}
                onValueChange={handleCurrencyChange}
                error={errors.hargaJual}
                placeholder="0"
                disabled={true}
              />

              <Select
                label="Pembayaran Melalui Bank (Rekening PT)"
                name="rekeningTujuanId"
                value={formData.rekeningTujuanId || ''}
                onChange={handleChange}
                disabled

                error={errors.rekeningTujuanId as string}
                options={[
                  { value: '', label: '-- Pilih Rekening Tujuan (Opsional) --' },
                  ...bankList.filter(b => formData.perumahan ? b.perumahan === formData.perumahan : true).map(b => ({
                    value: b.id,
                    label: `${b.namaBank} - ${b.noRekening} (a/n ${b.atasNama})`
                  }))
                ]}
              />
            </div>
          </div>

          {/* Bagian Pembayaran */}
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

              <CurrencyInput
                label="Down Payment (DP)"
                name="dp"
                value={formData.dp}
                onValueChange={handleCurrencyChange}
                placeholder="Masukkan Nominal DP"
              />

              <CurrencyInput
                label="Diskon Penjualan"
                name="diskonPenjualan"
                value={formData.diskonPenjualan}
                onValueChange={handleCurrencyChange}
                placeholder="0"
              />
            </div>

            {/* Munculkan Data Bank HANYA JIKA Memilih KPR */}
            {formData.caraPembayaran === 'KPR' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md animate-in fade-in zoom-in-95 duration-200">
                <Input
                  label="Bank KPR"
                  name="bank"
                  value={formData.bank}
                  onChange={handleChange}
                  placeholder="Contoh: BCA, BSI, Mandiri"
                  error={errors.bank}
                />
                {/* Gunakan derived state calculatedPengajuanKpr untuk UI */}
                <CurrencyInput
                  label="Nilai Pengajuan KPR"
                  name="nilaiPengajuanKpr"
                  value={calculatedPengajuanKpr}
                  onValueChange={() => { }}
                  error={errors.nilaiPengajuanKpr}
                  placeholder="0"
                  disabled={true}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Memproses...' : 'Simpan Penjualan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal PDF dan Batal Penjualan tetap sama */}
      <Modal isOpen={!!printData} onClose={() => setPrintData(null)} title={`Pratinjau Dokumen`}>
        {printData && (
          <div className="p-8 bg-white border border-slate-200 rounded-xl" id="print-area" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-8">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-widest text-slate-900 m-0">
                  {printType === 'invoice' ? 'INVOICE' : 'KWITANSI'}
                </h2>
                <p className="text-slate-500 text-sm mt-2 font-medium">No: {printData.id} / BMT / {new Date().getFullYear()}</p>
                <p className="text-slate-500 text-sm mt-1">Tanggal: {formatDate(printData.tanggal || new Date().toISOString())}</p>
              </div>
              <div className="text-right">
                <h3 className="m-0 text-xl font-bold text-slate-900">BUMANTARA</h3>
                <p className="m-0 mt-1 text-xs text-slate-500">Divisi Marketing & Keuangan</p>
              </div>
            </div>

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
                    <p className="text-sm text-slate-600 m-0">Skema Pembayaran: <strong>{printData.caraPembayaran?.replace('_', ' ')}</strong> {printData.bank ? `(${printData.bank})` : ''}</p>
                  </td>
                  <td className="py-6 px-4 border-b border-slate-200 text-right align-top text-lg font-bold text-slate-900">
                    {formatRupiah(printData.nominalCetak || 0)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end mb-8">
              <div className="w-[350px]">
                {printTitle.includes('Booking Fee') && (
                  <div className="mb-4 space-y-2 p-4 bg-slate-50/80 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <span>Harga Jual Unit</span>
                      <span className="text-slate-800 text-sm">{formatRupiah(printData.hargaJual || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <span>Sisa Belum Dibayar</span>
                      <span className="text-orange-600 text-sm">
                        {formatRupiah((printData.hargaJual || 0) - (printData.nominalCetak || 0))}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center p-4 bg-slate-100 rounded-lg border border-slate-200">
                  <span className="text-sm font-bold text-slate-600 uppercase">
                    {printType === 'kwitansi' ? 'Total Pembayaran' : 'Total Tagihan'}
                  </span>
                  <span className="text-xl font-black text-slate-900">{formatRupiah(printData.nominalCetak || 0)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end mt-16 pt-8">
              <div className="flex flex-col items-center p-2 border border-slate-200 rounded-lg bg-slate-50">
                <QRCode
                  value={`${window.location.origin}/verify/${printTitle.includes('Booking Fee')
                    ? `INV-BF-${printData.id}`
                    : printTitle.includes('Down Payment')
                      ? `INV-DP-${printData.id}`
                      : printData.id
                    }`}
                  size={72}
                  level="H"
                />
                <span className="text-[8px] text-slate-400 mt-2 font-bold tracking-widest uppercase">Validasi Dokumen</span>
              </div>

              <div className="text-center w-[200px]">
                <p className="text-sm text-slate-600 m-0 mb-16">Tangerang, {formatDate(printData.tanggal || new Date().toISOString())}</p>
                <p className="text-sm font-bold text-slate-900 m-0 underline">Finance Dept.</p>
                <p className="text-xs text-slate-400 mt-1 m-0">Bumantara</p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={() => setPrintData(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-50">Tutup</button>
          <button onClick={handleShareWA} className="px-5 py-2 bg-green-500 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-green-600 shadow-md shadow-green-500/20 flex items-center gap-2 transition-colors">
            Kirim via WA
          </button>
          <button onClick={handlePrintPDF} className="px-6 py-2 bg-black text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-800 flex items-center gap-2 transition-colors">
            <Printer size={16} /> Download PDF
          </button>
        </div>
      </Modal>

      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Batalkan Penjualan">
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <div className="p-4 bg-red-50 text-red-800 border border-red-100 rounded-xl text-sm font-medium">
            <strong>Peringatan!</strong> Membatalkan penjualan akan mengubah status transaksi ini menjadi "Batal" dan mengembalikan status Kavling menjadi "Available".
          </div>
          <Input
            label="Alasan Pembatalan"
            name="alasanBatal"
            value={cancelData.alasanBatal}
            onChange={(e) => setCancelData({ ...cancelData, alasanBatal: e.target.value })}
            placeholder="Contoh: Customer mengundurkan diri / BI Checking ditolak"
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setIsCancelModalOpen(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-50">Tutup</button>
            <button type="submit" disabled={cancelMutation.isPending} className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-red-700 shadow-lg disabled:opacity-50">
              {cancelMutation.isPending ? "Memproses..." : "Konfirmasi Batal"}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Penjualan;
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useRef } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import { formatRupiah, formatDate } from "../../utils/formatters";
import { FileText, Printer, UploadCloud, Edit2, Trash2, PenTool } from 'lucide-react';
import { jsPDF } from "jspdf";
import * as htmlToImage from 'html-to-image';
import CurrencyInput from "../../components/shared/CurrencyInput";
import QRCode from "react-qr-code";
import SignatureCanvas from 'react-signature-canvas';
import {
  useGetTagihans,
  useCreateTagihan,
  useUpdateTagihan,
  useDeleteTagihan,
  useUploadBuktiTagihan,
  useUploadTagihanSignature
} from "../../hooks/queries/useTagihan";
import { useGetCustomers } from "../../hooks/queries/useCustomer";
import { useGetCustomerKavlings } from "../../hooks/queries/useCustomerKavling";
import type { TagihanData } from "../../services/tagihan.service";
import { useAuth } from '../../context/AuthContext';
import { useGetBankRekening } from '../../hooks/queries/useBankRekening';

interface TagihanFormState {
  id: number | '';
  customerId: number | '';
  customerLabel?: string;
  penjualanId: number | '';
  kavlingLabel?: string;
  pembayaran: string;
  nominal: number | '';
  jatuhTempo: string;
  status: string;
  fileBukti: string | File;
  reminderBerikutnya: string;
}

const initialFormState: TagihanFormState = {
  id: '',
  customerId: '',
  customerLabel: '',
  penjualanId: '',
  kavlingLabel: '',
  pembayaran: '',
  nominal: '',
  jatuhTempo: '',
  status: 'BELUM_BAYAR',
  fileBukti: '',
  reminderBerikutnya: '',
};

const Tagihan = () => {
  const { data: tagihans = [], isLoading: isLoadingTagihan } = useGetTagihans({ limit: 100 });
  const { data: customers = [], isLoading: isLoadingCustomer } = useGetCustomers();
  const { data: penjualanList = [], isLoading: isLoadingPenjualan } = useGetCustomerKavlings({ limit: 100 });
  const { data: bankList = [] } = useGetBankRekening();
  const { selectedPerumahan } = useAuth();

  const createMutation = useCreateTagihan();
  const updateMutation = useUpdateTagihan();
  const deleteMutation = useDeleteTagihan();
  const uploadBuktiMutation = useUploadBuktiTagihan();
  const uploadSignatureMutation = useUploadTagihanSignature();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  const [printData, setPrintData] = useState<any>(null);
  const [printType, setPrintType] = useState<'invoice' | 'kwitansi' | null>(null);
  const [printTitle, setPrintTitle] = useState('');

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedDetailRow, setSelectedDetailRow] = useState<any>(null);

  const [isTtdModalOpen, setIsTtdModalOpen] = useState(false);
  const [ttdData, setTtdData] = useState({ nama: '', tanggal: '', sebagai: '' });
  const sigCanvas = useRef<any>(null);

  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const groupedData = useMemo(() => {
    const groups: Record<string, any> = {};
    tagihans.forEach((item) => {
      const groupKey = `${item.customerId}_${item.penjualanId}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          customerId: item.customerId,
          penjualanId: item.penjualanId,
          namaCustomer: item.namaCustomer,
          kavling: `${item.perumahan} - Blok ${item.blok}-${item.nomorUnit}`,
          blok: item.blok,
          nomorUnit: item.nomorUnit,
          reminderSelanjutnya: '',
          unpaidCount: 0,
          totalTerbayarKeseluruhan: 0,
          cicilan: []
        };
      }


      if (item.status === 'BELUM_BAYAR') {
        groups[groupKey].unpaidCount += 1;
      }
      if (item.status !== 'LUNAS' && item.reminderBerikutnya) {
        groups[groupKey].reminderSelanjutnya = item.reminderBerikutnya;
      }
      groups[groupKey].cicilan.push(item);
    });

    return Object.values(groups).filter(g => g.cicilan.length > 0);
  }, [tagihans]);

  const columns = [
    { header: 'Nama Customer', accessor: 'namaCustomer' },
    { header: 'Blok', accessor: 'blok', render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
    { header: 'No', accessor: 'nomorUnit', render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
    {
      header: 'Tagihan Belum Dibayar',
      accessor: 'unpaidCount',
      render: (val: number) => (
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${val > 0 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
          {val > 0 ? `${val} Tertunda` : 'Lunas Semua'}
        </span>
      )
    },
    {
      header: 'Reminder Selanjutnya',
      accessor: 'reminderSelanjutnya',
      render: (val: string) => val ? formatDate(val) : '-'
    },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (_: any, row: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDetailRow(row);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
          title="Lihat Detail Penjualan"
        >
          Detail Penjualan
        </button>
      )
    },
  ];

  const filteredPenjualanList = useMemo(() => {
    if (!formData.customerId) return [];
    return penjualanList.filter((p: any) => Number(p.customerId) === Number(formData.customerId));
  }, [formData.customerId, penjualanList]);

  const detailPenjualanData = useMemo(() => {
    if (!selectedDetailRow) return null;

    if (!penjualanList || penjualanList.length === 0) {
      return {
        tipe: 'Memuat...',
        pembiayaan: 'Memuat...',
        harga: 0,
        lebihTanah: 0,
        biayaStrategis: 0,
        totalHargaJual: 0,
        status: 'SEDANG SINKRONISASI DATA...'
      };
    }

    const targetPenjualanId = selectedDetailRow.penjualanId || selectedDetailRow.cicilan?.[0]?.penjualanId;
    const found = penjualanList.find((p: any) => String(p.id) === String(targetPenjualanId));

    if (found) {
      return {
        ...found,
        tipe: found.tipe || '-',
        pembiayaan: found.pembiayaan?.replace(/_/g, ' ') || '-',
        status: found.status || 'TIDAK DIKETAHUI',
        harga: Number(found.totalHargaJual) || 0,
        lebihTanah: Number(found.lebihTanah) || 0,
        biayaStrategis: Number(found.biayaStrategis) || 0,
        totalHargaJual: Number(found.totalHargaJual) || 0,
      };
    }

    return {
      tipe: '-',
      pembiayaan: '-',
      harga: 0,
      lebihTanah: 0,
      biayaStrategis: 0,
      totalHargaJual: 0,
      status: 'DATA TERBATAS (PENJUALAN BATAL)'
    };
  }, [selectedDetailRow, penjualanList]);

  const openModal = (item?: TagihanData, parentGroup?: any) => {
    if (item) {
      setFormData({
        id: item.id,
        customerId: item.customerId,
        customerLabel: item.namaCustomer,
        penjualanId: item.penjualanId,
        kavlingLabel: `${item.perumahan} - Blok ${item.blok}-${item.nomorUnit}`,
        pembayaran: item.pembayaran,
        nominal: item.nominal,
        jatuhTempo: formatDateForInput(item.jatuhTempo ? String(item.jatuhTempo) : ''),
        status: item.status,
        fileBukti: item.fileBukti || '',
        reminderBerikutnya: formatDateForInput(item.reminderBerikutnya ? String(item.reminderBerikutnya) : ''),
      });
      setIsEditing(true);
      setIsAutoFilled(true);
    } else if (parentGroup) {
      setFormData({
        ...initialFormState,
        customerId: parentGroup.customerId,
        customerLabel: parentGroup.namaCustomer,
        penjualanId: parentGroup.penjualanId,
        kavlingLabel: parentGroup.kavling,
      });
      setIsEditing(false);
      setIsAutoFilled(true);
    } else {
      setFormData(initialFormState);
      setIsEditing(false);
      setIsAutoFilled(false);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCurrencyChange = (name: string, value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const saveSignature = async () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Tanda tangan tidak boleh kosong!");
      return;
    }
    if (!ttdData.nama.trim()) {
      alert("Nama penandatangan wajib diisi!");
      return;
    }
    const canvas = sigCanvas.current?.getCanvas();
    if (!canvas) return;
    const signatureBase64 = canvas.toDataURL('image/png');

    try {
      await uploadSignatureMutation.mutateAsync({
        noTagihanId: Number(printData.id),
        signatureBase64,
        nama: ttdData.nama,
        peran: ttdData.sebagai,
        tanggal: ttdData.tanggal,
      });

      alert(`Tanda tangan berhasil disimpan!`);

      setPrintData((prev: any) => ({
        ...prev,
        ttdData: {
          ...prev.ttdData,
          [ttdData.sebagai]: { nama: ttdData.nama, tanggal: ttdData.tanggal, url: signatureBase64 }
        }
      }));
      setIsTtdModalOpen(false);
    } catch (error) {
      let errorMessage = "Gagal menyimpan tanda tangan";
      if (error && typeof error === 'object' && 'response' in error) {
        const resData = (error as any).response?.data;
        if (resData && resData.message) {
          errorMessage = resData.message;
        }
      }
      alert(errorMessage);
    }
  };

  const handleShareWA = () => {
    if (!printData) return;

    const targetCustomer = customers.find(c => c.id === printData.customerId);
    const phone = (printData.noTelepon || targetCustomer?.noHp || '').replace(/[^0-9]/g, '');

    if (!phone) {
      alert('Nomor telepon customer tidak ditemukan.');
      return;
    }
    const waPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;

    let docId = printData.noTagihan;
    if (printType === 'kwitansi' && docId.startsWith('INV-')) {
      docId = docId.replace('INV-', 'KWT-');
    }
    const documentLink = `${window.location.origin}/verify/${docId}`;

    let rekeningText = '';
    let rekening: any = printData.rekeningTujuan;
    if (!rekening && printData.rekeningTujuanId) {
      const b = bankList.find((x: any) => x.id === Number(printData.rekeningTujuanId));
      if (b) rekening = { namaBank: b.namaBank, noRekening: b.noRekening, atasNama: b.atasNama };
    }

    if (rekening) {
      rekeningText = `\n\n💳 *Informasi Rekening Pembayaran:*\nBank: *${rekening.namaBank}*\nNo. Rekening: *${rekening.noRekening}*\nAtas Nama: *${rekening.atasNama}*`;
    }

    const statusTagihan = printData.status === 'LUNAS'
      ? '\n\n✅ Terima kasih, pembayaran Bapak/Ibu telah kami terima dengan baik.'
      : `\n\n📌 *Nominal Tagihan:* ${formatRupiah(printData.nominalCetak || 0)}${rekeningText}`;

    let message = `Halo Bapak/Ibu *${printData.namaCustomer}*, semoga senantiasa dalam keadaan sehat.\n\nBersama pesan ini, kami dari *Finance ${selectedPerumahan?.nama || 'Bumantara'}* ingin menyampaikan informasi terkait *${printTitle}* untuk tagihan *${printData.pembayaran}* (Unit Kavling *${printData.perumahan} Blok ${printData.blok}-${printData.nomorUnit}*).${statusTagihan}`;

    message += `\n\n🔗 *Unduh Dokumen PDF & Detail Transaksi:*\nBapak/Ibu dapat melihat dan mengunduh dokumen resmi secara mandiri melalui tautan berikut:\n${documentLink}`;

    if (printData.status !== 'LUNAS') {
      message += `\n\n_Mohon perkenan Bapak/Ibu untuk melampirkan bukti transfer pada ruang obrolan ini apabila telah melakukan pembayaran._`;
    }

    message += `\n\nTerima kasih atas kepercayaan Bapak/Ibu.\nSalam Hangat,\n*Finance ${selectedPerumahan?.nama || 'Bumantara'}*`;

    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        fileBukti: file,
        status: 'LUNAS'
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerId) newErrors.customerId = 'Customer wajib dipilih';
    if (!formData.penjualanId) newErrors.penjualanId = 'Kavling/Penjualan wajib dipilih';
    if (!formData.pembayaran.trim()) newErrors.pembayaran = 'Keterangan pembayaran wajib diisi';
    if (!formData.nominal || Number(formData.nominal) <= 0) newErrors.nominal = 'Nominal harus lebih dari 0';
    if (!formData.jatuhTempo) newErrors.jatuhTempo = 'Jatuh tempo wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      let currentTagihanId = formData.id;
      if (isEditing && formData.id) {
        await updateMutation.mutateAsync({
          id: Number(formData.id),
          data: {
            pembayaran: formData.pembayaran,
            nominal: Number(formData.nominal),
            jatuhTempo: formData.jatuhTempo,
            status: formData.status as any,
            reminderBerikutnya: formData.reminderBerikutnya || undefined,
          }
        });
      } else {
        const result = await createMutation.mutateAsync({
          customerId: Number(formData.customerId),
          penjualanId: Number(formData.penjualanId),
          pembayaran: formData.pembayaran,
          nominal: Number(formData.nominal),
          jatuhTempo: formData.jatuhTempo,
          reminderBerikutnya: formData.reminderBerikutnya || undefined,
        });
        currentTagihanId = result.id;
      }
      if (formData.fileBukti instanceof File && currentTagihanId) {
        await uploadBuktiMutation.mutateAsync({
          id: Number(currentTagihanId),
          file: formData.fileBukti
        });
      }
      closeModal();
    } catch (error) {
      let errorMessage = 'Terjadi kesalahan saat menyimpan data';
      if (error && typeof error === 'object' && 'response' in error) {
        const resData = (error as any).response?.data;
        if (resData?.error && Array.isArray(resData.error)) {
          const backendErrors: Record<string, string> = {};
          resData.error.forEach((err: { field: string; message: string }) => {
            backendErrors[err.field] = err.message;
          });
          setErrors(backendErrors);
          return;
        } else if (resData?.message) {
          errorMessage = resData.message;
        }
      }
      alert(errorMessage);
    }
  };

  const handleDelete = async (item: TagihanData) => {
    if (window.confirm(`Hapus data tagihan ${item.pembayaran} untuk ${item.namaCustomer}?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
      } catch (error) {
        let errorMessage = 'Gagal menghapus tagihan';
        if (error && typeof error === 'object' && 'response' in error) {
          errorMessage = (error as any).response?.data?.message || errorMessage;
        }
        alert(errorMessage);
      }
    }
  };

  const expandedRowRender = (row: any) => {
    const targetPenjualan = penjualanList.find((p: any) => String(p.id) === String(row.penjualanId));

    // Total Harga Akhir
    const totalHargaJual = targetPenjualan ? Number(targetPenjualan.totalHargaJual) : 0;
    const piutangCicilan = Math.max(0, totalHargaJual);

    const totalTerbayarCicilan = row.totalTerbayarKeseluruhan;
    const sisaPembayaran = Math.max(0, piutangCicilan - totalTerbayarCicilan);
    const rekeningTujuanId = targetPenjualan?.rekeningTujuanId;

    return (
      <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 shadow-inner">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText size={16} className="text-blue-600" /> Detail Cicilan & Tagihan
          </h4>

          <div className="flex flex-wrap items-center gap-4 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
            <div className="px-3 border-r border-slate-100">
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Total Tagihan Cicilan</p>
              <p className="text-sm font-bold text-slate-700">{formatRupiah(piutangCicilan)}</p>
            </div>
            <div className="px-3 border-r border-slate-100">
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Total Terbayar (Cicilan)</p>
              <p className="text-sm font-bold text-emerald-600">{formatRupiah(totalTerbayarCicilan)}</p>
            </div>
            <div className="px-3">
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Sisa Pembayaran</p>
              <p className="text-sm font-black text-orange-600">{formatRupiah(sisaPembayaran)}</p>
            </div>
          </div>

          <button
            onClick={() => openModal(undefined, row)}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition cursor-pointer shadow-sm w-full md:w-auto"
          >
            + Tambah Tagihan
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-500 uppercase tracking-widest text-[10px]">
                <th className="p-3 font-bold">Keterangan</th>
                <th className="p-3 font-bold">Jatuh Tempo</th>
                <th className="p-3 font-bold text-right">Nominal</th>
                <th className="p-3 font-bold text-center">Status</th>
                <th className="p-3 font-bold text-center">Bukti</th>
                <th className="p-3 font-bold text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {row.cicilan
                .sort((a: TagihanData, b: TagihanData) => new Date(a.jatuhTempo).getTime() - new Date(b.jatuhTempo).getTime())
                .map((c: TagihanData) => (
                  <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">

                    <td className="p-3 font-bold text-slate-800 text-xs">{c.pembayaran}</td>
                    <td className="p-3 text-slate-600 text-xs font-medium">{formatDate(c.jatuhTempo.toString())}</td>
                    <td className="p-3 text-slate-900 font-bold text-right tabular-nums text-xs">
                      {formatRupiah(c.nominal)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${c.status === 'LUNAS' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {c.fileBukti ? (
                        <div
                          onClick={() => setPreviewImage(c.fileBukti as string)}
                          className="relative w-8 h-6 mx-auto rounded border border-slate-200 overflow-hidden cursor-zoom-in group-hover:border-blue-300 transition-colors shadow-sm bg-slate-100"
                          title="Lihat Bukti Transfer"
                        >
                          <img src={c.fileBukti as string} alt="Bukti" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* AKSI: INVOICE / KWITANSI & UPLOAD */}
                        {c.status === 'LUNAS' ? (
                          <button
                            onClick={() => {
                              setPrintType('kwitansi');
                              setPrintTitle(`${c.pembayaran}`);
                              setPrintData({
                                ...c,
                                nominalCetak: c.nominal,
                                hargaJual: piutangCicilan,
                                sisaBelumDibayar: sisaPembayaran,
                                rekeningTujuanId: rekeningTujuanId,
                                tipe: targetPenjualan?.tipe,
                                caraPembayaran: targetPenjualan?.pembiayaan,
                                bank: targetPenjualan?.bank,
                                agent: targetPenjualan?.agent || '-',
                                pembuat: targetPenjualan?.createdBy || 'Admin',
                                luasTanah: targetPenjualan?.luasTanah,
                                luasBangunan: targetPenjualan?.luasBangunan
                              });
                            }}
                            className="p-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition shadow-sm cursor-pointer"
                            title="Cetak Kwitansi"
                          >
                            <Printer size={14} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setPrintType('invoice');
                                setPrintTitle(`${c.pembayaran}`);
                                setPrintData({
                                  ...c,
                                  nominalCetak: c.nominal,
                                  hargaJual: piutangCicilan,
                                  sisaBelumDibayar: sisaPembayaran,
                                  rekeningTujuanId: rekeningTujuanId,
                                  tipe: targetPenjualan?.tipe,
                                  caraPembayaran: targetPenjualan?.pembiayaan,
                                  bank: targetPenjualan?.bank
                                });
                              }}
                              className="p-1.5 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition cursor-pointer shadow-sm"
                              title="Cetak Invoice"
                            >
                              <FileText size={14} />
                            </button>
                            <button
                              onClick={() => openModal(c)}
                              className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm cursor-pointer"
                              title="Upload Bukti Pembayaran"
                            >
                              <UploadCloud size={14} />
                            </button>
                          </>
                        )}

                        <div className="w-px h-4 bg-slate-200 mx-0.5"></div>

                        {/* AKSI: EDIT & HAPUS */}
                        <button
                          onClick={() => openModal(c)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                          title="Edit Tagihan"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                          title="Hapus Tagihan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handlePrintPDF = async () => {
    const element = document.getElementById('print-area');
    if (!element) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const scrollWidth = element.scrollWidth;
      const scrollHeight = element.scrollHeight;

      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: scrollWidth,
        height: scrollHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (scrollHeight * pdfWidth) / scrollWidth;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const cleanNoDoc = (printData?.noTagihan || printData?.id || '').toString().replace(/INV-BF-|INV-DP-|KWT-BF-|KWT-DP-/g, '');
      const fileName = `${printTitle.replace(/\s+/g, '_')}_${cleanNoDoc}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Gagal membuat PDF:', error);
      alert('Terjadi kesalahan saat memproses PDF.');
    }
  };

  const customerOptions = [
    { value: '', label: '-- Pilih Customer --' },
    ...customers.map(c => ({ value: Number(c.id), label: `${c.nama} (NIK: ${c.nikKtp})` }))
  ];

  if (formData.customerId && !customerOptions.some(opt => opt.value === Number(formData.customerId))) {
    customerOptions.push({
      value: Number(formData.customerId),
      label: formData.customerLabel || 'Customer Terpilih'
    });
  }

  const kavlingOptions = [
    { value: '', label: '-- Pilih Kavling Terkait --' },
    ...filteredPenjualanList.map((p: any) => ({
      value: Number(p.id),
      label: `${p.perumahan} - Blok ${p.blok}-${p.unit} (Rp ${(p.totalHargaJual / 1000000).toFixed(0)} Jt)`
    }))
  ];

  if (formData.penjualanId && !kavlingOptions.some(opt => opt.value === Number(formData.penjualanId))) {
    kavlingOptions.push({
      value: Number(formData.penjualanId),
      label: formData.kavlingLabel || 'Kavling Terpilih'
    });
  }

  if (isLoadingTagihan || isLoadingCustomer || isLoadingPenjualan) return <PageLoader />;

  return (
    <div>
      <DataTable
        title="Data Tagihan Customer"
        columns={columns}
        data={groupedData}
        onAdd={() => openModal()}
        expandedRowRender={expandedRowRender}
      />

      {/* MODAL KELOLA TAGIHAN */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit Tagihan / Upload Bukti" : "Buat Tagihan Baru"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100 flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-800">Status Pembayaran</span>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${formData.status === 'LUNAS' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-orange-100 text-orange-800 border border-orange-200'}`}>
              {formData.status.replace('_', ' ')}
            </span>
          </div>
          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <Select
              label="Pilih Customer"
              name="customerId"
              value={formData.customerId === '' ? '' : Number(formData.customerId)}
              onChange={handleChange}
              error={errors.customerId}
              disabled={isEditing || isAutoFilled}
              options={customerOptions}
            />
            {formData.customerId && (
              <Select
                label="Pilih Kavling / Penjualan"
                name="penjualanId"
                value={formData.penjualanId === '' ? '' : Number(formData.penjualanId)}
                onChange={handleChange}
                error={errors.penjualanId}
                disabled={isEditing || isAutoFilled}
                options={kavlingOptions}
              />
            )}
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Detail Tagihan & Reminder</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input label="Pembayaran (Deskripsi)" name="pembayaran" value={formData.pembayaran} onChange={handleChange} error={errors.pembayaran} placeholder="Contoh: Cicilan Bertahap ke-1 / Pelunasan DP" />
              </div>
              <CurrencyInput
                label="Nominal"
                name="nominal"
                value={formData.nominal as number}
                onValueChange={handleCurrencyChange}
                error={errors.nominal}
                placeholder="0"
              />
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
              <FileInput label="Upload Bukti Transfer" accept="image/*" onChange={handleFileChange} />
              {formData.fileBukti && typeof formData.fileBukti === 'string' && (
                <p className="text-xs text-green-600 mt-2 truncate flex items-center gap-1 font-medium bg-green-50 p-2 rounded border border-green-100">
                  <FileText size={14} /> File saat ini sudah diupload
                </p>
              )}
              {formData.fileBukti instanceof File && (
                <p className="text-xs text-blue-600 mt-2 truncate flex items-center gap-1 font-medium bg-blue-50 p-2 rounded border border-blue-100">
                  <UploadCloud size={14} /> File siap diupload: {formData.fileBukti.name}
                </p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={closeModal}
              disabled={createMutation.isPending || updateMutation.isPending || uploadBuktiMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending || uploadBuktiMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition cursor-pointer disabled:opacity-50"
            >
              {(createMutation.isPending || updateMutation.isPending || uploadBuktiMutation.isPending) ? 'Menyimpan...' : 'Simpan Tagihan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL PRINT DOKUMEN */}
      <Modal isOpen={!!printData} onClose={() => setPrintData(null)} title={`Pratinjau Dokumen`}>
        {printData && (
          <div className="bg-white" id="print-area" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', borderTop: '8px solid #0f172a' }}>
            <div className="p-6">
              <div className="flex justify-between items-start border-b-[2px] border-slate-900 pb-4 mb-4 mt-1">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-slate-900 m-0">
                    {printType === 'invoice' ? 'TAGIHAN' : 'BUKTI PEMBAYARAN'}
                  </h2>
                  <div className="mt-2 space-y-0.5">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      <span className="w-20 inline-block">NO DOC</span>: {(printData.noTagihan || printData.id).toString().replace('INV-BF-', '').replace('INV-DP-', '')} / {new Date(printData.tanggal || new Date()).getFullYear()}
                    </p>
                    {printType === 'kwitansi' && (
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        <span className="w-20 inline-block">NO INVOICE</span>: {(printData.noTagihan || printData.id).toString().replace('INV-BF-', '').replace('INV-DP-', '')}
                      </p>
                    )}
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      <span className="w-20 inline-block">TANGGAL</span>: {formatDate(printData.tanggal || new Date().toISOString())}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  {selectedPerumahan?.logo ? (
                    <img src={selectedPerumahan.logo} alt="Logo" className="h-12 object-contain mb-2" crossOrigin="anonymous" />
                  ) : (
                    <h3 className="m-0 text-xl font-black text-slate-900 tracking-tight mb-1">{selectedPerumahan?.nama}</h3>
                  )}
                </div>
              </div>

              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[9px] text-slate-400 font-black mb-1.5 uppercase tracking-[0.2em]">
                  {printType === 'kwitansi' ? 'Telah Diterima Dari:' : 'Ditagihkan Kepada:'}
                </p>
                <p className="font-black text-lg text-slate-900 m-0 mb-0.5">{printData.namaCustomer || printData.nama}</p>
                <p className="text-xs m-0 mb-0.5 font-bold text-slate-500">{(customers.find(c => c.id === printData?.customerId))?.noHp || printData.noTelepon || '-'}</p>
                <p className="text-xs m-0 leading-relaxed font-medium text-slate-600 max-w-md">{(customers.find(c => c.id === printData?.customerId))?.alamatKoresponden || printData.alamat || '-'}</p>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden mb-6">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="py-2.5 px-4 text-left text-[10px] uppercase tracking-widest font-bold">Deskripsi</th>
                      <th className="py-2.5 px-4 text-right text-[10px] uppercase tracking-widest font-bold w-1/3">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-4 px-4 border-b border-slate-100 align-top">
                        <p className="text-base font-black text-slate-900 m-0 mb-2">{printTitle}</p>
                        <p className="text-xs text-slate-600 font-medium m-0 mb-0.5">Perumahan: <strong>{printData.perumahan}</strong></p>
                        <p className="text-xs text-slate-600 font-medium m-0 mb-0.5">Kavling: <strong>Blok {printData.blok} - No. {printData.nomorUnit}</strong> {printData.tipe ? `(Tipe ${printData.tipe})` : ''} LT: {printData.luasTanah || '-'} / LB: {printData.luasBangunan || '-'}</p>
                        <p className="text-xs text-slate-600 font-medium m-0">Skema Pembayaran: <strong>{printData.caraPembayaran?.replace('_', ' ')}</strong></p>
                      </td>
                      <td className="py-4 px-4 border-b border-slate-100 text-right align-top text-lg font-black text-slate-900">
                        {formatRupiah(printData.nominalCetak || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex flex-row justify-between items-start gap-6 mb-6">
                <div className="flex-1">
                  {(() => {
                    let rekening: any = printData.rekeningTujuan;
                    if (!rekening && printData.rekeningTujuanId) {
                      const b = bankList.find((x: any) => x.id === Number(printData.rekeningTujuanId));
                      if (b) rekening = { namaBank: b.namaBank, noRekening: b.noRekening, atasNama: b.atasNama };
                    }
                    if (!rekening) return null;
                    return (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                          {printType === 'kwitansi' ? 'Pembayaran Ditransfer Ke:' : 'Transfer Pembayaran Ke:'}
                        </span>
                        <p className="text-xs font-bold text-slate-900 uppercase">Bank {rekening.namaBank}</p>
                        <p className="text-lg font-black text-slate-900 my-0.5 font-mono tracking-tight">{rekening.noRekening}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">A/N: {rekening.atasNama}</p>
                      </div>
                    );
                  })()}
                </div>

                <div className="w-[280px] space-y-3">
                  {(printData.hargaJual > 0) && (
                    <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Harga Jual Unit</span>
                        <span className="text-slate-800 text-xs">{formatRupiah(printData.hargaJual || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Sisa Belum Dibayar</span>
                        <span className="text-red-600 text-xs">
                          {formatRupiah(printData.status === 'LUNAS' ? printData.sisaBelumDibayar : Math.max(0, (printData.sisaBelumDibayar || 0) - (printData.nominalCetak || 0)))}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className={`flex justify-between items-center p-4 rounded-xl border-2 ${printType === 'kwitansi' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-900 border-slate-900 text-white'}`}>
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Total</span>
                    <span className="text-xl font-black">{formatRupiah(printData.nominalCetak || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl text-[9px] text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 mb-1 uppercase tracking-widest">Catatan:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Harga jual pembelian unit rumah sudah termasuk biaya AJB, Sertipikat, IMB, Listrik, BPHTB, Biaya Proses KPR dan Notaris.</li>
                  <li>Harga jual khusus pembelian kavling belum termasuk biaya BPHTB, PPJB, AJB, Sertipikat dan Biaya Mutasi PBB.</li>
                  <li>Apabila terjadi pembatalan, uang tanda jadi (Booking Fee) tidak dapat dikembalikan / hangus.</li>
                </ul>
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-slate-100 mt-auto">
                <div className="flex flex-col items-center p-2 border border-slate-200 rounded-xl bg-slate-50 shadow-sm">
                  <div style={{ background: 'white', padding: '3px', borderRadius: '6px' }}>
                    <QRCode
                      value={`${window.location.origin}/verify/${printType === 'kwitansi' ? printData.noTagihan.replace('INV-', 'KWT-') : printData.noTagihan}`}
                      size={60}
                      level="H"
                    />
                  </div>
                  <span className="text-[8px] text-slate-500 mt-2 font-bold tracking-widest uppercase">Scan Validasi</span>
                  <span className="text-[9px] text-slate-800 font-bold mt-0.5 tracking-wide">[www.purisafana.com](https://www.purisafana.com)</span>
                  <span className="text-[8px] text-slate-500 mt-2 font-bold tracking-widest uppercase">Hormat Kami,</span>
                  <span className="text-[10px] text-slate-900 font-black mt-0.5 tracking-wide uppercase">
                    {printData.pembuat}
                  </span>
                </div>

                {printType === 'kwitansi' && (
                  <div className="text-center w-[200px] relative">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Tangerang, {formatDate(printData.tanggal || new Date().toISOString())}
                    </p>

                    {(() => {
                      const ttdRole = printTitle.includes('Booking Fee') ? 'Kwitansi_Booking' : 'Kwitansi_DP';
                      const ttdObj = printData.ttdData?.[ttdRole];

                      if (ttdObj?.url) {
                        return (
                          <div className="flex flex-col items-center justify-center my-2 h-16">
                            <img src={ttdObj.url} alt="Tanda Tangan" className="h-14 object-contain" crossOrigin="anonymous" />
                            <span className="text-[7px] text-slate-400 font-medium">Signed at: {formatDate(ttdObj.tanggal)}</span>
                          </div>
                        );
                      }
                      return <div className="h-16 w-full"></div>;
                    })()}

                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest border-b-[2px] border-slate-900 pb-1.5 inline-block z-10 relative">
                      MARKETING
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">{selectedPerumahan?.nama}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={() => setPrintData(null)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-colors">Tutup</button>

          {printType === 'kwitansi' && (
            <button onClick={() => {
              setTtdData({
                nama: 'Marketing',
                tanggal: new Date().toISOString().split('T')[0],
                sebagai: printTitle.includes('Booking Fee') ? 'Kwitansi_Booking' : 'Kwitansi_DP'
              });
              setIsTtdModalOpen(true);
              setTimeout(() => sigCanvas.current?.clear(), 100);
            }} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2">
              <PenTool size={16} /> Tanda Tangan
            </button>
          )}

          <button onClick={handleShareWA} className="px-6 py-2.5 bg-green-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer hover:bg-green-600 shadow-md shadow-green-500/20 flex items-center gap-2 transition-colors">
            Kirim via WA
          </button>
          <button onClick={handlePrintPDF} className="px-8 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer hover:bg-slate-800 flex items-center gap-2 transition-colors shadow-lg shadow-black/10">
            <Printer size={16} /> Download PDF
          </button>
        </div>
      </Modal>

      {/* MODAL LIGHTBOX PREVIEW GAMBAR BUKTI */}
      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Bukti Transfer">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              <img
                src={previewImage}
                alt="Preview Bukti Transfer"
                className="max-w-full max-h-[60vh] rounded-lg shadow-xl object-contain"
              />
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a
              href={previewImage || '#'}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Buka Tab Baru
            </a>
            <button
              onClick={() => setPreviewImage(null)}
              className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-md"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL TANDA TANGAN */}
      <Modal isOpen={isTtdModalOpen} onClose={() => setIsTtdModalOpen(false)} title="Tanda Tangan Digital Kwitansi">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Penandatangan" value={ttdData.nama} onChange={(e) => setTtdData({ ...ttdData, nama: e.target.value })} placeholder="Nama Marketing..." />
            <Input label="Tanggal Tanda Tangan" type="date" value={ttdData.tanggal} onChange={(e) => setTtdData({ ...ttdData, tanggal: e.target.value })} />
          </div>
          <div>
            <label className="text-[13px] font-bold text-slate-600 uppercase tracking-wider ml-1 mb-2 block">Area Tanda Tangan</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden shadow-inner">
              <SignatureCanvas ref={sigCanvas} penColor="black" backgroundColor="white" canvasProps={{ width: 600, height: 200, className: 'sigCanvas w-full cursor-crosshair' }} />
            </div>
            <div className="flex justify-between items-center mt-2 px-1">
              <p className="text-xs font-medium text-slate-400">Pastikan tanda tangan berada di dalam kotak.</p>
              <button type="button" onClick={() => sigCanvas.current?.clear()} className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer transition-colors">Hapus / Ulangi</button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button onClick={() => setIsTtdModalOpen(false)} disabled={uploadSignatureMutation.isPending} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-50">Batal</button>
            <button onClick={saveSignature} disabled={uploadSignatureMutation.isPending} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-colors disabled:opacity-50">
              {uploadSignatureMutation.isPending ? "Menyimpan..." : "Simpan Tanda Tangan"}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL DETAIL PENJUALAN */}
      <Modal isOpen={!!selectedDetailRow} onClose={() => setSelectedDetailRow(null)} title="Informasi Penjualan Kavling">
        {selectedDetailRow && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                  <p className="text-lg font-black text-slate-900">{selectedDetailRow.namaCustomer}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${detailPenjualanData?.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                    detailPenjualanData?.status === 'BOOKED' ? 'bg-blue-100 text-blue-800' :
                      detailPenjualanData?.status === 'PROSES' ? 'bg-yellow-100 text-yellow-800' :
                        detailPenjualanData?.status === 'TERJUAL' || detailPenjualanData?.status === 'LUNAS' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-200 text-slate-700'
                    }`}>
                    {detailPenjualanData?.status || 'DATA TERBATAS'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Kavling</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedDetailRow.kavling}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Tipe Unit</p>
                  <p className="text-sm font-semibold text-slate-800">{detailPenjualanData?.tipe || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Metode Pembayaran</p>
                  <p className="text-sm font-semibold text-slate-800">{detailPenjualanData?.pembiayaan?.replace('_', ' ') || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Harga Jual</p>
                  <p className="text-sm font-bold text-blue-700">{detailPenjualanData ? formatRupiah(detailPenjualanData.harga) : '-'}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDetailRow(null)}
                className="px-6 py-2 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-black transition-colors cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Tagihan;
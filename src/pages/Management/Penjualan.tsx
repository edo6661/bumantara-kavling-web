/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import { formatDate, formatRupiah } from "../../utils/formatters";
import {
  FileText, Receipt, Printer, UploadCloud, Ban, PenTool, Clock, ZoomIn, Eye,
  ChevronDown, ChevronUp, Filter, ArrowUpDown, PieChart, CheckCircle2, Wallet,
  Edit2
} from 'lucide-react';
import { jsPDF } from "jspdf";
import * as htmlToImage from 'html-to-image';
import PageLoader from "../PageLoader";

import { useGetPenjualan, useCreatePenjualan, useCancelPenjualan, useUploadBuktiPenjualan, useUpdatePenjualan, useUploadSignature } from "../../hooks/queries/usePenjualan";
import { useGetAgents } from "../../hooks/queries/useAgent";
import { useGetPerumahan } from "../../hooks/queries/usePerumahan";
import { useGetKavlings } from "../../hooks/queries/useKavling";
import { useGetBankRekening } from "../../hooks/queries/useBankRekening";
import CurrencyInput from "../../components/shared/CurrencyInput";
import QRCode from "react-qr-code";
import { useAuth } from "../../context/AuthContext";
import SignatureCanvas from 'react-signature-canvas';
import type { AgentData } from '../../services/agent.service';

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

  hargaDasar: number;
  plafonAwal?: number;
  biayaKpr?: number;
  nilaiPengajuanKpr?: number;
  hargaJual: number;
  dp: number;
  diskonPenjualan: number;
  bookingFee: number;

  bank: string;
  caraPembayaran: string;
  fileKtp: string;
  fileKk: string;
  fileNpwp: string;
  status: string;
  agent: string;
  jumlahCicilanTerbayar?: number;
  fileBuktiBooking?: string;
  fileBuktiDp?: string;
  fileSpr?: string | null;
  progressCicilan?: string;
  rekeningTujuanId?: number | '';
  isPendingBatal?: boolean;
  ttdData?: any;
  createdBy?: string;
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

  hargaDasar: 0,
  plafonAwal: 0,
  biayaKpr: 0,
  nilaiPengajuanKpr: 0,
  hargaJual: 0,
  dp: 0,
  diskonPenjualan: 0,
  bookingFee: 5000000,

  bank: '',
  caraPembayaran: '',
  fileKtp: '',
  fileKk: '',
  fileNpwp: '',
  status: 'Booked',
  agent: '',
  fileBuktiBooking: '',
  fileBuktiDp: '',
  rekeningTujuanId: '',
};

interface BiayaTambahan {
  id: string;
  nama: string;
  nominal: number;
}

const Penjualan = () => {
  const { selectedPerumahan } = useAuth();

  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);


  const [biayaTambahanList, setBiayaTambahanList] = useState<BiayaTambahan[]>([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';
  const orderBy = searchParams.get('orderBy') || '';
  const limit = 10;

  const { data: penjualanResponse, isLoading } = useGetPenjualan({
    page,
    limit,
    search,
    status: statusFilter !== '' ? statusFilter : undefined,
    orderBy: orderBy !== '' ? orderBy : undefined
  });

  const penjualanData = penjualanResponse?.items || [];
  const meta = penjualanResponse?.meta;
  const summary = meta?.summary || {};

  const { data: agentData = [] } = useGetAgents();
  const { data: perumahanData = [] } = useGetPerumahan();
  const { data: kavlingResponse } = useGetKavlings({ limit: 500 });
  const { data: bankList = [] } = useGetBankRekening();
  const kavlingList = useMemo(() => kavlingResponse?.items || [], [kavlingResponse]);

  const createMutation = useCreatePenjualan();
  const cancelMutation = useCancelPenjualan();
  const uploadBuktiMutation = useUploadBuktiPenjualan();
  const updateMutation = useUpdatePenjualan();
  const uploadSignatureMutation = useUploadSignature();

  const [isNewAgent, setIsNewAgent] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<PenjualanData | null>(null);

  const [isSkemaModalOpen, setIsSkemaModalOpen] = useState(false);
  const [selectedPenjualan, setSelectedPenjualan] = useState<PenjualanData | null>(null);
  const [formData, setFormData] = useState<PenjualanData>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof PenjualanData, string>>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [originalKavling, setOriginalKavling] = useState({ blok: '', unit: '' });

  const [printData, setPrintData] = useState<any>(null);
  const [printType, setPrintType] = useState<'invoice' | 'kwitansi' | null>(null);
  const [printTitle, setPrintTitle] = useState('');

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelData, setCancelData] = useState({ id: '', alasanBatal: '' });
  const [selectedCancelRow, setSelectedCancelRow] = useState<PenjualanData | null>(null);

  const [isTtdModalOpen, setIsTtdModalOpen] = useState(false);
  const [ttdData, setTtdData] = useState({ nama: '', tanggal: '', sebagai: '' });
  const sigCanvas = useRef<SignatureCanvas>(null);

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => { prev.set('page', String(newPage)); return prev; });
  };
  const handleSearchChange = (newSearch: string) => {
    setSearchParams(prev => {
      if (newSearch) prev.set('search', newSearch); else prev.delete('search');
      prev.set('page', '1'); return prev;
    });
  };
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams(prev => {
      if (e.target.value) prev.set('status', e.target.value); else prev.delete('status');
      prev.set('page', '1'); return prev;
    });
  };
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams(prev => {
      if (e.target.value) prev.set('orderBy', e.target.value); else prev.delete('orderBy');
      prev.set('page', '1'); return prev;
    });
  };

  const openDetailModal = (item: PenjualanData) => {
    setDetailData(item);
    setIsDetailModalOpen(true);
  };

  const handleRecalculateDependencies = (name: string, value: any, prev: PenjualanData) => {
    const merged = { ...prev, [name]: value };
    const updates: any = { [name]: value };

    const base = Number(merged.hargaDasar) || 0;
    const diskon = Number(merged.diskonPenjualan) || 0;
    const bf = Number(merged.bookingFee) || 5000000;


    const baseHargaJual = Math.max(0, base - diskon);
    updates.hargaJual = baseHargaJual;

    let plafon = 0;
    if (['diskonPenjualan', 'hargaDasar', 'bookingFee', 'caraPembayaran'].includes(name)) {
      plafon = Math.max(0, base - diskon - bf);
      updates.plafonAwal = plafon;
    } else {
      plafon = Number(merged.plafonAwal) || 0;
    }

    if (merged.caraPembayaran === 'KPR') {
      if (['diskonPenjualan', 'hargaDasar', 'caraPembayaran', 'plafonAwal', 'bookingFee'].includes(name)) {
        updates.biayaKpr = plafon * 0.06;
        updates.nilaiPengajuanKpr = plafon + updates.biayaKpr;
        updates.dp = updates.nilaiPengajuanKpr * 0.1;
      }
      else if (name === 'biayaKpr') {
        updates.nilaiPengajuanKpr = plafon + Number(value);
        updates.dp = updates.nilaiPengajuanKpr * 0.1;
      }
      else if (name === 'nilaiPengajuanKpr') {
        updates.dp = Number(value) * 0.1;
      }
    } else {
      updates.biayaKpr = 0;
      updates.nilaiPengajuanKpr = 0;
      updates.dp = 0;
      if (name === 'caraPembayaran') updates.bank = '';
    }

    return updates;
  };

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
    return [...new Set(bloks)].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [availableKavlings]);

  const availableUnits = useMemo(() => {
    if (!formData.blok) return [];
    return availableKavlings
      .filter(k => k.blok === formData.blok)
      .map(k => k.nomorUnit)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [availableKavlings, formData.blok]);

  const columns = [
    { header: 'ID Penjualan', accessor: 'id' },
    { header: 'Tanggal', accessor: 'tanggal', render: (val: string) => formatDate(val) },
    { header: 'Nama Customer', accessor: 'nama', render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },
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
    { header: 'Cara Pembayaran', accessor: 'caraPembayaran', render: (val: string) => val ? val.replace(/_/g, ' ') : '-' },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => {
        let bgClass = 'bg-blue-100 text-blue-800';
        if (val === 'PROSES') bgClass = 'bg-yellow-100 text-yellow-800';
        if (val === 'LUNAS' || val === 'TERJUAL') bgClass = 'bg-emerald-100 text-emerald-800';
        if (val === 'BATAL') bgClass = 'bg-red-100 text-red-800';
        return (
          <span className={`${bgClass} px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider`}>
            {val}
          </span>
        )
      }
    },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (_: unknown, row: PenjualanData) => (
        <div className="flex items-center gap-2">
          {row.hargaJual && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDetailModal(row);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              title="Lihat Detail"
            >
              <Eye size={14} /> Detail
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal(row);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            title="Edit Penjualan"
          >
            <Edit2 size={14} /> Edit
          </button>
        </div>
      )
    }
  ];

  const openModal = (item?: PenjualanData) => {
    if (item) {
      setFormData({
        ...item,
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

  const openSkemaModal = (item: any) => {
    const tipeKavling = item.tipe?.toLowerCase() || '';
    const autoDiskon = tipeKavling === 'aruna' ? 10000000 : 6000000;
    const diskonTerpakai = (Number(item.diskonPenjualan) > 0) ? Number(item.diskonPenjualan) : autoDiskon;

    const base = Number(item.hargaDasar || item.hargaJual) || 0;
    const bf = 5000000;
    const caraBayar = item.caraPembayaran ? item.caraPembayaran.replace(/_/g, " ") : 'CASH KERAS';

    const plafon = Math.max(0, base - diskonTerpakai - bf);

    let initialBiayaKpr = Number(item.biayaKpr) || 0;
    let initialNilaiKpr = Number(item.nilaiPengajuanKpr) || 0;
    let initialDp = Number(item.dp) || 0;
    const initialPlafon = (Number(item.diskonPenjualan) === 0 && diskonTerpakai > 0)
      ? plafon
      : (Number(item.plafonAwal) || plafon);


    const initialHargaJual = Math.max(0, base - diskonTerpakai);

    if (caraBayar === 'KPR') {
      if (initialBiayaKpr === 0 && initialDp === 0) {
        initialBiayaKpr = initialPlafon * 0.06;
        initialNilaiKpr = initialPlafon + initialBiayaKpr;
        initialDp = initialNilaiKpr * 0.1;
      }
    } else {
      initialBiayaKpr = 0;
      initialNilaiKpr = 0;
      initialDp = 0;
    }

    setSelectedPenjualan(item);

    setFormData({
      ...item,
      hargaDasar: base,
      bookingFee: bf,
      caraPembayaran: caraBayar,
      biayaKpr: initialBiayaKpr,
      nilaiPengajuanKpr: initialNilaiKpr,
      dp: initialDp,
      diskonPenjualan: diskonTerpakai,
      plafonAwal: initialPlafon,
      hargaJual: initialHargaJual,
    });

    setErrors({});
    setBiayaTambahanList([]);
    setIsSkemaModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setIsEditing(false);
    setIsNewAgent(false);
    setErrors({});
  };


  const handleAddBiayaTambahan = () => {
    setBiayaTambahanList([
      ...biayaTambahanList,
      { id: Date.now().toString(), nama: 'Uang Muka', nominal: 0 }
    ]);
  };

  const handleRemoveBiayaTambahan = (id: string) => {
    setBiayaTambahanList(biayaTambahanList.filter(b => b.id !== id));
  };

  const handleChangeBiayaTambahanNama = (id: string, nama: string) => {
    setBiayaTambahanList(biayaTambahanList.map(b => b.id === id ? { ...b, nama } : b));
  };

  const handleChangeBiayaTambahanNominal = (id: string, nominal: number) => {
    setBiayaTambahanList(biayaTambahanList.map(b => b.id === id ? { ...b, nominal } : b));
  };

  const saveSignature = async () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Tanda tangan tidak boleh kosong!");
      return;
    }
    const canvas = sigCanvas.current?.getCanvas();
    if (!canvas) return;
    const signatureBase64 = canvas.toDataURL('image/png');

    try {
      await uploadSignatureMutation.mutateAsync({
        noTransaksi: printData.id,
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
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menyimpan tanda tangan");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;

    setFormData((prev) => {
      let updates = handleRecalculateDependencies(name, finalValue, prev);
      if (name === 'perumahan') {
        updates = { ...updates, blok: '', nomorUnit: '', tipe: '', luasBangunan: 0, luasTanah: 0, hargaDasar: 0 };
      }
      return { ...prev, ...updates };
    });

    if (errors[name as keyof PenjualanData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCurrencyChange = (name: string, value: number) => {
    setFormData((prev) => {
      const updates = handleRecalculateDependencies(name, value, prev);
      return { ...prev, ...updates };
    });

    if (errors[name as keyof PenjualanData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlokChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const blok = e.target.value;
    setFormData(prev => ({
      ...prev,
      blok, nomorUnit: '', tipe: '', luasBangunan: 0, luasTanah: 0, hargaDasar: 0
    }));
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unit = e.target.value;
    const selectedKav = availableKavlings.find(k => k.blok === formData.blok && k.nomorUnit === unit);

    if (selectedKav) {
      setFormData(prev => {
        const tipeKavling = selectedKav.namaTipe.toLowerCase();
        const diskonPenjualan = tipeKavling === 'aruna' ? 10000000 : 6000000;
        const baseHarga = Number(selectedKav.hargaDasar) || 0;
        const updates = handleRecalculateDependencies('hargaDasar', baseHarga, { ...prev, diskonPenjualan });

        return {
          ...prev,
          ...updates,
          nomorUnit: unit,
          tipe: selectedKav.namaTipe,
          luasBangunan: selectedKav.luasBangunan,
          luasTanah: selectedKav.luasTanah,
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
    if (!formData.agent.trim()) newErrors.agent = 'Agent wajib dipilih/diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSkemaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.caraPembayaran) newErrors.caraPembayaran = 'Cara pembayaran wajib dipilih';
    if (formData.caraPembayaran === 'KPR' && !formData.bank?.trim()) newErrors.bank = 'Bank KPR wajib diisi';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const updatePayload: any = {
        caraPembayaran: formData.caraPembayaran,
        bank: formData.bank || undefined,
        hargaDasar: formData.hargaDasar,
        hargaJual: formData.hargaJual,
        plafonAwal: formData.caraPembayaran === 'KPR' ? formData.plafonAwal : undefined,
        biayaKpr: formData.caraPembayaran === 'KPR' ? formData.biayaKpr : undefined,
        nilaiPengajuanKpr: formData.caraPembayaran === 'KPR' ? formData.nilaiPengajuanKpr : undefined,
        dp: formData.caraPembayaran === 'KPR' ? formData.dp : undefined,
        diskonPenjualan: formData.diskonPenjualan,

        biayaTambahan: biayaTambahanList
          .map((b) => ({
            nama: b.nama,
            nominal: Number(b.nominal)
          }))
          .filter((b) => b.nama.trim() !== '' && b.nominal > 0),
      };

      await updateMutation.mutateAsync({ id: selectedPenjualan!.id!, data: updatePayload });
      setIsSkemaModalOpen(false);
      setFormData(initialFormState);
      setSelectedPenjualan(null);
      alert("Skema pembayaran berhasil disimpan dan dokumen SPR siap dicetak!");
    } catch (error: any) {
      alert(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan skema pembayaran');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isEditing && formData.id) {
        const updatePayload: any = {
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
          rekeningTujuanId: formData.rekeningTujuanId ? Number(formData.rekeningTujuanId) : undefined,
        };

        await updateMutation.mutateAsync({ id: formData.id, data: updatePayload });
        closeModal();

      } else {
        const payload: any = {
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
          agent: formData.agent,
          rekeningTujuanId: formData.rekeningTujuanId ? Number(formData.rekeningTujuanId) : undefined,

          hargaDasar: formData.hargaDasar,
          bookingFee: 5000000,
          diskonPenjualan: formData.diskonPenjualan,
        };

        const result = await createMutation.mutateAsync(payload);
        closeModal();

        if (result) {
          setPrintData({ ...formData, id: result.noTransaksi, nominalCetak: payload.bookingFee });
          setPrintType('invoice');
          setPrintTitle('Booking Fee');
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
      alert("Pengajuan pembatalan berhasil dikirim ke Admin.");
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
          {row.isPendingBatal ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
              <Clock size={12} className="animate-spin" /> Sedang Diajukan Pembatalan
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {((row.status === 'BOOKED' || row.status === 'PROSES')) && (
                <button
                  onClick={() => {
                    setSelectedCancelRow(row);
                    setCancelData({ id: row.id!, alasanBatal: '' });
                    setIsCancelModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  <Ban size={12} /> Ajukan Pembatalan
                </button>
              )}
              <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${row.status === 'BATAL' ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-700'}`}>
                Status: {row.status}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">1. Booking Fee & SPR</h5>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setPrintType('invoice');
                  setPrintTitle('Booking Fee');
                  setPrintData({ ...row, nominalCetak: row.bookingFee, pembuat: row.createdBy || 'Admin' });
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
                      setPrintTitle('Booking Fee');
                      setPrintData({ ...row, nominalCetak: row.bookingFee, pembuat: row.createdBy || 'Admin' });
                    }}
                    className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
                  >
                    <Receipt size={14} /> Kwitansi
                  </button>
                  {row.fileSpr ? (
                    <a
                      href={row.fileSpr}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer shadow-sm"
                    >
                      <FileText size={14} /> Lihat SPR
                    </a>
                  ) : (
                    <button
                      onClick={() => openSkemaModal(row)}
                      className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer shadow-md"
                    >
                      <PenTool size={14} /> Buat SPR
                    </button>
                  )}
                </>
              ) : (
                <label className={`flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md ${uploadBuktiMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <UploadCloud size={14} /> {uploadBuktiMutation.isPending ? "Mengunggah..." : "Upload Bukti Booking"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadBukti(row.id!, 'booking', e)} disabled={uploadBuktiMutation.isPending} />
                </label>
              )}
            </div>

            {row.fileBuktiBooking && (
              <div className="mt-4 border-t border-slate-200 pt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bukti Transfer Booking Fee</p>
                <div
                  onClick={() => setPreviewImage(row.fileBuktiBooking as string)}
                  className="relative w-24 h-16 rounded-lg border border-slate-200 overflow-hidden cursor-zoom-in group shadow-sm bg-slate-100"
                  title="Klik untuk perbesar"
                >
                  <img src={row.fileBuktiBooking} alt="Bukti Booking" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ZoomIn size={14} className="text-white" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {row.caraPembayaran === 'KPR' && (
            <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
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
                    <div
                      onClick={() => setPreviewImage(row.fileBuktiDp as string)}
                      className="relative w-10 h-8 rounded-md border border-slate-200 overflow-hidden cursor-zoom-in group shadow-sm bg-slate-100"
                      title="Lihat Bukti DP"
                    >
                      <img src={row.fileBuktiDp} alt="Bukti DP" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                  </>
                ) : (
                  <label className={`flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md ${uploadBuktiMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <UploadCloud size={14} /> {uploadBuktiMutation.isPending ? "Mengunggah..." : "Upload Bukti DP"}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleUploadBukti(row.id!, 'dp', e)} disabled={uploadBuktiMutation.isPending} />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleShareWA = () => {
    if (!printData) return;
    const phone = (printData.noTelepon || '').replace(/[^0-9]/g, '');
    if (!phone) {
      alert('Nomor telepon customer tidak valid / kosong.');
      return;
    }
    const waPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;

    let docId = printData.id;
    if (printTitle.includes('Booking Fee')) {
      docId = printType === 'kwitansi' ? `KWT-BF-${printData.id}` : `INV-BF-${printData.id}`;
    } else if (printTitle.includes('Down Payment') || printTitle.includes('DP')) {
      docId = printType === 'kwitansi' ? `KWT-DP-${printData.id}` : `INV-DP-${printData.id}`;
    }
    const documentLink = `${window.location.origin}/verify/${docId}`;

    let rekeningText = '';
    let rekening: any = null;
    if (printData.rekeningTujuanId) {
      const b = bankList.find((x: any) => x.id === Number(printData.rekeningTujuanId));
      if (b) rekening = { namaBank: b.namaBank, noRekening: b.noRekening, atasNama: b.atasNama };
    }

    if (rekening) {
      rekeningText = `\n\n*Informasi Rekening Pembayaran:*\nBank: *${rekening.namaBank}*\nNo. Rekening: *${rekening.noRekening}*\nAtas Nama: *${rekening.atasNama}*`;
    }

    let message = `Halo Bapak/Ibu *${printData.nama}*, semoga senantiasa dalam keadaan sehat.\n\nBersama pesan ini, kami dari *Marketing ${selectedPerumahan?.nama || 'Bumantara'}* ingin menyampaikan informasi terkait *${printTitle}* untuk unit Kavling *${printData.perumahan} Blok ${printData.blok}-${printData.nomorUnit}*.`;

    if (printType === 'invoice') {
      message += `\n\n*Nominal Tagihan:* ${formatRupiah(printData.nominalCetak || 0)}${rekeningText}`;
    } else {
      message += `\n\nTerima kasih, pembayaran untuk ${printTitle} sebesar ${formatRupiah(printData.nominalCetak || 0)} telah kami terima dengan baik.`;
    }

    message += `\n\n*Unduh Dokumen PDF & Detail Transaksi:*\nBapak/Ibu dapat melihat dan mengunduh dokumen resmi secara mandiri melalui tautan berikut:\n${documentLink}`;

    if (printType === 'invoice') {
      message += `\n\n_Mohon perkenan Bapak/Ibu untuk melampirkan bukti transfer pada ruang obrolan ini apabila telah melakukan pembayaran._`;
    }

    message += `\n\nTerima kasih atas kepercayaan Bapak/Ibu.\nSalam Hangat,\n*Marketing ${selectedPerumahan?.nama || 'Bumantara'}*`;

    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePrintPDF = async () => {
    const element = document.getElementById('print-area');
    if (!element) return;
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const dataUrl = await htmlToImage.toPng(element, { quality: 1.0, pixelRatio: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const cleanNoDoc = (printData?.id || '').toString().replace(/INV-BF-|INV-DP-|KWT-BF-|KWT-DP-/g, '');
      pdf.save(`${printTitle.replace(/\s+/g, '_')}_${cleanNoDoc}.pdf`);
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat memproses PDF.');
    }
  };

  if (isLoading && penjualanData.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto">

      {/* SUMMARY CARDS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
        <div
          className="p-4 border-b border-slate-100 flex justify-between items-center cursor-pointer bg-white hover:bg-slate-50/50 transition-colors"
          onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <PieChart size={18} />
            </div>
            <h3 className="font-bold text-slate-900 tracking-tight">Ringkasan Penjualan</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            {isSummaryExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {isSummaryExpanded && (
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-5 bg-slate-50/30">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><Wallet size={18} className="text-slate-600" /></div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Total Transaksi</p>
              </div>
              <p className="text-3xl font-bold text-slate-900">{meta?.totalItems || 0}</p>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center"><Clock size={18} className="text-blue-600" /></div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Booked / Proses</p>
              </div>
              <p className="text-3xl font-bold text-blue-700">{(summary['BOOKED'] || 0) + (summary['PROSES'] || 0)}</p>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle2 size={18} className="text-emerald-600" /></div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Lunas</p>
              </div>
              <p className="text-3xl font-bold text-emerald-700">{summary['LUNAS'] || 0}</p>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><Ban size={18} className="text-red-600" /></div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Batal</p>
              </div>
              <p className="text-3xl font-bold text-red-700">{summary['BATAL'] || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
        <div
          className="p-4 border-b border-slate-100 flex justify-between items-center cursor-pointer bg-white hover:bg-slate-50/50 transition-colors"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
              <Filter size={18} />
            </div>
            <h3 className="font-bold text-slate-900 tracking-tight">Filter & Urutkan</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            {isFilterExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {isFilterExpanded && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
            <div className="relative">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Status Transaksi</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 appearance-none transition-all shadow-sm"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="">Semua Status</option>
                <option value="BOOKED">Booked</option>
                <option value="PROSES">Proses (Sudah BF)</option>
                <option value="LUNAS">Lunas</option>
                <option value="BATAL">Batal</option>
              </select>
              <div className="absolute right-3 top-[34px] pointer-events-none text-slate-400"><ChevronDown size={16} /></div>
            </div>

            <div className="relative">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Urutkan Berdasarkan</label>
              <select
                className="w-full px-4 pl-10 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 appearance-none transition-all shadow-sm"
                value={orderBy}
                onChange={handleSortChange}
              >
                <option value="">Terbaru (Default)</option>
                <option value="hargaJual:asc">Harga Jual: Rendah ke Tinggi</option>
                <option value="hargaJual:desc">Harga Jual: Tinggi ke Rendah</option>
                <option value="nama:asc">Nama Customer: A - Z</option>
              </select>
              <ArrowUpDown size={16} className="absolute left-3.5 top-[34px] pointer-events-none text-slate-400" />
              <div className="absolute right-3 top-[34px] pointer-events-none text-slate-400"><ChevronDown size={16} /></div>
            </div>
          </div>
        )}
      </div>

      {/* DATA TABLE */}
      <DataTable
        title="Data Penjualan"
        columns={columns}
        data={penjualanData}
        onAdd={() => openModal()}
        expandedRowRender={expandedRowRender}
        serverSide={true}
        searchTerm={search}
        onSearchChange={handleSearchChange}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={handlePageChange}
      />

      {/* FORM MODAL CREATE/EDIT */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit Data Penjualan" : "Tambah Penjualan Baru"}>
        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">1</div>
              Data Pembeli & Marketing
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 mb-2">
                {/* Agent Selection Logic */}
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
                      ...[...agentData]
                        .sort((a: AgentData, b: AgentData) => a.nama.localeCompare(b.nama))
                        .map((a: AgentData) => ({ value: a.nama, label: a.nama })),
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
                      className="absolute right-2 top-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
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

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">2</div>
              Data Kavling
            </h4>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <CurrencyInput
                  label="Harga Dasar Kavling"
                  name="hargaDasar"
                  value={formData.hargaDasar || 0}
                  onValueChange={handleCurrencyChange}
                  error={errors.hargaDasar}
                  placeholder="0"
                  disabled={true}
                />

                <Select
                  label="Pembayaran Melalui Bank"
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
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
            <button type="button" onClick={closeModal} className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Memproses...' : isEditing ? 'Simpan Perubahan' : 'Booking Unit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL SKEMA / SPR (Ubah bg-slate-900 ke styling yang lebih terang) */}
      <Modal isOpen={isSkemaModalOpen} onClose={() => { setIsSkemaModalOpen(false); setSelectedPenjualan(null); }} title="Buat Surat Pesanan Rumah (SPR)">
        {selectedPenjualan && (
          <form onSubmit={handleSkemaSubmit} className="space-y-6">
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
              <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-4 border-b border-indigo-100/50 pb-2">Informasi Pembeli</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Nama Customer</p>
                  <p className="text-sm font-bold text-slate-900">{selectedPenjualan.nama}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">NIK: {selectedPenjualan.noIdentitas}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Kavling Dipilih</p>
                  <p className="text-sm font-bold text-slate-900">{selectedPenjualan.perumahan} - Blok {selectedPenjualan.blok}-{selectedPenjualan.nomorUnit}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Tipe {selectedPenjualan.tipe} (LB: {selectedPenjualan.luasBangunan} / LT: {selectedPenjualan.luasTanah})</p>
                  <p className="text-sm font-bold text-indigo-600 mt-2">Harga Dasar: {formatRupiah(selectedPenjualan.hargaDasar || 0)}</p>
                </div>
              </div>
            </div>

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

            <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-3">Rangkuman Akhir Transaksi</h4>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Harga Dasar</span>
                <span className="text-sm font-bold text-slate-900">{formatRupiah(formData.hargaDasar || 0)}</span>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600 w-full">- Diskon Penjualan</p>
                <div className="w-48 sm:w-64">
                  <CurrencyInput
                    label=""
                    name="diskonPenjualan"
                    value={formData.diskonPenjualan}
                    onValueChange={handleCurrencyChange}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-3 w-full">
                  <span className="text-sm font-medium text-slate-600">- Booking Fee</span>
                  <button
                    type="button"
                    className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors rounded-md text-slate-700 font-bold shadow-sm"
                    onClick={handleAddBiayaTambahan}
                  >
                    +
                  </button>
                </div>
                <div className="w-48 sm:w-64">
                  <CurrencyInput
                    label=""
                    name="bookingFee"
                    value={formData.bookingFee}
                    onValueChange={handleCurrencyChange}
                    placeholder="0"
                  />
                </div>
              </div>

              {biayaTambahanList.map((biaya) => (
                <div key={biaya.id} className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-3 w-full pr-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveBiayaTambahan(biaya.id)}
                      className="w-6 h-6 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 transition-colors rounded-md font-bold"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      value={biaya.nama}
                      onChange={(e) => handleChangeBiayaTambahanNama(biaya.id, e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 w-full max-w-[200px] shadow-sm"
                      placeholder="Nama Biaya"
                    />
                  </div>
                  <div className="w-48 sm:w-64">
                    <CurrencyInput
                      label=""
                      name={`biaya_${biaya.id}`}
                      value={biaya.nominal}
                      onValueChange={(_, val) => handleChangeBiayaTambahanNominal(biaya.id, val)}
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}


              {formData.caraPembayaran === 'KPR' && (
                <>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-4">
                    <span className="text-sm font-semibold text-indigo-700">Plafon Awal <span className="hidden sm:inline font-normal text-slate-500">(Dasar - Diskon - BF)</span></span>
                    <span className="text-base font-bold text-indigo-700">{formatRupiah(formData.plafonAwal || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm font-medium text-slate-600 w-full">Bank KPR</p>
                    <div className="w-48 sm:w-64">
                      <Input
                        label=""
                        name="bank"
                        value={formData.bank}
                        onChange={handleChange}
                        placeholder="BCA / BSI / MANDIRI"
                        error={errors.bank}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium text-slate-600">+ Biaya KPR <span className="hidden sm:inline text-slate-400">(6% dari Plafon)</span></span>
                    <span className="text-sm font-bold text-slate-900">{formatRupiah(formData.biayaKpr || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-3">
                    <span className="text-sm font-semibold text-blue-700">Nilai Pengajuan KPR</span>
                    <span className="text-base font-bold text-blue-700">{formatRupiah(formData.nilaiPengajuanKpr || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm font-medium text-slate-600 w-full">+ DP KPR</span>
                    <div className="w-48 sm:w-64">
                      <CurrencyInput
                        label=""
                        name="dp"
                        value={formData.dp || 0}
                        onValueChange={handleCurrencyChange}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center p-4 bg-emerald-50 border border-emerald-200 rounded-xl mt-6">
                <span className="text-sm font-bold text-emerald-800 uppercase tracking-widest">
                  Harga Jual
                </span>
                <span className="text-xl font-black text-emerald-700">{formatRupiah(formData.hargaJual || 0)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => { setIsSkemaModalOpen(false); setSelectedPenjualan(null); }} className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                Batal
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Memproses...' : 'Simpan & Proses SPR'}
              </button>
            </div>
          </form>
        )}
      </Modal>

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
                      <span className="w-20 inline-block">NO DOC</span>: {printData.id.toString().replace('INV-BF-', '').replace('INV-DP-', '')} / {new Date(printData.tanggal || new Date()).getFullYear()}
                    </p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      <span className="w-20 inline-block">NO INVOICE</span>: {printData.id.toString().replace('INV-BF-', '').replace('INV-DP-', '')}
                    </p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      <span className="w-20 inline-block">TANGGAL</span>: {formatDate(printData.tanggal || new Date().toISOString())}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  {selectedPerumahan?.logo ? (
                    <img src={selectedPerumahan.logo} alt="Logo" className="h-12 object-contain mb-2" crossOrigin="anonymous" />
                  ) : (
                    <h3 className="m-0 text-xl font-black text-slate-900 tracking-tight mb-1">BUMANTARA</h3>
                  )}
                </div>
              </div>

              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[9px] text-slate-400 font-black mb-1.5 uppercase tracking-[0.2em]">
                  {printType === 'kwitansi' ? 'Telah Diterima Dari:' : 'Ditagihkan Kepada:'}
                </p>
                <p className="font-black text-lg text-slate-900 m-0 mb-0.5">{printData.nama}</p>
                <p className="text-xs m-0 mb-0.5 font-bold text-slate-500">{printData.noTelepon || '-'}</p>
                <p className="text-xs m-0 leading-relaxed font-medium text-slate-600 max-w-md">{printData.alamat || '-'}</p>
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
                        <p className="text-xs text-slate-600 font-medium m-0 mb-0.5">Kavling: <strong>Blok {printData.blok} - No. {printData.nomorUnit}</strong> {printData.tipe ? `(Tipe ${printData.tipe})` : ''}</p>
                        <p className="text-xs text-slate-600 font-medium m-0">
                          Agent Marketing: <strong>{printData.agent || '-'}</strong>
                        </p>
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
                    let rekening: any = null;
                    if (printData.rekeningTujuanId) {
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
                      value={`${window.location.origin}/verify/${printTitle.includes('Booking Fee')
                        ? (printType === 'kwitansi' ? `KWT-BF-${printData.id}` : `INV-BF-${printData.id}`)
                        : printTitle.includes('Down Payment') || printTitle.includes('DP')
                          ? (printType === 'kwitansi' ? `KWT-DP-${printData.id}` : `INV-DP-${printData.id}`)
                          : printData.id
                        }`}
                      size={60}
                      level="H"
                    />
                  </div>
                  <span className="text-[8px] text-slate-500 mt-2 font-bold tracking-widest uppercase">Scan Validasi</span>
                  <span className="text-[9px] text-slate-800 font-bold mt-0.5 tracking-wide">www.purisafana.com</span>
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

      <Modal isOpen={isCancelModalOpen} onClose={() => { setIsCancelModalOpen(false); setSelectedCancelRow(null); }} title="Ajukan Pembatalan Penjualan">
        {selectedCancelRow && (
          <form onSubmit={handleCancelSubmit} className="space-y-5">
            <div className="p-4 bg-orange-50 text-orange-800 border border-orange-200 rounded-xl text-sm font-medium leading-relaxed">
              <strong>Peringatan Tindakan!</strong> Tindakan ini akan mengirimkan <strong>Pengajuan Pembatalan</strong> ke Admin. Transaksi tidak akan langsung dibatalkan sampai Admin menyetujuinya. <br /><br />Jika disetujui, status transaksi menjadi "Batal", Kavling kembali "Available", dan tagihan belum terbayar akan dihapus.
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Detail Transaksi</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Customer</p>
                  <p className="text-sm font-bold text-slate-900">{selectedCancelRow.nama}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Kavling</p>
                  <p className="text-sm font-bold text-slate-900">{selectedCancelRow.perumahan} Blok {selectedCancelRow.blok}-{selectedCancelRow.nomorUnit}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Harga Jual</p>
                  <p className="text-sm font-bold text-blue-700">{formatRupiah(selectedCancelRow.hargaJual)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Metode</p>
                  <p className="text-sm font-bold text-slate-900">{selectedCancelRow.caraPembayaran.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>

            <Input
              label="Alasan Pembatalan"
              name="alasanBatal"
              value={cancelData.alasanBatal}
              onChange={(e) => setCancelData({ ...cancelData, alasanBatal: e.target.value })}
              placeholder="Contoh: BI Checking ditolak / Customer mengundurkan diri..."
              required
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => { setIsCancelModalOpen(false); setSelectedCancelRow(null); }} className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-50 transition-colors">Batal</button>

              <button type="submit" disabled={cancelMutation.isPending} className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-red-700 shadow-lg shadow-red-500/20 disabled:opacity-50 transition-colors">
                {cancelMutation.isPending ? "Memproses..." : "Ajukan Pembatalan"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Pratinjau Dokumen / Bukti">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              <img src={previewImage} alt="Preview Full" className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain" />
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a href={previewImage || '#'} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer">Buka Tab Baru</a>
            <button onClick={() => setPreviewImage(null)} className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-black/20">Tutup</button>
          </div>
        </div>
      </Modal>

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

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Informasi Transaksi">
        {detailData && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">1. Data Pembeli & Marketing</h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Nama Customer</p>
                  <p className="text-sm font-bold text-slate-900">{detailData.nama}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">No Identitas (NIK)</p>
                  <p className="text-sm font-medium text-slate-800">{detailData.noIdentitas}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">No Telepon</p>
                  <p className="text-sm font-medium text-slate-800">{detailData.noTelepon || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Agent Marketing</p>
                  <p className="text-sm font-bold text-blue-700">{detailData.agent}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Alamat Domisili</p>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">{detailData.alamat}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">2. Data Kavling</h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Perumahan</p>
                  <p className="text-sm font-bold text-slate-900">{detailData.perumahan}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Blok & Nomor Unit</p>
                  <p className="text-sm font-bold text-slate-900">Blok {detailData.blok} - {detailData.nomorUnit}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Tipe Unit</p>
                  <p className="text-sm font-medium text-slate-800">{detailData.tipe || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Dimensi</p>
                  <p className="text-sm font-medium text-slate-800">LT: {detailData.luasTanah} m² / LB: {detailData.luasBangunan} m²</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">
                3. Kalkulasi Transaksi ({detailData.caraPembayaran ? detailData.caraPembayaran.replace(/_/g, ' ') : 'CASH KERAS'})
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-300">Harga Dasar Kavling</span>
                  <span className="font-bold text-white">{formatRupiah(detailData.hargaDasar || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-300">- Diskon Penjualan</span>
                  <span className="font-bold text-red-400">{formatRupiah(detailData.diskonPenjualan || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-300">- Booking Fee</span>
                  <span className="font-bold text-red-400">{formatRupiah(detailData.bookingFee || 5000000)}</span>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50 mt-2 mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-blue-400">Plafon Awal</span>
                    <span className="text-sm font-bold text-blue-400">{formatRupiah(detailData.plafonAwal || 0)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    <strong className="text-slate-400">Kalkulasi:</strong> Harga Dasar - Diskon Penjualan - Booking Fee
                  </p>

                </div>

                {(detailData.caraPembayaran === 'KPR' || detailData.caraPembayaran === 'KPR') && (
                  <>
                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50 mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-indigo-400">Biaya KPR (6%)</span>
                        <span className="text-sm font-bold text-indigo-400">{formatRupiah(detailData.biayaKpr || 0)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        <strong className="text-slate-400">Kalkulasi:</strong> Plafon Awal × 6%
                      </p>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50 mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-purple-400">Nilai Pengajuan KPR</span>
                        <span className="text-sm font-bold text-purple-400">{formatRupiah(detailData.nilaiPengajuanKpr || 0)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        <strong className="text-slate-400">Kalkulasi:</strong> Plafon Awal + Biaya KPR
                      </p>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50 mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-amber-400">Down Payment (DP) 10%</span>
                        <span className="text-sm font-bold text-amber-400">{formatRupiah(detailData.dp || 0)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        <strong className="text-slate-400">Kalkulasi:</strong> Nilai Pengajuan KPR × 10%
                      </p>
                    </div>
                  </>
                )}

                <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-800 mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-base font-black text-emerald-400 uppercase tracking-wider">Harga Jual</span>
                    <span className="text-lg font-black text-emerald-400">{formatRupiah(detailData.hargaJual || 0)}</span>
                  </div>
                  <p className="text-[10px] text-emerald-600/70 font-mono">
                    <strong className="text-emerald-500/80">Kalkulasi:</strong> {
                      detailData.caraPembayaran === 'KPR' || detailData.caraPembayaran === 'KPR'
                        ? 'Nilai Pengajuan KPR + Down Payment (DP)'
                        : 'Harga Jual menyesuaikan besaran Plafon Awal'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button onClick={() => setIsDetailModalOpen(false)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors cursor-pointer">
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Penjualan;
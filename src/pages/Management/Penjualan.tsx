/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import { formatDate, formatRupiah, formatTanpaDesimal } from "../../utils/formatters";
import PenjualanDetailModal from "../../components/penjualan/PenjualanDetailModal";
import {
  FileText, Receipt, Printer, UploadCloud, Ban, PenTool, Clock, ZoomIn, Eye,
  ChevronDown, ChevronUp, Filter, ArrowUpDown, PieChart, CheckCircle2, Wallet,
  Edit2, Building2, Plus, MoreVertical
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
import { handleApiError } from '../../utils/errorHandler';
import type { AgentData } from '../../types/models/agent';

interface PenjualanData {
  id?: string;
  tanggal: string;
  nama: string;
  alamat: string;
  noTelepon: string;
  noIdentitas: string;
  alasanBatal?: string | null;
  perusahaan: string;
  plafonKredit?: number;
  dpTidakDibayar?: number;
  dpDibayar?: number;
  alamatKoresponden: string;
  perumahan: string;
  blok: string;
  tipe: string;
  luasBangunan?: number;
  luasTanah?: number;
  nomorUnit: string;

  hargaDasar: number;
  plafonAwal?: number;
  plafonAcc?: number;
  biayaKpr?: number;
  nilaiPengajuanKpr?: number;
  hargaJual: number;
  dp: number;
  persentaseDp?: number;
  diskonPenjualan: number;
  bookingFee: number;

  bank: string;
  bankKprNamaRekening?: string;
  bankKprAtasNamaRekening?: string;
  bankKprNoRekening?: string;
  caraPembayaran: string;
  termin?: number;
  cicilanPerBulan?: number;
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
  keteranganAngsuran?: string;
  rekeningTujuanId?: number | '';
  isPendingBatal?: boolean;
  ttdData?: any;
  createdBy?: string;
  riwayatSpr?: any[];
  tagihan?: any[];
  tambahanKpr?: any[];
  createdAt?: string;
  updatedAt?: string;
  progressProyek?: {
    persentase?: number;
    mandorId?: number | null;
    mandor?: { id: number; username: string } | null;
  } | null;
}

/** API / Prisma pakai enum `CASH_BERTAHAP`, opsi form pakai label dengan spasi */
function paymentMethodKey(cara: string | undefined | null): string {
  if (!cara) return '';
  return cara.toUpperCase().replace(/\s+/g, '_');
}

function isCashBertahap(cara: string | undefined | null): boolean {
  return paymentMethodKey(cara) === 'CASH_BERTAHAP';
}

function isKpr(cara: string | undefined | null): boolean {
  return paymentMethodKey(cara) === 'KPR';
}

function caraPembayaranToFormValue(cara: string | undefined | null): string {
  const k = paymentMethodKey(cara);
  if (k === 'CASH_BERTAHAP') return 'CASH BERTAHAP';
  if (k === 'CASH_KERAS') return 'CASH KERAS';
  if (k === 'KPR') return 'KPR';
  return cara ?? '';
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
  plafonAcc: 0,
  biayaKpr: 0,
  plafonKredit: 0,
  dpTidakDibayar: 0,
  dpDibayar: 0,
  nilaiPengajuanKpr: 0,
  hargaJual: 0,
  dp: 0,
  persentaseDp: 40,
  diskonPenjualan: 0,
  bookingFee: 5000000,

  bank: '',
  caraPembayaran: '',
  termin: 3,
  cicilanPerBulan: 0,
  fileKtp: '',
  fileKk: '',
  fileNpwp: '',
  status: 'Booked',
  agent: '',
  fileBuktiBooking: '',
  fileBuktiDp: '',
  rekeningTujuanId: '',
  keteranganAngsuran: '',
};

interface BiayaTambahan {
  id: string;
  nama: string;
  nominal: number;
}

const Penjualan = () => {
  const { selectedPerumahan } = useAuth();
  // const queryClient = useQueryClient();

  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const [biayaTambahanList, setBiayaTambahanList] = useState<BiayaTambahan[]>([]);
  const [historyBiayaTambahan, setHistoryBiayaTambahan] = useState<{ id: string, nama: string, nominal: number, tanggal: string }[]>([]);
  const [historyBiayaTambahanKpr, setHistoryBiayaTambahanKpr] = useState<{ id: string, nama: string, nominal: number }[]>([]);
  const [biayaTambahanKprList, setBiayaTambahanKprList] = useState<BiayaTambahan[]>([]);
  // const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);

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
  // const regenerateSprMutation = useRegenerateSpr();

  const [isNewAgent, setIsNewAgent] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<PenjualanData | null>(null);

  const [isSkemaModalOpen, setIsSkemaModalOpen] = useState(false);
  const [isRevisiSpr, setIsRevisiSpr] = useState(false);
  const [keteranganRevisi, setKeteranganRevisi] = useState('');
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
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = sigCanvas.current?.getCanvas();
      if (canvas && canvas.parentElement) {
        // Dapatkan rasio layar (Penting untuk layar HP / Retina Display agar tidak buram dan offset)
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        
        // Samakan ukuran internal canvas dengan ukuran visual elemennya
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        
        canvas.getContext("2d")?.scale(ratio, ratio);
        
        // Bersihkan canvas setiap kali di-resize agar siap digunakan
        sigCanvas.current?.clear();
      }
    };

    if (isTtdModalOpen) {
      // Gunakan sedikit delay agar animasi modal selesai render dan ukuran elemen bisa dibaca
      const timeoutId = setTimeout(resizeCanvas, 150);
      window.addEventListener("resize", resizeCanvas);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener("resize", resizeCanvas);
      };
    }
  }, [isTtdModalOpen]);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankData, setBankData] = useState({
    id: '',
    bank: '',
    bankKprNamaRekening: '',
    bankKprAtasNamaRekening: '',
    bankKprNoRekening: '',
  });


  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0, dropUp: false });

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id: bankData.id,
        data: {
          bank: bankData.bank,
          bankKprNamaRekening: bankData.bankKprNamaRekening,
          bankKprAtasNamaRekening: bankData.bankKprAtasNamaRekening,
          bankKprNoRekening: bankData.bankKprNoRekening,
        }
      });
      setIsBankModalOpen(false);
      setBankData({
        id: '',
        bank: '',
        bankKprNamaRekening: '',
        bankKprAtasNamaRekening: '',
        bankKprNoRekening: '',
      });
      alert("Data Bank KPR berhasil disimpan!");
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    }
  };

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


  const
    handleRecalculateDependencies = (
      name: string,
      value: unknown,
      prev: PenjualanData,
      currentBiayaTambahanList: BiayaTambahan[] = biayaTambahanList,
      currentBiayaTambahanKprList: BiayaTambahan[] = biayaTambahanKprList
    ) => {
      const merged = { ...prev, [name]: value };
      const updates: Partial<PenjualanData> = { [name as keyof PenjualanData]: value as never };

      const base = Number(merged.hargaDasar) || 0;
      const diskon = Number(merged.diskonPenjualan) || 0;
      const bf = Number(merged.bookingFee) || 5000000;

      let dpDibayar = merged.dpDibayar;
      if (name === 'dpDibayar') {
        dpDibayar = Number(value);
      }

      const totalTambahanBaru = currentBiayaTambahanList.reduce((sum, b) => sum + (Number(b.nominal) || 0), 0);
      const totalTambahanLama = historyBiayaTambahan.reduce((sum, b) => sum + b.nominal, 0);
      const totalTambahan = totalTambahanBaru + totalTambahanLama;

      const totalTambahanKprBaru = currentBiayaTambahanKprList.reduce((sum, b) => sum + (Number(b.nominal) || 0), 0);
      const totalTambahanKprLama = historyBiayaTambahanKpr.reduce((sum, b) => sum + (Number(b.nominal) || 0), 0);
      const totalTambahanKpr = totalTambahanKprBaru + totalTambahanKprLama;

      const isAutoCalcTrigger = ['caraPembayaran', 'hargaDasar', 'diskonPenjualan', 'bookingFee', 'termin'].includes(name);

      if (isKpr(merged.caraPembayaran)) {
        let plafonAwal = merged.plafonAwal;
        if (name === 'plafonAwal') {
          plafonAwal = Number(value);
        } else if (isAutoCalcTrigger || !plafonAwal) {
          plafonAwal = Math.max(0, base - diskon - bf);
        }

        let biayaKpr = merged.biayaKpr;
        if (name === 'biayaKpr') {
          biayaKpr = Number(value);
        } else if (isAutoCalcTrigger || name === 'plafonAwal' || !biayaKpr) {
          biayaKpr = Math.round((plafonAwal || 0) * 0.06);
        }

        let plafonKredit = merged.plafonKredit;
        if (name === 'plafonKredit') {
          plafonKredit = Number(value);
        } else if (isAutoCalcTrigger || ['plafonAwal', 'biayaKpr'].includes(name) || !plafonKredit) {
          plafonKredit = Math.round((plafonAwal || 0) + (biayaKpr || 0));
        }


        let nilaiPengajuanKpr = merged.nilaiPengajuanKpr;
        if (name === 'nilaiPengajuanKpr') {
          nilaiPengajuanKpr = Number(value);
        } else if (isAutoCalcTrigger || ['plafonAwal', 'biayaKpr', 'plafonKredit', 'biayaTambahan'].includes(name) || !nilaiPengajuanKpr) {
          nilaiPengajuanKpr = Math.round((plafonKredit || 0) - totalTambahan + totalTambahanKpr);
        }

        const baseHargaJual = (plafonKredit || 0) / 0.9;

        let hargaJual = merged.hargaJual;
        if (name === 'hargaJual') {
          hargaJual = Number(value);
        } else if (isAutoCalcTrigger || ['plafonAwal', 'biayaKpr', 'plafonKredit', 'biayaTambahan'].includes(name) || !hargaJual) {
          hargaJual = Math.round(baseHargaJual + diskon + totalTambahanKpr);
        }

        let dpTidakDibayar = merged.dpTidakDibayar;
        if (name === 'dpTidakDibayar') {
          dpTidakDibayar = Number(value);
        } else if (isAutoCalcTrigger || ['plafonAwal', 'biayaKpr', 'plafonKredit', 'hargaJual'].includes(name) || !dpTidakDibayar) {
          dpTidakDibayar = Math.round(((hargaJual || 0) - diskon) * 0.1 - bf);
        }

        updates.plafonAwal = plafonAwal;
        updates.biayaKpr = biayaKpr;
        updates.plafonKredit = plafonKredit;
        updates.nilaiPengajuanKpr = nilaiPengajuanKpr;
        updates.dpTidakDibayar = dpTidakDibayar;
        updates.dpDibayar = dpDibayar;
        updates.dp = (dpDibayar && dpDibayar > 0) ? dpDibayar : dpTidakDibayar;
        updates.hargaJual = hargaJual;

      } else {
        let hargaJual = merged.hargaJual;
        if (name === 'hargaJual') {
          hargaJual = Number(value);
        } else if (isAutoCalcTrigger || !hargaJual) {
          hargaJual = Math.max(0, base - diskon);
        }

        updates.hargaJual = hargaJual;
        updates.biayaKpr = 0;
        updates.plafonKredit = 0;
        updates.dpTidakDibayar = 0;
        updates.nilaiPengajuanKpr = 0;

        if (isCashBertahap(merged.caraPembayaran)) {
          let persentaseDp = name === 'persentaseDp' ? Number(value) : (merged.persentaseDp || 40);
          let dp = merged.dp;

          const triggerRecalcNominal = ['hargaDasar', 'diskonPenjualan', 'bookingFee', 'persentaseDp', 'caraPembayaran'].includes(name);

          if (triggerRecalcNominal) {
            dp = Math.round(Math.max(0, ((base - diskon) * (persentaseDp / 100)) - bf));
          } else if (name === 'dp') {
            dp = Number(value);
            const hargaPokok = Math.max(0, base - diskon);
            if (hargaPokok > 0) {
              const newPersentase = ((dp + bf) / hargaPokok) * 100;
              persentaseDp = Math.round(newPersentase * 100) / 100;
            }
          }

          updates.persentaseDp = persentaseDp;
          updates.dp = dp;

          const sisaPembayaran = Math.max(0, base - diskon - bf - dp);
          const termin = merged.termin !== undefined ? Number(merged.termin) : 3;
          updates.termin = termin;
          updates.cicilanPerBulan = termin > 0 ? Math.round(sisaPembayaran / termin) : 0;


        } else {
          updates.dp = 0;
          updates.termin = 0;
          updates.cicilanPerBulan = 0;
        }

        if (name === 'caraPembayaran') updates.bank = '';
      }

      return updates;
    };
  // const handleBulkGenerateSPR = async () => {
  //   if (!window.confirm("Yakin ingin men-generate SPR untuk data penjualan yang BELUM memiliki dokumen SPR?")) return;

  //   setIsGeneratingBulk(true);
  //   try {
  //     const res = await penjualanService.getAll({ limit: 300 });
  //     const allData = res.items || [];

  //     let count = 0;
  //     let skipped = 0;

  //     for (const item of allData) {
  //       if (item.status === 'BATAL') continue;
  //       if (item.fileSpr) {
  //         skipped++;
  //         continue;
  //       }

  //       try {
  //         await penjualanService.regenerateSpr(item.id as string);
  //         count++;
  //       } catch (err) {
  //         console.error(`Gagal generate SPR Transaksi ${item.id}`, err);
  //       }
  //     }

  //     queryClient.invalidateQueries({ queryKey: PENJUALAN_KEYS.all });

  //     alert(`Selesai! Berhasil men-generate ${count} dokumen SPR baru.\n(Dilewati: ${skipped} data karena sudah memiliki SPR)`);
  //   } catch (error) {
  //     console.error(error);
  //     alert("Gagal mengambil data penjualan.");
  //   } finally {
  //     setIsGeneratingBulk(false);
  //   }
  // };

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
    { header: 'Customer', accessor: 'nama', render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },
    { header: 'Blok', accessor: 'blok', render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
    { header: 'No', accessor: 'nomorUnit', render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
    {
      header: 'Mandor',
      accessor: 'progressProyek',
      render: (val: PenjualanData['progressProyek']) => (
        <span className="font-medium text-slate-700">
          {val?.mandor?.username ?? '-'}
        </span>
      ),
    },
    { header: 'Tanggal', accessor: 'tanggal', render: (val: string) => formatDate(val) },
    {
      header: 'Pembayaran',
      accessor: 'caraPembayaran',
      render: (val: string) => {
        if (!val) return '-';
        if (val === 'CASH_KERAS' || val === 'CASH KERAS') return 'KERAS';
        if (val === 'CASH_BERTAHAP' || val === 'CASH BERTAHAP') return 'BERTAHAP';
        return val;
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => {
        let bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
        if (val === 'PROSES') bgClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
        if (val === 'LUNAS' || val === 'TERJUAL') bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (val === 'BATAL') bgClass = 'bg-red-50 text-red-700 border-red-200';
        return (
          <span className={`${bgClass} px-2.5 py-1 border rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm`}>
            {val}
          </span>
        )
      }
    },
    {
      header: 'Cicilan',
      accessor: 'progressCicilan',
      render: (val: string) => (
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          {val || '-'}
        </span>
      )
    },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (_: unknown, row: PenjualanData) => {
        const hasActions = row.hargaJual || row.fileBuktiBooking;

        if (!hasActions) return <span className="text-slate-300">-</span>;

        const isActive = activeActionId === row.id;

        return (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isActive) {
                  setActiveActionId(null);
                } else {

                  const rect = e.currentTarget.getBoundingClientRect();
                  const spaceBelow = window.innerHeight - rect.bottom;

                  const dropUp = spaceBelow < 120;

                  setDropdownPos({
                    top: dropUp ? rect.top : rect.bottom,
                    right: window.innerWidth - rect.right,
                    dropUp
                  });
                  setActiveActionId(row.id as string);
                }
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer border flex items-center justify-center ${isActive
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm'
                }`}
              title="Opsi"
            >
              <MoreVertical size={16} />
            </button>

            {isActive && (
              <>
                <div
                  className="fixed inset-0 z-[90]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveActionId(null);
                  }}
                />
                {/* MODIFIKASI: Ubah class absolute menjadi fixed, hapus top-full dan right-0, lalu tambahkan inline style */}
                <div
                  className="fixed w-36 bg-indigo-600 rounded-xl shadow-xl shadow-indigo-600/40 border border-indigo-500 py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
                  style={{
                    top: dropdownPos.dropUp ? 'auto' : `${dropdownPos.top + 8}px`,
                    bottom: dropdownPos.dropUp ? `${window.innerHeight - dropdownPos.top + 8}px` : 'auto',
                    right: `${dropdownPos.right}px`
                  }}
                >
                  {row.hargaJual && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveActionId(null);
                        openDetailModal(row);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                    >
                      <Eye size={14} /> Detail
                    </button>
                  )}

                  {row.hargaJual && row.fileBuktiBooking && (
                    <div className="h-px bg-indigo-500/50 mx-2 my-0.5" />
                  )}

                  {row.fileBuktiBooking && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveActionId(null);
                        openModal(row);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      }
    }
  ];
  const openModal = (item?: PenjualanData) => {
    if (item) {
      let calculatedPersentaseDp = item.persentaseDp || 40;
      let calculatedCicilan = item.cicilanPerBulan || 0;
      const termin = Number(item.termin) || 3;

      if (isCashBertahap(item.caraPembayaran)) {
        const base = Number(item.hargaDasar || 0);
        const diskon = Number(item.diskonPenjualan || 0);
        const bf = Number(item.bookingFee || 5000000);
        const hargaPokok = Math.max(0, base - diskon);

        if (hargaPokok > 0 && item.dp !== undefined) {
          calculatedPersentaseDp = Math.round(((Number(item.dp) + bf) / hargaPokok) * 100 * 100) / 100;
        }

        const sisa = Math.max(0, hargaPokok - bf - Number(item.dp || 0));
        calculatedCicilan = Math.round(sisa / termin);
      }


      setFormData({
        ...item,
        rekeningTujuanId: item.rekeningTujuanId ?? '',
        termin: termin,
        persentaseDp: calculatedPersentaseDp,
        cicilanPerBulan: calculatedCicilan,
        bank: item.bank || '',
        keteranganAngsuran: item.keteranganAngsuran || '',
        plafonAcc: Number(item.plafonAcc) || 0,
      });
      setOriginalKavling({ blok: item.blok, unit: item.nomorUnit });
      setIsEditing(true);


      const existingTambahan = (item.tagihan || [])
        .filter((t: any) => t.noTagihan && t.noTagihan.includes('INV-ADD-'))
        .map((t: any) => ({
          id: t.id.toString(),
          nama: t.pembayaran,
          nominal: Number(t.nominal),
          tanggal: t.createdAt || t.updatedAt || item.tanggal
        }));
      setHistoryBiayaTambahan(existingTambahan);

      const existingTambahanKpr = Array.isArray(item.tambahanKpr) ? item.tambahanKpr : [];
      setHistoryBiayaTambahanKpr(existingTambahanKpr.map((t: any, i: number) => ({
        id: `hist-kpr-${i}`,
        nama: t.nama,
        nominal: Number(t.nominal)
      })));
      setBiayaTambahanList([]);
      setBiayaTambahanKprList([]);
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

  const openSkemaModal = (item: any, isRevisi = false) => {
    setBiayaTambahanList([]);
    const tipeKavling = item.tipe?.toLowerCase() || '';
    const autoDiskon = tipeKavling === 'aruna' ? 10000000 : 6000000;
    const diskonTerpakai = (Number(item.diskonPenjualan) > 0) ? Number(item.diskonPenjualan) : autoDiskon;

    const base = Number(item.hargaDasar || item.hargaJual) || 0;
    const bf = Number(item.bookingFee) || 5000000;
    const caraBayar = item.caraPembayaran
      ? caraPembayaranToFormValue(item.caraPembayaran)
      : 'CASH KERAS';

    const plafonAwal = Math.max(0, base - diskonTerpakai - bf);

    let initialBiayaKpr = Number(item.biayaKpr) || 0;
    let initialPlafonKredit = Number(item.plafonKredit) || 0;

    let initialDpTidakDibayar = Number(item.dpTidakDibayar) || 0;
    let initialNilaiKpr = Number(item.nilaiPengajuanKpr) || 0;
    let initialDp = Number(item.dp) || 0;
    let initialHargaJual = Number(item.hargaJual) || 0;

    if (caraBayar === 'KPR') {
      if (initialBiayaKpr === 0 || initialPlafonKredit === 0) {
        initialBiayaKpr = Math.round(plafonAwal * 0.06);
        initialPlafonKredit = plafonAwal + initialBiayaKpr;

        const hargaJualSetelahDiskon = initialPlafonKredit / 0.9;
        initialHargaJual = hargaJualSetelahDiskon + diskonTerpakai;

        const dpKotorAwal = hargaJualSetelahDiskon * 0.1;
        initialDpTidakDibayar = dpKotorAwal - bf;

        initialNilaiKpr = initialPlafonKredit;
        initialDp = initialDpTidakDibayar;
      }
    } else if (caraBayar === 'CASH BERTAHAP') {
      initialHargaJual = Math.max(0, base - diskonTerpakai);
      if (initialDp === 0) {
        initialDp = Math.round(Math.max(0, ((base - diskonTerpakai) * 0.4) - bf));
      }
    } else {
      initialHargaJual = Math.max(0, base - diskonTerpakai);
      initialDp = 0;
    }

    setSelectedPenjualan(item);

    setFormData({
      ...item,
      hargaDasar: base,
      bookingFee: bf,
      caraPembayaran: caraBayar,
      biayaKpr: initialBiayaKpr,
      plafonKredit: initialPlafonKredit,
      plafonAcc: Number(item.plafonAcc) || 0,
      dpTidakDibayar: initialDpTidakDibayar,
      nilaiPengajuanKpr: initialNilaiKpr,
      dp: initialDp,
      diskonPenjualan: diskonTerpakai,
      plafonAwal: plafonAwal,
      hargaJual: initialHargaJual,
      keteranganAngsuran: item.keteranganAngsuran || '',
    });

    setErrors({});

    const existingTambahan = (item.tagihan || [])
      .filter((t: any) => t.noTagihan && t.noTagihan.includes('INV-ADD-'))
      .map((t: any) => ({
        id: t.id.toString(),
        nama: t.pembayaran,
        nominal: Number(t.nominal),
        tanggal: t.createdAt || t.updatedAt || item.tanggal
      }));

    setHistoryBiayaTambahan(existingTambahan);
    const existingTambahanKpr = Array.isArray(item.tambahanKpr) ? item.tambahanKpr : [];
    setHistoryBiayaTambahanKpr(existingTambahanKpr.map((t: any, i: number) => ({
      id: `hist-kpr-${i}`,
      nama: t.nama,
      nominal: Number(t.nominal)
    })));
    setIsRevisiSpr(isRevisi);
    setKeteranganRevisi('');
    setIsSkemaModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setIsEditing(false);
    setIsNewAgent(false);
    setErrors({});
  };

  const updateKprWithBiayaTambahan = (newList: BiayaTambahan[]) => {
    if (formData.caraPembayaran === 'KPR') {
      setFormData(prev => {
        const updates = handleRecalculateDependencies('biayaTambahan', null, prev, newList, biayaTambahanKprList);
        return { ...prev, ...updates };
      });
    }
  };
  const handleAddBiayaTambahan = () => {
    const newList = [
      ...biayaTambahanList,
      { id: Date.now().toString(), nama: 'Uang Muka', nominal: 0 }
    ];
    setBiayaTambahanList(newList);
    updateKprWithBiayaTambahan(newList);
  };

  const handleRemoveBiayaTambahan = (id: string) => {
    const newList = biayaTambahanList.filter(b => b.id !== id);
    setBiayaTambahanList(newList);
    updateKprWithBiayaTambahan(newList);
  };

  const handleChangeBiayaTambahanNama = (id: string, nama: string) => {
    setBiayaTambahanList(biayaTambahanList.map(b => b.id === id ? { ...b, nama } : b));
  };

  const handleChangeBiayaTambahanNominal = (id: string, nominal: number) => {
    const newList = biayaTambahanList.map(b => b.id === id ? { ...b, nominal } : b);
    setBiayaTambahanList(newList);
    updateKprWithBiayaTambahan(newList);
  };
  const updateKprCalculations = (newListMinus: BiayaTambahan[], newListPlus: BiayaTambahan[]) => {
    if (formData.caraPembayaran === 'KPR') {
      setFormData(prev => {
        const updates = handleRecalculateDependencies('biayaTambahan', null, prev, newListMinus, newListPlus);
        return { ...prev, ...updates };
      });
    }
  };

  const handleAddBiayaTambahanKpr = () => {
    const newList = [...biayaTambahanKprList, { id: Date.now().toString(), nama: 'Kanopi / Furnish', nominal: 0 }];
    setBiayaTambahanKprList(newList);
    updateKprCalculations(biayaTambahanList, newList);
  };
  const handleRemoveBiayaTambahanKpr = (id: string) => {
    const newList = biayaTambahanKprList.filter(b => b.id !== id);
    setBiayaTambahanKprList(newList);
    updateKprCalculations(biayaTambahanList, newList);
  };
  const handleChangeBiayaTambahanKprNama = (id: string, nama: string) => {
    setBiayaTambahanKprList(biayaTambahanKprList.map(b => b.id === id ? { ...b, nama } : b));
  };
  const handleChangeBiayaTambahanKprNominal = (id: string, nominal: number) => {
    const newList = biayaTambahanKprList.map(b => b.id === id ? { ...b, nominal } : b);
    setBiayaTambahanKprList(newList);
    updateKprCalculations(biayaTambahanList, newList);
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
    const finalValue = type === 'number' ? (value === '' ? 0 : Math.round(Number(value))) : value;

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
    const roundedValue = Math.round(value);

    setFormData((prev) => {
      const updates = handleRecalculateDependencies(name, roundedValue, prev);
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

    if (!formData.nama?.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.noIdentitas?.trim() || formData.noIdentitas.trim().length < 16) newErrors.noIdentitas = 'NIK minimal 16 digit';
    if (!formData.perumahan?.trim()) newErrors.perumahan = 'Perumahan wajib diisi';
    if (!formData.blok?.trim()) newErrors.blok = 'Blok wajib diisi';
    if (!formData.nomorUnit?.trim()) newErrors.nomorUnit = 'Nomor Unit wajib diisi';
    if (!formData.agent?.trim()) newErrors.agent = 'Agent wajib dipilih/diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSkemaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.caraPembayaran) newErrors.caraPembayaran = 'Cara pembayaran wajib dipilih';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      let finalKeterangan = isRevisiSpr ? keteranganRevisi : '';
      if (biayaTambahanKprList.length > 0) {
        const textKpr = biayaTambahanKprList.map(b => `${b.nama}: ${formatRupiah(b.nominal)}`).join(', ');
        finalKeterangan += ` [Penambahan Nilai KPR: ${textKpr}]`;
      }
      const updatePayload: any = {
        caraPembayaran: formData.caraPembayaran,
        bank: formData.bank || undefined,
        hargaDasar: formData.hargaDasar,
        hargaJual: formData.hargaJual,
        plafonAwal: formData.caraPembayaran === 'KPR' ? formData.plafonAwal : undefined,
        plafonAcc: formData.caraPembayaran === 'KPR' ? formData.plafonAcc : undefined,
        biayaKpr: formData.caraPembayaran === 'KPR' ? formData.biayaKpr : undefined,
        plafonKredit: formData.caraPembayaran === 'KPR' ? formData.plafonKredit : undefined,
        dpTidakDibayar: formData.caraPembayaran === 'KPR' ? formData.dpTidakDibayar : undefined,
        dpDibayar: formData.caraPembayaran === 'KPR' ? formData.dpDibayar : undefined,
        nilaiPengajuanKpr: formData.caraPembayaran === 'KPR' ? formData.nilaiPengajuanKpr : undefined,
        dp: (isKpr(formData.caraPembayaran) || isCashBertahap(formData.caraPembayaran))
          ? formData.dp
          : undefined,
        termin: isCashBertahap(formData.caraPembayaran) ? Number(formData.termin) : undefined,
        diskonPenjualan: formData.diskonPenjualan,
        bookingFee: formData.bookingFee,
        keteranganUpdateSpr: finalKeterangan.trim() || undefined,
        keteranganAngsuran: isCashBertahap(formData.caraPembayaran) ? formData.keteranganAngsuran : undefined,

        biayaTambahan: biayaTambahanList
          .map((b) => ({
            nama: b.nama,
            nominal: Number(b.nominal)
          }))
          .filter((b) => b.nama.trim() !== '' && b.nominal > 0),
        biayaTambahanKpr: [
          ...historyBiayaTambahanKpr.map(h => ({ nama: h.nama, nominal: Number(h.nominal) })),
          ...biayaTambahanKprList.map((b) => ({ nama: b.nama, nominal: Number(b.nominal) }))
        ].filter((b) => b.nama.trim() !== '' && b.nominal > 0),
      };

      await updateMutation.mutateAsync({ id: selectedPenjualan!.id!, data: updatePayload });
      setIsSkemaModalOpen(false);
      setFormData(initialFormState);
      setSelectedPenjualan(null);
      setBiayaTambahanList([]);
      setBiayaTambahanKprList([]);
      alert("Skema pembayaran berhasil disimpan dan dokumen SPR siap dicetak!");
    } catch (error: any) {
      const { message, errors: backendErrors } = handleApiError(error);
      if (backendErrors && Array.isArray(backendErrors)) {
        const fieldErrors: Record<string, string> = {};
        backendErrors.forEach((err: { field: string; message: string }) => {
          fieldErrors[err.field] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        alert(message);
      }
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {

      alert("Gagal menyimpan: Periksa kembali kolom yang bertanda merah (Contoh: NIK minimal 16 digit, Nama, Agent wajib diisi).");
      return;
    }

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


          caraPembayaran: formData.caraPembayaran || undefined,
          hargaDasar: formData.hargaDasar,
          hargaJual: formData.hargaJual,
          plafonAwal: formData.caraPembayaran === 'KPR' ? formData.plafonAwal : undefined,
          plafonAcc: formData.caraPembayaran === 'KPR' ? formData.plafonAcc : undefined,
          biayaKpr: formData.caraPembayaran === 'KPR' ? formData.biayaKpr : undefined,
          plafonKredit: formData.caraPembayaran === 'KPR' ? formData.plafonKredit : undefined,
          dpTidakDibayar: formData.caraPembayaran === 'KPR' ? formData.dpTidakDibayar : undefined,
          dpDibayar: formData.caraPembayaran === 'KPR' ? formData.dpDibayar : undefined,
          nilaiPengajuanKpr: formData.caraPembayaran === 'KPR' ? formData.nilaiPengajuanKpr : undefined,
          dp: (isKpr(formData.caraPembayaran) || isCashBertahap(formData.caraPembayaran)) ? formData.dp : undefined,
          termin: isCashBertahap(formData.caraPembayaran) ? Number(formData.termin) : undefined,
          diskonPenjualan: formData.diskonPenjualan,
          bookingFee: formData.bookingFee,
          keteranganAngsuran: isCashBertahap(formData.caraPembayaran) ? formData.keteranganAngsuran : undefined,
          biayaTambahan: biayaTambahanList.map((b) => ({ nama: b.nama, nominal: Number(b.nominal) })).filter((b) => b.nama.trim() !== '' && b.nominal > 0),
          biayaTambahanKpr: [
            ...historyBiayaTambahanKpr.map(h => ({ nama: h.nama, nominal: Number(h.nominal) })),
            ...biayaTambahanKprList.map((b) => ({ nama: b.nama, nominal: Number(b.nominal) }))
          ].filter((b) => b.nama.trim() !== '' && b.nominal > 0),
        };

        await updateMutation.mutateAsync({ id: formData.id, data: updatePayload });
        closeModal();
        setKeteranganRevisi('');
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

        alert("Gagal menyimpan: Ada data yang tidak valid. Silakan periksa pesan error merah pada form.");
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
      setErrors({});
      setCancelData({ id: '', alasanBatal: '' });
      alert("Pengajuan pembatalan berhasil dikirim ke Admin.");
    } catch (error: any) {
      // ✅ KODE YANG DIUBAH
      const { message, errors: backendErrors } = handleApiError(error);
      if (backendErrors && Array.isArray(backendErrors)) {
        const fieldErrors: Record<string, string> = {};
        backendErrors.forEach((err: { field: string; message: string }) => {
          fieldErrors[err.field] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        alert(message);
      }
    }
  };

  const handleUploadBukti = async (id: string, type: "booking" | "dp", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadBuktiMutation.mutateAsync({ id, type, file });
      alert(`Bukti ${type === "booking" ? "Booking" : "DP"} berhasil diunggah! SPR akan otomatis di-generate (jika booking).`);
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    } finally {
      e.target.value = '';
    }
  };
  // const handleQuickGenerateSPR = async (id: string) => {
  //   if (!window.confirm("Apakah Anda yakin ingin men-generate dokumen SPR dengan data saat ini?")) return;

  //   try {
  //     await regenerateSprMutation.mutateAsync(id);
  //     alert("Dokumen SPR berhasil di-generate!");
  //   } catch (error: any) {
  //     const { message } = handleApiError(error);
  //     alert(message);
  //   }
  // };
  const expandedRowRender = (row: PenjualanData) => {
    if (row.status === 'BATAL') {
      return (
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-800">Manajemen Dokumen Penjualan & Tagihan Awal</h4>
            <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 shadow-sm">
              Status: BATAL
            </span>
          </div>
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-start gap-3">
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
      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
          <h4 className="text-sm font-bold text-slate-800">Manajemen Dokumen Penjualan & Tagihan Awal</h4>
          {row.isPendingBatal ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
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
                  className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                >
                  <Ban size={12} /> Ajukan Pembatalan
                </button>
              )}
              <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm border ${row.status === 'BATAL' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                Status: {row.status}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
            <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Booking Fee & SPR</h5>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setPrintType('invoice');
                  setPrintTitle('Booking Fee');
                  setPrintData({ ...row, nominalCetak: row.bookingFee, pembuat: row.createdBy || 'Admin' });
                }}
                className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
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
                    className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shadow-md shadow-slate-900/10"
                  >
                    <Receipt size={14} /> Kwitansi
                  </button>
                  {row.fileSpr ? (
                    <>
                      <a
                        href={row.fileSpr}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer shadow-sm"
                      >
                        <FileText size={14} /> Lihat SPR
                      </a>

                      {row.caraPembayaran === 'KPR' && (
                        <>
                          <button
                            onClick={() => {
                              setBankData({
                                id: row.id!,
                                bank: row.bank || '',
                                bankKprNamaRekening: row.bankKprNamaRekening || '',
                                bankKprAtasNamaRekening: row.bankKprAtasNamaRekening || '',
                                bankKprNoRekening: row.bankKprNoRekening || '',
                              });
                              setIsBankModalOpen(true);
                            }}
                            className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer shadow-sm"
                          >
                            <Building2 size={14} /> {row.bank ? 'Edit Bank' : 'Isi Bank KPR'}
                          </button>
                          <button
                            onClick={() => openSkemaModal(row, true)}
                            className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold rounded-xl hover:bg-orange-500 hover:text-white transition-colors cursor-pointer shadow-sm"
                          >
                            <PenTool size={14} /> Tambah Biaya
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-2 flex-1 w-full">
                      <button
                        onClick={() => openSkemaModal(row)}
                        className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                      >
                        Buat SPR
                      </button>

                      {/* <button
                        onClick={() => handleQuickGenerateSPR(row.id!)}
                        disabled={updateMutation.isPending}
                        className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-black transition-all cursor-pointer shadow-md disabled:opacity-50"
                      >
                        Generate Cepat
                      </button> */}
                    </div>
                  )}
                </>
              ) : (
                <label className={`flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 ${uploadBuktiMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <UploadCloud size={14} /> {uploadBuktiMutation.isPending ? "Mengunggah..." : "Upload Bukti Booking"}
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleUploadBukti(row.id!, 'booking', e)} disabled={uploadBuktiMutation.isPending} />
                </label>
              )}
            </div>

            {row.fileBuktiBooking && (
              <div className="mt-4 border-t border-slate-200 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bukti Transfer Booking Fee</p>

                  <label className={`text-[10px] font-bold text-blue-600 cursor-pointer hover:underline flex items-center gap-1 ${uploadBuktiMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploadBuktiMutation.isPending ? 'Mengunggah...' : 'Ganti Bukti'}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleUploadBukti(row.id!, 'booking', e)}
                      disabled={uploadBuktiMutation.isPending}
                    />
                  </label>
                </div>

                <div
                  onClick={() => setPreviewImage(row.fileBuktiBooking as string)}
                  className="relative w-24 h-16 rounded-xl border border-slate-200 overflow-hidden cursor-zoom-in group shadow-sm bg-slate-100 ring-1 ring-slate-900/5 flex justify-center items-center"
                  title="Klik untuk perbesar"
                >
                  {row.fileBuktiBooking.split('?')[0].toLowerCase().endsWith('.pdf') || row.fileBuktiBooking.includes('application/pdf') ? (
                    <div className="text-red-500"><FileText size={24} /></div>
                  ) : (
                    <img
                      src={`${row.fileBuktiBooking}?t=${new Date(row.updatedAt!).getTime()}`}
                      alt="Bukti Booking"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ZoomIn size={14} className="text-white" />
                  </div>
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
    <div className="space-y-2 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
        <div
          className="p-3 border-b border-slate-100 flex justify-between items-center cursor-pointer bg-white hover:bg-slate-50/50 transition-colors"
          onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg ring-1 ring-indigo-100">
              <PieChart size={18} strokeWidth={2.5} />
            </div>
            <h3 className="font-bold text-slate-900 tracking-tight">Ringkasan Penjualan</h3>
          </div>
          <button className="text-slate-400 hover:text-indigo-600 transition-colors">
            {isSummaryExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {isSummaryExpanded && (
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50">
            <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-400 group-hover:bg-slate-600 transition-colors"></div>
              <div className="flex items-center gap-3 mb-3 pl-2">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"><Wallet size={16} className="text-slate-600" /></div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Transaksi</p>
              </div>
              <p className="text-3xl font-black text-slate-900 pl-2 tabular-nums">{meta?.totalItems || 0}</p>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 group-hover:bg-blue-600 transition-colors"></div>
              <div className="flex items-center gap-3 mb-3 pl-2">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center"><Clock size={16} className="text-blue-600" /></div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Booked / Proses</p>
              </div>
              <p className="text-3xl font-black text-blue-700 pl-2 tabular-nums">{(summary['BOOKED'] || 0) + (summary['PROSES'] || 0)}</p>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400 group-hover:bg-emerald-600 transition-colors"></div>
              <div className="flex items-center gap-3 mb-3 pl-2">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle2 size={16} className="text-emerald-600" /></div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lunas</p>
              </div>
              <p className="text-3xl font-black text-emerald-700 pl-2 tabular-nums">{summary['LUNAS'] || 0}</p>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-400 group-hover:bg-red-600 transition-colors"></div>
              <div className="flex items-center gap-3 mb-3 pl-2">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center"><Ban size={16} className="text-red-600" /></div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Batal</p>
              </div>
              <p className="text-3xl font-black text-red-700 pl-2 tabular-nums">{summary['BATAL'] || 0}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
        <div
          className="p-4 border-b border-slate-100 flex justify-between items-center cursor-pointer bg-white hover:bg-slate-50/50 transition-colors"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg ring-1 ring-slate-200">
              <Filter size={18} strokeWidth={2.5} />
            </div>
            <h3 className="font-bold text-slate-900 tracking-tight">Filter & Urutkan</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            {isFilterExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {isFilterExpanded && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 bg-slate-50/50">
            <div className="relative group">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block group-focus-within:text-indigo-600 transition-colors">Status Transaksi</label>
              <select
                className="w-full px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none transition-all shadow-sm cursor-pointer"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="">Semua Status</option>
                <option value="BOOKED">Booked</option>
                <option value="PROSES">Proses (Sudah BF)</option>
                <option value="LUNAS">Lunas</option>
                <option value="BATAL">Batal</option>
              </select>
              <div className="absolute right-3 top-[34px] pointer-events-none text-slate-400 group-focus-within:text-indigo-500"><ChevronDown size={16} /></div>
            </div>

            <div className="relative group">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block group-focus-within:text-indigo-600 transition-colors">Urutkan Berdasarkan</label>
              <select
                className="w-full px-4 pl-10 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none transition-all shadow-sm cursor-pointer"
                value={orderBy}
                onChange={handleSortChange}
              >
                <option value="">Terbaru (Default)</option>
                <option value="hargaJual:asc">Harga Jual: Rendah ke Tinggi</option>
                <option value="hargaJual:desc">Harga Jual: Tinggi ke Rendah</option>
                <option value="nama:asc">Nama Customer: A - Z</option>
              </select>
              <ArrowUpDown size={16} className="absolute left-3.5 top-[34px] pointer-events-none text-slate-400 group-focus-within:text-indigo-500" />
              <div className="absolute right-3 top-[34px] pointer-events-none text-slate-400 group-focus-within:text-indigo-500"><ChevronDown size={16} /></div>
            </div>
          </div>
        )}
      </div>
      {/* <div className="flex justify-end mt-4 mb-2">
        <button
          onClick={handleBulkGenerateSPR}
          disabled={isGeneratingBulk}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
        >
          <FileText size={16} />
          {isGeneratingBulk ? "Memproses Generate Massal... Mohon Tunggu" : "Generate Cepat Semua SPR"}
        </button>
      </div> */}
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

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit Data Penjualan" : "Tambah Penjualan Baru"}>
        <form onSubmit={handleSubmit} className="space-y-2">

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm ring-1 ring-indigo-100">1</div>
              <h4 className="text-base font-bold text-slate-900">Data Pembeli & Marketing</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
              <div className="md:col-span-2 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/60 mb-2">
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
                      className="absolute right-2 top-0 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
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

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm ring-1 ring-indigo-100">2</div>
              <h4 className="text-base font-bold text-slate-900">Data Kavling</h4>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
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

              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
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
          </div>
          {isEditing && (
            <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100 mt-4">
              <h4 className="text-base font-bold text-slate-900 mb-4 border-b border-indigo-100 pb-2">2. Metode & Kalkulasi Pembayaran</h4>
              <div className="pt-2">
                <Select
                  label="Metode Pembayaran Utama"
                  name="caraPembayaran"
                  value={formData.caraPembayaran || ''}
                  onChange={handleChange}
                  options={[
                    { value: '', label: '-- Pilih Metode --' },
                    { value: 'CASH KERAS', label: 'CASH KERAS' },
                    { value: 'CASH BERTAHAP', label: 'CASH BERTAHAP' },
                    { value: 'KPR', label: 'KPR' }
                  ]}
                  error={errors.caraPembayaran}
                />
              </div>

              {formData.caraPembayaran && (
                <div className="mt-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3">Rangkuman Kalkulasi</h4>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-600 w-full">Harga Dasar</span>
                      <div className="w-40 sm:w-44 shrink-0">
                        <CurrencyInput
                          name="hargaDasar"
                          value={formData.hargaDasar || 0}
                          onValueChange={handleCurrencyChange}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-red-500 w-full">- Diskon Penjualan</span>
                      <div className="w-40 sm:w-44 shrink-0">
                        <CurrencyInput
                          name="diskonPenjualan"
                          value={formData.diskonPenjualan}
                          onValueChange={handleCurrencyChange}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-sm font-bold text-orange-500">- Booking Fee</span>
                        <button
                          type="button"
                          className="w-7 h-7 flex items-center justify-center bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-black/50 transition-colors rounded-lg font-bold shadow-sm cursor-pointer"
                          onClick={handleAddBiayaTambahan}
                          title="Tambah Biaya Lainnya"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="w-40 sm:w-44 shrink-0">
                        <CurrencyInput
                          name="bookingFee"
                          value={formData.bookingFee}
                          onValueChange={handleCurrencyChange}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {biayaTambahanList.map((biaya) => (
                      <div key={biaya.id} className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2 w-full pr-4">
                          <input
                            type="text"
                            value={biaya.nama}
                            onChange={(e) => handleChangeBiayaTambahanNama(biaya.id, e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 w-full max-w-[100px] sm:max-w-[110px] shadow-sm transition-all"
                            placeholder="Nama Biaya"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBiayaTambahan(biaya.id)}
                            className="w-7 h-7 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 transition-colors rounded-lg font-bold cursor-pointer shrink-0"
                          >
                            -
                          </button>
                        </div>

                        <div className="w-40 sm:w-44 shrink-0">
                          <CurrencyInput
                            name={`biaya_${biaya.id}`}
                            value={biaya.nominal}
                            onValueChange={(_, val) => handleChangeBiayaTambahanNominal(biaya.id, val)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}

                    {historyBiayaTambahan.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200 border-dashed">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Riwayat Biaya Tambahan (Tersimpan)</p>
                        {historyBiayaTambahan.map((biaya) => (
                          <div key={biaya.id} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl mb-1 border border-slate-100">
                            <div>
                              <p className="text-sm font-bold text-slate-700">{biaya.nama}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <Clock size={10} /> {formatDate(biaya.tanggal)}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-slate-600 tabular-nums">{formatRupiah(biaya.nominal)}</span>
                          </div>
                        ))}
                      </div>
                    )}



                    {(formData.caraPembayaran === 'KPR') && (
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mt-4 space-y-2">
                        <h5 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-200 pb-2">Kalkulasi KPR</h5>

                        <div className="flex items-center justify-between">
                          <div className="w-full">
                            <span className="text-sm font-medium text-slate-600">Plafon <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded ml-1">Dasar - Diskon - BF</span></span>
                          </div>
                          <div className="w-40 sm:w-44 shrink-0">
                            <CurrencyInput
                              name="plafonAwal"
                              value={formData.plafonAwal || 0}
                              onValueChange={handleCurrencyChange}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="w-full flex flex-col sm:flex-row sm:items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-600">+ Biaya KPR</span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-md font-mono w-max shadow-sm">
                              Default (6%): Rp {formatTanpaDesimal((formData.plafonAwal || 0) * 0.06)}
                            </span>
                          </div>
                          <div className="w-40 sm:w-44 shrink-0">
                            <CurrencyInput
                              name="biayaKpr"
                              value={formData.biayaKpr || 0}
                              onValueChange={handleCurrencyChange}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-indigo-700 w-full">Plafon Kredit</span>
                            <div className="w-40 sm:w-44 shrink-0">
                              <CurrencyInput
                                name="plafonKredit"
                                value={formData.plafonKredit || 0}
                                onValueChange={handleCurrencyChange}
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200">

                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 w-full">
                              <span className="text-sm font-bold text-blue-500">+ Tambah Nilai KPR (Furnish/dll)</span>
                              <button
                                type="button"
                                className="w-7 h-7 flex items-center justify-center bg-blue-50 border border-blue-200 hover:border-blue-400 hover:text-blue-600 text-blue-500 transition-colors rounded-lg font-bold shadow-sm cursor-pointer"
                                onClick={handleAddBiayaTambahanKpr}
                                title="Tambah Nilai Pengajuan KPR"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>

                          {biayaTambahanKprList.map((biaya) => (
                            <div key={biaya.id} className="flex items-center justify-between mt-1 mb-2">
                              <div className="flex items-center gap-2 w-full pr-4">
                                <input
                                  type="text"
                                  value={biaya.nama}
                                  onChange={(e) => handleChangeBiayaTambahanKprNama(biaya.id, e.target.value)}
                                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 w-full max-w-[130px] sm:max-w-[160px] shadow-sm transition-all"
                                  placeholder="Kanopi / Furnish"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBiayaTambahanKpr(biaya.id)}
                                  className="w-7 h-7 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 transition-colors rounded-lg font-bold cursor-pointer shrink-0"
                                >
                                  -
                                </button>
                              </div>
                              <div className="w-40 sm:w-44 shrink-0">
                                <CurrencyInput
                                  name={`biayakpr_${biaya.id}`}
                                  value={biaya.nominal}
                                  onValueChange={(_, val) => handleChangeBiayaTambahanKprNominal(biaya.id, val)}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          ))}
                          {historyBiayaTambahanKpr.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-200 border-dashed">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Riwayat Tambahan KPR (Tersimpan)</p>
                              {historyBiayaTambahanKpr.map((biaya) => (
                                <div key={biaya.id} className="flex justify-between items-center py-2 px-3 bg-blue-50/50 rounded-xl mb-1 border border-blue-100">
                                  <p className="text-sm font-bold text-slate-700">{biaya.nama}</p>
                                  <span className="text-sm font-bold text-blue-600 tabular-nums">{formatRupiah(biaya.nominal)}</span>
                                </div>
                              ))}
                            </div>
                          )}



                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm font-bold text-blue-700 w-full">Total Nilai Pengajuan KPR</span>
                            <div className="w-40 sm:w-44 shrink-0">
                              <CurrencyInput
                                name="nilaiPengajuanKpr"
                                value={formData.nilaiPengajuanKpr || 0}
                                onValueChange={handleCurrencyChange}
                                placeholder="0"
                              />
                            </div>
                          </div>

                        </div>

                        <div className="pt-3 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-indigo-700 w-full">Plafon ACC Bank</span>
                            <div className="w-40 sm:w-44 shrink-0">
                              <CurrencyInput
                                name="plafonAcc"
                                value={formData.plafonAcc || 0}
                                onValueChange={handleCurrencyChange}
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-blue-600 w-full">DP Dibayar (Opsional)</span>
                            <div className="w-40 sm:w-44 shrink-0">
                              <CurrencyInput
                                name="dpDibayar"
                                value={formData.dpDibayar || 0}
                                onValueChange={handleCurrencyChange}
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">
                            <strong className="text-slate-400">Info:</strong> Jika diisi, SPR dan Kwitansi akan mencetak nilai DP Dibayar ini.
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-amber-600 w-full">DP Tidak Dibayar 10%</span>
                            <div className="w-40 sm:w-44 shrink-0">
                              <CurrencyInput
                                name="dpTidakDibayar"
                                value={formData.dpTidakDibayar || 0}
                                onValueChange={handleCurrencyChange}
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(isCashBertahap(formData.caraPembayaran)) && (
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mt-4 space-y-2">
                        <h5 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-200 pb-2">Kalkulasi Cash Bertahap</h5>

                        <div className="flex items-center justify-between">
                          <div className="w-full flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-600">DP</span>
                            <div className="relative w-20 group">
                              <input
                                type="text"
                                inputMode="numeric"
                                name="persentaseDp"
                                value={formData.persentaseDp === 0 ? '' : formData.persentaseDp}
                                onChange={(e) => {
                                  const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                  handleCurrencyChange('persentaseDp', rawValue ? Number(rawValue) : 0);
                                }}
                                className="w-full pl-3 pr-8 py-2 text-sm font-black text-indigo-700 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                            </div>
                          </div>
                          <div className="w-40 sm:w-44 shrink-0">
                            <CurrencyInput
                              name="dp"
                              value={formData.dp || 0}
                              onValueChange={handleCurrencyChange}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-orange-600 w-full">Sisa Pembayaran</span>
                            <div className="w-40 sm:w-44 relative shrink-0">
                              <div className="absolute inset-y-0 left-0 pl-[14px] flex items-center pointer-events-none">
                                <span className="text-sm font-bold text-orange-600">Rp</span>
                              </div>
                              <div className="w-full pl-[40px] pr-3 py-1 text-left">
                                <span className="text-base font-black text-orange-600 tabular-nums">
                                  {formatTanpaDesimal(
                                    Math.max(0, (formData.hargaDasar || 0) - (formData.diskonPenjualan || 0) - (formData.dp || 0) - (formData.bookingFee || 0))
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono text-right mb-4">
                            <strong className="text-slate-400">Kalkulasi:</strong> Harga Dasar - Diskon - DP - Booking Fee
                          </p>

                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-slate-600 w-full">Termin Pembayaran</span>
                            <div className="w-40 sm:w-44 shrink-0 relative group">
                              <input
                                type="text"
                                inputMode="numeric"
                                name="termin"
                                value={formData.termin || ''}
                                onChange={(e) => {
                                  const rawValue = e.target.value.replace(/[^0-9]/g, '');

                                  if (rawValue === '') {
                                    handleCurrencyChange('termin', 0);
                                    return;
                                  }

                                  let val = Number(rawValue);
                                  if (val > 12) val = 12;
                                  handleCurrencyChange('termin', val);
                                }}
                                className="w-full pl-3 pr-14 py-2 text-sm font-black text-indigo-700 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm text-right"
                                placeholder="1-12"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Bulan</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                            <div className="w-full">
                              <span className="text-sm font-bold text-indigo-700 block">Cicilan Per Bulan</span>
                              <span className="text-[10px] font-medium text-indigo-500 mt-1 block">
                                Estimasi: {(() => {
                                  const termin = formData.termin || 3;
                                  const start = new Date();
                                  start.setMonth(start.getMonth() + 1);
                                  const end = new Date(start);
                                  end.setMonth(end.getMonth() + termin - 1);
                                  const formatOpt: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
                                  return `${start.toLocaleDateString('id-ID', formatOpt)} - ${end.toLocaleDateString('id-ID', formatOpt)}`;
                                })()}
                              </span>
                            </div>
                            <div className="w-40 sm:w-44 shrink-0">
                              <CurrencyInput
                                name="cicilanPerBulan"
                                value={formData.cicilanPerBulan || 0}
                                onValueChange={handleCurrencyChange}
                                placeholder="0"
                              />
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl mt-8 shadow-lg shadow-emerald-500/20 text-white">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-100">
                        Harga Jual
                      </span>
                      {formData.caraPembayaran === 'KPR' && (
                        <span className="text-[10px] text-emerald-100/80 font-medium mt-1">
                          Default: (Plafon Kredit / 0.9) + Diskon
                        </span>
                      )}
                    </div>

                    <div className="w-full md:w-64">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="font-bold text-slate-500">Rp</span>
                        </div>
                        <input
                          type="text"
                          name="hargaJual"
                          value={formData.hargaJual ? formatTanpaDesimal(formData.hargaJual) : ''}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/[^0-9]/g, '');
                            handleCurrencyChange('hargaJual', rawValue ? Number(rawValue) : 0);
                          }}
                          autoComplete="off"
                          className="w-full pl-11 pr-4 py-2.5 text-lg font-black tabular-nums rounded-xl border-0 bg-white text-slate-900 shadow-inner outline-none focus:ring-4 focus:ring-emerald-300/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {isCashBertahap(formData.caraPembayaran) && (
                    <Input
                      name="keteranganAngsuran"
                      value={formData.keteranganAngsuran || ''}
                      onChange={handleChange}
                      placeholder="Keterangan Angsuran (Opsional)..."
                    />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-50/80 backdrop-blur-md p-4 rounded-b-2xl border-t border-slate-200 -mx-4 -mb-4 mt-4 z-20">
            <button type="button" onClick={closeModal} className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors shadow-sm cursor-pointer">
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Memproses...' : isEditing ? 'Simpan Perubahan' : 'Booking Unit'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isSkemaModalOpen} onClose={() => { setIsSkemaModalOpen(false); setSelectedPenjualan(null); }} title="Buat Surat Pesanan Rumah (SPR)">
        {selectedPenjualan && (
          <form onSubmit={handleSkemaSubmit} className="space-y-2">

            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Building2 size={80} /></div>
              <h4 className="text-[11px] font-bold text-indigo-800 uppercase tracking-widest mb-4 border-b border-indigo-200/50 pb-3">Informasi Pembeli & Kavling</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-2 relative z-10">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Customer</p>
                  <p className="text-base font-black text-slate-900">{selectedPenjualan.nama}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1 tabular-nums">NIK: {selectedPenjualan.noIdentitas}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Detail Unit</p>
                  <p className="text-sm font-bold text-slate-900">{selectedPenjualan.perumahan} - Blok {selectedPenjualan.blok}-{selectedPenjualan.nomorUnit}</p>
                  <p className="text-xs text-slate-600 font-medium mt-1">Tipe {selectedPenjualan.tipe} (LB: {selectedPenjualan.luasBangunan} / LT: {selectedPenjualan.luasTanah})</p>
                  <div className="mt-3 inline-block px-3 py-1.5 bg-indigo-600 text-white text-sm font-black rounded-lg tabular-nums shadow-sm">
                    {formatRupiah(selectedPenjualan.hargaDasar || 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Select
                label="Metode Pembayaran Utama"
                name="caraPembayaran"
                value={formData.caraPembayaran}
                onChange={handleChange}
                options={[
                  { value: '', label: '-- Pilih Metode --' },
                  { value: 'CASH KERAS', label: 'CASH KERAS' },
                  { value: 'CASH BERTAHAP', label: 'CASH BERTAHAP' },
                  { value: 'KPR', label: 'KPR' }
                ]}
                error={errors.caraPembayaran}
              />
            </div>

            <div className="mt-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5 space-y-5">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3">Rangkuman Kalkulasi</h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600 w-full">Harga Dasar</span>
                  <div className="w-40 sm:w-44 shrink-0">
                    <CurrencyInput
                      name="hargaDasar"
                      value={formData.hargaDasar || 0}
                      onValueChange={handleCurrencyChange}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-red-500 w-full">- Diskon Penjualan</span>
                  <div className="w-40 sm:w-44 shrink-0">
                    <CurrencyInput
                      name="diskonPenjualan"
                      value={formData.diskonPenjualan}
                      onValueChange={handleCurrencyChange}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-sm font-bold text-orange-500">- Booking Fee</span>
                    <button
                      type="button"
                      className="w-7 h-7 flex items-center justify-center bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-black/50 transition-colors rounded-lg font-bold shadow-sm cursor-pointer"
                      onClick={handleAddBiayaTambahan}
                      title="Tambah Biaya Lainnya"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="w-40 sm:w-44 shrink-0">
                    <CurrencyInput
                      name="bookingFee"
                      value={formData.bookingFee}
                      onValueChange={handleCurrencyChange}
                      placeholder="0"
                    />
                  </div>
                </div>
                {biayaTambahanList.map((biaya) => (
                  <div key={biaya.id} className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 w-full pr-4">
                      <input
                        type="text"
                        value={biaya.nama}
                        onChange={(e) => handleChangeBiayaTambahanNama(biaya.id, e.target.value)}


                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 w-full max-w-[100px] sm:max-w-[110px] shadow-sm transition-all"
                        placeholder="Nama Biaya"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBiayaTambahan(biaya.id)}
                        className="w-7 h-7 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 transition-colors rounded-lg font-bold cursor-pointer shrink-0"
                      >
                        -
                      </button>
                    </div>

                    <div className="w-40 sm:w-44 shrink-0">
                      <CurrencyInput
                        name={`biaya_${biaya.id}`}
                        value={biaya.nominal}
                        onValueChange={(_, val) => handleChangeBiayaTambahanNominal(biaya.id, val)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}

                {historyBiayaTambahan.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200 border-dashed">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Riwayat Biaya Tambahan (Tersimpan)</p>
                    {historyBiayaTambahan.map((biaya) => (
                      <div key={biaya.id} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl mb-1 border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-700">{biaya.nama}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock size={10} /> {formatDate(biaya.tanggal)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-slate-600 tabular-nums">{formatRupiah(biaya.nominal)}</span>
                      </div>
                    ))}
                  </div>
                )}



                {(formData.caraPembayaran === 'KPR') && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mt-4 space-y-2">
                    <h5 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-200 pb-2">Kalkulasi KPR</h5>

                    <div className="flex items-center justify-between">
                      <div className="w-full">
                        <span className="text-sm font-medium text-slate-600">Plafon <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded ml-1">Dasar - Diskon - BF</span></span>
                      </div>
                      <div className="w-40 sm:w-44 shrink-0">
                        <CurrencyInput
                          name="plafonAwal"
                          value={formData.plafonAwal || 0}
                          onValueChange={handleCurrencyChange}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="w-full flex flex-col sm:flex-row sm:items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-600">+ Biaya KPR</span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-md font-mono w-max shadow-sm">
                          Default (6%): Rp {formatTanpaDesimal((formData.plafonAwal || 0) * 0.06)}
                        </span>
                      </div>
                      <div className="w-40 sm:w-44 shrink-0">
                        <CurrencyInput
                          name="biayaKpr"
                          value={formData.biayaKpr || 0}
                          onValueChange={handleCurrencyChange}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-indigo-700 w-full">Plafon Kredit</span>
                        <div className="w-40 sm:w-44 shrink-0">
                          <CurrencyInput
                            name="plafonKredit"
                            value={formData.plafonKredit || 0}
                            onValueChange={handleCurrencyChange}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200">

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 w-full">
                          <span className="text-sm font-bold text-blue-500">+ Tambah Nilai KPR (Furnish/dll)</span>
                          <button
                            type="button"
                            className="w-7 h-7 flex items-center justify-center bg-blue-50 border border-blue-200 hover:border-blue-400 hover:text-blue-600 text-blue-500 transition-colors rounded-lg font-bold shadow-sm cursor-pointer"
                            onClick={handleAddBiayaTambahanKpr}
                            title="Tambah Nilai Pengajuan KPR"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      {biayaTambahanKprList.map((biaya) => (
                        <div key={biaya.id} className="flex items-center justify-between mt-1 mb-2">
                          <div className="flex items-center gap-2 w-full pr-4">
                            <input
                              type="text"
                              value={biaya.nama}
                              onChange={(e) => handleChangeBiayaTambahanKprNama(biaya.id, e.target.value)}
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 w-full max-w-[130px] sm:max-w-[160px] shadow-sm transition-all"
                              placeholder="Kanopi / Furnish"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveBiayaTambahanKpr(biaya.id)}
                              className="w-7 h-7 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 transition-colors rounded-lg font-bold cursor-pointer shrink-0"
                            >
                              -
                            </button>
                          </div>
                          <div className="w-40 sm:w-44 shrink-0">
                            <CurrencyInput
                              name={`biayakpr_${biaya.id}`}
                              value={biaya.nominal}
                              onValueChange={(_, val) => handleChangeBiayaTambahanKprNominal(biaya.id, val)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      ))}
                      {historyBiayaTambahanKpr.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200 border-dashed">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Riwayat Tambahan KPR (Tersimpan)</p>
                          {historyBiayaTambahanKpr.map((biaya) => (
                            <div key={biaya.id} className="flex justify-between items-center py-2 px-3 bg-blue-50/50 rounded-xl mb-1 border border-blue-100">
                              <p className="text-sm font-bold text-slate-700">{biaya.nama}</p>
                              <span className="text-sm font-bold text-blue-600 tabular-nums">{formatRupiah(biaya.nominal)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-bold text-blue-700 w-full">Total Nilai Pengajuan KPR</span>
                        <div className="w-40 sm:w-44 shrink-0">
                          <CurrencyInput
                            name="nilaiPengajuanKpr"
                            value={formData.nilaiPengajuanKpr || 0}
                            onValueChange={handleCurrencyChange}
                            placeholder="0"
                          />
                        </div>
                      </div>

                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-blue-600 w-full">DP Dibayar (Opsional)</span>
                        <div className="w-40 sm:w-44 shrink-0">
                          <CurrencyInput
                            name="dpDibayar"
                            value={formData.dpDibayar || 0}
                            onValueChange={handleCurrencyChange}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        <strong className="text-slate-400">Info:</strong> Jika diisi, SPR dan Kwitansi akan mencetak nilai DP Dibayar ini.
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-amber-600 w-full">DP Tidak Dibayar 10%</span>
                        <div className="w-40 sm:w-44 shrink-0">
                          <CurrencyInput
                            name="dpTidakDibayar"
                            value={formData.dpTidakDibayar || 0}
                            onValueChange={handleCurrencyChange}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(isCashBertahap(formData.caraPembayaran)) && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mt-4 space-y-2">
                    <h5 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border-b border-slate-200 pb-2">Kalkulasi Cash Bertahap</h5>

                    <div className="flex items-center justify-between">
                      <div className="w-full flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-600">DP</span>
                        <div className="relative w-20 group">
                          <input
                            type="text"
                            inputMode="numeric"
                            name="persentaseDp"
                            value={formData.persentaseDp === 0 ? '' : formData.persentaseDp}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/[^0-9]/g, '');
                              handleCurrencyChange('persentaseDp', rawValue ? Number(rawValue) : 0);
                            }}
                            className="w-full pl-3 pr-8 py-2 text-sm font-black text-indigo-700 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                        </div>
                      </div>
                      <div className="w-40 sm:w-44 shrink-0">
                        <CurrencyInput
                          name="dp"
                          value={formData.dp || 0}
                          onValueChange={handleCurrencyChange}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200">


                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-orange-600 w-full">Sisa Pembayaran</span>
                        <div className="w-40 sm:w-44 relative shrink-0">
                          <div className="absolute inset-y-0 left-0 pl-[14px] flex items-center pointer-events-none">
                            <span className="text-sm font-bold text-orange-600">Rp</span>
                          </div>
                          <div className="w-full pl-[40px] pr-3 py-1 text-left">
                            <span className="text-base font-black text-orange-600 tabular-nums">
                              {formatTanpaDesimal(
                                Math.max(0, (formData.hargaDasar || 0) - (formData.diskonPenjualan || 0) - (formData.dp || 0) - (formData.bookingFee || 0))
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono text-right mb-4">
                        <strong className="text-slate-400">Kalkulasi:</strong> Harga Dasar - Diskon - DP - Booking Fee
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-slate-600 w-full">Termin Pembayaran</span>
                        <div className="w-40 sm:w-44 shrink-0 relative group">
                          <input
                            type="text"
                            inputMode="numeric"
                            name="termin"
                            value={formData.termin || ''}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/[^0-9]/g, '');

                              if (rawValue === '') {
                                handleCurrencyChange('termin', 0);
                                return;
                              }

                              let val = Number(rawValue);
                              if (val > 12) val = 12;
                              handleCurrencyChange('termin', val);
                            }}
                            className="w-full pl-3 pr-14 py-2 text-sm font-black text-indigo-700 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm text-right"
                            placeholder="1-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">Bulan</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                        <div className="w-full">
                          <span className="text-sm font-bold text-indigo-700 block">Cicilan Per Bulan</span>
                          <span className="text-[10px] font-medium text-indigo-500 mt-1 block">
                            Estimasi: {(() => {
                              const termin = formData.termin || 3;
                              const start = new Date();
                              start.setMonth(start.getMonth() + 1);
                              const end = new Date(start);
                              end.setMonth(end.getMonth() + termin - 1);
                              const formatOpt: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
                              return `${start.toLocaleDateString('id-ID', formatOpt)} - ${end.toLocaleDateString('id-ID', formatOpt)}`;
                            })()}
                          </span>
                        </div>
                        <div className="w-40 sm:w-44 shrink-0">
                          <CurrencyInput
                            name="cicilanPerBulan"
                            value={formData.cicilanPerBulan || 0}
                            onValueChange={handleCurrencyChange}
                            placeholder="0"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl mt-8 shadow-lg shadow-emerald-500/20 text-white">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-100">
                    Harga Jual
                  </span>
                  {formData.caraPembayaran === 'KPR' && (
                    <span className="text-[10px] text-emerald-100/80 font-medium mt-1">
                      Default: (Plafon Kredit / 0.9) + Diskon
                    </span>
                  )}
                </div>

                <div className="w-full md:w-64">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="font-bold text-slate-500">Rp</span>
                    </div>
                    <input
                      type="text"
                      name="hargaJual"
                      value={formData.hargaJual ? formatTanpaDesimal(formData.hargaJual) : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                        handleCurrencyChange('hargaJual', rawValue ? Number(rawValue) : 0);
                      }}
                      autoComplete="off"
                      className="w-full pl-11 pr-4 py-2.5 text-lg font-black tabular-nums rounded-xl border-0 bg-white text-slate-900 shadow-inner outline-none focus:ring-4 focus:ring-emerald-300/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {isRevisiSpr && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <h4 className="text-[11px] font-bold text-orange-800 uppercase tracking-widest mb-3">Keterangan Revisi SPR</h4>
                <Input
                  name="keteranganRevisi"
                  value={keteranganRevisi}
                  onChange={(e) => setKeteranganRevisi(e.target.value)}
                  placeholder="Contoh: Penambahan biaya strategis / Pindah bank KPR..."
                  required
                />
                <p className="text-[10px] font-medium text-orange-600 mt-1 flex items-center gap-1">
                  <Clock size={12} /> Dokumen SPR lama akan diarsipkan otomatis.
                </p>
              </div>
            )}

            <div className="flex justify-between items-start gap-3 pt-4 sticky bottom-0 bg-slate-50/80 backdrop-blur-md p-4 rounded-b-2xl border-t border-slate-200 -mx-4 -mb-4 mt-4 z-20">
              <div className="w-1/2">
                {isCashBertahap(formData.caraPembayaran) && (
                  <Input
                    name="keteranganAngsuran"
                    value={formData.keteranganAngsuran || ''}
                    onChange={handleChange}
                    placeholder="Contoh: Diangsur 3x per tanggal 10..."
                  />
                )}
              </div>
              <div className="flex justify-end gap-3 w-1/2">
                <button type="button" onClick={() => { setIsSkemaModalOpen(false); setSelectedPenjualan(null); }} className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors shadow-sm cursor-pointer">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {updateMutation.isPending ? 'Memproses...' : 'Simpan & Proses SPR'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={!!printData} onClose={() => setPrintData(null)} title={`Pratinjau Dokumen`}>
        {printData && (
          <div className="bg-white" id="print-area" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', borderTop: '8px solid #4f46e5' }}>
            <div className="p-8">
              <div className="flex justify-between items-start border-b-[2px] border-slate-900 pb-4 mb-6 mt-1">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-slate-900 m-0">
                    {printType === 'invoice' ? 'TAGIHAN' : 'BUKTI PEMBAYARAN'}
                  </h2>
                  <div className="mt-3 space-y-2">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest tabular-nums">
                      <span className="w-24 inline-block text-slate-400">NO DOC</span>: {printData.id.toString().replace('INV-BF-', '').replace('INV-DP-', '')} / {new Date(printData.tanggal || new Date()).getFullYear()}
                    </p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest tabular-nums">
                      <span className="w-24 inline-block text-slate-400">NO INVOICE</span>: {printData.id.toString().replace('INV-BF-', '').replace('INV-DP-', '')}
                    </p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest tabular-nums">
                      <span className="w-24 inline-block text-slate-400">TANGGAL</span>: {formatDate(printData.tanggal || new Date().toISOString())}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  {selectedPerumahan?.logo ? (
                    <img src={selectedPerumahan.logo} alt="Logo" className="h-14 object-contain mb-2" crossOrigin="anonymous" />
                  ) : (
                    <h3 className="m-0 text-2xl font-black text-indigo-700 tracking-tight mb-1">BUMANTARA</h3>
                  )}
                </div>
              </div>

              <div className="mb-8 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-black mb-2 uppercase tracking-[0.2em]">
                  {printType === 'kwitansi' ? 'Telah Diterima Dari:' : 'Ditagihkan Kepada:'}
                </p>
                <p className="font-black text-xl text-slate-900 m-0 mb-1">{printData.nama}</p>
                <p className="text-sm m-0 mb-1 font-bold text-slate-500">{printData.noTelepon || '-'}</p>
                <p className="text-sm m-0 leading-relaxed font-medium text-slate-600 max-w-md">{printData.alamat || '-'}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden mb-8">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="py-3.5 px-5 text-left text-[11px] uppercase tracking-widest font-bold">Deskripsi</th>
                      <th className="py-3.5 px-5 text-right text-[11px] uppercase tracking-widest font-bold w-1/3">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-5 px-5 border-b border-slate-100 align-top">
                        <p className="text-lg font-black text-slate-900 m-0 mb-3">{printTitle}</p>
                        <p className="text-sm text-slate-600 font-medium m-0 mb-1">Perumahan: <strong>{printData.perumahan}</strong></p>
                        <p className="text-sm text-slate-600 font-medium m-0 mb-1">Kavling: <strong>Blok {printData.blok} - No. {printData.nomorUnit}</strong> {printData.tipe ? `(Tipe ${printData.tipe})` : ''} LT: {printData.luasTanah || '-'} / LB: {printData.luasBangunan || '-'}</p>
                        <p className="text-sm text-slate-600 font-medium m-0">
                          Agent Marketing: <strong>{printData.agent || '-'}</strong>
                        </p>
                      </td>
                      <td className="py-5 px-5 border-b border-slate-100 text-right align-top text-xl font-black text-slate-900 tabular-nums">
                        {formatRupiah(printData.nominalCetak || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex flex-row justify-between items-start gap-8 mb-8">
                <div className="flex-1">
                  {(() => {
                    let rekening: any = null;
                    if (printData.rekeningTujuanId) {
                      const b = bankList.find((x: any) => x.id === Number(printData.rekeningTujuanId));
                      if (b) rekening = { namaBank: b.namaBank, noRekening: b.noRekening, atasNama: b.atasNama };
                    }
                    if (!rekening) return null;
                    return (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">
                          {printType === 'kwitansi' ? 'Pembayaran Ditransfer Ke:' : 'Transfer Pembayaran Ke:'}
                        </span>
                        <p className="text-sm font-bold text-slate-900 uppercase mb-1">Bank {rekening.namaBank}</p>
                        <p className="text-xl font-black text-indigo-700 my-0.5 font-mono tracking-tight tabular-nums">{rekening.noRekening}</p>
                        <p className="text-[11px] font-bold text-slate-500 uppercase mt-2">A/N: {rekening.atasNama}</p>
                      </div>
                    );
                  })()}
                </div>

                <div className="w-[320px] space-y-3">
                  <div className={`flex justify-between items-center p-3 rounded-2xl border-2 ${printType === 'kwitansi' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-900 border-slate-900 text-white'}`}>
                    <span className="text-sm font-black uppercase tracking-[0.2em]">Total</span>
                    <span className="text-2xl font-black tabular-nums">{formatRupiah(printData.nominalCetak || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="mb-8 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 mb-2 uppercase tracking-widest">Catatan:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Harga jual pembelian unit rumah sudah termasuk biaya AJB, Sertipikat, IMB, Listrik, BPHTB, Biaya Proses KPR dan Notaris.</li>
                  <li>Harga jual khusus pembelian kavling belum termasuk biaya BPHTB, PPJB, AJB, Sertipikat dan Biaya Mutasi PBB.</li>
                  <li>Apabila terjadi pembatalan, uang tanda jadi (Booking Fee) tidak dapat dikembalikan / hangus.</li>
                </ul>
              </div>

              <div className="flex justify-between items-end pt-6 border-t border-slate-200 mt-auto">
                <div className="flex flex-col items-center p-3 border border-slate-200 rounded-2xl bg-white shadow-sm">
                  <div style={{ background: 'white', padding: '4px', borderRadius: '8px' }}>
                    <QRCode
                      value={`${window.location.origin}/verify/${printTitle.includes('Booking Fee')
                        ? (printType === 'kwitansi' ? `KWT-BF-${printData.id}` : `INV-BF-${printData.id}`)
                        : printTitle.includes('Down Payment') || printTitle.includes('DP')
                          ? (printType === 'kwitansi' ? `KWT-DP-${printData.id}` : `INV-DP-${printData.id}`)
                          : printData.id
                        }`}
                      size={70}
                      level="H"
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 mt-2 font-bold tracking-widest uppercase">Scan Validasi</span>
                  <span className="text-[10px] text-slate-800 font-bold mt-0.5 tracking-wide">www.purisafana.com</span>
                  <span className="text-[9px] text-slate-500 mt-3 font-bold tracking-widest uppercase">Hormat Kami,</span>
                  <span className="text-[11px] text-slate-900 font-black mt-1 tracking-wide uppercase">
                    {printData.pembuat}
                  </span>
                </div>

                {printType === 'kwitansi' && (
                  <div className="text-center w-[220px] relative">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Tangerang, {formatDate(printData.tanggal || new Date().toISOString())}
                    </p>

                    {(() => {
                      const ttdRole = printTitle.includes('Booking Fee') ? 'Kwitansi_Booking' : 'Kwitansi_DP';
                      const ttdObj = printData.ttdData?.[ttdRole];

                      if (ttdObj?.url) {
                        return (
                          <div className="flex flex-col items-center justify-center my-3 h-20">
                            <img src={ttdObj.url} alt="Tanda Tangan" className="h-16 object-contain" crossOrigin="anonymous" />
                            <span className="text-[8px] text-slate-400 font-medium">Signed at: {formatDate(ttdObj.tanggal)}</span>
                          </div>
                        );
                      }
                      return <div className="h-20 w-full"></div>;
                    })()}

                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest border-b-[2px] border-slate-900 pb-2 inline-block z-10 relative">
                      MARKETING
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">{selectedPerumahan?.nama}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-50/80 backdrop-blur-md p-4 rounded-b-2xl border-t border-slate-200 -mx-4 -mb-4 mt-4 z-20">
          <button onClick={() => setPrintData(null)} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-100 transition-colors shadow-sm">Tutup</button>

          {printType === 'kwitansi' && (
            <button onClick={() => {
              setTtdData({
                nama: 'Marketing',
                tanggal: new Date().toISOString().split('T')[0],
                sebagai: printTitle.includes('Booking Fee') ? 'Kwitansi_Booking' : 'Kwitansi_DP'
              });
              setIsTtdModalOpen(true);
              setTimeout(() => sigCanvas.current?.clear(), 100);
            }} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2">
              <PenTool size={16} /> Tanda Tangan
            </button>
          )}

          <button onClick={handleShareWA} className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-emerald-600 shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-colors">
            Kirim via WA
          </button>
          <button onClick={handlePrintPDF} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-800 flex items-center gap-2 transition-colors shadow-md">
            <Printer size={16} /> Download PDF
          </button>
        </div>
      </Modal>

      <Modal isOpen={isCancelModalOpen} onClose={() => { setIsCancelModalOpen(false); setSelectedCancelRow(null); }} title="Ajukan Pembatalan Penjualan">
        {selectedCancelRow && (
          <form onSubmit={handleCancelSubmit} className="space-y-5">
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-2xl text-sm font-medium leading-relaxed">
              <strong>Peringatan Tindakan!</strong> Tindakan ini akan mengirimkan <strong>Pengajuan Pembatalan</strong> ke Admin. Transaksi tidak akan langsung dibatalkan sampai Admin menyetujuinya. <br /><br />Jika disetujui, status transaksi menjadi "Batal", Kavling kembali "Available", dan tagihan belum terbayar akan dihapus.
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Detail Transaksi</h4>
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
                  <p className="text-sm font-bold text-indigo-600 tabular-nums">{formatRupiah(selectedCancelRow.hargaJual)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Metode</p>
                  <p className="text-sm font-bold text-slate-900">{selectedCancelRow.caraPembayaran}</p>
                </div>
              </div>
            </div>

            <Input
              label="Alasan Pembatalan"
              name="alasanBatal"
              value={cancelData.alasanBatal}
              onChange={(e) => {
                setCancelData({ ...cancelData, alasanBatal: e.target.value });
                if (errors.alasanBatal) setErrors({});
              }}
              placeholder="Contoh: Customer mengundurkan diri..."
              error={errors.alasanBatal}
              required
            />

            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-50/80 backdrop-blur-md p-4 rounded-b-2xl border-t border-slate-200 -mx-4 -mb-4 mt-4 z-20">
              <button type="button" onClick={() => { setIsCancelModalOpen(false); setSelectedCancelRow(null); }} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-100 transition-colors shadow-sm">Batal</button>
              <button type="submit" disabled={cancelMutation.isPending} className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-red-700 shadow-md shadow-red-600/20 disabled:opacity-50 transition-all active:scale-95">
                {cancelMutation.isPending ? "Memproses..." : "Ajukan Pembatalan"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Pratinjau Dokumen / Bukti">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-50 rounded-2xl p-3 border border-slate-200 shadow-inner">
              {previewImage.split('?')[0].toLowerCase().endsWith('.pdf') || previewImage.includes('application/pdf') ? (
                <iframe src={previewImage} className="w-full h-[70vh] rounded-xl border-none" title="PDF Preview" />
              ) : (
                <img src={previewImage} alt="Preview Full" className="max-w-full max-h-[70vh] rounded-xl shadow-md object-contain" />
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 w-full pt-4 sticky bottom-0 bg-slate-50/80 backdrop-blur-md p-4 rounded-b-2xl border-t border-slate-200 -mx-4 -mb-4 mt-4 z-20">
            <a href={previewImage || '#'} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all cursor-pointer shadow-sm">Buka Tab Baru</a>
            <button onClick={() => setPreviewImage(null)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all cursor-pointer shadow-md">Tutup</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isTtdModalOpen} onClose={() => setIsTtdModalOpen(false)} title="Tanda Tangan Digital Kwitansi">
        <div className="space-y-2">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5 grid grid-cols-1 md:grid-cols-2">
            <Input label="Nama Penandatangan" value={ttdData.nama} onChange={(e) => setTtdData({ ...ttdData, nama: e.target.value })} placeholder="Nama Marketing..." />
            <Input label="Tanggal Tanda Tangan" type="date" value={ttdData.tanggal} onChange={(e) => setTtdData({ ...ttdData, tanggal: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Area Tanda Tangan</label>
            
            {/* 1. Tambahkan w-full dan h-48 di div pembungkusnya untuk memberikan ukuran tinggi yang pasti */}
            <div className="border-2 border-dashed border-indigo-200 rounded-2xl bg-white overflow-hidden shadow-inner w-full h-48">
              
              {/* 2. Hapus width dan height dari canvasProps */}
              <SignatureCanvas 
                ref={sigCanvas} 
                penColor="black" 
                canvasProps={{ className: 'w-full h-full cursor-crosshair' }} 
              />
            </div>
            <div className="flex justify-between items-center mt-3 px-1">
              <p className="text-xs font-medium text-slate-400">Pastikan tanda tangan berada di dalam kotak.</p>
              <button type="button" onClick={() => sigCanvas.current?.clear()} className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer transition-colors">Hapus / Ulangi</button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-50/80 backdrop-blur-md p-4 rounded-b-2xl border-t border-slate-200 -mx-4 -mb-4 mt-4 z-20">
            <button onClick={() => setIsTtdModalOpen(false)} disabled={uploadSignatureMutation.isPending} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold cursor-pointer hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50">Batal</button>
            <button onClick={saveSignature} disabled={uploadSignatureMutation.isPending} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50">
              {uploadSignatureMutation.isPending ? "Menyimpan..." : "Simpan Tanda Tangan"}
            </button>
          </div>
        </div>
      </Modal>
      <PenjualanDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        detailData={detailData}
      />

      <Modal isOpen={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} title="Informasi Bank KPR">
        <form onSubmit={handleBankSubmit} className="space-y-5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5 space-y-4">
            <p className="text-xs font-medium text-slate-600">
              Masukkan nama Bank yang menyetujui pengajuan KPR customer.
            </p>
            <Input
              label="Nama Bank KPR"
              name="bank"
              value={bankData.bank}
              onChange={(e) => setBankData({ ...bankData, bank: e.target.value })}
              placeholder="Contoh: MANDIRI / BTN / BSI"
              required
            />

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-700 mb-1">Detail Rekening Bank KPR</p>
              <p className="text-[11px] text-slate-500 mb-4">
                Field di bawah ini opsional. Isi jika informasi rekening sudah tersedia.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <Input
                  label="Nama Rekening (Opsional)"
                  name="bankKprNamaRekening"
                  value={bankData.bankKprNamaRekening}
                  onChange={(e) => setBankData({ ...bankData, bankKprNamaRekening: e.target.value })}
                  placeholder="Contoh: Rekening Escrow KPR"
                />
                <Input
                  label="Nomor Rekening (Opsional)"
                  name="bankKprNoRekening"
                  value={bankData.bankKprNoRekening}
                  onChange={(e) => setBankData({ ...bankData, bankKprNoRekening: e.target.value })}
                  placeholder="Masukkan nomor rekening"
                />
                <div className="md:col-span-2">
                  <Input
                    label="Atas Nama Rekening (Opsional)"
                    name="bankKprAtasNamaRekening"
                    value={bankData.bankKprAtasNamaRekening}
                    onChange={(e) => setBankData({ ...bankData, bankKprAtasNamaRekening: e.target.value })}
                    placeholder="Nama pemilik rekening"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-50/80 backdrop-blur-md p-4 rounded-b-2xl border-t border-slate-200 -mx-4 -mb-4 mt-4 z-20">
            <button
              type="button"
              onClick={() => setIsBankModalOpen(false)}
              className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-100 transition-colors shadow-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {updateMutation.isPending ? "Menyimpan..." : "Simpan Bank KPR"}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Penjualan;
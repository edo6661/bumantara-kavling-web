/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import CurrencyInput from "../../components/shared/CurrencyInput";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import { formatRupiah } from "../../utils/formatters";
import { useGetPenjualan } from "../../hooks/queries/usePenjualan";
import { useGetCustomers, useUpdateCustomer, useUploadCustomerDoc } from "../../hooks/queries/useCustomer";
import {
  useUploadKodeBillingPph,
  useGetKodeBillingPphByPenjualan,
  useGetAllKodeBillingPphByPenjualan,
  kodeBillingPphPenjualanQueryKey,
} from "../../hooks/queries/useKodeBillingPph";
import { useUploadSuketPph, useGetSuketPphByPenjualan, useGetAllSuketPphByPenjualan } from "../../hooks/queries/useSuketPph";
import type { CustomerDocType } from "../../services/customer.service";
import {
  useGetProgressPenjualan,
  useUpdateProgressPenjualan,
  useUploadProgressDocument,
  useDeleteProgressDocument,
} from "../../hooks/queries/useProgressPenjualan";
import {
  Trash2, Plus, UploadCloud,
  UserCheck, Landmark, ScrollText, Key, FileSignature, ImageIcon, ZoomIn, PlusCircle,
  Loader2,
  Map,
  ArrowUpDown,
  ChevronDown,
  Filter
} from 'lucide-react';
import Input from '../../components/shared/Input';
import { handleApiError } from '../../utils/errorHandler';
import {
  calcPajakFromNilaiAjb,
  getProgressSlot,
  getTotalNilaiAjb,
  hasAnyTanahSertifikat,
  isAllProgressFileAjbComplete,
  isAllProgressFilePpjbComplete,
  isAllTanahSertifikatComplete,
} from '../../utils/progressPenjualanSertifikat';
import { useGetNotaris } from '../../hooks/queries/useNotaris';
import Select from '../../components/shared/Select';
import { useUploadKavlingDocument, useUploadKavlingSertifikatTambahanDocument, useDeleteKavlingDocument, useDeleteKavlingSertifikatTambahanDocument } from '../../hooks/queries/useKavling';
import { useQueryClient } from '@tanstack/react-query';

const SP3K_DOKUMEN_NAMES = ['Kode Billing PPh', 'Suket PPh'] as const;
const KODE_BILLING_PPH_DOC_NAME = SP3K_DOKUMEN_NAMES[0];
const SUKET_PPH_DOC_NAME = SP3K_DOKUMEN_NAMES[1];

const COMBINED_LEGACY_SP3K_NAME = 'Kode Billing PPh dan Suket PPh';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const isSp3kDokumen = (nama: string) => {
  const key = nama?.trim().toLowerCase();
  return (
    SP3K_DOKUMEN_NAMES.some((n) => n.toLowerCase() === key) ||
    key === COMBINED_LEGACY_SP3K_NAME.toLowerCase()
  );
};

const ProgressPenjualan = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const orderBy = searchParams.get('orderBy') || '';
  const caraPembayaran = searchParams.get('caraPembayaran') || '';
  const limitParam = Number(searchParams.get('limit'));
  const limit = (PAGE_SIZE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;

  const { data: penjualanResponse, isLoading: loadingPenjualan } = useGetPenjualan({
    page,
    limit,
    search,
    excludeStatus: 'BATAL',
    ...(orderBy ? { orderBy } : {}),
    ...(caraPembayaran ? { caraPembayaran } : {}),
  });
  const { data: notarisList = [] } = useGetNotaris();
  const penjualanData = useMemo(() => penjualanResponse?.items || [], [penjualanResponse?.items]);
  const meta = penjualanResponse?.meta;
  const { data: customers = [], isLoading: loadingCustomers } = useGetCustomers();

  const updateMutation = useUpdateProgressPenjualan();
  const uploadMutation = useUploadProgressDocument();
  const deleteProgressDocMutation = useDeleteProgressDocument();
  const uploadCustomerDocMutation = useUploadCustomerDoc();
  const uploadKodeBillingPphMutation = useUploadKodeBillingPph();
  const uploadSuketPphMutation = useUploadSuketPph();
  const updateCustomerMutation = useUpdateCustomer();
  const uploadKavlingDocMutation = useUploadKavlingDocument();
  const uploadKavlingTambahanDocMutation = useUploadKavlingSertifikatTambahanDocument();
  const deleteKavlingDocMutation = useDeleteKavlingDocument();
  const deleteKavlingTambahanDocMutation = useDeleteKavlingSertifikatTambahanDocument();
  const queryClient = useQueryClient();
  const [uploadingKavlingDoc, setUploadingKavlingDoc] = useState<string | null>(null);
  const [deletingKavlingDoc, setDeletingKavlingDoc] = useState<string | null>(null);

  const [selectedPenjualan, setSelectedPenjualan] = useState<Record<string, any> | null>(null);
  const [modalStep, setModalStep] = useState<string | null>(null);
  const [newDocName, setNewDocName] = useState("");
  const [notarisForm, setNotarisForm] = useState({ notarisId: '', biayaNotaris: 0 });
  const [uploadingProgressDoc, setUploadingProgressDoc] = useState<string | null>(null);
  const [deletingProgressDoc, setDeletingProgressDoc] = useState<string | null>(null);
  const [uploadingCustDoc, setUploadingCustDoc] = useState<string | null>(null);
  const [pdfPassword, setPdfPassword] = useState("");
  const [showPdfPasswordModal, setShowPdfPasswordModal] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{
    type: 'cust' | 'lainnya' | 'kodeBillingPph' | 'suketPph';
    docType?: CustomerDocType;
    files: File[];
    groupName?: string;
    sertifikatUrutan?: number;
  } | null>(null);


  const [dragActive, setDragActive] = useState<string | null>(null);

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => { prev.set('page', String(newPage)); return prev; });
  };
  const handlePageSizeChange = (newLimit: number) => {
    setSearchParams(prev => {
      if (newLimit === DEFAULT_PAGE_SIZE) prev.delete('limit');
      else prev.set('limit', String(newLimit));
      prev.set('page', '1');
      return prev;
    });
  };
  const handleSearchChange = (newSearch: string) => {
    setSearchParams(prev => {
      if (newSearch) prev.set('search', newSearch); else prev.delete('search');
      prev.set('page', '1'); return prev;
    });
  };
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams(prev => {
      if (e.target.value) prev.set('orderBy', e.target.value); else prev.delete('orderBy');
      prev.set('page', '1'); return prev;
    });
  };
  const handleCaraPembayaranChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams(prev => {
      if (e.target.value) prev.set('caraPembayaran', e.target.value); else prev.delete('caraPembayaran');
      prev.set('page', '1'); return prev;
    });
  };

  const filterSelectClass =
    'w-full px-3 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 appearance-none transition-all shadow-sm cursor-pointer';

  const tableToolbar = (
    <>
      <div className="relative group w-full sm:w-52">
        <select
          className={`${filterSelectClass} pl-9`}
          value={orderBy}
          onChange={handleSortChange}
          aria-label="Urutkan data"
        >
          <option value="">Penjualan Terbaru</option>
          <option value="blokNomorUnit:asc">Blok & No Unit (A-Z)</option>
          <option value="nama:asc">Nama Customer (A-Z)</option>
        </select>
        <ArrowUpDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500" />
        <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
      </div>
      <div className="relative group w-full sm:w-44">
        <select
          className={`${filterSelectClass} pl-9`}
          value={caraPembayaran}
          onChange={handleCaraPembayaranChange}
          aria-label="Filter cara pembayaran"
        >
          <option value="">Semua</option>
          <option value="CASH_KERAS">Cash Keras</option>
          <option value="CASH_BERTAHAP">Cash Bertahap</option>
          <option value="KPR">KPR</option>
        </select>
        <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500" />
        <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
      </div>
    </>
  );

  const currentCustomer = useMemo(() => {
    if (!selectedPenjualan) return null;
    return customers.find((c: Record<string, any>) => c.nikKtp === selectedPenjualan.noIdentitas);
  }, [selectedPenjualan, customers]);

  const { data: progressData, isLoading: loadingProgress } = useGetProgressPenjualan(
    selectedPenjualan?.dbId != null ? Number(selectedPenjualan.dbId) : null,
  );

  // ID penjualan untuk dokumen PPh per kavling — dari progress (paling akurat) atau dbId baris tabel
  const activePenjualanId = useMemo(() => {
    if (progressData?.penjualanId) return Number(progressData.penjualanId);
    if (selectedPenjualan?.dbId != null) return Number(selectedPenjualan.dbId);
    return null;
  }, [progressData?.penjualanId, selectedPenjualan?.dbId]);

  const penjualanIdForDocs =
    activePenjualanId != null && !Number.isNaN(activePenjualanId) && activePenjualanId > 0
      ? activePenjualanId
      : null;

  const jumlahSertifikatTanah = Math.max(
    1,
    Number(selectedPenjualan?.jumlahSertifikatTanah ?? 1),
  );
  const isMultiSertifikat = jumlahSertifikatTanah > 1;

  const { data: kodeBillingRecord } = useGetKodeBillingPphByPenjualan(
    !isMultiSertifikat && modalStep && penjualanIdForDocs ? penjualanIdForDocs : null,
  );
  const { data: kodeBillingRecords = [] } = useGetAllKodeBillingPphByPenjualan(
    isMultiSertifikat && modalStep && penjualanIdForDocs ? penjualanIdForDocs : null,
  );

  const kodeBillingLatest = (isMultiSertifikat ? kodeBillingRecords[0] : kodeBillingRecord)?.kodeBilling;
  const kodeBillingFileUrl = (isMultiSertifikat ? kodeBillingRecords[0] : kodeBillingRecord)?.fileBilling?.trim() || null;

  const { data: suketRecord } = useGetSuketPphByPenjualan(
    !isMultiSertifikat && modalStep && penjualanIdForDocs ? penjualanIdForDocs : null,
  );
  const { data: suketRecords = [] } = useGetAllSuketPphByPenjualan(
    isMultiSertifikat && modalStep && penjualanIdForDocs ? penjualanIdForDocs : null,
  );

  const sp3kUnitLabel = selectedPenjualan
    ? `Blok ${selectedPenjualan.blok ?? ''}-${selectedPenjualan.nomorUnit ?? ''}`.trim()
    : '';

  const [checklist, setChecklist] = useState<{ key: string; value: string }[]>([]);
  const [nilaiAjbInputs, setNilaiAjbInputs] = useState<Record<number, number>>({ 1: 0 });
  const [ajbForms, setAjbForms] = useState<Record<number, { nomor: string; tanggal: string }>>({
    1: { nomor: '', tanggal: '' },
  });

  useEffect(() => {
    if (progressData) {
      const nextNilaiAjb: Record<number, number> = {};
      const nextAjbForms: Record<number, { nomor: string; tanggal: string }> = {};
      for (let urutan = 1; urutan <= jumlahSertifikatTanah; urutan++) {
        const slot = getProgressSlot(progressData, urutan);
        nextNilaiAjb[urutan] = slot.nilaiAjb || 0;
        nextAjbForms[urutan] = {
          nomor: slot.nomorAjb || '',
          tanggal: slot.tanggalAjb
            ? new Date(slot.tanggalAjb).toISOString().split('T')[0]
            : '',
        };
      }
      setNilaiAjbInputs(nextNilaiAjb);
      setAjbForms(nextAjbForms);
      setNotarisForm({
        notarisId: progressData.notarisId ? String(progressData.notarisId) : '',
        biayaNotaris: progressData.biayaNotaris || 0
      });
      if (progressData.checklistBast) {
        const arr = Object.entries(progressData.checklistBast).map(([k, v]) => ({ key: k, value: String(v || '') }));
        setChecklist(arr);
      } else {
        setChecklist([]);
      }
    }
  }, [progressData, jumlahSertifikatTanah]);

  const handleDrag = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(id);
    else if (e.type === "dragleave") setDragActive(null);
  };

  const handlePaste = (e: React.ClipboardEvent, callback: (files: File[]) => void) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1 || items[i].type === "application/pdf") {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) callback(files);
  };
  const handleSaveNotaris = async () => {
    if (!progressData) return;
    try {
      await updateMutation.mutateAsync({
        id: progressData.penjualanId,
        data: {
          notarisId: notarisForm.notarisId ? Number(notarisForm.notarisId) : null,
          biayaNotaris: notarisForm.biayaNotaris
        }
      });
      alert("Data Notaris berhasil disimpan!");
    } catch (err: any) {
      alert(handleApiError(err).message);
    }
  };

  const handleUploadKavlingDoc = async (docType: string, file: File, urutan = 1) => {
    if (!selectedPenjualan) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hanya format gambar dan PDF yang diperbolehkan!");
      return;
    }
    const uploadKey = urutan === 1 ? docType : `${urutan}-${docType}`;
    setUploadingKavlingDoc(uploadKey);
    try {
      if (urutan === 1) {
        await uploadKavlingDocMutation.mutateAsync({ id: selectedPenjualan.kavlingId, docType, file });
        const fileUrl = URL.createObjectURL(file);
        setSelectedPenjualan((prev: any) => prev ? { ...prev, [docType]: fileUrl } : prev);
      } else {
        await uploadKavlingTambahanDocMutation.mutateAsync({
          id: selectedPenjualan.kavlingId,
          urutan,
          docType,
          file,
        });
        const fileUrl = URL.createObjectURL(file);
        setSelectedPenjualan((prev: any) => {
          if (!prev) return prev;
          const existing = Array.isArray(prev.sertifikatTanahTambahan)
            ? [...prev.sertifikatTanahTambahan]
            : [];
          const idx = existing.findIndex((row: { urutan: number }) => row.urutan === urutan);
          const nextRow = {
            urutan,
            filePbg: idx >= 0 ? existing[idx].filePbg : null,
            fileSertifikatTanah: idx >= 0 ? existing[idx].fileSertifikatTanah : null,
            fileNopPbb: idx >= 0 ? existing[idx].fileNopPbb : null,
            [docType]: fileUrl,
          };
          if (idx >= 0) existing[idx] = { ...existing[idx], ...nextRow };
          else existing.push(nextRow);
          return { ...prev, sertifikatTanahTambahan: existing };
        });
      }
      alert(`Dokumen kavling berhasil diunggah!`);
      queryClient.invalidateQueries({ queryKey: ["penjualan"] });
    } catch (err: any) {
      alert(handleApiError(err).message);
    } finally {
      setUploadingKavlingDoc(null);
    }
  };

  const getSertifikatTanahFileUrl = (docType: string, urutan: number) => {
    if (!selectedPenjualan) return null;
    if (urutan === 1) return selectedPenjualan[docType] ?? null;
    const row = selectedPenjualan.sertifikatTanahTambahan?.find(
      (item: { urutan: number }) => item.urutan === urutan,
    );
    return row?.[docType] ?? null;
  };

  const handleDeleteKavlingDoc = async (docType: string, urutan = 1, title = 'dokumen') => {
    if (!selectedPenjualan) return;
    const fileUrl = getSertifikatTanahFileUrl(docType, urutan);
    if (!fileUrl) return;
    const isConfirm = window.confirm(`Apakah Anda yakin ingin menghapus ${title}?`);
    if (!isConfirm) return;

    const deleteKey = urutan === 1 ? docType : `${urutan}-${docType}`;
    setDeletingKavlingDoc(deleteKey);
    try {
      if (urutan === 1) {
        await deleteKavlingDocMutation.mutateAsync({
          id: selectedPenjualan.kavlingId,
          docType,
        });
        setSelectedPenjualan((prev: any) => prev ? { ...prev, [docType]: null } : prev);
      } else {
        await deleteKavlingTambahanDocMutation.mutateAsync({
          id: selectedPenjualan.kavlingId,
          urutan,
          docType,
        });
        setSelectedPenjualan((prev: any) => {
          if (!prev) return prev;
          const existing = Array.isArray(prev.sertifikatTanahTambahan)
            ? [...prev.sertifikatTanahTambahan]
            : [];
          const idx = existing.findIndex((row: { urutan: number }) => row.urutan === urutan);
          if (idx >= 0) {
            existing[idx] = { ...existing[idx], [docType]: null };
          }
          return { ...prev, sertifikatTanahTambahan: existing };
        });
      }
      alert('Dokumen kavling berhasil dihapus!');
      queryClient.invalidateQueries({ queryKey: ["penjualan"] });
    } catch (err: any) {
      alert(handleApiError(err).message);
    } finally {
      setDeletingKavlingDoc(null);
    }
  };

  const renderKavlingFileBox = (title: string, docType: string, url: string | null, urutan = 1) => {
    const uploadKey = urutan === 1 ? docType : `${urutan}-${docType}`;
    const isPdf = url ? (url.split('?')[0].toLowerCase().endsWith('.pdf') || url.includes('application/pdf') || url.startsWith('blob:')) : false;
    const isUploading =
      (uploadKavlingDocMutation.isPending || uploadKavlingTambahanDocMutation.isPending) &&
      uploadingKavlingDoc === uploadKey;
    const isDeleting =
      (deleteKavlingDocMutation.isPending || deleteKavlingTambahanDocMutation.isPending) &&
      deletingKavlingDoc === uploadKey;
    const isDrag = dragActive === uploadKey;

    return (
      <div
        className={`bg-white p-4 rounded-xl border flex flex-col gap-3 transition-all relative overflow-hidden outline-none focus-within:ring-2 focus-within:ring-blue-400
          ${isDrag ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-200'}
        `}
        tabIndex={0}
        onDragEnter={(e) => handleDrag(e, uploadKey)}
        onDragLeave={(e) => handleDrag(e, uploadKey)}
        onDragOver={(e) => handleDrag(e, uploadKey)}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation(); setDragActive(null);
          const file = e.dataTransfer.files?.[0];
          if (file) handleUploadKavlingDoc(docType, file, urutan);
        }}
        onPaste={(e) => handlePaste(e, (files) => handleUploadKavlingDoc(docType, files[0], urutan))}
      >
        <div className="flex justify-between items-center relative z-10">
          <div className="flex flex-col">
            <h5 className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">{title}</h5>
            {urutan > 1 && (
              <span className="text-[9px] text-blue-600 font-bold">Sertifikat Tanah ke-{urutan}</span>
            )}
            <span className="text-[9px] text-slate-400 font-medium">Drag / Paste file di sini</span>
          </div>
          <div className="flex gap-1">
            {url && (
              <button
                type="button"
                onClick={() => handleDeleteKavlingDoc(docType, urutan, title)}
                disabled={isUploading || isDeleting}
                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-200 transition-all hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Hapus File"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
            <label className={`flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all ${isUploading || isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 cursor-pointer'}`}>
              {isUploading ? (
                <><Loader2 size={14} className="animate-spin text-blue-600" /> Mengunggah...</>
              ) : (
                <><UploadCloud size={14} /> {url ? 'Ganti File' : 'Upload File'}</>
              )}
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadKavlingDoc(docType, file, urutan);
                e.target.value = '';
              }} disabled={uploadKavlingDocMutation.isPending || uploadKavlingTambahanDocMutation.isPending || isDeleting} />
            </label>
          </div>
        </div>

        <div className={`w-full h-64 bg-slate-100 rounded-lg border overflow-hidden relative group transition-all ${isDrag ? 'border-blue-400 border-dashed' : 'border-slate-200'}`}>
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
              <span className="text-xs font-bold text-blue-600 animate-pulse">Sedang mengunggah...</span>
            </div>
          )}
          {isDeleting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <Loader2 size={32} className="animate-spin text-red-600 mb-3" />
              <span className="text-xs font-bold text-red-600 animate-pulse">Sedang menghapus...</span>
            </div>
          )}
          {url ? (
            <>
              {isPdf ? (
                <iframe src={url} className="w-full h-full border-none" title={title} />
              ) : (
                <img src={url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                <a href={url} target="_blank" rel="noopener noreferrer" className="pointer-events-auto px-4 py-2 bg-white text-slate-800 text-xs font-bold rounded-lg shadow-md hover:bg-slate-50 transition-colors">
                  Buka di Tab Baru
                </a>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 pointer-events-none">
              <span className="text-[10px] font-medium italic text-center px-4">Area Upload<br />Klik / Drag & Drop / Paste</span>
            </div>
          )}
        </div>
      </div>
    );
  };
  const ProgressIcons = ({ row }: { row: Record<string, any> }) => {
    const safeProgress = row.progressPenjualan || {};
    const skema = row.caraPembayaran?.toUpperCase() || '';
    const jumlahTanah = Math.max(1, Number(row.jumlahSertifikatTanah ?? 1));
    const hasSertifikat = isAllTanahSertifikatComplete(jumlahTanah, row);
    const hasAnySertifikat = hasAnyTanahSertifikat(jumlahTanah, row);
    const hasPpjb = isAllProgressFilePpjbComplete(jumlahTanah, safeProgress);
    const hasAjb = isAllProgressFileAjbComplete(jumlahTanah, safeProgress);

    const IconNode = ({ active, icon: Icon, title, step }: { active: boolean, icon: any, title: string, step: string }) => (
      <button
        type="button"
        title={title}
        onClick={() => {
          setSelectedPenjualan(row);
          setModalStep(step);
          setNewDocName("");
        }}
        className={`p-1.5 rounded-lg border shadow-sm transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-110 ${active
          ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
          : 'bg-slate-50 border-slate-200 text-slate-400 grayscale hover:grayscale-0 hover:bg-slate-100'
          }`}
      >
        <Icon size={14} strokeWidth={active ? 2.5 : 1.5} />
      </button>
    );

    const LineNode = ({ active }: { active: boolean }) => (
      <div className={`w-3 h-0.5 rounded-full transition-all duration-300 ${active ? 'bg-emerald-300' : 'bg-slate-200'}`}></div>
    );

    if (skema === 'KPR') {
      return (
        <div className="flex items-center gap-1">
          <IconNode active={!!safeProgress.berkasCustomerValid} icon={UserCheck} title="1. Berkas Valid" step="VALIDASI_BERKAS" />
          <LineNode active={hasAnySertifikat} />
          <IconNode active={hasSertifikat} icon={Map} title="2. Sertifikat Kavling" step="SERTIFIKAT_KAVLING" />
          <LineNode active={!!safeProgress.fileSp3k} />
          <IconNode active={!!safeProgress.fileSp3k} icon={Landmark} title="3. SP3K" step="SP3K" />
          <LineNode active={hasAjb} />
          <IconNode active={hasAjb} icon={ScrollText} title="4. AJB" step="AJB" />
          <LineNode active={!!safeProgress.fileBast} />
          <IconNode active={!!safeProgress.fileBast} icon={Key} title="5. BAST" step="BAST" />
        </div>
      );
    }
    if (skema === 'CASH BERTAHAP') {
      return (
        <div className="flex items-center gap-1">
          <IconNode active={!!safeProgress.berkasCustomerValid} icon={UserCheck} title="1. Berkas Valid" step="VALIDASI_BERKAS" />
          <LineNode active={hasAnySertifikat} />
          <IconNode active={hasSertifikat} icon={Map} title="2. Sertifikat Kavling" step="SERTIFIKAT_KAVLING" />
          <LineNode active={hasPpjb} />
          <IconNode active={hasPpjb} icon={FileSignature} title="3. PPJB" step="PPJB" />
          <LineNode active={hasAjb} />
          <IconNode active={hasAjb} icon={ScrollText} title="4. AJB" step="AJB" />
          <LineNode active={!!safeProgress.fileBast} />
          <IconNode active={!!safeProgress.fileBast} icon={Key} title="5. BAST" step="BAST" />
        </div>
      );
    }
    if (skema === 'CASH KERAS') {
      return (
        <div className="flex items-center gap-1">
          <IconNode active={!!safeProgress.berkasCustomerValid} icon={UserCheck} title="1. Berkas Valid" step="VALIDASI_BERKAS" />
          <LineNode active={hasAnySertifikat} />
          <IconNode active={hasSertifikat} icon={Map} title="2. Sertifikat Kavling" step="SERTIFIKAT_KAVLING" />
          <LineNode active={hasAjb} />
          <IconNode active={hasAjb} icon={ScrollText} title="3. AJB" step="AJB" />
          <LineNode active={!!safeProgress.fileBast} />
          <IconNode active={!!safeProgress.fileBast} icon={Key} title="4. BAST" step="BAST" />        </div>
      );
    }
    return <span className="text-xs text-slate-400 italic">-</span>;
  };

  const columns = [
    { header: 'Customer', accessor: 'nama', render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },
    { header: 'Blok', accessor: 'blok', render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
    { header: 'No', accessor: 'nomorUnit', render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
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
      header: 'Nilai AJB',
      accessor: 'nilaiAjb',
      render: (_: unknown, row: Record<string, any>) => {
        const nilaiAjb = getTotalNilaiAjb(row.progressPenjualan);
        return (
          <span className="font-medium text-slate-700 tabular-nums">
            {nilaiAjb ? formatRupiah(nilaiAjb) : '-'}
          </span>
        );
      }
    },
    { header: 'Progress', accessor: 'id', render: (_: unknown, row: Record<string, any>) => <ProgressIcons row={row} /> }
  ];

  const handleDeleteDokumenLainnya = async (docId: string) => {
    if (!currentCustomer) return;
    const isConfirm = window.confirm("Apakah Anda yakin ingin menghapus seluruh grup dokumen ini?");
    if (!isConfirm) return;
    try {
      const updatedDocs = currentCustomer.dokumenLainnya?.filter(
        (doc: any) => doc.id !== docId
      );
      await updateCustomerMutation.mutateAsync({
        id: currentCustomer.id,
        data: { dokumenLainnya: updatedDocs } as any
      });
      alert("Grup dokumen berhasil dihapus!");
    } catch (error: any) {
      alert(handleApiError(error).message);
    }
  };


  const handleDeleteSingleItemLainnya = async (docId: string, urlToDelete: string) => {
    if (!currentCustomer) return;
    const isConfirm = window.confirm("Apakah Anda yakin ingin menghapus file ini?");
    if (!isConfirm) return;

    try {
      const updatedDocs = currentCustomer.dokumenLainnya?.map((doc: any) => {
        if (doc.id === docId) {
          const fileUrls = Array.isArray(doc.fileUrl) ? doc.fileUrl : [doc.fileUrl];

          const newUrls = fileUrls.filter((url: string) => url !== urlToDelete);
          return { ...doc, fileUrl: newUrls };
        }
        return doc;
      }).filter((doc: any) => {
        const urls = Array.isArray(doc.fileUrl) ? doc.fileUrl : doc.fileUrl ? [doc.fileUrl] : [];
        return urls.length > 0 || isSp3kDokumen(doc.nama);
      });

      await updateCustomerMutation.mutateAsync({
        id: currentCustomer.id,
        data: { dokumenLainnya: updatedDocs } as any
      });
      alert("File berhasil dihapus!");
    } catch (error: any) {
      alert(handleApiError(error).message);
    }
  };

  const handleUploadProgress = async (docType: string, file: File, sertifikatUrutan = 1) => {
    if (!progressData) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hanya format gambar dan PDF yang diperbolehkan!");
      return;
    }
    const uploadKey = sertifikatUrutan > 1 ? `${sertifikatUrutan}-${docType}` : docType;
    setUploadingProgressDoc(uploadKey);
    try {
      await uploadMutation.mutateAsync({
        id: progressData.penjualanId,
        docType,
        file,
        sertifikatUrutan,
      });
      alert(`Dokumen berhasil diunggah!`);
    } catch (err: any) {
      alert(handleApiError(err).message);
    } finally {
      setUploadingProgressDoc(null);
    }
  };

  const handleDeleteProgressDoc = async (docType: string, sertifikatUrutan = 1, title = 'dokumen') => {
    if (!progressData) return;
    const slot = getProgressSlot(progressData, sertifikatUrutan);
    const fileUrl = slot[docType as keyof typeof slot] as string | null | undefined;
    if (!fileUrl) return;

    const isConfirm = window.confirm(`Apakah Anda yakin ingin menghapus ${title}?`);
    if (!isConfirm) return;

    const deleteKey = sertifikatUrutan > 1 ? `${sertifikatUrutan}-${docType}` : docType;
    setDeletingProgressDoc(deleteKey);
    try {
      await deleteProgressDocMutation.mutateAsync({
        id: progressData.penjualanId,
        docType,
        sertifikatUrutan,
      });
      alert(`${title} berhasil dihapus!`);
    } catch (err: any) {
      alert(handleApiError(err).message);
    } finally {
      setDeletingProgressDoc(null);
    }
  };

  const handleUploadCustDoc = async (docType: CustomerDocType, file: File) => {
    if (!currentCustomer) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hanya file gambar dan PDF yang diperbolehkan!");
      return;
    }

    if (file.type === 'application/pdf') {
      setPendingUpload({ type: 'cust', docType, files: [file] });
      setPdfPassword("");
      setShowPdfPasswordModal(true);
      return;
    }

    await doUploadCustDoc(docType, file);
  };

  const doUploadCustDoc = async (docType: CustomerDocType, file: File, password?: string) => {
    if (!currentCustomer) return;
    setUploadingCustDoc(docType);
    try {
      await uploadCustomerDocMutation.mutateAsync({
        id: currentCustomer.id,
        docType,
        file,
        pdfPassword: password,
      });
    } catch (error: any) {
      alert(handleApiError(error).message);
    } finally {
      setUploadingCustDoc(null);
    }
  };

  const isKodeBillingPphDoc = (name: string) =>
    name.trim().toLowerCase().startsWith(KODE_BILLING_PPH_DOC_NAME.toLowerCase());

  const isSuketPphDoc = (name: string) =>
    name.trim().toLowerCase().startsWith(SUKET_PPH_DOC_NAME.toLowerCase());

  const handleUploadLainnya = async (
    files: File[] | FileList,
    groupNameOverride?: string,
    sertifikatUrutan = 1,
  ) => {
    if (!currentCustomer) return;
    const docName = groupNameOverride || newDocName;
    if (!docName.trim()) {
      alert("Isi nama dokumen terlebih dahulu sebelum mengunggah file tambahan!");
      return;
    }

    if (isKodeBillingPphDoc(docName)) {
      const pdfFiles = Array.from(files).filter((f) => f.type === 'application/pdf');
      if (pdfFiles.length === 0) {
        alert("Kode Billing PPh hanya dapat diunggah dalam format PDF.");
        return;
      }
      if (pdfFiles.length > 1) {
        alert("Unggah satu file PDF Kode Billing PPh per kali upload.");
        return;
      }
      setPendingUpload({ type: 'kodeBillingPph', files: [pdfFiles[0]!], sertifikatUrutan });
      setPdfPassword("");
      setShowPdfPasswordModal(true);
      return;
    }

    if (isSuketPphDoc(docName)) {
      const validFiles = Array.from(files).filter(
        (f) => f.type.startsWith('image/') || f.type === 'application/pdf',
      );
      if (validFiles.length === 0) {
        alert("Suket PPh hanya dapat berupa gambar atau PDF.");
        return;
      }
      if (validFiles.length > 1) {
        alert("Unggah satu file Suket PPh per kavling per kali upload.");
        return;
      }
      const file = validFiles[0]!;
      if (file.type === 'application/pdf') {
        setPendingUpload({ type: 'suketPph', files: [file], sertifikatUrutan });
        setPdfPassword("");
        setShowPdfPasswordModal(true);
        return;
      }
      await doUploadSuketPph(file, undefined, sertifikatUrutan);
      return;
    }

    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (validFiles.length === 0) {
      alert("Hanya file gambar dan PDF yang diperbolehkan!");
      return;
    }

    const hasPdf = validFiles.some(f => f.type === 'application/pdf');
    if (hasPdf) {
      setPendingUpload({ type: 'lainnya', files: validFiles, groupName: docName });
      setPdfPassword("");
      setShowPdfPasswordModal(true);
      return;
    }

    await doUploadLainnya(validFiles, docName);
  };

  const doUploadSuketPph = async (file: File, password?: string, sertifikatUrutan = 1) => {
    if (!currentCustomer || !selectedPenjualan?.dbId) return;
    setUploadingCustDoc(`${SUKET_PPH_DOC_NAME}-${sertifikatUrutan}`);
    try {
      await uploadSuketPphMutation.mutateAsync({
        customerId: currentCustomer.id,
        penjualanId: selectedPenjualan.dbId,
        sertifikatUrutan,
        file,
        pdfPassword: password,
      });
      const existing =
        (isMultiSertifikat ? suketRecords : suketRecord ? [suketRecord] : []).find(
          (row) => (row?.sertifikatUrutan ?? 1) === sertifikatUrutan,
        );
      const action = existing ? 'diperbarui' : 'disimpan';
      const tanahLabel = isMultiSertifikat ? ` tanah ke-${sertifikatUrutan}` : '';
      alert(`Suket PPh${tanahLabel} untuk kavling ini berhasil ${action}!`);
    } catch (error: unknown) {
      alert(handleApiError(error).message);
    } finally {
      setUploadingCustDoc(null);
    }
  };

  const doUploadKodeBillingPph = async (file: File, password?: string, sertifikatUrutan = 1) => {
    if (!currentCustomer || !selectedPenjualan?.dbId) return;
    setUploadingCustDoc(`${KODE_BILLING_PPH_DOC_NAME}-${sertifikatUrutan}`);
    try {
      const penjualanId = Number(selectedPenjualan.dbId);
      const result = await uploadKodeBillingPphMutation.mutateAsync({
        customerId: currentCustomer.id,
        penjualanId,
        sertifikatUrutan,
        file,
        pdfPassword: password,
      });
      if (sertifikatUrutan === 1) {
        queryClient.setQueryData(
          kodeBillingPphPenjualanQueryKey(penjualanId),
          result,
        );
      }
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.invalidateQueries({ queryKey: ['kode-billing-pph', 'list'] });
      const existing =
        (isMultiSertifikat ? kodeBillingRecords : kodeBillingRecord ? [kodeBillingRecord] : []).find(
          (row) => (row?.sertifikatUrutan ?? 1) === sertifikatUrutan,
        );
      const action = existing ? 'diperbarui' : 'disimpan';
      const tanahLabel = isMultiSertifikat ? ` tanah ke-${sertifikatUrutan}` : '';
      alert(`Kode billing PPh${tanahLabel} kavling ini berhasil ${action}: ${result.kodeBilling}`);
    } catch (error: unknown) {
      alert(handleApiError(error).message);
    } finally {
      setUploadingCustDoc(null);
    }
  };

  const doUploadLainnya = async (files: File[], docName: string, password?: string) => {
    if (!currentCustomer) return;
    setUploadingCustDoc('lainnya');
    try {
      for (const file of files) {
        await uploadCustomerDocMutation.mutateAsync({
          id: currentCustomer.id,
          docType: 'lainnya',
          file,
          namaDokumen: docName,
          pdfPassword: file.type === 'application/pdf' ? password : undefined,
        });
      }
      setNewDocName("");
      alert("Dokumen pendukung berhasil diunggah/ditambahkan!");
    } catch (error: any) {
      alert(handleApiError(error).message);
    } finally {
      setUploadingCustDoc(null);
    }
  };


  const handleConfirmPdfPassword = async () => {
    setShowPdfPasswordModal(false);
    if (!pendingUpload) return;

    if (pendingUpload.type === 'cust' && pendingUpload.docType) {
      await doUploadCustDoc(pendingUpload.docType, pendingUpload.files[0]!, pdfPassword || undefined);
    } else if (pendingUpload.type === 'kodeBillingPph') {
      await doUploadKodeBillingPph(
        pendingUpload.files[0]!,
        pdfPassword || undefined,
        pendingUpload.sertifikatUrutan ?? 1,
      );
    } else if (pendingUpload.type === 'suketPph') {
      await doUploadSuketPph(
        pendingUpload.files[0]!,
        pdfPassword || undefined,
        pendingUpload.sertifikatUrutan ?? 1,
      );
    } else if (pendingUpload.type === 'lainnya' && pendingUpload.groupName) {
      await doUploadLainnya(pendingUpload.files, pendingUpload.groupName, pdfPassword || undefined);
    }

    setPendingUpload(null);
    setPdfPassword("");
  };

  const renderDokumenLainnyaGroup = (
    doc: { id: string; nama: string; fileUrl: string | string[] },
    options?: {
      hideDeleteGroup?: boolean;
      fileItems?: { url: string; docId: string }[];
      sertifikatUrutan?: number;
      kodeBilling?: string | null;
    }
  ) => {
    const slotUrutan = options?.sertifikatUrutan ?? 1;
    const isKodeBilling = isKodeBillingPphDoc(doc.nama);
    const isSuket = isSuketPphDoc(doc.nama);
    const isSingleFileSlot = isKodeBilling || isSuket;
    const rawUrls = Array.isArray(doc.fileUrl) ? doc.fileUrl : doc.fileUrl ? [doc.fileUrl] : [];
    const itemsFromOptions = options?.fileItems ?? [];
    const fileUrls =
      isSingleFileSlot && rawUrls.length > 0
        ? [rawUrls[0]!]
        : rawUrls.length > 0
          ? rawUrls
          : itemsFromOptions.map((item) => item.url).filter(Boolean);
    const fileItems = (
      itemsFromOptions.length > 0
        ? itemsFromOptions
        : fileUrls.map((url) => ({ url, docId: doc.id }))
    ).filter((item) => item.url && (fileUrls.length === 0 || fileUrls.includes(item.url)));
    const hasSingleSlotFile = isSingleFileSlot && fileItems.length > 0;
    const slotKodeBilling = options?.kodeBilling ?? (slotUrutan === 1 ? kodeBillingLatest : null);
    const isUploadingKodeBilling =
      uploadKodeBillingPphMutation.isPending &&
      uploadingCustDoc === `${KODE_BILLING_PPH_DOC_NAME}-${slotUrutan}`;
    const isUploadingSuket =
      uploadSuketPphMutation.isPending &&
      uploadingCustDoc === `${SUKET_PPH_DOC_NAME}-${slotUrutan}`;
    const isUploadingSlot = isUploadingKodeBilling || isUploadingSuket;

    return (
      <div key={doc.id} className="flex flex-col gap-3 p-3 border rounded-xl bg-slate-50 relative shadow-sm">
        <div className="flex justify-between items-start mb-2 border-b border-slate-200 pb-2">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 truncate pt-1" title={doc.nama}>
              {doc.nama}{' '}
              <span className="text-blue-500">
                {isSingleFileSlot
                  ? hasSingleSlotFile
                    ? '(1 File)'
                    : '(Belum ada)'
                  : `(${fileItems.length} File)`}
              </span>
            </span>
            {isKodeBilling && slotKodeBilling && (
              <span className="text-[9px] font-bold text-blue-600 mt-0.5 font-mono">
                Kode: {slotKodeBilling}
              </span>
            )}
            {isKodeBilling && (
              <span className="text-[8px] text-slate-400 mt-0.5">
                1 PDF per kavling — {hasSingleSlotFile ? 'tombol ganti untuk ubah file' : 'kode billing diekstrak otomatis'}
              </span>
            )}
            {isSuket && (
              <span className="text-[8px] text-slate-400 mt-0.5">
                1 file per kavling — {hasSingleSlotFile ? 'tombol ganti untuk ubah file' : 'upload suket untuk unit ini'}
              </span>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <label
              className={`p-1.5 rounded-lg transition-all z-30 cursor-pointer flex items-center gap-1 ${
                isKodeBilling
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  : 'bg-blue-50 text-blue-500 hover:text-blue-700 hover:bg-blue-100'
              }`}
              title={
                isKodeBilling
                  ? hasSingleSlotFile
                    ? 'Ganti File PDF'
                    : 'Upload PDF'
                  : isSuket
                    ? hasSingleSlotFile
                      ? 'Ganti File Suket'
                      : 'Upload Suket'
                    : 'Tambah File ke Grup Ini'
              }
            >
              {isUploadingSlot || (uploadCustomerDocMutation.isPending && !isSingleFileSlot) ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isSingleFileSlot && hasSingleSlotFile ? (
                <UploadCloud size={14} />
              ) : (
                <Plus size={14} />
              )}
              {isSingleFileSlot && hasSingleSlotFile && (
                <span className="text-[8px] font-bold uppercase pr-0.5">Ganti</span>
              )}
              <input
                type="file"
                multiple={!isSingleFileSlot}
                accept={isKodeBilling ? 'application/pdf' : 'image/*,application/pdf'}
                className="hidden"
                disabled={
                  uploadCustomerDocMutation.isPending ||
                  uploadKodeBillingPphMutation.isPending ||
                  uploadSuketPphMutation.isPending
                }
                onChange={(e) => {
                  if (e.target.files?.length) {
                    const canonicalName = isKodeBilling
                      ? KODE_BILLING_PPH_DOC_NAME
                      : isSuket
                        ? SUKET_PPH_DOC_NAME
                        : doc.nama;
                    handleUploadLainnya(e.target.files, canonicalName, slotUrutan);
                  }
                  e.target.value = '';
                }}
              />
            </label>
            {!options?.hideDeleteGroup && (
              <button
                type="button"
                onClick={() => handleDeleteDokumenLainnya(doc.id)}
                disabled={updateCustomerMutation.isPending}
                className="p-1.5 bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all z-30 disabled:opacity-50"
                title="Hapus Grup Dokumen"
              >
                {updateCustomerMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
          </div>
        </div>

        <div className={`grid gap-2 ${fileItems.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {fileItems.map((item, idx) => {
            const isPdf = item.url
              ? item.url.split('?')[0].toLowerCase().endsWith('.pdf')
                || item.url.includes('application/pdf')
                || item.url.includes('/raw/upload/')
              : false;
            return (
              <div
                key={`${item.docId}-${idx}`}
                className="h-32 w-full max-w-[240px] rounded-lg border-2 border-slate-200 flex items-center justify-center overflow-hidden relative group/item bg-white transition-all hover:border-blue-200"
              >
                {isPdf ? (
                  <iframe src={item.url} title={`${doc.nama}-${idx}`} className="w-full h-full border-none pointer-events-none" />
                ) : (
                  <img src={item.url} alt={doc.nama} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform" />
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 flex items-center justify-center gap-2 transition-opacity z-10">
                  <button onClick={() => window.open(item.url, '_blank')} className="p-1.5 bg-white text-slate-800 rounded-md hover:bg-slate-200 transition" title="Lihat">
                    <ZoomIn size={16} />
                  </button>
                  {!isSingleFileSlot && (
                    <button onClick={() => handleDeleteSingleItemLainnya(item.docId, item.url)} className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition" title="Hapus Gambar Ini">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {fileItems.length === 0 && (
            <div className="h-32 w-full max-w-[240px] rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center bg-white text-slate-400">
              <span className="text-[9px] font-bold uppercase">Belum ada file</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const sp3kDokumenSlots = useMemo(() => {
    const penjualanId = selectedPenjualan?.dbId;
    if (!penjualanId) return [];

    const buildSlot = (
      baseNama: string,
      url: string | undefined,
      sertifikatUrutan: number,
      recordId?: number,
      kodeBilling?: string,
    ) => {
      const nama = isMultiSertifikat
        ? `${baseNama} (Tanah ${sertifikatUrutan})`
        : baseNama;
      const fileUrls = url ? [url] : [];
      const docId = recordId
        ? String(recordId)
        : `placeholder-${baseNama}-${penjualanId}-${sertifikatUrutan}`;
      return {
        id: docId,
        nama,
        fileUrl: fileUrls,
        fileItems: fileUrls.map((u) => ({ url: u, docId })),
        sertifikatUrutan,
        kodeBilling: kodeBilling ?? null,
      };
    };

    if (isMultiSertifikat) {
      return Array.from({ length: jumlahSertifikatTanah }, (_, idx) => {
        const urutan = idx + 1;
        const billing = kodeBillingRecords.find(
          (row) => (row.sertifikatUrutan ?? 1) === urutan,
        );
        const suket = suketRecords.find(
          (row) => (row.sertifikatUrutan ?? 1) === urutan,
        );
        return [
          buildSlot(
            KODE_BILLING_PPH_DOC_NAME,
            billing?.fileBilling?.trim() || undefined,
            urutan,
            billing?.id,
            billing?.kodeBilling,
          ),
          buildSlot(
            SUKET_PPH_DOC_NAME,
            suket?.fileSuket,
            urutan,
            suket?.id,
          ),
        ];
      }).flat();
    }

    return [
      buildSlot(
        KODE_BILLING_PPH_DOC_NAME,
        kodeBillingFileUrl ?? undefined,
        1,
        kodeBillingRecord?.id,
        kodeBillingRecord?.kodeBilling,
      ),
      buildSlot(SUKET_PPH_DOC_NAME, suketRecord?.fileSuket, 1, suketRecord?.id),
    ];
  }, [
    selectedPenjualan?.dbId,
    isMultiSertifikat,
    jumlahSertifikatTanah,
    kodeBillingFileUrl,
    kodeBillingRecord,
    kodeBillingRecords,
    suketRecord,
    suketRecords,
  ]);

  const kprDokumenLainnya = useMemo(() => {
    const docs: { id: string; nama: string; fileUrl: string | string[] }[] = Array.isArray(currentCustomer?.dokumenLainnya)
      ? currentCustomer.dokumenLainnya
      : [];
    return docs.filter((doc) => !isSp3kDokumen(doc.nama));
  }, [currentCustomer?.dokumenLainnya]);

  const handleSaveNilaiAjb = async (urutan = 1) => {
    if (!progressData) return;
    try {
      await updateMutation.mutateAsync({
        id: progressData.penjualanId,
        data: {
          nilaiAjb: nilaiAjbInputs[urutan] ?? 0,
          sertifikatUrutan: urutan,
        },
      });
      const tanahLabel = isMultiSertifikat ? ` tanah ke-${urutan}` : '';
      alert(`Nilai AJB${tanahLabel} & pajak otomatis berhasil dihitung dan disimpan!`);
    } catch (err: any) {
      alert(handleApiError(err).message);
    }
  };

  const handleSaveChecklist = async () => {
    if (!progressData) return;
    try {
      const obj: Record<string, string> = {};
      checklist.forEach(c => { if (c.key.trim()) obj[c.key.trim()] = c.value.trim(); });
      await updateMutation.mutateAsync({ id: progressData.penjualanId, data: { checklistBast: Object.keys(obj).length > 0 ? obj : null } });
      alert("Checklist BAST berhasil disimpan!");
    } catch (err: any) {
      alert(handleApiError(err).message);
    }
  };
  const renderNilaiAjbBox = (urutan = 1) => {
    const nilaiAjbInput = nilaiAjbInputs[urutan] ?? 0;
    const { biayaPph: calculatedPph, biayaBphtb: calculatedBphtb } =
      calcPajakFromNilaiAjb(nilaiAjbInput);

    return (
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-between">
        <div>
          <CurrencyInput
            label="Nilai AJB"
            name={`nilaiAjb-${urutan}`}
            value={nilaiAjbInput}
            onValueChange={(_, val) =>
              setNilaiAjbInputs((prev) => ({ ...prev, [urutan]: val }))
            }
            placeholder="0"
          />
          <div className="grid grid-cols-2 gap-3 mt-3 border-t border-blue-200/50 pt-3">
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase">BPHTB</p>
              <p className="text-sm font-black text-slate-900 tabular-nums">
                {formatRupiah(calculatedBphtb)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase">PPh (2.5%)</p>
              <p className="text-sm font-black text-slate-900 tabular-nums">
                {formatRupiah(calculatedPph)}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => handleSaveNilaiAjb(urutan)}
          disabled={updateMutation.isPending}
          className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Menyimpan...' : 'Hitung & Simpan Nilai AJB'}
        </button>
      </div>
    );
  };

  const renderFileBox = (title: string, docType: string, url: string | null, urutan = 1, showDelete = false) => {
    const uploadKey = urutan > 1 ? `${urutan}-${docType}` : docType;
    const isPdf = url ? (url.split('?')[0].toLowerCase().endsWith('.pdf') || url.includes('application/pdf')) : false;
    const isUploading = uploadMutation.isPending && uploadingProgressDoc === uploadKey;
    const isDeleting = deleteProgressDocMutation.isPending && deletingProgressDoc === uploadKey;
    const isDrag = dragActive === uploadKey;

    return (
      <div
        className={`bg-white p-4 rounded-xl border flex flex-col gap-3 transition-all relative overflow-hidden outline-none focus-within:ring-2 focus-within:ring-blue-400
          ${isDrag ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-200'}
        `}
        tabIndex={0}
        onDragEnter={(e) => handleDrag(e, uploadKey)}
        onDragLeave={(e) => handleDrag(e, uploadKey)}
        onDragOver={(e) => handleDrag(e, uploadKey)}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation(); setDragActive(null);
          const file = e.dataTransfer.files?.[0];
          if (file) handleUploadProgress(docType, file, urutan);
        }}
        onPaste={(e) => handlePaste(e, (files) => handleUploadProgress(docType, files[0], urutan))}
      >
        <div className="flex justify-between items-center relative z-10">
          <div className="flex flex-col">
            <h5 className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">{title}</h5>
            {urutan > 1 && (
              <span className="text-[9px] text-blue-600 font-bold">Sertifikat Tanah ke-{urutan}</span>
            )}
            <span className="text-[9px] text-slate-400 font-medium">Drag / Paste file di sini</span>
          </div>
          <div className="flex gap-1">
            {showDelete && url && (
              <button
                type="button"
                onClick={() => handleDeleteProgressDoc(docType, urutan, title)}
                disabled={isUploading || isDeleting}
                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-200 transition-all hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Hapus File"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
            <label className={`flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all ${isUploading || isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 cursor-pointer'}`}>
              {isUploading ? (
                <><Loader2 size={14} className="animate-spin text-blue-600" /> Mengunggah...</>
              ) : (
                <><UploadCloud size={14} /> {url ? 'Ganti File' : 'Upload File'}</>
              )}
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadProgress(docType, file, urutan);
                e.target.value = '';
              }} disabled={uploadMutation.isPending || isDeleting} />
            </label>
          </div>
        </div>

        <div className={`w-full h-64 bg-slate-100 rounded-lg border overflow-hidden relative group transition-all ${isDrag ? 'border-blue-400 border-dashed' : 'border-slate-200'}`}>
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
              <span className="text-xs font-bold text-blue-600 animate-pulse">Sedang mengunggah...</span>
            </div>
          )}
          {isDeleting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <Loader2 size={32} className="animate-spin text-red-600 mb-3" />
              <span className="text-xs font-bold text-red-600 animate-pulse">Sedang menghapus...</span>
            </div>
          )}
          {url ? (
            <>
              {isPdf ? (
                <iframe src={url} className="w-full h-full border-none" title={title} />
              ) : (
                <img src={url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                <a href={url} target="_blank" rel="noopener noreferrer" className="pointer-events-auto px-4 py-2 bg-white text-slate-800 text-xs font-bold rounded-lg shadow-md hover:bg-slate-50 transition-colors">
                  Buka di Tab Baru
                </a>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 pointer-events-none">
              <span className="text-[10px] font-medium italic text-center px-4">Area Upload<br />Klik / Drag & Drop / Paste</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAjbDetailForm = (urutan = 1) => {
    const ajbForm = ajbForms[urutan] ?? { nomor: '', tanggal: '' };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
        {isMultiSertifikat && (
          <p className="md:col-span-2 text-[11px] font-bold text-blue-700 uppercase tracking-wide">
            Sertifikat Tanah ke-{urutan}
          </p>
        )}
        <Input
          label="Nomor AJB Resmi"
          value={ajbForm.nomor}
          onChange={(e) =>
            setAjbForms((prev) => ({
              ...prev,
              [urutan]: { ...ajbForm, nomor: e.target.value },
            }))
          }
          placeholder="Masukkan nomor AJB..."
        />
        <Input
          label="Tanggal AJB"
          type="date"
          value={ajbForm.tanggal}
          onChange={(e) =>
            setAjbForms((prev) => ({
              ...prev,
              [urutan]: { ...ajbForm, tanggal: e.target.value },
            }))
          }
        />
        <div className="md:col-span-2">
          <button
            onClick={async () => {
              try {
                await updateMutation.mutateAsync({
                  id: progressData!.penjualanId,
                  data: {
                    nomorAjb: ajbForm.nomor,
                    tanggalAjb: ajbForm.tanggal,
                    sertifikatUrutan: urutan,
                  },
                });
                const tanahLabel = isMultiSertifikat ? ` tanah ke-${urutan}` : '';
                alert(`Detail nomor & tanggal AJB${tanahLabel} berhasil disimpan!`);
              } catch (e: any) {
                alert(handleApiError(e).message);
              }
            }}
            disabled={updateMutation.isPending}
            className="w-full px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Detail AJB'}
          </button>
        </div>
      </div>
    );
  };

  const renderNotarisBox = () => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
      <Select
        label="Pilih Notaris"
        value={notarisForm.notarisId}
        onChange={(e) => setNotarisForm({ ...notarisForm, notarisId: e.target.value })}
        options={[
          { value: '', label: '-- Pilih Notaris --' },
          ...notarisList.map((n) => ({ value: n.id.toString(), label: n.nama })),
        ]}
      />
      <CurrencyInput
        label="Biaya Notaris (Rp)"
        name="biayaNotaris"
        value={notarisForm.biayaNotaris}
        onValueChange={(_, val) => setNotarisForm({ ...notarisForm, biayaNotaris: val })}
        placeholder="0"
      />
      <button
        type="button"
        onClick={handleSaveNotaris}
        disabled={updateMutation.isPending}
        className="w-full mt-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition cursor-pointer disabled:opacity-50"
      >
        {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Notaris'}
      </button>
    </div>
  );

  const renderChecklistBast = () => (
    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mt-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
        <h5 className="text-sm font-bold text-slate-800">Checklist BAST / Komplain Customer</h5>
        <button type="button" onClick={() => setChecklist([...checklist, { key: '', value: '' }])} className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition cursor-pointer">
          <Plus size={14} /> Tambah Ceklis
        </button>
      </div>
      <div className="space-y-3 mb-4">
        {checklist.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4 bg-white border border-slate-100 rounded-lg">Belum ada data checklist BAST.</p>
        ) : (
          checklist.map((c, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <input type="text" placeholder="Bagian (Contoh: Cat Dinding)" value={c.key} onChange={(e) => { const newArr = [...checklist]; newArr[idx].key = e.target.value; setChecklist(newArr); }} className="w-1/3 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-black" />
              <input type="text" placeholder="Catatan / Status (Contoh: Ada retak rambut sedikit)" value={c.value} onChange={(e) => { const newArr = [...checklist]; newArr[idx].value = e.target.value; setChecklist(newArr); }} className="w-2/3 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-black" />
              <button type="button" onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition cursor-pointer shrink-0"><Trash2 size={14} /></button>
            </div>
          ))
        )}
      </div>
      <div className="flex justify-end">
        <button onClick={handleSaveChecklist} disabled={updateMutation.isPending} className="px-5 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition cursor-pointer disabled:opacity-50 shadow-md">
          {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Checklist BAST'}
        </button>
      </div>
    </div>
  );

  if (loadingPenjualan || loadingCustomers) return <PageLoader />;

  return (
    <div className="min-h-screen bg-[#f7f8fc] relative">
      {/* Top ambient gradient */}
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-50/60 to-transparent pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-5 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* Header Halaman Dashboard */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/80 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-500 to-violet-500" />
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-1 h-14 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                  Manajemen Dokumen
                </p>
                <h1 className="text-[26px] font-black text-slate-900 tracking-tight leading-none">
                  Progress Penjualan
                </h1>
                <p className="text-[12px] text-slate-400 mt-1.5 font-medium">
                  Pantau kelengkapan berkas, sertifikat, dan legalitas tiap kavling customer
                </p>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          title="Progress"
          columns={columns}       
        data={penjualanData}
        serverSide={true}
        toolbarPrefix={tableToolbar}
        searchTerm={search}
        onSearchChange={handleSearchChange}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={handlePageChange}
        pageSize={limit}
        pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
        onPageSizeChange={handlePageSizeChange}
      />

      <Modal isOpen={!!modalStep} onClose={() => { setModalStep(null); setSelectedPenjualan(null); }} title="Kelola Progress Dokumen Penjualan">
        {selectedPenjualan && (
         <div className="space-y-6">
          <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white shadow-lg shadow-slate-900/20 flex justify-between items-center relative overflow-hidden border border-slate-700">
            {/* Ornamen background opsional */}
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Landmark size={80} />
            </div>
            
            <div className="relative z-10">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Skema Pembayaran</p>
              <p className="text-2xl font-black tracking-tight text-white">{selectedPenjualan.caraPembayaran?.replace(/_/g, ' ')}</p>
            </div>
            <div className="text-right relative z-10">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Customer / Kavling</p>
              <p className="text-base font-bold text-white tracking-wide">{selectedPenjualan.nama}</p>
              <p className="text-xs text-blue-300 font-medium mt-0.5">Blok {selectedPenjualan.blok}-{selectedPenjualan.nomorUnit}</p>
            </div>
          </div>

            {loadingProgress ? (
              <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
            ) : progressData ? (
              <div className="space-y-6">

                {modalStep === 'VALIDASI_BERKAS' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-100 pb-3 mb-4 gap-3">
                        <h4 className="text-sm font-bold text-slate-800">Tahap 1: Validasi Berkas KPR</h4>
                        <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors w-fit">
                          <input type="checkbox" checked={progressData.berkasCustomerValid} onChange={(e) => updateMutation.mutate({ id: progressData.penjualanId, data: { berkasCustomerValid: e.target.checked } })} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-widest mt-0.5">Tandai Valid & Siap KPR</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {(['fileKtp', 'fileKk', 'fileNpwp'] as const).map((type) => {
                          const isUploading = uploadCustomerDocMutation.isPending && uploadingCustDoc === type;
                          const fileUrl = currentCustomer?.[type] as string | undefined;
                          const isPdf = fileUrl ? (fileUrl.split('?')[0].toLowerCase().endsWith('.pdf') || fileUrl.includes('application/pdf')) : false;
                          const isDrag = dragActive === type;

                          return (
                            <div
                              key={type}
                              className={`flex flex-col gap-3 p-4 border rounded-2xl transition-all group shadow-sm relative overflow-hidden outline-none focus-within:ring-2 focus-within:ring-blue-400
                                ${isDrag ? 'border-blue-500 bg-blue-50' : 'bg-slate-50/50 hover:bg-white'}
                              `}
                              tabIndex={0}
                              onDragEnter={(e) => handleDrag(e, type)}
                              onDragLeave={(e) => handleDrag(e, type)}
                              onDragOver={(e) => handleDrag(e, type)}
                              onDrop={(e) => {
                                e.preventDefault(); e.stopPropagation(); setDragActive(null);
                                const file = e.dataTransfer.files?.[0];
                                if (file) handleUploadCustDoc(type, file);
                              }}
                              onPaste={(e) => handlePaste(e, (files) => handleUploadCustDoc(type, files[0]))}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                  {type.replace('file', '')}
                                </span>
                                <span className="text-[9px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                  Drag / Paste
                                </span>
                              </div>
                              <div
                                onClick={() => !isUploading && fileUrl && window.open(fileUrl, '_blank')}
                                className={`aspect-video w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden relative transition-all ${fileUrl ? 'border-slate-200 cursor-pointer hover:border-blue-400' : 'border-slate-300 bg-slate-100'}`}
                              >
                                {isUploading && (
                                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                    <Loader2 size={24} className="animate-spin text-blue-600 mb-2" />
                                    <span className="text-[10px] font-bold text-blue-600 animate-pulse">Mengunggah...</span>
                                  </div>
                                )}
                                {fileUrl ? (
                                  <>
                                    {isPdf ? (
                                      <iframe src={fileUrl} title={type} className="w-full h-full border-none pointer-events-none" />
                                    ) : (
                                      <img src={fileUrl} alt={type} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    )}
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <ZoomIn size={20} className="text-white" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center gap-1 text-slate-400 pointer-events-none">
                                    <ImageIcon size={24} strokeWidth={1.5} />
                                    <span className="text-[9px] font-bold">KOSONG</span>
                                  </div>
                                )}
                              </div>
                              <FileInput
                                label={isUploading ? "Mengunggah..." : "Upload / Ganti"}
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadCustDoc(type, file);
                                  e.target.value = '';
                                }}
                                disabled={uploadCustomerDocMutation.isPending}
                              />
                            </div>
                          )
                        })}
                      </div>

                      <div className="pt-4 border-t border-slate-100 space-y-4">
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <PlusCircle size={14} className="text-blue-600" /> Dokumen Pendukung KPR (Slip Gaji, Mutasi, dll)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {kprDokumenLainnya.map((doc) => renderDokumenLainnyaGroup(doc))}

                          <div
                            className={`flex flex-col gap-3 p-3 border-2 border-dashed rounded-xl relative overflow-hidden outline-none focus-within:ring-2 focus-within:ring-blue-400 transition-all
                              ${dragActive === 'lainnya' ? 'border-blue-500 bg-blue-100/50' : 'border-blue-200 bg-blue-50/30'}`}
                            tabIndex={0}
                            onDragEnter={(e) => handleDrag(e, 'lainnya')}
                            onDragLeave={(e) => handleDrag(e, 'lainnya')}
                            onDragOver={(e) => handleDrag(e, 'lainnya')}
                            onDrop={(e) => {
                              e.preventDefault(); e.stopPropagation(); setDragActive(null);
                              if (e.dataTransfer.files?.length > 0) handleUploadLainnya(e.dataTransfer.files);
                            }}
                            onPaste={(e) => handlePaste(e, handleUploadLainnya)}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-blue-600 uppercase">Input Grup Baru</span>
                              <span className="text-[9px] text-blue-500/70 font-medium bg-blue-100/50 px-1.5 py-0.5 rounded">Drag / Paste Di Sini</span>
                            </div>
                            {uploadingCustDoc === 'lainnya' && (
                              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                <Loader2 size={24} className="animate-spin text-blue-600 mb-2" />
                                <span className="text-[10px] font-bold text-blue-600 animate-pulse">Mengunggah...</span>
                              </div>
                            )}
                            <div className="w-full">
                              <input
                                type="text"
                                value={newDocName}
                                onChange={(e) => setNewDocName(e.target.value)}
                                placeholder="Nama Dok. (Cth: Slip Gaji)"
                                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white text-slate-900 placeholder:text-slate-400"
                              />
                            </div>
                            <FileInput
                              label="Pilih File Manual"
                              accept="image/*,application/pdf"
                              multiple
                              onChange={(e) => {
                                if (e.target.files?.length) handleUploadLainnya(e.target.files);
                                e.target.value = '';
                              }}
                              disabled={uploadCustomerDocMutation.isPending}
                            />
                          </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {modalStep === 'SERTIFIKAT_KAVLING' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Tahap 2: Sertifikat Kavling</h4>
                      {Array.from({ length: jumlahSertifikatTanah }, (_, idx) => idx + 1).map((urutan) => (
                        <div key={urutan} className={isMultiSertifikat ? 'mb-6 last:mb-0' : ''}>
                          {isMultiSertifikat && (
                            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-3">
                              Sertifikat Tanah ke-{urutan}
                            </p>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {renderKavlingFileBox("PBG", "filePbg", getSertifikatTanahFileUrl("filePbg", urutan), urutan)}
                            {renderKavlingFileBox("Tanah", "fileSertifikatTanah", getSertifikatTanahFileUrl("fileSertifikatTanah", urutan), urutan)}
                            {renderKavlingFileBox("PBB", "fileNopPbb", getSertifikatTanahFileUrl("fileNopPbb", urutan), urutan)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {modalStep === 'SP3K' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Tahap SP3K & Biaya Notaris</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          {renderFileBox("Dokumen SP3K Bank", "fileSp3k", progressData.fileSp3k)}
                          {renderFileBox(
                            "Surat Kesiapan Akad Kredit",
                            "fileSuratPernyataanAkadKredit",
                            progressData.fileSuratPernyataanAkadKredit,
                          )}
                        </div>

                        <div className="space-y-4">
                          {renderNotarisBox()}
                          {Array.from({ length: jumlahSertifikatTanah }, (_, idx) => idx + 1).map((urutan) => (
                            <div key={urutan}>
                              {isMultiSertifikat && (
                                <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-3">
                                  Nilai AJB Tanah ke-{urutan}
                                </p>
                              )}
                              {renderNilaiAjbBox(urutan)}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 mt-6 border-t border-slate-100">
                        <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <PlusCircle size={14} className="text-blue-600" /> Dokumen PPh SP3K
                        </h4>
                        {sp3kUnitLabel && (
                          <p className="text-[10px] text-slate-500 mb-3 font-medium">
                            <span className="text-blue-600 font-bold">{sp3kUnitLabel}</span>
                          </p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sp3kDokumenSlots.map((slot) =>
                            renderDokumenLainnyaGroup(slot, {
                              hideDeleteGroup: true,
                              fileItems: slot.fileItems,
                              sertifikatUrutan: slot.sertifikatUrutan,
                              kodeBilling: slot.kodeBilling,
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {modalStep === 'PPJB' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Dokumen Pengikatan Jual Beli (PPJB) & Biaya Notaris</h4>

                      <div className="space-y-6">
                        {renderNotarisBox()}
                        {Array.from({ length: jumlahSertifikatTanah }, (_, idx) => idx + 1).map((urutan) => (
                          <div key={urutan} className={isMultiSertifikat ? 'pt-2 border-t border-slate-100 first:border-t-0 first:pt-0' : ''}>
                            {isMultiSertifikat && (
                              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-3">
                                Sertifikat Tanah ke-{urutan}
                              </p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {renderFileBox(
                                "Dokumen PPJB",
                                "filePpjb",
                                getProgressSlot(progressData, urutan).filePpjb ?? null,
                                urutan,
                              )}
                              {renderNilaiAjbBox(urutan)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {modalStep === 'AJB' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Dokumen Akta Jual Beli (AJB)</h4>

                      {Array.from({ length: jumlahSertifikatTanah }, (_, idx) => idx + 1).map((urutan) => (
                        <div key={urutan} className={isMultiSertifikat ? 'mb-6 last:mb-0' : ''}>
                          {renderAjbDetailForm(urutan)}
                          {renderFileBox(
                            "Scan Dokumen AJB",
                            "fileAjb",
                            getProgressSlot(progressData, urutan).fileAjb ?? null,
                            urutan,
                            true,
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {modalStep === 'BAST' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Dokumen Serah Terima (BAST) & Checklist</h4>
                      <div className="mb-6">
                        {renderFileBox("Dokumen BAST", "fileBast", progressData.fileBast)}
                      </div>
                      {renderChecklistBast()}
                    </div>
                  </div>
                )}

              </div>
            ) : null}

            <div className="flex justify-end pt-4 sticky bottom-0 bg-white border-t border-slate-100 mt-6 -mx-4 -mb-4 px-4 py-4 z-20">
              <button onClick={() => { setModalStep(null); setSelectedPenjualan(null); }} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-md cursor-pointer">
                Tutup Manajemen Progress
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={showPdfPasswordModal}
        onClose={() => { setShowPdfPasswordModal(false); setPendingUpload(null); setPdfPassword(""); }}
        title="File PDF Terkunci"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Masukkan password untuk membuka PDF ini. Kosongkan jika PDF tidak memiliki password.
          </p>
          <input
            type="password"
            value={pdfPassword}
            onChange={(e) => setPdfPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmPdfPassword()}
            placeholder="Password PDF (kosongkan jika tidak ada)"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900"
            autoFocus
          />
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => { setShowPdfPasswordModal(false); setPendingUpload(null); setPdfPassword(""); }}
              className="flex-1 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmPdfPassword}
              className="flex-1 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition cursor-pointer"
            >
              Upload PDF
            </button>
          </div>
        </div>
      </Modal>

    </div>
  </div>
  );
};

export default ProgressPenjualan;
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import CurrencyInput from "../../components/shared/CurrencyInput";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import { formatRupiah } from "../../utils/formatters";
import { useGetPenjualan } from "../../hooks/queries/usePenjualan";
import { useGetCustomers, useUpdateCustomer, useUploadCustomerDoc } from "../../hooks/queries/useCustomer";
import type { CustomerDocType } from "../../services/customer.service";
import {
  useGetProgressPenjualan,
  useUpdateProgressPenjualan,
  useUploadProgressDocument
} from "../../hooks/queries/useProgressPenjualan";
import {
  Trash2, Plus, UploadCloud,
  UserCheck, Landmark, ScrollText, Key, FileSignature, ImageIcon, ZoomIn, PlusCircle,
  Loader2,
  Map
} from 'lucide-react';
import Input from '../../components/shared/Input';
import { handleApiError } from '../../utils/errorHandler';
import { useGetNotaris } from '../../hooks/queries/useNotaris';
import Select from '../../components/shared/Select';
import { useUploadKavlingDocument } from '../../hooks/queries/useKavling';
import { useQueryClient } from '@tanstack/react-query';

const SP3K_DOKUMEN_NAME = 'Kode Billing PPh dan Suket PPh';

const LEGACY_SP3K_DOKUMEN_NAMES = ['Kode Billing PPh', 'Suket PPh'];

const isSp3kDokumen = (nama: string) => {
  const key = nama?.trim().toLowerCase();
  return (
    key === SP3K_DOKUMEN_NAME.toLowerCase() ||
    LEGACY_SP3K_DOKUMEN_NAMES.some((n) => n.toLowerCase() === key)
  );
};

const ProgressPenjualan = () => {
  const { data: penjualanResponse, isLoading: loadingPenjualan } = useGetPenjualan({ limit: 500 });
  const { data: notarisList = [] } = useGetNotaris();
  const penjualanData = useMemo(() => penjualanResponse?.items || [], [penjualanResponse?.items]);
  const { data: customers = [], isLoading: loadingCustomers } = useGetCustomers();

  const updateMutation = useUpdateProgressPenjualan();
  const uploadMutation = useUploadProgressDocument();
  const uploadCustomerDocMutation = useUploadCustomerDoc();
  const updateCustomerMutation = useUpdateCustomer();
  const uploadKavlingDocMutation = useUploadKavlingDocument();
  const queryClient = useQueryClient();
  const [uploadingKavlingDoc, setUploadingKavlingDoc] = useState<string | null>(null);

  const [selectedPenjualan, setSelectedPenjualan] = useState<Record<string, any> | null>(null);
  const [modalStep, setModalStep] = useState<string | null>(null);
  const [newDocName, setNewDocName] = useState("");
  const [notarisForm, setNotarisForm] = useState({ notarisId: '', biayaNotaris: 0 });
  const [uploadingProgressDoc, setUploadingProgressDoc] = useState<string | null>(null);
  const [uploadingCustDoc, setUploadingCustDoc] = useState<string | null>(null);
  const [pdfPassword, setPdfPassword] = useState("");
  const [showPdfPasswordModal, setShowPdfPasswordModal] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{
    type: 'cust' | 'lainnya';
    docType?: CustomerDocType;
    files: File[];
    groupName?: string;
  } | null>(null);


  const [dragActive, setDragActive] = useState<string | null>(null);

  const activePenjualan = useMemo(() => {
    return penjualanData.filter((p: Record<string, any>) => p.status !== 'BATAL');
  }, [penjualanData]);

  const currentCustomer = useMemo(() => {
    if (!selectedPenjualan) return null;
    return customers.find((c: Record<string, any>) => c.nikKtp === selectedPenjualan.noIdentitas);
  }, [selectedPenjualan, customers]);

  const { data: progressData, isLoading: loadingProgress } = useGetProgressPenjualan(
    selectedPenjualan ? selectedPenjualan.dbId : null
  );

  const [checklist, setChecklist] = useState<{ key: string; value: string }[]>([]);
  const [nilaiAjbInput, setNilaiAjbInput] = useState<number>(0);
  const [ajbForm, setAjbForm] = useState({ nomor: '', tanggal: '' });
  const calculatedPph = nilaiAjbInput ? nilaiAjbInput * 0.025 : 0;
  const calculatedBphtb = nilaiAjbInput ? Math.max(0, nilaiAjbInput - 80000000) * 0.05 : 0;

  useEffect(() => {
    if (progressData) {
      setNilaiAjbInput(progressData.nilaiAjb || 0);
      setNotarisForm({
        notarisId: progressData.notarisId ? String(progressData.notarisId) : '',
        biayaNotaris: progressData.biayaNotaris || 0
      });
      setAjbForm({
        nomor: progressData.nomorAjb || '',
        tanggal: progressData.tanggalAjb ? new Date(progressData.tanggalAjb).toISOString().split('T')[0] : ''
      });
      if (progressData.checklistBast) {
        const arr = Object.entries(progressData.checklistBast).map(([k, v]) => ({ key: k, value: String(v || '') }));
        setChecklist(arr);
      } else {
        setChecklist([]);
      }
    }
  }, [progressData]);

  useEffect(() => {
    if (!['VALIDASI_BERKAS', 'SP3K'].includes(modalStep ?? '') || !currentCustomer?.id || updateCustomerMutation.isPending) return;

    const docs: { id: string; nama: string; fileUrl: string | string[] }[] = Array.isArray(currentCustomer.dokumenLainnya)
      ? currentCustomer.dokumenLainnya
      : [];
    const hasSlot = docs.some((d) => d.nama?.trim().toLowerCase() === SP3K_DOKUMEN_NAME.toLowerCase());
    if (hasSlot) return;

    const updatedDocs = [
      ...docs,
      { id: `sp3k-${Date.now()}`, nama: SP3K_DOKUMEN_NAME, fileUrl: [] as string[] },
    ];

    updateCustomerMutation.mutate({
      id: currentCustomer.id,
      data: { dokumenLainnya: updatedDocs } as any,
    });
  }, [modalStep, currentCustomer?.id]);

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

  const handleUploadKavlingDoc = async (docType: string, file: File) => {
    if (!selectedPenjualan) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hanya format gambar dan PDF yang diperbolehkan!");
      return;
    }
    setUploadingKavlingDoc(docType);
    try {
      await uploadKavlingDocMutation.mutateAsync({ id: selectedPenjualan.kavlingId, docType, file });
      alert(`Dokumen kavling berhasil diunggah!`);

      const fileUrl = URL.createObjectURL(file);
      setSelectedPenjualan((prev: any) => prev ? { ...prev, [docType]: fileUrl } : prev);
      queryClient.invalidateQueries({ queryKey: ["penjualan"] });
    } catch (err: any) {
      alert(handleApiError(err).message);
    } finally {
      setUploadingKavlingDoc(null);
    }
  };

  const renderKavlingFileBox = (title: string, docType: string, url: string | null) => {
    const isPdf = url ? (url.split('?')[0].toLowerCase().endsWith('.pdf') || url.includes('application/pdf') || url.startsWith('blob:')) : false;
    const isUploading = uploadKavlingDocMutation.isPending && uploadingKavlingDoc === docType;
    const isDrag = dragActive === docType;

    return (
      <div
        className={`bg-white p-4 rounded-xl border flex flex-col gap-3 transition-all relative overflow-hidden outline-none focus-within:ring-2 focus-within:ring-indigo-400
          ${isDrag ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-200'}
        `}
        tabIndex={0}
        onDragEnter={(e) => handleDrag(e, docType)}
        onDragLeave={(e) => handleDrag(e, docType)}
        onDragOver={(e) => handleDrag(e, docType)}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation(); setDragActive(null);
          const file = e.dataTransfer.files?.[0];
          if (file) handleUploadKavlingDoc(docType, file);
        }}
        onPaste={(e) => handlePaste(e, (files) => handleUploadKavlingDoc(docType, files[0]))}
      >
        <div className="flex justify-between items-center relative z-10">
          <div className="flex flex-col">
            <h5 className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">{title}</h5>
            <span className="text-[9px] text-slate-400 font-medium">Drag / Paste file di sini</span>
          </div>
          <label className={`flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer'}`}>
            {isUploading ? (
              <><Loader2 size={14} className="animate-spin text-indigo-600" /> Mengunggah...</>
            ) : (
              <><UploadCloud size={14} /> {url ? 'Ganti File' : 'Upload File'}</>
            )}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadKavlingDoc(docType, file);
              e.target.value = '';
            }} disabled={uploadKavlingDocMutation.isPending} />
          </label>
        </div>

        <div className={`w-full h-64 bg-slate-100 rounded-lg border overflow-hidden relative group transition-all ${isDrag ? 'border-indigo-400 border-dashed' : 'border-slate-200'}`}>
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <Loader2 size={32} className="animate-spin text-indigo-600 mb-3" />
              <span className="text-xs font-bold text-indigo-600 animate-pulse">Sedang mengunggah...</span>
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
    const hasSertifikat = !!(row.filePbg && row.fileSertifikatTanah && row.fileNopPbb);
    const hasAnySertifikat = !!(row.filePbg || row.fileSertifikatTanah || row.fileNopPbb);

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
          <LineNode active={!!safeProgress.fileAjb} />
          <IconNode active={!!safeProgress.fileAjb} icon={ScrollText} title="4. AJB" step="AJB" />
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
          <LineNode active={!!safeProgress.filePpjb} />
          <IconNode active={!!safeProgress.filePpjb} icon={FileSignature} title="3. PPJB" step="PPJB" />
          <LineNode active={!!safeProgress.fileAjb} />
          <IconNode active={!!safeProgress.fileAjb} icon={ScrollText} title="4. AJB" step="AJB" />
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
          <LineNode active={!!safeProgress.fileAjb} />
          <IconNode active={!!safeProgress.fileAjb} icon={ScrollText} title="3. AJB" step="AJB" />
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

  const handleUploadProgress = async (docType: string, file: File) => {
    if (!progressData) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hanya format gambar dan PDF yang diperbolehkan!");
      return;
    }
    setUploadingProgressDoc(docType);
    try {
      await uploadMutation.mutateAsync({ id: progressData.penjualanId, docType, file });
      alert(`Dokumen berhasil diunggah!`);
    } catch (err: any) {
      alert(handleApiError(err).message);
    } finally {
      setUploadingProgressDoc(null);
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

  const handleUploadLainnya = async (files: File[] | FileList, groupNameOverride?: string) => {
    if (!currentCustomer) return;
    const docName = groupNameOverride || newDocName;
    if (!docName.trim()) {
      alert("Isi nama dokumen terlebih dahulu sebelum mengunggah file tambahan!");
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
    } else if (pendingUpload.type === 'lainnya' && pendingUpload.groupName) {
      await doUploadLainnya(pendingUpload.files, pendingUpload.groupName, pdfPassword || undefined);
    }

    setPendingUpload(null);
    setPdfPassword("");
  };

  const renderDokumenLainnyaGroup = (
    doc: { id: string; nama: string; fileUrl: string | string[] },
    options?: { hideDeleteGroup?: boolean; fileItems?: { url: string; docId: string }[] }
  ) => {
    const fileUrls = Array.isArray(doc.fileUrl) ? doc.fileUrl : doc.fileUrl ? [doc.fileUrl] : [];
    const fileItems = options?.fileItems ?? fileUrls.map((url) => ({ url, docId: doc.id }));

    return (
      <div key={doc.id} className="flex flex-col gap-3 p-3 border rounded-xl bg-slate-50 relative shadow-sm">
        <div className="flex justify-between items-start mb-2 border-b border-slate-200 pb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 truncate pr-2 pt-1" title={doc.nama}>
            {doc.nama} <span className="text-blue-500">({fileItems.length} File)</span>
          </span>
          <div className="flex gap-1 shrink-0">
            <label className="p-1.5 bg-blue-50 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all z-30 cursor-pointer" title="Tambah File ke Grup Ini">
              {uploadCustomerDocMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                disabled={uploadCustomerDocMutation.isPending}
                onChange={(e) => {
                  if (e.target.files?.length) handleUploadLainnya(e.target.files, doc.nama);
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
            const isPdf = item.url ? (item.url.split('?')[0].toLowerCase().endsWith('.pdf') || item.url.includes('application/pdf')) : false;
            return (
              <div
                key={`${item.docId}-${idx}`}
                className="aspect-video w-full rounded-lg border-2 border-slate-200 flex items-center justify-center overflow-hidden relative group/item bg-white transition-all hover:border-indigo-200"
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
                  <button onClick={() => handleDeleteSingleItemLainnya(item.docId, item.url)} className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition" title="Hapus Gambar Ini">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          {fileItems.length === 0 && (
            <div className="aspect-video w-full rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center bg-white text-slate-400">
              <span className="text-[9px] font-bold uppercase">Belum ada file</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const sp3kDokumenSlot = useMemo(() => {
    const docs: { id: string; nama: string; fileUrl: string | string[] }[] = Array.isArray(currentCustomer?.dokumenLainnya)
      ? currentCustomer.dokumenLainnya
      : [];
    const primary = docs.find((d) => d.nama?.trim().toLowerCase() === SP3K_DOKUMEN_NAME.toLowerCase());
    const legacy = docs.filter((d) =>
      LEGACY_SP3K_DOKUMEN_NAMES.some((n) => n.toLowerCase() === d.nama?.trim().toLowerCase())
    );

    const fileItems: { url: string; docId: string }[] = [];
    const collect = (doc: { id: string; fileUrl: string | string[] }) => {
      const urls = Array.isArray(doc.fileUrl) ? doc.fileUrl : doc.fileUrl ? [doc.fileUrl] : [];
      urls.forEach((url) => fileItems.push({ url, docId: doc.id }));
    };
    if (primary) collect(primary);
    legacy.forEach(collect);

    return {
      id: primary?.id ?? `placeholder-${SP3K_DOKUMEN_NAME}`,
      nama: SP3K_DOKUMEN_NAME,
      fileUrl: fileItems.map((f) => f.url),
      fileItems,
    };
  }, [currentCustomer?.dokumenLainnya]);

  const kprDokumenLainnya = useMemo(() => {
    const docs: { id: string; nama: string; fileUrl: string | string[] }[] = Array.isArray(currentCustomer?.dokumenLainnya)
      ? currentCustomer.dokumenLainnya
      : [];
    return docs.filter((doc) => !isSp3kDokumen(doc.nama));
  }, [currentCustomer?.dokumenLainnya]);

  const handleSaveNilaiAjb = async () => {
    if (!progressData) return;
    try {
      await updateMutation.mutateAsync({ id: progressData.penjualanId, data: { nilaiAjb: nilaiAjbInput } });
      alert("Nilai AJB & Pajak otomatis berhasil dihitung dan disimpan!");
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
  const renderFileBox = (title: string, docType: string, url: string | null) => {
    const isPdf = url ? (url.split('?')[0].toLowerCase().endsWith('.pdf') || url.includes('application/pdf')) : false;
    const isUploading = uploadMutation.isPending && uploadingProgressDoc === docType;
    const isDrag = dragActive === docType;

    return (
      <div
        className={`bg-white p-4 rounded-xl border flex flex-col gap-3 transition-all relative overflow-hidden outline-none focus-within:ring-2 focus-within:ring-indigo-400
          ${isDrag ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-200'}
        `}
        tabIndex={0}
        onDragEnter={(e) => handleDrag(e, docType)}
        onDragLeave={(e) => handleDrag(e, docType)}
        onDragOver={(e) => handleDrag(e, docType)}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation(); setDragActive(null);
          const file = e.dataTransfer.files?.[0];
          if (file) handleUploadProgress(docType, file);
        }}
        onPaste={(e) => handlePaste(e, (files) => handleUploadProgress(docType, files[0]))}
      >
        <div className="flex justify-between items-center relative z-10">
          <div className="flex flex-col">
            <h5 className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">{title}</h5>
            <span className="text-[9px] text-slate-400 font-medium">Drag / Paste file di sini</span>
          </div>
          <label className={`flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer'}`}>
            {isUploading ? (
              <><Loader2 size={14} className="animate-spin text-indigo-600" /> Mengunggah...</>
            ) : (
              <><UploadCloud size={14} /> {url ? 'Ganti File' : 'Upload File'}</>
            )}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadProgress(docType, file);
              e.target.value = '';
            }} disabled={uploadMutation.isPending} />
          </label>
        </div>

        <div className={`w-full h-64 bg-slate-100 rounded-lg border overflow-hidden relative group transition-all ${isDrag ? 'border-indigo-400 border-dashed' : 'border-slate-200'}`}>
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <Loader2 size={32} className="animate-spin text-indigo-600 mb-3" />
              <span className="text-xs font-bold text-indigo-600 animate-pulse">Sedang mengunggah...</span>
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

  const renderChecklistBast = () => (
    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mt-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
        <h5 className="text-sm font-bold text-slate-800">Checklist BAST / Komplain Customer</h5>
        <button type="button" onClick={() => setChecklist([...checklist, { key: '', value: '' }])} className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition cursor-pointer">
          <Plus size={14} /> Tambah Ceklis
        </button>
      </div>
      <div className="space-y-3 mb-4">
        {checklist.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4 bg-white border border-slate-100 rounded-lg">Belum ada data checklist BAST.</p>
        ) : (
          checklist.map((c, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <input type="text" placeholder="Bagian (Contoh: Cat Dinding)" value={c.key} onChange={(e) => { const newArr = [...checklist]; newArr[idx].key = e.target.value; setChecklist(newArr); }} className="w-1/3 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-black" />
              <input type="text" placeholder="Catatan / Status (Contoh: Ada retak rambut sedikit)" value={c.value} onChange={(e) => { const newArr = [...checklist]; newArr[idx].value = e.target.value; setChecklist(newArr); }} className="w-2/3 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-black" />
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable title="Progress Penjualan" columns={columns} data={activePenjualan} />

      <Modal isOpen={!!modalStep} onClose={() => { setModalStep(null); setSelectedPenjualan(null); }} title="Kelola Progress Dokumen Penjualan">
        {selectedPenjualan && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-900 rounded-xl text-white shadow-md flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Skema Pembayaran</p>
                <p className="text-xl font-black">{selectedPenjualan.caraPembayaran?.replace(/_/g, ' ')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Customer / Kavling</p>
                <p className="text-sm font-bold text-white">{selectedPenjualan.nama}</p>
                <p className="text-xs text-slate-400">Blok {selectedPenjualan.blok}-{selectedPenjualan.nomorUnit}</p>
              </div>
            </div>

            {loadingProgress ? (
              <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>
            ) : progressData ? (
              <div className="space-y-6">

                {modalStep === 'VALIDASI_BERKAS' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-100 pb-3 mb-4 gap-3">
                        <h4 className="text-sm font-bold text-slate-800">Tahap 1: Validasi Berkas KPR</h4>
                        <label className="flex items-center gap-2 cursor-pointer bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors w-fit">
                          <input type="checkbox" checked={progressData.berkasCustomerValid} onChange={(e) => updateMutation.mutate({ id: progressData.penjualanId, data: { berkasCustomerValid: e.target.checked } })} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer" />
                          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest mt-0.5">Tandai Valid & Siap KPR</span>
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
                                    <Loader2 size={24} className="animate-spin text-indigo-600 mb-2" />
                                    <span className="text-[10px] font-bold text-indigo-600 animate-pulse">Mengunggah...</span>
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

                      <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <PlusCircle size={14} className="text-blue-600" /> Dokumen Pendukung KPR (Slip Gaji, Mutasi, dll)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderDokumenLainnyaGroup(sp3kDokumenSlot, { hideDeleteGroup: true, fileItems: sp3kDokumenSlot.fileItems })}
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
                )}
                {modalStep === 'SERTIFIKAT_KAVLING' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Tahap 2: Sertifikat Kavling</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {renderKavlingFileBox("PBG", "filePbg", selectedPenjualan.filePbg)}
                        {renderKavlingFileBox("Tanah", "fileSertifikatTanah", selectedPenjualan.fileSertifikatTanah)}
                        {renderKavlingFileBox("PBB", "fileNopPbb", selectedPenjualan.fileNopPbb)}
                      </div>
                    </div>
                  </div>
                )}

                {modalStep === 'SP3K' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Tahap SP3K & Biaya Notaris</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          {renderFileBox("Dokumen SP3K Bank", "fileSp3k", progressData.fileSp3k)}
                        </div>

                        <div className="space-y-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <Select
                              label="Pilih Notaris"
                              value={notarisForm.notarisId}
                              onChange={(e) => setNotarisForm({ ...notarisForm, notarisId: e.target.value })}
                              options={[
                                { value: '', label: '-- Pilih Notaris --' },
                                ...notarisList.map(n => ({ value: n.id.toString(), label: n.nama }))
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

                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-between">
                            <div>
                              <CurrencyInput label="Nilai AJB" name="nilaiAjb" value={nilaiAjbInput} onValueChange={(_, val) => setNilaiAjbInput(val)} placeholder="0" />
                              <div className="grid grid-cols-2 gap-3 mt-3 border-t border-blue-200/50 pt-3">
                                <div><p className="text-[9px] font-bold text-slate-500 uppercase">BPHTB</p><p className="text-sm font-black text-slate-900 tabular-nums">{formatRupiah(calculatedBphtb)}</p></div>
                                <div><p className="text-[9px] font-bold text-slate-500 uppercase">PPh (2.5%)</p><p className="text-sm font-black text-slate-900 tabular-nums">{formatRupiah(calculatedPph)}</p></div>
                              </div>
                            </div>
                            <button onClick={handleSaveNilaiAjb} disabled={updateMutation.isPending} className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50">
                              {updateMutation.isPending ? 'Menyimpan...' : 'Hitung & Simpan Nilai AJB'}
                            </button>
                          </div>

                        </div>
                      </div>

                      <div className="pt-6 mt-6 border-t border-slate-100">
                        <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <PlusCircle size={14} className="text-indigo-600" /> {SP3K_DOKUMEN_NAME}
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                          {renderDokumenLainnyaGroup(sp3kDokumenSlot, { hideDeleteGroup: true, fileItems: sp3kDokumenSlot.fileItems })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {modalStep === 'PPJB' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Dokumen Pengikatan Jual Beli (PPJB) & Biaya Notaris</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Kolom 1: Upload PPJB */}
                        <div>
                          {renderFileBox("Dokumen PPJB", "filePpjb", progressData.filePpjb)}
                        </div>

                        {/* Kolom 2: Form Pilih Notaris & Nilai AJB */}
                        <div className="space-y-4">
                          {/* Box Pemilihan Notaris */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <Select
                              label="Pilih Notaris"
                              value={notarisForm.notarisId}
                              onChange={(e) => setNotarisForm({ ...notarisForm, notarisId: e.target.value })}
                              options={[
                                { value: '', label: '-- Pilih Notaris --' },
                                ...notarisList.map((n: any) => ({ value: n.id.toString(), label: n.nama }))
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

                          {/* Box Nilai AJB & Pajak */}
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-between">
                            <div>
                              <CurrencyInput label="Nilai AJB" name="nilaiAjb" value={nilaiAjbInput} onValueChange={(_, val) => setNilaiAjbInput(val)} placeholder="0" />
                              <div className="grid grid-cols-2 gap-3 mt-3 border-t border-blue-200/50 pt-3">
                                <div><p className="text-[9px] font-bold text-slate-500 uppercase">BPHTB</p><p className="text-sm font-black text-slate-900 tabular-nums">{formatRupiah(calculatedBphtb)}</p></div>
                                <div><p className="text-[9px] font-bold text-slate-500 uppercase">PPh (2.5%)</p><p className="text-sm font-black text-slate-900 tabular-nums">{formatRupiah(calculatedPph)}</p></div>
                              </div>
                            </div>
                            <button onClick={handleSaveNilaiAjb} disabled={updateMutation.isPending} className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50">
                              {updateMutation.isPending ? 'Menyimpan...' : 'Hitung & Simpan Nilai AJB'}
                            </button>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {modalStep === 'AJB' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Dokumen Akta Jual Beli (AJB)</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <Input
                          label="Nomor AJB Resmi"
                          value={ajbForm.nomor}
                          onChange={(e) => setAjbForm(prev => ({ ...prev, nomor: e.target.value }))}
                          placeholder="Masukkan nomor AJB..."
                        />
                        <Input
                          label="Tanggal AJB"
                          type="date"
                          value={ajbForm.tanggal}
                          onChange={(e) => setAjbForm(prev => ({ ...prev, tanggal: e.target.value }))}
                        />
                        <div className="md:col-span-2">
                          <button
                            onClick={async () => {
                              try {
                                await updateMutation.mutateAsync({
                                  id: progressData.penjualanId,
                                  data: { nomorAjb: ajbForm.nomor, tanggalAjb: ajbForm.tanggal }
                                });
                                alert("Detail Nomor & Tanggal AJB berhasil disimpan!");
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

                      {renderFileBox("Scan Dokumen AJB", "fileAjb", progressData.fileAjb)}
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
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900"
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
              className="flex-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition cursor-pointer"
            >
              Upload PDF
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ProgressPenjualan;
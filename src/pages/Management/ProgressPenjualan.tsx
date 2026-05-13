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
  Loader2
} from 'lucide-react';
import Input from '../../components/shared/Input';
import { handleApiError } from '../../utils/errorHandler';

const ProgressPenjualan = () => {
  const { data: penjualanResponse, isLoading: loadingPenjualan } = useGetPenjualan({ limit: 500 });
  const penjualanData = useMemo(() => penjualanResponse?.items || [], [penjualanResponse?.items]);
  const { data: customers = [], isLoading: loadingCustomers } = useGetCustomers();

  const updateMutation = useUpdateProgressPenjualan();
  const uploadMutation = useUploadProgressDocument();
  const uploadCustomerDocMutation = useUploadCustomerDoc();
  const updateCustomerMutation = useUpdateCustomer();

  const [selectedPenjualan, setSelectedPenjualan] = useState<Record<string, any> | null>(null);
  const [modalStep, setModalStep] = useState<string | null>(null);
  const [newDocName, setNewDocName] = useState("");
  const [uploadingProgressDoc, setUploadingProgressDoc] = useState<string | null>(null);
  const [uploadingCustDoc, setUploadingCustDoc] = useState<string | null>(null);

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

  const ProgressIcons = ({ row }: { row: Record<string, any> }) => {
    const safeProgress = row.progressPenjualan || {};
    const skema = row.caraPembayaran?.toUpperCase() || '';

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
          <LineNode active={!!safeProgress.fileSp3k} />
          <IconNode active={!!safeProgress.fileSp3k} icon={Landmark} title="2. SP3K" step="SP3K" />
          <LineNode active={!!safeProgress.fileAjb} />
          <IconNode active={!!safeProgress.fileAjb} icon={ScrollText} title="3. AJB" step="AJB" />
          <LineNode active={!!safeProgress.fileBast} />
          <IconNode active={!!safeProgress.fileBast} icon={Key} title="4. BAST" step="BAST" />
        </div>
      );
    }
    if (skema === 'CASH BERTAHAP') {
      return (
        <div className="flex items-center gap-1">
          <IconNode active={!!safeProgress.filePpjb} icon={FileSignature} title="1. PPJB" step="PPJB" />
          <LineNode active={!!safeProgress.fileAjb} />
          <IconNode active={!!safeProgress.fileAjb} icon={ScrollText} title="2. AJB" step="AJB" />
          <LineNode active={!!safeProgress.fileBast} />
          <IconNode active={!!safeProgress.fileBast} icon={Key} title="3. BAST" step="BAST" />
        </div>
      );
    }
    if (skema === 'CASH KERAS') {
      return (
        <div className="flex items-center gap-1">
          <IconNode active={!!safeProgress.fileAjb} icon={ScrollText} title="1. AJB" step="AJB" />
          <LineNode active={!!safeProgress.fileBast} />
          <IconNode active={!!safeProgress.fileBast} icon={Key} title="2. BAST" step="BAST" />
        </div>
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

    const isConfirm = window.confirm("Apakah Anda yakin ingin menghapus dokumen pendukung ini?");
    if (!isConfirm) return;

    try {
      // Filter dokumen untuk membuang yang di-klik
      const updatedDocs = currentCustomer.dokumenLainnya?.filter(
        (doc: any) => doc.id !== docId
      );

      await updateCustomerMutation.mutateAsync({
        id: currentCustomer.id,
        data: { dokumenLainnya: updatedDocs } as any
      });

      alert("Dokumen pendukung berhasil dihapus!");
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    }
  };
  const handleUploadProgress = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !progressData) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hanya format gambar dan PDF yang diperbolehkan!");
      e.target.value = '';
      return;
    }

    setUploadingProgressDoc(docType);
    try {
      await uploadMutation.mutateAsync({ id: progressData.penjualanId, docType, file });
      alert(`Dokumen berhasil diunggah!`);
    } catch (err: any) {
      const { message } = handleApiError(err);
      alert(message);
    } finally {
      setUploadingProgressDoc(null);
      e.target.value = '';
    }
  };

  const handleUploadCustDoc = async (docType: CustomerDocType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentCustomer) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hanya file gambar dan PDF yang diperbolehkan!");
      e.target.value = "";
      return;
    }

    setUploadingCustDoc(docType);
    try {
      await uploadCustomerDocMutation.mutateAsync({ id: currentCustomer.id, docType, file });
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    } finally {
      setUploadingCustDoc(null);
      e.target.value = "";
    }
  };

  const handleUploadLainnya = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentCustomer) return;
    if (!newDocName.trim()) {
      alert("Isi nama dokumen terlebih dahulu sebelum mengunggah file tambahan!");
      e.target.value = "";
      return;
    }
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hanya file gambar dan PDF yang diperbolehkan!");
      e.target.value = "";
      return;
    }

    setUploadingCustDoc('lainnya');
    try {
      await uploadCustomerDocMutation.mutateAsync({ id: currentCustomer.id, docType: 'lainnya', file, namaDokumen: newDocName });
      setNewDocName("");
      alert("Dokumen pendukung berhasil diunggah!");
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    } finally {
      setUploadingCustDoc(null);
      e.target.value = "";
    }
  };

  const handleSaveNilaiAjb = async () => {
    if (!progressData) return;
    try {
      await updateMutation.mutateAsync({ id: progressData.penjualanId, data: { nilaiAjb: nilaiAjbInput } });
      alert("Nilai AJB & Pajak otomatis berhasil dihitung dan disimpan!");
    } catch (err: any) {
      const { message } = handleApiError(err);
      alert(message);
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
      const { message } = handleApiError(err);
      alert(message);
    }
  };


  const renderFileBox = (title: string, docType: string, url: string | null) => {
    const isPdf = url?.toLowerCase().endsWith('.pdf') || url?.includes('application/pdf');
    const isUploading = uploadMutation.isPending && uploadingProgressDoc === docType;

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 transition-all hover:border-indigo-200 relative overflow-hidden">
        <div className="flex justify-between items-center relative z-10">
          <h5 className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">{title}</h5>
          <label className={`flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer'}`}>
            {isUploading ? (
              <><Loader2 size={14} className="animate-spin text-indigo-600" /> Mengunggah...</>
            ) : (
              <><UploadCloud size={14} /> {url ? 'Ganti File' : 'Upload File'}</>
            )}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleUploadProgress(docType, e)} disabled={uploadMutation.isPending} />
          </label>
        </div>

        <div className="w-full h-64 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative group">
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
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <span className="text-[10px] font-medium italic">Belum ada dokumen yang diunggah</span>
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
                          const isPdf = fileUrl?.toLowerCase().endsWith('.pdf') || fileUrl?.includes('application/pdf');

                          return (
                            <div key={type} className="flex flex-col gap-3 p-4 border rounded-2xl bg-slate-50/50 hover:bg-white transition-all group shadow-sm relative overflow-hidden">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                {type.replace('file', '')}
                              </span>
                              <div
                                onClick={() => !isUploading && fileUrl && window.open(fileUrl, '_blank')}
                                className={`aspect-video w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden relative transition-all ${fileUrl ? 'border-slate-200 cursor-pointer' : 'border-slate-300 bg-slate-100'}`}
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
                                  <div className="flex flex-col items-center gap-1 text-slate-400">
                                    <ImageIcon size={24} strokeWidth={1.5} />
                                    <span className="text-[9px] font-bold">KOSONG</span>
                                  </div>
                                )}
                              </div>
                              <FileInput
                                label={isUploading ? "Mengunggah..." : "Upload / Ganti"}
                                accept="image/*,application/pdf"
                                onChange={(e) => handleUploadCustDoc(type, e)}
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {currentCustomer?.dokumenLainnya && currentCustomer.dokumenLainnya.map((doc: any) => {
                            const isPdf = doc.fileUrl?.toLowerCase().endsWith('.pdf') || doc.fileUrl?.includes('application/pdf');

                            return (
                              <div key={doc.id} className="flex flex-col gap-3 p-3 border rounded-xl bg-slate-50 hover:bg-white transition-all group shadow-sm overflow-hidden relative">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDokumenLainnya(doc.id)}
                                  disabled={updateCustomerMutation.isPending}
                                  className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg  transition-all z-30 disabled:opacity-50"
                                  title="Hapus Dokumen"
                                >
                                  {updateCustomerMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>

                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 truncate pr-7" title={doc.nama}>{doc.nama}</span>

                                <div
                                  onClick={() => window.open(doc.fileUrl, '_blank')}
                                  className="aspect-video w-full rounded-lg border-2 border-slate-200 flex items-center justify-center overflow-hidden relative cursor-pointer group-hover:border-indigo-200 transition-all"
                                >
                                  {isPdf ? (
                                    <iframe src={doc.fileUrl} title={doc.nama} className="w-full h-full border-none pointer-events-none" />
                                  ) : (
                                    <img src={doc.fileUrl} alt={doc.nama} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                  )}
                                  <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <ZoomIn size={20} className="text-white" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div className="flex flex-col gap-3 p-3 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/30 relative overflow-hidden">
                            {uploadingCustDoc === 'lainnya' && (
                              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                <Loader2 size={24} className="animate-spin text-blue-600 mb-2" />
                                <span className="text-[10px] font-bold text-blue-600 animate-pulse">Mengunggah file...</span>
                              </div>
                            )}
                            <div className="w-full">
                              <input type="text" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} placeholder="Nama Dok. Baru (Cth: Slip Gaji)" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white text-slate-900 placeholder:text-slate-400" />
                            </div>
                            <FileInput
                              label="Pilih File"
                              accept="image/*,application/pdf"
                              onChange={handleUploadLainnya}
                              disabled={uploadCustomerDocMutation.isPending}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {modalStep === 'SP3K' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Tahap SP3K & Biaya Notaris (Pajak)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderFileBox("Dokumen SP3K Bank", "fileSp3k", progressData.fileSp3k)}
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
                )}

                {modalStep === 'PPJB' && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Dokumen Pengikatan Jual Beli (PPJB)</h4>
                      {renderFileBox("Dokumen PPJB", "filePpjb", progressData.filePpjb)}
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
                                alert(e.response?.data?.message || "Gagal menyimpan data AJB.");
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
    </div>
  );
};

export default ProgressPenjualan;
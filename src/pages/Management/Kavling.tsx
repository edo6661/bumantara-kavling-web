import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  UserCircle, ChevronDown, ChevronUp, Filter, ArrowUpDown,
  PieChart, CheckCircle2, Clock, Ban, Building2, FileText,
  Map, ScrollText, UploadCloud
} from "lucide-react";
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import { formatRupiah } from "../../utils/formatters";
import { useAuth } from "../../context/AuthContext";
import {
  useGetKavlings, useCreateKavling, useUpdateKavling,
  useDeleteKavling, useUploadKavlingDocument
} from "../../hooks/queries/useKavling";
import { useGetPerumahan } from "../../hooks/queries/usePerumahan";
import { useGetBankRekening } from "../../hooks/queries/useBankRekening";
import type { KavlingData, CreateKavlingDTO, JenisKavling } from '../../services/kavling.service';
import { JENIS_KAVLING_LABELS } from '../../services/kavling.service';
import CurrencyInput from '../../components/shared/CurrencyInput';
import { handleApiError } from '../../utils/errorHandler';

interface KavlingFormState {
  id: number | '';
  perumahanId: number | '';
  blok: string;
  nomorUnit: string;
  namaTipe: string;
  luasBangunan: number | '';
  luasTanah: number | '';
  hargaDasar: number | '';
  status: string;
  jenisKavling: JenisKavling;
  rekeningTujuanId: number | '';
}

const initialFormState: KavlingFormState = {
  id: '', perumahanId: '', blok: '', nomorUnit: '', namaTipe: '',
  luasBangunan: '', luasTanah: '', hargaDasar: '', status: 'AVAILABLE', jenisKavling: 'PERUMAHAN', rekeningTujuanId: '',
};

type KavlingTipeConfig =
  | { kind: 'single-lb'; lb: number; lt: number[] }
  | { kind: 'pairs'; pairs: { lb: number; lt: number }[] };

const KAVLING_DATA: Record<string, KavlingTipeConfig> = {
  Asvara: { kind: 'single-lb', lb: 48, lt: [60, 61, 62, 64, 67, 68, 72, 76, 79, 80, 81, 96, 100, 120, 123, 127, 132, 134, 135] },
  Adara: { kind: 'single-lb', lb: 52, lt: [60, 61, 65, 70, 75, 82, 85, 87, 114, 120, 121, 133, 148] },
  Aruna: { kind: 'single-lb', lb: 73, lt: [60, 62, 63, 67, 71, 91, 109, 154] },
  Ansara: { kind: 'single-lb', lb: 36, lt: [60, 103, 120, 122, 132, 143] },
  'Edena Terrace': {
    kind: 'pairs',
    pairs: [
      { lb: 110, lt: 55 },
      { lb: 0, lt: 38 },
      { lb: 55, lt: 55 },
      { lb: 90, lt: 45 },
      { lb: 45, lt: 45 },
      { lb: 80, lt: 40 },
    ],
  },
};

const isPairTipe = (namaTipe: string) => KAVLING_DATA[namaTipe]?.kind === 'pairs';

const formatLuasPairLabel = (lb: number, lt: number) => `${lb} / ${lt} m²`;

const getLuasPairValue = (lb: number | '', lt: number | '') =>
  lb !== '' && lt !== '' ? `${lb}|${lt}` : '';

const getPairSelectOptions = (namaTipe: string) => {
  const config = KAVLING_DATA[namaTipe];
  if (!config || config.kind !== 'pairs') return [];
  return [...config.pairs]
    .sort((a, b) => a.lb - b.lb || a.lt - b.lt)
    .map(({ lb, lt }) => ({
      value: `${lb}|${lt}`,
      label: formatLuasPairLabel(lb, lt),
    }));
};

const getLuasTanahOptions = (namaTipe: string) => {
  const config = KAVLING_DATA[namaTipe];
  if (!config || config.kind !== 'single-lb') return [];
  return [...config.lt].sort((a, b) => a - b).map(lt => ({ value: lt, label: String(lt) }));
};

const Kavling = () => {
  const { selectedPerumahan } = useAuth();
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';
  const jenisKavlingFilter = searchParams.get('jenisKavling') || '';
  const orderBy = searchParams.get('orderBy') || '';
  const limit = 10;

  const { data: perumahanList = [] } = useGetPerumahan();
  const { data: bankList = [] } = useGetBankRekening();
  const { data: kavlingResponse, isLoading } = useGetKavlings({
    page, limit, search,
    perumahanId: selectedPerumahan ? Number(selectedPerumahan.id) : undefined,
    status: statusFilter !== '' ? statusFilter : undefined,
    jenisKavling: jenisKavlingFilter !== '' ? jenisKavlingFilter as JenisKavling : undefined,
    orderBy: orderBy !== '' ? orderBy : undefined
  });

  const kavlingData = kavlingResponse?.items || [];
  const meta = kavlingResponse?.meta;
  const summary = meta?.summary || {};

  const createMutation = useCreateKavling();
  const updateMutation = useUpdateKavling();
  const deleteMutation = useDeleteKavling();
  const uploadDocMutation = useUploadKavlingDocument();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<KavlingFormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const [selectedDocKavling, setSelectedDocKavling] = useState<KavlingData | null>(null);
  const [docModalStep, setDocModalStep] = useState<string | null>(null);

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => { prev.set('page', String(newPage)); return prev; });
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

  const handleJenisKavlingFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams(prev => {
      if (e.target.value) prev.set('jenisKavling', e.target.value); else prev.delete('jenisKavling');
      prev.set('page', '1'); return prev;
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams(prev => {
      if (e.target.value) prev.set('orderBy', e.target.value); else prev.delete('orderBy');
      prev.set('page', '1'); return prev;
    });
  };

  const DokumenIcons = ({ row }: { row: KavlingData }) => {

    const IconNode = ({ active, icon: Icon, title, step }: { active: boolean, icon: any, title: string, step: string }) => (
      <button
        type="button"
        title={title}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedDocKavling(row);
          setDocModalStep(step);
        }}
        className={`p-1.5 rounded-lg border shadow-sm transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-110 ${active
          ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
          : 'bg-slate-50 border-slate-200 text-slate-400 grayscale hover:grayscale-0 hover:bg-slate-100'
          }`}
      >
        <Icon size={14} strokeWidth={active ? 2.5 : 1.5} />
      </button>
    );

    return (
      <div className="flex items-center gap-1">
        <IconNode active={!!row.filePbg} icon={FileText} title="Dokumen PBG" step="PBG" />
        <div className={`w-2 h-0.5 rounded-full ${row.filePbg && row.fileSertifikatTanah ? 'bg-emerald-300' : 'bg-slate-200'}`}></div>
        <IconNode active={!!row.fileSertifikatTanah} icon={ScrollText} title="Sertifikat Tanah" step="SERTIFIKAT" />
        <div className={`w-2 h-0.5 rounded-full ${row.fileSertifikatTanah && row.fileNopPbb ? 'bg-emerald-300' : 'bg-slate-200'}`}></div>
        <IconNode active={!!row.fileNopPbb} icon={Map} title="NOP PBB" step="NOP" />
      </div>
    );
  };

  const columns = [
    { header: 'Blok', accessor: 'blok', render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
    { header: 'No', accessor: 'nomorUnit', render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
    {
      header: 'Jenis Kavling',
      accessor: 'jenisKavling',
      render: (val: JenisKavling) => {
        const label = JENIS_KAVLING_LABELS[val] ?? val;
        const isRuko = val === 'RUKO';
        return (
          <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border ${isRuko ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-indigo-100 text-indigo-800 border-indigo-200'}`}>
            {label}
          </span>
        );
      }
    },
    { header: 'Tipe', accessor: 'namaTipe' },
    { header: 'LB/LT', accessor: 'luasBangunan', render: (_: unknown, row: KavlingData) => `${row.luasBangunan} / ${row.luasTanah} m²` },
    { header: 'Harga Dasar', accessor: 'hargaDasar', render: (val: number) => formatRupiah(val) }, {
      header: 'Dokumen', accessor: 'id', render: (_: unknown, row: KavlingData) => <DokumenIcons row={row} />
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => {
        const statusStr = val?.toUpperCase();
        let bgClass = 'bg-gray-100 text-gray-800 border-gray-200';
        if (statusStr === 'AVAILABLE') bgClass = 'bg-green-100 text-green-800 border-green-200';
        if (statusStr === 'HOLD') bgClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (statusStr === 'BOOKING') bgClass = 'bg-blue-100 text-blue-800 border-blue-200';
        if (statusStr === 'TERJUAL') bgClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        return <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border ${bgClass}`}>{val}</span>;
      }
    },
  ];

  const expandedRowRender = (row: KavlingData) => {
    const activeSale = row.penjualan?.[0];
    const isBookedOrSold = ['BOOKING', 'TERJUAL'].includes(row.status?.toUpperCase());
    return (
      <div className="p-4 bg-slate-50/50 border-t border-slate-100 shadow-inner">
        {isBookedOrSold && activeSale ? (
          <div className="flex items-center gap-4 bg-blue-50/50 border border-blue-100 p-4 rounded-xl max-w-lg">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <UserCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">Informasi Pemesan / Pembeli</p>
              <p className="text-base font-black text-blue-900">{activeSale.customer?.nama || 'Tidak diketahui'}</p>
              <p className="text-sm font-medium text-blue-700 mt-0.5">No. HP: {activeSale.customer?.noHp || '-'}</p>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 bg-white border border-slate-200 rounded-xl max-w-lg">
            <p className="text-sm text-slate-500 italic">Belum ada data pemesan aktif untuk kavling ini.</p>
          </div>
        )}
      </div>
    );
  };

  const openModal = (item?: KavlingData) => {
    if (item) {
      setFormData({
        id: item.id, perumahanId: item.perumahanId, blok: item.blok, nomorUnit: item.nomorUnit,
        namaTipe: item.namaTipe, luasBangunan: item.luasBangunan, luasTanah: item.luasTanah,
        hargaDasar: item.hargaDasar, status: item.status, jenisKavling: item.jenisKavling,
        rekeningTujuanId: item.rekeningTujuanId || '',
      });
      setIsEditing(true);
    } else {
      setFormData({ ...initialFormState, perumahanId: selectedPerumahan ? Number(selectedPerumahan.id) : '' });
      setIsEditing(false);
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
    setFormData((prev) => {
      const updates: Partial<KavlingFormState> = { [name]: parsedValue as never };
      if (name === 'namaTipe') {
        const config = KAVLING_DATA[value];
        if (config?.kind === 'single-lb') {
          updates.luasBangunan = config.lb;
          updates.luasTanah = '';
        } else {
          updates.luasBangunan = '';
          updates.luasTanah = '';
        }
      }
      if (name === 'luasPair' && typeof value === 'string') {
        const [lb, lt] = value.split('|').map(Number);
        updates.luasBangunan = lb;
        updates.luasTanah = lt;
      }
      return { ...prev, ...updates };
    });
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.perumahanId) newErrors.perumahanId = 'Perumahan wajib dipilih';
    if (!formData.blok.trim()) newErrors.blok = 'Blok wajib diisi';
    if (!formData.nomorUnit.trim()) newErrors.nomorUnit = 'Nomor Unit wajib diisi';
    if (!formData.namaTipe.trim()) newErrors.namaTipe = 'Tipe wajib diisi';
    if (formData.luasBangunan === '' || formData.luasBangunan < 0) newErrors.luasBangunan = 'Luas Bangunan tidak valid';
    if (formData.luasTanah === '' || formData.luasTanah <= 0) newErrors.luasTanah = 'Luas Tanah tidak valid';
    if (formData.hargaDasar === '' || formData.hargaDasar <= 0) newErrors.hargaDasar = 'Harga Dasar tidak valid';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload: CreateKavlingDTO = {
      perumahanId: Number(formData.perumahanId), blok: formData.blok, nomorUnit: formData.nomorUnit,
      namaTipe: formData.namaTipe, luasBangunan: Number(formData.luasBangunan), luasTanah: Number(formData.luasTanah),
      hargaDasar: Number(formData.hargaDasar), status: formData.status,
      jenisKavling: formData.jenisKavling,
      rekeningTujuanId: formData.rekeningTujuanId !== '' ? Number(formData.rekeningTujuanId) : undefined,
    };
    try {
      if (isEditing && formData.id !== '') {
        await updateMutation.mutateAsync({ id: formData.id as number, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } catch (error: unknown) {
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

  const handleDelete = async (item: KavlingData) => {
    if (window.confirm(`Hapus data kavling Blok ${item.blok} - ${item.nomorUnit}?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
      } catch (error: any) {
        const { message } = handleApiError(error);
        alert(message);
      }
    }
  };

  const handleUploadDoc = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDocKavling) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hanya format gambar dan PDF yang diperbolehkan!");
      e.target.value = '';
      return;
    }

    try {
      await uploadDocMutation.mutateAsync({ id: selectedDocKavling.id, docType, file });
      alert(`Dokumen berhasil diunggah!`);
      setSelectedDocKavling(prev => prev ? { ...prev, [docType]: URL.createObjectURL(file) } : prev);

    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mengunggah dokumen kavling");
    } finally {
      e.target.value = '';
    }
  };


  const renderFileBox = (title: string, docType: string, url: string | null | undefined) => {
    const isPdf = url ? (url.split('?')[0].toLowerCase().endsWith('.pdf') || url.includes('application/pdf')) : false;
    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 transition-all hover:border-indigo-200">
        <div className="flex justify-between items-center">
          <h5 className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">{title}</h5>
          <label className={`flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all ${uploadDocMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer'}`}>
            <UploadCloud size={14} /> {url ? 'Ganti File' : 'Upload File'}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleUploadDoc(docType, e)} disabled={uploadDocMutation.isPending} />
          </label>
        </div>

        {url ? (
          <div className="w-full h-64 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative group">
            {isPdf ? (
              <iframe src={url} className="w-full h-full border-none" title={title} />
            ) : (
              <img src={url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            )}
            {/* Tombol hover untuk buka full screen di tab baru */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <a href={url} target="_blank" rel="noopener noreferrer" className="pointer-events-auto px-4 py-2 bg-white text-slate-800 text-xs font-bold rounded-lg shadow-md hover:bg-slate-50 transition-colors">
                Buka di Tab Baru
              </a>
            </div>
          </div>
        ) : (
          <div className="w-full h-24 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
            <span className="text-[10px] font-medium italic">Belum ada dokumen yang diunggah</span>
          </div>
        )}
      </div>
    );
  };

  const filteredBanks = bankList.filter(b => formData.perumahanId ? b.perumahanId === Number(formData.perumahanId) : true);

  if (isLoading && !kavlingData.length) return <div className="p-4 text-slate-500 font-medium flex justify-center items-center h-40">Memuat data kavling...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-300">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors" onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}>
          <div className="flex items-center gap-2"><PieChart size={18} className="text-slate-600" /><h3 className="font-bold text-slate-800 tracking-tight">Ringkasan Unit Kavling</h3></div>
          {isSummaryExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </div>
        {isSummaryExpanded && (
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Building2 size={16} className="text-slate-600" /></div><p className="text-xs font-bold text-slate-500 uppercase">Total Unit</p></div><p className="text-2xl font-black text-slate-900">{meta?.totalItems || 0}</p></div>
            <div className="bg-green-50 border border-green-100 p-4 rounded-xl shadow-sm"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 size={16} className="text-green-600" /></div><p className="text-xs font-bold text-green-700 uppercase">Available</p></div><p className="text-2xl font-black text-green-800">{summary['AVAILABLE'] || 0}</p></div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl shadow-sm"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><Clock size={16} className="text-blue-600" /></div><p className="text-xs font-bold text-blue-700 uppercase">Booking</p></div><p className="text-2xl font-black text-blue-800">{summary['BOOKING'] || 0}</p></div>
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl shadow-sm"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center"><Ban size={16} className="text-yellow-600" /></div><p className="text-xs font-bold text-yellow-700 uppercase">Hold / Terjual</p></div><p className="text-2xl font-black text-yellow-800">{(summary['HOLD'] || 0) + (summary['TERJUAL'] || 0)}</p></div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-300">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors" onClick={() => setIsFilterExpanded(!isFilterExpanded)}>
          <div className="flex items-center gap-2"><Filter size={18} className="text-slate-600" /><h3 className="font-bold text-slate-800 tracking-tight">Filter & Urutkan</h3></div>
          {isFilterExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </div>
        {isFilterExpanded && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white animate-in fade-in slide-in-from-top-2">
            <div className="relative">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Filter Jenis Kavling</label>
              <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black appearance-none" value={jenisKavlingFilter} onChange={handleJenisKavlingFilterChange}>
                <option value="">Semua Jenis</option>
                <option value="PERUMAHAN">Perumahan</option>
                <option value="RUKO">Ruko</option>
              </select>
              <div className="absolute right-3 top-8 pointer-events-none text-slate-400"><ChevronDown size={16} /></div>
            </div>
            <div className="relative">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Filter Status</label>
              <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black appearance-none" value={statusFilter} onChange={handleStatusFilterChange}>
                <option value="">Semua Status</option><option value="AVAILABLE">Tersedia (Available)</option><option value="BOOKING">Booking</option><option value="TERJUAL">Terjual</option><option value="HOLD">Ditahan (Hold)</option>
              </select>
              <div className="absolute right-3 top-8 pointer-events-none text-slate-400"><ChevronDown size={16} /></div>
            </div>
            <div className="relative">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Urutkan Berdasarkan</label>
              <select className="w-full px-4 pl-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black appearance-none" value={orderBy} onChange={handleSortChange}>
                <option value="">Terbaru (Default)</option><option value="hargaDasar:asc">Harga: Rendah ke Tinggi</option><option value="hargaDasar:desc">Harga: Tinggi ke Rendah</option><option value="luasBangunan:desc">Luas Bangunan: Terbesar</option><option value="blok:asc">Blok: A - Z</option>
              </select>
              <ArrowUpDown size={16} className="absolute left-3.5 top-8 pointer-events-none text-slate-400" />
              <div className="absolute right-3 top-8 pointer-events-none text-slate-400"><ChevronDown size={16} /></div>
            </div>
          </div>
        )}
      </div>

      <DataTable title={`Manajemen Kavling ${selectedPerumahan ? `- ${selectedPerumahan.nama}` : ''}`} columns={columns} data={kavlingData} onAdd={() => openModal()} onEdit={(item) => openModal(item as KavlingData)} onDelete={(item) => handleDelete(item as KavlingData)} expandedRowRender={expandedRowRender} serverSide={true} searchTerm={search} onSearchChange={handleSearchChange} page={page} totalPages={meta?.totalPages || 1} onPageChange={handlePageChange} />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit Data Kavling" : "Tambah Data Kavling"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Informasi Kavling</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Perumahan" name="perumahanId" value={formData.perumahanId} onChange={handleChange} options={[{ value: '', label: '-- Pilih Perumahan --' }, ...perumahanList.map(p => ({ value: p.id, label: p.nama }))]} error={errors.perumahanId} disabled={isEditing} />
              <Select label="Status Kavling" name="status" value={formData.status} onChange={handleChange} options={[{ value: 'AVAILABLE', label: 'Available' }, { value: 'HOLD', label: 'Hold' }, { value: 'BOOKING', label: 'Booking' }, { value: 'TERJUAL', label: 'Terjual' }]} />
              <Select label="Jenis Kavling" name="jenisKavling" value={formData.jenisKavling} onChange={handleChange} options={[{ value: 'PERUMAHAN', label: 'Perumahan' }, { value: 'RUKO', label: 'Ruko' }]} />
              <Input label="Blok" name="blok" value={formData.blok} onChange={handleChange} error={errors.blok} placeholder="Contoh: A" />
              <Input label="Nomor Unit" name="nomorUnit" value={formData.nomorUnit} onChange={handleChange} error={errors.nomorUnit} placeholder="Contoh: 01" />
              <div className="md:col-span-2">
                <Select label="Tipe" name="namaTipe" value={formData.namaTipe} onChange={handleChange} options={[{ value: '', label: '-- Pilih Tipe --' }, ...Object.keys(KAVLING_DATA).map(t => ({ value: t, label: t }))]} error={errors.namaTipe} />
              </div>
              {isPairTipe(formData.namaTipe) ? (
                <>
                  <div className="md:col-span-2">
                    <Select
                      label="Luas Bangunan / Tanah (m²)"
                      name="luasPair"
                      value={getLuasPairValue(formData.luasBangunan, formData.luasTanah)}
                      onChange={handleChange}
                      error={errors.luasBangunan || errors.luasTanah}
                      options={[{ value: '', label: '-- Pilih LB / LT --' }, ...getPairSelectOptions(formData.namaTipe)]}
                    />
                  </div>
                  <Input label="Luas Bangunan (m²)" type="number" name="luasBangunan" value={formData.luasBangunan} onChange={handleChange} error={errors.luasBangunan} readOnly />
                  <Input label="Luas Tanah (m²)" type="number" name="luasTanah" value={formData.luasTanah} onChange={handleChange} error={errors.luasTanah} readOnly />
                </>
              ) : (
                <>
                  <Input label="Luas Bangunan (m²)" type="number" name="luasBangunan" value={formData.luasBangunan} onChange={handleChange} error={errors.luasBangunan} readOnly />
                  <Select
                    label="Luas Tanah (m²)"
                    name="luasTanah"
                    value={formData.luasTanah}
                    onChange={handleChange}
                    error={errors.luasTanah}
                    options={[{ value: '', label: '-- Pilih LT --' }, ...getLuasTanahOptions(formData.namaTipe)]}
                  />
                </>
              )}
              <CurrencyInput
                label="Harga Dasar (Rp)"
                name="hargaDasar"
                value={Number(formData.hargaDasar) || 0}
                onValueChange={handleCurrencyChange}
                error={errors.hargaDasar}
                placeholder="0"
              />
              <div className="md:col-span-2">
                <Select label="Transfer ke Rekening" name="rekeningTujuanId" value={formData.rekeningTujuanId} onChange={handleChange} options={[{ value: '', label: 'Pilih Rekening Pembayaran (Opsional)...' }, ...filteredBanks.map(b => ({ value: b.id, label: `${b.namaBank} - ${b.noRekening} a/n ${b.atasNama}` }))]} error={errors.rekeningTujuanId} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={closeModal} disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-radius-btn hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50">Batal</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-radius-btn hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50">{createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Kavling'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!docModalStep} onClose={() => { setDocModalStep(null); setSelectedDocKavling(null); }} title="Kelola Dokumen Fisik Kavling">
        {selectedDocKavling && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-900 rounded-xl text-white shadow-md flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Blok - Unit</p>
                <p className="text-xl font-black">{selectedDocKavling.blok}-{selectedDocKavling.nomorUnit}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Tipe</p>
                <p className="text-sm font-bold text-white">{selectedDocKavling.namaTipe}</p>
              </div>
            </div>

            {docModalStep === 'PBG' && <div className="animate-in fade-in zoom-in-95 duration-300">{renderFileBox("Persetujuan Bangunan Gedung (PBG)", "filePbg", selectedDocKavling.filePbg)}</div>}
            {docModalStep === 'SERTIFIKAT' && <div className="animate-in fade-in zoom-in-95 duration-300">{renderFileBox("Sertifikat Tanah / SHM / HGB", "fileSertifikatTanah", selectedDocKavling.fileSertifikatTanah)}</div>}
            {docModalStep === 'NOP' && <div className="animate-in fade-in zoom-in-95 duration-300">{renderFileBox("Nomor Objek Pajak (NOP PBB)", "fileNopPbb", selectedDocKavling.fileNopPbb)}</div>}

            <div className="flex justify-end pt-4 sticky bottom-0 bg-white border-t border-slate-100 mt-6 -mx-4 -mb-4 px-4 py-4 z-20">
              <button onClick={() => { setDocModalStep(null); setSelectedDocKavling(null); }} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-md cursor-pointer">
                Tutup Dokumen
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Kavling;
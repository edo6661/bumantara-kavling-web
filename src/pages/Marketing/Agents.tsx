/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import FileInput from "../../components/shared/FileInput";
import PageLoader from "../PageLoader";
import { formatRupiah } from "../../utils/formatters";
import { Edit2, Eye, Key, Trash2, UploadCloud, CheckCircle, FileText, ArrowUpDown, ChevronDown, Banknote, Clock } from "lucide-react";
import {
  useGetAgentsPaginated,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
  useUploadAgentDoc,
  useGenerateAgentAccount
} from "../../hooks/queries/useAgent";
import { useGetPenjualan } from "../../hooks/queries/usePenjualan";
import { useGetFeeAgents } from "../../hooks/queries/useFeeAgent";
import { useGetAllAgentPencairan, useAjukanAgentPencairan } from "../../hooks/queries/useAgentPencairan";
import type { FeeAgentData } from "../../services/feeAgent.service";
import type { AgentPencairanData } from "../../services/agentPencairan.service";
import AjukanPencairanModal from "../../components/marketing/AjukanPencairanModal";
import {
  hasAnyEligiblePencairan,
  getPencairanBlockReason,
  getPencairanPaymentStatus,
  resolveSaleDetail,
  type SaleDetail,
} from "../../utils/agentPencairan";
import type { PencairanKomponenKey } from "../../utils/agentPencairanPreview";
import { buildPencairanAjukanPreview } from "../../utils/agentPencairanPreview";
import { useGetPerusahaanAgents } from "../../hooks/queries/usePerusahaanAgent";
import type { AgentData, CreateAgentDTO, PenjualanAgentData, PicAgentData } from '../../types/models/agent';
import { handleApiError } from '../../utils/errorHandler';
import CurrencyInput from '../../components/shared/CurrencyInput';
import {
  applyPerusahaanCommercialToAgent,
  getPerusahaanById,
  isAgentPerusahaan,
} from '../../utils/agentCommercialProfile';

interface AgentFormState {
  id: number | '';
  nik: string;
  nama: string;
  alamat: string;
  noHp: string;
  email: string;
  type: string;
  perusahaanAgentId: number | '';
  namaBank: string;
  noRekening: string;
  atasNamaRekening: string;
  feeMarketingPct: number | '';
  feeClosingNominal: number | '';
  potonganPph: number | '';
  pics: PicAgentData[];
}

const initialFormState: AgentFormState = {
  id: '',
  nik: '',
  nama: '',
  alamat: '',
  noHp: '',
  email: '',
  type: 'PRIBADI',
  perusahaanAgentId: '',
  namaBank: '',
  noRekening: '',
  atasNamaRekening: '',
  feeMarketingPct: '',
  feeClosingNominal: '',
  potonganPph: '',
  pics: [{ nama: '', noHp: '', alamat: '' }]
};

const getFeeForSale = (feeList: FeeAgentData[], agentId: number, saleId: number, noTransaksi: string) =>
  feeList.find(
    (f) => f.agentId === agentId && (f.penjualanId === saleId || f.noTransaksi === noTransaksi)
  );

const calcAgentFees = (
  agent: AgentData,
  nilaiAjb: number | null | undefined,
  feeRecord?: FeeAgentData
) => {
  const ajb = nilaiAjb ? Number(nilaiAjb) : 0;
  const feeMarketingPct = Number(agent.feeMarketingPct) || 0;
  const potonganPph = Number(agent.potonganPph) || 0;

  const marketingFee = ajb > 0 ? ajb * (feeMarketingPct / 100) : 0;
  const closingFee =
    Number(feeRecord?.closingNominal) ||
    Number(agent.feeClosingNominal) ||
    0;

  const totalFeePlusClosing = marketingFee + closingFee;
  const potPph = (marketingFee + closingFee) * (potonganPph / 100);

  return {
    fee: marketingFee,
    totalFee: totalFeePlusClosing,
    potPph,
  };
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

type AgentTypeFilter = 'PRIBADI' | 'PERUSAHAAN';

interface AgentsProps {
  agentType: AgentTypeFilter;
}

const Agents = ({ agentType }: AgentsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const orderBy = searchParams.get('orderBy') || '';
  const statusFilter = searchParams.get('status') || '';
  const typeFilter = agentType;
  const limitParam = Number(searchParams.get('limit'));
  const limit = (PAGE_SIZE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;

  const { data: agentsResponse, isLoading } = useGetAgentsPaginated({
    page,
    limit,
    search,
    ...(orderBy ? { orderBy } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
  });
  const agentData = agentsResponse?.items ?? [];
  const meta = agentsResponse?.meta;
  const { data: penjualanResponse } = useGetPenjualan({ limit: 500 });
  const { data: feeData = [] } = useGetFeeAgents();
  const { data: pencairanData = [] } = useGetAllAgentPencairan();
  const { data: perusahaanList = [] } = useGetPerusahaanAgents();
  const penjualanList = penjualanResponse?.items || [];

  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent();
  const deleteMutation = useDeleteAgent();
  const uploadDocMutation = useUploadAgentDoc();
  const ajukanPencairanMutation = useAjukanAgentPencairan();
  const generateAccountMutation = useGenerateAgentAccount();

  const pencairanByFeeAgentId = useMemo(() => {
    const map = new Map<number, AgentPencairanData[]>();
    pencairanData.forEach((p) => {
      const list = map.get(p.feeAgentId) ?? [];
      list.push(p);
      map.set(p.feeAgentId, list);
    });
    return map;
  }, [pencairanData]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<AgentFormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAgentDetail, setSelectedAgentDetail] = useState<AgentData | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedUploadAgent, setSelectedUploadAgent] = useState<AgentData | null>(null);

  const [selectedDetailPenjualan, setSelectedDetailPenjualan] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pencairanModal, setPencairanModal] = useState<{
    feeRecord: FeeAgentData;
    agent: AgentData;
    saleLabel: string;
    detail?: SaleDetail;
  } | null>(null);

  const pencairanPreview = useMemo(() => {
    if (!pencairanModal) return null;
    const pencairanList = pencairanByFeeAgentId.get(pencairanModal.feeRecord.id) ?? [];
    return buildPencairanAjukanPreview(
      pencairanModal.agent,
      pencairanModal.feeRecord,
      pencairanList,
      pencairanModal.detail,
    );
  }, [pencairanModal, pencairanByFeeAgentId]);

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


  const pageTitle = agentType === 'PRIBADI' ? 'Agent Pribadi' : 'Agent Perusahaan';

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
          <option value="">Agent Terbaru</option>
          <option value="nama:asc">Nama Agent (A-Z)</option>
        </select>
        <ArrowUpDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500" />
        <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
      </div>
    </>
  );

  const handleApprove = async (agent: AgentData) => {
    if (!agent.fileSuratPernyataan) {
      alert(`Gagal: Agent ${agent.nama} belum mengunggah Surat Pernyataan Bermaterai. Approval tidak dapat dilakukan.`);
      return;
    }
    if (window.confirm(`Setujui pendaftaran agent ${agent.nama}? Status akan menjadi Aktif.`)) {
      try {
        await updateMutation.mutateAsync({ id: agent.id, data: { status: 'AKTIF' } });
        alert(`Agent ${agent.nama} berhasil disetujui!`);
      } catch (error: any) {
        const { message } = handleApiError(error);
        alert(message);
      }
    }
  };

  const columns = [
    { header: 'NIK', accessor: 'nik' },
    { header: 'Nama Agent', accessor: 'nama', render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },
    ...(agentType === 'PERUSAHAAN'
      ? [{
          header: 'Perusahaan',
          accessor: 'perusahaanAgent',
          render: (_: unknown, row: AgentData) => (
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-100">
              {row.perusahaanAgent?.nama || '-'}
            </span>
          ),
        }]
      : []),
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => {
        if (val === 'PENDING') return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider rounded border border-yellow-200 shadow-sm">Menunggu Approval</span>;
        if (val === 'AKTIF') return <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded border border-green-200 shadow-sm">Aktif</span>;
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded border border-red-200 shadow-sm">{val}</span>;
      }
    },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (_: any, row: AgentData) => (
        <div className="flex items-center gap-1.5">
          {/* 👇 TOMBOL APPROVE 👇 */}
          {row.status === 'PENDING' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleApprove(row); }}
              className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-md transition-all cursor-pointer shadow-sm"
              title="Setujui Agent (Approve)"
            >
              <CheckCircle size={16} />
            </button>
          )}

          <button onClick={(e) => { e.stopPropagation(); openDetailModal(row); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all cursor-pointer" title="Detail">
            <Eye size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); openModal(row); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all cursor-pointer" title="Edit">
            <Edit2 size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); openUploadModal(row); }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all cursor-pointer" title="Upload Dokumen Agent">
            <UploadCloud size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleGenerateAccount(row); }}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${row.hasAccount
              ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700'
              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
            title={row.hasAccount ? "Reset Kredensial (Password)" : "Buat Akun Portal Agent"}
          >
            <Key size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer" title="Hapus">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const openDetailModal = (item: AgentData) => {
    setSelectedAgentDetail(item);
    setIsDetailModalOpen(true);
  };

  const openUploadModal = (item: AgentData) => {
    setSelectedUploadAgent(item);
    setIsUploadModalOpen(true);
  };

  const openModal = (item?: AgentData) => {
    if (item) {
      const perusahaan = item.perusahaanAgent?.id
        ? getPerusahaanById(perusahaanList, item.perusahaanAgent.id)
        : null;
      const commercial = isAgentPerusahaan(item.type)
        ? applyPerusahaanCommercialToAgent(item, perusahaan)
        : item;
      setFormData({
        id: item.id,
        nik: item.nik,
        nama: item.nama,
        alamat: item.alamat || '',
        noHp: item.noHp,
        email: item.email || '',
        type: item.type || 'PRIBADI',
        perusahaanAgentId: item.perusahaanAgent?.id || '',
        namaBank: commercial.namaBank || '',
        noRekening: commercial.noRekening || '',
        atasNamaRekening: commercial.atasNamaRekening || '',
        feeMarketingPct: commercial.feeMarketingPct ?? '',
        feeClosingNominal: commercial.feeClosingNominal ?? '',
        potonganPph: commercial.potonganPph ?? '',
        pics: item.pics && item.pics.length > 0 ? item.pics : [{ nama: '', noHp: '', alamat: '' }]
      });
      setIsEditing(true);
    } else {
      setFormData({ ...initialFormState, type: agentType });
      setIsEditing(false);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ ...initialFormState, type: agentType });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'perusahaanAgentId' && isAgentPerusahaan(prev.type)) {
        const perusahaan = getPerusahaanById(perusahaanList, value);
        return {
          ...next,
          feeMarketingPct: perusahaan?.feeMarketingPct ?? '',
          feeClosingNominal: perusahaan?.feeClosingNominal ?? '',
          potonganPph: perusahaan?.potonganPph ?? '',
          namaBank: perusahaan?.namaBank ?? '',
          noRekening: perusahaan?.noRekening ?? '',
          atasNamaRekening: perusahaan?.atasNamaRekening ?? '',
        };
      }
      if (name === 'type' && value === 'PERUSAHAAN') {
        return {
          ...next,
          perusahaanAgentId: '',
          feeMarketingPct: '',
          feeClosingNominal: '',
          potonganPph: '',
          namaBank: '',
          noRekening: '',
          atasNamaRekening: '',
        };
      }
      if (name === 'type' && value === 'PRIBADI') {
        return {
          ...next,
          perusahaanAgentId: '',
        };
      }
      return next;
    });

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
    if (errors[name]) setErrors((prev) => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });
  };

  const handlePICChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newPics = [...prev.pics];
      newPics[index] = { ...newPics[index], [name]: value };
      return { ...prev, pics: newPics };
    });

    const errorKey = `pics.${index}.${name}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleAddPIC = () => {
    setFormData((prev) => ({
      ...prev,
      pics: [...prev.pics, { nama: '', noHp: '', alamat: '' }]
    }));
  };

  const handleRemovePIC = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pics: prev.pics.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nik.trim()) newErrors.nik = 'NIK wajib diisi';
    if (formData.nik.trim().length !== 16 && formData.nik.trim().length !== 15) newErrors.nik = 'NIK tidak valid (minimal 15-16 digit)';
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.noHp.trim()) newErrors.noHp = 'No HP wajib diisi';
    if (agentType === 'PERUSAHAAN' && !formData.perusahaanAgentId) newErrors.perusahaanAgentId = 'Wajib memilih perusahaan';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const picMapping: number[] = [];
    const validPics: PicAgentData[] = [];

    formData.pics.forEach((pic, index) => {
      if (pic.nama.trim() !== '' || pic.noHp.trim() !== '') {
        picMapping.push(index);
        validPics.push(pic);
      }
    });

    const isPerusahaan = agentType === 'PERUSAHAAN';

    const payload: CreateAgentDTO = {
      nik: formData.nik,
      nama: formData.nama,
      noHp: formData.noHp,
      email: formData.email || undefined,
      alamat: formData.alamat || undefined,
      type: agentType,
      perusahaanAgentId: isPerusahaan ? Number(formData.perusahaanAgentId) : undefined,
      namaBank: isPerusahaan ? null : (formData.namaBank || null),
      noRekening: isPerusahaan ? null : (formData.noRekening || null),
      atasNamaRekening: isPerusahaan ? null : (formData.atasNamaRekening || null),
      pics: validPics.length > 0 ? validPics : undefined,
    };

    if (!isPerusahaan) {
      if (formData.feeMarketingPct !== '') {
        payload.feeMarketingPct = Number(formData.feeMarketingPct);
      }
      if (formData.feeClosingNominal !== '') {
        payload.feeClosingNominal = Number(formData.feeClosingNominal);
      }
      if (formData.potonganPph !== '') {
        payload.potonganPph = Number(formData.potonganPph);
      }
    }

    try {
      if (isEditing && formData.id) {
        await updateMutation.mutateAsync({ id: formData.id as number, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } catch (error: any) {
      const { message, errors: backendErrors } = handleApiError(error);

      if (backendErrors && Array.isArray(backendErrors)) {
        const fieldErrors: Record<string, string> = {};

        backendErrors.forEach((err: { field: string; message: string }) => {
          const fieldName = err.field.replace(/\[(\d+)\]/g, '.$1');
          const parts = fieldName.split('.');

          if (parts[0] === 'pics' && parts.length >= 3) {
            const backendIdx = parseInt(parts[1], 10);
            const frontendIdx = picMapping[backendIdx] !== undefined ? picMapping[backendIdx] : backendIdx;
            const propName = parts.slice(2).join('.');
            fieldErrors[`pics.${frontendIdx}.${propName}`] = err.message;
          } else {
            fieldErrors[err.field] = err.message;
          }
        });

        setErrors(fieldErrors);
      } else {
        alert(message);
      }
    }
  };

  const handleDelete = async (item: AgentData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus agen ${item.nama}?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
      } catch (error: any) {
        const { message } = handleApiError(error);
        alert(message);
      }
    }
  };

  const handleGenerateAccount = async (agent: AgentData) => {
    if (!agent.email) {
      alert("Gagal: Email agent masih kosong. Silakan edit dan isi email terlebih dahulu!");
      return;
    }
    const actionText = agent.hasAccount ? 'me-reset password' : 'membuat akun portal';
    const password = window.prompt(`Masukkan password baru untuk ${actionText} ${agent.nama} (Min. 6 karakter):`);

    if (password === null) return;
    if (password.length < 6) {
      alert("Password harus minimal 6 karakter!");
      return;
    }

    try {
      const res = await generateAccountMutation.mutateAsync({ id: agent.id, password });
      alert(res.message || `Berhasil! Kredensial untuk ${agent.nama} telah disimpan. Silakan login menggunakan email: ${agent.email}`);
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    }
  };

  const openAjukanPencairanModal = (
    feeRecord: FeeAgentData,
    saleLabel: string,
    agent: AgentData,
    detail?: SaleDetail,
  ) => {
    const pencairanList = pencairanByFeeAgentId.get(feeRecord.id) ?? [];
    if (!hasAnyEligiblePencairan(agent, feeRecord, pencairanList, detail)) {
      alert(getPencairanBlockReason(agent, feeRecord, pencairanList, detail) ?? "Belum memenuhi syarat pencairan.");
      return;
    }
    setPencairanModal({ feeRecord, saleLabel, agent, detail });
  };

  const handleConfirmAjukanPencairan = async (selected: Set<PencairanKomponenKey>) => {
    if (!pencairanModal) return;
    try {
      await ajukanPencairanMutation.mutateAsync({
        feeAgentId: pencairanModal.feeRecord.id,
        includeClosing: selected.has('closing'),
        includeMarketing: selected.has('marketing'),
      });
      alert("Pengajuan pencairan berhasil dikirim ke finance.");
      setPencairanModal(null);
    } catch (err: unknown) {
      const { message } = handleApiError(err);
      alert(message);
    }
  };

  const handleUploadDoc = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUploadAgent) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Hanya format gambar dan PDF yang diperbolehkan!");
      e.target.value = '';
      return;
    }
    try {
      await uploadDocMutation.mutateAsync({ id: selectedUploadAgent.id, docType, file });
      alert(`Dokumen berhasil diunggah!`);

      setSelectedUploadAgent(prev => prev ? { ...prev, [docType]: URL.createObjectURL(file) } : prev);
      if (selectedAgentDetail?.id === selectedUploadAgent.id) {
        setSelectedAgentDetail(prev => prev ? { ...prev, [docType]: URL.createObjectURL(file) } : prev);
      }
    } catch (err: any) {
      const { message } = handleApiError(err);
      alert(message);
    } finally {
      e.target.value = '';
    }
  };

  const expandedRowRender = (row: AgentData) => {
    const relatedSales = row.penjualan || [];
    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">
          Riwayat Penjualan Agent: <span className="text-blue-600">{row.nama}</span>
        </h4>
        <p className="text-[10px] text-slate-500 mb-4 flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Fee Marketing:{" "}
            <span className="font-semibold text-slate-600 tabular-nums">
              {row.feeMarketingPct != null ? `${row.feeMarketingPct}%` : "-"}
            </span>
          </span>
          <span>
            Fee Closing:{" "}
            <span className="font-semibold text-slate-600 tabular-nums">
              {row.feeClosingNominal != null ? formatRupiah(row.feeClosingNominal) : "-"}
            </span>
          </span>
          <span>
            Potongan PPh:{" "}
            <span className="font-semibold text-slate-600 tabular-nums">
              {row.potonganPph != null ? `${row.potonganPph}%` : "-"}
            </span>
          </span>
        </p>
        {relatedSales.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead className="text-[11px] text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Blok</th>
                  <th className="px-4 py-3 font-bold">No</th>
                  <th className="px-4 py-3 text-right font-bold">Harga Jual</th>
                  <th className="px-4 py-3 text-right font-bold">Nilai AJB</th>
                  <th className="px-4 py-3 text-right font-bold">Fee</th>
                  <th className="px-4 py-3 text-right font-bold">Total Fee (+ Closing)</th>
                  <th className="px-4 py-3 text-right font-bold">Pot PPh</th>
                  <th className="px-4 py-3 text-center font-bold">Dibayar</th>
                  <th className="px-4 py-3 rounded-r-lg text-center font-bold w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {relatedSales.map((sale: PenjualanAgentData) => {
                  const detail = resolveSaleDetail(sale, penjualanList);
                  const nilaiAjb = detail?.progressPenjualan?.nilaiAjb ?? null;
                  const feeRecord = getFeeForSale(feeData, row.id, sale.id, sale.noTransaksi);
                  const pencairanList = feeRecord ? (pencairanByFeeAgentId.get(feeRecord.id) ?? []) : [];
                  const { fee, totalFee, potPph } = calcAgentFees(row, nilaiAjb, feeRecord);
                  const paymentStatus = getPencairanPaymentStatus(pencairanList);
                  const saleLabel = `${sale.customer?.nama || "-"} — Blok ${sale.kavling?.blok || "-"} No. ${sale.kavling?.nomorUnit || "-"}`;
                  const canAjukan = feeRecord
                    ? hasAnyEligiblePencairan(row, feeRecord, pencairanList, detail)
                    : false;
                  const blockReason = getPencairanBlockReason(
                    row,
                    feeRecord,
                    pencairanList,
                    detail
                  );
                  const waitingPencairan = pencairanList.filter(
                    (p) => p.status === "MENUNGGU_PEMBAYARAN"
                  );

                  return (
                  <tr
                    key={sale.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td
                      className="px-4 py-3 font-medium cursor-pointer"
                      onClick={() => setSelectedDetailPenjualan(detail || sale)}
                    >
                      {sale.customer?.nama || '-'}
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => setSelectedDetailPenjualan(detail || sale)}
                    >
                       {sale.kavling?.blok}
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => setSelectedDetailPenjualan(detail || sale)}
                    >
                       {sale.kavling?.nomorUnit}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-bold text-slate-700 cursor-pointer"
                      onClick={() => setSelectedDetailPenjualan(detail || sale)}
                    >
                      {formatRupiah(sale.hargaJual)}
                    </td>
                    <td
                      className="px-4 py-3 text-right text-slate-700 cursor-pointer"
                      onClick={() => setSelectedDetailPenjualan(detail || sale)}
                    >
                      {nilaiAjb ? formatRupiah(nilaiAjb) : '-'}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-medium text-slate-800 cursor-pointer"
                      onClick={() => setSelectedDetailPenjualan(detail || sale)}
                    >
                      {nilaiAjb ? formatRupiah(fee) : '-'}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-medium text-slate-800 cursor-pointer"
                      onClick={() => setSelectedDetailPenjualan(detail || sale)}
                    >
                      {formatRupiah(totalFee)}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-medium text-slate-800 cursor-pointer"
                      onClick={() => setSelectedDetailPenjualan(detail || sale)}
                    >
                      {formatRupiah(potPph)}
                    </td>
                    <td
                      className="px-4 py-3 text-center cursor-pointer"
                      onClick={() => setSelectedDetailPenjualan(detail || sale)}
                    >
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${paymentStatus.className}`}>
                        {paymentStatus.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center justify-center gap-1 min-w-[88px]">
                        <div className="flex items-center justify-center gap-1">
                          {canAjukan && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAjukanPencairanModal(feeRecord!, saleLabel, row, detail);
                              }}
                              disabled={ajukanPencairanMutation.isPending}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-all cursor-pointer disabled:opacity-50"
                              title="Ajukan pencairan"
                            >
                              <Banknote size={14} />
                              Ajukan
                            </button>
                          )}
                          {waitingPencairan.map((p) => (
                            <span
                              key={p.id}
                              className="p-1.5 text-amber-500"
                              title={`Menunggu pembayaran finance (${p.tahap})`}
                            >
                              <Clock size={16} />
                            </span>
                          ))}
                          {pencairanList.some((p) => p.status === "SUDAH_DIBAYAR") && (
                            <span
                              className="p-1.5 text-green-600"
                              title="Ada pencairan yang sudah dibayar finance"
                            >
                              <CheckCircle size={16} />
                            </span>
                          )}
                        </div>
                        {!canAjukan && blockReason && (
                          <span
                            className="text-[9px] leading-tight text-slate-500 max-w-[120px] text-center"
                            title={blockReason}
                          >
                            {blockReason}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Belum ada riwayat penjualan untuk agent ini.
          </p>
        )}
      </div>
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title={pageTitle}
        columns={columns}
        data={agentData}
        onAdd={() => openModal()}
        expandedRowRender={expandedRowRender}
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

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? "Edit Data Agent" : "Tambah Data Agent"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Informasi Utama Agent</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agentType === 'PERUSAHAAN' && (
                <Select
                  label="Pilih Perusahaan"
                  name="perusahaanAgentId"
                  value={formData.perusahaanAgentId || ''}
                  onChange={handleChange}
                  error={errors.perusahaanAgentId}
                  options={[
                    { value: '', label: '-- Pilih Perusahaan --' },
                    ...perusahaanList.map(p => ({ value: p.id, label: p.nama }))
                  ]}
                />
              )}

              <Input label="NIK KTP" name="nik" value={formData.nik} onChange={handleChange} error={errors.nik} placeholder="Masukkan NIK 16 Digit" />
              <Input label="Nama Lengkap / Perusahaan" name="nama" value={formData.nama} onChange={handleChange} error={errors.nama} placeholder="Sesuai KTP" />
              <Input label="No. WhatsApp / HP" name="noHp" value={formData.noHp} onChange={handleChange} error={errors.noHp} placeholder="08xxxxxxxxxx" />
              <Input label="Email (Untuk Login)" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="email@example.com" />
              <div className="md:col-span-2">
                {agentType === 'PERUSAHAAN' ? (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                      Fee & Rekening — otomatis dari perusahaan
                    </p>
                    {!formData.perusahaanAgentId ? (
                      <p className="text-sm text-slate-600">Pilih perusahaan terlebih dahulu.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Fee Marketing</p>
                          <p className="font-semibold text-slate-900">{formData.feeMarketingPct !== '' ? `${formData.feeMarketingPct}%` : '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Fee Closing</p>
                          <p className="font-semibold text-slate-900">{formData.feeClosingNominal !== '' ? formatRupiah(Number(formData.feeClosingNominal)) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Pot. PPh</p>
                          <p className="font-semibold text-slate-900">{formData.potonganPph !== '' ? `${formData.potonganPph}%` : '-'}</p>
                        </div>
                        <div className="md:col-span-3 pt-2 border-t border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Bank</p>
                            <p className="font-semibold text-slate-900">{formData.namaBank || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">No. Rekening</p>
                            <p className="font-semibold text-slate-900">{formData.noRekening || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Atas Nama</p>
                            <p className="font-semibold text-slate-900">{formData.atasNamaRekening || '-'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500">
                      Ubah nilai fee atau rekening di menu Marketing → Perusahaan Agent.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Fee Marketing (%)"
                        name="feeMarketingPct"
                        type="number"
                        step="any"
                        value={formData.feeMarketingPct}
                        onChange={handleChange}
                        placeholder="Contoh: 2.5"
                      />
                      <div className="w-full">
                        <CurrencyInput
                          label="Fee Closing (Rp)"
                          name="feeClosingNominal"
                          value={Number(formData.feeClosingNominal) || 0}
                          onValueChange={(_, val) => handleCurrencyChange('feeClosingNominal', val)}
                          placeholder="0"
                        />
                      </div>
                      <Input
                        label="Potongan PPh (%)"
                        name="potonganPph"
                        type="number"
                        step="any"
                        value={formData.potonganPph}
                        onChange={handleChange}
                        placeholder="Contoh: 2.5"
                      />
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Informasi Rekening Bank (Opsional)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Nama Bank" name="namaBank" value={formData.namaBank} onChange={handleChange} error={errors.namaBank} placeholder="Contoh: BCA / BSI" />
                        <Input label="Nomor Rekening" name="noRekening" value={formData.noRekening} onChange={handleChange} error={errors.noRekening} placeholder="Masukkan No. Rek" />
                        <Input label="Atas Nama Rekening" name="atasNamaRekening" value={formData.atasNamaRekening} onChange={handleChange} error={errors.atasNamaRekening} placeholder="A/N Rekening" />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="md:col-span-2">
                <Input label="Alamat Lengkap (Opsional)" name="alamat" value={formData.alamat} onChange={handleChange} error={errors.alamat} placeholder="Masukkan alamat lengkap agent" />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Daftar PIC Agent (Opsional)</h4>
                <p className="text-xs text-gray-500">Tambahkan kontak PIC untuk di bawah agent ini</p>
              </div>
              <button type="button" onClick={handleAddPIC} className="px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-black rounded-lg transition-colors cursor-pointer shadow-sm">
                + Tambah PIC
              </button>
            </div>

            <div className="space-y-4">
              {formData.pics.map((pic, index) => (
                <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg relative shadow-sm">
                  {formData.pics.length > 1 && (
                    <button type="button" onClick={() => handleRemovePIC(index)} className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer">Hapus</button>
                  )}
                  <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">PIC #{index + 1}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nama PIC"
                      name="nama"
                      value={pic.nama}
                      onChange={(e) => handlePICChange(index, e)}
                      error={errors[`pics.${index}.nama`]}
                      placeholder="Masukkan nama PIC"
                    />
                    <Input
                      label="No. Telepon / HP PIC"
                      name="noHp"
                      value={pic.noHp}
                      onChange={(e) => handlePICChange(index, e)}
                      error={errors[`pics.${index}.noHp`]}
                      placeholder="08xxxxxxxxxx"
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Alamat PIC (Opsional)"
                        name="alamat"
                        value={pic.alamat || ''}
                        onChange={(e) => handlePICChange(index, e)}
                        error={errors[`pics.${index}.alamat`]}
                        placeholder="Masukkan alamat lengkap PIC"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={closeModal} disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2 text-sm font-bold text-white bg-black rounded-lg hover:bg-gray-800 cursor-pointer disabled:opacity-50 transition-colors shadow-md">
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL UPLOAD DOKUMEN AGENT */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title={`Upload Dokumen Agent: ${selectedUploadAgent?.nama}`}>
        {selectedUploadAgent && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(selectedUploadAgent.type === 'PRIBADI'
                ? ['fileSuratPernyataan', 'fileKtp', 'fileNpwp', 'kwitansiBookingFee']
                : ['fileSuratPernyataan', 'fileSuratKeterangan', 'fileKtpDirektur', 'fileNpwpPerusahaan']
              ).map((type) => (
                <div key={type} className="flex flex-col gap-3 p-4 border rounded-2xl bg-slate-50/50 hover:bg-white transition-all group shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 text-center">
                    {type.replace('file', '').replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div
                    onClick={() => selectedUploadAgent[type as keyof AgentData] && setPreviewImage(selectedUploadAgent[type as keyof AgentData] as string)}
                    className={`aspect-[4/3] w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden relative transition-all ${selectedUploadAgent[type as keyof AgentData] ? 'border-slate-200 cursor-zoom-in bg-white' : 'border-slate-300 bg-slate-100'}`}
                  >
                    {selectedUploadAgent[type as keyof AgentData] ? (
                      ((selectedUploadAgent[type as keyof AgentData] as string).split('?')[0].toLowerCase().endsWith('.pdf') || (selectedUploadAgent[type as keyof AgentData] as string).includes('application/pdf')) ? (
                        <div className="flex flex-col items-center text-red-500 group-hover:scale-105 transition-transform">
                          <FileText size={32} />
                          <span className="text-[10px] font-bold mt-1 text-slate-600">PDF</span>
                        </div>
                      ) : (
                        <img src={selectedUploadAgent[type as keyof AgentData] as string} alt={type} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      )
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 italic">KOSONG</span>
                    )}
                  </div>
                  <FileInput
                    label="Upload / Ganti"
                    accept="image/*,.pdf"
                    onChange={(e) => handleUploadDoc(type, e)}
                    disabled={uploadDocMutation.isPending}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button onClick={() => setIsUploadModalOpen(false)} className="px-6 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 cursor-pointer transition-all">
                Tutup Dokumen
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL DETAIL AGENT */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Informasi Detail Agent">
        {selectedAgentDetail && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Biodata Agent</h4>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${selectedAgentDetail.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{selectedAgentDetail.status}</span>
                  <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] uppercase font-bold tracking-wider">{selectedAgentDetail.type}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                {/* 👇 DETAIL PERUSAHAAN 👇 */}
                {selectedAgentDetail.type === 'PERUSAHAAN' && selectedAgentDetail.perusahaanAgent && (
                  <div className="md:col-span-2 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-2">
                    <p className="text-[10px] text-blue-500 uppercase font-bold mb-1">Perusahaan Induk</p>
                    <p className="text-sm font-black text-blue-900">{selectedAgentDetail.perusahaanAgent.nama}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Nama Agent</p>
                  <p className="text-sm font-bold text-slate-900">{selectedAgentDetail.nama}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">NIK</p>
                  <p className="text-sm font-medium text-slate-800 tabular-nums">{selectedAgentDetail.nik}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">No. WhatsApp / Telepon</p>
                  <p className="text-sm font-medium text-slate-800 tabular-nums">{selectedAgentDetail.noHp}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Email</p>
                  <p className="text-sm font-medium text-slate-800">{selectedAgentDetail.email || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Fee Marketing (%)</p>
                  <p className="text-sm font-medium text-slate-800 tabular-nums">{selectedAgentDetail.feeMarketingPct ?? '-'} %</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Fee Closing (%)</p>
                  <p className="text-sm font-medium text-slate-800 tabular-nums">{selectedAgentDetail.feeClosingNominal ?? '-'} %</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Potongan PPh (%)</p>
                  <p className="text-sm font-medium text-slate-800 tabular-nums">{selectedAgentDetail.potonganPph ?? '-'} %</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Alamat Lengkap</p>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">{selectedAgentDetail.alamat || '-'}</p>
                </div>
                <div className="md:col-span-2 mt-2 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Bank Agent</p>
                    <p className="text-sm font-bold text-slate-900">{selectedAgentDetail.namaBank || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Nomor Rekening</p>
                    <p className="text-lg font-black text-blue-600 font-mono tabular-nums">{selectedAgentDetail.noRekening || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Atas Nama (A/N)</p>
                    <p className="text-sm font-bold text-slate-900">{selectedAgentDetail.atasNamaRekening || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedAgentDetail.type && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm mt-4">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Dokumen / Berkas Agent</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(selectedAgentDetail.type === 'PRIBADI'
                    ? ['fileSuratPernyataan', 'fileKtp', 'fileNpwp', 'kwitansiBookingFee']
                    : ['fileSuratPernyataan', 'fileSuratKeterangan', 'fileKtpDirektur', 'fileNpwpPerusahaan']
                  ).map((type) => (
                    <div key={type} className="flex flex-col gap-2">
                      <span className="text-[9px] font-black uppercase text-slate-400 text-center">
                        {type.replace('file', '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div
                        onClick={() => selectedAgentDetail[type as keyof AgentData] && setPreviewImage(selectedAgentDetail[type as keyof AgentData] as string)}
                        className={`aspect-[4/3] rounded-xl border flex items-center justify-center overflow-hidden transition-all ${selectedAgentDetail[type as keyof AgentData] ? 'border-slate-200 cursor-zoom-in bg-white' : 'border-slate-100 bg-slate-50'}`}
                      >
                        {selectedAgentDetail[type as keyof AgentData] ? (
                          ((selectedAgentDetail[type as keyof AgentData] as string).split('?')[0].toLowerCase().endsWith('.pdf') || (selectedAgentDetail[type as keyof AgentData] as string).includes('application/pdf')) ? (
                            <div className="flex flex-col items-center text-red-500">
                              <FileText size={24} />
                              <span className="text-[8px] font-bold mt-1 text-slate-600">PDF</span>
                            </div>
                          ) : (
                            <img src={selectedAgentDetail[type as keyof AgentData] as string} alt={type} className="w-full h-full object-cover" />
                          )
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 italic text-center px-2">Belum Upload</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedAgentDetail.pics && selectedAgentDetail.pics.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Kontak Tim / PIC Pendukung</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedAgentDetail.pics.map((pic, idx) => (
                    <div key={pic.id || idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm hover:border-blue-100 transition-colors">
                      <p className="text-sm font-bold text-slate-800 mb-1">{pic.nama}</p>
                      <p className="text-xs text-slate-500 tabular-nums mb-1">📞 {pic.noHp}</p>
                      <p className="text-xs text-slate-400 truncate">📍 {pic.alamat || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 👇 MENAMPILKAN TANDA TANGAN PENDAFTARAN AGENT 👇 */}
            {selectedAgentDetail.ttdData && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm mt-4 text-center">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Tanda Tangan Pendaftar</h4>
                <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-2 inline-block">
                  <img src={selectedAgentDetail.ttdData} alt="Tanda Tangan" className="h-24 object-contain" />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors cursor-pointer shadow-md"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL LIGHTBOX PREVIEW GAMBAR */}
      <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Pratinjau Dokumen">
        <div className="flex flex-col items-center">
          {previewImage && (
            <div className="relative w-full flex justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              {previewImage.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewImage} className="w-full h-[60vh] rounded-lg border-none" title="PDF Preview" />
              ) : (
                <img src={previewImage} alt="Preview Full" className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain" />
              )}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <a href={previewImage || '#'} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Buka Tab Baru</a>
            <button onClick={() => setPreviewImage(null)} className="px-10 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-black/20">Tutup</button>
          </div>
        </div>
      </Modal>

      {/* MODAL DETAIL PENJUALAN KETIKA ROW DI KLIK */}
      <Modal isOpen={!!selectedDetailPenjualan} onClose={() => setSelectedDetailPenjualan(null)} title="Informasi Transaksi Penjualan">
        {selectedDetailPenjualan && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Customer / Pembeli</p>
                  <p className="text-lg font-black text-slate-900">{selectedDetailPenjualan.nama || selectedDetailPenjualan.customer?.nama || '-'}</p>
                  <p className="text-sm text-slate-500 font-medium">Transaksi: {selectedDetailPenjualan.id || selectedDetailPenjualan.noTransaksi}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${selectedDetailPenjualan.status === 'LUNAS' ? 'bg-green-100 text-green-800' :
                    selectedDetailPenjualan.status === 'BATAL' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                    {selectedDetailPenjualan.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Kavling</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDetailPenjualan.perumahan || selectedDetailPenjualan.kavling?.perumahan?.nama} - Blok {selectedDetailPenjualan.blok || selectedDetailPenjualan.kavling?.blok} No. {selectedDetailPenjualan.nomorUnit || selectedDetailPenjualan.kavling?.nomorUnit}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Metode Pembayaran</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDetailPenjualan.caraPembayaran?.replace('_', ' ') || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Harga Jual</p>
                  <p className="text-sm font-bold text-blue-700">
                    {selectedDetailPenjualan.hargaJual ? formatRupiah(selectedDetailPenjualan.hargaJual) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Transaksi</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDetailPenjualan.tanggal ? new Date(selectedDetailPenjualan.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedDetailPenjualan(null)} className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-black transition-colors cursor-pointer shadow-md">
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>

      <AjukanPencairanModal
        isOpen={!!pencairanModal}
        onClose={() => setPencairanModal(null)}
        preview={pencairanPreview}
        saleLabel={pencairanModal?.saleLabel ?? ""}
        isSubmitting={ajukanPencairanMutation.isPending}
        onConfirm={(selected) => void handleConfirmAjukanPencairan(selected)}
      />

    </div>
  );
};

export default Agents;
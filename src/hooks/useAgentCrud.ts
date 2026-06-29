/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
  useUploadAgentDoc,
  useGenerateAgentAccount,
  useGetAgents,
} from './queries/useAgent';
import { useGetPerusahaanAgents } from './queries/usePerusahaanAgent';
import type { AgentData, CreateAgentDTO, PicAgentData } from '../types/models/agent';
import { handleApiError } from '../utils/errorHandler';
import {
  getNikValidationError,
  isNikDuplicate,
  isNikValueUnchanged,
  sanitizeNikInput,
} from '../utils/nik';
import {
  applyPerusahaanCommercialToAgent,
  getPerusahaanById,
  isAgentPerusahaan,
} from '../utils/agentCommercialProfile';
import { AGENT_PLACEHOLDER_NIK_PREFIXES } from '../utils/pageSummaries';
import type { AgentFormState, UseAgentCrudOptions } from '../components/marketing/agentCrudTypes';

type AgentCommercialFormFields = Pick<
  AgentFormState,
  | 'feeMarketingPct'
  | 'feeClosingNominal'
  | 'potonganPph'
  | 'isPkp'
  | 'namaBank'
  | 'noRekening'
  | 'atasNamaRekening'
>;

const commercialFieldsFromPerusahaan = (
  perusahaan: ReturnType<typeof getPerusahaanById>,
): AgentCommercialFormFields => ({
  feeMarketingPct: perusahaan?.feeMarketingPct ?? '',
  feeClosingNominal: perusahaan?.feeClosingNominal ?? '',
  potonganPph: perusahaan?.potonganPph ?? '',
  isPkp: perusahaan?.isPkp ?? false,
  namaBank: perusahaan?.namaBank ?? '',
  noRekening: perusahaan?.noRekening ?? '',
  atasNamaRekening: perusahaan?.atasNamaRekening ?? '',
});

const resolvePerusahaanAgentIdFromAgent = (
  item: AgentData,
  options?: OpenAgentModalOptions,
): number | '' => {
  const candidate =
    options?.perusahaanAgentId ?? item.perusahaanAgent?.id ?? item.perusahaanAgentId ?? '';
  if (candidate === '' || candidate == null) return '';
  const id = Number(candidate);
  return Number.isFinite(id) && id > 0 ? id : '';
};

const toPayloadPerusahaanAgentId = (
  type: string,
  perusahaanAgentId: number | '',
): number | null => {
  if (!isAgentPerusahaan(type)) return null;
  const id = Number(perusahaanAgentId);
  return Number.isFinite(id) && id > 0 ? id : null;
};

export const createInitialFormState = (defaultAgentType: UseAgentCrudOptions['defaultAgentType']): AgentFormState => ({
  id: '',
  nik: '',
  nama: '',
  alamat: '',
  noHp: '',
  email: '',
  type: defaultAgentType,
  perusahaanAgentId: '',
  namaBank: '',
  noRekening: '',
  atasNamaRekening: '',
  feeMarketingPct: '',
  feeClosingNominal: '',
  potonganPph: '',
  isPkp: false,
  pics: [{ nama: '', noHp: '', alamat: '' }],
});

export interface OpenAgentModalOptions {
  perusahaanAgentId?: number;
}

export function useAgentCrud({ defaultAgentType, lockAgentType = false }: UseAgentCrudOptions) {
  const { data: perusahaanList = [] } = useGetPerusahaanAgents();
  const { data: allAgents = [] } = useGetAgents();
  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent();
  const deleteMutation = useDeleteAgent();
  const uploadDocMutation = useUploadAgentDoc();
  const generateAccountMutation = useGenerateAgentAccount();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<AgentFormState>(() => createInitialFormState(defaultAgentType));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingOriginalNik, setEditingOriginalNik] = useState('');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAgentDetail, setSelectedAgentDetail] = useState<AgentData | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedUploadAgent, setSelectedUploadAgent] = useState<AgentData | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const resolveAgentCommercial = (agent: AgentData) =>
    isAgentPerusahaan(agent.type) && agent.perusahaanAgent?.id
      ? applyPerusahaanCommercialToAgent(
          agent,
          getPerusahaanById(perusahaanList, agent.perusahaanAgent.id),
        )
      : agent;

  const openDetailModal = (item: AgentData) => {
    setSelectedAgentDetail(item);
    setIsDetailModalOpen(true);
  };

  const openUploadModal = (item: AgentData) => {
    setSelectedUploadAgent(item);
    setIsUploadModalOpen(true);
  };

  const openModal = (item?: AgentData, options?: OpenAgentModalOptions) => {
    if (item) {
      const perusahaanAgentId = resolvePerusahaanAgentIdFromAgent(item, options);
      const perusahaan = perusahaanAgentId
        ? getPerusahaanById(perusahaanList, perusahaanAgentId)
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
        type: lockAgentType ? defaultAgentType : (item.type || defaultAgentType),
        perusahaanAgentId,
        namaBank: commercial.namaBank || '',
        noRekening: commercial.noRekening || '',
        atasNamaRekening: commercial.atasNamaRekening || '',
        feeMarketingPct: commercial.feeMarketingPct ?? '',
        feeClosingNominal: commercial.feeClosingNominal ?? '',
        potonganPph: commercial.potonganPph ?? '',
        isPkp: commercial.isPkp ?? false,
        pics: item.pics && item.pics.length > 0 ? item.pics : [{ nama: '', noHp: '', alamat: '' }],
      });
      setEditingOriginalNik(item.nik);
      setIsEditing(true);
    } else {
      const perusahaanId = options?.perusahaanAgentId;
      const perusahaan = perusahaanId ? getPerusahaanById(perusahaanList, perusahaanId) : null;
      setFormData({
        ...createInitialFormState(defaultAgentType),
        type: defaultAgentType,
        perusahaanAgentId: perusahaanId ?? '',
        ...(perusahaan && isAgentPerusahaan(defaultAgentType)
          ? commercialFieldsFromPerusahaan(perusahaan)
          : {}),
      });
      setEditingOriginalNik('');
      setIsEditing(false);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(createInitialFormState(defaultAgentType));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const nextValue = name === 'nik' ? sanitizeNikInput(value) : value;
    setFormData((prev) => {
      const next = { ...prev, [name]: nextValue };
      if (name === 'perusahaanAgentId' && isAgentPerusahaan(prev.type)) {
        const perusahaan = getPerusahaanById(perusahaanList, value);
        return {
          ...prev,
          perusahaanAgentId: value === '' ? '' : Number(value),
          ...commercialFieldsFromPerusahaan(perusahaan),
        };
      }
      if (name === 'type' && value === 'PERUSAHAAN') {
        return {
          ...next,
          perusahaanAgentId: '',
          feeMarketingPct: '',
          feeClosingNominal: '',
          potonganPph: '',
          isPkp: false,
          namaBank: '',
          noRekening: '',
          atasNamaRekening: '',
        };
      }
      if (name === 'type' && value === 'PRIBADI') {
        return {
          ...next,
          perusahaanAgentId: '',
          feeMarketingPct: '',
          feeClosingNominal: '',
          potonganPph: '',
          isPkp: false,
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
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePICChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
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
      pics: [...prev.pics, { nama: '', noHp: '', alamat: '' }],
    }));
  };

  const handleRemovePIC = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pics: prev.pics.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const nikError = getNikValidationError(formData.nik, 'NIK', {
      unchangedFrom: isEditing ? editingOriginalNik : undefined,
    });
    if (nikError) newErrors.nik = nikError;
    else if (
      isNikDuplicate(formData.nik, allAgents, {
        excludeId: isEditing && formData.id ? Number(formData.id) : undefined,
        field: 'nik',
        ignorePlaceholderPrefixes: AGENT_PLACEHOLDER_NIK_PREFIXES,
        unchangedFrom: isEditing ? editingOriginalNik : undefined,
      })
    ) {
      newErrors.nik = 'NIK sudah terdaftar pada agent lain';
    }
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.noHp.trim()) newErrors.noHp = 'No HP wajib diisi';
    if (isAgentPerusahaan(formData.type)) {
      const perusahaanId = toPayloadPerusahaanAgentId(formData.type, formData.perusahaanAgentId);
      if (perusahaanId == null) {
        newErrors.perusahaanAgentId = 'Wajib memilih perusahaan';
      } else if (!perusahaanList.some((p) => p.id === perusahaanId)) {
        newErrors.perusahaanAgentId =
          'Perusahaan tidak ditemukan. Pilih ulang perusahaan yang masih terdaftar.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
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

    const isPerusahaan = isAgentPerusahaan(formData.type);
    const perusahaanAgentId = toPayloadPerusahaanAgentId(formData.type, formData.perusahaanAgentId);

    const basePayload = {
      nama: formData.nama,
      noHp: formData.noHp,
      email: formData.email || undefined,
      alamat: formData.alamat || undefined,
      type: formData.type,
      perusahaanAgentId,
      namaBank: isPerusahaan ? null : (formData.namaBank || null),
      noRekening: isPerusahaan ? null : (formData.noRekening || null),
      atasNamaRekening: isPerusahaan ? null : (formData.atasNamaRekening || null),
      pics: validPics.length > 0 ? validPics : undefined,
    } satisfies Omit<CreateAgentDTO, 'nik'>;

    const commercialPayload = !isPerusahaan
      ? {
          ...(formData.feeMarketingPct !== '' ? { feeMarketingPct: Number(formData.feeMarketingPct) } : {}),
          ...(formData.feeClosingNominal !== '' ? { feeClosingNominal: Number(formData.feeClosingNominal) } : {}),
          ...(formData.potonganPph !== '' ? { potonganPph: Number(formData.potonganPph) } : {}),
        }
      : {};

    const nikUnchanged = isEditing && isNikValueUnchanged(formData.nik, editingOriginalNik);

    try {
      if (isEditing && formData.id) {
        const updateData: Partial<CreateAgentDTO> = { ...basePayload, ...commercialPayload };
        if (!nikUnchanged) {
          updateData.nik = sanitizeNikInput(formData.nik);
        }
        await updateMutation.mutateAsync({ id: formData.id as number, data: updateData });
      } else {
        await createMutation.mutateAsync({
          ...basePayload,
          ...commercialPayload,
          nik: sanitizeNikInput(formData.nik),
        });
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
      alert('Gagal: Email agent masih kosong. Silakan edit dan isi email terlebih dahulu!');
      return;
    }
    const actionText = agent.hasAccount ? 'me-reset password' : 'membuat akun portal';
    const password = window.prompt(`Masukkan password baru untuk ${actionText} ${agent.nama} (Min. 6 karakter):`);

    if (password === null) return;
    if (password.length < 6) {
      alert('Password harus minimal 6 karakter!');
      return;
    }

    try {
      const res = await generateAccountMutation.mutateAsync({ id: agent.id, password });
      alert(
        res.message ||
          `Berhasil! Kredensial untuk ${agent.nama} telah disimpan. Silakan login menggunakan email: ${agent.email}`,
      );
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    }
  };

  const handleUploadDoc = async (docType: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUploadAgent) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Hanya format gambar dan PDF yang diperbolehkan!');
      e.target.value = '';
      return;
    }
    try {
      await uploadDocMutation.mutateAsync({ id: selectedUploadAgent.id, docType, file });
      alert('Dokumen berhasil diunggah!');

      setSelectedUploadAgent((prev) =>
        prev ? { ...prev, [docType]: URL.createObjectURL(file) } : prev,
      );
      if (selectedAgentDetail?.id === selectedUploadAgent.id) {
        setSelectedAgentDetail((prev) =>
          prev ? { ...prev, [docType]: URL.createObjectURL(file) } : prev,
        );
      }
    } catch (err: any) {
      const { message } = handleApiError(err);
      alert(message);
    } finally {
      e.target.value = '';
    }
  };

  return {
    perusahaanList,
    lockAgentType,
    isModalOpen,
    formData,
    errors,
    isEditing,
    isDetailModalOpen,
    selectedAgentDetail,
    isUploadModalOpen,
    selectedUploadAgent,
    previewImage,
    setPreviewImage,
    setIsDetailModalOpen,
    setIsUploadModalOpen,
    createMutation,
    updateMutation,
    uploadDocMutation,
    resolveAgentCommercial,
    openModal,
    openDetailModal,
    openUploadModal,
    closeModal,
    handleChange,
    handleCurrencyChange,
    handlePICChange,
    handleAddPIC,
    handleRemovePIC,
    handleSubmit,
    handleApprove,
    handleDelete,
    handleGenerateAccount,
    handleUploadDoc,
  };
}

export type AgentCrudApi = ReturnType<typeof useAgentCrud>;

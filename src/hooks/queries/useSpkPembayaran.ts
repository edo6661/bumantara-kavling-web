import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  spkPembayaranService,
  type SpkPembayaranListParams,
} from '../../services/spkPembayaran.service';
import type {
  CreateSpkPembayaranBody,
  SaveSpkKasbonDraftBody,
  UpdateSpkKasbonBody,
  UpdateSpkUpahBody,
} from '../../services/spkPembayaran.service';
import { SPK_KEYS } from './useSpk';

export const SPK_PEMBAYARAN_KEYS = {
  all: ['spk-pembayaran'] as const,
  bySpk: (spkId: number) => [...SPK_PEMBAYARAN_KEYS.all, 'spk', spkId] as const,
  kasbonDraft: (spkId: number) =>
    [...SPK_PEMBAYARAN_KEYS.all, 'spk', spkId, 'kasbon-draft'] as const,
  list: (params?: SpkPembayaranListParams) =>
    [...SPK_PEMBAYARAN_KEYS.all, 'list', params] as const,
};

export const useGetSpkPembayaranBySpk = (spkId: number | null) => {
  return useQuery({
    queryKey: SPK_PEMBAYARAN_KEYS.bySpk(spkId!),
    queryFn: () => spkPembayaranService.getBySpkId(spkId!),
    enabled: !!spkId,
  });
};

export const useGetKasbonDraft = (spkId: number | null, enabled = true) => {
  return useQuery({
    queryKey: SPK_PEMBAYARAN_KEYS.kasbonDraft(spkId!),
    queryFn: () => spkPembayaranService.getKasbonDraft(spkId!),
    enabled: !!spkId && enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

export const clearKasbonDraftCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  spkId: number,
) => {
  queryClient.removeQueries({ queryKey: SPK_PEMBAYARAN_KEYS.kasbonDraft(spkId) });
};

export const useGetSpkPembayaranList = (params: SpkPembayaranListParams) => {
  return useQuery({
    queryKey: SPK_PEMBAYARAN_KEYS.list(params),
    queryFn: () => spkPembayaranService.getPaginated(params),
  });
};

export const useCreateSpkPembayaranRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spkId, body }: { spkId: number; body: CreateSpkPembayaranBody }) =>
      spkPembayaranService.createRequest(spkId, body),
    onSuccess: (_, { spkId }) => {
      clearKasbonDraftCache(queryClient, spkId);
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.bySpk(spkId) });
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.detail(spkId) });
    },
  });
};

export const useSaveKasbonDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spkId, body }: { spkId: number; body: SaveSpkKasbonDraftBody }) =>
      spkPembayaranService.saveKasbonDraft(spkId, body),
    onSuccess: (data) => {
      // Draft hanya hidup di modal Ajukan Kasbon — jangan refresh histori / Bayar SPK.
      queryClient.setQueryData(SPK_PEMBAYARAN_KEYS.kasbonDraft(data.spkId), data);
    },
  });
};

export const useSubmitKasbonDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spkId }: { spkId: number }) => spkPembayaranService.submitKasbonDraft(spkId),
    onSuccess: (data) => {
      clearKasbonDraftCache(queryClient, data.spkId);
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.bySpk(data.spkId) });
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.detail(data.spkId) });
    },
  });
};

export const useUpdateSpkUpah = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateSpkUpahBody }) =>
      spkPembayaranService.updateUpah(id, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.bySpk(data.spkId) });
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.detail(data.spkId) });
    },
  });
};

export const useUpdateSpkKasbon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateSpkKasbonBody }) =>
      spkPembayaranService.updateKasbon(id, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.bySpk(data.spkId) });
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.detail(data.spkId) });
    },
  });
};

export const useBayarSpkPembayaran = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      files,
      tanggalPembayaran,
    }: {
      id: number;
      files: File[];
      tanggalPembayaran?: string;
    }) => spkPembayaranService.bayar(id, files, tanggalPembayaran),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.bySpk(data.spkId) });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.detail(data.spkId) });
    },
  });
};

export const useAddBuktiSpkPembayaran = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, files }: { id: number; files: File[] }) =>
      spkPembayaranService.addBukti(id, files),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.bySpk(data.spkId) });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.detail(data.spkId) });
    },
  });
};

export const useRemoveBuktiSpkPembayaran = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, buktiUrl }: { id: number; buktiUrl: string }) =>
      spkPembayaranService.removeBukti(id, buktiUrl),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.bySpk(data.spkId) });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.detail(data.spkId) });
    },
  });
};

export const useDeleteSpkPengurangan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; spkId: number }) =>
      spkPembayaranService.deletePengurangan(id),
    onSuccess: (_, { spkId }) => {
      clearKasbonDraftCache(queryClient, spkId);
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.bySpk(spkId) });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.detail(spkId) });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
    },
  });
};

export const useSetBsiCmsDilaporkan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, dilaporkan }: { ids: number[]; dilaporkan: boolean }) =>
      spkPembayaranService.setBsiCmsDilaporkan(ids, dilaporkan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
    },
  });
};

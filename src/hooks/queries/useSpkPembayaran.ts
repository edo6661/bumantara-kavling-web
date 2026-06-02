import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  spkPembayaranService,
  type SpkPembayaranListParams,
} from '../../services/spkPembayaran.service';
import type {
  CreateSpkPembayaranBody,
  UpdateSpkKasbonBody,
} from '../../services/spkPembayaran.service';
import { SPK_KEYS } from './useSpk';

export const SPK_PEMBAYARAN_KEYS = {
  all: ['spk-pembayaran'] as const,
  bySpk: (spkId: number) => [...SPK_PEMBAYARAN_KEYS.all, 'spk', spkId] as const,
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
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.bySpk(spkId) });
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.detail(spkId) });
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
      file,
      tanggalPembayaran,
    }: {
      id: number;
      file: File;
      tanggalPembayaran?: string;
    }) => spkPembayaranService.bayar(id, file, tanggalPembayaran),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.bySpk(data.spkId) });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.detail(data.spkId) });
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

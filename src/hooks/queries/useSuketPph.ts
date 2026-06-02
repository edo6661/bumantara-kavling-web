import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { suketPphService } from "../../services/suketPph.service";

export const useGetSuketPphByPenjualan = (penjualanId: number | null | undefined) => {
  return useQuery({
    queryKey: ["suket-pph", "penjualan", penjualanId],
    queryFn: () => suketPphService.getByPenjualan(penjualanId!),
    enabled: !!penjualanId,
  });
};

export const useGetAllSuketPphByPenjualan = (penjualanId: number | null | undefined) => {
  return useQuery({
    queryKey: ["suket-pph", "penjualan", penjualanId, "all"],
    queryFn: () => suketPphService.getAllByPenjualan(penjualanId!),
    enabled: !!penjualanId,
  });
};

export const useUploadSuketPph = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: suketPphService.upload,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["suket-pph", "penjualan", variables.penjualanId],
      });
      queryClient.invalidateQueries({
        queryKey: ["suket-pph", "penjualan", variables.penjualanId, "all"],
      });
    },
  });
};

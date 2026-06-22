import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fakturPajakPpnService } from "../../services/fakturPajakPpn.service";

export const useGetFakturPajakPpnByPenjualan = (
  penjualanId: number | null | undefined,
) => {
  return useQuery({
    queryKey: ["faktur-pajak-ppn", "penjualan", penjualanId],
    queryFn: () => fakturPajakPpnService.getByPenjualan(penjualanId!),
    enabled: !!penjualanId,
  });
};

export const useGetAllFakturPajakPpnByPenjualan = (
  penjualanId: number | null | undefined,
) => {
  return useQuery({
    queryKey: ["faktur-pajak-ppn", "penjualan", penjualanId, "all"],
    queryFn: () => fakturPajakPpnService.getAllByPenjualan(penjualanId!),
    enabled: !!penjualanId,
  });
};

export const useUploadFakturPajakPpn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fakturPajakPpnService.upload,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["faktur-pajak-ppn", "penjualan", variables.penjualanId],
      });
      queryClient.invalidateQueries({
        queryKey: ["faktur-pajak-ppn", "penjualan", variables.penjualanId, "all"],
      });
    },
  });
};

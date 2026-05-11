import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerPortalService } from "../../services/customerPortal.service";

export const CUSTOMER_PORTAL_KEYS = {
  dashboard: ["customer-portal-dashboard"] as const,
};

export const useGetCustomerDashboard = () => {
  return useQuery({
    queryKey: CUSTOMER_PORTAL_KEYS.dashboard,
    queryFn: customerPortalService.getDashboard,
  });
};

export const useUploadMyDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      docType,
      file,
      namaDokumen,
    }: {
      docType: string;
      file: File;
      namaDokumen?: string;
    }) => customerPortalService.uploadDocument(docType, file, namaDokumen),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CUSTOMER_PORTAL_KEYS.dashboard,
      });
    },
  });
};

export const useUploadMyBuktiTagihan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      customerPortalService.uploadBuktiTagihan(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CUSTOMER_PORTAL_KEYS.dashboard,
      });
    },
  });
};

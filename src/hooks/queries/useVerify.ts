import { useQuery } from "@tanstack/react-query";
import { verifyService } from "../../services/verify.service";

export const VERIFY_KEYS = {
  detail: (id: string) => ["verify-document", id] as const,
};

export const useVerifyDocument = (id: string) => {
  return useQuery({
    queryKey: VERIFY_KEYS.detail(id),
    queryFn: () => verifyService.verifyDocument(id),
    enabled: !!id,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

import { useQuery } from "@tanstack/react-query";
import { perumahanService } from "../../services/perumahan.service";

export const PERUMAHAN_KEYS = {
  all: ["perumahan"] as const,
};

export const useGetPerumahan = () => {
  return useQuery({
    queryKey: PERUMAHAN_KEYS.all,
    queryFn: perumahanService.getAll,
  });
};

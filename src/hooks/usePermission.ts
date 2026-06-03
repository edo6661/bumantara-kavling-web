import { useAuth } from "../context/AuthContext";
import { resolvePermission } from "../utils/permissions";

export const usePermission = (resource: string) => {
  const { user } = useAuth();
  return resolvePermission(user, resource);
};

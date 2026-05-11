import { useAuth } from "../context/AuthContext";

export const usePermission = (resource: string) => {
  const { user } = useAuth();

  if (!resource) {
    return { canCreate: true, canRead: true, canUpdate: true, canDelete: true };
  }

  if (user?.role === "SUPERADMIN") {
    return { canCreate: true, canRead: true, canUpdate: true, canDelete: true };
  }

  const permission = user?.permissions?.find(
    (p) => p.resource.toUpperCase() === resource.toUpperCase(),
  );

  return {
    canCreate: !!permission?.canCreate,
    canRead: !!permission?.canRead,
    canUpdate: !!permission?.canUpdate,
    canDelete: !!permission?.canDelete,
  };
};

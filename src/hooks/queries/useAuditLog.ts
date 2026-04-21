import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "../../services/auditLog.service";

export const AUDIT_LOG_KEYS = {
  all: ["audit-logs"] as const,
  list: (params: Record<string, unknown>) =>
    [...AUDIT_LOG_KEYS.all, params] as const,
};

export const useGetAuditLogs = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: AUDIT_LOG_KEYS.list(params || {}),
    queryFn: () => auditLogService.getAll(params),
  });
};

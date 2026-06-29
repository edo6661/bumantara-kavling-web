export type NotificationType =
  | 'SPK_PENGAJUAN_BARU'
  | 'SPK_MENUNGGU_APPROVAL'
  | 'SPK_APPROVAL_SELESAI'
  | 'SPK_DISETUJUI'
  | 'SPK_DIBAYAR'
  | 'UPLOAD_BUKTI'
  | 'GANTI_KAVLING'
  | 'KODE_BILLING_PPH'
  | 'AGENT_PENCAIRAN';

export interface NotificationItem {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  linkPath: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface UnreadCountResponse {
  count: number;
}

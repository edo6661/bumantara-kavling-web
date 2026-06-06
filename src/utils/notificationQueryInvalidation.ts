import type { QueryClient } from '@tanstack/react-query';
import type { NotificationItem, NotificationType } from '../types/models/notification';
import { SPK_PEMBAYARAN_KEYS } from '../hooks/queries/useSpkPembayaran';
import { SPK_KEYS } from '../hooks/queries/useSpk';
import { TAGIHAN_KEYS } from '../hooks/queries/useTagihan';
import { invalidateSidebarBadges } from '../hooks/queries/useSidebarBadges';

const SPK_NOTIFICATION_TYPES = new Set<NotificationType>([
  'SPK_PENGAJUAN_BARU',
  'SPK_DISETUJUI',
  'SPK_DIBAYAR',
]);

/** Invalidasi cache terkait saat notifikasi real-time masuk atau sebelum navigasi. */
export async function invalidateQueriesForNotification(
  queryClient: QueryClient,
  notif: Pick<NotificationItem, 'type' | 'linkPath'>,
): Promise<void> {
  const tasks: Promise<void>[] = [invalidateSidebarBadges(queryClient)];

  if (SPK_NOTIFICATION_TYPES.has(notif.type)) {
    tasks.push(
      queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all }),
      queryClient.invalidateQueries({ queryKey: SPK_KEYS.all }),
    );
  }

  if (notif.type === 'UPLOAD_BUKTI') {
    tasks.push(queryClient.invalidateQueries({ queryKey: TAGIHAN_KEYS.all }));
  }

  if (notif.linkPath === '/proyek/approve-kasbon' || notif.linkPath === '/finance/bayar-spk') {
    tasks.push(queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all }));
  }

  if (notif.linkPath === '/finance/approve-pembayaran') {
    tasks.push(queryClient.invalidateQueries({ queryKey: TAGIHAN_KEYS.all }));
  }

  await Promise.all(tasks);
}

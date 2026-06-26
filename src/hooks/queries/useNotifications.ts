import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../lib/socket';
import { notificationService } from '../../services/notification.service';
import { invalidateSidebarBadges } from './useSidebarBadges';
import { invalidateQueriesForNotification } from '../../utils/notificationQueryInvalidation';
import { SPK_PEMBAYARAN_KEYS } from './useSpkPembayaran';
import type {
  NotificationItem,
  NotificationListResponse,
} from '../../types/models/notification';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (page = 1) => [...NOTIFICATION_KEYS.all, 'list', page] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, 'unread-count'] as const,
};

const NOTIFICATION_ROLES = new Set(['ADMIN', 'SUPERADMIN']);

export const useNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const enabled =
    isAuthenticated && !!user && NOTIFICATION_ROLES.has(user.role);

  const { data: listData, isLoading } = useQuery({
    queryKey: NOTIFICATION_KEYS.list(1),
    queryFn: () => notificationService.getList(1, 30),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    enabled,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      invalidateSidebarBadges(queryClient);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      invalidateSidebarBadges(queryClient);
    },
  });

  useEffect(() => {
    if (!enabled) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const socket: Socket | null = getSocket();
    if (!socket) return;

    const handleNotification = (payload: NotificationItem) => {
      if (!payload?.id || !payload?.title) return;

      queryClient.setQueryData<NotificationListResponse | undefined>(
        NOTIFICATION_KEYS.list(1),
        (old) => {
          if (!old) return old;
          const exists = old.items.some((n) => n.id === payload.id);
          if (exists) return old;
          return {
            ...old,
            items: [payload, ...old.items].slice(0, 30),
          };
        },
      );
      queryClient.setQueryData<number>(
        NOTIFICATION_KEYS.unreadCount(),
        (old) => (old ?? 0) + 1,
      );
      invalidateSidebarBadges(queryClient);
      void invalidateQueriesForNotification(queryClient, payload);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.message,
          icon: '/favicon/favicon.ico',
        });
      }
    };

    const handleReconnect = async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      invalidateSidebarBadges(queryClient);
      await queryClient.invalidateQueries({ queryKey: SPK_PEMBAYARAN_KEYS.all });
    };

    const handleConnect = async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      invalidateSidebarBadges(queryClient);
    };

    socket.on('connect', handleConnect);
    socket.on('notifikasi', handleNotification);
    socket.io.on('reconnect', handleReconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('notifikasi', handleNotification);
      socket.io.off('reconnect', handleReconnect);
    };
  }, [enabled, user?.id, queryClient]);

  return {
    notifications: listData?.items ?? [],
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAll: markAllAsReadMutation.isPending,
  };
};

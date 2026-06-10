import { useMemo } from 'react';
import { useQueries, type QueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { canReadResource } from '../../utils/permissions';
import { spkPembayaranService } from '../../services/spkPembayaran.service';
import { tagihanService } from '../../services/tagihan.service';
import { kodeBillingPphService } from '../../services/kodeBillingPph.service';

export const SIDEBAR_BADGE_KEYS = {
  all: ['sidebar-badges'] as const,
  spkApprove: () => [...SIDEBAR_BADGE_KEYS.all, 'spk-approve'] as const,
  spkBayar: () => [...SIDEBAR_BADGE_KEYS.all, 'spk-bayar'] as const,
  tagihanApprove: () => [...SIDEBAR_BADGE_KEYS.all, 'tagihan-approve'] as const,
  kodeBillingPph: () => [...SIDEBAR_BADGE_KEYS.all, 'kode-billing-pph'] as const,
};

export const invalidateSidebarBadges = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: SIDEBAR_BADGE_KEYS.all });

type BadgeCounts = {
  spkApprove: number;
  spkBayar: number;
  tagihanApprove: number;
  kodeBillingPph: number;
};

/** Path → jumlah item yang menunggu tindakan user */
const PATH_BADGE_MAP: Record<string, keyof BadgeCounts> = {
  '/proyek/approve-kasbon': 'spkApprove',
  '/finance/bayar-spk': 'spkBayar',
  '/finance/approve-pembayaran': 'tagihanApprove',
  '/finance/bayar-kode-billing-pph': 'kodeBillingPph',
};

const SECTION_PATHS: Record<string, string[]> = {
  Finance: [
    '/finance/approve-pembayaran',
    '/finance/bayar-kode-billing-pph',
    '/finance/bayar-spk',
  ],
  Proyek: ['/proyek/approve-kasbon'],
};

const STAFF_ROLES = new Set(['ADMIN', 'SUPERADMIN', 'FINANCE', 'PENGAWAS', 'MANDOR']);

export const useSidebarBadges = () => {
  const { user, isAuthenticated } = useAuth();

  const canSpkApprove =
    user?.role === 'PENGAWAS' ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPERADMIN';

  const canSpkBayar =
    user?.role === 'FINANCE' ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPERADMIN';

  const canTagihanApprove =
    canReadResource(user, 'TAGIHAN') &&
    (user?.role === 'FINANCE' ||
      user?.role === 'ADMIN' ||
      user?.role === 'SUPERADMIN');

  const canKodeBillingPph =
    canReadResource(user, 'TAGIHAN') &&
    (user?.role === 'FINANCE' ||
      user?.role === 'ADMIN' ||
      user?.role === 'SUPERADMIN');

  const enabled = isAuthenticated && !!user && STAFF_ROLES.has(user.role);

  const results = useQueries({
    queries: [
      {
        queryKey: SIDEBAR_BADGE_KEYS.spkApprove(),
        queryFn: async () => {
          const res = await spkPembayaranService.getPaginated({
            page: 1,
            limit: 1,
            status: 'MENUNGGU_PERSETUJUAN',
          });
          return res.meta.totalItems;
        },
        enabled: enabled && canSpkApprove,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
      },
      {
        queryKey: SIDEBAR_BADGE_KEYS.spkBayar(),
        queryFn: async () => {
          const res = await spkPembayaranService.getPaginated({
            page: 1,
            limit: 1,
            status: 'MENUNGGU_PEMBAYARAN',
          });
          return res.meta.totalItems;
        },
        enabled: enabled && canSpkBayar,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
      },
      {
        queryKey: SIDEBAR_BADGE_KEYS.tagihanApprove(),
        queryFn: async () => {
          const res = await tagihanService.getAll({
            page: 1,
            limit: 1,
            status: 'MENUNGGU_KONFIRMASI',
          });
          return res.meta.totalItems;
        },
        enabled: enabled && canTagihanApprove,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
      },
      {
        queryKey: SIDEBAR_BADGE_KEYS.kodeBillingPph(),
        queryFn: async () => {
          const res = await kodeBillingPphService.getAll({
            page: 1,
            limit: 1,
            status: 'MENUNGGU_BAYAR',
          });
          return res.meta.totalItems;
        },
        enabled: enabled && canKodeBillingPph,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
      },
    ],
  });

  const counts = useMemo(
    () => ({
      spkApprove: results[0].data ?? 0,
      spkBayar: results[1].data ?? 0,
      tagihanApprove: results[2].data ?? 0,
      kodeBillingPph: results[3].data ?? 0,
    }),
    [results[0].data, results[1].data, results[2].data, results[3].data],
  );

  const getBadgeForPath = (path: string): number => {
    const key = PATH_BADGE_MAP[path];
    return key ? counts[key] : 0;
  };

  const getSectionBadge = (sectionTitle: string): number => {
    const paths = SECTION_PATHS[sectionTitle];
    if (!paths) return 0;
    return paths.reduce((sum, path) => sum + getBadgeForPath(path), 0);
  };

  return { counts, getBadgeForPath, getSectionBadge };
};

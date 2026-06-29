import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  CreditCard,
  FileText,
  Loader2,
  RefreshCw,
  Wallet,
  Users,
} from 'lucide-react';
import { invalidateQueriesForNotification } from '../utils/notificationQueryInvalidation';
import { useNotifications } from '../hooks/queries/useNotifications';
import type { NotificationItem, NotificationType } from '../types/models/notification';

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: typeof Bell; bg: string; text: string; label: string }
> = {
  SPK_PENGAJUAN_BARU: {
    icon: FileText,
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    label: 'SPK',
  },
  SPK_MENUNGGU_APPROVAL: {
    icon: FileText,
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    label: 'SPK',
  },
  SPK_APPROVAL_SELESAI: {
    icon: ClipboardCheck,
    bg: 'bg-sky-100',
    text: 'text-sky-700',
    label: 'SPK',
  },
  SPK_DISETUJUI: {
    icon: ClipboardCheck,
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    label: 'SPK',
  },
  SPK_DIBAYAR: {
    icon: Wallet,
    bg: 'bg-emerald-100',
    text: 'text-emerald-600',
    label: 'SPK',
  },
  UPLOAD_BUKTI: {
    icon: CreditCard,
    bg: 'bg-violet-100',
    text: 'text-violet-600',
    label: 'Finance',
  },
  GANTI_KAVLING: {
    icon: RefreshCw,
    bg: 'bg-amber-100',
    text: 'text-amber-600',
    label: 'Penjualan',
  },
  KODE_BILLING_PPH: {
    icon: FileText,
    bg: 'bg-rose-100',
    text: 'text-rose-600',
    label: 'PPh',
  },
  AGENT_PENCAIRAN: {
    icon: Users,
    bg: 'bg-cyan-100',
    text: 'text-cyan-600',
    label: 'Agent',
  },
};

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const NotificationRow = ({
  notif,
  onClick,
}: {
  notif: NotificationItem;
  onClick: () => void;
}) => {
  const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.SPK_PENGAJUAN_BARU;
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
        !notif.isRead ? 'bg-blue-50/40' : ''
      }`}
    >
      <div className="flex gap-3">
        <div
          className={`w-9 h-9 rounded-xl ${config.bg} ${config.text} flex items-center justify-center shrink-0 mt-0.5`}
        >
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                {config.label}
              </span>
              <p
                className={`text-[13px] leading-tight ${
                  !notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                }`}
              >
                {notif.title}
              </p>
            </div>
            {!notif.isRead && (
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
            )}
          </div>
          <p className="text-[12px] text-slate-500 leading-relaxed mt-1 line-clamp-2">
            {notif.message}
          </p>
          <p className="text-[10px] font-medium text-slate-400 mt-1.5">
            {formatRelativeTime(notif.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAll,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { unreadList, readList } = useMemo(() => {
    const unread = notifications.filter((n) => !n.isRead);
    const read = notifications.filter((n) => n.isRead);
    return { unreadList: unread, readList: read };
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClickNotification = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    if (notif.linkPath) {
      await invalidateQueriesForNotification(queryClient, notif);
      navigate(notif.linkPath);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
          unreadCount > 0
            ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
        }`}
        aria-label={`Notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ''}`}
      >
        <Bell size={18} className={unreadCount > 0 ? 'fill-blue-100' : ''} />
        {unreadCount > 0 && (
          <>
            <span className="absolute inset-0 rounded-xl bg-blue-400/20 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white z-10">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[360px] sm:w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3.5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h3 className="font-bold text-slate-900 text-[14px]">Notifikasi</h3>
              {unreadCount > 0 ? (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {unreadCount} belum dibaca
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-0.5">Semua sudah dibaca</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isMarkingAll ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <CheckCheck size={12} />
                )}
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-10 flex flex-col items-center justify-center">
                <Loader2 size={24} className="text-slate-300 animate-spin mb-2" />
                <p className="text-slate-400 text-[13px]">Memuat notifikasi...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Bell size={22} className="text-slate-300" />
                </div>
                <p className="text-slate-600 text-[13px] font-medium">Tidak ada notifikasi</p>
                <p className="text-slate-400 text-[12px] mt-1">
                  Anda akan menerima pemberitahuan di sini
                </p>
              </div>
            ) : (
              <div>
                {unreadList.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Belum dibaca
                    </p>
                    <div className="divide-y divide-slate-50">
                      {unreadList.map((notif) => (
                        <NotificationRow
                          key={notif.id}
                          notif={notif}
                          onClick={() => handleClickNotification(notif)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {readList.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Sudah dibaca
                    </p>
                    <div className="divide-y divide-slate-50">
                      {readList.map((notif) => (
                        <NotificationRow
                          key={notif.id}
                          notif={notif}
                          onClick={() => handleClickNotification(notif)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

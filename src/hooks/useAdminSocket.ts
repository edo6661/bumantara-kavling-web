import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

export interface AdminNotificationPayload {
  id?: string;
  type: "UPLOAD_BUKTI" | "GANTI_KAVLING" | string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead?: boolean;
  createdAt?: Date;
}

let socket: Socket | null = null;

export const useAdminSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<
    AdminNotificationPayload[]
  >([]);

  // Hitung notifikasi yang belum dibaca
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Fungsi untuk menandai semua notifikasi sudah dibaca
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Fungsi untuk menghapus semua notifikasi
  const clearNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (
      isAuthenticated &&
      user &&
      (user.role === "ADMIN" || user.role === "SUPERADMIN")
    ) {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
      const backendUrl = apiUrl.replace(/\/api\/v1\/?$/, "");

      if (!socket) {
        socket = io(backendUrl, { withCredentials: true });
      }

      socket.on("connect", () => {
        console.log("🟢 Terhubung ke WebSocket Server");
        socket?.emit("join-admin");
      });

      // Menghindari duplikasi listener saat komponen re-render
      socket.off("notifikasi-admin");
      socket.on("notifikasi-admin", (payload: AdminNotificationPayload) => {
        console.log("🔔 Notifikasi baru:", payload);

        const newNotif = {
          ...payload,
          id: Date.now().toString(),
          isRead: false,
          createdAt: new Date(),
        };

        // Tambahkan ke paling atas
        setNotifications((prev) => [newNotif, ...prev]);

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(payload.title, {
            body: payload.message,
            icon: "/favicon/favicon.ico",
          });
        }
      });

      return () => {
        if (socket) {
          socket.disconnect();
          socket = null;
        }
      };
    }
  }, [isAuthenticated, user]);

  return { notifications, unreadCount, markAllAsRead, clearNotifications };
};

import { isAxiosError } from "axios";
import type { ActionResult } from "../types/common";

export const handleApiError = (error: unknown): ActionResult => {
  if (import.meta.env.DEV) {
    console.error("API Request failed:", error);
  }

  if (isAxiosError(error)) {
    if (!error.response) {
      if (error.code === "ERR_NETWORK") {
        return {
          success: false,
          message: "Gagal terhubung. Pastikan internet Anda stabil",
        };
      }
      if (error.code === "ECONNABORTED") {
        return {
          success: false,
          message:
            "Waktu permintaan habis (Timeout). Server terlalu lama merespons.",
        };
      }
      return {
        success: false,
        message: "Terjadi gangguan jaringan yang tidak diketahui.",
      };
    }

    const status = error.response.status;
    const serverMessage = error.response.data?.message;
    let defaultMessage = "Terjadi kesalahan pada server.";

    switch (status) {
      case 400:
        defaultMessage =
          "Data yang dikirim tidak valid. Periksa kembali isian Anda.";
        break;
      case 401:
        defaultMessage =
          "Sesi Anda tidak valid atau telah habis. Silakan login kembali.";
        break;
      case 403:
        defaultMessage =
          "Anda tidak memiliki izin (akses ditolak) untuk melakukan tindakan ini.";
        break;
      case 404:
        defaultMessage = "Data atau endpoint tidak ditemukan di server.";
        break;
      case 409:
        defaultMessage =
          "Terjadi konflik data (misalnya data sudah terdaftar sebelumnya).";
        break;
      case 500:
        defaultMessage =
          "Terjadi masalah internal pada server. Tim kami sedang menanganinya.";
        break;
      case 502:
      case 503:
      case 504:
        defaultMessage =
          "Server sedang sibuk atau dalam pemeliharaan. Cobalah beberapa saat lagi.";
        break;
    }

    return {
      success: false,
      message: serverMessage || defaultMessage,
      errors: error.response.data?.error,
    };
  }

  return {
    success: false,
    message:
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan sistem yang tidak terduga.",
  };
};

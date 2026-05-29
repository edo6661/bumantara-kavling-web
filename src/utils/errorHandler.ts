import { isAxiosError } from "axios";
import type { ActionResult } from "../types/common";

/** Ubah pesan teknis dari server menjadi teks yang ramah pengguna. */
export function toUserFriendlyMessage(message: string | undefined): string {
  if (!message?.trim()) {
    return "Terjadi kesalahan. Silakan coba lagi.";
  }

  const lower = message.toLowerCase();

  if (
    lower.includes("request timeout") ||
    /\btimeout\b/.test(lower) ||
    lower.includes("econnaborted") ||
    lower.includes("etimedout")
  ) {
    return "Unggah file gagal karena koneksi terlalu lama. Periksa koneksi internet Anda, kurangi ukuran file, lalu coba lagi.";
  }

  if (
    lower.includes("econnreset") ||
    lower.includes("network error") ||
    lower.includes("err_network") ||
    lower.includes("gangguan jaringan")
  ) {
    return "Unggah file gagal karena gangguan jaringan. Silakan coba lagi dalam beberapa saat.";
  }

  if (
    lower.includes("file too large") ||
    lower.includes("terlalu besar") ||
    lower.includes("limit_file_size") ||
    lower.includes("ukuran file") ||
    lower.includes("cloudinary") ||
    lower.includes("penyimpanan cloud")
  ) {
    return message;
  }

  if (
    lower.includes("cloudinary") ||
    lower.includes("unknown cloudinary") ||
    lower.includes("internal server error")
  ) {
    return "Gagal mengunggah file. Silakan coba lagi dalam beberapa saat.";
  }

  if (lower.startsWith("gagal upload file:") || lower.startsWith("gagal memproses gambar:")) {
    return "Gagal mengunggah file. Silakan periksa file Anda dan coba lagi.";
  }

  return message;
}

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
      case 413:
        defaultMessage =
          "Ukuran file terlalu besar. Kurangi ukuran file lalu coba unggah lagi.";
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

    const rawMessage = serverMessage || defaultMessage;
    return {
      success: false,
      message: toUserFriendlyMessage(rawMessage),
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

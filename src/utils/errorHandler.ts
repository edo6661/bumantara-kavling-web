import { isAxiosError } from "axios";
import type { ActionResult } from "../types/common";

const GENERIC_SERVER_MESSAGES = new Set(["internal server error"]);

function isGenericServerMessage(message: string | undefined): boolean {
  if (!message?.trim()) return true;
  return GENERIC_SERVER_MESSAGES.has(message.toLowerCase().trim());
}

function extractDetailMessage(errorPayload: unknown): string | null {
  if (!errorPayload || typeof errorPayload !== "object") return null;

  if ("message" in errorPayload && typeof errorPayload.message === "string") {
    return errorPayload.message;
  }

  if ("detail" in errorPayload && typeof errorPayload.detail === "string") {
    return errorPayload.detail;
  }

  return null;
}

/** Pesan teknis dari server (dev) disederhanakan agar mudah ditindaklanjuti. */
function toDevServerErrorMessage(detail: string): string {
  const lower = detail.toLowerCase();

  if (
    lower.includes("does not exist in the current database") ||
    lower.includes("unknown column") ||
    lower.includes("p2022") ||
    lower.includes("p2021")
  ) {
    return "Database belum diperbarui. Jalankan `npx prisma migrate deploy` di backend.";
  }

  return detail.length > 240 ? `${detail.slice(0, 240)}...` : detail;
}

/** Ubah pesan teknis upload menjadi teks yang ramah pengguna. */
export function toUploadFriendlyMessage(message: string | undefined): string {
  if (!message?.trim()) {
    return "Gagal mengunggah file. Silakan coba lagi.";
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

  if (lower.includes("unknown cloudinary")) {
    return "Gagal mengunggah file. Silakan coba lagi dalam beberapa saat.";
  }

  if (
    lower.startsWith("gagal upload file:") ||
    lower.startsWith("gagal memproses gambar:")
  ) {
    return "Gagal mengunggah file. Silakan periksa file Anda dan coba lagi.";
  }

  return message;
}

/** @deprecated Gunakan `toUploadFriendlyMessage` untuk alur upload. */
export function toUserFriendlyMessage(message: string | undefined): string {
  return toUploadFriendlyMessage(message);
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
    const serverMessage = error.response.data?.message as string | undefined;
    const errorPayload = error.response.data?.error;
    const detailMessage = extractDetailMessage(errorPayload);

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

    const isGenericServerFailure =
      status >= 500 && isGenericServerMessage(serverMessage);

    let message: string;
    if (isGenericServerFailure) {
      if (import.meta.env.DEV && detailMessage) {
        message = toDevServerErrorMessage(detailMessage);
      } else {
        message = defaultMessage;
      }
    } else if (status === 413) {
      message = toUploadFriendlyMessage(serverMessage || defaultMessage);
    } else {
      message = serverMessage || defaultMessage;
    }

    const fieldErrors = Array.isArray(errorPayload) ? errorPayload : undefined;

    return {
      success: false,
      message,
      errors: fieldErrors,
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

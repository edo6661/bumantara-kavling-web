import { isAxiosError } from "axios";
import type { ActionResult } from "../types/common";

export const handleApiError = (error: unknown): ActionResult => {
  if (import.meta.env.DEV) {
    console.error("API Request failed:", error);
  }

  if (isAxiosError(error)) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Terjadi kesalahan pada server. Silakan coba lagi.",
      errors: error.response?.data?.error,
    };
  }

  return {
    success: false,
    message:
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan tidak terduga.",
  };
};

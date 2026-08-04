import api from "../lib/axios";

function parseFilenameFromDisposition(
  header: string | undefined,
  fallback: string,
): string {
  if (!header) return fallback;
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const plainMatch = /filename="?([^";]+)"?/i.exec(header);
  return plainMatch?.[1]?.trim() || fallback;
}

async function rehydrateBlobError(error: unknown): Promise<void> {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { data?: unknown } }).response?.data instanceof Blob
  ) {
    const blob = (error as { response: { data: Blob } }).response.data;
    try {
      const text = await blob.text();
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed?.message) {
        (error as { response: { data: unknown } }).response.data = parsed;
      }
    } catch {
      // biarkan error asli
    }
  }
}

export const adminService = {
  exportDatabaseExcel: async (): Promise<void> => {
    try {
      const response = await api.get("/admin/export/database/excel", {
        responseType: "blob",
        timeout: 5 * 60 * 1000,
      });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const fallback = `Export_Database_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const filename = parseFilenameFromDisposition(
        response.headers["content-disposition"] as string | undefined,
        fallback,
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      await rehydrateBlobError(error);
      throw error;
    }
  },
};

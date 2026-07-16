import api from '../lib/axios';

export interface TukangData {
  id: number;
  nik: string;
  nama: string;
  fileKtp: string | null;
  sudahMenikah: boolean | null;
  jumlahAnak: number | null;
  mandorId: number | null;
  mandorUsername?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertTukangBody {
  nik: string;
  nama: string;
  /** NIK lama saat edit — agar koreksi NIK update baris yang sama, bukan create. */
  originalNik?: string;
  sudahMenikah: boolean;
  jumlahAnak: number;
}

function parseFilenameFromDisposition(
  disposition: string | undefined,
  fallback: string,
): string {
  if (!disposition) return fallback;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/"/g, ''));
  }
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1]?.trim() || fallback;
}

export const tukangService = {
  getList: async (search?: string): Promise<TukangData[]> => {
    const response = await api.get('/tukang', {
      params: search ? { search } : undefined,
    });
    return response.data.data;
  },

  exportExcel: async (search?: string): Promise<void> => {
    try {
      const response = await api.get('/tukang/export/excel', {
        params: search ? { search } : undefined,
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fallback = `Data_Tukang_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const filename = parseFilenameFromDisposition(
        response.headers['content-disposition'] as string | undefined,
        fallback,
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      // responseType blob: body error JSON jadi Blob — parse dulu agar handleApiError bisa baca message
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
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
          // biarkan error asli jika bukan JSON
        }
      }
      throw error;
    }
  },

  upsert: async (body: UpsertTukangBody): Promise<TukangData> => {
    const response = await api.post('/tukang', body);
    return response.data.data;
  },

  uploadKtp: async (nik: string, file: File): Promise<TukangData> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(
      `/tukang/${encodeURIComponent(nik)}/upload-ktp`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tukang/${id}`);
  },
};

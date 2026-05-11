import api from "../lib/axios";

export const customerPortalService = {
  getDashboard: async () => {
    const response = await api.get("/customers/me/dashboard");
    return response.data.data;
  },

  uploadDocument: async (docType: string, file: File, namaDokumen?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (namaDokumen) formData.append("namaDokumen", namaDokumen);

    const response = await api.patch(
      `/customers/me/upload/${docType}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  },
  uploadBuktiTagihan: async (tagihanId: number, file: File) => {
    const formData = new FormData();
    formData.append("fileBukti", file);
    const response = await api.patch(
      `/customers/me/tagihan/${tagihanId}/upload-bukti`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },
};

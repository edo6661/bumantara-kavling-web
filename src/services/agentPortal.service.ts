import api from "../lib/axios";

export const agentPortalService = {
  getProfile: async () => {
    const response = await api.get("/agents/me/profile");
    return response.data.data;
  },

  uploadDocument: async (docType: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.patch(`/agents/me/upload/${docType}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
};

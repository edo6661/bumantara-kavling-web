import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Input from "../components/shared/Input";
import PageLoader from "./PageLoader";
import { useGetProfile, useUpdateProfile } from "../hooks/queries/useProfile";
import { handleApiError } from "../utils/errorHandler";
import { storage } from "../utils/storage";
import type { User } from "../types/models/user";

const Profile = () => {
  const { user, setUser } = useAuth();
  const { data: profile, isLoading } = useGetProfile();
  const updateMutation = useUpdateProfile();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    namaBank: "",
    noRekening: "",
    atasNamaRekening: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isMandor = (profile?.role ?? user?.role) === "MANDOR";

  useEffect(() => {
    if (!profile) return;
    setFormData({
      username: profile.username,
      email: profile.email,
      password: "",
      confirmPassword: "",
      namaBank: profile.mandor?.namaBank ?? "",
      noRekening: profile.mandor?.noRekening ?? "",
      atasNamaRekening: profile.mandor?.atasNamaRekening ?? "",
    });
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = "Username wajib diisi";
    if (!formData.email.trim()) newErrors.email = "Email wajib diisi";
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password tidak cocok";
    }
    if (isMandor) {
      if (!formData.namaBank.trim()) newErrors.namaBank = "Nama bank wajib diisi";
      if (!formData.noRekening.trim()) newErrors.noRekening = "Nomor rekening wajib diisi";
      if (!formData.atasNamaRekening.trim()) {
        newErrors.atasNamaRekening = "Atas nama rekening wajib diisi";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !profile) return;

    const payload: {
      username?: string;
      email?: string;
      password?: string;
      mandor?: { namaBank: string; noRekening: string; atasNamaRekening: string };
    } = {};

    if (formData.username.trim() !== profile.username) {
      payload.username = formData.username.trim();
    }
    if (formData.email.trim() !== profile.email) {
      payload.email = formData.email.trim();
    }
    if (formData.password) {
      payload.password = formData.password;
    }
    if (isMandor) {
      const mandorChanged =
        !profile.mandor ||
        formData.namaBank.trim() !== profile.mandor.namaBank ||
        formData.noRekening.trim() !== profile.mandor.noRekening ||
        formData.atasNamaRekening.trim() !== profile.mandor.atasNamaRekening;
      if (!profile.mandor || mandorChanged) {
        payload.mandor = {
          namaBank: formData.namaBank.trim(),
          noRekening: formData.noRekening.trim(),
          atasNamaRekening: formData.atasNamaRekening.trim(),
        };
      }
    }

    if (Object.keys(payload).length === 0) {
      alert("Tidak ada perubahan data.");
      return;
    }

    try {
      const updated = await updateMutation.mutateAsync(payload);
      const nextUser: User = {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        role: updated.role ?? profile.role,
        mandor: updated.mandor ?? null,
        permissions: user?.permissions,
      };
      storage.setUser(nextUser);
      setUser(nextUser);

      if (payload.password || payload.email) {
        alert("Data berhasil diperbarui. Silakan login kembali jika email/password diubah.");
        return;
      }

      alert("Profil berhasil diperbarui.");
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (error: unknown) {
      const { message, errors: backendErrors } = handleApiError(error);
      if (backendErrors && Array.isArray(backendErrors)) {
        const fieldErrors: Record<string, string> = {};
        backendErrors.forEach((err: { field: string; message: string }) => {
          const mappedField =
            err.field === "mandor.namaBank"
              ? "namaBank"
              : err.field === "mandor.noRekening"
                ? "noRekening"
                : err.field === "mandor.atasNamaRekening"
                  ? "atasNamaRekening"
                  : err.field;
          fieldErrors[mappedField] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        alert(message);
      }
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profil Saya</h1>
        <p className="text-sm text-slate-500 mt-1">
          Perbarui data akun Anda. Role:{" "}
          <span className="font-semibold text-slate-700">{profile?.role ?? user?.role}</span>
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        <Input
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />
        <Input
          label="Password Baru (Opsional)"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Kosongkan jika tidak ingin mengubah"
        />
        <Input
          label="Konfirmasi Password Baru"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="Ulangi password baru"
        />

        {isMandor && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Rekening Mandor
            </h2>
            <Input
              label="Nama Bank"
              name="namaBank"
              value={formData.namaBank}
              onChange={handleChange}
              error={errors.namaBank}
            />
            <Input
              label="Nomor Rekening"
              name="noRekening"
              value={formData.noRekening}
              onChange={handleChange}
              error={errors.noRekening}
            />
            <Input
              label="Atas Nama Rekening"
              name="atasNamaRekening"
              value={formData.atasNamaRekening}
              onChange={handleChange}
              error={errors.atasNamaRekening}
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;

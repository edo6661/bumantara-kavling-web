import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Input from "../components/shared/Input";
import PageLoader from "./PageLoader";
import { useGetProfile, useUpdateProfile } from "../hooks/queries/useProfile";
import { handleApiError } from "../utils/errorHandler";
import { storage } from "../utils/storage";
import type { User } from "../types/models/user";
import type { MandorRekeningFormRow } from "../utils/mandorRekening";

const newRekeningRow = (isDefault = false): MandorRekeningFormRow => ({
  key: `${Date.now()}-${Math.random()}`,
  label: "",
  namaBank: "",
  noRekening: "",
  atasNamaRekening: "",
  isDefault,
});

const Profile = () => {
  const { user, setUser } = useAuth();
  const { data: profile, isLoading } = useGetProfile();
  const updateMutation = useUpdateProfile();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [rekeningRows, setRekeningRows] = useState<MandorRekeningFormRow[]>([
    newRekeningRow(true),
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isMandor = (profile?.role ?? user?.role) === "MANDOR";

  useEffect(() => {
    if (!profile) return;
    setFormData({
      username: profile.username,
      email: profile.email,
      password: "",
      confirmPassword: "",
    });

    const list = profile.mandor?.rekeningList;
    if (list?.length) {
      setRekeningRows(
        list.map((item) => ({
          key: `rek-${item.id}`,
          id: item.id,
          label: item.label ?? "",
          namaBank: item.namaBank,
          noRekening: item.noRekening,
          atasNamaRekening: item.atasNamaRekening,
          isDefault: !!item.isDefault,
        })),
      );
    } else if (profile.mandor) {
      setRekeningRows([
        {
          key: "rek-default",
          label: "Utama",
          namaBank: profile.mandor.namaBank,
          noRekening: profile.mandor.noRekening,
          atasNamaRekening: profile.mandor.atasNamaRekening,
          isDefault: true,
        },
      ]);
    }
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

  const updateRekeningRow = (
    key: string,
    patch: Partial<MandorRekeningFormRow>,
  ) => {
    setRekeningRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  const setDefaultRekening = (key: string) => {
    setRekeningRows((prev) =>
      prev.map((row) => ({ ...row, isDefault: row.key === key })),
    );
  };

  const addRekeningRow = () => {
    setRekeningRows((prev) => [...prev, newRekeningRow(false)]);
  };

  const removeRekeningRow = (key: string) => {
    setRekeningRows((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((row) => row.key !== key);
      if (!next.some((row) => row.isDefault)) {
        next[0] = { ...next[0]!, isDefault: true };
      }
      return next;
    });
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
      rekeningRows.forEach((row, index) => {
        const prefix = `rekening.${index}`;
        if (!row.namaBank.trim()) newErrors[`${prefix}.namaBank`] = "Nama bank wajib diisi";
        if (!row.noRekening.trim()) {
          newErrors[`${prefix}.noRekening`] = "Nomor rekening wajib diisi";
        }
        if (!row.atasNamaRekening.trim()) {
          newErrors[`${prefix}.atasNamaRekening`] = "Atas nama rekening wajib diisi";
        }
      });
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
      mandorRekeningList?: Array<{
        id?: number;
        label?: string;
        namaBank: string;
        noRekening: string;
        atasNamaRekening: string;
        isDefault?: boolean;
      }>;
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
      const nextList = rekeningRows.map((row, index) => ({
        id: row.id,
        label: row.label.trim() || (index === 0 ? "Utama" : `Rekening ${index + 1}`),
        namaBank: row.namaBank.trim(),
        noRekening: row.noRekening.trim(),
        atasNamaRekening: row.atasNamaRekening.trim(),
        isDefault: row.isDefault,
      }));

      const currentList = profile.mandor?.rekeningList ?? [];
      const rekeningChanged =
        nextList.length !== currentList.length ||
        nextList.some((row, index) => {
          const current = currentList[index];
          if (!current) return true;
          return (
            row.id !== current.id ||
            row.label !== (current.label ?? "") ||
            row.namaBank !== current.namaBank ||
            row.noRekening !== current.noRekening ||
            row.atasNamaRekening !== current.atasNamaRekening ||
            !!row.isDefault !== !!current.isDefault
          );
        }) ||
        (!currentList.length &&
          profile.mandor &&
          (nextList[0]?.namaBank !== profile.mandor.namaBank ||
            nextList[0]?.noRekening !== profile.mandor.noRekening ||
            nextList[0]?.atasNamaRekening !== profile.mandor.atasNamaRekening));

      if (rekeningChanged) {
        payload.mandorRekeningList = nextList;
      }
    }

    if (Object.keys(payload).length === 0) {
      alert("Tidak ada perubahan data.");
      return;
    }

    try {
      const updated = await updateMutation.mutateAsync(payload);
      const defaultRek =
        updated.mandor?.rekeningList?.find((item: { isDefault?: boolean }) => item.isDefault) ??
        updated.mandor?.rekeningList?.[0] ??
        updated.mandor;
      const nextUser: User = {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        role: updated.role ?? profile.role,
        mandor: defaultRek
          ? {
              namaBank: defaultRek.namaBank,
              noRekening: defaultRek.noRekening,
              atasNamaRekening: defaultRek.atasNamaRekening,
              rekeningList: updated.mandor?.rekeningList,
            }
          : null,
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
          fieldErrors[err.field] = err.message;
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
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Rekening Mandor
              </h2>
              <button
                type="button"
                onClick={addRekeningRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <Plus size={14} />
                Tambah Rekening
              </button>
            </div>

            {rekeningRows.map((row, index) => (
              <div
                key={row.key}
                className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Rekening {index + 1}
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="radio"
                        name="defaultRekening"
                        checked={row.isDefault}
                        onChange={() => setDefaultRekening(row.key)}
                        className="text-blue-600"
                      />
                      Utama
                    </label>
                    {rekeningRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRekeningRow(row.key)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Hapus rekening"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <Input
                  label="Label (Opsional)"
                  name={`label-${row.key}`}
                  value={row.label}
                  onChange={(e) => updateRekeningRow(row.key, { label: e.target.value })}
                  placeholder="Contoh: Rekening pribadi"
                />
                <Input
                  label="Nama Bank"
                  name={`namaBank-${row.key}`}
                  value={row.namaBank}
                  onChange={(e) => updateRekeningRow(row.key, { namaBank: e.target.value })}
                  error={errors[`rekening.${index}.namaBank`]}
                />
                <Input
                  label="Nomor Rekening"
                  name={`noRekening-${row.key}`}
                  value={row.noRekening}
                  onChange={(e) => updateRekeningRow(row.key, { noRekening: e.target.value })}
                  error={errors[`rekening.${index}.noRekening`]}
                />
                <Input
                  label="Atas Nama Rekening"
                  name={`atasNamaRekening-${row.key}`}
                  value={row.atasNamaRekening}
                  onChange={(e) =>
                    updateRekeningRow(row.key, { atasNamaRekening: e.target.value })
                  }
                  error={errors[`rekening.${index}.atasNamaRekening`]}
                />
              </div>
            ))}
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

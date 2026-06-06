/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import Input from "../../components/shared/Input";
import Select from "../../components/shared/Select";
import PageLoader from "../PageLoader";
import { formatDate } from "../../utils/formatters";
import {
  useGetUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "../../hooks/queries/useUser";
import type { UserData, CreateUserDTO } from "../../services/user.service";
import { handleApiError } from "../../utils/errorHandler";

const initialFormState: CreateUserDTO & { id: number | "" } = {
  id: "",
  username: "",
  email: "",
  password: "",
  role: "",
  mandor: undefined,
};

const UserManagement = () => {
  const { user } = useAuth();

  // 1. SEMUA HOOKS HARUS DIPANGGIL DI ATAS (TIDAK BOLEH ADA RETURN SEBELUM INI)
  const { data: usersData, isLoading } = useGetUsers({ limit: 100 });
  const usersList = usersData?.items || [];

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  // 2. RBAC Check menggunakan useEffect
  // useEffect(() => {
  //   if (user && user.role !== "SUPERADMIN") {
  //     navigate("/", { replace: true });
  //   }
  // }, [user, navigate]);

  // 3. Early return MENCEGAH render UI jika bukan SUPERADMIN
  if (user?.role !== "SUPERADMIN") {
    return null;
  }

  const columns = [
    { header: "Username", accessor: "username", render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },
    { header: "Email", accessor: "email" },
    {
      header: "Role",
      accessor: "role",
      render: (val: string) => {
        let bgClass = "bg-slate-100 text-slate-700 border-slate-200";
        if (val === "SUPERADMIN") bgClass = "bg-purple-100 text-purple-800 border-purple-200";
        if (val === "ADMIN") bgClass = "bg-blue-100 text-blue-800 border-blue-200";
        if (val === "FINANCE") bgClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
        if (val === "MARKETING") bgClass = "bg-amber-100 text-amber-800 border-amber-200";
        if (val === "BANK") bgClass = "bg-teal-100 text-teal-800 border-teal-200";
        if (val === "MANDOR") bgClass = "bg-orange-100 text-orange-800 border-orange-200";
        if (val === "PENGAWAS") bgClass = "bg-sky-100 text-sky-800 border-sky-200";

        return <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border ${bgClass}`}>{val}</span>;
      },
    },
    { header: "Tanggal Dibuat", accessor: "createdAt", render: (val: string) => formatDate(val) },
  ];

  const openModal = (item?: UserData) => {
    if (item) {
      setFormData({
        id: item.id,
        username: item.username,
        email: item.email,
        password: "",
        role: item.role,
        mandor: item.mandor
          ? {
              namaBank: item.mandor.namaBank,
              noRekening: item.mandor.noRekening,
              atasNamaRekening: item.mandor.atasNamaRekening,
            }
          : undefined,
      });
      setIsEditing(true);
    } else {
      setFormData(initialFormState);
      setIsEditing(false);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleMandorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      mandor: {
        namaBank: prev.mandor?.namaBank ?? "",
        noRekening: prev.mandor?.noRekening ?? "",
        atasNamaRekening: prev.mandor?.atasNamaRekening ?? "",
        [name]: value,
      },
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = "Username wajib diisi";
    if (!formData.email.trim()) newErrors.email = "Email wajib diisi";
    if (!isEditing && !formData.password?.trim()) newErrors.password = "Password wajib diisi untuk user baru";
    if (!formData.role.trim()) newErrors.role = "Role wajib dipilih";
    if (formData.role === "MANDOR") {
      if (!formData.mandor?.namaBank?.trim()) newErrors.namaBank = "Nama bank wajib diisi untuk mandor";
      if (!formData.mandor?.noRekening?.trim()) newErrors.noRekening = "Nomor rekening wajib diisi untuk mandor";
      if (!formData.mandor?.atasNamaRekening?.trim()) newErrors.atasNamaRekening = "Atas nama rekening wajib diisi untuk mandor";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: any = {
      username: formData.username,
      email: formData.email,
      role: formData.role,
    };
    if (formData.password) {
      payload.password = formData.password;
    }
    if (formData.role === "MANDOR") {
      payload.mandor = {
        namaBank: formData.mandor?.namaBank?.trim() ?? "",
        noRekening: formData.mandor?.noRekening?.trim() ?? "",
        atasNamaRekening: formData.mandor?.atasNamaRekening?.trim() ?? "",
      };
    }

    try {
      if (isEditing && formData.id !== "") {
        await updateMutation.mutateAsync({ id: formData.id as number, data: payload });
      } else {
        await createMutation.mutateAsync(payload as CreateUserDTO);
      }
      closeModal();
    } catch (error: any) {
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

  const handleDelete = async (item: UserData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus user ${item.username}?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
      } catch (error: any) {
        const { message } = handleApiError(error);
        alert(message);
      }
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <DataTable
        title="Manajemen Pengguna (User)"
        columns={columns}
        data={usersList}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item as UserData)}
        onDelete={(item) => handleDelete(item as UserData)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? "Edit Data Pengguna" : "Tambah Pengguna Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                placeholder="Masukkan username"
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="email@example.com"
              />
              <Input
                label={isEditing ? "Password Baru (Opsional)" : "Password"}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder={isEditing ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password"}
              />
              <Select
                label="Role Akses"
                name="role"
                value={formData.role}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value !== "MANDOR") {
                    setFormData((prev) => ({ ...prev, mandor: undefined }));
                  } else if (!formData.mandor) {
                    setFormData((prev) => ({
                      ...prev,
                      mandor: { namaBank: "", noRekening: "", atasNamaRekening: "" },
                    }));
                  }
                }}
                error={errors.role}
                options={[
                  { value: "", label: "-- Pilih Role --" },
                  { value: "SUPERADMIN", label: "Super Admin" },
                  { value: "ADMIN", label: "Admin" },
                  { value: "FINANCE", label: "Finance" },
                  { value: "MARKETING", label: "Marketing" },
                  { value: "CUSTOMER", label: "Customer" },
                  { value: "BANK", label: "Bank" },
                  { value: "MANDOR", label: "Mandor" },
                  { value: "PENGAWAS", label: "Pengawas" },
                ]}
              />
              {formData.role === "MANDOR" && (
                <>
                  <Input
                    label="Nama Bank (Mandor)"
                    name="namaBank"
                    value={formData.mandor?.namaBank ?? ""}
                    onChange={handleMandorChange}
                    error={errors.namaBank}
                    placeholder="Contoh: BCA"
                  />
                  <Input
                    label="Nomor Rekening (Mandor)"
                    name="noRekening"
                    value={formData.mandor?.noRekening ?? ""}
                    onChange={handleMandorChange}
                    error={errors.noRekening}
                    placeholder="Masukkan nomor rekening"
                  />
                  <Input
                    label="Atas Nama Rekening (Mandor)"
                    name="atasNamaRekening"
                    value={formData.mandor?.atasNamaRekening ?? ""}
                    onChange={handleMandorChange}
                    error={errors.atasNamaRekening}
                    placeholder="Nama pemilik rekening"
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={closeModal}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2 text-sm font-bold text-white bg-black rounded-xl hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
            >
              {createMutation.isPending || updateMutation.isPending ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
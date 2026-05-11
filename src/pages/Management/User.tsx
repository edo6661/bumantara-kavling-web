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

const initialFormState: CreateUserDTO & { id: number | "" } = {
  id: "",
  username: "",
  email: "",
  password: "",
  role: "",
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = "Username wajib diisi";
    if (!formData.email.trim()) newErrors.email = "Email wajib diisi";
    if (!isEditing && !formData.password?.trim()) newErrors.password = "Password wajib diisi untuk user baru";
    if (!formData.role.trim()) newErrors.role = "Role wajib dipilih";

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

    try {
      if (isEditing && formData.id !== "") {
        await updateMutation.mutateAsync({ id: formData.id as number, data: payload });
      } else {
        await createMutation.mutateAsync(payload as CreateUserDTO);
      }
      closeModal();
    } catch (error: any) {
      const responseData = error.response?.data;
      if (responseData?.error && Array.isArray(responseData.error)) {
        const backendErrors: Record<string, string> = {};
        responseData.error.forEach((err: { field: string; message: string }) => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
      } else {
        alert(responseData?.message || "Terjadi kesalahan saat menyimpan data");
      }
    }
  };

  const handleDelete = async (item: UserData) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus user ${item.username}?`)) {
      try {
        await deleteMutation.mutateAsync(item.id);
      } catch (error: any) {
        alert(error.response?.data?.message || "Gagal menghapus user");
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
                onChange={handleChange}
                error={errors.role}
                options={[
                  { value: "", label: "-- Pilih Role --" },
                  { value: "SUPERADMIN", label: "Super Admin" },
                  { value: "ADMIN", label: "Admin" },
                  { value: "FINANCE", label: "Finance" },
                  { value: "MARKETING", label: "Marketing" },
                  { value: "CUSTOMER", label: "Customer" },
                ]}
              />
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
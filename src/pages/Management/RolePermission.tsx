import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/shared/DataTable";
import Modal from "../../components/shared/Modal";
import PageLoader from "../PageLoader";
import { ShieldAlert, Settings2, Save } from "lucide-react";
import {
  useGetRolePermissions,
  useUpsertRolePermission,
} from "../../hooks/queries/useRolePermission";
import { handleApiError } from "../../utils/errorHandler";

const RESOURCES = [
  "DASHBOARD", "PENJUALAN", "PROGRESS_PENJUALAN", "GANTI_KAVLING", "BATAL_TRANSAKSI",
  "USER", "ROLE_PERMISSION", "KAVLING", "NOTARIS", "BANK", "AUDIT_LOG",
  "CUSTOMER", "CUSTOMER_DETAIL", "CUSTOMER_KAVLING", "TAGIHAN", "AGENT", "FEE_AGENT", "SPK", "PROGRESS_PROYEK"
];

const CONFIGURABLE_ROLES = [
  { id: "ADMIN", name: "Administrator" },
  { id: "FINANCE", name: "Finance & Keuangan" },
  { id: "MARKETING", name: "Tim Marketing" },
  { id: "CUSTOMER", name: "Customer Portal" },
  { id: "BANK", name: "Bank" },
  { id: "MANDOR", name: "Mandor Lapangan" },
];

type PermissionMatrix = Record<string, { canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean }>;

const RolePermission = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: permissions = [], isLoading } = useGetRolePermissions();
  const upsertMutation = useUpsertRolePermission();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [permissionsMatrix, setPermissionsMatrix] = useState<PermissionMatrix>({});
  const [isSaving, setIsSaving] = useState(false);

  // RBAC CHECK
  useEffect(() => {
    if (user && user.role !== "SUPERADMIN") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  if (user?.role !== "SUPERADMIN") return null;

  const columns = [
    {
      header: "Role Sistem",
      accessor: "name",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
            <ShieldAlert size={16} />
          </div>
          <div>
            <p className="font-bold text-slate-900">{val}</p>
            <p className="text-[10px] text-slate-500 font-mono">{row.id}</p>
          </div>
        </div>
      )
    },
    {
      header: "Aksi Konfigurasi",
      accessor: "id",
      render: (roleId: string) => (
        <button
          onClick={() => openModal(roleId)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all shadow-md cursor-pointer"
        >
          <Settings2 size={14} /> Atur Akses Modul
        </button>
      )
    }
  ];

  const openModal = (roleId: string) => {
    // Siapkan matrix kosong atau isi dengan data yang sudah ada di database
    const initialMatrix: PermissionMatrix = {};

    RESOURCES.forEach((res) => {
      const existing = permissions.find((p) => p.role === roleId && p.resource === res);
      initialMatrix[res] = {
        canCreate: existing?.canCreate || false,
        canRead: existing?.canRead || false,
        canUpdate: existing?.canUpdate || false,
        canDelete: existing?.canDelete || false,
      };
    });

    setSelectedRole(roleId);
    setPermissionsMatrix(initialMatrix);
    setIsModalOpen(true);
  };

  const handleMatrixChange = (resource: string, field: keyof PermissionMatrix[string], value: boolean) => {
    setPermissionsMatrix((prev) => ({
      ...prev,
      [resource]: { ...prev[resource], [field]: value },
    }));
  };

  const handleSelectAllRow = (resource: string, value: boolean) => {
    setPermissionsMatrix((prev) => ({
      ...prev,
      [resource]: { canCreate: value, canRead: value, canUpdate: value, canDelete: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Loop semua resource dan lakukan request upsert secara bersamaan
      const promises = RESOURCES.map((res) => {
        const matrixData = permissionsMatrix[res];
        return upsertMutation.mutateAsync({
          role: selectedRole,
          resource: res,
          canCreate: matrixData.canCreate,
          canRead: matrixData.canRead,
          canUpdate: matrixData.canUpdate,
          canDelete: matrixData.canDelete,
        });
      });

      await Promise.all(promises);

      alert(`Hak akses untuk role ${selectedRole} berhasil diperbarui!`);
      setIsModalOpen(false);
    } catch (error: any) {
      const { message } = handleApiError(error);
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 p-5 rounded-2xl text-sm text-slate-300 shadow-md">
        <h3 className="text-white font-bold text-lg mb-1">Role-Based Access Control (RBAC)</h3>
        <p>Halaman ini eksklusif untuk <strong>Super Admin</strong>. Konfigurasi di bawah ini menentukan modul apa saja yang muncul di sidebar dan tindakan (Tambah/Edit/Hapus) apa saja yang boleh dilakukan oleh setiap Role.</p>
      </div>

      <DataTable
        title="Daftar Role Sistem"
        columns={columns}
        data={CONFIGURABLE_ROLES}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Konfigurasi Hak Akses - Role: ${selectedRole}`}>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-white sticky top-0 z-10 shadow-sm border-b border-slate-200">
                  <tr className="text-[11px] uppercase tracking-widest text-slate-500">
                    <th className="px-4 py-3 font-bold">Modul / Resource</th>
                    <th className="px-4 py-3 font-bold text-center">Read (Lihat)</th>
                    <th className="px-4 py-3 font-bold text-center">Create (Tambah)</th>
                    <th className="px-4 py-3 font-bold text-center">Update (Edit)</th>
                    <th className="px-4 py-3 font-bold text-center">Delete (Hapus)</th>
                    <th className="px-4 py-3 font-bold text-center border-l border-slate-100">Beri Semua</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {RESOURCES.map((res) => {
                    const data = permissionsMatrix[res] || { canCreate: false, canRead: false, canUpdate: false, canDelete: false };
                    const isAllChecked = data.canCreate && data.canRead && data.canUpdate && data.canDelete;

                    return (
                      <tr key={res} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{res}</td>
                        <td className="px-4 py-3 text-center">
                          <input type="checkbox" className="w-4 h-4 cursor-pointer text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={data.canRead} onChange={(e) => handleMatrixChange(res, "canRead", e.target.checked)} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input type="checkbox" className="w-4 h-4 cursor-pointer text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={data.canCreate} onChange={(e) => handleMatrixChange(res, "canCreate", e.target.checked)} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input type="checkbox" className="w-4 h-4 cursor-pointer text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={data.canUpdate} onChange={(e) => handleMatrixChange(res, "canUpdate", e.target.checked)} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input type="checkbox" className="w-4 h-4 cursor-pointer text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={data.canDelete} onChange={(e) => handleMatrixChange(res, "canDelete", e.target.checked)} />
                        </td>
                        <td className="px-4 py-3 text-center border-l border-slate-100 bg-slate-50">
                          <input
                            type="checkbox"
                            className="w-4 h-4 cursor-pointer text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            checked={isAllChecked}
                            onChange={(e) => handleSelectAllRow(res, e.target.checked)}
                            title="Beri semua akses untuk modul ini"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white border-t border-slate-100 -mx-6 -mb-6 p-4 rounded-b-2xl shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
            >
              <Save size={16} />
              {isSaving ? "Menyimpan Massal..." : "Simpan Konfigurasi"}
            </button>
          </div>

        </form>
      </Modal>
    </div>
  );
};

export default RolePermission;
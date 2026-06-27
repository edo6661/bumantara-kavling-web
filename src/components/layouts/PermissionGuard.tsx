import type { ReactNode } from 'react';
import { Ban } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../hooks/usePermission';

interface PermissionGuardProps {
  resource?: string;
  roles?: readonly string[];
  children: ReactNode;
}

const PermissionGuard = ({ resource, roles, children }: PermissionGuardProps) => {
  const { user } = useAuth();
  const { canRead } = usePermission(resource ?? '');

  if (roles && (!user?.role || !roles.includes(user.role))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Ban size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Akses Ditolak</h2>
        <p className="text-sm font-medium text-slate-500 max-w-md">
          Maaf, halaman ini hanya dapat diakses oleh Finance, Admin, dan Superadmin.
        </p>
      </div>
    );
  }

  if (resource && !canRead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Ban size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Akses Ditolak</h2>
        <p className="text-sm font-medium text-slate-500 max-w-md">
          Maaf, Role Anda tidak memiliki izin untuk melihat modul {resource.replace(/_/g, ' ')}.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default PermissionGuard;
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PageLoader from './pages/PageLoader';
import RootLayout from './components/layouts/RootLayout';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './providers/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';
import PermissionGuard from './components/layouts/PermissionGuard';


const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Penjualan = lazy(() => import('./pages/Management/Penjualan'));
const Kavling = lazy(() => import('./pages/Management/Kavling'));
const Notaris = lazy(() => import('./pages/Management/Notaris'));
const Bank = lazy(() => import('./pages/Management/Bank'));
const DataSosial = lazy(() => import('./pages/Customer/DataSosial'));
const SPR = lazy(() => import('./pages/Customer/SPR'));
const KelengkapanAdministrasi = lazy(() => import('./pages/Customer/KelengkapanAdministrasi'));
const CustomerKavling = lazy(() => import('./pages/Customer/Kavling'));
const Tagihan = lazy(() => import('./pages/Customer/Tagihan'));
const Agents = lazy(() => import('./pages/Marketing/Agents'));
const FeeAgent = lazy(() => import('./pages/Marketing/FeeAgent'));
const SPK = lazy(() => import('./pages/Proyek/SPK'));
const Progress = lazy(() => import('./pages/Proyek/Progress'));
const VerifyDocument = lazy(() => import('./pages/Public/VerifyDocument'));
const GantiKavling = lazy(() => import('./pages/Management/GantiKavling'));
const BatalTransaksi = lazy(() => import('./pages/Management/BatalTransaksi'));
const AuditLog = lazy(() => import('./pages/Management/AuditLog'));
const ProgressPenjualan = lazy(() => import('./pages/Management/ProgressPenjualan'));
const UserManagement = lazy(() => import('./pages/Management/User'));
const RolePermission = lazy(() => import('./pages/Management/RolePermission'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/verify/:id" element={<VerifyDocument />} />

              <Route path="/" element={<ProtectedRoute><RootLayout /></ProtectedRoute>}>
                {/* Dashboard biasanya dibiarkan terbuka untuk semua yang bisa login */}
                <Route index element={<Dashboard />} />

                {/* 2. Bungkus Halaman dengan PermissionGuard */}
                <Route path="management/penjualan" element={<PermissionGuard resource="PENJUALAN"><Penjualan /></PermissionGuard>} />
                <Route path="management/progress-penjualan" element={<PermissionGuard resource="PROGRESS_PENJUALAN"><ProgressPenjualan /></PermissionGuard>} />
                <Route path="management/ganti-kavling" element={<PermissionGuard resource="GANTI_KAVLING"><GantiKavling /></PermissionGuard>} />
                <Route path="management/batal-transaksi" element={<PermissionGuard resource="BATAL_TRANSAKSI"><BatalTransaksi /></PermissionGuard>} />

                <Route path="management/kavling" element={<PermissionGuard resource="KAVLING"><Kavling /></PermissionGuard>} />
                <Route path="management/notaris" element={<PermissionGuard resource="NOTARIS"><Notaris /></PermissionGuard>} />
                <Route path="management/bank" element={<PermissionGuard resource="BANK"><Bank /></PermissionGuard>} />

                {/* User & Role biasanya khusus Superadmin, tapi bisa kita passing resource-nya juga */}
                <Route path="management/users" element={<PermissionGuard resource="USER"><UserManagement /></PermissionGuard>} />
                <Route path="management/role-permission" element={<PermissionGuard resource="ROLE_PERMISSION"><RolePermission /></PermissionGuard>} />
                <Route path="management/audit-log" element={<PermissionGuard resource="AUDIT_LOG"><AuditLog /></PermissionGuard>} />

                <Route path="customer/data-sosial" element={<PermissionGuard resource="CUSTOMER"><DataSosial /></PermissionGuard>} />
                <Route path="customer/spr" element={<PermissionGuard resource="PENJUALAN"><SPR /></PermissionGuard>} />
                <Route path="customer/kelengkapan-administrasi" element={<PermissionGuard resource="CUSTOMER"><KelengkapanAdministrasi /></PermissionGuard>} />
                <Route path="customer/kavling" element={<PermissionGuard resource="CUSTOMER_KAVLING"><CustomerKavling /></PermissionGuard>} />
                <Route path="customer/tagihan" element={<PermissionGuard resource="TAGIHAN"><Tagihan /></PermissionGuard>} />

                <Route path="marketing/agents" element={<PermissionGuard resource="AGENT"><Agents /></PermissionGuard>} />
                <Route path="marketing/fee-agent" element={<PermissionGuard resource="FEE_AGENT"><FeeAgent /></PermissionGuard>} />

                <Route path="proyek/spk" element={<PermissionGuard resource="SPK"><SPK /></PermissionGuard>} />
                <Route path="proyek/progress" element={<PermissionGuard resource="PROGRESS_PROYEK"><Progress /></PermissionGuard>} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  );
};


export default App;
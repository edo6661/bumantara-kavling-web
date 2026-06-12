import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PageLoader from './pages/PageLoader';
import RootLayout from './components/layouts/RootLayout';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './providers/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';
import PermissionGuard from './components/layouts/PermissionGuard';

const NotFound = lazy(() => import('./pages/Public/NotFound'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Penjualan = lazy(() => import('./pages/Management/Penjualan'));
const Kavling = lazy(() => import('./pages/Management/Kavling'));
const Notaris = lazy(() => import('./pages/Management/Notaris'));
const Bank = lazy(() => import('./pages/Management/Bank'));
const Administrasi = lazy(() => import('./pages/Customer/Administrasi'));
const CustomerKavling = lazy(() => import('./pages/Customer/Kavling'));
const Tagihan = lazy(() => import('./pages/Customer/Tagihan'));
const Agents = lazy(() => import('./pages/Marketing/Agents'));
const AgentRegisterSuccess = lazy(() => import('./pages/Public/AgentRegisterSuccess'));
const FeeAgent = lazy(() => import('./pages/Marketing/FeeAgent'));
const PerusahaanAgent = lazy(() => import('./pages/Marketing/PerusahaanAgent'));
const SPK = lazy(() => import('./pages/Proyek/SPK'));
const ApproveSpkKasbon = lazy(() => import('./pages/Proyek/ApproveSpkKasbon'));
const Tukang = lazy(() => import('./pages/Proyek/Tukang'));
const Progress = lazy(() => import('./pages/Proyek/Progress'));
const VerifyDocument = lazy(() => import('./pages/Public/VerifyDocument'));
const GantiKavling = lazy(() => import('./pages/Management/GantiKavling'));
const BatalTransaksi = lazy(() => import('./pages/Management/BatalTransaksi'));
const AuditLog = lazy(() => import('./pages/Management/AuditLog'));
const ProgressPenjualan = lazy(() => import('./pages/Management/ProgressPenjualan'));
const UserManagement = lazy(() => import('./pages/Management/User'));
const RolePermission = lazy(() => import('./pages/Management/RolePermission'));

const CustomerLogin = lazy(() => import('./pages/Public/CustomerLogin'));
const PortalDashboard = lazy(() => import('./pages/CustomerPortal/PortalDashboard'));
const CustomerDetail = lazy(() => import('./pages/Bank/CustomerDetail'));

const AgentLogin = lazy(() => import('./pages/Public/AgentLogin'));
const AgentRegister = lazy(() => import('./pages/Public/AgentRegister'));
const AgentPortalDashboard = lazy(() => import('./pages/AgentPortal/PortalDashboard'));
const ApprovePembayaran = lazy(() => import('./pages/Finance/ApprovePembayaran'));
const BayarKodeBillingPph = lazy(() => import('./pages/Finance/BayarKodeBillingPph'));
const BayarSpkPembayaran = lazy(() => import('./pages/Finance/BayarSpkPembayaran'));
const BayarNotarisPembayaran = lazy(() => import('./pages/Finance/BayarNotarisPembayaran'));
const BayarBankKprPembayaran = lazy(() => import('./pages/Finance/BayarBankKprPembayaran'));
const Profile = lazy(() => import('./pages/Profile'));
const LaporanEksekutif = lazy(() => import('./pages/Laporan/LaporanEksekutif'));
const LaporanPenjualan = lazy(() => import('./pages/Laporan/LaporanPenjualan'));
const LaporanProgressProyek = lazy(() => import('./pages/Laporan/LaporanProgressProyek'));
const LaporanBiayaProyek = lazy(() => import('./pages/Laporan/LaporanBiayaProyek'));
const LaporanKeuangan = lazy(() => import('./pages/Laporan/LaporanKeuangan'));
const LaporanMarketing = lazy(() => import('./pages/Laporan/LaporanMarketing'));
const LaporanRekapPembayaran = lazy(() => import('./pages/Laporan/LaporanRekapPembayaran'));
const LaporanPemasukanPenjualan = lazy(() => import('./pages/Laporan/LaporanPemasukanPenjualan'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user?.role === 'CUSTOMER') return <Navigate to="/portal" replace />;
  if (user?.role === 'AGENT') return <Navigate to="/agent-portal" replace />;
  if (user?.role === 'MANDOR' && location.pathname === '/') {
    return <Navigate to="/proyek/progress" replace />;
  }
  if (user?.role === 'PENGAWAS' && location.pathname === '/') {
    return <Navigate to="/proyek/approve-kasbon" replace />;
  }

  return <>{children}</>;
};

const CustomerPortalGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/customer-login" replace />;
  if (user?.role !== 'CUSTOMER') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AgentPortalGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/agent-login" replace />;
  if (user?.role !== 'AGENT') return <Navigate to="/" replace />;
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

              {/* Routing Customer Portal */}
              <Route path="/customer-login" element={<CustomerLogin />} />
              <Route path="/verify/:id" element={<VerifyDocument />} />
              <Route path="/portal" element={
                <CustomerPortalGuard>
                  <PortalDashboard />
                </CustomerPortalGuard>
              } />

              {/* Routing Agent Portal */}
              <Route path="/agent-login" element={<AgentLogin />} />
              <Route path="/agent-register" element={<AgentRegister />} />
              <Route path="/agent-register-success" element={<AgentRegisterSuccess />} />
              <Route path="/agent-portal" element={
                <AgentPortalGuard>
                  <AgentPortalDashboard />
                </AgentPortalGuard>
              } />

              <Route path="/" element={<ProtectedRoute><RootLayout /></ProtectedRoute>}>
                <Route path="profile" element={<Profile />} />
                <Route index element={
                  <PermissionGuard resource="DASHBOARD"><Dashboard /></PermissionGuard>
                } />
                <Route path="finance/approve-pembayaran" element={<PermissionGuard resource="TAGIHAN"><ApprovePembayaran /></PermissionGuard>} />
                <Route path="finance/bayar-kode-billing-pph" element={<PermissionGuard resource="TAGIHAN"><BayarKodeBillingPph /></PermissionGuard>} />
                <Route path="finance/bayar-spk" element={<PermissionGuard resource="TAGIHAN"><BayarSpkPembayaran /></PermissionGuard>} />
                <Route path="finance/bayar-notaris" element={<PermissionGuard resource="TAGIHAN"><BayarNotarisPembayaran /></PermissionGuard>} />
                <Route path="finance/bayar-kpr" element={<PermissionGuard resource="TAGIHAN"><BayarBankKprPembayaran /></PermissionGuard>} />
                <Route path="management/penjualan" element={<PermissionGuard resource="PENJUALAN"><Penjualan /></PermissionGuard>} />
                <Route path="management/progress-penjualan" element={<PermissionGuard resource="PROGRESS_PENJUALAN"><ProgressPenjualan /></PermissionGuard>} />
                <Route path="management/ganti-kavling" element={<PermissionGuard resource="GANTI_KAVLING"><GantiKavling /></PermissionGuard>} />
                <Route path="management/batal-transaksi" element={<PermissionGuard resource="BATAL_TRANSAKSI"><BatalTransaksi /></PermissionGuard>} />
                <Route path="management/kavling" element={<PermissionGuard resource="KAVLING"><Kavling /></PermissionGuard>} />
                <Route path="management/notaris" element={<PermissionGuard resource="NOTARIS"><Notaris /></PermissionGuard>} />
                <Route path="management/bank" element={<PermissionGuard resource="BANK"><Bank /></PermissionGuard>} />
                <Route path="management/users" element={<PermissionGuard resource="USER"><UserManagement /></PermissionGuard>} />
                <Route path="management/role-permission" element={<PermissionGuard resource="ROLE_PERMISSION"><RolePermission /></PermissionGuard>} />
                <Route path="management/audit-log" element={<PermissionGuard resource="AUDIT_LOG"><AuditLog /></PermissionGuard>} />
                <Route path="customer/administrasi" element={<PermissionGuard resource="CUSTOMER"><Administrasi /></PermissionGuard>} />
                <Route path="/customer-detail/:id" element={
                  <PermissionGuard resource="CUSTOMER_DETAIL">
                    <CustomerDetail />
                  </PermissionGuard>
                } />
                <Route path="customer/kavling" element={<PermissionGuard resource="CUSTOMER_KAVLING"><CustomerKavling /></PermissionGuard>} />
                <Route path="customer/tagihan" element={<PermissionGuard resource="TAGIHAN"><Tagihan /></PermissionGuard>} />
                <Route path="marketing/agents" element={<PermissionGuard resource="AGENT"><Agents /></PermissionGuard>} />
                <Route path="marketing/fee-agent" element={<PermissionGuard resource="FEE_AGENT"><FeeAgent /></PermissionGuard>} />
                <Route path="marketing/perusahaan" element={<PermissionGuard resource="AGENT"><PerusahaanAgent /></PermissionGuard>} />
                <Route path="proyek/spk" element={<PermissionGuard resource="SPK"><SPK /></PermissionGuard>} />
                <Route path="proyek/approve-kasbon" element={<PermissionGuard resource="SPK"><ApproveSpkKasbon /></PermissionGuard>} />
                <Route path="proyek/tukang" element={<PermissionGuard resource="SPK"><Tukang /></PermissionGuard>} />
                <Route path="proyek/progress" element={<PermissionGuard resource="PROGRESS_PROYEK"><Progress /></PermissionGuard>} />
                <Route path="laporan/eksekutif" element={<PermissionGuard resource="LAPORAN"><LaporanEksekutif /></PermissionGuard>} />
                <Route path="laporan/penjualan" element={<PermissionGuard resource="LAPORAN"><LaporanPenjualan /></PermissionGuard>} />
                <Route path="laporan/rekap-pembayaran" element={<PermissionGuard resource="LAPORAN"><LaporanRekapPembayaran /></PermissionGuard>} />
                <Route path="laporan/pemasukan-penjualan" element={<PermissionGuard resource="LAPORAN"><LaporanPemasukanPenjualan /></PermissionGuard>} />
                <Route path="laporan/progress-proyek" element={<PermissionGuard resource="LAPORAN"><LaporanProgressProyek /></PermissionGuard>} />
                <Route path="laporan/biaya-proyek" element={<PermissionGuard resource="LAPORAN"><LaporanBiayaProyek /></PermissionGuard>} />
                <Route path="laporan/keuangan" element={<PermissionGuard resource="LAPORAN"><LaporanKeuangan /></PermissionGuard>} />
                <Route path="laporan/marketing" element={<PermissionGuard resource="LAPORAN"><LaporanMarketing /></PermissionGuard>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  );
};

export default App;
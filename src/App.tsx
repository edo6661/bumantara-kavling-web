import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PageLoader from './pages/PageLoader';
import RootLayout from './components/layouts/RootLayout';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './providers/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';


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
                <Route index element={<Dashboard />} />
                <Route path="management/penjualan" element={<Penjualan />} />
                <Route path="management/ganti-kavling" element={<GantiKavling />} />
                <Route path="management/batal-transaksi" element={<BatalTransaksi />} />
                <Route path="management/kavling" element={<Kavling />} />
                <Route path="management/notaris" element={<Notaris />} />
                <Route path="management/bank" element={<Bank />} />
                <Route path="customer/data-sosial" element={<DataSosial />} />
                <Route path="customer/spr" element={<SPR />} />
                <Route path="customer/kelengkapan-administrasi" element={<KelengkapanAdministrasi />} />
                <Route path="customer/kavling" element={<CustomerKavling />} />
                <Route path="customer/tagihan" element={<Tagihan />} />
                <Route path="marketing/agents" element={<Agents />} />
                <Route path="marketing/fee-agent" element={<FeeAgent />} />
                <Route path="proyek/spk" element={<SPK />} />
                <Route path="proyek/progress" element={<Progress />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  );
};

export default App;
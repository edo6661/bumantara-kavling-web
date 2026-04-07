import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import PageLoader from './pages/PageLoader';
import RootLayout from './components/layouts/RootLayout';

const Dashboard = lazy(() => import('./pages/Dashboard'));

const Penjualan = lazy(() => import('./pages/Management/Penjualan'));
const Kavling = lazy(() => import('./pages/Management/Kavling'));

const DataSosial = lazy(() => import('./pages/Customer/DataSosial'));
const SPR = lazy(() => import('./pages/Customer/SPR'));
const KelengkapanAdministrasi = lazy(() => import('./pages/Customer/KelengkapanAdministrasi'));

const Agents = lazy(() => import('./pages/Marketing/Agents'));
const FeeAgent = lazy(() => import('./pages/Marketing/FeeAgent'));

const SPK = lazy(() => import('./pages/Proyek/SPK'));
const Progress = lazy(() => import('./pages/Proyek/Progress'));

const CustomerKavling = lazy(() => import('./pages/Customer/Kavling'));

const App = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<RootLayout />}>
              <Route index element={<Dashboard />} />

              <Route path="management/penjualan" element={<Penjualan />} />
              <Route path="management/kavling" element={<Kavling />} />

              <Route path="customer/data-sosial" element={<DataSosial />} />
              <Route path="customer/spr" element={<SPR />} />
              <Route path="customer/kelengkapan-administrasi" element={<KelengkapanAdministrasi />} />

              <Route path="marketing/agents" element={<Agents />} />
              <Route path="marketing/fee-agent" element={<FeeAgent />} />

              <Route path="proyek/spk" element={<SPK />} />
              <Route path="proyek/progress" element={<Progress />} />


              <Route path="customer/kavling" element={<CustomerKavling />} />
            </Route>

            <Route path="/login" element={<p>login</p>} />

            <Route element={<p>test protected route</p>}>
              <Route path="/test" element={<p>test</p>} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider >
  );
};

export default App;
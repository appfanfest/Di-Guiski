
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { Home } from './pages/Home';
import { ExperienceList } from './pages/ExperienceList';
import { About, Contact, FAQ, Plans, PaymentRegister, Terms, AtlantisGuide, MarketingDigital } from './pages/StaticPages';
import { Admin } from './pages/Admin';
import { AdminExperiences } from './pages/AdminExperiences';
import { AdminUsers } from './pages/AdminUsers';
import { AdminPayments } from './pages/AdminPayments';
import { AdminCoupons } from './pages/AdminCoupons';
import { AdminGithub } from './pages/AdminGithub';
import { AdminQRGenerator } from './pages/AdminQRGenerator';
import { Login } from './pages/Auth';
import { Assistant } from './pages/Assistant';
import { EditorPage } from './pages/EditorPage';
import { PhotoBooth } from './pages/PhotoBooth';
import { MarcosPro } from './pages/MarcosPro';

const ProtectedRoute: React.FC<{ children: React.ReactNode, adminOnly?: boolean }> = ({ children, adminOnly }) => {
    const { user } = useAppContext();
    if (!user) return <Navigate to="/login" />;
    if (adminOnly && !user.isAdmin) return <Navigate to="/" />;
    return <>{children}</>;
};

const AppContent: React.FC = () => {
    return (
        <Layout>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/atlantis-guide" element={<AtlantisGuide />} />
                <Route path="/list/:type" element={<ExperienceList />} />
                <Route path="/about" element={<About />} />
                <Route path="/marketing-digital" element={<MarketingDigital />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/login" element={<Login />} />
                <Route path="/ai-assistant" element={<Assistant />} />
                <Route path="/editor/:id" element={<EditorPage />} />
                <Route path="/photobooth/:id" element={<PhotoBooth />} />
                <Route path="/marcos-pro/:id" element={<MarcosPro />} />
                <Route path="/payment-register" element={<ProtectedRoute><PaymentRegister /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
                <Route path="/admin/experiences" element={<ProtectedRoute adminOnly><AdminExperiences /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/payments" element={<ProtectedRoute adminOnly><AdminPayments /></ProtectedRoute>} />
                <Route path="/admin/coupons" element={<ProtectedRoute adminOnly><AdminCoupons /></ProtectedRoute>} />
                <Route path="/admin/github" element={<ProtectedRoute adminOnly><AdminGithub /></ProtectedRoute>} />
                <Route path="/admin/qr-generator" element={<ProtectedRoute adminOnly><AdminQRGenerator /></ProtectedRoute>} />
            </Routes>
        </Layout>
    );
};

const App: React.FC = () => (
  <AppProvider>
      <HashRouter>
          <AppContent />
      </HashRouter>
  </AppProvider>
);

export default App;

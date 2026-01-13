import { useState } from 'react';
import Home from './pages/Home';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    // Check if URL is a reset password link
    if (window.location.pathname.startsWith('/reset-password')) {
      return <ResetPassword onNavigate={setCurrentPage} />;
    }

    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'auth':
        return <Auth onNavigate={setCurrentPage} />;
      case 'user-dashboard':
        return <UserDashboard onNavigate={setCurrentPage} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={setCurrentPage} />;
      case 'provider-dashboard':
        return <ProviderDashboard onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return renderPage();
}
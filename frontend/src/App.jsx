import { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import ResetPassword from './pages/ResetPassword';
import DestinationDetail from './pages/user/DestinationDetail';
import DestinationResults from './pages/user/DestinationResults';
import AuthModal from './components/AuthModal';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleNavigate = (page) => {
    if (page === 'auth') {
      setIsAuthModalOpen(true);
    } else {
      setCurrentPage(page);
    }
  };

  const renderPage = () => {
    // Check if URL is a reset password link
    if (window.location.pathname.startsWith('/reset-password')) {
      return <ResetPassword onNavigate={setCurrentPage} />;
    }

    switch (currentPage) {
      case 'home':
        return <Home 
          onNavigate={handleNavigate} 
          onSelectDestination={(id) => {
            setSelectedDestination(id);
            handleNavigate('destination-detail');
          }} 
        />;
      case 'user-dashboard':
        return <UserDashboard 
          view="dashboard"
          onNavigate={handleNavigate} 
          onSelectDestination={(id) => {
            setSelectedDestination(id);
            handleNavigate('destination-detail');
          }} 
        />;
      case 'user-wishlist':
        return <UserDashboard 
          view="wishlist"
          onNavigate={handleNavigate} 
          onSelectDestination={(id) => {
            setSelectedDestination(id);
            handleNavigate('destination-detail');
          }} 
        />;
      case 'user-profile':
        return <UserDashboard 
          view="profile"
          onNavigate={handleNavigate} 
          onSelectDestination={(id) => {
            setSelectedDestination(id);
            handleNavigate('destination-detail');
          }} 
        />;
      case 'destination-results':
        return <DestinationResults 
          onNavigate={handleNavigate} 
          onSelectDestination={(id) => {
            setSelectedDestination(id);
            handleNavigate('destination-detail');
          }} 
        />;
      case 'destination-detail':
        return <DestinationDetail 
          destinationId={selectedDestination} 
          onNavigate={handleNavigate} 
        />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'provider-dashboard':
        return <ProviderDashboard onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className={currentPage === 'home' ? 'pt-0' : 'pt-16'}>
        {renderPage()}
      </main>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onNavigate={handleNavigate} 
      />
    </div>
  );
}

import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import Guides from './pages/Guides';
import GuideDetail from './pages/GuideDetail';
import GuideDashboard from './pages/GuideDashboard';
import ResetPassword from './pages/ResetPassword';
import DestinationDetail from './pages/user/DestinationDetail';
import DestinationResults from './pages/user/DestinationResults';
import PaymentVerify from './pages/PaymentVerify';
import PaymentPage from './pages/PaymentPage';
import EsewaSuccess from './pages/EsewaSuccess';
import EsewaFailure from './pages/EsewaFailure';
import AuthModal from './components/AuthModal';
import Chatbot from './components/Chatbot';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedGuideId, setSelectedGuideId] = useState(null);
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

    // Check if URL is a payment verification link
    if (window.location.pathname.startsWith('/payment/verify')) {
      return <PaymentVerify />;
    }

    // Check if URL is a payment page
    if (window.location.pathname.startsWith('/payment') && !window.location.pathname.includes('/esewa/')) {
      return <PaymentPage onNavigate={handleNavigate} />;
    }

    // Check if URL is an eSewa success callback
    if (window.location.pathname.startsWith('/payment/esewa/success')) {
      return <EsewaSuccess onNavigate={handleNavigate} />;
    }

    // Check if URL is an eSewa failure callback
    if (window.location.pathname.startsWith('/payment/esewa/failure')) {
      return <EsewaFailure onNavigate={handleNavigate} />;
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
        return <DestinationResults 
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
      case 'guides':
        return (
          <Guides
            onNavigate={handleNavigate}
            onSelectGuide={(id) => {
              setSelectedGuideId(id);
              handleNavigate('guide-detail');
            }}
          />
        );
      case 'guide-detail':
        return <GuideDetail guideId={selectedGuideId} onNavigate={handleNavigate} />;
      case 'guide-dashboard':
        return <GuideDashboard onNavigate={handleNavigate} />;
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
      <Chatbot />
      <Toaster position="top-right" />
    </div>
  );
}

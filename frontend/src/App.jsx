import { Suspense, lazy, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/home';
import { getLandingPageForRole, getStoredUser, getUserRole, isDashboardPage } from './lib/roleNavigation';

const About = lazy(() => import('./pages/About'));
const UserDashboard = lazy(() => import('./pages/userDashboard'));
const AdminDashboard = lazy(() => import('./pages/adminDashboard'));
const ProviderDashboard = lazy(() => import('./pages/providerDashboard'));
const Tours = lazy(() => import('./pages/Tours'));
const Guides = lazy(() => import('./pages/Guides'));
const GuideDetail = lazy(() => import('./pages/GuideDetail'));
const GuideDashboard = lazy(() => import('./pages/GuideDashboard'));
const ResetPassword = lazy(() => import('./pages/resetPassword'));
const DestinationDetail = lazy(() => import('./pages/user/destinationDetail'));
const DestinationResults = lazy(() => import('./pages/user/DestinationResults'));
const PaymentVerify = lazy(() => import('./pages/PaymentVerify'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const EsewaSuccess = lazy(() => import('./pages/EsewaSuccess'));
const EsewaFailure = lazy(() => import('./pages/EsewaFailure'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const Chatbot = lazy(() => import('./components/Chatbot'));

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="mt-4 text-sm text-slate-600">Loading page...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => getLandingPageForRole(getUserRole(getStoredUser())));
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

  const openDestination = (id) => {
    if (!id) {
      setSelectedDestination(null);
      setCurrentPage('destination-results');
      return;
    }

    setSelectedDestination(id);
    setCurrentPage('destination-detail');
  };

  const openGuide = (id) => {
    if (!id) {
      setSelectedGuideId(null);
      setCurrentPage('guides');
      return;
    }

    setSelectedGuideId(id);
    setCurrentPage('guide-detail');
  };

  const renderPage = () => {
    // Check if URL is a reset password link
    if (window.location.pathname.startsWith('/reset-password')) {
      return <ResetPassword onNavigate={setCurrentPage} />;
    }

    // Check if URL is a payment verification link
    if (window.location.pathname.startsWith('/payment/verify')) {
      return <PaymentVerify onNavigate={handleNavigate} />;
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
          onSelectDestination={openDestination}
        />;
      case 'user-dashboard':
        return <UserDashboard
          onNavigate={handleNavigate}
          onSelectDestination={openDestination}
        />;
      case 'user-wishlist':
        return <UserDashboard 
          view="wishlist"
          onNavigate={handleNavigate} 
          onSelectDestination={openDestination}
        />;
      case 'user-profile':
        return <UserDashboard 
          view="profile"
          onNavigate={handleNavigate} 
          onSelectDestination={openDestination}
        />;
      case 'user-bookings':
        return <UserDashboard
          view="bookings"
          onNavigate={handleNavigate}
          onSelectDestination={openDestination}
        />;
      case 'destination-results':
        return <DestinationResults 
          onNavigate={handleNavigate} 
          onSelectDestination={openDestination}
        />;
      case 'tours':
        return <Tours onNavigate={handleNavigate} />;
      case 'about':
        return <About onNavigate={handleNavigate} />;
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
            onSelectGuide={openGuide}
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

  const hideGlobalNavbar = isDashboardPage(currentPage);

  return (
    <div className="min-h-screen bg-slate-50">
      {!hideGlobalNavbar && <Navbar currentPage={currentPage} onNavigate={handleNavigate} />}
      <main className={currentPage === 'home' || hideGlobalNavbar ? 'pt-0' : 'pt-16'}>
        <Suspense fallback={<PageFallback />}>
          {renderPage()}
        </Suspense>
      </main>
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            onNavigate={handleNavigate} 
          />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>
      <Toaster position="top-right" />
    </div>
  );
}

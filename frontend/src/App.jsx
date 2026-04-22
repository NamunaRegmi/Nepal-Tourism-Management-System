import { Suspense, lazy, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/home';
import { getLandingPageForRole, getStoredUser, getUserRole, isDashboardPage } from './lib/roleNavigation';

const About = lazy(() => import('./pages/About'));
const UserDashboard = lazy(() => import('./pages/userDashboard'));
const AdminDashboard = lazy(() => import('./pages/adminDashboard'));
const ProviderDashboard = lazy(() => import('./pages/providerDashboard'));
const Tours = lazy(() => import('./pages/ToursNew'));
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

function getBrowserLocation() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
  };
}

function normalizePath(pathname) {
  return pathname.replace(/\/+$/, '') || '/';
}

function getPathForPage(page, options = {}) {
  switch (page) {
    case 'home':
      return '/';
    case 'user-dashboard':
      return '/dashboard';
    case 'user-profile':
      return '/profile';
    case 'user-bookings':
      return '/profile/bookings';
    case 'user-wishlist':
      return '/profile/saved';
    case 'destination-results':
      return '/destinations';
    case 'destination-detail':
      return options.destinationId ? `/destinations/${options.destinationId}` : '/destinations';
    case 'tours':
      return '/tours';
    case 'about':
      return '/about';
    case 'admin-dashboard':
      return '/admin/dashboard';
    case 'provider-dashboard':
      return '/provider/dashboard';
    case 'guides':
      return '/guides';
    case 'guide-detail':
      return options.guideId ? `/guides/${options.guideId}` : '/guides';
    case 'guide-dashboard':
      return '/guide/dashboard';
    default:
      return '/';
  }
}

function getRouteState(pathname, fallbackPage) {
  if (
    pathname.startsWith('/payment') ||
    pathname.startsWith('/reset-password')
  ) {
    return null;
  }

  const cleanPath = normalizePath(pathname);
  const destinationDetailMatch = cleanPath.match(/^\/destinations\/([^/]+)$/);
  if (destinationDetailMatch) {
    return {
      page: 'destination-detail',
      destinationId: destinationDetailMatch[1],
    };
  }

  const guideDetailMatch = cleanPath.match(/^\/guides\/([^/]+)$/);
  if (guideDetailMatch) {
    return {
      page: 'guide-detail',
      guideId: guideDetailMatch[1],
    };
  }

  switch (cleanPath) {
    case '/':
      return { page: fallbackPage };
    case '/dashboard':
      return { page: 'user-dashboard' };
    case '/profile':
      return { page: 'user-profile' };
    case '/profile/bookings':
      return { page: 'user-bookings' };
    case '/profile/saved':
      return { page: 'user-wishlist' };
    case '/destinations':
      return { page: 'destination-results' };
    case '/tours':
      return { page: 'tours' };
    case '/about':
      return { page: 'about' };
    case '/admin/dashboard':
      return { page: 'admin-dashboard' };
    case '/provider/dashboard':
      return { page: 'provider-dashboard' };
    case '/guides':
      return { page: 'guides' };
    case '/guide/dashboard':
      return { page: 'guide-dashboard' };
    default:
      return { page: fallbackPage };
  }
}

export default function App() {
  const landingPage = getLandingPageForRole(getUserRole(getStoredUser()));
  const [currentPage, setCurrentPage] = useState(() => {
    const routeState = getRouteState(window.location.pathname, landingPage);
    return routeState?.page || landingPage;
  });
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedGuideId, setSelectedGuideId] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [browserLocation, setBrowserLocation] = useState(() => getBrowserLocation());

  useEffect(() => {
    const syncBrowserLocation = () => {
      setBrowserLocation(getBrowserLocation());
    };

    window.addEventListener('popstate', syncBrowserLocation);

    return () => {
      window.removeEventListener('popstate', syncBrowserLocation);
    };
  }, []);

  useEffect(() => {
    const routeState = getRouteState(browserLocation.pathname, landingPage);
    if (!routeState) {
      return;
    }

    setCurrentPage(routeState.page);

    if (routeState.destinationId) {
      setSelectedDestination(routeState.destinationId);
    } else if (routeState.page !== 'destination-detail') {
      setSelectedDestination(null);
    }

    if (routeState.guideId) {
      setSelectedGuideId(routeState.guideId);
    } else if (routeState.page !== 'guide-detail') {
      setSelectedGuideId(null);
    }
  }, [browserLocation.pathname, landingPage]);

  useEffect(() => {
    const routeState = getRouteState(browserLocation.pathname, landingPage);
    if (!routeState) {
      return;
    }

    const normalizedPath = normalizePath(browserLocation.pathname);
    const canonicalPath = getPathForPage(routeState.page, {
      destinationId: routeState.destinationId,
      guideId: routeState.guideId,
    });

    if (normalizedPath === canonicalPath && !browserLocation.search) {
      return;
    }

    window.history.replaceState({}, '', canonicalPath);
    setBrowserLocation(getBrowserLocation());
  }, [browserLocation.pathname, browserLocation.search, landingPage]);

  const syncBrowserPath = (path) => {
    if (browserLocation.pathname !== path || browserLocation.search) {
      window.history.pushState({}, '', path);
      setBrowserLocation(getBrowserLocation());
    }
  };

  const handleNavigate = (page) => {
    if (page === 'auth') {
      syncBrowserPath(getPathForPage('home'));
      setIsAuthModalOpen(true);
      return;
    }

    syncBrowserPath(getPathForPage(page));
    setCurrentPage(page);
  };

  const openDestination = (id) => {
    if (!id) {
      setSelectedDestination(null);
      setCurrentPage('destination-results');
      syncBrowserPath(getPathForPage('destination-results'));
      return;
    }

    setSelectedDestination(id);
    setCurrentPage('destination-detail');
    syncBrowserPath(getPathForPage('destination-detail', { destinationId: id }));
  };

  const openGuide = (id) => {
    if (!id) {
      setSelectedGuideId(null);
      setCurrentPage('guides');
      syncBrowserPath(getPathForPage('guides'));
      return;
    }

    setSelectedGuideId(id);
    setCurrentPage('guide-detail');
    syncBrowserPath(getPathForPage('guide-detail', { guideId: id }));
  };

  const renderPage = () => {
    // Check if URL is a reset password link
    if (browserLocation.pathname.startsWith('/reset-password')) {
      return <ResetPassword onNavigate={handleNavigate} />;
    }

    // Check if URL is a payment verification link
    if (browserLocation.pathname.startsWith('/payment/verify')) {
      return <PaymentVerify onNavigate={handleNavigate} />;
    }

    // Check if URL is a payment page
    if (browserLocation.pathname.startsWith('/payment') && !browserLocation.pathname.includes('/esewa/')) {
      return <PaymentPage onNavigate={handleNavigate} />;
    }

    // Check if URL is an eSewa success callback
    if (browserLocation.pathname.startsWith('/payment/esewa/success')) {
      return <EsewaSuccess onNavigate={handleNavigate} />;
    }

    // Check if URL is an eSewa failure callback
    if (browserLocation.pathname.startsWith('/payment/esewa/failure')) {
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

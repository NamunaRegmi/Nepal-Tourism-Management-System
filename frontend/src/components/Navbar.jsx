import { useEffect, useState } from 'react';
import { Mountain, Menu, X, User, LogOut, Home, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navLinks = [
  { label: 'Home', key: 'home' },
  { label: 'Destinations', key: 'destination-results' },
  { label: 'About', key: 'about' },
];

export default function Navbar({ currentPage, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [currentPage]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    onNavigate('home');
  };

  const goToDashboard = () => {
    if (!user) {
      onNavigate('auth');
      return;
    }

    const role = user?.role?.toLowerCase();
    if (role === 'admin') onNavigate('admin-dashboard');
    else if (role === 'provider') onNavigate('provider-dashboard');
    else onNavigate('user-dashboard');
  };

  const navButtonClass = (key) =>
    `text-sm font-medium ${currentPage === key ? 'text-blue-600' : 'text-slate-700'} hover:text-blue-600`;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 text-slate-800 backdrop-blur shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Mountain className="h-7 w-7 text-blue-600" />
            <div>
              <div className="text-lg font-bold text-slate-900">Nepal Tourism</div>
              <div className="text-xs text-slate-500">Explore. Book. Travel.</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.key}
                type="button"
                onClick={() => onNavigate(link.key)}
                className={navButtonClass(link.key)}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                {(!user.role || user.role.toLowerCase() === 'user') && (
                  <>
                    <button onClick={() => onNavigate('user-wishlist')} className={navButtonClass('user-wishlist')}>Wishlist</button>
                    <button onClick={() => onNavigate('user-profile')} className={navButtonClass('user-profile')}>Profile Settings</button>
                  </>
                )}
                <span className="text-sm text-slate-700 hidden lg:inline border-l pl-4 border-slate-200">Hi, {user.first_name || user.username}</span>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => onNavigate('auth')}
              >
                <User className="h-4 w-4" />
                Login
              </Button>
            )}
          </div>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.key}
                type="button"
                onClick={() => {
                  onNavigate(link.key);
                  setMobileOpen(false);
                }}
                className="block w-full text-left text-sm font-medium text-slate-700 hover:text-blue-600"
              >
                {link.label}
              </button>
            ))}
              {(!user || (user.role && user.role.toLowerCase() !== 'user')) && (
                <button
                  type="button"
                  onClick={() => {
                    goToDashboard();
                    setMobileOpen(false);
                  }}
                  className="block w-full text-left text-sm font-medium text-slate-700 hover:text-blue-600"
                >
                  Dashboard
                </button>
              )}
              {user && (!user.role || user.role.toLowerCase() === 'user') && (
                <>
                  <button onClick={() => { onNavigate('user-wishlist'); setMobileOpen(false); }} className="block w-full text-left text-sm font-medium text-slate-700 hover:text-blue-600">Wishlist</button>
                  <button onClick={() => { onNavigate('user-profile'); setMobileOpen(false); }} className="block w-full text-left text-sm font-medium text-slate-700 hover:text-blue-600">Profile Settings</button>
                </>
              )}
            {user ? (
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="block w-full text-left text-sm font-medium text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onNavigate('auth');
                  setMobileOpen(false);
                }}
                className="block w-full text-left text-sm font-medium text-slate-700 hover:text-blue-600"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

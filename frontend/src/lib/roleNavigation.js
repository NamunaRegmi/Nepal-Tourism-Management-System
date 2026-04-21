export function getStoredUser() {
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

export function getUserRole(user = getStoredUser()) {
  return user?.role?.toLowerCase() || 'guest';
}

export function getLandingPageForRole(role) {
  switch ((role || '').toLowerCase()) {
    case 'admin':
      return 'admin-dashboard';
    case 'provider':
      return 'provider-dashboard';
    case 'guide':
      return 'guide-dashboard';
    case 'user':
      return 'home';
    default:
      return 'home';
  }
}

export function getNavLinksForRole(role) {
  switch ((role || '').toLowerCase()) {
    case 'user':
      return [
        { label: 'Home', key: 'home' },
        { label: 'Explore', key: 'destination-results' },
        { label: 'My Bookings', key: 'user-bookings' },
        { label: 'Wishlist', key: 'user-wishlist' },
        { label: 'Profile', key: 'user-profile' },
      ];
    case 'provider':
      return [
        { label: 'Provider Dashboard', key: 'provider-dashboard' },
        { label: 'Destinations', key: 'destination-results' },
        { label: 'Tours', key: 'tours' },
        { label: 'About', key: 'about' },
      ];
    case 'guide':
      return [
        { label: 'Guide Dashboard', key: 'guide-dashboard' },
        { label: 'Tour Guides', key: 'guides' },
        { label: 'Tours', key: 'tours' },
        { label: 'About', key: 'about' },
      ];
    case 'admin':
      return [
        { label: 'Admin Dashboard', key: 'admin-dashboard' },
        { label: 'Destinations', key: 'destination-results' },
        { label: 'Tours', key: 'tours' },
        { label: 'About', key: 'about' },
      ];
    default:
      return [
        { label: 'Home', key: 'home' },
        { label: 'Destinations', key: 'destination-results' },
        { label: 'Tours', key: 'tours' },
        { label: 'Tour guides', key: 'guides' },
        { label: 'About', key: 'about' },
      ];
  }
}

export function isDashboardPage(page) {
  return ['admin-dashboard', 'provider-dashboard', 'guide-dashboard'].includes(page);
}

import { useState, useEffect } from 'react';
import { Mountain, Calendar, Heart, Star, Compass, Package, Settings, LogOut, MapPin, Users, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { destinationService, bookingService } from '@/services/api';

const UserDashboard = ({ onNavigate, onSelectDestination }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]); // Stored as an array of destination IDs in localStorage
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, bookings, wishlist, profile, browse
  const [loading, setLoading] = useState(true);

  const getDestinationMeta = (dest) => {
    const lower = dest.name?.toLowerCase() || '';
    const base = {
      region: dest.province || 'Nepal',
      duration: '5 Days',
      maxPeople: 10,
      price: '12,000',
      currency: 'Rs.',
      difficulty: 'Moderate',
      image: dest.image,
    };

    if (lower.includes('kathmandu')) {
      return {
        ...base,
        duration: '1 Day',
        maxPeople: 12,
        price: '8,500',
        difficulty: 'Easy',
        image: 'https://media.greenvalleynepaltreks.com/uploads/fullbanner/pashupatinath-temple-kathmandu.webp',
      };
    }
    if (lower.includes('pokhara')) {
      return {
        ...base,
        duration: '3 Days',
        maxPeople: 20,
        price: '25,000',
        difficulty: 'Easy',
        image: 'https://lp-cms-production.imgix.net/2019-06/53693064.jpg',
      };
    }
    if (lower.includes('chitwan')) {
      return {
        ...base,
        duration: '2 Days',
        maxPeople: 16,
        price: '18,000',
        difficulty: 'Easy',
        image: 'https://wallpaperbat.com/img/33765-shafir-image-night-kathmandu.jpg',
      };
    }

    if (lower.includes('manang')) {
      return {
        ...base,
        duration: '5 Days',
        maxPeople: 10,
        price: '30,000',
        difficulty: 'Moderate',
        image: '/assets/manang.png',
      };
    }

    if (lower.includes('mustang')) {
      return {
        ...base,
        duration: '6 Days',
        maxPeople: 8,
        price: '35,000',
        difficulty: 'Moderate',
        image: 'https://images.pexels.com/photos/4214102/pexels-photo-4214102.jpeg?auto=compress&cs=tinysrgb&w=1350',
      };
    }

    if (lower.includes('lumbini')) {
      return {
        ...base,
        duration: '5 Days',
        maxPeople: 10,
        price: '12,000',
        difficulty: 'Moderate',
        image: '/assets/lumbini.png',
      };
    }

    if (lower.includes('everest')) {
      return {
        ...base,
        duration: '12 Days',
        maxPeople: 6,
        price: '70,000',
        difficulty: 'Hard',
        image: 'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=1350',
      };
    }

    // Fallback defaults for other destinations
    return base;
  };

  useEffect(() => {
    // Get user from local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch destinations (public)
      try {
        const destRes = await destinationService.getAll();
        const preferred = ['Kathmandu', 'Pokhara', 'Chitwan'];
        const sorted = destRes.data.slice().sort((a, b) => {
          const aIndex = preferred.findIndex((name) => a.name?.toLowerCase().includes(name.toLowerCase()));
          const bIndex = preferred.findIndex((name) => b.name?.toLowerCase().includes(name.toLowerCase()));
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        setDestinations(sorted);

        // Load wishlist from localStorage (destinations saved by user)
        const storedWishlist = localStorage.getItem('wishlist');
        if (storedWishlist) {
          try {
            const parsed = JSON.parse(storedWishlist);
            if (Array.isArray(parsed)) {
              setWishlist(parsed);
            }
          } catch (e) {
            console.warn('Invalid wishlist stored in localStorage', e);
          }
        }
      } catch (err) {
        console.error("Failed to load destinations", err);
      }

      // Fetch bookings (authenticated)
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const bookingRes = await bookingService.getMyBookings();
          setBookings(bookingRes.data);
        } catch (err) {
          console.error("Failed to load bookings", err);
        }
      }
    } catch (err) {
      console.error("Dashboard error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    onNavigate('home');
  };

  const saveWishlist = (items) => {
    setWishlist(items);
    localStorage.setItem('wishlist', JSON.stringify(items));
  };

  const toggleWishlistItem = (destId) => {
    const idStr = String(destId);
    const next = wishlist.includes(idStr)
      ? wishlist.filter((id) => id !== idStr)
      : [...wishlist, idStr];
    saveWishlist(next);
  };

  const getWishlistDestinations = () => {
    const wishlistSet = new Set(wishlist.map((id) => String(id)));
    return destinations.filter((d) => wishlistSet.has(String(d.id)));
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingService.updateStatus(bookingId, 'cancelled');
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)));
    } catch (err) {
      console.error('Failed to cancel booking', err);
    }
  };

  const getDisplayTitle = () => {
    switch (activeView) {
      case 'bookings':
        return 'My Bookings';
      case 'wishlist':
        return 'Saved Tours';
      case 'profile':
        return 'Profile Settings';
      case 'browse':
        return 'Browse Tours';
      default:
        return 'Destinations';
    }
  };

  const goBack = () => setActiveView('dashboard');

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="relative min-h-screen">

        <section className="px-6 pb-16">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">{getDisplayTitle()}</h2>
              <p className="mt-2 text-base text-slate-600">
                {activeView === 'dashboard' && 'Browse and explore Nepal’s most popular travel destinations.'}
                {activeView === 'browse' && 'Tap a destination to view details and learn more.'}
                {activeView === 'bookings' && 'Review your past and upcoming bookings. You can cancel pending bookings here.'}
                {activeView === 'wishlist' && 'View, remove, or revisit tours you have saved for later.'}
                {activeView === 'profile' && 'Update your profile information and manage your account.'}
              </p>
            </div>

            {activeView !== 'dashboard' && (
              <Button variant="outline" onClick={goBack} className="max-w-[200px]">
                Back to dashboard
              </Button>
            )}
          </div>

          {activeView === 'dashboard' && (
            <div className="mb-12">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  { title: "Active Bookings", value: bookings.filter(b => b.status === "confirmed" || b.status === "pending").length, icon: Calendar },
                  { title: "Saved Tours", value: wishlist.length, icon: Heart },
                  { title: "Completed Tours", value: bookings.filter(b => b.status === "completed").length, icon: Star },
                ].map((item, i) => (
                  <Card key={i} className="border bg-white shadow-lg hover:shadow-2xl transition-shadow">
                    <CardHeader className="flex justify-between items-center pb-3">
                      <CardTitle className="text-gray-700 font-medium text-sm">{item.title}</CardTitle>
                      <item.icon className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{item.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "My Bookings", desc: "View & manage bookings", icon: Package, action: () => setActiveView('bookings') },
                  { title: "Browse Tours", desc: "Discover destinations", icon: Compass, action: () => onNavigate('destination-results') },
                  { title: "Wishlist", desc: "Your saved tours", icon: Heart, action: () => setActiveView('wishlist') },
                  { title: "Profile Settings", desc: "Update your info", icon: Settings, action: () => setActiveView('profile') },
                ].map((item, i) => (
                  <Card key={i} className="border bg-white shadow-lg hover:shadow-2xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <item.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle>{item.title}</CardTitle>
                          <CardDescription>{item.desc}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={item.action}>Go</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeView === 'dashboard' || activeView === 'browse' ? (
            <>
              {activeView === 'dashboard' && <h3 className="text-2xl font-bold mb-6 text-gray-900 border-t pt-8">Recommended Destinations</h3>}
              {loading ? (
              <div className="text-slate-600">Loading destinations...</div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {destinations.map((dest, i) => {
                  const meta = getDestinationMeta(dest);
                  const isSaved = wishlist.includes(String(dest.id));

                  return (
                    <Card
                      key={dest.id || i}
                      className="overflow-hidden shadow-lg hover:shadow-2xl transition-all"
                    >
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={meta.image || dest.image || 'https://via.placeholder.com/600x320'}
                          alt={dest.name}
                          className="h-full w-full object-cover transition duration-500 hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 text-white">
                          <h3 className="text-lg font-semibold">{dest.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {meta.region}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {meta.duration}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-slate-900">
                            {meta.currency} {meta.price}
                          </div>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {meta.difficulty}
                          </span>
                        </div>

                        <div className="mt-3 text-xs text-slate-600">
                          {dest.description?.slice(0, 90)}{dest.description?.length > 90 ? '…' : ''}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => onSelectDestination(dest.id)}
                          >
                            View details
                          </Button>
                          <Button
                            size="sm"
                            variant={isSaved ? 'secondary' : 'outline'}
                            onClick={() => toggleWishlistItem(dest.id)}
                          >
                            {isSaved ? 'Saved' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              )}
            </>
          ) : activeView === 'bookings' ? (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {bookings.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 shadow">
                  <p className="text-slate-600">No bookings found yet. Book a tour to see it here.</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="border shadow-sm">
                    <CardHeader className="flex justify-between items-start py-4">
                      <div>
                        <CardTitle className="text-lg">
                          {booking.package?.name || booking.room?.hotel?.name || 'Booking'}
                        </CardTitle>
                        <CardDescription>
                          {booking.room ? 'Room booking' : booking.package ? 'Package booking' : ''}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          booking.status === 'confirmed'
                            ? 'success'
                            : booking.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {booking.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 text-sm text-slate-600">
                        <div>
                          <strong>Start:</strong> {booking.start_date}
                        </div>
                        {booking.end_date && (
                          <div>
                            <strong>End:</strong> {booking.end_date}
                          </div>
                        )}
                        <div>
                          <strong>Total:</strong> {booking.total_price}
                        </div>
                      </div>
                    </CardContent>
                    <div className="p-4 flex gap-2">
                      {booking.status !== 'cancelled' && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Cancel booking
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          ) : activeView === 'wishlist' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {getWishlistDestinations().length === 0 ? (
                <div className="rounded-2xl bg-white p-8 shadow">
                  <p className="text-slate-600">You haven't saved any tours yet. Browse destinations and hit "Save" to keep them here.</p>
                </div>
              ) : (
                getWishlistDestinations().map((dest, i) => {
                  const meta = getDestinationMeta(dest);
                  return (
                    <Card key={dest.id || i} className="overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={meta.image || dest.image || 'https://via.placeholder.com/600x320'}
                          alt={dest.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                      <div className="p-4 bg-white">
                        <h3 className="text-lg font-semibold text-slate-900">{dest.name}</h3>
                        <div className="mt-2 text-xs text-slate-600">
                          {dest.description?.slice(0, 80)}{dest.description?.length > 80 ? '…' : ''}
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <Button size="sm" className="flex-1" onClick={() => onSelectDestination(dest.id)}>
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleWishlistItem(dest.id)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>Manage your account and personal information.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Name</p>
                      <p className="text-base font-semibold text-slate-900">{user?.first_name} {user?.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <p className="text-base font-semibold text-slate-900">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Role</p>
                      <p className="text-base font-semibold text-slate-900">{user?.role}</p>
                    </div>
                  </div>
                </CardContent>
                <div className="p-4">
                  <Button className="w-full" variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </Card>

              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>Quick actions</CardTitle>
                  <CardDescription>Useful links for your account.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button size="sm" onClick={() => setActiveView('bookings')}>
                    View My Bookings
                  </Button>
                  <Button size="sm" onClick={() => setActiveView('wishlist')}>
                    View Saved Tours
                  </Button>
                  <Button size="sm" onClick={() => onNavigate('destination-results')}>
                    Browse Tours
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserDashboard;
import { useState, useEffect, useCallback } from 'react';
import { Mountain, Calendar, Heart, Star, Compass, Package, Settings, LogOut, MapPin, Users, DollarSign, Edit2, Trash2, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { destinationService, bookingService, guideBookingService, authService } from '@/services/api';
import { createObjectPreview, getCloudinaryUploadEnabled, uploadImageToCloudinary } from '@/services/cloudinary';
import { useAppDataSync, notifyAppDataChanged } from '@/lib/dataSync';
import { toast } from 'react-hot-toast';

function getBookingTitle(booking) {
  return booking.package_details?.name || booking.room_details?.hotel_name || 'Booking';
}

function getBookingType(booking) {
  if (booking.package_details) return 'Package booking';
  if (booking.room_details) return 'Room booking';
  return 'Booking';
}

function getProfileDisplayName(user, profileForm = {}) {
  const firstName = profileForm.first_name || user?.first_name || '';
  const lastName = profileForm.last_name || user?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || profileForm.username || user?.username || profileForm.email || user?.email || 'Traveler';
}

function getProfileInitials(user, profileForm = {}) {
  const displayName = getProfileDisplayName(user, profileForm);
  const parts = displayName.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'TR';
}

function getDefaultProfileImage(user, profileForm = {}) {
  const seed = (profileForm.email || user?.email || profileForm.username || user?.username || 'traveler').toLowerCase();
  const palettes = [
    { start: '#0f766e', end: '#0ea5e9' },
    { start: '#1d4ed8', end: '#0891b2' },
    { start: '#7c3aed', end: '#2563eb' },
    { start: '#c2410c', end: '#ea580c' },
    { start: '#be123c', end: '#7c3aed' },
  ];
  const palette = palettes[seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % palettes.length];
  const initials = getProfileInitials(user, profileForm);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${initials}">
      <defs>
        <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.start}" />
          <stop offset="100%" stop-color="${palette.end}" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="40" fill="url(#profileGradient)" />
      <circle cx="80" cy="58" r="24" fill="rgba(255,255,255,0.16)" />
      <path d="M32 136c10-26 28-38 48-38s38 12 48 38" fill="rgba(255,255,255,0.18)" />
      <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial, sans-serif" font-size="42" font-weight="700" letter-spacing="1">
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const UserDashboard = ({ onNavigate, onSelectDestination, view = 'dashboard' }) => {
  const [user, setUser] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [guideBookings, setGuideBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]); // Stored as an array of destination IDs in localStorage
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, bookings, wishlist, profile, browse
  const [profileForm, setProfileForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    profile_picture: '',
  });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
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

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const profileRes = await authService.getProfile();
          const profileData = profileRes.data;
          setUser(profileData);
          setProfileForm({
            username: profileData.username || '',
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            profile_picture: profileData.profile_picture || '',
          });
          setProfilePhotoUrl(profileData.profile_picture || '');
          setProfilePhotoFile(null);
          localStorage.setItem('user', JSON.stringify(profileData));
        } catch (err) {
          console.error('Failed to load user profile', err);
        }
      }

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
      if (token) {
        try {
          const bookingRes = await bookingService.getMyBookings();
          setBookings(bookingRes.data);
        } catch (err) {
          console.error("Failed to load bookings", err);
        }
        try {
          const gbRes = await guideBookingService.list();
          setGuideBookings(gbRes.data || []);
        } catch (err) {
          console.error("Failed to load guide bookings", err);
          setGuideBookings([]);
        }
      }
    } catch (err) {
      console.error("Dashboard error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setProfileForm((prev) => ({
        ...prev,
        username: parsed.username || prev.username,
        first_name: parsed.first_name || prev.first_name,
        last_name: parsed.last_name || prev.last_name,
        email: parsed.email || prev.email,
        phone: parsed.phone || prev.phone,
        profile_picture: parsed.profile_picture || prev.profile_picture,
      }));
      setProfilePhotoUrl(parsed.profile_picture || '');
      setProfilePhotoFile(null);
    }
    if (view) {
      setActiveView(view);
    }
    fetchDashboardData();
  }, [fetchDashboardData, view]);

  const handleProfilePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    setProfilePhotoFile(file);
    setPhotoFileName(file.name);
    setProfilePhotoUrl('');
    setProfileForm((prev) => ({ ...prev, profile_picture: createObjectPreview(file) }));
  };

  const handleSaveProfile = async () => {
    try {
      const payload = { ...profileForm };
      if (profilePhotoFile) {
        payload.profile_picture = await uploadImageToCloudinary(profilePhotoFile, 'nepal-tourism/users');
      }

      const response = await authService.updateProfile(payload);
      setUser(response.data);
      setProfileForm({
        username: response.data.username || '',
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        profile_picture: response.data.profile_picture || '',
      });
      setProfilePhotoUrl(response.data.profile_picture || '');
      setProfilePhotoFile(null);
      setPhotoFileName('');
      localStorage.setItem('user', JSON.stringify(response.data));
      toast.success('Your profile has been updated.');
    } catch (err) {
      console.error('Failed to save profile', err);
      toast.error(err.message || 'Unable to update profile right now.');
    }
  };

  useAppDataSync(fetchDashboardData);

  const handleLogout = () => {
    authService.logout();
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
      notifyAppDataChanged();
    } catch (err) {
      console.error('Failed to cancel booking', err);
    }
  };

  const handleCancelGuideBooking = async (id) => {
    try {
      await guideBookingService.update(id, { status: 'cancelled' });
      setGuideBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
      notifyAppDataChanged();
    } catch (err) {
      console.error('Failed to cancel guide booking', err);
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
  const profileDisplayName = getProfileDisplayName(user, profileForm);
  const profileInitials = getProfileInitials(user, profileForm);
  const profileImageSrc = (profileForm.profile_picture || '').trim() || getDefaultProfileImage(user, profileForm);

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
                {activeView === 'bookings' && 'Hotel, package, and tour guide requests. Cancel pending items when needed.'}
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
                  { title: "Tour guides", desc: "Find a local guide", icon: UserCircle, action: () => onNavigate('guides') },
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
            <div className="space-y-10">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Stays &amp; packages</h3>
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {bookings.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 shadow">
                  <p className="text-slate-600">No hotel or package bookings yet.</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="border shadow-sm">
                    <CardHeader className="flex justify-between items-start py-4">
                      <div>
                        <CardTitle className="text-lg">
                          {getBookingTitle(booking)}
                        </CardTitle>
                        <CardDescription>{getBookingType(booking)}</CardDescription>
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
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Tour guide requests</h3>
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                {guideBookings.length === 0 ? (
                  <div className="rounded-2xl bg-white p-8 shadow border border-slate-100">
                    <p className="text-slate-600">No guide requests yet. Browse <button type="button" className="text-blue-600 underline" onClick={() => onNavigate('guides')}>tour guides</button> to book someone.</p>
                  </div>
                ) : (
                  guideBookings.map((gb) => (
                    <Card key={gb.id} className="border shadow-sm border-emerald-100">
                      <CardHeader className="flex justify-between items-start py-4">
                        <div>
                          <CardTitle className="text-lg">Guide: {gb.guide_display_name}</CardTitle>
                          <CardDescription>Tour guide booking</CardDescription>
                        </div>
                        <Badge variant={gb.status === 'confirmed' ? 'default' : gb.status === 'pending' ? 'secondary' : 'destructive'}>
                          {gb.status}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2 text-sm text-slate-600">
                          <div><strong>Dates:</strong> {gb.start_date} → {gb.end_date}</div>
                          <div><strong>Total:</strong> Rs. {Number(gb.total_price || 0).toLocaleString('en-IN')}</div>
                        </div>
                      </CardContent>
                      <div className="p-4 flex gap-2">
                        {gb.status !== 'cancelled' && gb.status !== 'completed' && (
                          <Button variant="outline" className="w-full" onClick={() => handleCancelGuideBooking(gb.id)}>
                            Cancel request
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
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
            <div className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
                <Card className="border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-6 py-8 md:px-8">
                    <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex items-start gap-5">
                        <Avatar className="h-24 w-24 rounded-[2rem] ring-2 ring-slate-200 ring-offset-4 ring-offset-white">
                          <AvatarImage src={profileImageSrc} alt={profileDisplayName} className="object-cover" />
                          <AvatarFallback>{profileInitials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-semibold text-slate-900">{profileDisplayName}</h1>
                            <Badge variant="secondary" className="capitalize">Active</Badge>
                          </div>
                          <p className="text-sm text-slate-600">{user?.role === 'guide' ? 'Tour Guide' : user?.role === 'provider' ? 'Service Provider' : 'Traveler'}</p>
                          <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">{user?.email || profileForm.email}</span>
                            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">{user?.phone || profileForm.phone || 'No phone number yet'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[26rem]">
                        {[{
                          label: 'Bookings',
                          value: bookings.length,
                        }, {
                          label: 'Guide requests',
                          value: guideBookings.length,
                        }, {
                          label: 'Saved',
                          value: wishlist.length,
                        }, {
                          label: 'Active',
                          value: bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length,
                        }].map((metric) => (
                          <div key={metric.label} className="rounded-3xl bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{metric.label}</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <CardContent className="px-6 py-8">
                    <Tabs defaultValue="overview" className="space-y-6">
                      <TabsList className="grid grid-cols-4 gap-2">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="bookings">Bookings</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                        <TabsTrigger value="saved">Saved</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-3xl bg-slate-50 p-5">
                            <p className="text-sm text-slate-500">Account</p>
                            <p className="mt-3 text-base font-semibold text-slate-900">{user?.username}</p>
                          </div>
                          <div className="rounded-3xl bg-slate-50 p-5">
                            <p className="text-sm text-slate-500">Role</p>
                            <p className="mt-3 text-base font-semibold text-slate-900 capitalize">{user?.role}</p>
                          </div>
                          <div className="rounded-3xl bg-slate-50 p-5">
                            <p className="text-sm text-slate-500">Email</p>
                            <p className="mt-3 text-base font-semibold text-slate-900">{user?.email}</p>
                          </div>
                          <div className="rounded-3xl bg-slate-50 p-5">
                            <p className="text-sm text-slate-500">Phone</p>
                            <p className="mt-3 text-base font-semibold text-slate-900">{user?.phone || 'Not set'}</p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="bookings">
                        {bookings.length === 0 ? (
                          <div className="rounded-3xl bg-slate-50 p-6 text-slate-600">You have no hotel or package bookings yet.</div>
                        ) : (
                          <div className="grid gap-4">
                            {bookings.map((booking) => (
                                <div key={booking.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                  <div className="flex items-center justify-between gap-4">
                                    <div>
                                    <p className="text-sm text-slate-500">{getBookingType(booking)}</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900">{getBookingTitle(booking)}</p>
                                  </div>
                                  <Badge variant={booking.status === 'confirmed' ? 'success' : booking.status === 'pending' ? 'secondary' : 'destructive'}>
                                    {booking.status}
                                  </Badge>
                                </div>
                                <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-slate-600">
                                  <div><strong>Start:</strong> {booking.start_date}</div>
                                  {booking.end_date && <div><strong>End:</strong> {booking.end_date}</div>}
                                  <div><strong>Total:</strong> {booking.total_price}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="activity">
                        <div className="space-y-4">
                          {guideBookings.length === 0 && bookings.length === 0 ? (
                            <div className="rounded-3xl bg-slate-50 p-6 text-slate-600">No recent activity to show yet.</div>
                          ) : (
                            <div className="space-y-4">
                              {bookings.slice(0, 3).map((booking) => (
                                <div key={`act-booking-${booking.id}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                  <p className="text-sm text-slate-500">Booking activity</p>
                                  <p className="mt-1 text-base font-semibold text-slate-900">{getBookingTitle(booking)}</p>
                                  <p className="mt-2 text-sm text-slate-600">Status: {booking.status} · {booking.start_date}</p>
                                </div>
                              ))}
                              {guideBookings.slice(0, 3).map((gb) => (
                                <div key={`act-guide-${gb.id}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                  <p className="text-sm text-slate-500">Guide request</p>
                                  <p className="mt-1 text-base font-semibold text-slate-900">{gb.guide_display_name}</p>
                                  <p className="mt-2 text-sm text-slate-600">Status: {gb.status} · {gb.start_date}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="saved">
                        <div className="grid gap-4">
                          <div className="rounded-3xl bg-slate-50 p-6">
                            <p className="text-sm text-slate-500">Saved destination count</p>
                            <p className="mt-3 text-2xl font-semibold text-slate-900">{wishlist.length}</p>
                          </div>
                          {getWishlistDestinations().length === 0 ? (
                            <div className="rounded-3xl bg-slate-50 p-6 text-slate-600">No saved tours yet. Save your favorites to see them here.</div>
                          ) : (
                            <div className="space-y-3">
                              {getWishlistDestinations().map((dest) => (
                                <div key={dest.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                  <p className="font-semibold text-slate-900">{dest.name}</p>
                                  <p className="text-sm text-slate-500">{dest.province}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-sm overflow-hidden">
                  <CardHeader className="space-y-4 border-b border-slate-200 bg-white px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-200">
                        <img
                          src={profileImageSrc}
                          alt={profileDisplayName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <CardTitle>Manage account</CardTitle>
                        <CardDescription>Update profile details, contact info, and your profile image.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 px-6 py-6">
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-slate-200">
                          <img
                            src={profileImageSrc}
                            alt={profileDisplayName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-slate-900">{profileDisplayName}</p>
                          <p className="text-sm text-slate-500">{profileForm.email || 'Add your email address'}</p>
                          <p className="text-sm text-slate-500">
                            {(profileForm.profile_picture || '').trim() ? 'Custom profile image active.' : 'Default profile image generated from your account details.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5">
                      <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profileForm.username}
                          onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="first_name">First name</Label>
                          <Input
                            id="first_name"
                            value={profileForm.first_name}
                            onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="last_name">Last name</Label>
                          <Input
                            id="last_name"
                            value={profileForm.last_name}
                            onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="profile_photo">Profile photo</Label>
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                          <div className="grid gap-5 lg:grid-cols-[120px_1fr] lg:items-center">
                            <div className="h-28 w-28 overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-200">
                              <img
                                src={profileImageSrc}
                                alt="Profile preview"
                                className="h-full w-full object-cover"
                              />
                            </div>

                            <div className="grid gap-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <label
                                  htmlFor="profile_photo"
                                  className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                                >
                                  Choose File
                                </label>
                                <span className="text-sm text-slate-500">{photoFileName || 'No file chosen'}</span>
                              </div>
                              <input
                                id="profile_photo"
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePhotoUpload}
                                className="sr-only"
                              />
                              <p className="text-sm leading-6 text-slate-500">Upload a square photo or paste an image URL below. If you leave it empty, a default avatar will be shown automatically for email-login accounts.</p>
                              {!getCloudinaryUploadEnabled() && (
                                <p className="text-sm leading-6 text-amber-600">Cloudinary env vars are missing, so file upload is disabled. Use the image URL field below.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="profile_picture">Profile image URL</Label>
                        <Input
                          id="profile_picture"
                          value={profilePhotoUrl}
                          onChange={(e) => {
                            setProfilePhotoUrl(e.target.value);
                            setProfileForm({ ...profileForm, profile_picture: e.target.value });
                          }}
                          placeholder="https://example.com/photo.jpg"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-4 grid gap-3">
                    <Button onClick={handleSaveProfile} className="w-full" disabled={profilePhotoFile && !getCloudinaryUploadEnabled()}>
                      Save changes
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                      Logout
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserDashboard;

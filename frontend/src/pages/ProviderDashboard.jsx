import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Package, Settings, LogOut, Plus, Hotel, CalendarCheck, DollarSign, Users, Search, Menu, Bell, BarChart3, Star, Edit, Trash2, Save, TrendingUp, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { bookingService, hotelService, destinationService, authService } from '@/services/api';
import { createObjectPreview, getCloudinaryUploadEnabled, uploadImageToCloudinary } from '@/services/cloudinary';
import { cn } from '@/lib/utils';
import { useAppDataSync, notifyAppDataChanged } from '@/lib/dataSync';
import RoomManager from '@/components/RoomManager';
import PackageManager from '@/components/PackageManager';

const DEFAULT_HOTEL_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

/** API may send Decimal as string; avoid string concatenation in reduce */
function toMoneyNumber(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function formatRs(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0';
  return Math.round(n).toLocaleString('en-IN');
}

const ProviderDashboard = ({ onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState(
    () => parseInt(localStorage.getItem('provider_notif_seen_at') || '0', 10)
  );
  const notifRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Property management states
  const [isAddingHotel, setIsAddingHotel] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [hotelForm, setHotelForm] = useState({
    name: '',
    destination_id: '',
    property_type: 'hotel',
    description: '',
    price_per_night: '',
    currency: 'NPR',
    address: '',
    contact_number: '',
    email: '',
    total_rooms: '',
    image: '',
    amenities: ''
  });
  const [hotelImageFile, setHotelImageFile] = useState(null);
  const [hotelImagePreview, setHotelImagePreview] = useState('');
  const [savingHotel, setSavingHotel] = useState(false);
  const [hotelDialogOpen, setHotelDialogOpen] = useState(false);
  const [selectedHotelForRooms, setSelectedHotelForRooms] = useState(null);

  // Stats data
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeProperties: 0,
    averageRating: 0,
    monthlyGrowth: 0,
    pendingBookings: 0
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [hotelsRes, bookingsRes, destRes] = await Promise.all([
        hotelService.getMyHotels(),
        bookingService.getMyBookings(),
        destinationService.getAll()
      ]);
      
      const allHotels = hotelsRes.data || [];
      setHotels(allHotels);
      setBookings(bookingsRes.data || []);
      setDestinations(destRes.data || []);

      const meRaw = localStorage.getItem('user');
      const me = meRaw ? JSON.parse(meRaw) : null;
      const myHotelCount =
        me?.id != null
          ? allHotels.filter((h) => Number(h.provider) === Number(me.id)).length
          : 0;

      const bookingsData = bookingsRes.data || [];
      const totalRevenue = bookingsData.reduce(
        (sum, booking) => sum + toMoneyNumber(booking.total_price),
        0
      );
      setStats({
        totalBookings: bookingsData.length,
        totalRevenue,
        activeProperties: myHotelCount,
        averageRating: 4.5,
        monthlyGrowth: 15.3,
        pendingBookings: bookingsData.filter(b => b.status === 'pending').length
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to load properties. Please refresh or log in again.';
      console.error('API Error Details:', error.response?.data, 'Status:', error.response?.status);
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchData();
  }, [fetchData]);

  useAppDataSync(fetchData);

  // Close notification dropdown on outside click
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  const openNotifications = () => {
    const now = Date.now();
    localStorage.setItem('provider_notif_seen_at', String(now));
    setLastSeenAt(now);
    setShowNotifications(o => !o);
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const recentBookings = bookings.slice(0, 5);
  const notifItems = [
    ...pendingBookings.map(b => ({
      id: `pending-${b.id}`,
      title: `Booking #${b.id} awaiting confirmation`,
      sub: `Rs. ${Number(b.total_price).toLocaleString('en-IN')} · ${b.room_details?.room_type || b.package_details?.name || 'Item'}`,
      time: new Date(b.created_at).toLocaleString(),
      timestamp: new Date(b.created_at).getTime(),
      urgent: true,
    })),
    ...recentBookings
      .filter(b => b.status !== 'pending')
      .map(b => ({
        id: `recent-${b.id}`,
        title: `Booking #${b.id} — ${b.status}`,
        sub: b.room_details?.room_type || b.package_details?.name || 'Item',
        time: new Date(b.created_at).toLocaleString(),
        timestamp: new Date(b.created_at).getTime(),
        urgent: false,
      })),
  ].map(n => ({ ...n, unread: n.timestamp > lastSeenAt }));

  const unreadCount = notifItems.filter(n => n.unread).length;

  const handleLogout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem('user');
      onNavigate('home');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAddHotel = () => {
    setHotelForm({
      name: '',
      destination_id: '',
      property_type: 'hotel',
      description: '',
      price_per_night: '',
      currency: 'NPR',
      address: '',
      contact_number: '',
      email: '',
      total_rooms: '',
      image: '',
      amenities: ''
    });
    setHotelImageFile(null);
    setHotelImagePreview('');
    setEditingHotel(null);
    setIsAddingHotel(true);
    setHotelDialogOpen(true);
  };

  const handleEditHotel = (hotel) => {
    setHotelForm({
      name: hotel.name || '',
      destination_id: hotel.destination_id || '',
      property_type: hotel.property_type || 'hotel',
      description: hotel.description || '',
      price_per_night: hotel.price_per_night || '',
      currency: hotel.currency || 'NPR',
      address: hotel.address || '',
      contact_number: hotel.contact_number || '',
      email: hotel.email || '',
      total_rooms: hotel.total_rooms || '',
      image: hotel.image || '',
      amenities: Array.isArray(hotel.amenities) ? hotel.amenities.join(', ') : (hotel.amenities || '')
    });
    setHotelImageFile(null);
    setHotelImagePreview(hotel.image || '');
    setEditingHotel(hotel);
    setIsAddingHotel(false);
    setHotelDialogOpen(true);
  };

  const handleHotelImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.alert('Choose a valid image file.');
      event.target.value = '';
      return;
    }

    if (hotelImagePreview && hotelImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(hotelImagePreview);
    }

    setHotelImageFile(file);
    setHotelImagePreview(createObjectPreview(file));
  };

  const handleSaveHotel = async () => {
    if (!hotelForm.name.trim() || !hotelForm.destination_id || !hotelForm.description.trim()) {
      window.alert('Fill in the property name, destination, and description before saving.');
      return;
    }

    if (!hotelForm.price_per_night || Number(hotelForm.price_per_night) <= 0) {
      window.alert('Enter a valid price per night.');
      return;
    }

    setSavingHotel(true);
    try {
      let imageUrl = (hotelForm.image && String(hotelForm.image).trim()) || '';
      if (hotelImageFile) {
        imageUrl = await uploadImageToCloudinary(hotelImageFile, 'nepal-tourism/hotels');
      }
      const payload = {
        name: hotelForm.name.trim(),
        destination_id: hotelForm.destination_id,
        property_type: hotelForm.property_type || 'hotel',
        description: hotelForm.description.trim(),
        price_per_night: hotelForm.price_per_night,
        currency: hotelForm.currency || 'NPR',
        address: hotelForm.address.trim(),
        contact_number: hotelForm.contact_number.trim(),
        email: hotelForm.email.trim(),
        total_rooms: hotelForm.total_rooms ? Number(hotelForm.total_rooms) : 0,
        amenities: hotelForm.amenities,
        image: imageUrl || DEFAULT_HOTEL_IMAGE,
      };
      let savedHotel = null;
      if (isAddingHotel) {
        const response = await hotelService.create(payload);
        savedHotel = response.data;
      } else if (editingHotel) {
        const response = await hotelService.update(editingHotel.id, payload);
        savedHotel = response.data;
      }

      if (hotelImagePreview && hotelImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(hotelImagePreview);
      }
      setHotelImageFile(null);
      setHotelImagePreview('');
      setHotelDialogOpen(false);
      notifyAppDataChanged();
      if (isAddingHotel && savedHotel?.id) {
        setSelectedHotelForRooms(savedHotel);
      }
    } catch (error) {
      console.error('Failed to save hotel:', error);
      window.alert(error.response?.data ? JSON.stringify(error.response.data) : (error.message || 'Could not save property. Check required fields and API.'));
    } finally {
      setSavingHotel(false);
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await hotelService.delete(hotelId);
        notifyAppDataChanged();
      } catch (error) {
        console.error('Failed to delete hotel:', error);
        window.alert(error.response?.data?.error || 'Could not delete this property.');
      }
    }
  };

  const handleBookingAction = async (action, booking) => {
    try {
      if (action === 'confirm') {
        await bookingService.update(booking.id, { status: 'confirmed' });
        setBookings(bookings.map(b => 
          b.id === booking.id ? { ...b, status: 'confirmed' } : b
        ));
      } else if (action === 'cancel') {
        await bookingService.update(booking.id, { status: 'cancelled' });
        setBookings(bookings.map(b => 
          b.id === booking.id ? { ...b, status: 'cancelled' } : b
        ));
      }
      notifyAppDataChanged();
    } catch (error) {
      console.error('Booking action failed:', error);
    }
  };

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings.toLocaleString(),
      change: "+12%",
      icon: CalendarCheck,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200"
    },
    {
      title: "Revenue",
      value: `Rs. ${formatRs(stats.totalRevenue)}`,
      change: "+23%",
      icon: DollarSign,
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200"
    },
    {
      title: "Active Properties",
      value: stats.activeProperties,
      change: "+2",
      icon: Hotel,
      color: "purple",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200"
    },
    {
      title: "Average Rating",
      value: stats.averageRating.toFixed(1),
      change: "+0.3",
      icon: Star,
      color: "amber",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200"
    }
  ];

  const filteredBookings = bookings.filter(booking => 
    booking.id.toString().includes(searchQuery) ||
    (booking.user && booking.user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredHotels = hotels.filter((hotel) => {
    const q = searchQuery.toLowerCase();
    const name = (hotel.name || '').toLowerCase();
    const addr = (hotel.address || '').toLowerCase();
    const destId = hotel.destination_id ?? hotel.destination;
    const dest = destinations.find((d) => d.id === destId);
    const destName = (dest?.name || '').toLowerCase();
    return name.includes(q) || addr.includes(q) || destName.includes(q);
  });

  const isMyHotel = (hotel) =>
    user?.id != null && Number(hotel.provider) === Number(user.id);

  const monthlyEarnings = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('en', { month: 'short' });
      const revenue = bookings
        .filter(b => b.created_at && b.created_at.startsWith(key))
        .reduce((sum, b) => sum + toMoneyNumber(b.total_price), 0);
      const count = bookings.filter(b => b.created_at && b.created_at.startsWith(key)).length;
      return { key, month: monthName, revenue, count };
    });
  }, [bookings]);

  const bookingStatusCounts = useMemo(() => ({
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  }), [bookings]);

  if (selectedHotelForRooms) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <RoomManager
          hotel={selectedHotelForRooms}
          onClose={() => {
            setSelectedHotelForRooms(null);
            fetchData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Hotel className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Provider Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your tourism business</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search properties, bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <div className="relative" ref={notifRef}>
              <Button variant="ghost" size="sm" className="relative" onClick={openNotifications}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifItems.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">No bookings yet</p>
                    ) : (
                      notifItems.map(n => (
                        <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${n.unread ? 'bg-orange-50' : ''}`}>
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.urgent ? 'bg-orange-500' : 'bg-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                            <p className="text-xs text-gray-500 truncate">{n.sub}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                          </div>
                          {n.urgent && (
                            <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded flex-shrink-0">
                              Action needed
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {pendingBookings.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                      <button
                        onClick={() => { setActiveTab('bookings'); setShowNotifications(false); }}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        View all bookings →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <Avatar className="h-8 w-8 cursor-pointer" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                <AvatarFallback className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                  {user?.name?.[0] || 'P'}
                </AvatarFallback>
              </Avatar>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Button variant="ghost" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-red-600" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
            </div>
          </div>
        </header>

      <div className="flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside className={`${sidebarOpen ? 'fixed inset-y-0 left-0 z-50 shadow-2xl' : 'hidden'} lg:relative lg:block w-64 bg-white border-r border-gray-200 min-h-screen`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 lg:hidden">
            <span className="font-semibold text-gray-700 text-sm">Navigation</span>
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-gray-100">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {[
              { key: 'overview', icon: BarChart3, label: 'Dashboard' },
              { key: 'properties', icon: Hotel, label: `My Properties (${filteredHotels.length})` },
              { key: 'packages', icon: Package, label: 'Tour Packages' },
              { key: 'bookings', icon: CalendarCheck, label: `Bookings (${filteredBookings.length})` },
              { key: 'earnings', icon: DollarSign, label: 'Earnings' },
              { key: 'reviews', icon: Star, label: 'Reviews' },
            ].map(({ key, icon: Icon, label }) => (
              <Button
                key={key}
                variant="ghost"
                className={`w-full justify-start ${activeTab === key ? 'text-green-600 bg-green-50' : ''}`}
                onClick={() => { setActiveTab(key); setSidebarOpen(false); }}
              >
                <Icon className="h-4 w-4 mr-3" />
                {label}
              </Button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-3 sm:p-6 min-w-0">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome back, {user?.name || 'Provider'}!</h2>
                    <p className="text-gray-500 text-sm">Here's an overview of your tourism business performance.</p>
                  </div>
                  <Button className="bg-gradient-to-r from-green-600 to-blue-600 pointer-events-auto cursor-pointer w-full sm:w-auto" onClick={handleAddHotel}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {statCards.map((stat, index) => (
                    <Card key={index} className={`${stat.bgColor} ${stat.borderColor} border-2`}>
                      <CardContent className="p-3 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs sm:text-sm font-medium text-green-600">{stat.change}</span>
                              <span className="text-xs text-gray-500 ml-1 hidden sm:inline">vs last month</span>
                            </div>
                          </div>
                          <div className={`w-9 h-9 sm:w-12 sm:h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                            <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CalendarCheck className="h-5 w-5 mr-2" />
                        <CardTitle>Recent Bookings</CardTitle>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('bookings')}>
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardDescription>Latest booking requests from customers</CardDescription>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredBookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm">Booking #{booking.id}</p>
                              {booking.user && (
                                <p className="text-xs text-gray-700 font-medium truncate">
                                  {booking.user.first_name || booking.user.last_name
                                    ? `${booking.user.first_name} ${booking.user.last_name}`.trim()
                                    : booking.user.username}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">{booking.start_date}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-medium text-gray-900 text-sm">Rs. {Number(booking.total_price).toLocaleString('en-IN')}</p>
                            <Badge className={
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800 text-xs' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 text-xs' :
                              'bg-gray-100 text-gray-800 text-xs'
                            }>
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'properties' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Hotel className="h-5 w-5 mr-2" />
                      <CardTitle>Properties</CardTitle>
                    </div>
                    <Button className="pointer-events-auto cursor-pointer" onClick={handleAddHotel}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Property
                    </Button>
                  </div>
                </CardHeader>
                <CardDescription>
                  Same active hotels guests see on destination pages. You can edit or remove only listings you own.
                </CardDescription>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading properties...</div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <Hotel className="h-12 w-12 text-red-400 mx-auto mb-4" />
                      <p className="text-red-600">{error}</p>
                    </div>
                  ) : filteredHotels.length === 0 ? (
                    <div className="text-center py-8">
                      <Hotel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No properties found. Add your first property to get started!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredHotels.map((hotel) => {
                        const destInfo = destinations.find(d => d.id === (hotel.destination_id ?? hotel.destination));
                        const roomCount = Array.isArray(hotel.rooms) ? hotel.rooms.length : hotel.total_rooms || 0;
                        return (
                        <Card key={hotel.id} className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                          {/* Hotel image */}
                          <div className="relative h-44 flex-shrink-0 overflow-hidden bg-slate-100">
                            <img
                              src={hotel.image || DEFAULT_HOTEL_IMAGE}
                              alt={hotel.name}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              onError={e => { e.currentTarget.src = DEFAULT_HOTEL_IMAGE; }}
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                              <Badge className={isMyHotel(hotel) ? 'bg-green-600 text-white shadow' : 'bg-slate-800/80 text-white shadow'}>
                                {isMyHotel(hotel) ? 'Your listing' : 'Site listing'}
                              </Badge>
                            </div>
                            {isMyHotel(hotel) && (
                              <div className="absolute top-2 left-2 flex gap-1">
                                <button
                                  onClick={() => handleEditHotel(hotel)}
                                  className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
                                >
                                  <Edit className="h-3.5 w-3.5 text-gray-700" />
                                </button>
                                <button
                                  onClick={() => handleDeleteHotel(hotel.id)}
                                  className="w-7 h-7 rounded-full bg-white/90 hover:bg-red-50 flex items-center justify-center shadow"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                </button>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4 flex-1 flex flex-col gap-2">
                            <div>
                              <h3 className="font-bold text-gray-900 text-base leading-tight">{hotel.name}</h3>
                              {destInfo && (
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  {destInfo.name}
                                </div>
                              )}
                              {hotel.address && !destInfo && (
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  {hotel.address}
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 flex-1">{hotel.description}</p>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <div>
                                <span className="font-bold text-green-600 text-base">Rs. {Number(hotel.price_per_night).toLocaleString('en-IN')}</span>
                                <span className="text-xs text-gray-400">/night</span>
                              </div>
                              <span className="text-xs text-slate-500">{roomCount} room type{roomCount !== 1 ? 's' : ''}</span>
                            </div>
                            {hotel.amenities && (
                              <div className="flex flex-wrap gap-1">
                                {(Array.isArray(hotel.amenities) ? hotel.amenities : String(hotel.amenities).split(','))
                                  .slice(0, 3)
                                  .map((a, i) => (
                                    <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{String(a).trim()}</span>
                                  ))}
                              </div>
                            )}
                            {isMyHotel(hotel) && (
                              <div className="flex gap-2 mt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs"
                                  onClick={() => setSelectedHotelForRooms(hotel)}
                                >
                                  Manage Rooms
                                </Button>
                              </div>
                            )}
                            {isMyHotel(hotel) && roomCount === 0 && (
                              <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                                Add rooms so travelers can book this property.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'packages' && (
              <PackageManager />
            )}

            {activeTab === 'bookings' && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Bookings</CardTitle>
                  <CardDescription>View and manage all your booking requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading bookings...</div>
                  ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No bookings found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredBookings.map((booking) => (
                        <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm">Booking #{booking.id}</p>
                              {booking.user && (
                                <p className="text-sm font-semibold text-gray-800">
                                  {booking.user.first_name || booking.user.last_name
                                    ? `${booking.user.first_name} ${booking.user.last_name}`.trim()
                                    : booking.user.username}
                                </p>
                              )}
                              {booking.user?.email && (
                                <p className="text-xs text-blue-600 truncate">{booking.user.email}</p>
                              )}
                              {booking.user?.phone && (
                                <p className="text-xs text-gray-500">📞 {booking.user.phone}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-0.5">{booking.start_date}{booking.end_date ? ` → ${booking.end_date}` : ''}</p>
                              {booking.room_details?.room_type && (
                                <p className="text-xs text-gray-600">Room: {booking.room_details.room_type}</p>
                              )}
                              {booking.package_details?.name && (
                                <p className="text-xs text-gray-600">Package: {booking.package_details.name}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                            <p className="font-semibold text-gray-900 text-sm">Rs. {Number(booking.total_price).toLocaleString('en-IN')}</p>
                            <Badge className={
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800 text-xs' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 text-xs' :
                              'bg-gray-100 text-gray-800 text-xs'
                            }>
                              {booking.status}
                            </Badge>
                            <div className="flex gap-2">
                              {booking.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleBookingAction('confirm', booking)}
                                  className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                                >
                                  Confirm
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBookingAction('cancel', booking)}
                                className="text-red-600 hover:text-red-800 h-7 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'earnings' && (() => {
              const maxRevenue = Math.max(...monthlyEarnings.map(m => m.revenue), 1);
              const currentMonth = monthlyEarnings[monthlyEarnings.length - 1];
              const prevMonth = monthlyEarnings[monthlyEarnings.length - 2];
              const growth = prevMonth?.revenue > 0
                ? (((currentMonth?.revenue || 0) - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1)
                : null;
              const total = bookingStatusCounts.confirmed + bookingStatusCounts.pending + bookingStatusCounts.cancelled + bookingStatusCounts.completed;
              const statusColors = { confirmed: '#16a34a', pending: '#ca8a04', cancelled: '#dc2626', completed: '#2563eb' };
              return (
              <div className="space-y-6">
                {/* KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-5">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-700">Rs. {formatRs(stats.totalRevenue)}</p>
                    {growth !== null && (
                      <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${Number(growth) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        <TrendingUp className="h-3 w-3" />
                        {Number(growth) >= 0 ? '+' : ''}{growth}% vs last month
                      </p>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-xl p-5">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">This Month</p>
                    <p className="text-3xl font-bold text-blue-700">Rs. {formatRs(currentMonth?.revenue || 0)}</p>
                    <p className="text-xs text-blue-500 mt-1">{currentMonth?.count || 0} booking{currentMonth?.count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-xl p-5">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Avg per Booking</p>
                    <p className="text-3xl font-bold text-purple-700">
                      Rs. {stats.totalBookings > 0 ? formatRs(stats.totalRevenue / stats.totalBookings) : '0'}
                    </p>
                    <p className="text-xs text-purple-500 mt-1">{stats.totalBookings} total bookings</p>
                  </div>
                </div>

                {/* Monthly revenue bar chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      Monthly Revenue (last 6 months)
                    </CardTitle>
                    <CardDescription>Earnings trend from confirmed bookings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 sm:gap-4 h-48 px-2">
                      {monthlyEarnings.map((m) => {
                        const heightPct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                        const isCurrentMonth = m === currentMonth;
                        return (
                          <div key={m.key} className="flex-1 flex flex-col items-center gap-1 group">
                            <span className="text-[10px] sm:text-xs text-slate-500 text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Rs.{formatRs(m.revenue)}
                            </span>
                            <div className="w-full flex items-end" style={{ height: '140px' }}>
                              <div
                                className={`w-full rounded-t-md transition-all duration-500 ${isCurrentMonth ? 'bg-green-500' : 'bg-green-200 group-hover:bg-green-400'}`}
                                style={{ height: `${Math.max(heightPct, m.revenue > 0 ? 4 : 0)}%` }}
                                title={`${m.month}: Rs. ${formatRs(m.revenue)}`}
                              />
                            </div>
                            <span className="text-[10px] sm:text-xs font-medium text-slate-500">{m.month}</span>
                            {m.count > 0 && (
                              <span className="text-[9px] text-slate-400">{m.count} bk</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Booking status distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Booking Status</CardTitle>
                      <CardDescription>Distribution of all bookings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(bookingStatusCounts).map(([status, count]) => (
                          <div key={status} className="flex items-center gap-3">
                            <span className="w-20 text-xs text-gray-600 capitalize">{status}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: total > 0 ? `${(count / total) * 100}%` : '0%',
                                  backgroundColor: statusColors[status],
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
                          </div>
                        ))}
                        {total === 0 && <p className="text-sm text-gray-400 text-center py-4">No bookings yet</p>}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Revenue by Month</CardTitle>
                      <CardDescription>Top earning months</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[...monthlyEarnings].sort((a, b) => b.revenue - a.revenue).slice(0, 4).map((m) => (
                          <div key={m.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <span className="text-sm font-medium text-gray-800">{m.month} {m.key.split('-')[0]}</span>
                              <span className="ml-2 text-xs text-gray-400">{m.count} booking{m.count !== 1 ? 's' : ''}</span>
                            </div>
                            <span className="font-bold text-green-600 text-sm">Rs. {formatRs(m.revenue)}</span>
                          </div>
                        ))}
                        {monthlyEarnings.every(m => m.revenue === 0) && (
                          <p className="text-sm text-gray-400 text-center py-4">No revenue data yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              );
            })()}

            {activeTab === 'reviews' && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Reviews</CardTitle>
                  <CardDescription>Manage and respond to customer feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Review management coming soon.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      <Dialog open={hotelDialogOpen} onOpenChange={setHotelDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAddingHotel ? 'Add New Property' : 'Edit Property'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Property Name</Label>
                <Input
                  id="name"
                  value={hotelForm.name}
                  onChange={(e) => setHotelForm({...hotelForm, name: e.target.value})}
                  placeholder="Enter property name"
                />
              </div>
              <div>
                <Label htmlFor="destination-native">Destination</Label>
                <select
                  id="destination-native"
                  className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  )}
                  value={hotelForm.destination_id}
                  onChange={(e) =>
                    setHotelForm({ ...hotelForm, destination_id: e.target.value })
                  }
                >
                  <option value="">Select destination</option>
                  {destinations.map((dest) => (
                    <option key={dest.id} value={String(dest.id)}>
                      {dest.name}
                    </option>
                  ))}
                </select>
                {destinations.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No destinations loaded. Ensure the backend is running and refresh the page.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="property_type">Property Type</Label>
                <select
                  id="property_type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={hotelForm.property_type}
                  onChange={(e) => setHotelForm({ ...hotelForm, property_type: e.target.value })}
                >
                  <option value="hotel">Hotel</option>
                  <option value="villa">Villa</option>
                  <option value="resort">Resort</option>
                  <option value="homestay">Homestay</option>
                </select>
              </div>
              <div>
                <Label htmlFor="price">Price per Night</Label>
                <Input
                  id="price"
                  type="number"
                  value={hotelForm.price_per_night}
                  onChange={(e) => setHotelForm({...hotelForm, price_per_night: e.target.value})}
                  placeholder="Enter price per night"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={hotelForm.currency}
                  onChange={(e) => setHotelForm({ ...hotelForm, currency: e.target.value })}
                >
                  <option value="NPR">NPR (Rs.)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="total_rooms">Total Rooms</Label>
                <Input
                  id="total_rooms"
                  type="number"
                  value={hotelForm.total_rooms}
                  onChange={(e) => setHotelForm({...hotelForm, total_rooms: e.target.value})}
                  placeholder="Number of rooms"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={hotelForm.address}
                  onChange={(e) => setHotelForm({...hotelForm, address: e.target.value})}
                  placeholder="Enter property address"
                />
              </div>
              <div>
                <Label htmlFor="contact_number">Contact Number</Label>
                <Input
                  id="contact_number"
                  value={hotelForm.contact_number}
                  onChange={(e) => setHotelForm({...hotelForm, contact_number: e.target.value})}
                  placeholder="+977-98XXXXXXXX"
                />
              </div>
              <div>
                <Label htmlFor="hotel_email">Email</Label>
                <Input
                  id="hotel_email"
                  type="email"
                  value={hotelForm.email}
                  onChange={(e) => setHotelForm({...hotelForm, email: e.target.value})}
                  placeholder="property@example.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={hotelForm.description}
                onChange={(e) => setHotelForm({...hotelForm, description: e.target.value})}
                placeholder="Describe your property"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="hotel_image_file">Property image</Label>
              <Input
                id="hotel_image_file"
                type="file"
                accept="image/*"
                onChange={handleHotelImageChange}
              />
              {hotelImagePreview && (
                <img
                  src={hotelImagePreview}
                  alt="Hotel preview"
                  className="mt-3 h-32 w-full rounded-md object-cover border border-slate-200"
                />
              )}
              <p className="mt-2 text-xs text-slate-500">
                {getCloudinaryUploadEnabled()
                  ? 'Choose a file to upload to Cloudinary, or leave it empty and use an external image URL below.'
                  : 'Cloudinary env vars are missing, so file upload is disabled. Use the image URL field below.'}
              </p>
            </div>
            <div>
              <Label htmlFor="hotel_image_url">Property image URL</Label>
              <Input
                id="hotel_image_url"
                value={hotelForm.image}
                onChange={(e) => setHotelForm({ ...hotelForm, image: e.target.value })}
                placeholder="https://example.com/property.jpg"
              />
            </div>
            <div>
              <Label htmlFor="amenities">Amenities</Label>
              <Input
                id="amenities"
                value={hotelForm.amenities}
                onChange={(e) => setHotelForm({...hotelForm, amenities: e.target.value})}
                placeholder="WiFi, Parking, Restaurant, etc."
              />
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Room details are added after the property is saved. Once you save this property, you can open
              `Manage Rooms` and add room types, prices, capacity, description, and images.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHotelDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveHotel} disabled={!hotelForm.name.trim() || !hotelForm.destination_id || !hotelForm.description.trim() || !hotelForm.price_per_night || savingHotel || (hotelImageFile && !getCloudinaryUploadEnabled())}>
              <Save className="h-4 w-4 mr-2" />
              {savingHotel ? 'Saving…' : isAddingHotel ? 'Add Property' : 'Update Property'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderDashboard;

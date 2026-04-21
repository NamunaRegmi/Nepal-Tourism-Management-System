import { useState, useEffect, useCallback } from 'react';
import { Mountain, Compass, Package, Heart, Settings, LogOut, Plus, Hotel, CalendarCheck, DollarSign, Users, TrendingUp, Search, Menu, Bell, BarChart3, MapPin, Star, Eye, Edit, Trash2, Save, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { bookingService, hotelService, destinationService, authService } from '@/services/api';
import { createObjectPreview, getCloudinaryUploadEnabled, uploadImageToCloudinary } from '@/services/cloudinary';
import { cn } from '@/lib/utils';
import { useAppDataSync, notifyAppDataChanged } from '@/lib/dataSync';

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
    description: '',
    price_per_night: '',
    address: '',
    image: '',
    amenities: ''
  });
  const [hotelImageFile, setHotelImageFile] = useState(null);
  const [hotelImagePreview, setHotelImagePreview] = useState('');
  const [savingHotel, setSavingHotel] = useState(false);
  const [hotelDialogOpen, setHotelDialogOpen] = useState(false);

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
      description: '',
      price_per_night: '',
      address: '',
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
      description: hotel.description || '',
      price_per_night: hotel.price_per_night || '',
      address: hotel.address || '',
      image: hotel.image || '',
      amenities: hotel.amenities || ''
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
        description: hotelForm.description.trim(),
        price_per_night: hotelForm.price_per_night,
        address: hotelForm.address.trim(),
        amenities: hotelForm.amenities,
        image: imageUrl || DEFAULT_HOTEL_IMAGE,
      };
      if (isAddingHotel) {
        await hotelService.create(payload);
      } else if (editingHotel) {
        await hotelService.update(editingHotel.id, payload);
      }

      if (hotelImagePreview && hotelImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(hotelImagePreview);
      }
      setHotelImageFile(null);
      setHotelImagePreview('');
      setHotelDialogOpen(false);
      notifyAppDataChanged();
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
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {stats.pendingBookings > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </Button>
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
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-64 bg-white border-r border-gray-200 min-h-screen`}>
          <nav className="p-4 space-y-2">
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${activeTab === 'overview' ? 'text-green-600 bg-green-50' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 className="h-4 w-4 mr-3" />
              Dashboard
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${activeTab === 'properties' ? 'text-green-600 bg-green-50' : ''}`}
              onClick={() => setActiveTab('properties')}
            >
              <Hotel className="h-4 w-4 mr-3" />
              My Properties ({filteredHotels.length})
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${activeTab === 'bookings' ? 'text-green-600 bg-green-50' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <CalendarCheck className="h-4 w-4 mr-3" />
              Bookings ({filteredBookings.length})
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${activeTab === 'earnings' ? 'text-green-600 bg-green-50' : ''}`}
              onClick={() => setActiveTab('earnings')}
            >
              <DollarSign className="h-4 w-4 mr-3" />
              Earnings
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${activeTab === 'reviews' ? 'text-green-600 bg-green-50' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <Star className="h-4 w-4 mr-3" />
              Reviews
            </Button>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name || 'Provider'}!</h2>
                    <p className="text-gray-500">Here's an overview of your tourism business performance.</p>
                  </div>
                  <Button className="bg-gradient-to-r from-green-600 to-blue-600 pointer-events-auto cursor-pointer" onClick={handleAddHotel}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statCards.map((stat, index) => (
                    <Card key={index} className={`${stat.bgColor} ${stat.borderColor} border-2`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            <div className="flex items-center mt-2">
                              <span className="text-sm font-medium text-green-600">
                                {stat.change}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">vs last month</span>
                            </div>
                          </div>
                          <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                            <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
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
                        <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Booking #{booking.id}</p>
                              <p className="text-sm text-gray-500">{booking.start_date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">Rs. {booking.total_price}</p>
                            <Badge className={
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredHotels.map((hotel) => (
                        <Card key={hotel.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{hotel.name}</CardTitle>
                              <Badge
                                className={
                                  isMyHotel(hotel)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-slate-100 text-slate-700'
                                }
                              >
                                {isMyHotel(hotel) ? 'Your listing' : 'Site listing'}
                              </Badge>
                            </div>
                            {isMyHotel(hotel) && (
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditHotel(hotel)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteHotel(hotel.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">{hotel.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">{hotel.address}</span>
                                <span className="font-semibold text-green-600">Rs. {hotel.price_per_night}/night</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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
                    <div className="space-y-4">
                      {filteredBookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Booking #{booking.id}</p>
                              <p className="text-sm text-gray-500">{booking.start_date}</p>
                              {booking.room_details?.room_type && (
                                <p className="text-sm text-gray-600">Room: {booking.room_details.room_type}</p>
                              )}
                              {booking.package_details?.name && (
                                <p className="text-sm text-gray-600">Package: {booking.package_details.name}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <p className="font-medium text-gray-900">Rs. {booking.total_price}</p>
                            <Badge className={
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {booking.status}
                            </Badge>
                            <div className="flex space-x-2 mt-2">
                              {booking.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleBookingAction('confirm', booking)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Confirm
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleBookingAction('cancel', booking)}
                                className="text-red-600 hover:text-red-800"
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

            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Earnings Overview</CardTitle>
                    <CardDescription>Your revenue and financial insights</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Total Revenue</h4>
                        <p className="text-2xl font-bold text-green-600">Rs. {formatRs(stats.totalRevenue)}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">This Month</h4>
                        <p className="text-2xl font-bold text-blue-600">Rs. {formatRs(stats.totalRevenue * 0.3)}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Average per Booking</h4>
                        <p className="text-2xl font-bold text-purple-600">
                          Rs. {stats.totalBookings > 0 ? formatRs(stats.totalRevenue / stats.totalBookings) : '0'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

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
        <DialogContent className="max-w-2xl">
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
                <Label htmlFor="price">Price per Night (Rs.)</Label>
                <Input
                  id="price"
                  type="number"
                  value={hotelForm.price_per_night}
                  onChange={(e) => setHotelForm({...hotelForm, price_per_night: e.target.value})}
                  placeholder="Enter price per night"
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

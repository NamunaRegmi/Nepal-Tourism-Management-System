import { useState, useEffect } from 'react';
import { Mountain, Compass, Package, Heart, Settings, LogOut, Plus, Hotel, CalendarCheck, DollarSign, Users, TrendingUp, Search, Menu, Bell, BarChart3, MapPin, Star, Eye, Edit, Trash2, Save, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { bookingService, hotelService, destinationService, authService } from '@/services/api';

const ProviderDashboard = ({ onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Property management states
  const [isAddingHotel, setIsAddingHotel] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [hotelForm, setHotelForm] = useState({
    name: '',
    destination_id: '',
    description: '',
    price_per_night: '',
    address: '',
    type: 'hotel',
    image: '',
    amenities: ''
  });
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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hotelsRes, bookingsRes, destRes] = await Promise.all([
        hotelService.getMyHotels(),
        bookingService.getMyBookings(),
        destinationService.getAll()
      ]);
      
      setHotels(hotelsRes.data || []);
      setBookings(bookingsRes.data || []);
      setDestinations(destRes.data || []);
      
      // Calculate stats
      const bookingsData = bookingsRes.data || [];
      setStats({
        totalBookings: bookingsData.length,
        totalRevenue: bookingsData.reduce((sum, booking) => sum + (booking.total_price || 0), 0),
        activeProperties: (hotelsRes.data || []).length,
        averageRating: 4.5, // Placeholder - should come from reviews
        monthlyGrowth: 15.3, // Placeholder
        pendingBookings: bookingsData.filter(b => b.status === 'pending').length
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      type: 'hotel',
      image: '',
      amenities: ''
    });
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
      type: hotel.type || 'hotel',
      image: hotel.image || '',
      amenities: hotel.amenities || ''
    });
    setEditingHotel(hotel);
    setIsAddingHotel(false);
    setHotelDialogOpen(true);
  };

  const handleSaveHotel = async () => {
    try {
      if (isAddingHotel) {
        await hotelService.create(hotelForm);
      } else if (editingHotel) {
        await hotelService.update(editingHotel.id, hotelForm);
      }
      
      setHotelDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to save hotel:', error);
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await hotelService.delete(hotelId);
        setHotels(hotels.filter(h => h.id !== hotelId));
      } catch (error) {
        console.error('Failed to delete hotel:', error);
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
      value: `Rs. ${stats.totalRevenue.toLocaleString()}`,
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

  const filteredHotels = hotels.filter(hotel => 
    hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hotel.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
        </header>

      <div className="flex">
        {/* Sidebar */}
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

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name || 'Provider'}!</h2>
                    <p className="text-gray-500">Here's an overview of your tourism business performance.</p>
                  </div>
                  <Button className="bg-gradient-to-r from-green-600 to-blue-600" onClick={handleAddHotel}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </div>

                {/* Stats Grid */}
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

                {/* Recent Bookings */}
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
                  <CardDescription>Latest booking requests from customers</CardDescription>
                </CardHeader>
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

            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Hotel className="h-5 w-5 mr-2" />
                      <CardTitle>My Properties</CardTitle>
                    </div>
                    <Button onClick={handleAddHotel}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Property
                    </Button>
                  </div>
                  <CardDescription>Manage your hotels and properties</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading properties...</div>
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
                              <Badge className={
                                hotel.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }>
                                {hotel.is_verified ? 'Verified' : 'Pending'}
                              </Badge>
                            </div>
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

            {/* Bookings Tab */}
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
                              {booking.room?.room_type && (
                                <p className="text-sm text-gray-600">Room: {booking.room.room_type}</p>
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

            {/* Earnings Tab */}
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
                        <p className="text-2xl font-bold text-green-600">Rs. {stats.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">This Month</h4>
                        <p className="text-2xl font-bold text-blue-600">Rs. {(stats.totalRevenue * 0.3).toLocaleString()}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Average per Booking</h4>
                        <p className="text-2xl font-bold text-purple-600">
                          Rs. {stats.totalBookings > 0 ? Math.round(stats.totalRevenue / stats.totalBookings) : 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Reviews Tab */}
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

      {/* Add/Edit Hotel Dialog */}
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
                <Label htmlFor="destination">Destination</Label>
                <Select value={hotelForm.destination_id} onValueChange={(value) => setHotelForm({...hotelForm, destination_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((dest) => (
                      <SelectItem key={dest.id} value={dest.id.toString()}>
                        {dest.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <Button onClick={handleSaveHotel} disabled={!hotelForm.name || !hotelForm.destination_id}>
              <Save className="h-4 w-4 mr-2" />
              {isAddingHotel ? 'Add Property' : 'Update Property'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderDashboard;

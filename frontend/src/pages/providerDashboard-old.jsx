import { useState, useEffect } from 'react';
import { Mountain, Compass, Package, Heart, Settings, LogOut, Plus, Hotel, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { bookingService, hotelService, destinationService, authService } from '@/services/api';

import RoomManager from '@/components/RoomManager';
import { CreditCard, DollarSign, AlertCircle } from 'lucide-react';

const ProviderDashboard = ({ onNavigate }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Manage Rooms State
  const [selectedHotelForRooms, setSelectedHotelForRooms] = useState(null);

  // Form states
  const [isAddingHotel, setIsAddingHotel] = useState(false);
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [newHotel, setNewHotel] = useState({
    name: '', destination_id: '', description: '', price_per_night: '', address: '', type: 'hotel', image: '', amenities: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const hotelsRes = await hotelService.getMyHotels();
      const [bookingsRes, destRes] = await Promise.all([
        bookingService.getMyBookings(),
        destinationService.getAll()
      ]);
      setBookings(bookingsRes.data);
      setHotels(hotelsRes.data);
      setDestinations(destRes.data);
    } catch (err) {
      console.error("Failed to fetch provider data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHotel = async (e) => {
    e.preventDefault();
    try {
      const amenitiesList = newHotel.amenities ? newHotel.amenities.split(',').map(i => i.trim()) : [];
      const payload = { ...newHotel, amenities: amenitiesList };
      if (editingHotelId) {
        await hotelService.update(editingHotelId, payload);
      } else {
        await hotelService.create(newHotel.destination_id, payload);
      }
      setIsAddingHotel(false);
      setEditingHotelId(null);
      setNewHotel({ name: '', destination_id: '', description: '', price_per_night: '', image: '', amenities: '' });
      fetchData();
    } catch (error) {
      console.error("Failed to save hotel", error);
    }
  };

  const handleEditHotel = (hotel) => {
    setNewHotel({
      name: hotel.name,
      destination_id: hotel.destination_id,
      description: hotel.description,
      price_per_night: hotel.price_per_night,
      image: hotel.image || '',
      amenities: hotel.amenities ? hotel.amenities.join(', ') : '',
    });
    setEditingHotelId(hotel.id);
    setIsAddingHotel(true);
  };

  const handleDeleteHotel = async (id) => {
    if (window.confirm("Are you sure you want to delete this hotel?")) {
      try {
        await hotelService.delete(id);
        fetchData();
      } catch (error) {
        console.error("Failed to delete hotel", error);
      }
    }
  };

  const handleBookingStatus = async (id, status) => {
    try {
      await bookingService.updateStatus(id, status);
      fetchData(); // Refresh
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update booking status");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    onNavigate('home');
  };

  if (selectedHotelForRooms) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <RoomManager hotel={selectedHotelForRooms} onClose={() => setSelectedHotelForRooms(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
          <p className="text-gray-500">Manage your travel services and bookings as a service provider</p>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="services">My Services</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <div className="h-4 w-4 text-gray-500 flex items-center justify-center font-bold">Rs</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      Rs. {bookings.filter(b => b.status === 'confirmed').reduce((acc, curr) => acc + parseFloat(curr.total_price), 0).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                    <CalendarCheck className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{bookings.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                    <Hotel className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{hotels.length}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">My Hotels & Homestays</h2>
                <Button onClick={() => { setIsAddingHotel(true); setEditingHotelId(null); setNewHotel({ name: '', destination_id: '', description: '', price_per_night: '', image: '', amenities: '' }); }}>
                  <Plus className="mr-2 h-4 w-4" /> Add Hotel
                </Button>
              </div>

              {isAddingHotel && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>{editingHotelId ? 'Edit Hotel' : 'Add New Hotel'}</CardTitle>
                    <CardDescription>Fill in the details for the accommodation.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddHotel} className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input value={newHotel.name} onChange={e => setNewHotel({ ...newHotel, name: e.target.value })} required />
                      </div>
                      <div className="grid gap-2">
                        <Label>Destination</Label>
                        <Select value={newHotel.destination_id} onValueChange={v => setNewHotel({ ...newHotel, destination_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select Destination" /></SelectTrigger>
                          <SelectContent>
                            {destinations.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Price per Night (Rs.)</Label>
                        <Input type="number" value={newHotel.price_per_night} onChange={e => setNewHotel({ ...newHotel, price_per_night: e.target.value })} required />
                      </div>
                      <div className="grid gap-2">
                        <Label>Description</Label>
                        <Input value={newHotel.description} onChange={e => setNewHotel({ ...newHotel, description: e.target.value })} />
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={() => { setIsAddingHotel(false); setEditingHotelId(null); }}>Cancel</Button>
                        <Button type="submit">{editingHotelId ? 'Save Changes' : 'Save Hotel'}</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid md:grid-cols-3 gap-6">
                {hotels.map(hotel => (
                  <Card key={hotel.id}>
                    <div className="h-40 w-full overflow-hidden rounded-t-lg bg-gray-200">
                      <img src={hotel.image || 'https://via.placeholder.com/400x300'} alt={hotel.name} className="w-full h-full object-cover" />
                    </div>
                    <CardHeader>
                      <CardTitle>{hotel.name}</CardTitle>
                      <CardDescription>{hotel.address}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mt-4">
                        <span className="font-bold">Rs. {hotel.price_per_night}/night</span>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditHotel(hotel)}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteHotel(hotel.id)}>Delete</Button>
                          <Button variant="secondary" size="sm" onClick={() => setSelectedHotelForRooms(hotel)}>Rooms</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-6">
              <h2 className="text-xl font-semibold">Manage Bookings</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 uppercase">
                    <tr>
                      <th className="px-6 py-3">Booking ID</th>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Item</th>
                      <th className="px-6 py-3">Dates</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => (
                      <tr key={booking.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">#{booking.id}</td>
                        <td className="px-6 py-4">{booking.user?.first_name || booking.user?.username || 'Guest'}</td>
                        <td className="px-6 py-4">{booking.room_details?.hotel?.name || booking.package_details?.name}</td>
                        <td className="px-6 py-4">{booking.start_date} to {booking.end_date}</td>
                        <td className="px-6 py-4">Rs. {booking.total_price}</td>
                        <td className="px-6 py-4">
                          <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'cancelled' ? 'destructive' : 'secondary'}>
                            {booking.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <Button size="xs" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleBookingStatus(booking.id, 'confirmed')}>Approve</Button>
                              <Button size="xs" variant="destructive" onClick={() => handleBookingStatus(booking.id, 'cancelled')}>Reject</Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">No bookings found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <h2 className="text-xl font-semibold">Payment Management</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Payment Settings</CardTitle>
                    <CreditCard className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Payment Gateway</span>
                        <Badge variant="outline">Stripe</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Commission Rate</span>
                        <span className="text-sm font-semibold">5%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Auto-Confirm</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Button className="w-full">Configure Payment Settings</Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
                    <DollarSign className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {bookings.slice(0, 5).map(booking => (
                        <div key={booking.id} className="flex items-center justify-between p-3 border-b">
                          <div>
                            <p className="text-sm font-medium">{booking.user?.first_name || booking.user?.username || 'Guest'}</p>
                            <p className="text-xs text-gray-500">{booking.start_date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">Rs. {booking.total_price}</p>
                            <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className="ml-2">
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {bookings.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No transactions found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default ProviderDashboard;
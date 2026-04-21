import { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Building2, Package, BarChart3, TrendingUp, Calendar, DollarSign, Activity, ChevronRight, Bell, Search, Menu, X, Settings, UserCheck, UserX, Eye, Edit, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { adminService, bookingService } from '../services/api';
import { useAppDataSync, notifyAppDataChanged } from '@/lib/dataSync';

const AdminDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState({
    total_users: 0,
    total_providers: 0,
    total_guides: 0,
    total_bookings: 0,
    total_guide_bookings: 0,
    revenue: 0,
    guide_revenue: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingActionLoading, setBookingActionLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await adminService.getStats();
      if (statsResponse.data) {
        setDashboardStats(statsResponse.data);
      }

      // Fetch users
      const usersResponse = await adminService.getAllUsers();
      if (usersResponse.data) {
        setUsers(usersResponse.data);
      }

      // Fetch providers
      const providersResponse = await adminService.getAllProviders();
      if (providersResponse.data) {
        setProviders(providersResponse.data);
      }

      // Fetch bookings
      const bookingsResponse = await adminService.getAllBookings();
      if (bookingsResponse.data) {
        setBookings(bookingsResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useAppDataSync(fetchDashboardData);

  const stats = [
    { 
      title: "Total Users", 
      value: dashboardStats.total_users.toLocaleString(), 
      change: "+12%", 
      changeType: "increase",
      desc: "Registered Accounts", 
      icon: Users, 
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200"
    },
    { 
      title: "Service Providers", 
      value: dashboardStats.total_providers.toLocaleString(), 
      change: "+8%", 
      changeType: "increase",
      desc: "Active Providers", 
      icon: Building2, 
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200"
    },
    {
      title: "Tour guides",
      value: (dashboardStats.total_guides ?? 0).toLocaleString(),
      change: "+5%",
      changeType: "increase",
      desc: "Registered guides",
      icon: MapPin,
      color: "teal",
      bgColor: "bg-teal-50",
      iconColor: "text-teal-600",
      borderColor: "border-teal-200"
    },
    { 
      title: "Total Bookings", 
      value: dashboardStats.total_bookings.toLocaleString(), 
      change: "+23%", 
      changeType: "increase",
      desc: "All Time", 
      icon: Package, 
      color: "purple",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200"
    },
    { 
      title: "Revenue", 
      value: `Rs. ${Number(dashboardStats.revenue || 0).toLocaleString('en-IN')}`, 
      change: "+18%", 
      changeType: "increase",
      desc: "Stays & packages (confirmed)", 
      icon: DollarSign, 
      color: "amber",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200"
    },
    {
      title: "Guide bookings",
      value: (dashboardStats.total_guide_bookings ?? 0).toLocaleString(),
      change: "+10%",
      changeType: "increase",
      desc: "Tour guide requests",
      icon: Calendar,
      color: "indigo",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      borderColor: "border-indigo-200"
    },
    {
      title: "Guide revenue",
      value: `Rs. ${Number(dashboardStats.guide_revenue || 0).toLocaleString('en-IN')}`,
      change: "+12%",
      changeType: "increase",
      desc: "Confirmed guide trips",
      icon: DollarSign,
      color: "emerald",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200"
    },
  ];

  const recentActivity = [
    { id: 1, user: "John Doe", action: "Registered", time: "2 hours ago", type: "user" },
    { id: 2, user: "Travel Nepal Pvt Ltd", action: "New Provider Application", time: "4 hours ago", type: "provider" },
    { id: 3, user: "Jane Smith", action: "Booked Everest Tour", time: "6 hours ago", type: "booking" },
    { id: 4, user: "Mountain Guides", action: "Updated Package", time: "8 hours ago", type: "provider" },
  ];

  const handleUserAction = async (action, user) => {
    try {
      if (action === 'view') {
        setSelectedUser(user);
        setUserDialogOpen(true);
      } else if (action === 'delete') {
        if (window.confirm(`Are you sure you want to delete user ${user.username}?`)) {
          await adminService.deleteUser(user.id);
          setUsers(users.filter(u => u.id !== user.id));
          notifyAppDataChanged();
        }
      }
    } catch (error) {
      console.error('User action failed:', error);
    }
  };

  const handleBookingAction = async (action, booking) => {
    const nextStatusMap = {
      confirm: 'confirmed',
      cancel: 'cancelled',
      complete: 'completed',
    };
    const nextStatus = nextStatusMap[action];

    if (!nextStatus) {
      return;
    }

    try {
      setBookingActionLoading(true);
      await bookingService.update(booking.id, { status: nextStatus });

      setBookings((currentBookings) =>
        currentBookings.map((item) =>
          item.id === booking.id ? { ...item, status: nextStatus } : item
        )
      );

      setSelectedBooking((currentBooking) =>
        currentBooking?.id === booking.id ? { ...currentBooking, status: nextStatus } : currentBooking
      );
      notifyAppDataChanged();
    } catch (error) {
      console.error('Booking action failed:', error);
      window.alert(error.response?.data?.error || 'Could not update booking status.');
    } finally {
      setBookingActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProviders = providers.filter(provider => 
    provider.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    provider.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBookings = bookings.filter(booking => 
    booking.id.toString().includes(searchQuery) ||
    (booking.user && booking.user.username.toLowerCase().includes(searchQuery.toLowerCase()))
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Nepal Tourism Management</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users, providers, bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                A
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-64 bg-white border-r border-gray-200 min-h-screen`}>
          <nav className="p-4 space-y-2">
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${activeTab === 'overview' ? 'text-blue-600 bg-blue-50' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Activity className="h-4 w-4 mr-3" />
              Dashboard Overview
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${activeTab === 'users' ? 'text-blue-600 bg-blue-50' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users className="h-4 w-4 mr-3" />
              Manage Users ({filteredUsers.length})
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${activeTab === 'providers' ? 'text-blue-600 bg-blue-50' : ''}`}
              onClick={() => setActiveTab('providers')}
            >
              <Building2 className="h-4 w-4 mr-3" />
              Manage Providers ({filteredProviders.length})
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${activeTab === 'bookings' ? 'text-blue-600 bg-blue-50' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <Package className="h-4 w-4 mr-3" />
              Manage Bookings ({filteredBookings.length})
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${activeTab === 'reports' ? 'text-blue-600 bg-blue-50' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <BarChart3 className="h-4 w-4 mr-3" />
              Reports
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
                    <h2 className="text-2xl font-bold text-gray-900">Welcome back, Admin</h2>
                    <p className="text-gray-500">Here's what's happening with your platform today.</p>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <Card key={index} className={`${stat.bgColor} ${stat.borderColor} border-2`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            <div className="flex items-center mt-2">
                              <span className={`text-sm font-medium ${
                                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {stat.change}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">{stat.desc}</span>
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

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Latest platform updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            activity.type === 'user' ? 'bg-blue-500' :
                            activity.type === 'provider' ? 'bg-green-500' : 'bg-purple-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {activity.user}
                            </p>
                            <p className="text-sm text-gray-500">{activity.action}</p>
                          </div>
                          <span className="text-xs text-gray-400">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Users</CardTitle>
                  <CardDescription>View and manage all registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading users...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge className={user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleUserAction('view', user)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleUserAction('delete', user)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Providers Tab */}
            {activeTab === 'providers' && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Service Providers</CardTitle>
                  <CardDescription>View and manage all registered service providers</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading providers...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Company Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProviders.map((provider) => (
                          <TableRow key={provider.id}>
                            <TableCell>{provider.id}</TableCell>
                            <TableCell className="font-medium">{provider.company_name || provider.username}</TableCell>
                            <TableCell>{provider.email}</TableCell>
                            <TableCell>{provider.phone}</TableCell>
                            <TableCell>
                              <Badge className={provider.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {provider.is_verified ? 'Verified' : 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Bookings</CardTitle>
                  <CardDescription>View and manage all booking requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading bookings...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Hotel/Package</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>{booking.id}</TableCell>
                            <TableCell>{booking.user?.username || 'N/A'}</TableCell>
                            <TableCell>{booking.room_details?.room_type || booking.package_details?.name || 'N/A'}</TableCell>
                            <TableCell>Rs. {booking.total_price}</TableCell>
                            <TableCell>
                              <Badge className={
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setBookingDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {booking.status === 'pending' && (
                                  <>
                                    <Button size="sm" onClick={() => handleBookingAction('confirm', booking)}>
                                      Confirm
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleBookingAction('cancel', booking)}>
                                      Cancel
                                    </Button>
                                  </>
                                )}
                                {booking.status === 'confirmed' && (
                                  <Button size="sm" onClick={() => handleBookingAction('complete', booking)}>
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Reports</CardTitle>
                    <CardDescription>Analytics and platform insights</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">User Registration Trends</h4>
                        <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                          <BarChart3 className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Revenue Analytics</h4>
                        <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                          <DollarSign className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* User Details Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Username</p>
                  <p className="font-semibold">{selectedUser.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-semibold">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="font-semibold">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <Badge className={selectedUser.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Profile Picture</p>
                {selectedUser.profile_picture ? (
                  <img src={selectedUser.profile_picture} alt="Profile" className="w-20 h-20 rounded-full" />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserCheck className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Booking ID</p>
                  <p className="font-semibold">#{selectedBooking.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">User</p>
                  <p className="font-semibold">{selectedBooking.user?.username || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Item</p>
                  <p className="font-semibold">{selectedBooking.room_details?.room_type || selectedBooking.package_details?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="font-semibold">Rs. {selectedBooking.total_price}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge className={
                    selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Payment</p>
                  <Badge className={
                    selectedBooking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                    selectedBooking.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {selectedBooking.payment_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Start Date</p>
                  <p className="font-semibold">{selectedBooking.start_date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">End Date</p>
                  <p className="font-semibold">{selectedBooking.end_date || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedBooking?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleBookingAction('cancel', selectedBooking)}
                  disabled={bookingActionLoading}
                >
                  Cancel Booking
                </Button>
                <Button
                  onClick={() => handleBookingAction('confirm', selectedBooking)}
                  disabled={bookingActionLoading}
                >
                  Confirm Booking
                </Button>
              </>
            )}
            {selectedBooking?.status === 'confirmed' && (
              <Button
                onClick={() => handleBookingAction('complete', selectedBooking)}
                disabled={bookingActionLoading}
              >
                Mark Completed
              </Button>
            )}
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

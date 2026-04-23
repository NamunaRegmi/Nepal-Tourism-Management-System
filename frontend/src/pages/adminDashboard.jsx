import { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Building2, Package, BarChart3, TrendingUp, Calendar, DollarSign, Activity, ChevronRight, Bell, Search, Menu, X, Settings, UserCheck, UserX, Eye, Edit, Trash2, MapPin, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { adminService, authService, bookingService } from '../services/api';
import { useAppDataSync, notifyAppDataChanged } from '@/lib/dataSync';

const AdminDashboard = ({ onNavigate }) => {
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
  const [packages, setPackages] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingActionLoading, setBookingActionLoading] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    profile_picture: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    id: null,
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    is_active: true,
  });
  const [savingUser, setSavingUser] = useState(false);
  const [editProviderDialogOpen, setEditProviderDialogOpen] = useState(false);
  const [editProviderForm, setEditProviderForm] = useState({
    id: null,
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    is_active: true,
  });
  const [savingProvider, setSavingProvider] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      console.log('Fetching admin dashboard data...');

      const profileResponse = await authService.getProfile();
      if (profileResponse.data) {
        console.log('Admin profile:', profileResponse.data);
        setAdminProfile(profileResponse.data);
        setProfileForm({
          username: profileResponse.data.username || '',
          first_name: profileResponse.data.first_name || '',
          last_name: profileResponse.data.last_name || '',
          email: profileResponse.data.email || '',
          phone: profileResponse.data.phone || '',
          profile_picture: profileResponse.data.profile_picture || '',
        });
        localStorage.setItem('user', JSON.stringify(profileResponse.data));
      }
      
      // Fetch dashboard stats
      const statsResponse = await adminService.getStats();
      console.log('Stats response:', statsResponse.data);
      if (statsResponse.data) {
        setDashboardStats(statsResponse.data);
      }

      // Fetch users
      const usersResponse = await adminService.getAllUsers();
      console.log('Users response:', usersResponse.data);
      if (usersResponse.data) {
        setUsers(usersResponse.data);
      }

      // Fetch providers
      const providersResponse = await adminService.getAllProviders();
      console.log('Providers response:', providersResponse.data);
      if (providersResponse.data) {
        setProviders(providersResponse.data);
      }

      // Fetch bookings
      const bookingsResponse = await adminService.getAllBookings();
      console.log('Bookings response:', bookingsResponse.data);
      if (bookingsResponse.data) {
        setBookings(bookingsResponse.data);
      }

      // Fetch packages
      const packagesResponse = await adminService.getAllPackages();
      console.log('Packages response:', packagesResponse.data);
      if (packagesResponse.data) {
        setPackages(packagesResponse.data);
      }

      // Build recent activity from actual data
      const activities = [];
      
      // Add recent users (last 5)
      if (usersResponse.data) {
        usersResponse.data.slice(0, 5).forEach(user => {
          activities.push({
            id: `user-${user.id}`,
            user: user.username,
            action: 'Registered as User',
            time: new Date(user.date_joined).toLocaleString(),
            type: 'user',
            timestamp: new Date(user.date_joined).getTime()
          });
        });
      }

      // Add recent providers (last 5)
      if (providersResponse.data) {
        providersResponse.data.slice(0, 5).forEach(provider => {
          activities.push({
            id: `provider-${provider.id}`,
            user: provider.company_name || provider.username,
            action: 'Registered as Provider',
            time: new Date(provider.date_joined).toLocaleString(),
            type: 'provider',
            timestamp: new Date(provider.date_joined).getTime()
          });
        });
      }

      // Add recent bookings (last 5)
      if (bookingsResponse.data) {
        bookingsResponse.data.slice(0, 5).forEach(booking => {
          const itemName = booking.room_details?.room_type || booking.package_details?.name || 'Item';
          activities.push({
            id: `booking-${booking.id}`,
            user: booking.user?.username || 'User',
            action: `Booked ${itemName}`,
            time: new Date(booking.created_at).toLocaleString(),
            type: 'booking',
            timestamp: new Date(booking.created_at).getTime()
          });
        });
      }

      // Sort by timestamp (most recent first) and take top 10
      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivity(activities.slice(0, 10));

    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);
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
      desc: "Active Providers", 
      icon: Building2, 
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200"
    },
    {
      title: "Tour Guides",
      value: (dashboardStats.total_guides ?? 0).toLocaleString(),
      desc: "Registered Guides",
      icon: MapPin,
      color: "teal",
      bgColor: "bg-teal-50",
      iconColor: "text-teal-600",
      borderColor: "border-teal-200"
    },
    { 
      title: "Total Bookings", 
      value: dashboardStats.total_bookings.toLocaleString(), 
      desc: "All Time", 
      icon: Package, 
      color: "purple",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200"
    },
    { 
      title: "Tour Packages", 
      value: (dashboardStats.total_packages ?? 0).toLocaleString(), 
      desc: "Active Packages", 
      icon: Package, 
      color: "indigo",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      borderColor: "border-indigo-200"
    },
    { 
      title: "Hotels", 
      value: (dashboardStats.total_hotels ?? 0).toLocaleString(), 
      desc: "Active Hotels", 
      icon: Building2, 
      color: "cyan",
      bgColor: "bg-cyan-50",
      iconColor: "text-cyan-600",
      borderColor: "border-cyan-200"
    },
    { 
      title: "Revenue", 
      value: `Rs. ${Number(dashboardStats.revenue || 0).toLocaleString('en-IN')}`, 
      desc: "Stays & Packages (Confirmed)", 
      icon: DollarSign, 
      color: "amber",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200"
    },
    {
      title: "Guide Bookings",
      value: (dashboardStats.total_guide_bookings ?? 0).toLocaleString(),
      desc: "Tour Guide Requests",
      icon: Calendar,
      color: "rose",
      bgColor: "bg-rose-50",
      iconColor: "text-rose-600",
      borderColor: "border-rose-200"
    },
    {
      title: "Guide Revenue",
      value: `Rs. ${Number(dashboardStats.guide_revenue || 0).toLocaleString('en-IN')}`,
      desc: "Confirmed Guide Trips",
      icon: DollarSign,
      color: "emerald",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200"
    },
  ];

  const handleUserAction = async (action, user) => {
    try {
      if (action === 'view') {
        setSelectedUser(user);
        setUserDialogOpen(true);
      } else if (action === 'edit') {
        setEditUserForm({
          id: user.id,
          username: user.username || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          is_active: user.is_active !== undefined ? user.is_active : true,
        });
        setEditUserDialogOpen(true);
      } else if (action === 'delete') {
        if (window.confirm(`Are you sure you want to delete user ${user.username}?`)) {
          await adminService.deleteUser(user.id);
          setUsers(users.filter(u => u.id !== user.id));
          await fetchDashboardData();
          notifyAppDataChanged();
        }
      } else if (action === 'toggle-active') {
        await adminService.updateUser(user.id, { is_active: !user.is_active });
        setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
        await fetchDashboardData();
        notifyAppDataChanged();
      }
    } catch (error) {
      console.error('User action failed:', error);
      window.alert(error.response?.data?.error || 'Action failed');
    }
  };

  const handleSaveUser = async () => {
    try {
      if (!editUserForm.username.trim() || !editUserForm.email.trim()) {
        window.alert('Username and email are required.');
        return;
      }

      setSavingUser(true);
      await adminService.updateUser(editUserForm.id, {
        username: editUserForm.username.trim(),
        first_name: editUserForm.first_name.trim(),
        last_name: editUserForm.last_name.trim(),
        email: editUserForm.email.trim(),
        phone: editUserForm.phone.trim(),
        is_active: editUserForm.is_active,
      });
      
      setUsers(users.map(u => u.id === editUserForm.id ? { ...u, ...editUserForm } : u));
      setEditUserDialogOpen(false);
      await fetchDashboardData();
      notifyAppDataChanged();
    } catch (error) {
      console.error('User update failed:', error);
      window.alert(error.response?.data ? JSON.stringify(error.response.data) : 'Could not update user.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleProviderAction = async (action, provider) => {
    try {
      if (action === 'view') {
        setSelectedUser(provider);
        setUserDialogOpen(true);
      } else if (action === 'edit') {
        setEditProviderForm({
          id: provider.id,
          username: provider.username || '',
          first_name: provider.first_name || '',
          last_name: provider.last_name || '',
          email: provider.email || '',
          phone: provider.phone || '',
          company_name: provider.company_name || '',
          is_active: provider.is_active !== undefined ? provider.is_active : true,
        });
        setEditProviderDialogOpen(true);
      } else if (action === 'delete') {
        if (window.confirm(`Are you sure you want to delete provider ${provider.username}?`)) {
          await adminService.deleteProvider(provider.id);
          setProviders(providers.filter(p => p.id !== provider.id));
          await fetchDashboardData();
          notifyAppDataChanged();
        }
      } else if (action === 'toggle-active') {
        await adminService.updateProvider(provider.id, { is_active: !provider.is_active });
        setProviders(providers.map(p => p.id === provider.id ? { ...p, is_active: !p.is_active } : p));
        await fetchDashboardData();
        notifyAppDataChanged();
      }
    } catch (error) {
      console.error('Provider action failed:', error);
      window.alert(error.response?.data?.error || 'Action failed');
    }
  };

  const handleSaveProvider = async () => {
    try {
      if (!editProviderForm.username.trim() || !editProviderForm.email.trim()) {
        window.alert('Username and email are required.');
        return;
      }

      setSavingProvider(true);
      await adminService.updateProvider(editProviderForm.id, {
        username: editProviderForm.username.trim(),
        first_name: editProviderForm.first_name.trim(),
        last_name: editProviderForm.last_name.trim(),
        email: editProviderForm.email.trim(),
        phone: editProviderForm.phone.trim(),
        company_name: editProviderForm.company_name.trim(),
        is_active: editProviderForm.is_active,
      });
      
      setProviders(providers.map(p => p.id === editProviderForm.id ? { ...p, ...editProviderForm } : p));
      setEditProviderDialogOpen(false);
      await fetchDashboardData();
      notifyAppDataChanged();
    } catch (error) {
      console.error('Provider update failed:', error);
      window.alert(error.response?.data ? JSON.stringify(error.response.data) : 'Could not update provider.');
    } finally {
      setSavingProvider(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setShowProfileDropdown(false);
      onNavigate?.('home');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!profileForm.username.trim() || !profileForm.email.trim()) {
        window.alert('Username and email are required.');
        return;
      }

      setSavingProfile(true);
      const response = await authService.updateProfile({
        username: profileForm.username.trim(),
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        profile_picture: profileForm.profile_picture.trim(),
      });
      setAdminProfile(response.data);
      setProfileForm({
        username: response.data.username || '',
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        profile_picture: response.data.profile_picture || '',
      });
      localStorage.setItem('user', JSON.stringify(response.data));
      setProfileDialogOpen(false);
      notifyAppDataChanged();
    } catch (error) {
      console.error('Admin profile update failed:', error);
      window.alert(error.response?.data ? JSON.stringify(error.response.data) : 'Could not update profile.');
    } finally {
      setSavingProfile(false);
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
            <div className="relative">
              <Avatar className="h-8 w-8 cursor-pointer" onClick={() => setShowProfileDropdown((open) => !open)}>
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  {(adminProfile?.first_name || adminProfile?.username || 'A').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{adminProfile?.first_name || adminProfile?.username || 'Admin'}</p>
                    <p className="text-xs text-gray-500">{adminProfile?.email || 'admin@example.com'}</p>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setProfileDialogOpen(true);
                      setShowProfileDropdown(false);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Profile
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600"
                    onClick={handleLogout}
                  >
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
              className={`w-full justify-start ${activeTab === 'packages' ? 'text-blue-600 bg-blue-50' : ''}`}
              onClick={() => setActiveTab('packages')}
            >
              <Package className="h-4 w-4 mr-3" />
              Manage Packages ({packages.length})
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stats.map((stat, index) => (
                    <Card key={index} className={`${stat.bgColor} ${stat.borderColor} border-2`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            <div className="flex items-center mt-2">
                              <span className="text-sm text-gray-500">{stat.desc}</span>
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
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleUserAction('edit', user)}
                                  title="Edit User"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleUserAction('toggle-active', user)}
                                  title={user.is_active ? 'Deactivate' : 'Activate'}
                                  className={user.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}
                                >
                                  {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleUserAction('delete', user)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete User"
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
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleProviderAction('view', provider)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleProviderAction('edit', provider)}
                                  title="Edit Provider"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleProviderAction('toggle-active', provider)}
                                  title={provider.is_active ? 'Deactivate' : 'Activate'}
                                  className={provider.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}
                                >
                                  {provider.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleProviderAction('delete', provider)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete Provider"
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

            {/* Packages Tab */}
            {activeTab === 'packages' && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Tour Packages</CardTitle>
                  <CardDescription>View all tour packages from all providers</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading packages...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Package Name</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packages.map((pkg) => (
                          <TableRow key={pkg.id}>
                            <TableCell>{pkg.id}</TableCell>
                            <TableCell className="font-medium">{pkg.name}</TableCell>
                            <TableCell>{pkg.provider_details?.username || 'N/A'}</TableCell>
                            <TableCell>Rs. {Number(pkg.price).toLocaleString('en-IN')}</TableCell>
                            <TableCell>{pkg.duration_days} days</TableCell>
                            <TableCell>
                              <Badge className={pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {pkg.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
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

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="admin-username">Username</Label>
              <Input
                id="admin-username"
                value={profileForm.username}
                onChange={(event) => setProfileForm((current) => ({ ...current, username: event.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="admin-first-name">First Name</Label>
                <Input
                  id="admin-first-name"
                  value={profileForm.first_name}
                  onChange={(event) => setProfileForm((current) => ({ ...current, first_name: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-last-name">Last Name</Label>
                <Input
                  id="admin-last-name"
                  value={profileForm.last_name}
                  onChange={(event) => setProfileForm((current) => ({ ...current, last_name: event.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={profileForm.email}
                onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-phone">Phone</Label>
              <Input
                id="admin-phone"
                value={profileForm.phone}
                onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-picture">Profile Picture URL</Label>
              <Input
                id="admin-picture"
                value={profileForm.profile_picture}
                onChange={(event) => setProfileForm((current) => ({ ...current, profile_picture: event.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={!profileForm.username.trim() || !profileForm.email.trim() || savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-user-username">Username</Label>
              <Input
                id="edit-user-username"
                value={editUserForm.username}
                onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-user-first-name">First Name</Label>
                <Input
                  id="edit-user-first-name"
                  value={editUserForm.first_name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, first_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-user-last-name">Last Name</Label>
                <Input
                  id="edit-user-last-name"
                  value={editUserForm.last_name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-user-email">Email</Label>
              <Input
                id="edit-user-email"
                type="email"
                value={editUserForm.email}
                onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-user-phone">Phone</Label>
              <Input
                id="edit-user-phone"
                value={editUserForm.phone}
                onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-user-active"
                checked={editUserForm.is_active}
                onChange={(e) => setEditUserForm({ ...editUserForm, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-user-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={!editUserForm.username.trim() || !editUserForm.email.trim() || savingUser}>
              {savingUser ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Provider Dialog */}
      <Dialog open={editProviderDialogOpen} onOpenChange={setEditProviderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Provider</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-provider-username">Username</Label>
              <Input
                id="edit-provider-username"
                value={editProviderForm.username}
                onChange={(e) => setEditProviderForm({ ...editProviderForm, username: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-provider-company">Company Name</Label>
              <Input
                id="edit-provider-company"
                value={editProviderForm.company_name}
                onChange={(e) => setEditProviderForm({ ...editProviderForm, company_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-provider-first-name">First Name</Label>
                <Input
                  id="edit-provider-first-name"
                  value={editProviderForm.first_name}
                  onChange={(e) => setEditProviderForm({ ...editProviderForm, first_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-provider-last-name">Last Name</Label>
                <Input
                  id="edit-provider-last-name"
                  value={editProviderForm.last_name}
                  onChange={(e) => setEditProviderForm({ ...editProviderForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-provider-email">Email</Label>
              <Input
                id="edit-provider-email"
                type="email"
                value={editProviderForm.email}
                onChange={(e) => setEditProviderForm({ ...editProviderForm, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-provider-phone">Phone</Label>
              <Input
                id="edit-provider-phone"
                value={editProviderForm.phone}
                onChange={(e) => setEditProviderForm({ ...editProviderForm, phone: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-provider-active"
                checked={editProviderForm.is_active}
                onChange={(e) => setEditProviderForm({ ...editProviderForm, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-provider-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProviderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProvider} disabled={!editProviderForm.username.trim() || !editProviderForm.email.trim() || savingProvider}>
              {savingProvider ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

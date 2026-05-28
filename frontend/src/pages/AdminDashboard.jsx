import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Building2, BarChart3, Activity, Bell, Search, Menu, Settings, UserCheck, UserX, Eye, Edit, Trash2, MapPin, LogOut, ImagePlus, Plus, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { adminService, authService, destinationService } from '../services/api';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { useAppDataSync, notifyAppDataChanged } from '@/lib/dataSync';

const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];

const EMPTY_DEST_FORM = {
  id: null, name: '', province: '', description: '',
  highlights: '', best_time_to_visit: '', latitude: '', longitude: '', image: '', is_active: true,
};

// ── Reusable styled confirm dialog ────────────────────────────────────────────
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) => (
  <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {danger && <AlertTriangle className="h-5 w-5 text-red-500" />}
          {title}
        </DialogTitle>
      </DialogHeader>
      <p className="text-sm text-gray-600 py-2">{message}</p>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={onConfirm}
          className={danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const AdminDashboard = ({ onNavigate }) => {
  const [dashboardStats, setDashboardStats] = useState({ total_users: 0, total_providers: 0, total_guides: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  const showConfirm = (title, message, onConfirm) =>
    setConfirmDialog({ open: true, title, message, onConfirm });
  const closeConfirm = () =>
    setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });

  // User management
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState({ id: null, username: '', first_name: '', last_name: '', email: '', phone: '', is_active: true });
  const [savingUser, setSavingUser] = useState(false);

  // Provider management
  const [editProviderDialogOpen, setEditProviderDialogOpen] = useState(false);
  const [editProviderForm, setEditProviderForm] = useState({ id: null, username: '', first_name: '', last_name: '', email: '', phone: '', company_name: '', is_active: true });
  const [savingProvider, setSavingProvider] = useState(false);

  // Destination management
  const [destDialogOpen, setDestDialogOpen] = useState(false);
  const [destForm, setDestForm] = useState(EMPTY_DEST_FORM);
  const [imageUploading, setImageUploading] = useState(false);
  const [savingDest, setSavingDest] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = { current: 0 };

  // Admin profile
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState(
    () => parseInt(localStorage.getItem('admin_notif_seen_at') || '0', 10)
  );
  const notifRef = useRef(null);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: '', first_name: '', last_name: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Close notification dropdown when clicking outside
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
    localStorage.setItem('admin_notif_seen_at', String(now));
    setLastSeenAt(now);
    setShowNotifications(o => !o);
  };

  const notifications = recentActivity.map(a => ({
    ...a,
    unread: a.timestamp > lastSeenAt,
  }));
  const unreadCount = notifications.filter(n => n.unread).length;

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const profileResponse = await authService.getProfile();
      if (profileResponse.data) {
        setAdminProfile(profileResponse.data);
        setProfileForm({
          username: profileResponse.data.username || '',
          first_name: profileResponse.data.first_name || '',
          last_name: profileResponse.data.last_name || '',
          email: profileResponse.data.email || '',
          phone: profileResponse.data.phone || '',
        });
        localStorage.setItem('user', JSON.stringify(profileResponse.data));
      }

      const [statsRes, usersRes, providersRes, destsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getAllUsers(),
        adminService.getAllProviders(),
        destinationService.getAll(),
      ]);

      if (statsRes.data) {
        setDashboardStats({
          total_users: statsRes.data.total_users || 0,
          total_providers: statsRes.data.total_providers || 0,
          total_guides: statsRes.data.total_guides || 0,
        });
      }
      if (usersRes.data) setUsers(usersRes.data);
      if (providersRes.data) setProviders(providersRes.data);
      if (destsRes.data) setDestinations(destsRes.data);

      const activities = [];
      (usersRes.data || []).slice(0, 5).forEach(u => activities.push({
        id: `user-${u.id}`, user: u.username, action: 'Registered as User',
        time: new Date(u.date_joined).toLocaleString(), type: 'user',
        timestamp: new Date(u.date_joined).getTime(),
      }));
      (providersRes.data || []).slice(0, 5).forEach(p => activities.push({
        id: `provider-${p.id}`, user: p.company_name || p.username, action: 'Registered as Provider',
        time: new Date(p.date_joined).toLocaleString(), type: 'provider',
        timestamp: new Date(p.date_joined).getTime(),
      }));
      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivity(activities.slice(0, 10));
    } catch {
      toast.error('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
  useAppDataSync(fetchDashboardData);

  // ── User handlers ──────────────────────────────────────────────────────────
  const handleUserAction = async (action, user) => {
    if (action === 'view') { setSelectedUser(user); setUserDialogOpen(true); return; }
    if (action === 'edit') {
      setEditUserForm({ id: user.id, username: user.username || '', first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '', phone: user.phone || '', is_active: user.is_active ?? true });
      setEditUserDialogOpen(true);
      return;
    }
    if (action === 'delete') {
      showConfirm('Delete User', `Are you sure you want to remove "${user.username}"? This action cannot be undone.`, async () => {
        closeConfirm();
        try {
          await adminService.deleteUser(user.id);
          setUsers(u => u.filter(x => x.id !== user.id));
          toast.success('User removed successfully.');
          notifyAppDataChanged();
        } catch {
          toast.error('Could not remove this user. Please try again.');
        }
      });
      return;
    }
    if (action === 'toggle-active') {
      try {
        await adminService.updateUser(user.id, { is_active: !user.is_active });
        setUsers(u => u.map(x => x.id === user.id ? { ...x, is_active: !x.is_active } : x));
        toast.success(user.is_active ? 'User deactivated.' : 'User activated.');
        notifyAppDataChanged();
      } catch {
        toast.error('Could not update user status. Please try again.');
      }
    }
  };

  const handleSaveUser = async () => {
    if (!editUserForm.username.trim()) return toast.error('Username is required.');
    if (!editUserForm.email.trim()) return toast.error('Email address is required.');
    try {
      setSavingUser(true);
      await adminService.updateUser(editUserForm.id, {
        username: editUserForm.username.trim(), first_name: editUserForm.first_name.trim(),
        last_name: editUserForm.last_name.trim(), email: editUserForm.email.trim(),
        phone: editUserForm.phone.trim(), is_active: editUserForm.is_active,
      });
      setUsers(u => u.map(x => x.id === editUserForm.id ? { ...x, ...editUserForm } : x));
      setEditUserDialogOpen(false);
      toast.success('User updated successfully.');
      notifyAppDataChanged();
    } catch {
      toast.error('Could not save changes. Please try again.');
    } finally { setSavingUser(false); }
  };

  // ── Provider handlers ──────────────────────────────────────────────────────
  const handleProviderAction = async (action, provider) => {
    if (action === 'view') { setSelectedUser(provider); setUserDialogOpen(true); return; }
    if (action === 'edit') {
      setEditProviderForm({ id: provider.id, username: provider.username || '', first_name: provider.first_name || '', last_name: provider.last_name || '', email: provider.email || '', phone: provider.phone || '', company_name: provider.company_name || '', is_active: provider.is_active ?? true });
      setEditProviderDialogOpen(true);
      return;
    }
    if (action === 'delete') {
      showConfirm('Remove Provider', `Are you sure you want to remove "${provider.company_name || provider.username}"? This action cannot be undone.`, async () => {
        closeConfirm();
        try {
          await adminService.deleteProvider(provider.id);
          setProviders(p => p.filter(x => x.id !== provider.id));
          toast.success('Provider removed successfully.');
          notifyAppDataChanged();
        } catch {
          toast.error('Could not remove this provider. Please try again.');
        }
      });
      return;
    }
    if (action === 'toggle-active') {
      try {
        await adminService.updateProvider(provider.id, { is_active: !provider.is_active });
        setProviders(p => p.map(x => x.id === provider.id ? { ...x, is_active: !x.is_active } : x));
        toast.success(provider.is_active ? 'Provider deactivated.' : 'Provider activated.');
        notifyAppDataChanged();
      } catch {
        toast.error('Could not update provider status. Please try again.');
      }
    }
  };

  const handleSaveProvider = async () => {
    if (!editProviderForm.username.trim()) return toast.error('Username is required.');
    if (!editProviderForm.email.trim()) return toast.error('Email address is required.');
    try {
      setSavingProvider(true);
      await adminService.updateProvider(editProviderForm.id, {
        username: editProviderForm.username.trim(), first_name: editProviderForm.first_name.trim(),
        last_name: editProviderForm.last_name.trim(), email: editProviderForm.email.trim(),
        phone: editProviderForm.phone.trim(), company_name: editProviderForm.company_name.trim(),
        is_active: editProviderForm.is_active,
      });
      setProviders(p => p.map(x => x.id === editProviderForm.id ? { ...x, ...editProviderForm } : x));
      setEditProviderDialogOpen(false);
      toast.success('Provider updated successfully.');
      notifyAppDataChanged();
    } catch {
      toast.error('Could not save changes. Please try again.');
    } finally { setSavingProvider(false); }
  };

  // ── Destination handlers ───────────────────────────────────────────────────
  const openAddDest = () => { setDestForm(EMPTY_DEST_FORM); setDestDialogOpen(true); };

  const openEditDest = (dest) => {
    setDestForm({
      id: dest.id, name: dest.name || '', province: dest.province || '',
      description: dest.description || '',
      highlights: (dest.highlights || []).join(', '),
      best_time_to_visit: dest.best_time_to_visit || '',
      latitude: dest.latitude || '', longitude: dest.longitude || '',
      image: dest.image_url || dest.image || '', is_active: dest.is_active ?? true,
    });
    setDestDialogOpen(true);
  };

  const uploadFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WebP, etc.).');
      return;
    }
    try {
      setImageUploading(true);
      const url = await uploadImageToCloudinary(file, 'nepal-tourism/destinations');
      setDestForm(f => ({ ...f, image: url }));
      toast.success('Image uploaded successfully.');
    } catch {
      toast.error('Image upload failed. Please try a different file.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageUpload = (e) => uploadFile(e.target.files?.[0]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragOver(false);
  };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleSaveDest = async () => {
    if (!destForm.name.trim()) return toast.error('Destination name is required.');
    if (!destForm.province) return toast.error('Please select a province.');
    if (!destForm.description.trim()) return toast.error('Description is required.');
    const payload = {
      name: destForm.name.trim(), province: destForm.province,
      description: destForm.description.trim(),
      highlights: destForm.highlights.split(',').map(h => h.trim()).filter(Boolean),
      best_time_to_visit: destForm.best_time_to_visit.trim(),
      latitude: destForm.latitude || null, longitude: destForm.longitude || null,
      image: destForm.image || '', is_active: destForm.is_active,
    };
    try {
      setSavingDest(true);
      if (destForm.id) {
        const res = await destinationService.update(destForm.id, payload);
        setDestinations(d => d.map(x => x.id === destForm.id ? res.data : x));
        toast.success('Destination updated successfully.');
      } else {
        const res = await destinationService.create(payload);
        setDestinations(d => [res.data, ...d]);
        toast.success('Destination added successfully.');
      }
      setDestDialogOpen(false);
      notifyAppDataChanged();
    } catch {
      toast.error('Could not save the destination. Please check your inputs and try again.');
    } finally { setSavingDest(false); }
  };

  const handleDeleteDest = (dest) => {
    showConfirm('Delete Destination', `Are you sure you want to delete "${dest.name}"? It will no longer appear on the website.`, async () => {
      closeConfirm();
      try {
        await destinationService.delete(dest.id);
        setDestinations(d => d.filter(x => x.id !== dest.id));
        toast.success('Destination deleted.');
        notifyAppDataChanged();
      } catch {
        toast.error('Could not delete this destination. Please try again.');
      }
    });
  };

  // ── Admin profile ──────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await authService.logout(); onNavigate?.('home'); } catch { /* ignore */ }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.username.trim()) return toast.error('Username is required.');
    if (!profileForm.email.trim()) return toast.error('Email address is required.');
    try {
      setSavingProfile(true);
      const res = await authService.updateProfile({
        username: profileForm.username.trim(), first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(), email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
      });
      setAdminProfile(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setProfileDialogOpen(false);
      toast.success('Profile updated successfully.');
      notifyAppDataChanged();
    } catch {
      toast.error('Could not update your profile. Please try again.');
    } finally { setSavingProfile(false); }
  };

  // ── Filters ────────────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredProviders = providers.filter(p =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDests = destinations.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.province || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { title: 'Total Users', value: dashboardStats.total_users.toLocaleString(), desc: 'Registered Accounts', icon: Users, bgColor: 'bg-blue-50', iconColor: 'text-blue-600', borderColor: 'border-blue-200' },
    { title: 'Service Providers', value: dashboardStats.total_providers.toLocaleString(), desc: 'Active Providers', icon: Building2, bgColor: 'bg-green-50', iconColor: 'text-green-600', borderColor: 'border-green-200' },
    { title: 'Tour Guides', value: dashboardStats.total_guides.toLocaleString(), desc: 'Registered Guides', icon: MapPin, bgColor: 'bg-teal-50', iconColor: 'text-teal-600', borderColor: 'border-teal-200' },
    { title: 'Destinations', value: destinations.length.toLocaleString(), desc: 'Active Places', icon: MapPin, bgColor: 'bg-purple-50', iconColor: 'text-purple-600', borderColor: 'border-purple-200' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <img src="/assets/nepal-tourism-mark.svg" alt="Nepal Tourism" className="h-9 w-9 rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Nepal Tourism Management</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64" />
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
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${n.unread ? 'bg-blue-50' : ''}`}>
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'user' ? 'bg-blue-500' : 'bg-green-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{n.user}</p>
                            <p className="text-xs text-gray-500">{n.action}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                          </div>
                          {n.unread && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <Avatar className="h-8 w-8 cursor-pointer" onClick={() => setShowProfileDropdown(o => !o)}>
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  {(adminProfile?.first_name || adminProfile?.username || 'A').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{adminProfile?.first_name || adminProfile?.username || 'Admin'}</p>
                    <p className="text-xs text-gray-500">{adminProfile?.email}</p>
                  </div>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => { setProfileDialogOpen(true); setShowProfileDropdown(false); }}>
                    <Settings className="h-4 w-4 mr-2" /> Manage Profile
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-red-600" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" /> Logout
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
            {[
              { key: 'overview', icon: Activity, label: 'Dashboard Overview' },
              { key: 'users', icon: Users, label: `Manage Users (${filteredUsers.length})` },
              { key: 'providers', icon: Building2, label: `Manage Providers (${filteredProviders.length})` },
              { key: 'destinations', icon: MapPin, label: `Manage Destinations (${filteredDests.length})` },
              { key: 'reports', icon: BarChart3, label: 'Reports' },
            ].map(({ key, icon: Icon, label }) => (
              <Button key={key} variant="ghost" className={`w-full justify-start ${activeTab === key ? 'text-blue-600 bg-blue-50' : ''}`} onClick={() => setActiveTab(key)}>
                <Icon className="h-4 w-4 mr-3" /> {label}
              </Button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">

            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Welcome back, Admin</h2>
                  <p className="text-gray-500">Platform overview</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, i) => (
                    <Card key={i} className={`${stat.bgColor} ${stat.borderColor} border-2`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            <p className="text-sm text-gray-500 mt-2">{stat.desc}</p>
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
                    <CardTitle className="flex items-center"><Activity className="h-5 w-5 mr-2" /> Recent Registrations</CardTitle>
                    <CardDescription>Latest users and providers who joined</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((a) => (
                        <div key={a.id} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${a.type === 'user' ? 'bg-blue-500' : 'bg-green-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{a.user}</p>
                            <p className="text-sm text-gray-500">{a.action}</p>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{a.time}</span>
                        </div>
                      ))}
                      {recentActivity.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No recent activity.</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Users */}
            {activeTab === 'users' && (
              <Card>
                <CardHeader><CardTitle>Manage Users</CardTitle><CardDescription>View and manage all registered users</CardDescription></CardHeader>
                <CardContent>
                  {loading ? <div className="text-center py-8 text-gray-500">Loading users...</div> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead><TableHead>Username</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map(user => (
                          <TableRow key={user.id}>
                            <TableCell className="text-gray-500">{user.id}</TableCell>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{user.is_active ? 'Active' : 'Inactive'}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleUserAction('view', user)} title="View details"><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => handleUserAction('edit', user)} title="Edit"><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => handleUserAction('toggle-active', user)} className={user.is_active ? 'text-orange-500 hover:text-orange-700' : 'text-green-600 hover:text-green-800'} title={user.is_active ? 'Deactivate' : 'Activate'}>
                                  {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleUserAction('delete', user)} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                          <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No users found.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Providers */}
            {activeTab === 'providers' && (
              <Card>
                <CardHeader><CardTitle>Manage Service Providers</CardTitle><CardDescription>View and manage all travel service providers</CardDescription></CardHeader>
                <CardContent>
                  {loading ? <div className="text-center py-8 text-gray-500">Loading providers...</div> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead><TableHead>Name / Company</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProviders.map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="text-gray-500">{p.id}</TableCell>
                            <TableCell className="font-medium">{p.company_name || p.username}</TableCell>
                            <TableCell>{p.email}</TableCell>
                            <TableCell>{p.phone || '—'}</TableCell>
                            <TableCell>
                              <Badge className={p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleProviderAction('view', p)} title="View"><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => handleProviderAction('edit', p)} title="Edit"><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => handleProviderAction('toggle-active', p)} className={p.is_active ? 'text-orange-500 hover:text-orange-700' : 'text-green-600 hover:text-green-800'}>
                                  {p.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleProviderAction('delete', p)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredProviders.length === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No providers found.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Destinations */}
            {activeTab === 'destinations' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Manage Destinations</CardTitle>
                      <CardDescription>Add, edit, or remove places shown on the website</CardDescription>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={openAddDest}>
                      <Plus className="h-4 w-4 mr-2" /> Add Destination
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? <div className="text-center py-8 text-gray-500">Loading destinations...</div> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead><TableHead>Name</TableHead><TableHead>Province</TableHead><TableHead>Best Time</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDests.map(dest => (
                          <TableRow key={dest.id}>
                            <TableCell>
                              {dest.image_url || dest.image ? (
                                <img src={dest.image_url || dest.image} alt={dest.name} className="w-16 h-10 object-cover rounded-md" />
                              ) : (
                                <div className="w-16 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                                  <ImagePlus className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{dest.name}</TableCell>
                            <TableCell>{dest.province}</TableCell>
                            <TableCell className="text-gray-600">{dest.best_time_to_visit || '—'}</TableCell>
                            <TableCell>
                              <Badge className={dest.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{dest.is_active ? 'Active' : 'Inactive'}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openEditDest(dest)} title="Edit"><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteDest(dest)} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredDests.length === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No destinations yet. Click "Add Destination" to create one.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reports */}
            {activeTab === 'reports' && (
              <Card>
                <CardHeader><CardTitle>Account Summary</CardTitle><CardDescription>Breakdown of registered accounts by role</CardDescription></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Registered Users', value: dashboardStats.total_users, icon: Users, color: 'text-blue-500' },
                      { label: 'Service Providers', value: dashboardStats.total_providers, icon: Building2, color: 'text-green-500' },
                      { label: 'Tour Guides', value: dashboardStats.total_guides, icon: MapPin, color: 'text-teal-500' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="p-6 border rounded-xl text-center bg-white">
                        <Icon className={`h-8 w-8 ${color} mx-auto mb-3`} />
                        <p className="text-3xl font-bold text-gray-900">{value}</p>
                        <p className="text-sm text-gray-500 mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* ── Add / Edit Destination Dialog ── */}
      <Dialog open={destDialogOpen} onOpenChange={setDestDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{destForm.id ? 'Edit Destination' : 'Add New Destination'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-2">

            {/* Image upload */}
            <div className="grid gap-2">
              <Label>Destination Image</Label>

              {/* Drag-and-drop zone */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed transition-colors ${
                  isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
                } ${imageUploading ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {destForm.image ? (
                  /* Preview */
                  <div className="relative">
                    <img src={destForm.image} alt="preview" className="w-full h-48 object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                      <Label htmlFor="dest-image-upload" className="cursor-pointer flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white text-gray-800 rounded-md hover:bg-gray-100 transition-colors">
                        <ImagePlus className="h-3.5 w-3.5" /> Replace
                      </Label>
                      <button onClick={() => setDestForm(f => ({ ...f, image: '' }))} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                        <X className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Drop zone */
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    {imageUploading ? (
                      <>
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mb-3" />
                        <p className="text-sm text-blue-600 font-medium">Uploading image…</p>
                      </>
                    ) : (
                      <>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <ImagePlus className={`h-6 w-6 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {isDragOver ? 'Drop image here' : 'Drag & drop an image here'}
                        </p>
                        <p className="text-xs text-gray-400 mb-3">or</p>
                        <Label htmlFor="dest-image-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                          <ImagePlus className="h-4 w-4" /> Browse files
                        </Label>
                        <p className="text-xs text-gray-400 mt-2">JPG, PNG, WebP supported</p>
                      </>
                    )}
                  </div>
                )}
                <input id="dest-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              {/* URL fallback */}
              <div className="grid gap-1 mt-1">
                <span className="text-xs text-gray-400">Or paste an image URL directly</span>
                <Input placeholder="https://…" value={destForm.image} onChange={(e) => setDestForm(f => ({ ...f, image: e.target.value }))} className="text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dest-name">Name <span className="text-red-500">*</span></Label>
                <Input id="dest-name" placeholder="e.g. Pokhara" value={destForm.name} onChange={(e) => setDestForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dest-province">Province <span className="text-red-500">*</span></Label>
                <select id="dest-province" value={destForm.province} onChange={(e) => setDestForm(f => ({ ...f, province: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Select province</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dest-description">Description <span className="text-red-500">*</span></Label>
              <textarea id="dest-description" rows={3} placeholder="Describe this destination…" value={destForm.description} onChange={(e) => setDestForm(f => ({ ...f, description: e.target.value }))} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dest-highlights">Highlights <span className="text-gray-400 font-normal text-xs">(comma-separated)</span></Label>
              <Input id="dest-highlights" placeholder="e.g. Fewa Lake, Paragliding, Annapurna views" value={destForm.highlights} onChange={(e) => setDestForm(f => ({ ...f, highlights: e.target.value }))} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dest-best-time">Best Time to Visit</Label>
              <Input id="dest-best-time" placeholder="e.g. October to December, March to May" value={destForm.best_time_to_visit} onChange={(e) => setDestForm(f => ({ ...f, best_time_to_visit: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dest-lat">Latitude <span className="text-gray-400 font-normal text-xs">(optional)</span></Label>
                <Input id="dest-lat" type="number" step="any" placeholder="e.g. 28.2096" value={destForm.latitude} onChange={(e) => setDestForm(f => ({ ...f, latitude: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dest-lng">Longitude <span className="text-gray-400 font-normal text-xs">(optional)</span></Label>
                <Input id="dest-lng" type="number" step="any" placeholder="e.g. 83.9856" value={destForm.longitude} onChange={(e) => setDestForm(f => ({ ...f, longitude: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="dest-active" checked={destForm.is_active} onChange={(e) => setDestForm(f => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 rounded" />
              <Label htmlFor="dest-active" className="cursor-pointer">Show on website (active)</Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDestDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDest} disabled={savingDest || imageUploading} className="bg-blue-600 hover:bg-blue-700 min-w-[120px]">
              {savingDest ? 'Saving…' : destForm.id ? 'Save Changes' : 'Add Destination'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Details Dialog ── */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Account Details</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="grid grid-cols-2 gap-4 py-2">
              {[['Username', selectedUser.username], ['Email', selectedUser.email], ['Phone', selectedUser.phone || '—'], ['Role', selectedUser.role]].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm font-semibold text-gray-900">{val}</p>
                </div>
              ))}
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Status</p>
                <Badge className={selectedUser.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{selectedUser.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setUserDialogOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit User Dialog ── */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Username</Label><Input value={editUserForm.username} onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>First Name</Label><Input value={editUserForm.first_name} onChange={(e) => setEditUserForm({ ...editUserForm, first_name: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Last Name</Label><Input value={editUserForm.last_name} onChange={(e) => setEditUserForm({ ...editUserForm, last_name: e.target.value })} /></div>
            </div>
            <div className="grid gap-2"><Label>Email</Label><Input type="email" value={editUserForm.email} onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Phone</Label><Input value={editUserForm.phone} onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="edit-user-active" checked={editUserForm.is_active} onChange={(e) => setEditUserForm({ ...editUserForm, is_active: e.target.checked })} className="h-4 w-4 rounded" />
              <Label htmlFor="edit-user-active" className="cursor-pointer">Active</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUser} disabled={savingUser}>{savingUser ? 'Saving…' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Provider Dialog ── */}
      <Dialog open={editProviderDialogOpen} onOpenChange={setEditProviderDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Provider</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Username</Label><Input value={editProviderForm.username} onChange={(e) => setEditProviderForm({ ...editProviderForm, username: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Company Name</Label><Input value={editProviderForm.company_name} onChange={(e) => setEditProviderForm({ ...editProviderForm, company_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>First Name</Label><Input value={editProviderForm.first_name} onChange={(e) => setEditProviderForm({ ...editProviderForm, first_name: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Last Name</Label><Input value={editProviderForm.last_name} onChange={(e) => setEditProviderForm({ ...editProviderForm, last_name: e.target.value })} /></div>
            </div>
            <div className="grid gap-2"><Label>Email</Label><Input type="email" value={editProviderForm.email} onChange={(e) => setEditProviderForm({ ...editProviderForm, email: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Phone</Label><Input value={editProviderForm.phone} onChange={(e) => setEditProviderForm({ ...editProviderForm, phone: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="edit-provider-active" checked={editProviderForm.is_active} onChange={(e) => setEditProviderForm({ ...editProviderForm, is_active: e.target.checked })} className="h-4 w-4 rounded" />
              <Label htmlFor="edit-provider-active" className="cursor-pointer">Active</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditProviderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProvider} disabled={savingProvider}>{savingProvider ? 'Saving…' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Admin Profile Dialog ── */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Admin Profile</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Username</Label><Input value={profileForm.username} onChange={(e) => setProfileForm(c => ({ ...c, username: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>First Name</Label><Input value={profileForm.first_name} onChange={(e) => setProfileForm(c => ({ ...c, first_name: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Last Name</Label><Input value={profileForm.last_name} onChange={(e) => setProfileForm(c => ({ ...c, last_name: e.target.value }))} /></div>
            </div>
            <div className="grid gap-2"><Label>Email</Label><Input type="email" value={profileForm.email} onChange={(e) => setProfileForm(c => ({ ...c, email: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Phone</Label><Input value={profileForm.phone} onChange={(e) => setProfileForm(c => ({ ...c, phone: e.target.value }))} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminDashboard;

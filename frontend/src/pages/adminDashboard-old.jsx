import { useState, useEffect } from 'react';
import { Shield, Users, Building2, Package, BarChart3, TrendingUp, Calendar, DollarSign, Activity, ChevronRight, Bell, Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { adminService } from '../services/api';

const AdminDashboard = ({ onNavigate }) => {
  const [dashboardStats, setDashboardStats] = useState({
    total_users: 0,
    total_providers: 0,
    total_bookings: 0,
    revenue: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminService.getStats();
        setDashboardStats(response.data);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      }
    };
    fetchStats();
  }, []);

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
      value: `Rs. ${dashboardStats.revenue.toLocaleString()}`, 
      change: "+18%", 
      changeType: "increase",
      desc: "Confirmed Bookings", 
      icon: DollarSign, 
      color: "amber",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200"
    },
  ];

  const quickActions = [
    { title: "Manage Users", desc: "View and manage all users", icon: Users, color: "blue" },
    { title: "Manage Providers", desc: "Approve & manage providers", icon: Building2, color: "green" },
    { title: "Tour Management", desc: "Manage all tour packages", icon: Package, color: "purple" },
    { title: "System Reports", desc: "Analytics and reports", icon: BarChart3, color: "amber" },
  ];

  const recentActivity = [
    { id: 1, user: "John Doe", action: "Registered", time: "2 hours ago", type: "user" },
    { id: 2, user: "Travel Nepal Pvt Ltd", action: "New Provider Application", time: "4 hours ago", type: "provider" },
    { id: 3, user: "Jane Smith", action: "Booked Everest Tour", time: "6 hours ago", type: "booking" },
    { id: 4, user: "Mountain Guides", action: "Updated Package", time: "8 hours ago", type: "provider" },
  ];

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
                placeholder="Search..."
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
          <p className="text-gray-500">View real-time reports, manage users, and keep the platform running smoothly.</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Manage Users</TabsTrigger>
            <TabsTrigger value="providers">Manage Providers</TabsTrigger>
            <TabsTrigger value="reports">System Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {stats.map((item, i) => (
                <Card key={i} className="border border-gray-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    <item.icon className={`h-4 w-4 text-gray-500`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{item.value}</div>
                    <p className="text-xs text-green-600 mt-1">{item.change}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Actions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {actions.map((item, i) => (
                <Card key={i} className="border border-gray-200 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${item.color}-100`}>
                        <item.icon className={`h-5 w-5 text-${item.color}-600`} />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{item.title}</CardTitle>
                        <CardDescription className="text-xs">{item.desc}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">Open Panel</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle>Manage Users</CardTitle>
                 <CardDescription>View, edit, or remove registered users traversing the platform.</CardDescription>
               </CardHeader>
               <CardContent>
                 <p className="text-sm text-gray-500">User management tools are coming soon.</p>
               </CardContent>
             </Card>
          </TabsContent>
          
          <TabsContent value="providers" className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle>Manage Providers</CardTitle>
                 <CardDescription>Approve, edit, or reject travel service provider applications.</CardDescription>
               </CardHeader>
               <CardContent>
                 <p className="text-sm text-gray-500">Provider management tools are coming soon.</p>
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle>System Reports</CardTitle>
                 <CardDescription>Detailed site-wide analytics and booking reports.</CardDescription>
               </CardHeader>
               <CardContent>
                 <p className="text-sm text-gray-500">Reporting tools are coming soon.</p>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
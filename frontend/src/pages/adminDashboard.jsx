import { useState, useEffect } from 'react';
import { Shield, Users, Building2, Package, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminService } from '../services/api';

const AdminDashboard = ({ onNavigate }) => {
  const [dashboardStats, setDashboardStats] = useState({
    total_users: 0,
    total_providers: 0,
    total_bookings: 0,
    revenue: 0,
  });

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
    { title: "Total Users", value: dashboardStats.total_users, change: "Registered Accounts", icon: Users, color: "blue" },
    { title: "Service Providers", value: dashboardStats.total_providers, change: "Active Providers", icon: Building2, color: "green" },
    { title: "Total Bookings", value: dashboardStats.total_bookings, change: "All Time", icon: Package, color: "purple" },
    { title: "Revenue", value: `Rs. ${dashboardStats.revenue}`, change: "Confirmed Bookings", icon: BarChart3, color: "amber" },
  ];

  const actions = [
    { title: "Manage Users", desc: "View and manage all users", icon: Users, color: "blue" },
    { title: "Manage Providers", desc: "Approve & manage providers", icon: Building2, color: "green" },
    { title: "Tour Management", desc: "Manage all tour packages", icon: Package, color: "purple" },
    { title: "System Reports", desc: "Analytics and reports", icon: BarChart3, color: "amber" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
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
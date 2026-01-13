import { Shield, Users, Building2, Package, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const AdminDashboard = ({ onNavigate }) => {
  const stats = [
    { title: "Total Users", value: "1,248", change: "+12% this month", icon: Users, color: "blue" },
    { title: "Service Providers", value: "87", change: "+5 new", icon: Building2, color: "green" },
    { title: "Total Bookings", value: "3,492", change: "+18% this month", icon: Package, color: "purple" },
    { title: "Revenue", value: "$45.2k", change: "+22% this month", icon: BarChart3, color: "amber" },
  ];

  const actions = [
    { title: "Manage Users", desc: "View and manage all users", icon: Users, color: "blue" },
    { title: "Manage Providers", desc: "Approve & manage providers", icon: Building2, color: "green" },
    { title: "Tour Management", desc: "Manage all tour packages", icon: Package, color: "purple" },
    { title: "System Reports", desc: "Analytics and reports", icon: BarChart3, color: "amber" },
  ];

  return (
    <div
      className="relative min-h-screen flex flex-col bg-fixed bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://www.pixelstalk.net/wp-content/uploads/2016/06/Download-HD-Nature-Backgrounds.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/20 z-0"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-md shadow-md">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-purple-600" />
            <span className="text-xl font-bold">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-6">
            <Button variant="ghost" onClick={() => onNavigate("dashboard")}>Dashboard</Button>
            <Button variant="ghost" onClick={() => onNavigate("users")}>Users</Button>
            <Button variant="ghost" onClick={() => onNavigate("providers")}>Providers</Button>
            <Button variant="ghost" onClick={() => onNavigate("reports")}>Reports</Button>
            <Avatar>
              <AvatarFallback className="bg-purple-600 text-white">A</AvatarFallback>
            </Avatar>
          </div>
        </nav>

        <section className="flex-1 flex items-center justify-center">
          <div className="text-center text-white bg-black/20 backdrop-blur-md rounded-xl p-4 md:p-6 max-w-md">
            <h1 className="text-2xl md:text-3xl font-bold">Welcome, Admin!</h1>
            <p className="mt-1 text-sm md:text-md">
              Manage users, providers, and explore analytics to grow your platform.
            </p>
          </div>
        </section>

        <div className="mt-6 px-60 py-16">
          <section className="max-w-7xl mx-auto grid md:grid-cols-4 gap-4 mb-10">
            {stats.map((item, i) => (
              <Card
                key={i}
                className="border-0 shadow-lg bg-white/80 hover:shadow-2xl hover:scale-105 transition-transform transition-shadow duration-300"
              >
                <CardHeader className="flex justify-between items-center pb-2">
                  <CardTitle className="text-gray-700 font-medium text-sm">{item.title}</CardTitle>
                  <item.icon className={`h-5 w-5 text-${item.color}-600`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                  <p className="text-xs text-green-600 mt-1">{item.change}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((item, i) => (
              <Card
                key={i}
                className="border-0 shadow-lg hover:shadow-2xl hover:scale-105 transition-transform transition-shadow duration-300 bg-white/80"
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${item.color}-100`}
                    >
                      <item.icon className={`h-5 w-5 text-${item.color}-600`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{item.title}</CardTitle>
                      <CardDescription className="text-xs">{item.desc}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className={`w-full text-white bg-${item.color}-600 hover:bg-${item.color}-700 text-sm`}>
                    Go
                  </Button>
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
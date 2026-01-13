import { useState } from 'react';
import { Mountain, Compass, Package, Heart, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const ProviderDashboard = ({ onNavigate }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const bookings = [
    { title: "Kathmandu Temples Tour", status: "Completed" },
    { title: "Pokhara Adventure", status: "Upcoming" },
  ];

  const services = [
    { title: "City Tours", desc: "Offer guided city tours", icon: Compass },
    { title: "Adventure Packages", desc: "Plan adventure trips", icon: Package },
    { title: "Wishlist Tracking", desc: "See user interest", icon: Heart },
    { title: "Profile Settings", desc: "Update your info", icon: Settings },
  ];

  return (
    <div
      className="relative min-h-screen flex flex-col"
      style={{
        backgroundImage:
          "url('https://www.pixelstalk.net/wp-content/uploads/2016/06/Download-HD-Nature-Backgrounds.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/20"></div>

      <nav className="relative z-20 flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-2">
          <Mountain className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold">Nepal Travel • Provider</span>
        </div>

        <div className="relative">
          <Avatar
            className="cursor-pointer"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <AvatarFallback className="bg-blue-600 text-white">
              SP
            </AvatarFallback>
          </Avatar>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg p-4 shadow-lg">
              <h3 className="font-bold mb-2">Service Provider</h3>
              <Badge className="mb-3">Active</Badge>

              {bookings.map((b, i) => (
                <div key={i} className="text-sm flex justify-between mb-1">
                  <span>{b.title}</span>
                  <span className="text-gray-500">{b.status}</span>
                </div>
              ))}

              <Button
                variant="ghost"
                className="w-full mt-3"
                onClick={() => onNavigate("home")}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </nav>

      <div className="relative z-10 flex flex-col flex-1 px-6 pb-12">
        <div className="mt-16 mb-8 max-w-md mx-auto text-center">
          <div className="bg-black/35 text-white p-4 rounded-lg">
            <h1 className="text-lg font-semibold">Welcome back</h1>
            <p className="text-sm opacity-90">
              Manage your tours & bookings smoothly
            </p>
          </div>
        </div>

        <div className="mt-auto pt-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {services.map((item, i) => (
              <Card
                key={i}
                className="bg-white/85 hover:scale-105 transition shadow-md"
              >
                <CardHeader className="flex gap-3">
                  <item.icon className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {item.desc}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Go</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
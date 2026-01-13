import { useState } from 'react';
import { Mountain, Calendar, Heart, Star, Compass, Package, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const UserDashboard = ({ onNavigate }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const destinations = [
    { name: "Kathmandu", img: "https://media.greenvalleynepaltreks.com/uploads/fullbanner/pashupatinath-temple-kathmandu.webp" },
    { name: "Pokhara", img: "https://lp-cms-production.imgix.net/2019-06/53693064.jpg" },
    { name: "Chitwan", img: "https://wallpaperbat.com/img/33765-shafir-image-night-kathmandu.jpg" },
    { name: "Lumbini", img: "http://lumbinidevtrust.gov.np/upload_file/images/slider/1721894939_276597348_lumbini.jpg" },
  ];

  const bookings = [
    { title: "Pokhara Adventure", date: "2026-01-15", status: "Upcoming" },
    { title: "Kathmandu Temples Tour", date: "2025-12-20", status: "Completed" },
  ];

  const wishlist = [
    { title: "Chitwan Safari" },
    { title: "Lumbini Peace Tour" },
  ];

  return (
    <div
      className="relative min-h-screen w-full bg-fixed bg-cover bg-center"
      style={{
        backgroundImage: "url('https://www.pixelstalk.net/wp-content/uploads/2016/06/Download-HD-Nature-Backgrounds.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      <div className="relative z-10 min-h-screen">
        <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-md shadow-md">
          <div className="flex items-center gap-2">
            <Mountain className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-800">Nepal Travel</span>
          </div>

          <div className="relative">
            <Avatar
              className="cursor-pointer"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <AvatarFallback className="bg-blue-600 text-white">U</AvatarFallback>
            </Avatar>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 z-50">
                <h3 className="font-bold mb-2">Hello, Namuna!</h3>
                <Badge className="mb-2">Active User</Badge>

                <div className="mb-3">
                  <h4 className="font-medium text-sm mb-1">Booking History</h4>
                  {bookings.map((b, i) => (
                    <div key={i} className="text-sm flex justify-between mb-1">
                      <span>{b.title}</span>
                      <span className="text-gray-500">{b.status}</span>
                    </div>
                  ))}
                </div>

                <div className="mb-3">
                  <h4 className="font-medium text-sm mb-1">Wishlist</h4>
                  {wishlist.map((w, i) => (
                    <div key={i} className="text-sm mb-1">{w.title}</div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-center mt-2"
                  onClick={() => onNavigate("home")}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              </div>
            )}
          </div>
        </nav>

        <section className="relative h-72 flex items-center justify-center text-white">
          <div className="bg-black/50 p-6 rounded-lg text-center">
            <h1 className="text-3xl md:text-4xl font-bold">Welcome Back, Namuna!</h1>
            <p className="mt-2 text-lg">Explore the beauty of Nepal and plan your next adventure.</p>
          </div>
        </section>

        <section className="px-6 pt-56 pb-16">
          <h2 className="text-2xl font-bold mb-6 text-white">Explore Destinations</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest, i) => (
              <Card
                key={i}
                className="overflow-hidden relative cursor-pointer shadow-lg transform transition-all hover:scale-105"
              >
                <img
                  src={dest.img}
                  alt={dest.name}
                  className="h-48 w-full object-cover transition-transform duration-500"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="text-white text-lg font-semibold">{dest.name}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-3 gap-6 px-6 mb-10">
          {[
            { title: "Active Bookings", value: bookings.filter(b => b.status === "Upcoming").length, icon: Calendar },
            { title: "Saved Tours", value: wishlist.length, icon: Heart },
            { title: "Completed Tours", value: bookings.filter(b => b.status === "Completed").length, icon: Star },
          ].map((item, i) => (
            <Card key={i} className="border-2 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-shadow">
              <CardHeader className="flex justify-between items-center pb-3">
                <CardTitle className="text-gray-700 font-medium text-sm">{item.title}</CardTitle>
                <item.icon className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 mb-10">
          {[
            { title: "My Bookings", desc: "View & manage bookings", icon: Package },
            { title: "Browse Tours", desc: "Discover destinations", icon: Compass },
            { title: "Wishlist", desc: "Your saved tours", icon: Heart },
            { title: "Profile Settings", desc: "Update your info", icon: Settings },
          ].map((item, i) => (
            <Card key={i} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.desc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Go</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
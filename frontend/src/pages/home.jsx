import { useState } from 'react';
import { Mountain, MapPin, Calendar, Star, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Home = ({ onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="relative min-h-screen w-full bg-fixed bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://www.pixelstalk.net/wp-content/uploads/2016/06/Download-HD-Nature-Backgrounds.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/45 z-0"></div>

      <div className="relative z-10">
        <nav className="bg-white/85 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <Mountain className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Nepal Tourism
                </span>
              </div>

              <div className="hidden md:flex items-center gap-6">
                <Button variant="ghost">Home</Button>
                <Button variant="ghost">Destinations</Button>
                <Button variant="ghost">Tours</Button>
                <Button variant="ghost">About</Button>
                <Button
                  onClick={() => onNavigate("auth")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Login / Sign Up
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </Button>
            </div>
          </div>
        </nav>

        <section className="min-h-[600px] flex items-center justify-center text-center px-6">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-bold text-slate-100 mb-6">
              Discover the Beauty of{" "}
              <span className="text-cyan-300">Nepal</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-200 mb-8">
              Experience the majestic Himalayas, ancient temples, and vibrant culture.
            </p>

            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => onNavigate("auth")}
              >
                Get Started
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white/60 bg-white/90 text-gray-900 hover:bg-white hover:text-black"
              >
                Explore Tours
              </Button>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto py-20 px-6">
          <h2 className="text-4xl font-bold text-slate-100 text-center mb-12">
            Explore Cities
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Kathmandu",
                img: "https://media.greenvalleynepaltreks.com/uploads/fullbanner/pashupatinath-temple-kathmandu.webp",
              },
              {
                name: "Pokhara",
                img: "https://lp-cms-production.imgix.net/2019-06/53693064.jpg",
              },
              {
                name: "Chitwan",
                img: "https://wallpaperbat.com/img/33765-shafir-image-night-kathmandu.jpg",
              },
            ].map((city, i) => (
              <div
                key={i}
                className="h-64 rounded-xl overflow-hidden relative group shadow-xl"
              >
                <img
                  src={city.img}
                  alt={city.name}
                  className="h-full w-full object-cover group-hover:scale-110 transition duration-500"
                />
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                  <h3 className="text-3xl font-semibold text-slate-100">
                    {city.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto py-20 px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, title: "Top Destinations" },
              { icon: Calendar, title: "Easy Booking" },
              { icon: Star, title: "Best Experience" },
            ].map((item, i) => (
              <Card key={i} className="bg-white/90 backdrop-blur shadow-xl">
                <CardHeader className="text-center">
                  <item.icon className="mx-auto h-8 w-8 text-blue-600 mb-4" />
                  <CardTitle className="text-gray-900">
                    {item.title}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-6 bg-black/35 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto grid grid-cols-3 text-center text-slate-100">
            <div>
              <h3 className="text-2xl font-medium">50+</h3>
              <p className="text-xs opacity-80">Destinations</p>
            </div>
            <div>
              <h3 className="text-2xl font-medium">200+</h3>
              <p className="text-xs opacity-80">Tours</p>
            </div>
            <div>
              <h3 className="text-2xl font-medium">10k+</h3>
              <p className="text-xs opacity-80">Happy Travelers</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
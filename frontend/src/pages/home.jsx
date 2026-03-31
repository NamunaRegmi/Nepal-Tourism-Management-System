import { Mountain, MapPin, Calendar, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect, useRef } from 'react';
import { destinationService } from '@/services/api';
import DestinationShowcase from '@/components/DestinationShowcase';



const Home = ({ onNavigate, onSelectDestination }) => {
  const [destinations, setDestinations] = useState([]);
  const [allDestinations, setAllDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchType, setSearchType] = useState('');

  // Scroll refs for horizontal scrolling
  const propertyScrollRef = useRef(null);

  // Scroll functions
  const scrollLeft = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const destRes = await destinationService.getAll();
        const preferred = ['Kathmandu', 'Pokhara', 'Chitwan'];
        const sorted = destRes.data.slice().sort((a, b) => {
          const aIndex = preferred.findIndex((name) => a.name?.toLowerCase().includes(name.toLowerCase()));
          const bIndex = preferred.findIndex((name) => b.name?.toLowerCase().includes(name.toLowerCase()));
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        setAllDestinations(sorted);
        setDestinations(sorted);
      } catch (err) {
        console.error(err);
        // Add mock data as fallback
        const mockDestinations = [
          { id: 1, name: 'Kathmandu', description: 'Capital city with rich culture', location: 'Central Nepal' },
          { id: 2, name: 'Pokhara', description: 'Beautiful lakeside city', location: 'Western Nepal' },
          { id: 3, name: 'Chitwan', description: 'Wildlife paradise', location: 'Southern Nepal' },
          { id: 4, name: 'Lumbini', description: 'Birthplace of Buddha', location: 'Southern Nepal' },
          { id: 5, name: 'Everest', description: 'World\'s highest peak', location: 'Eastern Nepal' },
        ];
        setAllDestinations(mockDestinations);
        setDestinations(mockDestinations);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearchSubmit = () => {
    const query = searchLocation || searchDate || searchType;
    if (!query.trim()) {
      setDestinations(allDestinations);
      setShowSuggestions(false);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = allDestinations.filter(d => 
      d.name?.toLowerCase().includes(lowerQuery) || 
      d.description?.toLowerCase().includes(lowerQuery) ||
      d.location?.toLowerCase().includes(lowerQuery)
    );
    
    setShowSuggestions(false);
    
    if (filtered.length > 0) {
      setDestinations(filtered);
      if (onSelectDestination) {
        onSelectDestination(filtered[0].id);
      }
    } else {
      setDestinations([]);
      setTimeout(() => window.scrollBy({ top: 400, behavior: 'smooth' }), 50);
    }
  };

  const suggestions = searchQuery.trim() 
    ? allDestinations.filter(d => d.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  const navCards = [
    {
      title: 'Trips',
      subtitle: '200 trips showing',
    },
    {
      title: 'Where we go',
      subtitle: 'More trips, more choice',
    },
    {
      title: 'Tour guide',
      subtitle: 'Planning your next adventure',
    },
    {
      title: 'Collections',
      subtitle: 'Looking for your perfect trip?',
    },
  ];

  return (
    <div className="flex flex-col w-full bg-slate-50">
      <main className="relative">
        <div className="h-[60vh] relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-800 to-blue-900" />

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6">
            <h1 className="text-7xl font-bold mb-4 tracking-wide">Nepal</h1>
            <p className="text-xl mb-8 text-center max-w-2xl">
              Discover Your Next Adventure
            </p>
            
            <button onClick={() => onNavigate('destination-results')} className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-xl mb-16">
              Explore Now
            </button>

            {/* Search Bar Section */}
            <div className="absolute bottom-0 left-0 right-0 bg-transparent backdrop-blur-sm p-6">
              <div className="max-w-6xl mx-auto flex flex-wrap gap-4 items-center justify-center">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Where you want to go?"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <select 
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option>Travel type</option>
                    <option>Adventure</option>
                    <option>Cultural</option>
                    <option>Trekking</option>
                    <option>Wildlife</option>
                  </select>
                </div>
                <button onClick={() => handleSearchSubmit()} className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Smooth transition header for showcase */}
      <section className="max-w-7xl mx-auto px-6 pt-12">
        <h2 className="text-5xl font-semibold text-slate-900 text-left">Explore the places</h2>
        <p className="mt-3 max-w-2xl text-left text-lg text-slate-600">
          Discover curated journeys across Nepal with hotels, tours, and local experiences selected for every travel style.
        </p>
      </section>

      <DestinationShowcase
        destinations={destinations}
        loading={loading}
        onSelectDestination={onSelectDestination || ((id) => onNavigate('destination-detail'))}
      />

      {/* Browse by property type in Pokhara Section */}
      <div className="max-w-7xl mx-auto px-6 mt-12 mb-12">
        <h3 className="text-2xl font-bold text-gray-900">Browse by property type in Pokhara</h3>
        <p className="text-gray-700 mb-4 mt-2 text-lg">Find the perfect accommodation for your stay</p>

        <div className="relative group">
          <button
            onClick={() => scrollLeft(propertyScrollRef)}
            className="absolute -left-5 top-[40%] z-10 w-10 h-10 bg-white border border-gray-100 shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div ref={propertyScrollRef} className="flex gap-4 overflow-x-auto pb-6 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="min-w-[180px] md:min-w-[220px] lg:min-w-[240px] snap-start cursor-pointer group/card">
              <div className="w-full h-40 md:h-48 rounded-2xl overflow-hidden mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                  alt="Hotels" 
                  className="w-full h-full object-cover transition duration-300 group-hover/card:scale-105" 
                />
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-900">Hotels</h4>
              <p className="text-base text-gray-600 mt-1">Mar 1 - Mar 7</p>
              <p className="text-sm text-blue-600 font-medium mt-1">6,943 properties</p>
            </div>
            <div className="min-w-[180px] md:min-w-[220px] lg:min-w-[240px] snap-start cursor-pointer group/card">
              <div className="w-full h-40 md:h-48 rounded-2xl overflow-hidden mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                  alt="Apartments" 
                  className="w-full h-full object-cover transition duration-300 group-hover/card:scale-105" 
                />
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-900">Apartments</h4>
              <p className="text-base text-gray-600 mt-1">Mar 1 - Mar 7</p>
              <p className="text-sm text-blue-600 font-medium mt-1">1,254 properties</p>
            </div>
            <div className="min-w-[180px] md:min-w-[220px] lg:min-w-[240px] snap-start cursor-pointer group/card">
              <div className="w-full h-40 md:h-48 rounded-2xl overflow-hidden mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                  alt="Resorts" 
                  className="w-full h-full object-cover transition duration-300 group-hover/card:scale-105" 
                />
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-900">Resorts</h4>
              <p className="text-base text-gray-600 mt-1">Mar 1 - Mar 7</p>
              <p className="text-sm text-blue-600 font-medium mt-1">892 properties</p>
            </div>
            <div className="min-w-[180px] md:min-w-[220px] lg:min-w-[240px] snap-start cursor-pointer group/card">
              <div className="w-full h-40 md:h-48 rounded-2xl overflow-hidden mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                  alt="Villas" 
                  className="w-full h-full object-cover transition duration-300 group-hover/card:scale-105" 
                />
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-900">Villas</h4>
              <p className="text-base text-gray-600 mt-1">Mar 1 - Mar 7</p>
              <p className="text-sm text-blue-600 font-medium mt-1">567 properties</p>
            </div>
          </div>

          <button
            onClick={() => scrollRight(propertyScrollRef)}
            className="absolute -right-5 top-[40%] z-10 w-10 h-10 bg-white border border-gray-100 shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* <section className="max-w-7xl mx-auto py-16 px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Star, title: "Best Experience" },
          ].map((item, i) => (
            <Card
              key={i}
              className="group bg-white/90 backdrop-blur shadow-xl transition hover:-translate-y-2 hover:shadow-2xl"
            >
              <CardHeader className="text-center pb-6">
                <item.icon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-xl font-semibold text-slate-900">
                  {item.title}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section> */}

      {/* <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-slate-900">
          <div className="rounded-3xl bg-white/90 p-12 shadow-lg">
            <h3 className="text-4xl font-bold">50+</h3>
            <p className="mt-3 text-lg text-slate-600">Destinations</p>
          </div>
          <div className="rounded-3xl bg-white/90 p-12 shadow-lg">
            <h3 className="text-4xl font-bold">200+</h3>
            <p className="mt-3 text-lg text-slate-600">Tours</p>
          </div>
          <div className="rounded-3xl bg-white/90 p-12 shadow-lg">
            <h3 className="text-4xl font-bold">10k+</h3>
            <p className="mt-3 text-lg text-slate-600">Happy Travelers</p>
        </div>
      </section> */}


      {/* Footer Section */}
      <footer className="bg-gradient-to-br from-blue-950 via-slate-800 to-blue-900">
        <div className="max-w-6xl mx-auto px-6">
          {/* Brand Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 flex items-center justify-center">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-mountain text-blue-500"
                >
                  <path d="m10.5 4.97-.93 4.46C9.3 9.46 8.85 9.2 8.3 9c-1.3-.6-2.7-1-4.2-1H2L10.5 4.97Z" />
                  <path d="m14.5 7.03 15.43 11.5c.2.04.4.1.6.1h1.7c1.5 0 2.9.4 4.2 1l2.3-3.41L14.5 7.03Z" />
                  <path d="M8 10c-1.5 0-2.9.4-4.2 1H2l8.5 4.97-1.93-9.46Z" />
                  <path d="M16 10c-1.5 0-2.9.4-4.2 1h-1.7l8.5 4.97 1.93-9.46Z" />
                  <path d="M12 2L2 22H22L12 2Z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-white">Nepal Tourism</span>
            </div>
            <p className="text-lg opacity-90 max-w-2xl mx-auto text-white">
              Explore. Book. Travel.
            </p>
            <p className="text-lg opacity-90 max-w-2xl mx-auto text-white">
              Discover amazing destinations, book your perfect trip, and experience the beauty of Nepal with our trusted travel services.
            </p>
          </div>

          {/* Feature Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <MapPin className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h4 className="font-semibold text-lg mb-2 text-white">Top Destinations</h4>
              <p className="text-sm opacity-80 text-white">Explore the best places</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h4 className="font-semibold text-lg mb-2 text-white">Easy Booking</h4>
              <p className="text-sm opacity-80 text-white">Quick & simple</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Star className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h4 className="font-semibold text-lg mb-2 text-white">Best Experience</h4>
              <p className="text-sm opacity-80 text-white">Memorable journeys</p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-3xl font-bold mb-2 text-white">50+</h3>
              <p className="text-sm opacity-80 text-white">Destinations</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-3xl font-bold mb-2 text-white">200+</h3>
              <p className="text-sm opacity-80 text-white">Tours</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-3xl font-bold mb-2 text-white">10k+</h3>
              <p className="text-sm opacity-80 text-white">Happy Travelers</p>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="border-t border-white/20 pt-8 text-center">
            <p className="text-sm opacity-70 mb-4 text-white">
              © 2026 Travel Nepal. All rights reserved. | Privacy Policy | Terms of Service | Contact Us
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <a href="#" className="hover:text-blue-200 transition-colors text-white">About Us</a>
              <a href="#" className="hover:text-blue-200 transition-colors text-white">Support</a>
              <a href="#" className="hover:text-blue-200 transition-colors text-white">Partners</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

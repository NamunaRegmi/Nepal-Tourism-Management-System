import { Mountain, MapPin, Calendar, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect, useRef, useCallback } from 'react';
import { destinationService } from '@/services/api';
import { useAppDataSync } from '@/lib/dataSync';
import DestinationShowcase from '@/components/DestinationShowcase';



const Home = ({ onNavigate, onSelectDestination }) => {
  const [destinations, setDestinations] = useState([]);
  const [allDestinations, setAllDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const loadDestinations = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadDestinations();
  }, [loadDestinations]);

  useAppDataSync(loadDestinations);

  const handleSearchSubmit = () => {
    const query = searchLocation || searchDate || searchType;
    if (!query.trim()) {
      setDestinations(allDestinations);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = allDestinations.filter(d => 
      d.name?.toLowerCase().includes(lowerQuery) || 
      d.description?.toLowerCase().includes(lowerQuery) ||
      d.location?.toLowerCase().includes(lowerQuery)
    );
    
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

  const propertyTypes = [
    {
      id: 'hotels',
      name: 'Hotels',
      description: 'Luxury stays, city centers, and modern amenities.',
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'villas',
      name: 'Villas',
      description: 'Private villas with scenic views and spacious comfort.',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'resorts',
      name: 'Resorts',
      description: 'Relax at premium resorts across Nepal’s top destinations.',
      image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'homestays',
      name: 'Homestays',
      description: 'Cozy homestays with friendly hosts and local charm.',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <div className="flex flex-col w-full bg-slate-50">
      <main className="relative">
        <div className="h-[70vh] relative">
          {/* Nepal-themed background with overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 30, 60, 0.7), rgba(0, 30, 60, 0.8)), url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D&auto=format&fit=crop&w=2070&q=80')`
            }}
          />
          
          {/* Decorative mountain silhouettes */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900/50 to-transparent" />
          
          <div className="relative z-10 h-full flex flex-col items-center justify-start text-white px-6 pt-20 pb-12">
            <div className="text-center max-w-3xl">
              <h1 className="text-8xl font-bold tracking-wide drop-shadow-lg">
                <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent">
                  Nepal
                </span>
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-white mx-auto rounded-full"></div>
              <p className="text-2xl text-center max-w-3xl font-light drop-shadow-md mt-6">
                Discover Your Next Adventure in the Land of Himalayas
              </p>
            </div>
            
            <div className="flex flex-wrap gap-5 justify-center mt-12 mb-12">
              <button 
                onClick={() => onNavigate('destination-results')} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-12 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl border-2 border-white/20"
              >
                <Mountain className="inline-block w-5 h-5 mr-2" />
                Explore Destinations
              </button>
              <button 
                onClick={() => onNavigate('tours')} 
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-4 px-12 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl border-2 border-white/20"
              >
                <MapPin className="inline-block w-5 h-5 mr-2" />
                View Tours
              </button>
            </div>

            {/* Enhanced Search Bar Section */}
            <div className="absolute bottom-8 left-0 right-0 px-6">
              <div className="max-w-6xl mx-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20">
                  <div className="grid gap-4 sm:grid-cols-4 items-center">
                    <div className="relative w-full">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Where you want to go?"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        className="w-full p-4 pl-12 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/30 transition-all duration-300"
                      />
                    </div>
                    <div className="relative w-full">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                      <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="w-full p-4 pl-12 rounded-xl bg-white/20 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/30 transition-all duration-300"
                      />
                    </div>
                    <div className="relative w-full">
                      <Mountain className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                      <select 
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        className="w-full p-4 pl-12 rounded-xl bg-white/20 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/30 transition-all duration-300 appearance-none cursor-pointer"
                      >
                        <option className="bg-slate-800">Travel type</option>
                        <option className="bg-slate-800">Adventure</option>
                        <option className="bg-slate-800">Cultural</option>
                        <option className="bg-slate-800">Trekking</option>
                        <option className="bg-slate-800">Wildlife</option>
                      </select>
                    </div>
                    <button 
                      onClick={() => handleSearchSubmit()} 
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl border-2 border-white/30"
                    >
                      Search Adventures
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Section Header */}
      <section className="homepage-section max-w-7xl mx-auto px-6 pb-0">
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold text-slate-900 mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Explore the Places
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto mb-6 rounded-full"></div>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
            Discover curated journeys across Nepal with hotels, tours, and local experiences selected for every travel style. From the Himalayas to the plains, your adventure awaits.
          </p>
        </div>

        <DestinationShowcase
          destinations={destinations}
          loading={loading}
          onSelectDestination={onSelectDestination}
        />
      </section>

      {/* Enhanced Property Section */}
      <section className="homepage-section max-w-7xl mx-auto px-6 pt-0">
        <div className="mb-2">
          <h2 className="homepage-section-heading text-2xl font-semibold text-slate-900 mb-2">
            Browse by Property Type
          </h2>
          <p className="text-base text-slate-600 font-normal max-w-4xl leading-relaxed">
            Find the perfect accommodation for your stay in beautiful Nepal. From luxury hotels to cozy guesthouses, discover the ideal property type for your adventure.
          </p>
        </div>

        <div className="relative group">
          <button
            onClick={() => scrollLeft(propertyScrollRef)}
            className="absolute -left-5 top-[40%] z-10 w-10 h-10 bg-white border border-gray-100 shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={() => scrollRight(propertyScrollRef)}
            className="absolute -right-5 top-[40%] z-10 w-10 h-10 bg-white border border-gray-100 shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>

          <div ref={propertyScrollRef} className="flex gap-4 overflow-x-auto pb-6 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {propertyTypes.map((property) => (
              <div
                key={property.id}
                className="min-w-[180px] md:min-w-[220px] lg:min-w-[240px] snap-start cursor-pointer group/card"
                onClick={() => onNavigate && onNavigate('destination-results')}
              >
                <div className="w-full h-40 md:h-48 rounded-2xl overflow-hidden mb-4 shadow-lg">
                  <img
                    src={property.image}
                    alt={property.name}
                    className="w-full h-full object-cover transition duration-300 group-hover/card:scale-105"
                  />
                </div>
                <h4 className="font-semibold text-lg mb-2 text-gray-900">{property.name}</h4>
                <p className="text-base text-gray-600">{property.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nepal-themed Footer */}
      <footer className="bg-gradient-to-r from-slate-800 to-slate-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h4 className="text-2xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Start Your Nepal Adventure
              </span>
            </h4>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto mb-6 rounded-full"></div>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Explore. Book. Travel.
            </p>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Discover amazing destinations, book your perfect trip, and experience the beauty of Nepal with our trusted travel services.
            </p>
          </div>

          {/* Feature Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition-all duration-300">
              <MapPin className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h4 className="font-semibold text-lg mb-2 text-white">Top Destinations</h4>
              <p className="text-sm opacity-80 text-white">Explore the best places</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition-all duration-300">
              <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h4 className="font-semibold text-lg mb-2 text-white">Easy Booking</h4>
              <p className="text-sm opacity-80 text-white">Quick & simple</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition-all duration-300">
              <Mountain className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h4 className="font-semibold text-lg mb-2 text-white">Best Prices</h4>
              <p className="text-sm opacity-80 text-white">Great value guaranteed</p>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="border-t border-white/20 pt-8 text-center">
            <p className="text-sm opacity-70 mb-4">
              © 2026 Nepal Tourism Management System. All rights reserved. | Privacy Policy | Terms of Service | Contact Us
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <button type="button" onClick={() => onNavigate('about')} className="hover:text-blue-200 transition-colors text-white">
                About Us
              </button>
              <button type="button" onClick={() => onNavigate('about')} className="hover:text-blue-200 transition-colors text-white">
                Support
              </button>
              <button type="button" onClick={() => onNavigate('tours')} className="hover:text-blue-200 transition-colors text-white">
                Partners
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

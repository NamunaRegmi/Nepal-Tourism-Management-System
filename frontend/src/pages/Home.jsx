import { Mountain, MapPin, Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { destinationService } from '@/services/api';
import { useAppDataSync } from '@/lib/dataSync';
import DestinationShowcase from '@/components/DestinationShowcase';

const HERO_BACKGROUND_URL = 'https://res.cloudinary.com/dwqixrysn/image/upload/v1779963044/nepal-tourism/home/home-hero-himalayas.png';
const HERO_BACKGROUND_FALLBACK = '/assets/home-hero-himalayas.png';

const Home = ({ onNavigate, onSelectDestination }) => {
  const [destinations, setDestinations] = useState([]);
  const [allDestinations, setAllDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchType, setSearchType] = useState('Cultural');
  const [heroBackgroundSrc, setHeroBackgroundSrc] = useState(HERO_BACKGROUND_URL);
  const [heroOffset, setHeroOffset] = useState({ x: 0, y: 0 });

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

  const handleHeroPointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 24;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 16;
    setHeroOffset({ x, y });
  };

  const handleHeroPointerLeave = () => {
    setHeroOffset({ x: 0, y: 0 });
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
      id: "hotels",
      name: "Hotels",
      description: "Luxury stays, city centers, and modern amenities.",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "villas",
      name: "Villas",
      description: "Private villas with Himalayan views and spacious comfort.",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "resorts",
      name: "Resorts",
      description: "Relax at premium resorts across Nepal’s top destinations.",
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "homestays",
      name: "Homestays",
      description: "Authentic stays with local families and Nepali hospitality.",
      image: "https://images.unsplash.com/photo-1601628828688-632f38a5a7d0?auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <div className="flex flex-col w-full bg-slate-50">
      <main
        className="relative min-h-[560px] overflow-hidden bg-slate-950 text-white"
        onPointerMove={handleHeroPointerMove}
        onPointerLeave={handleHeroPointerLeave}
      >
        <img
          src={heroBackgroundSrc}
          alt=""
          aria-hidden="true"
          draggable="false"
          onError={() => setHeroBackgroundSrc(HERO_BACKGROUND_FALLBACK)}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover transition-transform duration-300 ease-out"
          style={{
            transform: `translate3d(${heroOffset.x}px, ${heroOffset.y}px, 0) scale(1.08)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-slate-900/35 to-slate-950/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.08),rgba(2,6,23,0.38))]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-14 lg:py-20 ">
          
          <div className="flex flex-col items-center justify-center gap-10 text-center">
            <div className="space-y-6 max-w-3xl">
              <div className="inline-flex rounded-full border border-white/30 bg-slate-950/35 px-4 py-2 text-sm uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
                Explore Nepal travel
              </div>
              <h1 className="text-5xl font-extrabold leading-[1.02] text-white drop-shadow-[0_5px_22px_rgba(2,6,23,0.68)] sm:text-6xl">
                Find your next stay and experience in Nepal.
              </h1>
              <p className="text-lg font-medium text-slate-100 drop-shadow-[0_2px_12px_rgba(2,6,23,0.7)] sm:text-xl">
                Search deals on hotels, homes, guides, and tours with a focused booking experience tailored for Nepal travelers.
              </p>
            </div>

            <div className="w-full max-w-6xl">
              <div className="rounded-3xl border border-white/75 bg-white/95 p-2 shadow-[0_24px_70px_rgba(2,6,23,0.34)] backdrop-blur sm:p-3">
                <div className="grid gap-3 sm:grid-cols-[1.9fr_1.4fr_1.1fr_auto] items-center">
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-center gap-3 text-slate-900">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Where are you going?</p>
                        <input
                          type="text"
                          placeholder="Search destination"
                          value={searchLocation}
                          onChange={(e) => setSearchLocation(e.target.value)}
                          className="mt-1 w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-center gap-3 text-slate-900">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Check-in date</p>
                        <input
                          type="date"
                          value={searchDate}
                          onChange={(e) => setSearchDate(e.target.value)}
                          className="mt-1 w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-center gap-3 text-slate-900">
                      <Mountain className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Travel type</p>
                        <select
                          value={searchType}
                          onChange={(e) => setSearchType(e.target.value)}
                          className="mt-1 w-full bg-transparent text-sm font-medium outline-none text-slate-900"
                        >
                          <option value="Cultural">Cultural</option>
                          <option value="Adventure">Adventure</option>
                          <option value="Trekking">Trekking</option>
                          <option value="Wildlife">Wildlife</option>
                          <option value="Relaxation">Relaxation</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSearchSubmit()}
                    className="inline-flex h-full min-h-[60px] items-center justify-center gap-2 rounded-2xl bg-blue-700 px-7 text-base font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-600"
                  >
                    <Search className="h-5 w-5" />
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Section Header */}
      <section className="homepage-section max-w-7xl mx-auto px-6 pb-0 -mt-8 relative z-10">
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
    </div>
  );
};

export default Home;

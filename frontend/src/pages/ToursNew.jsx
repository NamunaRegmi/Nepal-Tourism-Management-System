import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Grid3x3, Heart, List, MapPin, Star, TrendingUp, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PackageBookingModal from '@/components/PackageBookingModal';
import { packageService } from '@/services/api';
import { useAppDataSync } from '@/lib/dataSync';

const FALLBACK_TOUR_IMAGE = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80';

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString('en-NP', { maximumFractionDigits: 0 })}`;

const formatCurrencyStrikethrough = (value) =>
  `Rs. ${Number(value || 0).toLocaleString('en-NP', { maximumFractionDigits: 0 })}`;

export default function ToursNew({ onNavigate }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('package_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await packageService.getAll();
      setPackages(response.data || []);
    } catch (err) {
      console.error('Failed to load packages', err);
      setPackages([]);
      setError('Failed to load tours right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAppDataSync(load);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let userRole = 'guest';
  try {
    userRole = userRaw ? JSON.parse(userRaw).role?.toLowerCase() || 'guest' : 'guest';
  } catch {
    userRole = 'guest';
  }

  const toggleWishlist = (packageId) => {
    setWishlist((prev) => {
      const newWishlist = prev.includes(packageId)
        ? prev.filter((id) => id !== packageId)
        : [...prev, packageId];
      localStorage.setItem('package_wishlist', JSON.stringify(newWishlist));
      return newWishlist;
    });
  };

  const handleBookPackage = (tour) => {
    if (!token) {
      onNavigate('auth');
      return;
    }

    if (userRole !== 'user') {
      toast.error('Sign in with a traveler account to book packages.');
      return;
    }

    setSelectedPackage(tour);
  };

  // Calculate discount percentage
  const getDiscountPercent = (price) => {
    const originalPrice = price * 1.2; // Assume 20% discount
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section - Navy Blue with Animations */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1e3a5f] text-white">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-white/30 rounded-full animate-float"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-white/20 rounded-full animate-float animation-delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-white/25 rounded-full animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-white/30 rounded-full animate-float animation-delay-3000"></div>
          <div className="absolute bottom-20 right-10 w-3 h-3 bg-white/20 rounded-full animate-float animation-delay-1500"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <div className="max-w-3xl">
            <p className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm animate-fade-in-down">
              Fully Guided Packages
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl animate-fade-in-up">
              BEST SELLERS FOR 2026
            </h1>
            <p className="mt-4 text-base leading-relaxed text-blue-100 md:text-lg animate-fade-in-up animation-delay-200">
              Discover Nepal's most popular trekking and tour packages. Expertly curated adventures with experienced guides, comfortable accommodations, and unforgettable experiences.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 animate-fade-in-up animation-delay-400">
              <Button 
                size="lg" 
                className="bg-white text-[#0a1628] hover:bg-blue-50 font-semibold shadow-xl hover:scale-105 transition-transform duration-300"
                onClick={() => {
                  document.getElementById('packages-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Browse Packages
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white/60 bg-transparent text-white hover:bg-white hover:text-[#0a1628] font-semibold hover:scale-105 transition-all duration-300"
                onClick={() => onNavigate('destination-results')}
              >
                Explore Destinations
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages-section" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        {/* View Toggle and Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Available Tour Packages</h2>
            <p className="mt-2 text-slate-600">
              {loading ? 'Loading...' : `${packages.length} amazing ${packages.length === 1 ? 'package' : 'packages'} to choose from`}
            </p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-[#0a1628] hover:bg-[#0f2744]' : ''}
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-[#0a1628] hover:bg-[#0f2744]' : ''}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className={viewMode === 'grid' ? 'grid gap-8 md:grid-cols-2 lg:grid-cols-3' : 'space-y-6'}>
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className={viewMode === 'grid' ? 'h-[500px] animate-pulse rounded-3xl bg-slate-200' : 'h-64 animate-pulse rounded-3xl bg-slate-200'} />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-16 text-center">
            <MapPin className="mx-auto h-16 w-16 text-slate-400" />
            <h3 className="mt-6 text-2xl font-bold text-slate-900">No packages available yet</h3>
            <p className="mt-3 text-slate-600">
              Check back soon for exciting tour packages, or explore our destinations.
            </p>
            <Button 
              className="mt-6 bg-[#0a1628] hover:bg-[#0f2744]" 
              onClick={() => onNavigate('destination-results')}
            >
              Browse Destinations
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((tour) => {
              const isWishlisted = wishlist.includes(tour.id);
              const discountPercent = getDiscountPercent(tour.price);
              const originalPrice = tour.price * 1.2;

              return (
                <div
                  key={tour.id}
                  className="group relative overflow-hidden rounded-3xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl"
                >
                  {/* Image */}
                  <div className="relative h-72 overflow-hidden">
                    <img
                      src={tour.image_url || tour.image || FALLBACK_TOUR_IMAGE}
                      alt={tour.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    
                    {/* Trending Badge */}
                    <div className="absolute left-4 top-4">
                      <Badge className="bg-yellow-400 text-yellow-900 font-bold uppercase tracking-wider px-3 py-1">
                        Trending
                      </Badge>
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={() => toggleWishlist(tour.id)}
                      className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-600'
                        }`}
                      />
                    </button>

                    {/* Tour Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                        {tour.name}
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Duration and Rating */}
                    <div className="mb-4 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <CalendarDays className="h-4 w-4" />
                        <span className="font-medium">Duration: {tour.duration_days} Days</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-slate-900">5.0</span>
                        <span className="text-slate-500">({Math.floor(Math.random() * 50) + 10} Reviews)</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mb-4 line-clamp-2 text-sm text-slate-600">
                      {tour.description}
                    </p>

                    {/* Destinations */}
                    {tour.destinations && tour.destinations.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {tour.destinations.slice(0, 3).map((dest) => (
                          <span
                            key={dest.id}
                            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                          >
                            {dest.name}
                          </span>
                        ))}
                        {tour.destinations.length > 3 && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            +{tour.destinations.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price and Book Button */}
                    <div className="flex items-center justify-between border-t pt-4">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-slate-500">From</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {formatCurrency(tour.price)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400 line-through">
                            {formatCurrencyStrikethrough(originalPrice)}
                          </span>
                          <span className="text-xs font-semibold text-green-600">
                            Save {discountPercent}%
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleBookPackage(tour)}
                        className="bg-[#0a1628] hover:bg-[#0f2744] font-semibold shadow-lg"
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-6">
            {packages.map((tour) => {
              const isWishlisted = wishlist.includes(tour.id);
              const discountPercent = getDiscountPercent(tour.price);
              const originalPrice = tour.price * 1.2;

              return (
                <div
                  key={tour.id}
                  className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="relative h-64 md:h-auto md:w-80 overflow-hidden">
                      <img
                        src={tour.image_url || tour.image || FALLBACK_TOUR_IMAGE}
                        alt={tour.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent md:bg-gradient-to-r"></div>
                      
                      {/* Trending Badge */}
                      <div className="absolute left-4 top-4">
                        <Badge className="bg-yellow-400 text-yellow-900 font-bold uppercase tracking-wider px-3 py-1">
                          Trending
                        </Badge>
                      </div>

                      {/* Wishlist Button */}
                      <button
                        onClick={() => toggleWishlist(tour.id)}
                        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
                      >
                        <Heart
                          className={`h-5 w-5 transition-colors ${
                            isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-2xl font-bold text-slate-900">{tour.name}</h3>
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-slate-900">5.0</span>
                            <span className="text-sm text-slate-500">({Math.floor(Math.random() * 50) + 10})</span>
                          </div>
                        </div>

                        <p className="mt-3 text-slate-600 line-clamp-2">{tour.description}</p>

                        {/* Meta Info */}
                        <div className="mt-4 flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <CalendarDays className="h-4 w-4" />
                            <span className="font-medium">{tour.duration_days} Days</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{tour.provider_name || 'Provider'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">{tour.destinations?.length || 0} Destinations</span>
                          </div>
                        </div>

                        {/* Destinations */}
                        {tour.destinations && tour.destinations.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {tour.destinations.slice(0, 4).map((dest) => (
                              <span
                                key={dest.id}
                                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                              >
                                {dest.name}
                              </span>
                            ))}
                            {tour.destinations.length > 4 && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                +{tour.destinations.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Price and Action */}
                      <div className="mt-6 flex items-center justify-between border-t pt-4">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-slate-500">From</span>
                            <span className="text-3xl font-bold text-[#0a1628]">
                              {formatCurrency(tour.price)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400 line-through">
                              {formatCurrencyStrikethrough(originalPrice)}
                            </span>
                            <span className="text-xs font-semibold text-green-600">
                              Save {discountPercent}%
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleBookPackage(tour)}
                          size="lg"
                          className="bg-[#0a1628] hover:bg-[#0f2744] font-semibold shadow-lg"
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Stats Bar - Moved to Bottom */}
      <section className="border-t bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <h3 className="mb-8 text-center text-2xl font-bold text-slate-900">Why Choose Our Tours</h3>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: 'Tour Packages', value: packages.length || '10', icon: MapPin },
              { label: 'Happy Travelers', value: '10,000+', icon: Star },
              { label: 'Expert Guides', value: '50+', icon: TrendingUp },
              { label: 'Destinations', value: '15+', icon: CalendarDays },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#0a1628]/10">
                  <stat.icon className="h-8 w-8 text-[#0a1628]" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="mt-1 text-sm font-medium text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#0a1628] via-[#0f2744] to-[#1e3a5f] text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center md:px-6">
          <h2 className="text-3xl font-bold md:text-4xl">Ready for Your Nepal Adventure?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
            Join thousands of travelers who have experienced the magic of Nepal with our expert-guided tours.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-white text-[#0a1628] hover:bg-blue-50 font-semibold"
              onClick={() => onNavigate('auth')}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white/10"
              onClick={() => onNavigate('guides')}
            >
              Find a Guide
            </Button>
          </div>
        </div>
      </section>

      <PackageBookingModal
        tour={selectedPackage}
        isOpen={Boolean(selectedPackage)}
        onClose={() => setSelectedPackage(null)}
      />
    </div>
  );
}

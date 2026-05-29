import { useState, useEffect, useCallback } from 'react';
import { MapPin, Star, Search, ChevronRight, Building2, Home, TreePalm, Hotel as HotelIcon, X } from 'lucide-react';
import { hotelService } from '@/services/api';

const PROPERTY_TYPES = [
  { value: '', label: 'All Properties', icon: Building2 },
  { value: 'hotel', label: 'Hotels', icon: HotelIcon },
  { value: 'villa', label: 'Villas', icon: TreePalm },
  { value: 'resort', label: 'Resorts', icon: TreePalm },
  { value: 'homestay', label: 'Homestays', icon: Home },
];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

const Hotels = ({ onNavigate, onSelectDestination, initialType = '' }) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeType, setActiveType] = useState(initialType);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHotels = useCallback(async (type) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await hotelService.getAll(type || undefined);
      setHotels(res.data || []);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Unknown error';
      console.error('Hotels fetch failed:', err);
      setFetchError(msg);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels(activeType);
  }, [activeType, fetchHotels]);

  const filtered = searchQuery.trim()
    ? hotels.filter(h =>
        h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.destination_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : hotels;

  const activeTypeLabel = PROPERTY_TYPES.find(t => t.value === activeType)?.label || 'All Properties';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 text-sm flex items-center gap-2 text-blue-600">
          <button onClick={() => onNavigate('home')} className="hover:underline">Home</button>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{activeTypeLabel}</span>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            {activeTypeLabel} in Nepal
          </h1>
          <p className="text-slate-500 text-sm">Browse available properties across Nepal's top destinations</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Type tabs */}
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setActiveType(value)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  activeType === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative sm:ml-auto sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or location..."
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-8 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results count / error */}
        {fetchError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load properties: <span className="font-medium">{fetchError}</span>
            <button onClick={() => fetchHotels(activeType)} className="ml-3 underline text-red-600 hover:text-red-800">Retry</button>
          </div>
        ) : (
          <p className="text-sm text-slate-500 mb-4">
            {loading ? 'Loading...' : `${filtered.length} propert${filtered.length === 1 ? 'y' : 'ies'} found`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No properties found</p>
            <p className="text-sm mt-1">Try a different type or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(hotel => (
              <div
                key={hotel.id}
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                onClick={() => hotel.destination_id && onSelectDestination && onSelectDestination(hotel.destination_id)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={hotel.image_url || hotel.image || FALLBACK_IMAGE}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.src = FALLBACK_IMAGE; }}
                  />
                  {hotel.property_type && (
                    <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize">
                      {hotel.property_type}
                    </span>
                  )}
                  {hotel.rating > 0 && (
                    <span className="absolute top-2.5 right-2.5 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-1 rounded-full">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {hotel.rating}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 truncate">{hotel.name}</h3>
                  <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{hotel.destination_name || hotel.address || 'Nepal'}</span>
                  </div>
                  {hotel.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {hotel.amenities.slice(0, 3).map((a, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{a}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-slate-900">
                        {hotel.currency === 'USD' ? '$' : 'Rs.'}{Number(hotel.price_per_night).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400">/night</span>
                    </div>
                    <span className="text-xs font-medium text-blue-600 hover:underline">View →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hotels;

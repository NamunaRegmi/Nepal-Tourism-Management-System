import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { destinationService, hotelService } from '@/services/api';
import BookingModal from '@/components/BookingModal';
import { Star, MapPin, Calendar, CheckCircle, Cloud, Wind, Thermometer, ArrowLeft, CloudSun, Map as MapIcon, Info } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Same curated image map as DestinationResults — keeps hero images in sync
const DESTINATION_IMAGES = {
  kathmandu: 'https://media.greenvalleynepaltreks.com/uploads/fullbanner/pashupatinath-temple-kathmandu.webp',
  pokhara:   'https://lp-cms-production.imgix.net/2019-06/53693064.jpg',
  chitwan:   'https://wallpaperbat.com/img/33765-shafir-image-night-kathmandu.jpg',
  lumbini:   'https://cdn.kimkim.com/files/a/article_images/images/e8ec67f6bc9ab8f8e4f1ac868992e5eb773d216b/big-8fb97ea8663986559702dcfcd4dd51f8.jpg',
  manang:    'https://www.hikingannapurna.com/blog/wp-content/uploads/2023/07/adventure-beautiful-clouds-4045693.jpg',
  mustang:   'https://www.thirdrockadventures.com/assets-back/images/news/upper-mustang.jpgCM3.jpg',
  everest:   'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const getDestinationImage = (dest) => {
  const lower = (dest?.name || '').toLowerCase();
  for (const [key, url] of Object.entries(DESTINATION_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return dest?.image || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80';
};

function DestinationDetail({ destinationId, onNavigate }) {
  const [destination, setDestination] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Check if user is logged in
  const isAuthenticated = () => {
    return !!localStorage.getItem('user') && !!localStorage.getItem('access_token');
  };

  useEffect(() => {
    if (destinationId) {
      fetchData();
    }
  }, [destinationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const destRes = await destinationService.getById(destinationId);
      setDestination(destRes.data);

      const hotelsRes = await hotelService.getByDestination(destinationId);
      setHotels(hotelsRes.data);
    } catch (err) {
      console.error("Failed to fetch destination details", err);
      setError("Failed to load destination details.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (hotel) => {
    if (!isAuthenticated()) {
      onNavigate('auth');
      return;
    }
    setSelectedHotel(hotel);
    setIsBookingOpen(true);
  };

  // Mock weather data
  const weather = {
    temp: 24,
    condition: 'Sunny',
    humidity: '45%',
    wind: '12 km/h'
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (!destination) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-800">Destination not found</h2>
      <Button onClick={() => onNavigate('destination-results')} className="mt-4">Back to Destinations</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <img 
          src={getDestinationImage(destination)} 
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute top-6 left-6">
          <Button 
            onClick={() => onNavigate('destination-results')} 
            className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Destinations
          </Button>
        </div>

        <div className="absolute bottom-10 left-10 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-blue-600 text-white border-none">{destination.province}</Badge>
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <span className="text-white text-sm ml-1 font-semibold">4.9 / 5.0</span>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight">{destination.name}</h1>
          <p className="mt-2 text-xl opacity-90 max-w-2xl font-medium">Explore the heart of the Himalayas</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">About this destination</h2>
              <div className="text-gray-700 leading-relaxed text-lg">
                {destination.description}
              </div>
              
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {destination.highlights?.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span className="text-blue-900 font-medium">{h}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Stay Options Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Where to stay</h2>
                  <p className="text-gray-500 mt-1">Found {hotels.length} verified properties</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50">Best Deals</Badge>
                  <Badge variant="outline">Recommended</Badge>
                </div>
              </div>

              {hotels.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500">No accommodations listed for this area yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="flex flex-col md:flex-row gap-6 p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors bg-white hover:shadow-md group">
                      <div className="w-full md:w-56 h-48 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={hotel.image || 'https://via.placeholder.com/400x300'} 
                          alt={hotel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{hotel.name}</h3>
                              <div className="flex items-center gap-2 mt-1 text-sm text-blue-600">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{hotel.address || destination.name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-sm font-bold">
                              <Star className="h-3 w-3 fill-current" /> {hotel.rating || '4.5'}
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-gray-600 line-clamp-2">
                            {hotel.description}
                          </div>
                          <div className="mt-3 flex gap-2">
                            {hotel.amenities?.slice(0, 3).map((a, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">{a}</span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-50">
                          <div>
                            <span className="text-sm text-gray-500 font-medium">Starting from</span>
                            <div className="text-xl font-bold text-gray-900">Rs. {hotel.price_per_night}</div>
                          </div>
                          <Button 
                            onClick={() => handleBookClick(hotel)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-6">
            {/* Map Widget */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MapIcon className="h-4 w-4 text-blue-600" /> Location Information
                </h3>
              </div>
              <div className="h-64 w-full">
                <MapContainer 
                  center={[destination.latitude || 28.3949, destination.longitude || 84.1240]} 
                  zoom={10} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[destination.latitude || 28.3949, destination.longitude || 84.1240]}>
                    <Popup>{destination.name}</Popup>
                  </Marker>
                </MapContainer>
              </div>
              <div className="p-4 bg-gray-50/50">
                <p className="text-sm text-gray-600 italic">Exploring {destination.name} and nearby attractions.</p>
              </div>
            </section>

            {/* Weather Widget */}
            <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white overflow-hidden relative">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <CloudSun className="h-5 w-5" /> Local Weather
                  </h3>
                  <Badge className="bg-white/20 text-white border-none">Live</Badge>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <Cloud className="h-12 w-12" />
                  </div>
                  <div>
                    <div className="text-4xl font-extrabold">{weather.temp}°C</div>
                    <div className="text-lg opacity-90">{weather.condition}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1">Humidity</div>
                    <div className="flex items-center gap-2 font-bold">
                      <Wind className="h-3.5 w-3.5 text-blue-300" /> {weather.humidity}
                    </div>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1">Wind Speed</div>
                    <div className="flex items-center gap-2 font-bold">
                      <Thermometer className="h-3.5 w-3.5 text-orange-300" /> {weather.wind}
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative circle */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            </section>

            {/* Travel Info */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" /> Quick Travel Tips
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                  Best visited during {destination.best_time_to_visit}.
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                  Book popular hotels at least 2 weeks in advance.
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                  Don't forget to pack light and comfortable trekking gear.
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedHotel && (
        <BookingModal
          hotel={selectedHotel}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          onSuccess={() => {
            alert("Booking successful!"); // Or show a nice toast
          }}
        />
      )}
    </div>
  );
}

export default DestinationDetail;
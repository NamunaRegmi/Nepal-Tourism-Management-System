import { useState, useEffect } from 'react';
import { MapPin, Star, List, Grid, ChevronRight, Map as MapIcon, Info, CloudSun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { destinationService } from '@/services/api';
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

// Curated image map — ensures correct images regardless of DB values
const DESTINATION_IMAGES = {
    kathmandu: 'https://media.greenvalleynepaltreks.com/uploads/fullbanner/pashupatinath-temple-kathmandu.webp',
    pokhara: 'https://lp-cms-production.imgix.net/2019-06/53693064.jpg',
    chitwan: 'https://wallpaperbat.com/img/33765-shafir-image-night-kathmandu.jpg',
    lumbini: 'https://cdn.kimkim.com/files/a/article_images/images/e8ec67f6bc9ab8f8e4f1ac868992e5eb773d216b/big-8fb97ea8663986559702dcfcd4dd51f8.jpg',
    manang: 'https://www.hikingannapurna.com/blog/wp-content/uploads/2023/07/adventure-beautiful-clouds-4045693.jpg',
    mustang: 'https://www.thirdrockadventures.com/assets-back/images/news/upper-mustang.jpgCM3.jpg',
    everest: 'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const getDestinationImage = (dest) => {
    const lower = (dest.name || '').toLowerCase();
    for (const [key, url] of Object.entries(DESTINATION_IMAGES)) {
        if (lower.includes(key)) return url;
    }
    return dest.image || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80';
};

const DestinationResults = ({ onNavigate, onSelectDestination }) => {
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                const res = await destinationService.getAll();
                setDestinations(res.data);
            } catch (err) {
                console.error("Failed to fetch destinations", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDestinations();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-4 py-3 text-sm flex items-center gap-2 text-blue-600">
                <button onClick={() => onNavigate('home')} className="hover:underline">Home</button>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <button onClick={() => onNavigate('user-dashboard')} className="hover:underline">Nepal</button>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Destinations</span>
            </div>

            <div className="max-w-7xl mx-auto px-4 pb-12">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Sidebar */}
                    <aside className="w-full lg:w-72 flex-shrink-0">
                        <div className="sticky top-20 space-y-4">
                            {/* Map Preview */}
                            <div className="relative rounded-lg overflow-hidden border border-gray-200 h-64 group cursor-pointer shadow-inner">
                                <MapContainer
                                    center={[28.3949, 84.1240]}
                                    zoom={6}
                                    scrollWheelZoom={false}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                    dragging={true}
                                    doubleClickZoom={false}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    {destinations.map(dest => (
                                        dest.latitude && dest.longitude && (
                                            <Marker key={dest.id} position={[dest.latitude, dest.longitude]}>
                                                <Popup>{dest.name}</Popup>
                                            </Marker>
                                        )
                                    ))}
                                </MapContainer>
                                <div className="absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-blue-600 shadow-sm border border-blue-100">
                                    {destinations.length} LOCATIONS
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex gap-3 text-blue-800">
                                    <Info className="h-5 w-5 flex-shrink-0" />
                                    <p className="text-sm">
                                        Showing {destinations.length} destinations available in Nepal. Explore the best places to visit.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Explore Destinations in Nepal</h1>
                                <p className="text-gray-500 text-sm mt-1">{destinations.length} destinations available</p>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                                <Button
                                    variant={viewMode === 'list' ? 'white' : 'ghost'}
                                    size="sm"
                                    className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
                                    onClick={() => setViewMode('list')}
                                >
                                    <List className="h-4 w-4 mr-2" /> List
                                </Button>
                                <Button
                                    variant={viewMode === 'grid' ? 'white' : 'ghost'}
                                    size="sm"
                                    className={viewMode === 'grid' ? 'bg-white shadow-sm' : ''}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <Grid className="h-4 w-4 mr-2" /> Grid
                                </Button>
                            </div>
                        </header>

                        {/* List of Destinations */}
                        <div className="space-y-4">
                            {destinations.map((dest) => (
                                <Card key={dest.id} className="overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer group shadow-sm bg-white" onClick={() => onSelectDestination(dest.id)}>
                                    <div className="flex flex-col md:flex-row">
                                        {/* Image Section */}
                                        <div className="w-full md:w-72 h-64 md:h-auto overflow-hidden relative">
                                            <img
                                                src={getDestinationImage(dest)}
                                                alt={dest.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
                                                <CloudSun className="h-4 w-4 text-blue-600" />
                                            </div>
                                        </div>

                                        {/* Info Section */}
                                        <div className="flex-1 p-6 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h2 className="text-xl font-bold text-blue-600 hover:underline">
                                                            {dest.name}
                                                        </h2>
                                                        <div className="flex items-center gap-2 mt-1 text-sm text-blue-600">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            <span>{dest.province}</span>
                                                            <span className="text-gray-400">·</span>
                                                            <span className="underline cursor-pointer">Show on map</span>
                                                        </div>
                                                    </div>

                                                    {/* Rating Box */}
                                                    <div className="flex items-center gap-2 text-right">
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 leading-none">Exceptional</p>
                                                            <p className="text-xs text-gray-500 mt-1">842 reviews</p>
                                                        </div>
                                                        <div className="bg-blue-900 text-white p-2 rounded-t-lg rounded-br-lg font-bold text-lg min-w-[40px] text-center">
                                                            9.8
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 text-sm text-gray-700 line-clamp-2 md:line-clamp-3">
                                                    {dest.description}
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {dest.highlights?.slice(0, 3).map((h, i) => (
                                                        <span key={i} className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                            {h}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-6 flex items-end justify-between border-t border-gray-100 pt-4">
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-bold text-green-700">Best time to visit:</span> {dest.best_time_to_visit}
                                                </div>
                                                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-bold rounded-md">
                                                    View Destination
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DestinationResults;

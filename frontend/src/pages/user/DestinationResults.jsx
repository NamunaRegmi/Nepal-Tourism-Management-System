import { useState, useEffect, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapPin, List, Grid, ChevronRight, Info, CloudSun, Mountain, Trees, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { destinationService } from '@/services/api';
import { useAppDataSync } from '@/lib/dataSync';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
    formatDistrictLabel,
    getDistrictForDestination,
    getTerrainForDestination,
    getTerrainForDistrict,
    normalizeDistrictName,
    TERRAIN_STYLES,
} from '@/lib/nepalTerrain';

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

const NepalMapViewport = ({ districtMapData }) => {
    const map = useMap();

    useEffect(() => {
        if (!districtMapData) {
            return;
        }

        const bounds = L.geoJSON(districtMapData).getBounds();

        if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.03), {
                animate: false,
                padding: [20, 20],
                maxZoom: 8,
            });
        }
    }, [districtMapData, map]);

    return null;
};

const DestinationResults = ({ onNavigate, onSelectDestination }) => {
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [error, setError] = useState(null);
    const [selectedTerrain, setSelectedTerrain] = useState('All');
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [districtMapData, setDistrictMapData] = useState(null);
    const [districtMapError, setDistrictMapError] = useState(false);

    const fetchDestinations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await destinationService.getAll();
            setDestinations(res.data || []);
        } catch (err) {
            console.error("Failed to fetch destinations", err);
            setError(
                err?.code === 'ECONNABORTED'
                    ? 'Destination request timed out. Please try again.'
                    : 'Failed to load destinations. Please try again.'
            );
            setDestinations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDestinations();
    }, [fetchDestinations]);

    useEffect(() => {
        let ignore = false;

        const loadDistrictMap = async () => {
            try {
                setDistrictMapError(false);
                const response = await fetch('/data/nepalDistrictsGeojson.json');

                if (!response.ok) {
                    throw new Error(`Failed to load map data: ${response.status}`);
                }

                const data = await response.json();

                if (!ignore) {
                    setDistrictMapData(data);
                }
            } catch (mapError) {
                console.error('Failed to load district map data', mapError);
                if (!ignore) {
                    setDistrictMapError(true);
                }
            }
        };

        loadDistrictMap();

        return () => {
            ignore = true;
        };
    }, []);

    useAppDataSync(fetchDestinations);

    const terrainOptions = [
        { key: 'All', label: 'All terrain', icon: MapPin },
        { key: 'Himalayan', label: 'Himalayan', icon: Mountain },
        { key: 'Hill', label: 'Hill', icon: Trees },
        { key: 'Terai', label: 'Terai', icon: Waves },
    ];

    const filteredDestinations = destinations.filter((dest) => {
        if (selectedTerrain === 'All') return true;
        return getTerrainForDestination(dest) === selectedTerrain;
    });

    const selectedDistrictKey = normalizeDistrictName(selectedDistrict);

    const sortedDestinations = selectedDistrictKey
        ? filteredDestinations.slice().sort((a, b) => {
            const aDistrict = getDistrictForDestination(a);
            const bDistrict = getDistrictForDestination(b);
            const aScore = aDistrict === selectedDistrictKey ? 1 : 0;
            const bScore = bDistrict === selectedDistrictKey ? 1 : 0;
            return bScore - aScore;
        })
        : filteredDestinations;

    const activeTerrainInfo = selectedTerrain === 'All' ? null : TERRAIN_STYLES[selectedTerrain];

    const handleDistrictClick = (districtName) => {
        const normalizedDistrict = normalizeDistrictName(districtName);
        setSelectedDistrict(normalizedDistrict);
        setSelectedTerrain(getTerrainForDistrict(normalizedDistrict));
    };

    const clearTerrainSelection = () => {
        setSelectedDistrict(null);
        setSelectedTerrain('All');
    };

    const getDistrictStyle = (feature) => {
        const districtName = feature?.properties?.DISTRICT;
        const terrain = getTerrainForDistrict(districtName);
        const terrainStyle = TERRAIN_STYLES[terrain];
        const isActive = districtName === selectedDistrictKey;

        return {
            color: isActive ? '#ffffff' : terrainStyle.color,
            weight: isActive ? 2.8 : 1.1,
            fillColor: terrainStyle.color,
            fillOpacity: isActive ? 0.72 : 0.32,
            opacity: 1,
        };
    };

    const bindDistrictLayer = (feature, layer) => {
        const districtName = feature?.properties?.DISTRICT;
        const terrain = getTerrainForDistrict(districtName);

        layer.bindTooltip(
            `<div><strong>${formatDistrictLabel(districtName)}</strong><br/>${terrain}</div>`,
            { sticky: true }
        );

        layer.on({
            click: () => handleDistrictClick(districtName),
            mouseover: (event) => {
                const districtStyle = getDistrictStyle(feature);
                event.target.setStyle({
                    ...districtStyle,
                    weight: Math.max(districtStyle.weight, 2.2),
                    fillOpacity: Math.max(districtStyle.fillOpacity, 0.5),
                });
                event.target.bringToFront();
            },
            mouseout: (event) => {
                event.target.setStyle(getDistrictStyle(feature));
            },
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading destinations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-red-600 mb-4">
                        <Info className="h-12 w-12 mx-auto mb-2" />
                        <p>{error}</p>
                    </div>
                    <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-4 py-3 text-sm flex items-center gap-2 text-blue-600">
                <button onClick={() => onNavigate('home')} className="hover:underline">Home</button>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <button onClick={() => onNavigate('home')} className="hover:underline">Nepal</button>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Destinations</span>
            </div>

            <div className="max-w-7xl mx-auto px-4 pb-12">
                <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white shadow-sm">
                    <div className="grid items-stretch lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
                        <div className="flex h-full flex-col p-6 md:p-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">Terrain Explorer</p>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight">Click a Nepal district to auto-select its terrain</h2>
                            <p className="mt-3 max-w-2xl text-sm text-blue-100/90 md:text-base">
                                Use the map to switch between Himalayan, Hill, and Terai experiences. Clicking a district focuses the explorer on the terrain that shapes travel there.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-2">
                                {terrainOptions.map((option) => {
                                    const Icon = option.icon;
                                    const isActive = selectedTerrain === option.key;
                                    const terrainTheme = option.key === 'All' ? null : TERRAIN_STYLES[option.key];
                                    return (
                                        <button
                                            key={option.key}
                                            type="button"
                                            onClick={() => {
                                                setSelectedTerrain(option.key);
                                                if (option.key === 'All') {
                                                    setSelectedDistrict(null);
                                                }
                                            }}
                                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${isActive
                                                ? 'shadow-sm'
                                                : 'text-white hover:bg-white/15'
                                                }`}
                                            style={option.key === 'All'
                                                ? {
                                                    borderColor: isActive ? '#ffffff' : 'rgba(255,255,255,0.18)',
                                                    backgroundColor: isActive ? '#ffffff' : 'rgba(255,255,255,0.08)',
                                                    color: isActive ? '#0f172a' : '#ffffff',
                                                }
                                                : {
                                                    borderColor: isActive ? terrainTheme.color : 'rgba(255,255,255,0.18)',
                                                    backgroundColor: isActive ? terrainTheme.fill : 'rgba(255,255,255,0.08)',
                                                    color: isActive ? terrainTheme.color : '#e2e8f0',
                                                }}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {option.label}
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={clearTerrainSelection}
                                    className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-blue-100 hover:bg-white/10"
                                >
                                    Reset map
                                </button>
                            </div>

                            <div
                                className="mt-6 rounded-2xl border bg-white/8 p-4 backdrop-blur-sm md:mt-auto"
                                style={activeTerrainInfo
                                    ? {
                                        borderColor: `${activeTerrainInfo.color}55`,
                                        boxShadow: `inset 0 0 0 1px ${activeTerrainInfo.color}22`,
                                    }
                                    : undefined}
                            >
                                <p className="text-sm font-semibold text-white">
                                    {selectedDistrict ? `${formatDistrictLabel(selectedDistrict)} selected` : 'No district selected'}
                                </p>
                                <p className="mt-2 text-sm text-blue-100/90">
                                    {activeTerrainInfo
                                        ? `${activeTerrainInfo.label}: ${activeTerrainInfo.description}`
                                        : 'Choose a district or terrain type to filter the destination list and inspect how Nepal’s geography shapes each journey.'}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-white/10 p-4 md:p-6 lg:border-l lg:border-t-0 lg:p-6">
                            <div className="relative h-full min-h-[360px] overflow-hidden rounded-[24px] border border-white/12 bg-slate-900/35 shadow-inner">
                                <MapContainer
                                    center={[28.25, 84.1]}
                                    zoom={7}
                                    scrollWheelZoom={true}
                                    style={{ height: '100%', minHeight: '360px', width: '100%' }}
                                    zoomControl={true}
                                    dragging={true}
                                    doubleClickZoom={true}
                                    attributionControl={false}
                                    minZoom={6}
                                    maxZoom={9}
                                    zoomSnap={0.25}
                                    maxBounds={[
                                        [25.5, 79.0],
                                        [31.5, 89.5],
                                    ]}
                                    maxBoundsViscosity={0.7}
                                >
                                    <NepalMapViewport districtMapData={districtMapData} />
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    {districtMapData && (
                                        <GeoJSON
                                            key={`district-map-${selectedDistrictKey || 'all'}-${selectedTerrain}`}
                                            data={districtMapData}
                                            style={getDistrictStyle}
                                            onEachFeature={bindDistrictLayer}
                                        />
                                    )}
                                </MapContainer>
                                <div className="pointer-events-none absolute right-3 top-3 z-[400] rounded-full border border-white/15 bg-slate-950/70 px-3 py-1 text-[11px] font-medium text-slate-100 backdrop-blur-sm">
                                    Use +/- or scroll to zoom
                                </div>
                                {!districtMapData && !districtMapError && (
                                    <div className="absolute inset-0 z-[400] flex items-center justify-center bg-slate-950/40 text-sm font-medium text-white backdrop-blur-[2px]">
                                        Loading Nepal district map...
                                    </div>
                                )}
                                {districtMapError && (
                                    <div className="absolute inset-x-4 bottom-4 z-[400] rounded-xl border border-red-300 bg-white/95 px-4 py-3 text-sm text-red-700 shadow-lg">
                                        District map failed to load. Refresh the page to retry.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

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
                                    {sortedDestinations.map(dest => (
                                        dest.latitude && dest.longitude && (
                                            <Marker key={dest.id} position={[dest.latitude, dest.longitude]}>
                                                <Popup>{dest.name}</Popup>
                                            </Marker>
                                        )
                                    ))}
                                </MapContainer>
                                <div className="absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-blue-600 shadow-sm border border-blue-100">
                                    {sortedDestinations.length} LOCATIONS
                                </div>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Active filter</p>
                                <p className="mt-2 text-base font-semibold text-slate-900">
                                    {selectedTerrain === 'All' ? 'All terrain' : selectedTerrain}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    {selectedDistrict
                                        ? `Triggered by ${formatDistrictLabel(selectedDistrict)}.`
                                        : 'Use the terrain explorer above to focus on a physiographic region.'}
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Explore Destinations in Nepal</h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    {sortedDestinations.length} destination{sortedDestinations.length === 1 ? '' : 's'} available
                                    {selectedTerrain !== 'All' ? ` in the ${selectedTerrain} terrain` : ''}
                                </p>
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
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                            {sortedDestinations.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No destinations found</h3>
                                    <p className="text-gray-500 mb-4">
                                        {selectedTerrain === 'All'
                                            ? "We couldn't find any destinations at the moment."
                                            : `No destinations currently match the ${selectedTerrain} terrain filter.`}
                                    </p>
                                    <Button onClick={clearTerrainSelection} className="bg-blue-600 hover:bg-blue-700">
                                        Clear filter
                                    </Button>
                                </div>
                            ) : (
                                sortedDestinations.map((dest) => {
                                    const terrain = getTerrainForDestination(dest);
                                    const terrainStyle = TERRAIN_STYLES[terrain];
                                    return (
                                    <Card
                                        key={dest.id}
                                        className={viewMode === 'grid'
                                            ? 'overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer shadow-sm bg-white'
                                            : 'overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer group shadow-sm bg-white'}
                                        onClick={() => onSelectDestination(dest.id)}
                                    >
                                        {viewMode === 'grid' ? (
                                            <div className="flex flex-col h-full">
                                                <div className="h-52 overflow-hidden relative">
                                                    <img
                                                        src={getDestinationImage(dest)}
                                                        alt={dest.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                    <div className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
                                                        <CloudSun className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="p-5 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h2 className="text-xl font-bold text-gray-900 mb-2">{dest.name}</h2>
                                                        <p className="text-sm text-gray-500 mb-3">{dest.province}</p>
                                                        <div className="text-sm text-gray-700 line-clamp-3">{dest.description}</div>
                                                    </div>
                                                    <div className="mt-4 flex items-center justify-between">
                                                        <span className="text-xs uppercase tracking-[0.15em] text-blue-600 font-semibold">{dest.best_time_to_visit}</span>
                                                        <div
                                                            className="rounded-full px-3 py-1 text-xs font-bold"
                                                            style={{ backgroundColor: terrainStyle.fill, color: terrainStyle.color }}
                                                        >
                                                            {terrain}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
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
                                                            <span
                                                                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                                                style={{ backgroundColor: terrainStyle.fill, color: terrainStyle.color }}
                                                            >
                                                                {terrain}
                                                            </span>
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
                                        )}
                                    </Card>
                                )})
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DestinationResults;

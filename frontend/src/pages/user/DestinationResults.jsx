import { useState, useEffect, useCallback, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapPin, List, Grid, ChevronRight, Info, CloudSun, Mountain, Trees, Waves, Sparkles, SlidersHorizontal, Calendar, Hotel, Package, Star, Users, ChevronLeft, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { destinationService } from '@/services/api';
import { useAppDataSync } from '@/lib/dataSync';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
    formatDistrictLabel,
    getDistrictForDestination,
    getProvinceForDistrict,
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

// Place-specific image map — longest key matched first
const DESTINATION_IMAGES = {
    // ── multi-word keys (matched before shorter overlapping keys) ─────────────
    'kathmandu durbar square': 'https://images.unsplash.com/photo-1582531579541-45e90e9b8c67?auto=format&fit=crop&w=800&q=80',
    'pashupatinath temple':    'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=800&q=80',
    'swayambhunath (monkey temple)': 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?auto=format&fit=crop&w=800&q=80',
    'poon hill (ghorepani)':   'https://images.unsplash.com/photo-1597945161640-9366e6d4253b?auto=format&fit=crop&w=800&q=80',
    'upper mustang':           'https://images.unsplash.com/photo-1623645534667-d6dab01b3a0c?auto=format&fit=crop&w=800&q=80',
    'everest base camp':       'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=800',
    'annapurna base camp':     'https://images.unsplash.com/photo-1519923834699-ef0b7cde4712?auto=format&fit=crop&w=800&q=80',
    'namche bazaar':           'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
    'gokyo lakes':             'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
    'tengboche monastery':     'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=800&q=80',
    'kanchenjunga base camp':  'https://images.unsplash.com/photo-1540390769625-2fc3f8b1d50c?auto=format&fit=crop&w=800&q=80',
    'koshi tappu wildlife reserve': 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=800&q=80',
    'bardia national park':    'https://images.pexels.com/photos/247502/pexels-photo-247502.jpeg?auto=compress&cs=tinysrgb&w=800',
    'shuklaphanta national park': 'https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=800&q=80',
    'khaptad national park':   'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
    'shey phoksundo lake':     'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=800&q=80',
    'manaslu circuit':         'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?auto=compress&cs=tinysrgb&w=800',
    'pokhara paragliding':     'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=800',
    'trisuli river rafting':   'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
    'langtang valley':         'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
    'makalu base camp':        'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=800&q=80',
    'tilicho lake':            'https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=800&q=80',
    'patan (lalitpur)':        'https://images.unsplash.com/photo-1599030243932-0f6cdb4ad3c4?auto=format&fit=crop&w=800&q=80',
    'tansen (palpa)':          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    'api himal':               'https://images.unsplash.com/photo-1535041422672-8c3254ab4b7a?auto=format&fit=crop&w=800&q=80',

    // ── single-word / short keys ──────────────────────────────────────────────
    // Kathmandu Valley heritage
    kathmandu:     'https://images.unsplash.com/photo-1582531579541-45e90e9b8c67?auto=format&fit=crop&w=800&q=80',
    bhaktapur:     'https://images.pexels.com/photos/2161467/pexels-photo-2161467.jpeg?auto=compress&cs=tinysrgb&w=800',
    patan:         'https://images.unsplash.com/photo-1599030243932-0f6cdb4ad3c4?auto=format&fit=crop&w=800&q=80',
    lalitpur:      'https://images.unsplash.com/photo-1599030243932-0f6cdb4ad3c4?auto=format&fit=crop&w=800&q=80',
    boudhanath:    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    pashupatinath: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=800&q=80',
    swayambhunath: 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?auto=format&fit=crop&w=800&q=80',
    namobuddha:    'https://images.unsplash.com/photo-1545243424-0ce743d7e0e3?auto=format&fit=crop&w=800&q=80',
    nagarkot:      'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=800',
    dhulikhel:     'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
    langtang:      'https://images.unsplash.com/photo-1551107696-a4b537a53e43?auto=format&fit=crop&w=800&q=80',
    gosaikunda:    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    helambu:       'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    trisuli:       'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
    // Gandaki
    pokhara:       'https://lp-cms-production.imgix.net/2019-06/53693064.jpg',
    annapurna:     'https://images.unsplash.com/photo-1519923834699-ef0b7cde4712?auto=format&fit=crop&w=800&q=80',
    ghorepani:     'https://images.unsplash.com/photo-1597945161640-9366e6d4253b?auto=format&fit=crop&w=800&q=80',
    jomsom:        'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?auto=format&fit=crop&w=800&q=80',
    muktinath:     'https://images.pexels.com/photos/7672255/pexels-photo-7672255.jpeg?auto=compress&cs=tinysrgb&w=800',
    tilicho:       'https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=800&q=80',
    bandipur:      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    gorkha:        'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&cs=tinysrgb&w=800',
    manaslu:       'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?auto=compress&cs=tinysrgb&w=800',
    manang:        'https://www.hikingannapurna.com/blog/wp-content/uploads/2023/07/adventure-beautiful-clouds-4045693.jpg',
    mustang:       'https://images.unsplash.com/photo-1623645534667-d6dab01b3a0c?auto=format&fit=crop&w=800&q=80',
    paragliding:   'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=800',
    // Koshi
    everest:       'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=800',
    namche:        'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
    gokyo:         'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
    tengboche:     'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=800&q=80',
    kanchenjunga:  'https://images.unsplash.com/photo-1540390769625-2fc3f8b1d50c?auto=format&fit=crop&w=800&q=80',
    ilam:          'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=800',
    makalu:        'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=800&q=80',
    // Madhesh
    janakpur:      'https://images.pexels.com/photos/5358830/pexels-photo-5358830.jpeg?auto=compress&cs=tinysrgb&w=800',
    // Lumbini
    lumbini:       'https://cdn.kimkim.com/files/a/article_images/images/e8ec67f6bc9ab8f8e4f1ac868992e5eb773d216b/big-8fb97ea8663986559702dcfcd4dd51f8.jpg',
    chitwan:       'https://images.pexels.com/photos/792381/pexels-photo-792381.jpeg?auto=compress&cs=tinysrgb&w=800',
    bardia:        'https://images.pexels.com/photos/247502/pexels-photo-247502.jpeg?auto=compress&cs=tinysrgb&w=800',
    tansen:        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    tilaurakot:    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80',
    // Karnali
    rara:          'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80',
    phoksundo:     'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=800&q=80',
    dolpo:         'https://images.unsplash.com/photo-1526913049886-9f54f5cf3dd9?auto=format&fit=crop&w=800&q=80',
    jumla:         'https://images.unsplash.com/photo-1487956382158-bb926046304a?auto=format&fit=crop&w=800&q=80',
    // Sudurpashchim
    shuklaphanta:  'https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=800&q=80',
    khaptad:       'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
    api:           'https://images.unsplash.com/photo-1535041422672-8c3254ab4b7a?auto=format&fit=crop&w=800&q=80',
};

const getDestinationImage = (dest) => {
    const placeholder = '/assets/nepal-tourism-mark.svg';
    if (!dest) return placeholder;
    if (dest.image_url || dest.image) return dest.image_url || dest.image;
    const name = (dest.name || '').toLowerCase().trim();
    const key = Object.keys(DESTINATION_IMAGES)
        .sort((a, b) => b.length - a.length)
        .find(k => name.includes(k));
    return key ? DESTINATION_IMAGES[key] : placeholder;
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

const INTEREST_OPTIONS = [
    { label: 'Trekking',   value: 'trekking' },
    { label: 'Cultural',   value: 'cultural' },
    { label: 'Wildlife',   value: 'wildlife' },
    { label: 'Relaxation', value: 'relaxation' },
    { label: 'Religious',  value: 'religious' },
    { label: 'Adventure',  value: 'adventure' },
];
const SEASON_OPTIONS = [
    { label: 'Spring', value: 'spring', hint: 'Mar–May' },
    { label: 'Summer', value: 'summer', hint: 'Jun–Aug' },
    { label: 'Autumn', value: 'autumn', hint: 'Sep–Nov' },
    { label: 'Winter', value: 'winter', hint: 'Dec–Feb' },
];
const PREFS_KEY = 'travel_preferences';

function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || { interests: [], season: '' }; }
    catch { return { interests: [], season: '' }; }
}

const DestinationResults = ({ onNavigate, onSelectDestination }) => {
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list');
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTerrain, setSelectedTerrain] = useState('All');
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [districtMapData, setDistrictMapData] = useState(null);
    const [districtMapError, setDistrictMapError] = useState(false);

    const [prefs, setPrefs] = useState(loadPrefs);
    const [showPrefs, setShowPrefs] = useState(false);
    const [aiRecs, setAiRecs] = useState([]);
    const [aiLoading, setAiLoading] = useState(true);
    const sliderRef = useRef(null);
    const aiRequestKeyRef = useRef('');

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

    const fetchAiRecs = useCallback(async () => {
        const requestKey = JSON.stringify({
            interests: prefs.interests,
            season: prefs.season,
        });

        if (aiRequestKeyRef.current === requestKey) {
            return;
        }

        aiRequestKeyRef.current = requestKey;
        setAiLoading(true);
        try {
            const params = {};
            if (prefs.interests.length) params.interests = prefs.interests.join(',');
            if (prefs.season) params.season = prefs.season;
            const res = await destinationService.getExploreRecommendations(params);
            setAiRecs(res.data || []);
        } catch {
            aiRequestKeyRef.current = '';
            setAiRecs([]);
        } finally {
            setAiLoading(false);
        }
    }, [prefs]);

    const updatePrefs = (next) => {
        const merged = { ...prefs, ...next };
        setPrefs(merged);
        localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
    };

    const toggleInterest = (value) => {
        const interests = prefs.interests.includes(value)
            ? prefs.interests.filter(i => i !== value)
            : [...prefs.interests, value];
        updatePrefs({ interests });
    };

    useEffect(() => {
        fetchDestinations();
    }, [fetchDestinations]);

    useEffect(() => {
        fetchAiRecs();
    }, [fetchAiRecs]);

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

    const selectedDistrictKey = normalizeDistrictName(selectedDistrict);
    const selectedProvince = selectedDistrictKey ? getProvinceForDistrict(selectedDistrictKey) : null;

    const filteredDestinations = destinations.filter((dest) => {
        const query = searchQuery.trim().toLowerCase();
        if (query) {
            const district = formatDistrictLabel(getDistrictForDestination(dest)).toLowerCase();
            const searchable = [
                dest.name,
                dest.province,
                district,
                dest.description,
                dest.best_time_to_visit,
                ...(dest.highlights || []),
            ].filter(Boolean).join(' ').toLowerCase();

            if (!searchable.includes(query)) {
                return false;
            }
        }

        // District filter: exact district match OR province-level match
        if (selectedDistrictKey) {
            const destDistrict = getDistrictForDestination(dest);
            if (destDistrict === selectedDistrictKey) return true;
            if (selectedProvince && dest.province === selectedProvince) return true;
            return false;
        }
        // Terrain filter (no district selected)
        if (selectedTerrain !== 'All') {
            return getTerrainForDestination(dest) === selectedTerrain;
        }
        return true;
    });

    const sortedDestinations = selectedDistrictKey
        ? filteredDestinations.slice().sort((a, b) => {
            const aExact = getDistrictForDestination(a) === selectedDistrictKey ? 1 : 0;
            const bExact = getDistrictForDestination(b) === selectedDistrictKey ? 1 : 0;
            return bExact - aExact;
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

    const clearAllFilters = () => {
        setSearchQuery('');
        clearTerrainSelection();
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
                        <div className="flex h-full flex-col p-4 sm:p-6 md:p-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">Terrain Explorer</p>
                            <h2 className="mt-2 text-xl sm:text-3xl font-bold tracking-tight">Click a Nepal district to auto-select its terrain</h2>
                            <p className="mt-2 sm:mt-3 max-w-2xl text-xs sm:text-sm text-blue-100/90 md:text-base hidden sm:block">
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
                                    {selectedDistrict
                                        ? `${formatDistrictLabel(selectedDistrict)} District${selectedProvince ? ` - ${selectedProvince} Province` : ""}`
                                        : "No district selected"}
                                </p>
                                <p className="mt-2 text-sm text-blue-100/90">
                                    {selectedDistrictKey
                                        ? `Showing ${sortedDestinations.length} destination${sortedDestinations.length !== 1 ? "s" : ""} in ${selectedProvince || formatDistrictLabel(selectedDistrict)}. Exact district matches appear first.`
                                        : activeTerrainInfo
                                            ? `${activeTerrainInfo.label}: ${activeTerrainInfo.description}`
                                            : "Click any district on the map to filter destinations for that area."}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-white/10 p-4 md:p-6 lg:border-l lg:border-t-0 lg:p-6">
                            <div className="relative h-full min-h-[240px] sm:min-h-[360px] overflow-hidden rounded-[24px] border border-white/12 bg-slate-900/35 shadow-inner">
                                <MapContainer
                                    center={[28.25, 84.1]}
                                    zoom={7}
                                    scrollWheelZoom={true}
                                    style={{ height: '100%', minHeight: '240px', width: '100%' }}
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

                <div>

                    {/* Sticky search bar — always visible after scrolling past the map */}
                    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 -mx-4 px-4 py-3 mb-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search places, province, activities..."
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3">
                                <p className="text-xs text-slate-400 sm:hidden">
                                    {sortedDestinations.length} destination{sortedDestinations.length === 1 ? '' : 's'}
                                    {searchQuery.trim() ? ` for "${searchQuery.trim()}"` : ''}
                                </p>
                                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg flex-shrink-0">
                                    <Button
                                        variant={viewMode === 'list' ? 'white' : 'ghost'}
                                        size="sm"
                                        className={viewMode === 'list' ? 'bg-white shadow-sm h-7 px-2' : 'h-7 px-2'}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <List className="h-3.5 w-3.5 sm:mr-1" /><span className="hidden sm:inline text-xs">List</span>
                                    </Button>
                                    <Button
                                        variant={viewMode === 'grid' ? 'white' : 'ghost'}
                                        size="sm"
                                        className={viewMode === 'grid' ? 'bg-white shadow-sm h-7 px-2' : 'h-7 px-2'}
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <Grid className="h-3.5 w-3.5 sm:mr-1" /><span className="hidden sm:inline text-xs">Grid</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <main>
                        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Explore Destinations in Nepal</h1>
                                <p className="text-gray-500 text-sm mt-1 hidden sm:block">
                                    {sortedDestinations.length} destination{sortedDestinations.length === 1 ? '' : 's'} available
                                    {selectedTerrain !== 'All' ? ` in the ${selectedTerrain} terrain` : ''}
                                    {searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ''}
                                </p>
                            </div>
                        </header>

                        {/* AI Recommendations */}
                        <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                                        <Sparkles className="h-4 w-4 text-violet-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-slate-900 text-sm">AI-Recommended for You</h2>
                                        <p className="text-[11px] text-slate-400">
                                            {prefs.interests.length || prefs.season
                                                ? `Based on: ${[...prefs.interests, prefs.season].filter(Boolean).join(', ')}`
                                                : 'Personalise to get tailored picks'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPrefs(s => !s)}
                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-violet-600 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 px-3 py-1.5 rounded-full transition-all"
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    {showPrefs ? 'Hide' : 'Personalise'}
                                </button>
                            </div>
                            <div className="mt-4">

                            {showPrefs && (
                                <div className="mb-4 p-4 bg-white rounded-xl border border-violet-100 space-y-3">
                                    <div>
                                        <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider mb-2">Interests</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {INTEREST_OPTIONS.map(({ label, value }) => {
                                                const active = prefs.interests.includes(value);
                                                return (
                                                    <button
                                                        key={value}
                                                        onClick={() => toggleInterest(value)}
                                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${active
                                                            ? 'bg-violet-600 text-white border-violet-600'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                                                        }`}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider mb-2">Travel Season</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {SEASON_OPTIONS.map(({ label, value, hint }) => {
                                                const active = prefs.season === value;
                                                return (
                                                    <button
                                                        key={value}
                                                        onClick={() => updatePrefs({ season: active ? '' : value })}
                                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${active
                                                            ? 'bg-violet-600 text-white border-violet-600'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                                                        }`}
                                                    >
                                                        {label} <span className="opacity-60">{hint}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {aiLoading ? (
                                <div className="flex gap-4 overflow-hidden">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="flex-shrink-0 w-72 h-96 rounded-2xl bg-slate-100 animate-pulse" />
                                    ))}
                                </div>
                            ) : aiRecs.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-6">No recommendations available.</p>
                            ) : (
                                <div className="relative group/slider">
                                    {/* Prev button */}
                                    <button
                                        onClick={() => sliderRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-slate-50 hover:border-violet-300"
                                    >
                                        <ChevronLeft className="h-4 w-4 text-slate-600" />
                                    </button>
                                    {/* Next button */}
                                    <button
                                        onClick={() => sliderRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-slate-50 hover:border-violet-300"
                                    >
                                        <ChevronRight className="h-4 w-4 text-slate-600" />
                                    </button>
                                    {/* Scrollable track */}
                                    <div
                                        ref={sliderRef}
                                        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar"
                                        style={{ scrollSnapType: 'x mandatory' }}
                                    >
                                    {aiRecs.map(rec => {
                                        const s = rec.stats || {};
                                        return (
                                        <div
                                            key={rec.id}
                                            className="group rounded-2xl overflow-hidden border border-slate-200 hover:border-violet-300 hover:shadow-xl transition-all duration-300 bg-white flex flex-col shadow-sm flex-shrink-0 w-72"
                                            style={{ scrollSnapAlign: 'start' }}
                                        >
                                            {/* Hero image */}
                                            <button onClick={() => onSelectDestination(rec.id)} className="relative h-44 overflow-hidden flex-shrink-0 block w-full">
                                                <img
                                                    src={getDestinationImage(rec)}
                                                    alt={rec.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                                {/* Top badges */}
                                                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
                                                    {s.avg_rating > 0 ? (
                                                        <span className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/20">
                                                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />{s.avg_rating}
                                                        </span>
                                                    ) : <span />}
                                                    {s.min_price > 0 && (
                                                        <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full border border-white/20">
                                                            from Rs.{s.min_price.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Bottom name */}
                                                <div className="absolute bottom-2.5 left-3 right-3">
                                                    <p className="text-white font-bold text-base leading-tight drop-shadow-md">{rec.name}</p>
                                                    <div className="flex items-center gap-1 text-white/75 text-[11px] mt-0.5">
                                                        <MapPin className="h-2.5 w-2.5" />{rec.province}
                                                    </div>
                                                </div>
                                            </button>

                                            <div className="p-4 flex flex-col flex-1 gap-3">

                                                {/* AI reason */}
                                                {rec.ai_reason && (
                                                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 border-l-2 border-violet-300 pl-2.5 italic">
                                                        {rec.ai_reason}
                                                    </p>
                                                )}

                                                {/* Inline stats strip */}
                                                <div className="flex items-center gap-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                                                    <div className="flex-1 flex flex-col items-center py-2 px-1 border-r border-slate-200">
                                                        <p className="text-sm font-bold text-slate-800">{s.hotel_count ?? 0}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">Hotels</p>
                                                    </div>
                                                    <div className="flex-1 flex flex-col items-center py-2 px-1 border-r border-slate-200">
                                                        <p className="text-sm font-bold text-slate-800">{s.package_count ?? 0}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">Packages</p>
                                                    </div>
                                                    <div className="flex-1 flex flex-col items-center py-2 px-1 border-r border-slate-200">
                                                        <p className="text-sm font-bold text-slate-800">{s.booking_count ?? 0}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">Bookings</p>
                                                    </div>
                                                    <div className="flex-1 flex flex-col items-center py-2 px-1">
                                                        <p className="text-sm font-bold text-slate-800">{s.highlights_count ?? 0}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">Spots</p>
                                                    </div>
                                                </div>

                                                {/* Top hotel */}
                                                {rec.top_hotel && (
                                                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                                                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
                                                            <div className="flex items-center gap-1.5">
                                                                <Hotel className="h-3 w-3 text-slate-400" />
                                                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Best Hotel</span>
                                                            </div>
                                                            <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
                                                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                                {rec.top_hotel.rating}
                                                            </span>
                                                        </div>
                                                        <div className="px-3 py-2.5 bg-white">
                                                            <p className="text-xs font-bold text-slate-800 truncate">{rec.top_hotel.name}</p>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <p className="text-[11px] text-slate-500">
                                                                    from <span className="font-semibold text-slate-700">Rs.{rec.top_hotel.price_per_night.toLocaleString()}</span>/night
                                                                </p>
                                                                {rec.top_hotel.amenities?.length > 0 && (
                                                                    <div className="flex gap-1">
                                                                        {rec.top_hotel.amenities.slice(0,2).map((a, i) => (
                                                                            <span key={i} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{a}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Featured package */}
                                                {rec.packages?.[0] && (
                                                    <div className="rounded-xl border border-violet-100 overflow-hidden">
                                                        <div className="flex items-center justify-between px-3 py-2 bg-violet-50 border-b border-violet-100">
                                                            <div className="flex items-center gap-1.5">
                                                                <Package className="h-3 w-3 text-violet-400" />
                                                                <span className="text-[10px] font-semibold text-violet-500 uppercase tracking-wider">Package</span>
                                                            </div>
                                                            <span className="text-[10px] font-semibold text-violet-500 bg-violet-100 px-2 py-0.5 rounded-full">
                                                                {rec.packages[0].duration_days} days
                                                            </span>
                                                        </div>
                                                        <div className="px-3 py-2.5 bg-white">
                                                            <p className="text-xs font-bold text-slate-800 truncate">{rec.packages[0].name}</p>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <p className="text-[11px] font-bold text-violet-600">Rs.{rec.packages[0].price.toLocaleString()}</p>
                                                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                                    <Users className="h-3 w-3" />
                                                                    max {rec.packages[0].max_people}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Best time + explore */}
                                                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                                                    {rec.best_time_to_visit ? (
                                                        <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full truncate">
                                                            <Calendar className="h-3 w-3 flex-shrink-0" />
                                                            {rec.best_time_to_visit}
                                                        </span>
                                                    ) : <span />}
                                                    <button
                                                        onClick={() => onSelectDestination(rec.id)}
                                                        className="flex-shrink-0 text-[11px] font-bold text-white px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        Explore →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })}
                                    </div>
                                </div>
                            )}
                            </div>
                        </div>

                        {/* List of Destinations */}
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                            {sortedDestinations.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No destinations found</h3>
                                    <p className="text-gray-500 mb-4">
                                        {searchQuery.trim()
                                            ? `No destinations match "${searchQuery.trim()}".`
                                            : selectedTerrain === 'All'
                                                ? "We couldn't find any destinations at the moment."
                                                : `No destinations currently match the ${selectedTerrain} terrain filter.`}
                                    </p>
                                    <Button onClick={clearAllFilters} className="bg-blue-600 hover:bg-blue-700">
                                        Clear filters
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

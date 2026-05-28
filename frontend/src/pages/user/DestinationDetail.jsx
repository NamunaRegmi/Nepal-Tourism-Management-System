import { useState, useEffect, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { destinationService, hotelService, packageService, reviewService } from '@/services/api';
import BookingModal from '@/components/BookingModal';
import { useAppDataSync, notifyAppDataChanged } from '@/lib/dataSync';
import {
  Star, MapPin, Calendar, CheckCircle, Cloud, Wind, Thermometer,
  ArrowLeft, CloudSun, Map as MapIcon, Info, Sparkles, SlidersHorizontal,
  Package, Users, Clock, ChevronRight, Hotel, TrendingUp, MessageSquare, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const DESTINATION_IMAGES = {
  // ── multi-word keys first ────────────────────────────────────────────────
  'kathmandu durbar square':       'https://images.unsplash.com/photo-1582531579541-45e90e9b8c67?auto=format&fit=crop&w=1200&q=80',
  'pashupatinath temple':          'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=1200&q=80',
  'swayambhunath (monkey temple)': 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?auto=format&fit=crop&w=1200&q=80',
  'poon hill (ghorepani)':         'https://images.unsplash.com/photo-1597945161640-9366e6d4253b?auto=format&fit=crop&w=1200&q=80',
  'upper mustang':                 'https://images.unsplash.com/photo-1623645534667-d6dab01b3a0c?auto=format&fit=crop&w=1200&q=80',
  'everest base camp':             'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'annapurna base camp':           'https://images.unsplash.com/photo-1519923834699-ef0b7cde4712?auto=format&fit=crop&w=1200&q=80',
  'namche bazaar':                 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
  'gokyo lakes':                   'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80',
  'tengboche monastery':           'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1200&q=80',
  'kanchenjunga base camp':        'https://images.unsplash.com/photo-1540390769625-2fc3f8b1d50c?auto=format&fit=crop&w=1200&q=80',
  'koshi tappu wildlife reserve':  'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1200&q=80',
  'bardia national park':          'https://images.pexels.com/photos/247502/pexels-photo-247502.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'shuklaphanta national park':    'https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=1200&q=80',
  'khaptad national park':         'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
  'shey phoksundo lake':           'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=1200&q=80',
  'manaslu circuit':               'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'pokhara paragliding':           'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'trisuli river rafting':         'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=1200&q=80',
  'langtang valley':               'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
  'makalu base camp':              'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1200&q=80',
  'tilicho lake':                  'https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=1200&q=80',
  'patan (lalitpur)':              'https://images.unsplash.com/photo-1599030243932-0f6cdb4ad3c4?auto=format&fit=crop&w=1200&q=80',
  'tansen (palpa)':                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
  'api himal':                     'https://images.unsplash.com/photo-1535041422672-8c3254ab4b7a?auto=format&fit=crop&w=1200&q=80',
  // ── single-word keys ────────────────────────────────────────────────────
  kathmandu:     'https://images.unsplash.com/photo-1582531579541-45e90e9b8c67?auto=format&fit=crop&w=1200&q=80',
  bhaktapur:     'https://images.pexels.com/photos/2161467/pexels-photo-2161467.jpeg?auto=compress&cs=tinysrgb&w=1200',
  patan:         'https://images.unsplash.com/photo-1599030243932-0f6cdb4ad3c4?auto=format&fit=crop&w=1200&q=80',
  lalitpur:      'https://images.unsplash.com/photo-1599030243932-0f6cdb4ad3c4?auto=format&fit=crop&w=1200&q=80',
  boudhanath:    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
  pashupatinath: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=1200&q=80',
  swayambhunath: 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?auto=format&fit=crop&w=1200&q=80',
  namobuddha:    'https://images.unsplash.com/photo-1545243424-0ce743d7e0e3?auto=format&fit=crop&w=1200&q=80',
  nagarkot:      'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1200',
  dhulikhel:     'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
  langtang:      'https://images.unsplash.com/photo-1551107696-a4b537a53e43?auto=format&fit=crop&w=1200&q=80',
  gosaikunda:    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
  helambu:       'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
  trisuli:       'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=1200&q=80',
  pokhara:       'https://lp-cms-production.imgix.net/2019-06/53693064.jpg',
  annapurna:     'https://images.unsplash.com/photo-1519923834699-ef0b7cde4712?auto=format&fit=crop&w=1200&q=80',
  ghorepani:     'https://images.unsplash.com/photo-1597945161640-9366e6d4253b?auto=format&fit=crop&w=1200&q=80',
  jomsom:        'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?auto=format&fit=crop&w=1200&q=80',
  muktinath:     'https://images.pexels.com/photos/7672255/pexels-photo-7672255.jpeg?auto=compress&cs=tinysrgb&w=1200',
  tilicho:       'https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=1200&q=80',
  bandipur:      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
  gorkha:        'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&cs=tinysrgb&w=1200',
  manaslu:       'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?auto=compress&cs=tinysrgb&w=1200',
  manang:        'https://www.hikingannapurna.com/blog/wp-content/uploads/2023/07/adventure-beautiful-clouds-4045693.jpg',
  mustang:       'https://images.unsplash.com/photo-1623645534667-d6dab01b3a0c?auto=format&fit=crop&w=1200&q=80',
  paragliding:   'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1200',
  everest:       'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=1200',
  namche:        'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
  gokyo:         'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80',
  tengboche:     'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1200&q=80',
  kanchenjunga:  'https://images.unsplash.com/photo-1540390769625-2fc3f8b1d50c?auto=format&fit=crop&w=1200&q=80',
  ilam:          'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=1200',
  makalu:        'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1200&q=80',
  janakpur:      'https://images.pexels.com/photos/5358830/pexels-photo-5358830.jpeg?auto=compress&cs=tinysrgb&w=1200',
  lumbini:       'https://cdn.kimkim.com/files/a/article_images/images/e8ec67f6bc9ab8f8e4f1ac868992e5eb773d216b/big-8fb97ea8663986559702dcfcd4dd51f8.jpg',
  chitwan:       'https://images.pexels.com/photos/792381/pexels-photo-792381.jpeg?auto=compress&cs=tinysrgb&w=1200',
  bardia:        'https://images.pexels.com/photos/247502/pexels-photo-247502.jpeg?auto=compress&cs=tinysrgb&w=1200',
  tansen:        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
  tilaurakot:    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&q=80',
  rara:          'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=80',
  phoksundo:     'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=1200&q=80',
  dolpo:         'https://images.unsplash.com/photo-1526913049886-9f54f5cf3dd9?auto=format&fit=crop&w=1200&q=80',
  jumla:         'https://images.unsplash.com/photo-1487956382158-bb926046304a?auto=format&fit=crop&w=1200&q=80',
  shuklaphanta:  'https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=1200&q=80',
  khaptad:       'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
  api:           'https://images.unsplash.com/photo-1535041422672-8c3254ab4b7a?auto=format&fit=crop&w=1200&q=80',
};

const getDestinationImage = (dest) => {
  if (!dest) return '/assets/nepal-tourism-mark.svg';
  return dest?.image_url || dest?.image || '/assets/nepal-tourism-mark.svg';
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
  { label: 'Spring', value: 'spring', hint: 'Mar – May' },
  { label: 'Summer', value: 'summer', hint: 'Jun – Aug' },
  { label: 'Autumn', value: 'autumn', hint: 'Sep – Nov' },
  { label: 'Winter', value: 'winter', hint: 'Dec – Feb' },
];

const PREFS_KEY = 'travel_preferences';

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || { interests: [], season: '' };
  } catch {
    return { interests: [], season: '' };
  }
}

function DestinationDetail({ destinationId, onNavigate, onSelectDestination }) {
  const [destination, setDestination] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [packages, setPackages] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [showPrefs, setShowPrefs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [destReviews, setDestReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', comment: '' });
  const [reviewHover, setReviewHover] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const isAuthenticated = () => !!localStorage.getItem('user') && !!localStorage.getItem('access_token');

  const fetchData = useCallback(async () => {
    if (!destinationId) {
      setDestination(null);
      setHotels([]);
      setPackages([]);
      setError('No destination selected.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [destRes, hotelsRes, pkgsRes, reviewsRes] = await Promise.all([
        destinationService.getById(destinationId),
        hotelService.getByDestination(destinationId),
        packageService.getByDestination(destinationId),
        reviewService.getDestinationReviews(destinationId),
      ]);
      setDestination(destRes.data);
      setHotels(hotelsRes.data);
      setPackages(pkgsRes.data);
      setDestReviews(reviewsRes.data || []);
    } catch (err) {
      setError(
        err?.code === 'ECONNABORTED'
          ? 'Request timed out. Please try again.'
          : 'Failed to load destination details.'
      );
    } finally {
      setLoading(false);
    }
  }, [destinationId]);

  const fetchRecommendations = useCallback(async () => {
    if (!destinationId) return;
    try {
      const recParams = {};
      if (prefs.interests.length) recParams.interests = prefs.interests.join(',');
      if (prefs.season) recParams.season = prefs.season;
      const recRes = await destinationService.getRecommendations(destinationId, recParams);
      setRecommendations(recRes.data);
    } catch {
      setRecommendations([]);
    }
  }, [destinationId, prefs]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchRecommendations(); }, [fetchRecommendations]);
  useAppDataSync(fetchData);

  const updatePrefs = (next) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
  };

  const toggleInterest = (value) => {
    const interests = prefs.interests.includes(value)
      ? prefs.interests.filter((i) => i !== value)
      : [...prefs.interests, value];
    updatePrefs({ interests });
  };

  const handleBookClick = (hotel) => {
    if (!isAuthenticated()) { onNavigate('auth'); return; }
    setSelectedHotel(hotel);
    setIsBookingOpen(true);
  };

  const avgRating = hotels.length
    ? (hotels.reduce((s, h) => s + parseFloat(h.rating || 0), 0) / hotels.length).toFixed(1)
    : null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
    </div>
  );

  if (!destination) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-800">{error || 'Destination not found'}</h2>
      <Button onClick={() => onNavigate('destination-results')} className="mt-4">Back to Destinations</Button>
    </div>
  );

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!storedUser) return toast.error('Please log in to submit a review.');
    if (storedUser.role !== 'user') return toast.error('Only travelers can submit reviews.');
    if (!reviewForm.rating) return toast.error('Please select a star rating.');
    if (!reviewForm.comment.trim()) return toast.error('Please write a comment.');
    try {
      setSubmittingReview(true);
      const res = await reviewService.createDestinationReview(destinationId, {
        rating: reviewForm.rating,
        title: reviewForm.title.trim(),
        comment: reviewForm.comment.trim(),
      });
      setDestReviews(prev => [res.data, ...prev]);
      setReviewForm({ rating: 0, title: '', comment: '' });
      toast.success('Review submitted. Thank you!');
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || err.response?.data?.error || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgDestRating = destReviews.length
    ? (destReviews.reduce((s, r) => s + r.rating, 0) / destReviews.length).toFixed(1)
    : null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'hotels', label: `Hotels (${hotels.length})` },
    { id: 'packages', label: `Packages (${packages.length})` },
    { id: 'reviews', label: `Reviews (${destReviews.length})` },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative h-[460px] w-full overflow-hidden">
        <img
          src={getDestinationImage(destination)}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        <div className="absolute top-6 left-6 z-10">
          <Button
            onClick={() => onNavigate('destination-results')}
            className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Destinations
          </Button>
        </div>

        <div className="absolute bottom-10 left-10 right-10 text-white z-10">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge className="bg-blue-600 text-white border-none px-3 py-1">{destination.province}</Badge>
            {avgRating && (
              <span className="flex items-center gap-1 bg-emerald-500/90 text-white text-sm font-bold px-3 py-1 rounded-full">
                <Star className="h-3.5 w-3.5 fill-white" /> {avgRating} / 5.0
              </span>
            )}
            {destination.best_time_to_visit && (
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/30">
                <Calendar className="h-3 w-3" /> Best: {destination.best_time_to_visit}
              </span>
            )}
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">{destination.name}</h1>
          <p className="mt-2 text-base opacity-80 max-w-3xl line-clamp-2">{destination.description}</p>

          <div className="flex items-center gap-6 mt-4 text-sm text-white/80">
            {hotels.length > 0 && (
              <span className="flex items-center gap-1.5"><Hotel className="h-4 w-4" />{hotels.length} hotel{hotels.length !== 1 ? 's' : ''}</span>
            )}
            {packages.length > 0 && (
              <span className="flex items-center gap-1.5"><Package className="h-4 w-4" />{packages.length} package{packages.length !== 1 ? 's' : ''}</span>
            )}
            {destination.highlights?.length > 0 && (
              <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" />{destination.highlights.length} highlight{destination.highlights.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About {destination.name}</h2>
                  <p className="text-gray-700 leading-relaxed text-base">{destination.description}</p>

                  {destination.highlights?.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Highlights</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {destination.highlights.map((h, i) => (
                          <div key={i} className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <span className="text-blue-900 font-medium text-sm">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <Hotel className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{hotels.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Hotels</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <Package className="h-6 w-6 text-violet-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{packages.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Tour Packages</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <TrendingUp className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{destination.highlights?.length || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Attractions</p>
                  </div>
                </div>

                {/* Featured hotels preview */}
                {hotels.length > 0 && (
                  <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-gray-900">Top Hotels</h3>
                      <button
                        onClick={() => setActiveTab('hotels')}
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        View all <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {hotels.slice(0, 2).map(hotel => (
                        <div key={hotel.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={hotel.image || 'https://via.placeholder.com/100'} alt={hotel.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{hotel.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Rs. {hotel.price_per_night?.toLocaleString()} / night</p>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                            <Star className="h-3.5 w-3.5 fill-current" /> {hotel.rating || '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Featured packages preview */}
                {packages.length > 0 && (
                  <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-gray-900">Tour Packages</h3>
                      <button
                        onClick={() => setActiveTab('packages')}
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        View all <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {packages.slice(0, 2).map(pkg => (
                        <div key={pkg.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-violet-200 transition-colors">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-violet-50 flex items-center justify-center">
                            {pkg.image_url
                              ? <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover" />
                              : <Package className="h-6 w-6 text-violet-400" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{pkg.name}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{pkg.duration_days}d</span>
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" />max {pkg.max_people}</span>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-violet-700 flex-shrink-0">Rs. {pkg.price?.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* Hotels Tab */}
            {activeTab === 'hotels' && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Where to Stay</h2>
                    <p className="text-gray-500 text-sm mt-1">{hotels.length} verified propert{hotels.length === 1 ? 'y' : 'ies'}</p>
                  </div>
                  {avgRating && (
                    <div className="text-center">
                      <p className="text-3xl font-extrabold text-gray-900">{avgRating}</p>
                      <p className="text-xs text-gray-500">avg rating</p>
                    </div>
                  )}
                </div>

                {hotels.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Hotel className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No accommodations listed yet.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {hotels.map(hotel => (
                      <div key={hotel.id} className="flex flex-col md:flex-row gap-5 p-5 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors hover:shadow-md group">
                        <div className="w-full md:w-56 h-44 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={hotel.image_url || hotel.image || 'https://via.placeholder.com/400x300'}
                            alt={hotel.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{hotel.name}</h3>
                                <div className="flex items-center gap-1.5 mt-1 text-sm text-blue-600">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{hotel.address || destination.name}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-sm font-bold flex-shrink-0">
                                <Star className="h-3.5 w-3.5 fill-current" /> {hotel.rating || '—'}
                              </div>
                            </div>
                            {hotel.description && (
                              <p className="mt-3 text-sm text-gray-600 line-clamp-2">{hotel.description}</p>
                            )}
                            {hotel.amenities?.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {hotel.amenities.slice(0, 5).map((a, i) => (
                                  <span key={i} className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">{a}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-100">
                            <div>
                              <p className="text-xs text-gray-400">Starting from</p>
                              <p className="text-xl font-bold text-gray-900">Rs. {hotel.price_per_night?.toLocaleString()}</p>
                              <p className="text-xs text-gray-400">per night</p>
                            </div>
                            <Button onClick={() => handleBookClick(hotel)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Packages Tab */}
            {activeTab === 'packages' && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Tour Packages</h2>
                  <p className="text-gray-500 text-sm mt-1">{packages.length} package{packages.length !== 1 ? 's' : ''} available for {destination.name}</p>
                </div>

                {packages.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No tour packages available yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {packages.map(pkg => (
                      <div key={pkg.id} className="rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all overflow-hidden group flex flex-col">
                        <div className="h-40 overflow-hidden bg-violet-50 relative">
                          {pkg.image_url
                            ? <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            : <div className="w-full h-full flex items-center justify-center"><Package className="h-12 w-12 text-violet-200" /></div>
                          }
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                            <p className="text-white font-bold text-sm drop-shadow leading-tight">{pkg.name}</p>
                            <span className="bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                              {pkg.duration_days}d
                            </span>
                          </div>
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          {pkg.description && (
                            <p className="text-sm text-gray-600 line-clamp-3 mb-3">{pkg.description}</p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-violet-400" />{pkg.duration_days} days</span>
                            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-violet-400" />Max {pkg.max_people} people</span>
                          </div>

                          {pkg.included_services?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Included</p>
                              <div className="flex flex-wrap gap-1">
                                {pkg.included_services.slice(0, 4).map((s, i) => (
                                  <span key={i} className="flex items-center gap-0.5 text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
                                    <CheckCircle className="h-2.5 w-2.5" /> {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {pkg.itinerary && (
                            <div className="mb-3">
                              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Itinerary</p>
                              <p className="text-xs text-gray-600 line-clamp-3">{pkg.itinerary}</p>
                            </div>
                          )}

                          <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-400">Package price</p>
                              <p className="text-lg font-bold text-violet-700">Rs. {pkg.price?.toLocaleString()}</p>
                            </div>
                            <Button
                              size="sm"
                              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold"
                              onClick={() => { if (!isAuthenticated()) { onNavigate('auth'); } }}
                            >
                              Book Package
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">

                {/* Summary */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-5xl font-extrabold text-gray-900">{avgDestRating ?? '—'}</p>
                    <div className="flex justify-center gap-0.5 mt-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgDestRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{destReviews.length} review{destReviews.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5,4,3,2,1].map(s => {
                      const count = destReviews.filter(r => r.rating === s).length;
                      const pct = destReviews.length ? Math.round((count / destReviews.length) * 100) : 0;
                      return (
                        <div key={s} className="flex items-center gap-2 text-sm">
                          <span className="w-3 text-gray-500">{s}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-6 text-right text-gray-400 text-xs">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Submit form (users only) */}
                {storedUser?.role === 'user' && (
                  <div className="border border-dashed border-gray-200 rounded-xl p-5 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" /> Write a Review
                    </h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      {/* Star picker */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1.5">Your Rating</p>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(s => (
                            <Star
                              key={s}
                              className={`h-7 w-7 cursor-pointer transition-colors ${s <= (reviewHover || reviewForm.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}
                              onMouseEnter={() => setReviewHover(s)}
                              onMouseLeave={() => setReviewHover(0)}
                              onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Review title (optional)"
                          value={reviewForm.title}
                          onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <textarea
                          placeholder="Share your experience at this destination..."
                          value={reviewForm.comment}
                          onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                          rows={3}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                          required
                        />
                      </div>
                      <Button type="submit" disabled={submittingReview} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        {submittingReview ? 'Submitting…' : 'Submit Review'}
                      </Button>
                    </form>
                  </div>
                )}

                {!storedUser && (
                  <div className="text-center py-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-700">
                      <button onClick={() => onNavigate('auth')} className="font-semibold underline">Log in</button>
                      {' '}to leave a review for this destination.
                    </p>
                  </div>
                )}

                {/* Review list */}
                {destReviews.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No reviews yet. Be the first to share your experience!</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {destReviews.map(review => (
                      <div key={review.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {review.user_initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-gray-900 text-sm">{review.username}</p>
                            <span className="text-xs text-gray-400 flex-shrink-0">{new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          {review.title && <p className="text-sm font-medium text-gray-800 mt-1">{review.title}</p>}
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{review.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Map */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 flex items-center gap-2">
                <MapIcon className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-gray-900">Location</h3>
              </div>
              <div className="h-56 w-full">
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
              <div className="p-3 bg-gray-50">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {destination.name}, {destination.province}
                </p>
              </div>
            </section>

            {/* Best time & tips */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" /> Travel Information
              </h3>
              <div className="space-y-3">
                {destination.best_time_to_visit && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                    <Calendar className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-700">Best Time to Visit</p>
                      <p className="text-sm text-blue-900 font-medium mt-0.5">{destination.best_time_to_visit}</p>
                    </div>
                  </div>
                )}
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    Book popular hotels at least 2 weeks in advance during peak season.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    Pack light layers — temperatures vary significantly with altitude.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    Carry cash; ATMs may be limited in remote areas.
                  </li>
                </ul>
              </div>
            </section>

            {/* Weather summary */}
            <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-5 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2"><CloudSun className="h-5 w-5" /> Weather</h3>
                  <Badge className="bg-white/20 text-white border-none text-xs">Typical</Badge>
                </div>
                <p className="text-sm opacity-80 mb-4">
                  {destination.best_time_to_visit
                    ? `Best visited during ${destination.best_time_to_visit}. Weather varies by elevation.`
                    : 'Weather varies significantly by altitude and season.'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-wider opacity-70 mb-1">Climate</p>
                    <p className="font-semibold text-sm">Himalayan</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-wider opacity-70 mb-1">Altitude</p>
                    <p className="font-semibold text-sm">Varies</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
            </section>

            {/* AI Recommendations */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" /> You Might Also Like
                </h3>
                <button
                  onClick={() => setShowPrefs(s => !s)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 transition-colors"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {showPrefs ? 'Hide' : 'Personalise'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-3">AI-picked based on your preferences</p>

              {showPrefs && (
                <div className="mb-4 p-3 bg-violet-50/60 rounded-xl border border-violet-100 space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider mb-2">Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {INTEREST_OPTIONS.map(({ label, value }) => {
                        const active = prefs.interests.includes(value);
                        return (
                          <button
                            key={value}
                            onClick={() => toggleInterest(value)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                              active ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider mb-2">Season</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SEASON_OPTIONS.map(({ label, value, hint }) => {
                        const active = prefs.season === value;
                        return (
                          <button
                            key={value}
                            onClick={() => updatePrefs({ season: active ? '' : value })}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                              active ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
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

              {recommendations.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No similar destinations found.</p>
              ) : (
                <div className="space-y-2">
                  {recommendations.map(rec => (
                    <button
                      key={rec.id}
                      onClick={() => onSelectDestination ? onSelectDestination(rec.id) : onNavigate('destination-detail', rec.id)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50/40 transition-colors text-left group"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={getDestinationImage(rec)} alt={rec.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{rec.name}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{rec.province}</span>
                        </div>
                        {rec.ai_reason && (
                          <p className="text-xs text-violet-600 mt-0.5 line-clamp-1 italic">{rec.ai_reason}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {selectedHotel && (
        <BookingModal
          hotel={selectedHotel}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          onSuccess={() => {
            notifyAppDataChanged();
            fetchData();
            alert('Booking successful!');
          }}
        />
      )}
    </div>
  );
}

export default DestinationDetail;

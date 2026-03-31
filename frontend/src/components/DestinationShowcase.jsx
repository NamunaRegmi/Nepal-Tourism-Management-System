import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DestinationShowcase = ({ destinations = [], loading, onSelectDestination, hideTrendingTitle = false }) => {
  const [activePlannerTab, setActivePlannerTab] = useState('Photography');
  const plannerScrollRef = useRef(null);
  const exploreScrollRef = useRef(null);

  const imgData = {
    ktm: 'https://media.greenvalleynepaltreks.com/uploads/fullbanner/pashupatinath-temple-kathmandu.webp',
    patan: '/assets/patan_new.jpg',
    bhaktapur: 'https://images.pexels.com/photos/14367176/pexels-photo-14367176.jpeg?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200',
    nagarkot: '/assets/nagarkot_new.jpg',
    sauraha: '/assets/sauraha.jpg',
    bandipur: '/assets/bandipur.jpg',
    pokhara: 'https://lp-cms-production.imgix.net/2019-06/53693064.jpg',
    lumbini: '/assets/lumbini.jpg',
    everest: 'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=800',
    mustang: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=800',
    rara: '/assets/rara.jpg',
    gorkha: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
  };

  const plannerDestinationsMap = {
    'Photography': [
      { name: 'Kathmandu', distance: '1.4 km away', image: imgData.ktm, id: 1 },
      { name: 'Patan', distance: '5 km away', image: imgData.patan, id: 2 },
      { name: 'Bhaktapur', distance: '11 km away', image: imgData.bhaktapur, id: 3 },
      { name: 'Nagarkot', distance: '19 km away', image: imgData.nagarkot, id: 4 },
      { name: 'Sauraha', distance: '83 km away', image: imgData.sauraha, id: 5 },
      { name: 'Bandipur', distance: '93 km away', image: imgData.bandipur, id: 6 },
      { name: 'Pokhara', distance: '200 km away', image: imgData.pokhara, id: 7 },
      { name: 'Mustang', distance: '400 km away', image: imgData.mustang, id: 8 },
      { name: 'Rara Lake', distance: '450 km away', image: imgData.rara, id: 9 },
    ],
    'Historical Expeditions': [
      { name: 'Bhaktapur', distance: '11 km away', image: imgData.bhaktapur, id: 3 },
      { name: 'Lumbini', distance: '170 km away', image: imgData.lumbini, id: 10 },
      { name: 'Patan', distance: '5 km away', image: imgData.patan, id: 2 },
      { name: 'Kathmandu', distance: '1.4 km away', image: imgData.ktm, id: 1 },
      { name: 'Gorkha', distance: '80 km away', image: imgData.gorkha, id: 11 },
      { name: 'Bandipur', distance: '93 km away', image: imgData.bandipur, id: 6 },
      { name: 'Pokhara', distance: '141 km away', image: imgData.pokhara, id: 7 },
      { name: 'Nagarkot', distance: '19 km away', image: imgData.nagarkot, id: 4 },
    ],
    'Adventurous Activities': [
      { name: 'Pokhara', distance: '141 km away', image: imgData.pokhara, id: 7 },
      { name: 'Sauraha', distance: '85 km away', image: imgData.sauraha, id: 5 },
      { name: 'Mustang', distance: '200 km away', image: imgData.mustang, id: 8 },
      { name: 'Everest', distance: '180 km away', image: imgData.everest, id: 12 },
      { name: 'Nagarkot', distance: '19 km away', image: imgData.nagarkot, id: 4 },
      { name: 'Gorkha', distance: '80 km away', image: imgData.gorkha, id: 11 },
      { name: 'Bandipur', distance: '93 km away', image: imgData.bandipur, id: 6 },
      { name: 'Rara Lake', distance: '450 km away', image: imgData.rara, id: 9 },
    ],
    'Nature & Relaxation': [
      { name: 'Sauraha', distance: '83 km away', image: imgData.sauraha, id: 5 },
      { name: 'Bandipur', distance: '93 km away', image: imgData.bandipur, id: 6 },
      { name: 'Pokhara', distance: '141 km away', image: imgData.pokhara, id: 7 },
      { name: 'Rara Lake', distance: '450 km away', image: imgData.rara, id: 9 },
      { name: 'Nagarkot', distance: '19 km away', image: imgData.nagarkot, id: 4 },
      { name: 'Mustang', distance: '200 km away', image: imgData.mustang, id: 8 },
      { name: 'Lumbini', distance: '170 km away', image: imgData.lumbini, id: 10 },
      { name: 'Everest', distance: '180 km away', image: imgData.everest, id: 12 },
    ],
    'Hiking Adventures': [
      { name: 'Nagarkot', distance: '19 km away', image: imgData.nagarkot, id: 4 },
      { name: 'Everest Base Camp', distance: '180 km away', image: imgData.everest, id: 12 },
      { name: 'Mustang', distance: '200 km away', image: imgData.mustang, id: 8 },
      { name: 'Pokhara Area', distance: '141 km away', image: imgData.pokhara, id: 7 },
      { name: 'Gorkha Trails', distance: '80 km away', image: imgData.gorkha, id: 11 },
      { name: 'Bandipur', distance: '93 km away', image: imgData.bandipur, id: 6 },
      { name: 'Sauraha', distance: '83 km away', image: imgData.sauraha, id: 5 },
      { name: 'Rara Lake', distance: '450 km away', image: imgData.rara, id: 9 },
    ]
  };

  const getDestinationMeta = (dest) => {
    const lower = dest.name?.toLowerCase() || '';
    const base = {
      image: dest.image,
    };
    if (lower.includes('kathmandu')) return { image: imgData.ktm };
    if (lower.includes('pokhara')) return { image: imgData.pokhara };
    if (lower.includes('chitwan')) return { image: 'https://wallpaperbat.com/img/33765-shafir-image-night-kathmandu.jpg' };
    if (lower.includes('manang')) return { image: '/assets/manang.png' };
    if (lower.includes('mustang')) return { image: imgData.mustang };
    if (lower.includes('lumbini')) return { image: imgData.lumbini };
    if (lower.includes('everest')) return { image: imgData.everest };
    return base;
  };

  const currentPlannerDestinations = plannerDestinationsMap[activePlannerTab] || [];
  const scrollRight = (ref) => ref.current?.scrollBy({ left: 300, behavior: 'smooth' });
  const scrollLeft = (ref) => ref.current?.scrollBy({ left: -300, behavior: 'smooth' });

  if (loading) {
    return <div className="text-slate-600 px-6 py-10 w-full text-center">Loading destinations...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-10">
      {!hideTrendingTitle && (
        <div className="mb-6">
          <h3 className="text-4xl font-semibold tracking-tight text-gray-900">Trending destinations</h3>
          <p className="text-gray-500 font-medium mt-2">Most popular choices for travelers from Nepal</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {destinations
          .slice(0, 5)
          .map((dest, i) => {
            const meta = getDestinationMeta(dest);
            const isTopRow = (i % 5) < 2;
            const colSpanClass = isTopRow ? "md:col-span-3" : "md:col-span-2";

            const lower = dest.name?.toLowerCase() || '';
            let flagCode = 'np';
            let propertyText = 'properties';
            if (lower.includes('hotel')) {
              propertyText = 'hotels & resorts';
            } else if (lower.includes('apartment')) {
              propertyText = 'apartments & suites';
            } else if (lower.includes('resort')) {
              propertyText = 'resorts & villas';
            } else if (lower.includes('villa')) {
              propertyText = 'villas & cottages';
            }

            if (lower.includes('bangkok') || lower.includes('thailand')) flagCode = 'th';
            if (lower.includes('delhi') || lower.includes('india')) flagCode = 'in';

            return (
              <div
                key={dest.id || i}
                className={`${colSpanClass} relative rounded-xl overflow-hidden cursor-pointer group h-64 md:h-[280px] shadow-sm bg-gray-100`}
                onClick={() => onSelectDestination && onSelectDestination(dest.id)}
              >
                <img
                  src={meta.image || dest.image || 'https://via.placeholder.com/600x320'}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-transparent pointer-events-none opacity-90"></div>

                <div className="absolute top-4 left-4 flex items-center pointer-events-none">
                  <h4 className="text-white text-xl font-bold mr-2 drop-shadow-md">{dest.name}</h4>
                  <img src={`https://flagcdn.com/w40/${flagCode}.png`} alt={`${flagCode} flag`} className="w-6 h-auto shadow-sm object-contain" />
                </div>
              </div>
            );
          })}
      </div>

      <div className="mt-12">
        <h3 className="text-2xl font-bold text-gray-900">Quick and easy trip planner</h3>
        <p className="text-gray-700 mb-4 mt-2 text-lg">Pick a vibe and explore the top destinations in Nepal</p>

        <div className="flex gap-3 overflow-x-auto pb-2 mb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {Object.keys(plannerDestinationsMap).map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActivePlannerTab(tab)}
              className={`whitespace-nowrap px-6 py-3 rounded-full text-base font-medium transition-colors ${activePlannerTab === tab
                ? 'border-2 border-blue-600 text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative group">
          <button
            onClick={() => scrollLeft(plannerScrollRef)}
            className="absolute -left-5 top-[40%] z-10 w-10 h-10 bg-white border border-gray-100 shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div ref={plannerScrollRef} className="flex gap-4 overflow-x-auto pb-6 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {currentPlannerDestinations.map((dest, i) => {
              const lower = dest.name?.toLowerCase() || '';
              let propertyText = 'properties';
              if (lower.includes('hotel')) {
                propertyText = 'hotels & resorts';
              } else if (lower.includes('apartment')) {
                propertyText = 'apartments & suites';
              } else if (lower.includes('resort')) {
                propertyText = 'resorts & villas';
              } else if (lower.includes('villa')) {
                propertyText = 'villas & cottages';
              }
              return (
                <div key={i} className="min-w-[180px] md:min-w-[220px] lg:min-w-[240px] snap-start cursor-pointer group/card" onClick={() => onSelectDestination && onSelectDestination(dest.id || 1)}>
                  <div className="w-full h-40 md:h-48 rounded-2xl overflow-hidden mb-4">
                    <img src={dest.image || 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'} alt={dest.name} className="w-full h-full object-cover transition duration-300 group-hover/card:scale-105" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2 text-gray-900">{dest.name}</h4>
                  <p className="text-base text-gray-600 mt-1">{dest.distance}</p>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => scrollRight(plannerScrollRef)}
            className="absolute -right-5 top-[40%] z-10 w-10 h-10 bg-white border border-gray-100 shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="text-2xl font-bold text-gray-900">Explore Nepal</h3>
        <p className="text-gray-700 mb-4 mt-2 text-lg">These popular destinations have a lot to offer</p>

        <div className="relative group">
          <button
            onClick={() => scrollLeft(exploreScrollRef)}
            className="absolute -left-5 top-[40%] z-10 w-10 h-10 bg-white border border-gray-100 shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div ref={exploreScrollRef} className="flex gap-4 overflow-x-auto pb-6 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[
              { name: 'Kathmandu', properties: '1,180 properties', image: imgData.ktm, id: 1 },
              { name: 'Pokhara', properties: '505 properties', image: imgData.pokhara, id: 2 },
              { name: 'Patan', properties: '240 properties', image: imgData.patan, id: 3 },
              { name: 'Nagarkot', properties: '80 properties', image: imgData.nagarkot, id: 4 },
              { name: 'Sauraha', properties: '118 properties', image: imgData.sauraha, id: 5 },
              { name: 'Bhaktapur', properties: '98 properties', image: imgData.bhaktapur, id: 6 },
              { name: 'Lumbini', properties: '75 properties', image: imgData.lumbini, id: 7 },
              { name: 'Mustang', properties: '45 properties', image: imgData.mustang, id: 8 },
              { name: 'Bandipur', properties: '30 properties', image: imgData.bandipur, id: 9 },
              { name: 'Rara Lake', properties: '12 properties', image: imgData.rara, id: 10 },
            ].map((dest, i) => (
              <div key={i} className="min-w-[180px] md:min-w-[220px] lg:min-w-[240px] snap-start cursor-pointer group/card" onClick={() => onSelectDestination && onSelectDestination(dest.id)}>
                <div className="w-full h-40 md:h-48 rounded-2xl overflow-hidden mb-4">
                  <img src={dest.image} alt={dest.name} className="w-full h-full object-cover transition duration-300 group-hover/card:scale-105" />
                </div>
                <h4 className="font-semibold text-gray-900 text-lg">{dest.name}</h4>
                <p className="text-base text-gray-600 mt-1">{dest.properties}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => scrollRight(exploreScrollRef)}
            className="absolute -right-5 top-[40%] z-10 w-10 h-10 bg-white border border-gray-100 shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinationShowcase;

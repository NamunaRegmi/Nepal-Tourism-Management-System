import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function UserDashboard({ onNavigate, onSelectDestination }) {
  const [user] = useState(() => {
    const userData = localStorage.getItem('user');
    if (!userData) return null;

    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!user) {
      onNavigate('home');
    }
  }, [onNavigate, user]);

  const handleLogout = () => {
    localStorage.clear();
    onNavigate('home');
  };

  const destinations = [
    {
      id: 1,
      name: 'Kathmandu',
      image: 'https://images.unsplash.com/photo-1600530254478-218ab6c6d067?w=1200',
      flag: '🇳🇵',
      description: 'Historic temples and bustling markets'
    },
    {
      id: 2,
      name: 'Pokhara',
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200',
      flag: '🇳🇵',
      description: 'Gateway to the Annapurna Circuit'
    },
    {
      id: 3,
      name: 'Bangkok',
      image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800',
      flag: '🇹🇭',
      description: 'Vibrant street life and ornate shrines'
    },
    {
      id: 4,
      name: 'New Delhi',
      image: 'https://images.unsplash.com/photo-1587474260580-50fadb31a0e1?w=800',
      flag: '🇮🇳',
      description: 'Historical monuments and bustling markets'
    },
    {
      id: 5,
      name: 'Patan',
      image: 'https://images.unsplash.com/photo-1542347395-5ad10a62abeb?w=800',
      flag: '🇳🇵',
      description: 'City of fine arts and architecture'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🏔️ Nepal Tourism</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.name || user?.email}!</span>
            <Button onClick={handleLogout} variant="outline" className="text-purple-600 bg-white hover:bg-gray-100">
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Explore Nepal's Beauty</h2>
          <p className="text-xl">Discover breathtaking destinations and plan your perfect adventure</p>
        </div>
      </div>

      {/* Trending Destinations Booking.com Style Grid */}
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h3 className="text-2xl font-bold text-gray-900">Trending destinations</h3>
        <p className="text-gray-500 mb-6 font-medium">Most popular choices for travelers from Nepal</p>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {destinations.map((destination, index) => {
            // First 2 items span 3 columns each (half width). Next items span 2 columns (one-third width).
            const isTopRow = index < 2;
            const colSpanClass = isTopRow ? "md:col-span-3" : "md:col-span-2";
            
            return (
              <div 
                key={destination.id} 
                className={`${colSpanClass} relative rounded-xl overflow-hidden cursor-pointer group h-64 md:h-[280px] shadow-sm`}
                onClick={() => onSelectDestination(destination.id)}
              >
                <img 
                  src={destination.image} 
                  alt={destination.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Gradient overlay from top */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-transparent pointer-events-none"></div>
                
                {/* Title and Flag */}
                <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
                  <h4 className="text-white text-2xl font-bold">{destination.name}</h4>
                  {destination.flag && <span className="text-xl">{destination.flag}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;

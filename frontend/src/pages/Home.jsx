import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState({ topHotels: [], popularRestaurants: [], famousCruises: [] });
  const [searchCity, setSearchCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState({});

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

  const fetchRecommendations = async (city = '') => {
    setLoading(true);
    try {
      const url = city ? `${API_BASE}/recommendations?city=${encodeURIComponent(city)}` : `${API_BASE}/recommendations`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchCity.trim();
    if (!query) return;
    // Refresh the homepage recommendation rails for this city...
    fetchRecommendations(query);
    // ...and take the user to real, database-backed search results.
    navigate(`/hotels?destination=${encodeURIComponent(query)}`);
  };

  const getImage = (url, fallbackQuery) => {
    if (url && url.startsWith('http')) return url;
    if (fallbackQuery) {
      return `https://source.unsplash.com/featured/600x400/?${encodeURIComponent(fallbackQuery)}`;
    }
    return 'https://placehold.co/600x400?text=No+Image';
  };

  // ---- Data ----
  const destinations = [
    {
      id: 'rome',
      name: 'Rome',
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=400&fit=crop',
      activities: ["Rome's secret catacombs", 'Pizza making classes', 'Explore Rome by night']
    },
    {
      id: 'oahu',
      name: 'Oahu',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop',
      activities: ['Marine wildlife adventures', "A taste of Oahu food & culture", "Surf Hawaii's iconic waves"]
    },
    {
      id: 'nyc',
      name: 'New York City',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop',
      activities: ['NYC art & museums', 'Broadway shows & NYC stages', 'NY pizza crawls']
    },
    {
      id: 'vegas',
      name: 'Las Vegas',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQk8r43I-NHDNHrpOaLnYImG3hPGG32Jq-KCPSIIxhuA&s=10',
      activities: ['Emerald cave by kayak', 'Magical Vegas entertainment', 'Red Rock adventures']
    },
    {
      id: 'barcelona',
      name: 'Barcelona',
      // Verified working URL
      image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&h=400&fit=crop',
      activities: ['Barcelona cuisine up close']
    },
    {
      id: 'tokyo',
      name: 'Tokyo',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop',
      activities: ['Sumo tradition and culture']
    }
  ];

  const categories = [
    { id: 'hills', label: 'Hills', image: '/images/backgrounds/hill1.jpeg' },
    { id: 'jungle', label: 'Jungle', image: '/images/backgrounds/jungle1.jpeg' },
    { id: 'underwater', label: 'Underwater', image: '/images/backgrounds/sea8.jpeg' },
    { id: 'seashore', label: 'Seashore', image: '/images/backgrounds/sea6.jpeg' },
    { id: 'roads', label: 'Roads', image: '/images/backgrounds/sky5.jpeg' }
  ];

  // Iconic Attractions
  const iconicAttractions = [
    {
      id: 'barcelona',
      name: 'Barcelona',
      attraction: 'Basílica de la Sagrada FamíliaBas',
      rating: 4.7,
      reviews: 167970,
      category: 'Sights & Landmarks',
      price: 34,
      // Verified working URL
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpWmOUZdcVYSG0BZ7hkGpdviFmeUc1EdSKpg_B6nLsIQ&s=10',
    },
    {
      id: 'rome',
      name: 'Rome',
      attraction: 'Colosseum',
      rating: 4.6,
      reviews: 151255,
      category: 'Sights & Landmarks',
      price: 32,
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=400&fit=crop',
    },
    {
      id: 'paris',
      name: 'Paris',
      attraction: 'Eiffel Tower',
      rating: 4.6,
      reviews: 144051,
      category: 'Sights & Landmarks',
      price: 45,
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop',
    }
  ];

  const toggleLike = (id) => {
    setLiked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Rating circles
  const renderRatingCircles = (rating) => {
    const full = Math.floor(rating);
    const fraction = rating - full;
    const total = 5;
    const circles = [];

    for (let i = 0; i < total; i++) {
      let fill = 0;
      if (i < full) fill = 1;
      else if (i === full && fraction > 0) fill = fraction;

      circles.push(
        <div key={i} className="w-3 h-3 rounded-full border border-teal-500 overflow-hidden flex-shrink-0">
          {fill > 0 && (
            <div
              className="h-full bg-teal-500"
              style={{ width: `${fill * 100}%` }}
            />
          )}
        </div>
      );
    }
    return circles;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* ===== HERO ===== */}
      <div 
        className="relative w-full h-[75vh] flex items-center"
        style={{ 
          backgroundImage: `url(/images/backgrounds/sea1.jpeg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 md:px-10 text-left text-white">
          <h1 
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            Where to next?
          </h1>
          <p 
            className="text-base md:text-lg text-gray-200 mt-2 max-w-xl"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Discover top-rated hotels, dining experiences, and travel packages.
          </p>

          <form onSubmit={handleSearch} className="mt-6 max-w-md">
            <div className="flex">
              <input
                type="text"
                placeholder="Search by city (e.g., Paris, Tokyo)..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full p-3 rounded-l-full text-gray-900 focus:outline-none px-5 border-0 shadow-md"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              />
              <button 
                type="submit" 
                className="bg-emerald-500 hover:bg-emerald-600 font-semibold px-6 rounded-r-full text-white transition shadow-md"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===== EXPLORE BY CATEGORY ===== */}
      <div className="w-full bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 
            className="text-2xl font-bold text-gray-900 mb-6"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Explore by category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="relative h-48 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
              >
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url(${cat.image})` }}
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span 
                    className="text-white text-lg font-bold drop-shadow-md"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    {cat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== THINGS TO DO ===== */}
      <div className="w-full bg-blue-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 
            className="text-2xl font-bold text-gray-900 mb-6"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Things to Do
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((dest) => (
              <div
                key={dest.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 relative"
              >
                <button
                  onClick={() => toggleLike(dest.id)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-xl shadow-md hover:bg-white transition-colors"
                  aria-label={liked[dest.id] ? 'Unlike' : 'Like'}
                >
                  {liked[dest.id] ? '♥️': '♡'}
                </button>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getImage(dest.image, dest.name)}
                    alt={dest.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/600x400/1e293b/ffffff?text=Image+Unavailable';
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <h3 className="text-white text-xl font-bold" style={{ fontFamily: "'Nunito', sans-serif" }}>
                      {dest.name}
                    </h3>
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  {dest.activities.map((activity, idx) => (
                    <p key={idx} className="text-sm text-gray-700 flex items-start gap-2" style={{ fontFamily: "'Nunito', sans-serif" }}>
                      <span className="text-emerald-500 mt-0.5">•</span>
                      {activity}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== ICONIC ATTRACTIONS WORLDWIDE ===== */}
      <div className="w-full bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 
            className="text-2xl font-bold text-gray-900 mb-6"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Iconic attractions worldwide
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {iconicAttractions.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getImage(item.image, item.attraction)}
                    alt={item.attraction}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/600x400/1e293b/ffffff?text=Image+Unavailable';
                    }}
                  />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-gray-900 text-lg leading-snug" style={{ fontFamily: "'Nunito', sans-serif" }}>
                    {item.attraction}
                  </h3>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "'Nunito', sans-serif" }}>
                    {item.name}
                  </p>
                  <div className="flex items-center gap-1">
                    {renderRatingCircles(item.rating)}
                    <span className="text-sm font-semibold text-gray-700 ml-1" style={{ fontFamily: "'Nunito', sans-serif" }}>
                      {item.rating}
                    </span>
                    <span className="text-xs text-gray-500" style={{ fontFamily: "'Nunito', sans-serif" }}>
                      ({item.reviews.toLocaleString()})
                    </span>
                  </div>
                  <p className="text-xs text-gray-500" style={{ fontFamily: "'Nunito', sans-serif" }}>
                    {item.category}
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-1" style={{ fontFamily: "'Nunito', sans-serif" }}>
                    from <span className="text-emerald-600">${item.price}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== RECOMMENDATIONS ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 space-y-12">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading recommended places...</div>
        ) : (
          <>
            {recommendations.topHotels?.length > 0 && (
              <div>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Recommended Hotels</h2>
                    <p className="text-sm text-gray-500">Stays with outstanding guest ratings.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendations.topHotels.map((hotel) => (
                    <div key={hotel.id} className="bg-white rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition">
                      <img 
                        src={getImage(hotel.image_url, 'hotel')} 
                        alt={hotel.name} 
                        className="w-full h-48 object-cover" 
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image';
                        }}
                      />
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-900 text-lg leading-snug">{hotel.name}</h3>
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded">★ {hotel.rating || '4.8'}</span>
                        </div>
                        <p className="text-xs text-gray-500">{hotel.city}, {hotel.country}</p>
                        <p className="text-sm font-bold text-gray-900 mt-2">${hotel.price} <span className="text-xs font-normal text-gray-500">/ night</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.popularRestaurants?.length > 0 && (
              <div>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Must-Visit Restaurants</h2>
                    <p className="text-sm text-gray-500">Popular dining spots loved by travelers.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendations.popularRestaurants.map((res) => (
                    <div key={res.id} className="bg-white rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition">
                      <img 
                        src={getImage(res.image_url, 'restaurant')} 
                        alt={res.name} 
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image';
                        }}
                      />
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-900 text-lg leading-snug">{res.name}</h3>
                          <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded">{res.cuisine_type || 'Dining'}</span>
                        </div>
                        <p className="text-xs text-gray-500">{res.city}, {res.country}</p>
                        <p className="text-sm font-bold text-gray-900 mt-2">~${res.price} <span className="text-xs font-normal text-gray-500">avg meal</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.famousCruises?.length > 0 && (
              <div>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Featured Packages & Cruises</h2>
                    <p className="text-sm text-gray-500">Top cruise routes and curated travel experiences.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendations.famousCruises.map((cruise) => (
                    <div key={cruise.id} className="bg-white rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition">
                      <img 
                        src={getImage(cruise.image_url, 'cruise ship')} 
                        alt={cruise.name} 
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image';
                        }}
                      />
                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-gray-900 text-lg leading-snug">{cruise.name}</h3>
                        <p className="text-xs text-gray-500">Route: {cruise.city} ➔ {cruise.country}</p>
                        <p className="text-sm font-bold text-gray-900 mt-2">${cruise.price} <span className="text-xs font-normal text-gray-500">/ person</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
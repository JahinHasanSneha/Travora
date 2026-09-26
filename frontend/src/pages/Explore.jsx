import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import MapView from '../components/MapView';
import AddToTripButton from '../components/AddToTripModal';

const DETAIL_PATH = { hotel: 'hotels', restaurant: 'restaurants', cruise: 'cruises' };

const TYPE_LABELS = { hotels: 'Hotels', restaurants: 'Restaurants', cruises: 'Cruises', attractions: 'Attractions' };
const TYPE_COLORS = {
  hotel: '#2563eb',
  restaurant: '#dc2626',
  cruise: '#16a34a',
  attraction: '#d97706',
};

export default function Explore() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [center, setCenter] = useState([48.8566, 2.3522]);
  const [radiusKm, setRadiusKm] = useState(10);
  const [results, setResults] = useState({ hotels: [], restaurants: [], cruises: [], attractions: [] });
  const [loading, setLoading] = useState(false);
  const [showCircle, setShowCircle] = useState(true);
  const mapRef = useRef(null);

  const searchCity = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const { data } = await client.get('/places/geocode', { params: { q: query } });
      setSuggestions(data);
    } catch (err) {
      console.error('Geocode error:', err);
    }
  };

  const pickSuggestion = async (s) => {
    setCenter([s.latitude, s.longitude]);
    setSuggestions([]);
    setQuery(s.display_name);
    await loadNearby(s.latitude, s.longitude);
  };

  const loadNearby = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const { data } = await client.get('/places/nearby', { params: { lat, lng, radius_km: radiusKm } });
      setResults(data.results);
    } catch (err) {
      console.error('Nearby error:', err);
    } finally {
      setLoading(false);
    }
  }, [radiusKm]);

  const onMapClick = async (latlng) => {
    setCenter([latlng.lat, latlng.lng]);
    await loadNearby(latlng.lat, latlng.lng);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCenter([latitude, longitude]);
        await loadNearby(latitude, longitude);
      },
      (err) => {
        alert('Unable to retrieve your location: ' + err.message);
      }
    );
  };

  const clearResults = () => {
    setResults({ hotels: [], restaurants: [], cruises: [], attractions: [] });
    setCenter([48.8566, 2.3522]);
    setQuery('');
  };

  const allResults = [
    ...results.hotels.map((h) => ({ ...h, type: 'hotel' })),
    ...results.restaurants.map((r) => ({ ...r, type: 'restaurant' })),
    ...results.cruises.map((c) => ({ ...c, type: 'cruise' })),
    ...results.attractions.map((a) => ({ ...a, type: 'attraction' })),
  ];

  const markers = allResults.map((item) => ({ ...item, place_type: item.type }));

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
      {/* Full‑page map */}
      <MapView
        ref={mapRef}
        center={center}
        markers={markers}
        onMapClick={onMapClick}
        height="100%"
        width="100%"
        circleCenter={showCircle ? center : null}
        circleRadius={showCircle ? radiusKm * 1000 : null}
        markerColors={TYPE_COLORS}
      />

      {/* Search bar – floating top left */}
      <div className="absolute top-4 left-4 right-4 md:left-6 md:right-6 z-20">
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-xl p-4 max-w-2xl mx-auto">
          <form onSubmit={searchCity} className="flex flex-wrap gap-2 relative">
            <div className="flex-1 min-w-[180px] relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a city, e.g. Paris"
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 bg-white/90 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white/90 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
            >
              {[5, 10, 20, 50].map((r) => <option key={r} value={r}>{r} km</option>)}
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleLocateMe}
              className="px-3 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors text-sm font-medium"
              title="My Location"
            >
              📍
            </button>

            {suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-[1000] max-h-56 overflow-auto">
                {suggestions.map((s, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => pickSuggestion(s)}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b border-gray-100 last:border-0"
                  >
                    {s.display_name}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Results list – floating right panel */}
      <div className="absolute top-20 right-4 bottom-4 w-80 max-w-full z-20 pointer-events-none">
        <div className="h-full pointer-events-auto bg-white/90 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden flex flex-col border border-white/20">
          <div className="flex items-center justify-between p-3 border-b border-gray-200/50">
            <h3 className="font-semibold text-gray-800 text-sm">
              Nearby Places
              <span className="text-xs font-normal text-gray-400 ml-1">({allResults.length})</span>
            </h3>
            <button
              onClick={clearResults}
              className="text-xs text-teal-600 hover:text-teal-800 font-medium transition"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {allResults.length === 0 && !loading ? (
              <p className="text-sm text-gray-400 text-center mt-8">Click the map or search to find places</p>
            ) : (
              allResults.map((item) => (
                <div key={item.id} className="border border-gray-100 rounded-lg p-2 hover:bg-white/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <div className="flex items-center gap-1 flex-wrap mt-0.5">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: TYPE_COLORS[item.type] || '#666' }}
                        >
                          {TYPE_LABELS[item.type + 's'] || item.type}
                        </span>
                        <span className="text-xs text-gray-500">{item.distance_km?.toFixed(1)} km</span>
                        {item.rating && <span className="text-xs text-gray-500">★ {item.rating}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                      {DETAIL_PATH[item.type] && (
                        <Link
                          to={`/${DETAIL_PATH[item.type]}/${item.id}`}
                          className="text-teal-600 hover:text-teal-800 text-xs font-medium"
                        >
                          View
                        </Link>
                      )}
                      <AddToTripButton
                        item={{ id: item.id, name: item.name, type: item.type }}
                        className="text-teal-700 hover:text-teal-900 text-xs font-medium underline"
                        label="+ Add"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <svg className="animate-spin h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Small legend – bottom left */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/80 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 text-xs text-gray-600 flex flex-wrap gap-2">
        <span className="font-medium mr-1">Legend:</span>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
            {TYPE_LABELS[type + 's'] || type}
          </span>
        ))}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';

const typeColor = {
  hotel: '#C98A3C',
  restaurant: '#B0473B',
  cruise: '#2C534C',
  attraction: '#0F1E1C',
};

export default function MapView({ 
  center = [48.8566, 2.3522], 
  zoom = 13, 
  markers = [], 
  onMarkerClick, 
  onMapClick, 
  height = '480px' 
}) {
  const [activeMarker, setActiveMarker] = useState(null);

  // Load Google Maps SDK using your Vite env key
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Convert array center [lat, lng] or object center { lat, lng } to Google Maps format
  const mapCenter = Array.isArray(center)
    ? { lat: Number(center[0]), lng: Number(center[1]) }
    : { lat: Number(center.lat), lng: Number(center.lng) };

  // Handle map click event
  const handleMapClick = (e) => {
    setActiveMarker(null);
    if (onMapClick && e.latLng) {
      onMapClick({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  };

  if (loadError) {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-sm border border-red-300 bg-red-50 text-red-600 text-sm">
        Error loading Google Maps. Please check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-sm border border-ink-900/15 bg-gray-100 text-sm text-gray-500">
        Loading Map...
      </div>
    );
  }

  return (
    <div style={{ height }} className="rounded-sm overflow-hidden border border-ink-900/15">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={zoom}
        onClick={handleMapClick}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {markers.map((m) => {
          const position = {
            lat: Number(m.latitude),
            lng: Number(m.longitude),
          };

          const markerKey = `${m.place_type}-${m.id}`;

          return (
            <React.Fragment key={markerKey}>
              <MarkerF
                position={position}
                onClick={() => {
                  setActiveMarker(m);
                  if (onMarkerClick) onMarkerClick(m);
                }}
              />

              {/* Show InfoWindow (Popup) when marker is clicked */}
              {activeMarker && `${activeMarker.place_type}-${activeMarker.id}` === markerKey && (
                <InfoWindowF
                  position={position}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div className="font-body text-sm p-1 max-w-[200px]">
                    <p className="font-semibold" style={{ color: typeColor[m.place_type] || '#0F1E1C' }}>
                      {m.name}
                    </p>
                    {m.price_per_night && <p>${m.price_per_night}/night</p>}
                    {m.avg_meal_cost && <p>~${m.avg_meal_cost}/meal</p>}
                    {m.price_per_person && <p>${m.price_per_person}/person</p>}
                    {m.rating && <p>★ {m.rating}</p>}
                    {onMarkerClick && (
                      <button
                        className="mt-1 text-xs underline text-amber-600 font-medium cursor-pointer"
                        onClick={() => onMarkerClick(m)}
                      >
                        Add to itinerary
                      </button>
                    )}
                  </div>
                </InfoWindowF>
              )}
            </React.Fragment>
          );
        })}
      </GoogleMap>
    </div>
  );
}
// import React, { useState, useEffect, useMemo } from 'react';
// import { Link } from 'react-router-dom';
// import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
// import { fetchHotels } from '../api/client';
// import AddToTripButton from '../components/AddToTripModal';

// // ---- Pin color by price range ----
// const getPinColor = (price) => {
//   if (!price) return '#0F1E1C';
//   if (price < 100) return '#2C9B6E'; // green – budget
//   if (price < 200) return '#2C6B9B'; // blue – mid
//   if (price < 300) return '#9B7B2C'; // gold – premium
//   return '#9B2C2C'; // red – luxury
// };

// // ---- Generate custom SVG marker ----
// const createMarkerSVG = (price, label = '') => {
//   const color = getPinColor(price);
//   const priceDisplay = price ? `$${price}` : '—';
//   return {
//     path: `M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z`,
//     fillColor: color,
//     fillOpacity: 1,
//     strokeColor: '#ffffff',
//     strokeWeight: 2,
//     scale: 1.5,
//     labelOrigin: new window.google.maps.Point(12, 10),
//   };
// };

// export default function Hotels() {
//   // ---- State ----
//   const [hotels, setHotels] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedHotel, setSelectedHotel] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filters, setFilters] = useState({
//     map: false,
//     filters: false,
//     price: false,
//     amenities: false,
//     petsAllowed: false,
//     fourStar: false,
//     familyFriendly: false,
//     travelersChoice: false,
//   });
//   const [sortBy, setSortBy] = useState('Best Value');
//   const [mapCenter, setMapCenter] = useState({ lat: 28.4615, lng: -81.4644 }); // Orlando
//   const [mapZoom, setMapZoom] = useState(13);

//   // ---- Load Google Maps ----
//   const { isLoaded, loadError } = useJsApiLoader({
//     id: 'google-map-script',
//     googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
//   });

//   // ---- Fetch data ----
//   const fetchData = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await fetchHotels();
//       const data = Array.isArray(res.data) ? res.data : [];
//       setHotels(data);
//       // Center map on first hotel if available
//       if (data.length > 0 && data[0].latitude && data[0].longitude) {
//         setMapCenter({
//           lat: Number(data[0].latitude),
//           lng: Number(data[0].longitude),
//         });
//       }
//     } catch (err) {
//       console.error('Failed to load hotels:', err);
//       setError('Failed to fetch hotels. Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // ---- Filter & sort hotels ----
//   const filteredHotels = useMemo(() => {
//     let result = [...hotels];

//     // Search filter
//     if (searchQuery.trim()) {
//       const q = searchQuery.toLowerCase().trim();
//       result = result.filter((h) =>
//         (h.name || '').toLowerCase().includes(q) ||
//         (h.city || '').toLowerCase().includes(q) ||
//         (h.description || '').toLowerCase().includes(q)
//       );
//     }

//     // Star filter
//     if (filters.fourStar) {
//       result = result.filter((h) => (h.star_rating || 0) >= 4);
//     }

//     // Pets allowed
//     if (filters.petsAllowed) {
//       result = result.filter((h) => h.pets_allowed === true);
//     }

//     // Family friendly
//     if (filters.familyFriendly) {
//       result = result.filter((h) => h.family_friendly === true);
//     }

//     // Travelers' Choice – rating >= 4.5
//     if (filters.travelersChoice) {
//       result = result.filter((h) => (h.rating || 0) >= 4.5);
//     }

//     // Sort
//     switch (sortBy) {
//       case 'Rating':
//         result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
//         break;
//       case 'Price: Low to High':
//         result.sort((a, b) => (a.price_per_night || 0) - (b.price_per_night || 0));
//         break;
//       case 'Price: High to Low':
//         result.sort((a, b) => (b.price_per_night || 0) - (a.price_per_night || 0));
//         break;
//       default: // 'Best Value'
//         // Price-to-rating ratio: lower is better value
//         result.sort((a, b) => {
//           const aRatio = (a.price_per_night || 999) / (a.rating || 1);
//           const bRatio = (b.price_per_night || 999) / (b.rating || 1);
//           return aRatio - bRatio;
//         });
//         break;
//     }

//     return result;
//   }, [hotels, searchQuery, filters, sortBy]);

//   // ---- Map markers ----
//   const mapMarkers = useMemo(() => {
//     return filteredHotels
//       .filter((h) => h.latitude && h.longitude)
//       .map((h) => ({
//         id: h.hotel_id,
//         name: h.name,
//         latitude: Number(h.latitude),
//         longitude: Number(h.longitude),
//         price: h.price_per_night ? Number(h.price_per_night) : null,
//         rating: h.rating ? Number(h.rating) : null,
//         image: h.image_url,
//         place_type: 'hotel',
//       }));
//   }, [filteredHotels]);

//   // ---- Toggle filter ----
//   const toggleFilter = (key) => {
//     setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
//   };

//   // ---- Rating circles (teal) ----
//   const renderRatingCircles = (rating) => {
//     const safeRating = typeof rating === 'number' ? rating : Number(rating) || 0;
//     const full = Math.floor(safeRating);
//     const fraction = safeRating - full;
//     const total = 5;
//     const circles = [];
//     for (let i = 0; i < total; i++) {
//       let fill = 0;
//       if (i < full) fill = 1;
//       else if (i === full && fraction > 0) fill = fraction;
//       circles.push(
//         <div key={i} className="w-3 h-3 rounded-full border border-teal-500 overflow-hidden flex-shrink-0">
//           {fill > 0 && <div className="h-full bg-teal-500" style={{ width: `${fill * 100}%` }} />}
//         </div>
//       );
//     }
//     return circles;
//   };

//   // ---- Loading / Error ----
//   if (loading) return <div className="p-8 text-center text-gray-600">Loading hotels...</div>;
//   if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

//   // ---- Main render ----
//   return (
//     <div className="max-w-full px-4 py-6">
//       {/* HEADER */}
//       <div className="mb-4">
//         <h1 className="text-2xl font-bold text-gray-800">THE 10 BEST Hotels in Universal Orlando Resort 2026</h1>
//         <p className="text-sm text-gray-500">Universal Orlando Resort · Hotels and Places to Stay</p>
//       </div>

//       {/* SEARCH + FILTERS BAR (Compact) */}
//       <div className="bg-white shadow rounded-lg p-3 mb-4">
//         <div className="flex flex-wrap items-center gap-3">
//           {/* Search */}
//           <input
//             type="text"
//             placeholder="Search hotels..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="flex-1 min-w-[150px] border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
//           />

//           {/* Filter chips */}
//           <button
//             onClick={() => toggleFilter('petsAllowed')}
//             className={`px-3 py-1 rounded-full text-xs font-medium transition border ${
//               filters.petsAllowed
//                 ? 'bg-teal-500 text-white border-teal-500'
//                 : 'bg-white border-gray-300 hover:bg-gray-50'
//             }`}
//           >
//             Pets Allowed
//           </button>
//           <button
//             onClick={() => toggleFilter('fourStar')}
//             className={`px-3 py-1 rounded-full text-xs font-medium transition border ${
//               filters.fourStar
//                 ? 'bg-teal-500 text-white border-teal-500'
//                 : 'bg-white border-gray-300 hover:bg-gray-50'
//             }`}
//           >
//             4 Star
//           </button>
//           <button
//             onClick={() => toggleFilter('familyFriendly')}
//             className={`px-3 py-1 rounded-full text-xs font-medium transition border ${
//               filters.familyFriendly
//                 ? 'bg-teal-500 text-white border-teal-500'
//                 : 'bg-white border-gray-300 hover:bg-gray-50'
//             }`}
//           >
//             Family-friendly
//           </button>
//           <button
//             onClick={() => toggleFilter('travelersChoice')}
//             className={`px-3 py-1 rounded-full text-xs font-medium transition border ${
//               filters.travelersChoice
//                 ? 'bg-teal-500 text-white border-teal-500'
//                 : 'bg-white border-gray-300 hover:bg-gray-50'
//             }`}
//           >
//             Travelers' Choice
//           </button>

//           {/* Sort */}
//           <div className="flex items-center gap-1 ml-auto">
//             <span className="text-xs text-gray-500">Sort:</span>
//             <select
//               value={sortBy}
//               onChange={(e) => setSortBy(e.target.value)}
//               className="border rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
//             >
//               <option>Best Value</option>
//               <option>Rating</option>
//               <option>Price: Low to High</option>
//               <option>Price: High to Low</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* MAP + LIST SPLIT VIEW */}
//       <div className="flex flex-col lg:flex-row gap-4">
//         {/* MAP (left) */}
//         <div className="lg:w-3/5">
//           <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden" style={{ height: '600px' }}>
//             {!isLoaded ? (
//               <div className="h-full flex items-center justify-center text-gray-500 text-sm">Loading map...</div>
//             ) : loadError ? (
//               <div className="h-full flex items-center justify-center text-red-500 text-sm">
//                 Error loading map. Please check your API key.
//               </div>
//             ) : (
//               <GoogleMap
//                 mapContainerStyle={{ width: '100%', height: '100%' }}
//                 center={mapCenter}
//                 zoom={mapZoom}
//                 options={{
//                   zoomControl: true,
//                   streetViewControl: false,
//                   mapTypeControl: false,
//                   fullscreenControl: true,
//                   styles: [
//                     {
//                       featureType: 'poi',
//                       elementType: 'labels',
//                       stylers: [{ visibility: 'off' }],
//                     },
//                   ],
//                 }}
//               >
//                 {mapMarkers.map((m) => {
//                   const pinColor = getPinColor(m.price);
//                   return (
//                     <MarkerF
//                       key={m.id}
//                       position={{ lat: m.latitude, lng: m.longitude }}
//                       onClick={() => {
//                         const hotel = filteredHotels.find((h) => h.hotel_id === m.id);
//                         setSelectedHotel(hotel || null);
//                       }}
//                       icon={{
//                         path:
//                           'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
//                         fillColor: pinColor,
//                         fillOpacity: 1,
//                         strokeColor: '#ffffff',
//                         strokeWeight: 2,
//                         scale: 1.8,
//                         labelOrigin: new window.google.maps.Point(12, 10),
//                       }}
//                       label={{
//                         text: m.price ? `$${m.price}` : '',
//                         color: '#ffffff',
//                         fontSize: '9px',
//                         fontWeight: 'bold',
//                       }}
//                     />
//                   );
//                 })}

//                 {/* Info window for selected hotel */}
//                 {selectedHotel && selectedHotel.latitude && selectedHotel.longitude && (
//                   <InfoWindowF
//                     position={{
//                       lat: Number(selectedHotel.latitude),
//                       lng: Number(selectedHotel.longitude),
//                     }}
//                     onCloseClick={() => setSelectedHotel(null)}
//                   >
//                     <div className="font-body text-sm p-1 max-w-[200px]">
//                       <p className="font-semibold text-gray-900">{selectedHotel.name}</p>
//                       {selectedHotel.price_per_night && (
//                         <p className="text-teal-600 font-bold">${Number(selectedHotel.price_per_night).toLocaleString()}/night</p>
//                       )}
//                       {selectedHotel.rating && (
//                         <div className="flex items-center gap-1 mt-1">
//                           {renderRatingCircles(Number(selectedHotel.rating))}
//                           <span className="text-xs text-gray-600">({selectedHotel.rating})</span>
//                         </div>
//                       )}
//                       <Link
//                         to={`/hotels/${selectedHotel.hotel_id}`}
//                         className="mt-2 inline-block text-teal-600 hover:underline text-xs font-medium"
//                       >
//                         View Details →
//                       </Link>
//                     </div>
//                   </InfoWindowF>
//                 )}
//               </GoogleMap>
//             )}
//           </div>
//           <p className="text-xs text-gray-400 mt-1">{filteredHotels.length} properties found</p>
//         </div>

//         {/* HOTEL LIST (right) */}
//         <div className="lg:w-2/5 space-y-3 max-h-[600px] overflow-y-auto pr-1">
//           {filteredHotels.length === 0 ? (
//             <p className="text-gray-500 text-center py-8">No hotels found matching your criteria.</p>
//           ) : (
//             filteredHotels.map((hotel, index) => {
//               const id = hotel.hotel_id || 'unknown';
//               const name = hotel.name || 'Unnamed';
//               const image = hotel.image_url || '';
//               const rating = typeof hotel.rating === 'number' ? hotel.rating : Number(hotel.rating) || 0;
//               const price = hotel.price_per_night ? Number(hotel.price_per_night) : null;
//               const city = hotel.city || '';
//               const country = hotel.country || '';
//               const description = hotel.description || '';
//               const isBestValue = index < 3 && sortBy === 'Best Value';

//               return (
//                 <div
//                   key={id}
//                   className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer"
//                   onClick={() => {
//                     if (hotel.latitude && hotel.longitude) {
//                       setMapCenter({
//                         lat: Number(hotel.latitude),
//                         lng: Number(hotel.longitude),
//                       });
//                       setMapZoom(16);
//                       setSelectedHotel(hotel);
//                     }
//                   }}
//                 >
//                   <div className="flex">
//                     {/* Image thumbnail */}
//                     {image ? (
//                       <div className="w-24 h-24 flex-shrink-0">
//                         <img
//                           src={image}
//                           alt={name}
//                           className="w-full h-full object-cover"
//                           onError={(e) => (e.target.style.display = 'none')}
//                         />
//                       </div>
//                     ) : (
//                       <div className="w-24 h-24 flex-shrink-0 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
//                         No img
//                       </div>
//                     )}
//                     {/* Content */}
//                     <div className="flex-1 p-3 flex flex-col justify-between">
//                       <div>
//                         <div className="flex items-start justify-between">
//                           <Link to={`/hotels/${id}`} className="hover:underline">
//                             <h3 className="font-semibold text-gray-900 text-sm leading-tight">{name}</h3>
//                           </Link>
//                           {isBestValue && (
//                             <span className="bg-teal-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap ml-1">
//                               #{(index + 1)} Best Value
//                             </span>
//                           )}
//                         </div>
//                         <p className="text-xs text-gray-500">
//                           {city && country ? `${city}, ${country}` : city || country || ''}
//                         </p>
//                         {/* Rating circles inline */}
//                         {rating > 0 && (
//                           <div className="flex items-center gap-1 mt-0.5">
//                             <div className="flex gap-0.5">{renderRatingCircles(rating)}</div>
//                             <span className="text-xs font-medium text-gray-700">{rating.toFixed(1)}</span>
//                           </div>
//                         )}
//                         {description && (
//                           <p className="text-xs text-gray-500 mt-1 line-clamp-1">{description}</p>
//                         )}
//                       </div>
//                       <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
//                         <span className="text-sm font-bold text-teal-600">
//                           {price ? `$${price.toLocaleString()}` : 'Contact'}
//                         </span>
//                         <AddToTripButton
//                           item={{ id, name, type: 'hotel' }}
//                           className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-medium px-3 py-1 rounded transition"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
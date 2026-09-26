
// import { useEffect, useMemo, useRef, useState } from 'react';
// import { useParams, useNavigate, Link } from 'react-router-dom';
// import client from '../api/client';
// import MapView from '../components/MapView';
// import ReviewsSection from '../components/ReviewsSection';
// import { useAuth } from '../context/AuthContext';

// const TEAL = '#0E978E';
// const TEAL_DARK = '#087C75';
// const TEAL_LIGHT = '#E8F7F3';

// const ALLOCATION_META = {
//   accommodation: { label: 'Accommodation', color: '#0E978E' },
//   transportation: { label: 'Transport', color: '#5B8DEF' },
//   activities: { label: 'Activities', color: '#F5A742' },
//   food: { label: 'Food', color: '#E8749E' },
// };

// export default function TripBuilder() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { user } = useAuth();

//   const [trip, setTrip] = useState(null);
//   const [center, setCenter] = useState([48.8566, 2.3522]);

//   const [nearby, setNearby] = useState({
//     hotels: [],
//     restaurants: [],
//     cruises: [],
//     attractions: [],
//   });

//   const [activeDay, setActiveDay] = useState(1);

//   const [loading, setLoading] = useState(true);
//   const [loadingNearby, setLoadingNearby] = useState(false);
//   const [addingItem, setAddingItem] = useState(false);
//   const [removingItem, setRemovingItem] = useState(null);

//   const [destinationSearch, setDestinationSearch] = useState('');
//   const [searchingDestination, setSearchingDestination] = useState(false);

//   const [inviteLink, setInviteLink] = useState('');
//   const [inviteLoading, setInviteLoading] = useState(false);
//   const [copied, setCopied] = useState(false);

//   const [togglingPublic, setTogglingPublic] = useState(false);
//   const [booking, setBooking] = useState(false);
//   const [alreadyBooked, setAlreadyBooked] = useState(false);

//   const [showAddPlan, setShowAddPlan] = useState(false);

//   const [customPlan, setCustomPlan] = useState({
//     name: '',
//     type: 'attraction',
//     cost: '',
//   });

//   // Flow actions: save itinerary (organizer) / join (public trip viewer)
//   const [savingItinerary, setSavingItinerary] = useState(false);
//   const [joining, setJoining] = useState(false);

//   // Destination hero image (fetched from Wikipedia via /places/photo)
//   const [heroImage, setHeroImage] = useState(null);
//   const [heroImageError, setHeroImageError] = useState(false);

//   // Tracks whether we've already centered the map on this trip's
//   // destination, so a background refresh (after adding/removing a plan)
//   // doesn't yank the map back and discard wherever the user has since
//   // panned/searched to.
//   const centeredRef = useRef(false);

//   /* =========================================================
//      LOAD TRIP
//   ========================================================= */

//   const load = async () => {
//     try {
//       setLoading(true);

//       const { data } = await client.get(`/trips/${id}`);

//       setTrip(data);

//       if (data.latitude && data.longitude) {
//         setCenter([
//           Number(data.latitude),
//           Number(data.longitude),
//         ]);
//       }
//     } catch (error) {
//       console.error('Failed to load trip:', error);

//       if (error?.response?.status === 404) {
//         alert('Trip not found.');
//         navigate('/trips');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     centeredRef.current = false;
//     setHeroImage(null);
//     setHeroImageError(false);
//     load();
//   }, [id]);

//   // FIX: custom_trips has no latitude/longitude columns, so the map used to
//   // silently stay on its hardcoded Paris default forever. This geocodes the
//   // trip's destination_city/destination_country (via the same Nominatim
//   // proxy the Explore map uses) and loads real nearby places for it --
//   // exactly once per trip, not on every refresh.
//   useEffect(() => {
//     if (!trip || centeredRef.current) return;

//     const query = [
//       trip.destination_city,
//       trip.destination_country,
//     ]
//       .filter(Boolean)
//       .join(', ');

//     if (!query) return;

//     centeredRef.current = true;

//     (async () => {
//       try {
//         const { data: results } = await client.get(
//           '/places/geocode',
//           {
//             params: { q: query },
//           }
//         );

//         if (Array.isArray(results) && results.length > 0) {
//           const lat = Number(results[0].latitude);
//           const lng = Number(results[0].longitude);

//           if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
//             await loadNearby(lat, lng);
//           }
//         }
//       } catch (error) {
//         console.error(
//           'Failed to geocode trip destination:',
//           error
//         );
//       }
//     })();

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [trip]);

//   // Fetch a hero photo for the destination via the backend Wikipedia proxy.
//   // Runs once per destination_city. Fails silently: the UI falls back to a
//   // teal tile with the city's first letter.
//   useEffect(() => {
//     const city = trip?.destination_city?.trim();

//     if (!city) return;

//     let cancelled = false;

//     (async () => {
//       try {
//         const { data } = await client.get('/places/photo', {
//           params: { q: city },
//         });

//         if (!cancelled) {
//           setHeroImage(data?.image || null);
//           setHeroImageError(false);
//         }
//       } catch (error) {
//         console.error(
//           'Failed to load destination photo:',
//           error
//         );

//         if (!cancelled) {
//           setHeroImage(null);
//         }
//       }
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, [trip?.destination_city]);

//   // Check whether the logged-in traveler already has a (non-cancelled) booking
//   // for this trip, so the booking box can show "Booked" instead of letting
//   // them book (and pay for) the same trip a second time.
//   useEffect(() => {
//     if (!user || !id) {
//       setAlreadyBooked(false);
//       return;
//     }

//     client
//       .get('/bookings/mine')
//       .then(({ data }) => {
//         const list = Array.isArray(data) ? data : [];

//         const hasBooking = list.some(
//           (b) =>
//             String(b.trip_id) === String(id) &&
//             b.booking_status !== 'cancelled'
//         );

//         setAlreadyBooked(hasBooking);
//       })
//       .catch(() => setAlreadyBooked(false));
//   }, [user, id]);

//   /* =========================================================
//      COST
//   ========================================================= */

//   // The budget is NEVER entered manually. The server calculates it from the
//   // itinerary item costs (and freezes it when the itinerary is saved).
//   const costPerPerson = Number(
//     trip?.per_person_cost ?? 0
//   );

//   const totalGroupCost = Number(
//     trip?.total_group_cost ?? costPerPerson
//   );

//   const breakdown = trip?.cost_breakdown || {};

//   const members = Number(
//     trip?.max_travelers ?? 1
//   );

//   const safeMembers = Math.max(members, 1);

//   // Percentages for the donut chart, derived from the calculated amounts.
//   const breakdownPct = useMemo(() => {
//     const total = Object.keys(ALLOCATION_META).reduce(
//       (sum, k) =>
//         sum + Number(breakdown[k] || 0),
//       0
//     );

//     const out = {};

//     for (const key of Object.keys(ALLOCATION_META)) {
//       out[key] =
//         total > 0
//           ? (Number(breakdown[key] || 0) / total) * 100
//           : 0;
//     }

//     return out;
//   }, [trip?.cost_breakdown]);

//   const canEdit = !!trip?.can_edit_itinerary;

//   const canInviteOrPublish =
//     !!trip?.can_publish_or_invite;

//   const fmt = (n) =>
//     Number(n || 0).toLocaleString(undefined, {
//       maximumFractionDigits: 2,
//     });

//   /* =========================================================
//      FLOW ACTIONS
//   ========================================================= */

//   const saveItinerary = async () => {
//     if (savingItinerary) return;

//     const ok = window.confirm(
//       'Save this itinerary?\n\nOnce saved, the plans and the calculated cost can no longer be changed by anyone, including you. You can then book your trip.'
//     );

//     if (!ok) return;

//     try {
//       setSavingItinerary(true);

//       await client.post(
//         `/trips/${id}/save-itinerary`
//       );

//       await load();
//     } catch (error) {
//       console.error(
//         'Failed to save itinerary:',
//         error
//       );

//       alert(
//         error?.response?.data?.error ||
//           'Could not save the itinerary.'
//       );
//     } finally {
//       setSavingItinerary(false);
//     }
//   };

//   const joinTrip = async () => {
//     if (joining) return;

//     try {
//       setJoining(true);

//       await client.post(
//         `/trips/${id}/join`
//       );

//       await load();
//     } catch (error) {
//       console.error(
//         'Failed to join trip:',
//         error
//       );

//       alert(
//         error?.response?.data?.error ||
//           'Could not join this trip.'
//       );
//     } finally {
//       setJoining(false);
//     }
//   };

//   /* =========================================================
//      LOAD NEARBY
//   ========================================================= */

//   const loadNearby = async (lat, lng) => {
//     try {
//       setLoadingNearby(true);

//       setCenter([lat, lng]);

//       const { data } = await client.get(
//         '/places/nearby',
//         {
//           params: {
//             lat,
//             lng,
//             radius_km: 15,
//           },
//         }
//       );

//       setNearby({
//         hotels:
//           data?.results?.hotels || [],
//         restaurants:
//           data?.results?.restaurants || [],
//         cruises:
//           data?.results?.cruises || [],
//         attractions:
//           data?.results?.attractions || [],
//       });
//     } catch (error) {
//       console.error(
//         'Failed to load nearby places:',
//         error
//       );

//       setNearby({
//         hotels: [],
//         restaurants: [],
//         cruises: [],
//         attractions: [],
//       });
//     } finally {
//       setLoadingNearby(false);
//     }
//   };

//   /* =========================================================
//      DESTINATION SEARCH
//   ========================================================= */

//   const searchDestination = async (e) => {
//     e?.preventDefault();

//     if (!destinationSearch.trim()) return;

//     try {
//       setSearchingDestination(true);

//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
//           destinationSearch
//         )}&limit=1`,
//         {
//           headers: {
//             Accept: 'application/json',
//           },
//         }
//       );

//       if (!response.ok) {
//         throw new Error(
//           'Destination search failed'
//         );
//       }

//       const results = await response.json();

//       if (!results.length) {
//         alert('Destination not found.');
//         return;
//       }

//       const location = results[0];

//       const lat = Number(location.lat);
//       const lng = Number(location.lon);

//       setCenter([lat, lng]);

//       await loadNearby(lat, lng);
//     } catch (error) {
//       console.error(
//         'Destination search failed:',
//         error
//       );

//       alert(
//         'Unable to search this destination.'
//       );
//     } finally {
//       setSearchingDestination(false);
//     }
//   };

//   /* =========================================================
//      ADD PLACE TO ITINERARY
//   ========================================================= */

//   const addToItinerary = async (marker) => {
//     if (
//       !canEdit ||
//       !marker?.id ||
//       addingItem
//     ) {
//       return;
//     }

//     try {
//       setAddingItem(true);

//       const payload = {
//         day_number: activeDay,
//       };

//       if (
//         marker.place_type === 'hotel'
//       ) {
//         payload.hotel_id = marker.id;
//       } else if (
//         marker.place_type === 'restaurant'
//       ) {
//         payload.restaurant_id = marker.id;
//       } else if (
//         marker.place_type === 'cruise'
//       ) {
//         payload.cruise_id = marker.id;
//       } else {
//         payload.place_id = marker.id;
//       }

//       await client.post(
//         `/trips/${id}/itinerary`,
//         payload
//       );

//       await load();
//     } catch (error) {
//       console.error(
//         'Failed to add itinerary item:',
//         error
//       );

//       alert(
//         error?.response?.data?.error ||
//           'Could not add this place to your itinerary.'
//       );
//     } finally {
//       setAddingItem(false);
//     }
//   };

//   /* =========================================================
//      CUSTOM PLAN
//   ========================================================= */

//   const addCustomPlan = async () => {
//     if (!canEdit) return;

//     if (!customPlan.name.trim()) {
//       alert('Please enter a plan name.');
//       return;
//     }

//     try {
//       setAddingItem(true);

//       await client.post(
//         `/trips/${id}/itinerary`,
//         {
//           day_number: activeDay,
//           custom_name:
//             customPlan.name.trim(),
//           custom_type: customPlan.type,
//           estimated_cost:
//             Number(customPlan.cost) || 0,
//         }
//       );

//       setCustomPlan({
//         name: '',
//         type: 'attraction',
//         cost: '',
//       });

//       setShowAddPlan(false);

//       await load();
//     } catch (error) {
//       console.error(
//         'Failed to add custom plan:',
//         error
//       );

//       alert(
//         error?.response?.data?.error ||
//           'Could not add the custom plan.'
//       );
//     } finally {
//       setAddingItem(false);
//     }
//   };

//   /* =========================================================
//      REMOVE ITEM
//   ========================================================= */

//   const removeItem = async (itemId) => {
//     if (
//       !canEdit ||
//       !itemId ||
//       removingItem
//     ) {
//       return;
//     }

//     try {
//       setRemovingItem(itemId);

//       await client.delete(
//         `/trips/${id}/itinerary/${itemId}`
//       );

//       await load();
//     } catch (error) {
//       console.error(
//         'Failed to remove itinerary item:',
//         error
//       );

//       alert(
//         error?.response?.data?.error ||
//           'Could not remove this itinerary item.'
//       );
//     } finally {
//       setRemovingItem(null);
//     }
//   };

//   /* =========================================================
//      INVITE
//   ========================================================= */

//   const createInvite = async () => {
//     if (!canInviteOrPublish) return;

//     try {
//       setInviteLoading(true);

//       const { data } = await client.post(
//         `/trips/${id}/invite`
//       );

//       if (!data?.invite_link) {
//         throw new Error(
//           'Invite link was not returned.'
//         );
//       }

//       const link =
//         data.invite_link.startsWith('http')
//           ? data.invite_link
//           : `${window.location.origin}${data.invite_link}`;

//       setInviteLink(link);
//     } catch (error) {
//       console.error(
//         'Failed to create invite:',
//         error
//       );

//       alert(
//         error?.response?.data?.error ||
//           'Could not create invite link.'
//       );
//     } finally {
//       setInviteLoading(false);
//     }
//   };

//   /* =========================================================
//      COPY INVITE
//   ========================================================= */

//   const copyInvite = async () => {
//     if (!inviteLink) return;

//     try {
//       await navigator.clipboard.writeText(
//         inviteLink
//       );

//       setCopied(true);

//       setTimeout(() => {
//         setCopied(false);
//       }, 2000);
//     } catch (error) {
//       console.error(
//         'Copy failed:',
//         error
//       );

//       alert(
//         'Could not copy the invitation link.'
//       );
//     }
//   };

//   /* =========================================================
//      PUBLIC / PRIVATE
//   ========================================================= */

//   const togglePublic = async () => {
//     if (
//       !trip ||
//       togglingPublic ||
//       !canInviteOrPublish
//     ) {
//       return;
//     }

//     try {
//       setTogglingPublic(true);

//       await client.patch(
//         `/trips/${id}`,
//         {
//           is_public: !trip.is_public,
//         }
//       );

//       await load();
//     } catch (error) {
//       console.error(
//         'Failed to update trip visibility:',
//         error
//       );

//       alert(
//         error?.response?.data?.error ||
//           'Could not update trip visibility.'
//       );
//     } finally {
//       setTogglingPublic(false);
//     }
//   };

//   /* =========================================================
//      BOOKING
//   ========================================================= */

//   const proceedToBooking = async () => {
//     if (
//       booking ||
//       alreadyBooked ||
//       !trip?.can_book
//     ) {
//       return;
//     }

//     try {
//       setBooking(true);

//       const { data } =
//         await client.post(
//           '/bookings',
//           {
//             booking_type:
//               'custom_trip',
//             trip_id: Number(id),
//           }
//         );

//       if (!data?.booking_id) {
//         throw new Error(
//           'Booking ID was not returned.'
//         );
//       }

//       setAlreadyBooked(true);

//       navigate(
//         `/checkout/${data.booking_id}`
//       );
//     } catch (error) {
//       console.error(
//         'Failed to create booking:',
//         error
//       );

//       alert(
//         error?.response?.data?.error ||
//           'Unable to continue to booking.'
//       );
//     } finally {
//       setBooking(false);
//     }
//   };

//   /* =========================================================
//      LOADING
//   ========================================================= */

//   if (loading || !trip) {
//     return (
//       <div className="min-h-screen bg-[#F5F8F7] flex items-center justify-center">
//         <div className="text-center">

//           <div
//             className="w-11 h-11 border-4 border-[#D9EFEB] rounded-full animate-spin mx-auto mb-4"
//             style={{
//               borderTopColor: TEAL,
//             }}
//           />

//           <p className="text-gray-600 font-medium">
//             Loading your trip...
//           </p>

//         </div>
//       </div>
//     );
//   }

//   /* =========================================================
//      DERIVED DATA
//   ========================================================= */

//   const markers = [
//     ...(nearby.hotels || []).map(
//       (item) => ({
//         ...item,
//         place_type: 'hotel',
//       })
//     ),

//     ...(nearby.restaurants || []).map(
//       (item) => ({
//         ...item,
//         place_type: 'restaurant',
//       })
//     ),

//     ...(nearby.cruises || []).map(
//       (item) => ({
//         ...item,
//         place_type: 'cruise',
//       })
//     ),

//     ...(nearby.attractions || []).map(
//       (item) => ({
//         ...item,
//         place_type: 'attraction',
//       })
//     ),
//   ];

//   const days = Array.from(
//     {
//       length:
//         Number(trip.duration_days) || 1,
//     },
//     (_, i) => i + 1
//   );

//   // Permissions/flow come from the server
//   // (and are enforced there too).
//   const isOrganizer =
//     !!trip.is_organizer;

//   const isMember =
//     !!trip.is_member;

//   const itineraryLocked =
//     !!trip.itinerary_locked;

//   const organizerBooked =
//     !!trip.organizer_booked;

//   const activeDayItems =
//     trip.itinerary?.filter(
//       (item) =>
//         Number(item.day_number) ===
//         Number(activeDay)
//     ) || [];

//   const totalItems =
//     trip.itinerary?.length || 0;

//   // Slots are occupied ONLY by travelers whose booking is confirmed.
//   // Travelers who joined but are not confirmed yet are listed separately
//   // and hold no slot.
//   const joinedMembers =
//     trip.members?.filter(
//       (member) =>
//         member.confirmed === true
//     ) || [];

//   const confirmedMembers =
//     joinedMembers.filter(
//       (member) => member.booked
//     );

//   const pendingMembers =
//     joinedMembers.filter(
//       (member) => !member.booked
//     );

//   const confirmedCount = Number(
//     trip.seats_taken ??
//       confirmedMembers.length
//   );

//   const pendingCount =
//     pendingMembers.length;

//   const tripFull =
//     trip.is_full ??
//     confirmedCount >= safeMembers;

//   // Destination photo
//   const showHeroImage =
//     !!heroImage && !heroImageError;

//   const cityInitial =
//     (
//       trip.destination_city || '?'
//     )
//       .charAt(0)
//       .toUpperCase();

//   /* =========================================================
//      UI
//   ========================================================= */

//   return (
//     <div className="min-h-screen bg-[#F5F8F7] text-gray-900">

//       {/* =====================================================
//           HEADER
//       ===================================================== */}

//       <header className="bg-white border-b border-gray-200">

//         <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

//           {/* Breadcrumb */}

//           <div className="flex items-center gap-2 text-sm mb-5">

//             <Link
//               to="/trips"
//               className="text-gray-400 hover:text-[#0E978E] transition"
//             >
//               My Trips
//             </Link>

//             <span className="text-gray-300">
//               /
//             </span>

//             <span className="text-gray-500">
//               Trip Builder
//             </span>

//           </div>

//           {/* MAIN TOP CARD */}

//           <div className="rounded-3xl bg-[#E8F7F3] border border-[#CDECE5] overflow-hidden">

//             <div className="p-5 md:p-7">

//               <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

//                 {/* HERO + TEXT */}

//                 <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] overflow-hidden rounded-3xl bg-white border border-[#CDECE5] shadow-sm min-w-0 flex-1">

//                   {/* LEFT — LARGE DESTINATION IMAGE */}

//                   <div className="relative w-full h-64 md:h-full md:min-h-[360px]">

//                     {showHeroImage ? (
//                       <img
//                         src={heroImage}
//                         alt={
//                           trip.destination_city ||
//                           'Destination'
//                         }
//                         onError={() =>
//                           setHeroImageError(true)
//                         }
//                         className="object-cover w-full h-full rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none md:rounded-br-none"
//                       />
//                     ) : (
//                       <div
//                         className="w-full h-full min-h-[256px] md:min-h-[360px] flex items-center justify-center text-7xl md:text-8xl font-bold rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none md:rounded-br-none"
//                         style={{
//                           backgroundColor: TEAL,
//                           color: '#fff',
//                         }}
//                         aria-hidden="true"
//                       >
//                         {cityInitial}
//                       </div>
//                     )}

//                     <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none md:rounded-br-none" />

//                   </div>

//                   {/* RIGHT — TEXT CONTENT */}

//                   <div className="p-6 md:p-10 flex flex-col justify-center min-w-0">

//                     <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F7F3] text-[#087C75] text-xs font-bold tracking-wide uppercase w-fit">

//                       <span className="w-2 h-2 rounded-full bg-[#0E978E]" />

//                       Trip Builder

//                     </div>

//                     <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-4 leading-tight">

//                       {trip.title}

//                     </h1>

//                     <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-gray-600">

//                       <span>
//                         📍 {trip.destination_city},{' '}
//                         {trip.destination_country}
//                       </span>

//                       <span className="hidden sm:inline text-gray-300">
//                         •
//                       </span>

//                       <span>
//                         {trip.duration_days} days
//                       </span>

//                       <span className="hidden sm:inline text-gray-300">
//                         •
//                       </span>

//                       <span>
//                         {confirmedCount}/
//                         {safeMembers} travelers
//                       </span>

//                       <span className="hidden sm:inline text-gray-300">
//                         •
//                       </span>

//                       <span className="font-semibold text-[#087C75]">
//                         ${fmt(costPerPerson)} / person
//                       </span>

//                     </div>

//                     {/* QUICK STATS */}

//                     <div className="flex flex-wrap gap-2 mt-6">

//                       <QuickStat
//                         label="Plans"
//                         value={totalItems}
//                       />

//                       <QuickStat
//                         label="Days"
//                         value={
//                           trip.duration_days ||
//                           1
//                         }
//                       />

//                       <QuickStat
//                         label="Travelers"
//                         value={
//                           confirmedCount
//                         }
//                       />

//                       <QuickStat
//                         label="Per person"
//                         value={`$${fmt(
//                           costPerPerson
//                         )}`}
//                       />

//                     </div>

//                   </div>

//                 </div>

//                 {/* RIGHT — CALCULATED COST + NEXT STEP */}

//                 <div className="w-full xl:w-[320px] bg-white rounded-2xl p-5 shadow-sm border border-white shrink-0">

//                   <div className="flex items-start justify-between">

//                     <div>

//                       <p className="text-xs font-bold text-[#087C75] uppercase tracking-wider">
//                         Cost per person
//                       </p>

//                       <p className="text-3xl font-bold mt-1">
//                         ${fmt(costPerPerson)}
//                       </p>

//                       <p className="text-xs text-gray-500 mt-1">
//                         ${fmt(totalGroupCost)} total for{' '}
//                         {Math.max(
//                           confirmedCount,
//                           1
//                         )}{' '}
//                         {Math.max(
//                           confirmedCount,
//                           1
//                         ) === 1
//                           ? 'traveler'
//                           : 'travelers'}
//                       </p>

//                       <p className="text-[11px] text-gray-400 mt-1">
//                         {itineraryLocked
//                           ? 'Calculated from your saved itinerary'
//                           : 'Calculated automatically from your plans'}
//                       </p>

//                     </div>

//                     <div className="w-10 h-10 rounded-xl bg-[#E8F7F3] flex items-center justify-center text-lg">
//                       💰
//                     </div>

//                   </div>

//                   {/* STEP 1 — organizer builds, then saves */}

//                   {isOrganizer &&
//                     !itineraryLocked && (
//                       <>

//                         <button
//                           onClick={
//                             saveItinerary
//                           }
//                           disabled={
//                             savingItinerary ||
//                             !trip.can_save_itinerary
//                           }
//                           className="w-full mt-4 py-3 rounded-xl text-white font-semibold transition disabled:opacity-50"
//                           style={{
//                             backgroundColor:
//                               TEAL,
//                           }}
//                         >
//                           {savingItinerary
//                             ? 'Saving...'
//                             : 'Save itinerary'}
//                         </button>

//                         <p className="text-xs mt-3 text-center text-gray-500">
//                           {totalItems === 0
//                             ? 'Add plans to your days, then save the itinerary.'
//                             : 'Saving locks the plans and cost. Next you can book your trip.'}
//                         </p>

//                       </>
//                     )}

//                   {/* STEP 2 — organizer books; travelers book once organizer has */}

//                   {trip.can_book && (
//                     <button
//                       onClick={
//                         proceedToBooking
//                       }
//                       disabled={
//                         booking ||
//                         alreadyBooked
//                       }
//                       className="w-full mt-4 py-3 rounded-xl text-white font-semibold transition disabled:opacity-50"
//                       style={{
//                         backgroundColor:
//                           TEAL,
//                       }}
//                       onMouseEnter={(e) => {
//                         if (!booking) {
//                           e.currentTarget.style.backgroundColor =
//                             TEAL_DARK;
//                         }
//                       }}
//                       onMouseLeave={(e) => {
//                         e.currentTarget.style.backgroundColor =
//                           TEAL;
//                       }}
//                     >
//                       {alreadyBooked
//                         ? 'Booked'
//                         : booking
//                         ? 'Preparing booking...'
//                         : isOrganizer
//                         ? 'Book my trip'
//                         : 'Book my spot'}
//                     </button>
//                   )}

//                   {tripFull &&
//                     isMember &&
//                     !alreadyBooked && (
//                       <p className="text-xs mt-3 text-center text-red-500 font-medium">
//                         This trip is full. All slots are taken by confirmed bookings, so booking is closed.
//                       </p>
//                     )}

//                   {isMember &&
//                     itineraryLocked &&
//                     alreadyBooked && (
//                       <p
//                         className="text-xs mt-3 text-center"
//                         style={{
//                           color: TEAL_DARK,
//                         }}
//                       >
//                         You have a booking for this trip —{' '}
//                         <button
//                           type="button"
//                           onClick={() =>
//                             navigate(
//                               '/bookings'
//                             )
//                           }
//                           className="underline font-semibold"
//                         >
//                           view it in My Bookings
//                         </button>
//                         .
//                       </p>
//                     )}

//                   {isOrganizer &&
//                     itineraryLocked &&
//                     !organizerBooked &&
//                     !alreadyBooked && (
//                       <p className="text-xs mt-3 text-center text-gray-500">
//                         Itinerary saved. Book your trip to unlock invites and public listing.
//                       </p>
//                     )}

//                   {isMember &&
//                     !isOrganizer &&
//                     !organizerBooked && (
//                       <p className="text-xs mt-3 text-center text-gray-500">
//                         Waiting for the organizer to book this trip.
//                       </p>
//                     )}

//                   {/* Not a member of this public trip yet */}

//                   {!isMember &&
//                     trip.is_public &&
//                     organizerBooked && (
//                       <button
//                         onClick={
//                           joinTrip
//                         }
//                         disabled={
//                           joining ||
//                           tripFull
//                         }
//                         className="w-full mt-4 py-3 rounded-xl text-white font-semibold transition disabled:opacity-50"
//                         style={{
//                           backgroundColor:
//                             TEAL,
//                         }}
//                       >
//                         {tripFull
//                           ? 'Trip full'
//                           : joining
//                           ? 'Joining...'
//                           : 'Join trip'}
//                       </button>
//                     )}

//                 </div>

//               </div>

//               {/* ACTIONS */}

//               <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-[#CDECE5]">

//                 {isOrganizer && (
//                   <>

//                     <button
//                       onClick={
//                         createInvite
//                       }
//                       disabled={
//                         inviteLoading ||
//                         !canInviteOrPublish
//                       }
//                       title={
//                         canInviteOrPublish
//                           ? ''
//                           : 'Save your itinerary and book your own trip first'
//                       }
//                       className="px-4 py-2.5 bg-[#0E978E] text-white rounded-xl text-sm font-semibold hover:bg-[#087C75] transition disabled:opacity-40 disabled:cursor-not-allowed"
//                     >
//                       {inviteLoading
//                         ? 'Generating...'
//                         : '🔗 Invite travelers'}
//                     </button>

//                     <button
//                       onClick={
//                         togglePublic
//                       }
//                       disabled={
//                         togglingPublic ||
//                         !canInviteOrPublish
//                       }
//                       title={
//                         canInviteOrPublish
//                           ? ''
//                           : 'Save your itinerary and book your own trip first'
//                       }
//                       className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:border-[#0E978E] hover:text-[#087C75] transition disabled:opacity-40 disabled:cursor-not-allowed"
//                     >
//                       {togglingPublic
//                         ? 'Updating...'
//                         : trip.is_public
//                         ? '🌐 Public'
//                         : '🔒 Private'}
//                     </button>

//                     {!canInviteOrPublish && (
//                       <span className="text-xs text-gray-500">
//                         {!itineraryLocked
//                           ? 'Save the itinerary, then book your trip to invite travelers or go public.'
//                           : 'Book your trip to invite travelers or go public.'}
//                       </span>
//                     )}

//                   </>
//                 )}

//                 {canEdit && (
//                   <button
//                     onClick={() =>
//                       setShowAddPlan(
//                         true
//                       )
//                     }
//                     className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:border-[#0E978E] hover:text-[#087C75] transition"
//                   >
//                     + Add plan
//                   </button>
//                 )}

//                 <Link
//                   to={`/trips/${id}/split`}
//                   className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:border-[#0E978E] hover:text-[#087C75] transition"
//                 >
//                   Cost split
//                 </Link>

//               </div>

//             </div>

//           </div>

//           {/* INVITE */}

//           {inviteLink && (
//             <div className="mt-4 p-4 rounded-2xl bg-[#E8F7F3] border border-[#BDE9E0]">

//               <div className="flex flex-col md:flex-row md:items-center gap-3">

//                 <div className="flex-1 min-w-0">

//                   <p className="text-xs font-bold text-[#087C75] uppercase tracking-wide mb-1">
//                     Invitation link
//                   </p>

//                   <p className="text-sm font-mono text-gray-700 break-all">
//                     {inviteLink}
//                   </p>

//                 </div>

//                 <button
//                   onClick={
//                     copyInvite
//                   }
//                   className="px-4 py-2.5 bg-white border border-[#BDE9E0] rounded-xl text-sm font-semibold text-[#087C75] hover:bg-[#DDF3EE] transition"
//                 >
//                   {copied
//                     ? '✓ Copied'
//                     : 'Copy link'}
//                 </button>

//               </div>

//             </div>
//           )}

//         </div>

//       </header>

//       {/* =====================================================
//           CALCULATED BUDGET
//       ===================================================== */}

//       <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-5">

//         <div className="bg-white border border-gray-200 rounded-2xl p-5">

//           <div className="flex flex-col lg:flex-row lg:items-start gap-6">

//             <div className="flex items-center gap-5 shrink-0">

//               <BudgetPieChart
//                 allocation={
//                   breakdownPct
//                 }
//                 costPerPerson={
//                   costPerPerson
//                 }
//                 fmt={fmt}
//               />

//             </div>

//             <div className="flex-1 min-w-0">

//               <div className="mb-3">

//                 <p className="text-xs font-bold text-[#087C75] uppercase tracking-wider">
//                   Trip budget (calculated)
//                 </p>

//                 <p className="text-xs text-gray-500 mt-0.5">
//                   ${fmt(costPerPerson)} / person · $
//                   {fmt(totalGroupCost)} for{' '}
//                   {Math.max(
//                     confirmedCount,
//                     1
//                   )}{' '}
//                   {Math.max(
//                     confirmedCount,
//                     1
//                   ) === 1
//                     ? 'traveler'
//                     : 'travelers'}.{' '}
//                   {itineraryLocked
//                     ? 'Locked with your saved itinerary.'
//                     : 'Updates as you add or remove plans; locks when you save the itinerary.'}
//                 </p>

//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

//                 {Object.entries(
//                   ALLOCATION_META
//                 ).map(
//                   ([key, meta]) => (
//                     <div
//                       key={key}
//                       className="flex items-center gap-3 bg-[#FAFCFB] border border-gray-100 rounded-xl px-3 py-2.5"
//                     >

//                       <span
//                         className="w-2.5 h-2.5 rounded-full shrink-0"
//                         style={{
//                           backgroundColor:
//                             meta.color,
//                         }}
//                       />

//                       <span className="text-xs font-semibold text-gray-700 flex-1 truncate">
//                         {meta.label}
//                       </span>

//                       <span className="text-xs text-gray-400">
//                         {Math.round(
//                           breakdownPct[
//                             key
//                           ] || 0
//                         )}
//                         %
//                       </span>

//                       <span className="text-xs font-bold text-[#087C75] w-16 text-right shrink-0">
//                         $
//                         {fmt(
//                           breakdown[
//                             key
//                           ] || 0
//                         )}
//                       </span>

//                     </div>
//                   )
//                 )}

//               </div>

//             </div>

//           </div>

//         </div>

//       </section>

//       {/* =====================================================
//           MAIN
//       ===================================================== */}

//       <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

//         <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-5 items-start">

//           {/* =================================================
//               LEFT — EXPLORE
//           ================================================= */}

//           <section className="min-w-0">

//             <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

//               {/* SEARCH */}

//               <div className="p-5 border-b border-gray-200">

//                 <div className="flex flex-col sm:flex-row gap-3">

//                   <form
//                     onSubmit={
//                       searchDestination
//                     }
//                     className="flex-1"
//                   >

//                     <div className="flex gap-2">

//                       <div className="relative flex-1">

//                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
//                           🔎
//                         </span>

//                         <input
//                           value={
//                             destinationSearch
//                           }
//                           onChange={(e) =>
//                             setDestinationSearch(
//                               e.target
//                                 .value
//                             )
//                           }
//                           placeholder="Search Tokyo, Paris, Bali..."
//                           className="w-full pl-11 pr-4 py-3 bg-[#F7FAF9] border border-gray-200 rounded-xl outline-none focus:border-[#0E978E] focus:ring-2 focus:ring-[#0E978E]/20 transition"
//                         />

//                       </div>

//                       <button
//                         type="submit"
//                         disabled={
//                           searchingDestination
//                         }
//                         className="px-5 py-3 bg-[#0E978E] text-white rounded-xl font-semibold hover:bg-[#087C75] transition disabled:opacity-50"
//                       >
//                         {searchingDestination
//                           ? 'Searching...'
//                           : 'Search'}
//                       </button>

//                     </div>

//                   </form>

//                 </div>

//                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">

//                   <div>

//                     <div className="flex items-center gap-2">

//                       <h2 className="font-bold text-lg">
//                         Explore{' '}
//                         {
//                           trip.destination_city
//                         }
//                       </h2>

//                       {loadingNearby && (
//                         <div className="w-4 h-4 border-2 border-gray-200 border-t-[#0E978E] rounded-full animate-spin" />
//                       )}

//                     </div>

//                     <p className="text-xs text-gray-500 mt-1">
//                       {canEdit
//                         ? `Click a place on the map to add it to Day ${activeDay}.`
//                         : 'Explore the destination. The itinerary is managed by the organizer.'}
//                     </p>

//                   </div>

//                   <div className="flex items-center gap-2 text-xs">

//                     <span className="px-2.5 py-1 rounded-full bg-[#E8F7F3] text-[#087C75] font-semibold">
//                       {markers.length}{' '}
//                       nearby
//                     </span>

//                     {addingItem && (
//                       <span className="text-[#087C75] font-medium">
//                         Adding...
//                       </span>
//                     )}

//                   </div>

//                 </div>

//               </div>

//               {/* MAP */}

//               <div className="relative">

//                 <MapView
//                   center={center}
//                   markers={markers}
//                   onMarkerClick={
//                     canEdit
//                       ? addToItinerary
//                       : undefined
//                   }
//                   onMapClick={(
//                     latlng
//                   ) =>
//                     loadNearby(
//                       latlng.lat,
//                       latlng.lng
//                     )
//                   }
//                   height="590px"
//                 />

//               </div>

//               {/* MAP FOOTER */}

//               <div className="px-5 py-3 bg-[#FAFCFB] border-t border-gray-100">

//                 <div className="flex flex-wrap items-center justify-between gap-3">

//                   <div className="flex flex-wrap gap-3 text-xs text-gray-600">

//                     <span>
//                       🏨 Hotels
//                     </span>

//                     <span>
//                       🍽 Restaurants
//                     </span>

//                     <span>
//                       🚢 Cruises
//                     </span>

//                     <span>
//                       📍 Attractions
//                     </span>

//                   </div>

//                   <p className="text-xs text-gray-400">
//                     Click anywhere on the map to explore
//                   </p>

//                 </div>

//               </div>

//             </div>

//           </section>

//           {/* =================================================
//               RIGHT — ITINERARY
//           ================================================= */}

//           <aside className="space-y-5">

//             <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

//               {/* HEADER */}

//               <div className="p-5 border-b border-gray-200">

//                 <div className="flex items-center justify-between gap-3">

//                   <div>

//                     <p className="text-xs uppercase tracking-wider text-[#087C75] font-bold">
//                       Your plan
//                     </p>

//                     <h2 className="font-bold text-xl mt-1">
//                       Itinerary
//                     </h2>

//                     <p className="text-xs text-gray-500 mt-1">
//                       {canEdit
//                         ? 'Build your trip day by day, then save the itinerary.'
//                         : itineraryLocked
//                         ? 'Saved itinerary — read only.'
//                         : 'The organizer is still building this itinerary.'}
//                     </p>

//                   </div>

//                   <div className="bg-[#E8F7F3] text-[#087C75] px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
//                     {totalItems}{' '}
//                     plans
//                   </div>

//                 </div>

//               </div>

//               {/* DAYS */}

//               <div className="px-4 py-3 border-b border-gray-100">

//                 <div className="flex gap-2 overflow-x-auto pb-1">

//                   {days.map((day) => {

//                     const count =
//                       trip.itinerary?.filter(
//                         (item) =>
//                           Number(
//                             item.day_number
//                           ) ===
//                           Number(day)
//                       ).length || 0;

//                     return (
//                       <button
//                         key={day}
//                         onClick={() =>
//                           setActiveDay(
//                             day
//                           )
//                         }
//                         className={`
//                           flex-shrink-0 px-4 py-2.5 rounded-xl
//                           border text-sm font-semibold transition
//                           ${
//                             activeDay ===
//                             day
//                               ? 'bg-[#0E978E] border-[#0E978E] text-white shadow-sm'
//                               : 'bg-white border-gray-200 text-gray-600 hover:border-[#0E978E] hover:text-[#087C75]'
//                           }
//                         `}
//                       >
//                         Day {day}

//                         {count >
//                           0 && (
//                           <span className="ml-1 opacity-70">
//                             · {count}
//                           </span>
//                         )}

//                       </button>
//                     );
//                   })}

//                 </div>

//               </div>

//               {/* ACTIVE DAY */}

//               <div className="p-4">

//                 <div className="flex items-center justify-between mb-4">

//                   <div>

//                     <p className="text-xs uppercase tracking-wider text-[#087C75] font-bold">
//                       Day {activeDay}
//                     </p>

//                     <p className="text-sm text-gray-500 mt-1">
//                       {activeDayItems.length ===
//                       0
//                         ? 'Nothing planned yet'
//                         : `${activeDayItems.length} ${
//                             activeDayItems.length ===
//                             1
//                               ? 'activity'
//                               : 'activities'
//                           }`}
//                     </p>

//                   </div>

//                   {canEdit && (
//                     <button
//                       onClick={() =>
//                         setShowAddPlan(
//                           true
//                         )
//                       }
//                       className="w-10 h-10 rounded-xl bg-[#E8F7F3] text-[#087C75] font-bold hover:bg-[#D5F1EB] transition text-lg"
//                     >
//                       +
//                     </button>
//                   )}

//                 </div>

//                 {/* EMPTY */}

//                 {activeDayItems.length ===
//                   0 && (
//                   <div className="py-10 px-5 text-center border border-dashed border-gray-200 rounded-2xl">

//                     <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E8F7F3] flex items-center justify-center text-xl mb-3">
//                       📍
//                     </div>

//                     <p className="font-semibold text-gray-700">
//                       Day {activeDay}{' '}
//                       is empty
//                     </p>

//                     {canEdit ? (
//                       <>

//                         <p className="text-xs text-gray-500 mt-1 mb-4">
//                           Select a place from the map or add a custom plan.
//                         </p>

//                         <button
//                           onClick={() =>
//                             setShowAddPlan(
//                               true
//                             )
//                           }
//                           className="px-4 py-2.5 bg-[#0E978E] text-white rounded-xl text-sm font-semibold hover:bg-[#087C75] transition"
//                         >
//                           + Add plan
//                         </button>

//                       </>
//                     ) : (
//                       <p className="text-xs text-gray-500 mt-1">
//                         Nothing planned for this day.
//                       </p>
//                     )}

//                   </div>
//                 )}

//                 {/* ITEMS */}

//                 <div className="space-y-2.5">

//                   {activeDayItems.map(
//                     (
//                       item,
//                       index
//                     ) => {

//                       const name =
//                         item.hotel_name ||
//                         item.restaurant_name ||
//                         item.cruise_name ||
//                         item.place_name ||
//                         item.custom_name ||
//                         'Untitled plan';

//                       const type =
//                         item.hotel_name
//                           ? 'Accommodation'
//                           : item.restaurant_name
//                           ? 'Restaurant'
//                           : item.cruise_name
//                           ? 'Cruise'
//                           : item.custom_name
//                           ? item.custom_type ||
//                             'Custom plan'
//                           : 'Attraction';

//                       const cost =
//                         Number(
//                           item.cost_per_person ??
//                             item.estimated_cost ??
//                             0
//                         );

//                       return (
//                         <div
//                           key={
//                             item.itinerary_id ||
//                             `${item.day_number}-${index}`
//                           }
//                           className="group bg-[#FAFCFB] border border-gray-200 rounded-xl p-3 hover:border-[#BDE9E0] transition"
//                         >

//                           <div className="flex items-center gap-3">

//                             <div className="w-9 h-9 rounded-xl bg-[#E8F7F3] text-[#087C75] flex items-center justify-center text-xs font-bold shrink-0">
//                               {index +
//                                 1}
//                             </div>

//                             <div className="flex-1 min-w-0">

//                               <p className="font-semibold text-sm truncate">
//                                 {name}
//                               </p>

//                               <p className="text-xs text-gray-500 mt-1">
//                                 {type}
//                               </p>

//                             </div>

//                             <div className="text-right shrink-0">

//                               <p className="font-bold text-sm">
//                                 $
//                                 {cost.toFixed(
//                                   0
//                                 )}
//                               </p>

//                               {canEdit &&
//                                 item.itinerary_id && (
//                                   <button
//                                     onClick={() =>
//                                       removeItem(
//                                         item.itinerary_id
//                                       )
//                                     }
//                                     disabled={
//                                       removingItem ===
//                                       item.itinerary_id
//                                     }
//                                     className="text-xs text-red-400 hover:text-red-600 mt-1 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
//                                   >
//                                     {removingItem ===
//                                     item.itinerary_id
//                                       ? 'Removing...'
//                                       : 'Remove'}
//                                   </button>
//                                 )}

//                             </div>

//                           </div>

//                         </div>
//                       );
//                     }
//                   )}

//                 </div>

//               </div>

//             </div>

//             {/* =================================================
//                 TRAVELERS
//             ================================================= */}

//             <div className="bg-white border border-gray-200 rounded-2xl p-5">

//               <div className="flex items-center justify-between mb-4">

//                 <div>

//                   <p className="text-xs uppercase tracking-wider text-[#087C75] font-bold">
//                     Trip group
//                   </p>

//                   <h3 className="font-bold text-lg mt-1">
//                     Travelers
//                   </h3>

//                   <p className="text-xs text-gray-500 mt-1">
//                     {confirmedCount}{' '}
//                     confirmed ·{' '}
//                     {Math.max(
//                       safeMembers -
//                         confirmedCount,
//                       0
//                     )}{' '}
//                     slots left
//                     {pendingCount >
//                       0 &&
//                       ` · ${pendingCount} awaiting confirmation`}
//                   </p>

//                 </div>

//                 <div className="bg-[#E8F7F3] text-[#087C75] px-3 py-1.5 rounded-full text-xs font-bold">
//                   {confirmedCount}/
//                   {safeMembers}
//                 </div>

//               </div>

//               <div className="space-y-2.5">

//                 {confirmedMembers.length ===
//                   0 && (
//                   <div className="text-center py-5 bg-[#FAFCFB] rounded-xl">

//                     <p className="text-sm text-gray-500">
//                       No confirmed travelers yet. A slot is only taken once a booking is confirmed.
//                     </p>

//                     {canInviteOrPublish && (
//                       <button
//                         onClick={
//                           createInvite
//                         }
//                         className="text-xs font-semibold text-[#087C75] mt-2 hover:underline"
//                       >
//                         Invite someone
//                       </button>
//                     )}

//                   </div>
//                 )}

//                 {confirmedMembers.map(
//                   (member) => (

//                     <div
//                       key={
//                         member.user_id
//                       }
//                       className="flex items-center gap-3"
//                     >

//                       <div className="w-9 h-9 rounded-full bg-[#E8F7F3] flex items-center justify-center text-sm font-bold text-[#087C75]">
//                         {(
//                           member.full_name ||
//                           'U'
//                         )
//                           .charAt(0)
//                           .toUpperCase()}
//                       </div>

//                       <div className="flex-1 min-w-0">

//                         <p className="text-sm font-semibold truncate">
//                           {member.full_name ||
//                             'Traveler'}
//                         </p>

//                         <p className="text-xs text-gray-500">
//                           {member.role ===
//                           'organizer'
//                             ? 'Organizer'
//                             : 'Traveler'}
//                         </p>

//                       </div>

//                       <div className="flex items-center gap-1.5 flex-shrink-0">

//                         {member.role ===
//                           'organizer' && (
//                           <span className="text-[10px] font-bold uppercase tracking-wide text-[#087C75] bg-[#E8F7F3] px-2 py-1 rounded-full">
//                             Host
//                           </span>
//                         )}

//                         <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
//                           Confirmed
//                         </span>

//                       </div>

//                     </div>

//                   )
//                 )}

//               </div>

//               {pendingCount >
//                 0 && (
//                 <div className="mt-5 pt-4 border-t border-gray-100">

//                   <p className="text-xs uppercase tracking-wider text-amber-700 font-bold">
//                     Joined · awaiting confirmation (
//                     {pendingCount})
//                   </p>

//                   <p className="text-xs text-gray-500 mt-1 mb-3">
//                     These travelers joined but have not completed a confirmed booking, so they do not hold a slot yet.
//                   </p>

//                   <div className="space-y-2.5">

//                     {pendingMembers.map(
//                       (member) => (
//                         <div
//                           key={
//                             member.user_id
//                           }
//                           className="flex items-center gap-3"
//                         >

//                           <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-sm font-bold text-amber-700">
//                             {(
//                               member.full_name ||
//                               'U'
//                             )
//                               .charAt(0)
//                               .toUpperCase()}
//                           </div>

//                           <div className="flex-1 min-w-0">

//                             <p className="text-sm font-semibold truncate">
//                               {member.full_name ||
//                                 'Traveler'}
//                             </p>

//                             <p className="text-xs text-gray-500">
//                               {member.role ===
//                               'organizer'
//                                 ? 'Organizer'
//                                 : 'Traveler'}
//                             </p>

//                           </div>

//                           <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
//                             {member.booking_status ===
//                             'pending'
//                               ? 'Payment pending'
//                               : 'Not booked'}
//                           </span>

//                         </div>
//                       )
//                     )}

//                   </div>

//                 </div>
//               )}

//             </div>

//           </aside>

//         </div>

//         {/* =================================================
//             TRIP REVIEWS
//         ================================================= */}

//         <section className="mt-5 bg-white border border-gray-200 rounded-2xl p-6">

//           <ReviewsSection
//             entityKey="trip_id"
//             entityId={trip.trip_id}
//             hint="Only travelers who joined this trip (not the organizer) can review it, once each."
//           />

//         </section>

//       </main>

//       {/* =====================================================
//           ADD PLAN MODAL
//       ===================================================== */}

//       {showAddPlan && (
//         <div className="fixed inset-0 z-[3000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

//           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

//             {/* HEADER */}

//             <div className="p-6 border-b border-gray-100 flex items-center justify-between">

//               <div>

//                 <p className="text-xs uppercase tracking-wide text-[#087C75] font-bold">
//                   Day {activeDay}
//                 </p>

//                 <h2 className="text-xl font-bold mt-1">
//                   Add a plan
//                 </h2>

//                 <p className="text-sm text-gray-500 mt-1">
//                   Add something to your itinerary.
//                 </p>

//               </div>

//               <button
//                 onClick={() =>
//                   setShowAddPlan(false)
//                 }
//                 className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
//               >
//                 ✕
//               </button>

//             </div>

//             <div className="p-6">

//               {/* QUICK HELP */}

//               <div className="mb-5 p-4 bg-[#E8F7F3] rounded-2xl">

//                 <p className="text-sm font-semibold text-[#087C75]">
//                   Want to add a place from the map?
//                 </p>

//                 <p className="text-xs text-gray-600 mt-1">
//                   Close this window and click any nearby marker. It will automatically be added to Day {activeDay}.
//                 </p>

//               </div>

//               {/* CUSTOM */}

//               <div>

//                 <h3 className="font-bold text-sm mb-3">
//                   Add custom plan
//                 </h3>

//                 <div className="space-y-3">

//                   <input
//                     value={
//                       customPlan.name
//                     }
//                     onChange={(e) =>
//                       setCustomPlan(
//                         (
//                           previous
//                         ) => ({
//                           ...previous,
//                           name: e
//                             .target
//                             .value,
//                         })
//                       )
//                     }
//                     placeholder="Plan name — e.g. Airport transfer"
//                     className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#0E978E] focus:ring-2 focus:ring-[#0E978E]/20"
//                   />

//                   <div className="grid grid-cols-2 gap-3">

//                     <select
//                       value={
//                         customPlan.type
//                       }
//                       onChange={(e) =>
//                         setCustomPlan(
//                           (
//                             previous
//                           ) => ({
//                             ...previous,
//                             type: e
//                               .target
//                               .value,
//                           })
//                         )
//                       }
//                       className="px-4 py-3 border border-gray-200 rounded-xl bg-white outline-none focus:border-[#0E978E]"
//                     >

//                       <option value="attraction">
//                         Attraction
//                       </option>

//                       <option value="hotel">
//                         Accommodation
//                       </option>

//                       <option value="restaurant">
//                         Food
//                       </option>

//                       <option value="transportation">
//                         Transportation
//                       </option>

//                     </select>

//                     <input
//                       type="number"
//                       min="0"
//                       value={
//                         customPlan.cost
//                       }
//                       onChange={(e) =>
//                         setCustomPlan(
//                           (
//                             previous
//                           ) => ({
//                             ...previous,
//                             cost: e
//                               .target
//                               .value,
//                           })
//                         )
//                       }
//                       placeholder="Cost / person"
//                       className="px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#0E978E]"
//                     />

//                   </div>

//                   <button
//                     onClick={
//                       addCustomPlan
//                     }
//                     disabled={
//                       addingItem ||
//                       !customPlan.name.trim()
//                     }
//                     className="w-full py-3 bg-[#0E978E] text-white rounded-xl font-semibold hover:bg-[#087C75] transition disabled:opacity-50"
//                   >
//                     {addingItem
//                       ? 'Adding...'
//                       : `Add to Day ${activeDay}`}
//                   </button>

//                 </div>

//               </div>

//             </div>

//           </div>

//         </div>
//       )}

//     </div>
//   );
// }

// /* =========================================================
//    QUICK STAT
// ========================================================= */

// function QuickStat({
//   label,
//   value,
// }) {
//   return (
//     <div className="px-3 py-2 bg-white/70 rounded-xl border border-white">

//       <span className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
//         {label}
//       </span>

//       <span className="ml-2 text-sm font-bold text-gray-800">
//         {value}
//       </span>

//     </div>
//   );
// }

// /* =========================================================
//    BUDGET PIE CHART

//    A donut chart built from stacked SVG circle strokes -- no
//    charting library needed. Segments are drawn in a fixed order
//    (accommodation, transportation, activities, food) using
//    stroke-dasharray/dashoffset, rotated so the first segment
//    starts at 12 o'clock.
// ========================================================= */

// function BudgetPieChart({
//   allocation,
//   costPerPerson,
//   fmt = (n) =>
//     Number(n || 0).toLocaleString(),
// }) {
//   const size = 148;
//   const strokeWidth = 20;
//   const r =
//     (size - strokeWidth) / 2;
//   const cx = size / 2;
//   const cy = size / 2;
//   const circumference =
//     2 * Math.PI * r;

//   let cumulativePct = 0;

//   return (
//     <div
//       className="relative"
//       style={{
//         width: size,
//         height: size,
//       }}
//     >

//       <svg
//         width={size}
//         height={size}
//         viewBox={`0 0 ${size} ${size}`}
//         className="-rotate-90"
//       >

//         <circle
//           cx={cx}
//           cy={cy}
//           r={r}
//           fill="none"
//           stroke="#F1F5F4"
//           strokeWidth={
//             strokeWidth
//           }
//         />

//         {Object.entries(
//           ALLOCATION_META
//         ).map(
//           ([key, meta]) => {

//             const pct = Number(
//               allocation[key] || 0
//             );

//             if (pct <= 0) {
//               return null;
//             }

//             const dash =
//               (pct / 100) *
//               circumference;

//             const gap =
//               circumference -
//               dash;

//             const offset =
//               -(cumulativePct / 100) *
//               circumference;

//             cumulativePct += pct;

//             return (
//               <circle
//                 key={key}
//                 cx={cx}
//                 cy={cy}
//                 r={r}
//                 fill="none"
//                 stroke={meta.color}
//                 strokeWidth={
//                   strokeWidth
//                 }
//                 strokeDasharray={`${dash} ${gap}`}
//                 strokeDashoffset={
//                   offset
//                 }
//               />
//             );
//           }
//         )}

//       </svg>

//       <div className="absolute inset-0 flex flex-col items-center justify-center">

//         <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
//           Total
//         </span>

//         <span className="text-lg font-bold text-gray-900">
//           ${fmt(costPerPerson)}
//         </span>

//       </div>

//     </div>
//   );
// }
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import MapView from '../components/MapView';
import ReviewsSection from '../components/ReviewsSection';
import { useAuth } from '../context/AuthContext';

const TEAL = '#0E978E';
const TEAL_DARK = '#087C75';
const TEAL_LIGHT = '#E8F7F3';

const ALLOCATION_META = {
  accommodation: { label: 'Accommodation', color: '#0E978E' },
  transportation: { label: 'Transport', color: '#5B8DEF' },
  activities: { label: 'Activities', color: '#F5A742' },
  food: { label: 'Food', color: '#E8749E' },
};

export default function TripBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [center, setCenter] = useState([48.8566, 2.3522]);

  const [nearby, setNearby] = useState({
    hotels: [],
    restaurants: [],
    cruises: [],
    attractions: [],
  });

  const [activeDay, setActiveDay] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [removingItem, setRemovingItem] = useState(null);

  const [destinationSearch, setDestinationSearch] = useState('');
  const [searchingDestination, setSearchingDestination] = useState(false);

  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [togglingPublic, setTogglingPublic] = useState(false);
  const [booking, setBooking] = useState(false);
  const [alreadyBooked, setAlreadyBooked] = useState(false);

  const [showAddPlan, setShowAddPlan] = useState(false);

  const [customPlan, setCustomPlan] = useState({
    name: '',
    type: 'attraction',
    cost: '',
  });

  // Flow actions: save itinerary (organizer) / join (public trip viewer)
  const [savingItinerary, setSavingItinerary] = useState(false);
  const [joining, setJoining] = useState(false);

  // Destination hero image (fetched from Wikipedia via /places/photo)
  const [heroImage, setHeroImage] = useState(null);
  const [heroImageError, setHeroImageError] = useState(false);

  // Tracks whether we've already centered the map on this trip's
  // destination, so a background refresh (after adding/removing a plan)
  // doesn't yank the map back and discard wherever the user has since
  // panned/searched to.
  const centeredRef = useRef(false);

  /* =========================================================
     LOAD TRIP
  ========================================================= */

  const load = async () => {
    try {
      setLoading(true);

      const { data } = await client.get(`/trips/${id}`);

      setTrip(data);

      if (data.latitude && data.longitude) {
        setCenter([
          Number(data.latitude),
          Number(data.longitude),
        ]);
      }
    } catch (error) {
      console.error('Failed to load trip:', error);

      if (error?.response?.status === 404) {
        alert('Trip not found.');
        navigate('/trips');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    centeredRef.current = false;
    setHeroImage(null);
    setHeroImageError(false);
    load();
  }, [id]);

  // FIX: custom_trips has no latitude/longitude columns, so the map used to
  // silently stay on its hardcoded Paris default forever. This geocodes the
  // trip's destination_city/destination_country (via the same Nominatim
  // proxy the Explore map uses) and loads real nearby places for it --
  // exactly once per trip, not on every refresh.
  useEffect(() => {
    if (!trip || centeredRef.current) return;

    const query = [
      trip.destination_city,
      trip.destination_country,
    ]
      .filter(Boolean)
      .join(', ');

    if (!query) return;

    centeredRef.current = true;

    (async () => {
      try {
        const { data: results } = await client.get(
          '/places/geocode',
          {
            params: { q: query },
          }
        );

        if (Array.isArray(results) && results.length > 0) {
          const lat = Number(results[0].latitude);
          const lng = Number(results[0].longitude);

          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            await loadNearby(lat, lng);
          }
        }
      } catch (error) {
        console.error(
          'Failed to geocode trip destination:',
          error
        );
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip]);

  // Fetch a hero photo for the destination via the backend Wikipedia proxy.
  // Runs once per destination_city. Fails silently: the UI falls back to a
  // teal tile with the city's first letter.
  useEffect(() => {
    const city = trip?.destination_city?.trim();

    if (!city) return;

    let cancelled = false;

    (async () => {
      try {
        const { data } = await client.get('/places/photo', {
          params: { q: city },
        });

        if (!cancelled) {
          setHeroImage(data?.image || null);
          setHeroImageError(false);
        }
      } catch (error) {
        console.error(
          'Failed to load destination photo:',
          error
        );

        if (!cancelled) {
          setHeroImage(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trip?.destination_city]);

  // Check whether the logged-in traveler already has a (non-cancelled) booking
  // for this trip, so the booking box can show "Booked" instead of letting
  // them book (and pay for) the same trip a second time.
  useEffect(() => {
    if (!user || !id) {
      setAlreadyBooked(false);
      return;
    }

    client
      .get('/bookings/mine')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];

        const hasBooking = list.some(
          (b) =>
            String(b.trip_id) === String(id) &&
            b.booking_status !== 'cancelled'
        );

        setAlreadyBooked(hasBooking);
      })
      .catch(() => setAlreadyBooked(false));
  }, [user, id]);

  /* =========================================================
     COST
  ========================================================= */

  // The budget is NEVER entered manually. The server calculates it from the
  // itinerary item costs (and freezes it when the itinerary is saved).
  const costPerPerson = Number(
    trip?.per_person_cost ?? 0
  );

  const totalGroupCost = Number(
    trip?.total_group_cost ?? costPerPerson
  );

  const breakdown = trip?.cost_breakdown || {};

  const members = Number(
    trip?.max_travelers ?? 1
  );

  const safeMembers = Math.max(members, 1);

  // Percentages for the donut chart, derived from the calculated amounts.
  const breakdownPct = useMemo(() => {
    const total = Object.keys(ALLOCATION_META).reduce(
      (sum, k) =>
        sum + Number(breakdown[k] || 0),
      0
    );

    const out = {};

    for (const key of Object.keys(ALLOCATION_META)) {
      out[key] =
        total > 0
          ? (Number(breakdown[key] || 0) / total) * 100
          : 0;
    }

    return out;
  }, [trip?.cost_breakdown]);

  const canEdit = !!trip?.can_edit_itinerary;

  const canInviteOrPublish =
    !!trip?.can_publish_or_invite;

  const fmt = (n) =>
    Number(n || 0).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });

  /* =========================================================
     FLOW ACTIONS
  ========================================================= */

  const saveItinerary = async () => {
    if (savingItinerary) return;

    const ok = window.confirm(
      'Save this itinerary?\n\nOnce saved, the plans and the calculated cost can no longer be changed by anyone, including you. You can then book your trip.'
    );

    if (!ok) return;

    try {
      setSavingItinerary(true);

      await client.post(
        `/trips/${id}/save-itinerary`
      );

      await load();
    } catch (error) {
      console.error(
        'Failed to save itinerary:',
        error
      );

      alert(
        error?.response?.data?.error ||
          'Could not save the itinerary.'
      );
    } finally {
      setSavingItinerary(false);
    }
  };

  const joinTrip = async () => {
    if (joining) return;

    try {
      setJoining(true);

      await client.post(
        `/trips/${id}/join`
      );

      await load();
    } catch (error) {
      console.error(
        'Failed to join trip:',
        error
      );

      alert(
        error?.response?.data?.error ||
          'Could not join this trip.'
      );
    } finally {
      setJoining(false);
    }
  };

  /* =========================================================
     LOAD NEARBY
  ========================================================= */

  const loadNearby = async (lat, lng) => {
    try {
      setLoadingNearby(true);

      setCenter([lat, lng]);

      const { data } = await client.get(
        '/places/nearby',
        {
          params: {
            lat,
            lng,
            radius_km: 15,
          },
        }
      );

      setNearby({
        hotels:
          data?.results?.hotels || [],
        restaurants:
          data?.results?.restaurants || [],
        cruises:
          data?.results?.cruises || [],
        attractions:
          data?.results?.attractions || [],
      });
    } catch (error) {
      console.error(
        'Failed to load nearby places:',
        error
      );

      setNearby({
        hotels: [],
        restaurants: [],
        cruises: [],
        attractions: [],
      });
    } finally {
      setLoadingNearby(false);
    }
  };

  /* =========================================================
     DESTINATION SEARCH
  ========================================================= */

  const searchDestination = async (e) => {
    e?.preventDefault();

    if (!destinationSearch.trim()) return;

    try {
      setSearchingDestination(true);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          destinationSearch
        )}&limit=1`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          'Destination search failed'
        );
      }

      const results = await response.json();

      if (!results.length) {
        alert('Destination not found.');
        return;
      }

      const location = results[0];

      const lat = Number(location.lat);
      const lng = Number(location.lon);

      setCenter([lat, lng]);

      await loadNearby(lat, lng);
    } catch (error) {
      console.error(
        'Destination search failed:',
        error
      );

      alert(
        'Unable to search this destination.'
      );
    } finally {
      setSearchingDestination(false);
    }
  };

  /* =========================================================
     ADD PLACE TO ITINERARY
  ========================================================= */

  const addToItinerary = async (marker) => {
    if (
      !canEdit ||
      !marker?.id ||
      addingItem
    ) {
      return;
    }

    try {
      setAddingItem(true);

      const payload = {
        day_number: activeDay,
      };

      if (
        marker.place_type === 'hotel'
      ) {
        payload.hotel_id = marker.id;
      } else if (
        marker.place_type === 'restaurant'
      ) {
        payload.restaurant_id = marker.id;
      } else if (
        marker.place_type === 'cruise'
      ) {
        payload.cruise_id = marker.id;
      } else {
        payload.place_id = marker.id;
      }

      await client.post(
        `/trips/${id}/itinerary`,
        payload
      );

      await load();
    } catch (error) {
      console.error(
        'Failed to add itinerary item:',
        error
      );

      alert(
        error?.response?.data?.error ||
          'Could not add this place to your itinerary.'
      );
    } finally {
      setAddingItem(false);
    }
  };

  /* =========================================================
     CUSTOM PLAN
  ========================================================= */

  const addCustomPlan = async () => {
    if (!canEdit) return;

    if (!customPlan.name.trim()) {
      alert('Please enter a plan name.');
      return;
    }

    try {
      setAddingItem(true);

      await client.post(
        `/trips/${id}/itinerary`,
        {
          day_number: activeDay,
          custom_name:
            customPlan.name.trim(),
          custom_type: customPlan.type,
          estimated_cost:
            Number(customPlan.cost) || 0,
        }
      );

      setCustomPlan({
        name: '',
        type: 'attraction',
        cost: '',
      });

      setShowAddPlan(false);

      await load();
    } catch (error) {
      console.error(
        'Failed to add custom plan:',
        error
      );

      alert(
        error?.response?.data?.error ||
          'Could not add the custom plan.'
      );
    } finally {
      setAddingItem(false);
    }
  };

  /* =========================================================
     REMOVE ITEM
  ========================================================= */

  const removeItem = async (itemId) => {
    if (
      !canEdit ||
      !itemId ||
      removingItem
    ) {
      return;
    }

    try {
      setRemovingItem(itemId);

      await client.delete(
        `/trips/${id}/itinerary/${itemId}`
      );

      await load();
    } catch (error) {
      console.error(
        'Failed to remove itinerary item:',
        error
      );

      alert(
        error?.response?.data?.error ||
          'Could not remove this itinerary item.'
      );
    } finally {
      setRemovingItem(null);
    }
  };

  /* =========================================================
     INVITE
  ========================================================= */

  const createInvite = async () => {
    if (!canInviteOrPublish) return;

    try {
      setInviteLoading(true);

      const { data } = await client.post(
        `/trips/${id}/invite`
      );

      if (!data?.invite_link) {
        throw new Error(
          'Invite link was not returned.'
        );
      }

      const link =
        data.invite_link.startsWith('http')
          ? data.invite_link
          : `${window.location.origin}${data.invite_link}`;

      setInviteLink(link);
    } catch (error) {
      console.error(
        'Failed to create invite:',
        error
      );

      alert(
        error?.response?.data?.error ||
          'Could not create invite link.'
      );
    } finally {
      setInviteLoading(false);
    }
  };

  /* =========================================================
     COPY INVITE
  ========================================================= */

  const copyInvite = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(
        inviteLink
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        'Copy failed:',
        error
      );

      alert(
        'Could not copy the invitation link.'
      );
    }
  };

  /* =========================================================
     PUBLIC / PRIVATE
  ========================================================= */

  const togglePublic = async () => {
    if (
      !trip ||
      togglingPublic ||
      !canInviteOrPublish
    ) {
      return;
    }

    try {
      setTogglingPublic(true);

      await client.patch(
        `/trips/${id}`,
        {
          is_public: !trip.is_public,
        }
      );

      await load();
    } catch (error) {
      console.error(
        'Failed to update trip visibility:',
        error
      );

      alert(
        error?.response?.data?.error ||
          'Could not update trip visibility.'
      );
    } finally {
      setTogglingPublic(false);
    }
  };

  /* =========================================================
     BOOKING
  ========================================================= */

  const proceedToBooking = async () => {
    if (
      booking ||
      alreadyBooked ||
      !trip?.can_book
    ) {
      return;
    }

    try {
      setBooking(true);

      const { data } =
        await client.post(
          '/bookings',
          {
            booking_type:
              'custom_trip',
            trip_id: Number(id),
          }
        );

      if (!data?.booking_id) {
        throw new Error(
          'Booking ID was not returned.'
        );
      }

      setAlreadyBooked(true);

      navigate(
        `/checkout/${data.booking_id}`
      );
    } catch (error) {
      console.error(
        'Failed to create booking:',
        error
      );

      alert(
        error?.response?.data?.error ||
          'Unable to continue to booking.'
      );
    } finally {
      setBooking(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading || !trip) {
    return (
      <div className="min-h-screen bg-[#F5F8F7] flex items-center justify-center">
        <div className="text-center">

          <div
            className="w-11 h-11 border-4 border-[#D9EFEB] rounded-full animate-spin mx-auto mb-4"
            style={{
              borderTopColor: TEAL,
            }}
          />

          <p className="text-gray-600 font-medium">
            Loading your trip...
          </p>

        </div>
      </div>
    );
  }

  /* =========================================================
     DERIVED DATA
  ========================================================= */

  const markers = [
    ...(nearby.hotels || []).map(
      (item) => ({
        ...item,
        place_type: 'hotel',
      })
    ),

    ...(nearby.restaurants || []).map(
      (item) => ({
        ...item,
        place_type: 'restaurant',
      })
    ),

    ...(nearby.cruises || []).map(
      (item) => ({
        ...item,
        place_type: 'cruise',
      })
    ),

    ...(nearby.attractions || []).map(
      (item) => ({
        ...item,
        place_type: 'attraction',
      })
    ),
  ];

  const days = Array.from(
    {
      length:
        Number(trip.duration_days) || 1,
    },
    (_, i) => i + 1
  );

  // Permissions/flow come from the server
  // (and are enforced there too).
  const isOrganizer =
    !!trip.is_organizer;

  const isMember =
    !!trip.is_member;

  const itineraryLocked =
    !!trip.itinerary_locked;

  const organizerBooked =
    !!trip.organizer_booked;

  const activeDayItems =
    trip.itinerary?.filter(
      (item) =>
        Number(item.day_number) ===
        Number(activeDay)
    ) || [];

  const totalItems =
    trip.itinerary?.length || 0;

  // Slots are occupied ONLY by travelers whose booking is confirmed.
  // Travelers who joined but are not confirmed yet are listed separately
  // and hold no slot.
  const joinedMembers =
    trip.members?.filter(
      (member) =>
        member.confirmed === true
    ) || [];

  const confirmedMembers =
    joinedMembers.filter(
      (member) => member.booked
    );

  const pendingMembers =
    joinedMembers.filter(
      (member) => !member.booked
    );

  const confirmedCount = Number(
    trip.seats_taken ??
      confirmedMembers.length
  );

  const pendingCount =
    pendingMembers.length;

  const tripFull =
    trip.is_full ??
    confirmedCount >= safeMembers;

  // Destination photo
  const showHeroImage =
    !!heroImage && !heroImageError;

  const cityInitial =
    (
      trip.destination_city || '?'
    )
      .charAt(0)
      .toUpperCase();

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#F5F8F7] text-gray-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="bg-white border-b border-gray-200">

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

          {/* Breadcrumb */}

          <div className="flex items-center gap-2 text-sm mb-5">

            <Link
              to="/trips"
              className="text-gray-400 hover:text-[#0E978E] transition"
            >
              My Trips
            </Link>

            <span className="text-gray-300">
              /
            </span>

            <span className="text-gray-500">
              Trip Builder
            </span>

          </div>

          {/* MAIN TOP CARD */}

          <div className="rounded-3xl bg-[#E8F7F3] border border-[#CDECE5] overflow-hidden">

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] items-stretch">

              {/* LEFT — TEXT */}

              <div className="order-2 md:order-1 bg-white p-8 md:p-12 flex flex-col justify-center min-w-0 h-full rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none md:rounded-r-[3rem] md:relative md:z-10 md:shadow-[8px_0_24px_-12px_rgba(0,0,0,0.15)]">

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F7F3] text-[#087C75] text-xs font-bold tracking-wide uppercase w-fit">

                  <span className="w-2 h-2 rounded-full bg-[#0E978E]" />

                  Trip Builder

                </div>

                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-4 leading-tight">

                  {trip.title}

                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-gray-600">

                  <span>
                    📍 {trip.destination_city},{' '}
                    {trip.destination_country}
                  </span>

                  <span className="hidden sm:inline text-gray-300">
                    •
                  </span>

                  <span className="tabular-nums">
                    {trip.duration_days} days
                  </span>

                  <span className="hidden sm:inline text-gray-300">
                    •
                  </span>

                  <span className="tabular-nums">
                    {confirmedCount}/
                    {safeMembers} travelers
                  </span>

                  <span className="hidden sm:inline text-gray-300">
                    •
                  </span>

                  <span className="font-semibold text-[#087C75] tabular-nums">
                    ${fmt(costPerPerson)} / person
                  </span>

                </div>

                {/* QUICK STATS */}

                <div className="flex flex-wrap gap-2 mt-6">

                  <QuickStat
                    label="Plans"
                    value={totalItems}
                  />

                  <QuickStat
                    label="Days"
                    value={
                      trip.duration_days ||
                      1
                    }
                  />

                  <QuickStat
                    label="Travelers"
                    value={
                      confirmedCount
                    }
                  />

                  <QuickStat
                    label="Per person"
                    value={`$${fmt(
                      costPerPerson
                    )}`}
                  />

                </div>

              </div>

              {/* RIGHT — DESTINATION PHOTO */}

              <div className="order-1 md:order-2 relative w-full h-72 md:h-full md:min-h-[480px] md:-ml-6">

                {showHeroImage ? (
                  <img
                    src={heroImage}
                    alt={
                      trip.destination_city ||
                      'Destination'
                    }
                    onError={() =>
                      setHeroImageError(true)
                    }
                    className="object-cover w-full h-full rounded-t-3xl md:rounded-tr-3xl md:rounded-br-3xl md:rounded-tl-none md:rounded-bl-none ring-1 ring-black/5"
                  />
                ) : (
                  <div
                    className="w-full h-full min-h-[288px] md:min-h-[480px] flex items-center justify-center text-7xl md:text-8xl font-bold rounded-t-3xl md:rounded-tr-3xl md:rounded-br-3xl md:rounded-tl-none md:rounded-bl-none ring-1 ring-black/5"
                    style={{
                      backgroundColor: TEAL,
                      color: '#fff',
                    }}
                    aria-hidden="true"
                  >
                    {cityInitial}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none rounded-t-3xl md:rounded-tr-3xl md:rounded-br-3xl md:rounded-tl-none md:rounded-bl-none" />

              </div>

            </div>

            {/* ACTIONS */}

            <div className="px-5 md:px-7 pb-5 md:pb-7">

              <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-[#CDECE5]">

                {isOrganizer && (
                  <>

                    <button
                      onClick={
                        createInvite
                      }
                      disabled={
                        inviteLoading ||
                        !canInviteOrPublish
                      }
                      title={
                        canInviteOrPublish
                          ? ''
                          : 'Save your itinerary and book your own trip first'
                      }
                      className="px-4 py-2.5 bg-[#0E978E] text-white rounded-xl text-sm font-semibold hover:bg-[#087C75] transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {inviteLoading
                        ? 'Generating...'
                        : '🔗 Invite travelers'}
                    </button>

                    <button
                      onClick={
                        togglePublic
                      }
                      disabled={
                        togglingPublic ||
                        !canInviteOrPublish
                      }
                      title={
                        canInviteOrPublish
                          ? ''
                          : 'Save your itinerary and book your own trip first'
                      }
                      className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:border-[#0E978E] hover:text-[#087C75] transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {togglingPublic
                        ? 'Updating...'
                        : trip.is_public
                        ? '🌐 Public'
                        : '🔒 Private'}
                    </button>

                    {!canInviteOrPublish && (
                      <span className="text-xs text-gray-500">
                        {!itineraryLocked
                          ? 'Save the itinerary, then book your trip to invite travelers or go public.'
                          : 'Book your trip to invite travelers or go public.'}
                      </span>
                    )}

                  </>
                )}

                {canEdit && (
                  <button
                    onClick={() =>
                      setShowAddPlan(
                        true
                      )
                    }
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:border-[#0E978E] hover:text-[#087C75] transition"
                  >
                    + Add plan
                  </button>
                )}

                <Link
                  to={`/trips/${id}/split`}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:border-[#0E978E] hover:text-[#087C75] transition"
                >
                  Cost split
                </Link>

              </div>

            </div>

          </div>

          {/* COST SUMMARY */}

          <div className="mt-5 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              {/* LEFT — NUMBERS */}

              <div className="min-w-0">

                <p className="text-xs font-bold text-[#087C75] uppercase tracking-wider">
                  Cost per person
                </p>

                <p className="text-3xl font-bold text-gray-900 tracking-tight tabular-nums mt-1">
                  ${fmt(costPerPerson)}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  ${fmt(totalGroupCost)} total for{' '}
                  <span className="tabular-nums">
                    {Math.max(
                      confirmedCount,
                      1
                    )}
                  </span>{' '}
                  {Math.max(
                    confirmedCount,
                    1
                  ) === 1
                    ? 'traveler'
                    : 'travelers'}{' '}
                  ·{' '}
                  {itineraryLocked
                    ? 'Calculated from your saved itinerary'
                    : 'Calculated automatically from your plans'}
                </p>

              </div>

              {/* RIGHT — ACTION / STATUS */}

              <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-2">

                {alreadyBooked ? (
                  <Link
                    to="/bookings"
                    className="inline-flex items-center justify-center bg-[#E8F7F3] text-[#087C75] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#D5F1EB] transition whitespace-nowrap"
                  >
                    Booked · view in My Bookings
                  </Link>
                ) : (
                  <>
                    {isOrganizer &&
                      !itineraryLocked && (
                        <button
                          onClick={
                            saveItinerary
                          }
                          disabled={
                            savingItinerary ||
                            !trip.can_save_itinerary
                          }
                          className="w-full sm:w-auto min-w-[190px] py-2.5 px-5 rounded-xl text-white font-semibold transition disabled:opacity-50"
                          style={{
                            backgroundColor:
                              TEAL,
                          }}
                        >
                          {savingItinerary
                            ? 'Saving...'
                            : 'Save itinerary'}
                        </button>
                      )}

                    {trip.can_book && (
                      <button
                        onClick={
                          proceedToBooking
                        }
                        disabled={
                          booking ||
                          alreadyBooked
                        }
                        className="w-full sm:w-auto min-w-[190px] py-2.5 px-5 rounded-xl text-white font-semibold transition disabled:opacity-50"
                        style={{
                          backgroundColor:
                            TEAL,
                        }}
                        onMouseEnter={(e) => {
                          if (!booking) {
                            e.currentTarget.style.backgroundColor =
                              TEAL_DARK;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            TEAL;
                        }}
                      >
                        {booking
                          ? 'Preparing booking...'
                          : isOrganizer
                          ? 'Book my trip'
                          : 'Book my spot'}
                      </button>
                    )}

                    {!isMember &&
                      trip.is_public &&
                      organizerBooked && (
                        <button
                          onClick={
                            joinTrip
                          }
                          disabled={
                            joining ||
                            tripFull
                          }
                          className="w-full sm:w-auto min-w-[190px] py-2.5 px-5 rounded-xl text-white font-semibold transition disabled:opacity-50"
                          style={{
                            backgroundColor:
                              TEAL,
                          }}
                        >
                          {tripFull
                            ? 'Trip full'
                            : joining
                            ? 'Joining...'
                            : 'Join trip'}
                        </button>
                      )}
                  </>
                )}

                {tripFull &&
                  isMember &&
                  !alreadyBooked && (
                    <p className="text-xs text-right text-red-500 font-medium max-w-sm">
                      This trip is full. All slots are taken by confirmed bookings, so booking is closed.
                    </p>
                  )}

                {isMember &&
                  itineraryLocked &&
                  alreadyBooked && (
                    <p
                      className="text-xs text-right"
                      style={{
                        color: TEAL_DARK,
                      }}
                    >
                      You have a booking for this trip —{' '}
                      <Link
                        to="/bookings"
                        className="underline font-semibold"
                      >
                        view it in My Bookings
                      </Link>
                      .
                    </p>
                  )}

                {isOrganizer &&
                  itineraryLocked &&
                  !organizerBooked &&
                  !alreadyBooked && (
                    <p className="text-xs text-right text-gray-500 max-w-sm">
                      Itinerary saved. Book your trip to unlock invites and public listing.
                    </p>
                  )}

                {isMember &&
                  !isOrganizer &&
                  !organizerBooked && (
                    <p className="text-xs text-right text-gray-500 max-w-sm">
                      Waiting for the organizer to book this trip.
                    </p>
                  )}

                {isOrganizer &&
                  !itineraryLocked &&
                  !trip.can_save_itinerary && (
                    <p className="text-xs text-right text-gray-500 max-w-sm">
                      {totalItems === 0
                        ? 'Add plans to your days, then save the itinerary.'
                        : 'Saving locks the plans and cost. Next you can book your trip.'}
                    </p>
                  )}

              </div>

            </div>

          </div>

          {/* INVITE */}

          {inviteLink && (
            <div className="mt-4 p-4 rounded-2xl bg-[#E8F7F3] border border-[#BDE9E0]">

              <div className="flex flex-col md:flex-row md:items-center gap-3">

                <div className="flex-1 min-w-0">

                  <p className="text-xs font-bold text-[#087C75] uppercase tracking-wide mb-1">
                    Invitation link
                  </p>

                  <p className="text-sm font-mono text-gray-700 break-all">
                    {inviteLink}
                  </p>

                </div>

                <button
                  onClick={
                    copyInvite
                  }
                  className="px-4 py-2.5 bg-white border border-[#BDE9E0] rounded-xl text-sm font-semibold text-[#087C75] hover:bg-[#DDF3EE] transition"
                >
                  {copied
                    ? '✓ Copied'
                    : 'Copy link'}
                </button>

              </div>

            </div>
          )}

        </div>

      </header>

      {/* =====================================================
          CALCULATED BUDGET
      ===================================================== */}

      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-5">

        <div className="bg-white border border-gray-200 rounded-2xl p-5">

          <div className="flex flex-col lg:flex-row lg:items-start gap-6">

            <div className="flex items-center gap-5 shrink-0">

              <BudgetPieChart
                allocation={
                  breakdownPct
                }
                costPerPerson={
                  costPerPerson
                }
                fmt={fmt}
              />

            </div>

            <div className="flex-1 min-w-0">

              <div className="mb-3">

                <p className="text-xs font-bold text-[#087C75] uppercase tracking-wider">
                  Trip budget (calculated)
                </p>

                <p className="text-xs text-gray-500 mt-0.5">
                  <span className="tabular-nums">
                    ${fmt(costPerPerson)}
                  </span>{' '}
                  / person ·{' '}
                  <span className="tabular-nums">
                    ${fmt(totalGroupCost)}
                  </span>{' '}
                  for{' '}
                  <span className="tabular-nums">
                    {Math.max(
                      confirmedCount,
                      1
                    )}
                  </span>{' '}
                  {Math.max(
                    confirmedCount,
                    1
                  ) === 1
                    ? 'traveler'
                    : 'travelers'}.{' '}
                  {itineraryLocked
                    ? 'Locked with your saved itinerary.'
                    : 'Updates as you add or remove plans; locks when you save the itinerary.'}
                </p>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                {Object.entries(
                  ALLOCATION_META
                ).map(
                  ([key, meta]) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 bg-[#FAFCFB] border border-gray-100 rounded-xl px-3 py-2.5"
                    >

                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            meta.color,
                        }}
                      />

                      <span className="text-xs font-semibold text-gray-700 flex-1 truncate">
                        {meta.label}
                      </span>

                      <span className="text-xs text-gray-400 tabular-nums">
                        {Math.round(
                          breakdownPct[
                            key
                          ] || 0
                        )}
                        %
                      </span>

                      <span className="text-xs font-bold text-[#087C75] w-16 text-right shrink-0 tabular-nums">
                        $
                        {fmt(
                          breakdown[
                            key
                          ] || 0
                        )}
                      </span>

                    </div>
                  )
                )}

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-5 items-start">

          {/* =================================================
              LEFT — EXPLORE
          ================================================= */}

          <section className="min-w-0">

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

              {/* SEARCH */}

              <div className="p-5 border-b border-gray-200">

                <div className="flex flex-col sm:flex-row gap-3">

                  <form
                    onSubmit={
                      searchDestination
                    }
                    className="flex-1"
                  >

                    <div className="flex gap-2">

                      <div className="relative flex-1">

                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                          🔎
                        </span>

                        <input
                          value={
                            destinationSearch
                          }
                          onChange={(e) =>
                            setDestinationSearch(
                              e.target
                                .value
                            )
                          }
                          placeholder="Search Tokyo, Paris, Bali..."
                          className="w-full pl-11 pr-4 py-3 bg-[#F7FAF9] border border-gray-200 rounded-xl outline-none focus:border-[#0E978E] focus:ring-2 focus:ring-[#0E978E]/20 transition"
                        />

                      </div>

                      <button
                        type="submit"
                        disabled={
                          searchingDestination
                        }
                        className="px-5 py-3 bg-[#0E978E] text-white rounded-xl font-semibold hover:bg-[#087C75] transition disabled:opacity-50"
                      >
                        {searchingDestination
                          ? 'Searching...'
                          : 'Search'}
                      </button>

                    </div>

                  </form>

                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">

                  <div>

                    <div className="flex items-center gap-2">

                      <h2 className="font-bold text-lg">
                        Explore{' '}
                        {
                          trip.destination_city
                        }
                      </h2>

                      {loadingNearby && (
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-[#0E978E] rounded-full animate-spin" />
                      )}

                    </div>

                    <p className="text-xs text-gray-500 mt-1">
                      {canEdit
                        ? `Click a place on the map to add it to Day ${activeDay}.`
                        : 'Explore the destination. The itinerary is managed by the organizer.'}
                    </p>

                  </div>

                  <div className="flex items-center gap-2 text-xs">

                    <span className="px-2.5 py-1 rounded-full bg-[#E8F7F3] text-[#087C75] font-semibold tabular-nums">
                      {markers.length}{' '}
                      nearby
                    </span>

                    {addingItem && (
                      <span className="text-[#087C75] font-medium">
                        Adding...
                      </span>
                    )}

                  </div>

                </div>

              </div>

              {/* MAP */}

              <div className="relative">

                <MapView
                  center={center}
                  markers={markers}
                  onMarkerClick={
                    canEdit
                      ? addToItinerary
                      : undefined
                  }
                  onMapClick={(
                    latlng
                  ) =>
                    loadNearby(
                      latlng.lat,
                      latlng.lng
                    )
                  }
                  height="420px"
                />

              </div>

              {/* MAP FOOTER */}

              <div className="px-5 py-3 bg-[#FAFCFB] border-t border-gray-100">

                <div className="flex flex-wrap items-center justify-between gap-3">

                  <div className="flex flex-wrap gap-3 text-xs text-gray-600">

                    <span>
                      🏨 Hotels
                    </span>

                    <span>
                      🍽 Restaurants
                    </span>

                    <span>
                      🚢 Cruises
                    </span>

                    <span>
                      📍 Attractions
                    </span>

                  </div>

                  <p className="text-xs text-gray-400">
                    Click anywhere on the map to explore
                  </p>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              RIGHT — ITINERARY
          ================================================= */}

          <aside className="space-y-5">

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

              {/* HEADER */}

              <div className="p-5 border-b border-gray-200">

                <div className="flex items-center justify-between gap-3">

                  <div>

                    <p className="text-xs uppercase tracking-wider text-[#087C75] font-bold">
                      Your plan
                    </p>

                    <h2 className="font-bold text-xl mt-1">
                      Itinerary
                    </h2>

                    <p className="text-xs text-gray-500 mt-1">
                      {canEdit
                        ? 'Build your trip day by day, then save the itinerary.'
                        : itineraryLocked
                        ? 'Saved itinerary — read only.'
                        : 'The organizer is still building this itinerary.'}
                    </p>

                  </div>

                  <div className="bg-[#E8F7F3] text-[#087C75] px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap tabular-nums">
                    {totalItems}{' '}
                    plans
                  </div>

                </div>

              </div>

              {/* DAYS */}

              <div className="px-4 py-3 border-b border-gray-100">

                <div className="flex gap-2 overflow-x-auto pb-1">

                  {days.map((day) => {

                    const count =
                      trip.itinerary?.filter(
                        (item) =>
                          Number(
                            item.day_number
                          ) ===
                          Number(day)
                      ).length || 0;

                    return (
                      <button
                        key={day}
                        onClick={() =>
                          setActiveDay(
                            day
                          )
                        }
                        className={`
                          flex-shrink-0 px-4 py-2.5 rounded-xl
                          border text-sm font-semibold transition tabular-nums
                          ${
                            activeDay ===
                            day
                              ? 'bg-[#0E978E] border-[#0E978E] text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-[#0E978E] hover:text-[#087C75]'
                          }
                        `}
                      >
                        Day {day}

                        {count >
                          0 && (
                          <span className="ml-1 opacity-70 tabular-nums">
                            · {count}
                          </span>
                        )}

                      </button>
                    );
                  })}

                </div>

              </div>

              {/* ACTIVE DAY */}

              <div className="p-4">

                <div className="flex items-center justify-between mb-4">

                  <div>

                    <p className="text-xs uppercase tracking-wider text-[#087C75] font-bold tabular-nums">
                      Day {activeDay}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {activeDayItems.length ===
                      0
                        ? 'Nothing planned yet'
                        : `${activeDayItems.length} ${
                            activeDayItems.length ===
                            1
                              ? 'activity'
                              : 'activities'
                          }`}
                    </p>

                  </div>

                  {canEdit && (
                    <button
                      onClick={() =>
                        setShowAddPlan(
                          true
                        )
                      }
                      className="w-10 h-10 rounded-xl bg-[#E8F7F3] text-[#087C75] font-bold hover:bg-[#D5F1EB] transition text-lg"
                    >
                      +
                    </button>
                  )}

                </div>

                {/* EMPTY */}

                {activeDayItems.length ===
                  0 && (
                  <div className="py-10 px-5 text-center border border-dashed border-gray-200 rounded-2xl">

                    <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E8F7F3] flex items-center justify-center text-xl mb-3">
                      📍
                    </div>

                    <p className="font-semibold text-gray-700">
                      Day {activeDay}{' '}
                      is empty
                    </p>

                    {canEdit ? (
                      <>

                        <p className="text-xs text-gray-500 mt-1 mb-4">
                          Select a place from the map or add a custom plan.
                        </p>

                        <button
                          onClick={() =>
                            setShowAddPlan(
                              true
                            )
                          }
                          className="px-4 py-2.5 bg-[#0E978E] text-white rounded-xl text-sm font-semibold hover:bg-[#087C75] transition"
                        >
                          + Add plan
                        </button>

                      </>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        Nothing planned for this day.
                      </p>
                    )}

                  </div>
                )}

                {/* ITEMS */}

                <div className="space-y-2.5">

                  {activeDayItems.map(
                    (
                      item,
                      index
                    ) => {

                      const name =
                        item.hotel_name ||
                        item.restaurant_name ||
                        item.cruise_name ||
                        item.place_name ||
                        item.custom_name ||
                        'Untitled plan';

                      const type =
                        item.hotel_name
                          ? 'Accommodation'
                          : item.restaurant_name
                          ? 'Restaurant'
                          : item.cruise_name
                          ? 'Cruise'
                          : item.custom_name
                          ? item.custom_type ||
                            'Custom plan'
                          : 'Attraction';

                      const cost =
                        Number(
                          item.cost_per_person ??
                            item.estimated_cost ??
                            0
                        );

                      return (
                        <div
                          key={
                            item.itinerary_id ||
                            `${item.day_number}-${index}`
                          }
                          className="group bg-[#FAFCFB] border border-gray-200 rounded-xl p-3 hover:border-[#BDE9E0] transition"
                        >

                          <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-xl bg-[#E8F7F3] text-[#087C75] flex items-center justify-center text-xs font-bold shrink-0 tabular-nums">
                              {index +
                                1}
                            </div>

                            <div className="flex-1 min-w-0">

                              <p className="font-semibold text-sm truncate">
                                {name}
                              </p>

                              <p className="text-xs text-gray-500 mt-1">
                                {type}
                              </p>

                            </div>

                            <div className="text-right shrink-0">

                              <p className="font-bold text-sm tabular-nums">
                                $
                                {cost.toFixed(
                                  0
                                )}
                              </p>

                              {canEdit &&
                                item.itinerary_id && (
                                  <button
                                    onClick={() =>
                                      removeItem(
                                        item.itinerary_id
                                      )
                                    }
                                    disabled={
                                      removingItem ===
                                      item.itinerary_id
                                    }
                                    className="text-xs text-red-400 hover:text-red-600 mt-1 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                                  >
                                    {removingItem ===
                                    item.itinerary_id
                                      ? 'Removing...'
                                      : 'Remove'}
                                  </button>
                                )}

                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

            </div>

            {/* =================================================
                TRAVELERS
            ================================================= */}

            <div className="bg-white border border-gray-200 rounded-2xl p-5">

              <div className="flex items-center justify-between mb-4">

                <div>

                  <p className="text-xs uppercase tracking-wider text-[#087C75] font-bold">
                    Trip group
                  </p>

                  <h3 className="font-bold text-lg mt-1">
                    Travelers
                  </h3>

                  <p className="text-xs text-gray-500 mt-1 tabular-nums">
                    {confirmedCount}{' '}
                    confirmed ·{' '}
                    {Math.max(
                      safeMembers -
                        confirmedCount,
                      0
                    )}{' '}
                    slots left
                    {pendingCount >
                      0 &&
                      ` · ${pendingCount} awaiting confirmation`}
                  </p>

                </div>

                <div className="bg-[#E8F7F3] text-[#087C75] px-3 py-1.5 rounded-full text-xs font-bold tabular-nums">
                  {confirmedCount}/
                  {safeMembers}
                </div>

              </div>

              <div className="space-y-2.5">

                {confirmedMembers.length ===
                  0 && (
                  <div className="text-center py-5 bg-[#FAFCFB] rounded-xl">

                    <p className="text-sm text-gray-500">
                      No confirmed travelers yet. A slot is only taken once a booking is confirmed.
                    </p>

                    {canInviteOrPublish && (
                      <button
                        onClick={
                          createInvite
                        }
                        className="text-xs font-semibold text-[#087C75] mt-2 hover:underline"
                      >
                        Invite someone
                      </button>
                    )}

                  </div>
                )}

                {confirmedMembers.map(
                  (member) => (

                    <div
                      key={
                        member.user_id
                      }
                      className="flex items-center gap-3"
                    >

                      <div className="w-9 h-9 rounded-full bg-[#E8F7F3] flex items-center justify-center text-sm font-bold text-[#087C75]">
                        {(
                          member.full_name ||
                          'U'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-semibold truncate">
                          {member.full_name ||
                            'Traveler'}
                        </p>

                        <p className="text-xs text-gray-500">
                          {member.role ===
                          'organizer'
                            ? 'Organizer'
                            : 'Traveler'}
                        </p>

                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">

                        {member.role ===
                          'organizer' && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-[#087C75] bg-[#E8F7F3] px-2 py-1 rounded-full">
                            Host
                          </span>
                        )}

                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                          Confirmed
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

              {pendingCount >
                0 && (
                <div className="mt-5 pt-4 border-t border-gray-100">

                  <p className="text-xs uppercase tracking-wider text-amber-700 font-bold">
                    Joined · awaiting confirmation (
                    {pendingCount})
                  </p>

                  <p className="text-xs text-gray-500 mt-1 mb-3">
                    These travelers joined but have not completed a confirmed booking, so they do not hold a slot yet.
                  </p>

                  <div className="space-y-2.5">

                    {pendingMembers.map(
                      (member) => (
                        <div
                          key={
                            member.user_id
                          }
                          className="flex items-center gap-3"
                        >

                          <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-sm font-bold text-amber-700">
                            {(
                              member.full_name ||
                              'U'
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">

                            <p className="text-sm font-semibold truncate">
                              {member.full_name ||
                                'Traveler'}
                            </p>

                            <p className="text-xs text-gray-500">
                              {member.role ===
                              'organizer'
                                ? 'Organizer'
                                : 'Traveler'}
                            </p>

                          </div>

                          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                            {member.booking_status ===
                            'pending'
                              ? 'Payment pending'
                              : 'Not booked'}
                          </span>

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

            </div>

          </aside>

        </div>

        {/* =================================================
            TRIP REVIEWS
        ================================================= */}

        <section className="mt-5 bg-white border border-gray-200 rounded-2xl p-6">

          <ReviewsSection
            entityKey="trip_id"
            entityId={trip.trip_id}
            hint="Only travelers who joined this trip (not the organizer) can review it, once each."
          />

        </section>

      </main>

      {/* =====================================================
          ADD PLAN MODAL
      ===================================================== */}

      {showAddPlan && (
        <div className="fixed inset-0 z-[3000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

            {/* HEADER */}

            <div className="p-6 border-b border-gray-100 flex items-center justify-between">

              <div>

                <p className="text-xs uppercase tracking-wide text-[#087C75] font-bold tabular-nums">
                  Day {activeDay}
                </p>

                <h2 className="text-xl font-bold mt-1">
                  Add a plan
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Add something to your itinerary.
                </p>

              </div>

              <button
                onClick={() =>
                  setShowAddPlan(false)
                }
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
              >
                ✕
              </button>

            </div>

            <div className="p-6">

              {/* QUICK HELP */}

              <div className="mb-5 p-4 bg-[#E8F7F3] rounded-2xl">

                <p className="text-sm font-semibold text-[#087C75]">
                  Want to add a place from the map?
                </p>

                <p className="text-xs text-gray-600 mt-1">
                  Close this window and click any nearby marker. It will automatically be added to Day {activeDay}.
                </p>

              </div>

              {/* CUSTOM */}

              <div>

                <h3 className="font-bold text-sm mb-3">
                  Add custom plan
                </h3>

                <div className="space-y-3">

                  <input
                    value={
                      customPlan.name
                    }
                    onChange={(e) =>
                      setCustomPlan(
                        (
                          previous
                        ) => ({
                          ...previous,
                          name: e
                            .target
                            .value,
                        })
                      )
                    }
                    placeholder="Plan name — e.g. Airport transfer"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#0E978E] focus:ring-2 focus:ring-[#0E978E]/20"
                  />

                  <div className="grid grid-cols-2 gap-3">

                    <select
                      value={
                        customPlan.type
                      }
                      onChange={(e) =>
                        setCustomPlan(
                          (
                            previous
                          ) => ({
                            ...previous,
                            type: e
                              .target
                              .value,
                          })
                        )
                      }
                      className="px-4 py-3 border border-gray-200 rounded-xl bg-white outline-none focus:border-[#0E978E]"
                    >

                      <option value="attraction">
                        Attraction
                      </option>

                      <option value="hotel">
                        Accommodation
                      </option>

                      <option value="restaurant">
                        Food
                      </option>

                      <option value="transportation">
                        Transportation
                      </option>

                    </select>

                    <input
                      type="number"
                      min="0"
                      value={
                        customPlan.cost
                      }
                      onChange={(e) =>
                        setCustomPlan(
                          (
                            previous
                          ) => ({
                            ...previous,
                            cost: e
                              .target
                              .value,
                          })
                        )
                      }
                      placeholder="Cost / person"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#0E978E] tabular-nums"
                    />

                  </div>

                  <button
                    onClick={
                      addCustomPlan
                    }
                    disabled={
                      addingItem ||
                      !customPlan.name.trim()
                    }
                    className="w-full py-3 bg-[#0E978E] text-white rounded-xl font-semibold hover:bg-[#087C75] transition disabled:opacity-50"
                  >
                    {addingItem
                      ? 'Adding...'
                      : `Add to Day ${activeDay}`}
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   QUICK STAT
========================================================= */

function QuickStat({
  label,
  value,
}) {
  return (
    <div className="px-3 py-2 bg-white/70 rounded-xl border border-white">

      <span className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
        {label}
      </span>

      <span className="ml-2 text-sm font-bold text-gray-800 tabular-nums">
        {value}
      </span>

    </div>
  );
}

/* =========================================================
   BUDGET PIE CHART

   A donut chart built from stacked SVG circle strokes -- no
   charting library needed. Segments are drawn in a fixed order
   (accommodation, transportation, activities, food) using
   stroke-dasharray/dashoffset, rotated so the first segment
   starts at 12 o'clock.
========================================================= */

function BudgetPieChart({
  allocation,
  costPerPerson,
  fmt = (n) =>
    Number(n || 0).toLocaleString(),
}) {
  const size = 148;
  const strokeWidth = 20;
  const r =
    (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference =
    2 * Math.PI * r;

  let cumulativePct = 0;

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
      }}
    >

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >

        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#F1F5F4"
          strokeWidth={
            strokeWidth
          }
        />

        {Object.entries(
          ALLOCATION_META
        ).map(
          ([key, meta]) => {

            const pct = Number(
              allocation[key] || 0
            );

            if (pct <= 0) {
              return null;
            }

            const dash =
              (pct / 100) *
              circumference;

            const gap =
              circumference -
              dash;

            const offset =
              -(cumulativePct / 100) *
              circumference;

            cumulativePct += pct;

            return (
              <circle
                key={key}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={meta.color}
                strokeWidth={
                  strokeWidth
                }
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={
                  offset
                }
              />
            );
          }
        )}

      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">

        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
          Total
        </span>

        <span className="text-lg font-bold text-gray-900 tabular-nums">
          ${fmt(costPerPerson)}
        </span>

      </div>

    </div>
  );
}
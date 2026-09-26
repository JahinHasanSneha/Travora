import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayView,
  OverlayViewF,
} from "@react-google-maps/api";
import { fetchHotels } from "../api/client";
import AddToTripButton from "../components/AddToTripModal";

/* ============================================================
   BRAND COLORS (Teal Theme)
============================================================ */
const TEAL = "#0E978E";        // Primary
const TEAL_DARK = "#0B7B74";   // Hover / dark accents
const TEAL_LIGHT = "#E6F5F4";  // Light teal backgrounds
const TEAL_ACCENT = "#12B3A8"; // Accent / highlights
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Default mock hotels (unchanged)
const DEFAULT_HOTELS = [
  {
    hotel_id: "1",
    name: "Universal Cabana Bay Beach Resort",
    city: "Orlando",
    country: "United States",
    rating: 4.2,
    review_count: "24,968",
    price_per_night: 227,
    latitude: 28.468,
    longitude: -81.472,
    image_url:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80",
    special_offer: true,
    travelers_choice: true,
    star_rating: 4,
    property_type: "Resort",
    amenities: ["Pool", "Restaurant", "Bar/Lounge", "Fitness center"],
  },
  {
    hotel_id: "2",
    name: "Universal Endless Summer Resort - Dockside Inn And Suites",
    city: "Orlando",
    country: "United States",
    rating: 4.1,
    review_count: "3,284",
    price_per_night: 201,
    latitude: 28.461,
    longitude: -81.458,
    image_url:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    special_offer: true,
    travelers_choice: true,
    star_rating: 3,
    property_type: "Resort",
    amenities: ["Pool", "Restaurant", "Bar/Lounge", "Fitness center"],
  },
  {
    hotel_id: "3",
    name: "Loews Sapphire Falls Resort At Universal Orlando",
    city: "Orlando",
    country: "United States",
    rating: 4.4,
    review_count: "7,023",
    price_per_night: 346,
    latitude: 28.473,
    longitude: -81.467,
    image_url:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80",
    special_offer: true,
    travelers_choice: true,
    star_rating: 4,
    property_type: "Resort",
    amenities: ["Pool", "Restaurant", "Bar/Lounge", "Fitness center", "Spa"],
  },
  {
    hotel_id: "4",
    name: "Loews Royal Pacific Resort at Universal Orlando",
    city: "Orlando",
    country: "United States",
    rating: 4.5,
    review_count: "12,140",
    price_per_night: 479,
    latitude: 28.4715,
    longitude: -81.464,
    image_url:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80",
    special_offer: false,
    travelers_choice: true,
    star_rating: 4,
    property_type: "Resort",
    amenities: ["Pool", "Restaurant", "Bar/Lounge", "Fitness center"],
  },
  {
    hotel_id: "5",
    name: "Hard Rock Hotel at Universal Orlando",
    city: "Orlando",
    country: "United States",
    rating: 4.5,
    review_count: "9,850",
    price_per_night: 580,
    latitude: 28.476,
    longitude: -81.463,
    image_url:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80",
    special_offer: true,
    travelers_choice: true,
    star_rating: 4,
    property_type: "Resort",
    amenities: [
      "Pool",
      "Restaurant",
      "Bar/Lounge",
      "Fitness center",
      "Room Service",
    ],
  },
  {
    hotel_id: "6",
    name: "Loews Portofino Bay Hotel at Universal Orlando",
    city: "Orlando",
    country: "United States",
    rating: 4.4,
    review_count: "8,920",
    price_per_night: 844,
    latitude: 28.481,
    longitude: -81.461,
    image_url:
      "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=900&q=80",
    special_offer: false,
    travelers_choice: true,
    star_rating: 5,
    property_type: "Resort",
    amenities: ["Pool", "Restaurant", "Spa", "Bar/Lounge", "Fitness center"],
  },
  {
    hotel_id: "7",
    name: "Universal's Aventura Hotel",
    city: "Orlando",
    country: "United States",
    rating: 4.3,
    review_count: "4,150",
    price_per_night: 238,
    latitude: 28.4695,
    longitude: -81.469,
    image_url:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80",
    special_offer: true,
    travelers_choice: false,
    star_rating: 4,
    property_type: "Resort",
    amenities: ["Pool", "Rooftop Bar", "Restaurant", "Fitness center"],
  },
  {
    hotel_id: "8",
    name: "Holiday Inn & Suites Across from Universal Orlando",
    city: "Orlando",
    country: "United States",
    rating: 4.1,
    review_count: "2,980",
    price_per_night: 132,
    latitude: 28.482,
    longitude: -81.453,
    image_url:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80",
    special_offer: false,
    travelers_choice: false,
    star_rating: 3,
    property_type: "Hotel",
    amenities: ["Pool", "Restaurant", "Free WiFi", "Fitness center"],
  },
  {
    hotel_id: "9",
    name: "DoubleTree by Hilton Hotel at the Entrance to Universal",
    city: "Orlando",
    country: "United States",
    rating: 4.1,
    review_count: "6,410",
    price_per_night: 156,
    latitude: 28.4845,
    longitude: -81.4555,
    image_url:
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=900&q=80",
    special_offer: true,
    travelers_choice: false,
    star_rating: 4,
    property_type: "Hotel",
    amenities: ["Pool", "Restaurant", "Bar/Lounge", "Fitness center"],
  },
  {
    hotel_id: "10",
    name: "Hyatt House across from Universal Orlando Resort",
    city: "Orlando",
    country: "United States",
    rating: 4.6,
    review_count: "1,850",
    price_per_night: 189,
    latitude: 28.4815,
    longitude: -81.4505,
    image_url:
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80",
    special_offer: false,
    travelers_choice: true,
    star_rating: 3,
    property_type: "Hotel",
    amenities: ["Free Breakfast", "Pool", "Fitness center", "Kitchen"],
  },
  {
    hotel_id: "11",
    name: "Residence Inn by Marriott Near Universal Orlando",
    city: "Orlando",
    country: "United States",
    rating: 4.5,
    review_count: "1,420",
    price_per_night: 175,
    latitude: 28.4805,
    longitude: -81.448,
    image_url:
      "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=900&q=80",
    special_offer: false,
    travelers_choice: true,
    star_rating: 3,
    property_type: "Hotel",
    amenities: ["Free Breakfast", "Pool", "Fitness center", "Free WiFi"],
  },
  {
    hotel_id: "12",
    name: "Best Western Plus Universal Inn",
    city: "Orlando",
    country: "United States",
    rating: 4.1,
    review_count: "1,110",
    price_per_night: 105,
    latitude: 28.485,
    longitude: -81.451,
    image_url:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80",
    special_offer: false,
    travelers_choice: false,
    star_rating: 3,
    property_type: "Hotel",
    amenities: ["Free Breakfast", "Pool", "Free Parking"],
  },
];

const EMPTY_FILTERS = {
  petsAllowed: false,
  fourStar: false,
  rating4: false,
  familyFriendly: false,
  fullyRefundable: false,
  noPrepayment: false,
  specialOffers: false,
  travelersChoice: false,
  resorts: false,
  bnb: false,
  floridaCenter: false,
  rating45: false,
  rating40: false,
  rating35: false,
  rating30: false,
  class5: false,
  class4: false,
  class3: false,
  class2: false,
  midRange: false,
  luxury: false,
  familyStyle: false,
  business: false,
  romantic: false,
  modern: false,
};

export default function Hotels() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const initialDestination = searchParams.get("destination") || "";
  const [destination, setDestination] = useState(initialDestination);
  const [destinationInput, setDestinationInput] = useState(initialDestination);

  const [showCalendar, setShowCalendar] = useState(false);
  const [checkIn, setCheckIn] = useState(new Date(2026, 8, 6));
  const [checkOut, setCheckOut] = useState(new Date(2026, 8, 7));
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 8, 1));

  const [showGuests, setShowGuests] = useState(false);
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    rating4: true,
  });
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);

  const [favorites, setFavorites] = useState(["1", "2", "3"]);
  const [hoveredHotelId, setHoveredHotelId] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);

  const [sortBy, setSortBy] = useState("recommended");
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 28.472, lng: -81.464 });
  const [mapZoom, setMapZoom] = useState(14);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded: isGoogleLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  const runSearch = useCallback(
    (overrides = {}) => {
      const query = {
        search: overrides.destination ?? destination,
        minPrice:
          (overrides.minPrice ?? minPrice) > 0
            ? overrides.minPrice ?? minPrice
            : undefined,
        maxPrice:
          (overrides.maxPrice ?? maxPrice) < 1000
            ? overrides.maxPrice ?? maxPrice
            : undefined,
        minRating: filters.rating45
          ? 4.5
          : filters.rating40 || filters.rating4
          ? 4.0
          : filters.rating35
          ? 3.5
          : filters.rating30
          ? 3.0
          : undefined,
        sort:
          sortBy === "price-low"
            ? "price_asc"
            : sortBy === "price-high"
            ? "price_desc"
            : sortBy === "rating"
            ? "rating_desc"
            : undefined,
      };
      setSearching(true);
      setError(null);
      return fetchHotels(query)
        .then((res) => {
          const data = Array.isArray(res?.data) ? res.data : [];
          setHotels(data);
          setUsingFallback(false);
        })
        .catch((err) => {
          console.warn(
            "Hotel search failed, showing sample inventory instead:",
            err
          );
          setHotels(DEFAULT_HOTELS);
          setUsingFallback(true);
          setError(
            "Couldn't reach the server — showing sample hotels instead."
          );
        })
        .finally(() => {
          setLoading(false);
          setSearching(false);
        });
    },
    [
      destination,
      minPrice,
      maxPrice,
      sortBy,
      filters.rating45,
      filters.rating40,
      filters.rating4,
      filters.rating35,
      filters.rating30,
    ]
  );

  useEffect(() => {
    runSearch();
  }, [
    destination,
    minPrice,
    maxPrice,
    sortBy,
    filters.rating45,
    filters.rating40,
    filters.rating4,
    filters.rating35,
    filters.rating30,
  ]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (destinationInput !== destination) {
        setDestination(destinationInput);
      }
    }, 450);
    return () => clearTimeout(handle);
  }, [destinationInput, destination]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (destination) next.set("destination", destination);
    else next.delete("destination");
    setSearchParams(next, { replace: true });
  }, [destination]);

  const submitSearch = (e) => {
    if (e) e.preventDefault();
    setDestination(destinationInput);
    runSearch({ destination: destinationInput });
  };

  useEffect(() => {
    const withCoords = hotels.filter((h) => h.latitude && h.longitude);
    if (withCoords.length > 0) {
      const avgLat =
        withCoords.reduce((sum, h) => sum + Number(h.latitude), 0) /
        withCoords.length;
      const avgLng =
        withCoords.reduce((sum, h) => sum + Number(h.longitude), 0) /
        withCoords.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
    }
  }, [hotels]);

  const toggleFilter = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const filteredHotels = useMemo(() => {
    let list = [...hotels];
    list = list.filter((h) => {
      const price = Number(h.price_per_night || 0);
      if (!price) return true;
      return price >= minPrice && price <= maxPrice;
    });
    if (filters.rating45) {
      list = list.filter((h) => Number(h.rating || 0) >= 4.5);
    }
    if (filters.rating40 || filters.rating4) {
      list = list.filter((h) => Number(h.rating || 0) >= 4.0);
    }
    if (filters.rating35) {
      list = list.filter((h) => Number(h.rating || 0) >= 3.5);
    }
    if (filters.rating30) {
      list = list.filter((h) => Number(h.rating || 0) >= 3.0);
    }
    if (filters.fourStar || filters.class4) {
      list = list.filter(
        (h) => Number(h.star_rating || h.stars || h.hotel_class || 0) === 4
      );
    }
    if (filters.class5) {
      list = list.filter(
        (h) => Number(h.star_rating || h.stars || h.hotel_class || 0) === 5
      );
    }
    if (filters.class3) {
      list = list.filter(
        (h) => Number(h.star_rating || h.stars || h.hotel_class || 0) === 3
      );
    }
    const hotelText = (h) => JSON.stringify(h).toLowerCase();
    if (filters.petsAllowed) {
      list = list.filter(
        (h) =>
          hotelText(h).includes("pet") || hotelText(h).includes("pets allowed")
      );
    }
    if (filters.familyFriendly || filters.familyStyle) {
      list = list.filter(
        (h) =>
          hotelText(h).includes("family") ||
          hotelText(h).includes("kid") ||
          hotelText(h).includes("resort")
      );
    }
    if (filters.fullyRefundable) {
      list = list.filter(
        (h) => h.free_cancellation === true || h.freeCancellation === true
      );
    }
    if (filters.noPrepayment) {
      list = list.filter((h) => h.no_prepayment === true);
    }
    if (filters.specialOffers) {
      list = list.filter(
        (h) => h.special_offer === true || h.specialOffer === true
      );
    }
    if (filters.travelersChoice) {
      list = list.filter(
        (h) => h.travelers_choice === true || h.travelersChoice === true
      );
    }
    if (filters.resorts) {
      list = list.filter(
        (h) => h.property_type === "Resort" || hotelText(h).includes("resort")
      );
    }
    if (sortBy === "price-low") {
      list.sort(
        (a, b) =>
          Number(a.price_per_night || 0) - Number(b.price_per_night || 0)
      );
    } else if (sortBy === "price-high") {
      list.sort(
        (a, b) =>
          Number(b.price_per_night || 0) - Number(a.price_per_night || 0)
      );
    } else if (sortBy === "rating") {
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }
    return list;
  }, [hotels, destination, minPrice, maxPrice, filters, sortBy]);

  const toggleFavorite = (hotelId) => {
    setFavorites((prev) =>
      prev.includes(hotelId)
        ? prev.filter((id) => id !== hotelId)
        : [...prev, hotelId]
    );
  };

  const getCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const calendarDays = getCalendarDays(calendarMonth);

  const chooseDate = (date) => {
    if (!date) return;
    if (!checkIn || checkOut) {
      setCheckIn(date);
      setCheckOut(null);
      return;
    }
    if (date < checkIn) {
      setCheckIn(date);
      setCheckOut(null);
      return;
    }
    setCheckOut(date);
  };

  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "2-digit",
    });
  };

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length +
    (minPrice > 0 ? 1 : 0) +
    (maxPrice < 1000 ? 1 : 0);

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setMinPrice(0);
    setMaxPrice(1000);
  };

  const totalGuests = adults + children;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f7]">
        <div
          className="w-12 h-12 border-4 border-[#0E978E]/30 border-t-[#0E978E] rounded-full animate-spin mb-4"
        />
        <p className="text-[14px] font-semibold text-gray-700">
          Loading hotels...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-['Inter','Arial','Helvetica',sans-serif]">
      {/* ============================================================
          HERO SECTION – Floating window with image on right
      ============================================================ */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-gray-500 mb-3">
          <div className="flex items-center gap-1.5">
            <Link to="/" className="hover:underline hover:text-gray-700">
              Explore
            </Link>
            <span>›</span>
            {destination ? (
              <>
                <span>{destination}</span>
                <span>›</span>
                <span className="text-gray-700 font-medium">
                  {destination} Hotels
                </span>
              </>
            ) : (
              <span className="text-gray-700 font-medium">Hotels</span>
            )}
          </div>
          <span className="text-gray-400">
            THE 10 BEST Hotels in {destination || "This Destination"}{" "}
            {new Date().getFullYear()}
          </span>
        </div>

        <div className="relative bg-white rounded-[28px] border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch min-h-[380px]">
            <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
              <h1
                className="text-[36px] sm:text-[44px] font-extrabold leading-[1.05]"
                style={{ color: "#0B2E1F" }}
              >
                {destination || "Hotels"}
              </h1>
              <p
                className="text-[20px] sm:text-[24px] font-bold mb-7"
                style={{ color: "#0B2E1F" }}
              >
                and Places to Stay
              </p>

              <form
                onSubmit={submitSearch}
                className="flex flex-col gap-3 w-full"
              >
                <div className="relative border border-gray-200 rounded-2xl p-2.5 hover:border-gray-400 bg-white cursor-pointer transition">
                  <div className="flex items-center gap-2.5">
                    <span className="text-gray-600 shrink-0">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                        Destination
                      </p>
                      <input
                        value={destinationInput}
                        onChange={(e) => setDestinationInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitSearch(e);
                        }}
                        placeholder="Where to?"
                        className="w-full text-[13px] font-bold text-gray-900 outline-none bg-transparent truncate"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <div
                      onClick={() => {
                        setShowCalendar((prev) => !prev);
                        setShowGuests(false);
                      }}
                      className="border border-gray-200 rounded-2xl p-2.5 hover:border-gray-400 bg-white cursor-pointer transition h-full flex items-center gap-2.5"
                    >
                      <span className="text-gray-600 shrink-0">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                          Dates
                        </p>
                        <p className="text-[13px] font-bold text-gray-900 truncate">
                          {checkIn && checkOut
                            ? `${formatDate(checkIn)} → ${formatDate(checkOut)}`
                            : checkIn
                            ? `${formatDate(checkIn)} → Select end`
                            : "Add dates"}
                        </p>
                      </div>
                    </div>
                    {showCalendar && (
                      <div
                        className="absolute top-[64px] left-0 z-[9999] w-[340px] sm:w-[500px] bg-white border border-gray-300 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.18)] p-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                          <button
                            type="button"
                            onClick={() =>
                              setCalendarMonth(
                                new Date(
                                  calendarMonth.getFullYear(),
                                  calendarMonth.getMonth() - 1,
                                  1
                                )
                              )
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold"
                          >
                            ‹
                          </button>
                          <h3 className="text-[15px] font-bold text-gray-900">
                            {calendarMonth.toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            })}
                          </h3>
                          <button
                            type="button"
                            onClick={() =>
                              setCalendarMonth(
                                new Date(
                                  calendarMonth.getFullYear(),
                                  calendarMonth.getMonth() + 1,
                                  1
                                )
                              )
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold"
                          >
                            ›
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mt-3">
                          {WEEK_DAYS.map((d) => (
                            <div
                              key={d}
                              className="text-center text-[11px] font-bold text-gray-400 py-1"
                            >
                              {d}
                            </div>
                          ))}
                          {calendarDays.map((d, i) => {
                            if (!d) return <div key={i} className="h-9" />;
                            const isStart =
                              checkIn &&
                              d.toDateString() === checkIn.toDateString();
                            const isEnd =
                              checkOut &&
                              d.toDateString() === checkOut.toDateString();
                            const isBetween =
                              checkIn &&
                              checkOut &&
                              d > checkIn &&
                              d < checkOut;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => chooseDate(d)}
                                className={`h-9 rounded-[8px] text-[13px] font-medium transition ${
                                  isStart || isEnd
                                    ? "bg-[#0E978E] text-white font-bold shadow"
                                    : isBetween
                                    ? "bg-[#E6F5F4] text-[#0B7B74]"
                                    : "hover:bg-gray-100 text-gray-800"
                                }`}
                              >
                                {d.getDate()}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => {
                              setCheckIn(null);
                              setCheckOut(null);
                            }}
                            className="text-[12px] font-bold text-gray-600 hover:underline"
                          >
                            Clear dates
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCalendar(false)}
                            className="px-5 py-1.5 rounded-full bg-[#0E978E] hover:bg-[#0B7B74] text-white text-[12px] font-bold"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <div
                      onClick={() => {
                        setShowGuests((prev) => !prev);
                        setShowCalendar(false);
                      }}
                      className="border border-gray-200 rounded-2xl p-2.5 hover:border-gray-400 bg-white cursor-pointer transition h-full flex items-center gap-2.5"
                    >
                      <span className="text-gray-600 shrink-0">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                          Rooms/Guests
                        </p>
                        <p className="text-[13px] font-bold text-gray-900 truncate">
                          {rooms} Room{rooms > 1 ? "s" : ""}, {totalGuests}{" "}
                          Guest{totalGuests > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    {showGuests && (
                      <div className="absolute top-[64px] right-0 z-[9999] w-[300px] bg-white border border-gray-300 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.18)] p-5">
                        <GuestCounter
                          title="Rooms"
                          subtitle="Number of rooms"
                          value={rooms}
                          onDecrease={() => setRooms(Math.max(1, rooms - 1))}
                          onIncrease={() => setRooms(rooms + 1)}
                        />
                        <GuestCounter
                          title="Adults"
                          subtitle="Ages 13+"
                          value={adults}
                          onDecrease={() => setAdults(Math.max(1, adults - 1))}
                          onIncrease={() => setAdults(adults + 1)}
                        />
                        <GuestCounter
                          title="Children"
                          subtitle="Ages 0–12"
                          value={children}
                          onDecrease={() =>
                            setChildren(Math.max(0, children - 1))
                          }
                          onIncrease={() => setChildren(children + 1)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowGuests(false)}
                          className="w-full mt-4 h-9 rounded-full bg-[#0E978E] hover:bg-[#0B7B74] text-white text-[13px] font-bold"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="w-full min-h-[52px] px-6 rounded-2xl bg-[#0E978E] hover:bg-[#0B7B74] disabled:opacity-60 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition"
                >
                  {searching ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  )}
                  Search
                </button>
              </form>
            </div>

            <div className="relative w-full h-[240px] lg:h-full rounded-b-[28px] lg:rounded-b-none lg:rounded-r-[28px] overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: "url(/images/backgrounds/hill2.jpeg)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          MAIN CONTENT – same 1200px width as hero for aligned gutters
      ============================================================ */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5">
        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-[10px] bg-amber-50 border border-amber-200 text-[13px] text-amber-800">
            {error}
          </div>
        )}

        {/* FILTER PILLS ROW */}
        <section className="mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setShowMap((p) => !p)}
              className={`h-[38px] px-4 rounded-full border text-[13px] font-bold shrink-0 flex items-center gap-1.5 transition shadow-sm ${
                showMap
                  ? "bg-[#0E978E] border-[#0E978E] text-white"
                  : "bg-white border-gray-300 text-gray-800 hover:border-gray-500"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              {showMap ? "Close map" : "Map"}
            </button>

            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className={`h-[38px] px-4 rounded-full border text-[13px] font-bold shrink-0 flex items-center gap-1.5 transition shadow-sm ${
                activeFilterCount > 0
                  ? "bg-[#0E978E] border-[#0E978E] text-white"
                  : "bg-white border-gray-300 text-gray-800 hover:border-gray-500"
              }`}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              Filters {activeFilterCount > 0 && `• ${activeFilterCount}`}
            </button>

            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="h-[38px] px-4 rounded-full border border-gray-300 bg-white text-gray-800 text-[13px] font-bold shrink-0 hover:border-gray-500 transition shadow-sm flex items-center gap-1"
            >
              Price
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="h-[38px] px-4 rounded-full border border-gray-300 bg-white text-gray-800 text-[13px] font-bold shrink-0 hover:border-gray-500 transition shadow-sm flex items-center gap-1"
            >
              Amenities
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <FilterPill
              label="Pets Allowed"
              active={filters.petsAllowed}
              onClick={() => toggleFilter("petsAllowed")}
            />
            <FilterPill
              label="5 Star"
              active={filters.class5}
              onClick={() => toggleFilter("class5")}
            />
            <FilterPill
              label="4.0+"
              active={filters.rating4}
              onClick={() => toggleFilter("rating4")}
            />
            <FilterPill
              label="Luxury"
              active={filters.luxury}
              onClick={() => toggleFilter("luxury")}
            />
            <FilterPill
              label="Travelers' Choice Best of the Best"
              active={filters.travelersChoice && filters.rating45}
              onClick={() => {
                toggleFilter("travelersChoice");
                toggleFilter("rating45");
              }}
            />
            <FilterPill
              label="Travelers' Choice"
              active={filters.travelersChoice}
              onClick={() => toggleFilter("travelersChoice")}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 text-[13px] text-gray-600">
            <div>
              <span className="font-medium text-gray-800">
                {filteredHotels.length} of {hotels.length} properties
              </span>{" "}
              in {destination || "this destination"}
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-2 text-[#0E978E] hover:text-[#0B7B74] font-bold underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-[8px] bg-white px-2.5 py-1 text-[13px] font-bold text-gray-800 outline-none cursor-pointer hover:border-gray-400"
              >
                <option value="recommended">Best Value</option>
                <option value="rating">Traveler Ranked</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <span
                className="w-4 h-4 rounded-full border border-gray-400 text-gray-500 flex items-center justify-center text-[10px] cursor-pointer"
                title="Rankings are based on traveler reviews and best value recommendations."
              >
                ℹ
              </span>
            </div>
          </div>
        </section>

        {filteredHotels.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-[16px] p-12 text-center my-6">
            <p className="text-[18px] font-bold text-gray-800">
              No properties found
            </p>
            <p className="text-[13px] text-gray-500 mt-1">
              Try adjusting your filters or price range to see more results.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 px-6 py-2 rounded-full bg-[#0E978E] text-white font-bold text-[13px]"
            >
              Clear all filters
            </button>
          </div>
        ) : showMap ? (
          // ---------- SPLIT VIEW ----------
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="w-full lg:w-[48%] xl:w-[50%] shrink-0">
              <div className="space-y-4 max-h-[calc(100vh-210px)] overflow-y-auto pr-1 pb-10">
                {filteredHotels.map((hotel, index) => {
                  const isFavorited = favorites.includes(hotel.hotel_id);
                  const isHovered = hoveredHotelId === hotel.hotel_id;
                  const price = Number(hotel.price_per_night || 0);
                  const rating = Number(hotel.rating || 0);
                  return (
                    <article
                      key={hotel.hotel_id}
                      onMouseEnter={() => setHoveredHotelId(hotel.hotel_id)}
                      onMouseLeave={() => setHoveredHotelId(null)}
                      onClick={() => {
                        setSelectedHotel(hotel);
                        if (hotel.latitude && hotel.longitude) {
                          setMapCenter({
                            lat: Number(hotel.latitude),
                            lng: Number(hotel.longitude),
                          });
                        }
                      }}
                      className={`bg-white border rounded-[14px] overflow-hidden transition-all flex flex-col sm:flex-row cursor-pointer ${
                        isHovered
                          ? "border-[#0E978E] shadow-[0_6px_20px_rgba(14,151,142,0.18)] ring-1 ring-[#0E978E]"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      <div className="relative w-full sm:w-[210px] h-[170px] sm:h-auto shrink-0 bg-gray-100 overflow-hidden">
                        <img
                          src={hotel.image_url}
                          alt={hotel.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          aria-label={
                            isFavorited ? "Remove favorite" : "Save hotel"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(hotel.hotel_id);
                          }}
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-110 transition"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill={isFavorited ? "#E11D48" : "none"}
                            stroke={isFavorited ? "#E11D48" : "#222"}
                            strokeWidth="2"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                        {hotel.travelers_choice && (
                          <div className="absolute bottom-2 left-2 bg-[#0E978E] text-white px-2 py-0.5 rounded-[4px] text-[10px] font-bold flex items-center gap-1 shadow">
                            <span>🦉 2026</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                to={`/hotels/${hotel.hotel_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[16px] font-bold text-gray-900 hover:text-[#0E978E] leading-snug line-clamp-2 min-h-[40px]"
                              >
                                {index + 1}. {hotel.name}
                              </Link>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[12px] font-bold text-gray-900">
                                  {rating.toFixed(1)}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <span
                                      key={s}
                                      className={`w-2.5 h-2.5 rounded-full ${
                                        s <= Math.round(rating)
                                          ? "bg-[#0E978E]"
                                          : "bg-gray-300"
                                      }`}
                                    />
                                  ))}
                                </span>
                                <span className="text-[11px] text-gray-500">
                                  ({hotel.review_count || "1,000+"})
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[11px] text-gray-500">from</p>
                              <p className="text-[20px] font-extrabold text-gray-900 leading-tight">
                                ${price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                            #{index + 1} Best Value Resort that matches your
                            filters
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-600">
                            <span className="flex items-center gap-1">
                              🏊 Pool
                            </span>
                            <span className="flex items-center gap-1">
                              🍽 Restaurant
                            </span>
                            <span className="flex items-center gap-1">
                              🍸 Bar/Lounge
                            </span>
                            <span className="flex items-center gap-1">
                              🏋 Fitness
                            </span>
                          </div>
                          {hotel.special_offer && (
                            <p className="text-[11px] text-[#C2410C] font-semibold flex items-center gap-1 mt-1.5">
                              🏷 Special offer
                            </p>
                          )}
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                          <AddToTripButton
                            item={{
                              id: hotel.hotel_id,
                              name: hotel.name,
                              type: "hotel",
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/hotels/${hotel.hotel_id}`);
                            }}
                            className="h-[36px] px-5 rounded-full bg-[#0E978E] hover:bg-[#0B7B74] text-white text-[12px] font-bold shadow-sm transition"
                          >
                            Check availability
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="w-full lg:w-[52%] xl:w-[50%] lg:sticky lg:top-4 h-[calc(100vh-140px)] min-h-[580px] rounded-[16px] overflow-hidden border border-gray-300 shadow-md relative bg-[#e5e3df]">
              <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                  <button
                    type="button"
                    className="h-[36px] px-3.5 rounded-full bg-white text-gray-800 text-[12px] font-bold shadow-md hover:bg-gray-50 border border-gray-200 flex items-center gap-1"
                  >
                    Distance from <span className="text-[9px]">▼</span>
                  </button>
                  <button
                    type="button"
                    className="h-[36px] px-3.5 rounded-full bg-white text-gray-800 text-[12px] font-bold shadow-md hover:bg-gray-50 border border-gray-200 flex items-center gap-1"
                  >
                    Neighborhoods <span className="text-[9px]">▼</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMap(false)}
                  className="w-9 h-9 rounded-full bg-white text-gray-700 hover:text-black flex items-center justify-center shadow-lg border border-gray-200 font-bold text-lg pointer-events-auto transition hover:scale-105"
                >
                  ✕
                </button>
              </div>

              <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[400]">
                <button
                  type="button"
                  onClick={() => {
                    setSearching(true);
                    setError(null);
                    fetchHotels({
                      search: destination,
                      lat: mapCenter.lat,
                      lng: mapCenter.lng,
                      radiusKm: 25,
                    })
                      .then((res) => {
                        const data = Array.isArray(res?.data) ? res.data : [];
                        setHotels(data);
                        setUsingFallback(false);
                      })
                      .catch((err) => {
                        console.warn("Area search failed:", err);
                        setError("Couldn't search this area right now.");
                      })
                      .finally(() => setSearching(false));
                  }}
                  className="h-[38px] px-5 rounded-full bg-white text-gray-800 text-[13px] font-bold shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:bg-gray-50 border border-gray-200 flex items-center gap-2 transition hover:scale-105"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Search this area
                </button>
              </div>

              <div className="absolute bottom-6 right-4 z-[400] flex flex-col gap-2">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
                  <button
                    type="button"
                    onClick={() => setMapZoom((z) => Math.min(18, z + 1))}
                    className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold text-lg border-b border-gray-200"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapZoom((z) => Math.max(10, z - 1))}
                    className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold text-lg"
                  >
                    −
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const withCoords = filteredHotels.filter(
                      (h) => h.latitude && h.longitude
                    );
                    if (withCoords.length > 0) {
                      const avgLat =
                        withCoords.reduce(
                          (sum, h) => sum + Number(h.latitude),
                          0
                        ) / withCoords.length;
                      const avgLng =
                        withCoords.reduce(
                          (sum, h) => sum + Number(h.longitude),
                          0
                        ) / withCoords.length;
                      setMapCenter({ lat: avgLat, lng: avgLng });
                    }
                  }}
                  className="w-9 h-9 rounded-lg bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 text-[16px]"
                >
                  🧭
                </button>
              </div>

              {apiKey && isGoogleLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={mapCenter}
                  zoom={mapZoom}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: false,
                    styles: [
                      {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }],
                      },
                      {
                        featureType: "water",
                        elementType: "geometry",
                        stylers: [{ color: "#c9e8f5" }],
                      },
                      {
                        featureType: "landscape.natural",
                        elementType: "geometry",
                        stylers: [{ color: "#e8f0e6" }],
                      },
                    ],
                  }}
                >
                  {filteredHotels.map((h) => {
                    if (!h.latitude || !h.longitude) return null;
                    const isHovered = hoveredHotelId === h.hotel_id;
                    const isSelected = selectedHotel?.hotel_id === h.hotel_id;
                    const price = Number(h.price_per_night || 0);
                    const rating = Number(h.rating || 0);
                    return (
                      <OverlayViewF
                        key={h.hotel_id}
                        position={{
                          lat: Number(h.latitude),
                          lng: Number(h.longitude),
                        }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      >
                        <div
                          onClick={() => setSelectedHotel(h)}
                          onMouseEnter={() => setHoveredHotelId(h.hotel_id)}
                          onMouseLeave={() => setHoveredHotelId(null)}
                          className={`relative cursor-pointer transition-transform duration-200 ${
                            isHovered || isSelected ? "scale-115 z-50" : "z-10"
                          }`}
                          style={{ transform: "translate(-50%, -100%)" }}
                        >
                          <TripAdvisorMapBadge
                            price={price}
                            rating={rating}
                            isFeatured={price >= 200 || rating >= 4.3}
                            isHovered={isHovered || isSelected}
                          />
                        </div>
                      </OverlayViewF>
                    );
                  })}
                </GoogleMap>
              ) : (
                <InteractiveCustomMap
                  center={mapCenter}
                  zoom={mapZoom}
                  hotels={filteredHotels}
                  hoveredHotelId={hoveredHotelId}
                  selectedHotel={selectedHotel}
                  onSelectHotel={(h) => setSelectedHotel(h)}
                  onHoverHotel={(id) => setHoveredHotelId(id)}
                />
              )}

              {selectedHotel && (
                <div className="absolute bottom-6 left-4 z-[500] w-[300px] bg-white rounded-[14px] shadow-[0_10px_30px_rgba(0,0,0,0.25)] border border-gray-200 p-3 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSelectedHotel(null)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center text-xs font-bold hover:bg-black"
                  >
                    ×
                  </button>
                  <div className="flex gap-3">
                    <img
                      src={selectedHotel.image_url}
                      alt={selectedHotel.name}
                      className="w-20 h-20 rounded-[8px] object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold text-gray-900 leading-tight truncate">
                        {selectedHotel.name}
                      </h4>
                      <p className="text-[11px] font-bold text-[#0E978E] mt-1">
                        $
                        {Number(selectedHotel.price_per_night).toLocaleString()}{" "}
                        <span className="text-[10px] text-gray-500 font-normal">
                          / night
                        </span>
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-600">
                        <span>★ {selectedHotel.rating}</span>
                        <span>•</span>
                        <span className="truncate">
                          {selectedHotel.property_type || "Resort"}
                        </span>
                      </div>
                      <Link
                        to={`/hotels/${selectedHotel.hotel_id}`}
                        className="mt-2 inline-block text-[11px] font-bold text-[#0E978E] hover:underline"
                      >
                        View details →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // ---------- GRID VIEW: 3 cards per row, teal button, translucent Add to Trip ----------
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {filteredHotels.map((hotel, index) => {
              const isFavorited = favorites.includes(hotel.hotel_id);
              const price = Number(hotel.price_per_night || 0);
              const rating = Number(hotel.rating || 0);
              return (
                <article
                  key={hotel.hotel_id}
                  className="bg-white border border-gray-200 rounded-[16px] p-3 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow flex flex-col h-full"
                >
                  {/* SQUARE IMAGE — 1:1 with slight rounding, framed by card padding */}
                  <div className="relative w-full aspect-square rounded-[10px] overflow-hidden bg-gray-100 shrink-0">
                    <Link to={`/hotels/${hotel.hotel_id}`}>
                      <img
                        src={hotel.image_url}
                        alt={hotel.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                    </Link>

                    {/* Favorite heart — top-right */}
                    <button
                      type="button"
                      aria-label={
                        isFavorited ? "Remove favorite" : "Save hotel"
                      }
                      onClick={() => toggleFavorite(hotel.hotel_id)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-110 transition"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={isFavorited ? "#E11D48" : "none"}
                        stroke={isFavorited ? "#E11D48" : "#222"}
                        strokeWidth="2"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>

                    {/* Travelers' Choice owl badge — bottom-left */}
                    {hotel.travelers_choice && (
                      <div className="absolute bottom-3 left-3 w-[46px] h-[46px] rounded-[8px] bg-[#0E978E] flex flex-col items-center justify-center shadow-md">
                        <span className="text-[18px] leading-none">🦉</span>
                        <span className="text-[9px] font-extrabold leading-none mt-0.5 text-white">
                          2026
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="pt-3.5 flex flex-col flex-1">
                    {/* Text block — fixed min-height for row alignment */}
                    <div className="min-h-[88px]">
                      <Link to={`/hotels/${hotel.hotel_id}`}>
                        <h3 className="text-[16px] font-bold text-gray-900 hover:text-[#0E978E] leading-snug line-clamp-2 min-h-[44px]">
                          {hotel.name}
                        </h3>
                      </Link>

                      {/* Rating row */}
                      <div className="flex items-center gap-1.5 mt-2 h-[18px]">
                        <span className="text-[13px] font-bold text-gray-900">
                          {rating.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className={`w-3 h-3 rounded-full ${
                                s <= Math.round(rating)
                                  ? "bg-[#0E978E]"
                                  : "bg-gray-300"
                              }`}
                            />
                          ))}
                        </span>
                        <span className="text-[12px] text-gray-500">
                          ({hotel.review_count || "2,500"})
                        </span>
                      </div>

                      {/* Tagline — reserved 2-line slot */}
                      <p className="text-[12px] text-gray-500 mt-2 line-clamp-1">
                        #{index + 1} Best Value Resort that matches your filters
                      </p>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Price + Button — pinned to bottom */}
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-baseline gap-1.5 mb-3">
                        <span className="text-[13px] text-gray-500">from</span>
                        <span className="text-[22px] font-extrabold text-gray-900">
                          ${price.toLocaleString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/hotels/${hotel.hotel_id}`)}
                        className="w-full h-[44px] rounded-full bg-[#0E978E] hover:bg-[#0B7B74] text-white text-[14px] font-bold shadow-sm transition"
                      >
                        Check availability
                      </button>

                      {/* Add to trip — small translucent teal pill */}
                      <div className="mt-2.5 flex justify-center">
                        <div
                          className="rounded-full px-3.5 py-1.5
                                     bg-[#0E978E]/10 hover:bg-[#0E978E]/20 transition
                                     [&_button]:!text-[12px] [&_button]:!font-semibold
                                     [&_button]:!bg-transparent [&_button]:!border-0
                                     [&_button]:!shadow-none [&_button]:!text-[#0E978E]
                                     [&_button]:!px-0 [&_button]:!py-0"
                        >
                          <AddToTripButton
                            item={{
                              id: hotel.hotel_id,
                              name: hotel.name,
                              type: "hotel",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ============================================================
          FILTER MODAL
      ============================================================ */}
      {showFilters && (
        <div
          className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFilters(false);
          }}
        >
          <div className="w-full max-w-[740px] max-h-[85vh] bg-white rounded-[20px] shadow-[0_16px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-[20px] font-bold text-gray-900">Filters</h3>
                <p className="text-[12px] text-gray-500">
                  Select preferences to refine your hotel stay
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-xl text-gray-500 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-[14px] font-bold text-gray-900 mb-3">
                  Popular Filters
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <FilterCheckbox
                    label="Pets Allowed"
                    checked={filters.petsAllowed}
                    onChange={() => toggleFilter("petsAllowed")}
                  />
                  <FilterCheckbox
                    label="4 Star Hotels"
                    checked={filters.fourStar}
                    onChange={() => toggleFilter("fourStar")}
                  />
                  <FilterCheckbox
                    label="4.0+ Rating"
                    checked={filters.rating4}
                    onChange={() => toggleFilter("rating4")}
                  />
                  <FilterCheckbox
                    label="Family-friendly"
                    checked={filters.familyFriendly}
                    onChange={() => toggleFilter("familyFriendly")}
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-[14px] font-bold text-gray-900 mb-2">
                  Price per Night
                </h4>
                <div className="flex items-center justify-between text-[13px] font-bold text-gray-800 mb-2">
                  <span>${minPrice}</span>
                  <span>${maxPrice}+</span>
                </div>
                <div className="relative h-6 flex items-center">
                  <div className="w-full h-2 bg-gray-200 rounded-full relative">
                    <div
                      className="absolute h-2 bg-[#0E978E] rounded-full"
                      style={{
                        left: `${(minPrice / 1000) * 100}%`,
                        right: `${100 - (maxPrice / 1000) * 100}%`,
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="25"
                    value={minPrice}
                    onChange={(e) =>
                      setMinPrice(
                        Math.min(Number(e.target.value), maxPrice - 25)
                      )
                    }
                    className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0E978E] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="25"
                    value={maxPrice}
                    onChange={(e) =>
                      setMaxPrice(
                        Math.max(Number(e.target.value), minPrice + 25)
                      )
                    }
                    className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0E978E] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-[14px] font-bold text-gray-900 mb-3">
                  Deals & Flexibility
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <FilterCheckbox
                    label="Fully refundable"
                    checked={filters.fullyRefundable}
                    onChange={() => toggleFilter("fullyRefundable")}
                  />
                  <FilterCheckbox
                    label="No prepayment needed"
                    checked={filters.noPrepayment}
                    onChange={() => toggleFilter("noPrepayment")}
                  />
                  <FilterCheckbox
                    label="Special offers"
                    checked={filters.specialOffers}
                    onChange={() => toggleFilter("specialOffers")}
                  />
                  <FilterCheckbox
                    label="Travelers' Choice"
                    checked={filters.travelersChoice}
                    onChange={() => toggleFilter("travelersChoice")}
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-[14px] font-bold text-gray-900 mb-3">
                  Property Types
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <FilterCheckbox
                    label="Resorts"
                    checked={filters.resorts}
                    onChange={() => toggleFilter("resorts")}
                  />
                  <FilterCheckbox
                    label="B&Bs & Inns"
                    checked={filters.bnb}
                    onChange={() => toggleFilter("bnb")}
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-[14px] font-bold text-gray-900 mb-3">
                  Traveler Rating
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "4.5+", key: "rating45" },
                    { label: "4.0+", key: "rating40" },
                    { label: "3.5+", key: "rating35" },
                    { label: "3.0+", key: "rating30" },
                  ].map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => toggleFilter(r.key)}
                      className={`h-9 rounded-[8px] border text-[13px] font-bold transition ${
                        filters[r.key]
                          ? "bg-[#0E978E] border-[#0E978E] text-white"
                          : "bg-white border-gray-300 text-gray-700 hover:border-gray-500"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <button
                type="button"
                onClick={clearFilters}
                className="text-[13px] font-bold text-gray-700 hover:underline"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="px-8 py-2.5 rounded-full bg-[#0E978E] hover:bg-[#0B7B74] text-white font-bold text-[13px] shadow-sm"
              >
                Show {filteredHotels.length} results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================================================================
// COMPONENT: FilterPill
// ================================================================
function FilterPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[38px] px-4 rounded-full border text-[13px] font-bold shrink-0 transition shadow-sm ${
        active
          ? "bg-[#0E978E] border-[#0E978E] text-white"
          : "bg-white border-gray-300 text-gray-800 hover:border-gray-500"
      }`}
    >
      {label}
    </button>
  );
}

// ================================================================
// COMPONENT: GuestCounter
// ================================================================
function GuestCounter({ title, subtitle, value, onDecrease, onIncrease }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-[13px] font-bold text-gray-900">{title}</p>
        <p className="text-[11px] text-gray-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrease}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:border-[#0E978E] hover:text-[#0E978E] font-bold"
        >
          −
        </button>
        <span className="w-5 text-center text-[13px] font-bold text-gray-900">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:border-[#0E978E] hover:text-[#0E978E] font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ================================================================
// COMPONENT: FilterCheckbox
// ================================================================
function FilterCheckbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer text-[13px] font-medium text-gray-800 select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition ${
          checked
            ? "bg-[#0E978E] border-[#0E978E]"
            : "bg-white border-gray-300 hover:border-gray-400"
        }`}
      >
        {checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
          >
            <path d="M5 12l4 4L19 6" />
          </svg>
        )}
      </span>
      <span>{label}</span>
    </label>
  );
}

// ================================================================
// COMPONENT: TripAdvisorMapBadge
// ================================================================
function TripAdvisorMapBadge({ price, rating, isFeatured, isHovered }) {
  const isDarkTeal = isFeatured || price >= 200;
  return (
    <div className="flex items-center group">
      <div
        className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.22)] font-bold text-[12px] whitespace-nowrap transition-transform duration-150 ${
          isHovered
            ? "bg-[#0B7B74] text-white ring-2 ring-white scale-110 shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
            : isDarkTeal
            ? "bg-[#0E978E] text-white border border-[#0B7B74]"
            : "bg-white text-gray-900 border border-gray-300"
        }`}
      >
        <span>${price || "—"}</span>
        {rating > 0 && (
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold -mr-1.5 shadow-sm ${
              isDarkTeal || isHovered
                ? "bg-white text-[#0E978E]"
                : "bg-[#0E978E] text-white"
            }`}
          >
            {rating.toFixed(1)}
          </span>
        )}
        <div
          className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] ${
            isHovered
              ? "border-t-[#0B7B74]"
              : isDarkTeal
              ? "border-t-[#0E978E]"
              : "border-t-white"
          }`}
        />
      </div>
    </div>
  );
}

// ================================================================
// COMPONENT: InteractiveCustomMap (fallback)
// ================================================================
function InteractiveCustomMap({
  center,
  zoom,
  hotels,
  hoveredHotelId,
  selectedHotel,
  onSelectHotel,
  onHoverHotel,
}) {
  const containerRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const bounds = {
    minLat: 28.44,
    maxLat: 28.5,
    minLng: -81.49,
    maxLng: -81.43,
  };

  const getPosition = (lat, lng) => {
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="w-full h-full relative cursor-grab active:cursor-grabbing select-none overflow-hidden bg-[#e8ece9]"
    >
      <div
        className="w-full h-full absolute inset-0 transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 13})`,
          transformOrigin: "center center",
        }}
      >
        <svg
          className="w-full h-full absolute inset-0 opacity-80"
          viewBox="0 0 1000 800"
          preserveAspectRatio="none"
        >
          <path
            d="M 120 40 C 220 80, 260 220, 200 380 C 160 480, 100 520, 70 420 C 40 300, 50 120, 120 40 Z"
            fill="#c9e8f5"
          />
          <path
            d="M 450 250 C 560 220, 680 290, 640 420 C 600 500, 480 540, 410 460 C 350 400, 380 300, 450 250 Z"
            fill="#d2eedb"
          />
          <circle cx="520" cy="380" r="60" fill="#c9e8f5" />
          <circle cx="680" cy="560" r="45" fill="#c9e8f5" />
          <path
            d="M 0 350 Q 500 320 1000 300"
            stroke="#ffffff"
            strokeWidth="12"
            fill="none"
          />
          <path
            d="M 0 350 Q 500 320 1000 300"
            stroke="#fcd34d"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M 380 0 Q 400 400 420 800"
            stroke="#ffffff"
            strokeWidth="10"
            fill="none"
          />
          <path
            d="M 750 0 Q 720 400 700 800"
            stroke="#ffffff"
            strokeWidth="8"
            fill="none"
          />
          <path
            d="M 200 700 Q 550 650 900 680"
            stroke="#ffffff"
            strokeWidth="8"
            fill="none"
          />
          <text
            x="440"
            y="320"
            fill="#4b5563"
            fontSize="13"
            fontWeight="bold"
            opacity="0.65"
          >
            Universal Studios
          </text>
          <text
            x="120"
            y="240"
            fill="#0284c7"
            fontSize="12"
            fontWeight="bold"
            opacity="0.75"
          >
            Turkey Lake
          </text>
          <text
            x="750"
            y="440"
            fill="#4b5563"
            fontSize="13"
            fontWeight="bold"
            opacity="0.6"
          >
            Tangelo Park
          </text>
          <text
            x="820"
            y="260"
            fill="#4b5563"
            fontSize="13"
            fontWeight="bold"
            opacity="0.6"
          >
            Windhover
          </text>
          <text
            x="180"
            y="580"
            fill="#4b5563"
            fontSize="13"
            fontWeight="bold"
            opacity="0.6"
          >
            Doctor Phillips
          </text>
        </svg>
        {hotels.map((h) => {
          const pos = getPosition(
            Number(h.latitude || 28.47),
            Number(h.longitude || -81.46)
          );
          const isHovered = hoveredHotelId === h.hotel_id;
          const isSelected = selectedHotel?.hotel_id === h.hotel_id;
          const price = Number(h.price_per_night || 0);
          const rating = Number(h.rating || 0);
          return (
            <div
              key={h.hotel_id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectHotel(h);
              }}
              onMouseEnter={() => onHoverHotel(h.hotel_id)}
              onMouseLeave={() => onHoverHotel(null)}
              className="absolute z-20"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <TripAdvisorMapBadge
                price={price}
                rating={rating}
                isFeatured={price >= 200 || rating >= 4.3}
                isHovered={isHovered || isSelected}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
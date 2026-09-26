import React, { useState } from 'react';

/* =========================================================
   ICONS — inline, TripAdvisor-weight
========================================================= */
const Icon = {
  hotel: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14" />
      <path d="M17 11h2a2 2 0 0 1 2 2v8" />
      <path d="M3 21h18M7 9h2M7 13h2M7 17h2M12 9h2M12 13h2M12 17h2" />
    </svg>
  ),
  restaurant: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M7 3v9a3 3 0 0 0 3 3v6M10 3v6M4 3v6a3 3 0 0 0 3 3M17 3c-1.5 3-2.5 5-2.5 7.5S15.5 15 17 15v6" />
    </svg>
  ),
  cruise: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 15l1.5-6h15L21 15" />
      <path d="M12 9V4M8 4h8" />
      <path d="M2 19c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1 2.5-1 4-1" />
    </svg>
  ),
  search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="7.5" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  ),
  pin: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 22s7-6.4 7-12a7 7 0 1 0-14 0c0 5.6 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  ),
  alert: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.01" />
    </svg>
  ),
  star: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
    </svg>
  ),
  image: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  user: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1.4-3.6 4-5.4 7-5.4s5.6 1.8 7 5.4" />
    </svg>
  ),
};

/* =========================================================
   LISTING TYPES — config-driven tabs
========================================================= */
const LISTING_TYPES = [
  { key: 'hotel', label: 'Hotel', icon: Icon.hotel },
  { key: 'restaurant', label: 'Restaurant', icon: Icon.restaurant },
  { key: 'cruise', label: 'Cruise', icon: Icon.cruise },
];

/* =========================================================
   PAGE
========================================================= */
export default function SupplierDashboard() {
  const [listingType, setListingType] = useState('hotel');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
    star_rating: '4',
    price_per_night: '',
    cuisine_type: '',
    description: '',
    image_url: '',
  });

  /* ---------- search ---------- */
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(val)}&limit=5`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (err) {
      console.error('Error fetching search results:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (feature) => {
    const props = feature.properties;
    const coords = feature.geometry.coordinates;

    const placeName = props.name || props.street || searchQuery;
    const city = props.city || props.town || props.state || '';
    const country = props.country || '';
    const address = [props.street, props.housenumber, city, country]
      .filter(Boolean)
      .join(', ');

    setFormData((prev) => ({
      ...prev,
      name: placeName,
      address: address || placeName,
      city,
      country,
      longitude: coords[0],
      latitude: coords[1],
    }));

    setSearchQuery(placeName);
    setSuggestions([]);
  };

  /* ---------- submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const API_BASE =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

      const response = await fetch(`${API_BASE}/admin/submit-listing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: listingType, ...formData }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit listing.');

      setMessage({
        type: 'success',
        text: `${listingType.toUpperCase()} submitted! Pending admin review.`,
      });
      setFormData({
        name: '',
        address: '',
        city: '',
        country: '',
        latitude: '',
        longitude: '',
        star_rating: '4',
        price_per_night: '',
        cuisine_type: '',
        description: '',
        image_url: '',
      });
      setSearchQuery('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const activeType = LISTING_TYPES.find((t) => t.key === listingType);
  const ActiveIcon = activeType?.icon;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#000A12]">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 py-8 space-y-6">

        {/* =========================================
            HEADER
        ========================================= */}
        <header>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#E6F7F0] text-[#007A4D]">
              <Icon.user className="w-3 h-3" />
              Supplier Portal
            </span>
          </div>

          <h1 className="text-[28px] md:text-[32px] font-extrabold tracking-[-0.02em] text-[#000A12]">
            List your business
          </h1>
          <p className="text-[14px] text-[#545454] mt-1 max-w-xl">
            Submit new Hotels, Restaurants, or Cruises for review. Once approved,
            your listing will appear across the platform.
          </p>
        </header>

        {/* =========================================
            MESSAGE BANNER
        ========================================= */}
        {message && (
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 text-[13px] font-semibold ${
              message.type === 'success'
                ? 'bg-[#E6F7F0] border-[#B7E4CE] text-[#007A4D]'
                : 'bg-[#FFF1F0] border-[#F5C2C0] text-[#B3261E]'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                message.type === 'success'
                  ? 'bg-white text-[#00AA6C]'
                  : 'bg-white text-[#B3261E]'
              }`}
            >
              {message.type === 'success' ? (
                <Icon.check className="w-4 h-4" />
              ) : (
                <Icon.alert className="w-4 h-4" />
              )}
            </div>
            <p className="pt-1">{message.text}</p>
          </div>
        )}

        {/* =========================================
            CATEGORY TABS
        ========================================= */}
        <section>
          <div className="grid grid-cols-3 gap-2.5">
            {LISTING_TYPES.map((type) => {
              const active = listingType === type.key;
              const TypeIcon = type.icon;
              return (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setListingType(type.key)}
                  className={`group relative flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all text-[13px] font-bold ${
                    active
                      ? 'border-[#00AA6C] bg-[#E6F7F0] text-[#007A4D] shadow-[0_4px_14px_-6px_rgba(0,170,108,0.45)]'
                      : 'border-[#E0E0E0] bg-white text-[#545454] hover:border-[#00AA6C]/40 hover:bg-[#FAFAFA]'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      active
                        ? 'bg-[#00AA6C] text-white'
                        : 'bg-[#F2F2F2] text-[#545454] group-hover:bg-[#E6F7F0] group-hover:text-[#00AA6C]'
                    }`}
                  >
                    <TypeIcon className="w-4.5 h-4.5" />
                  </span>
                  <span className="capitalize">{type.label}</span>

                  {active && (
                    <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full bg-[#00AA6C]" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* =========================================
            STEP 1 — LOCATION SEARCH
        ========================================= */}
        <section className="bg-white rounded-2xl border border-[#E0E0E0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-7 h-7 rounded-full bg-[#E6F7F0] text-[#00AA6C] flex items-center justify-center text-[12px] font-extrabold">
              1
            </span>
            <h2 className="text-[16px] font-extrabold text-[#000A12] tracking-tight">
              Find your location
            </h2>
          </div>

          <div className="relative">
            <div className="relative">
              <Icon.search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#767676] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={`Search for a ${listingType} or city…`}
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-[14px] text-[#000A12] placeholder:text-[#9A9A9A] outline-none transition-all focus:bg-white focus:border-[#00AA6C] focus:ring-4 focus:ring-[#00AA6C]/15"
              />
            </div>

            {isSearching && (
              <p className="flex items-center gap-1.5 text-[12px] text-[#767676] mt-2">
                <span className="w-3 h-3 border-2 border-[#00AA6C]/30 border-t-[#00AA6C] rounded-full animate-spin" />
                Searching…
              </p>
            )}

            {suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white border border-[#E0E0E0] rounded-xl shadow-[0_12px_32px_-8px_rgba(0,0,0,0.15)] z-50 max-h-72 overflow-y-auto">
                {suggestions.map((item, index) => {
                  const name =
                    item.properties.name || item.properties.street;
                  const sub = [
                    item.properties.city,
                    item.properties.country,
                  ]
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <li
                      key={index}
                      onClick={() => handleSelectPlace(item)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-[#E6F7F0]/60 cursor-pointer border-b border-[#F0F0F0] last:border-0 transition-colors"
                    >
                      <span className="w-7 h-7 rounded-full bg-[#F2F2F2] text-[#00AA6C] flex items-center justify-center shrink-0 mt-0.5">
                        <Icon.pin className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-[#000A12] truncate">
                          {name}
                        </div>
                        {sub && (
                          <div className="text-[12px] text-[#767676] truncate">
                            {sub}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* =========================================
            STEP 2 — DETAILS FORM
        ========================================= */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-[#E0E0E0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-[#E6F7F0] text-[#00AA6C] flex items-center justify-center text-[12px] font-extrabold">
              2
            </span>
            <h2 className="text-[16px] font-extrabold text-[#000A12] tracking-tight capitalize">
              {listingType} details
            </h2>
            {ActiveIcon && (
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#007A4D] bg-[#E6F7F0] px-2.5 py-1 rounded-full">
                <ActiveIcon className="w-3 h-3" />
                {activeType.label}
              </span>
            )}
          </div>

          {/* Name */}
          <Field label="Name / Title">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="ta-input"
              required
            />
          </Field>

          {/* Photo URL */}
          <Field
            label="Photo URL"
            hint={`Link to a photo of the ${listingType} (optional, but listings with a photo perform better).`}
          >
            <input
              type="url"
              inputMode="url"
              value={formData.image_url}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
              }
              placeholder="https://images.unsplash.com/photo-..."
              className="ta-input"
            />

            {formData.image_url && (
              <div className="mt-3 w-full h-40 rounded-xl overflow-hidden border border-[#E0E0E0] bg-[#FAFAFA] relative">
                <img
                  src={formData.image_url}
                  alt="Listing preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center flex-col gap-2 text-[12px] text-[#767676]">
                  <Icon.image className="w-6 h-6 text-[#B0B0B0]" />
                  Couldn't load image from that URL
                </div>
              </div>
            )}
          </Field>

          {/* Cuisine type (restaurant only) */}
          {listingType === 'restaurant' && (
            <Field label="Cuisine Type">
              <input
                type="text"
                value={formData.cuisine_type}
                onChange={(e) =>
                  setFormData({ ...formData, cuisine_type: e.target.value })
                }
                placeholder="Italian, Japanese, Fast Food"
                className="ta-input"
                required
              />
            </Field>
          )}

          {/* City / Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={
                listingType === 'cruise'
                  ? 'Departure Port (City)'
                  : 'City'
              }
            >
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="ta-input ta-input-readonly"
                required
              />
            </Field>

            <Field
              label={
                listingType === 'cruise'
                  ? 'Arrival Port (Country/City)'
                  : 'Country'
              }
            >
              <input
                type="text"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="ta-input ta-input-readonly"
                required
              />
            </Field>
          </div>

          {/* Price + (Star for hotel) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Price ($)">
              <input
                type="number"
                value={formData.price_per_night}
                onChange={(e) =>
                  setFormData({ ...formData, price_per_night: e.target.value })
                }
                className="ta-input"
                placeholder="100"
                required
              />
            </Field>

            {listingType === 'hotel' && (
              <Field label="Star Rating">
                <div className="relative">
                  <select
                    value={formData.star_rating}
                    onChange={(e) =>
                      setFormData({ ...formData, star_rating: e.target.value })
                    }
                    className="ta-input appearance-none pr-10 cursor-pointer"
                  >
                    <option value="3">3 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#FFB800]">
                    <Icon.star className="w-4 h-4" />
                  </span>
                </div>
              </Field>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#00AA6C] text-white text-[14px] font-bold shadow-[0_6px_18px_-6px_rgba(0,170,108,0.55)] hover:bg-[#008F5A] hover:shadow-[0_10px_24px_-8px_rgba(0,170,108,0.7)] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Icon.check className="w-4 h-4" />
                Submit {listingType.toUpperCase()} for Review
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-[#767676] flex items-center justify-center gap-1.5">
            <Icon.star className="w-3 h-3 text-[#FFB800]" />
            Submissions are reviewed within 1–2 business days
          </p>
        </form>
      </div>

      {/* =========================================
          SHARED INPUT STYLES (via arbitrary variants
          — or move to your global CSS)
      ========================================= */}
      <style>{`
        .ta-input {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid #E0E0E0;
          background: #FAFAFA;
          font-size: 14px;
          color: #000A12;
          outline: none;
          transition: all .15s ease;
        }
        .ta-input::placeholder { color: #9A9A9A; }
        .ta-input:hover { border-color: #C7C7C7; }
        .ta-input:focus {
          background: #fff;
          border-color: #00AA6C;
          box-shadow: 0 0 0 4px rgba(0,170,108,.15);
        }
        .ta-input-readonly { background: #F5F5F5; }
        .ta-input-readonly:focus { background: #fff; }
      `}</style>
    </div>
  );
}

/* =========================================================
   FIELD — label + optional hint
========================================================= */
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-[#545454] mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] text-[#767676] mt-1.5 leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}
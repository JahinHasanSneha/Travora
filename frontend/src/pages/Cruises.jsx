import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCruises } from '../api/client';
import AddToTripButton from '../components/AddToTripModal';
import RatingBubbles from '../components/RatingBubbles';

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Cruises() {
  const [cruises, setCruises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* =======================================================
     SEARCH
  ======================================================= */

  const [searchQuery, setSearchQuery] = useState('');

  /* =======================================================
     FILTERS
  ======================================================= */

  const [selectedCruiseLines, setSelectedCruiseLines] = useState([]);
  const [selectedDeparturePorts, setSelectedDeparturePorts] =
    useState([]);
  const [selectedArrivalPorts, setSelectedArrivalPorts] =
    useState([]);
  const [selectedDurations, setSelectedDurations] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState([]);

  /* =======================================================
     SORT
  ======================================================= */

  const [sortBy, setSortBy] = useState('recommended');

  /* =======================================================
     MOBILE FILTER
  ======================================================= */

  const [showFilters, setShowFilters] = useState(false);

  /* =======================================================
     FILTER SECTION OPEN/CLOSE
  ======================================================= */

  const [openSections, setOpenSections] = useState({
    cruiseLine: true,
    departure: true,
    arrival: true,
    duration: true,
    price: true,
  });

  /* =======================================================
     FETCH CRUISES
  ======================================================= */

  useEffect(() => {
    fetchCruises()
      .then((res) => {
        setCruises(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load cruises:', err);
        setError(
          'Failed to fetch cruises. Please try again later.'
        );
        setLoading(false);
      });
  }, []);

  /* =======================================================
     UNIQUE CRUISE LINES
  ======================================================= */

  const cruiseLines = useMemo(() => {
    return [
      ...new Set(
        cruises
          .map((cruise) => cruise.cruise_line)
          .filter(Boolean)
      ),
    ].sort();
  }, [cruises]);

  /* =======================================================
     UNIQUE DEPARTURE PORTS
  ======================================================= */

  const departurePorts = useMemo(() => {
    return [
      ...new Set(
        cruises
          .map((cruise) => cruise.departure_port)
          .filter(Boolean)
      ),
    ].sort();
  }, [cruises]);

  /* =======================================================
     UNIQUE ARRIVAL PORTS
  ======================================================= */

  const arrivalPorts = useMemo(() => {
    return [
      ...new Set(
        cruises
          .map((cruise) => cruise.arrival_port)
          .filter(Boolean)
      ),
    ].sort();
  }, [cruises]);

  /* =======================================================
     TOGGLE FILTER
  ======================================================= */

  const toggleFilter = (setter, value) => {
    setter((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }

      return [...current, value];
    });
  };

  /* =======================================================
     CLEAR ALL FILTERS
  ======================================================= */

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCruiseLines([]);
    setSelectedDeparturePorts([]);
    setSelectedArrivalPorts([]);
    setSelectedDurations([]);
    setSelectedPrices([]);
    setSortBy('recommended');
  };

  /* =======================================================
     CHECK WHETHER FILTERS ARE ACTIVE
  ======================================================= */

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCruiseLines.length > 0 ||
    selectedDeparturePorts.length > 0 ||
    selectedArrivalPorts.length > 0 ||
    selectedDurations.length > 0 ||
    selectedPrices.length > 0;

  /* =======================================================
     PRICE HELPER
  ======================================================= */

  const getPrice = (cruise) => {
    const price = Number(cruise.price_per_person);

    return Number.isFinite(price) ? price : 0;
  };

  /* =======================================================
     DURATION FILTER
  ======================================================= */

  const matchesDuration = (cruise) => {
    if (selectedDurations.length === 0) {
      return true;
    }

    const days = Number(cruise.duration_days);

    return selectedDurations.some((duration) => {
      switch (duration) {
        case '1-3':
          return days >= 1 && days <= 3;

        case '4-7':
          return days >= 4 && days <= 7;

        case '8-14':
          return days >= 8 && days <= 14;

        case '15+':
          return days >= 15;

        default:
          return false;
      }
    });
  };

  /* =======================================================
     PRICE FILTER
  ======================================================= */

  const matchesPrice = (cruise) => {
    if (selectedPrices.length === 0) {
      return true;
    }

    const price = getPrice(cruise);

    return selectedPrices.some((range) => {
      switch (range) {
        case 'under-500':
          return price < 500;

        case '500-1000':
          return price >= 500 && price <= 1000;

        case '1000-2000':
          return price > 1000 && price <= 2000;

        case '2000+':
          return price > 2000;

        default:
          return false;
      }
    });
  };

  /* =======================================================
     SEARCH + FILTER + SORT
  ======================================================= */

  const filteredCruises = useMemo(() => {
    let result = [...cruises];

    /* -------------------------------------------------------
       SEARCH
    ------------------------------------------------------- */

    const search = searchQuery.trim().toLowerCase();

    if (search) {
      const searchWords = search.split(/\s+/);

      result = result.filter((cruise) => {
        const searchableText = [
          cruise.ship_name,
          cruise.cruise_line,
          cruise.departure_port,
          cruise.arrival_port,
          cruise.route_description,
          cruise.description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchWords.every((word) =>
          searchableText.includes(word)
        );
      });
    }

    /* -------------------------------------------------------
       CRUISE LINE
    ------------------------------------------------------- */

    if (selectedCruiseLines.length > 0) {
      result = result.filter((cruise) =>
        selectedCruiseLines.includes(cruise.cruise_line)
      );
    }

    /* -------------------------------------------------------
       DEPARTURE PORT
    ------------------------------------------------------- */

    if (selectedDeparturePorts.length > 0) {
      result = result.filter((cruise) =>
        selectedDeparturePorts.includes(
          cruise.departure_port
        )
      );
    }

    /* -------------------------------------------------------
       ARRIVAL PORT
    ------------------------------------------------------- */

    if (selectedArrivalPorts.length > 0) {
      result = result.filter((cruise) =>
        selectedArrivalPorts.includes(
          cruise.arrival_port
        )
      );
    }

    /* -------------------------------------------------------
       DURATION
    ------------------------------------------------------- */

    result = result.filter(matchesDuration);

    /* -------------------------------------------------------
       PRICE
    ------------------------------------------------------- */

    result = result.filter(matchesPrice);

    /* -------------------------------------------------------
       SORT
    ------------------------------------------------------- */

    if (sortBy === 'price-low') {
      result.sort((a, b) => getPrice(a) - getPrice(b));
    }

    if (sortBy === 'price-high') {
      result.sort((a, b) => getPrice(b) - getPrice(a));
    }

    if (sortBy === 'duration-short') {
      result.sort(
        (a, b) =>
          Number(a.duration_days || 0) -
          Number(b.duration_days || 0)
      );
    }

    if (sortBy === 'duration-long') {
      result.sort(
        (a, b) =>
          Number(b.duration_days || 0) -
          Number(a.duration_days || 0)
      );
    }

    if (sortBy === 'rating') {
      result.sort(
        (a, b) =>
          Number(b.rating || 0) -
          Number(a.rating || 0)
      );
    }

    if (sortBy === 'name') {
      result.sort((a, b) =>
        String(a.ship_name || '').localeCompare(
          String(b.ship_name || '')
        )
      );
    }

    return result;
  }, [
    cruises,
    searchQuery,
    selectedCruiseLines,
    selectedDeparturePorts,
    selectedArrivalPorts,
    selectedDurations,
    selectedPrices,
    sortBy,
  ]);

  /* =======================================================
     FILTER SECTION
  ======================================================= */

  const FilterSection = ({
    title,
    section,
    children,
  }) => (
    <div className="border-b border-gray-200 py-5">
      <button
        type="button"
        onClick={() =>
          setOpenSections((previous) => ({
            ...previous,
            [section]: !previous[section],
          }))
        }
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-semibold text-gray-900">
          {title}
        </span>

        <span className="text-gray-500 text-xl">
          {openSections[section] ? '−' : '+'}
        </span>
      </button>

      {openSections[section] && (
        <div className="mt-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  );

  /* =======================================================
     CHECKBOX
  ======================================================= */

  const FilterCheckbox = ({
    label,
    checked,
    onChange,
  }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 accent-[#00AA88] cursor-pointer"
      />

      <span className="text-sm text-gray-700 group-hover:text-[#00866A] transition">
        {label}
      </span>
    </label>
  );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-lg">
          Loading cruises...
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 text-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-screen bg-gray-50">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="bg-white border-b border-gray-200">

        <div className="max-w-7xl mx-auto px-4 py-8">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">

            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Cruises & Ocean Voyages
              </h1>

              <p className="text-gray-500 mt-2 max-w-2xl">
                Discover cruises, compare voyages, explore routes,
                and find the perfect ocean adventure for your trip.
              </p>
            </div>

            {/* MOBILE FILTER BUTTON */}

            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="md:hidden bg-[#00AA88] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#008F73] transition"
            >
              ☰ Filters
            </button>

          </div>

          {/* =================================================
              SEARCH BAR
          ================================================= */}

          <div className="mt-6 max-w-3xl">

            <div className="relative">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                🔍
              </span>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Search by ship, cruise line, port or destination..."
                className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AA88] focus:border-[#00AA88] bg-white"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex gap-8">

          {/* =================================================
              LEFT FILTER SIDEBAR
          ================================================= */}

          <aside
            className={`
              w-72 flex-shrink-0
              ${
                showFilters
                  ? 'fixed inset-0 z-50 bg-white p-5 overflow-y-auto'
                  : 'hidden'
              }
              md:block md:static md:bg-transparent md:p-0 md:overflow-visible
            `}
          >

            {/* MOBILE HEADER */}

            <div className="md:hidden flex items-center justify-between mb-5">

              <h2 className="text-xl font-bold text-gray-900">
                Filters
              </h2>

              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="text-2xl text-gray-500"
              >
                ×
              </button>

            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 md:sticky md:top-5">

              {/* FILTER HEADER */}

              <div className="flex items-center justify-between">

                <h2 className="text-lg font-bold text-gray-900">
                  Filters
                </h2>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm text-[#008F73] hover:underline font-medium"
                  >
                    Clear all
                  </button>
                )}

              </div>

              {/* =================================================
                  CRUISE LINE
              ================================================= */}

              {cruiseLines.length > 0 && (
                <FilterSection
                  title="Cruise Line"
                  section="cruiseLine"
                >
                  {cruiseLines.map((line) => (
                    <FilterCheckbox
                      key={line}
                      label={line}
                      checked={selectedCruiseLines.includes(
                        line
                      )}
                      onChange={() =>
                        toggleFilter(
                          setSelectedCruiseLines,
                          line
                        )
                      }
                    />
                  ))}
                </FilterSection>
              )}

              {/* =================================================
                  DEPARTURE
              ================================================= */}

              {departurePorts.length > 0 && (
                <FilterSection
                  title="Departure Port"
                  section="departure"
                >
                  {departurePorts.map((port) => (
                    <FilterCheckbox
                      key={port}
                      label={port}
                      checked={selectedDeparturePorts.includes(
                        port
                      )}
                      onChange={() =>
                        toggleFilter(
                          setSelectedDeparturePorts,
                          port
                        )
                      }
                    />
                  ))}
                </FilterSection>
              )}

              {/* =================================================
                  ARRIVAL
              ================================================= */}

              {arrivalPorts.length > 0 && (
                <FilterSection
                  title="Arrival Port"
                  section="arrival"
                >
                  {arrivalPorts.map((port) => (
                    <FilterCheckbox
                      key={port}
                      label={port}
                      checked={selectedArrivalPorts.includes(
                        port
                      )}
                      onChange={() =>
                        toggleFilter(
                          setSelectedArrivalPorts,
                          port
                        )
                      }
                    />
                  ))}
                </FilterSection>
              )}

              {/* =================================================
                  DURATION
              ================================================= */}

              <FilterSection
                title="Duration"
                section="duration"
              >

                <FilterCheckbox
                  label="1–3 days"
                  checked={selectedDurations.includes('1-3')}
                  onChange={() =>
                    toggleFilter(
                      setSelectedDurations,
                      '1-3'
                    )
                  }
                />

                <FilterCheckbox
                  label="4–7 days"
                  checked={selectedDurations.includes('4-7')}
                  onChange={() =>
                    toggleFilter(
                      setSelectedDurations,
                      '4-7'
                    )
                  }
                />

                <FilterCheckbox
                  label="8–14 days"
                  checked={selectedDurations.includes('8-14')}
                  onChange={() =>
                    toggleFilter(
                      setSelectedDurations,
                      '8-14'
                    )
                  }
                />

                <FilterCheckbox
                  label="15+ days"
                  checked={selectedDurations.includes('15+')}
                  onChange={() =>
                    toggleFilter(
                      setSelectedDurations,
                      '15+'
                    )
                  }
                />

              </FilterSection>

              {/* =================================================
                  PRICE
              ================================================= */}

              <FilterSection
                title="Price per person"
                section="price"
              >

                <FilterCheckbox
                  label="Under $500"
                  checked={selectedPrices.includes(
                    'under-500'
                  )}
                  onChange={() =>
                    toggleFilter(
                      setSelectedPrices,
                      'under-500'
                    )
                  }
                />

                <FilterCheckbox
                  label="$500 – $1,000"
                  checked={selectedPrices.includes(
                    '500-1000'
                  )}
                  onChange={() =>
                    toggleFilter(
                      setSelectedPrices,
                      '500-1000'
                    )
                  }
                />

                <FilterCheckbox
                  label="$1,001 – $2,000"
                  checked={selectedPrices.includes(
                    '1000-2000'
                  )}
                  onChange={() =>
                    toggleFilter(
                      setSelectedPrices,
                      '1000-2000'
                    )
                  }
                />

                <FilterCheckbox
                  label="$2,000+"
                  checked={selectedPrices.includes(
                    '2000+'
                  )}
                  onChange={() =>
                    toggleFilter(
                      setSelectedPrices,
                      '2000+'
                    )
                  }
                />

              </FilterSection>

            </div>

          </aside>

          {/* =================================================
              RESULTS
          ================================================= */}

          <main className="flex-1 min-w-0">

            {/* RESULTS HEADER */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">

              <div>

                <p className="text-gray-900 font-semibold">
                  {filteredCruises.length}{' '}
                  {filteredCruises.length === 1
                    ? 'cruise'
                    : 'cruises'}
                </p>

                {hasActiveFilters && (
                  <p className="text-sm text-gray-500 mt-1">
                    Results updated based on your filters
                  </p>
                )}

              </div>

              {/* SORT */}

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
                className="border border-gray-300 bg-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AA88]"
              >

                <option value="recommended">
                  Recommended
                </option>

                <option value="rating">
                  Highest Rated
                </option>

                <option value="price-low">
                  Price: Low to High
                </option>

                <option value="price-high">
                  Price: High to Low
                </option>

                <option value="duration-short">
                  Shortest Duration
                </option>

                <option value="duration-long">
                  Longest Duration
                </option>

                <option value="name">
                  Ship Name
                </option>

              </select>

            </div>

            {/* =================================================
                ACTIVE FILTER TAGS
            ================================================= */}

            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-6">

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 bg-[#E8F7F3] text-[#007F67] rounded-full text-sm"
                  >
                    Search: {searchQuery} ×
                  </button>
                )}

                {selectedCruiseLines.map((line) => (
                  <button
                    key={line}
                    type="button"
                    onClick={() =>
                      toggleFilter(
                        setSelectedCruiseLines,
                        line
                      )
                    }
                    className="px-3 py-1.5 bg-[#E8F7F3] text-[#007F67] rounded-full text-sm"
                  >
                    {line} ×
                  </button>
                ))}

                {selectedDeparturePorts.map((port) => (
                  <button
                    key={port}
                    type="button"
                    onClick={() =>
                      toggleFilter(
                        setSelectedDeparturePorts,
                        port
                      )
                    }
                    className="px-3 py-1.5 bg-[#E8F7F3] text-[#007F67] rounded-full text-sm"
                  >
                    From: {port} ×
                  </button>
                ))}

                {selectedArrivalPorts.map((port) => (
                  <button
                    key={port}
                    type="button"
                    onClick={() =>
                      toggleFilter(
                        setSelectedArrivalPorts,
                        port
                      )
                    }
                    className="px-3 py-1.5 bg-[#E8F7F3] text-[#007F67] rounded-full text-sm"
                  >
                    To: {port} ×
                  </button>
                ))}

              </div>
            )}

            {/* =================================================
                CRUISE CARDS
            ================================================= */}

            {filteredCruises.length > 0 ? (

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {filteredCruises.map((cruise) => (

                  <div
                    key={cruise.cruise_id}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col"
                  >

                    {/* IMAGE */}

                    <Link
                      to={`/cruises/${cruise.cruise_id}`}
                      className="block relative"
                    >

                      {cruise.image_url ? (
                        <img
                          src={cruise.image_url}
                          alt={cruise.ship_name}
                          className="h-52 w-full object-cover"
                        />
                      ) : (
                        <div className="h-52 bg-gray-200 flex items-center justify-center text-gray-500">
                          No image available
                        </div>
                      )}

                      {/* DURATION BADGE */}

                      {cruise.duration_days && (
                        <span className="absolute bottom-3 left-3 bg-white/95 px-3 py-1 rounded-full text-xs font-semibold text-gray-800 shadow">
                          {cruise.duration_days} days
                        </span>
                      )}

                    </Link>

                    {/* CARD CONTENT */}

                    <div className="p-5 flex-1 flex flex-col">

                      {/* SHIP NAME */}

                      <Link
                        to={`/cruises/${cruise.cruise_id}`}
                        className="hover:text-[#008F73] transition"
                      >
                        <h2 className="text-xl font-bold text-gray-900">
                          {cruise.ship_name}
                        </h2>
                      </Link>

                      {/* CRUISE LINE */}

                      {cruise.cruise_line && (
                        <p className="text-sm font-medium text-[#008F73] mt-1">
                          {cruise.cruise_line}
                        </p>
                      )}

                      {/* =================================================
                          RATING BUBBLES
                      ================================================= */}

                      <Link
                        to={`/cruises/${cruise.cruise_id}#reviews`}
                        className="inline-block mt-2 hover:opacity-80 transition"
                        aria-label={`Read reviews for ${cruise.ship_name}`}
                      >
                        <RatingBubbles
                          rating={cruise.rating}
                          reviewCount={cruise.review_count}
                        />
                      </Link>

                      {/* ROUTE */}

                      <div className="mt-4 bg-gray-50 rounded-lg p-3">

                        <div className="flex items-center gap-2 text-sm">

                          <span className="font-medium text-gray-800">
                            {cruise.departure_port}
                          </span>

                          <span className="text-[#00AA88] font-bold">
                            →
                          </span>

                          <span className="font-medium text-gray-800">
                            {cruise.arrival_port}
                          </span>

                        </div>

                      </div>

                      {/* DESCRIPTION */}

                      {cruise.route_description && (
                        <p className="text-gray-600 text-sm line-clamp-3 mt-4">
                          {cruise.route_description}
                        </p>
                      )}

                      {/* =================================================
                          BOTTOM
                      ================================================= */}

                      <div className="mt-auto pt-5">

                        <div className="border-t border-gray-200 pt-4 flex items-center justify-between gap-4">

                          {/* PRICE */}

                          <div>

                            <p className="text-xs text-gray-500">
                              From
                            </p>

                            <span className="text-xl font-bold text-[#008F73]">
                              {cruise.price_per_person
                                ? `$${getPrice(
                                    cruise
                                  ).toLocaleString()}`
                                : 'Contact'}
                            </span>

                            {cruise.price_per_person && (
                              <span className="text-xs text-gray-500 ml-1">
                                / person
                              </span>
                            )}

                          </div>

                          {/* ADD TO TRIP */}

                          <div className="flex items-center gap-2">
                            <Link
                              to={`/cruises/${cruise.cruise_id}`}
                              className="border border-[#00AA88] text-[#008F73] px-4 py-2 rounded-lg hover:bg-[#E8F7F3] text-sm font-medium transition"
                            >
                              View details
                            </Link>

                            <AddToTripButton
                            item={{
                              id: cruise.cruise_id,
                              name: cruise.ship_name,
                              type: 'cruise',
                            }}
                            className="bg-[#00AA88] text-white px-4 py-2 rounded-lg hover:bg-[#008F73] text-sm font-medium transition"
                          />
                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            ) : (

              /* =================================================
                 NO RESULTS
              ================================================= */

              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">

                <div className="text-5xl mb-4">
                  🚢
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  No cruises found
                </h2>

                <p className="text-gray-500 mb-5">
                  Try changing your search or removing some
                  filters.
                </p>

                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="bg-[#00AA88] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#008F73] transition"
                >
                  Clear all filters
                </button>

              </div>

            )}

          </main>

        </div>

      </div>

    </div>
  );
}
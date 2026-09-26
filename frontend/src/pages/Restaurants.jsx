import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRestaurants } from '../api/client';
import AddToTripButton from '../components/AddToTripModal';

export default function Restaurants() {
  // =========================================================
  // DATA
  // =========================================================

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =========================================================
  // SEARCH
  // =========================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // =========================================================
  // RESERVATION
  // =========================================================

  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedTime, setSelectedTime] = useState('7:00 PM');
  const [selectedGuests, setSelectedGuests] = useState('2 guests');

  // =========================================================
  // SORT
  // =========================================================

  const [sortBy, setSortBy] = useState('featured');

  // =========================================================
  // FILTERS
  // =========================================================

  const [establishmentTypes, setEstablishmentTypes] = useState({
    restaurants: true,
    quickBites: false,
    barsPubs: false,
    coffeeTea: false,
  });

  const [mealTypes, setMealTypes] = useState({
    breakfast: false,
    brunch: false,
    lunch: false,
    dinner: false,
  });

  const [cuisines, setCuisines] = useState({
    caribbean: false,
    bahamian: false,
    american: false,
    italian: false,
    seafood: false,
  });

  const [priceRanges, setPriceRanges] = useState({
    '$': false,
    '$$ - $$$': false,
    '$$$$': false,
  });

  const [dietary, setDietary] = useState({
    vegetarian: false,
    vegan: false,
    halal: false,
    glutenFree: false,
  });

  // =========================================================
  // FILTER OPEN/CLOSE
  // =========================================================

  const [reservationOpen, setReservationOpen] = useState(true);
  const [establishmentOpen, setEstablishmentOpen] = useState(true);
  const [mealOpen, setMealOpen] = useState(true);
  const [cuisineOpen, setCuisineOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [dietaryOpen, setDietaryOpen] = useState(true);

  // =========================================================
  // BUILD API QUERY
  // =========================================================

  const buildQueryParams = () => {
    const params = new URLSearchParams();

    /*
      IMPORTANT:
      We don't depend on backend search anymore.
      Search is handled locally below.
    */

    const selectedTypes = Object.keys(establishmentTypes).filter(
      (key) => establishmentTypes[key]
    );

    if (selectedTypes.length) {
      params.append('types', selectedTypes.join(','));
    }

    const selectedMeals = Object.keys(mealTypes).filter(
      (key) => mealTypes[key]
    );

    if (selectedMeals.length) {
      params.append('meals', selectedMeals.join(','));
    }

    const selectedCuisines = Object.keys(cuisines).filter(
      (key) => cuisines[key]
    );

    if (selectedCuisines.length) {
      params.append('cuisines', selectedCuisines.join(','));
    }

    const selectedPrices = Object.keys(priceRanges).filter(
      (key) => priceRanges[key]
    );

    if (selectedPrices.length) {
      params.append('price', selectedPrices.join(','));
    }

    const selectedDietary = Object.keys(dietary).filter(
      (key) => dietary[key]
    );

    if (selectedDietary.length) {
      params.append('dietary', selectedDietary.join(','));
    }

    return params.toString();
  };

  // =========================================================
  // FETCH RESTAURANTS
  // =========================================================

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const query = buildQueryParams();

      const res = await fetchRestaurants(query);

      setRestaurants(res?.data || []);
    } catch (err) {
      console.error('Failed to load restaurants:', err);

      setError(
        'Failed to fetch restaurants. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchData();
  }, []);

  // =========================================================
  // SEARCH SUBMIT
  // =========================================================

  const handleSearch = (e) => {
    e.preventDefault();

    const cleanQuery = searchQuery.trim();

    setSubmittedSearch(cleanQuery);
    setShowSuggestions(false);
  };

  // =========================================================
  // CLEAR SEARCH
  // =========================================================

  const clearSearch = () => {
    setSearchQuery('');
    setSubmittedSearch('');
    setShowSuggestions(false);
  };

  // =========================================================
  // SEARCH SUGGESTIONS
  // =========================================================

  const searchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return restaurants
      .filter((restaurant) => {
        const name =
          restaurant.name?.toLowerCase() || '';

        const cuisine =
          restaurant.cuisine_type?.toLowerCase() || '';

        const city =
          restaurant.city?.toLowerCase() || '';

        const country =
          restaurant.country?.toLowerCase() || '';

        return (
          name.includes(query) ||
          cuisine.includes(query) ||
          city.includes(query) ||
          country.includes(query)
        );
      })
      .slice(0, 5);
  }, [searchQuery, restaurants]);

  // =========================================================
  // LOCAL SEARCH
  // =========================================================

  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants];

    const query = submittedSearch.trim().toLowerCase();

    // -------------------------------------------------------
    // SEARCH
    // -------------------------------------------------------

    if (query) {
      const searchWords = query
        .split(/\s+/)
        .filter(Boolean);

      result = result.filter((restaurant) => {
        const searchableText = [
          restaurant.name,
          restaurant.cuisine_type,
          restaurant.address,
          restaurant.city,
          restaurant.country,
          restaurant.review_snippet,
          restaurant.price_range,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        /*
          Every word typed by the user must appear somewhere
          in the restaurant information.

          Example:

          "Italian Dhaka"

          will match a restaurant where:
          Italian -> cuisine
          Dhaka   -> city
        */

        return searchWords.every((word) =>
          searchableText.includes(word)
        );
      });
    }

    // -------------------------------------------------------
    // SORT
    // -------------------------------------------------------

    if (sortBy === 'rating') {
      result.sort((a, b) => {
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;

        return ratingB - ratingA;
      });
    }

    else if (sortBy === 'price_low') {
      result.sort((a, b) => {
        return getPriceValue(a.price_range) -
          getPriceValue(b.price_range);
      });
    }

    else if (sortBy === 'price_high') {
      result.sort((a, b) => {
        return getPriceValue(b.price_range) -
          getPriceValue(a.price_range);
      });
    }

    return result;
  }, [
    restaurants,
    submittedSearch,
    sortBy,
  ]);

  // =========================================================
  // PRICE HELPER
  // =========================================================

  function getPriceValue(price) {
    if (!price) return 2;

    const value = String(price);

    if (value.includes('$$$$')) {
      return 4;
    }

    if (value.includes('$$$')) {
      return 3;
    }

    if (value.includes('$$')) {
      return 2;
    }

    if (value.includes('$')) {
      return 1;
    }

    return 2;
  }

  // =========================================================
  // TOGGLE FILTER
  // =========================================================

  const toggleObjectValue = (setter, key) => {
    setter((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // =========================================================
  // RATING CIRCLES
  // =========================================================

  const renderRatingCircles = (rating) => {
    const numericRating = Number(rating) || 0;

    return (
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3, 4].map((index) => {
          const fill = Math.max(
            0,
            Math.min(1, numericRating - index)
          );

          return (
            <span
              key={index}
              className="relative block w-3.5 h-3.5 rounded-full border-2 border-teal-500 overflow-hidden"
            >
              {fill > 0 && (
                <span
                  className="absolute left-0 top-0 h-full bg-teal-500"
                  style={{
                    width: `${fill * 100}%`,
                  }}
                />
              )}
            </span>
          );
        })}
      </div>
    );
  };

  // =========================================================
  // FILTER SECTION
  // =========================================================

  const FilterSection = ({
    title,
    open,
    setOpen,
    children,
  }) => (
    <div className="border-b border-gray-200 py-5">

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-bold text-gray-900 text-base">
          {title}
        </span>

        <span className="text-gray-500 text-lg">
          {open ? '⌃' : '⌄'}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-2">
          {children}
        </div>
      )}

    </div>
  );

  // =========================================================
  // CHECKBOX
  // =========================================================

  const Checkbox = ({
    checked,
    onChange,
    children,
  }) => (
    <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">

      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 accent-teal-500"
      />

      <span>{children}</span>

    </label>
  );

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="text-center">

          <div className="text-4xl mb-3">
            🍽️
          </div>

          <p className="text-gray-600">
            Loading restaurants...
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="text-center">

          <p className="text-red-500 mb-3">
            {error}
          </p>

          <button
            onClick={fetchData}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg"
          >
            Try again
          </button>

        </div>

      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-white">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="border-b border-gray-200 bg-white">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          <div className="flex flex-col gap-2">

            <p className="text-sm text-gray-500">
              Restaurants
            </p>

            <h1 className="text-3xl font-bold text-gray-900">
              Restaurants Near You!
            </h1>

            <p className="text-sm text-gray-600">
              Discover the best places to eat, drink and dine
              in the way of your trip.
            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

          {/* =================================================
              LEFT FILTER SIDEBAR
          ================================================== */}

          <aside className="lg:sticky lg:top-6 lg:self-start">

            <div className="border border-gray-200 rounded-xl bg-white">

              {/* FIND A RESERVATION */}

              <FilterSection
                title="Find a reservation"
                open={reservationOpen}
                setOpen={setReservationOpen}
              >

                <div className="space-y-3">

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Date
                    </label>

                    <select
                      value={selectedDate}
                      onChange={(e) =>
                        setSelectedDate(e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option>Today</option>
                      <option>Tomorrow</option>
                      <option>This weekend</option>
                      <option>Next weekend</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Time
                    </label>

                    <select
                      value={selectedTime}
                      onChange={(e) =>
                        setSelectedTime(e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option>6:00 PM</option>
                      <option>6:30 PM</option>
                      <option>7:00 PM</option>
                      <option>7:30 PM</option>
                      <option>8:00 PM</option>
                      <option>8:30 PM</option>
                      <option>9:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Guests
                    </label>

                    <select
                      value={selectedGuests}
                      onChange={(e) =>
                        setSelectedGuests(e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option>2 guests</option>
                      <option>3 guests</option>
                      <option>4 guests</option>
                      <option>5 guests</option>
                      <option>6+ guests</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={fetchData}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition"
                  >
                    Find a table
                  </button>

                </div>

              </FilterSection>

              {/* ESTABLISHMENT TYPE */}

              <FilterSection
                title="Establishment type"
                open={establishmentOpen}
                setOpen={setEstablishmentOpen}
              >

                <Checkbox
                  checked={establishmentTypes.restaurants}
                  onChange={() =>
                    toggleObjectValue(
                      setEstablishmentTypes,
                      'restaurants'
                    )
                  }
                >
                  Restaurants
                </Checkbox>

                <Checkbox
                  checked={establishmentTypes.quickBites}
                  onChange={() =>
                    toggleObjectValue(
                      setEstablishmentTypes,
                      'quickBites'
                    )
                  }
                >
                  Quick Bites
                </Checkbox>

                <Checkbox
                  checked={establishmentTypes.barsPubs}
                  onChange={() =>
                    toggleObjectValue(
                      setEstablishmentTypes,
                      'barsPubs'
                    )
                  }
                >
                  Bars & Pubs
                </Checkbox>

                <Checkbox
                  checked={establishmentTypes.coffeeTea}
                  onChange={() =>
                    toggleObjectValue(
                      setEstablishmentTypes,
                      'coffeeTea'
                    )
                  }
                >
                  Coffee & Tea
                </Checkbox>

              </FilterSection>

              {/* MEAL TYPE */}

              <FilterSection
                title="Meal type"
                open={mealOpen}
                setOpen={setMealOpen}
              >

                <Checkbox
                  checked={mealTypes.breakfast}
                  onChange={() =>
                    toggleObjectValue(
                      setMealTypes,
                      'breakfast'
                    )
                  }
                >
                  Breakfast
                </Checkbox>

                <Checkbox
                  checked={mealTypes.brunch}
                  onChange={() =>
                    toggleObjectValue(
                      setMealTypes,
                      'brunch'
                    )
                  }
                >
                  Brunch
                </Checkbox>

                <Checkbox
                  checked={mealTypes.lunch}
                  onChange={() =>
                    toggleObjectValue(
                      setMealTypes,
                      'lunch'
                    )
                  }
                >
                  Lunch
                </Checkbox>

                <Checkbox
                  checked={mealTypes.dinner}
                  onChange={() =>
                    toggleObjectValue(
                      setMealTypes,
                      'dinner'
                    )
                  }
                >
                  Dinner
                </Checkbox>

              </FilterSection>

              {/* CUISINES */}

              <FilterSection
                title="Cuisines"
                open={cuisineOpen}
                setOpen={setCuisineOpen}
              >

                <Checkbox
                  checked={cuisines.caribbean}
                  onChange={() =>
                    toggleObjectValue(
                      setCuisines,
                      'caribbean'
                    )
                  }
                >
                  Caribbean
                </Checkbox>

                <Checkbox
                  checked={cuisines.bahamian}
                  onChange={() =>
                    toggleObjectValue(
                      setCuisines,
                      'bahamian'
                    )
                  }
                >
                  Bahamian
                </Checkbox>

                <Checkbox
                  checked={cuisines.american}
                  onChange={() =>
                    toggleObjectValue(
                      setCuisines,
                      'american'
                    )
                  }
                >
                  American
                </Checkbox>

                <Checkbox
                  checked={cuisines.italian}
                  onChange={() =>
                    toggleObjectValue(
                      setCuisines,
                      'italian'
                    )
                  }
                >
                  Italian
                </Checkbox>

                <Checkbox
                  checked={cuisines.seafood}
                  onChange={() =>
                    toggleObjectValue(
                      setCuisines,
                      'seafood'
                    )
                  }
                >
                  Seafood
                </Checkbox>

              </FilterSection>

              {/* PRICE */}

              <FilterSection
                title="Price range"
                open={priceOpen}
                setOpen={setPriceOpen}
              >

                <Checkbox
                  checked={priceRanges['$']}
                  onChange={() =>
                    toggleObjectValue(
                      setPriceRanges,
                      '$'
                    )
                  }
                >
                  $
                </Checkbox>

                <Checkbox
                  checked={priceRanges['$$ - $$$']}
                  onChange={() =>
                    toggleObjectValue(
                      setPriceRanges,
                      '$$ - $$$'
                    )
                  }
                >
                  $$ - $$$
                </Checkbox>

                <Checkbox
                  checked={priceRanges['$$$$']}
                  onChange={() =>
                    toggleObjectValue(
                      setPriceRanges,
                      '$$$$'
                    )
                  }
                >
                  $$$$
                </Checkbox>

              </FilterSection>

              {/* DIETARY */}

              <FilterSection
                title="Dietary restrictions"
                open={dietaryOpen}
                setOpen={setDietaryOpen}
              >

                <Checkbox
                  checked={dietary.vegetarian}
                  onChange={() =>
                    toggleObjectValue(
                      setDietary,
                      'vegetarian'
                    )
                  }
                >
                  Vegetarian friendly
                </Checkbox>

                <Checkbox
                  checked={dietary.vegan}
                  onChange={() =>
                    toggleObjectValue(
                      setDietary,
                      'vegan'
                    )
                  }
                >
                  Vegan options
                </Checkbox>

                <Checkbox
                  checked={dietary.halal}
                  onChange={() =>
                    toggleObjectValue(
                      setDietary,
                      'halal'
                    )
                  }
                >
                  Halal
                </Checkbox>

                <Checkbox
                  checked={dietary.glutenFree}
                  onChange={() =>
                    toggleObjectValue(
                      setDietary,
                      'glutenFree'
                    )
                  }
                >
                  Gluten free
                </Checkbox>

              </FilterSection>

            </div>

          </aside>

          {/* =================================================
              RIGHT RESULTS
          ================================================== */}

          <main>

            {/* =================================================
                SEARCH BAR
            ================================================== */}

            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3 mb-5"
            >

              <div className="flex-1 relative">

                {/* SEARCH ICON */}

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  🔍
                </span>

                {/* INPUT */}

                <input
                  type="text"
                  placeholder="Search restaurants, cuisine, city..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    /*
                      Small delay allows a suggestion click
                      to happen before the dropdown disappears.
                    */
                    setTimeout(() => {
                      setShowSuggestions(false);
                    }, 150);
                  }}
                  className="w-full border border-gray-300 rounded-lg pl-11 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />

                {/* CLEAR BUTTON */}

                {searchQuery && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}

                {/* =================================================
                    SEARCH SUGGESTIONS
                ================================================== */}

                {showSuggestions &&
                  searchQuery.trim() &&
                  searchSuggestions.length > 0 && (

                    <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">

                      {searchSuggestions.map((restaurant) => (

                        <button
                          key={restaurant.restaurant_id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                          }}
                          onClick={() => {
                            setSearchQuery(
                              restaurant.name || ''
                            );

                            setSubmittedSearch(
                              restaurant.name || ''
                            );

                            setShowSuggestions(false);
                          }}
                          className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition"
                        >

                          {/* IMAGE */}

                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">

                            <img
                              src={
                                restaurant.image_url ||
                                'https://placehold.co/100x100/e5e7eb/374151?text=🍽️'
                              }
                              alt=""
                              className="w-full h-full object-cover"
                            />

                          </div>

                          {/* INFO */}

                          <div className="min-w-0">

                            <p className="font-semibold text-gray-900 truncate">
                              {restaurant.name}
                            </p>

                            <p className="text-xs text-gray-500 truncate">
                              {restaurant.cuisine_type ||
                                'Restaurant'}

                              {restaurant.city
                                ? ` · ${restaurant.city}`
                                : ''}
                            </p>

                          </div>

                        </button>

                      ))}

                    </div>
                  )}

              </div>

              {/* SEARCH BUTTON */}

              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold px-7 py-3 rounded-lg transition"
              >
                Search
              </button>

            </form>

            {/* =================================================
                ACTIVE SEARCH
            ================================================== */}

            {submittedSearch && (

              <div className="flex items-center gap-2 mb-4">

                <span className="text-sm text-gray-500">
                  Search results for
                </span>

                <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded-full text-sm font-medium">

                  "{submittedSearch}"

                  <button
                    type="button"
                    onClick={clearSearch}
                    className="ml-1 text-teal-500 hover:text-teal-800"
                  >
                    ×
                  </button>

                </span>

              </div>

            )}

            {/* =================================================
                RESULT HEADER
            ================================================== */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">

              <div>

                <h2 className="text-xl font-bold text-gray-900">

                  {filteredRestaurants.length}{' '}

                  {filteredRestaurants.length === 1
                    ? 'restaurant'
                    : 'restaurants'}

                </h2>

              </div>

              {/* SORT */}

              <div className="flex items-center gap-2">

                <span className="text-sm text-gray-600">
                  Sort by
                </span>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >

                  <option value="featured">
                    Featured
                  </option>

                  <option value="rating">
                    Traveler rating
                  </option>

                  <option value="price_low">
                    Price: Low to High
                  </option>

                  <option value="price_high">
                    Price: High to Low
                  </option>

                </select>

              </div>

            </div>

            {/* =================================================
                RESTAURANT LIST
            ================================================== */}

            <div className="space-y-5">

              {filteredRestaurants.length === 0 ? (

                /* =================================================
                   NO RESULTS
                ================================================== */

                <div className="border border-gray-200 rounded-xl p-10 text-center">

                  <div className="text-4xl mb-3">
                    🔍
                  </div>

                  <h3 className="font-bold text-gray-900">
                    No restaurants found
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {submittedSearch
                      ? `We couldn't find any restaurants matching "${submittedSearch}".`
                      : 'Try changing your search or filters.'}
                  </p>

                  {submittedSearch && (

                    <button
                      type="button"
                      onClick={clearSearch}
                      className="mt-4 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Clear search
                    </button>

                  )}

                </div>

              ) : (

                /* =================================================
                   RESULTS
                ================================================== */

                filteredRestaurants.map((restaurant) => (

                  <article
                    key={restaurant.restaurant_id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition"
                  >

                    <div className="flex flex-col sm:flex-row">

                      {/* IMAGE */}

                      <div className="sm:w-64 h-56 sm:h-auto flex-shrink-0">

                        <img
                          src={
                            restaurant.image_url ||
                            'https://placehold.co/600x400/e5e7eb/374151?text=Restaurant'
                          }
                          alt={
                            restaurant.name ||
                            'Restaurant'
                          }
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://placehold.co/600x400/e5e7eb/374151?text=Restaurant';
                          }}
                        />

                      </div>

                      {/* INFORMATION */}

                      <div className="flex-1 p-5">

                        <div className="flex flex-col h-full">

                          <div>

                            {/* NAME */}

                            <Link
                              to={`/restaurants/${restaurant.restaurant_id}`}
                              className="hover:underline"
                            >

                              <h3 className="text-xl font-bold text-gray-900">
                                {restaurant.name}
                              </h3>

                            </Link>

                            {/* RATING */}

                            <div className="flex items-center gap-2 mt-2">

                              {renderRatingCircles(
                                restaurant.rating || 0
                              )}

                              <span className="font-semibold text-gray-800 text-sm">
                                {restaurant.rating || '—'}
                              </span>

                              <span className="text-sm text-gray-500">
                                (
                                {restaurant.review_count ||
                                  0}
                                )
                              </span>

                            </div>

                            {/* BASIC INFO */}

                            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600">

                              <span>
                                {restaurant.cuisine_type ||
                                  'Various cuisines'}
                              </span>

                              <span>·</span>

                              <span>
                                {restaurant.price_range ||
                                  '$$'}
                              </span>

                              <span>·</span>

                              <span
                                className={
                                  restaurant.is_open
                                    ? 'text-teal-600 font-medium'
                                    : 'text-gray-500'
                                }
                              >
                                {restaurant.is_open
                                  ? 'Open now'
                                  : 'Closed now'}
                              </span>

                            </div>

                            {/* ADDRESS */}

                            <p className="text-sm text-gray-500 mt-2">

                              {restaurant.address ||
                                `${restaurant.city || ''}${
                                  restaurant.city &&
                                  restaurant.country
                                    ? ', '
                                    : ''
                                }${
                                  restaurant.country || ''
                                }`}

                            </p>

                            {/* TAGS */}

                            <div className="flex flex-wrap gap-2 mt-3">

                              {restaurant.has_vegetarian && (

                                <span className="text-xs bg-lime-100 text-lime-800 px-2.5 py-1 rounded-full">
                                  Vegetarian friendly
                                </span>

                              )}

                              {restaurant.has_halal && (

                                <span className="text-xs bg-teal-100 text-teal-800 px-2.5 py-1 rounded-full">
                                  Halal
                                </span>

                              )}

                            </div>

                            {/* REVIEW */}

                            {restaurant.review_snippet && (

                              <p className="text-sm text-gray-600 italic mt-3 line-clamp-2">
                                "{restaurant.review_snippet}"
                              </p>

                            )}

                          </div>

                          {/* BOTTOM */}

                          <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-100">

                            <div className="flex items-center gap-3">

                              <Link
                                to={`/restaurants/${restaurant.restaurant_id}`}
                                className="text-sm font-semibold border border-gray-300 hover:border-teal-500 hover:text-teal-600 px-4 py-2 rounded-lg transition"
                              >
                                View details
                              </Link>

                              <AddToTripButton
                                item={{
                                  id: restaurant.restaurant_id,
                                  name: restaurant.name,
                                  type: 'restaurant',
                                }}
                                className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                              />

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                  </article>

                ))

              )}

            </div>

          </main>

        </div>

      </div>

    </div>
  );
}
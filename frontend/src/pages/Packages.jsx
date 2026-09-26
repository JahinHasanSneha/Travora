import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPackages } from '../api/client';

/* =========================================================
   TRIPADVISOR-STYLE 5 CIRCLE RATING
========================================================= */

function RatingBubbles({ rating, reviewCount }) {
  const numericRating = Number(rating) || 0;

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex items-center gap-[3px]">
        {[1, 2, 3, 4, 5].map((bubble) => {
          const fillPercentage = Math.max(
            0,
            Math.min(100, (numericRating - (bubble - 1)) * 100)
          );

          return (
            <span
              key={bubble}
              className="relative block w-[15px] h-[15px] rounded-full bg-[#E0E0E0] overflow-hidden"
              title={`${numericRating.toFixed(1)} out of 5`}
            >
              <span
                className="absolute left-0 top-0 bottom-0 bg-[#00AA88]"
                style={{
                  width: `${fillPercentage}%`,
                }}
              />
            </span>
          );
        })}
      </div>

      {numericRating > 0 && (
        <span className="text-sm font-semibold text-gray-700">
          {numericRating.toFixed(1)}
        </span>
      )}

      {reviewCount !== undefined &&
        reviewCount !== null &&
        Number(reviewCount) > 0 && (
          <span className="text-sm text-gray-500">
            ({Number(reviewCount).toLocaleString()} reviews)
          </span>
        )}
    </div>
  );
}

/* =========================================================
   FILTER SECTION
========================================================= */

function FilterSection({
  title,
  children,
  open,
  onToggle,
}) {
  return (
    <div className="border-b border-gray-200 py-5">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-semibold text-gray-800">
          {title}
        </span>

        <span className="text-gray-500 text-lg">
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   CHECKBOX
========================================================= */

function FilterCheckbox({
  label,
  checked,
  onChange,
}) {
  return (
    <label className="flex items-center gap-3 py-1.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-gray-300 text-[#00AA88] focus:ring-[#00AA88]"
      />

      <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">
        {label}
      </span>
    </label>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Packages() {
  const [packages, setPackages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------------- SEARCH ---------------- */

  const [search, setSearch] = useState('');

  /* ---------------- FILTERS ---------------- */

  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedDurations, setSelectedDurations] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState([]);

  /* ---------------- SORT ---------------- */

  const [sortBy, setSortBy] = useState('recommended');

  /* ---------------- MOBILE FILTER ---------------- */

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* ---------------- COLLAPSIBLE SECTIONS ---------------- */

  const [openSections, setOpenSections] = useState({
    country: true,
    city: true,
    company: true,
    duration: true,
    price: true,
  });

  /* =========================================================
     FETCH PACKAGES
  ========================================================= */

  useEffect(() => {
    fetchPackages()
      .then((res) => {
        setPackages(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load packages:', err);

        setError(
          'Failed to fetch packages. Please try again later.'
        );

        setLoading(false);
      });
  }, []);

  /* =========================================================
     UNIQUE FILTER VALUES
  ========================================================= */

  const countries = useMemo(() => {
    return [
      ...new Set(
        packages
          .map((pkg) => pkg.destination_country)
          .filter(Boolean)
      ),
    ].sort();
  }, [packages]);

  const cities = useMemo(() => {
    return [
      ...new Set(
        packages
          .map((pkg) => pkg.destination_city)
          .filter(Boolean)
      ),
    ].sort();
  }, [packages]);

  const companies = useMemo(() => {
    return [
      ...new Set(
        packages
          .map((pkg) => pkg.company_name)
          .filter(Boolean)
      ),
    ].sort();
  }, [packages]);

  /* =========================================================
     TOGGLE FILTER
  ========================================================= */

  const toggleFilter = (
    value,
    currentValues,
    setter
  ) => {
    if (currentValues.includes(value)) {
      setter(
        currentValues.filter(
          (item) => item !== value
        )
      );
    } else {
      setter([
        ...currentValues,
        value,
      ]);
    }
  };

  /* =========================================================
     DURATION FILTER
  ========================================================= */

  const matchesDuration = (
    duration,
    filters
  ) => {
    if (filters.length === 0) return true;

    const days = Number(duration) || 0;

    return filters.some((filter) => {
      if (filter === '1-3') {
        return days >= 1 && days <= 3;
      }

      if (filter === '4-7') {
        return days >= 4 && days <= 7;
      }

      if (filter === '8-14') {
        return days >= 8 && days <= 14;
      }

      if (filter === '15+') {
        return days >= 15;
      }

      return false;
    });
  };

  /* =========================================================
     PRICE FILTER
  ========================================================= */

  const getPrice = (pkg) => {
    return Number(pkg.base_price) || 0;
  };

  const matchesPrice = (
    pkg,
    filters
  ) => {
    if (filters.length === 0) return true;

    const price = getPrice(pkg);

    return filters.some((filter) => {
      if (filter === 'under500') {
        return price < 500;
      }

      if (filter === '500-1000') {
        return price >= 500 && price <= 1000;
      }

      if (filter === '1000-2000') {
        return price > 1000 && price <= 2000;
      }

      if (filter === '2000+') {
        return price > 2000;
      }

      return false;
    });
  };

  /* =========================================================
     FILTER + SEARCH + SORT
  ========================================================= */

  const filteredPackages = useMemo(() => {
    let result = [...packages];

    /* SEARCH */

    const searchTerm =
      search.trim().toLowerCase();

    if (searchTerm) {
      result = result.filter((pkg) => {
        return (
          pkg.title
            ?.toLowerCase()
            .includes(searchTerm) ||
          pkg.destination_city
            ?.toLowerCase()
            .includes(searchTerm) ||
          pkg.destination_country
            ?.toLowerCase()
            .includes(searchTerm) ||
          pkg.company_name
            ?.toLowerCase()
            .includes(searchTerm) ||
          pkg.description
            ?.toLowerCase()
            .includes(searchTerm)
        );
      });
    }

    /* COUNTRY */

    if (selectedCountries.length > 0) {
      result = result.filter((pkg) =>
        selectedCountries.includes(
          pkg.destination_country
        )
      );
    }

    /* CITY */

    if (selectedCities.length > 0) {
      result = result.filter((pkg) =>
        selectedCities.includes(
          pkg.destination_city
        )
      );
    }

    /* COMPANY */

    if (selectedCompanies.length > 0) {
      result = result.filter((pkg) =>
        selectedCompanies.includes(
          pkg.company_name
        )
      );
    }

    /* DURATION */

    result = result.filter((pkg) =>
      matchesDuration(
        pkg.duration_days,
        selectedDurations
      )
    );

    /* PRICE */

    result = result.filter((pkg) =>
      matchesPrice(
        pkg,
        selectedPrices
      )
    );

    /* SORT */

    if (sortBy === 'price-low') {
      result.sort(
        (a, b) =>
          getPrice(a) -
          getPrice(b)
      );
    }

    if (sortBy === 'price-high') {
      result.sort(
        (a, b) =>
          getPrice(b) -
          getPrice(a)
      );
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
        (a.title || '').localeCompare(
          b.title || ''
        )
      );
    }

    return result;
  }, [
    packages,
    search,
    selectedCountries,
    selectedCities,
    selectedCompanies,
    selectedDurations,
    selectedPrices,
    sortBy,
  ]);

  /* =========================================================
     CLEAR ALL
  ========================================================= */

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCountries([]);
    setSelectedCities([]);
    setSelectedCompanies([]);
    setSelectedDurations([]);
    setSelectedPrices([]);
  };

  const hasActiveFilters =
    search ||
    selectedCountries.length > 0 ||
    selectedCities.length > 0 ||
    selectedCompanies.length > 0 ||
    selectedDurations.length > 0 ||
    selectedPrices.length > 0;

  /* =========================================================
     TOGGLE SECTION
  ========================================================= */

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9F8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-[#00AA88] rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-600">
            Loading tour packages...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F9F8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="bg-[#00AA88] text-white px-5 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     FILTER SIDEBAR
  ========================================================= */

  const FilterSidebar = () => (
    <aside className="bg-white border border-gray-200 rounded-xl">

      {/* FILTER HEADER */}

      <div className="p-5 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Filters
        </h2>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm font-semibold text-[#008F73] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="px-5">

        {/* COUNTRY */}

        {countries.length > 0 && (
          <FilterSection
            title="Destination country"
            open={openSections.country}
            onToggle={() =>
              toggleSection('country')
            }
          >
            <div className="space-y-1">
              {countries.map((country) => (
                <FilterCheckbox
                  key={country}
                  label={country}
                  checked={selectedCountries.includes(
                    country
                  )}
                  onChange={() =>
                    toggleFilter(
                      country,
                      selectedCountries,
                      setSelectedCountries
                    )
                  }
                />
              ))}
            </div>
          </FilterSection>
        )}

        {/* CITY */}

        {cities.length > 0 && (
          <FilterSection
            title="Destination city"
            open={openSections.city}
            onToggle={() =>
              toggleSection('city')
            }
          >
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {cities.map((city) => (
                <FilterCheckbox
                  key={city}
                  label={city}
                  checked={selectedCities.includes(
                    city
                  )}
                  onChange={() =>
                    toggleFilter(
                      city,
                      selectedCities,
                      setSelectedCities
                    )
                  }
                />
              ))}
            </div>
          </FilterSection>
        )}

        {/* COMPANY */}

        {companies.length > 0 && (
          <FilterSection
            title="Travel company"
            open={openSections.company}
            onToggle={() =>
              toggleSection('company')
            }
          >
            <div className="space-y-1">
              {companies.map((company) => (
                <FilterCheckbox
                  key={company}
                  label={company}
                  checked={selectedCompanies.includes(
                    company
                  )}
                  onChange={() =>
                    toggleFilter(
                      company,
                      selectedCompanies,
                      setSelectedCompanies
                    )
                  }
                />
              ))}
            </div>
          </FilterSection>
        )}

        {/* DURATION */}

        <FilterSection
          title="Duration"
          open={openSections.duration}
          onToggle={() =>
            toggleSection('duration')
          }
        >
          <div className="space-y-1">

            <FilterCheckbox
              label="1–3 days"
              checked={selectedDurations.includes(
                '1-3'
              )}
              onChange={() =>
                toggleFilter(
                  '1-3',
                  selectedDurations,
                  setSelectedDurations
                )
              }
            />

            <FilterCheckbox
              label="4–7 days"
              checked={selectedDurations.includes(
                '4-7'
              )}
              onChange={() =>
                toggleFilter(
                  '4-7',
                  selectedDurations,
                  setSelectedDurations
                )
              }
            />

            <FilterCheckbox
              label="8–14 days"
              checked={selectedDurations.includes(
                '8-14'
              )}
              onChange={() =>
                toggleFilter(
                  '8-14',
                  selectedDurations,
                  setSelectedDurations
                )
              }
            />

            <FilterCheckbox
              label="15+ days"
              checked={selectedDurations.includes(
                '15+'
              )}
              onChange={() =>
                toggleFilter(
                  '15+',
                  selectedDurations,
                  setSelectedDurations
                )
              }
            />

          </div>
        </FilterSection>

        {/* PRICE */}

        <FilterSection
          title="Price per person"
          open={openSections.price}
          onToggle={() =>
            toggleSection('price')
          }
        >
          <div className="space-y-1">

            <FilterCheckbox
              label="Under $500"
              checked={selectedPrices.includes(
                'under500'
              )}
              onChange={() =>
                toggleFilter(
                  'under500',
                  selectedPrices,
                  setSelectedPrices
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
                  '500-1000',
                  selectedPrices,
                  setSelectedPrices
                )
              }
            />

            <FilterCheckbox
              label="$1,000 – $2,000"
              checked={selectedPrices.includes(
                '1000-2000'
              )}
              onChange={() =>
                toggleFilter(
                  '1000-2000',
                  selectedPrices,
                  setSelectedPrices
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
                  '2000+',
                  selectedPrices,
                  setSelectedPrices
                )
              }
            />

          </div>
        </FilterSection>

      </div>
    </aside>
  );

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#F7F9F8]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="bg-white border-b border-gray-200">

        <div className="max-w-7xl mx-auto px-4 py-7">

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">

            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Tour & Travel Packages
              </h1>

              <p className="text-gray-500 mt-2 max-w-2xl">
                Discover carefully selected travel packages,
                compare destinations, and find the perfect
                trip for your next adventure.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              <span className="font-semibold text-gray-800">
                {filteredPackages.length}
              </span>{' '}
              packages
            </div>

          </div>

          {/* SEARCH */}

          <div className="mt-6 relative">

            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
              />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search destinations, packages, companies..."
              className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#00AA88]/20 focus:border-[#00AA88] transition"
            />

          </div>

        </div>
      </div>

      {/* =====================================================
          MOBILE FILTER BUTTON
      ===================================================== */}

      <div className="lg:hidden max-w-7xl mx-auto px-4 pt-5">

        <button
          onClick={() =>
            setMobileFiltersOpen(true)
          }
          className="w-full bg-[#00AA88] text-white py-3 rounded-xl font-semibold"
        >
          Filters
          {hasActiveFilters
            ? ' • Active'
            : ''}
        </button>

      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="max-w-7xl mx-auto px-4 py-6">

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-7">

          {/* DESKTOP SIDEBAR */}

          <div className="hidden lg:block">
            <FilterSidebar />
          </div>

          {/* =================================================
              RESULTS
          ================================================= */}

          <main>

            {/* RESULTS HEADER */}

            <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-5">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div>
                  <p className="text-sm text-gray-500">
                    Showing
                  </p>

                  <p className="font-bold text-gray-900">
                    {filteredPackages.length}{' '}
                    travel packages
                  </p>
                </div>

                <div className="flex items-center gap-3">

                  <span className="text-sm text-gray-500">
                    Sort by
                  </span>

                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value)
                    }
                    className="bg-[#E8F7F3] border border-[#B9E9DF] text-[#007F69] font-semibold rounded-lg px-4 py-2.5 text-sm outline-none cursor-pointer"
                  >
                    <option value="recommended">
                      Recommended
                    </option>

                    <option value="rating">
                      Highest rated
                    </option>

                    <option value="price-low">
                      Price: Low to High
                    </option>

                    <option value="price-high">
                      Price: High to Low
                    </option>

                    <option value="duration-short">
                      Shortest duration
                    </option>

                    <option value="duration-long">
                      Longest duration
                    </option>

                    <option value="name">
                      Package name
                    </option>
                  </select>

                </div>

              </div>

            </div>

            {/* =================================================
                ACTIVE FILTERS
            ================================================= */}

            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-5">

                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="bg-[#E8F7F3] text-[#007F69] px-3 py-1.5 rounded-full text-xs font-medium"
                  >
                    Search: {search} ×
                  </button>
                )}

                {selectedCountries.map(
                  (country) => (
                    <button
                      key={country}
                      onClick={() =>
                        toggleFilter(
                          country,
                          selectedCountries,
                          setSelectedCountries
                        )
                      }
                      className="bg-[#E8F7F3] text-[#007F69] px-3 py-1.5 rounded-full text-xs font-medium"
                    >
                      {country} ×
                    </button>
                  )
                )}

                {selectedCities.map(
                  (city) => (
                    <button
                      key={city}
                      onClick={() =>
                        toggleFilter(
                          city,
                          selectedCities,
                          setSelectedCities
                        )
                      }
                      className="bg-[#E8F7F3] text-[#007F69] px-3 py-1.5 rounded-full text-xs font-medium"
                    >
                      {city} ×
                    </button>
                  )
                )}

                {selectedCompanies.map(
                  (company) => (
                    <button
                      key={company}
                      onClick={() =>
                        toggleFilter(
                          company,
                          selectedCompanies,
                          setSelectedCompanies
                        )
                      }
                      className="bg-[#E8F7F3] text-[#007F69] px-3 py-1.5 rounded-full text-xs font-medium"
                    >
                      {company} ×
                    </button>
                  )
                )}

                {selectedDurations.map(
                  (duration) => (
                    <button
                      key={duration}
                      onClick={() =>
                        toggleFilter(
                          duration,
                          selectedDurations,
                          setSelectedDurations
                        )
                      }
                      className="bg-[#E8F7F3] text-[#007F69] px-3 py-1.5 rounded-full text-xs font-medium"
                    >
                      {duration} days ×
                    </button>
                  )
                )}

                {selectedPrices.map(
                  (price) => (
                    <button
                      key={price}
                      onClick={() =>
                        toggleFilter(
                          price,
                          selectedPrices,
                          setSelectedPrices
                        )
                      }
                      className="bg-[#E8F7F3] text-[#007F69] px-3 py-1.5 rounded-full text-xs font-medium"
                    >
                      {price === 'under500'
                        ? 'Under $500'
                        : price === '500-1000'
                        ? '$500–$1,000'
                        : price === '1000-2000'
                        ? '$1,000–$2,000'
                        : '$2,000+'}{' '}
                      ×
                    </button>
                  )
                )}

              </div>
            )}

            {/* =================================================
                PACKAGE CARDS
            ================================================= */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

              {filteredPackages.map((pkg) => (

                <Link
                  key={pkg.package_id}
                  to={`/packages/${pkg.package_id}`}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300"
                >

                  {/* IMAGE */}

                  <div className="relative">

                    {pkg.image_url ? (
                      <img
                        src={pkg.image_url}
                        alt={pkg.title}
                        className="h-56 w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-56 w-full bg-gray-100 flex items-center justify-center text-gray-400">
                        No image available
                      </div>
                    )}

                    {/* DURATION BADGE */}

                    {pkg.duration_days && (
                      <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                        {pkg.duration_days} days
                      </span>
                    )}

                  </div>

                  {/* CONTENT */}

                  <div className="p-5">

                    {/* DESTINATION */}

                    <p className="text-xs uppercase tracking-wide font-semibold text-[#008F73] mb-1">
                      {pkg.destination_city}
                      {pkg.destination_country
                        ? `, ${pkg.destination_country}`
                        : ''}
                    </p>

                    {/* TITLE */}

                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#008F73] transition">
                      {pkg.title}
                    </h2>

                    {/* RATING */}

                    <RatingBubbles
                      rating={pkg.rating}
                      reviewCount={pkg.review_count}
                    />

                    {/* COMPANY */}

                    {pkg.company_name && (
                      <p className="text-sm text-gray-500 mt-2">
                        Organized by{' '}
                        <span className="font-semibold text-gray-700">
                          {pkg.company_name}
                        </span>
                      </p>
                    )}

                    {/* DESCRIPTION */}

                    <p className="text-sm text-gray-600 line-clamp-2 mt-3 leading-relaxed">
                      {pkg.description ||
                        'Explore this amazing travel package and discover unforgettable experiences.'}
                    </p>

                    {/* BOTTOM */}

                    <div className="border-t border-gray-100 mt-5 pt-4 flex items-end justify-between gap-4">

                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          From
                        </p>

                        <p className="text-xl font-bold text-[#008F73]">
                          {pkg.base_price
                            ? `$${Number(
                                pkg.base_price
                              ).toLocaleString()}`
                            : 'Contact for pricing'}
                        </p>

                        {pkg.base_price && (
                          <p className="text-xs text-gray-400">
                            per person
                          </p>
                        )}
                      </div>

                      <span className="bg-[#00AA88] text-white px-5 py-2.5 rounded-lg text-sm font-semibold group-hover:bg-[#008F73] transition">
                        View Package
                      </span>

                    </div>

                  </div>

                </Link>

              ))}

            </div>

            {/* =================================================
                NO RESULTS
            ================================================= */}

            {filteredPackages.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">

                <div className="text-4xl mb-4">
                  🔎
                </div>

                <h3 className="text-xl font-bold text-gray-800">
                  No packages found
                </h3>

                <p className="text-gray-500 mt-2 mb-5">
                  Try changing your search or filters.
                </p>

                <button
                  onClick={clearAllFilters}
                  className="bg-[#00AA88] text-white px-5 py-2.5 rounded-lg font-semibold"
                >
                  Clear filters
                </button>

              </div>
            )}

          </main>

        </div>

      </div>

      {/* =====================================================
          MOBILE FILTER DRAWER
      ===================================================== */}

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">

          {/* BACKDROP */}

          <div
            className="absolute inset-0 bg-black/40"
            onClick={() =>
              setMobileFiltersOpen(false)
            }
          />

          {/* DRAWER */}

          <div className="absolute right-0 top-0 bottom-0 w-[88%] max-w-md bg-[#F7F9F8] overflow-y-auto">

            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">

              <h2 className="text-lg font-bold">
                Filters
              </h2>

              <button
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="text-gray-500 text-2xl"
              >
                ×
              </button>

            </div>

            <div className="p-4">
              <FilterSidebar />
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">

              <button
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="w-full bg-[#00AA88] text-white py-3 rounded-xl font-bold"
              >
                Show {filteredPackages.length}{' '}
                packages
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
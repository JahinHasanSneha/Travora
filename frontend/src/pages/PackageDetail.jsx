
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import PackageReviewsSection from '../components/PackageReviewsSection';

/* =========================================================
   TRIPADVISOR-STYLE 5 CIRCLE RATING (MATCHES PACKAGES.JSX)
========================================================= */
function RatingBubbles({ rating, reviewCount }) {
  const numericRating = Number(rating) || 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-[3px]">
        {[1, 2, 3, 4, 5].map((bubble) => {
          const fillPercentage = Math.max(
            0,
            Math.min(100, (numericRating - (bubble - 1)) * 100)
          );

          return (
            <span
              key={bubble}
              className="relative block w-[16px] h-[16px] rounded-full bg-[#E0E0E0] overflow-hidden"
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
        <span className="text-sm font-semibold text-gray-800">
          {numericRating.toFixed(1)}
        </span>
      )}

      {reviewCount !== undefined && reviewCount !== null && Number(reviewCount) > 0 && (
        <span className="text-sm text-gray-500">
          ({Number(reviewCount).toLocaleString()} reviews)
        </span>
      )}
    </div>
  );
}

/* =========================================================
   MAIN PACKAGE DETAIL COMPONENT
========================================================= */
export default function PackageDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [travelers, setTravelers] = useState(1);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState(null);
  const [alreadyBooked, setAlreadyBooked] = useState(false);

  useEffect(() => {
    client
      .get(`/packages/${id}`)
      .then(({ data }) => {
        setPkg(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load package details:', err);
        setLoading(false);
      });
  }, [id]);

  // Check whether the logged-in traveler already has a (non-cancelled) booking for this package,
  // so the booking box can show "Booked" instead of letting them book it again.
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
          (b) => String(b.package_id) === String(id) && b.booking_status !== 'cancelled'
        );
        setAlreadyBooked(hasBooking);
      })
      .catch(() => setAlreadyBooked(false));
  }, [user, id]);

  const book = async () => {
    if (!user) return navigate('/login');
    if (alreadyBooked) return;
    setBooking(true);
    setMessage(null);
    try {
      const { data } = await client.post('/bookings', {
        booking_type: 'package',
        package_id: pkg.package_id,
        number_of_travelers: travelers,
      });
      setAlreadyBooked(true);
      navigate(`/checkout/${data.booking_id}`);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Booking failed.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9F8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-[#00AA88] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading package details…</p>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-[#F7F9F8] flex items-center justify-center">
        <p className="text-gray-600">Package not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F8] pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* DESTINATION BREADCRUMB / LOCATION */}
        <p className="text-xs uppercase tracking-wide font-semibold text-[#008F73] mb-2">
          {pkg.destination_city}
          {pkg.destination_country ? `, ${pkg.destination_country}` : ''}
        </p>

        {/* TITLE */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
          {pkg.title}
        </h1>

        {/* RATING */}
        <div className="mb-6">
          <RatingBubbles rating={pkg.rating} reviewCount={pkg.review_count} />
        </div>

        {/* LARGE PICTURE */}
        <div className="w-full h-[350px] md:h-[480px] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 mb-8 shadow-sm">
          {pkg.image_url ? (
            <img
              src={pkg.image_url}
              alt={pkg.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No photo available
            </div>
          )}
        </div>

        {/* MAIN LAYOUT: LEFT DETAILS, RIGHT BOOKING BOX */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          
          {/* LEFT COLUMN */}
          <div className="space-y-8">
            
            {/* OVERVIEW */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About this package</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {pkg.description || 'Explore this amazing package and enjoy an unforgettable journey.'}
              </p>

              {/* HIGHLIGHTS / INFO GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Duration</p>
                  <p className="font-semibold text-gray-900">{pkg.duration_days} days</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Base price</p>
                  <p className="font-semibold text-gray-900">${Number(pkg.base_price).toLocaleString()} / person</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Slots available</p>
                  <p className="font-semibold text-gray-900">{pkg.slots_available}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Operator</p>
                  <p className="font-semibold text-gray-900">{pkg.company_name || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* INCLUSIONS & EXCLUSIONS */}
            {((pkg.inclusions && pkg.inclusions.length > 0) || (pkg.exclusions && pkg.exclusions.length > 0)) && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">What's Included</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {pkg.inclusions?.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide font-bold text-[#008F73] mb-2">
                        Included
                      </p>
                      <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                        {pkg.inclusions.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {pkg.exclusions?.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide font-bold text-red-600 mb-2">
                        Not Included
                      </p>
                      <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                        {pkg.exclusions.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* REVIEWS SECTION */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <PackageReviewsSection
                packageId={pkg.package_id}
                onReviewAdded={() => client.get(`/packages/${id}`).then(({ data }) => setPkg(data)).catch(() => {})}
              />
            </div>

          </div>

          {/* RIGHT COLUMN: BOOKING BOX */}
          <div className="lg:sticky lg:top-6 h-fit space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <p className="text-xs text-gray-500">From</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold text-[#008F73]">
                  ${Number(pkg.base_price).toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">/ person</span>
              </div>

              {/* TRAVELERS COUNTER */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Number of travelers
                </label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(Number(pkg.slots_available) || 0, 1)}
                  value={travelers}
                  onChange={(e) => setTravelers(Math.min(Math.max(1, Number(e.target.value)), Math.max(Number(pkg.slots_available) || 1, 1)))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#00AA88]/20 focus:border-[#00AA88]"
                />
              </div>

              {/* TOTAL PRICE */}
              <div className="border-t border-gray-100 pt-4 mb-6 flex justify-between items-center">
                <span className="text-sm text-gray-600 font-medium">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${(Number(pkg.base_price || 0) * travelers).toLocaleString()}
                </span>
              </div>

              {/* BOOK BUTTON */}
              <button
                onClick={book}
                disabled={booking || alreadyBooked || pkg.slots_available < 1}
                className={`w-full font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 ${
                  alreadyBooked
                    ? 'bg-[#E8F7F3] text-[#008F73] border border-[#00AA88] cursor-default'
                    : 'bg-[#00AA88] hover:bg-[#008F73] text-white'
                }`}
              >
                {alreadyBooked
                  ? 'Booked'
                  : pkg.slots_available < 1
                  ? 'Fully Booked'
                  : booking
                  ? 'Booking…'
                  : 'Book Now'}
              </button>

              {pkg.slots_available < 1 && !alreadyBooked && (
                <p className="text-xs text-red-500 mt-3 text-center">
                  All slots are taken by confirmed bookings, so booking is closed.
                </p>
              )}

              {alreadyBooked && (
                <p className="text-xs text-[#008F73] mt-3 text-center">
                  You already have a booking for this package —{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/bookings')}
                    className="underline font-semibold"
                  >
                    view it in My Bookings
                  </button>
                  .
                </p>
              )}

              {message && (
                <p className="text-xs text-red-500 mt-3 text-center">{message}</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
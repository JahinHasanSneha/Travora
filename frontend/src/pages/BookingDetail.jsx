

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import { getBookingImage } from "../utils/bookingImage";

/* =========================================================
   ICONS
========================================================= */

const Icon = {
  back: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  ),
  users: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c.8-3.5 2.8-5.5 6-5.5s5.2 2 6 5.5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M18 14.8c1.7.8 2.7 2.4 3 5.2" />
    </svg>
  ),
  calendar: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 9h18" />
    </svg>
  ),
  card: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  ),
  map: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M9 3.5l6 2 6-2v14l-6 2-6-2-6 2v-14l6-2z" />
      <path d="M9 3.5v14M15 5.5v14" />
    </svg>
  ),
};

/* =========================================================
   STATUS
========================================================= */

const STATUS = {
  pending: {
    label: "Pending",
    text: "#92400E",
    background: "#FFF7E8",
    border: "#F4D59B",
    dot: "#F59E0B",
  },
  confirmed: {
    label: "Confirmed",
    text: "#087F73",
    background: "#EAF9F6",
    border: "#BCE7E0",
    dot: "#0E978E",
  },
  completed: {
    label: "Completed",
    text: "#176B43",
    background: "#ECF8F1",
    border: "#C6E8D4",
    dot: "#22A866",
  },
  cancelled: {
    label: "Cancelled",
    text: "#A61B3C",
    background: "#FFF0F3",
    border: "#F2C5D0",
    dot: "#E11D48",
  },
};

const getStatus = (value) =>
  STATUS[value] || {
    label: value || "Unknown",
    text: "#4B5563",
    background: "#F3F4F6",
    border: "#D1D5DB",
    dot: "#9CA3AF",
  };

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  /* ---------- load ---------- */
  const load = () => {
    setLoading(true);
    setError("");
    client
      .get(`/bookings/${id}`)
      .then(({ data }) => setBooking(data))
      .catch((err) => {
        setError(
          err.response?.data?.error || "We couldn't load this booking."
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ---------- cancel ---------- */
  const handleCancel = async () => {
    if (!window.confirm("Cancel this booking? This cannot be undone.")) return;
    setCancelling(true);
    try {
      await client.post(`/bookings/${id}/cancel`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Could not cancel this booking.");
    } finally {
      setCancelling(false);
    }
  };

  /* ---------- loading state ---------- */
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm text-gray-400">
        Loading booking…
      </div>
    );
  }

  /* ---------- error state ---------- */
  if (error || !booking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-red-600 mb-4">
          {error || "Booking not found."}
        </p>
        <Link
          to="/bookings"
          className="text-[#0E978E] font-semibold text-sm hover:underline"
        >
          &larr; Back to My Bookings
        </Link>
      </div>
    );
  }

  /* ---------- derived data ---------- */
  const status = getStatus(booking.booking_status);
  const isPackage = booking.booking_type === "package";
  const travelers = Number(booking.number_of_travelers || 1);
  const amount = Number(booking.total_amount || 0);
  const cancellable =
    ["pending", "confirmed"].includes(booking.booking_status) &&
    !(booking.booking_type === "custom_trip" && booking.is_organizer_booking);

  const city = isPackage
    ? booking.package_destination_city
    : booking.trip_destination_city;
  const country = isPackage
    ? booking.package_destination_country
    : booking.trip_destination_country;
  const duration = isPackage
    ? booking.package_duration_days
    : booking.trip_duration_days;
  const destination = [city, country].filter(Boolean).join(", ");

  const title =
    booking.title ||
    booking.package_title ||
    (isPackage ? "Travel Package Reservation" : "Custom Trip Plan");

  /* ---------------------------------------------------------
     IMAGE — resolved through the shared helper so the detail
     page always matches the image shown on the bookings list.
  --------------------------------------------------------- */
  const image = getBookingImage(booking);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* back */}
      <button
        type="button"
        onClick={() => navigate("/bookings")}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0E978E] hover:text-[#0A7F77] mb-5"
      >
        <Icon.back className="w-4 h-4" />
        Back to My Bookings
      </button>

      {/* card */}
      <div className="bg-white border border-[#E0E9E6] rounded-[14px] overflow-hidden">
        {/* ---------- hero image ---------- */}
        <div className="relative h-[220px] w-full">
          <img
            src={image}
            alt={isPackage ? "Travel package" : "Custom trip"}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/images/backgrounds/travel1.jpeg";
            }}
          />

          {/* gradient overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          {/* type pill */}
          <div className="absolute top-4 left-4 px-2.5 py-1 rounded-[6px] bg-white/95 backdrop-blur text-[10px] font-bold text-[#173C33]">
            {isPackage ? "PACKAGE" : "CUSTOM TRIP"}
          </div>

          {/* title overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-white drop-shadow">
            <p className="text-[12px] font-bold opacity-90">
              Booking #{booking.booking_id}
            </p>
            <h1 className="text-2xl font-bold leading-tight mt-0.5">
              {title}
            </h1>
          </div>
        </div>

        {/* ---------- body ---------- */}
        <div className="p-6">
          {/* status + price row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: status.dot }}
              />
              <span
                className="text-[12px] font-bold px-2.5 py-1 rounded-[6px] border"
                style={{
                  color: status.text,
                  backgroundColor: status.background,
                  borderColor: status.border,
                }}
              >
                {status.label}
              </span>
              <span className="text-[12px] text-gray-400">
                &middot; Payment: {booking.payment_status || "unpaid"}
              </span>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide font-bold text-[#87948F]">
                Total
              </p>
              <p className="text-2xl font-bold text-[#17332B]">
                ${amount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* destination + description */}
          {destination && (
            <p className="text-sm text-gray-600 mb-1 flex items-center gap-1.5">
              <Icon.map className="w-4 h-4 text-[#0E978E] shrink-0" />
              {destination}
              {duration
                ? ` · ${duration} day${duration !== 1 ? "s" : ""}`
                : ""}
            </p>
          )}

          {isPackage && booking.package_company_name && (
            <p className="text-[12px] text-gray-400 mb-4">
              Operated by {booking.package_company_name}
            </p>
          )}

          {booking.package_description && (
            <p className="text-sm text-gray-600 mt-3 mb-6 leading-relaxed">
              {booking.package_description}
            </p>
          )}

          {/* info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="flex items-center gap-2.5 rounded-[8px] bg-[#F7FAF9] px-3 py-2.5 border border-[#E2EBE8]">
              <Icon.users className="w-4 h-4 text-[#0E978E] shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-wide font-bold text-[#89958F]">
                  Travelers
                </p>
                <p className="text-[12px] font-bold text-[#344740]">
                  {travelers} traveler{travelers !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-[8px] bg-[#F7FAF9] px-3 py-2.5 border border-[#E2EBE8]">
              <Icon.calendar className="w-4 h-4 text-[#0E978E] shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-wide font-bold text-[#89958F]">
                  Booked
                </p>
                <p className="text-[12px] font-bold text-[#344740]">
                  {formatDate(booking.booked_at || booking.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-[8px] bg-[#F7FAF9] px-3 py-2.5 border border-[#E2EBE8]">
              <Icon.card className="w-4 h-4 text-[#0E978E] shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-wide font-bold text-[#89958F]">
                  Platform fee
                </p>
                <p className="text-[12px] font-bold text-[#344740]">
                  $
                  {Number(
                    booking.platform_commission || 0
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#EDF1F0]">
            {isPackage && booking.package_id && (
              <Link
                to={`/packages/${booking.package_id}`}
                className="h-[38px] px-4 rounded-[7px] border border-[#D8E4E0] text-[13px] font-bold text-[#17332B] inline-flex items-center hover:bg-[#F7FAF9] transition"
              >
                View package
              </Link>
            )}

            {!isPackage && booking.trip_id && (
              <Link
                to={`/trips/${booking.trip_id}`}
                className="h-[38px] px-4 rounded-[7px] border border-[#D8E4E0] text-[13px] font-bold text-[#17332B] inline-flex items-center hover:bg-[#F7FAF9] transition"
              >
                View trip
              </Link>
            )}

            {cancellable && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="h-[38px] px-4 rounded-[7px] border border-[#F0CDD5] bg-white text-[#A61B3C] text-[13px] font-bold hover:bg-[#FFF4F6] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? "Cancelling…" : "Cancel booking"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
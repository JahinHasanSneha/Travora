
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

/* =========================================================
   ICONS
========================================================= */

const Icon = {
  suitcase: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  ),

  plane: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M21 16v-2l-8-5V4.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.5V22l4-1 4 1v-1.5L13 19v-5.5l8 2.5z" />
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

  clock: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  ),

  check: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M5 12l4 4L19 6" />
    </svg>
  ),

  arrow: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  ),

  compass: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <circle cx="12" cy="12" r="9.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </svg>
  ),

  refresh: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10" />
      <path d="M3 5v5h5" />
      <path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14" />
      <path d="M21 19v-5h-5" />
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
   FILTERS
========================================================= */

const FILTERS = [
  { value: "all", label: "All bookings" },
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

/* =========================================================
   MAIN PAGE
========================================================= */

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");

  /* =======================================================
     LOAD
  ======================================================= */

  const loadBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await client.get("/bookings/mine");

      const data = response?.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.bookings)
        ? data.bookings
        : [];

      setBookings(list);
    } catch (err) {
      console.error("Failed to load bookings:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load your bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  /* =======================================================
     CANCEL
  ======================================================= */

  const cancelBooking = async (bookingId) => {
    const ok = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!ok) return;

    try {
      await client.post(`/bookings/${bookingId}/cancel`);

      await loadBookings();
    } catch (err) {
      console.error("Cancellation failed:", err);

      alert(
        err?.response?.data?.message ||
          "Unable to cancel this booking."
      );
    }
  };

  /* =======================================================
     COUNTS
  ======================================================= */

  const counts = useMemo(() => {
    return {
      total: bookings.length,

      confirmed: bookings.filter(
        (b) => b.booking_status === "confirmed"
      ).length,

      pending: bookings.filter(
        (b) => b.booking_status === "pending"
      ).length,

      completed: bookings.filter(
        (b) => b.booking_status === "completed"
      ).length,
    };
  }, [bookings]);

  /* =======================================================
     FILTER + SORT
  ======================================================= */

  const displayedBookings = useMemo(() => {
    let list = [...bookings];

    if (filter !== "all") {
      list = list.filter(
        (booking) =>
          booking.booking_status === filter
      );
    }

    if (sort === "price_high") {
      list.sort(
        (a, b) =>
          Number(b.total_amount || 0) -
          Number(a.total_amount || 0)
      );
    }

    if (sort === "price_low") {
      list.sort(
        (a, b) =>
          Number(a.total_amount || 0) -
          Number(b.total_amount || 0)
      );
    }

    if (sort === "recent") {
      list.sort(
        (a, b) =>
          Number(b.booking_id || 0) -
          Number(a.booking_id || 0)
      );
    }

    return list;
  }, [bookings, filter, sort]);

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div
      className="min-h-screen bg-[#F7FAF9] text-[#17211E]"
      style={{
        fontFamily:
          "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ================================================
          HEADER BACKGROUND
      ================================================= */}

      <div className="bg-white border-b border-[#E4ECE9]">
        <main className="max-w-[1100px] mx-auto px-5 pt-6 pb-7">

          {/* Breadcrumb */}

          <div className="flex items-center gap-2 text-[12px] text-[#71817C] mb-5">
            <Link
              to="/"
              className="hover:text-[#0E978E]"
            >
              Home
            </Link>

            <span>›</span>

            <span className="text-[#42534D]">
              My Bookings
            </span>
          </div>

          {/* Title */}

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">

            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0E978E]">
                Your journeys
              </p>

              <h1 className="text-[32px] md:text-[36px] font-bold tracking-[-0.7px] text-[#10251F] mt-1">
                My Bookings
              </h1>

              <p className="text-[14px] md:text-[15px] text-[#667871] mt-1.5">
                Everything you've booked with Travora,
                all in one place.
              </p>
            </div>

            <Link
              to="/explore"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                h-[44px]
                px-5
                rounded-[9px]
                bg-[#0E978E]
                text-white
                text-[13px]
                font-bold
                hover:bg-[#0A7F77]
                transition
                shadow-[0_5px_15px_-7px_rgba(14,151,142,0.8)]
              "
            >
              <span className="text-[18px] leading-none">
                +
              </span>

              Plan a new trip
            </Link>
          </div>

          {/* ============================================
              SUMMARY
          ============================================ */}

          {!loading && bookings.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">

              <SummaryCard
                number={counts.total}
                label="Total bookings"
              />

              <SummaryCard
                number={counts.confirmed}
                label="Confirmed"
                active
              />

              <SummaryCard
                number={counts.pending}
                label="Pending"
              />

              <SummaryCard
                number={counts.completed}
                label="Completed"
              />

            </div>
          )}
        </main>
      </div>

      {/* ================================================
          CONTENT
      ================================================= */}

      <main className="max-w-[1100px] mx-auto px-5 py-6">

        {/* ERROR */}

        {error && (
          <div className="
            rounded-[10px]
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            mb-5
            flex
            items-center
            justify-between
            gap-4
          ">
            <div>
              <p className="text-[13px] font-bold text-red-700">
                Couldn't load bookings
              </p>

              <p className="text-[12px] text-red-600 mt-0.5">
                {error}
              </p>
            </div>

            <button
              onClick={loadBookings}
              className="
                flex
                items-center
                gap-1.5
                px-3
                py-1.5
                rounded-[7px]
                bg-white
                border
                border-red-200
                text-red-700
                text-[12px]
                font-bold
              "
            >
              <Icon.refresh className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <Loading />
        ) : bookings.length === 0 ? (
          <EmptyBookings />
        ) : (
          <>
            {/* ==========================================
                TOOLBAR
            ========================================== */}

            <div className="
              bg-white
              border
              border-[#E1EAE7]
              rounded-[11px]
              px-3
              py-2
              flex
              flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-3
              mb-4
            ">

              {/* Filters */}

              <div className="flex gap-1.5 overflow-x-auto">

                {FILTERS.map((item) => {
                  const active =
                    filter === item.value;

                  return (
                    <button
                      key={item.value}
                      onClick={() =>
                        setFilter(item.value)
                      }
                      className={`
                        px-3.5
                        h-[34px]
                        rounded-[7px]
                        text-[12px]
                        font-bold
                        whitespace-nowrap
                        transition
                        ${
                          active
                            ? "bg-[#0E978E] text-white"
                            : "text-[#52635D] hover:bg-[#F2F7F5]"
                        }
                      `}
                    >
                      {item.label}
                    </button>
                  );
                })}

              </div>

              {/* Sort */}

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] text-[#788781]">
                  Sort
                </span>

                <select
                  value={sort}
                  onChange={(e) =>
                    setSort(e.target.value)
                  }
                  className="
                    h-[34px]
                    px-2.5
                    rounded-[7px]
                    border
                    border-[#D9E4E0]
                    bg-white
                    text-[12px]
                    font-bold
                    text-[#33443E]
                    outline-none
                  "
                >
                  <option value="recent">
                    Most recent
                  </option>

                  <option value="price_high">
                    Price: high to low
                  </option>

                  <option value="price_low">
                    Price: low to high
                  </option>
                </select>
              </div>
            </div>

            {/* Result count */}

            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] text-[#71817C]">
                Showing{" "}
                <span className="font-bold text-[#33443E]">
                  {displayedBookings.length}
                </span>{" "}
                booking
                {displayedBookings.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>

            {/* ==========================================
                BOOKINGS
            ========================================== */}

            {displayedBookings.length === 0 ? (
              <div className="
                bg-white
                border
                border-[#E1EAE7]
                rounded-[12px]
                py-16
                text-center
              ">
                <div className="
                  w-12
                  h-12
                  mx-auto
                  rounded-full
                  bg-[#EDF7F5]
                  text-[#0E978E]
                  flex
                  items-center
                  justify-center
                  mb-3
                ">
                  <Icon.suitcase className="w-6 h-6" />
                </div>

                <p className="text-[15px] font-bold text-[#263832]">
                  No bookings here
                </p>

                <p className="text-[12px] text-[#74827D] mt-1">
                  Try selecting another booking status.
                </p>

                <button
                  onClick={() => setFilter("all")}
                  className="
                    mt-4
                    text-[12px]
                    font-bold
                    text-[#0E978E]
                    hover:underline
                  "
                >
                  View all bookings
                </button>
              </div>
            ) : (
              <div className="space-y-3">

                {displayedBookings.map(
                  (booking, index) => (
                    <BookingCard
                      key={booking.booking_id}
                      booking={booking}
                      imageIndex={index}
                      onCancel={cancelBooking}
                    />
                  )
                )}

              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  number,
  label,
  active = false,
}) {
  return (
    <div
      className="
        bg-white
        border
        rounded-[10px]
        px-4
        py-3
      "
      style={{
        borderColor: active
          ? "#B9E2DC"
          : "#E1EAE7",
      }}
    >
      <p className="text-[24px] font-bold text-[#17332B]">
        {number}
      </p>

      <p className="text-[11px] text-[#71817C] mt-0.5">
        {label}
      </p>

      {active && (
        <div className="w-5 h-[2px] bg-[#0E978E] mt-2 rounded-full" />
      )}
    </div>
  );
}

/* =========================================================
   BOOKING CARD
========================================================= */

function BookingCard({
  booking,
  imageIndex,
  onCancel,
}) {
  const status = getStatus(
    booking.booking_status
  );

  const isPackage =
    booking.booking_type === "package";

  const cancellable =
    [
      "pending",
      "confirmed",
    ].includes(booking.booking_status) &&
    !(
      booking.booking_type === "custom_trip" &&
      booking.is_organizer_booking
    );

  const travelers = Number(
    booking.number_of_travelers || 1
  );

  const amount = Number(
    booking.total_amount || 0
  );

  /*
    Use travel1.jpeg as the primary visual.
    Change these later if you have destination-specific
    images in your public folder.
  */

  const images = [
    "images/backgrounds/travel1.jpeg",
    "images/backgrounds/travel2.jpeg",
    "images/backgrounds/travel3.jpeg",
    "images/backgrounds/travel4.jpeg",
    "images/backgrounds/travel5.jpeg",
    "images/backgrounds/travel6.jpeg",
    "images/backgrounds/travel7.jpeg",
    "images/backgrounds/travel8.jpeg",
    "images/backgrounds/travel9.jpeg",
    "images/backgrounds/travel10.jpeg"
   
  ];

  const image =
    booking.image_url ||
    booking.package_image ||
    images[imageIndex % images.length];

  return (
    <article
      className="
        group
        bg-white
        border
        border-[#E0E9E6]
        rounded-[12px]
        overflow-hidden
        transition-all
        duration-200
        hover:border-[#BFDCD5]
        hover:shadow-[0_8px_28px_-18px_rgba(20,70,60,0.35)]
      "
    >
      <div className="flex flex-col md:flex-row">

        {/* =============================================
            IMAGE
        ============================================= */}

        <div className="
          relative
          w-full
          md:w-[225px]
          lg:w-[245px]
          h-[180px]
          md:h-auto
          min-h-[180px]
          shrink-0
          overflow-hidden
        ">
          <img
            src={image}
            alt={
              isPackage
                ? "Travel package"
                : "Custom trip"
            }
            className="
              absolute
              inset-0
              w-full
              h-full
              object-cover
              transition-transform
              duration-500
              group-hover:scale-[1.035]
            "
            onError={(e) => {
              e.currentTarget.src =
                "/travel1.jpeg";
            }}
          />

          {/* Image overlay */}

          <div className="
            absolute
            inset-0
            bg-gradient-to-t
            from-black/35
            via-transparent
            to-black/5
          " />

          {/* Booking type */}

          <div className="
            absolute
            top-3
            left-3
            px-2.5
            py-1
            rounded-[6px]
            bg-white/95
            backdrop-blur
            text-[10px]
            font-bold
            text-[#173C33]
          ">
            {isPackage
              ? "PACKAGE"
              : "CUSTOM TRIP"}
          </div>

          {/* ID */}

          <div className="
            absolute
            bottom-3
            left-3
            text-[11px]
            font-bold
            text-white
            drop-shadow
          ">
            Booking #{booking.booking_id}
          </div>
        </div>

        {/* =============================================
            INFORMATION
        ============================================= */}

        <div className="
          flex-1
          min-w-0
          p-4
          md:p-5
          flex
          flex-col
        ">

          {/* Top row */}

          <div className="
            flex
            flex-col
            sm:flex-row
            sm:items-start
            sm:justify-between
            gap-3
          ">

            <div className="min-w-0">

              <div className="flex items-center gap-2 mb-1.5">

                <span
                  className="
                    w-2
                    h-2
                    rounded-full
                    shrink-0
                  "
                  style={{
                    backgroundColor: status.dot,
                  }}
                />

                <span
                  className="
                    text-[11px]
                    font-bold
                  "
                  style={{
                    color: status.text,
                  }}
                >
                  {status.label}
                </span>

              </div>

              <h2 className="
                text-[18px]
                font-bold
                text-[#17332B]
                truncate
              ">
                {booking.title ||
                  booking.package_title ||
                  (isPackage
                    ? "Travel Package Reservation"
                    : "Custom Trip Plan")}
              </h2>

              <p className="
                text-[12px]
                text-[#788781]
                mt-1
              ">
                {(() => {
                  const city = isPackage
                    ? booking.package_destination_city
                    : booking.trip_destination_city;
                  const country = isPackage
                    ? booking.package_destination_country
                    : booking.trip_destination_country;
                  const duration = isPackage
                    ? booking.package_duration_days
                    : booking.trip_duration_days;

                  const destination = [city, country]
                    .filter(Boolean)
                    .join(", ");

                  if (destination) {
                    return (
                      <>
                        {destination}
                        {duration
                          ? ` · ${duration} day${
                              duration !== 1 ? "s" : ""
                            }`
                          : ""}
                      </>
                    );
                  }

                  return isPackage
                    ? "Organized travel package"
                    : "Customized travel itinerary";
                })()}
              </p>

              {isPackage && booking.package_company_name && (
                <p className="
                  text-[11px]
                  text-[#9AA6A1]
                  mt-0.5
                ">
                  Operated by {booking.package_company_name}
                </p>
              )}

            </div>

            {/* PRICE */}

            <div className="
              sm:text-right
              shrink-0
            ">
              <p className="
                text-[10px]
                uppercase
                tracking-wide
                font-bold
                text-[#87948F]
              ">
                Total
              </p>

              <p className="
                text-[21px]
                font-bold
                text-[#17332B]
              ">
                ${amount.toLocaleString()}
              </p>
            </div>

          </div>

          {/* ===========================================
              META
          =========================================== */}

          <div className="
            grid
            grid-cols-1
            sm:grid-cols-3
            gap-2
            mt-5
          ">

            <InfoItem
              icon={Icon.users}
              label="Travelers"
              value={`${travelers} traveler${
                travelers !== 1 ? "s" : ""
              }`}
            />

            <InfoItem
              icon={Icon.calendar}
              label="Booked"
              value={formatDate(
                booking.booked_at ||
                  booking.created_at
              )}
            />

            <InfoItem
              icon={Icon.clock}
              label="Payment"
              value={
                booking.payment_status ||
                "Pending"
              }
            />

          </div>

          {/* ===========================================
              BOTTOM ACTION ROW
          =========================================== */}

          <div className="
            mt-5
            pt-3
            border-t
            border-[#EDF1F0]
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
          ">

            <div
              className="
                px-2.5
                py-1
                rounded-[6px]
                border
                text-[10px]
                font-bold
                capitalize
              "
              style={{
                color: status.text,
                backgroundColor:
                  status.background,
                borderColor: status.border,
              }}
            >
              {booking.payment_status ||
                "Payment pending"}
            </div>

            <div className="flex items-center gap-2">

              {cancellable && (
                <button
                  type="button"
                  onClick={() =>
                    onCancel(
                      booking.booking_id
                    )
                  }
                  className="
                    h-[34px]
                    px-3.5
                    rounded-[7px]
                    border
                    border-[#F0CDD5]
                    bg-white
                    text-[#A61B3C]
                    text-[11px]
                    font-bold
                    hover:bg-[#FFF4F6]
                    transition
                  "
                >
                  Cancel
                </button>
              )}

              <Link
                to={`/bookings/${booking.booking_id}`}
                className="
                  h-[34px]
                  px-3.5
                  rounded-[7px]
                  bg-[#0E978E]
                  text-white
                  text-[11px]
                  font-bold
                  inline-flex
                  items-center
                  gap-1.5
                  hover:bg-[#0A7F77]
                  transition
                "
              >
                View details

                <Icon.arrow className="w-3.5 h-3.5" />
              </Link>

            </div>
          </div>

        </div>
      </div>
    </article>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  icon: InfoIcon,
  label,
  value,
}) {
  return (
    <div className="
      flex
      items-center
      gap-2.5
      rounded-[8px]
      bg-[#F7FAF9]
      px-3
      py-2
    ">

      <div className="
        w-7
        h-7
        rounded-[6px]
        bg-white
        border
        border-[#E2EBE8]
        flex
        items-center
        justify-center
        text-[#0E978E]
        shrink-0
      ">
        <InfoIcon className="w-3.5 h-3.5" />
      </div>

      <div className="min-w-0">

        <p className="
          text-[9px]
          uppercase
          tracking-wide
          font-bold
          text-[#89958F]
        ">
          {label}
        </p>

        <p className="
          text-[11px]
          font-bold
          text-[#344740]
          capitalize
          truncate
        ">
          {value}
        </p>

      </div>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function Loading() {
  return (
    <div className="
      bg-white
      border
      border-[#E1EAE7]
      rounded-[12px]
      py-20
      text-center
    ">
      <div className="
        w-8
        h-8
        border-[3px]
        border-[#DCEDE9]
        border-t-[#0E978E]
        rounded-full
        animate-spin
        mx-auto
        mb-4
      " />

      <p className="
        text-[13px]
        font-semibold
        text-[#53655E]
      ">
        Loading your bookings...
      </p>

      <p className="
        text-[11px]
        text-[#89958F]
        mt-1
      ">
        Getting your trips ready.
      </p>
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyBookings() {
  return (
    <div className="
      bg-white
      border
      border-[#E1EAE7]
      rounded-[12px]
      py-20
      px-5
      text-center
    ">

      <div className="
        w-16
        h-16
        mx-auto
        rounded-full
        bg-[#EDF8F5]
        text-[#0E978E]
        flex
        items-center
        justify-center
        mb-5
      ">
        <Icon.compass className="w-8 h-8" />
      </div>

      <h2 className="
        text-[21px]
        font-bold
        text-[#17332B]
      ">
        Your journeys start here
      </h2>

      <p className="
        max-w-[430px]
        mx-auto
        text-[13px]
        leading-relaxed
        text-[#75837E]
        mt-2
      ">
        You haven't made any bookings yet.
        Explore destinations and find your next
        adventure with Travora.
      </p>

      <Link
        to="/explore"
        className="
          inline-flex
          items-center
          gap-2
          mt-6
          h-[42px]
          px-5
          rounded-[8px]
          bg-[#0E978E]
          text-white
          text-[12px]
          font-bold
          hover:bg-[#0A7F77]
          transition
        "
      >
        Explore destinations

        <Icon.arrow className="w-4 h-4" />
      </Link>

    </div>
  );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {
  if (!value) return "—";

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

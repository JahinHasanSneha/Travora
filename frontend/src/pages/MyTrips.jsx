
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";

export default function MyTrips() {
  const [trips, setTrips] = useState([]);
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);

  const load = () =>
    client.get("/trips/mine").then(({ data }) => setTrips(data));

  useEffect(() => {
    load();
  }, []);

  // Only draft trips (organizer only) can be deleted; the server enforces this too.
  const handleDelete = async (trip) => {
    if (
      !window.confirm(
        `Delete the draft trip "${trip.title}"? This can't be undone.`
      )
    )
      return;

    try {
      await client.delete(`/trips/${trip.trip_id}`);
      await load();
    } catch (error) {
      alert(
        error?.response?.data?.error || "Could not delete this trip."
      );
    }
  };

  return (
    <div
      className="min-h-screen px-4 sm:px-6 lg:px-8 py-6"
      style={{
        backgroundImage:
          "linear-gradient(rgba(240,253,250,0.78), rgba(240,253,250,0.78)), url(/images/backgrounds/land7.jpeg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="max-w-6xl mx-auto">

        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="flex flex-col items-center text-center mb-5">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-teal-100 text-teal-700 text-xs font-semibold tracking-wide shadow-sm mb-3">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            YOUR TRAVEL SPACE
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            My trips
          </h1>

          <p className="mt-1.5 text-slate-600 text-sm md:text-base max-w-xl">
            Plan your next adventure, organize your itineraries, and keep
            every journey in one place.
          </p>

          {/* =================================================
              ACTION BUTTONS
          ================================================== */}
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <Link
              to="/trips/discover"
              className="
                inline-flex items-center justify-center gap-2
                px-5 py-2.5
                bg-white/90
                border border-slate-200
                text-slate-700
                rounded-2xl
                text-sm font-semibold
                shadow-sm
                hover:shadow-md
                hover:border-teal-200
                hover:text-teal-700
                transition-all duration-200
              "
            >
              <span>◎</span>
              Discover
            </Link>

            <button
              onClick={() => setShowGenerate(true)}
              className="
                inline-flex items-center justify-center gap-2
                px-5 py-2.5
                bg-teal-50
                border border-teal-100
                text-teal-700
                rounded-2xl
                text-sm font-semibold
                shadow-sm
                hover:bg-teal-100
                hover:shadow-md
                transition-all duration-200
              "
            >
              <span>✨</span>
              Smart generate
            </button>

            <button
              onClick={() => setShowCreate(true)}
              className="
                inline-flex items-center justify-center gap-2
                px-5 py-2.5
                bg-teal-600
                text-white
                rounded-2xl
                text-sm font-semibold
                shadow-lg shadow-teal-600/20
                hover:bg-teal-700
                hover:-translate-y-0.5
                transition-all duration-200
              "
            >
              <span className="text-lg leading-none">+</span>
              New trip
            </button>
          </div>
        </div>

        {/* =====================================================
            CENTERED STATS
        ====================================================== */}
        {trips.length > 0 && (
          <div className="flex justify-center mb-6">
            <div
              className="
                inline-grid
                grid-cols-2
                md:grid-cols-4
                gap-0
                bg-white/80
                backdrop-blur-xl
                border border-white/80
                rounded-2xl
                shadow-lg
                shadow-slate-900/5
                overflow-hidden
              "
            >
              <StatCard
                icon="✈"
                label="Total trips"
                value={trips.length}
              />

              <StatCard
                icon="◎"
                label="Destinations"
                value={
                  new Set(
                    trips.map(
                      (t) =>
                        `${t.destination_city},${t.destination_country}`
                    )
                  ).size
                }
              />

              <StatCard
                icon="◷"
                label="Travel days"
                value={trips.reduce(
                  (sum, t) => sum + Number(t.duration_days || 0),
                  0
                )}
              />

              <StatCard
                icon="✓"
                label="Booked"
                value={
                  trips.filter(
                    (t) => t.status === "confirmed" || t.status === "completed"
                  ).length
                }
              />
            </div>
          </div>
        )}

        {/* =====================================================
            TRIPS SECTION
        ====================================================== */}
        <div
          className="
            bg-white/45
            backdrop-blur-xl
            border border-white/60
            rounded-[2rem]
            shadow-2xl
            shadow-slate-900/10
            p-4 sm:p-6
          "
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Your journeys
              </h2>

              <p className="text-sm text-slate-500 mt-0.5">
                {trips.length > 0
                  ? `${trips.length} adventure${
                      trips.length !== 1 ? "s" : ""
                    } planned`
                  : "Your saved adventures will appear here"}
              </p>
            </div>

            {trips.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                Active trips
              </div>
            )}
          </div>

          {/* =====================================================
              TRIP GRID
          ====================================================== */}
          {trips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {trips.map((t, index) => (
                <TripCard
                  key={t.trip_id}
                  trip={t}
                  index={index}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              onCreate={() => setShowCreate(true)}
              onGenerate={() => setShowGenerate(true)}
            />
          )}
        </div>

        {/* =====================================================
            MODALS
        ====================================================== */}

        {showCreate && (
          <CreateTripModal
            onClose={() => setShowCreate(false)}
            onCreated={(id) => navigate(`/trips/${id}`)}
          />
        )}

        {showGenerate && (
          <GenerateModal
            onClose={() => setShowGenerate(false)}
            onGenerated={(id) => navigate(`/trips/${id}`)}
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ icon, label, value }) {
  return (
    <div
      className="
        flex items-center gap-3
        px-5 py-3.5
        min-w-[145px]
        border-r border-slate-200/70
        last:border-r-0
      "
    >
      <div
        className="
          w-9 h-9
          rounded-xl
          bg-teal-50
          border border-teal-100
          flex items-center justify-center
          text-base
          text-teal-600
          flex-shrink-0
        "
      >
        {icon}
      </div>

      <div className="text-left">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="text-xl font-bold text-slate-900 leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   TRIP CARD
========================================================= */

function TripCard({ trip: t, index, onDelete }) {
  /*
   * Travel image distribution:
   *
   * Card 1  → travel1.jpeg
   * Card 2  → travel2.jpeg
   * ...
   * Card 10 → travel10.jpeg
   * Card 11 → travel1.jpeg
   */

  const travelImage =
    `/images/backgrounds/travel${(index % 10) + 1}.jpeg`;

  // Where this trip is in the flow: Draft -> Itinerary saved -> Booked
  const flowLabel =
    t.status === "completed"
      ? "Completed"
      : t.status === "confirmed"
      ? "Booked"
      : t.itinerary_saved_at
      ? "Itinerary saved"
      : "Draft";

  // Draft trips can be deleted by their organizer.
  const canDelete = t.role === "organizer" && t.status === "draft";

  return (
    <Link
      to={`/trips/${t.trip_id}`}
      className="
        group
        relative
        block
        overflow-hidden
        bg-white
        rounded-[1.5rem]
        border border-white/80
        shadow-md
        hover:shadow-2xl
        hover:-translate-y-1
        transition-all duration-300
      "
    >
      {/* =====================================================
          75% IMAGE
      ====================================================== */}
      <div className="relative h-[250px] overflow-hidden">

        <img
          src={travelImage}
          alt={t.destination_city}
          className="
            absolute inset-0
            w-full h-full
            object-cover
            transition-transform
            duration-700
            group-hover:scale-105
          "
        />

        {/* Bottom readability gradient */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-t
            from-black/75
            via-black/10
            to-transparent
          "
        />

        {/* Very subtle teal branding */}
        <div
          className="
            absolute inset-0
            bg-teal-900/5
            group-hover:bg-teal-900/10
            transition-colors duration-300
          "
        />

        {/* =================================================
            STATUS
        ================================================== */}
        <span
          className={`
            absolute
            top-4
            right-4
            px-3 py-1.5
            rounded-full
            text-[10px]
            font-bold
            uppercase
            tracking-wide
            backdrop-blur-md
            shadow-sm
            ${
              flowLabel === "Booked"
                ? "bg-white/90 text-blue-700"
                : flowLabel === "Completed"
                ? "bg-white/90 text-slate-700"
                : flowLabel === "Itinerary saved"
                ? "bg-white/90 text-teal-700"
                : "bg-white/90 text-amber-700"
            }
          `}
        >
          {flowLabel}
        </span>

        {/* =================================================
            DELETE (draft trips only)
        ================================================== */}
        {canDelete && (
          <button
            type="button"
            title="Delete draft trip"
            aria-label="Delete draft trip"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete?.(t);
            }}
            className="
              absolute
              top-4
              left-4
              px-3 py-1.5
              rounded-full
              text-[10px]
              font-bold
              uppercase
              tracking-wide
              bg-white/90
              text-red-600
              hover:bg-red-600
              hover:text-white
              backdrop-blur-md
              shadow-sm
              transition-colors
            "
          >
            Delete
          </button>
        )}

        {/* =================================================
            DESTINATION OVER IMAGE
        ================================================== */}
        <div className="absolute left-5 right-5 bottom-5 text-white">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
            Destination
          </p>

          <h3 className="text-2xl font-bold mt-1 leading-tight drop-shadow-lg">
            {t.destination_city}
          </h3>

          <p className="text-sm text-white/80 mt-0.5">
            {t.destination_country}
          </p>
        </div>
      </div>

      {/* =====================================================
          25% WHITE INFORMATION AREA
      ====================================================== */}
      <div className="h-[92px] px-5 py-4 bg-white">

        <div className="flex items-center justify-between gap-4 h-full">

          {/* Trip title */}
          <div className="min-w-0 flex-1">
            <h3
              className="
                text-base
                font-bold
                text-slate-900
                truncate
                group-hover:text-teal-700
                transition-colors
              "
            >
              {t.title}
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              View itinerary
            </p>
          </div>

          {/* =================================================
              DURATION + BUDGET
          ================================================== */}
          <div className="flex items-center gap-4 flex-shrink-0">

            {/* Duration */}
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
                Duration
              </p>

              <p className="text-sm font-bold text-slate-800">
                {t.duration_days} days
              </p>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-slate-200" />

            {/* Budget */}
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
                {t.itinerary_saved_at ? "Cost" : "Est. cost"}
              </p>

              <p className="text-sm font-bold text-teal-700">
                ${Number(t.total_cost_per_person).toLocaleString()}
                <span className="text-[9px] font-normal text-slate-400">
                  {" "}
                  / person
                </span>
              </p>
            </div>

            {/* Arrow */}
            <div
              className="
                w-8 h-8
                rounded-xl
                bg-teal-50
                text-teal-600
                flex items-center justify-center
                group-hover:bg-teal-600
                group-hover:text-white
                transition-all duration-300
              "
            >
              →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ onCreate, onGenerate }) {
  return (
    <div className="py-16 text-center">
      <div
        className="
          mx-auto
          w-24 h-24
          rounded-3xl
          bg-teal-50
          border border-teal-100
          flex items-center justify-center
          text-5xl
          shadow-sm
          mb-6
        "
      >
        ✈
      </div>

      <h3 className="text-2xl font-bold text-slate-900">
        Your next adventure starts here
      </h3>

      <p className="max-w-md mx-auto mt-2 text-sm leading-6 text-slate-500">
        Create your own trip or let Travora build a personalized
        itinerary for you.
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7">
        <button
          onClick={onCreate}
          className="
            px-6 py-3
            bg-teal-600
            text-white
            rounded-2xl
            text-sm font-semibold
            shadow-lg shadow-teal-600/20
            hover:bg-teal-700
            transition
          "
        >
          + Create a trip
        </button>

        <button
          onClick={onGenerate}
          className="
            px-6 py-3
            bg-white
            border border-slate-200
            text-slate-700
            rounded-2xl
            text-sm font-semibold
            hover:border-teal-200
            hover:text-teal-700
            transition
          "
        >
          ✨ Generate itinerary
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   CREATE TRIP MODAL
========================================================= */

function CreateTripModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    destination_city: "",
    destination_country: "",
    duration_days: 3,
    max_travelers: 1,
  });

  const update = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.value,
    }));

  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // No budget here: the cost is calculated from the itinerary you build.
      const { data } = await client.post("/trips", form);
      onCreated(data.trip_id);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not create the trip.");
    }
  };

  return (
    <Modal
      onClose={onClose}
      title="Plan a new trip"
      subtitle="Create your next adventure"
    >
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Trip title"
          placeholder="e.g. Weekend in Bali"
          value={form.title}
          onChange={update("title")}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="City"
            placeholder="Paris"
            value={form.destination_city}
            onChange={update("destination_city")}
            required
          />

          <Field
            label="Country"
            placeholder="France"
            value={form.destination_country}
            onChange={update("destination_country")}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Days"
            type="number"
            min={1}
            value={form.duration_days}
            onChange={update("duration_days")}
          />

          <Field
            label="Max travelers"
            type="number"
            min={1}
            value={form.max_travelers}
            onChange={update("max_travelers")}
          />
        </div>

        <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100">
          <p className="text-sm font-semibold text-slate-800">
            How it works
          </p>

          <p className="text-xs text-slate-500 mt-0.5">
            Build your itinerary, save it, then book your own trip. The cost per
            person is calculated automatically. After booking you can invite
            travelers or make the trip public.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="
            w-full
            py-3
            bg-teal-600
            text-white
            rounded-2xl
            hover:bg-teal-700
            transition
            font-semibold
            shadow-lg
            shadow-teal-600/20
          "
        >
          Create trip
        </button>
      </form>
    </Modal>
  );
}

/* =========================================================
   GENERATE MODAL
========================================================= */

function GenerateModal({ onClose, onGenerated }) {
  const [form, setForm] = useState({
    destination_city: "",
    destination_country: "",
    duration_days: 3,
    max_travelers: 1,
    preferences: "",
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.value,
    }));

  const generate = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const { data } = await client.post("/trips/generate", {
        ...form,
        preferences: form.preferences
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
      });

      setPreview(data);
    } catch (err) {
      alert(err?.response?.data?.error || "Could not generate an itinerary.");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      // Creates a DRAFT trip with this plan; the itinerary is saved later from the trip page.
      const { data } = await client.post("/trips/generate", {
        ...form,
        preferences: form.preferences
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        save: true,
      });

      onGenerated(data.saved_trip_id);
    } catch (err) {
      alert(err?.response?.data?.error || "Could not create the trip.");
    }
  };

  return (
    <Modal
      onClose={onClose}
      title="Smart itinerary"
      subtitle="Let Travora plan your adventure"
    >
      {!preview ? (
        <form onSubmit={generate} className="space-y-4">

          <div
            className="
              p-4
              rounded-2xl
              bg-gradient-to-r
              from-teal-50
              to-cyan-50
              border border-teal-100
            "
          >
            <div className="flex gap-3">
              <div
                className="
                  w-10 h-10
                  rounded-xl
                  bg-white
                  flex items-center justify-center
                  shadow-sm
                "
              >
                ✨
              </div>

              <div>
                <p className="text-sm font-semibold text-teal-800">
                  Personalized planning
                </p>

                <p className="text-xs text-teal-700/70 mt-1">
                  Tell us where you're going and what you enjoy.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="City"
              placeholder="Tokyo"
              value={form.destination_city}
              onChange={update("destination_city")}
              required
            />

            <Field
              label="Country"
              placeholder="Japan"
              value={form.destination_country}
              onChange={update("destination_country")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Duration"
              type="number"
              min={1}
              value={form.duration_days}
              onChange={update("duration_days")}
            />

            <Field
              label="Max travelers"
              type="number"
              min={1}
              value={form.max_travelers}
              onChange={update("max_travelers")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Preferences
            </label>

            <input
              placeholder="Food, museums, beaches, shopping..."
              value={form.preferences}
              onChange={update("preferences")}
              className="
                w-full
                border border-slate-200
                rounded-xl
                px-4 py-3
                bg-slate-50
                text-sm
                outline-none
                focus:bg-white
                focus:border-teal-500
                focus:ring-4
                focus:ring-teal-500/10
                transition
              "
            />

            <p className="text-[11px] text-slate-400 mt-1.5">
              Separate multiple preferences with commas.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              py-3
              bg-teal-600
              text-white
              rounded-2xl
              hover:bg-teal-700
              disabled:opacity-60
              transition
              font-semibold
              shadow-lg
              shadow-teal-600/20
            "
          >
            {loading
              ? "Creating your itinerary..."
              : "✨ Generate itinerary"}
          </button>
        </form>
      ) : (
        <div>

          {/* Preview Summary */}
          <div
            className="
              rounded-2xl
              bg-gradient-to-br
              from-teal-600
              to-cyan-700
              text-white
              p-5
              mb-5
            "
          >
            <p className="text-xs uppercase tracking-widest opacity-70 font-semibold">
              Calculated cost per person
            </p>

            <p className="text-3xl font-bold mt-1">
              ${preview.estimated_total_cost}
            </p>

            <p className="text-xs opacity-80 mt-1">
              Worked out from the hotel and activities in this plan. You can
              review it, then save the itinerary on the next screen.
            </p>

            {preview.hotel?.name && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-[10px] uppercase tracking-wide opacity-60">
                  Recommended hotel
                </p>

                <p className="font-semibold mt-1">
                  {preview.hotel.name}
                </p>
              </div>
            )}
          </div>

          {/* Days */}
          <div className="max-h-72 overflow-y-auto pr-1 space-y-3">
            {preview.days.map((d) => (
              <div
                key={d.day_number}
                className="
                  rounded-2xl
                  border border-slate-200
                  bg-slate-50
                  p-4
                "
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-teal-700 tracking-wide">
                    DAY {d.day_number}
                  </span>

                  <span className="text-xs font-semibold text-slate-500">
                    ${d.day_activity_cost}
                  </span>
                </div>

                <div className="space-y-2">
                  {d.items.map((it) => (
                    <div
                      key={it.ref_id + it.type}
                      className="
                        flex items-center justify-between
                        gap-3
                        bg-white
                        rounded-xl
                        px-3 py-2.5
                        border border-slate-100
                      "
                    >
                      <span className="text-xs text-slate-700">
                        {it.name}
                      </span>

                      <span className="text-xs font-semibold text-teal-600">
                        ${it.estimated_cost}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setPreview(null)}
              className="
                flex-1
                py-3
                border border-slate-200
                bg-white
                text-slate-700
                rounded-2xl
                hover:bg-slate-50
                transition
                text-sm
                font-semibold
              "
            >
              ← Adjust
            </button>

            <button
              onClick={save}
              className="
                flex-1
                py-3
                bg-teal-600
                text-white
                rounded-2xl
                hover:bg-teal-700
                transition
                text-sm
                font-semibold
                shadow-lg
                shadow-teal-600/20
              "
            >
              Create trip with this plan
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
  min,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>

      <input
        required={required}
        type={type}
        min={min}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="
          w-full
          border border-slate-200
          rounded-xl
          px-4 py-3
          bg-slate-50
          text-sm
          text-slate-800
          placeholder:text-slate-400
          outline-none
          focus:bg-white
          focus:border-teal-500
          focus:ring-4
          focus:ring-teal-500/10
          transition
        "
      />
    </div>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({ title, subtitle, children, onClose }) {
  return (
    <div
      className="
        fixed inset-0
        bg-slate-950/50
        backdrop-blur-md
        flex items-center justify-center
        z-[2000]
        p-4
      "
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
          bg-white
          rounded-[2rem]
          border border-white
          shadow-2xl
          w-full
          max-w-lg
          max-h-[90vh]
          overflow-hidden
        "
      >
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="
                    w-9 h-9
                    rounded-xl
                    bg-teal-50
                    text-teal-600
                    flex items-center justify-center
                  "
                >
                  ✈
                </div>

                <h2 className="text-xl font-bold text-slate-900">
                  {title}
                </h2>
              </div>

              {subtitle && (
                <p className="text-xs text-slate-500 mt-2 ml-11">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="
                w-9 h-9
                rounded-xl
                bg-slate-50
                text-slate-400
                hover:bg-slate-100
                hover:text-slate-700
                transition
                text-lg
              "
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 pb-6 max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}


// import { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import client from "../api/client";

// export default function MyTrips() {
//   const [trips, setTrips] = useState([]);
//   const navigate = useNavigate();
//   const [showCreate, setShowCreate] = useState(false);
//   const [showGenerate, setShowGenerate] = useState(false);

//   const load = () =>
//     client.get("/trips/mine").then(({ data }) => setTrips(data));

//   useEffect(() => {
//     load();
//   }, []);

//   return (
//     <div
//       className="min-h-screen px-4 sm:px-6 lg:px-8 py-8"
//       style={{
//         backgroundImage:
//           "linear-gradient(rgba(240,253,250,0.78), rgba(240,253,250,0.78)), url(/images/backgrounds/land7.jpeg)",
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//         backgroundAttachment: "fixed",
//         fontFamily: "'Inter', system-ui, sans-serif",
//       }}
//     >
//       {/* =====================================================
//           MAIN CONTAINER
//       ====================================================== */}
//       <div className="max-w-6xl mx-auto">

//         {/* =====================================================
//             HEADER
//         ====================================================== */}
//         <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
//           <div>
//             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-teal-100 text-teal-700 text-xs font-semibold tracking-wide shadow-sm mb-4">
//               <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
//               YOUR TRAVEL SPACE
//             </div>

//             <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
//               My trips
//             </h1>

//             <p className="mt-2 text-slate-600 text-base max-w-xl">
//               Plan your next adventure, organize your itineraries, and keep
//               every journey in one place.
//             </p>
//           </div>

//           {/* Header Actions */}
//           <div className="flex flex-wrap gap-3">
//             <Link
//               to="/trips/discover"
//               className="
//                 inline-flex items-center justify-center gap-2
//                 px-5 py-3
//                 bg-white/90
//                 border border-slate-200
//                 text-slate-700
//                 rounded-2xl
//                 text-sm font-semibold
//                 shadow-sm
//                 hover:shadow-md
//                 hover:border-teal-200
//                 hover:text-teal-700
//                 transition-all duration-200
//               "
//             >
//               <span className="text-base">◎</span>
//               Discover
//             </Link>

//             <button
//               onClick={() => setShowGenerate(true)}
//               className="
//                 inline-flex items-center justify-center gap-2
//                 px-5 py-3
//                 bg-teal-50
//                 border border-teal-100
//                 text-teal-700
//                 rounded-2xl
//                 text-sm font-semibold
//                 shadow-sm
//                 hover:bg-teal-100
//                 hover:shadow-md
//                 transition-all duration-200
//               "
//             >
//               <span>✨</span>
//               Smart generate
//             </button>

//             <button
//               onClick={() => setShowCreate(true)}
//               className="
//                 inline-flex items-center justify-center gap-2
//                 px-5 py-3
//                 bg-teal-600
//                 text-white
//                 rounded-2xl
//                 text-sm font-semibold
//                 shadow-lg shadow-teal-600/20
//                 hover:bg-teal-700
//                 hover:-translate-y-0.5
//                 transition-all duration-200
//               "
//             >
//               <span className="text-lg leading-none">+</span>
//               New trip
//             </button>
//           </div>
//         </div>

//         {/* =====================================================
//             STATS
//         ====================================================== */}
//         {trips.length > 0 && (
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
//             <StatCard
//               icon="✈"
//               label="Total trips"
//               value={trips.length}
//             />

//             <StatCard
//               icon="◎"
//               label="Destinations"
//               value={
//                 new Set(
//                   trips.map(
//                     (t) =>
//                       `${t.destination_city},${t.destination_country}`
//                   )
//                 ).size
//               }
//             />

//             <StatCard
//               icon="◷"
//               label="Travel days"
//               value={trips.reduce(
//                 (sum, t) => sum + Number(t.duration_days || 0),
//                 0
//               )}
//             />

//             <StatCard
//               icon="✓"
//               label="Published"
//               value={
//                 trips.filter((t) => t.status === "published").length
//               }
//             />
//           </div>
//         )}

//         {/* =====================================================
//             TRIPS SECTION
//         ====================================================== */}
//         <div
//           className="
//             bg-white/65
//             backdrop-blur-xl
//             border border-white/70
//             rounded-[2rem]
//             shadow-2xl
//             shadow-slate-900/10
//             p-5 sm:p-7
//           "
//         >
//           {/* Section Header */}
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h2 className="text-xl font-bold text-slate-900">
//                 Your journeys
//               </h2>

//               <p className="text-sm text-slate-500 mt-1">
//                 {trips.length > 0
//                   ? `${trips.length} adventure${
//                       trips.length !== 1 ? "s" : ""
//                     } planned`
//                   : "Your saved adventures will appear here"}
//               </p>
//             </div>

//             {trips.length > 0 && (
//               <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
//                 <span className="w-2 h-2 rounded-full bg-teal-500" />
//                 Active trips
//               </div>
//             )}
//           </div>

//           {/* =====================================================
//               TRIP GRID
//           ====================================================== */}
//           {trips.length > 0 ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
//               {trips.map((t, index) => (
//                 <TripCard
//                   key={t.trip_id}
//                   trip={t}
//                   index={index}
//                 />
//               ))}
//             </div>
//           ) : (
//             /* =====================================================
//                EMPTY STATE
//             ====================================================== */
//             <div className="py-16 text-center">
//               <div
//                 className="
//                   mx-auto
//                   w-24 h-24
//                   rounded-3xl
//                   bg-teal-50
//                   border border-teal-100
//                   flex items-center justify-center
//                   text-5xl
//                   shadow-sm
//                   mb-6
//                 "
//               >
//                 ✈
//               </div>

//               <h3 className="text-2xl font-bold text-slate-900">
//                 Your next adventure starts here
//               </h3>

//               <p className="max-w-md mx-auto mt-2 text-sm leading-6 text-slate-500">
//                 Create your own trip or let Travora build a personalized
//                 itinerary for you.
//               </p>

//               <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7">
//                 <button
//                   onClick={() => setShowCreate(true)}
//                   className="
//                     px-6 py-3
//                     bg-teal-600
//                     text-white
//                     rounded-2xl
//                     text-sm font-semibold
//                     shadow-lg shadow-teal-600/20
//                     hover:bg-teal-700
//                     transition
//                   "
//                 >
//                   + Create a trip
//                 </button>

//                 <button
//                   onClick={() => setShowGenerate(true)}
//                   className="
//                     px-6 py-3
//                     bg-white
//                     border border-slate-200
//                     text-slate-700
//                     rounded-2xl
//                     text-sm font-semibold
//                     hover:border-teal-200
//                     hover:text-teal-700
//                     transition
//                   "
//                 >
//                   ✨ Generate itinerary
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* =====================================================
//             MODALS
//         ====================================================== */}

//         {showCreate && (
//           <CreateTripModal
//             onClose={() => setShowCreate(false)}
//             onCreated={(id) => navigate(`/trips/${id}`)}
//           />
//         )}

//         {showGenerate && (
//           <GenerateModal
//             onClose={() => setShowGenerate(false)}
//             onGenerated={(id) => navigate(`/trips/${id}`)}
//           />
//         )}
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    STAT CARD
// ========================================================= */

// function StatCard({ icon, label, value }) {
//   return (
//     <div
//       className="
//         bg-white/75
//         backdrop-blur-xl
//         border border-white/70
//         rounded-2xl
//         p-4
//         shadow-sm
//         hover:shadow-md
//         transition
//       "
//     >
//       <div className="flex items-center gap-3">
//         <div
//           className="
//             w-10 h-10
//             rounded-xl
//             bg-teal-50
//             border border-teal-100
//             flex items-center justify-center
//             text-lg
//             text-teal-600
//           "
//         >
//           {icon}
//         </div>

//         <div>
//           <p className="text-xs font-medium text-slate-500">
//             {label}
//           </p>

//           <p className="text-xl font-bold text-slate-900">
//             {value}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    TRIP CARD
// ========================================================= */

// function TripCard({ trip: t, index }) {
//   /*
//    * Automatically distribute travel1.jpeg → travel10.jpeg
//    *
//    * Card 1  → travel1.jpeg
//    * Card 2  → travel2.jpeg
//    * ...
//    * Card 10 → travel10.jpeg
//    * Card 11 → travel1.jpeg
//    */
//   const travelImage =
//     `/images/backgrounds/travel${(index % 10) + 1}.jpeg`;

//   return (
//     <Link
//       to={`/trips/${t.trip_id}`}
//       className="
//         group
//         relative
//         block
//         overflow-hidden
//         bg-white
//         rounded-[1.5rem]
//         border border-slate-200/80
//         shadow-sm
//         hover:shadow-2xl
//         hover:-translate-y-1
//         transition-all duration-300
//       "
//     >
//       {/* =====================================================
//           IMAGE HERO
//       ====================================================== */}
//       <div className="relative h-44 overflow-hidden">
//         <img
//           src={travelImage}
//           alt={t.destination_city}
//           className="
//             absolute inset-0
//             w-full h-full
//             object-cover
//             transition-transform duration-700
//             group-hover:scale-105
//           "
//         />

//         {/* Dark gradient */}
//         <div
//           className="
//             absolute inset-0
//             bg-gradient-to-t
//             from-slate-950/85
//             via-slate-950/20
//             to-transparent
//           "
//         />

//         {/* Very subtle teal branding tint */}
//         <div
//           className="
//             absolute inset-0
//             bg-teal-900/5
//             group-hover:bg-teal-900/10
//             transition-colors duration-300
//           "
//         />

//         {/* =====================================================
//             STATUS BADGE
//         ====================================================== */}
//         <span
//           className={`
//             absolute
//             top-4
//             right-4
//             px-3 py-1.5
//             rounded-full
//             text-[10px]
//             font-bold
//             uppercase
//             tracking-wide
//             backdrop-blur-md
//             shadow-sm
//             ${
//               t.status === "published"
//                 ? "bg-white/90 text-teal-700"
//                 : t.status === "confirmed"
//                 ? "bg-white/90 text-blue-700"
//                 : t.status === "completed"
//                 ? "bg-white/90 text-slate-700"
//                 : "bg-white/90 text-amber-700"
//             }
//           `}
//         >
//           {t.status}
//         </span>

//         {/* =====================================================
//             DESTINATION
//         ====================================================== */}
//         <div className="absolute left-5 right-5 bottom-5 text-white">
//           <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
//             Destination
//           </p>

//           <h3 className="text-xl font-bold mt-1 leading-tight drop-shadow-sm">
//             {t.destination_city}
//           </h3>

//           <p className="text-xs text-white/75 mt-0.5">
//             {t.destination_country}
//           </p>
//         </div>
//       </div>

//       {/* =====================================================
//           CARD CONTENT
//       ====================================================== */}
//       <div className="p-5">
//         {/* Title + Arrow */}
//         <div className="flex items-start justify-between gap-3">
//           <h3
//             className="
//               text-lg
//               font-bold
//               text-slate-900
//               leading-snug
//               line-clamp-2
//               group-hover:text-teal-700
//               transition-colors
//             "
//           >
//             {t.title}
//           </h3>

//           <div
//             className="
//               flex-shrink-0
//               w-9 h-9
//               rounded-xl
//               bg-teal-50
//               text-teal-600
//               flex items-center justify-center
//               group-hover:bg-teal-600
//               group-hover:text-white
//               transition-all duration-300
//             "
//           >
//             →
//           </div>
//         </div>

//         {/* =====================================================
//             DETAILS
//         ====================================================== */}
//         <div className="grid grid-cols-2 gap-3 mt-5">
//           {/* Duration */}
//           <div
//             className="
//               rounded-xl
//               bg-slate-50
//               border border-slate-100
//               p-3
//               group-hover:border-teal-100
//               transition-colors
//             "
//           >
//             <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
//               Duration
//             </p>

//             <p className="text-sm font-bold text-slate-800 mt-1">
//               {t.duration_days} days
//             </p>
//           </div>

//           {/* Budget */}
//           <div
//             className="
//               rounded-xl
//               bg-slate-50
//               border border-slate-100
//               p-3
//               group-hover:border-teal-100
//               transition-colors
//             "
//           >
//             <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
//               Budget
//             </p>

//             <p className="text-sm font-bold text-slate-800 mt-1">
//               ${Number(t.total_cost_per_person).toLocaleString()}
//               <span className="text-[10px] font-normal text-slate-400">
//                 {" "}
//                 / person
//               </span>
//             </p>
//           </div>
//         </div>

//         {/* =====================================================
//             FOOTER
//         ====================================================== */}
//         <div
//           className="
//             flex items-center justify-between
//             mt-5 pt-4
//             border-t border-slate-100
//           "
//         >
//           <span className="text-xs text-slate-400">
//             View itinerary
//           </span>

//           <span
//             className="
//               text-teal-600
//               text-sm
//               font-semibold
//               group-hover:translate-x-1
//               transition-transform
//             "
//           >
//             Explore →
//           </span>
//         </div>
//       </div>
//     </Link>
//   );
// }

// /* =========================================================
//    CREATE TRIP MODAL
// ========================================================= */

// function CreateTripModal({ onClose, onCreated }) {
//   const [form, setForm] = useState({
//     title: "",
//     destination_city: "",
//     destination_country: "",
//     duration_days: 3,
//     budget: 1000,
//     max_travelers: 1,
//     is_public: false,
//   });

//   const update = (k) => (e) =>
//     setForm((f) => ({
//       ...f,
//       [k]: e.target.value,
//     }));

//   const submit = async (e) => {
//     e.preventDefault();

//     const { data } = await client.post("/trips", form);

//     onCreated(data.trip_id);
//   };

//   return (
//     <Modal
//       onClose={onClose}
//       title="Plan a new trip"
//       subtitle="Create your next adventure"
//     >
//       <form onSubmit={submit} className="space-y-4">
//         <Field
//           label="Trip title"
//           placeholder="e.g. Weekend in Bali"
//           value={form.title}
//           onChange={update("title")}
//           required
//         />

//         <div className="grid grid-cols-2 gap-3">
//           <Field
//             label="City"
//             placeholder="Paris"
//             value={form.destination_city}
//             onChange={update("destination_city")}
//             required
//           />

//           <Field
//             label="Country"
//             placeholder="France"
//             value={form.destination_country}
//             onChange={update("destination_country")}
//             required
//           />
//         </div>

//         <div className="grid grid-cols-3 gap-3">
//           <Field
//             label="Days"
//             type="number"
//             min={1}
//             value={form.duration_days}
//             onChange={update("duration_days")}
//           />

//           <Field
//             label="Budget ($)"
//             type="number"
//             min={0}
//             value={form.budget}
//             onChange={update("budget")}
//           />

//           <Field
//             label="Travelers"
//             type="number"
//             min={1}
//             value={form.max_travelers}
//             onChange={update("max_travelers")}
//           />
//         </div>

//         <label
//           className="
//             flex items-start gap-3
//             p-4
//             rounded-2xl
//             bg-teal-50/70
//             border border-teal-100
//             cursor-pointer
//           "
//         >
//           <input
//             type="checkbox"
//             checked={form.is_public}
//             onChange={(e) =>
//               setForm((f) => ({
//                 ...f,
//                 is_public: e.target.checked,
//               }))
//             }
//             className="
//               mt-0.5
//               rounded
//               border-gray-300
//               text-teal-600
//               focus:ring-teal-500
//             "
//           />

//           <div>
//             <p className="text-sm font-semibold text-slate-800">
//               Make this trip public
//             </p>

//             <p className="text-xs text-slate-500 mt-0.5">
//               Others can discover and join your trip.
//             </p>
//           </div>
//         </label>

//         <button
//           type="submit"
//           className="
//             w-full
//             py-3
//             bg-teal-600
//             text-white
//             rounded-2xl
//             hover:bg-teal-700
//             transition
//             font-semibold
//             shadow-lg
//             shadow-teal-600/20
//           "
//         >
//           Create trip
//         </button>
//       </form>
//     </Modal>
//   );
// }

// /* =========================================================
//    GENERATE MODAL
// ========================================================= */

// function GenerateModal({ onClose, onGenerated }) {
//   const [form, setForm] = useState({
//     destination_city: "",
//     destination_country: "",
//     duration_days: 3,
//     budget: 1000,
//     preferences: "",
//   });

//   const [preview, setPreview] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const update = (k) => (e) =>
//     setForm((f) => ({
//       ...f,
//       [k]: e.target.value,
//     }));

//   const generate = async (e) => {
//     e.preventDefault();

//     setLoading(true);

//     try {
//       const { data } = await client.post("/trips/generate", {
//         ...form,
//         preferences: form.preferences
//           .split(",")
//           .map((p) => p.trim())
//           .filter(Boolean),
//       });

//       setPreview(data);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const save = async () => {
//     const { data } = await client.post("/trips/generate", {
//       ...form,
//       preferences: form.preferences
//         .split(",")
//         .map((p) => p.trim())
//         .filter(Boolean),
//       save: true,
//     });

//     onGenerated(data.saved_trip_id);
//   };

//   return (
//     <Modal
//       onClose={onClose}
//       title="Smart itinerary"
//       subtitle="Let Travora plan your adventure"
//     >
//       {!preview ? (
//         <form onSubmit={generate} className="space-y-4">

//           {/* AI intro */}
//           <div
//             className="
//               p-4
//               rounded-2xl
//               bg-gradient-to-r
//               from-teal-50
//               to-cyan-50
//               border border-teal-100
//             "
//           >
//             <div className="flex gap-3">
//               <div
//                 className="
//                   w-10 h-10
//                   rounded-xl
//                   bg-white
//                   flex items-center justify-center
//                   shadow-sm
//                 "
//               >
//                 ✨
//               </div>

//               <div>
//                 <p className="text-sm font-semibold text-teal-800">
//                   Personalized planning
//                 </p>

//                 <p className="text-xs text-teal-700/70 mt-1">
//                   Tell us where you're going and what you enjoy.
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-3">
//             <Field
//               label="City"
//               placeholder="Tokyo"
//               value={form.destination_city}
//               onChange={update("destination_city")}
//               required
//             />

//             <Field
//               label="Country"
//               placeholder="Japan"
//               value={form.destination_country}
//               onChange={update("destination_country")}
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-3">
//             <Field
//               label="Duration"
//               type="number"
//               min={1}
//               value={form.duration_days}
//               onChange={update("duration_days")}
//             />

//             <Field
//               label="Budget ($)"
//               type="number"
//               min={0}
//               value={form.budget}
//               onChange={update("budget")}
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-semibold text-slate-600 mb-1.5">
//               Preferences
//             </label>

//             <input
//               placeholder="Food, museums, beaches, shopping..."
//               value={form.preferences}
//               onChange={update("preferences")}
//               className="
//                 w-full
//                 border border-slate-200
//                 rounded-xl
//                 px-4 py-3
//                 bg-slate-50
//                 text-sm
//                 outline-none
//                 focus:bg-white
//                 focus:border-teal-500
//                 focus:ring-4
//                 focus:ring-teal-500/10
//                 transition
//               "
//             />

//             <p className="text-[11px] text-slate-400 mt-1.5">
//               Separate multiple preferences with commas.
//             </p>
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="
//               w-full
//               py-3
//               bg-teal-600
//               text-white
//               rounded-2xl
//               hover:bg-teal-700
//               disabled:opacity-60
//               transition
//               font-semibold
//               shadow-lg
//               shadow-teal-600/20
//             "
//           >
//             {loading
//               ? "Creating your itinerary..."
//               : "✨ Generate itinerary"}
//           </button>
//         </form>
//       ) : (
//         <div>
//           {/* =================================================
//               PREVIEW SUMMARY
//           ================================================== */}
//           <div
//             className="
//               rounded-2xl
//               bg-gradient-to-br
//               from-teal-600
//               to-cyan-700
//               text-white
//               p-5
//               mb-5
//             "
//           >
//             <p className="text-xs uppercase tracking-widest opacity-70 font-semibold">
//               Estimated trip cost
//             </p>

//             <p className="text-3xl font-bold mt-1">
//               ${preview.estimated_total_cost}
//             </p>

//             <p className="text-xs opacity-80 mt-1">
//               {preview.budget_utilization_pct}% of your budget
//             </p>

//             {preview.hotel?.name && (
//               <div className="mt-4 pt-4 border-t border-white/20">
//                 <p className="text-[10px] uppercase tracking-wide opacity-60">
//                   Recommended hotel
//                 </p>

//                 <p className="font-semibold mt-1">
//                   {preview.hotel.name}
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* =================================================
//               DAYS
//           ================================================== */}
//           <div className="max-h-72 overflow-y-auto pr-1 space-y-3">
//             {preview.days.map((d) => (
//               <div
//                 key={d.day_number}
//                 className="
//                   rounded-2xl
//                   border border-slate-200
//                   bg-slate-50
//                   p-4
//                 "
//               >
//                 <div className="flex items-center justify-between mb-3">
//                   <span className="text-xs font-bold text-teal-700 tracking-wide">
//                     DAY {d.day_number}
//                   </span>

//                   <span className="text-xs font-semibold text-slate-500">
//                     ${d.day_activity_cost}
//                     <span className="font-normal text-slate-400">
//                       {" "}
//                       / ${d.day_budget_allocated}
//                     </span>
//                   </span>
//                 </div>

//                 <div className="space-y-2">
//                   {d.items.map((it) => (
//                     <div
//                       key={it.ref_id + it.type}
//                       className="
//                         flex items-center justify-between
//                         gap-3
//                         bg-white
//                         rounded-xl
//                         px-3 py-2.5
//                         border border-slate-100
//                       "
//                     >
//                       <span className="text-xs text-slate-700">
//                         {it.name}
//                       </span>

//                       <span className="text-xs font-semibold text-teal-600">
//                         ${it.estimated_cost}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* =================================================
//               ACTIONS
//           ================================================== */}
//           <div className="flex gap-3 mt-5">
//             <button
//               onClick={() => setPreview(null)}
//               className="
//                 flex-1
//                 py-3
//                 border border-slate-200
//                 bg-white
//                 text-slate-700
//                 rounded-2xl
//                 hover:bg-slate-50
//                 transition
//                 text-sm
//                 font-semibold
//               "
//             >
//               ← Adjust
//             </button>

//             <button
//               onClick={save}
//               className="
//                 flex-1
//                 py-3
//                 bg-teal-600
//                 text-white
//                 rounded-2xl
//                 hover:bg-teal-700
//                 transition
//                 text-sm
//                 font-semibold
//                 shadow-lg
//                 shadow-teal-600/20
//               "
//             >
//               Save trip
//             </button>
//           </div>
//         </div>
//       )}
//     </Modal>
//   );
// }

// /* =========================================================
//    FIELD
// ========================================================= */

// function Field({
//   label,
//   type = "text",
//   placeholder,
//   value,
//   onChange,
//   required,
//   min,
// }) {
//   return (
//     <div>
//       <label className="block text-xs font-semibold text-slate-600 mb-1.5">
//         {label}
//       </label>

//       <input
//         required={required}
//         type={type}
//         min={min}
//         placeholder={placeholder}
//         value={value}
//         onChange={onChange}
//         className="
//           w-full
//           border border-slate-200
//           rounded-xl
//           px-4 py-3
//           bg-slate-50
//           text-sm
//           text-slate-800
//           placeholder:text-slate-400
//           outline-none
//           focus:bg-white
//           focus:border-teal-500
//           focus:ring-4
//           focus:ring-teal-500/10
//           transition
//         "
//       />
//     </div>
//   );
// }

// /* =========================================================
//    MODAL
// ========================================================= */

// function Modal({ title, subtitle, children, onClose }) {
//   return (
//     <div
//       className="
//         fixed inset-0
//         bg-slate-950/50
//         backdrop-blur-md
//         flex items-center justify-center
//         z-[2000]
//         p-4
//       "
//       onMouseDown={(e) => {
//         if (e.target === e.currentTarget) {
//           onClose();
//         }
//       }}
//     >
//       <div
//         className="
//           bg-white
//           rounded-[2rem]
//           border border-white
//           shadow-2xl
//           w-full
//           max-w-lg
//           max-h-[90vh]
//           overflow-hidden
//         "
//       >
//         {/* Modal Header */}
//         <div className="px-6 pt-6 pb-4">
//           <div className="flex justify-between items-start">
//             <div>
//               <div className="flex items-center gap-2">
//                 <div
//                   className="
//                     w-9 h-9
//                     rounded-xl
//                     bg-teal-50
//                     text-teal-600
//                     flex items-center justify-center
//                   "
//                 >
//                   ✈
//                 </div>

//                 <h2 className="text-xl font-bold text-slate-900">
//                   {title}
//                 </h2>
//               </div>

//               {subtitle && (
//                 <p className="text-xs text-slate-500 mt-2 ml-11">
//                   {subtitle}
//                 </p>
//               )}
//             </div>

//             <button
//               onClick={onClose}
//               className="
//                 w-9 h-9
//                 rounded-xl
//                 bg-slate-50
//                 text-slate-400
//                 hover:bg-slate-100
//                 hover:text-slate-700
//                 transition
//                 text-lg
//               "
//               aria-label="Close"
//             >
//               ×
//             </button>
//           </div>
//         </div>

//         {/* Modal Body */}
//         <div className="px-6 pb-6 max-h-[75vh] overflow-y-auto">
//           {children}
//         </div>
//       </div>
//     </div>
//   );
// }


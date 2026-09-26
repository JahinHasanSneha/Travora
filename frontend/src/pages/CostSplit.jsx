import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import client from "../api/client";

/* =========================================================
   ICONS — small inline, TripAdvisor-style
========================================================= */
const Icon = {
  users: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c.8-3.5 2.8-5.5 6-5.5s5.2 2 6 5.5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M18 14.8c1.7.8 2.7 2.4 3 5.2" />
    </svg>
  ),
  wallet: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1" />
      <path d="M3 7.5V17a2.5 2.5 0 0 0 2.5 2.5H19a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2H5.5A2.5 2.5 0 0 1 3 7.5z" />
      <circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  split: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3v6" />
      <path d="M5 9h14" />
      <path d="M7 15h2v6H7zM15 15h2v6h-2z" />
      <path d="M12 9v3" />
      <circle cx="12" cy="14" r="1.5" />
    </svg>
  ),
  star: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
    </svg>
  ),
  back: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  ),
};

/* =========================================================
   PAGE
========================================================= */
export default function CostSplit() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    client
      .get(`/trips/${id}/cost-split`)
      .then(({ data }) => setData(data));
  }, [id]);

  /* ---------- loading ---------- */
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 flex items-center justify-center gap-3 text-[#545454] text-sm">
        <span className="w-4 h-4 border-2 border-[#00AA6C]/30 border-t-[#00AA6C] rounded-full animate-spin" />
        Loading cost split…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#000A12]">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* ---------- breadcrumb ---------- */}
        <nav className="flex items-center gap-1.5 text-[12px] text-[#767676] mb-5">
          <Link to="/trips" className="hover:text-[#00AA6C] hover:underline">
            Trips
          </Link>
          <span>›</span>
          <Link to={`/trips/${id}`} className="hover:text-[#00AA6C] hover:underline">
            Trip #{id}
          </Link>
          <span>›</span>
          <span className="text-[#000A12] font-medium">Cost split</span>
        </nav>

        {/* ---------- back link ---------- */}
        <Link
          to={`/trips/${id}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#00AA6C] hover:text-[#008F5A] mb-4"
        >
          <Icon.back className="w-3.5 h-3.5" />
          Back to trip
        </Link>

        {/* ---------- header ---------- */}
        <header className="mb-6">
          <h1 className="text-[28px] md:text-[32px] font-extrabold tracking-[-0.02em] text-[#000A12]">
            Cost split
          </h1>
          <p className="text-[14px] text-[#545454] mt-1">
            See how much each traveler owes for this trip.
          </p>
        </header>

        {/* ---------- summary card ---------- */}
        <section className="bg-white rounded-2xl border border-[#E0E0E0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center divide-x divide-[#E8E8E8]">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-[#E6F7F0] text-[#00AA6C] flex items-center justify-center mb-2">
                <Icon.users className="w-4 h-4" />
              </div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#767676]">
                Members
              </p>
              <p className="text-[24px] font-extrabold text-[#000A12] mt-0.5 tabular-nums">
                {data.confirmed_members}
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-[#E6F7F0] text-[#00AA6C] flex items-center justify-center mb-2">
                <Icon.wallet className="w-4 h-4" />
              </div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#767676]">
                Total cost
              </p>
              <p className="text-[24px] font-extrabold text-[#000A12] mt-0.5 tabular-nums">
                ${Number(data.total_group_cost).toLocaleString()}
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-[#FFF4D6] text-[#B47A00] flex items-center justify-center mb-2">
                <Icon.split className="w-4 h-4" />
              </div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#767676]">
                Per person
              </p>
              <p className="text-[24px] font-extrabold text-[#00AA6C] mt-0.5 tabular-nums">
                ${Number(data.per_person_cost).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* ---------- breakdown ---------- */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-extrabold text-[#000A12]">
              Breakdown by member
            </h2>
            <span className="text-[12px] text-[#767676]">
              {data.breakdown.length} traveler{data.breakdown.length !== 1 ? "s" : ""}
            </span>
          </div>

          <ul className="space-y-2.5">
            {data.breakdown.map((m) => (
              <li
                key={m.user_id}
                className="group flex items-center justify-between gap-3 bg-white border border-[#E0E0E0] rounded-2xl px-4 py-3.5 hover:border-[#00AA6C] hover:shadow-[0_2px_10px_rgba(0,170,108,0.08)] transition-all"
              >
                {/* left: avatar + name + role */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#E6F7F0] text-[#00AA6C] flex items-center justify-center font-bold text-[14px] shrink-0">
                    {(m.full_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#000A12] truncate">
                      {m.full_name}
                    </p>
                    <p className="text-[12px] text-[#767676] capitalize truncate">
                      {m.role}
                    </p>
                  </div>
                </div>

                {/* right: amount owed */}
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#767676]">
                    Owes
                  </p>
                  <p className="text-[16px] font-extrabold text-[#000A12] tabular-nums">
                    ${Number(m.owes).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {data.breakdown.length === 0 && (
            <div className="bg-white border border-[#E0E0E0] rounded-2xl py-12 text-center">
              <p className="text-[14px] font-bold text-[#000A12]">
                No members yet
              </p>
              <p className="text-[12px] text-[#767676] mt-1">
                Once travelers join this trip, their share will appear here.
              </p>
            </div>
          )}
        </section>

        {/* ---------- footnote ---------- */}
        <p className="text-[12px] text-[#767676] text-center mt-6 flex items-center justify-center gap-1.5">
          <Icon.star className="w-3.5 h-3.5 text-[#FFB800]" />
          {data.itinerary_saved
            ? "Cost is fixed from the saved itinerary; totals update as members join"
            : "Estimate from the current plans; it locks when the organizer saves the itinerary"}
        </p>
      </div>
    </div>
  );
}
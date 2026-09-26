
import { useEffect, useState } from "react";
import client from "../api/client";

/* =========================================================
   ICONS
========================================================= */

const Icon = {
  refresh: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M20 11a8 8 0 0 0-14.8-4L3 10M3 5v5h5M4 13a8 8 0 0 0 14.8 4L21 14M21 19v-5h-5" />
    </svg>
  ),

  check: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
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

  company: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16" />
      <path d="M17 9h2a1 1 0 0 1 1 1v11" />
      <path d="M8 7h5M8 11h5M8 15h5" />
      <path d="M2 21h20" />
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

  mail: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
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
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  ),

  external: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </svg>
  ),
};

/* =========================================================
   PAGE
========================================================= */

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [busyKey, setBusyKey] = useState(null);

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    }

    try {
      const { data } = await client.get("/admin/dashboard");
      setDashboard(data);
    } catch (error) {
      console.error("Dashboard load failed:", error);

      setToast({
        type: "error",
        text:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to load dashboard.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =======================================================
     APPROVE SUPPLIER
  ======================================================= */

  const approveSupplier = async (supplier) => {
    const key = `supplier-${supplier.supplier_id}`;
    setBusyKey(key);

    try {
      await client.put(
        `/admin/approve-supplier/${supplier.supplier_id}`
      );

      setToast({
        type: "success",
        text: `Approved supplier "${supplier.supplier_name}".`,
      });

      await loadDashboard();
    } catch (error) {
      console.error("Approve supplier failed:", error);

      const status = error?.response?.status;

      setToast({
        type: "error",
        text:
          status === 404
            ? "Supplier or approval route was not found."
            : status === 401 || status === 403
            ? "You are not authorized to approve suppliers."
            : error?.response?.data?.error ||
              error?.response?.data?.message ||
              "Failed to approve supplier.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  /* =======================================================
     APPROVE COMPANY
  ======================================================= */

  const approveCompany = async (company) => {
    const key = `company-${company.company_id}`;
    setBusyKey(key);

    try {
      await client.put(
        `/admin/approve-company/${company.company_id}`
      );

      setToast({
        type: "success",
        text: `Approved company "${company.company_name}".`,
      });

      await loadDashboard();
    } catch (error) {
      console.error("Approve company failed:", error);

      const status = error?.response?.status;

      setToast({
        type: "error",
        text:
          status === 404
            ? "Company or approval route was not found."
            : status === 401 || status === 403
            ? "You are not authorized to approve companies."
            : error?.response?.data?.error ||
              error?.response?.data?.message ||
              "Failed to approve company.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  /* =======================================================
     APPROVE LISTING
  ======================================================= */

  const approveListing = async (listing) => {
    const key = `listing-${listing.type}-${listing.id}`;
    setBusyKey(key);

    try {
      await client.put("/admin/approve-listing", {
        type: listing.type,
        id: listing.id,
      });

      setToast({
        type: "success",
        text: `Approved ${listing.type} "${listing.name}".`,
      });

      await loadDashboard();
    } catch (error) {
      const status = error?.response?.status;

      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Unknown error";

      console.error("Approve listing failed:", error);

      setToast({
        type: "error",
        text:
          status === 404
            ? "Listing or approval route was not found."
            : status === 401 || status === 403
            ? "You are not authorized to approve listings."
            : status === 405
            ? "Method not allowed. Check the backend route."
            : `Failed: ${msg}`,
      });
    } finally {
      setBusyKey(null);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9F9] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[#767676]">
          <span className="w-4 h-4 border-2 border-[#00AA6E]/30 border-t-[#00AA6E] rounded-full animate-spin" />
          Loading admin dashboard…
        </div>
      </div>
    );
  }

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const s = dashboard?.stats || {};
  const n = (value) => Number(value || 0);

  const totals = {
    users: n(s.users),
    suppliers: n(s.suppliers),
    companies: n(s.companies),
    bookings: n(s.bookings),
  };

  const supplierRequests = dashboard?.supplier_requests || [];
  const companyRequests = dashboard?.company_requests || [];

  const pending = dashboard?.pending_listings || {};

  const hotels = pending.hotels || [];
  const restaurants = pending.restaurants || [];
  const cruises = pending.cruises || [];

  const totalPendingAccounts =
    supplierRequests.length + companyRequests.length;

  const totalPendingListings =
    hotels.length + restaurants.length + cruises.length;

  const totalPending =
    totalPendingAccounts + totalPendingListings;

  return (
    <div className="min-h-screen bg-[#F7F9F9] text-[#1a1a1a]">
      {/* ===================================================
          TOAST
      =================================================== */}

      {toast && (
        <Toast
          type={toast.type}
          text={toast.text}
          onClose={() => setToast(null)}
        />
      )}

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="bg-white border-b border-[#E4E4E4] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#00AA6E]" />

            <h1 className="text-[15px] font-extrabold text-[#000A12] tracking-tight">
              Admin Center
            </h1>

            {totalPending > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFF4D6] text-[#8a6a00]">
                {totalPending} pending
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-bold border border-[#E4E4E4] text-[#545454] hover:border-[#00AA6E] hover:text-[#00AA6E] transition disabled:opacity-50"
          >
            <Icon.refresh
              className={`w-3.5 h-3.5 ${
                refreshing ? "animate-spin" : ""
              }`}
            />

            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="max-w-5xl mx-auto px-5 py-5 space-y-6">
        {/* =================================================
            MINI STATS
        ================================================= */}

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <MiniStat label="Users" value={totals.users} />

          <MiniStat
            label="Suppliers"
            value={totals.suppliers}
            sub={`${n(s.pending_suppliers)} pending`}
          />

          <MiniStat
            label="Companies"
            value={totals.companies}
            sub={`${n(s.pending_companies)} pending`}
          />

          <MiniStat label="Bookings" value={totals.bookings} />
        </section>

        {/* =================================================
            ACCOUNT APPROVALS
        ================================================= */}

        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-2.5 px-1">
            <div>
              <h2 className="text-[14px] font-extrabold text-[#000A12] tracking-tight">
                Account approvals
              </h2>

              <p className="text-[11px] text-[#767676] mt-0.5">
                Review supplier and travel company registrations.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <CountChip
                label="Suppliers"
                value={supplierRequests.length}
                tone="teal"
              />

              <CountChip
                label="Companies"
                value={companyRequests.length}
                tone="blue"
              />
            </div>
          </div>

          {totalPendingAccounts === 0 ? (
            <EmptyState
              title="All accounts reviewed"
              description="There are no supplier or company registrations waiting for approval."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {supplierRequests.map((supplier) => (
                <AccountApprovalCard
                  key={`supplier-${supplier.supplier_id}`}
                  item={supplier}
                  type="supplier"
                  busy={
                    busyKey ===
                    `supplier-${supplier.supplier_id}`
                  }
                  onApprove={approveSupplier}
                />
              ))}

              {companyRequests.map((company) => (
                <AccountApprovalCard
                  key={`company-${company.company_id}`}
                  item={company}
                  type="company"
                  busy={
                    busyKey ===
                    `company-${company.company_id}`
                  }
                  onApprove={approveCompany}
                />
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            PENDING LISTINGS
        ================================================= */}

        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-2.5 px-1">
            <div>
              <h2 className="text-[14px] font-extrabold text-[#000A12] tracking-tight">
                Pending listings
              </h2>

              <p className="text-[11px] text-[#767676] mt-0.5">
                Review hotels, restaurants and cruises before publication.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <CountChip
                label="Hotels"
                value={hotels.length}
                tone="teal"
              />

              <CountChip
                label="Restaurants"
                value={restaurants.length}
                tone="amber"
              />

              <CountChip
                label="Cruises"
                value={cruises.length}
                tone="blue"
              />
            </div>
          </div>

          {totalPendingListings === 0 ? (
            <EmptyState
              title="All caught up"
              description="No listings are waiting for approval."
            />
          ) : (
            <div className="space-y-3">
              {hotels.map((listing) => (
                <ListingCard
                  key={`hotel-${listing.id}`}
                  listing={{
                    ...listing,
                    type: "hotel",
                  }}
                  onApprove={approveListing}
                  busy={
                    busyKey ===
                    `listing-hotel-${listing.id}`
                  }
                />
              ))}

              {restaurants.map((listing) => (
                <ListingCard
                  key={`restaurant-${listing.id}`}
                  listing={{
                    ...listing,
                    type: "restaurant",
                  }}
                  onApprove={approveListing}
                  busy={
                    busyKey ===
                    `listing-restaurant-${listing.id}`
                  }
                />
              ))}

              {cruises.map((listing) => (
                <ListingCard
                  key={`cruise-${listing.id}`}
                  listing={{
                    ...listing,
                    type: "cruise",
                  }}
                  onApprove={approveListing}
                  busy={
                    busyKey ===
                    `listing-cruise-${listing.id}`
                  }
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({ label, value, sub }) {
  return (
    <div className="bg-white border border-[#E4E4E4] rounded-xl px-3.5 py-2.5">
      <p className="text-[10.5px] uppercase tracking-wider font-bold text-[#767676]">
        {label}
      </p>

      <div className="flex items-end justify-between gap-2">
        <p className="text-[18px] font-extrabold text-[#000A12] leading-tight tabular-nums mt-0.5">
          {Number(value).toLocaleString()}
        </p>

        {sub && (
          <p className="text-[9.5px] font-semibold text-[#9A9A9A] mb-0.5">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   COUNT CHIP
========================================================= */

function CountChip({ label, value, tone }) {
  const tones = {
    teal: "bg-[#E6F7F0] text-[#008a5b]",
    amber: "bg-[#FFF4D6] text-[#8a6a00]",
    blue: "bg-[#E6F0FF] text-[#1d4ed8]",
  };

  return (
    <span
      className={`px-1.5 py-0.5 rounded font-bold ${
        tones[tone] || tones.teal
      }`}
    >
      {value} {label}
    </span>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ title, description }) {
  return (
    <div className="bg-white border border-[#E4E4E4] rounded-2xl py-12 text-center">
      <div className="w-10 h-10 mx-auto rounded-full bg-[#E6F7F0] text-[#00AA6E] flex items-center justify-center">
        <Icon.check className="w-5 h-5" />
      </div>

      <p className="text-[13px] font-bold text-[#000A12] mt-3">
        {title}
      </p>

      <p className="text-[12px] text-[#767676] mt-1 px-5">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   ACCOUNT APPROVAL CARD
========================================================= */

function AccountApprovalCard({
  item,
  type,
  busy,
  onApprove,
}) {
  const isSupplier = type === "supplier";

  const name = isSupplier
    ? item.supplier_name
    : item.company_name;

  const id = isSupplier
    ? item.supplier_id
    : item.company_id;

  const secondary = isSupplier
    ? item.business_type || "Travel supplier"
    : item.company_address || "Travel company";

  const initials = (name || "T")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const createdDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const websiteUrl = item.website
    ? item.website.startsWith("http://") ||
      item.website.startsWith("https://")
      ? item.website
      : `https://${item.website}`
    : null;

  return (
    <article className="bg-white border border-[#E4E4E4] rounded-2xl overflow-hidden hover:shadow-[0_8px_24px_-14px_rgba(0,0,0,0.18)] transition-all">
      {/* Accent */}

      <div
        className={`h-1 ${
          isSupplier ? "bg-[#00AA6E]" : "bg-[#2563EB]"
        }`}
      />

      <div className="p-4">
        {/* Top */}

        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-extrabold ${
              isSupplier
                ? "bg-[#E6F7F0] text-[#008a5b]"
                : "bg-[#E6F0FF] text-[#1d4ed8]"
            }`}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-extrabold text-[#000A12] truncate">
                {name || "Unnamed account"}
              </h3>

              <span
                className={`shrink-0 px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider font-extrabold ${
                  isSupplier
                    ? "bg-[#E6F7F0] text-[#008a5b]"
                    : "bg-[#E6F0FF] text-[#1d4ed8]"
                }`}
              >
                {isSupplier ? "Supplier" : "Company"}
              </span>
            </div>

            <p className="text-[11.5px] text-[#767676] mt-0.5 truncate">
              {secondary}
            </p>

            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />

              <span className="text-[10.5px] font-bold text-[#8a6a00]">
                Pending approval
              </span>
            </div>
          </div>
        </div>

        {/* Applicant details */}

        <div className="mt-4 rounded-xl bg-[#F7F9F9] border border-[#EEEEEE] px-3 py-2.5">
          <div className="flex justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider font-bold text-[#9A9A9A]">
                Applicant
              </p>

              <p className="text-[11.5px] font-bold text-[#000A12] truncate mt-0.5">
                {item.full_name || "—"}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[9px] uppercase tracking-wider font-bold text-[#9A9A9A]">
                ID
              </p>

              <p className="text-[11.5px] font-bold text-[#000A12] mt-0.5">
                #{id}
              </p>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-[#E9E9E9] flex items-center gap-1.5 min-w-0">
            <Icon.mail className="w-3.5 h-3.5 text-[#9A9A9A] shrink-0" />

            <p className="text-[10.5px] text-[#767676] truncate">
              {item.email || "No email available"}
            </p>
          </div>
        </div>

        {/* Metadata */}

        <div className="grid grid-cols-2 gap-2 mt-3">
          <MetaChip
            icon={
              isSupplier ? (
                <Icon.users className="w-3.5 h-3.5" />
              ) : (
                <Icon.company className="w-3.5 h-3.5" />
              )
            }
            label="Account"
            value={
              isSupplier
                ? item.business_type || "Supplier"
                : "Travel company"
            }
          />

          <MetaChip
            icon={<Icon.calendar className="w-3.5 h-3.5" />}
            label="Requested"
            value={createdDate}
          />
        </div>

        {/* Company website */}

        {!isSupplier && websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 h-8 px-2.5 rounded-lg bg-[#F7F9F9] border border-[#EEEEEE] flex items-center justify-between gap-2 text-[10.5px] font-semibold text-[#545454] hover:border-[#00AA6E] hover:text-[#00AA6E] transition"
          >
            <span className="truncate">
              {item.website}
            </span>

            <Icon.external className="w-3 h-3 shrink-0" />
          </a>
        )}

        {/* Rating */}

        {!isSupplier && item.rating != null && (
          <div className="mt-2 text-[10.5px] text-[#767676]">
            Current rating:{" "}
            <span className="font-bold text-[#000A12]">
              {item.rating}
            </span>
          </div>
        )}

        {/* Actions */}

        <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-[#9A9A9A]">
              Review required
            </p>

            <p className="text-[11px] text-[#545454] truncate">
              Approve to activate this account
            </p>
          </div>

          <button
            type="button"
            onClick={() => onApprove(item)}
            disabled={busy}
            className="h-8 px-3.5 rounded-lg bg-[#00AA6E] text-white text-[12px] font-bold inline-flex items-center gap-1.5 hover:bg-[#008a5b] transition disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            {busy ? (
              <>
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Approving…
              </>
            ) : (
              <>
                <Icon.check className="w-3.5 h-3.5" />
                Approve
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   LISTING CARD
========================================================= */

function ListingCard({ listing, onApprove, busy }) {
  const [broken, setBroken] = useState(false);

  const typeStyles = {
    hotel: {
      badge: "bg-[#00AA6E] text-white",
      dot: "#00AA6E",
      label: "Hotel",
    },

    restaurant: {
      badge: "bg-[#F59E0B] text-white",
      dot: "#F59E0B",
      label: "Restaurant",
    },

    cruise: {
      badge: "bg-[#2563EB] text-white",
      dot: "#2563EB",
      label: "Cruise",
    },
  };

  const style =
    typeStyles[listing.type] || typeStyles.hotel;

  const cityLine = [listing.city, listing.country]
    .filter(Boolean)
    .join(", ");

  const priceText =
    listing.price != null
      ? `$${Number(listing.price).toLocaleString()}`
      : "—";

  const priceLabel =
    listing.type === "hotel"
      ? "per night"
      : listing.type === "restaurant"
      ? "avg meal"
      : "per person";

  return (
    <article className="bg-white border border-[#E4E4E4] rounded-2xl overflow-hidden hover:shadow-[0_6px_22px_-12px_rgba(0,0,0,0.15)] transition-all">
      <div className="flex flex-col md:flex-row">
        {/* IMAGE */}

        <div className="relative w-full md:w-[220px] lg:w-[240px] h-[160px] md:h-auto md:min-h-[170px] shrink-0 bg-[#F2F2F2] overflow-hidden">
          {!broken && listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setBroken(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[#767676] text-[12px] font-bold bg-gradient-to-br from-[#E6F7F0] to-[#F2F2F2]">
              No image
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/0" />

          <div
            className={`absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${style.badge}`}
          >
            {style.label}
          </div>

          <div className="absolute bottom-3 left-3 text-[11px] font-bold text-white drop-shadow">
            Listing #{listing.id}
          </div>
        </div>

        {/* CONTENT */}

        <div className="flex-1 p-4 md:p-5 flex flex-col">
          {/* TITLE */}

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: style.dot,
                  }}
                />

                <span className="text-[11px] font-bold text-[#545454]">
                  Pending approval
                </span>
              </div>

              <h3 className="text-[16px] font-extrabold text-[#000A12] leading-tight truncate">
                {listing.name}
              </h3>

              {cityLine && (
                <p className="text-[12px] text-[#767676] mt-1 truncate">
                  {cityLine}
                </p>
              )}

              {listing.supplier_id && (
                <p className="text-[11.5px] text-[#767676] mt-0.5">
                  Listed by supplier #{listing.supplier_id}
                </p>
              )}
            </div>

            {/* PRICE */}

            <div className="text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-[#767676]">
                Price
              </p>

              <p className="text-[19px] font-extrabold text-[#000A12] leading-tight">
                {priceText}
              </p>

              <p className="text-[10.5px] text-[#767676]">
                {priceLabel}
              </p>
            </div>
          </div>

          {/* META */}

          <div className="grid grid-cols-3 gap-2 mt-3.5">
            <MetaChip
              icon={<Icon.map className="w-3.5 h-3.5" />}
              label="Type"
              value={style.label}
            />

            <MetaChip
              icon={<Icon.users className="w-3.5 h-3.5" />}
              label="Supplier"
              value={`#${listing.supplier_id ?? "—"}`}
            />

            <MetaChip
              icon={<Icon.clock className="w-3.5 h-3.5" />}
              label="Status"
              value="Pending"
            />
          </div>

          {/* ACTION */}

          <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#767676]">
              Requires admin review before appearing publicly
            </span>

            <button
              type="button"
              onClick={() => onApprove(listing)}
              disabled={busy}
              className="h-8 px-3.5 rounded-lg bg-[#00AA6E] text-white text-[12px] font-bold inline-flex items-center gap-1.5 hover:bg-[#008a5b] transition disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              {busy ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Approving…
                </>
              ) : (
                <>
                  <Icon.check className="w-3.5 h-3.5" />
                  Approve
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   META CHIP
========================================================= */

function MetaChip({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-[#F7F9F9] px-2.5 py-1.5 min-w-0">
      <span className="w-6 h-6 rounded-md bg-white border border-[#E4E4E4] text-[#00AA6E] flex items-center justify-center shrink-0">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wider font-bold text-[#9A9A9A]">
          {label}
        </p>

        <p className="text-[11.5px] font-bold text-[#000A12] truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   TOAST
========================================================= */

function Toast({ type, text, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const styles =
    type === "success"
      ? "bg-[#E6F7F0] border-[#B7E4CE] text-[#008a5b]"
      : "bg-red-50 border-red-200 text-red-700";

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm">
      <div
        className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 shadow-lg ${styles}`}
      >
        <span className="text-[15px] leading-none font-bold mt-0.5">
          {type === "success" ? "✓" : "!"}
        </span>

        <p className="text-[12.5px] font-semibold flex-1 leading-snug">
          {text}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="text-[13px] opacity-60 hover:opacity-100 mt-0.5"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
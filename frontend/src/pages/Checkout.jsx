import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import client from "../api/client";

// Brand palette (Teal, harmonized across the app)
const TEAL = "#00AA88";
const TEAL_DARK = "#008F73";
const TEAL_LIGHT = "#E8F7F3";
const PASTEL_BG = "#FAFDFB";

/* =========================================================
   LINE ICONS
========================================================= */
const Icon = {
  lock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <rect x="5" y="11" width="14" height="10" rx="3" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  ),
  card: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  x: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ card_number: "", expiry: "", cvv: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await client.post("/bookings/checkout", {
        booking_id: Number(bookingId),
        ...form,
      });
      setResult(data);
    } catch (err) {
      if (err.response?.status === 402) {
        setResult(err.response.data);
      } else {
        setError(err.response?.data?.error || "Checkout failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen py-10 px-4 font-sans flex items-center justify-center"
      style={{ backgroundColor: PASTEL_BG }}
    >
      <main className="w-full max-w-lg mx-auto">
        
        {/* ================= BREADCRUMB ================= */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 font-medium">
          <Link to="/" className="hover:text-teal-600 transition">
            Home
          </Link>
          <span>&rsaquo;</span>
          <Link to="/bookings" className="hover:text-teal-600 transition">
            My Bookings
          </Link>
          <span>&rsaquo;</span>
          <span className="text-gray-800 font-bold">Checkout</span>
        </div>

        {/* ================= CARD CONTAINER ================= */}
        <div className="bg-white border border-teal-100 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
          
          {/* Subtle Background Glow */}
          <div
            className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl opacity-40 pointer-events-none"
            style={{ backgroundColor: TEAL_LIGHT }}
          />

          {/* ================= HEADER ================= */}
          <div className="mb-6 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: TEAL_LIGHT, color: TEAL_DARK }}
              >
                Secure Booking
              </span>
            </div>

            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Checkout
            </h1>

            <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
              Booking ID: <span className="font-bold text-gray-700">#{bookingId}</span> &middot; Simulated ledger checkout. No real card will be charged.
            </p>
          </div>

          {!result ? (
            /* ================= PAYMENT FORM ================= */
            <form onSubmit={pay} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-black uppercase text-gray-500 mb-1.5 tracking-wider">
                  Card number
                </label>
                <div className="relative">
                  <input
                    required
                    maxLength={19}
                    placeholder="4111 1111 1111 1111"
                    value={form.card_number}
                    onChange={update("card_number")}
                    className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-mono text-gray-800 outline-none focus:border-teal-400 focus:bg-white transition-all pl-10"
                  />
                  <Icon.card className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1.5 tracking-wider">
                    Expiry (MM/YY)
                  </label>
                  <input
                    required
                    placeholder="12/28"
                    value={form.expiry}
                    onChange={update("expiry")}
                    className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-mono text-gray-800 outline-none focus:border-teal-400 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1.5 tracking-wider">
                    CVV
                  </label>
                  <div className="relative">
                    <input
                      required
                      maxLength={4}
                      placeholder="123"
                      value={form.cvv}
                      onChange={update("cvv")}
                      className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-mono text-gray-800 outline-none focus:border-teal-400 focus:bg-white transition-all pr-10"
                    />
                    <Icon.lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-600 flex items-center gap-2">
                  <Icon.x className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-2xl text-white font-black text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: TEAL }}
                onMouseEnter={(e) =>
                  !loading && (e.currentTarget.style.backgroundColor = TEAL_DARK)
                }
                onMouseLeave={(e) =>
                  !loading && (e.currentTarget.style.backgroundColor = TEAL)
                }
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing payment…</span>
                  </>
                ) : (
                  <>
                    <Icon.lock className="w-4 h-4" />
                    <span>Pay now & confirm trip</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-semibold">
                <Icon.shield className="w-3.5 h-3.5 text-teal-600" />
                <span>Simulated sandbox &middot; Safe & Encrypted</span>
              </div>
            </form>
          ) : (
            /* ================= RESULT CARD ================= */
            <div
              className={`rounded-2xl p-6 border transition-all ${
                result.transaction?.status === "success"
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                  : "bg-rose-50/60 border-rose-200 text-rose-950"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                    result.transaction?.status === "success"
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                  }`}
                >
                  {result.transaction?.status === "success" ? (
                    <Icon.check className="w-5 h-5" />
                  ) : (
                    <Icon.x className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-black tracking-tight">
                    {result.transaction?.status === "success"
                      ? "Payment Confirmed"
                      : "Payment Declined"}
                  </h3>
                  <p className="text-xs font-semibold opacity-80">
                    {result.transaction?.status === "success"
                      ? "Your trip is ready to go!"
                      : "Please try another payment method."}
                  </p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm border border-black/5 rounded-xl p-3 my-4 space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Reference:</span>
                  <span className="font-mono font-bold text-gray-800">
                    {result.transaction?.transaction_reference || "N/A"}
                  </span>
                </div>

                {result.transaction?.error_message && (
                  <div className="flex justify-between items-center text-rose-600 pt-1 border-t border-gray-100">
                    <span className="font-bold">Reason:</span>
                    <span className="font-semibold">
                      {result.transaction.error_message}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-5">
                {result.transaction?.status !== "success" && (
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="flex-1 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl font-bold text-xs text-gray-700 transition"
                  >
                    Try again
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate("/bookings")}
                  className="flex-1 py-2.5 px-4 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition"
                  style={{ backgroundColor: TEAL }}
                >
                  View my bookings &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
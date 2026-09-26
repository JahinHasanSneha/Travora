import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

// Maps a display "type" to the trip_itinerary foreign key column it should populate.
const FIELD_BY_TYPE = {
  hotel: 'hotel_id',
  restaurant: 'restaurant_id',
  cruise: 'cruise_id',
  attraction: 'place_id',
};

/**
 * Drop-in "Add to trip" button. Manages its own modal state, so callers just do:
 *   <AddToTripButton item={{ id: hotel.hotel_id, name: hotel.name, type: 'hotel' }} />
 * `type` must be one of 'hotel' | 'restaurant' | 'cruise' | 'attraction'.
 */
export default function AddToTripButton({ item, className, label = 'Add to trip' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className={className || 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium'}
      >
        {label}
      </button>
      {open && <AddToTripModal item={item} onClose={() => setOpen(false)} />}
    </>
  );
}

export function AddToTripModal({ item, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [dayNumber, setDayNumber] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { success: bool, message: string }

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    client.get('/trips/mine')
      .then(({ data }) => {
        // Only the organizer can add plans, and only until the itinerary is saved
        const editable = data.filter(
          (t) => t.role === 'organizer' && !t.itinerary_saved_at && t.status !== 'completed'
        );
        setTrips(editable);
        if (editable[0]) setSelectedTripId(String(editable[0].trip_id));
      })
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [user]);

  const selectedTrip = trips.find((t) => String(t.trip_id) === String(selectedTripId));

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedTripId) return;
    setSubmitting(true);
    setResult(null);
    try {
      const field = FIELD_BY_TYPE[item.type] || 'place_id';
      await client.post(`/trips/${selectedTripId}/itinerary`, {
        day_number: Number(dayNumber),
        [field]: item.id,
      });
      setResult({ success: true, message: `Added to "${selectedTrip?.title || 'your trip'}" (Day ${dayNumber}).` });
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.error || 'Could not add this item to the trip.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Add to trip</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl leading-none">✕</button>
        </div>

        <p className="text-sm text-gray-600 mb-4 truncate">{item.name}</p>

        {!user ? (
          <div className="text-sm text-gray-600">
            <p className="mb-3">Log in to add places to a trip.</p>
            <Link
              to="/login"
              className="block text-center w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              onClick={onClose}
            >
              Log in
            </Link>
          </div>
        ) : loading ? (
          <p className="text-sm text-gray-500 py-4 text-center">Loading your trips…</p>
        ) : result ? (
          <div>
            <p className={`text-sm mb-4 ${result.success ? 'text-green-700' : 'text-red-600'}`}>{result.message}</p>
            <div className="flex gap-2">
              {result.success ? (
                <button
                  onClick={() => navigate(`/trips/${selectedTripId}`)}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  View trip
                </button>
              ) : (
                <button onClick={() => setResult(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  Try again
                </button>
              )}
              <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-sm text-gray-600">
            <p className="mb-3">You don&apos;t have any trips with an unsaved itinerary. Create a new trip to add places.</p>
            <Link
              to="/trips"
              className="block text-center w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              onClick={onClose}
            >
              Create a trip
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trip</label>
              <select
                value={selectedTripId}
                onChange={(e) => { setSelectedTripId(e.target.value); setDayNumber(1); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {trips.map((t) => (
                  <option key={t.trip_id} value={t.trip_id}>
                    {t.title} — {t.destination_city}
                  </option>
                ))}
              </select>
            </div>
            {selectedTrip && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Day</label>
                <select
                  value={dayNumber}
                  onChange={(e) => setDayNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {Array.from({ length: selectedTrip.duration_days || 1 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>Day {d}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add to trip'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import ReviewsSection from '../components/ReviewsSection';
import RatingBubbles from '../components/RatingBubbles';

export default function PublicTrips() {
  const [trips, setTrips] = useState([]);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [error, setError] = useState(null);
  const [appliedCity, setAppliedCity] = useState('');
  const [reviewsOpenId, setReviewsOpenId] = useState(null);
  const navigate = useNavigate();

  const load = async (cityFilter = '') => {
    setLoading(true);
    setAppliedCity(cityFilter);
    try {
      const { data } = await client.get('/trips/public', { params: cityFilter ? { city: cityFilter } : {} });
      setTrips(data);
    } catch (err) {
      console.error('Failed to load public trips:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch without the loading spinner so an open reviews panel isn't unmounted
  const refreshRatings = async () => {
    try {
      const { data } = await client.get('/trips/public', { params: appliedCity ? { city: appliedCity } : {} });
      setTrips(data);
    } catch (err) {
      console.error('Failed to refresh public trips:', err);
    }
  };

  useEffect(() => { load(); }, []);

  const search = (e) => {
    e.preventDefault();
    load(city);
  };

  const join = async (trip) => {
    setError(null);
    setJoiningId(trip.trip_id);
    try {
      await client.post(`/trips/${trip.trip_id}/join`);
      navigate(`/trips/${trip.trip_id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not join this trip.');
      setJoiningId(null);
    }
  };

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{
        backgroundImage: 'url(/images/backgrounds/land3.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div className="w-full max-w-5xl mx-auto bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl p-5 md:p-6 transition-all">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Discover public trips</h1>
            <p className="text-sm text-gray-600 mt-0.5">Join trips other travelers have opened up to new members.</p>
          </div>
          <form onSubmit={search} className="flex gap-2">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Filter by city…"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white/90 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
            <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">
              Search
            </button>
          </form>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse flex space-x-2">
              <div className="h-3 w-3 bg-teal-400 rounded-full"></div>
              <div className="h-3 w-3 bg-teal-400 rounded-full"></div>
              <div className="h-3 w-3 bg-teal-400 rounded-full"></div>
            </div>
          </div>
        ) : trips.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-12">
            No public trips found{city ? ` for "${city}"` : ''}. Make one of your own trips public from its trip page so others can discover it here.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {trips.map((t) => {
              const full = t.max_travelers && t.confirmed_members >= t.max_travelers;
              return (
                <div key={t.trip_id} className={`bg-white/90 backdrop-blur-sm border border-gray-200/70 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow duration-200 ${reviewsOpenId === t.trip_id ? 'md:col-span-2' : ''}`}>
                  <div>
                    <p className="text-xs text-teal-600 font-medium mb-0.5">{t.destination_city}, {t.destination_country}</p>
                    <h3 className="text-lg font-bold text-gray-800 mb-0.5">{t.title}</h3>
                    <p className="text-sm text-gray-600">
                      {t.duration_days} days · Organized by {t.organizer_name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t.confirmed_members}/{t.max_travelers} slots taken
                      {` · $${Number(t.total_cost_per_person || 0).toLocaleString()} / person`}
                    </p>
                    {t.pending_members > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t.pending_members} joined, awaiting booking confirmation (not holding a slot)
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <RatingBubbles rating={t.rating} reviewCount={t.review_count} size={14} />
                      <button
                        type="button"
                        onClick={() => setReviewsOpenId(reviewsOpenId === t.trip_id ? null : t.trip_id)}
                        className="text-xs font-semibold text-[#008F73] hover:underline shrink-0"
                      >
                        {reviewsOpenId === t.trip_id ? 'Hide reviews' : 'Reviews'}
                      </button>
                    </div>
                  </div>

                  {reviewsOpenId === t.trip_id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <ReviewsSection
                        entityKey="trip_id"
                        entityId={t.trip_id}
                        hint="Only travelers who joined this trip (not the organizer) can review it, once each."
                        onReviewAdded={refreshRatings}
                      />
                    </div>
                  )}

                  <div className="mt-3">
                    {t.is_member ? (
                      <button
                        onClick={() => navigate(`/trips/${t.trip_id}`)}
                        className="w-full py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 text-sm font-medium"
                      >
                        View trip
                      </button>
                    ) : full ? (
                      <button disabled className="w-full py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
                        Trip full
                      </button>
                    ) : (
                      <button
                        onClick={() => join(t)}
                        disabled={joiningId === t.trip_id}
                        className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50"
                      >
                        {joiningId === t.trip_id ? 'Joining…' : 'Join trip'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

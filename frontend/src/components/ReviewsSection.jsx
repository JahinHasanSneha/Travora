import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Bubbles } from './RatingBubbles';

// Clickable circle rating input for the "write a review" form.
function BubbleRatingInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} out of 5`}
          className={`w-8 h-8 rounded-full border-2 transition-colors ${
            n <= value ? 'bg-[#00AA88] border-[#00AA88]' : 'border-gray-300 hover:border-[#00AA88]'
          }`}
        />
      ))}
    </div>
  );
}

function overallLabel(avg) {
  if (avg >= 4.5) return 'Excellent';
  if (avg >= 4.0) return 'Very Good';
  if (avg >= 3.0) return 'Good';
  if (avg >= 2.0) return 'Average';
  return 'Poor';
}

const BUCKETS = [
  { star: 5, label: 'Excellent' },
  { star: 4, label: 'Good' },
  { star: 3, label: 'Average' },
  { star: 2, label: 'Poor' },
  { star: 1, label: 'Terrible' },
];

const ENTITY_LABELS = {
  hotel_id: 'hotel',
  restaurant_id: 'restaurant',
  cruise_id: 'cruise',
  package_id: 'package',
  trip_id: 'trip',
};

// Shared reviews block (summary + distribution + write-a-review form + list) used by
// packages, hotels, restaurants, cruises and trips.
//   entityKey  one of 'hotel_id' | 'restaurant_id' | 'cruise_id' | 'package_id' | 'trip_id'
//   entityId   id of the listing / trip being reviewed
//   hint       optional line shown under the form (e.g. who is allowed to review)
//   onReviewAdded  optional callback so the page can refresh its own rating header
export default function ReviewsSection({ entityKey, entityId, hint, onReviewAdded }) {
  const { user } = useAuth();
  const label = ENTITY_LABELS[entityKey] || 'listing';
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    client.get('/reviews', { params: { [entityKey]: entityId } })
      .then(({ data }) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [entityKey, entityId]); // eslint-disable-line

  const { avg, counts } = useMemo(() => {
    const c = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (!reviews.length) return { avg: 0, counts: c };
    let sum = 0;
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      c[star] += 1;
      sum += r.rating;
    });
    return { avg: Math.round((sum / reviews.length) * 10) / 10, counts: c };
  }, [reviews]);

  const maxCount = Math.max(1, ...Object.values(counts));
  const isTraveler = user?.user_type === 'traveler';

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setFormMessage({ success: false, text: 'Please choose a rating.' });
      return;
    }
    setSubmitting(true);
    setFormMessage(null);
    try {
      await client.post('/reviews', { [entityKey]: entityId, rating, comment });
      setComment('');
      setRating(0);
      setShowForm(false);
      setFormMessage({ success: true, text: 'Thanks for your review!' });
      load();
      if (onReviewAdded) onReviewAdded();
    } catch (err) {
      setFormMessage({ success: false, text: err.response?.data?.error || 'Could not submit review.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
        {isTraveler && !showForm && (
          <button
            onClick={() => { setShowForm(true); setFormMessage(null); }}
            className="text-xs px-3.5 py-2 border border-[#00AA88] text-[#008F73] rounded-lg hover:bg-[#E8F7F3] font-semibold"
          >
            Write a review
          </button>
        )}
        {!user && (
          <Link to="/login" className="text-xs text-[#008F73] font-semibold hover:underline">
            Sign in to write a review
          </Link>
        )}
      </div>

      {formMessage && (
        <p className={`text-sm mb-4 ${formMessage.success ? 'text-green-700' : 'text-red-600'}`}>{formMessage.text}</p>
      )}

      {/* SUMMARY: overall score + rating distribution */}
      {!loading && reviews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-8 bg-gray-50 border border-gray-100 rounded-xl p-5 mb-6">
          <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 sm:w-40">
            <p className="text-4xl font-bold text-gray-900">{avg.toFixed(1)}</p>
            <div>
              <p className="text-sm font-semibold text-gray-800">{overallLabel(avg)}</p>
              <div className="flex items-center gap-2 mt-1">
                <Bubbles value={avg} />
                <span className="text-xs text-gray-500">({reviews.length.toLocaleString()})</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {BUCKETS.map(({ star, label: bucketLabel }) => {
              const count = counts[star];
              const pct = (count / maxCount) * 100;
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-gray-600">{bucketLabel}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-[#00AA88]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-gray-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">How would you rate this {label}?</label>
            <BubbleRatingInput value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Share your experience</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience…"
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#00AA88] focus:ring-1 focus:ring-[#00AA88] outline-none"
            />
          </div>
          <p className="text-[11px] text-gray-400">
            {hint || `Anyone signed in as a traveler can leave a review for this ${label}.`}
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#00AA88] text-white rounded-lg hover:bg-[#008F73] text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">No reviews yet. Be the first to share your experience.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.review_id} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-gray-800">{r.reviewer_name}</span>
                <Bubbles value={r.rating} size={14} />
              </div>
              {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              <p className="text-[11px] text-gray-400 mt-1.5">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import client from '../api/client';
import AddToTripButton from '../components/AddToTripModal';
import ReviewsSection from '../components/ReviewsSection';
import RatingBubbles from '../components/RatingBubbles';

export default function CruiseDetail() {
  const { id } = useParams();
  const { hash } = useLocation();
  const [cruise, setCruise] = useState(null);
  const [error, setError] = useState(null);

  const loadCruise = () =>
    client.get(`/cruises/${id}`)
      .then(({ data }) => setCruise(data))
      .catch(() => setError('Cruise not found.'));

  useEffect(() => { loadCruise(); }, [id]); // eslint-disable-line

  // Deep link from the cruise list (/cruises/:id#reviews) scrolls to the reviews block once loaded.
  useEffect(() => {
    if (cruise && hash === '#reviews') {
      document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [cruise, hash]);

  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!cruise) return <div className="p-8 text-center text-gray-600">Loading cruise…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/cruises" className="text-sm text-indigo-600 hover:underline">&larr; Back to cruises</Link>

      <div className="grid md:grid-cols-2 gap-8 mt-4">
        <div>
          {cruise.image_url ? (
            <img src={cruise.image_url} alt={cruise.ship_name} className="w-full h-80 object-cover rounded-xl shadow-md" />
          ) : (
            <div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">No image</div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">{cruise.ship_name}</h1>
          <p className="text-sm text-indigo-600 font-medium mt-1">
            {cruise.company_name} · {cruise.duration_days ? `${cruise.duration_days} day voyage` : 'Multi-day voyage'}
          </p>
          <p className="text-gray-600 text-sm mt-1">{cruise.departure_port} → {cruise.arrival_port}</p>
          <div className="mt-3">
            <a href="#reviews" className="inline-block hover:opacity-80">
              <RatingBubbles rating={cruise.rating} reviewCount={cruise.review_count} />
            </a>
          </div>

          <p className="text-gray-700 mt-4 leading-relaxed">{cruise.route_description}</p>

          {cruise.cabin_types?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {cruise.cabin_types.map((c) => (
                <span key={c} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">{c}</span>
              ))}
            </div>
          )}
          {cruise.amenities?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {cruise.amenities.map((a) => (
                <span key={a} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{a}</span>
              ))}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">Price</p><p className="font-semibold text-gray-900">${Number(cruise.price_per_person).toLocaleString()} / person</p></div>
            <div><p className="text-gray-500">Tickets available</p><p className="font-semibold text-gray-900">{cruise.available_tickets} / {cruise.max_passengers}</p></div>
            {cruise.departure_date && <div><p className="text-gray-500">Departure</p><p className="font-semibold text-gray-900">{new Date(cruise.departure_date).toLocaleDateString()}</p></div>}
            {cruise.arrival_date && <div><p className="text-gray-500">Arrival</p><p className="font-semibold text-gray-900">{new Date(cruise.arrival_date).toLocaleDateString()}</p></div>}
          </div>

          <div className="mt-6">
            <AddToTripButton
              item={{ id: cruise.cruise_id, name: cruise.ship_name, type: 'cruise' }}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              label="Add to trip"
            />
          </div>
        </div>
      </div>

      <div id="reviews" className="mt-10 bg-white border border-gray-200 rounded-xl p-6 scroll-mt-20">
        <ReviewsSection entityKey="cruise_id" entityId={cruise.cruise_id} onReviewAdded={loadCruise} />
      </div>
    </div>
  );
}

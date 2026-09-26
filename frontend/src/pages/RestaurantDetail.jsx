import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import AddToTripButton from '../components/AddToTripModal';
import ReviewsSection from '../components/ReviewsSection';
import RatingBubbles from '../components/RatingBubbles';

export default function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState(null);

  const loadRestaurant = () =>
    client.get(`/restaurants/${id}`)
      .then(({ data }) => setRestaurant(data))
      .catch(() => setError('Restaurant not found.'));

  useEffect(() => { loadRestaurant(); }, [id]); // eslint-disable-line

  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!restaurant) return <div className="p-8 text-center text-gray-600">Loading restaurant…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/restaurants" className="text-sm text-green-600 hover:underline">&larr; Back to restaurants</Link>

      <div className="grid md:grid-cols-2 gap-8 mt-4">
        <div>
          {restaurant.image_url ? (
            <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-80 object-cover rounded-xl shadow-md" />
          ) : (
            <div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">No image</div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{restaurant.address || `${restaurant.city}, ${restaurant.country}`}</p>
            </div>
            {restaurant.cuisine_type && (
              <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded font-medium shrink-0">{restaurant.cuisine_type}</span>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            {restaurant.has_vegetarian && <span className="text-xs bg-lime-100 text-lime-800 px-2 py-0.5 rounded">Vegetarian</span>}
            {restaurant.has_halal && <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded">Halal</span>}
          </div>

          <div className="mt-3">
            <RatingBubbles rating={restaurant.rating} reviewCount={restaurant.review_count} />
          </div>

          {restaurant.opening_time && restaurant.closing_time && (
            <p className="text-gray-700 mt-3 leading-relaxed">
              Open {restaurant.opening_time.slice(0, 5)} – {restaurant.closing_time.slice(0, 5)}.
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">Average meal cost</p><p className="font-semibold text-gray-900">${Number(restaurant.avg_meal_cost).toFixed(0)}</p></div>
            <div><p className="text-gray-500">Tables available</p><p className="font-semibold text-gray-900">{restaurant.available_tables} / {restaurant.total_tables}</p></div>
            {restaurant.contact_phone && <div><p className="text-gray-500">Contact</p><p className="font-semibold text-gray-900">{restaurant.contact_phone}</p></div>}
          </div>

          <div className="mt-6">
            <AddToTripButton
              item={{ id: restaurant.restaurant_id, name: restaurant.name, type: 'restaurant' }}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              label="Add to trip"
            />
          </div>
        </div>
      </div>

      <div className="mt-10 bg-white border border-gray-200 rounded-xl p-6">
        <ReviewsSection entityKey="restaurant_id" entityId={restaurant.restaurant_id} onReviewAdded={loadRestaurant} />
      </div>
    </div>
  );
}

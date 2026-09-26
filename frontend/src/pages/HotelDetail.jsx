import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import AddToTripButton from '../components/AddToTripModal';
import ReviewsSection from '../components/ReviewsSection';

// TripAdvisor-style Bubble Rating Component matching reference image
function BubbleRating({ rating, reviewCount }) {
  const score = Number(rating) || 0;

  return (
    <div className="flex items-center gap-2">
      {/* Exact Numerical Score */}
      <span className="text-2xl font-bold text-gray-900 leading-none">
        {score.toFixed(1)}
      </span>

      {/* 5 Rating Bubbles */}
      <div className="flex items-center space-x-1.5">
        {[1, 2, 3, 4, 5].map((index) => {
          const fill = Math.max(0, Math.min(1, score - (index - 1)));
          const fillPercent = fill * 100;

          return (
            <div
              key={index}
              className="w-4 h-4 rounded-full bg-[#cbd5e1] overflow-hidden relative"
            >
              {/* Teal Fill */}
              <div
                className="h-full bg-[#00aa6c] absolute top-0 left-0"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Total Review Count */}
      {reviewCount !== undefined && (
        <span className="text-gray-500 text-lg font-normal ml-0.5">
          ({Number(reviewCount).toLocaleString()})
        </span>
      )}
    </div>
  );
}

export default function HotelDetail() {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [error, setError] = useState(null);

  const loadHotel = () =>
    client.get(`/hotels/${id}`)
      .then(({ data }) => setHotel(data))
      .catch(() => setError('Hotel not found.'));

  useEffect(() => { loadHotel(); }, [id]); // eslint-disable-line

  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!hotel) return <div className="p-8 text-center text-gray-600">Loading hotel…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/hotels" className="text-sm text-blue-600 hover:underline">&larr; Back to hotels</Link>

      <div className="grid md:grid-cols-2 gap-8 mt-4">
        <div>
          {hotel.image_url ? (
            <img src={hotel.image_url} alt={hotel.name} className="w-full h-80 object-cover rounded-xl shadow-md" />
          ) : (
            <div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">No image</div>
          )}
        </div>

        <div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
            <p className="text-sm text-gray-500">
              {hotel.address ? `${hotel.address}, ` : ''}{hotel.city}, {hotel.country}
            </p>

            {/* Bubble Rating System replacing star ratings */}
            {hotel.rating && (
              <div className="pt-2">
                <BubbleRating 
                  rating={hotel.rating} 
                  reviewCount={hotel.review_count || hotel.total_reviews} 
                />
              </div>
            )}
          </div>

          <p className="text-gray-700 mt-4 leading-relaxed">{hotel.description}</p>

          {hotel.amenities?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {hotel.amenities.map((a) => (
                <span key={a} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{a}</span>
              ))}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Price</p>
              <p className="font-semibold text-gray-900">${Number(hotel.price_per_night).toLocaleString()} / night</p>
            </div>
            <div>
              <p className="text-gray-500">Rooms available</p>
              <p className="font-semibold text-gray-900">{hotel.available_rooms} / {hotel.total_rooms}</p>
            </div>
            {hotel.contact_phone && (
              <div>
                <p className="text-gray-500">Contact</p>
                <p className="font-semibold text-gray-900">{hotel.contact_phone}</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <AddToTripButton
              item={{ id: hotel.hotel_id, name: hotel.name, type: 'hotel' }}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              label="Add to trip"
            />
          </div>
        </div>
      </div>

      <div className="mt-10 bg-white border border-gray-200 rounded-xl p-6">
        <ReviewsSection entityKey="hotel_id" entityId={hotel.hotel_id} onReviewAdded={loadHotel} />
      </div>
    </div>
  );
}